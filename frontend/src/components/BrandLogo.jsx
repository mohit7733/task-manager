import { APP_NAME } from "../utils/theme";
import { brand } from "../utils/theme";

export default function BrandLogo({ collapsed = false, dark = false }) {
  return (
    <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${brand.gradientBr} shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/50`}
      >
        <span className="text-lg font-bold text-white">EF</span>
      </div>
      {!collapsed && (
        <div>
          <h1 className={`text-lg font-bold ${dark ? "text-white" : "text-slate-900 dark:text-white"}`}>
            {APP_NAME}
          </h1>
          <p className={`text-xs ${dark ? "text-indigo-200" : "text-slate-500 dark:text-slate-400"}`}>
            Executive Suite
          </p>
        </div>
      )}
    </div>
  );
}
