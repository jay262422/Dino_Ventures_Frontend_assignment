"use client";

import { useEffect, useState } from "react";
import {
  detectAllVideosDurations,
  type DurationDetectionResult,
} from "@/utils/videoDurationDetector";
import videosData from "@/data/videos.json";
import type { CategoryWithContents, VideoContent } from "@/types";

export default function DurationDebugPage() {
  const [results, setResults] = useState<DurationDetectionResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectDurations = async () => {
      const allVideos: VideoContent[] = [];

      // Flatten all videos from all categories
      (videosData.categories as CategoryWithContents[]).forEach((category) => {
        allVideos.push(...category.contents);
      });

      const detectedResults = await detectAllVideosDurations(allVideos);
      setResults(detectedResults);
      setLoading(false);

      // Log for copy-paste
      console.table(detectedResults);
    };

    detectDurations();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full"></div>
          </div>
          <p>Detecting video durations...</p>
          <p className="text-sm text-gray-400 mt-2">This may take a minute</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Video Duration Detection</h1>

        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-300 mb-4">Detected {results.length} videos. Check the table below for changes:</p>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-2 px-2">Title</th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Old Duration</th>
                <th className="text-left py-2 px-2">New Duration</th>
                <th className="text-left py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item) => {
                const isChanged = item.newDuration !== "UNKNOWN" && item.newDuration !== item.oldDuration;
                const bgColor = isChanged ? "bg-green-900/30" : "bg-gray-800/30";

                return (
                  <tr key={item.slug} className={`border-b border-gray-700 ${bgColor}`}>
                    <td className="py-3 px-2 text-gray-300">{item.title}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          item.mediaType === "MP4"
                            ? "bg-blue-600/50 text-blue-200"
                            : "bg-red-600/50 text-red-200"
                        }`}
                      >
                        {item.mediaType}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-400">{item.oldDuration}</td>
                    <td className="py-3 px-2 font-mono text-white">{item.newDuration}</td>
                    <td className="py-3 px-2">
                      {isChanged ? (
                        <span className="text-green-400">UPDATED</span>
                      ) : item.newDuration === "UNKNOWN" ? (
                        <span className="text-yellow-400">FAILED</span>
                      ) : (
                        <span className="text-gray-500">--</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 mb-6">
          <h2 className="font-bold mb-2">JSON updates needed:</h2>
          <pre className="bg-black p-3 rounded text-xs overflow-auto max-h-96 text-green-400">
            {results
              .filter((result) => result.newDuration !== "UNKNOWN" && result.newDuration !== result.oldDuration)
              .map(
                (result) =>
                  `"${result.slug}": "${result.oldDuration}" -> "${result.newDuration}"  // ${result.title}`
              )
              .join("\n")}
          </pre>
        </div>

        <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
          <h2 className="font-bold mb-2">Next steps:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Copy the updates from the blue box above</li>
            <li>Update videos.json with the new durations</li>
            <li>Refresh the page to verify</li>
            <li>Delete this debug page when done</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
