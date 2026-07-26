import { useState } from "react";
import { Link, useParams, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { fetchContent, fetchScheduleDetails } from "@/lib/api";
import type { ContentItem, HomeworkItem } from "@/lib/types";
import { useVideoLoadGuard } from "@/lib/videoGuard";

/** contentType values expected by the new API */
const CONTENT_TYPE_MAP: Record<"lectures" | "notes" | "dpp", string> = {
  lectures: "LECTURES",
  notes: "notes",
  dpp: "DppNotes",
};

type TabKey = keyof typeof CONTENT_TYPE_MAP;

function formatDate(d?: string) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return d; }
}

/** Build the vidcloud player URL */
function buildVidcloudUrl(batchId: string, subjectId: string, lectureId: string, title: string, img = "") {
  const p = new URLSearchParams({
    batch_id: batchId,
    subject_id: subjectId,
    topic_id: "",
    video_id: lectureId,
    video_url: "",
    video_name: title,
    video_img: img,
    video_type: "new",
    play_type: "Lecture",
  });
  return `https://vidcloud.eu.org/play.php?${p}`;
}

function openVideo(item: ContentItem, batchId: string, subjectId: string) {
  const lectureId = item._id;
  const title = encodeURIComponent(item.videoDetails?.name || item.topic || "");
  const img = encodeURIComponent(item.videoDetails?.image || "");
  window.open(`/watch?batchId=${batchId}&subjectId=${subjectId}&lectureId=${lectureId}&title=${title}&img=${img}`, "_blank");
}

/** Download a PDF attachment from a HomeworkItem */
function DownloadPdfButton({ hw, className }: { hw: HomeworkItem; className?: string }) {
  const handleDownload = () => {
    if (!hw.attachmentIds?.length) return;
    const a = hw.attachmentIds[0];
    window.open(`${a.baseUrl}${a.key}`, "_blank");
  };
  return (
    <button
      onClick={handleDownload}
      disabled={!hw.attachmentIds?.length}
      className={`inline-flex items-center gap-1.5 btn-primary px-3.5 py-2 rounded-xl text-xs font-bold disabled:opacity-40 disabled:pointer-events-none ${className}`}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download PDF
    </button>
  );
}

