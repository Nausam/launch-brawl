"use client";

import { useState } from "react";

export function ImageUploadField({ kind, label, value, onChange }: { kind: "logo" | "cover" | "avatar"; label: string; value: string; onChange: (value: string) => void }) {
  const [status, setStatus] = useState("");
  const upload = async (file: File) => {
    if (!/^image\/(png|jpeg|webp|avif|gif)$/i.test(file.type) || file.size > 10 * 1024 * 1024) { setStatus("Use a supported image up to 10 MB."); return; }
    const previewUrl = URL.createObjectURL(file);
    const dimensions = await new Promise<{ width: number; height: number } | null>((resolve) => { const image = new Image(); image.onload = () => { URL.revokeObjectURL(previewUrl); resolve({ width: image.naturalWidth, height: image.naturalHeight }); }; image.onerror = () => { URL.revokeObjectURL(previewUrl); resolve(null); }; image.src = previewUrl; });
    if (!dimensions || dimensions.width < 32 || dimensions.height < 32 || dimensions.width > 4096 || dimensions.height > 4096) { setStatus("Use an image between 32px and 4096px per side."); return; }
    setStatus("Preparing upload…");
    const response = await fetch("/api/uploads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, contentType: file.type, size: file.size }) });
    const payload = await response.json().catch(() => ({})) as { uploadUrl?: string; publicUrl?: string; key?: string; error?: string };
    if (!response.ok || !payload.uploadUrl || !payload.publicUrl || !payload.key) { setStatus(payload.error ?? "Uploads are not available."); return; }
    const uploadResponse = await fetch(payload.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    if (!uploadResponse.ok) { setStatus("The image upload failed. Try again."); return; }
    const completeResponse = await fetch("/api/uploads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: payload.key, kind, contentType: file.type, size: file.size }) });
    const completed = await completeResponse.json().catch(() => ({})) as { publicUrl?: string; error?: string };
    if (!completeResponse.ok || !completed.publicUrl) { setStatus(completed.error ?? "The upload could not be verified."); return; }
    onChange(completed.publicUrl);
    setStatus("Uploaded.");
  };
  return <label><span className="eyebrow text-muted">{label}</span><input type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} className="mt-2 block w-full rounded-[14px] rounded-br-[6px] border border-line bg-paper-strong/45 px-3 py-2 text-xs shadow-[2px_2px_0_#e5e2da]" />{value && <span className="mt-2 block truncate text-[11px] text-muted">{value}</span>}{status && <span className="mt-2 block text-[11px] font-bold text-muted" role="status">{status}</span>}</label>;
}
