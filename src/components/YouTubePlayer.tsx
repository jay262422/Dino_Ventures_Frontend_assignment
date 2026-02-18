"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Maximize2, Minimize2 } from "lucide-react";
import type { VideoContent } from "@/types";

interface MediaPlayerProps {
  video: VideoContent;
  isMinimized: boolean;
  onMinimize: () => void;
  onRestore: () => void;
  onEnded?: () => void;
  showCustomControls?: boolean;
  className?: string;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function isYouTubeUrl(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

function getYouTubeEmbedUrl(url: string): string {
  if (url.includes("/embed/")) return url;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|\/embed\/)([^?&/]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

export function YouTubePlayer({
  video,
  isMinimized,
  onMinimize,
  onRestore,
  onEnded,
  showCustomControls = true,
  className = "",
}: MediaPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [skipAnim, setSkipAnim] = useState<"fwd" | "back" | null>(null);
  const isYouTube = isYouTubeUrl(video.mediaUrl);
  const youtubeUrl = isYouTube ? getYouTubeEmbedUrl(video.mediaUrl) : null;

  const tick = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
      if (videoRef.current.ended) {
        onEnded?.();
      }
    }
  }, [onEnded]);

  // Setup native video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube) return;

    const handleTimeUpdate = () => tick();
    const handleEnded = () => onEnded?.();
    const handleLoadedMetadata = () => setIsReady(true);
    const handleCanPlay = () => setIsReady(true);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", handleCanPlay);

    // Auto-play
    video.play().catch((e) => console.warn("Autoplay failed:", e));

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, [isYouTube, tick, onEnded]);

  // YouTube iframe is ready immediately
  useEffect(() => {
    if (isYouTube) {
      setIsReady(true);
    }
  }, [isYouTube]);

  const togglePlay = () => {
    if (!isReady || isYouTube) return;
    try {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    } catch (error) {
      console.warn("Play/Pause failed:", error);
    }
  };

  const skip = (delta: number) => {
    if (!isReady || duration === 0 || isYouTube) return;
    try {
      if (videoRef.current) {
        const newTime = Math.max(0, Math.min(duration, currentTime + delta));
        videoRef.current.currentTime = newTime;
        setSkipAnim(delta > 0 ? "fwd" : "back");
        setTimeout(() => setSkipAnim(null), 400);
      }
    } catch (error) {
      console.warn("Skip failed:", error);
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isReady || duration === 0 || isYouTube) return;
    try {
      const pct = parseFloat(e.target.value);
      const t = (pct / 100) * duration;
      if (videoRef.current) videoRef.current.currentTime = t;
    } catch (error) {
      console.warn("Seek failed:", error);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-black overflow-hidden w-full h-full ${className}`}
      style={{
        aspectRatio: isMinimized ? "16/9" : undefined,
      }}
    >
      {/* Native HTML5 Video Player */}
      {!isYouTube && (
        <video
          ref={videoRef}
          src={video.mediaUrl}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "contain" }}
          playsInline
          preload="metadata"
        />
      )}

      {/* YouTube IFrame Fallback */}
      {isYouTube && (
        <iframe
          src={youtubeUrl!}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ border: "none" }}
          title="YouTube player"
        />
      )}

      {/* Loading Indicator */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
          <div className="text-white text-center">
            <div className="animate-spin mb-2">
              <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full"></div>
            </div>
            <p className="text-sm">Loading...</p>
          </div>
        </div>
      )}

      {/* Custom Controls - Only for Native Video */}
      {showCustomControls && !isYouTube && (
        <div className="absolute inset-x-0 bottom-0 pointer-events-none flex flex-col justify-end">
          <div className="pointer-events-auto p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
            <input
              type="range"
              min={0}
              max={100}
              value={duration ? (currentTime / duration) * 100 : 0}
              onChange={seek}
              disabled={!isReady || duration === 0}
              className="w-full h-1.5 accent-red-500 mb-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => skip(-10)}
                  disabled={!isReady || duration === 0}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Skip back 10 seconds"
                >
                  <SkipBack className="w-5 h-5 text-white" />
                </button>
                <button
                  type="button"
                  onClick={togglePlay}
                  disabled={!isReady}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => skip(10)}
                  disabled={!isReady || duration === 0}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Skip forward 10 seconds"
                >
                  <SkipForward className="w-5 h-5 text-white" />
                </button>
                {isMinimized ? (
                  <button
                    type="button"
                    onClick={onRestore}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    aria-label="Restore"
                  >
                    <Maximize2 className="w-5 h-5 text-white" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onMinimize}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    aria-label="Minimize"
                  >
                    <Minimize2 className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skip Animation */}
      {skipAnim && !isYouTube && (
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none z-5 ${
            skipAnim === "fwd" ? "animate-pulse-forward" : "animate-pulse-back"
          }`}
        >
          <span className="text-white text-2xl font-bold bg-black/50 px-4 py-2 rounded">
            {skipAnim === "fwd" ? "+10" : "-10"}
          </span>
        </div>
      )}
    </div>
  );
}
