export interface PendingEditorFile {
  file: File;
  url: string;
  name: string;
  type: string;
}

export interface EditorAttachment {
  id: string | number;
  name: string;
  url: string;
  type?: string;
  size?: number;
  pending?: boolean;
}

export const getPlainText = (value: string) => {
  if (!value) return "";
  if (import.meta.client) {
    const container = document.createElement("div");
    container.innerHTML = value;
    return container.textContent || container.innerText || "";
  }
  return value.replace(/<[^>]*>/g, "");
};

export const getImageCount = (value: string) => {
  if (!value) return 0;
  if (import.meta.client) {
    const container = document.createElement("div");
    container.innerHTML = value;
    return container.querySelectorAll("img").length;
  }
  return (value.match(/<img\b/gi) || []).length;
};

export const getEditorContentLength = (value: string, contentType: string) => {
  if (contentType !== "html") return value.length;
  return getPlainText(value).replace(/\n/g, "").length + getImageCount(value);
};

export const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const formatBytes = (value?: number) => {
  if (!value && value !== 0) return "";
  if (value === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );
  const size = value / 1024 ** index;
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[index]}`;
};
