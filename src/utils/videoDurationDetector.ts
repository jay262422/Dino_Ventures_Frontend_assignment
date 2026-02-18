/**
 * Auto-detect video durations
 * For MP4: Load video and get duration
 * For YouTube: Use YouTube Data API or extract from metadata
 */

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export async function detectMP4Duration(url: string): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    
    const handleLoadedMetadata = () => {
      const duration = video.duration;
      video.remove();
      resolve(formatTime(duration));
    };
    
    const handleError = () => {
      video.remove();
      resolve("FAILED");
    };
    
    video.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true });
    video.addEventListener("error", handleError, { once: true });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      video.remove();
      resolve("TIMEOUT");
    }, 10000);
    
    video.src = url;
  });
}

// Try to extract YouTube duration from oEmbed API
export async function getYouTubeDurationFromAPI(videoId: string): Promise<string> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { headers: { 'Accept': '*/*' } }
    );
    
    if (!response.ok) throw new Error("oEmbed API failed");
    
    const data = await response.json();
    
    // oEmbed doesn't return duration, but we can try alternative approach
    // Parse from iframe title or metadata if available
    return "UNKNOWN";
  } catch (error) {
    console.warn(`Failed to get YouTube duration for ${videoId}:`, error);
    return "UNKNOWN";
  }
}

export async function detectAllVideosDurations(videos: any[]) {
  const results: any[] = [];
  
  for (const video of videos) {
    try {
      let duration = video.duration; // Default to backend value
      
      if (video.mediaType === "MP4") {
        const detected = await detectMP4Duration(video.mediaUrl);
        if (detected !== "FAILED" && detected !== "TIMEOUT") {
          duration = detected;
        }
      } else if (video.mediaType === "YOUTUBE") {
        // Try to get YouTube duration from API
        const videoIdMatch = video.mediaUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|\/embed\/)([^?&/]+)/);
        if (videoIdMatch) {
          const detected = await getYouTubeDurationFromAPI(videoIdMatch[1]);
          if (detected !== "UNKNOWN") {
            duration = detected;
          }
        }
      }
      
      results.push({
        slug: video.slug,
        title: video.title,
        oldDuration: video.duration,
        newDuration: duration,
        mediaType: video.mediaType,
      });
    } catch (error) {
      console.error(`Failed to detect duration for ${video.slug}:`, error);
      results.push({
        slug: video.slug,
        title: video.title,
        oldDuration: video.duration,
        newDuration: "ERROR",
        mediaType: video.mediaType,
      });
    }
  }
  
  return results;
}

export function generateUpdateScript(results: any[]): string {
  let script = `// Copy the correct durations from the results above:\n\n`;
  results.forEach((item) => {
    if (item.newDuration !== "UNKNOWN" && item.newDuration !== item.oldDuration) {
      script += `// ${item.title}\n`;
      script += `// Change duration from "${item.oldDuration}" to "${item.newDuration}"\n\n`;
    }
  });
  return script;
}
