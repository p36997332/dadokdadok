import React, { useState, useRef } from "react";
import { DiscussionPost, ClubInfo } from "../types";
import {
  MessageSquare,
  Send,
  Upload,
  X,
  Heart,
  Calendar,
  User,
  BookOpen,
  HelpCircle,
  MessageCircle,
  Clock,
  ThumbsUp,
  Info,
  Pencil,
  Save,
} from "lucide-react";

interface DiscussionTabProps {
  discussions: DiscussionPost[];
  clubInfo: ClubInfo;
  onSaveDiscussion: (
    post: Omit<DiscussionPost, "id" | "date" | "likes" | "comments">
  ) => void;
  onUpdateDiscussion: (post: DiscussionPost) => void;
  onAddComment: (discId: string | number, studentName: string, text: string) => void;
  onLikeDiscussion: (discId: string | number) => void;
}

export const DiscussionTab: React.FC<DiscussionTabProps> = ({
  discussions,
  clubInfo,
  onSaveDiscussion,
  onUpdateDiscussion,
  onAddComment,
  onLikeDiscussion,
}) => {
  // Post form states
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [content, setContent] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Edit discussion state
  const [editingDiscussion, setEditingDiscussion] = useState<DiscussionPost | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const openEditDiscussionModal = (disc: DiscussionPost) => {
    setEditingDiscussion(disc);
    setEditContent(disc.content);
    setEditImagePreview(disc.image || null);
  };

  const closeEditDiscussionModal = () => {
    setEditingDiscussion(null);
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

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDiscussion) return;

    if (!editContent.trim()) {
      alert("토론 의견 또는 발제 내용을 입력해주세요.");
      return;
    }

    onUpdateDiscussion({
      ...editingDiscussion,
      content: editContent.trim(),
      image: editImagePreview,
    });

    closeEditDiscussionModal();
    alert("토론글이 성공적으로 수정되었으며 최종 수정 시간이 갱신되었습니다!");
  };

  // Comment input per discussion state
  const [commentInputs, setCommentInputs] = useState<
    Record<string | number, { name: string; text: string }>
  >({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 첨부할 수 있습니다.");
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId.trim() || !studentName.trim()) {
      alert("학번과 이름을 모두 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      alert("토론 의견 또는 발제 내용을 입력해주세요.");
      return;
    }

    onSaveDiscussion({
      studentId: studentId.trim(),
      studentName: studentName.trim(),
      content: content.trim(),
      image: imagePreview,
    });

    setContent("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    alert("토론글이 성공적으로 등록되었습니다!");
  };

  const handleCommentChange = (
    discId: string | number,
    field: "name" | "text",
    val: string
  ) => {
    setCommentInputs((prev) => ({
      ...prev,
      [discId]: {
        name: field === "name" ? val : prev[discId]?.name || "",
        text: field === "text" ? val : prev[discId]?.text || "",
      },
    }));
  };

  const handleSubmitComment = (discId: string | number) => {
    const current = commentInputs[discId];
    if (!current?.name?.trim() || !current?.text?.trim()) {
      alert("이름과 댓글 내용을 모두 입력해주세요.");
      return;
    }

    onAddComment(discId, current.name.trim(), current.text.trim());

    // Clear only text input, keep name for convenience
    setCommentInputs((prev) => ({
      ...prev,
      [discId]: {
        name: current.name,
        text: "",
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Club Common Book Announcement Banner */}
      <section
        id="club-announcement-card"
        className="rounded-2xl p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-sm"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-200 mb-2">
          <BookOpen className="w-4 h-4 text-blue-300" />
          <span>이번 달 동아리 공통 선정도서 및 발제</span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold tracking-tight mb-2 text-white">
          {clubInfo.currentBook}
        </h3>
        <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed mb-3 bg-white/10 p-3 rounded-xl border border-white/10">
          💡 <strong>토론 주제:</strong> {clubInfo.currentTopic}
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-blue-200">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            정기 토론 모임: {clubInfo.nextMeeting}
          </span>
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            자유롭게 찬반 의견 및 감상을 공유해주세요!
          </span>
        </div>
      </section>

      {/* Discussion Post Creation Form */}
      <section
        id="new-discussion-card"
        className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs"
      >
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
          <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
            💬
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              공통도서 토론 의견 작성
            </h3>
            <p className="text-xs text-slate-500">
              도서에 대한 나의 견해, 의문점, 친구들과 토론해보고 싶은 주제를 자유롭게 작성해주세요.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitPost} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="disc-user-id"
                className="block text-xs font-semibold text-slate-600 mb-1.5"
              >
                학번 <span className="text-rose-500">*</span>
              </label>
              <input
                id="disc-user-id"
                type="text"
                placeholder="예: 20101"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="disc-user-name"
                className="block text-xs font-semibold text-slate-600 mb-1.5"
              >
                이름 <span className="text-rose-500">*</span>
              </label>
              <input
                id="disc-user-name"
                type="text"
                placeholder="예: 이도윤"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="disc-content"
              className="block text-xs font-semibold text-slate-600 mb-1.5"
            >
              토론 의견 및 발제 내용 <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="disc-content"
              rows={4}
              placeholder="공통도서에 대한 의견이나 발제 내용을 자유롭게 적어주세요. (주장에 대한 근거와 책의 구절을 인용하면 더욱 좋습니다)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-colors resize-y"
            />
          </div>

          {/* Photo attachment */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input
              ref={fileInputRef}
              id="disc-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />

            {imagePreview && (
              <div className="relative inline-flex items-center gap-2 bg-slate-100 p-1.5 pr-3 rounded-xl border border-slate-200">
                <img
                  src={imagePreview}
                  alt="토론 첨부 이미지"
                  className="w-10 h-10 object-cover rounded-lg"
                />
                <span className="text-xs text-slate-600 font-medium">
                  사진 첨부됨
                </span>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <button
            id="btn-save-discussion"
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm sm:text-base shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>토론글 등록</span>
          </button>
        </form>
      </section>

      {/* Discussion List & Comments */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <span>동아리 토론 피드 ({discussions.length}건)</span>
          </h3>
          <span className="text-xs text-slate-500">
            친구들의 의견에 댓글로 반론이나 지지 의견을 남겨보세요.
          </span>
        </div>

        <div id="discussion-list" className="space-y-4">
          {discussions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-sm">
                등록된 공통도서 토론글이 없습니다.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                첫 번째 토론 발제를 남겨 토론을 시작해보세요!
              </p>
            </div>
          ) : (
            discussions.map((disc) => {
              const currentInput = commentInputs[disc.id] || {
                name: "",
                text: "",
              };

              return (
                <article
                  key={disc.id}
                  id={`discussion-item-${disc.id}`}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4"
                >
                  {/* Post Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {disc.studentName.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
                          <span>💬 {disc.studentId} {disc.studentName}의 의견</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>작성: {disc.createdAt || disc.date}</span>
                          </span>
                          {disc.updatedAt && (
                            <span
                              className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 font-medium"
                              title="최종 수정 일시"
                            >
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>최종 수정: {disc.updatedAt} (수정됨)</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => openEditDiscussionModal(disc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                        title="토론글 수정"
                      >
                        <Pencil className="w-3.5 h-3.5 text-blue-600" />
                        <span>수정</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onLikeDiscussion(disc.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <ThumbsUp
                          className={`w-3.5 h-3.5 ${
                            (disc.likes || 0) > 0 ? "fill-blue-500 text-blue-500" : ""
                          }`}
                        />
                        <span>공감 {disc.likes || 0}</span>
                      </button>
                    </div>
                  </div>

                  {/* Post Body */}
                  <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                    {disc.content}
                  </div>

                  {disc.image && (
                    <div className="pt-1">
                      <img
                        src={disc.image}
                        alt="토론 첨부 사진"
                        className="max-h-60 rounded-xl object-cover border border-slate-200"
                      />
                    </div>
                  )}

                  {/* Comment Section */}
                  <div className="bg-slate-50/80 rounded-xl p-3.5 sm:p-4 border border-slate-200/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        댓글 ({disc.comments?.length || 0})
                      </span>
                      <span className="text-[11px] text-slate-400">
                        상호 존중의 토론 에티켓을 지켜주세요
                      </span>
                    </div>

                    {/* Existing Comments List */}
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {(!disc.comments || disc.comments.length === 0) ? (
                        <p className="text-xs text-slate-400 py-1">
                          아직 작성된 댓글이 없습니다. 첫 의견을 남겨보세요!
                        </p>
                      ) : (
                        disc.comments.map((c) => (
                          <div
                            key={c.id}
                            className="bg-white p-2.5 rounded-lg border border-slate-200/60 text-xs text-slate-700 flex flex-col gap-0.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900">
                                {c.studentName}
                              </span>
                              {c.date && (
                                <span className="text-[10px] text-slate-400">
                                  {c.date}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-700 leading-normal">
                              {c.text}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Comment Input Row */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-slate-200/60">
                      <input
                        type="text"
                        id={`comment-name-${disc.id}`}
                        placeholder="이름 (예: 김민서)"
                        value={currentInput.name}
                        onChange={(e) =>
                          handleCommentChange(disc.id, "name", e.target.value)
                        }
                        className="w-full sm:w-28 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        id={`comment-text-${disc.id}`}
                        placeholder="찬성, 반대, 추가 질문 등 댓글을 달아주세요..."
                        value={currentInput.text}
                        onChange={(e) =>
                          handleCommentChange(disc.id, "text", e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSubmitComment(disc.id);
                          }
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleSubmitComment(disc.id)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap"
                      >
                        등록
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* Edit Discussion Modal */}
      {editingDiscussion && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto"
          onClick={closeEditDiscussionModal}
        >
          <div
            className="relative w-full max-w-xl bg-white rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
                  ✏️
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    토론 발제글 수정
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-medium text-slate-700">
                      작성자: {editingDiscussion.studentId} {editingDiscussion.studentName}
                    </span>
                    <span>•</span>
                    <span>
                      최초 작성: {editingDiscussion.createdAt || editingDiscussion.date}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={closeEditDiscussionModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  토론 발제 및 의견 내용 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white resize-y"
                  placeholder="수정할 토론 내용을 입력하세요."
                />
              </div>

              {/* Photo attachment edit */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  인증 사진 변경/첨부
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
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
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Notice regarding timestamp update */}
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>수정 로그 기록:</strong> 저장을 완료하면 최초 작성 일시는 보존되며, 현재 시간이 <strong>최종 수정 일시</strong>로 기록되어 모든 동아리원에게 투명하게 표시됩니다.
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEditDiscussionModal}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>수정 내용 저장</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
