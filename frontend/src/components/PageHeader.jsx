import { brand } from "../utils/theme";

export default function PageHeader({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className={`flex items-center gap-2 ${brand.pageTitle}`}>
          {Icon && <Icon className={`h-7 w-7 ${brand.text}`} />}
          {title}
        </h2>
        {subtitle && <p className={brand.pageSubtitle}>{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
