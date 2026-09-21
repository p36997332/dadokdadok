import React, { useState, useRef } from "react";
import { ActivityRecord } from "../types";
import {
  Compass,
  Sparkles,
  Upload,
  X,
  Heart,
  Trash2,
  Calendar,
  User,
  Filter,
  Search,
  Pencil,
  Clock,
  Save,
  Lightbulb,
  MessageSquareQuote,
} from "lucide-react";

interface ActivityTabProps {
  activities: ActivityRecord[];
  onSaveActivity: (activity: Omit<ActivityRecord, "id" | "date" | "likes">) => void;
  onUpdateActivity: (activity: ActivityRecord) => void;
  onDeleteActivity: (id: string | number) => void;
  onLikeActivity: (id: string | number) => void;
}

const ACTIVITY_TYPES = [
  { label: "문학기행/견학", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { label: "초청강연/특강", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { label: "독서캠프/세미나", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { label: "봉사/체험", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { label: "교내행사/발표", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { label: "기타활동", color: "bg-slate-100 text-slate-700 border-slate-200" },
];

export const ActivityTab: React.FC<ActivityTabProps> = ({
  activities,
  onSaveActivity,
  onUpdateActivity,
  onDeleteActivity,
  onLikeActivity,
}) => {
  // Form states
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityType, setActivityType] = useState("문학기행/견학");
  const [activityDate, setActivityDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, "0")}. ${String(today.getDate()).padStart(2, "0")}.`;
  });
  const [learnedLessons, setLearnedLessons] = useState("");
  const [reflections, setReflections] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Filter & Search states
  const [filterStudentId, setFilterStudentId] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  // Edit Modal State
  const [editingActivity, setEditingActivity] = useState<ActivityRecord | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editLearned, setEditLearned] = useState("");
  const [editReflections, setEditReflections] = useState("");
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image Upload Handlers
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

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId.trim() || !studentName.trim()) {
      alert("학번과 이름을 입력해주세요.");
      return;
    }

    if (!activityTitle.trim()) {
      alert("활동명을 입력해주세요.");
      return;
    }

    if (!learnedLessons.trim()) {
      alert("활동을 통해 배운 점을 입력해주세요.");
      return;
    }

    if (!reflections.trim()) {
      alert("활동 느낀 점을 입력해주세요.");
      return;
    }

    onSaveActivity({
      studentId: studentId.trim(),
      studentName: studentName.trim(),
      activityTitle: activityTitle.trim(),
      activityType,
      activityDate: activityDate.trim(),
      learnedLessons: learnedLessons.trim(),
      reflections: reflections.trim(),
      image: imagePreview,
    });

    // Reset Form
    setActivityTitle("");
    setLearnedLessons("");
    setReflections("");
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    alert("활동기록이 성공적으로 등록되었습니다!");
  };

  // Edit Modal Handlers
  const openEditModal = (activity: ActivityRecord) => {
    setEditingActivity(activity);
    setEditTitle(activity.activityTitle);
    setEditType(activity.activityType || "기타활동");
    setEditDate(activity.activityDate || activity.date);
    setEditLearned(activity.learnedLessons);
    setEditReflections(activity.reflections);
    setEditImagePreview(activity.image || null);
  };

  const closeEditModal = () => {
    setEditingActivity(null);
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setEditImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;

    if (!editTitle.trim()) {
      alert("활동명을 입력해주세요.");
      return;
    }
    if (!editLearned.trim()) {
      alert("배운 점을 입력해주세요.");
      return;
    }
    if (!editReflections.trim()) {
      alert("활동 느낀 점을 입력해주세요.");
      return;
    }

    onUpdateActivity({
      ...editingActivity,
      activityTitle: editTitle.trim(),
      activityType: editType,
      activityDate: editDate.trim(),
      learnedLessons: editLearned.trim(),
      reflections: editReflections.trim(),
      image: editImagePreview,
    });

    closeEditModal();
  };

  // Filtered List
  const filteredActivities = activities.filter((act) => {
    if (filterStudentId !== "ALL" && act.studentId !== filterStudentId) {
      return false;
    }
    if (filterType !== "ALL" && act.activityType !== filterType) {
      return false;
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchTitle = act.activityTitle.toLowerCase().includes(q);
      const matchStudent =
        act.studentName.toLowerCase().includes(q) ||
        act.studentId.toLowerCase().includes(q);
      const matchLearned = act.learnedLessons.toLowerCase().includes(q);
      const matchReflect = act.reflections.toLowerCase().includes(q);
      const matchKeywords = act.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchStudent || matchLearned || matchReflect || matchKeywords;
    }
    return true;
  });

  // Unique Student list
  const uniqueStudents = Array.from(
    new Set(activities.map((a) => JSON.stringify({ id: a.studentId, name: a.studentName })))
  ).map((s: string) => JSON.parse(s) as { id: string; name: string });

  const getTypeStyle = (type: string) => {
    const found = ACTIVITY_TYPES.find((t) => t.label === type);
    return found ? found.color : "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Section - Write Activity Form */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              동아리 외부 행사 및 체험 활동 기록 작성
            </h2>
            <p className="text-xs text-slate-500">
              문학기행, 저자 초청 강연, 독서 캠프, 나눔 봉사 등 행사 참가 후 배운 점과 느낀 점을 포트폴리오로 누적합니다.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Student Id & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                학번 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="activity-student-id"
                placeholder="예: 20104 (2학년 1반 4번)"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                학생 이름 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="activity-student-name"
                placeholder="예: 김민서"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-colors"
                required
              />
            </div>
          </div>

          {/* Row 2: Activity Title, Type, and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                활동명 (행사/체험명) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="activity-title"
                placeholder="예: 윤동주 문학관 및 시인의 언덕 현장 문학기행"
                value={activityTitle}
                onChange={(e) => setActivityTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-colors"
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                활동 구분 <span className="text-rose-500">*</span>
              </label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-colors"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t.label} value={t.label}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                활동 일자
              </label>
              <input
                type="text"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
                placeholder="예: 2026. 04. 11."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Row 3: 배운 점 (Learned Lessons) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>배운 점 (새롭게 알게 된 사실, 지식 및 시야 확장)</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {learnedLessons.length}자
              </span>
            </div>
            <textarea
              id="activity-learned-lessons"
              rows={3}
              placeholder="해당 행사나 현장에서 새롭게 학습한 내용, 전시물이나 강연을 통해 알게 된 배경지식과 관점을 구체적으로 서술해주세요."
              value={learnedLessons}
              onChange={(e) => setLearnedLessons(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-colors resize-y"
              required
            />
          </div>

          {/* Row 4: 활동 느낀 점 (Reflections) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MessageSquareQuote className="w-3.5 h-3.5 text-emerald-600" />
                <span>활동 느낀 점 (개인적 성찰, 생각의 변화, 앞으로의 다짐)</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {reflections.length}자
              </span>
            </div>
            <textarea
              id="activity-reflections"
              rows={3}
              placeholder="활동에 참여하면서 마음에 와닿았던 순간, 기존의 생각과 달라진 점, 앞으로 나의 독서 및 진로 활동에 미칠 영향이나 실천 다짐을 적어주세요."
              value={reflections}
              onChange={(e) => setReflections(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-colors resize-y"
              required
            />
          </div>

          {/* Row 5: Photo Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              활동 사진 / 현장 인증샷 첨부 (선택)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
                id="activity-image-upload"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>사진 파일 선택</span>
              </button>
              <span className="text-[11px] text-slate-400">
                문학기행 인증샷, 수료증, 활동 사진 (5MB 이하)
              </span>

              {imagePreview && (
                <div className="relative inline-block mt-2 sm:mt-0">
                  <img
                    src={imagePreview}
                    alt="미리보기"
                    className="w-16 h-16 object-cover rounded-lg border border-slate-300 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-rose-600 shadow-xs cursor-pointer"
                    title="사진 삭제"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>활동기록 포트폴리오 등록하기</span>
            </button>
          </div>
        </form>
      </section>

      {/* 2. Filter & Search Bar */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>동아리 활동 누적 기록 ({filteredActivities.length}건)</span>
            </span>
          </div>

          {/* Student Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 shrink-0">작성자:</span>
            <select
              value={filterStudentId}
              onChange={(e) => setFilterStudentId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">전체 동아리원</option>
              {uniqueStudents.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Activity Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">
            구분:
          </span>
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterType === "ALL"
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            전체보기
          </button>
          {ACTIVITY_TYPES.map((t) => (
            <button
              key={t.label}
              onClick={() => setFilterType(t.label)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                filterType === t.label
                  ? `${t.color} ring-2 ring-emerald-500/30`
                  : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="활동명, 학생 이름, 배운 점, 느낀 점 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              지우기
            </button>
          )}
        </div>
      </section>

      {/* 3. Activity Records Feed */}
      <section className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 space-y-2">
            <Compass className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">
              해당 조건에 맞는 활동기록이 없습니다.
            </p>
            <p className="text-xs text-slate-400">
              상단의 작성 폼을 통해 첫 번째 동아리 행사 참가 기록을 등록해보세요!
            </p>
          </div>
        ) : (
          filteredActivities.map((act) => (
            <article
              key={act.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all space-y-4"
            >
              {/* Header: Title, Type Badge, Student Info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md border ${getTypeStyle(
                        act.activityType
                      )}`}
                    >
                      {act.activityType || "활동"}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      {act.activityTitle}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {act.studentName} ({act.studentId})
                    </span>
                    {act.activityDate && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        활동일: {act.activityDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Audit Timestamps */}
                <div className="flex flex-col sm:items-end gap-1 text-[11px] text-slate-400 shrink-0">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    작성: {act.createdAt || act.date}
                  </span>
                  {act.updatedAt && (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      최종 수정: {act.updatedAt} (수정됨)
                    </span>
                  )}
                </div>
              </div>

              {/* Two Column Content: 배운 점 & 활동 느낀 점 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. 배운 점 */}
                <div className="p-3.5 sm:p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>배운 점 (지식 및 시야 확장)</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                    {act.learnedLessons}
                  </p>
                </div>

                {/* 2. 활동 느낀 점 */}
                <div className="p-3.5 sm:p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <MessageSquareQuote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>활동 느낀 점 (성찰 및 다짐)</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                    {act.reflections}
                  </p>
                </div>
              </div>

              {/* Photo Thumbnail if exists */}
              {act.image && (
                <div className="pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    현장 인증 사진:
                  </span>
                  <img
                    src={act.image}
                    alt={act.activityTitle}
                    onClick={() => setPreviewModalImg(act.image!)}
                    className="max-h-48 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:opacity-90 transition-opacity object-cover"
                  />
                </div>
              )}

              {/* Footer Actions: Likes, Edit, Delete */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => onLikeActivity(act.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      (act.likes || 0) > 0
                        ? "fill-rose-500 text-rose-500"
                        : "text-slate-400"
                    }`}
                  />
                  <span>공감 {act.likes || 0}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(act)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer font-medium"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>수정</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`'${act.activityTitle}' 활동기록을 삭제하시겠습니까?`)) {
                        onDeleteActivity(act.id);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>삭제</span>
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      {/* 4. Edit Activity Modal */}
      {editingActivity && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto"
          onClick={closeEditModal}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    활동기록 수정 ({editingActivity.studentName})
                  </h3>
                  <p className="text-xs text-slate-500">
                    수정 시 최종 수정 일시(Audit Timestamp)가 기록됩니다.
                  </p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    활동명
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white"
                    required
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    활동 구분
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white"
                  >
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t.label} value={t.label}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    활동 일자
                  </label>
                  <input
                    type="text"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  💡 배운 점
                </label>
                <textarea
                  rows={3}
                  value={editLearned}
                  onChange={(e) => setEditLearned(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white resize-y"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  💭 활동 느낀 점
                </label>
                <textarea
                  rows={3}
                  value={editReflections}
                  onChange={(e) => setEditReflections(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white resize-y"
                  required
                />
              </div>

              {/* Edit Image */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  활동 사진 첨부
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={editFileInputRef}
                    onChange={handleEditImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200"
                  >
                    사진 변경/업로드
                  </button>
                  {editImagePreview && (
                    <div className="relative">
                      <img
                        src={editImagePreview}
                        alt="사진 미리보기"
                        className="w-12 h-12 rounded object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => setEditImagePreview(null)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>수정 내용 저장</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Image Full Preview Modal */}
      {previewModalImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewModalImg(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={previewModalImg}
              alt="확대 보기"
              className="max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            />
            <button
              onClick={() => setPreviewModalImg(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white text-slate-800 rounded-full flex items-center justify-center font-bold shadow-lg hover:bg-slate-100 text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
