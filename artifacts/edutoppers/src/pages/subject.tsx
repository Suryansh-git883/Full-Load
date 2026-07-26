import { Link, useParams, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { fetchBatchDetails, fetchTopics } from "@/lib/api";
import type { Subject, Topic } from "@/lib/types";

export default function SubjectPage() {
  const params = useParams<{ batchId: string; subjectId: string }>();
  const { batchId, subjectId } = params;
  const search = useSearch();
  const sp = new URLSearchParams(search);
  const subjectNameFromUrl = sp.get("subjectName") || "";

  const detailsQuery = useQuery({
    queryKey: ["batch", batchId],
    queryFn: () => fetchBatchDetails(batchId),
    enabled: !!batchId,
  });

  const batchDetail = detailsQuery.data?.data || detailsQuery.data;
  const batchName: string = batchDetail?.name || "";

  const subject: Subject | undefined = batchDetail?.subjects?.find(
    (s: Subject) => s._id === subjectId
  );
  const subjectName = subject?.subject || subjectNameFromUrl || "Subject";
  const subjectSlug = subject?.slug || "";

  const topicsQuery = useQuery({
    queryKey: ["topics", batchId, subjectId, subjectSlug],
    queryFn: () => fetchTopics(batchId, subjectId, subjectSlug),
    enabled: !!batchId && !!subjectId,
  });

  const topics: Topic[] = (() => {
    const d = topicsQuery.data;
    if (!d) return [];
    if (Array.isArray(d.data)) return d.data;
    if (Array.isArray(d)) return d;
    return [];
  })();

  const isLoading = (detailsQuery.isLoading && !subjectNameFromUrl) || topicsQuery.isLoading;
  const error = topicsQuery.error;

  return (
    <main className="page-bg min-h-screen">
      <Header />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6 flex-wrap animate-fade-up">
          <Link href="/" className="hover:text-indigo-600 transition-colors font-semibold flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </Link>
          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href={`/batch/${batchId}`} className="hover:text-indigo-600 transition-colors font-semibold truncate max-w-[140px]">
            {batchName || "Batch"}
          </Link>
          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-600 font-semibold truncate max-w-[180px]">{subjectName}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8 animate-fade-up">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{subjectName}</h1>
            {!isLoading && (
              <p className="text-slate-400 text-sm mt-1.5">
                <span className="font-bold text-indigo-600">{topics.length}</span>{" "}
                lesson{topics.length !== 1 ? "s" : ""} available
              </p>
            )}
          </div>
          <Link
            href={`/batch/${batchId}`}
            className="btn-primary px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 self-start sm:self-center flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Batch
          </Link>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card rounded-2xl p-5 flex items-start gap-4">
                <div className="w-11 h-11 shimmer rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 shimmer rounded" />
                  <div className="h-3 shimmer rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-28">
            <p className="text-red-400 font-semibold">{(error as Error).message}</p>
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-28">
            <p className="text-slate-500 font-semibold">No lessons found for this subject.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topics.map((topic, idx) => (
              <Link
                key={topic._id}
                href={`/batch/${batchId}/subject/${subjectId}/topic/${topic._id}?topicName=${encodeURIComponent(topic.name)}&subjectName=${encodeURIComponent(subjectName)}`}
                className="group block animate-fade-up"
                style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
              >
                <div className="card rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 font-black text-indigo-600 text-sm group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300 shadow-sm">
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-slate-900 font-bold text-[15px] mb-2.5 group-hover:text-indigo-700 transition-colors leading-snug line-clamp-2">
                        {topic.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {(topic.videos ?? 0) > 0 && (
                          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            {topic.videos} Videos
                          </span>
                        )}
                        {(topic.notes ?? 0) > 0 && (
                          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            {topic.notes} Notes
                          </span>
                        )}
                        {(topic.exercises ?? 0) > 0 && (
                          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            {topic.exercises} DPP
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center transition-all flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
