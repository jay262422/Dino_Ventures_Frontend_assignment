"use client";

import React, { useRef, useState } from "react";
import { UnifiedPlayer } from "./UnifiedPlayer";
import { useVideo } from "@/context/VideoContext";

const DRAG_THRESHOLD = 80;

export function DraggablePlayer() {
  const { currentVideo, isPlayerOpen, isMinimized, minimizePlayer } = useVideo();
  const startY = useRef(0);
  const [dragY, setDragY] = useState(0);
  const dragRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isMinimized) return;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isMinimized) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      dragRef.current = dy;
      setDragY(dy);
    }
  };

  const handleTouchEnd = () => {
    if (dragRef.current > DRAG_THRESHOLD) minimizePlayer();
    setDragY(0);
    dragRef.current = 0;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMinimized) return;
    startY.current = e.clientY;
    const onMouseMove = (ev: MouseEvent) => {
      const dy = ev.clientY - startY.current;
      if (dy > 0) {
        dragRef.current = dy;
        setDragY(dy);
      }
    };
    const onMouseUp = () => {
      if (dragRef.current > DRAG_THRESHOLD) minimizePlayer();
      setDragY(0);
      dragRef.current = 0;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  if (!currentVideo || !isPlayerOpen) return null;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      style={dragY > 0 ? { transform: `translateY(${Math.min(dragY, 200)}px)` } : undefined}
      className={dragY > 0 ? "" : "transition-transform duration-200"}
    >
      <UnifiedPlayer />
    </div>
  );
}
