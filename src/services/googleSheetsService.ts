import { BookReport, ActivityRecord, StudentRosterItem } from "../types";
import { initialStudents } from "../data/initialData";

export const DEFAULT_SHEETS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz1qJIYxbm75vi0ERrbN1Lshy8RE9QbWUV_P0Av4ESWhEuyqgNrchSf4wJGJUgCYig/exec";

export const getGoogleSheetsUrl = (): string => {
  try {
    const saved = localStorage.getItem("google_sheets_webhook_url");
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_SHEETS_SCRIPT_URL;
};

export const setGoogleSheetsUrl = (url: string): void => {
  try {
    localStorage.setItem("google_sheets_webhook_url", url.trim());
  } catch (e) {
    console.error(e);
  }
};

export const BANNED_LEGACY_NAMES = new Set([
  "강민준", "김도현", "김동우", "김서진", "박서준", "박시우", "박유찬",
  "배주원", "백도윤", "서준우", "이도윤", "신우진", "양승우", "오태윤",
  "유도현", "윤서준", "이서진", "이준호", "장하준", "정예준", "조은우",
  "최지훈"
]);

export const isBannedDummyName = (name: string): boolean => {
  if (!name) return true;
  const clean = name.trim();
  if (/^학생\d+$/.test(clean)) return true;
  return BANNED_LEGACY_NAMES.has(clean);
};

/**
 * Local & server-synced student roster storage helpers
 */
export const getStoredStudentRoster = (): StudentRosterItem[] => {
  try {
    const saved = localStorage.getItem("student_roster");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = parsed.filter(
          (p) => p && p.studentName && !isBannedDummyName(p.studentName)
        );
        if (cleaned.length !== parsed.length) {
          localStorage.setItem("student_roster", JSON.stringify(cleaned));
        }
        return cleaned;
      }
    }
  } catch (e) {
    console.error("Failed to load student roster from localStorage", e);
  }
  if (Array.isArray(initialStudents) && initialStudents.length > 0) {
    return initialStudents;
  }
  return [];
};

export const saveStudentRoster = (roster: StudentRosterItem[]): void => {
  if (!Array.isArray(roster)) return;

  // Filter out dummy names and de-duplicate by studentId
  const byId = new Map<string, StudentRosterItem>();
  roster.forEach((stu) => {
    if (stu && stu.studentId && stu.studentName && !isBannedDummyName(stu.studentName)) {
      byId.set(String(stu.studentId).trim(), {
        studentId: String(stu.studentId).trim(),
        studentName: String(stu.studentName).trim(),
        password: String(stu.password || "").trim() || (String(stu.studentId).replace(/\D/g, "").slice(-4) || "1234"),
      });
    }
  });

  const uniqueRoster = Array.from(byId.values());

  try {
    localStorage.setItem("student_roster", JSON.stringify(uniqueRoster));
  } catch (e) {
    console.error("Failed to save student roster to localStorage", e);
  }

  // Also sync to Express backend server (/api/roster) so all devices & republished links share it
  try {
    fetch("/api/roster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ students: uniqueRoster }),
    }).catch((err) => console.warn("Background server roster sync notice:", err));
  } catch (err) {
    console.warn("Server roster sync failed:", err);
  }
};

export const fetchRosterFromServer = async (): Promise<StudentRosterItem[]> => {
  try {
    const res = await fetch("/api/roster");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.students) && data.students.length > 0) {
        const local = getStoredStudentRoster();
        const merged = [...data.students];
        local.forEach((loc) => {
          if (
            !merged.some(
              (m) =>
                isStudentIdMatch(m.studentId, loc.studentId) ||
                isStudentNameMatch(m.studentName, loc.studentName)
            )
          ) {
            merged.push(loc);
          }
        });
        try {
          localStorage.setItem("student_roster", JSON.stringify(merged));
        } catch (e) {}
        return merged;
      }
    }
  } catch (err) {
    console.warn("Could not fetch roster from server:", err);
  }
  return getStoredStudentRoster();
};

/**
 * Post JSON data to Google Apps Script Web App.
 * Using mode: 'no-cors' and text/plain;charset=utf-8 prevents CORS preflight errors
 * and successfully delivers the POST payload to doPost(e).
 */
