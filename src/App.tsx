import React, { useState, useEffect } from "react";
import { BookReport, DiscussionPost, ClubInfo, ActivityRecord, StudentUser, StudentRosterItem } from "./types";
import { initialClubInfo, initialReports, initialDiscussions, initialActivities } from "./data/initialData";
import { Header } from "./components/Header";
import { PortfolioTab } from "./components/PortfolioTab";
import { ActivityTab } from "./components/ActivityTab";
import { DiscussionTab } from "./components/DiscussionTab";
import { AdminTab } from "./components/AdminTab";
import { StudentLoginView } from "./components/StudentLoginView";
import { formatCurrentDateTime, formatDateOnly } from "./utils";
import {
  sendReportToGoogleSheets,
  sendActivityToGoogleSheets,
  getStoredStudentRoster,
  saveStudentRoster,
  fetchRosterFromGoogleSheets,
  fetchRosterFromServer,
} from "./services/googleSheetsService";
import { CheckCircle2, FileSpreadsheet, X } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"portfolio" | "activity" | "discussion" | "admin">("portfolio");

  // Student Authentication State
  const [currentStudent, setCurrentStudent] = useState<StudentUser | null>(() => {
    try {
      const saved = localStorage.getItem("currentStudent");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [rosterCount, setRosterCount] = useState<number>(() => {
    return getStoredStudentRoster().length;
  });
  const [isRefreshingRoster, setIsRefreshingRoster] = useState(false);

  // Admin Authentication State (Default password: "1234")
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    try {
      return localStorage.getItem("adminPassword") || "1234";
    } catch {
      return "1234";
    }
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  // Toast notification for Google Sheets auto-sync
  const [syncToast, setSyncToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  const showSyncToast = (message: string) => {
    setSyncToast({ message, visible: true });
    setTimeout(() => {
      setSyncToast((prev) => ({ ...prev, visible: false }));
    }, 4000);
  };

  // Common Club Info State (Book, Topic, Schedule)
  const [clubInfo, setClubInfo] = useState<ClubInfo>(() => {
    try {
      const saved = localStorage.getItem("clubInfo");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.currentBook) return parsed;
      }
    } catch (e) {
      console.error("Failed to load clubInfo from localStorage", e);
    }
    return initialClubInfo;
  });

  // Load reports from localStorage or initialize with high school sample data
  const [reports, setReports] = useState<BookReport[]>(() => {
    try {
      const saved = localStorage.getItem("reports");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load reports from localStorage", e);
    }
    return initialReports;
  });

  // Load activities from localStorage or initialize with high school sample data
  const [activities, setActivities] = useState<ActivityRecord[]>(() => {
    try {
      const saved = localStorage.getItem("activities");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load activities from localStorage", e);
    }
    return initialActivities;
  });

  // Load discussions from localStorage or initialize with high school sample data
  const [discussions, setDiscussions] = useState<DiscussionPost[]>(() => {
    try {
      const saved = localStorage.getItem("discussions");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load discussions from localStorage", e);
    }
    return initialDiscussions;
  });

  // Keep localStorage synchronized
  useEffect(() => {
    try {
      localStorage.setItem("reports", JSON.stringify(reports));
    } catch (e) {
      console.error("Failed to save reports to localStorage", e);
    }
  }, [reports]);

  useEffect(() => {
    try {
      localStorage.setItem("activities", JSON.stringify(activities));
    } catch (e) {
      console.error("Failed to save activities to localStorage", e);
    }
  }, [activities]);

  useEffect(() => {
    try {
      localStorage.setItem("discussions", JSON.stringify(discussions));
    } catch (e) {
      console.error("Failed to save discussions to localStorage", e);
    }
  }, [discussions]);

  useEffect(() => {
    try {
      localStorage.setItem("clubInfo", JSON.stringify(clubInfo));
    } catch (e) {
      console.error("Failed to save clubInfo to localStorage", e);
    }
  }, [clubInfo]);

  // One-time cleanup to ensure only 1 example is retained as requested
  useEffect(() => {
    try {
      if (localStorage.getItem("data_example_trimmed_v1") !== "true") {
        if (reports.length > 1) {
          setReports(initialReports);
        }
        if (activities.length > 1) {
          setActivities(initialActivities);
        }
        if (discussions.length > 1) {
          setDiscussions(initialDiscussions);
        }
        localStorage.setItem("data_example_trimmed_v1", "true");
      }
    } catch (e) {
      console.error("Failed to clean up extra examples", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("adminPassword", adminPassword);
    } catch (e) {
      console.error("Failed to save adminPassword to localStorage", e);
    }
  }, [adminPassword]);

  // Sync roster from backend server on initial app load
  useEffect(() => {
    fetchRosterFromServer()
      .then((students) => {
        if (Array.isArray(students) && students.length > 0) {
          saveStudentRoster(students);
          setRosterCount(getStoredStudentRoster().length);
        } else {
          setRosterCount(getStoredStudentRoster().length);
        }
      })
      .catch((err) => {
        console.warn("Initial roster fetch notice:", err);
        setRosterCount(getStoredStudentRoster().length);
      });
  }, []);

  // Admin authentication handlers
  const handleLoginAdmin = (passwordAttempt: string): boolean => {
    if (passwordAttempt === adminPassword) {
      setIsAdminAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLockAdmin = () => {
    setIsAdminAuthenticated(false);
  };

  const handleChangeAdminPassword = (newPassword: string) => {
    setAdminPassword(newPassword);
  };

  // Student authentication handlers
  const handleStudentLogin = (student: StudentUser) => {
    setCurrentStudent(student);
    try {
      localStorage.setItem("currentStudent", JSON.stringify(student));
    } catch (e) {
      console.error("Failed to save currentStudent to localStorage", e);
    }
    setActiveTab("portfolio");
  };

  const handleStudentLogout = () => {
    setCurrentStudent(null);
    try {
      localStorage.removeItem("currentStudent");
    } catch (e) {
      console.error("Failed to remove currentStudent from localStorage", e);
    }
  };

  const handleRefreshRoster = async () => {
    setIsRefreshingRoster(true);
    try {
      await fetchRosterFromServer();
      await fetchRosterFromGoogleSheets();
      const currentList = getStoredStudentRoster();
      setRosterCount(currentList.length);
      showSyncToast(`동아리 학생 명단 ${currentList.length}명의 정보가 정상 연동되었습니다.`);
    } catch (e: any) {
      showSyncToast(`명단 최신화 오류: ${e?.message || e}`);
    } finally {
      setIsRefreshingRoster(false);
    }
  };

  // Club Info update handler
  const handleUpdateClubInfo = (updatedInfo: Partial<ClubInfo>) => {
    setClubInfo((prev) => ({
      ...prev,
      ...updatedInfo,
    }));
  };

  // Save new book report (records initial createdAt) and sync to Google Sheets
  const handleSaveReport = (
    newReportData: Omit<BookReport, "id" | "date" | "likes">
  ) => {
    const nowStr = formatCurrentDateTime();
    const dateStr = formatDateOnly();

    const newReport: BookReport = {
      ...newReportData,
      id: Date.now(),
      date: dateStr,
      likes: 0,
      createdAt: nowStr,
    };

    setReports((prev) => [newReport, ...prev]);

    // Send to Google Sheets Web App
    sendReportToGoogleSheets(newReport).then(() => {
      showSyncToast(`📊 《${newReport.bookTitle}》 독서기록이 구글 스프레드시트에 자동 전송되었습니다.`);
    });
  };

  // Update existing book report (records updatedAt audit timestamp) and sync to Google Sheets
  const handleUpdateReport = (updatedReport: BookReport) => {
    const nowStr = formatCurrentDateTime();
    const finalReport: BookReport = {
      ...updatedReport,
      updatedAt: nowStr,
    };

    setReports((prev) =>
      prev.map((r) => {
        if (r.id === updatedReport.id) {
          finalReport.createdAt = r.createdAt || r.date || nowStr;
          return finalReport;
        }
        return r;
      })
    );

    // Send updated report to Google Sheets Web App
    sendReportToGoogleSheets(finalReport).then(() => {
      showSyncToast(`📊 수정된 독서기록이 구글 스프레드시트에 전송되었습니다.`);
    });
  };

  // Delete book report
  const handleDeleteReport = (id: string | number) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  // Like book report
  const handleLikeReport = (id: string | number) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, likes: (r.likes || 0) + 1 } : r))
    );
  };

  // Save new activity record (records initial createdAt) and sync to Google Sheets
  const handleSaveActivity = (
    newActivityData: Omit<ActivityRecord, "id" | "date" | "likes">
  ) => {
    const nowStr = formatCurrentDateTime();
    const dateStr = formatDateOnly();

    const newActivity: ActivityRecord = {
      ...newActivityData,
      id: Date.now(),
      date: dateStr,
      likes: 0,
      createdAt: nowStr,
    };

    setActivities((prev) => [newActivity, ...prev]);

    // Send to Google Sheets Web App
    sendActivityToGoogleSheets(newActivity).then(() => {
      showSyncToast(`📊 '${newActivity.activityTitle}' 활동기록이 구글 스프레드시트에 자동 전송되었습니다.`);
    });
  };

  // Update existing activity record (records updatedAt audit timestamp) and sync to Google Sheets
  const handleUpdateActivity = (updatedActivity: ActivityRecord) => {
    const nowStr = formatCurrentDateTime();
    const finalActivity: ActivityRecord = {
      ...updatedActivity,
      updatedAt: nowStr,
    };

    setActivities((prev) =>
      prev.map((a) => {
        if (a.id === updatedActivity.id) {
          finalActivity.createdAt = a.createdAt || a.date || nowStr;
          return finalActivity;
        }
        return a;
      })
    );

    sendActivityToGoogleSheets(finalActivity).then(() => {
      showSyncToast(`📊 수정된 활동기록이 구글 스프레드시트에 전송되었습니다.`);
    });
  };

  // Delete activity record
  const handleDeleteActivity = (id: string | number) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  // Import submissions from Google Sheets and synchronize into website state
  const handleImportFromSheets = (
    importedReports: BookReport[],
    importedActivities: ActivityRecord[],
    mode: "merge" | "replace" = "merge",
    importedStudents?: StudentRosterItem[]
  ) => {
    if (importedStudents && importedStudents.length > 0) {
      saveStudentRoster(importedStudents);
      setRosterCount(importedStudents.length);
    }

    if (mode === "replace") {
      setReports(importedReports);
      setActivities(importedActivities);
    } else {
      setReports((prev) => {
        const existingKeys = new Set(prev.map((r) => `${r.studentId}_${r.bookTitle}`.toLowerCase()));
        const newReports = importedReports.filter(
          (r) => !existingKeys.has(`${r.studentId}_${r.bookTitle}`.toLowerCase())
        );
        return [...newReports, ...prev];
      });

      setActivities((prev) => {
        const existingKeys = new Set(prev.map((a) => `${a.studentId}_${a.activityTitle}`.toLowerCase()));
        const newActs = importedActivities.filter(
          (a) => !existingKeys.has(`${a.studentId}_${a.activityTitle}`.toLowerCase())
        );
        return [...newActs, ...prev];
      });
    }

    const studentMsg = importedStudents && importedStudents.length > 0 ? `, 학생명단 ${importedStudents.length}명` : "";
    showSyncToast(
      `스프레드시트에서 독후감 ${importedReports.length}건, 체험활동 ${importedActivities.length}건${studentMsg}을 웹사이트로 불러왔습니다!`
    );
  };

  // Like activity record
  const handleLikeActivity = (id: string | number) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, likes: (a.likes || 0) + 1 } : a))
    );
  };

  // Save new discussion post (records initial createdAt)
  const handleSaveDiscussion = (
    newPostData: Omit<DiscussionPost, "id" | "date" | "likes" | "comments">
  ) => {
    const nowStr = formatCurrentDateTime();
    const dateStr = formatDateOnly();

    const newPost: DiscussionPost = {
      ...newPostData,
      id: Date.now(),
      date: dateStr,
      likes: 0,
      comments: [],
      createdAt: nowStr,
    };

    setDiscussions((prev) => [newPost, ...prev]);
  };

  // Update existing discussion post (records updatedAt audit timestamp)
  const handleUpdateDiscussion = (updatedDiscussion: DiscussionPost) => {
    const nowStr = formatCurrentDateTime();
    setDiscussions((prev) =>
      prev.map((d) => {
        if (d.id === updatedDiscussion.id) {
          return {
            ...updatedDiscussion,
            createdAt: d.createdAt || d.date || nowStr,
            updatedAt: nowStr,
          };
        }
        return d;
      })
    );
  };

  // Add comment to discussion
  const handleAddComment = (
    discId: string | number,
    studentName: string,
    text: string
  ) => {
    const dateStr = formatCurrentDateTime();

    const newComment = {
      id: `c_${Date.now()}`,
      studentName,
      text,
      date: dateStr,
    };

    setDiscussions((prev) =>
      prev.map((d) => {
        if (d.id === discId) {
          return {
            ...d,
            comments: [...(d.comments || []), newComment],
          };
        }
        return d;
      })
    );
  };

  // Like discussion
  const handleLikeDiscussion = (discId: string | number) => {
    setDiscussions((prev) =>
      prev.map((d) =>
        d.id === discId ? { ...d, likes: (d.likes || 0) + 1 } : d
      )
    );
  };

  // Delete discussion post
  const handleDeleteDiscussion = (discId: string | number) => {
    setDiscussions((prev) => prev.filter((d) => d.id !== discId));
  };

  // Reset to demo data
  const handleResetData = () => {
    setReports(initialReports);
    setActivities(initialActivities);
    setDiscussions(initialDiscussions);
    setClubInfo(initialClubInfo);
    localStorage.setItem("reports", JSON.stringify(initialReports));
    localStorage.setItem("activities", JSON.stringify(initialActivities));
    localStorage.setItem("discussions", JSON.stringify(initialDiscussions));
    localStorage.setItem("clubInfo", JSON.stringify(initialClubInfo));
  };

  // Clear all demo/example data (start empty for real school year)
  const handleClearAllData = () => {
    setReports([]);
    setActivities([]);
    setDiscussions([]);
    localStorage.setItem("reports", JSON.stringify([]));
    localStorage.setItem("activities", JSON.stringify([]));
    localStorage.setItem("discussions", JSON.stringify([]));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        reportCount={reports.length}
        activityCount={activities.length}
        discussionCount={discussions.length}
        isAdminAuthenticated={isAdminAuthenticated}
        currentStudent={currentStudent}
        onStudentLogout={handleStudentLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {!currentStudent && activeTab !== "admin" ? (
          <StudentLoginView
            onLoginSuccess={handleStudentLogin}
            onTeacherLogin={() => setActiveTab("admin")}
            rosterCount={rosterCount}
            onRefreshRoster={handleRefreshRoster}
            isRefreshingRoster={isRefreshingRoster}
          />
        ) : (
          <>
            {/* Tab 1: 내 독후감 포트폴리오 */}
            <div
              id="tab-portfolio"
              className={`tab-content ${activeTab === "portfolio" ? "block" : "hidden"}`}
            >
              <PortfolioTab
                reports={reports}
                onSaveReport={handleSaveReport}
                onUpdateReport={handleUpdateReport}
                onDeleteReport={handleDeleteReport}
                onLikeReport={handleLikeReport}
                currentStudent={currentStudent}
              />
            </div>

            {/* Tab 2: 활동기록 (행사/체험/특강) */}
            <div
              id="tab-activity"
              className={`tab-content ${activeTab === "activity" ? "block" : "hidden"}`}
            >
              <ActivityTab
                activities={activities}
                onSaveActivity={handleSaveActivity}
                onUpdateActivity={handleUpdateActivity}
                onDeleteActivity={handleDeleteActivity}
                onLikeActivity={handleLikeActivity}
              />
            </div>

            {/* Tab 3: 공통도서 토론장 */}
            <div
              id="tab-discussion"
              className={`tab-content ${activeTab === "discussion" ? "block" : "hidden"}`}
            >
              <DiscussionTab
                discussions={discussions}
                clubInfo={clubInfo}
                onSaveDiscussion={handleSaveDiscussion}
                onUpdateDiscussion={handleUpdateDiscussion}
                onAddComment={handleAddComment}
                onLikeDiscussion={handleLikeDiscussion}
              />
            </div>

            {/* Tab 4: 관리자 모드 (교사용) */}
            <div
              id="tab-admin"
              className={`tab-content ${activeTab === "admin" ? "block" : "hidden"}`}
            >
              <AdminTab
                reports={reports}
                discussions={discussions}
                activities={activities}
                clubInfo={clubInfo}
                onUpdateClubInfo={handleUpdateClubInfo}
                onResetData={handleResetData}
                onClearAllData={handleClearAllData}
                onDeleteReport={handleDeleteReport}
                onDeleteActivity={handleDeleteActivity}
                onDeleteDiscussion={handleDeleteDiscussion}
                onUpdateReport={handleUpdateReport}
                onUpdateActivity={handleUpdateActivity}
                onImportFromSheets={handleImportFromSheets}
                isAdminAuthenticated={isAdminAuthenticated}
                onLoginAdmin={handleLoginAdmin}
                onLockAdmin={handleLockAdmin}
                onChangeAdminPassword={handleChangeAdminPassword}
                onBackToStudentView={() => setActiveTab("portfolio")}
              />
            </div>
          </>
        )}
      </main>

      {/* Google Sheets Sync Floating Toast Notification */}
      {syncToast.visible && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5 mb-0.5">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>구글 스프레드시트 연동</span>
            </div>
            <p className="text-slate-200">{syncToast.message}</p>
          </div>
          <button
            onClick={() => setSyncToast((prev) => ({ ...prev, visible: false }))}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium text-slate-600">
            📖 다독다독동아리 포트폴리오 및 활동 관리 시스템
          </p>
          <p className="text-slate-400">
            2026학년도 정규 독서동아리 활동 기록부 · 구글 스프레드시트(Google Sheets) 실시간 연동 지원
          </p>
        </div>
      </footer>
    </div>
  );
}