/** Button that fetches schedule details to get class notes when hasAttachment=true */
function ClassNotesButton({ item, batchId, subjectId }: { item: ContentItem; batchId: string; subjectId: string }) {
  const [loading, setLoading] = useState(false);
  const [hws, setHws] = useState<HomeworkItem[] | null>(null);
  const [error, setError] = useState(false);

  const fetchNotes = async () => {
    if (hws) return; // already fetched
    setLoading(true);
    setError(false);
    try {
      const data = await fetchScheduleDetails({
        batch_id: batchId,
        subject_id: subjectId,
        schedule_id: item._id,
      });
      const schedule = data?.data?.data || data?.data || {};
      const homework: HomeworkItem[] = schedule.homeworkIds || [];
      setHws(homework);
      // Auto-open first attachment
      if (homework.length > 0 && homework[0].attachmentIds?.length > 0) {
        const a = homework[0].attachmentIds[0];
        window.open(`${a.baseUrl}${a.key}`, "_blank");
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (hws !== null) {
    if (hws.length === 0) return <span className="text-xs text-slate-400 font-medium">No notes attached</span>;
    return (
      <div className="flex flex-wrap gap-2 mt-1">
        {hws.map((hw) => (
          <DownloadPdfButton key={hw._id} hw={hw} />
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={fetchNotes}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Loading...</>
      ) : error ? (
        "Retry Notes"
      ) : (
        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Class Notes</>
      )}
    </button>
  );
}

/** In-page video player (iframe) - used for YouTube-type inline plays */
function InlinePlayer({ url, onClose }: { url: string; onClose: () => void }) {
  const { handleLoad, handleError } = useVideoLoadGuard();

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center gap-3 px-4 h-12 flex-shrink-0 border-b border-white/10">
        <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      <iframe
        src={url}
        className="flex-1 w-full border-0"
        allow="autoplay; fullscreen"
        allowFullScreen
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

export default function TopicPage() {
  const params = useParams<{ batchId: string; subjectId: string; topicId: string }>();
  const { batchId, subjectId, topicId } = params;
  const search = useSearch();
  const sp = new URLSearchParams(search);
  const subjectName = sp.get("subjectName") || "Subject";
  const topicName = sp.get("topicName") || "Topic";

  const [activeTab, setActiveTab] = useState<TabKey>("lectures");
  const [inlinePlayer, setInlinePlayer] = useState<string | null>(null);

  const contentQuery = useQuery({
    queryKey: ["content", batchId, subjectId, topicId, activeTab],
    queryFn: () => fetchContent({
      batchId,
      subjectId,
      topicId,
      contentType: CONTENT_TYPE_MAP[activeTab],
    }),
    enabled: !!batchId && !!subjectId,
  });

  const contentItems: ContentItem[] = (() => {
    const d = contentQuery.data;
    if (!d) return [];
    if (Array.isArray(d.data)) return d.data;
    if (Array.isArray(d)) return d;
    return [];
  })();

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    {
      key: "lectures",
      label: "Lectures",
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>,
    },
    {
      key: "notes",
      label: "Notes",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    },
    {
      key: "dpp",
      label: "DPP",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    },
  ];

  const renderLectureItem = (item: ContentItem, idx: number) => {
    const img = item.videoDetails?.image || "";
    const title = item.videoDetails?.name || item.topic;
    const isYoutube = item.urlType === "youtube" && item.url;
    const duration = item.videoDetails?.duration;

    return (
      <div key={item._id} className="card rounded-2xl p-5 flex items-start gap-4 group animate-fade-up" style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}>
        {/* Thumbnail */}
        <div className="relative w-28 sm:w-36 aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-indigo-50">
          {img ? (
            <img src={img} alt={title} className="w-full h-full object-cover" loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-7 h-7 text-indigo-300" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
          )}
          {duration && (
            <span className="absolute bottom-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white font-mono">
              {duration}
            </span>
          )}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-slate-900 font-bold text-sm leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors mb-1.5">{title}</h3>
          {item.date && <p className="text-slate-400 text-xs mb-3">{formatDate(item.date)}</p>}
          <div className="flex flex-wrap gap-2">
            {/* Play button — opens vidcloud or YouTube inline */}
            {item.isVideoLecture !== false && (
              isYoutube ? (
                <button
                  onClick={() => setInlinePlayer(item.url!)}
                  className="inline-flex items-center gap-1.5 btn-primary px-3.5 py-2 rounded-xl text-xs font-bold"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  Play
                </button>
              ) : (
                <button
                  onClick={() => openVideo(item, batchId, subjectId)}
                  className="inline-flex items-center gap-1.5 btn-primary px-3.5 py-2 rounded-xl text-xs font-bold"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  Play
                </button>
              )
            )}
            {/* Class notes (fetched from schedule details) */}
            {item.hasAttachment && (
              <ClassNotesButton item={item} batchId={batchId} subjectId={subjectId} />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPdfItem = (item: ContentItem, idx: number) => {
    // Notes/DPP: items have homeworkIds with attachmentIds
    const hws: HomeworkItem[] = item.homeworkIds || [];

    if (hws.length > 0) {
      return hws.map((hw, hIdx) => (
        <div key={`${item._id}-${hw._id}-${hIdx}`} className="card rounded-2xl p-5 flex items-start gap-4 group animate-fade-up" style={{ animationDelay: `${Math.min((idx + hIdx) * 30, 300)}ms` }}>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${activeTab === "dpp" ? "bg-amber-50 group-hover:bg-amber-100" : "bg-emerald-50 group-hover:bg-emerald-100"}`}>
            <svg className={`w-5.5 h-5.5 ${activeTab === "dpp" ? "text-amber-500" : "text-emerald-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-slate-900 font-bold text-sm leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors mb-1">{hw.topic}</h3>
            {hw.note && <p className="text-slate-400 text-xs mb-2.5 font-medium">{hw.note}</p>}
            {hw.attachmentIds?.[0]?.name && (
              <p className="text-slate-400 text-xs mb-3 truncate">{hw.attachmentIds[0].name}</p>
            )}
            <DownloadPdfButton hw={hw} />
          </div>
        </div>
      ));
    }

    // Fallback — item itself as a simple note (no homeworkIds)
    return (
      <div key={item._id} className="card rounded-2xl p-5 flex items-start gap-4 group animate-fade-up" style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}>
        <div className="w-11 h-11 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center flex-shrink-0 transition-colors">
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-slate-900 font-bold text-sm leading-snug line-clamp-2 mb-1">{item.topic}</h3>
          {item.date && <p className="text-slate-400 text-xs mb-3">{formatDate(item.date)}</p>}
          {/* Try to get notes via schedule details */}
          {item.hasAttachment && (
            <ClassNotesButton item={item} batchId={batchId} subjectId={subjectId} />
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="page-bg min-h-screen">
      <Header />

      {/* Inline player overlay */}
      {inlinePlayer && (
        <InlinePlayer url={inlinePlayer} onClose={() => setInlinePlayer(null)} />
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6 flex-wrap animate-fade-up">
          <Link href="/" className="hover:text-indigo-600 transition-colors font-semibold flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Home
          </Link>
          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <Link href={`/batch/${batchId}`} className="hover:text-indigo-600 transition-colors font-semibold truncate max-w-[80px]">Batch</Link>
          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <Link href={`/batch/${batchId}/subject/${subjectId}`} className="hover:text-indigo-600 transition-colors font-semibold truncate max-w-[100px]">{subjectName}</Link>
          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-slate-600 font-semibold truncate max-w-[150px]">{topicName}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 mb-8 animate-fade-up">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug tracking-tight line-clamp-2">{topicName}</h1>
            {subjectName && (
              <p className="text-slate-400 text-sm mt-1.5 font-medium">
                <span className="text-indigo-600 font-semibold">{subjectName}</span> · Study Materials
              </p>
            )}
          </div>
          <Link
            href={`/batch/${batchId}/subject/${subjectId}?subjectName=${encodeURIComponent(subjectName)}`}
            className="btn-primary px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 self-start flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-7 bg-slate-100/80 rounded-2xl p-1.5 animate-fade-up max-w-md">
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
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {contentQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card rounded-2xl p-5 flex items-start gap-4">
                <div className="w-28 sm:w-36 aspect-video shimmer rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 shimmer rounded" />
                  <div className="h-3 shimmer rounded w-3/4" />
                  <div className="h-8 shimmer rounded-xl w-28 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : contentQuery.error ? (
          <div className="text-center py-24">
            <p className="text-red-400 font-semibold">{(contentQuery.error as Error).message}</p>
          </div>
        ) : contentItems.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              {tabs.find(t => t.key === activeTab)?.icon}
            </div>
            <p className="text-slate-500 font-semibold">No {activeTab} available for this topic</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTab === "lectures"
              ? contentItems.map((item, idx) => renderLectureItem(item, idx))
              : contentItems.flatMap((item, idx) => renderPdfItem(item, idx))}
          </div>
        )}
      </div>
    </main>
  );
}