async function postToAppsScript(payload: any): Promise<{ success: boolean; message?: string }> {
  const url = getGoogleSheetsUrl();
  if (!url) {
    return { success: false, message: "구글 시트 연동 URL이 설정되지 않았습니다." };
  }

  try {
    const jsonStr = JSON.stringify(payload);

    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: jsonStr,
    });

    return { success: true, message: "스프레드시트에 전송되었습니다." };
  } catch (err: any) {
    console.error("Google Sheets sync error:", err);
    return { success: false, message: err?.message || "스프레드시트 전송 중 오류가 발생했습니다." };
  }
}

/**
 * 학생 독서 기록(Reading Log)을 구글 스프레드시트로 전송
 */
export async function sendReportToGoogleSheets(report: BookReport): Promise<boolean> {
  const payload = {
    type: "report",
    id: report.id,
    logNo: report.logNo || "",
    studentId: report.studentId || "",
    studentName: report.studentName || "",
    bookTitle: report.bookTitle || "",
    author: report.author || "",
    publisher: report.publisher || "",
    readingPeriod: report.readingPeriod || "",
    category: report.category || "",
    pageCount: report.pageCount || "",
    rating: report.rating || 5,
    readStatus: report.readStatus || "완독",
    summary: report.summary || "",
    quotes: report.quotes || [],
    thoughts: report.thoughts || report.content || "",
    nextBook: report.nextBook || "",
    // Base64 이미지가 너무 큰 경우 압축 전달(앞부분 축약 또는 URL)
    image: report.image ? (report.image.length > 50000 ? "(인증사진 첨부됨)" : report.image) : "",
    createdAt: report.createdAt || report.date || new Date().toISOString().slice(0, 10),
  };

  const res = await postToAppsScript(payload);
  return res.success;
}

/**
 * 학생 외부체험 및 문학기행 기록을 구글 스프레드시트로 전송
 */
export async function sendActivityToGoogleSheets(activity: ActivityRecord): Promise<boolean> {
  const payload = {
    type: "activity",
    id: activity.id,
    date: activity.activityDate || activity.date || "",
    studentId: activity.studentId || "",
    studentName: activity.studentName || "",
    activityName: activity.activityTitle || "",
    activityType: activity.activityType || "",
    description: activity.reflections || "",
    learned: activity.learnedLessons || "",
    image: activity.image ? (activity.image.length > 50000 ? "(현장사진 첨부됨)" : activity.image) : "",
    createdAt: activity.createdAt || activity.date || new Date().toISOString().slice(0, 10),
  };

  const res = await postToAppsScript(payload);
  return res.success;
}

/**
 * 기존에 로컬에 저장된 전체 독후감 및 체험활동 기록을 스프레드시트로 일괄 재전송
 */
export async function syncAllToGoogleSheets(
  reports: BookReport[],
  activities: ActivityRecord[],
  onProgress?: (current: number, total: number, itemName: string) => void
): Promise<{ success: number; failed: number }> {
  const total = reports.length + activities.length;
  let successCount = 0;
  let failedCount = 0;
  let currentIndex = 0;

  for (const report of reports) {
    currentIndex++;
    if (onProgress) {
      onProgress(currentIndex, total, `[독서기록] ${report.studentName} - ${report.bookTitle}`);
    }
    const ok = await sendReportToGoogleSheets(report);
    if (ok) successCount++;
    else failedCount++;
    // 브라우저 및 구글 서버 부하 방지용 짧은 딜레이
    await new Promise((r) => setTimeout(r, 250));
  }

  for (const activity of activities) {
    currentIndex++;
    if (onProgress) {
      onProgress(currentIndex, total, `[체험활동] ${activity.studentName} - ${activity.activityTitle}`);
    }
    const ok = await sendActivityToGoogleSheets(activity);
    if (ok) successCount++;
    else failedCount++;
    await new Promise((r) => setTimeout(r, 250));
  }

  return { success: successCount, failed: failedCount };
}

/**
 * 구글 스프레드시트 웹앱(doGet)에서 누적된 학생 과제 목록 가져오기
 */
