import { brand } from "../utils/theme";

export default function EmptyState({ icon: Icon, title, description, action, compact = false, bare = false }) {
  return (
    <div
      className={`text-center ${compact ? "py-8" : bare ? "p-8" : "p-12"} ${bare ? "" : brand.card}`}
    >
      {Icon && (
        <div
          className={`mx-auto mb-4 flex items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-950 ${
            compact ? "h-14 w-14" : "h-16 w-16"
          }`}
        >
          <Icon className={`text-indigo-500 ${compact ? "h-7 w-7" : "h-8 w-8"}`} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
