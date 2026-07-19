"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const DEMO_VIDEO_URL =
  "https://res.cloudinary.com/dkqbzwicr/video/upload/v1784432840/claimsenseaivideo_vlfwnt.webm";

function fmt(s: number) {
  if (!isFinite(s) || isNaN(s)) return "00:00";
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export default function WatchDemoPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const v = videoRef.current;
    if (v && v.duration && !isNaN(v.duration)) setDuration(v.duration);
  }, []);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [resetHideTimer]);

  const handlePlayPause = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const skip = (sec: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.currentTime + sec, v.duration || 0));
  };

  const handleLoaded = () => {
    const v = videoRef.current;
    if (v && !isNaN(v.duration)) setDuration(v.duration);
  };

  const seekTo = (clientX: number) => {
    const el = trackRef.current;
    const v = videoRef.current;
    if (!el || !v || !v.duration) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    v.currentTime = pct * v.duration;
    setCurrentTime(v.currentTime);
  };

  const handleTrackMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    seekTo(e.clientX);
    const onMove = (me: MouseEvent) => {
      if (isDragging.current) seekTo(me.clientX);
    };
    const onUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const vol = Number(e.target.value);
    v.volume = vol;
    setVolume(vol);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <style>{`
        .wd-root {
          position: fixed;
          inset: 0;
          background: #05100c;
          overflow: hidden;
          z-index: 50;
        }

        .wd-video {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          z-index: 1;
          cursor: pointer;
        }

        .wd-badge {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 18px 7px 10px;
          border-radius: 100px;
          border: 1px solid rgba(16, 185, 129, 0.3);
          background: rgba(6, 20, 17, 0.6);
          backdrop-filter: blur(12px);
          z-index: 20;
          transition: opacity 0.4s;
        }

        .wd-badge-text {
          display: flex;
          flex-direction: column;
          line-height: 1.05;
        }

        .wd-close {
          position: fixed;
          top: 24px;
          right: 28px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(6, 20, 17, 0.6);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.8);
          font-size: 20px;
          z-index: 20;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .wd-close:hover {
          border-color: #0ea77a;
          color: #6ee7b7;
          background: rgba(14, 167, 122, 0.14);
        }

        .wd-center {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          pointer-events: none;
          transition: opacity 0.3s;
        }
        .wd-center.hidden {
          opacity: 0;
        }
        .wd-center-btn {
          width: 84px;
          height: 84px;
          border-radius: 50%;
          border: 2px solid rgba(14, 167, 122, 0.55);
          background: rgba(6, 20, 17, 0.65);
          backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4ade80;
          pointer-events: all;
          cursor: pointer;
          box-shadow: 0 0 32px rgba(14, 167, 122, 0.2);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .wd-center-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 0 48px rgba(14, 167, 122, 0.4);
        }

        .wd-controls {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px 28px 28px;
          background: linear-gradient(to top, rgba(6, 20, 17, 0.92) 0%, transparent 100%);
          backdrop-filter: blur(4px);
          z-index: 15;
          transition: opacity 0.4s, transform 0.4s;
        }
        .wd-controls.hidden {
          opacity: 0;
          transform: translateY(16px);
          pointer-events: none;
        }

        .wd-scrubber {
          position: relative;
          height: 20px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          cursor: pointer;
        }
        .wd-track {
          position: absolute;
          left: 0;
          right: 0;
          height: 4px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.12);
          transition: background 0.15s;
        }
        .wd-fill {
          position: absolute;
          left: 0;
          height: 4px;
          border-radius: 4px;
          background: linear-gradient(90deg, #0ea77a, #0ab6c4);
          pointer-events: none;
        }
        .wd-thumb {
          position: absolute;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 8px rgba(14, 167, 122, 0.6);
          transform: translateX(-50%) scale(0);
          transition: transform 0.15s;
          pointer-events: none;
          top: 50%;
          margin-top: -7px;
        }
        .wd-scrubber:hover .wd-thumb {
          transform: translateX(-50%) scale(1);
        }
        .wd-scrubber:hover .wd-track {
          background: rgba(255, 255, 255, 0.22);
        }

        .wd-btn-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .wd-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.82);
          cursor: pointer;
          flex-shrink: 0;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .wd-btn:hover {
          border-color: #0ea77a;
          color: #6ee7b7;
          background: rgba(14, 167, 122, 0.12);
        }
        .wd-btn.play-main {
          width: 44px;
          height: 44px;
          border-color: rgba(14, 167, 122, 0.45);
          color: #4ade80;
        }
        .wd-btn.play-main:hover {
          background: rgba(14, 167, 122, 0.2);
          box-shadow: 0 0 20px rgba(14, 167, 122, 0.28);
        }

        .wd-time {
          font-size: 12px;
          letter-spacing: 0.04em;
          color: rgba(255, 255, 255, 0.5);
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
        .wd-time span {
          color: rgba(255, 255, 255, 0.85);
        }
        .wd-spacer {
          flex: 1;
        }

        .wd-vol {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .wd-vol-icon {
          color: rgba(255, 255, 255, 0.5);
          flex-shrink: 0;
        }
        .wd-vol-slider {
          -webkit-appearance: none;
          width: 72px;
          height: 3px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.16);
          outline: none;
          cursor: pointer;
        }
        .wd-vol-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #0ea77a;
          cursor: pointer;
        }
        .wd-vol-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #0ea77a;
          border: none;
          cursor: pointer;
        }
      `}</style>

      <div className="wd-root" onMouseMove={resetHideTimer} onClick={resetHideTimer}>
        <video
          ref={videoRef}
          className="wd-video"
          src={DEMO_VIDEO_URL}
          preload="auto"
          playsInline
          onTimeUpdate={() => {
            const v = videoRef.current;
            if (v) setCurrentTime(v.currentTime);
          }}
          onLoadedMetadata={handleLoaded}
          onDurationChange={handleLoaded}
          onEnded={() => setIsPlaying(false)}
          onClick={handlePlayPause}
        />

        <div className="wd-badge" style={{ opacity: showControls ? 1 : 0 }}>
          <Image
            src="https://res.cloudinary.com/dkqbzwicr/image/upload/v1783856501/logoclaimsense_xjcpqe.png"
            alt="ClaimSense AI"
            width={26}
            height={26}
            className="object-contain drop-shadow-[0_4px_10px_rgba(16,185,129,.4)]"
          />
          <span className="wd-badge-text">
            <span className="font-heading text-[13.5px] font-bold tracking-tight text-white">
              ClaimSense{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                AI
              </span>
            </span>
            <span className="text-[9.5px] tracking-[0.14em] text-emerald-100/70 uppercase">
              Live Demo
            </span>
          </span>
        </div>

        <button
          type="button"
          className="wd-close"
          style={{ opacity: showControls ? 1 : 0 }}
          onClick={() => router.push("/")}
          aria-label="Close"
        >
          ✕
        </button>

        <div className={`wd-center${isPlaying ? " hidden" : ""}`}>
          <button className="wd-center-btn" onClick={handlePlayPause} aria-label="Play">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </button>
        </div>

        {mounted && (
          <div className={`wd-controls${!showControls ? " hidden" : ""}`}>
            <div ref={trackRef} className="wd-scrubber" onMouseDown={handleTrackMouseDown}>
              <div className="wd-track" />
              <div className="wd-fill" style={{ width: `${progress}%` }} />
              <div className="wd-thumb" style={{ left: `${progress}%` }} />
            </div>

            <div className="wd-btn-row">
              <button className="wd-btn" onClick={() => skip(-10)} aria-label="Rewind 10 seconds">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M1 4v6h6" />
                  <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
                  <text x="9" y="15" fontSize="7" fill="currentColor" stroke="none" fontWeight="600">
                    10
                  </text>
                </svg>
              </button>

              <button
                className="wd-btn play-main"
                onClick={handlePlayPause}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                )}
              </button>

              <button className="wd-btn" onClick={handleStop} aria-label="Stop">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
              </button>

              <button className="wd-btn" onClick={() => skip(10)} aria-label="Forward 10 seconds">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M23 4v6h-6" />
                  <path d="M20.49 15a9 9 0 1 1-.49-4.5" />
                  <text x="9" y="15" fontSize="7" fill="currentColor" stroke="none" fontWeight="600">
                    10
                  </text>
                </svg>
              </button>

              <div className="wd-time">
                <span>{fmt(currentTime)}</span> / {fmt(duration)}
              </div>

              <div className="wd-spacer" />

              <div className="wd-vol">
                <svg
                  className="wd-vol-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
                  {volume > 0 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
                  {volume > 0.5 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
                </svg>
                <input
                  type="range"
                  className="wd-vol-slider"
                  min={0}
                  max={1}
                  step={0.02}
                  value={volume}
                  onChange={handleVolume}
                  aria-label="Volume"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
