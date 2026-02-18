"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import type { VideoContent } from "@/types";

interface MediaPlayerProps {
  video: VideoContent;
  isMinimized: boolean;
  onMinimize: () => void;
  onRestore: () => void;
  onEnded?: () => void;
  showCustomControls?: boolean;
  className?: string;
  forceCustomPlayer?: boolean;
  showMiniControls?: boolean;
}

interface YouTubePlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  destroy: () => void;
}

interface YouTubePlayerEvent {
  target: YouTubePlayerInstance;
  data: number;
}

interface YouTubePlayerOptions {
  videoId: string;
  width?: string | number;
  height?: string | number;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (event: YouTubePlayerEvent) => void;
    onStateChange?: (event: YouTubePlayerEvent) => void;
    onError?: (event: YouTubePlayerEvent) => void;
  };
}

interface YouTubeNamespace {
  Player: new (element: string | HTMLElement, options: YouTubePlayerOptions) => YouTubePlayerInstance;
  PlayerState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  };
}

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeNamespace> | null = null;

function loadYouTubeIframeApi(): Promise<YouTubeNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API is only available in the browser"));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve, reject) => {
    const scriptId = "youtube-iframe-api";
    let settled = false;
    let timeoutId = 0;

    const resolveReady = (yt: YouTubeNamespace | undefined) => {
      if (settled) return;
      if (!yt?.Player) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve(yt);
    };

    const rejectLoad = (error: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      youtubeApiPromise = null;
      reject(error);
    };

    const tryResolveReady = () => {
      if (window.YT?.Player) {
        resolveReady(window.YT);
        return true;
      }
      return false;
    };

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (!tryResolveReady()) {
        rejectLoad(new Error("YouTube API loaded without Player interface"));
      }
    };

    const existingScript = document.getElementById(scriptId);
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => rejectLoad(new Error("Failed to load YouTube IFrame API"));
      document.head.appendChild(script);
    }

    timeoutId = window.setTimeout(() => {
      if (!tryResolveReady()) {
        rejectLoad(new Error("Timed out loading YouTube IFrame API"));
      }
    }, 10000);

    if (tryResolveReady()) return;
  });

  return youtubeApiPromise;
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

function getYouTubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|\/embed\/)([^?&/]+)/);
  return match ? match[1] : null;
}

