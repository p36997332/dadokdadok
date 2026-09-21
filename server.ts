import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Persistent student roster file on disk
const ROSTER_FILE = path.join(process.cwd(), "src", "data", "student_roster.json");

const BANNED_NAMES = new Set([
  "강민준", "김도현", "김동우", "김민서", "김서진", "박서준", "박시우", "박유찬",
  "배주원", "백도윤", "서준우", "이도윤", "신우진", "양승우", "오태윤",
  "유도현", "윤서준", "이서진", "이준호", "장하준", "정예준", "조은우",
  "최지훈"
]);

let memoryRoster: any[] = [];
try {
  if (fs.existsSync(ROSTER_FILE)) {
    const data = fs.readFileSync(ROSTER_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      memoryRoster = parsed.filter(
        (s) => s && s.studentName && !BANNED_NAMES.has(s.studentName.trim()) && !/^학생\d+$/.test(s.studentName.trim())
      );
    }
  }
} catch (e) {
  console.warn("Could not load initial roster from file:", e);
}

// Lazy initialization of Gemini Client
let geminiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    rosterCount: memoryRoster.length,
    timestamp: new Date().toISOString(),
  });
});

// Shared student roster endpoints for multi-device & republication persistence
app.get("/api/roster", (_req, res) => {
  if (fs.existsSync(ROSTER_FILE)) {
    try {
      const data = fs.readFileSync(ROSTER_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) memoryRoster = parsed;
    } catch (e) {
      console.warn("Failed to reload roster from disk:", e);
    }
  }
  res.json({
    status: "success",
    count: memoryRoster.length,
    students: memoryRoster,
  });
});

app.post("/api/roster", (req, res) => {
  try {
    const { students } = req.body;
    if (Array.isArray(students)) {
      const filtered = students.filter(
        (s) => s && s.studentName && !BANNED_NAMES.has(s.studentName.trim()) && !/^학생\d+$/.test(s.studentName.trim())
      );
      memoryRoster = filtered;
      try {
        fs.writeFileSync(ROSTER_FILE, JSON.stringify(filtered, null, 2), "utf-8");
      } catch (err) {
        console.error("Failed to write roster file:", err);
      }
      res.json({
        status: "success",
        count: memoryRoster.length,
        students: memoryRoster,
      });
      return;
    }
    res.status(400).json({ error: "유효한 학생 목록 배열이 필요합니다." });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "학생 명단 저장 실패" });
  }
});

