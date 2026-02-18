"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { VideoContent, CategoryWithContents } from "@/types";

interface VideoContextType {
  currentVideo: VideoContent | null;
  currentCategory: CategoryWithContents | null;
  relatedVideos: VideoContent[];
  isPlayerOpen: boolean;
  isMinimized: boolean;
  useCustomPlayerForYouTube: boolean;
  openVideo: (video: VideoContent, category: CategoryWithContents) => void;
  closeVideo: () => void;
  selectVideo: (video: VideoContent, category: CategoryWithContents) => void;
  minimizePlayer: () => void;
  restorePlayer: () => void;
  closeMiniPlayer: () => void;
  toggleYouTubePlayerMode: () => void;
}

const VideoContext = createContext<VideoContextType | null>(null);

export function VideoProvider({ children }: { children: React.ReactNode }) {
  const [currentVideo, setCurrentVideo] = useState<VideoContent | null>(null);
  const [currentCategory, setCurrentCategory] = useState<CategoryWithContents | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [useCustomPlayerForYouTube, setUseCustomPlayerForYouTube] = useState(true);

  const relatedVideos = currentCategory
    ? currentCategory.contents.filter((v) => v.slug !== currentVideo?.slug)
    : [];

  const openVideo = useCallback((video: VideoContent, category: CategoryWithContents) => {
    setCurrentVideo(video);
    setCurrentCategory(category);
    setIsPlayerOpen(true);
    setIsMinimized(false);
  }, []);

  const closeVideo = useCallback(() => {
    setIsPlayerOpen(false);
    setIsMinimized(false);
    setCurrentVideo(null);
    setCurrentCategory(null);
  }, []);

  const selectVideo = useCallback((video: VideoContent, category: CategoryWithContents) => {
    setCurrentVideo(video);
    setCurrentCategory(category);
  }, []);

  const minimizePlayer = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const restorePlayer = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const closeMiniPlayer = useCallback(() => {
    setIsMinimized(false);
    setIsPlayerOpen(false);
    setCurrentVideo(null);
    setCurrentCategory(null);
  }, []);

  const toggleYouTubePlayerMode = useCallback(() => {
    setUseCustomPlayerForYouTube((prev) => !prev);
  }, []);

  return (
    <VideoContext.Provider
      value={{
        currentVideo,
        currentCategory,
        relatedVideos,
        isPlayerOpen,
        isMinimized,
        useCustomPlayerForYouTube,
        openVideo,
        closeVideo,
        selectVideo,
        minimizePlayer,
        restorePlayer,
        closeMiniPlayer,
        toggleYouTubePlayerMode,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
}

export function useVideo() {
  const ctx = useContext(VideoContext);
  if (!ctx) throw new Error("useVideo must be used within VideoProvider");
  return ctx;
}
