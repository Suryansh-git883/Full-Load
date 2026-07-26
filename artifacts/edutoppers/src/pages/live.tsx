import { useSearch } from "wouter";
import LiveVideoPlayer from "@/components/LiveVideoPlayer";

export default function LivePage() {
  const search = useSearch();
  const sp = new URLSearchParams(search);

  const videoId = sp.get("videoId") || "";
  const batchId = sp.get("batchId") || "";
  const subjectId = sp.get("subjectId") || "";
  const title = sp.get("title") || "Live Class";

  function handleClose() {
    try { window.close(); } catch {}
    setTimeout(() => { window.history.back(); }, 150);
  }

  if (!videoId || !batchId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(2,4,12,0.98)" }}>
        <div className="text-center">
          <p className="text-white/50 mb-4">Invalid class link.</p>
          <button onClick={handleClose} className="px-4 py-2 bg-red-600 rounded-xl text-white text-sm font-bold">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <LiveVideoPlayer
      batchId={batchId}
      subjectId={subjectId}
      scheduleId={videoId}
      title={title}
      onClose={handleClose}
      fullPage
    />
  );
}
