import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="hidden md:block w-72 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40 sticky top-6 h-[calc(100vh-48px)] overflow-y-auto">
      <div className="mb-8 flex items-center gap-3 rounded-3xl bg-slate-50 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-500 via-violet-500 to-blue-500 text-white shadow-lg shadow-pink-200/30">
          V
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">VIBEUP</p>
          <p className="text-sm font-semibold text-slate-900">Social Home</p>
        </div>
      </div>

      <nav className="space-y-3 text-sm font-semibold text-slate-700">
        <Link to="/home" className="block rounded-3xl px-4 py-3 transition hover:bg-slate-100">
          Home
        </Link>
        <Link to="/profile" className="block rounded-3xl px-4 py-3 transition hover:bg-slate-100">
          Profile
        </Link>
      </nav>

      <div className="mt-8 rounded-3xl bg-slate-50 p-5">
        <p className="text-sm font-semibold text-slate-900">Quick tip</p>
        <p className="mt-2 text-sm text-slate-600">Upload images and reply to comments to make your profile more active.</p>
      </div>
    </aside>
  );
}
