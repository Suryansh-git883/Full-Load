"use client";
import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { fetchBatches } from "@/lib/api";
import type { Batch } from "@/lib/types";

const PAGE_SIZE = 60;

function BatchCard({ batch }: { batch: Batch }) {
  return (
    <Link href={`/batch/${batch._id}`} className="group block">
      <div className="card rounded-2xl overflow-hidden">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gradient-to-br from-indigo-100 to-violet-100 overflow-hidden">
          {batch.previewImage ? (
            <img
              src={batch.previewImage}
              alt={batch.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}
          {/* Free badge */}
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow">
            FREE
          </span>
        </div>
        {/* Info */}
        <div className="p-4">
          <h3 className="text-slate-900 font-bold text-[14px] leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors mb-1.5">
            {batch.name}
          </h3>
          {batch.byName && (
            <p className="text-slate-400 text-xs truncate">{batch.byName}</p>
          )}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            {batch.language && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                {batch.language}
              </span>
            )}
            {batch.type && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100">
                {batch.type === "E_BATCH" ? "E-Batch" : batch.type}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["batches"],
    queryFn: fetchBatches,
  });

  // Normalize batches from different response shapes
  const allBatches: Batch[] = (() => {
    if (!data) return [];
    if (Array.isArray(data.batches)) return data.batches;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  })();

  const filtered = allBatches.filter((b) =>
    b.name?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(0, page * PAGE_SIZE);

  return (
    <main className="page-bg min-h-screen">
      <Header />
      <div className="px-4 sm:px-6 pt-7 pb-16 max-w-[1400px] mx-auto">
        {/* Hero */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden mb-6 hero-bg">
          <div className="orb w-72 h-72 bg-white/10 -top-16 -left-16" />
          <div className="orb w-56 h-56 bg-violet-300/20 top-8 right-8" />
          <div className="orb w-40 h-40 bg-pink-300/20 bottom-0 left-1/3" />

          <div className="relative z-10 px-4 sm:px-10 py-6 sm:py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="glass-hero inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white/90 text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {allBatches.length.toLocaleString()} Premium Courses
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-[1.1] tracking-tight mb-2">
                Learn Smarter,{" "}
                <span className="text-white/80">Achieve More</span>
              </h1>
              <p className="text-white/65 text-sm font-medium hidden sm:block max-w-md">
                Access premium PW batches — top-quality lectures, notes &amp; live classes. 100% free.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {["HD Lectures", "PDF Notes", "Live Classes", "DPP Practice"].map((f) => (
                  <span key={f} className="glass-hero px-2.5 py-1 rounded-full text-white/85 text-xs font-semibold">
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div className="glass-hero rounded-2xl px-6 py-4 flex-shrink-0 text-center">
              <div className="text-3xl font-black text-white">{allBatches.length.toLocaleString()}+</div>
              <div className="text-white/65 text-xs font-semibold mt-0.5">Free Batches</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 animate-fade-up">
          <div className="relative max-w-lg">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={`Search ${allBatches.length.toLocaleString()} courses...`}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
              >
                <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {search && (
            <p className="text-slate-500 text-sm mt-2 font-medium">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &quot;{search}&quot;
            </p>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="card rounded-2xl overflow-hidden">
                <div className="aspect-video shimmer" />
                <div className="p-4 space-y-2">
                  <div className="h-4 shimmer rounded-lg" />
                  <div className="h-3 shimmer rounded-lg w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-32 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-slate-800 font-extrabold text-xl mb-2">Unable to load courses</h2>
            <p className="text-red-400 font-medium text-sm">{(error as Error).message}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-slate-500 font-semibold">No courses found for &quot;{search}&quot;</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {paginated.map((batch) => (
                <BatchCard key={batch._id} batch={batch} />
              ))}
            </div>
            {page < totalPages && (
              <div className="mt-10 text-center">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-primary px-8 py-3 rounded-2xl font-bold text-sm inline-flex items-center gap-2"
                >
                  Load More
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <p className="text-slate-400 text-xs mt-2">
                  Showing {paginated.length} of {filtered.length}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
