const SIZES = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-4",
  lg: "h-12 w-12 border-4",
};

export default function LoadingSpinner({ size = "md", label, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-slate-200 border-t-indigo-600 dark:border-slate-700 ${SIZES[size] || SIZES.md}`}
        role="status"
        aria-label={label || "Loading"}
      />
      {label && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{label}</p>}
    </div>
  );
}
