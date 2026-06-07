// src/components/profile/ProfilePreviewCard.tsx
import React from "react";
import { ExternalLink, User } from "lucide-react";

interface ProfilePreviewCardProps {
  profile: {
    slug?: string;
    public_name?: string;
    avatar_url?: string | null;
  } | null;
}

export default function ProfilePreviewCard({ profile }: ProfilePreviewCardProps) {
  if (!profile) return null;

  const publicUrl = `/profile/${profile.slug || ""}`;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <img
        src={profile.avatar_url || "/default-avatar.png"}
        alt=""
        className="h-16 w-16 rounded-full object-cover"
      />
      <div className="flex-1">
        <p className="text-base font-semibold text-slate-900 dark:text-white">
          {profile.public_name || "Anonymous"}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 break-all">{publicUrl}</p>
      </div>
      <a
        href={publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
      >
        View <ExternalLink size={16} />
      </a>
    </div>
  );
}