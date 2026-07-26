import { useEffect } from "react";
import { useSearch } from "wouter";
import LiveVideoPlayer from "@/components/LiveVideoPlayer";
import { redirectToHome } from "@/lib/videoGuard";

export default function LivePage() {
  const search = useSearch();
  const sp = new URLSearchParams(search);

  const videoId = sp.get("videoId") || "";
  const batchId = sp.get("batchId") || "";
  const subjectId = sp.get("subjectId") || "";
  const title = sp.get("title") || "Live Class";

  function handleClose() {
    redirectToHome();
  }

  useEffect(() => {
    if (!videoId || !batchId) redirectToHome();
  }, [videoId, batchId]);

  if (!videoId || !batchId) {
    return null;
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
