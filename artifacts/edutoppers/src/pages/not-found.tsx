import { Link } from "wouter";
import Header from "@/components/Header";

export default function NotFound() {
  return (
    <main className="page-bg min-h-screen">
      <Header />
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="text-center animate-fade-up">
          <div className="text-8xl font-black text-indigo-100 mb-4">404</div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Page Not Found</h1>
          <p className="text-slate-500 mb-8">The page you're looking for doesn't exist.</p>
          <Link href="/" className="btn-primary px-8 py-3 rounded-2xl font-bold text-sm inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
