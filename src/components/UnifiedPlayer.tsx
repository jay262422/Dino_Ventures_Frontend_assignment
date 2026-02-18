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
    useCustomPlayerForYouTube,
  } = useVideo();
  const [listVisible, setListVisible] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(2);
  const countdownValueRef = useRef(2);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const nextVideoRef = useRef<{ video: VideoContent; category: CategoryWithContents } | null>(null);

  const cancelCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setShowCountdown(false);
    setCountdown(2);
    countdownValueRef.current = 2;
    nextVideoRef.current = null;
  }, []);

  const handleEnded = useCallback(() => {
    if (!currentCategory || relatedVideos.length === 0) return;
    const next = relatedVideos[0];
    nextVideoRef.current = { video: next, category: currentCategory };
    setShowCountdown(true);
    setCountdown(2);
    countdownValueRef.current = 2;
  }, [relatedVideos, currentCategory]);

  const handleRelatedSelect = useCallback(
    (video: VideoContent) => {
      if (!currentCategory) return;
      cancelCountdown();
      selectVideo(video, currentCategory);
    },
    [cancelCountdown, selectVideo, currentCategory]
  );

  const handleWheelReveal = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (isMinimized) return;
      if (e.deltaY > 24) setListVisible(true);
      if (e.deltaY < -24) setListVisible(false);
    },
    [isMinimized]
  );

  const handleSwipeStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (isMinimized) return;
      swipeStartY.current = e.touches[0].clientY;
    },
    [isMinimized]
  );

  const handleSwipeEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (isMinimized || swipeStartY.current === null) return;
      const deltaY = e.changedTouches[0].clientY - swipeStartY.current;
      swipeStartY.current = null;

      // Swipe up reveals related list, swipe down hides it.
      if (deltaY < -60) setListVisible(true);
      if (deltaY > 60) setListVisible(false);
    },
    [isMinimized]
  );

  useEffect(() => {
    if (!showCountdown) return;
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      const nextValue = countdownValueRef.current - 1;

      if (nextValue <= 0) {
        const next = nextVideoRef.current;
        if (next) {
          selectVideo(next.video, next.category);
        }
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        nextVideoRef.current = null;
        countdownValueRef.current = 2;
        setShowCountdown(false);
        setCountdown(2);
        return;
      }

      countdownValueRef.current = nextValue;
      setCountdown(nextValue);
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [showCountdown, selectVideo]);

  if (!currentVideo || !currentCategory) return null;

  return (
    <div
      className={isMinimized ? "fixed bottom-0 left-0 right-0 z-50 p-3 pb-6" : "fixed inset-0 z-50 bg-black flex flex-col"}
      onWheel={handleWheelReveal}
      onTouchStart={handleSwipeStart}
      onTouchEnd={handleSwipeEnd}
    >
      <div
        className={
          isMinimized
            ? "flex items-center gap-3 bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10"
            : "relative flex-1 min-h-0 flex flex-col"
        }
        role={isMinimized ? "button" : undefined}
        tabIndex={isMinimized ? 0 : undefined}
        onClick={isMinimized ? restorePlayer : undefined}
        onKeyDown={
          isMinimized
            ? (e) => {
                if (e.key === "Enter") restorePlayer();
              }
            : undefined
        }
      >
        {!isMinimized && (
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-end p-4 bg-gradient-to-b from-black/60 to-transparent">
            <button
              type="button"
              onClick={closeVideo}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        )}

        <div className={isMinimized ? "w-40 aspect-video flex-shrink-0" : "flex-1 min-h-[50vh] w-full"}>
          <YouTubePlayer
            key={`${currentVideo.slug}-${useCustomPlayerForYouTube ? "custom" : "native"}`}
            video={currentVideo}
            isMinimized={isMinimized}
            onMinimize={minimizePlayer}
            onRestore={restorePlayer}
            onEnded={handleEnded}
            showCustomControls={!isMinimized}
            showMiniControls={isMinimized}
            forceCustomPlayer={useCustomPlayerForYouTube}
            className={isMinimized ? "w-full h-full" : "w-full h-full min-h-[250px]"}
          />
        </div>

        {isMinimized ? (
          <>
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
          </>
        ) : (
          <div className="flex-shrink-0 border-t border-white/10">
            <button
              type="button"
              onClick={() => setListVisible((value) => !value)}
              className="w-full flex items-center justify-between p-4 bg-black/40 text-white"
            >
              <span className="font-medium">Up next in {currentCategory.category.name}</span>
              <ChevronUp className={`w-5 h-5 transition-transform ${listVisible ? "rotate-180" : ""}`} />
            </button>

            {listVisible && (
              <div className="max-h-64 overflow-y-auto overscroll-contain">
                {relatedVideos.map((video) => (
                  <button
                    key={video.slug}
                    type="button"
                    onClick={() => handleRelatedSelect(video)}
                    className="w-full flex gap-3 p-3 hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="relative w-24 h-14 flex-shrink-0 rounded overflow-hidden">
                      <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" unoptimized />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-white line-clamp-2">{video.title}</h4>
                      <span className="text-xs text-white/60">{video.duration || "--"}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showCountdown && !isMinimized && (
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
