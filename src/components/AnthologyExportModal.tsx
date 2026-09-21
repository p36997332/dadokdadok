import React, { useState, useRef } from "react";
import { BookReport, ActivityRecord, DiscussionPost, ClubInfo } from "../types";
import {
  BookOpen,
  X,
  Download,
  Printer,
  Image as ImageIcon,
  FileText,
  User,
  CheckSquare,
  Square,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye,
  Settings,
  Layers,
  Award,
  Calendar,
  MapPin,
  Star,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface AnthologyExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubInfo: ClubInfo;
  reports: BookReport[];
  activities: ActivityRecord[];
  discussions: DiscussionPost[];
}

export const AnthologyExportModal: React.FC<AnthologyExportModalProps> = ({
  isOpen,
  onClose,
  clubInfo,
  reports,
  activities,
  discussions,
}) => {
  if (!isOpen) return null;

  // Filter States
  const [selectedStudent, setSelectedStudent] = useState<string>("ALL");
  const [includeCover, setIncludeCover] = useState<boolean>(true);
  const [includePreface, setIncludePreface] = useState<boolean>(true);
  const [includeReports, setIncludeReports] = useState<boolean>(true);
  const [includeActivities, setIncludeActivities] = useState<boolean>(true);
  const [includeDiscussions, setIncludeDiscussions] = useState<boolean>(true);

  // Book Meta Customization
  const [bookTitle, setBookTitle] = useState("다독다독(多讀多讀)");
  const [bookSubtitle, setBookSubtitle] = useState(
    "2026학년도 다독다독동아리 독서 포트폴리오 & 활동 문집"
  );
  const [publisherText, setPublisherText] = useState(
    `${clubInfo.name || "다독다독동아리"} 편집위원회`
  );
  const [publishDate, setPublishDate] = useState("2026년 12월");
  const [prefaceText, setPrefaceText] = useState(
    `책장을 넘길 때마다 펼쳐지는 우리들의 지성과 감성의 기록입니다.\n\n한 권의 책을 읽고 고민하며 적어 내려간 독후감, 친구들과 함께 질문을 던지며 밤늦도록 토론했던 시간들, 그리고 문학의 발자취를 찾아 떠났던 소중한 외부 체험활동의 순간들을 모아 한 권의 문집으로 엮었습니다.\n\n이 작은 책이 우리 모두의 삶에 오랫동안 따뜻한 길잡이가 되어주길 바랍니다.`
  );

  // Export State
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingImages, setIsExportingImages] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const [activePreviewPageIndex, setActivePreviewPageIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Unique student list
  const uniqueStudents = Array.from(
    new Set([
      ...reports.map((r) => `${r.studentId} ${r.studentName}`.trim()),
      ...activities.map((a) => `${a.studentId} ${a.studentName}`.trim()),
    ])
  ).filter(Boolean);

  // Filtered data
  const filteredReports = reports.filter((r) => {
    if (!includeReports) return false;
    if (selectedStudent === "ALL") return true;
    return `${r.studentId} ${r.studentName}`.trim() === selectedStudent;
  });

  const filteredActivities = activities.filter((a) => {
    if (!includeActivities) return false;
    if (selectedStudent === "ALL") return true;
    return `${a.studentId} ${a.studentName}`.trim() === selectedStudent;
  });

  const filteredDiscussions = includeDiscussions ? discussions : [];

  // Construct Pages array for preview & export
  type PageType =
    | { type: "cover"; id: string; title: string }
    | { type: "preface"; id: string; title: string }
    | { type: "report"; id: string; title: string; data: BookReport }
    | { type: "activity"; id: string; title: string; data: ActivityRecord }
    | { type: "discussion"; id: string; title: string; data: DiscussionPost };

  const pages: PageType[] = [];

  if (includeCover) {
    pages.push({ type: "cover", id: "page-cover", title: "표지 (Book Cover)" });
  }
  if (includePreface) {
    pages.push({ type: "preface", id: "page-preface", title: "발간사 & 차례 (Preface & Contents)" });
  }
  filteredReports.forEach((rep, idx) => {
    pages.push({
      type: "report",
      id: `page-report-${rep.id}`,
      title: `[독서기록] ${rep.studentName} - ${rep.bookTitle}`,
      data: rep,
    });
  });
  filteredActivities.forEach((act, idx) => {
    pages.push({
      type: "activity",
      id: `page-activity-${act.id}`,
      title: `[체험활동] ${act.studentName} - ${act.activityName}`,
      data: act,
    });
  });
  filteredDiscussions.forEach((disc, idx) => {
    pages.push({
      type: "discussion",
      id: `page-disc-${disc.id}`,
      title: `[공통토론] ${disc.bookTitle}`,
      data: disc,
    });
  });

  // Browser High-Definition Vector Print
  const handlePrint = () => {
    window.print();
  };

  // PDF Export via jsPDF & html2canvas
  const handleExportPdf = async () => {
    if (pages.length === 0) {
      alert("출판할 페이지가 없습니다.");
      return;
    }

    setIsExportingPdf(true);
    setExportProgress("PDF 생성 준비 중...");

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        setExportProgress(`페이지 변환 중... (${i + 1}/${pages.length})`);
        const pageEl = document.getElementById(pages[i].id);
        if (!pageEl) continue;

        const canvas = await html2canvas(pageEl, {
          scale: 2, // 2x for sharp print quality
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);

        if (i > 0) {
          pdf.addPage("a4", "p");
        }
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      }

      const safeStudent = selectedStudent === "ALL" ? "전체동아리" : selectedStudent.replace(/\s+/g, "_");
      pdf.save(`다독다독동아리_문집_포트폴리오_${safeStudent}_${new Date().toISOString().slice(0, 10)}.pdf`);
      setExportProgress("PDF 다운로드가 완료되었습니다!");
      setTimeout(() => {
        setIsExportingPdf(false);
        setExportProgress("");
      }, 1500);
    } catch (err) {
      console.error(err);
      alert("PDF 생성 중 오류가 발생했습니다. 브라우저 '인쇄(PDF로 저장)' 기능을 이용하실 수도 있습니다.");
      setIsExportingPdf(false);
      setExportProgress("");
    }
  };

  // Export current single page as high-res PNG image
  const handleExportCurrentPageImage = async (pageId: string, pageTitle: string) => {
    const pageEl = document.getElementById(pageId);
    if (!pageEl) {
      alert("페이지 요소를 찾을 수 없습니다.");
      return;
    }

    try {
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      const safeTitle = pageTitle.replace(/[/\\?%*:|"<>]/g, "_");
      a.download = `다독다독_포트폴리오_${safeTitle}.png`;
      a.click();
    } catch (err) {
      console.error(err);
      alert("이미지 저장 중 오류가 발생했습니다.");
    }
  };

  // Export all pages as PNG images sequentially
  const handleExportAllImages = async () => {
    if (pages.length === 0) return;
    setIsExportingImages(true);

    try {
      for (let i = 0; i < pages.length; i++) {
        setExportProgress(`이미지 생성 중... (${i + 1}/${pages.length})`);
        const pageEl = document.getElementById(pages[i].id);
        if (!pageEl) continue;

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });

        const dataUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        const pageNumber = String(i + 1).padStart(2, "0");
        const safeTitle = pages[i].title.replace(/[/\\?%*:|"<>]/g, "_");
        a.download = `다독다독_문집_p${pageNumber}_${safeTitle}.png`;
        a.click();

        // Small delay so browser doesn't block multi downloads
        await new Promise((r) => setTimeout(r, 400));
      }

      setExportProgress("모든 이미지 다운로드가 완료되었습니다!");
      setTimeout(() => {
        setIsExportingImages(false);
        setExportProgress("");
      }, 1500);
    } catch (err) {
      console.error(err);
      alert("이미지 다운로드 중 문제가 발생했습니다.");
      setIsExportingImages(false);
      setExportProgress("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      {/* Print styles injected for direct window.print() */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #anthology-booklet-container,
          #anthology-booklet-container * {
            visibility: visible;
          }
          #anthology-booklet-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white !important;
          }
          .anthology-page {
            page-break-after: always !important;
            break-after: page !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 20mm !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Modal Top Bar */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                  출판용 문집(포트폴리오) 제작실 & PDF · 이미지 내보내기
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-bold">
                  다독다독동아리
                </span>
              </div>
              <p className="text-xs text-slate-300">
                학생들의 독서기록과 활동을 책자 형태로 자동 조판하여 PDF 및 고화질 이미지로 즉시 출판합니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar (Export Buttons) */}
        <div className="p-3.5 sm:px-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
            <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800">
              총 <strong>{pages.length}</strong>페이지 구성
            </span>
            {exportProgress && (
              <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 animate-pulse font-bold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {exportProgress}
              </span>
            )}
          </div>

          {/* Buttons: PDF, Images, Print */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Window Print (Vector PDF) */}
            <button
              onClick={handlePrint}
              disabled={isExportingPdf || isExportingImages}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="브라우저 인쇄 창을 띄워 고화질 PDF로 저장하거나 프린터로 출력합니다"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>인쇄 / PDF로 저장</span>
            </button>

            {/* Current Page Image */}
            <button
              onClick={() => {
                if (pages[activePreviewPageIndex]) {
                  handleExportCurrentPageImage(
                    pages[activePreviewPageIndex].id,
                    pages[activePreviewPageIndex].title
                  );
                }
              }}
              disabled={isExportingPdf || isExportingImages || pages.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="현재 보고 있는 페이지 1장을 고해상도 PNG 이미지로 저장합니다"
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>현재 페이지 PNG 저장</span>
            </button>

            {/* All Pages Images */}
            <button
              onClick={handleExportAllImages}
              disabled={isExportingPdf || isExportingImages || pages.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="모든 문집 페이지를 PNG 이미지 파일로 1장씩 순차 다운로드합니다"
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>전체 이미지 일괄 저장</span>
            </button>

            {/* Complete PDF Download */}
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf || isExportingImages || pages.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-extrabold transition-all cursor-pointer shadow-sm"
              title="전체 페이지를 묶어 1개의 PDF 파일로 다운로드합니다"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>PDF 생성 중...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>전체 문집 PDF 다운로드</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Main Body (Left: Customization Panel / Right: Booklet Live Viewer) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Panel: Filter & Settings (col-span-4) */}
          <div className="lg:col-span-4 border-r border-slate-200 bg-slate-50/70 p-4 sm:p-5 overflow-y-auto space-y-5">
            {/* Student Filter */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>문집 대상 학생 선택</span>
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">전체 동아리원 통합 문집 (모든 학생 기록)</option>
                {uniqueStudents.map((s, idx) => (
                  <option key={idx} value={s}>
                    {s} (개인 독점 포트폴리오집)
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                특정 학생을 선택하면 해당 학생의 기록만 모아 1인 전용 포트폴리오 책자를 제작합니다.
              </p>
            </div>

            {/* Section Checkboxes */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>포함할 구성 페이지</span>
              </span>

              <div className="space-y-1.5 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeCover}
                    onChange={(e) => setIncludeCover(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>책 표지 (Book Cover)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includePreface}
                    onChange={(e) => setIncludePreface(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>발간사 및 차례 (Preface & Contents)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeReports}
                    onChange={(e) => setIncludeReports(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>독서 기록 포트폴리오 ({filteredReports.length}건)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeActivities}
                    onChange={(e) => setIncludeActivities(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>외부 체험 & 문학기행 ({filteredActivities.length}건)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeDiscussions}
                    onChange={(e) => setIncludeDiscussions(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>공통도서 토론 마당 ({filteredDiscussions.length}건)</span>
                </label>
              </div>
            </div>

            {/* Book Info Customization */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-slate-600" />
                <span>문집 표지 & 정보 커스텀</span>
              </span>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  문집 제목
                </label>
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  부제
                </label>
                <input
                  type="text"
                  value={bookSubtitle}
                  onChange={(e) => setBookSubtitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    발행처
                  </label>
                  <input
                    type="text"
                    value={publisherText}
                    onChange={(e) => setPublisherText(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    발행연월
                  </label>
                  <input
                    type="text"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  서문 / 발간사
                </label>
                <textarea
                  rows={4}
                  value={prefaceText}
                  onChange={(e) => setPrefaceText(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs resize-y leading-relaxed"
                />
              </div>
            </div>

            {/* Quick Page Jump List */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>페이지 바로가기</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  클릭시 우측 미리보기 이동
                </span>
              </span>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {pages.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActivePreviewPageIndex(idx);
                      const target = document.getElementById(p.id);
                      if (target) {
                        target.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      activePreviewPageIndex === idx
                        ? "bg-amber-100 text-amber-900 font-bold"
                        : "hover:bg-slate-100 text-slate-600"
                    }`}
                  >
                    <span className="truncate mr-2">
                      {idx + 1}. {p.title}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      p.{idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Live A4 Booklet Viewer (col-span-8) */}
          <div className="lg:col-span-8 bg-slate-200/70 p-4 sm:p-6 overflow-y-auto max-h-[calc(94vh-130px)]">
            <div className="max-w-[720px] mx-auto space-y-8" ref={containerRef} id="anthology-booklet-container">
              {pages.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-slate-300">
                  <p className="text-sm font-bold text-slate-600">
                    선택된 구성 요소가 없습니다. 왼쪽 패널에서 항목을 선택해주세요.
                  </p>
                </div>
              ) : (
                pages.map((page, pIndex) => (
                  <div
                    key={page.id}
                    id={page.id}
                    className="anthology-page relative bg-white rounded-xl shadow-xl border border-slate-300 mx-auto w-full aspect-[1/1.414] p-8 sm:p-12 flex flex-col justify-between overflow-hidden text-slate-900 select-text"
                    style={{ minHeight: "900px" }}
                  >
                    {/* Top Running Header (Booklet header except cover) */}
                    {page.type !== "cover" && (
                      <div className="pb-3 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-400 font-serif">
                        <span>{bookTitle} · {bookSubtitle}</span>
                        <span>{clubInfo.name || "다독다독동아리"}</span>
                      </div>
                    )}

                    {/* Page Content Body */}
                    <div className="flex-1 my-auto py-4">
                      {/* ======================= */}
                      {/* 1. COVER PAGE */}
                      {/* ======================= */}
                      {page.type === "cover" && (
                        <div className="h-full flex flex-col justify-between py-6 text-center">
                          <div className="space-y-4 pt-10">
                            <div className="inline-block px-4 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold tracking-widest uppercase">
                              Reading Club Anthology
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-extrabold font-serif tracking-tight text-slate-900 leading-tight">
                              {bookTitle}
                            </h1>
                            <p className="text-base sm:text-lg text-slate-600 font-serif max-w-md mx-auto">
                              {bookSubtitle}
                            </p>
                          </div>

                          {/* Decorative Book Motif */}
                          <div className="my-12 flex justify-center">
                            <div className="w-36 h-36 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-2xl rotate-3">
                              <BookOpen className="w-20 h-20 -rotate-3" />
                            </div>
                          </div>

                          {/* Student Author Credits & Publisher */}
                          <div className="space-y-6 pb-6">
                            {selectedStudent === "ALL" ? (
                              <div className="max-w-md mx-auto text-xs text-slate-500 leading-relaxed font-serif">
                                <span className="font-bold text-slate-700 block mb-1">
                                  참여 동아리원
                                </span>
                                {uniqueStudents.join(" · ")}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="text-xs text-slate-400 font-serif">기록자</span>
                                <h3 className="text-xl font-bold text-slate-900 font-serif">
                                  {selectedStudent}
                                </h3>
                              </div>
                            )}

                            <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 font-serif flex items-center justify-between px-4">
                              <span>{publisherText}</span>
                              <span>{publishDate}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ======================= */}
                      {/* 2. PREFACE & CONTENTS */}
                      {/* ======================= */}
                      {page.type === "preface" && (
                        <div className="space-y-8 py-2">
                          {/* Preface */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                              <h2 className="text-xl font-extrabold font-serif text-slate-900">
                                발간사 (Preface)
                              </h2>
                            </div>
                            <p className="text-xs sm:text-sm font-serif leading-relaxed text-slate-700 whitespace-pre-line text-justify">
                              {prefaceText}
                            </p>
                            <div className="text-right text-xs font-serif text-slate-500 pt-2">
                              — {clubInfo.name || "다독다독동아리"} 지도교사 및 부원 일동
                            </div>
                          </div>

                          {/* Table of Contents */}
                          <div className="space-y-3 pt-4 border-t border-slate-200">
                            <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                              <h2 className="text-xl font-extrabold font-serif text-slate-900">
                                차례 (Contents)
                              </h2>
                            </div>

                            <div className="space-y-2 text-xs font-serif">
                              {/* Chapter 1 */}
                              {includeReports && filteredReports.length > 0 && (
                                <div className="space-y-1 pt-1">
                                  <div className="font-bold text-amber-900 text-sm flex items-center justify-between">
                                    <span>제1장 · 독서 기록 포트폴리오 (Reading Log)</span>
                                    <span className="text-slate-400 text-xs">{filteredReports.length}편</span>
                                  </div>
                                  <ul className="space-y-1 pl-3 text-slate-600 border-l border-slate-200">
                                    {filteredReports.slice(0, 8).map((r, i) => (
                                      <li key={i} className="flex justify-between items-center text-[11px]">
                                        <span className="truncate max-w-[320px]">
                                          {r.studentName} — 《{r.bookTitle}》
                                        </span>
                                        <span className="text-slate-400">................</span>
                                      </li>
                                    ))}
                                    {filteredReports.length > 8 && (
                                      <li className="text-[10px] text-slate-400 italic">
                                        ... 외 {filteredReports.length - 8}편
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              )}

                              {/* Chapter 2 */}
                              {includeActivities && filteredActivities.length > 0 && (
                                <div className="space-y-1 pt-2">
                                  <div className="font-bold text-blue-900 text-sm flex items-center justify-between">
                                    <span>제2장 · 외부체험 & 문학기행 활동기록</span>
                                    <span className="text-slate-400 text-xs">{filteredActivities.length}편</span>
                                  </div>
                                  <ul className="space-y-1 pl-3 text-slate-600 border-l border-slate-200">
                                    {filteredActivities.slice(0, 5).map((a, i) => (
                                      <li key={i} className="flex justify-between items-center text-[11px]">
                                        <span className="truncate max-w-[320px]">
                                          {a.studentName} — {a.activityName}
                                        </span>
                                        <span className="text-slate-400">................</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Chapter 3 */}
                              {includeDiscussions && filteredDiscussions.length > 0 && (
                                <div className="space-y-1 pt-2">
                                  <div className="font-bold text-emerald-900 text-sm flex items-center justify-between">
                                    <span>제3장 · 공통도서 독서토론 마당</span>
                                    <span className="text-slate-400 text-xs">{filteredDiscussions.length}편</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ======================= */}
                      {/* 3. BOOK REPORT PAGE (Reading Log Form 100% 반영) */}
                      {/* ======================= */}
                      {page.type === "report" && (
                        <div className="space-y-4">
                          {/* Reading Log Header Table */}
                          <div className="border-b-2 border-slate-900 pb-3">
                            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                              <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                READING LOG {page.data.logNo ? `No. ${page.data.logNo}` : ""}
                              </span>
                              <span>올린 날짜: {page.data.date || page.data.createdAt}</span>
                            </div>
                            <h2 className="text-2xl font-extrabold text-slate-900 font-serif mt-1">
                              {page.data.bookTitle}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1 font-serif">
                              {page.data.author && <span>저자: {page.data.author}</span>}
                              {page.data.publisher && <span>· 출판사: {page.data.publisher}</span>}
                              {page.data.category && <span>· 분야: {page.data.category}</span>}
                              {page.data.pageCount && <span>· {page.data.pageCount}쪽</span>}
                            </div>
                          </div>

                          {/* Student Author Badge & Meta */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-serif">
                            <div>
                              <span className="text-slate-400 block text-[10px]">작성자</span>
                              <strong className="text-slate-900">
                                {page.data.studentId} {page.data.studentName}
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">읽은 기간</span>
                              <span className="text-slate-800">{page.data.readingPeriod || "-"}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">별점</span>
                              <span className="text-amber-600 font-bold">
                                {"★".repeat(page.data.rating || 5)}{"☆".repeat(5 - (page.data.rating || 5))} ({page.data.rating || 5}점)
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">완독 여부</span>
                              <span className="font-semibold text-emerald-700">{page.data.readStatus || "완독"}</span>
                            </div>
                          </div>

                          {/* 줄거리 & 핵심 내용 */}
                          {page.data.summary && (
                            <div className="space-y-1">
                              <h3 className="text-xs font-bold text-slate-900 font-serif border-l-2 border-slate-800 pl-2">
                                [줄거리 & 핵심 내용]
                              </h3>
                              <p className="text-xs font-serif leading-relaxed text-slate-700 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-line text-justify">
                                {page.data.summary}
                              </p>
                            </div>
                          )}

                          {/* 인상 깊은 문장 */}
                          {page.data.quotes && page.data.quotes.length > 0 && (
                            <div className="space-y-1">
                              <h3 className="text-xs font-bold text-slate-900 font-serif border-l-2 border-amber-600 pl-2">
                                [인상 깊은 문장]
                              </h3>
                              <div className="space-y-1.5">
                                {page.data.quotes.map((q, qIdx) => (
                                  <div
                                    key={qIdx}
                                    className="p-2 bg-amber-50/40 border border-amber-200/50 rounded-lg text-xs font-serif italic text-slate-800 flex justify-between items-start gap-2"
                                  >
                                    <span>"{q.quote}"</span>
                                    {q.page && <span className="font-mono text-[11px] text-amber-800 shrink-0 font-bold">{q.page}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 나의 생각 · 느낀 점 */}
                          <div className="space-y-1">
                            <h3 className="text-xs font-bold text-slate-900 font-serif border-l-2 border-blue-600 pl-2">
                              [나의 생각 · 느낀 점]
                            </h3>
                            <p className="text-xs font-serif leading-relaxed text-slate-800 whitespace-pre-line text-justify bg-slate-50/30 p-2.5 rounded-lg border border-slate-100">
                              {page.data.thoughts || page.data.content}
                            </p>
                          </div>

                          {/* 다음에 읽고 싶은 책 & 사진 */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs font-serif border-t border-slate-100">
                            {page.data.nextBook && (
                              <div className="text-slate-600">
                                🔖 <strong>다음에 읽고 싶은 책:</strong> {page.data.nextBook}
                              </div>
                            )}

                            {page.data.image && (
                              <div className="flex items-center gap-2">
                                <img
                                  src={page.data.image}
                                  alt="인증샷"
                                  className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-xs"
                                />
                                <span className="text-[10px] text-slate-400">도서/필사 인증샷</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ======================= */}
                      {/* 4. ACTIVITY RECORD PAGE */}
                      {/* ======================= */}
                      {page.type === "activity" && (
                        <div className="space-y-5">
                          <div className="border-b-2 border-slate-900 pb-3">
                            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                              <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                외부체험 & 문학기행 기록
                              </span>
                              <span>일자: {page.data.activityDate || page.data.date}</span>
                            </div>
                            <h2 className="text-2xl font-extrabold text-slate-900 font-serif mt-1">
                              {page.data.activityTitle}
                            </h2>
                            <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 font-serif">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {page.data.activityType || "교외 체험처"}
                              </span>
                              <span>· 작성자: {page.data.studentId} {page.data.studentName}</span>
                            </div>
                          </div>

                          {/* Activity Photo */}
                          {page.data.image && (
                            <div className="my-2 rounded-2xl overflow-hidden border border-slate-200 max-h-56 flex justify-center bg-slate-100">
                              <img
                                src={page.data.image}
                                alt="체험활동 사진"
                                className="w-full h-56 object-cover"
                              />
                            </div>
                          )}

                          {/* Activity Description */}
                          <div className="space-y-1">
                            <h3 className="text-xs font-bold text-slate-900 font-serif border-l-2 border-blue-600 pl-2">
                              [활동 내용 및 활동 후기]
                            </h3>
                            <p className="text-xs font-serif leading-relaxed text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 whitespace-pre-line text-justify">
                              {page.data.reflections}
                            </p>
                          </div>

                          {/* Lessons Learned */}
                          <div className="space-y-1">
                            <h3 className="text-xs font-bold text-slate-900 font-serif border-l-2 border-emerald-600 pl-2">
                              [느낀 점 및 배운 점]
                            </h3>
                            <p className="text-xs font-serif leading-relaxed text-slate-800 bg-emerald-50/40 p-3 rounded-xl border border-emerald-200/60 whitespace-pre-line text-justify">
                              {page.data.learnedLessons || "(미기재)"}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* ======================= */}
                      {/* 5. DISCUSSION RECORD PAGE */}
                      {/* ======================= */}
                      {page.type === "discussion" && (
                        <div className="space-y-5">
                          <div className="border-b-2 border-slate-900 pb-3">
                            <span className="font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs font-mono">
                              공통도서 독서토론 마당
                            </span>
                            <h2 className="text-2xl font-extrabold text-slate-900 font-serif mt-1">
                              《{clubInfo.currentBook || "공통도서"}》
                            </h2>
                            <p className="text-xs text-slate-600 font-serif mt-1">
                              토론 주제: {clubInfo.discussionTopic || "자유 발제 및 토론"}
                            </p>
                          </div>

                          <div className="space-y-3">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-serif leading-relaxed text-slate-800 whitespace-pre-line">
                              <span className="font-bold text-slate-900 block mb-1">
                                [발제자: {page.data.studentName} ({page.data.studentId})]
                              </span>
                              {page.data.content}
                            </div>

                            {/* Comments / Voices */}
                            {page.data.comments && page.data.comments.length > 0 && (
                              <div className="space-y-2 pt-2">
                                <h4 className="text-xs font-bold text-slate-900 font-serif">
                                  동아리원 토론 나눔 ({page.data.comments.length}개의 의견)
                                </h4>
                                <div className="space-y-2">
                                  {page.data.comments.map((c) => (
                                    <div
                                      key={c.id}
                                      className="bg-white p-3 rounded-lg border border-slate-200 text-xs font-serif space-y-1"
                                    >
                                      <div className="flex justify-between text-[11px] font-bold text-slate-700">
                                        <span>{c.studentName}</span>
                                        <span className="text-slate-400 font-normal">{c.date || ""}</span>
                                      </div>
                                      <p className="text-slate-800 text-[11px] leading-relaxed">{c.text}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Running Footer (Page Number) */}
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 font-serif">
                      <span>{publishDate} 발행</span>
                      <span className="font-bold text-slate-700">— {pIndex + 1} —</span>
                      <span>다독다독 포트폴리오</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
