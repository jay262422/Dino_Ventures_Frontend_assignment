"use client";

import { useMemo } from "react";
import { VideoCard } from "@/components/VideoCard";
import { DraggablePlayer } from "@/components/DraggablePlayer";
import { UnifiedPlayer } from "@/components/UnifiedPlayer";
import { VideoProvider, useVideo } from "@/context/VideoContext";
import videoData from "@/data/videos.json";
import type { CategoryWithContents } from "@/types";

function VideoFeed() {
  const { openVideo } = useVideo();
  const categories = useMemo(() => videoData.categories as CategoryWithContents[], []);

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-white/10 dark:border-black/10 py-4 px-4">
        <h1 className="text-xl font-bold">Video Feed</h1>
      </header>
      <main className="px-4 py-6 space-y-8">
        {categories.map((cat) => (
          <section key={cat.category.slug}>
            <div className="flex items-center gap-2 mb-4">
              <img
                src={cat.category.iconUrl}
                alt=""
                className="w-8 h-8 rounded-lg object-cover"
              />
              <h2 className="font-semibold text-lg">{cat.category.name}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cat.contents.map((video) => (
                <VideoCard
                  key={video.slug}
                  video={video}
                  category={cat}
                  onClick={() => openVideo(video, cat)}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <VideoProvider>
      <VideoFeed />
      <DraggablePlayer />
      <UnifiedPlayer />
    </VideoProvider>
  );
}
