/** ExecuFlow — unified design system */

export const APP_NAME = "ExecuFlow";
export const APP_TAGLINE = "Executive Meeting & Task Intelligence";
export const APP_VERSION = "1.0";

export const brand = {
  gradient: "bg-gradient-to-r from-blue-600 to-indigo-600",
  gradientHover: "hover:from-blue-700 hover:to-indigo-700",
  gradientBr: "bg-gradient-to-br from-blue-600 to-indigo-600",
  btn: "bg-indigo-600 hover:bg-indigo-500 text-white",
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50",
  btnSecondary:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
  btnSuccess: "bg-emerald-600 hover:bg-emerald-500 text-white",
  btnDanger: "bg-red-600 hover:bg-red-500 text-white",
  btnGhost:
    "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
  btnRing: "shadow-md shadow-indigo-200/60 dark:shadow-indigo-900/40",
  text: "text-indigo-600 dark:text-indigo-400",
  textMuted: "text-slate-500 dark:text-slate-400",
  ring: "ring-indigo-500",
  focus: "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none",
  input:
    "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white",
  card: "rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900",
  cardHeader: "border-b border-slate-100 px-6 py-4 dark:border-slate-800",
  pageTitle: "text-2xl font-bold text-slate-900 dark:text-white",
  pageSubtitle: "mt-1 text-sm text-slate-500 dark:text-slate-400",
  toolbar:
    "flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900",
  searchInput:
    "w-full rounded-xl border-0 bg-slate-50 py-2.5 pl-10 pr-3 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:ring-slate-600 dark:text-white",
  toolbarSelect:
    "rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-600 dark:text-white",
  toolbarBtn:
    "inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-medium ring-1 ring-slate-200 transition hover:bg-slate-100 dark:bg-slate-800 dark:ring-slate-600",
  tableWrap:
    "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900",
  tableHead: "bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900",
  tableHeadCell:
    "sticky top-0 z-20 whitespace-nowrap border-b border-r border-slate-200 bg-slate-100 px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",
  tableCell: "border-b border-r border-slate-100 px-3 py-2.5 dark:border-slate-800",
  rowHover: "hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20",
  rowOpen: "bg-indigo-50/80 dark:bg-indigo-950/30",
  tabActive: "bg-indigo-600 text-white shadow-sm",
  tabInactive:
    "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  tabGroup: "flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900",
  viewActive:
    "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950 dark:text-indigo-300",
  viewInactive:
    "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
  chipActive: "bg-indigo-600 text-white ring-2 ring-indigo-300 dark:ring-indigo-700",
  chipInactive:
    "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600",
  chipDanger: "bg-red-600 text-white ring-2 ring-red-300 dark:ring-red-700",
  chipWarning: "bg-amber-600 text-white ring-2 ring-amber-300 dark:ring-amber-700",
  statCard:
    "rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900",
  modalHeader:
    "border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white dark:border-slate-800",
  modalFooter:
    "flex gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80",
  errorAlert:
    "flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300",
  fileInput:
    "block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-500",
  legendBar:
    "flex flex-wrap gap-4 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50",
  overlay: "fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm",
  drawerOverlay: "fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-[2px]",
};

export const colors = {
  primary: "#4F46E5",
  primaryDark: "#4338CA",
  accent: "#2563EB",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  surface: "#F8FAFC",
  surfaceDark: "#0F172A",
};
