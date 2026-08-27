"use client";

import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/components/ui/ImageUploadField";

export function SettingsForm({ displayName, username, email, website, bio, imageUrl = "", notificationPreferences = { email: true, productActivity: true, competitive: true, campaigns: true } }: { displayName: string; username: string; email: string; website: string; bio: string; imageUrl?: string; notificationPreferences?: { email: boolean; productActivity: boolean; competitive: boolean; campaigns: boolean } }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [avatarUrl, setAvatarUrl] = useState(imageUrl);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("saving");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: form.get("displayName"),
        username: form.get("username"),
        website: form.get("website"),
        bio: form.get("bio"),
        imageUrl: avatarUrl || undefined,
        notificationPreferences: {
          email: form.get("emailNotifications") === "on",
          productActivity: form.get("productActivity") === "on",
          competitive: form.get("competitiveNotifications") === "on",
          campaigns: form.get("campaignNotifications") === "on",
        },
      }),
    });
    setStatus(response.ok ? "saved" : "error");
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Display name" name="displayName" defaultValue={displayName} />
        <Field label="Username" name="username" defaultValue={username} />
        <Field label="Email" name="email" defaultValue={email} disabled />
        <Field label="Website" name="website" defaultValue={website} />
      </div>
      <label className="mt-5 block">
        <span className="eyebrow text-muted">Bio</span>
        <textarea name="bio" defaultValue={bio} rows={3} className="mt-2 w-full resize-none border border-line bg-paper-strong/45 px-4 py-3 text-sm outline-none focus:border-ink" />
      </label>
      <div className="mt-5 max-w-xl">
        <ImageUploadField kind="avatar" label="Profile image" value={avatarUrl} onChange={setAvatarUrl} />
      </div>
      <fieldset className="mt-6 border-t border-line pt-5">
        <legend className="eyebrow text-muted">Notification preferences</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Preference name="emailNotifications" label="Email notifications" checked={notificationPreferences.email} />
          <Preference name="productActivity" label="Product activity" checked={notificationPreferences.productActivity} />
          <Preference name="competitiveNotifications" label="Brawls and seasons" checked={notificationPreferences.competitive} />
          <Preference name="campaignNotifications" label="Campaign and payment updates" checked={notificationPreferences.campaigns} />
        </div>
      </fieldset>
      <Button type="submit" disabled={status === "saving"} variant="primary" size="md" className="mt-6 uppercase tracking-[0.08em]">Save changes <Check size={15} /></Button>
      {status === "saved" ? <p className="mt-3 text-xs font-bold text-[#2d7667]">Profile saved for this account.</p> : null}
      {status === "error" ? <p className="mt-3 text-xs font-bold text-coral">Could not save. Try again.</p> : null}
    </form>
  );
}

function Preference({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" name={name} defaultChecked={checked} className="h-4 w-4 accent-coral" />{label}</label>;
}

function Field({ label, name, defaultValue, disabled = false }: { label: string; name: string; defaultValue: string; disabled?: boolean }) {
  return (
    <label>
      <span className="eyebrow text-muted">{label}</span>
      <input name={name} defaultValue={defaultValue} disabled={disabled} className="mt-2 w-full border border-line bg-paper-strong/45 px-4 py-3 text-sm outline-none focus:border-ink disabled:text-muted" />
    </label>
  );
}
