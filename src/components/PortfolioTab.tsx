import React, { useState, useRef, useMemo, useEffect } from "react";
import { BookReport, BookQuote, StudentUser } from "../types";
import {
  BookOpen,
  X,
  Heart,
  Trash2,
  Calendar,
  User,
  Filter,
  Search,
  Pencil,
  Clock,
  Star,
  Plus,
  Trophy,
  Flame,
  CheckCircle2,
  BookmarkCheck,
  Tag,
  FileText,
  Layers,
  ChevronRight,
  Sparkles,
  Lock,
} from "lucide-react";

interface PortfolioTabProps {
  reports: BookReport[];
  onSaveReport: (report: Omit<BookReport, "id" | "date" | "likes">) => void;
  onUpdateReport: (report: BookReport) => void;
  onDeleteReport: (id: string | number) => void;
  onLikeReport: (id: string | number) => void;
  currentStudent?: StudentUser | null;
}

const CATEGORY_OPTIONS = [
  "에세이",
  "소설",
  "인문",
  "과학",
  "사회",
  "철학",
  "예술 / 문화",
  "역사",
  "시 / 희곡",
  "기타",
];

const READ_STATUS_OPTIONS: Array<"완독" | "읽는 중" | "중단"> = [
  "완독",
  "읽는 중",
  "중단",
];

// Helper to parse "YYYY. MM. DD." into Date or comparable string
const parseReportDate = (dateStr: string): Date => {
  const clean = dateStr.replace(/\./g, "").trim();
  const parts = clean.split(/\s+/).map((p) => parseInt(p, 10));
  if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date();
};

