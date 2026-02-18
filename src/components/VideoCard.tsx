"use client";

import Image from "next/image";
import { Play, Video } from "lucide-react";
import { useState } from "react";
import type { VideoContent, CategoryWithContents } from "@/types";

interface VideoCardProps {
  video: VideoContent;
  category: CategoryWithContents;
  onClick: () => void;
}

function getGradient(title: string): string {
  const colors = [
    "from-blue-500 to-purple-600",
    "from-red-500 to-pink-600",
    "from-green-500 to-teal-600",
    "from-yellow-500 to-orange-600",
    "from-indigo-500 to-blue-600",
    "from-cyan-500 to-blue-600",
  ];
  // Use title length to pick a consistent gradient
  const index = title.length % colors.length;
  return colors[index];
}

export function VideoCard({ video, category, onClick }: VideoCardProps) {
  const [imageError, setImageError] = useState(false);
  const gradient = getGradient(video.title);
  const isMP4 = video.mediaType === "MP4" || !video.thumbnailUrl || imageError;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full text-left rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 active:scale-[0.98] transition-transform"
    >
      <div className="relative aspect-video w-full">
        {/* Background gradient placeholder */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-80`} />

        {/* Image - only show if not MP4 and no error */}
        {!isMP4 && video.thumbnailUrl && (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
            unoptimized
            onError={() => setImageError(true)}
          />
        )}

        {/* MP4 Badge */}
        {isMP4 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Video className="w-12 h-12 text-white/80" strokeWidth={1.5} />
            <span className="text-xs font-medium text-white/70 uppercase tracking-wider">
              {video.mediaType || "Video"}
            </span>
          </div>
        )}

        {/* Overlay with play button */}
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
