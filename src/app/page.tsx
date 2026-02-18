"use client";

import { useMemo } from "react";
import Image from "next/image";
import { VideoCard } from "@/components/VideoCard";
import { DraggablePlayer } from "@/components/DraggablePlayer";
import { VideoProvider, useVideo } from "@/context/VideoContext";
import videoData from "@/data/videos.json";
import type { CategoryWithContents } from "@/types";

function VideoFeed() {
  const { openVideo, useCustomPlayerForYouTube, toggleYouTubePlayerMode } = useVideo();
  const categories = useMemo(() => videoData.categories as CategoryWithContents[], []);

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-white/10 dark:border-black/10 py-4 px-4">
        <h1 className="text-xl font-bold">Video Feed</h1>
      </header>

      <section className="bg-white dark:bg-slate-950 px-4 py-8 border-b border-gray-200 dark:border-white/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Player Settings</h2>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">YouTube Videos</h3>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (useCustomPlayerForYouTube) toggleYouTubePlayerMode();
                }}
                className={`flex-1 py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                  !useCustomPlayerForYouTube
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/40 ring-2 ring-red-300 hover:bg-red-600"
                    : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Native iframe Player
              </button>
              <button
                onClick={() => {
                  if (!useCustomPlayerForYouTube) toggleYouTubePlayerMode();
                }}
                className={`flex-1 py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                  useCustomPlayerForYouTube
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/40 ring-2 ring-blue-300 hover:bg-blue-600"
                    : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Custom HTML5 Player
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
              {useCustomPlayerForYouTube
                ? "Custom YouTube controls are ON (IFrame API mode)."
                : "Fallback mode: YouTube native iframe mode"}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">MP4 Videos</h3>
            <div className="py-4 px-6 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <button
                disabled
                className="w-full py-4 px-6 rounded-lg font-semibold text-lg bg-green-500 text-white cursor-default shadow-lg shadow-green-500/40"
              >
                Custom HTML5 Player (Only Option)
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                MP4 videos use custom player with full controls (play, pause, seek, volume, fullscreen)
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="px-4 py-6 space-y-8">
        {categories.map((cat) => (
          <section key={cat.category.slug}>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src={cat.category.iconUrl}
                alt=""
                width={32}
                height={32}
                className="w-8 h-8 rounded-lg object-cover"
                unoptimized
              />
              <h2 className="font-semibold text-lg">{cat.category.name}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cat.contents.map((video) => (
                <VideoCard key={video.slug} video={video} category={cat} onClick={() => openVideo(video, cat)} />
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
    </VideoProvider>
  );
}
