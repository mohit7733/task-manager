export const API_ORIGIN =
  (import.meta.env.VITE_API_URL || "https://task-manager-i8ui.onrender.com/api").replace(/\/api\/?$/, "");

export function uploadUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildFormData(fields, file, fileField = "attachment") {
  const fd = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      fd.append(key, typeof value === "boolean" ? String(value) : value);
    }
  });
  if (file) fd.append(fileField, file);
  return fd;
}

export const ACCEPT_MOM =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.txt";
