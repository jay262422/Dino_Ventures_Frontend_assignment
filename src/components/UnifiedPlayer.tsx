"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, ChevronUp } from "lucide-react";
import Image from "next/image";
import { YouTubePlayer } from "./YouTubePlayer";
import { useVideo } from "@/context/VideoContext";
import type { VideoContent, CategoryWithContents } from "@/types";

/** Single player instance - switches layout when minimized, video keeps playing */
export function UnifiedPlayer() {
  const {
    currentVideo,
    currentCategory,
    relatedVideos,
    closeVideo,
    selectVideo,
    minimizePlayer,
    restorePlayer,
    isMinimized,
  } = useVideo();
  const [listVisible, setListVisible] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(2);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextVideoRef = useRef<{ video: VideoContent; category: CategoryWithContents } | null>(null);

  const handleEnded = useCallback(() => {
    if (relatedVideos.length === 0) return;
    const next = relatedVideos[0];
    const cat = currentCategory!;
    nextVideoRef.current = { video: next, category: cat };
    setShowCountdown(true);
    setCountdown(2);
  }, [relatedVideos, currentCategory]);

  // Handle countdown and auto-play in a separate effect
  useEffect(() => {
    if (!showCountdown) return;

    const countdownInterval = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => {
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [showCountdown]);

  // When countdown reaches 0, auto-play next video
  useEffect(() => {
    if (countdown <= 0 && showCountdown && nextVideoRef.current) {
      selectVideo(nextVideoRef.current.video, nextVideoRef.current.category);
      setShowCountdown(false);
      setCountdown(2);
      nextVideoRef.current = null;
    }
  }, [countdown, showCountdown, selectVideo]);

  const cancelCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowCountdown(false);
    setCountdown(2);
    nextVideoRef.current = null;
  };

  if (!currentVideo || !currentCategory) return null;

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-50 p-3 pb-6"
        role="button"
        tabIndex={0}
        onClick={restorePlayer}
        onKeyDown={(e) => e.key === "Enter" && restorePlayer()}
      >
        <div className="flex items-center gap-3 bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10">
          <div className="w-40 aspect-video flex-shrink-0">
            <YouTubePlayer
              video={currentVideo}
              isMinimized
              onMinimize={() => {}}
              onRestore={restorePlayer}
              showCustomControls={false}
              className="w-full h-full"
            />
          </div>
          <div className="flex-1 min-w-0 py-2">
            <p className="text-white text-sm font-medium line-clamp-2 pr-2">{currentVideo.title}</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeVideo();
            }}
            className="p-2 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="relative flex-1 min-h-0 flex flex-col">
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
          <button
            type="button"
            onClick={closeVideo}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-[50vh] w-full">
            <YouTubePlayer
              video={currentVideo}
              isMinimized={false}
              onMinimize={minimizePlayer}
              onRestore={() => {}}
              onEnded={handleEnded}
              showCustomControls
              className="w-full h-full min-h-[250px]"
            />
          </div>

          <div className="flex-shrink-0 border-t border-white/10">
            <button
              type="button"
              onClick={() => setListVisible(!listVisible)}
              className="w-full flex items-center justify-between p-4 bg-black/40 text-white"
            >
              <span className="font-medium">Up next in {currentCategory.category.name}</span>
              <ChevronUp className={`w-5 h-5 transition-transform ${listVisible ? "rotate-180" : ""}`} />
            </button>

            {listVisible && (
              <div className="max-h-64 overflow-y-auto overscroll-contain">
                {relatedVideos.map((v) => (
                  <button
                    key={v.slug}
                    type="button"
                    onClick={() => selectVideo(v, currentCategory)}
                    className="w-full flex gap-3 p-3 hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="relative w-24 h-14 flex-shrink-0 rounded overflow-hidden">
                      <Image src={v.thumbnailUrl} alt={v.title} fill className="object-cover" unoptimized />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-white line-clamp-2">{v.title}</h4>
                      <span className="text-xs text-white/60">{v.duration || "—"}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCountdown && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
          <div className="text-center">
            <p className="text-white text-lg mb-2">Up next</p>
            <p className="text-4xl font-bold text-white mb-4">{countdown}</p>
            <button
              type="button"
              onClick={cancelCountdown}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-white text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