export const PortfolioTab: React.FC<PortfolioTabProps> = ({
  reports,
  onSaveReport,
  onUpdateReport,
  onDeleteReport,
  onLikeReport,
  currentStudent = null,
}) => {
  // ----------------------------------------------------
  // Form States (Matching the Reading Log PDF Template)
  // ----------------------------------------------------
  const [logNo, setLogNo] = useState("");
  const [studentId, setStudentId] = useState(currentStudent ? currentStudent.studentId : "");
  const [studentName, setStudentName] = useState(currentStudent ? currentStudent.studentName : "");
  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [readingPeriod, setReadingPeriod] = useState("");
  const [category, setCategory] = useState("소설");
  const [customCategory, setCustomCategory] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [readStatus, setReadStatus] = useState<"완독" | "읽는 중" | "중단">("완독");
  const [summary, setSummary] = useState("");
  const [quotes, setQuotes] = useState<BookQuote[]>([
    { quote: "", page: "" },
    { quote: "", page: "" },
  ]);
  const [thoughts, setThoughts] = useState("");
  const [nextBook, setNextBook] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----------------------------------------------------
  // Filter & Search & View Modes
  // ----------------------------------------------------
  const [filterStudentId, setFilterStudentId] = useState<string>(
    currentStudent ? currentStudent.studentId : "ALL"
  );
  const [filterPeriod, setFilterPeriod] = useState<"ALL" | "THIS_WEEK" | "THIS_MONTH">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  // Synchronize when currentStudent changes
  useEffect(() => {
    if (currentStudent) {
      setStudentId(currentStudent.studentId);
      setStudentName(currentStudent.studentName);
      setFilterStudentId(currentStudent.studentId);
    }
  }, [currentStudent]);

  // ----------------------------------------------------
  // Edit Report Modal States
  // ----------------------------------------------------
  const [editingReport, setEditingReport] = useState<BookReport | null>(null);
  const [editLogNo, setEditLogNo] = useState("");
  const [editBookTitle, setEditBookTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editPublisher, setEditPublisher] = useState("");
  const [editReadingPeriod, setEditReadingPeriod] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPageCount, setEditPageCount] = useState("");
  const [editRating, setEditRating] = useState<number>(5);
  const [editReadStatus, setEditReadStatus] = useState<"완독" | "읽는 중" | "중단">("완독");
  const [editSummary, setEditSummary] = useState("");
  const [editQuotes, setEditQuotes] = useState<BookQuote[]>([]);
  const [editThoughts, setEditThoughts] = useState("");
  const [editNextBook, setEditNextBook] = useState("");
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Quote row handlers (Create Form)
  const handleAddQuoteRow = () => {
    setQuotes((prev) => [...prev, { quote: "", page: "" }]);
  };

  const handleRemoveQuoteRow = (index: number) => {
    setQuotes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuoteChange = (
    index: number,
    field: "quote" | "page",
    value: string
  ) => {
    setQuotes((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  // Image Upload Handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 첨부할 수 있습니다.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("이미지 용량은 5MB 이하로 업로드해주세요.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId.trim() || !studentName.trim()) {
      alert("학번과 이름을 모두 입력해주세요. (예: 20101 홍길동)");
      return;
    }
    if (!bookTitle.trim()) {
      alert("책 제목을 입력해주세요.");
      return;
    }
    if (!summary.trim() && !thoughts.trim()) {
      alert("줄거리 & 핵심 내용 또는 나의 생각 · 느낀 점 중 하나 이상을 입력해주세요.");
      return;
    }

    const effectiveCategory =
      category === "기타" && customCategory.trim()
        ? customCategory.trim()
        : category;

    // Filter out empty quotes
    const cleanedQuotes = quotes.filter((q) => q.quote.trim().length > 0);

    // Build unified content string for backward compatibility
    const unifiedContent = [
      summary.trim() ? `[줄거리 & 핵심 내용]\n${summary.trim()}` : "",
      cleanedQuotes.length > 0
        ? `[인상 깊은 문장]\n` +
          cleanedQuotes
            .map((q) => `"${q.quote.trim()}"${q.page ? ` (${q.page.trim()})` : ""}`)
            .join("\n")
        : "",
      thoughts.trim() ? `[나의 생각 · 느낀 점]\n${thoughts.trim()}` : "",
      nextBook.trim() ? `[다음에 읽고 싶은 책] ${nextBook.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    onSaveReport({
      logNo: logNo.trim() || undefined,
      studentId: studentId.trim(),
      studentName: studentName.trim(),
      bookTitle: bookTitle.trim(),
      author: author.trim() || undefined,
      publisher: publisher.trim() || undefined,
      readingPeriod: readingPeriod.trim() || undefined,
      category: effectiveCategory,
      pageCount: pageCount.trim() || undefined,
      rating,
      readStatus,
      summary: summary.trim(),
      quotes: cleanedQuotes,
      thoughts: thoughts.trim(),
      nextBook: nextBook.trim() || undefined,
      content: unifiedContent || thoughts.trim() || summary.trim(),
      aiSummary: "",
      keywords: [],
      image: imagePreview,
    });

    // Reset Form
    setLogNo("");
    setBookTitle("");
    setAuthor("");
    setPublisher("");
    setReadingPeriod("");
    setPageCount("");
    setRating(5);
    setReadStatus("완독");
    setSummary("");
    setQuotes([
      { quote: "", page: "" },
      { quote: "", page: "" },
    ]);
    setThoughts("");
    setNextBook("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!currentStudent) {
      setStudentId("");
      setStudentName("");
    } else {
      setStudentId(currentStudent.studentId);
      setStudentName(currentStudent.studentName);
    }

    alert("독후감(월간 독서 기록)이 오늘 올린 날짜 포트폴리오에 성공적으로 등록되었습니다!");
  };

  // ----------------------------------------------------
  // Edit Modal Operations
  // ----------------------------------------------------
  const openEditModal = (report: BookReport) => {
    setEditingReport(report);
    setEditLogNo(report.logNo || "");
    setEditBookTitle(report.bookTitle || "");
    setEditAuthor(report.author || "");
    setEditPublisher(report.publisher || "");
    setEditReadingPeriod(report.readingPeriod || "");
    setEditCategory(report.category || "소설");
    setEditPageCount(report.pageCount ? String(report.pageCount) : "");
    setEditRating(report.rating || 5);
    setEditReadStatus(report.readStatus || "완독");
    setEditSummary(report.summary || "");
    setEditQuotes(
      report.quotes && report.quotes.length > 0
        ? report.quotes
        : [{ quote: "", page: "" }]
    );
    setEditThoughts(report.thoughts || report.content || "");
    setEditNextBook(report.nextBook || "");
    setEditImagePreview(report.image || null);
  };

  const closeEditModal = () => {
    setEditingReport(null);
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 첨부할 수 있습니다.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;
    if (!editBookTitle.trim()) {
      alert("책 제목을 입력해주세요.");
      return;
    }

    const cleanedQuotes = editQuotes.filter((q) => q.quote.trim().length > 0);
    const unifiedContent = [
      editSummary.trim() ? `[줄거리 & 핵심 내용]\n${editSummary.trim()}` : "",
      cleanedQuotes.length > 0
        ? `[인상 깊은 문장]\n` +
          cleanedQuotes
            .map((q) => `"${q.quote.trim()}"${q.page ? ` (${q.page.trim()})` : ""}`)
            .join("\n")
        : "",
      editThoughts.trim() ? `[나의 생각 · 느낀 점]\n${editThoughts.trim()}` : "",
      editNextBook.trim() ? `[다음에 읽고 싶은 책] ${editNextBook.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    onUpdateReport({
      ...editingReport,
      logNo: editLogNo.trim() || undefined,
      bookTitle: editBookTitle.trim(),
      author: editAuthor.trim() || undefined,
      publisher: editPublisher.trim() || undefined,
      readingPeriod: editReadingPeriod.trim() || undefined,
      category: editCategory,
      pageCount: editPageCount.trim() || undefined,
      rating: editRating,
      readStatus: editReadStatus,
      summary: editSummary.trim(),
      quotes: cleanedQuotes,
      thoughts: editThoughts.trim(),
      nextBook: editNextBook.trim() || undefined,
      content: unifiedContent || editThoughts.trim() || editSummary.trim(),
      image: editImagePreview,
    });

    closeEditModal();
    alert("독후감 내용이 성공적으로 수정되었습니다.");
  };

  // ----------------------------------------------------
  // Weekly Challenge Calculation (Minimum 3 posts / week)
  // ----------------------------------------------------
  // Calculate current week (Monday to Sunday) based on reference/local date
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0: Sun, 1: Mon, ...
  const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const mondayThisWeek = new Date(now);
  mondayThisWeek.setDate(now.getDate() + distanceToMonday);
  mondayThisWeek.setHours(0, 0, 0, 0);

  const sundayThisWeek = new Date(mondayThisWeek);
  sundayThisWeek.setDate(mondayThisWeek.getDate() + 6);
  sundayThisWeek.setHours(23, 59, 59, 999);

  // Filter distinct students
  const uniqueStudents = Array.from(
    new Set(reports.map((r) => `${r.studentId} ${r.studentName}`))
  );

  // Active student for challenge badge calculation
  const challengeStudent =
    currentStudent
      ? `${currentStudent.studentId} ${currentStudent.studentName}`
      : filterStudentId !== "ALL"
      ? filterStudentId
      : studentId && studentName
      ? `${studentId.trim()} ${studentName.trim()}`
      : uniqueStudents[0] || "";

  // Student's total reports count
  const myReportsCount = useMemo(() => {
    if (!currentStudent) return 0;
    return reports.filter(
      (r) =>
        r.studentId.trim() === currentStudent.studentId.trim() ||
        r.studentName.trim() === currentStudent.studentName.trim()
    ).length;
  }, [reports, currentStudent]);

  // Student's reports this week
  const studentWeeklyReports = useMemo(() => {
    if (!challengeStudent) return [];
    return reports.filter((r) => {
      const isStudent =
        `${r.studentId} ${r.studentName}` === challengeStudent ||
        (currentStudent && (r.studentId === currentStudent.studentId || r.studentName === currentStudent.studentName));
      if (!isStudent) return false;
      const rDate = parseReportDate(r.date || r.createdAt || "");
      return rDate >= mondayThisWeek && rDate <= sundayThisWeek;
    });
  }, [reports, challengeStudent, currentStudent, mondayThisWeek, sundayThisWeek]);

  const weeklyGoal = 3;
  const currentCount = studentWeeklyReports.length;
  const isGoalAchieved = currentCount >= weeklyGoal;

  // ----------------------------------------------------
  // Grouping by UPLOAD DATE (올린 날짜별로 포트폴리오 정렬 및 그룹화)
  // ----------------------------------------------------
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // Student filter
      let studentMatch = true;
      if (filterStudentId !== "ALL") {
        studentMatch =
          r.studentId.trim() === filterStudentId.trim() ||
          `${r.studentId} ${r.studentName}`.trim() === filterStudentId.trim() ||
          r.studentName.trim() === filterStudentId.trim();
      }

      // Period filter
      let periodMatch = true;
      const rDate = parseReportDate(r.date || r.createdAt || "");
      if (filterPeriod === "THIS_WEEK") {
        periodMatch = rDate >= mondayThisWeek && rDate <= sundayThisWeek;
      } else if (filterPeriod === "THIS_MONTH") {
        periodMatch =
          rDate.getFullYear() === now.getFullYear() &&
          rDate.getMonth() === now.getMonth();
      }

      // Search query
      const query = searchQuery.toLowerCase().trim();
      const queryMatch =
        !query ||
        r.bookTitle.toLowerCase().includes(query) ||
        (r.author && r.author.toLowerCase().includes(query)) ||
        (r.publisher && r.publisher.toLowerCase().includes(query)) ||
        (r.category && r.category.toLowerCase().includes(query)) ||
        (r.summary && r.summary.toLowerCase().includes(query)) ||
        (r.thoughts && r.thoughts.toLowerCase().includes(query)) ||
        r.content.toLowerCase().includes(query) ||
        r.studentName.toLowerCase().includes(query) ||
        r.studentId.includes(query);

      return studentMatch && periodMatch && queryMatch;
    });
  }, [reports, filterStudentId, filterPeriod, searchQuery, mondayThisWeek, sundayThisWeek]);

  // Group by upload date string (e.g. "2026. 09. 16.") in descending order
  const groupedByDate = useMemo(() => {
    // Sort reports by createdAt or date descending
    const sorted = [...filteredReports].sort((a, b) => {
      const dateA = a.createdAt || a.date || "";
      const dateB = b.createdAt || b.date || "";
      return dateB.localeCompare(dateA);
    });

    const groups: { [dateStr: string]: BookReport[] } = {};
    sorted.forEach((report) => {
      const dateKey = report.date || report.createdAt?.split(" ")[0] || "날짜 미상";
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(report);
    });

    return Object.entries(groups).map(([dateKey, items]) => ({
      date: dateKey,
      items,
    }));
  }, [filteredReports]);

  return (
    <div className="space-y-7 max-w-5xl mx-auto">
      {/* ==================================================== */}
      {/* 1. Weekly 3-Posts Challenge Banner (주 최소 3회 독서기록 올리기) */}
      {/* ==================================================== */}
      <section
        id="weekly-reading-challenge"
        className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-5 sm:p-6 text-white shadow-md"
      >
        {/* Background graphic motif */}
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-6 opacity-15 pointer-events-none">
          <BookOpen className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-amber-100 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              <span>동아리 필수 미션 · 주 최소 3회 독후감 올리기</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight flex items-center gap-2">
              <span>📚 이번 주 독서기록 챌린지 (주 3회 등록)</span>
              {isGoalAchieved && (
                <span className="inline-flex items-center gap-1 bg-yellow-400 text-amber-950 text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                  <Trophy className="w-3.5 h-3.5" /> 목표 달성!
                </span>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-amber-100/95 leading-relaxed">
              모든 동아리원은 책을 읽고 일주일에 최소 3번 독후감 탭에 게시글을
              작성하여 포트폴리오를 누적합니다.
            </p>
          </div>

          {/* Student Progress Badge */}
          <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 sm:p-4 min-w-[260px] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-amber-100 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {challengeStudent || "학생을 선택하세요"}
              </span>
              <span className="text-white font-bold text-sm">
                {currentCount} / {weeklyGoal}회 ({Math.min(100, Math.round((currentCount / weeklyGoal) * 100))}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isGoalAchieved ? "bg-yellow-300" : "bg-white"
                }`}
                style={{ width: `${Math.min(100, (currentCount / weeklyGoal) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-amber-100 pt-0.5">
              {isGoalAchieved ? (
                <span className="font-bold text-yellow-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-yellow-300" />
                  이번 주 3회 등록 완주 성공!
                </span>
              ) : (
                <span>
                  🔥 앞으로 <strong>{weeklyGoal - currentCount}회</strong> 더 올리면
                  이번 주 목표 달성!
                </span>
              )}
              <span className="opacity-75">월~일 기준</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* 2. Reading Log Form (첨부 파일 PDF 서식 100% 반영) */}
      {/* ==================================================== */}
      <section
        id="reading-log-form-section"
        className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 shadow-sm space-y-6"
      >
        {/* Form Paper Header (Reading Log · 월간 독서 기록) */}
        <div className="border-b-2 border-slate-800 pb-4 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-bold text-[11px]">
                READING LOG
              </span>
              <span className="text-slate-700 font-bold">월간 독서 기록</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">No.</span>
              <input
                type="text"
                value={logNo}
                onChange={(e) => setLogNo(e.target.value)}
                placeholder="예: 01"
                className="w-20 px-2.5 py-1 text-xs bg-slate-50 border-b-2 border-slate-300 focus:border-slate-800 focus:outline-none text-slate-900 font-mono font-bold text-center"
              />
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              이달의 책
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-serif italic mt-0.5">
              한 달에 한 권, 오늘 덮은 책을 남겨두는 기록장
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Info Inputs */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="user-id"
                  className="block text-xs font-bold text-slate-700"
                >
                  작성자 학번 <span className="text-rose-500">*</span>
                </label>
                {currentStudent && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                    <Lock className="w-2.5 h-2.5" /> 본인 인증 완료
                  </span>
                )}
              </div>
              <input
                id="user-id"
                type="text"
                readOnly={!!currentStudent}
                placeholder="예: 20101 (2학년 1반 1번)"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none ${
                  currentStudent
                    ? "bg-slate-100 border-slate-200 text-slate-800 font-bold cursor-not-allowed"
                    : "bg-white border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="user-name"
                  className="block text-xs font-bold text-slate-700"
                >
                  작성자 성명 <span className="text-rose-500">*</span>
                </label>
                {currentStudent && (
                  <span className="text-[10px] font-semibold text-slate-500">
                    자동 연동됨
                  </span>
                )}
              </div>
              <input
                id="user-name"
                type="text"
                readOnly={!!currentStudent}
                placeholder="예: 김민서"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none ${
                  currentStudent
                    ? "bg-slate-100 border-slate-200 text-slate-800 font-bold cursor-not-allowed"
                    : "bg-white border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                }`}
              />
            </div>
          </div>

          {/* Book Title */}
          <div>
            <label
              htmlFor="book-title"
              className="block text-xs font-bold text-slate-800 mb-1.5"
            >
              책 제목 <span className="text-rose-500">*</span>
            </label>
            <input
              id="book-title"
              type="text"
              placeholder="예: 멋진 신세계, 정의란 무엇인가, 클라라와 태양"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm sm:text-base font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:bg-white transition-all"
            />
          </div>

          {/* Author & Publisher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="book-author"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                저자 · 옮긴이
              </label>
              <input
                id="book-author"
                type="text"
                placeholder="예: 올더스 헉슬리 · 이덕형 옮김"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="book-publisher"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                출판사
              </label>
              <input
                id="book-publisher"
                type="text"
                placeholder="예: 민음사, 문예출판사, 창비"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Reading Period & Category & Page Count */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="reading-period"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                읽은 기간
              </label>
              <input
                id="reading-period"
                type="text"
                placeholder="예: 9.3 ~ 9.28"
                value={readingPeriod}
                onChange={(e) => setReadingPeriod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="book-category"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                분야 (에세이 / 소설 / 인문 등)
              </label>
              <select
                id="book-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white font-medium"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {category === "기타" && (
                <input
                  type="text"
                  placeholder="분야 직접 입력"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-1.5 w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              )}
            </div>

            <div>
              <label
                htmlFor="page-count"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                쪽수
              </label>
              <div className="relative">
                <input
                  id="page-count"
                  type="text"
                  placeholder="예: 320"
                  value={pageCount}
                  onChange={(e) => setPageCount(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                  쪽
                </span>
              </div>
            </div>
          </div>

          {/* Rating & Read Status (별점 및 완독 여부) */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Star Rating */}
            <div>
              <span className="block text-xs font-bold text-slate-800 mb-1.5">
                별점 (해당 별에 클릭하여 표시)
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 rounded-lg hover:scale-115 transition-transform cursor-pointer"
                    title={`${star}점`}
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        star <= rating
                          ? "fill-amber-400 text-amber-500"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-extrabold text-amber-900">
                  {rating} / 5점
                </span>
              </div>
            </div>

            {/* Read Status (완독 여부) */}
            <div>
              <span className="block text-xs font-bold text-slate-800 mb-1.5">
                완독 여부 (해당 항목 선택)
              </span>
              <div className="flex items-center gap-3">
                {READ_STATUS_OPTIONS.map((status) => (
                  <label
                    key={status}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      readStatus === status
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="read-status"
                      value={status}
                      checked={readStatus === status}
                      onChange={() => setReadStatus(status)}
                      className="sr-only"
                    />
                    <span>{readStatus === status ? "☑" : "☐"}</span>
                    <span>{status}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 줄거리 & 핵심 내용 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="book-summary"
                className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-slate-700" />
                <span>줄거리 & 핵심 내용</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {summary.length}자
              </span>
            </div>
            <textarea
              id="book-summary"
              rows={4}
              placeholder="책의 전체적인 전개, 중심 갈등 및 핵심 주제를 자유롭게 정리해 보세요."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white resize-y"
            />
          </div>

          {/* 인상 깊은 문장 (문장과 쪽수를 함께 적어두면 나중에 찾기 쉬워요) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <BookmarkCheck className="w-4 h-4 text-amber-600" />
                  <span>인상 깊은 문장</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  문장과 쪽수를 함께 적어두면 나중에 찾기 쉬워요.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddQuoteRow}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>구절 추가</span>
              </button>
            </div>

            <div className="space-y-2">
              {quotes.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus-within:border-amber-500 focus-within:bg-white transition-all"
                >
                  <span className="text-xs font-bold text-slate-400 w-5 text-center">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    placeholder="인상 깊었던 문장을 입력하세요"
                    value={q.quote}
                    onChange={(e) =>
                      handleQuoteChange(idx, "quote", e.target.value)
                    }
                    className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 focus:outline-none"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-slate-400">p.</span>
                    <input
                      type="text"
                      placeholder="쪽수"
                      value={q.page?.replace(/^p\./i, "") || ""}
                      onChange={(e) =>
                        handleQuoteChange(
                          idx,
                          "page",
                          e.target.value ? `p.${e.target.value.replace(/^p\./i, "")}` : ""
                        )
                      }
                      className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono text-center focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  {quotes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuoteRow(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                      title="구절 삭제"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 나의 생각 · 느낀 점 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="book-thoughts"
                className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>나의 생각 · 느낀 점 <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[11px] text-slate-400">
                {thoughts.length}자
              </span>
            </div>
            <textarea
              id="book-thoughts"
              rows={5}
              placeholder="책을 읽고 내 삶에 비추어 느낀 점, 새롭게 갖게 된 생각, 동아리 부원들과 나누고 싶은 성찰을 적어주세요."
              value={thoughts}
              onChange={(e) => setThoughts(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white resize-y"
            />
          </div>

          {/* 다음에 읽고 싶은 책 */}
          <div>
            <label
              htmlFor="next-book"
              className="block text-xs font-bold text-slate-800 mb-1.5"
            >
              다음에 읽고 싶은 책
            </label>
            <input
              id="next-book"
              type="text"
              placeholder="예: 《1984》 - 조지 오웰, 《공정하다는 착각》 - 마이클 샌델"
              value={nextBook}
              onChange={(e) => setNextBook(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white"
            />
          </div>

          {/* Photo Attachment */}
          <div className="pt-1">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              도서 표지 또는 독서 노트 필사 인증샷 (선택)
            </label>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <input
                ref={fileInputRef}
                id="book-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
              />

              {imagePreview && (
                <div className="relative inline-flex items-center gap-2 bg-slate-100 p-1.5 pr-3 rounded-xl border border-slate-200">
                  <img
                    src={imagePreview}
                    alt="첨부 미리보기"
                    className="w-10 h-10 object-cover rounded-lg"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    사진 첨부 완료
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="btn-save-report"
            type="submit"
            className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>월간 독서 기록 포트폴리오에 저장하기 (올린 날짜 자동 반영)</span>
          </button>
        </form>
      </section>

      {/* ==================================================== */}
      {/* 3. Accumulated Portfolio: Grouped by Upload Date (올린 날짜별 포트폴리오) */}
      {/* ==================================================== */}
      <section
        id="date-accumulated-portfolio"
        className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6"
      >
        {/* Section Header with Date & Student Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base">
                📅
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  올린 날짜별 독후감 누적 포트폴리오
                </h3>
                <p className="text-xs text-slate-500">
                  총 {filteredReports.length}건의 독서 기록이 등록 날짜별 타임라인으로 정렬되어 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Student Toggle when authenticated */}
            {currentStudent && (
              <div className="flex items-center bg-blue-50/90 rounded-xl p-1 text-xs border border-blue-200">
                <button
                  type="button"
                  onClick={() => setFilterStudentId(currentStudent.studentId)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterStudentId === currentStudent.studentId || filterStudentId === `${currentStudent.studentId} ${currentStudent.studentName}`
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>내 독서기록</span>
                  <span className="bg-blue-700 text-white px-1.5 py-0.2 rounded-full text-[10px]">
                    {myReportsCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStudentId("ALL")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    filterStudentId === "ALL"
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  동아리 전체 서재
                </button>
              </div>
            )}

            {/* Period Filter (이번 주 최소 3회 확인용) */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs border border-slate-200">
              <button
                type="button"
                onClick={() => setFilterPeriod("ALL")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filterPeriod === "ALL"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                전체 날짜
              </button>
              <button
                type="button"
                onClick={() => setFilterPeriod("THIS_WEEK")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  filterPeriod === "THIS_WEEK"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Flame className="w-3 h-3" /> 이번 주 기록
              </button>
              <button
                type="button"
                onClick={() => setFilterPeriod("THIS_MONTH")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filterPeriod === "THIS_MONTH"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                이번 달
              </button>
            </div>

            {/* Student Filter */}
            <div className="flex items-center bg-slate-100 rounded-xl px-3 py-1.5 text-xs border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
              <select
                id="filter-student-select"
                value={filterStudentId}
                onChange={(e) => setFilterStudentId(e.target.value)}
                className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">전체 학생 기록</option>
                {uniqueStudents.map((s, idx) => (
                  <option key={idx} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="도서명 / 작성자 / 키워드 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs w-44 sm:w-52 focus:outline-none focus:bg-white focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Date Grouped Timeline View */}
        <div id="date-grouped-list" className="space-y-8">
          {groupedByDate.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                선택한 조건에 해당하는 독후감 기록이 없습니다.
              </p>
              <p className="text-xs text-slate-400">
                상단의 독서기록 양식을 작성하여 이번 주 독서기록을 남겨보세요!
              </p>
            </div>
          ) : (
            groupedByDate.map((group) => (
              <div key={group.date} className="space-y-4">
                {/* Date Header Anchor */}
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs sm:text-sm font-bold shadow-xs">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>올린 날짜: {group.date}</span>
                  </div>
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {group.items.length}편 등록됨
                  </span>
                </div>

                {/* Reports under this date */}
                <div className="grid grid-cols-1 gap-5">
                  {group.items.map((report) => (
                    <article
                      key={report.id}
                      id={`report-item-${report.id}`}
                      className="relative bg-white rounded-2xl border border-slate-200 hover:border-amber-400/80 shadow-xs hover:shadow-md transition-all p-5 sm:p-6 space-y-4"
                    >
                      {/* Top Meta Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex flex-wrap items-center gap-2">
                          {report.logNo && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-extrabold text-xs">
                              No. {report.logNo}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 font-bold text-xs text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                            <User className="w-3 h-3 text-slate-500" />
                            {report.studentId} {report.studentName}
                          </span>
                          {report.readStatus && (
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                                report.readStatus === "완독"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : report.readStatus === "읽는 중"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {report.readStatus}
                            </span>
                          )}
                          {report.category && (
                            <span className="text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                              {report.category}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                          {report.createdAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {report.createdAt}
                            </span>
                          )}
                          {report.updatedAt && (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold">
                              수정: {report.updatedAt}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Book Info Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                            <span>📖 {report.bookTitle}</span>
                          </h4>
                          {(report.author || report.publisher) && (
                            <p className="text-xs text-slate-500 mt-1 font-medium">
                              {report.author && <span>저자: {report.author}</span>}
                              {report.author && report.publisher && <span> · </span>}
                              {report.publisher && <span>출판사: {report.publisher}</span>}
                            </p>
                          )}
                        </div>

                        {/* Star Rating Badge */}
                        {report.rating !== undefined && (
                          <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 shrink-0">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= (report.rating || 5)
                                    ? "fill-amber-400 text-amber-500"
                                    : "text-slate-200"
                                }`}
                              />
                            ))}
                            <span className="text-xs font-extrabold text-amber-900 ml-1">
                              {report.rating}점
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Reading Meta Grid (기간, 쪽수 등) */}
                      {(report.readingPeriod || report.pageCount) && (
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                          {report.readingPeriod && (
                            <span className="flex items-center gap-1 font-medium">
                              <strong>읽은 기간:</strong> {report.readingPeriod}
                            </span>
                          )}
                          {report.pageCount && (
                            <span className="flex items-center gap-1 font-medium">
                              <strong>쪽수:</strong> {report.pageCount}쪽
                            </span>
                          )}
                        </div>
                      )}

                      {/* 줄거리 & 핵심 내용 */}
                      {report.summary && (
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            줄거리 & 핵심 내용
                          </span>
                          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                            {report.summary}
                          </p>
                        </div>
                      )}

                      {/* 인상 깊은 문장 */}
                      {report.quotes && report.quotes.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <BookmarkCheck className="w-3.5 h-3.5 text-amber-600" />
                            인상 깊은 문장
                          </span>
                          <div className="space-y-1.5">
                            {report.quotes.map((q, qIdx) => (
                              <div
                                key={qIdx}
                                className="flex items-start justify-between gap-3 text-xs sm:text-sm bg-amber-50/50 border border-amber-200/60 p-2.5 rounded-xl text-slate-800"
                              >
                                <span className="italic leading-relaxed">
                                  "{q.quote}"
                                </span>
                                {q.page && (
                                  <span className="shrink-0 text-xs font-mono font-bold text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200">
                                    {q.page}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 나의 생각 · 느낀 점 (또는 레거시 content) */}
                      {(report.thoughts || report.content) && (
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            나의 생각 · 느낀 점
                          </span>
                          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-white p-3.5 rounded-xl border border-slate-200 font-medium">
                            {report.thoughts || report.content}
                          </p>
                        </div>
                      )}

                      {/* 다음에 읽고 싶은 책 */}
                      {report.nextBook && (
                        <div className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl font-medium">
                          <span className="font-bold text-slate-900">
                            🔖 다음에 읽고 싶은 책:
                          </span>
                          <span>{report.nextBook}</span>
                        </div>
                      )}

                      {/* Photo Thumbnail */}
                      {report.image && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setPreviewModalImg(report.image || null)}
                            className="group relative inline-block overflow-hidden rounded-xl border border-slate-200 cursor-pointer"
                          >
                            <img
                              src={report.image}
                              alt={`${report.bookTitle} 첨부 사진`}
                              className="max-h-48 rounded-xl object-cover transition-transform group-hover:scale-102"
                            />
                            <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-md font-medium">
                              클릭하여 사진 크게보기
                            </span>
                          </button>
                        </div>
                      )}

                      {/* Footer Actions (공감, 수정, 삭제) */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                        <button
                          type="button"
                          onClick={() => onLikeReport(report.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              (report.likes || 0) > 0
                                ? "fill-rose-500 text-rose-500"
                                : ""
                            }`}
                          />
                          <span className="font-semibold">
                            공감 {report.likes || 0}
                          </span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(report)}
                            className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>수정</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("이 독후감 기록을 삭제하시겠습니까?")) {
                                onDeleteReport(report.id);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                            title="독후감 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">삭제</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ==================================================== */}
      {/* 4. Edit Modal (PDF 서식 모든 필드 수정 가능) */}
      {/* ==================================================== */}
      {editingReport && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto"
          onClick={closeEditModal}
        >
          <div
            className="relative w-full max-w-3xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg">
                  ✏️
                </span>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                    독후감(월간 독서 기록) 내용 수정
                  </h3>
                  <p className="text-xs text-slate-500">
                    작성자: {editingReport.studentId} {editingReport.studentName} · 최초 등록: {editingReport.date}
                  </p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No.
                  </label>
                  <input
                    type="text"
                    value={editLogNo}
                    onChange={(e) => setEditLogNo(e.target.value)}
                    placeholder="01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    책 제목 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editBookTitle}
                    onChange={(e) => setEditBookTitle(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    저자 · 옮긴이
                  </label>
                  <input
                    type="text"
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    출판사
                  </label>
                  <input
                    type="text"
                    value={editPublisher}
                    onChange={(e) => setEditPublisher(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    읽은 기간
                  </label>
                  <input
                    type="text"
                    value={editReadingPeriod}
                    onChange={(e) => setEditReadingPeriod(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    분야
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    쪽수
                  </label>
                  <input
                    type="text"
                    value={editPageCount}
                    onChange={(e) => setEditPageCount(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Rating & ReadStatus */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <span className="block text-xs font-bold text-slate-700 mb-1">
                    별점
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditRating(star)}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= editRating
                              ? "fill-amber-400 text-amber-500"
                              : "text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-800 ml-1">
                      {editRating}점
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-bold text-slate-700 mb-1">
                    완독 여부
                  </span>
                  <div className="flex items-center gap-2">
                    {READ_STATUS_OPTIONS.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setEditReadStatus(st)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          editReadStatus === st
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-600 border border-slate-200"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 줄거리 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  줄거리 & 핵심 내용
                </label>
                <textarea
                  rows={3}
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed"
                />
              </div>

              {/* 인상 깊은 문장 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    인상 깊은 문장 (문장 & 쪽수)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditQuotes((prev) => [...prev, { quote: "", page: "" }])
                    }
                    className="text-xs text-amber-700 font-semibold"
                  >
                    + 구절 추가
                  </button>
                </div>
                <div className="space-y-2">
                  {editQuotes.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="문장"
                        value={q.quote}
                        onChange={(e) =>
                          setEditQuotes((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, quote: e.target.value } : item
                            )
                          )
                        }
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="p.XX"
                        value={q.page || ""}
                        onChange={(e) =>
                          setEditQuotes((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, page: e.target.value } : item
                            )
                          )
                        }
                        className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-center"
                      />
                      {editQuotes.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditQuotes((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 느낀 점 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  나의 생각 · 느낀 점 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={editThoughts}
                  onChange={(e) => setEditThoughts(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed"
                />
              </div>

              {/* 다음에 읽고 싶은 책 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  다음에 읽고 싶은 책
                </label>
                <input
                  type="text"
                  value={editNextBook}
                  onChange={(e) => setEditNextBook(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              {/* 사진 첨부 수정 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  인증 사진 변경/첨부
                </label>
                <div className="flex items-center gap-3">
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-slate-100"
                  />
                  {editImagePreview && (
                    <div className="inline-flex items-center gap-2 bg-slate-100 p-1.5 pr-2.5 rounded-lg border border-slate-200">
                      <img
                        src={editImagePreview}
                        alt="수정 첨부 사진"
                        className="w-8 h-8 object-cover rounded"
                      />
                      <span className="text-[11px] text-slate-600 font-medium">
                        사진 유지 중
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditImagePreview(null);
                          if (editFileInputRef.current)
                            editFileInputRef.current.value = "";
                        }}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                >
                  수정 사항 저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. Image Lightbox Modal */}
      {/* ==================================================== */}
      {previewModalImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewModalImg(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl p-2 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewModalImg(null)}
              className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewModalImg}
              alt="독서 인증 사진 원본"
              className="max-h-[80vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
