export interface BookQuote {
  quote: string;
  page?: string;
}

export interface BookReport {
  id: string | number;
  logNo?: string; // No. 기록 회차 번호
  studentId: string;
  studentName: string;
  bookTitle: string;
  author?: string; // 저자 · 옮긴이
  publisher?: string; // 출판사
  readingPeriod?: string; // 읽은 기간 (예: 9.3 ~ 9.28)
  category?: string; // 분야 (에세이 / 소설 / 인문 / 사회 등)
  pageCount?: string | number; // 쪽수
  rating?: number; // 별점 (1~5)
  readStatus?: "완독" | "읽는 중" | "중단"; // 완독 여부
  summary?: string; // 줄거리 & 핵심 내용
  quotes?: BookQuote[]; // 인상 깊은 문장 (문장 + 쪽수)
  thoughts?: string; // 나의 생각 · 느낀 점
  nextBook?: string; // 다음에 읽고 싶은 책
  content: string; // 통합 본문 (호환용)
  aiSummary: string; // 교사용 지도 생기부 문구 (관리자 탭 전용)
  keywords?: string[];
  thoughtQuestion?: string;
  subjectLink?: string;
  image?: string | null;
  date: string; // 등록 날짜 (YYYY. MM. DD.)
  createdAt?: string;
  updatedAt?: string;
  likes?: number;
}

export interface DiscussionComment {
  id: string;
  studentName: string;
  text: string;
  date?: string;
}

export interface DiscussionPost {
  id: string | number;
  studentId: string;
  studentName: string;
  content: string;
  image?: string | null;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  likes?: number;
  comments: DiscussionComment[];
}

export interface ActivityRecord {
  id: string | number;
  studentId: string;
  studentName: string;
  activityTitle: string;
  activityType: string;
  activityDate: string;
  learnedLessons: string;
  reflections: string;
  aiSummary?: string;
  keywords?: string[];
  image?: string | null;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  likes?: number;
}

export interface ClubInfo {
  name: string;
  grade: string;
  currentBook: string;
  currentTopic: string;
  nextMeeting: string;
  targetCount: number;
}

export interface StudentUser {
  studentId: string;
  studentName: string;
}

export interface StudentRosterItem {
  studentId: string;
  studentName: string;
  password: string; // 4자리 숫자
}
