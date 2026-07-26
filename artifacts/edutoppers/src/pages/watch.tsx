import { useSearch } from "wouter";

/**
 * Full-page video player using vidcloud.eu.org embed.
 * vidcloud handles all stream types (penpencilvdo, awsVideo, youtube, etc.)
 * internally — we just pass batch/subject/lecture IDs.
 */
export default function WatchPage() {
  const search = useSearch();
  const sp = new URLSearchParams(search);

  const batchId = sp.get("batchId") || "";
  const subjectId = sp.get("subjectId") || "";
  const lectureId = sp.get("lectureId") || "";
  const title = sp.get("title") || "Video";
  const img = sp.get("img") || "";

  function handleClose() {
    try { window.close(); } catch {}
    setTimeout(() => { window.history.back(); }, 100);
  }

  if (!batchId || !lectureId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <p className="text-white/50">Invalid video link.</p>
          <button onClick={handleClose} className="px-5 py-2 bg-indigo-600 rounded-xl text-white text-sm font-bold">
            Close
          </button>
        </div>
      </div>
    );
  }

  const vidcloudUrl = (() => {
    const p = new URLSearchParams({
      batch_id: batchId,
      subject_id: subjectId,
      topic_id: "",
      video_id: lectureId,
      video_url: "",
      video_name: decodeURIComponent(title),
      video_img: decodeURIComponent(img),
      video_type: "new",
      play_type: "Lecture",
    });
    return `https://vidcloud.eu.org/play.php?${p.toString()}`;
  })();

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 flex-shrink-0 bg-black/80 backdrop-blur border-b border-white/10">
        <button
          onClick={handleClose}
          className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          title="Back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-white/85 font-semibold text-sm truncate flex-1">
          {decodeURIComponent(title)}
        </h2>
      </div>

      {/* Vidcloud iframe */}
      <div className="flex-1 relative">
        <iframe
          src={vidcloudUrl}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="no-referrer"
          title={decodeURIComponent(title)}
        />
      </div>
    </div>
  );
}
