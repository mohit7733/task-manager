import { motion } from "framer-motion";
import { X } from "lucide-react";
import { brand } from "../utils/theme";

export function FieldLabel({ children, required }) {
  return (
    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

export const fieldClass = `w-full ${brand.input} ${brand.focus}`;

export function FormSection({ title, icon: Icon, children }) {
  return (
    <div className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-800 dark:bg-indigo-950/20">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
        {Icon && <Icon className={`h-4 w-4 ${brand.text}`} />}
        {title}
      </p>
      {children}
    </div>
  );
}

export default function FormModal({
  open,
  onClose,
  eyebrow,
  title,
  subtitle,
  badges,
  maxWidth = "max-w-2xl",
  children,
  footer,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className={`relative z-10 flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl dark:bg-slate-900`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={brand.modalHeader}>
          <div className="flex items-start justify-between gap-4">
            <div>
              {eyebrow && (
                <p className="text-xs font-medium uppercase tracking-wider text-indigo-200">{eyebrow}</p>
              )}
              <h3 className="mt-1 text-lg font-bold leading-tight">{title}</h3>
              {subtitle && <p className="mt-1 text-sm text-indigo-100">{subtitle}</p>}
              {badges?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-indigo-100">
                  {badges.map((b) => (
                    <span
                      key={b.key || b.label}
                      className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5"
                    >
                      {b.icon}
                      {b.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  );
}