export async function fetchSubmissionsFromGoogleSheets(): Promise<{
  success: boolean;
  reports: BookReport[];
  activities: ActivityRecord[];
  students: StudentRosterItem[];
  rawText?: string;
  error?: string;
}> {
  const url = getGoogleSheetsUrl();
  if (!url) {
    return {
      success: false,
      reports: [],
      activities: [],
      students: getStoredStudentRoster(),
      error: "구글 시트 연동 URL이 설정되지 않았습니다.",
    };
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      // Check if Google returned HTML login / permission denied page
      if (
        text.includes("アクセス権") ||
        text.includes("Request Access") ||
        text.includes("accounts.google.com") ||
        text.includes("drive-logo") ||
        text.includes("<!DOCTYPE html>")
      ) {
        return {
          success: false,
          reports: [],
          activities: [],
          students: getStoredStudentRoster(),
          rawText: text,
          error:
            "⚠️ 구글 웹앱 배포 권한 잠김: Apps Script 배포 시 '액세스 권한이 있는 사용자'가 [모든 사용자(Anyone)]가 아닌 [나만(Only myself)]으로 되어 있어 구글이 과제 전송/불러오기를 차단하고 있습니다. Apps Script의 [배포] ➔ [배포 관리]에서 권한을 [모든 사용자]로 변경해주세요.",
        };
      }

      return {
        success: false,
        reports: [],
        activities: [],
        students: getStoredStudentRoster(),
        rawText: text,
        error: "스프레드시트에서 데이터를 JSON 형식으로 받지 못했습니다. 앱스 스크립트의 doGet 코드를 확인해주세요.",
      };
    }

    if (data && (data.status === "success" || Array.isArray(data.reports))) {
      const reports: BookReport[] = Array.isArray(data.reports) ? data.reports : [];
      const activities: ActivityRecord[] = Array.isArray(data.activities) ? data.activities : [];

      // Extract real students from data collection sheet (both from data.students and from submitted reports)
      const studentMap = new Map<string, StudentRosterItem>();

      // A. From data.students (if sheet Apps Script explicitly returned student roster)
      if (Array.isArray(data.students)) {
        data.students.forEach((s: any) => {
          const sName = String(s?.studentName || "").trim();
          const sId = String(s?.studentId || "").trim();
          if (sName && !isBannedDummyName(sName)) {
            let pw = String(s.password !== undefined ? s.password : "").trim();
            if (!pw) {
              const digits = sId.replace(/\D/g, "");
              pw = digits.length >= 4 ? digits.slice(-4) : "1234";
            }
            studentMap.set(sId, { studentId: sId, studentName: sName, password: pw });
          }
        });
      }

      // B. From data.reports (every submission in the data collection sheet has studentId & studentName)
      reports.forEach((rep) => {
        const rName = String(rep.studentName || "").trim();
        const rId = String(rep.studentId || "").trim();
        if (rName && !isBannedDummyName(rName)) {
          if (!studentMap.has(rId)) {
            const digits = rId.replace(/\D/g, "");
            const pw = digits.length >= 4 ? digits.slice(-4) : "1234";
            studentMap.set(rId, { studentId: rId, studentName: rName, password: pw });
          }
        }
      });

      const extractedFromSheet = Array.from(studentMap.values());
      let finalRoster: StudentRosterItem[] = [];

      if (extractedFromSheet.length > 0) {
        // Real students from Google Sheet are the official source of truth
        finalRoster = extractedFromSheet;
        saveStudentRoster(finalRoster);
      } else {
        // Retain current stored roster (with any dummy names purged)
        finalRoster = getStoredStudentRoster();
      }

      return {
        success: true,
        reports,
        activities,
        students: finalRoster,
      };
    }

    return {
      success: false,
      reports: [],
      activities: [],
      students: getStoredStudentRoster(),
      error: data?.message || "스프레드시트 응답 형식이 올바르지 않습니다.",
    };
  } catch (err: any) {
    console.error("fetchSubmissionsFromGoogleSheets error:", err);
    return {
      success: false,
      reports: [],
      activities: [],
      students: getStoredStudentRoster(),
      error: err?.message || "스프레드시트에서 데이터를 가져오는 중 네트워크 오류가 발생했습니다.",
    };
  }
}

/**
 * 구글 스프레드시트 [명단] 시트에서 학생 목록 및 4자리 비밀번호 최신화 가져오기
 */
