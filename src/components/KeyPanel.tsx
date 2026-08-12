export default function KeyPanel() {
  return (
    <div className="rounded border border-slate-700 bg-slate-800/60 p-6">
      <div className="text-xs tracking-[0.2em] text-slate-400">
        SIGNAL SOURCE
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
        <span className="text-sm font-medium text-green-400">
          CONNECTED
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        YouTube search is powered by Scout.
      </p>
    </div>
  );
}