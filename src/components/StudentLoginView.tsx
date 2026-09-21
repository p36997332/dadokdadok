import React, { useState } from "react";
import {
  BookMarked,
  Lock,
  User,
  KeyRound,
  ArrowRight,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  School,
} from "lucide-react";
import { verifyStudentCredentials } from "../services/googleSheetsService";
import { StudentUser } from "../types";

interface StudentLoginViewProps {
  onLoginSuccess: (student: StudentUser) => void;
  onTeacherLogin: () => void;
  rosterCount: number;
  onRefreshRoster: () => Promise<void>;
  isRefreshingRoster: boolean;
}

export const StudentLoginView: React.FC<StudentLoginViewProps> = ({
  onLoginSuccess,
  onTeacherLogin,
  rosterCount,
  onRefreshRoster,
  isRefreshingRoster,
}) => {
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = studentId.trim();
    const cleanName = studentName.trim();
    const cleanPw = password.trim();

    if (!cleanId) {
      setErrorMessage("학번을 입력해주세요 (예: 20104).");
      return;
    }
    if (!cleanName) {
      setErrorMessage("이름을 입력해주세요 (예: 김민서).");
      return;
    }
    if (!cleanPw || cleanPw.length !== 4) {
      setErrorMessage("비밀번호 4자리 숫자를 입력해주세요.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await verifyStudentCredentials(cleanId, cleanName, cleanPw);
      if (res.success && res.student) {
        onLoginSuccess({
          studentId: res.student.studentId,
          studentName: res.student.studentName,
        });
      } else {
        setErrorMessage(
          res.message ||
            "학번, 이름 또는 비밀번호(4자리)가 일치하지 않습니다. 본인 학번 뒤 4자리를 입력해주세요."
        );
      }
    } catch (err: any) {
      setErrorMessage("인증 중 오류가 발생했습니다: " + (err?.message || "네트워크 상태를 확인해주세요."));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUseDemoStudent = () => {
    setStudentId("10712");
    setStudentName("심채원");
    setPassword("1712");
    setErrorMessage(null);
  };

  // Derive suggested password from student ID (last 4 digits)
  const idDigits = studentId.replace(/\D/g, "");
  const suggestedPw = idDigits.length >= 4 ? idDigits.slice(-4) : "";

  const handleFillSuggestedPw = () => {
    if (suggestedPw) {
      setPassword(suggestedPw);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-8 relative overflow-hidden">
        {/* Top Decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-blue-600 via-indigo-600 to-blue-500" />

        {/* Header */}
        <div className="text-center mb-6 pt-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 mb-3 shadow-xs">
            <BookMarked className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70 mb-2">
            <School className="w-3.5 h-3.5" />
            <span>다독다독 독서동아리 포트폴리오</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            학생 본인 인증 로그인
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            학번, 이름과 <strong>4자리 비밀번호</strong>를 입력하고 접속하세요.
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs sm:text-sm animate-shake">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              학번 <span className="text-blue-600 font-normal">(예: 20104)</span>
            </label>
            <div className="relative">
              <input
                id="input-login-student-id"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="학번 입력 (예: 20104)"
                maxLength={10}
                className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-hidden bg-slate-50/50 hover:bg-white focus:bg-white"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              이름 <span className="text-blue-600 font-normal">(예: 김민서)</span>
            </label>
            <div className="relative">
              <input
                id="input-login-student-name"
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="이름 입력 (예: 김민서)"
                maxLength={20}
                className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-hidden bg-slate-50/50 hover:bg-white focus:bg-white"
              />
              <Sparkles className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                비밀번호 (학번 기준 4자리)
              </label>
              {suggestedPw && (
                <button
                  type="button"
                  onClick={handleFillSuggestedPw}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
                >
                  학번 뒤 4자리({suggestedPw}) 입력
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="input-login-student-pw"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={password}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 4) setPassword(val);
                }}
                placeholder={suggestedPw ? `학번 뒤 4자리 (${suggestedPw})` : "학번 뒤 4자리 (예: 0104)"}
                maxLength={4}
                className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-200 text-slate-900 text-sm font-bold tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-hidden bg-slate-50/50 hover:bg-white focus:bg-white"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>

            {/* Password Hint Guide */}
            <div className="mt-2 p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-800 leading-relaxed">
              💡 <strong>비밀번호 안내</strong>: 본인 <strong>학번 뒤 4자리</strong>
              {studentId ? ` (입력하신 학번 기준: ` : " (예: 20104인 경우 "}
              <span className="font-bold underline text-blue-900">
                {suggestedPw || "0104"}
              </span>
              )를 입력하시면 됩니다.
            </div>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            disabled={isVerifying}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>본인 인증 확인 중...</span>
              </>
            ) : (
              <>
                <span>인증하고 내 서재 들어가기</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Test Student Shortcut */}
        <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
          <div className="text-slate-600">
            <span className="font-bold text-slate-800">예시 계정 테스트:</span>{" "}
            <span className="text-slate-500 font-mono">10712 심채원 / 1712</span>
          </div>
          <button
            type="button"
            onClick={handleUseDemoStudent}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-blue-600 font-bold hover:bg-blue-50 transition-colors cursor-pointer text-[11px]"
          >
            자동 채우기
          </button>
        </div>

        {/* Sync Status & Refresh */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>동아리 명단 연동 ({rosterCount || 23}명)</span>
          </div>
          <button
            type="button"
            onClick={onRefreshRoster}
            disabled={isRefreshingRoster}
            className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 font-semibold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshingRoster ? "animate-spin text-blue-600" : ""}`} />
            <span>명단 새로고침</span>
          </button>
        </div>

        {/* Teacher Bypass */}
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={onTeacherLogin}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors py-1 cursor-pointer font-medium"
          >
            <Lock className="w-3 h-3 text-slate-400" />
            <span>선생님이신가요? <strong>교사용 관리자 모드로 바로가기</strong></span>
          </button>
        </div>
      </div>
    </div>
  );
};
