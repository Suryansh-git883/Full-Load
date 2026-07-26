import { Router } from "express";

const router = Router();

const PRIMARY = "https://pw.modgalaxy.in/api/v2";
const PROXY = "https://rolexcoderz.in/PWx";
const BATCHES_URL = "https://rarestudy.github.io/rarestudy/batches.json";

/** Generic JSON fetch with timeout. Returns null on any error. */
async function tryFetch(
  url: string,
  options: RequestInit = {}
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(12000),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers as Record<string, string> | undefined),
      },
    });
    if (!res.ok) return null;
    const text = await res.text();
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

/** POST to rolexcoderz proxy with ?action= */
async function proxyAction(
  action: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown> | null> {
  return tryFetch(`${PROXY}/?action=${action}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ─────────────────────────────────────────────────────────────────
// GET /api/pw/batches
// Returns the full batch catalog from rarestudy GitHub Pages
// ─────────────────────────────────────────────────────────────────
router.get("/batches", async (_req, res) => {
  const data = await tryFetch(`${BATCHES_URL}?v=${Date.now()}`);
  if (data) return res.json(data);
  return res.status(502).json({ success: false, error: "Failed to fetch batches" });
});

// ─────────────────────────────────────────────────────────────────
// POST /api/pw/batch-details   body: { batchId }
// Primary: GET pw.modgalaxy.in/api/v2/batches/:id/details
// ─────────────────────────────────────────────────────────────────
router.post("/batch-details", async (req, res) => {
  const { batchId } = req.body as { batchId: string };
  if (!batchId)
    return res.status(400).json({ success: false, error: "batchId required" });

  const data = await tryFetch(`${PRIMARY}/batches/${batchId}/details`);
  if (data?.success) return res.json(data);

  return res
    .status(502)
    .json({ success: false, error: "Failed to fetch batch details" });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/pw/topics?batchId=&subjectId=&subjectSlug=
// Primary: GET /api/v2/batches/:batchId/subject/:subjectId/topics
// Fallback: POST proxy?action=get_topics {batch_id, subject_slug}
// ─────────────────────────────────────────────────────────────────
router.get("/topics", async (req, res) => {
  const { batchId, subjectId, subjectSlug } = req.query as Record<
    string,
    string
  >;
  if (!batchId || !subjectId)
    return res
      .status(400)
      .json({ success: false, error: "batchId and subjectId required" });

  // Primary
  const data = await tryFetch(
    `${PRIMARY}/batches/${batchId}/subject/${subjectId}/topics`
  );
  if (data?.success && Array.isArray(data.data)) return res.json(data);

  // Fallback (uses slug)
  if (subjectSlug) {
    const proxy = await proxyAction("get_topics", {
      batch_id: batchId,
      subject_slug: subjectSlug,
    });
    if (proxy?.success) {
      // Normalise double-nested format: data.data -> topics array
      const inner = (proxy.data as Record<string, unknown>) ?? {};
      const topics = Array.isArray(inner.data) ? inner.data : inner;
      return res.json({ success: true, data: topics });
    }
  }

  return res.status(502).json({ success: false, error: "Failed to fetch topics" });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/pw/content?batchId=&subjectId=&topicId=&contentType=&page=
// contentType: LECTURES | notes | DppNotes
// Primary: GET /api/v2/batches/:batchId/subject/:subjectId/content?page=&contentType=&tag=
// Fallback: POST proxy?action=get_contents {batch_id, subject_id, content_type, tag_id, limit}
// ─────────────────────────────────────────────────────────────────
router.get("/content", async (req, res) => {
  const {
    batchId,
    subjectId,
    topicId,
    contentType = "LECTURES",
    page = "1",
  } = req.query as Record<string, string>;

  if (!batchId || !subjectId)
    return res
      .status(400)
      .json({ success: false, error: "batchId and subjectId required" });

  // Primary
  const qs = new URLSearchParams({
    page,
    contentType,
    ...(topicId ? { tag: topicId } : {}),
  });
  const data = await tryFetch(
    `${PRIMARY}/batches/${batchId}/subject/${subjectId}/content?${qs}`
  );
  if (data?.success && Array.isArray(data.data)) return res.json(data);

  // Fallback
  const proxy = await proxyAction("get_contents", {
    batch_id: batchId,
    subject_id: subjectId,
    content_type: contentType,
    tag_id: topicId ?? "",
    limit: 50,
  });
  if (proxy?.success) {
    // Normalise proxy double-nested: data.data -> array of {type, _id, data:{...}}
    const inner = (proxy.data as Record<string, unknown>) ?? {};
    const raw = Array.isArray(inner.data) ? inner.data : (proxy.data as unknown[]);
    const items = Array.isArray(raw)
      ? raw.map((item) => {
          const i = item as Record<string, unknown>;
          return (i.data as Record<string, unknown>) || i;
        })
      : [];
    return res.json({ success: true, data: items });
  }

  return res.status(502).json({ success: false, error: "Failed to fetch content" });
});

// ─────────────────────────────────────────────────────────────────
// POST /api/pw/schedule-details   body: { batch_id, subject_id, schedule_id }
// Proxy only: get_schedule_details
// ─────────────────────────────────────────────────────────────────
router.post("/schedule-details", async (req, res) => {
  const body = req.body as {
    batch_id: string;
    subject_id: string;
    schedule_id: string;
  };
  if (!body.batch_id || !body.schedule_id)
    return res
      .status(400)
      .json({ success: false, error: "batch_id and schedule_id required" });

  const data = await proxyAction("get_schedule_details", body);
  if (data) return res.json(data);
  return res
    .status(502)
    .json({ success: false, error: "Failed to fetch schedule details" });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/pw/live?batchId=
// Proxy: today_schedule   body: { batch_id }
// ─────────────────────────────────────────────────────────────────
router.get("/live", async (req, res) => {
  const { batchId } = req.query as { batchId: string };
  if (!batchId)
    return res.status(400).json({ success: false, error: "batchId required" });

  const data = await proxyAction("today_schedule", { batch_id: batchId });
  if (data) return res.json(data);
  return res
    .status(502)
    .json({ success: false, error: "Failed to fetch live classes" });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/pw/hls-proxy?url=   (kept as a safety valve, rarely used)
// ─────────────────────────────────────────────────────────────────
router.get("/hls-proxy", async (req, res) => {
  const { url } = req.query as { url: string };
  if (!url) return res.status(400).send("url required");
  try {
    const decodedUrl = decodeURIComponent(url);
    const upstream = await fetch(decodedUrl, {
      headers: {
        Referer: "https://www.pw.live/",
        Origin: "https://www.pw.live",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!upstream.ok) return res.status(upstream.status).send("Upstream error");
    const ct =
      upstream.headers.get("content-type") || "application/vnd.apple.mpegurl";
    res.setHeader("Content-Type", ct);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache");
    const buffer = Buffer.from(await upstream.arrayBuffer());
    return res.send(buffer);
  } catch {
    return res.status(500).send("Proxy error");
  }
});

export default router;