export async function fetchRosterFromGoogleSheets(): Promise<{
  success: boolean;
  students: StudentRosterItem[];
  error?: string;
}> {
  const result = await fetchSubmissionsFromGoogleSheets();
  if (result.success && result.students.length > 0) {
    saveStudentRoster(result.students);
    return { success: true, students: result.students };
  }
  return {
    success: result.success,
    students: getStoredStudentRoster(),
    error: result.error,
  };
}

// Helper to check flexible student ID matching (e.g., 10105 vs 105 vs 1-5 vs 1반 5번)
export const isStudentIdMatch = (registeredId: string, inputId: string): boolean => {
  const regClean = registeredId.trim().toLowerCase().replace(/\s+/g, "");
  const inpClean = inputId.trim().toLowerCase().replace(/\s+/g, "");
  if (regClean === inpClean) return true;

  // Extract digits only
  const regDigits = regClean.replace(/\D/g, "");
  const inpDigits = inpClean.replace(/\D/g, "");
  if (regDigits && inpDigits) {
    if (regDigits === inpDigits) return true;
    if (parseInt(regDigits, 10) === parseInt(inpDigits, 10)) return true;
    // e.g. 10105 and 105 or 0105
    if (regDigits.endsWith(inpDigits) || inpDigits.endsWith(regDigits)) return true;
  }

  // Handle class-number format (e.g. "1-5", "1반 5번", "10105", "105")
  const parseClassNum = (str: string): string | null => {
    const dashMatch = str.match(/(\d+)[^0-9]+(\d+)/);
    if (dashMatch) {
      return `${parseInt(dashMatch[1], 10)}-${parseInt(dashMatch[2], 10)}`;
    }
    const d = str.replace(/\D/g, "");
    if (d.length === 5) {
      // 10105 -> class 1, num 5
      return `${parseInt(d.slice(1, 3), 10)}-${parseInt(d.slice(3), 10)}`;
    }
    if (d.length === 4) {
      // 1105 -> class 1, num 5
      return `${parseInt(d.slice(1, 2), 10)}-${parseInt(d.slice(2), 10)}`;
    }
    if (d.length === 3) {
      // 105 -> class 1, num 5
      return `${parseInt(d.slice(0, 1), 10)}-${parseInt(d.slice(1), 10)}`;
    }
    return null;
  };

  const regCN = parseClassNum(regClean);
  const inpCN = parseClassNum(inpClean);
  if (regCN && inpCN && regCN === inpCN) return true;

  return false;
};

export const isStudentNameMatch = (registeredName: string, inputName: string): boolean => {
  return (
    registeredName.trim().replace(/\s+/g, "").toLowerCase() ===
    inputName.trim().replace(/\s+/g, "").toLowerCase()
  );
};

/**
 * 학생 로그인 인증 검증 (학번, 이름, 4자리 비밀번호)
 */
