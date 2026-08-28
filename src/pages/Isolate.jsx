import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import IsolateLanding from "@/components/isolate/IsolateLanding";
import IsolateDashboard from "@/components/isolate/IsolateDashboard";
import IsolateBuilder from "@/components/isolate/IsolateBuilder";
import IsolateCourseView from "@/components/isolate/IsolateCourseView";
import IsolateModuleView from "@/components/isolate/IsolateModuleView";

export default function IsolatePage() {
  const [view, setView] = useState("landing");
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const loadCourses = useCallback(async () => {
    if (!user?.email) return;
    try {
      const list = await base44.entities.IsolateCourse.filter(
        { user_email: user.email },
        "-created_date",
        50
      );
      setCourses(list);
    } catch (e) {
      console.error("Failed to load courses", e);
    }
  }, [user]);

  useEffect(() => {
    if (user?.email) loadCourses();
  }, [user, loadCourses]);

  const handleStart = () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setView("dashboard");
  };

  const handleCourseCreated = (course) => {
    setCourses((prev) => [course, ...prev]);
    setActiveCourse(course);
    setView("course");
  };

  const handleOpenCourse = (course) => {
    setActiveCourse(course);
    setView("course");
  };

  const handleOpenCourseModule = (course, idx) => {
    setActiveCourse(course);
    setActiveModuleIdx(idx);
    setView("module");
  };

  const handleOpenModule = (idx) => {
    setActiveModuleIdx(idx);
    setView("module");
  };

  const handleUpdateCourse = (updated) => {
    setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setActiveCourse(updated);
  };

  const handleBackToDashboard = () => {
    loadCourses();
    setView("dashboard");
  };

  // ── Apple system font stack, applied globally to this page ──
  const appleFont = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif';

  return (
    <div style={{ fontFamily: appleFont }} className="min-h-screen bg-[#fbfbfd] text-zinc-900">
      {view === "landing" && <IsolateLanding onStart={handleStart} />}

      {view === "dashboard" && (
        <IsolateDashboard
          user={user}
          courses={courses}
          loading={loading}
          setLoading={setLoading}
          onNewCourse={() => setView("builder")}
          onOpenCourse={handleOpenCourse}
          onOpenCourseModule={handleOpenCourseModule}
          onBack={() => setView("landing")}
          onReload={loadCourses}
        />
      )}

      {view === "builder" && (
        <IsolateBuilder
          user={user}
          onCreated={handleCourseCreated}
          onBack={() => setView("dashboard")}
        />
      )}

      {view === "course" && activeCourse && (
        <IsolateCourseView
          course={activeCourse}
          user={user}
          onOpenModule={handleOpenModule}
          onUpdate={handleUpdateCourse}
          onBack={handleBackToDashboard}
        />
      )}

      {view === "module" && activeCourse && (
        <IsolateModuleView
          course={activeCourse}
          moduleIdx={activeModuleIdx}
          user={user}
          onUpdate={handleUpdateCourse}
          onBack={() => setView("course")}
          onNextModule={() => setActiveModuleIdx((i) => i + 1)}
          onJumpToModule={(idx) => setActiveModuleIdx(idx)}
        />
      )}
    </div>
  );
}