function getYouTubeEmbedUrl(url: string): string {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return url;

  const params = new URLSearchParams({
    autoplay: "1",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export function YouTubePlayer({
  video,
  isMinimized,
  onMinimize,
  onRestore,
  onEnded,
  showCustomControls = true,
  className = "",
  forceCustomPlayer = false,
  showMiniControls = false,
}: MediaPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubeHostRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<YouTubePlayerInstance | null>(null);
  const youtubeTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onEndedRef = useRef(onEnded);
  const volumeRef = useRef(1);
  const isMutedRef = useRef(false);
  const lastTapAtRef = useRef(0);
  const lastTapSideRef = useRef<"left" | "right" | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isYouTubeReady, setIsYouTubeReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [skipAnim, setSkipAnim] = useState<"fwd" | "back" | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const isYouTubeMedia = video.mediaType === "YOUTUBE" || isYouTubeUrl(video.mediaUrl);
  const isNativeVideo = !isYouTubeMedia;
  const useYouTubeCustomPlayer = isYouTubeMedia && forceCustomPlayer;
  const useYouTubeNativePlayer = isYouTubeMedia && !forceCustomPlayer;
  const isControllable = isNativeVideo || useYouTubeCustomPlayer;
  const youtubeUrl = isYouTubeMedia ? getYouTubeEmbedUrl(video.mediaUrl) : null;
  const effectiveReady = isNativeVideo ? isReady : useYouTubeCustomPlayer ? isYouTubeReady : true;

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const stopYouTubeTicker = useCallback(() => {
    if (youtubeTickRef.current) {
      clearInterval(youtubeTickRef.current);
      youtubeTickRef.current = null;
    }
  }, []);

  const tickNative = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
      if (videoRef.current.ended) {
        onEndedRef.current?.();
      }
    }
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !isNativeVideo) return;

    const handleTimeUpdate = () => {
      tickNative();
      if (videoRef.current) {
        setIsPlaying(!videoRef.current.paused);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEndedRef.current?.();
    };

    const handleLoadedMetadata = () => {
      setIsReady(true);
      setVideoError(null);
      if (videoRef.current) {
        setDuration(videoRef.current.duration || 0);
      }
    };

    const handleCanPlay = () => {
      setIsReady(true);
      setVideoError(null);
    };

    const handleError = () => {
      const errorMap: Record<number, string> = {
        1: "Video loading was aborted",
        2: "Network error while loading video",
        3: "Video decoding failed",
        4: "Video format not supported",
      };
      const errorCode = videoElement.error?.code || 0;
      const errorMsg = errorMap[errorCode] || `Unknown error (code: ${errorCode})`;
      setVideoError(`Failed to load video: ${errorMsg}`);
      console.error("Video error code:", errorCode, "Message:", errorMsg);
    };

    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    videoElement.addEventListener("ended", handleEnded);
    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    videoElement.addEventListener("canplay", handleCanPlay);
    videoElement.addEventListener("error", handleError);

    videoElement.play().catch((error) => {
      console.warn("Autoplay failed:", error);
    });

    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
      videoElement.removeEventListener("ended", handleEnded);
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.removeEventListener("canplay", handleCanPlay);
      videoElement.removeEventListener("error", handleError);
    };
  }, [isNativeVideo, tickNative, video.mediaUrl]);

  useEffect(() => {
    if (!useYouTubeCustomPlayer) {
      stopYouTubeTicker();
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.destroy();
        youtubePlayerRef.current = null;
      }
      return;
    }

    const videoId = getYouTubeVideoId(video.mediaUrl);
    if (!videoId || !youtubeHostRef.current) return;

    let cancelled = false;

    loadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled || !youtubeHostRef.current) return;

        if (youtubePlayerRef.current) {
          youtubePlayerRef.current.destroy();
          youtubePlayerRef.current = null;
        }

        youtubeHostRef.current.innerHTML = "";

        const player = new YT.Player(youtubeHostRef.current, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady: (event) => {
              if (cancelled) return;
              setIsYouTubeReady(true);
              setVideoError(null);
              const initialDuration = event.target.getDuration();
              if (isFinite(initialDuration)) {
                setDuration(initialDuration);
              }
              if (isMutedRef.current) {
                event.target.mute();
              } else {
                event.target.unMute();
                event.target.setVolume(Math.round(volumeRef.current * 100));
              }
              event.target.playVideo();

              stopYouTubeTicker();
              youtubeTickRef.current = setInterval(() => {
                const ytPlayer = youtubePlayerRef.current;
                if (!ytPlayer) return;
                const nextCurrent = ytPlayer.getCurrentTime();
                const nextDuration = ytPlayer.getDuration();

                if (isFinite(nextCurrent)) {
                  setCurrentTime(nextCurrent);
                }
                if (isFinite(nextDuration) && nextDuration > 0) {
                  setDuration(nextDuration);
                }
              }, 250);
            },
            onStateChange: (event) => {
              if (event.data === YT.PlayerState.PLAYING) {
                setIsPlaying(true);
              } else if (event.data === YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              } else if (event.data === YT.PlayerState.ENDED) {
                setIsPlaying(false);
                onEndedRef.current?.();
              }
            },
            onError: () => {
              setVideoError("Failed to load YouTube video");
            },
          },
        });

        youtubePlayerRef.current = player;
      })
      .catch((error: unknown) => {
        console.error("YouTube player init failed:", error);
        setVideoError("Failed to initialize YouTube player");
        setIsYouTubeReady(false);
      });

    return () => {
      cancelled = true;
      stopYouTubeTicker();
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.destroy();
        youtubePlayerRef.current = null;
      }
    };
  }, [video.mediaUrl, useYouTubeCustomPlayer, stopYouTubeTicker]);

  useEffect(() => {
    if (videoRef.current && isNativeVideo) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }

    if (youtubePlayerRef.current && useYouTubeCustomPlayer && isYouTubeReady) {
      if (isMuted) {
        youtubePlayerRef.current.mute();
      } else {
        youtubePlayerRef.current.unMute();
        youtubePlayerRef.current.setVolume(Math.round(volume * 100));
      }
    }
  }, [volume, isMuted, isNativeVideo, useYouTubeCustomPlayer, isYouTubeReady]);

  const togglePlay = () => {
    if (!effectiveReady || !isControllable) return;

    try {
      if (isNativeVideo && videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
        return;
      }

      if (useYouTubeCustomPlayer && youtubePlayerRef.current) {
        const playerState = youtubePlayerRef.current.getPlayerState();
        if (playerState === 1) {
          youtubePlayerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          youtubePlayerRef.current.playVideo();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.warn("Play/Pause failed:", error);
    }
  };

  const skip = (delta: number) => {
    if (!effectiveReady || duration === 0 || !isControllable) return;

    try {
      if (isNativeVideo && videoRef.current) {
        const newTime = Math.max(0, Math.min(duration, currentTime + delta));
        videoRef.current.currentTime = newTime;
        setSkipAnim(delta > 0 ? "fwd" : "back");
        setTimeout(() => setSkipAnim(null), 400);
        return;
      }

      if (useYouTubeCustomPlayer && youtubePlayerRef.current) {
        const current = youtubePlayerRef.current.getCurrentTime();
        const total = youtubePlayerRef.current.getDuration() || duration;
        const newTime = Math.max(0, Math.min(total, current + delta));
        youtubePlayerRef.current.seekTo(newTime, true);
        setCurrentTime(newTime);
        setSkipAnim(delta > 0 ? "fwd" : "back");
        setTimeout(() => setSkipAnim(null), 400);
      }
    } catch (error) {
      console.warn("Skip failed:", error);
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!effectiveReady || duration === 0 || !isControllable) return;

    try {
      const pct = parseFloat(e.target.value);
      const nextTime = (pct / 100) * duration;

      if (isNativeVideo && videoRef.current) {
        videoRef.current.currentTime = nextTime;
        return;
      }

      if (useYouTubeCustomPlayer && youtubePlayerRef.current) {
        youtubePlayerRef.current.seekTo(nextTime, true);
        setCurrentTime(nextTime);
      }
    } catch (error) {
      console.warn("Seek failed:", error);
    }
  };

  const toggleMute = () => {
    setIsMuted((value) => !value);
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen().catch((error) => {
          console.warn("Fullscreen request failed:", error);
        });
      }
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLVideoElement | HTMLDivElement>) => {
    if (!isControllable) return;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const midpoint = rect.width / 2;
      const delta = clickX < midpoint ? -10 : 10;
      skip(delta);
    }
  };

  const handleCustomModeTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isControllable || !containerRef.current) return;

    const touch = e.changedTouches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const side: "left" | "right" = touchX < rect.width / 2 ? "left" : "right";
    const now = Date.now();

    const isDoubleTap = now - lastTapAtRef.current < 320 && lastTapSideRef.current === side;
    if (isDoubleTap) {
      skip(side === "left" ? -10 : 10);
      lastTapAtRef.current = 0;
      lastTapSideRef.current = null;
      return;
    }

    lastTapAtRef.current = now;
    lastTapSideRef.current = side;
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-black overflow-hidden w-full h-full ${className}`}
      style={{
        aspectRatio: isMinimized ? "16/9" : undefined,
      }}
    >
      {isNativeVideo && (
        <video
          ref={videoRef}
          src={video.mediaUrl}
          className="absolute inset-0 w-full h-full cursor-pointer"
          style={{ objectFit: "contain" }}
          playsInline
          preload="auto"
          onDoubleClick={handleDoubleClick}
        />
      )}

      {useYouTubeNativePlayer && (
        <div className="absolute inset-0 w-full h-full cursor-pointer" onDoubleClick={handleDoubleClick}>
          <iframe
            src={youtubeUrl ?? undefined}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ border: "none", pointerEvents: "auto" }}
            title="YouTube player"
          />
        </div>
      )}

      {useYouTubeCustomPlayer && (
        <div className="absolute inset-0 w-full h-full cursor-pointer">
          <div ref={youtubeHostRef} className="w-full h-full" />
          {/* Capture gestures above iframe: custom YouTube mode needs this for reliable taps. */}
          <div
            className="absolute inset-0 z-[5]"
            onDoubleClick={handleDoubleClick}
            onTouchEnd={handleCustomModeTouchEnd}
          />
          <div className="absolute top-3 left-3 right-3 pointer-events-none">
            <div className="bg-black/70 px-3 py-2 rounded text-white text-xs">
              YouTube custom mode is active (IFrame API controls)
            </div>
          </div>
        </div>
      )}

      {!effectiveReady && !videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
          <div className="text-white text-center">
            <div className="animate-spin mb-2">
              <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full"></div>
            </div>
            <p className="text-sm">Loading...</p>
          </div>
        </div>
      )}

      {videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-white text-center max-w-xs px-4">
            <p className="text-lg font-bold mb-2">Error Loading Video</p>
            <p className="text-sm text-red-400">{videoError}</p>
          </div>
        </div>
      )}

      {showCustomControls && isControllable && (
        <div className="absolute inset-x-0 bottom-0 pointer-events-none flex flex-col justify-end">
          <div className="pointer-events-auto p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
            <input
              type="range"
              min={0}
              max={100}
              value={duration ? (currentTime / duration) * 100 : 0}
              onChange={seek}
              disabled={!effectiveReady || duration === 0}
              className="w-full h-1.5 accent-red-500 mb-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => skip(-10)}
                  disabled={!effectiveReady || duration === 0}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Skip back 10 seconds"
                  title="-10s"
                >
                  <SkipBack className="w-5 h-5 text-white" />
                </button>
                <button
                  type="button"
                  onClick={togglePlay}
                  disabled={!effectiveReady}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={isPlaying ? "Pause" : "Play"}
                  title={isPlaying ? "Pause" : "Play"}
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
                  disabled={!effectiveReady || duration === 0}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Skip forward 10 seconds"
                  title="+10s"
                >
                  <SkipForward className="w-5 h-5 text-white" />
                </button>
                <div className="w-1 h-6 bg-white/30"></div>
                <button
                  type="button"
                  onClick={toggleMute}
                  disabled={!effectiveReady}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume * 100}
                  onChange={(e) => setVolume(parseFloat(e.target.value) / 100)}
                  disabled={!effectiveReady}
                  className="w-16 h-1 accent-red-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Volume"
                  aria-label="Volume"
                />
                <div className="w-1 h-6 bg-white/30"></div>
                <button
                  type="button"
                  onClick={handleFullscreen}
                  disabled={!effectiveReady}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Fullscreen"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-5 h-5 text-white" />
                </button>
                {isMinimized ? (
                  <button
                    type="button"
                    onClick={onRestore}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    aria-label="Restore"
                    title="Restore"
                  >
                    <Maximize2 className="w-5 h-5 text-white" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onMinimize}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    aria-label="Minimize"
                    title="Minimize"
                  >
                    <Minimize2 className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showMiniControls && isControllable && (
        <div className="absolute bottom-2 right-2 z-10 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="p-2 rounded-full bg-black/70 hover:bg-black/85 transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
            )}
          </button>
        </div>
      )}

      {skipAnim && isControllable && (
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
