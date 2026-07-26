const BASE = "/api/pw";

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

export function fetchBatches() {
  return apiFetch(`${BASE}/batches`);
}

export function fetchBatchDetails(batchId: string) {
  return apiFetch(`${BASE}/batch-details`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ batchId }),
  });
}

export function fetchTopics(batchId: string, subjectId: string, subjectSlug: string) {
  const sp = new URLSearchParams({ batchId, subjectId, subjectSlug });
  return apiFetch(`${BASE}/topics?${sp}`);
}

export function fetchContent(params: {
  batchId: string;
  subjectId: string;
  topicId?: string;
  contentType: string;
  page?: number;
}) {
  const sp = new URLSearchParams({
    batchId: params.batchId,
    subjectId: params.subjectId,
    contentType: params.contentType,
    page: String(params.page ?? 1),
  });
  if (params.topicId) sp.set("topicId", params.topicId);
  return apiFetch(`${BASE}/content?${sp}`);
}

export function fetchScheduleDetails(params: {
  batch_id: string;
  subject_id: string;
  schedule_id: string;
}) {
  return apiFetch(`${BASE}/schedule-details`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export function fetchLiveClasses(batchId: string) {
  return apiFetch(`${BASE}/live?batchId=${encodeURIComponent(batchId)}`);
}
