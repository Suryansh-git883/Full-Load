/**
 * LiveVideoPlayer — same vidcloud iframe as VideoPlayer but semantically for live/vod classes.
 */
interface LiveVideoPlayerProps {
  batchId: string;
  subjectId: string;
  scheduleId: string;
  title?: string;
  className?: string;
  onClose?: () => void;
  fullPage?: boolean;
}

export default function LiveVideoPlayer({
  batchId,
  subjectId,
  scheduleId,
  title = "",
  className = "",
  onClose,
  fullPage = false,
}: LiveVideoPlayerProps) {
  const params = new URLSearchParams({
    batch_id: batchId,
    subject_id: subjectId,
    topic_id: "",
    video_id: scheduleId,
    video_url: "",
    video_name: title,
    video_img: "",
    video_type: "new",
    play_type: "Lecture",
  });
  const src = `https://vidcloud.eu.org/play.php?${params.toString()}`;

  const player = (
    <iframe
      src={src}
      className={`w-full h-full border-0 ${className}`}
      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
      allowFullScreen
      referrerPolicy="no-referrer"
      title={title || "Live Class"}
    />
  );

  if (!fullPage) return player;

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      <div className="flex items-center gap-3 px-4 h-12 flex-shrink-0 bg-black/80 backdrop-blur border-b border-white/10">
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            title="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h2 className="text-white/85 font-semibold text-sm truncate flex-1">
          {title || "Live Class"}
        </h2>
      </div>
      <div className="flex-1 relative">{player}</div>
    </div>
  );
}