// Gemini AI summary endpoint for high school book review portfolio
app.post("/api/gemini/summarize", async (req, res) => {
  try {
    const { bookTitle, content } = req.body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      res.status(400).json({ error: "독후감 내용을 입력해주세요." });
      return;
    }

    const ai = getGemini();

    if (!ai) {
      // Fallback local response if API key is not yet configured
      const trimmed = content.trim();
      const firstLines = trimmed.split("\n").filter(Boolean).slice(0, 2).join(" ");
      const fallbackSummary = firstLines.length > 120 ? firstLines.substring(0, 120) + "..." : firstLines;

      res.json({
        summary: fallbackSummary,
        keywords: ["독서활동", "핵심성찰", "독서동아리"],
        thoughtQuestion: "이 책이 던지는 질문을 바탕으로 우리 사회의 현재 모습에 어떻게 적용해볼 수 있을까요?",
        subjectLink: "국어 / 통합사회 / 윤리와 사상",
        isSimulated: true,
      });
      return;
    }

    const prompt = `당신은 고등학교 독서동아리 지도교사이자 독서지도 전문가입니다.
학생이 작성한 도서(${bookTitle || "도서"})에 대한 독후감을 분석하여 다음 요소를 JSON 형식으로 생성해주세요.

1. summary: 학생이 느낀 점과 책의 핵심을 명확하게 담은 2~3문장의 요약 (친절하고 격려하는 문체)
2. keywords: 3~4개의 핵심 키워드 배열 (예: ["도덕적딜레마", "공동체윤리", "비판적사고"])
3. thoughtQuestion: 동아리 토론 시간에 친구들과 함께 깊이 나눠볼 만한 1개의 심화 발제 질문
4. subjectLink: 고등학교 2학년 학생생활기록부(생기부) 및 교과 연계 추천 (예: "윤리와 사상, 사회문화, 국어")

독후감 내용:
${content}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "2~3문장의 핵심 독후감 요약",
            },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3~4개의 핵심 키워드",
            },
            thoughtQuestion: {
              type: Type.STRING,
              description: "동아리 친구들과 나눌 토론 질문",
            },
            subjectLink: {
              type: Type.STRING,
              description: "교과 및 진로 연계 추천 분야",
            },
          },
          required: ["summary", "keywords", "thoughtQuestion", "subjectLink"],
        },
      },
    });

    const responseText = response.text?.trim() || "{}";
    const parsed = JSON.parse(responseText);

    res.json({
      summary: parsed.summary || content.substring(0, 100),
      keywords: parsed.keywords || ["독서동아리", "성찰"],
      thoughtQuestion: parsed.thoughtQuestion || "책 속의 핵심 주제에 대해 함께 토론해봅시다.",
      subjectLink: parsed.subjectLink || "교과 연계 활동",
      isSimulated: false,
    });
  } catch (error: any) {
    console.error("Gemini summarization error:", error);
    // Graceful fallback response
    const fallbackText = req.body?.content ? req.body.content.slice(0, 100) + "..." : "요약 생성 완료";
    res.json({
      summary: fallbackText,
      keywords: ["독서활동", "자기주도학습"],
      thoughtQuestion: "책의 내용을 바탕으로 나의 삶과 연결지어 볼 수 있는 점은 무엇일까요?",
      subjectLink: "독서 및 교과 연계",
      isSimulated: true,
      errorNotice: "AI 실시간 응답 지연으로 로컬 분석 요약이 적용되었습니다.",
    });
  }
});

// Gemini AI summary endpoint for high school club activity records
app.post("/api/gemini/summarize-activity", async (req, res) => {
  try {
    const { activityTitle, activityType, learnedLessons, reflections } = req.body;

    const fullContent = `${learnedLessons || ""} \n ${reflections || ""}`.trim();
    if (!fullContent) {
      res.status(400).json({ error: "배운 점이나 활동 느낀 점을 입력해주세요." });
      return;
    }

    const ai = getGemini();

    if (!ai) {
      const fallbackSummary = `${activityTitle || "활동"}에 주도적으로 참여하여 새로운 지식과 시야를 확장하고, 깊이 있는 성찰과 실천 의지를 보여줌.`;
      res.json({
        summary: fallbackSummary,
        keywords: [activityType || "동아리활동", "자기주도성", "성찰"],
        isSimulated: true,
      });
      return;
    }

    const prompt = `당신은 고등학교 동아리 지도교사이자 학생부종합전형(생기부) 전문가입니다.
학생이 작성한 동아리 활동기록(활동명: ${activityTitle || "동아리 행사"}, 구분: ${activityType || "활동"})을 분석하여
고등학교 생활기록부(생기부) 동아리활동 특기사항에 기재하기에 적합한 2~3문장의 요약과 핵심 키워드 3~4개를 JSON으로 생성해주세요.

배운 점:
${learnedLessons}

활동 느낀 점:
${reflections}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "생활기록부 특기사항 스타일의 2~3문장 활동 요약",
            },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3~4개의 핵심 키워드",
            },
          },
          required: ["summary", "keywords"],
        },
      },
    });

    const responseText = response.text?.trim() || "{}";
    const parsed = JSON.parse(responseText);

    res.json({
      summary: parsed.summary || `${activityTitle}에 참여하여 성실한 학습과 성찰 태도를 보임.`,
      keywords: parsed.keywords || ["동아리활동", "자기성장"],
      isSimulated: false,
    });
  } catch (error: any) {
    console.error("Gemini activity summarization error:", error);
    res.json({
      summary: `${req.body?.activityTitle || "동아리 활동"}에 참여하여 배운 점을 내면화하고 성찰과 발전 의지를 드러냄.`,
      keywords: ["동아리활동", "성찰"],
      isSimulated: true,
      errorNotice: "AI 실시간 응답 지연으로 로컬 분석 요약이 적용되었습니다.",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
