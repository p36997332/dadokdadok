import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { BookReport, DiscussionPost, ClubInfo, ActivityRecord, StudentRosterItem } from "../types";
import { AdminNaverFormView } from "./AdminNaverFormView";
import { AnthologyExportModal } from "./AnthologyExportModal";
import {
  getGoogleSheetsUrl,
  setGoogleSheetsUrl,
  syncAllToGoogleSheets,
  sendReportToGoogleSheets,
  fetchSubmissionsFromGoogleSheets,
  DEFAULT_SHEETS_SCRIPT_URL,
  getStoredStudentRoster,
  saveStudentRoster,
  fetchRosterFromServer,
} from "../services/googleSheetsService";
import {
  Search,
  Users,
  FileText,
  BarChart3,
  Download,
  Copy,
  Check,
  Printer,
  RotateCcw,
  ClipboardList,
  Sparkles,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  Clock,
  Save,
  Pencil,
  ArrowLeft,
  AlertCircle,
  BookMarked,
  Settings,
  Compass,
  Lightbulb,
  Trash2,
  FileSpreadsheet,
  Loader2,
  Upload,
  RefreshCw,
  Send,
  ExternalLink,
} from "lucide-react";

interface AdminTabProps {
  reports: BookReport[];
  discussions: DiscussionPost[];
  activities: ActivityRecord[];
  clubInfo: ClubInfo;
  onUpdateClubInfo: (clubInfo: ClubInfo) => void;
  onResetData: () => void;
  onClearAllData?: () => void;
  onDeleteReport?: (id: string | number) => void;
  onDeleteActivity?: (id: string | number) => void;
  onDeleteDiscussion?: (id: string | number) => void;
  onUpdateReport?: (report: BookReport) => void;
  onUpdateActivity?: (activity: ActivityRecord) => void;
  onImportFromSheets?: (
    importedReports: BookReport[],
    importedActivities: ActivityRecord[],
    mode?: "merge" | "replace",
    importedStudents?: StudentRosterItem[]
  ) => void;
  isAdminAuthenticated: boolean;
  onLoginAdmin: (password: string) => boolean;
  onLockAdmin: () => void;
  onChangeAdminPassword: (newPassword: string) => void;
  onBackToStudentView: () => void;
}

