import React, { useState } from "react";
import * as XLSX from "xlsx";
import { BookReport, DiscussionPost, ActivityRecord, ClubInfo } from "../types";
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Trash2,
  Sparkles,
  Pencil,
  Check,
  Copy,
  Calendar,
  User,
  Clock,
  Loader2,
  Save,
  X,
  Eye,
  BookOpen,
  Compass,
  MessageSquare,
  AlertCircle,
  FileText,
  Settings,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Send,
} from "lucide-react";
import {
  getGoogleSheetsUrl,
  setGoogleSheetsUrl,
  syncAllToGoogleSheets,
  sendReportToGoogleSheets,
  DEFAULT_SHEETS_SCRIPT_URL,
} from "../services/googleSheetsService";

interface AdminNaverFormViewProps {
  reports: BookReport[];
  activities: ActivityRecord[];
  discussions: DiscussionPost[];
  clubInfo: ClubInfo;
  onDeleteReport?: (id: string | number) => void;
  onDeleteActivity?: (id: string | number) => void;
  onDeleteDiscussion?: (id: string | number) => void;
  onUpdateReport?: (report: BookReport) => void;
  onUpdateActivity?: (activity: ActivityRecord) => void;
  onOpenAnthology?: () => void;
}

type FormSheetTab = "all" | "activities" | "reports" | "discussions";

interface UnifiedRow {
  uniqueId: string;
  type: "activity" | "report" | "discussion";
  typeLabel: string;
  typeColor: string;
  rawItem: any;
  studentId: string;
  studentName: string;
  title: string;
  category: string;
  date: string;
  createdAt: string;
  updatedAt?: string;
  field1Label: string;
  field1Value: string;
  field2Label: string;
  field2Value: string;
  aiSummary?: string;
  likes?: number;
}