export async function verifyStudentCredentials(
  inputStudentId: string,
  inputStudentName: string,
  inputPassword: string
): Promise<{ success: boolean; message?: string; student?: StudentRosterItem }> {
  const sId = inputStudentId.trim().replace(/\s+/g, "");
  const sName = inputStudentName.trim().replace(/\s+/g, "");
  let sPw = inputPassword.trim();
  if (sPw && !isNaN(Number(sPw)) && sPw.length < 4) {
    sPw = ("0000" + sPw).slice(-4);
  }

  if (!sId || !sName) {
    return { success: false, message: "학번과 이름을 모두 입력해주세요." };
  }
  if (!sPw || sPw.length !== 4) {
    return { success: false, message: "비밀번호는 4자리 숫자로 입력해주세요." };
  }

  // 1. Check in locally cached roster
  let roster = getStoredStudentRoster();
  let match = roster.find(
    (item) => isStudentIdMatch(item.studentId, sId) && isStudentNameMatch(item.studentName, sName)
  );

  // Helper to check if password matches (explicit password, or student ID last 4 digits, or 4-digit ID)
  const isPasswordValid = (expectedPw: string | undefined, studentIdStr: string, inputPwStr: string) => {
    const cleanExpected = String(expectedPw || "").trim();
    let formattedExpected = cleanExpected;
    if (formattedExpected && !isNaN(Number(formattedExpected)) && formattedExpected.length < 4) {
      formattedExpected = ("0000" + formattedExpected).slice(-4);
    }

    // Direct match with sheet password
    if (formattedExpected && formattedExpected === inputPwStr) return true;

    // Student ID based defaults (last 4 digits, e.g. 20104 -> 0104)
    const idDigitsOnly = studentIdStr.replace(/\D/g, "");
    if (idDigitsOnly.length >= 4) {
      const last4 = idDigitsOnly.slice(-4);
      if (last4 === inputPwStr) return true;
    }
    // If student ID itself is 4 digits
    if (idDigitsOnly === inputPwStr) return true;

    // Default master fallback password
    if (inputPwStr === "1234") return true;

    // If no password was specifically assigned, allow any 4-digit PIN
    if (!formattedExpected && /^\d{4}$/.test(inputPwStr)) return true;

    return false;
  };

  // If found in local cache
  if (match) {
    if (isPasswordValid(match.password, match.studentId, sPw)) {
      return { success: true, student: match };
    } else {
      return {
        success: false,
        message: "비밀번호가 일치하지 않습니다. 본인 학번 뒤 4자리(예: 0104) 또는 1234를 입력해주세요.",
      };
    }
  }

  // 2. If not found in local cache, attempt a fetch from the server (/api/roster)
  try {
    const serverStudents = await fetchRosterFromServer();
    if (Array.isArray(serverStudents) && serverStudents.length > 0) {
      roster = serverStudents;
      match = roster.find(
        (item) => isStudentIdMatch(item.studentId, sId) && isStudentNameMatch(item.studentName, sName)
      );
      if (match) {
        if (isPasswordValid(match.password, match.studentId, sPw)) {
          return { success: true, student: match };
        } else {
          return {
            success: false,
            message: "비밀번호가 일치하지 않습니다. 본인 학번 뒤 4자리(예: 0104) 또는 1234를 입력해주세요.",
          };
        }
      }
    }
  } catch (err) {
    console.warn("Server roster fetch failed, continuing to sheets", err);
  }

  // 3. If not found, attempt a live fetch from Google Sheets
  try {
    const fetchRes = await fetchRosterFromGoogleSheets();
    if (fetchRes.success && fetchRes.students.length > 0) {
      roster = fetchRes.students;
      match = roster.find(
        (item) => isStudentIdMatch(item.studentId, sId) && isStudentNameMatch(item.studentName, sName)
      );
      if (match) {
        if (isPasswordValid(match.password, match.studentId, sPw)) {
          return { success: true, student: match };
        } else {
          return {
            success: false,
            message: "비밀번호가 일치하지 않습니다. 본인 학번 뒤 4자리(예: 0104) 또는 1234를 입력해주세요.",
          };
        }
      }
    }
  } catch (err) {
    console.warn("Live roster fetch failed, checking fallbacks", err);
  }

  // 4. Check initial preset roster fallback
  const presetMatch = initialStudents.find(
    (item) => isStudentIdMatch(item.studentId, sId) && isStudentNameMatch(item.studentName, sName)
  );
  if (presetMatch) {
    if (isPasswordValid(presetMatch.password, presetMatch.studentId, sPw)) {
      return { success: true, student: presetMatch };
    }
  }

  // 5. Fail-Safe Auto Registration:
  // If student enters valid student ID (at least 2 chars) and valid student name (at least 2 chars) and 4-digit PIN:
  // Seamlessly register them into roster so students are NEVER locked out!
  if (sId.length >= 2 && sName.length >= 2 && /^\d{4}$/.test(sPw)) {
    const newStudent: StudentRosterItem = {
      studentId: sId,
      studentName: sName,
      password: sPw,
    };
    const existingIdx = roster.findIndex((item) => isStudentIdMatch(item.studentId, sId));
    let updated = [...roster];
    if (existingIdx !== -1) {
      updated[existingIdx] = newStudent;
    } else {
      updated.push(newStudent);
    }
    saveStudentRoster(updated);
    return {
      success: true,
      student: newStudent,
      message: "동아리 학생으로 정상 인증되었습니다. 환영합니다!",
    };
  }

  return {
    success: false,
    message: "학번과 성명, 그리고 4자리 비밀번호를 올바르게 입력해주세요.",
  };
}
