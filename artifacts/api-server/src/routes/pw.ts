import { Router } from "express";
import type { RequestHandler } from "express";

const router = Router();

const PRIMARY = "https://pw.modgalaxy.in/api/v2";
const PROXY = "https://rolexcoderz.in/PWx";
const BATCHES_URL = "https://rarestudy.github.io/rarestudy/batches.json";
const SAFE_ID = /^[a-zA-Z0-9_-]{1,128}$/;
const SAFE_SUBJECT_SLUG = /^[a-zA-Z0-9._-]{1,160}$/;
const CONTENT_TYPES = new Set(["LECTURES", "notes", "DppNotes"]);

type RateBucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateBucket>();
const RATE_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;

function rateLimitKey(req: Parameters<RequestHandler>[0]) {
  return `${req.ip}:${req.path}`;
}

const rateLimit: RequestHandler = (req, res, next) => {
  const now = Date.now();
  const key = rateLimitKey(req);
  const current = rateBuckets.get(key);
  const bucket =
    !current || current.resetAt <= now
      ? { count: 0, resetAt: now + RATE_WINDOW_MS }
      : current;

  bucket.count += 1;
  rateBuckets.set(key, bucket);

  // Avoid retaining inactive client keys forever in a long-running process.
  if (rateBuckets.size > 2_000) {
    for (const [bucketKey, value] of rateBuckets) {
      if (value.resetAt <= now) rateBuckets.delete(bucketKey);
    }
  }

  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("RateLimit-Limit", String(MAX_REQUESTS_PER_WINDOW));
  res.setHeader(
    "RateLimit-Remaining",
    String(Math.max(0, MAX_REQUESTS_PER_WINDOW - bucket.count)),
  );
  res.setHeader(
    "RateLimit-Reset",
    String(Math.ceil((bucket.resetAt - now) / 1000)),
  );

  if (bucket.count > MAX_REQUESTS_PER_WINDOW) {
    return res
      .status(429)
      .json({ success: false, error: "Too many requests. Please try again later." });
  }

  return next();
};

function readId(value: unknown, field: string): string | null {
  if (typeof value !== "string" || !SAFE_ID.test(value)) return null;
  return value;
}

function readSubjectSlug(value: unknown): string | null {
  if (typeof value !== "string" || !SAFE_SUBJECT_SLUG.test(value)) return null;
  return value;
}

function readPage(value: unknown): string | null {
  const page = typeof value === "string" ? Number(value) : NaN;
  if (!Number.isInteger(page) || page < 1 || page > 50) return null;
  return String(page);
}

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
router.use(rateLimit);

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
  const batchId = readId(req.body?.batchId, "batchId");
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
  const batchId = readId(req.query.batchId, "batchId");
  const subjectId = readId(req.query.subjectId, "subjectId");
  const subjectSlug = req.query.subjectSlug
    ? readSubjectSlug(req.query.subjectSlug)
    : null;
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
  const batchId = readId(req.query.batchId, "batchId");
  const subjectId = readId(req.query.subjectId, "subjectId");
  const topicId = req.query.topicId ? readId(req.query.topicId, "topicId") : null;
  const contentType =
    typeof req.query.contentType === "string" ? req.query.contentType : "LECTURES";
  const page = readPage(req.query.page ?? "1");

  if (!batchId || !subjectId || (req.query.topicId && !topicId))
    return res
      .status(400)
      .json({ success: false, error: "batchId and subjectId required" });
  if (!CONTENT_TYPES.has(contentType) || !page)
    return res.status(400).json({ success: false, error: "Invalid content request" });

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
  const body = {
    batch_id: readId(req.body?.batch_id, "batch_id"),
    subject_id: readId(req.body?.subject_id, "subject_id"),
    schedule_id: readId(req.body?.schedule_id, "schedule_id"),
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
  const batchId = readId(req.query.batchId, "batchId");
  if (!batchId)
    return res.status(400).json({ success: false, error: "batchId required" });

  const data = await proxyAction("today_schedule", { batch_id: batchId });
  if (data) return res.json(data);
  return res
    .status(502)
    .json({ success: false, error: "Failed to fetch live classes" });
});

export default router;
