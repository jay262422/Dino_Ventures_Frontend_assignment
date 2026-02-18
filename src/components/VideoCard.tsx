"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import type { VideoContent, CategoryWithContents } from "@/types";

interface VideoCardProps {
  video: VideoContent;
  category: CategoryWithContents;
  onClick: () => void;
}

export function VideoCard({ video, category, onClick }: VideoCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full text-left rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 active:scale-[0.98] transition-transform"
    >
      <div className="relative aspect-video w-full">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 400px"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-6 h-6 text-black ml-1" fill="currentColor" />
          </div>
        </div>
        <span className="absolute bottom-2 right-2 px-2 py-0.5 text-xs font-medium bg-black/75 text-white rounded">
          {video.duration || "—"}
        </span>
      </div>
      <div className="p-3">
        <span className="inline-block px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-600 dark:text-red-400 rounded-full mb-2">
          {category.category.name}
        </span>
        <h3 className="font-medium text-sm line-clamp-2 text-foreground">
          {video.title}
        </h3>
      </div>
    </button>
  );
}