export const AdminNaverFormView: React.FC<AdminNaverFormViewProps> = ({
  reports,
  activities,
  discussions,
  clubInfo,
  onDeleteReport,
  onDeleteActivity,
  onDeleteDiscussion,
  onUpdateReport,
  onUpdateActivity,
  onOpenAnthology,
}) => {
  const [activeSheet, setActiveSheet] = useState<FormSheetTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState<{ [key: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Detail Modal State
  const [selectedRow, setSelectedRow] = useState<UnifiedRow | null>(null);

  // Edit AI Summary Modal State
  const [editingRow, setEditingRow] = useState<UnifiedRow | null>(null);
  const [editSummaryText, setEditSummaryText] = useState("");

  // Google Sheets integration state
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [sheetsUrlInput, setSheetsUrlInput] = useState(() => getGoogleSheetsUrl());
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, itemName: "" });
  const [syncResultMessage, setSyncResultMessage] = useState<string | null>(null);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSaveSheetsUrl = () => {
    setGoogleSheetsUrl(sheetsUrlInput);
    setTestResult("연동 URL이 성공적으로 저장되었습니다.");
    setTimeout(() => setTestResult(null), 3500);
  };

  const handleResetDefaultSheetsUrl = () => {
    setSheetsUrlInput(DEFAULT_SHEETS_SCRIPT_URL);
    setGoogleSheetsUrl(DEFAULT_SHEETS_SCRIPT_URL);
    setTestResult("기본 웹앱 URL로 재설정되었습니다.");
    setTimeout(() => setTestResult(null), 3500);
  };

  const handleTestSendRecord = async () => {
    setTestSending(true);
    setTestResult(null);
    try {
      const dummyReport: BookReport = {
        id: Date.now(),
        logNo: "99",
        studentId: "20101",
        studentName: "연동테스트학생",
        bookTitle: "테스트_멋진신세계",
        author: "올더스 헉슬리",
        publisher: "민음사",
        readingPeriod: "2026.03.01 ~ 2026.03.15",
        category: "과학/SF",
        pageCount: "350",
        rating: 5,
        readStatus: "완독",
        summary: "구글 스프레드시트 연동 테스트를 위해 자동 생성된 기록입니다.",
        quotes: [{ quote: "모두가 모두에게 속해 있다.", page: "p.120" }],
        thoughts: "스프레드시트에 이 행이 나타나면 앱스 스크립트 연결이 100% 정상 작동 중입니다.",
        content: "구글 스프레드시트 연동 테스트를 위해 자동 생성된 기록입니다.",
        aiSummary: "체계적인 독서 활동 및 정보 연동을 능동적으로 수행함.",
        nextBook: "1984",
        date: new Date().toISOString().slice(0, 10),
      };

      const ok = await sendReportToGoogleSheets(dummyReport);
      if (ok) {
        setTestResult("✅ 테스트 데이터 1건이 전송되었습니다! 구글 스프레드시트를 새로고침하여 [독후감_포트폴리오] 시트에 추가되었는지 확인해 보세요.");
      } else {
        setTestResult("❌ 전송 실패: 웹 앱 URL 또는 접근 권한을 확인해주세요.");
      }
    } catch (err: any) {
      setTestResult(`❌ 오류 발생: ${err?.message || "알 수 없는 오류"}`);
    } finally {
      setTestSending(false);
    }
  };

  const handleSyncAllToSheets = async () => {
    const totalCount = reports.length + activities.length;
    if (totalCount === 0) {
      alert("전송할 독서기록이나 체험활동 데이터가 없습니다.");
      return;
    }

    if (
      !window.confirm(
        `현재 앱에 등록된 독서기록(${reports.length}건) 및 체험활동(${activities.length}건) 총 ${totalCount}건을 구글 스프레드시트로 일괄 전송하시겠습니까?`
      )
    ) {
      return;
    }

    setIsSyncingSheets(true);
    setSyncResultMessage(null);

    try {
      const result = await syncAllToGoogleSheets(
        reports,
        activities,
        (curr, tot, name) => {
          setSyncProgress({ current: curr, total: tot, itemName: name });
        }
      );

      setSyncResultMessage(
        `🎉 총 ${result.success}건이 구글 스프레드시트에 성공적으로 전송 완료되었습니다! ${result.failed > 0 ? `(실패 ${result.failed}건)` : ""}`
      );
    } catch (e: any) {
      setSyncResultMessage(`전송 중 문제가 발생했습니다: ${e?.message}`);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Map to unified survey response rows (Naver Form style)
  const unifiedRows: UnifiedRow[] = [
    // Activities
    ...activities.map((a): UnifiedRow => ({
      uniqueId: `act_${a.id}`,
      type: "activity",
      typeLabel: "외부활동",
      typeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      rawItem: a,
      studentId: a.studentId,
      studentName: a.studentName,
      title: a.activityTitle,
      category: a.activityType,
      date: a.activityDate || a.date,
      createdAt: a.createdAt || a.date,
      updatedAt: a.updatedAt,
      field1Label: "배운 점",
      field1Value: a.learnedLessons,
      field2Label: "활동 느낀 점",
      field2Value: a.reflections,
      aiSummary: a.aiSummary,
      likes: a.likes || 0,
    })),
    // Reports (월간 독서 기록 - Reading Log)
    ...reports.map((r): UnifiedRow => {
      const quotesText = r.quotes && r.quotes.length > 0
        ? r.quotes.map((q) => `"${q.quote}"${q.page ? ` (${q.page})` : ""}`).join("\n")
        : "";

      return {
        uniqueId: `rep_${r.id}`,
        type: "report",
        typeLabel: "독후감",
        typeColor: "bg-blue-50 text-blue-700 border-blue-200",
        rawItem: r,
        studentId: r.studentId,
        studentName: r.studentName,
        title: r.logNo ? `[No.${r.logNo}] ${r.bookTitle}` : r.bookTitle,
        category: [r.author, r.publisher, r.category, r.readStatus].filter(Boolean).join(" · ") || "도서",
        date: r.date,
        createdAt: r.createdAt || r.date,
        updatedAt: r.updatedAt,
        field1Label: "줄거리 & 인상깊은 문장",
        field1Value: [
          r.summary ? `[줄거리]\n${r.summary}` : "",
          quotesText ? `[인상 깊은 문장]\n${quotesText}` : "",
        ]
          .filter(Boolean)
          .join("\n\n") || "(미기재)",
        field2Label: "나의 생각 · 느낀 점",
        field2Value: [
          r.thoughts || r.content,
          r.nextBook ? `\n\n🔖 다음에 읽고 싶은 책: ${r.nextBook}` : "",
        ]
          .filter(Boolean)
          .join(""),
        aiSummary: r.aiSummary,
        likes: r.likes || 0,
      };
    }),
    // Discussions
    ...discussions.map((d): UnifiedRow => ({
      uniqueId: `disc_${d.id}`,
      type: "discussion",
      typeLabel: "토론발제",
      typeColor: "bg-purple-50 text-purple-700 border-purple-200",
      rawItem: d,
      studentId: d.studentId,
      studentName: d.studentName,
      title: d.topic || "토론 발제",
      category: d.bookTitle,
      date: d.date,
      createdAt: d.createdAt || d.date,
      updatedAt: d.updatedAt,
      field1Label: "토론 발제의견",
      field1Value: d.content,
      field2Label: "댓글 목록",
      field2Value: d.comments && d.comments.length > 0
        ? d.comments.map((c) => `${c.studentName}: ${c.text}`).join("\n")
        : "(작성된 댓글 없음)",
      aiSummary: undefined,
      likes: d.likes || 0,
    })),
  ];

  // Filter by sheet tab
  const filteredBySheet = unifiedRows.filter((row) => {
    if (activeSheet === "activities") return row.type === "activity";
    if (activeSheet === "reports") return row.type === "report";
    if (activeSheet === "discussions") return row.type === "discussion";
    return true;
  });

  // Filter by search query
  const query = searchQuery.trim().toLowerCase();
  const filteredRows = filteredBySheet.filter((row) => {
    if (!query) return true;
    return (
      row.studentId.toLowerCase().includes(query) ||
      row.studentName.toLowerCase().includes(query) ||
      row.title.toLowerCase().includes(query) ||
      row.category.toLowerCase().includes(query) ||
      row.field1Value.toLowerCase().includes(query) ||
      row.field2Value.toLowerCase().includes(query) ||
      (row.aiSummary && row.aiSummary.toLowerCase().includes(query))
    );
  });

  // Open Edit AI Modal
  const handleOpenEditModal = (row: UnifiedRow) => {
    setEditingRow(row);
    setEditSummaryText(row.aiSummary || "");
  };

  const handleSaveEditSummary = () => {
    if (!editingRow) return;
    if (editingRow.type === "activity") {
      onUpdateActivity?.({
        ...editingRow.rawItem,
        aiSummary: editSummaryText.trim(),
      });
    } else if (editingRow.type === "report") {
      onUpdateReport?.({
        ...editingRow.rawItem,
        aiSummary: editSummaryText.trim(),
      });
    }
    setEditingRow(null);
  };

  // Generate AI Summary directly from Admin mode
  const handleGenerateAi = async (row: UnifiedRow) => {
    setIsGeneratingAi((prev) => ({ ...prev, [row.uniqueId]: true }));
    try {
      if (row.type === "activity") {
        const res = await fetch("/api/gemini/summarize-activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activityTitle: row.rawItem.activityTitle,
            activityType: row.rawItem.activityType,
            learnedLessons: row.rawItem.learnedLessons,
            reflections: row.rawItem.reflections,
          }),
        });
        if (!res.ok) throw new Error("AI 요약 실패");
        const data = await res.json();
        onUpdateActivity?.({
          ...row.rawItem,
          aiSummary: data.summary,
          keywords: data.keywords || row.rawItem.keywords,
        });
      } else if (row.type === "report") {
        const res = await fetch("/api/gemini/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookTitle: row.rawItem.bookTitle,
            content: row.rawItem.content,
          }),
        });
        if (!res.ok) throw new Error("AI 요약 실패");
        const data = await res.json();
        onUpdateReport?.({
          ...row.rawItem,
          aiSummary: data.summary,
          keywords: data.keywords || row.rawItem.keywords,
          thoughtQuestion: data.thoughtQuestion || row.rawItem.thoughtQuestion,
          subjectLink: data.subjectLink || row.rawItem.subjectLink,
        });
      }
    } catch (err) {
      console.warn("AI generation fallback in admin", err);
      // Fallback
      if (row.type === "activity") {
        const fallback = `${row.rawItem.activityTitle}에 참여하여 배운 점을 내면화하고 성찰 태도를 보임.`;
        onUpdateActivity?.({
          ...row.rawItem,
          aiSummary: fallback,
        });
      } else if (row.type === "report") {
        const fallback = `'${row.rawItem.bookTitle}'를 읽고 핵심적인 성찰과 주도적인 독서 태도를 성실히 기록함.`;
        onUpdateReport?.({
          ...row.rawItem,
          aiSummary: fallback,
        });
      }
    } finally {
      setIsGeneratingAi((prev) => ({ ...prev, [row.uniqueId]: false }));
    }
  };

  // Delete row
  const handleDeleteRow = (row: UnifiedRow) => {
    if (confirm(`'${row.studentName}' 학생의 [${row.typeLabel}] '${row.title}' 항목을 삭제하시겠습니까?`)) {
      if (row.type === "activity") onDeleteActivity?.(row.rawItem.id);
      else if (row.type === "report") onDeleteReport?.(row.rawItem.id);
      else if (row.type === "discussion") onDeleteDiscussion?.(row.rawItem.id);
    }
  };

  // Copy row content
  const handleCopyRow = (row: UnifiedRow) => {
    const text = `[${row.typeLabel}] ${row.studentId} ${row.studentName}\n제목: ${row.title} (${row.category})\n활동일: ${row.date}\n[${row.field1Label}]\n${row.field1Value}\n[${row.field2Label}]\n${row.field2Value}\n[생기부 문구]\n${row.aiSummary || "(미생성)"}`;
    navigator.clipboard.writeText(text);
    setCopiedId(row.uniqueId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // EXCEL (.xlsx) EXPORT (SheetJS)
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: 외부체험 활동기록 (네이버폼 설문 결과 양식)
    const activitySheetData = activities.map((a, idx) => ({
      "연번": idx + 1,
      "제출일시": a.createdAt || a.date || "",
      "최종수정일시": a.updatedAt || "-",
      "학번": a.studentId,
      "성명": a.studentName,
      "활동구분": a.activityType,
      "활동명(행사명)": a.activityTitle,
      "활동일자": a.activityDate || a.date,
      "[설문1] 배운 점": a.learnedLessons,
      "[설문2] 활동 느낀 점": a.reflections,
      "[교사지도] 생기부 추천문구": a.aiSummary || "(미생성)",
      "공감수": a.likes || 0,
    }));
    const wsActivities = XLSX.utils.json_to_sheet(activitySheetData);
    wsActivities["!cols"] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 18 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 28 },
      { wch: 14 },
      { wch: 45 },
      { wch: 45 },
      { wch: 50 },
      { wch: 8 },
    ];
    XLSX.utils.book_append_sheet(wb, wsActivities, "외부체험_활동기록");

    // Sheet 2: 독후감 포트폴리오 (월간 독서 기록 - Reading Log)
    const reportSheetData = reports.map((r, idx) => ({
      "연번": idx + 1,
      "기록No": r.logNo || "",
      "올린날짜(제출일시)": r.createdAt || r.date || "",
      "최종수정일시": r.updatedAt || "-",
      "학번": r.studentId,
      "성명": r.studentName,
      "책 제목": r.bookTitle,
      "저자 · 옮긴이": r.author || "",
      "출판사": r.publisher || "",
      "읽은 기간": r.readingPeriod || "",
      "분야": r.category || "",
      "쪽수": r.pageCount ? `${r.pageCount}쪽` : "",
      "별점": r.rating ? `${r.rating}점` : "",
      "완독 여부": r.readStatus || "완독",
      "[설문1] 줄거리 & 핵심 내용": r.summary || "",
      "[설문2] 인상 깊은 문장 (문장 및 쪽수)": r.quotes && r.quotes.length > 0
        ? r.quotes.map((q) => `"${q.quote}"${q.page ? ` (${q.page})` : ""}`).join("; ")
        : "",
      "[설문3] 나의 생각 · 느낀 점": r.thoughts || r.content,
      "다음에 읽고 싶은 책": r.nextBook || "",
      "[교사지도] 생기부 추천문구": r.aiSummary || "(미생성)",
      "공감수": r.likes || 0,
    }));
    const wsReports = XLSX.utils.json_to_sheet(reportSheetData);
    wsReports["!cols"] = [
      { wch: 6 },  // 연번
      { wch: 8 },  // No
      { wch: 18 }, // 올린날짜
      { wch: 18 }, // 최종수정
      { wch: 10 }, // 학번
      { wch: 10 }, // 성명
      { wch: 24 }, // 책 제목
      { wch: 16 }, // 저자
      { wch: 14 }, // 출판사
      { wch: 14 }, // 읽은 기간
      { wch: 12 }, // 분야
      { wch: 8 },  // 쪽수
      { wch: 8 },  // 별점
      { wch: 10 }, // 완독 여부
      { wch: 45 }, // 줄거리
      { wch: 45 }, // 인상 깊은 문장
      { wch: 50 }, // 나의 생각
      { wch: 22 }, // 다음 읽을 책
      { wch: 50 }, // 생기부 추천문구
      { wch: 8 },  // 공감수
    ];
    XLSX.utils.book_append_sheet(wb, wsReports, "독후감_월간독서기록");

    // Sheet 3: 공통도서 토론
    const discussionSheetData = discussions.map((d, idx) => ({
      "연번": idx + 1,
      "발제일시": d.createdAt || d.date || "",
      "최종수정일시": d.updatedAt || "-",
      "학번": d.studentId,
      "성명": d.studentName,
      "토론주제": d.topic || clubInfo.currentTopic,
      "대상도서": d.bookTitle || clubInfo.currentBook,
      "[설문] 발제의견": d.content,
      "댓글수": d.comments?.length || 0,
      "공감수": d.likes || 0,
    }));
    const wsDiscussions = XLSX.utils.json_to_sheet(discussionSheetData);
    wsDiscussions["!cols"] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 18 },
      { wch: 10 },
      { wch: 10 },
      { wch: 30 },
      { wch: 22 },
      { wch: 50 },
      { wch: 8 },
      { wch: 8 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDiscussions, "공통도서_토론기록");

    // Sheet 4: 통합 종합 시트 (네이버폼 일괄 수합 형식)
    const unifiedSheetData = unifiedRows.map((u, idx) => ({
      "연번": idx + 1,
      "응답구분": u.typeLabel,
      "제출일시": u.createdAt,
      "최종수정일시": u.updatedAt || "-",
      "학번": u.studentId,
      "성명": u.studentName,
      "도서명/행사명": u.title,
      "세부분류/저자": u.category,
      "활동일자": u.date,
      [`[항목1] ${u.field1Label}`]: u.field1Value,
      [`[항목2] ${u.field2Label}`]: u.field2Value,
      "생기부_추천문구": u.aiSummary || "(미생성)",
    }));
    const wsUnified = XLSX.utils.json_to_sheet(unifiedSheetData);
    wsUnified["!cols"] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 10 },
      { wch: 10 },
      { wch: 26 },
      { wch: 16 },
      { wch: 14 },
      { wch: 45 },
      { wch: 45 },
      { wch: 50 },
    ];
    XLSX.utils.book_append_sheet(wb, wsUnified, "전체_설문응답_통합");

    // Download workbook
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `다독다독동아리_활동설문수합_${today}.xlsx`);
  };

  // CSV EXPORT (with UTF-8 BOM)
  const handleExportCsv = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "연번,구분,제출일시,최종수정일시,학번,성명,도서명/행사명,분류,활동일자,내용1(배운점/구절),내용2(느낀점/본문),생기부추천문구\n";

    filteredRows.forEach((r, idx) => {
      const escape = (str: string) => `"${(str || "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
      const line = [
        idx + 1,
        escape(r.typeLabel),
        escape(r.createdAt),
        escape(r.updatedAt || "-"),
        escape(r.studentId),
        escape(r.studentName),
        escape(r.title),
        escape(r.category),
        escape(r.date),
        escape(r.field1Value),
        escape(r.field2Value),
        escape(r.aiSummary || "-"),
      ].join(",");
      csvContent += line + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `다독다독동아리_설문응답_${activeSheet}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Google Sheets Live Integration Status Bar */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-600/40 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5 sm:mt-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                  구글 스프레드시트 실시간 과제 수합
                </h4>
                <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  실시간 연동 활성화
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5 leading-relaxed">
                학생들이 독서기록 및 체험활동을 등록·수정하면 선생님의 구글 스프레드시트 시트([독후감_포트폴리오], [외부체험_활동기록])에 실시간 자동 기록됩니다.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleSyncAllToSheets}
              disabled={isSyncingSheets}
              id="btn-sync-all-sheets"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="현재 앱의 모든 독서기록과 체험활동을 스프레드시트로 일괄 재전송합니다"
            >
              {isSyncingSheets ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>전송 중 ({syncProgress.current}/{syncProgress.total})...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>📊 스프레드시트에 전체 일괄 재전송</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowSheetsModal(true)}
              id="btn-sheets-settings"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl text-xs font-semibold transition-all border border-white/15 cursor-pointer"
              title="연동된 웹앱 URL 확인, 수정 및 테스트"
            >
              <Settings className="w-3.5 h-3.5 text-emerald-300" />
              <span>연동 설정 및 테스트</span>
            </button>
          </div>
        </div>

        {/* Sync in progress bar */}
        {isSyncingSheets && (
          <div className="bg-white/10 border border-white/15 rounded-xl p-3 text-xs space-y-1.5">
            <div className="flex justify-between text-emerald-200 font-semibold">
              <span>{syncProgress.itemName || "데이터 전송 중..."}</span>
              <span>{syncProgress.current} / {syncProgress.total} 건</span>
            </div>
            <div className="w-full bg-slate-950/40 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full transition-all duration-200"
                style={{
                  width: `${syncProgress.total > 0 ? (syncProgress.current / syncProgress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Sync completed message */}
        {syncResultMessage && (
          <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl p-3 text-xs text-emerald-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{syncResultMessage}</span>
            </div>
            <button
              onClick={() => setSyncResultMessage(null)}
              className="text-emerald-300 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
            >
              닫기
            </button>
          </div>
        )}
      </div>

      {/* Top Banner & Excel Action Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  네이버폼 설문형 응답 시트 및 엑셀 수합 관리
                </h3>
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  설문응답형 표
                </span>
              </div>
              <p className="text-xs text-slate-500">
                네이버폼 설문 결과처럼 영역별(학번·성명·도서/활동명·배운점·느낀점·교사평가)로 한눈에 정리되며 엑셀(.xlsx)로 내보낼 수 있습니다.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenAnthology && (
              <button
                onClick={onOpenAnthology}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 rounded-xl text-xs sm:text-sm font-extrabold shadow-sm transition-all cursor-pointer"
                title="학생들의 포트폴리오를 책자로 엮어 PDF 및 이미지로 내보냅니다"
              >
                <BookOpen className="w-4 h-4" />
                <span>📚 출판용 문집 PDF · 이미지 내보내기</span>
              </button>
            )}

            <button
              onClick={handleExportExcel}
              id="btn-export-excel"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              title="완전한 엑셀(.xlsx) 파일로 4개 시트 일괄 저장"
            >
              <Download className="w-4 h-4" />
              <span>📥 엑셀 다운로드 (.xlsx)</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
              title="CSV (UTF-8 BOM) 파일로 내보내기"
            >
              <span>📄 CSV 내보내기</span>
            </button>
          </div>
        </div>

        {/* Sheet Tabs Filter (Naver Form sub-tabs) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold mr-1">시트 영역:</span>
            <button
              onClick={() => setActiveSheet("all")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSheet === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>전체 통합 설문응답</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeSheet === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                {unifiedRows.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSheet("activities")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSheet === "activities"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>외부 행사·체험 시트</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeSheet === "activities" ? "bg-white/20 text-white" : "bg-emerald-200 text-emerald-900"}`}>
                {activities.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSheet("reports")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSheet === "reports"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>독후감 포트폴리오 시트</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeSheet === "reports" ? "bg-white/20 text-white" : "bg-blue-200 text-blue-900"}`}>
                {reports.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSheet("discussions")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSheet === "discussions"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>공통도서 토론 시트</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeSheet === "discussions" ? "bg-white/20 text-white" : "bg-purple-200 text-purple-900"}`}>
                {discussions.length}
              </span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="학번, 이름, 도서/활동명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Spreadsheet Table View (Naver Form Results Style) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              📊 응답 데이터 수합 결과표
            </span>
            <span className="text-slate-500">
              (총 <strong>{filteredRows.length}</strong>건 표시 중)
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            💡 교사는 각 행의 <strong>[✨ AI 생기부 생성]</strong> 버튼으로 특기사항 문안을 즉시 도출할 수 있습니다.
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 z-10 shadow-2xs">
              <tr className="border-b border-slate-200 text-[11px]">
                <th className="p-3 w-12 text-center">No</th>
                <th className="p-3 w-28">제출일시</th>
                <th className="p-3 w-24">학번/성명</th>
                <th className="p-3 w-20 text-center">영역</th>
                <th className="p-3 w-36">도서명 / 행사명</th>
                <th className="p-3 w-48">[설문문항 1] 배운점 / 구절</th>
                <th className="p-3 w-48">[설문문항 2] 느낀점 / 본문</th>
                <th className="p-3 min-w-[200px]">[교사지도] 생기부 추천문구</th>
                <th className="p-3 w-20 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    일치하는 설문 응답 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr
                    key={row.uniqueId}
                    className="hover:bg-slate-50/80 transition-colors group align-top"
                  >
                    {/* No */}
                    <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Timestamp */}
                    <td className="p-3 text-[11px] text-slate-500 space-y-0.5 whitespace-nowrap">
                      <div className="font-medium text-slate-700">{row.createdAt}</div>
                      {row.updatedAt && (
                        <div className="text-[10px] text-amber-700 font-medium bg-amber-50 px-1 py-0.2 rounded inline-block">
                          수정: {row.updatedAt}
                        </div>
                      )}
                    </td>

                    {/* Student */}
                    <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">
                      <div>{row.studentName}</div>
                      <div className="text-[11px] text-slate-500 font-normal">
                        {row.studentId}
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="p-3 text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${row.typeColor}`}>
                        {row.typeLabel}
                      </span>
                    </td>

                    {/* Title & Category */}
                    <td className="p-3">
                      <div className="font-bold text-slate-900 line-clamp-2">
                        {row.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {row.category}
                      </div>
                    </td>

                    {/* Field 1 */}
                    <td className="p-3 text-slate-700">
                      <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                        {row.field1Label}
                      </span>
                      <p className="line-clamp-3 text-xs leading-relaxed">
                        {row.field1Value}
                      </p>
                    </td>

                    {/* Field 2 */}
                    <td className="p-3 text-slate-700">
                      <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                        {row.field2Label}
                      </span>
                      <p className="line-clamp-3 text-xs leading-relaxed">
                        {row.field2Value}
                      </p>
                    </td>

                    {/* Teacher AI Evaluation */}
                    <td className="p-3">
                      {row.type === "discussion" ? (
                        <span className="text-[11px] text-slate-400 italic">
                          (토론은 발제 및 댓글 참여로 집계)
                        </span>
                      ) : row.aiSummary ? (
                        <div className="space-y-1.5">
                          <div className="p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-[11px] text-slate-800 leading-relaxed">
                            <span className="font-bold text-emerald-900 block mb-0.5">
                              ✨ 생기부 추천안:
                            </span>
                            {row.aiSummary}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(row)}
                              className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>직접수정</span>
                            </button>
                            <span className="text-slate-300">·</span>
                            <button
                              type="button"
                              onClick={() => handleGenerateAi(row)}
                              disabled={isGeneratingAi[row.uniqueId]}
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-medium cursor-pointer"
                            >
                              {isGeneratingAi[row.uniqueId] ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Sparkles className="w-3 h-3" />
                              )}
                              <span>재생성</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => handleGenerateAi(row)}
                            disabled={isGeneratingAi[row.uniqueId]}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            {isGeneratingAi[row.uniqueId] ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>생성 중...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>AI 생기부 문구 생성</span>
                              </>
                            )}
                          </button>
                          <span className="block text-[10px] text-slate-400">
                            교사용 특기사항 자동 도출
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Actions: View, Copy, Delete */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedRow(row)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="상세 내용 보기"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyRow(row)}
                          className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                          title="응답 복사"
                        >
                          {copiedId === row.uniqueId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="삭제하기"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row Detail View Modal */}
      {selectedRow && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setSelectedRow(null)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${selectedRow.typeColor}`}>
                  {selectedRow.typeLabel}
                </span>
                <h4 className="font-bold text-sm sm:text-base text-slate-900">
                  {selectedRow.studentName} ({selectedRow.studentId}) - 설문 상세 응답
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block mb-0.5">도서명 / 활동명:</span>
                  <strong className="text-slate-900 text-sm">{selectedRow.title}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">분류 / 저자:</span>
                  <span className="text-slate-700">{selectedRow.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">활동/작성일:</span>
                  <span className="text-slate-700">{selectedRow.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">감사 로그:</span>
                  <span className="text-slate-700">
                    최초: {selectedRow.createdAt} {selectedRow.updatedAt && `| 수정: ${selectedRow.updatedAt}`}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1">
                <strong className="text-blue-900 block font-bold">
                  💡 {selectedRow.field1Label}
                </strong>
                <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                  {selectedRow.field1Value}
                </p>
              </div>

              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1">
                <strong className="text-emerald-900 block font-bold">
                  💭 {selectedRow.field2Label}
                </strong>
                <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                  {selectedRow.field2Value}
                </p>
              </div>

              {selectedRow.aiSummary && (
                <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl space-y-1">
                  <strong className="text-purple-900 block font-bold">
                    ✨ 지도교사 생활기록부 특기사항 추천문구
                  </strong>
                  <p className="text-slate-800 leading-relaxed">
                    {selectedRow.aiSummary}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleCopyRow(selectedRow)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                전체 복사
              </button>
              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit AI Summary Modal */}
      {editingRow && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setEditingRow(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                <span>생활기록부 특기사항 문안 직접 수정</span>
              </h4>
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-500">
              <strong>{editingRow.studentName}</strong> ({editingRow.studentId}) - '{editingRow.title}'
            </div>

            <textarea
              rows={4}
              value={editSummaryText}
              onChange={(e) => setEditSummaryText(e.target.value)}
              placeholder="학교생활기록부 특기사항에 기재할 평가 문안을 입력해주세요."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white resize-y"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveEditSummary}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>문안 저장하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets Settings & Testing Modal */}
      {showSheetsModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowSheetsModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900">
                    구글 스프레드시트 실시간 연동 관리
                  </h4>
                  <p className="text-xs text-slate-500">
                    학생들의 독후감 및 체험활동 제출물이 자동 전송되는 웹앱 엔드포인트 설정
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSheetsModal(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Current Web App URL input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                연결된 구글 앱스 스크립트(GAS) 웹 앱 URL:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={sheetsUrlInput}
                  onChange={(e) => setSheetsUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <button
                  onClick={handleSaveSheetsUrl}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0"
                >
                  저장
                </button>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5">
                <span>기본 URL: 선생님이 등록해주신 배포 URL이 활성화되어 있습니다.</span>
                <button
                  onClick={handleResetDefaultSheetsUrl}
                  className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  기본값 복원
                </button>
              </div>
            </div>

            {/* Test Send Section */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-emerald-700" />
                    <span>실시간 전송 테스트 (검증)</span>
                  </h5>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    가상의 독서기록 1건('테스트_멋진신세계')을 구글 시트로 즉시 전송하여 연동이 정상인지 확인합니다.
                  </p>
                </div>
                <button
                  onClick={handleTestSendRecord}
                  disabled={testSending}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50 shrink-0 flex items-center gap-1.5 shadow-xs"
                >
                  {testSending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>전송 중...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>1건 즉시 테스트 전송</span>
                    </>
                  )}
                </button>
              </div>

              {testResult && (
                <div className="p-2.5 bg-white rounded-lg border border-emerald-300 text-xs font-medium text-slate-800 animate-in fade-in">
                  {testResult}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2 leading-relaxed">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>스프레드시트 작동 안내</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                <li>
                  학생들이 메인 화면의 독후감 탭에서 <strong>[저장하기]</strong>를 누르거나, 체험활동 탭에서 활동을 등록하면 이 웹앱을 통해 <strong>실시간으로 행이 추가</strong>됩니다.
                </li>
                <li>
                  독후감 제출물은 <strong>[독후감_포트폴리오]</strong> 시트에, 외부체험 기록은 <strong>[외부체험_활동기록]</strong> 시트에 자동으로 구분되어 누적됩니다.
                </li>
                <li>
                  현재 앱에 이미 작성되어 있는 기존 학생 데이터들을 구글 시트로 한꺼번에 올리려면 상단의 <strong>[📊 스프레드시트에 전체 일괄 재전송]</strong> 버튼을 누르시면 됩니다.
                </li>
              </ul>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowSheetsModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                확인 및 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
