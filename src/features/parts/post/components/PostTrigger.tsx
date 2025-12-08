"use client";

import Link from "next/link";
import { useState } from "react";

import { useCurrentUser } from "@/features/hooks";

import { PostModal } from "./PostModal";

export function PostTrigger() {
  const { data: user } = useCurrentUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayName = user?.name || user?.username || "User";
  const initials =
    user?.name?.charAt(0).toUpperCase() ||
    user?.username?.charAt(0).toUpperCase() ||
    "?";

  const placeholder = `What's on your mind, ${displayName}?`;

  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <section
        className="rounded-2xl border border-border bg-white p-4 shadow-sm mb-6"
        aria-label="Post composer area"
      >
        <div className="flex items-center gap-3">
          <Link
            href={user?.username ? `/user/profile/${user.username}` : "#"}
            aria-label="View profile"
            className="relative h-12 w-12 shrink-0"
          >
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={displayName}
                className="h-full w-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
                {initials}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer flex-1 rounded-full border border-border/70 bg-secondary px-4 py-2 text-left text-sm text-muted-foreground transition hover:bg-secondary/60"
          >
            {user ? placeholder : "What's on your mind?"}
          </button>
        </div>
      </section>
      <PostModal
        open={isModalOpen}
        onClose={closeModal}
        user={user}
        placeholder={placeholder}
      />
    </>
  );
}
