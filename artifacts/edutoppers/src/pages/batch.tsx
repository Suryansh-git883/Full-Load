import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { fetchBatchDetails, fetchLiveClasses } from "@/lib/api";
import type { Subject, Teacher, LiveClass } from "@/lib/types";

const PALETTES = [
  { from: "#6366f1", to: "#8b5cf6", badge: "#e0e7ff", badgeText: "#3730a3" },
  { from: "#ec4899", to: "#f43f5e", badge: "#ffe4e6", badgeText: "#9f1239" },
  { from: "#10b981", to: "#059669", badge: "#dcfce7", badgeText: "#166534" },
  { from: "#f59e0b", to: "#ef4444", badge: "#fef3c7", badgeText: "#92400e" },
  { from: "#0ea5e9", to: "#6366f1", badge: "#e0f2fe", badgeText: "#075985" },
  { from: "#8b5cf6", to: "#ec4899", badge: "#f5f3ff", badgeText: "#5b21b6" },
];
function getPalette(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return PALETTES[Math.abs(h) % PALETTES.length];
}

function LiveClassCard({ cls, batchId }: { cls: LiveClass; batchId: string }) {
  const tag = cls.tag || (cls.status === "LIVE" ? "Live" : "");
  const tagColor =
    tag === "Live" || cls.status === "LIVE"
      ? "bg-red-100 text-red-600 border-red-200"
      : tag === "Upcoming"
      ? "bg-amber-50 text-amber-600 border-amber-200"
      : "bg-slate-100 text-slate-500 border-slate-200";

  function openLive() {
    const lectureId = cls._id;
    const subjectId = cls.batchSubjectId || "";
    const title = encodeURIComponent(cls.topic || "");
    window.open(
      `/watch?batchId=${batchId}&subjectId=${subjectId}&lectureId=${lectureId}&title=${title}`,
      "_blank"
    );
  }

  const subjectName =
    typeof cls.subjectId === "object" ? cls.subjectId?.name : undefined;

  return (
    <div className="card rounded-2xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-slate-900 font-bold text-sm line-clamp-2 leading-snug">{cls.topic}</h3>
          {tag && (
            <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${tagColor}`}>
              {tag}
            </span>
          )}
        </div>
        {subjectName && <p className="text-slate-400 text-xs mb-2 truncate">{subjectName}</p>}
        {cls.startTime && (
          <p className="text-slate-400 text-xs mb-2.5">
            {new Date(cls.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            {cls.endTime && ` — ${new Date(cls.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`}
          </p>
        )}
        <button
          onClick={openLive}
          className="btn-primary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 inline-flex"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Watch
        </button>
      </div>
    </div>
  );
}

export default function BatchPage() {
  const params = useParams<{ batchId: string }>();
  const batchId = params.batchId;
  const [activeTab, setActiveTab] = useState<"subjects" | "live" | "info">("subjects");

  const detailsQuery = useQuery({
    queryKey: ["batch", batchId],
    queryFn: () => fetchBatchDetails(batchId),
    enabled: !!batchId,
  });

  const liveQuery = useQuery({
    queryKey: ["live", batchId],
    queryFn: () => fetchLiveClasses(batchId),
    enabled: activeTab === "live" && !!batchId,
  });

  const batchDetail = detailsQuery.data?.data || detailsQuery.data;
  const subjects: Subject[] = Array.isArray(batchDetail?.subjects)
    ? batchDetail.subjects
    : [];
  const startDate = batchDetail?.startDate ? new Date(batchDetail.startDate) : null;
  const status = String(batchDetail?.status || "").toLowerCase();
  const hasNotStarted =
    status.includes("upcoming") ||
    status.includes("not started") ||
    status.includes("coming soon") ||
    (startDate !== null &&
      !Number.isNaN(startDate.getTime()) &&
      startDate.getTime() > Date.now());

  const allTeachers: Teacher[] = Array.from(
    new Map(
      subjects.flatMap((s) => s.teacherIds || []).map((t) => [t._id, t])
    ).values()
  );

  const liveClasses: LiveClass[] = (() => {
    const d = liveQuery.data;
    if (!d) return [];
    if (Array.isArray(d.data)) return d.data;
    if (Array.isArray(d)) return d;
    return [];
  })();

  if (detailsQuery.isLoading) {
    return (
      <main className="page-bg min-h-screen">
        <Header />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
          <div className="h-32 shimmer rounded-3xl mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card rounded-2xl p-5 flex items-center gap-4">
                <div className="w-14 h-14 shimmer rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 shimmer rounded-lg" />
                  <div className="h-3 shimmer rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (detailsQuery.error || !batchDetail) {
    return (
      <main className="page-bg min-h-screen">
        <Header />
        <div className="max-w-[1400px] mx-auto px-4 py-32 text-center">
          <h2 className="text-slate-800 font-extrabold text-2xl mb-2">Batch Not Found</h2>
          <p className="text-red-400 mb-6">{(detailsQuery.error as Error)?.message || "Failed to load"}</p>
          <Link href="/" className="btn-primary px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const tabs = [
    { key: "subjects" as const, label: "Subjects", count: subjects.length },
    { key: "live" as const, label: "Live Classes", count: null },
    { key: "info" as const, label: "Info", count: null },
  ];

  return (
    <main className="page-bg min-h-screen">
      <Header />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6 animate-fade-up">
          <Link href="/" className="hover:text-indigo-600 transition-colors font-semibold flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </Link>
          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-500 truncate max-w-[280px] font-medium">{batchDetail.name}</span>
        </div>

        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden mb-8 hero-bg animate-fade-up">
          <div className="orb w-64 h-64 bg-white/10 -top-16 -right-16" />
          <div className="orb w-40 h-40 bg-violet-300/20 bottom-0 left-1/4" />
          <div className="relative z-10 px-7 sm:px-10 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white/90 text-xs font-bold border border-white/25 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {batchDetail.status?.toUpperCase() || "ACTIVE"}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-1">
                {batchDetail.name}
              </h1>
              {batchDetail.byName && <p className="text-white/65 text-sm">{batchDetail.byName}</p>}
            </div>
            <Link href="/" className="self-start flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all border border-white/25 flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="animate-fade-up" style={{ animationDelay: "150ms" }}>
          <div className="flex gap-1.5 mb-7 bg-slate-100/80 rounded-2xl p-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === tab.key
                    ? "tab-pill-active text-white"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/70"
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    activeTab === tab.key ? "bg-white/25 text-white" : "bg-slate-200 text-slate-600"
                  }`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Subjects */}
          {activeTab === "subjects" && (
            subjects.length === 0 ? (
              <div className="card rounded-3xl p-10 sm:p-16 text-center max-w-2xl mx-auto animate-fade-up">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-5">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332 0 4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-slate-900 font-extrabold text-xl mb-2">
                  {hasNotStarted ? "Batch has not started yet" : "No subjects available"}
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {hasNotStarted
                    ? "Subjects and course content will appear here when this batch begins."
                    : "There are no subjects available for this batch right now. Please check back later."}
                </p>
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject, i) => {
                const p = getPalette(subject.subject);
                return (
                  <Link
                    key={subject._id}
                    href={`/batch/${batchId}/subject/${subject._id}?subjectName=${encodeURIComponent(subject.subject)}`}
                    className="group block animate-fade-up"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="card rounded-2xl p-5 flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-all duration-300 overflow-hidden"
                        style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                      >
                        {subject.imageId ? (
                          <img src={`${subject.imageId.baseUrl}${subject.imageId.key}`} alt={subject.subject} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-slate-900 font-bold text-[15px] truncate group-hover:text-indigo-700 transition-colors">
                          {subject.subject}
                        </h3>
                        {subject.lectureCount !== undefined && (
                          <p className="text-slate-400 text-xs mt-0.5">{subject.lectureCount} lectures</p>
                        )}
                        <span className="cat-pill mt-1.5 inline-block" style={{ background: p.badge, color: p.badgeText }}>
                          Subject
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center transition-all flex-shrink-0">
                        <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
             </div>
             )
           )}

          {/* Live */}
          {activeTab === "live" && (
            <div>
              {liveQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="card rounded-2xl p-4 flex items-start gap-3">
                      <div className="w-10 h-10 shimmer rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 shimmer rounded" />
                        <div className="h-3 shimmer rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : liveClasses.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 font-semibold">No live classes today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {liveClasses.map((cls) => (
                    <LiveClassCard key={cls._id} cls={cls} batchId={batchId} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Info */}
          {activeTab === "info" && (
            <div className="max-w-2xl space-y-4">
              {batchDetail.description && (
                <div className="card rounded-2xl p-5">
                  <h3 className="font-bold text-slate-900 mb-3">About this batch</h3>
                  <div className="text-slate-600 text-sm leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: batchDetail.description }} />
                </div>
              )}
              {allTeachers.length > 0 && (
                <div className="card rounded-2xl p-5">
                  <h3 className="font-bold text-slate-900 mb-4">Faculty</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allTeachers.map((t) => (
                      <div key={t._id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {t.imageId ? (
                            <img src={`${t.imageId.baseUrl}${t.imageId.key}`} alt={t.firstName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white font-bold text-sm">{t.firstName?.[0] || "T"}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-slate-900 font-bold text-sm">{t.firstName} {t.lastName}</p>
                          {t.subject && <p className="text-slate-400 text-xs">{t.subject}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
