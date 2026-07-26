/**
 * VideoPlayer — renders a vidcloud.eu.org iframe.
 * All stream resolution (HLS, DASH, DRM) is handled by the external player.
 */
interface VideoPlayerProps {
  batchId: string;
  subjectId: string;
  lectureId: string;
  title?: string;
  img?: string;
  className?: string;
}

export default function VideoPlayer({
  batchId,
  subjectId,
  lectureId,
  title = "",
  img = "",
  className = "",
}: VideoPlayerProps) {
  const params = new URLSearchParams({
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
  const src = `https://vidcloud.eu.org/play.php?${params.toString()}`;

  return (
    <iframe
      src={src}
      className={`w-full h-full border-0 ${className}`}
      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
      allowFullScreen
      referrerPolicy="no-referrer"
      title={title || "Video Player"}
    />
  );
}