export const AdminTab: React.FC<AdminTabProps> = ({
  reports,
  discussions,
  activities = [],
  clubInfo,
  onUpdateClubInfo,
  onResetData,
  onClearAllData,
  onDeleteReport,
  onDeleteActivity,
  onDeleteDiscussion,
  onUpdateReport,
  onUpdateActivity,
  onImportFromSheets,
  isAdminAuthenticated,
  onLoginAdmin,
  onLockAdmin,
  onChangeAdminPassword,
  onBackToStudentView,
}) => {
  // Auth state
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Password change modal state
  const [showChangePwModal, setShowChangePwModal] = useState(false);
  const [newPwInput, setNewPwInput] = useState("");
  const [confirmPwInput, setConfirmPwInput] = useState("");
  const [pwChangeMessage, setPwChangeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Google Sheets sync state
  const [isFetchingSheets, setIsFetchingSheets] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, itemName: "" });
  const [syncResultMessage, setSyncResultMessage] = useState<string | null>(null);
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [sheetsUrlInput, setSheetsUrlInput] = useState(() => getGoogleSheetsUrl());
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState<"paste" | "excel" | "script">("paste");
  const [rosterList, setRosterList] = useState<StudentRosterItem[]>(() => getStoredStudentRoster());
  const [showRosterPreview, setShowRosterPreview] = useState(false);
  const [showRosterEditor, setShowRosterEditor] = useState(false);
  const [rosterEditText, setRosterEditText] = useState("");
  const [copiedGasCode, setCopiedGasCode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchRosterFromServer()
      .then((students) => {
        if (Array.isArray(students) && students.length > 0) {
          saveStudentRoster(students);
          setRosterList(getStoredStudentRoster());
        } else {
          setRosterList(getStoredStudentRoster());
        }
      })
      .catch(() => {
        setRosterList(getStoredStudentRoster());
      });
  }, []);

  const handleOpenRosterEditor = () => {
    const text = rosterList.map((s) => `${s.studentId}\t${s.studentName}\t${s.password}`).join("\n");
    setRosterEditText(text);
    setShowRosterEditor(true);
  };

  const handleSaveRosterText = () => {
    if (!rosterEditText.trim()) {
      alert("명단 내용을 입력해주세요.");
      return;
    }
    const lines = rosterEditText.trim().split("\n");
    const parsed: StudentRosterItem[] = [];
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const cols = trimmed.includes("\t")
        ? trimmed.split("\t")
        : trimmed.includes(",")
        ? trimmed.split(",")
        : trimmed.split(/\s+/);
      const cleanCols = cols.map((c) => c.trim()).filter((c) => c.length > 0);
      if (cleanCols.length >= 2) {
        const sid = cleanCols[0];
        const sname = cleanCols[1];
        let pw = cleanCols[2] || "";
        if (!pw) {
          const digits = sid.replace(/\D/g, "");
          pw = digits.length >= 4 ? digits.slice(-4) : (digits || "1234");
        }
        parsed.push({
          studentId: sid,
          studentName: sname,
          password: pw,
        });
      }
    });

    if (parsed.length > 0) {
      saveStudentRoster(parsed);
      setRosterList(parsed);
      setShowRosterEditor(false);
      setSyncResultMessage(`학생 명단 ${parsed.length}명이 성공적으로 저장 및 서버에 반영되었습니다.`);
    } else {
      alert("유효한 학생 데이터(학번, 이름)를 찾지 못했습니다. '학번 이름' 형식으로 입력해주세요.");
    }
  };

  // Club info edit state
  const [isEditingClubInfo, setIsEditingClubInfo] = useState(false);
  const [editClubName, setEditClubName] = useState(clubInfo.name);
  const [editCurrentBook, setEditCurrentBook] = useState(clubInfo.currentBook);
  const [editCurrentTopic, setEditCurrentTopic] = useState(clubInfo.currentTopic);
  const [editNextMeeting, setEditNextMeeting] = useState(clubInfo.nextMeeting);
  const [editTargetBooks, setEditTargetBooks] = useState(clubInfo.targetBooksPerSemester);
  const [clubSaveNotice, setClubSaveNotice] = useState<string | null>(null);

  // Search and view states
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedStudent, setCopiedStudent] = useState<string | null>(null);
  const [activeSubView, setActiveSubView] = useState<"all" | "naverForm" | "byStudent" | "reportExport">("all");
  const [showAnthologyModal, setShowAnthologyModal] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState<{ [key: string]: boolean }>({});
  const [editingAiModal, setEditingAiModal] = useState<{
    type: "report" | "activity";
    item: any;
    text: string;
  } | null>(null);

  // Save custom sheets URL
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

  // Test sending 1 dummy record to Google Sheets
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
        setTestResult("✅ 스프레드시트 전송 완료! 선생님의 구글 시트 [독후감_포트폴리오] 탭을 확인해보세요.");
      } else {
        setTestResult("❌ 전송 실패: 웹앱 배포 권한이 '모든 사용자(Anyone)'로 되어 있는지 확인해주세요.");
      }
    } catch (err: any) {
      setTestResult(`❌ 오류 발생: ${err?.message || err}`);
    } finally {
      setTestSending(false);
    }
  };

  // 1. Fetch student submissions directly from Google Sheets
  const handleFetchFromSheets = async () => {
    setIsFetchingSheets(true);
    setSyncResultMessage(null);
    try {
      const res = await fetchSubmissionsFromGoogleSheets();
      if (res.success && (res.reports.length > 0 || res.activities.length > 0 || (res.students && res.students.length > 0))) {
        if (res.students && res.students.length > 0) {
          saveStudentRoster(res.students);
          setRosterList(res.students);
        }
        onImportFromSheets?.(res.reports, res.activities, "merge", res.students);
        const stuMsg = res.students && res.students.length > 0 ? `, 학생명단 ${res.students.length}명 최신화` : "";
        setSyncResultMessage(
          `🎉 구글 스프레드시트에서 독후감 ${res.reports.length}건, 활동기록 ${res.activities.length}건${stuMsg}을 성공적으로 불러왔습니다! 이제 학생 로그인 및 문집 제작기에서 즉시 확인하실 수 있습니다.`
        );
      } else if (res.success && res.reports.length === 0 && res.activities.length === 0) {
        setSyncResultMessage("구글 스프레드시트가 비어 있거나 아직 제출된 학생 과제가 없습니다.");
      } else {
        setSyncResultMessage(
          res.error ||
            "구글 스프레드시트에서 직접 가져오지 못했습니다. [엑셀 파일/붙여넣기]로 등록하시거나 배포 권한을 확인해주세요."
        );
        setImportTab("paste");
        setShowImportModal(true);
      }
    } catch (err: any) {
      setSyncResultMessage(`스프레드시트 통신 오류: ${err?.message || err}`);
      setImportTab("paste");
      setShowImportModal(true);
    } finally {
      setIsFetchingSheets(false);
    }
  };

  // 2. Sync all current app data to Google Sheets
  const handleSyncAllToSheets = async () => {
    if (reports.length === 0 && activities.length === 0) {
      alert("전송할 독서기록이나 체험활동 데이터가 없습니다.");
      return;
    }

    if (
      !confirm(
        `현재 앱에 등록된 독후감 ${reports.length}건, 체험활동 ${activities.length}건을 구글 스프레드시트로 일괄 전송하시겠습니까?\n(기존 시트에 누적 기록됩니다.)`
      )
    ) {
      return;
    }

    setIsSyncingSheets(true);
    setSyncProgress({ current: 0, total: reports.length + activities.length, itemName: "시작 중..." });
    setSyncResultMessage(null);

    try {
      const result = await syncAllToGoogleSheets(reports, activities, (current, total, itemName) => {
        setSyncProgress({ current, total, itemName });
      });

      setSyncResultMessage(
        `🎉 전체 일괄 전송 완료! (성공: ${result.success}건, 실패: ${result.failed}건)`
      );
    } catch (err: any) {
      setSyncResultMessage(`전송 중 오류 발생: ${err?.message || "알 수 없는 오류"}`);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // 3. Handle Excel file (.xlsx) drag & drop / manual upload from Google Sheet
  const handleExcelFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const newReports: BookReport[] = [];
        const newActivities: ActivityRecord[] = [];

        // Check for reports sheet
        const reportSheetName =
          workbook.SheetNames.find((n) => n.includes("독후감")) || workbook.SheetNames[0];
        if (reportSheetName) {
          const sheet = workbook.Sheets[reportSheetName];
          const jsonRows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          for (let i = 1; i < jsonRows.length; i++) {
            const row = jsonRows[i];
            if (!row || (!row[2] && !row[4])) continue;
            const rawStatus = String(row[11] || "완독").trim();
            const validStatus: "완독" | "읽는 중" | "중단" =
              rawStatus === "읽는 중" || rawStatus === "중단" ? rawStatus : "완독";

            newReports.push({
              id: Date.now() + i,
              logNo: String(row[1] || i),
              studentId: String(row[2] || "20100"),
              studentName: String(row[3] || "학생"),
              bookTitle: String(row[4] || "무제"),
              author: String(row[5] || ""),
              publisher: String(row[6] || ""),
              readingPeriod: String(row[7] || ""),
              category: String(row[8] || "기타"),
              pageCount: String(row[9] || ""),
              rating: Number(String(row[10] || "5").replace(/[^0-9]/g, "")) || 5,
              readStatus: validStatus,
              summary: String(row[12] || ""),
              quotes: row[13] ? [{ quote: String(row[13]), page: "" }] : [],
              thoughts: String(row[14] || ""),
              content: String(row[14] || ""),
              nextBook: String(row[15] || ""),
              image: String(row[16] || ""),
              aiSummary: String(row[17] || "체계적인 독서 활동 및 성찰을 주도적으로 수행함."),
              date: row[0] ? String(row[0]).slice(0, 10) : new Date().toISOString().slice(0, 10),
            });
          }
        }

        // Check for activities sheet
        const actSheetName = workbook.SheetNames.find(
          (n) => n.includes("체험") || n.includes("활동")
        );
        if (actSheetName) {
          const sheet = workbook.Sheets[actSheetName];
          const jsonRows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          for (let j = 1; j < jsonRows.length; j++) {
            const row = jsonRows[j];
            if (!row || (!row[2] && !row[4])) continue;
            newActivities.push({
              id: Date.now() + 1000 + j,
              date: String(row[1] || ""),
              activityDate: String(row[1] || ""),
              studentId: String(row[2] || "20100"),
              studentName: String(row[3] || "학생"),
              activityTitle: String(row[4] || "체험활동"),
              activityType: "외부체험",
              reflections: String(row[6] || ""),
              learnedLessons: String(row[7] || ""),
              image: String(row[8] || ""),
            });
          }
        }

        // Check for student roster sheet (명단, 학생, 명렬)
        const rosterSheetName = workbook.SheetNames.find(
          (n) => n.includes("명단") || n.includes("학생") || n.includes("명렬")
        );
        const newStudents: StudentRosterItem[] = [];
        if (rosterSheetName) {
          const sheet = workbook.Sheets[rosterSheetName];
          const jsonRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (jsonRows && jsonRows.length > 0) {
            const header = jsonRows[0] || [];
            let colId = -1;
            let colGrade = -1;
            let colClass = -1;
            let colNum = -1;
            let colName = -1;
            let colPw = -1;

            for (let c = 0; c < header.length; c++) {
              const h = String(header[c] || "").trim().toLowerCase();
              if (h.includes("학번") || h === "id" || h === "studentid") colId = c;
              else if (h.includes("학년")) colGrade = c;
              else if (h.includes("반") || h.includes("학급")) colClass = c;
              else if (h.includes("번호") && !h.includes("연번") && !h.includes("순번")) colNum = c;
              else if (h.includes("이름") || h.includes("성명") || h === "name") colName = c;
              else if (h.includes("비밀번호") || h.includes("비번") || h.includes("암호") || h === "pw") colPw = c;
            }

            // Fallback column positions for standard layouts (e.g. [연번, 반, 번호, 이름])
            if (colName === -1) {
              if (header.length >= 4) {
                colClass = 1;
                colNum = 2;
                colName = 3;
              } else if (header.length === 3) {
                colClass = 0;
                colNum = 1;
                colName = 2;
              } else if (header.length === 2) {
                colId = 0;
                colName = 1;
              }
            }

            for (let k = 1; k < jsonRows.length; k++) {
              const r = jsonRows[k];
              if (!r || r.length === 0) continue;
              const name = colName !== -1 ? String(r[colName] || "").trim() : "";
              if (!name || name === "이름" || name === "성명") continue;

              let sid = "";
              if (colId !== -1 && r[colId]) {
                sid = String(r[colId]).trim();
              } else if (colClass !== -1 && colNum !== -1) {
                const cls = String(r[colClass] || "").replace(/\D/g, "");
                const num = String(r[colNum] || "").replace(/\D/g, "");
                const grd = colGrade !== -1 ? String(r[colGrade] || "").replace(/\D/g, "") : "";
                if (cls && num) {
                  const numPad = num.length < 2 ? "0" + num : num;
                  const clsPad = cls.length < 2 ? "0" + cls : cls;
                  sid = grd ? `${grd}${clsPad}${numPad}` : `${cls}${numPad}`;
                }
              }
              if (!sid && r[0]) sid = String(r[0]).trim();

              let rawPw = colPw !== -1 ? String(r[colPw] || "").trim() : "";
              let pw = rawPw;
              if (!pw) {
                const digits = sid.replace(/\D/g, "");
                pw = digits.length >= 4 ? digits.slice(-4) : (digits || "1234");
              }
              if (pw.length < 4 && !isNaN(Number(pw))) {
                pw = ("0000" + pw).slice(-4);
              }

              newStudents.push({
                studentId: sid,
                studentName: name,
                password: pw,
              });
            }
          }
        }

        if (newReports.length > 0 || newActivities.length > 0 || newStudents.length > 0) {
          if (newStudents.length > 0) {
            saveStudentRoster(newStudents);
            setRosterList(newStudents);
          }
          onImportFromSheets?.(newReports, newActivities, "merge", newStudents);
          const studentMsg = newStudents.length > 0 ? `, 학생명단 ${newStudents.length}명` : "";
          setSyncResultMessage(
            `🎉 엑셀 파일에서 독후감 ${newReports.length}건, 활동 ${newActivities.length}건${studentMsg}을 웹사이트로 불러왔습니다!`
          );
          setShowImportModal(false);
        } else {
          alert("엑셀 파일에서 유효한 독서기록, 체험활동 또는 학생명단 행을 찾지 못했습니다.");
        }
      } catch (err: any) {
        alert("엑셀 파일 분석 중 오류가 발생했습니다: " + err?.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 4. Handle pasted text (from Google Sheets Ctrl+C)
  const handlePasteImport = () => {
    if (!pasteText.trim()) return;
    try {
      const lines = pasteText.trim().split("\n");
      const newReports: BookReport[] = [];
      const newStudents: StudentRosterItem[] = [];

      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        const splitCols = trimmed.includes("\t")
          ? trimmed.split("\t")
          : trimmed.includes(",")
          ? trimmed.split(",")
          : trimmed.split(/\s{2,}|\s+/);
        const cols = splitCols.map((c) => c.trim()).filter((c) => c.length > 0);
        if (cols.length < 2) return;

        // Skip headers
        if (
          cols[0]?.includes("제출일시") ||
          (cols[0]?.includes("연번") && cols[1]?.includes("반")) ||
          (cols[0]?.includes("학번") && cols[1]?.includes("이름")) ||
          (cols[0] === "순번" || cols[0] === "번호" || cols[0] === "연번")
        ) {
          return;
        }

        // Check if this looks like a student roster row (e.g. [연번, 반, 번호, 이름] or [반, 번호, 이름] or [학번, 이름])
        const isRosterRow =
          (cols.length <= 5 && !cols.some((c) => c.length > 30)) &&
          (
            // Format 1: [연번, 반, 번호, 이름] e.g. 1 \t 1 \t 1 \t 김철수
            (cols.length >= 4 && !isNaN(Number(cols[0])) && !isNaN(Number(cols[1])) && !isNaN(Number(cols[2]))) ||
            // Format 2: [반, 번호, 이름] e.g. 1 \t 1 \t 김철수
            (cols.length === 3 && !isNaN(Number(cols[0])) && !isNaN(Number(cols[1]))) ||
            // Format 3: [학번, 이름] e.g. 10101 \t 김철수
            (cols.length === 2 && cols[0].length >= 3 && !isNaN(Number(cols[0]))) ||
            // Format 4: [연번, 이름] e.g. 1 \t 김철수
            (cols.length === 2 && !isNaN(Number(cols[0])) && isNaN(Number(cols[1])))
          );

        if (isRosterRow) {
          let sid = "";
          let sname = "";
          if (cols.length >= 4 && !isNaN(Number(cols[0])) && !isNaN(Number(cols[1]))) {
            const cls = cols[1];
            const num = cols[2].padStart(2, "0");
            sid = `${cls}${num}`;
            sname = cols[3];
          } else if (cols.length === 3 && !isNaN(Number(cols[0]))) {
            const cls = cols[0];
            const num = cols[1].padStart(2, "0");
            sid = `${cls}${num}`;
            sname = cols[2];
          } else if (cols.length === 2) {
            sid = cols[0];
            sname = cols[1];
          }

          if (sname) {
            const pwDigits = sid.replace(/\D/g, "");
            const pw = pwDigits.length >= 4 ? pwDigits.slice(-4) : (pwDigits.padStart(4, "0") || "1234");
            newStudents.push({
              studentId: sid,
              studentName: sname,
              password: pw,
            });
          }
          return;
        }

        // Otherwise process as book report
        if (cols.length >= 3) {
          const studentId = cols[2] || cols[1] || "20101";
          const studentName = cols[3] || cols[2] || "학생";
          const bookTitle = cols[4] || cols[3] || cols[0];
          newReports.push({
            id: Date.now() + idx,
            logNo: String(idx + 1),
            studentId: studentId.trim(),
            studentName: studentName.trim(),
            bookTitle: bookTitle.trim(),
            author: cols[5] || "",
            publisher: cols[6] || "",
            readingPeriod: cols[7] || "",
            category: cols[8] || "기타",
            pageCount: cols[9] || "",
            rating: 5,
            readStatus: "완독",
            summary: cols[12] || cols[10] || "",
            quotes: cols[13] ? [{ quote: cols[13], page: "" }] : [],
            thoughts: cols[14] || cols[11] || "",
            content: cols[14] || cols[11] || "",
            nextBook: cols[15] || "",
            aiSummary: cols[17] || "체계적인 독서 활동 및 성찰을 주도적으로 수행함.",
            date: new Date().toISOString().slice(0, 10),
          });
        }
      });

      if (newReports.length > 0 || newStudents.length > 0) {
        if (newStudents.length > 0) {
          saveStudentRoster(newStudents);
          setRosterList(newStudents);
        }
        onImportFromSheets?.(newReports, [], "merge", newStudents);
        const reportMsg = newReports.length > 0 ? `독서기록 ${newReports.length}건 ` : "";
        const studentMsg = newStudents.length > 0 ? `학생명단 ${newStudents.length}명 ` : "";
        setSyncResultMessage(`🎉 붙여넣은 데이터에서 ${reportMsg}${studentMsg}을 성공적으로 불러왔습니다!`);
        setShowImportModal(false);
        setPasteText("");
      } else {
        alert("복사된 텍스트에서 인식 가능한 독서기록 또는 학생명단 행을 찾을 수 없습니다.");
      }
    } catch (err: any) {
      alert("붙여넣기 처리 중 오류: " + err.message);
    }
  };

  // Generate AI summary for activity (teacher action)
  const handleGenerateAiForActivity = async (act: ActivityRecord) => {
    setIsGeneratingAi((prev) => ({ ...prev, [act.id]: true }));
    try {
      const res = await fetch("/api/gemini/summarize-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityTitle: act.activityTitle,
          activityType: act.activityType,
          learnedLessons: act.learnedLessons,
          reflections: act.reflections,
        }),
      });
      if (!res.ok) throw new Error("AI 요약 실패");
      const data = await res.json();
      onUpdateActivity?.({
        ...act,
        aiSummary: data.summary,
        keywords: data.keywords || act.keywords,
      });
    } catch (err) {
      console.warn("AI generation fallback in admin", err);
      const fallback = `${act.activityTitle}에 참여하여 배운 점을 충실히 정리하고 동아리원으로서 적극적인 성찰 태도를 보임.`;
      onUpdateActivity?.({
        ...act,
        aiSummary: fallback,
      });
    } finally {
      setIsGeneratingAi((prev) => ({ ...prev, [act.id]: false }));
    }
  };

  // Generate AI summary for book report (teacher action)
  const handleGenerateAiForReport = async (r: BookReport) => {
    setIsGeneratingAi((prev) => ({ ...prev, [`rep_${r.id}`]: true }));
    try {
      const res = await fetch("/api/gemini/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookTitle: r.bookTitle,
          content: r.content,
        }),
      });
      if (!res.ok) throw new Error("AI 요약 실패");
      const data = await res.json();
      onUpdateReport?.({
        ...r,
        aiSummary: data.summary,
        keywords: data.keywords || r.keywords,
        thoughtQuestion: data.thoughtQuestion || r.thoughtQuestion,
        subjectLink: data.subjectLink || r.subjectLink,
      });
    } catch (err) {
      console.warn("AI generation fallback in admin", err);
      const fallback = `'${r.bookTitle}'를 읽고 핵심적인 주제의식을 깊이 있게 성찰하여 독후감으로 정리함.`;
      onUpdateReport?.({
        ...r,
        aiSummary: fallback,
      });
    } finally {
      setIsGeneratingAi((prev) => ({ ...prev, [`rep_${r.id}`]: false }));
    }
  };

  // Save edited AI text
  const handleSaveEditedAiModal = () => {
    if (!editingAiModal) return;
    if (editingAiModal.type === "activity") {
      onUpdateActivity?.({
        ...editingAiModal.item,
        aiSummary: editingAiModal.text.trim(),
      });
    } else {
      onUpdateReport?.({
        ...editingAiModal.item,
        aiSummary: editingAiModal.text.trim(),
      });
    }
    setEditingAiModal(null);
  };

  // Handle password submission
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setAuthError("비밀번호를 입력해주세요.");
      return;
    }

    const success = onLoginAdmin(passwordInput.trim());
    if (success) {
      setPasswordInput("");
      setAuthError("");
    } else {
      setAuthError("비밀번호가 올바르지 않습니다. 다시 확인해주세요.");
    }
  };

  // Handle password change
  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPwInput.trim()) {
      setPwChangeMessage({ type: "error", text: "새 비밀번호를 입력해주세요." });
      return;
    }
    if (newPwInput !== confirmPwInput) {
      setPwChangeMessage({ type: "error", text: "새 비밀번호가 일치하지 않습니다." });
      return;
    }

    onChangeAdminPassword(newPwInput.trim());
    setPwChangeMessage({ type: "success", text: "관리자 비밀번호가 성공적으로 변경되었습니다." });
    setTimeout(() => {
      setShowChangePwModal(false);
      setNewPwInput("");
      setConfirmPwInput("");
      setPwChangeMessage(null);
    }, 1500);
  };

  // Handle saving club info
  const handleSaveClubInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCurrentBook.trim()) {
      alert("공통도서명을 입력해주세요.");
      return;
    }
    if (!editCurrentTopic.trim()) {
      alert("토론 주제를 입력해주세요.");
      return;
    }

    onUpdateClubInfo({
      ...clubInfo,
      name: editClubName.trim() || clubInfo.name,
      currentBook: editCurrentBook.trim(),
      currentTopic: editCurrentTopic.trim(),
      nextMeeting: editNextMeeting.trim() || clubInfo.nextMeeting,
      targetBooksPerSemester: Number(editTargetBooks) || clubInfo.targetBooksPerSemester,
    });

    setIsEditingClubInfo(false);
    setClubSaveNotice("공통도서 및 토론 주제가 성공적으로 저장되어 학생 화면에 실시간 반영되었습니다!");
    setTimeout(() => setClubSaveNotice(null), 3500);
  };

  // If not authenticated, display Teacher Password Gate
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs border border-blue-100">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">
              교사용 관리자 인증
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              공통도서/토론 주제 수정, 학생 데이터 수합 및 생활기록부 관리 기능은 교사 전용 공간입니다. 비밀번호를 입력해주세요.
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
            <div>
              <label
                htmlFor="admin-password-input"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                관리자 비밀번호
              </label>
              <div className="relative">
                <input
                  id="admin-password-input"
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (authError) setAuthError("");
                  }}
                  placeholder="비밀번호 입력 (초기: 1234)"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {authError && (
                <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{authError}</span>
                </p>
              )}
            </div>

            <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-[11px] text-amber-800 space-y-1">
              <div className="font-semibold flex items-center gap-1 text-amber-900">
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>선생님 안내</span>
              </div>
              <p>
                초기 비밀번호는 <strong>1234</strong> 입니다. 접속 후 원하시는 비밀번호로 안전하게 변경하실 수 있습니다.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                id="btn-admin-login"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Unlock className="w-4 h-4" />
                <span>관리자 모드 접속</span>
              </button>

              <button
                type="button"
                onClick={onBackToStudentView}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>학생 화면(포트폴리오)으로 돌아가기</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Filtered lists based on search query
  const query = searchQuery.trim().toLowerCase();

  const filteredReports = reports.filter((r) => {
    if (!query) return true;
    return (
      r.studentId.toLowerCase().includes(query) ||
      r.studentName.toLowerCase().includes(query) ||
      r.bookTitle.toLowerCase().includes(query) ||
      r.content.toLowerCase().includes(query)
    );
  });

  const filteredDiscussions = discussions.filter((d) => {
    if (!query) return true;
    return (
      d.studentId.toLowerCase().includes(query) ||
      d.studentName.toLowerCase().includes(query) ||
      d.content.toLowerCase().includes(query)
    );
  });

  const filteredActivities = activities.filter((a) => {
    if (!query) return true;
    return (
      a.studentId.toLowerCase().includes(query) ||
      a.studentName.toLowerCase().includes(query) ||
      a.activityTitle.toLowerCase().includes(query) ||
      a.activityType.toLowerCase().includes(query) ||
      a.learnedLessons.toLowerCase().includes(query) ||
      a.reflections.toLowerCase().includes(query)
    );
  });

  // Calculate distinct participating students
  const studentMap = new Map<
    string,
    {
      studentId: string;
      studentName: string;
      reports: BookReport[];
      discussions: DiscussionPost[];
      activities: ActivityRecord[];
      commentCount: number;
    }
  >();

  reports.forEach((r) => {
    const key = `${r.studentId}_${r.studentName}`;
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        studentId: r.studentId,
        studentName: r.studentName,
        reports: [],
        discussions: [],
        activities: [],
        commentCount: 0,
      });
    }
    studentMap.get(key)!.reports.push(r);
  });

  discussions.forEach((d) => {
    const key = `${d.studentId}_${d.studentName}`;
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        studentId: d.studentId,
        studentName: d.studentName,
        reports: [],
        discussions: [],
        activities: [],
        commentCount: 0,
      });
    }
    studentMap.get(key)!.discussions.push(d);

    // Also count comments made by students
    d.comments?.forEach((c) => {
      for (const [, student] of studentMap.entries()) {
        if (c.studentName.includes(student.studentName)) {
          student.commentCount += 1;
        }
      }
    });
  });

  activities.forEach((a) => {
    const key = `${a.studentId}_${a.studentName}`;
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        studentId: a.studentId,
        studentName: a.studentName,
        reports: [],
        discussions: [],
        activities: [],
        commentCount: 0,
      });
    }
    studentMap.get(key)!.activities.push(a);
  });

  const studentList = Array.from(studentMap.values()).sort((a, b) =>
    a.studentId.localeCompare(b.studentId)
  );

  const totalComments = discussions.reduce(
    (acc, cur) => acc + (cur.comments?.length || 0),
    0
  );

  // Generate NEIS 생기부 format text for a student
  const generateNeisFormat = (student: {
    studentId: string;
    studentName: string;
    reports: BookReport[];
    discussions: DiscussionPost[];
    activities: ActivityRecord[];
  }) => {
    const reportSummary = student.reports
      .map(
        (r) =>
          `'${r.bookTitle}'를 읽고 ${
            r.aiSummary ? r.aiSummary.replace(/함.$/, "함.") : "깊이 있는 성찰을 기록함."
          }`
      )
      .join(" ");

    const discSummary =
      student.discussions.length > 0
        ? ` 동아리 공통도서 토론에서 '${clubInfo.currentBook}'에 대해 주도적으로 발제하고 동아리원들과 다각적인 윤리적 논의를 주도함.`
        : "";

    const actSummary =
      student.activities && student.activities.length > 0
        ? ` 아울러 동아리 연계 체험 및 행사(${student.activities.map((a) => `'${a.activityTitle}'`).join(", ")})에 적극 참여하여 배운 점과 느낀 점을 성찰하며 실천적 소양을 기름.`
        : "";

    return `[독서동아리 특기사항] (학번: ${student.studentId} 성명: ${student.studentName})\n` +
      `정기 독서 활동에 성실히 참여하여 총 ${student.reports.length}권의 도서를 완독하고 포트폴리오를 누적함. ` +
      reportSummary +
      discSummary +
      actSummary;
  };

  const handleCopyNeis = (student: any) => {
    const text = generateNeisFormat(student);
    navigator.clipboard.writeText(text);
    setCopiedStudent(student.studentId);
    setTimeout(() => setCopiedStudent(null), 2000);
  };

  // Export full JSON file
  const handleExportData = () => {
    const exportPayload = {
      clubInfo,
      reports,
      activities,
      discussions,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `다독다독동아리_활동수합보고서_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Admin Status & Action Bar */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                교사용 관리자 모드
              </h2>
              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                인증 완료
              </span>
            </div>
            <p className="text-xs text-slate-500">
              공통도서 발제 수정, 학생별 제출 및 수정 로그 감사, 생기부 추출이 가능합니다.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAnthologyModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 rounded-lg text-xs font-extrabold shadow-sm transition-all cursor-pointer ring-2 ring-amber-400/40"
            title="학생들의 포트폴리오를 모아 출판용 책자 형태로 제작하고 PDF 및 고해상도 이미지로 내보냅니다"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>📚 출판용 문집 PDF · 이미지 내보내기</span>
          </button>

          <button
            onClick={() => setActiveSubView("naverForm")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="네이버폼 설문형 시트 보기 및 엑셀(.xlsx) 내보내기"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>📥 엑셀 내보내기</span>
          </button>

          <button
            onClick={() => setShowChangePwModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-slate-500" />
            <span>비밀번호 변경</span>
          </button>

          <button
            onClick={handleExportData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>JSON 백업</span>
          </button>

          <button
            onClick={() => {
              if (
                confirm(
                  "현재 등록된 모든 예시/샘플 데이터(독후감, 외부활동, 토론글)를 일괄 삭제하시겠습니까?\n\n삭제 시 실제 신학기 학생들의 새로운 포트폴리오를 받을 수 있는 빈 상태가 됩니다.\n(필요 시 옆의 복구 버튼을 눌러 언제든 샘플을 다시 불러올 수 있습니다.)"
                )
              ) {
                onClearAllData?.();
                alert("예시 데이터가 모두 삭제되었습니다. 신학기 실제 학생 접수 준비가 완료되었습니다.");
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-amber-200"
            title="등록된 예시/샘플 데이터 일괄 삭제 (신학기 빈 상태)"
          >
            <Trash2 className="w-3.5 h-3.5 text-amber-600" />
            <span>예시 데이터 삭제</span>
          </button>

          <button
            onClick={() => {
              if (confirm("초기 샘플 데이터로 복원하시겠습니까?")) {
                onResetData();
              }
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-slate-400 hover:text-slate-600 rounded-lg text-xs transition-colors cursor-pointer"
            title="초기 샘플 데이터 복원"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onLockAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-rose-200/60"
            title="관리자 화면 잠금"
          >
            <Lock className="w-3.5 h-3.5 text-rose-600" />
            <span>관리자 잠금</span>
          </button>
        </div>
      </section>

      {/* 🌟 GOOGLE SHEETS & ANTHOLOGY UNIFIED ACTION BAR 🌟 */}
      <section className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 sm:mt-0 shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>구글 스프레드시트 연동 & 출판 문집 관리</span>
                </h3>
                <span className="inline-flex items-center gap-1.5 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  실시간 연동 상태
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                학생 제출 과제와 23명 명단을 구글 시트와 양방향 동기화하고, 인쇄·출판용 문집(PDF·이미지)을 즉시 생성합니다.
              </p>
            </div>
          </div>

          {/* Unified Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* 1. Fetch from Google Sheets (Auto-Sync) */}
            <button
              onClick={handleFetchFromSheets}
              disabled={isFetchingSheets}
              id="btn-fetch-sheets"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="구글 시트의 최신 과제 및 학생 명단을 불러옵니다"
            >
              {isFetchingSheets ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>불러오는 중...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>시트에서 불러오기</span>
                </>
              )}
            </button>

            {/* 2. Unified Import (Paste or Excel) */}
            <button
              onClick={() => {
                setImportTab("paste");
                setShowImportModal(true);
              }}
              id="btn-paste-import-header"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              title="구글 시트 표 복사/붙여넣기 또는 엑셀 파일(.xlsx)로 과제 및 23명 학생 명단 일괄 등록"
            >
              <ClipboardList className="w-4 h-4 text-sky-400" />
              <span>과제·명단 일괄 등록</span>
            </button>

            {/* 3. Generate Anthology (출판용 문집 제작) - unified, calm, dignified styling */}
            <button
              onClick={() => setShowAnthologyModal(true)}
              id="btn-open-anthology-bar"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="학생들의 독서기록으로 표지, 목차, 내지가 포함된 책자(문집) PDF 및 이미지 제작"
            >
              <BookOpen className="w-4 h-4 text-indigo-200" />
              <span>출판용 문집 제작</span>
            </button>

            {/* 4. Google Sheets Settings */}
            <button
              onClick={() => setShowSheetsModal(true)}
              id="btn-sheets-settings-main"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              title="구글 웹앱 URL 관리, 전송 테스트 및 시트로 전체 재전송"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>연동 설정</span>
            </button>
          </div>
        </div>

        {/* Sync in progress bar */}
        {isSyncingSheets && (
          <div className="bg-white/10 border border-white/15 rounded-xl p-3 text-xs space-y-1.5 animate-fadeIn">
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

        {/* Sync result message */}
        {syncResultMessage && (
          <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl p-3.5 text-xs text-emerald-100 flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="leading-relaxed">{syncResultMessage}</span>
            </div>
            <button
              onClick={() => setSyncResultMessage(null)}
              className="text-emerald-300 hover:text-white text-xs px-2.5 py-1 rounded-lg hover:bg-white/10 cursor-pointer shrink-0 font-bold"
            >
              닫기
            </button>
          </div>
        )}
      </section>

      {/* 👥 STUDENT ROSTER SUMMARY CARD (Clean, uncluttered, coherent) */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-base shrink-0">
              👥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">동아리 학생 명단</h3>
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  rosterList.length >= 20
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${rosterList.length >= 20 ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {rosterList.length}명 연동됨
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                구글 시트 연동 또는 [과제·명단 일괄 등록]을 통해 관리되며, 학생 개인별 포트폴리오 및 로그인에 사용됩니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenRosterEditor}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <span>명단 직접 편집/붙여넣기</span>
            </button>
            <button
              onClick={() => setShowRosterPreview(!showRosterPreview)}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <span>{showRosterPreview ? "▲ 명단 닫기" : `▼ 등록 학생 ${rosterList.length}명 보기`}</span>
            </button>
          </div>
        </div>

        {/* Direct Roster Editor Panel */}
        {showRosterEditor && (
          <div className="mt-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-blue-950">
                  학생 명단 일괄 편집 / 붙여넣기
                </h4>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  엑셀이나 한글 문서에서 <strong>학번 이름</strong>을 복사해서 붙여넣으세요. (줄바꿈 구분)
                </p>
              </div>
              <button
                onClick={() => setShowRosterEditor(false)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold px-2 py-1 rounded"
              >
                닫기
              </button>
            </div>
            <textarea
              value={rosterEditText}
              onChange={(e) => setRosterEditText(e.target.value)}
              rows={8}
              placeholder={`20101\t김철수\n20102\t이영희\n...`}
              className="w-full p-3 rounded-xl border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-hidden leading-relaxed"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                입력 줄 수: {rosterEditText.trim() ? rosterEditText.trim().split("\n").length : 0}명
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRosterEditor(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveRosterText}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  명단 저장 및 서버 반영
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expandable Roster List */}
        {showRosterPreview && (
          <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>총 <strong>{rosterList.length}명</strong>의 학생이 등록되어 있습니다</span>
              <span className="text-slate-400 text-[11px]">* 학생 로그인 비밀번호: 학번 뒤 4자리 (또는 지정 비번)</span>
            </div>
            {rosterList.length === 0 ? (
              <p className="text-xs text-center py-6 text-slate-400">
                아직 등록된 학생 명단이 없습니다. 상단의 [과제·명단 일괄 등록] 버튼을 눌러 시트의 명단을 붙여넣어주세요.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-60 overflow-y-auto pr-1">
                {rosterList.map((stu, sIdx) => (
                  <div key={sIdx} className="bg-slate-50 hover:bg-slate-100/80 p-2.5 rounded-xl border border-slate-200 text-xs transition-colors">
                    <div className="font-mono text-slate-500 font-bold text-[11px]">{stu.studentId}</div>
                    <div className="font-bold text-slate-900 text-sm truncate">{stu.studentName}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">비번: {stu.password}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Success Notification if Club Info was updated */}
      {clubSaveNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{clubSaveNotice}</span>
        </div>
      )}

      {/* 1. Common Book & Discussion Topic Management Section */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
              📚
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                공통도서 및 토론 주제 설정
              </h3>
              <p className="text-xs text-slate-500">
                선생님께서 이번 달 선정 도서와 토론 발제 주제를 수정하시면 학생 토론 화면에 즉시 업데이트됩니다.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isEditingClubInfo) {
                setEditCurrentBook(clubInfo.currentBook);
                setEditCurrentTopic(clubInfo.currentTopic);
                setEditNextMeeting(clubInfo.nextMeeting);
                setEditTargetBooks(clubInfo.targetBooksPerSemester);
                setEditClubName(clubInfo.name);
                setIsEditingClubInfo(false);
              } else {
                setIsEditingClubInfo(true);
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              isEditingClubInfo
                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>{isEditingClubInfo ? "수정 취소" : "주제 및 도서 수정"}</span>
          </button>
        </div>

        {isEditingClubInfo ? (
          <form onSubmit={handleSaveClubInfo} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  이번 달 공통도서명 및 작가 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editCurrentBook}
                  onChange={(e) => setEditCurrentBook(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                  placeholder="예: 《정의란 무엇인가》 - 마이클 샌델"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  정기 모임 일정 및 장소
                </label>
                <input
                  type="text"
                  value={editNextMeeting}
                  onChange={(e) => setEditNextMeeting(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                  placeholder="예: 매주 목요일 7교시 도서관 2층 세미나실"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                이번 달 토론 주제 및 발제 방향 <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={editCurrentTopic}
                onChange={(e) => setEditCurrentTopic(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white resize-y"
                placeholder="학생들이 생각하고 토론할 핵심 논제나 윤리적 쟁점을 작성해주세요."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1학기 1인당 목표 독서 권수
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={editTargetBooks}
                  onChange={(e) => setEditTargetBooks(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  동아리 명칭
                </label>
                <input
                  type="text"
                  value={editClubName}
                  onChange={(e) => setEditClubName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditingClubInfo(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>공통도서 및 주제 설정 저장</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
              <span className="text-[11px] font-semibold text-blue-700 block mb-1">
                📖 현재 지정 공통도서
              </span>
              <p className="text-sm font-bold text-slate-900">
                {clubInfo.currentBook}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl md:col-span-2">
              <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                💬 지정 토론 주제 및 발제 방향
              </span>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                "{clubInfo.currentTopic}"
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-500">정기 모임 일정:</span>
              <span className="font-semibold text-slate-800">
                {clubInfo.nextMeeting}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-500">1학기 목표 독서량:</span>
              <span className="font-semibold text-slate-800">
                1인당 {clubInfo.targetBooksPerSemester}권 완독
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-500">동아리 명칭:</span>
              <span className="font-semibold text-slate-800">
                {clubInfo.name}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* 2. Top Search & Filter Card */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
              🔍
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                학생별 활동 데이터 검색 및 로그 감사
              </h2>
              <p className="text-xs text-slate-500">
                학생들의 독후감 및 토론 제출 현황, 최초 작성일시 및 최종 수정 로그를 종합 조회합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Search input and action buttons */}
        <div className="search-box flex flex-col sm:flex-row gap-2.5 mb-5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="search-student"
              placeholder="학번, 학생 이름, 도서명, 독후감 내용 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                지우기
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSearchQuery(searchQuery.trim())}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            검색
          </button>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            전체보기
          </button>
        </div>

        {/* Summary Metric Stats Card */}
        <div id="admin-summary-box" className="admin-summary bg-blue-50/70 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-xs sm:text-sm text-blue-900 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              💡 동아리 사업 보고서용 활동 데이터 요약
            </span>
            <span className="text-[11px] text-blue-700 font-medium">
              기준: 2026학년도 1학기
            </span>
          </div>

          <div
            id="summary-text"
            className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs"
          >
            <div className="bg-white/80 p-3 rounded-lg border border-blue-200/50">
              <span className="text-slate-500 block mb-0.5">전체 독후감</span>
              <strong className="text-base text-blue-900">{reports.length}</strong>
              <span className="text-slate-400 text-[11px]"> 건 등록</span>
            </div>

            <div className="bg-white/80 p-3 rounded-lg border border-blue-200/50">
              <span className="text-slate-500 block mb-0.5">외부 활동기록</span>
              <strong className="text-base text-emerald-800">{activities.length}</strong>
              <span className="text-slate-400 text-[11px]"> 건 작성</span>
            </div>

            <div className="bg-white/80 p-3 rounded-lg border border-blue-200/50">
              <span className="text-slate-500 block mb-0.5">공통도서 의견</span>
              <strong className="text-base text-indigo-900">
                {discussions.length}
              </strong>
              <span className="text-slate-400 text-[11px]"> 건 발제</span>
            </div>

            <div className="bg-white/80 p-3 rounded-lg border border-blue-200/50">
              <span className="text-slate-500 block mb-0.5">참여 학생 수</span>
              <strong className="text-base text-slate-800">
                {studentList.length}
              </strong>
              <span className="text-slate-400 text-[11px]"> 명 활동</span>
            </div>

            <div className="bg-white/80 p-3 rounded-lg border border-blue-200/50">
              <span className="text-slate-500 block mb-0.5">누적 토론 댓글</span>
              <strong className="text-base text-purple-900">
                {totalComments}
              </strong>
              <span className="text-slate-400 text-[11px]"> 개 작성</span>
            </div>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">조회 방식:</span>
          <button
            onClick={() => setActiveSubView("all")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeSubView === "all"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            기본 통합 목록 (타임스탬프 감사 & 삭제)
          </button>
          <button
            onClick={() => setActiveSubView("naverForm")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubView === "naverForm"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>📊 네이버폼 설문형 시트 & 엑셀 내보내기</span>
          </button>
          <button
            onClick={() => setActiveSubView("byStudent")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeSubView === "byStudent"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            학생별 포트폴리오 카드 ({studentList.length}명)
          </button>
          <button
            onClick={() => setActiveSubView("reportExport")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeSubView === "reportExport"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            생기부 특기사항 추출
          </button>
        </div>
      </section>

      {/* Admin Results Area */}
      <section id="admin-results" className="space-y-6">
        {/* SUBVIEW 1: Standard Search / Aggregated Feed (with detailed audit timestamps) */}
        {activeSubView === "all" && (
          <>
            {/* Reports Section */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>📄 독후감 제출 내역 ({filteredReports.length}건)</span>
                </h3>
                {query && (
                  <span className="text-xs text-blue-600 font-medium">
                    '{query}' 검색 결과
                  </span>
                )}
              </div>

              {filteredReports.length === 0 ? (
                <p className="text-xs sm:text-sm text-slate-400 py-4 text-center">
                  제출된 독후감 내역이 없습니다.
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredReports.map((r) => (
                    <div
                      key={r.id}
                      className="post-item bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 hover:border-slate-300 transition-colors space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="font-semibold text-xs sm:text-sm text-slate-900 flex flex-wrap items-center gap-1.5">
                          <strong className="text-blue-700">
                            [{r.studentId} {r.studentName}]
                          </strong>
                          {r.logNo && (
                            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                              No.{r.logNo}
                            </span>
                          )}
                          <span>{r.bookTitle}</span>
                          {r.author && (
                            <span className="text-xs text-slate-500 font-normal">
                              ({r.author})
                            </span>
                          )}
                          {r.rating && (
                            <span className="text-xs text-amber-600 font-bold ml-1">
                              ★{r.rating}
                            </span>
                          )}
                          {r.readStatus && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                              {r.readStatus}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>올린날짜: {r.createdAt || r.date}</span>
                          </span>
                          {r.updatedAt && (
                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>수정: {r.updatedAt} (수정됨)</span>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`'${r.studentName}' 학생의 독후감 '${r.bookTitle}'을(를) 삭제하시겠습니까?`)) {
                                onDeleteReport?.(r.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer ml-1"
                            title="독후감 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Summary, Quotes, and Thoughts if available */}
                      {r.summary && (
                        <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 text-slate-700">
                          <strong className="text-slate-900 block mb-0.5 font-bold">[줄거리 & 핵심 내용]</strong>
                          <p className="whitespace-pre-line">{r.summary}</p>
                        </div>
                      )}

                      {r.quotes && r.quotes.length > 0 && (
                        <div className="text-xs bg-amber-50/40 p-2.5 rounded-lg border border-amber-200/60 text-slate-700 space-y-1">
                          <strong className="text-slate-900 block font-bold">[인상 깊은 문장]</strong>
                          {r.quotes.map((q, qIdx) => (
                            <div key={qIdx} className="flex justify-between items-start gap-2 italic">
                              <span>"{q.quote}"</span>
                              {q.page && <span className="font-mono text-amber-800 shrink-0">{q.page}</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                        {r.thoughts || r.content}
                      </div>

                      {r.nextBook && (
                        <div className="text-[11px] text-slate-500">
                          🔖 다음에 읽고 싶은 책: <span className="text-slate-800 font-medium">{r.nextBook}</span>
                        </div>
                      )}

                      {/* Teacher AI summary & direct edit */}
                      {r.aiSummary ? (
                        <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50/90 border border-emerald-200/80 text-emerald-950 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1 text-[11px] text-emerald-800">
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              지도교사 생활기록부 추천 문안:
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingAiModal({ type: "report", item: r, text: r.aiSummary || "" })}
                                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                              >
                                <Pencil className="w-3 h-3" />
                                <span>직접 수정</span>
                              </button>
                              <span className="text-slate-300">·</span>
                              <button
                                type="button"
                                onClick={() => handleGenerateAiForReport(r)}
                                disabled={isGeneratingAi[`rep_${r.id}`]}
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                              >
                                {isGeneratingAi[`rep_${r.id}`] ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3 h-3" />
                                )}
                                <span>AI 재생성</span>
                              </button>
                            </div>
                          </div>
                          <p className="text-slate-800 leading-relaxed pl-4">{r.aiSummary}</p>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center justify-between p-2.5 bg-slate-100 rounded-lg text-xs">
                          <span className="text-slate-500 text-[11px]">생활기록부 추천 문안 미생성 상태입니다.</span>
                          <button
                            type="button"
                            onClick={() => handleGenerateAiForReport(r)}
                            disabled={isGeneratingAi[`rep_${r.id}`]}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold cursor-pointer shadow-xs"
                          >
                            {isGeneratingAi[`rep_${r.id}`] ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>생성 중...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3" />
                                <span>교사용 AI 생기부 요약 생성</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Discussions Section */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>💬 토론 참여 내역 ({filteredDiscussions.length}건)</span>
                </h3>
              </div>

              {filteredDiscussions.length === 0 ? (
                <p className="text-xs sm:text-sm text-slate-400 py-4 text-center">
                  참여한 토론 내역이 없습니다.
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredDiscussions.map((d) => (
                    <div
                      key={d.id}
                      className="post-item bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 hover:border-slate-300 transition-colors space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="font-semibold text-xs sm:text-sm text-slate-900">
                          <strong className="text-indigo-700 mr-1.5">
                            [{d.studentId} {d.studentName}]
                          </strong>
                          토론 의견
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>작성: {d.createdAt || d.date}</span>
                          </span>
                          {d.updatedAt && (
                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>수정: {d.updatedAt} (수정됨)</span>
                            </span>
                          )}
                          <span className="text-slate-400">• 댓글 {d.comments?.length || 0}개</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`'${d.studentName}' 학생의 토론 발제의견을 삭제하시겠습니까?`)) {
                                onDeleteDiscussion?.(d.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer ml-1"
                            title="토론 의견 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                        {d.content}
                      </div>

                      {d.comments && d.comments.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 space-y-1">
                          <span className="text-[11px] font-semibold text-slate-500">
                            댓글 목록 ({d.comments.length}개):
                          </span>
                          {d.comments.map((c) => (
                            <div
                              key={c.id}
                              className="text-[11px] text-slate-600 bg-white p-1.5 rounded border border-slate-200/50"
                            >
                              <strong>{c.studentName}:</strong> {c.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activities Section */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>🧭 외부 행사 및 체험 활동기록 수합 ({filteredActivities.length}건)</span>
                </h3>
                {query && (
                  <span className="text-xs text-blue-600 font-medium">
                    '{query}' 검색 결과
                  </span>
                )}
              </div>

              {filteredActivities.length === 0 ? (
                <p className="text-xs sm:text-sm text-slate-400 py-4 text-center">
                  등록된 외부 행사 및 체험 활동기록이 없습니다.
                </p>
              ) : (
                <div className="space-y-4">
                  {filteredActivities.map((act) => (
                    <div
                      key={act.id}
                      className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-200/60">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            {act.studentName} ({act.studentId})
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {act.activityType}
                          </span>
                          <span className="text-xs font-semibold text-slate-800">
                            {act.activityTitle}
                          </span>
                          {act.activityDate && (
                            <span className="text-[11px] text-slate-500">
                              (활동일: {act.activityDate})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col sm:items-end text-[11px] text-slate-400">
                            <span>작성: {act.createdAt || act.date}</span>
                            {act.updatedAt && (
                              <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                최종 수정: {act.updatedAt} (수정됨)
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`'${act.studentName}' 학생의 활동 '${act.activityTitle}'을(를) 삭제하시겠습니까?`)) {
                                onDeleteActivity?.(act.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer ml-1"
                            title="활동기록 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                        <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg">
                          <strong className="text-blue-900 block mb-0.5">💡 배운 점:</strong>
                          <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                            {act.learnedLessons}
                          </p>
                        </div>
                        <div className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-lg">
                          <strong className="text-emerald-900 block mb-0.5">💭 활동 느낀 점:</strong>
                          <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                            {act.reflections}
                          </p>
                        </div>
                      </div>

                      {/* Teacher AI summary & direct edit */}
                      {act.aiSummary ? (
                        <div className="p-2.5 bg-emerald-50/90 rounded-lg border border-emerald-200/80 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-emerald-900 flex items-center gap-1 text-[11px]">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              <span>지도교사 생활기록부 추천 문구:</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingAiModal({ type: "activity", item: act, text: act.aiSummary || "" })}
                                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                              >
                                <Pencil className="w-3 h-3" />
                                <span>직접 수정</span>
                              </button>
                              <span className="text-slate-300">·</span>
                              <button
                                type="button"
                                onClick={() => handleGenerateAiForActivity(act)}
                                disabled={isGeneratingAi[act.id]}
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                              >
                                {isGeneratingAi[act.id] ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3 h-3" />
                                )}
                                <span>AI 재생성</span>
                              </button>
                            </div>
                          </div>
                          <p className="text-slate-800 leading-relaxed pl-4">{act.aiSummary}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-100 rounded-lg text-xs border border-slate-200/60">
                          <span className="text-slate-500 text-[11px]">
                            💡 학생 화면에는 AI 요약이 노출되지 않습니다. 교사가 활동 내용을 검토한 후 문안을 생성할 수 있습니다.
                          </span>
                          <button
                            type="button"
                            onClick={() => handleGenerateAiForActivity(act)}
                            disabled={isGeneratingAi[act.id]}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                          >
                            {isGeneratingAi[act.id] ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>생성 중...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>교사용 AI 생기부 문구 자동 생성</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* SUBVIEW 2: Naver Form Survey View & Excel Export */}
        {activeSubView === "naverForm" && (
          <AdminNaverFormView
            reports={reports}
            activities={activities}
            discussions={discussions}
            clubInfo={clubInfo}
            onDeleteReport={onDeleteReport}
            onDeleteActivity={onDeleteActivity}
            onDeleteDiscussion={onDeleteDiscussion}
            onUpdateReport={onUpdateReport}
            onUpdateActivity={onUpdateActivity}
            onOpenAnthology={() => setShowAnthologyModal(true)}
          />
        )}

        {/* SUBVIEW 2: Student-by-Student Grouped Cards */}
        {activeSubView === "byStudent" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentList.map((student) => (
              <div
                key={student.studentId}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                      {student.studentName.slice(0, 1)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {student.studentId} {student.studentName}
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        독후감 {student.reports.length}편 · 활동 {student.activities.length}건 · 토론글{" "}
                        {student.discussions.length}편 · 댓글{" "}
                        {student.commentCount}개
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyNeis(student)}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg font-medium cursor-pointer"
                  >
                    {copiedStudent === student.studentId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">복사완료</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>생기부 복사</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 1. Reports */}
                <div className="space-y-2 text-xs">
                  <div className="font-semibold text-slate-700">
                    📚 완독 및 작성 도서 목록:
                  </div>
                  {student.reports.length === 0 ? (
                    <p className="text-slate-400 italic">제출된 독후감 없음</p>
                  ) : (
                    <ul className="space-y-1 pl-1">
                      {student.reports.map((r) => (
                        <li
                          key={r.id}
                          className="flex flex-col text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60"
                        >
                          <div className="flex items-center justify-between">
                            <strong>{r.bookTitle}</strong>
                            <span className="text-[10px] text-slate-400">
                              작성: {r.createdAt || r.date}
                            </span>
                          </div>
                          {r.updatedAt && (
                            <span className="text-[10px] text-amber-700 font-medium mt-0.5">
                              최종 수정: {r.updatedAt} (수정됨)
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 2. Activities */}
                {student.activities.length > 0 && (
                  <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
                    <div className="font-semibold text-slate-700 flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-emerald-600" />
                      <span>외부 행사 및 활동기록 ({student.activities.length}건):</span>
                    </div>
                    <ul className="space-y-1 pl-1">
                      {student.activities.map((a) => (
                        <li
                          key={a.id}
                          className="flex flex-col text-slate-700 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100"
                        >
                          <div className="flex items-center justify-between">
                            <strong>[{a.activityType}] {a.activityTitle}</strong>
                            <span className="text-[10px] text-slate-400">
                              작성: {a.createdAt || a.date}
                            </span>
                          </div>
                          {a.updatedAt && (
                            <span className="text-[10px] text-amber-700 font-medium mt-0.5">
                              최종 수정: {a.updatedAt} (수정됨)
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* SUBVIEW 3: NEIS 생기부 일괄 추출 양식 */}
        {activeSubView === "reportExport" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">
                  학교생활기록부(NEIS) 자율동아리 및 독서활동상황 발췌록
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                선생님께서 나이스(NEIS)에 바로 복사하여 기재하실 수 있도록 정제된 문안입니다.
              </span>
            </div>

            <div className="space-y-4">
              {studentList.map((student) => {
                const neisText = generateNeisFormat(student);

                return (
                  <div
                    key={student.studentId}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        학생: {student.studentId} {student.studentName}
                      </span>
                      <button
                        onClick={() => handleCopyNeis(student)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs font-medium cursor-pointer"
                      >
                        {copiedStudent === student.studentId ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>복사됨</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>문안 복사</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="font-sans whitespace-pre-wrap text-slate-700 bg-white p-3 rounded-lg border border-slate-200/80 leading-relaxed">
                      {neisText}
                    </pre>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Change Password Modal */}
      {showChangePwModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setShowChangePwModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  관리자 비밀번호 변경
                </h3>
              </div>
              <button
                onClick={() => setShowChangePwModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={newPwInput}
                  onChange={(e) => setNewPwInput(e.target.value)}
                  placeholder="새 비밀번호 입력"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPwInput}
                  onChange={(e) => setConfirmPwInput(e.target.value)}
                  placeholder="새 비밀번호 다시 입력"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                />
              </div>

              {pwChangeMessage && (
                <p
                  className={`text-xs font-medium p-2 rounded-lg ${
                    pwChangeMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {pwChangeMessage.text}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowChangePwModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  비밀번호 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher AI Summary Direct Edit Modal */}
      {editingAiModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    생기부 추천 문안 직접 수정
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingAiModal.item.studentName} 학생 ({editingAiModal.item.studentId})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAiModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-xs">
                <span className="font-semibold text-slate-700 block mb-0.5">활동 대상:</span>
                <span className="text-slate-900 font-medium">
                  {editingAiModal.type === "activity"
                    ? `[외부활동] ${editingAiModal.item.activityTitle}`
                    : `[독후감] ${editingAiModal.item.bookTitle}`}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  생활기록부 반영 문안 (NEIS 기재용)
                </label>
                <textarea
                  rows={4}
                  value={editingAiModal.text}
                  onChange={(e) =>
                    setEditingAiModal({ ...editingAiModal, text: e.target.value })
                  }
                  placeholder="생활기록부에 기재할 학생 맞춤형 관찰 기록을 작성하세요."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 leading-relaxed resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingAiModal(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveEditedAiModal}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                저장 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Anthology (Portfolio) Export Modal */}
      <AnthologyExportModal
        isOpen={showAnthologyModal}
        onClose={() => setShowAnthologyModal(false)}
        clubInfo={clubInfo}
        reports={reports}
        activities={activities}
        discussions={discussions}
      />

      {/* 🌟 GOOGLE SHEETS SETTINGS MODAL 🌟 */}
      {showSheetsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">구글 스프레드시트 연동 설정</h3>
                  <p className="text-xs text-slate-500">Google Apps Script 웹앱 URL 관리 및 전송 테스트</p>
                </div>
              </div>
              <button
                onClick={() => setShowSheetsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center justify-between">
                  <span>현재 배포된 구글 웹앱 URL (Exec URL)</span>
                  <span className="text-[11px] text-emerald-600 font-semibold">실시간 전송 대상</span>
                </label>
                <input
                  type="text"
                  value={sheetsUrlInput}
                  onChange={(e) => setSheetsUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveSheetsUrl}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                >
                  URL 저장
                </button>
                <button
                  type="button"
                  onClick={handleResetDefaultSheetsUrl}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  기본 연동 URL로 복원
                </button>
                <button
                  type="button"
                  onClick={handleTestSendRecord}
                  disabled={testSending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {testSending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>테스트 전송 중...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>1건 테스트 전송</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSyncAllToSheets}
                  disabled={isSyncingSheets}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  title="현재 사이트에 있는 모든 독서기록과 체험활동을 구글 시트로 일괄 재전송"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? "animate-spin" : ""}`} />
                  <span>시트로 전체 재전송</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold ${
                    testResult.startsWith("✅")
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}
                >
                  {testResult}
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3 text-xs text-slate-700">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>내 구글 스프레드시트는 어디서 보나요?</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  선생님의 구글 계정으로 <strong>[구글 드라이브]</strong>에 접속하시면 초록색 구글 스프레드시트 파일이 있습니다. 시트를 열면 하단에 <strong>[독후감_포트폴리오]</strong> 시트가 보이며, 학생들의 제출물이 한 줄씩 실시간으로 누적됩니다.
                </p>
                <div className="pt-1">
                  <a
                    href="https://drive.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-bold bg-emerald-100/60 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>구글 드라이브(drive.google.com) 바로 열기</span>
                  </a>
                </div>
              </div>

              {/* Troubleshooting Card: Why phone submissions don't show on PC */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 space-y-2.5 text-xs text-amber-950">
                <div className="font-bold flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px] font-black shrink-0">!</span>
                  <span>핸드폰에서 등록해도 컴퓨터에서 안 보이는 원인 & 30초 해결법</span>
                </div>
                <div className="space-y-2 text-[11px] text-amber-900/90 leading-relaxed pl-1">
                  <div>
                    <strong>1. 구글 배포 권한 확인 (가장 중요):</strong>
                    <br />
                    구글 시트 ➔ [확장 프로그램] ➔ [Apps Script] ➔ 우측 상단 [배포 관리] ➔ [수정]에서 <strong>[액세스 권한이 있는 사용자]</strong>가 반드시 <strong>[모든 사용자 (Anyone)]</strong>로 설정되어 있어야만 다른 기기(학생 폰)에서 보낸 데이터가 구글 시트에 들어옵니다. (※ '나만'으로 되어 있으면 구글이 폰의 전송을 차단합니다.)
                  </div>

                  {/* Unverified app warning explanation */}
                  <div className="bg-white/80 p-3 rounded-lg border border-amber-300">
                    <strong className="text-amber-950 flex items-center gap-1">
                      <span>⚠️ "구글은 이 앱을 인증하지 않았습니다" 창이 뜰 때 (정상 과정):</span>
                    </strong>
                    <p className="mt-1 text-[11px] text-amber-900 leading-relaxed">
                      구글이 직접 판매하는 상용 앱이 아니라 선생님 본인이 만든 개인 스크립트이기 때문에 구글 보안 시스템이 확인을 요청하는 정상 화면입니다!
                      <br />
                      👉 <strong>해결 순서:</strong> 화면 왼쪽 아래의 작은 글씨 <strong>[고급]</strong> 클릭 ➔ 아래에 펼쳐지는 <strong>[(안전하지 않음)으로 이동]</strong> 클릭 ➔ 다음 화면에서 <strong>[허용]</strong> 클릭하시면 정상 배포가 완료됩니다!
                    </p>
                  </div>

                  <div>
                    <strong>2. 컴퓨터에서 [시트에서 과제 불러오기] 클릭:</strong>
                    <br />
                    폰과 컴퓨터는 서로 다른 기기이므로, 구글 시트에 쌓인 과제를 컴퓨터 화면에 띄우시려면 관리자 상단 연동 바의 <strong>[📥 시트에서 과제 불러오기]</strong> 버튼을 한 번 눌러주셔야 합니다.
                  </div>
                  <div>
                    <strong>3. 가장 쉬운 대안:</strong>
                    <br />
                    구글 시트에서 [파일 ➔ 다운로드 ➔ Microsoft Excel(.xlsx)]을 누른 후, 상단의 <strong>[엑셀 파일/붙여넣기]</strong> 창에 파일을 쓱 끌어다 놓으시면 배포 설정 필요 없이 즉시 모든 학생의 글이 화면과 문집에 완성됩니다!
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSheetsModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 GOOGLE SHEETS / EXCEL IMPORT MODAL 🌟 */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">구글 시트 학생 명단 & 과제 등록</h3>
                  <p className="text-xs text-slate-500">표 복사/붙여넣기, 엑셀 파일 업로드, 또는 Apps Script 연동</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setImportTab("paste")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  importTab === "paste"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>📋 표 복사·붙여넣기</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded-full font-bold">추천</span>
              </button>

              <button
                onClick={() => setImportTab("excel")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  importTab === "excel"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>📁 엑셀 파일(.xlsx)</span>
              </button>

              <button
                onClick={() => setImportTab("script")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  importTab === "script"
                    ? "bg-white text-amber-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>⚡ Apps Script 코드</span>
              </button>
            </div>

            {/* Tab 1: Paste Window (복사·붙여넣기 창) */}
            {importTab === "paste" && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3.5 text-xs text-indigo-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                    <span>💡 구글 시트 복사·붙여넣기 방법 (가장 빠름!)</span>
                  </div>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    구글 스프레드시트의 <strong>[명단]</strong> 시트에서 <strong>연번, 반, 번호, 이름</strong> 열(또는 독후감 시트 행 전체)을 마우스로 쭉 드래그하여 <strong>Ctrl+C (복사)</strong>한 뒤 아래 상자에 <strong>Ctrl+V (붙여넣기)</strong> 하시면 됩니다.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>여기에 복사한 표를 붙여넣으세요 (Ctrl+V):</span>
                    </label>
                    {pasteText.trim() && (
                      <span className="text-[11px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                        {pasteText.trim().split("\n").length}줄 감지됨
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={8}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={`예시 1) 학생 명단 시트 복사 시:\n1\t1\t1\t강민준\n2\t1\t2\t김도현\n3\t1\t3\t박서준\n\n예시 2) 독서기록 시트 복사 시:\n2026.03.15\t1\t10101\t강민준\t데미안\t헤르만 헤세...`}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none shadow-inner"
                  />
                  <p className="text-[11px] text-slate-400">
                    * [연번, 반, 번호, 이름], [반, 번호, 이름], [학번, 이름] 형태를 모두 자동으로 분석하여 23명 학생 계정을 즉시 생성합니다.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setPasteText("")}
                    disabled={!pasteText}
                    className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-30"
                  >
                    내용 지우기
                  </button>
                  <button
                    onClick={handlePasteImport}
                    disabled={!pasteText.trim()}
                    id="btn-submit-paste"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-40"
                  >
                    🚀 붙여넣은 학생 명단 / 과제 등록하기
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Excel File (.xlsx) Upload */}
            {importTab === "excel" && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 text-xs text-emerald-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <span>📁 엑셀 파일(.xlsx)로 일괄 불러오기</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    구글 스프레드시트에서 <strong>[파일] ➔ [다운로드] ➔ [Microsoft Excel (.xlsx)]</strong>을 누른 후, 다운로드된 파일을 아래 상자에 넣으시면 모든 학생 명단과 독서기록이 웹사이트로 자동 연동됩니다.
                  </p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleExcelFileUpload(file);
                  }}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleExcelFileUpload(file);
                  }}
                  className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 rounded-2xl p-8 text-center cursor-pointer transition-colors space-y-2"
                >
                  <Upload className="w-9 h-9 text-emerald-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-800">엑셀(.xlsx) 파일을 여기로 드래그하거나 클릭하여 선택</p>
                  <p className="text-xs text-slate-400">구글 시트의 [명단] 시트와 [독후감_포트폴리오] 탭을 자동으로 인식합니다</p>
                </div>
              </div>
            )}

            {/* Tab 3: 1-Click Apps Script 2-Way Code Guide */}
            {importTab === "script" && (
              <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-black">3</span>
                    원클릭 완전 자동 동기화를 위한 Apps Script 업그레이드 (선택사항)
                  </span>
                  <button
                    onClick={() => {
                      const code = `function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var allSheets = ss.getSheets();
    var reports = [];
    var activities = [];
    var students = [];
    var studentMap = {};

    function findCol(headers, keywords) {
      for (var c = 0; c < headers.length; c++) {
        var h = String(headers[c] || "").trim().toLowerCase();
        for (var k = 0; k < keywords.length; k++) {
          if (h.indexOf(keywords[k].toLowerCase()) !== -1) return c;
        }
      }
      return -1;
    }

    // 1. 데이터 수합 시트 자동 탐색 (독후감_포트폴리오, 설문지 응답, 수합, 독서기록 또는 첫 번째 시트)
    var repSheet = null;
    for (var s = 0; s < allSheets.length; s++) {
      var sName = allSheets[s].getName();
      if (sName.indexOf("독후감") !== -1 || sName.indexOf("포트폴리오") !== -1 || sName.indexOf("수합") !== -1 || sName.indexOf("응답") !== -1 || sName.indexOf("독서") !== -1) {
        repSheet = allSheets[s];
        break;
      }
    }
    if (!repSheet && allSheets.length > 0) {
      repSheet = allSheets[0];
    }

    if (repSheet && repSheet.getLastRow() > 1) {
      var numCols = Math.max(repSheet.getLastColumn(), 18);
      var allRows = repSheet.getRange(1, 1, repSheet.getLastRow(), numCols).getValues();
      var headers = allRows[0];

      var cDate = findCol(headers, ["타임스탬프", "일시", "날짜", "date", "timestamp"]);
      var cId = findCol(headers, ["학번", "studentid", "id", "학생번호"]);
      var cName = findCol(headers, ["이름", "성명", "name", "학생명", "학생이름"]);
      var cTitle = findCol(headers, ["도서명", "책제목", "제목", "title", "book"]);
      var cAuthor = findCol(headers, ["저자", "지은이", "작가", "author"]);
      var cPublisher = findCol(headers, ["출판사", "publisher"]);
      var cPeriod = findCol(headers, ["기간", "독서기간", "읽은기간", "period"]);
      var cCategory = findCol(headers, ["분야", "카테고리", "갈래", "장르", "category"]);
      var cPages = findCol(headers, ["쪽수", "페이지", "page"]);
      var cRating = findCol(headers, ["평점", "별점", "rating"]);
      var cStatus = findCol(headers, ["상태", "완독", "완독여부", "status"]);
      var cSummary = findCol(headers, ["줄거리", "요약", "핵심내용", "summary"]);
      var cQuotes = findCol(headers, ["인상", "구절", "문장", "발췌", "quote"]);
      var cThoughts = findCol(headers, ["느낀점", "생각", "감상", "소감", "thoughts"]);
      var cNext = findCol(headers, ["다음", "추천", "next"]);
      var cImage = findCol(headers, ["표지", "이미지", "사진", "image"]);

      if (cId === -1 && headers.length > 2) cId = 2;
      if (cName === -1 && headers.length > 3) cName = 3;
      if (cTitle === -1 && headers.length > 4) cTitle = 4;

      for (var i = 1; i < allRows.length; i++) {
        var r = allRows[i];
        var sId = cId !== -1 ? String(r[cId] || "").trim() : "";
        var sName = cName !== -1 ? String(r[cName] || "").trim() : "";
        var bTitle = cTitle !== -1 ? String(r[cTitle] || "").trim() : "";
        if (!sName && !bTitle) continue;

        if (sName) {
          var cleanId = sId || ("S" + (i < 10 ? "0" + i : i));
          if (!studentMap[cleanId]) {
            var idDigits = cleanId.replace(/\\D/g, "");
            var pw = idDigits.length >= 4 ? idDigits.slice(-4) : "1234";
            studentMap[cleanId] = { studentId: cleanId, studentName: sName, password: pw };
          }
        }

        reports.push({
          id: new Date().getTime() + i,
          logNo: String(i),
          studentId: sId,
          studentName: sName,
          bookTitle: bTitle,
          author: cAuthor !== -1 ? String(r[cAuthor] || "") : "",
          publisher: cPublisher !== -1 ? String(r[cPublisher] || "") : "",
          readingPeriod: cPeriod !== -1 ? String(r[cPeriod] || "") : "",
          category: cCategory !== -1 ? String(r[cCategory] || "문학") : "문학",
          pageCount: cPages !== -1 ? String(r[cPages] || "") : "",
          rating: cRating !== -1 ? (Number(r[cRating]) || 5) : 5,
          readStatus: cStatus !== -1 ? String(r[cStatus] || "완독") : "완독",
          summary: cSummary !== -1 ? String(r[cSummary] || "") : "",
          quotes: cQuotes !== -1 && r[cQuotes] ? [{ quote: String(r[cQuotes]), page: "" }] : [],
          thoughts: cThoughts !== -1 ? String(r[cThoughts] || "") : "",
          content: cThoughts !== -1 ? String(r[cThoughts] || "") : "",
          nextBook: cNext !== -1 ? String(r[cNext] || "") : "",
          image: cImage !== -1 ? String(r[cImage] || "") : "",
          date: cDate !== -1 && r[cDate] ? String(r[cDate]).slice(0, 10) : new Date().toISOString().slice(0, 10)
        });
      }
    }

    // 2. 별도 학생 명단 시트 탐색 (명단, 명렬, 학생, 부원 시트)
    for (var sIdx = 0; sIdx < allSheets.length; sIdx++) {
      var sht = allSheets[sIdx];
      if (sht === repSheet) continue;
      var title = sht.getName();
      if (title.indexOf("명단") !== -1 || title.indexOf("명렬") !== -1 || title.indexOf("학생") !== -1 || title.indexOf("부원") !== -1 || title.indexOf("회원") !== -1) {
        if (sht.getLastRow() > 1) {
          var rData = sht.getRange(1, 1, sht.getLastRow(), Math.max(sht.getLastColumn(), 6)).getValues();
          var rHeaders = rData[0];
          var rcId = findCol(rHeaders, ["학번", "studentid", "id"]);
          var rcName = findCol(rHeaders, ["이름", "성명", "name"]);
          var rcPw = findCol(rHeaders, ["비밀번호", "비번", "암호", "pw"]);
          var rcClass = findCol(rHeaders, ["반", "학급"]);
          var rcNum = findCol(rHeaders, ["번호"]);
          var rcGrade = findCol(rHeaders, ["학년"]);

          for (var j = 1; j < rData.length; j++) {
            var row = rData[j];
            var nameVal = rcName !== -1 ? String(row[rcName] || "").trim() : "";
            if (!nameVal) continue;
            var idVal = rcId !== -1 ? String(row[rcId] || "").trim() : "";
            if (!idVal && rcClass !== -1 && rcNum !== -1) {
              var cls = String(row[rcClass] || "").replace(/\\D/g, "");
              var num = String(row[rcNum] || "").replace(/\\D/g, "");
              var grd = rcGrade !== -1 ? String(row[rcGrade] || "").replace(/\\D/g, "") : "";
              if (cls && num) {
                var numPad = num.length < 2 ? "0" + num : num;
                var clsPad = cls.length < 2 ? "0" + cls : cls;
                idVal = (grd ? grd : "") + clsPad + numPad;
              }
            }
            if (!idVal && row[0]) idVal = String(row[0]).trim();
            if (!idVal) idVal = "S" + (j < 10 ? "0" + j : j);

            var pwVal = rcPw !== -1 ? String(row[rcPw] || "").trim() : "";
            if (!pwVal) {
              var digits = idVal.replace(/\\D/g, "");
              pwVal = digits.length >= 4 ? digits.slice(-4) : "1234";
            }
            studentMap[idVal] = { studentId: idVal, studentName: nameVal, password: pwVal };
          }
        }
      }
    }

    for (var k in studentMap) {
      students.push(studentMap[k]);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", reports: reports, activities: activities, students: students, totalStudents: students.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
                      navigator.clipboard.writeText(code);
                      setCopiedGasCode(true);
                      setTimeout(() => setCopiedGasCode(false), 3000);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] bg-amber-200/80 hover:bg-amber-300 text-amber-900 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    {copiedGasCode ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedGasCode ? "코드 복사됨!" : "doGet 스크립트 복사"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-amber-900/80 leading-relaxed">
                  스프레드시트 [확장 프로그램] ➔ [Apps Script]에서 위 코드를 붙여넣고 [새 배포]를 한 번만 해주시면, 파일 다운로드 없이도 <strong>[시트에서 과제 불러오기]</strong> 버튼 하나로 실시간 자동 동기화됩니다.
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
