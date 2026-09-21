import React from "react";
import { BookOpen, MessageSquare, ShieldCheck, Sparkles, BookMarked, Lock, Compass, User, LogOut } from "lucide-react";
import { StudentUser } from "../types";

interface HeaderProps {
  activeTab: "portfolio" | "activity" | "discussion" | "admin";
  setActiveTab: (tab: "portfolio" | "activity" | "discussion" | "admin") => void;
  reportCount: number;
  activityCount: number;
  discussionCount: number;
  isAdminAuthenticated?: boolean;
  currentStudent?: StudentUser | null;
  onStudentLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  reportCount,
  activityCount,
  discussionCount,
  isAdminAuthenticated = false,
  currentStudent = null,
  onStudentLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs backdrop-blur-md bg-white/95">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  다독다독 포트폴리오
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                  다독다독동아리
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                개인 독후감 누적 포트폴리오 · 공통도서 토론 · 교사용 생기부 수합
              </p>
            </div>
          </div>

          {/* Mobile Student Status */}
          {currentStudent && (
            <div className="sm:hidden flex items-center gap-1.5 bg-blue-50/80 border border-blue-200/70 px-2 py-1 rounded-lg">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-bold text-blue-900">
                {currentStudent.studentName}
              </span>
              {onStudentLogout && (
                <button
                  onClick={onStudentLogout}
                  title="로그아웃"
                  className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer ml-1"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation & User Badges */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          {/* Desktop Student Badge */}
          {currentStudent && (
            <div className="hidden sm:flex items-center gap-2 bg-blue-50/90 border border-blue-200/80 px-3 py-1.5 rounded-xl shadow-2xs">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                {currentStudent.studentName.slice(0, 1)}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-blue-950 leading-tight">
                  {currentStudent.studentName}{" "}
                  <span className="text-[10px] font-normal text-blue-700">({currentStudent.studentId})</span>
                </div>
                <div className="text-[10px] text-blue-600/80 font-medium leading-none">학생 본인 인증됨</div>
              </div>
              {onStudentLogout && (
                <button
                  onClick={onStudentLogout}
                  className="ml-1.5 p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="학생 로그아웃"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto border border-slate-200/60">
            <button
              id="tab-btn-portfolio"
              onClick={() => setActiveTab("portfolio")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "portfolio"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>내 독후감</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === "portfolio"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {reportCount}
              </span>
            </button>

            <button
              id="tab-btn-activity"
              onClick={() => setActiveTab("activity")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "activity"
                  ? "bg-white text-emerald-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>활동기록</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === "activity"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {activityCount}
              </span>
            </button>

            <button
              id="tab-btn-discussion"
              onClick={() => setActiveTab("discussion")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "discussion"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>공통도서 토론</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === "discussion"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {discussionCount}
              </span>
            </button>

            <button
              id="tab-btn-admin"
              onClick={() => setActiveTab("admin")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "admin"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              {isAdminAuthenticated ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>관리자 모드</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  isAdminAuthenticated
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                    : "bg-slate-200/70 text-slate-500"
                }`}
              >
                {isAdminAuthenticated ? "인증됨" : "잠금"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
