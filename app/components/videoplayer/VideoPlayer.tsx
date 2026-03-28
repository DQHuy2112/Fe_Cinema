'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { apiUrl } from '@/app/lib/api';

interface VideoPlayerProps {
  url: string;
  poster?: string;
  autoPlay?: boolean;
  title?: string;
}

type VideoType = 'direct' | 'youtube' | 'google_drive' | 'iframe' | 'unknown';

function detectVideoType(url: string): VideoType {
  if (!url) return 'unknown';
  const lower = url.toLowerCase();

  if (lower.includes('youtube.com/embed') || lower.includes('youtu.be/')) return 'youtube';
  if (lower.includes('drive.google.com') || lower.includes('docs.google.com')) return 'google_drive';
  if (lower.includes('.mp4') || lower.includes('.webm') || lower.includes('.m3u8') || lower.includes('.mov')) return 'direct';
  if (lower.startsWith('http') && !lower.includes('embed')) {
    if (/\.(mp4|webm|mov|m3u8|ogg)(\?|$)/.test(url)) return 'direct';
  }
  if (url.startsWith('<iframe') || url.startsWith('<object')) return 'iframe';
  if (url.startsWith('http')) return 'iframe';
  return 'unknown';
}

/** URL từ 2embed/vidsrc - qua proxy wrapper để phát trong iframe */
function isExternalEmbedUrl(url: string): boolean {
  if (!url || !url.startsWith('http')) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('2embed.cc') ||
    lower.includes('vidsrc.') ||
    lower.includes('2embed.to') ||
    lower.includes('multiembed')
  );
}

/** Chuyển 2embed URL sang vidsrc nếu có IMDB ID - vidsrc thường phát ổn hơn */
function tryConvertToVidsrc(url: string): string {
  const m = url.match(/2embed\.(cc|to)\/embed\/(tt\d+)/i);
  if (m) return `https://vidsrc.xyz/embed/movie/${m[2]}`;
  return url;
}

function getYouTubeEmbedUrl(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0&modestbranding=1`;
  if (url.includes('youtube.com/embed/')) {
    const id = url.match(/youtube\.com\/embed\/([^?]+)/)?.[1];
    if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
  }
  return url;
}

function getGoogleDriveEmbedUrl(url: string): string {
  const match = url.match(/\/file\/d\/([^/]+)/);
  if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  if (url.includes('preview')) return url;
  if (url.includes('drive.google.com')) return url;
  return url;
}

export default function VideoPlayer({ url, poster, autoPlay = false, title }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const videoType = detectVideoType(url);
  const useProxy = isExternalEmbedUrl(url);
  const embedUrl = useProxy ? tryConvertToVidsrc(url) : url;

  useEffect(() => {
    if (url) setHasError(false);
  }, [url]);

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, []);

  useEffect(() => {
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    } else {
      setShowControls(true);
    }
  }, [isPlaying]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) setCurrentTime(video.currentTime);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
      setIsLoading(false);
    }
  };

  const handleCanPlay = () => setIsLoading(false);
  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };
  const handleWaiting = () => setIsLoading(true);
  const handlePlaying = () => { setIsPlaying(true); setIsLoading(false); };
  const handlePause = () => setIsPlaying(false);
  const handleEnded = () => setIsPlaying(false);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    video.currentTime = ratio * duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    setIsMuted(v === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.volume = volume || 1;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen not supported
    }
  };

  const skipSeconds = (secs: number) => {
    const video = videoRef.current;
    if (video) video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + secs));
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case ' ': e.preventDefault(); togglePlay(); break;
      case 'ArrowRight': skipSeconds(10); break;
      case 'ArrowLeft': skipSeconds(-10); break;
      case 'ArrowUp': if (videoRef.current) videoRef.current.volume = Math.min(1, videoRef.current.volume + 0.1); break;
      case 'ArrowDown': if (videoRef.current) videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.1); break;
      case 'f': toggleFullscreen(); break;
      case 'm': toggleMute(); break;
    }
  }, [isPlaying, isMuted, volume]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!isClient) return null;

  const renderPlayer = () => {
    if (!url || hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black p-4">
          <svg className="w-20 h-20 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.893L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
          <p className="text-gray-500 text-sm text-center">
            {hasError ? 'Không thể phát video. Vui lòng kiểm tra URL video.' : 'Chưa có video. Vui lòng thêm video URL.'}
          </p>
          <p className="text-gray-600 text-xs mt-1">Hỗ trợ: MP4, YouTube, Google Drive, 2embed, iframe</p>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors">
              Mở video trong tab mới
            </a>
          )}
        </div>
      );
    }

    // YouTube / Google Drive / iframe
    if (videoType === 'youtube' || videoType === 'google_drive' || videoType === 'iframe') {
      let embedSrc = videoType === 'youtube' ? getYouTubeEmbedUrl(url) : videoType === 'google_drive' ? getGoogleDriveEmbedUrl(url) : embedUrl;
      if (useProxy) {
        embedSrc = apiUrl(`/embed-proxy?url=${encodeURIComponent(embedSrc)}`);
      }

      return (
        <iframe
          key={embedSrc}
          src={embedSrc}
          className="w-full h-full min-h-[400px]"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="no-referrer"
          title={title || 'Video player'}
          onError={() => setHasError(true)}
        />
      );
    }

    // Direct video file
    return (
      <>
        <video
          ref={videoRef}
          src={url}
          poster={poster}
          className="w-full h-full object-contain bg-black"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onError={handleError}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onPause={handlePause}
          onEnded={handleEnded}
          playsInline
        />

        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}

        {/* Big play button overlay when paused */}
        {!isPlaying && !isLoading && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer group"
          >
            <div className="w-20 h-20 rounded-full bg-red-600 bg-opacity-90 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        )}

        {/* Controls bar */}
        <div
          className={`absolute bottom-0 left-0 right-0 px-3 pb-2 pt-8 bg-gradient-to-t from-black via-black/60 to-transparent transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
          onMouseMove={resetHideTimer}
        >
          {/* Progress bar */}
          <div
            className="h-1 bg-white bg-opacity-30 rounded-full mb-2 cursor-pointer group relative"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-red-600 rounded-full relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="text-white hover:text-red-400 transition-colors p-1">
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Skip back 10s */}
            <button onClick={() => skipSeconds(-10)} className="text-white hover:text-red-400 transition-colors p-1" title="Quay lại 10s">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.5 3C17.15 3 21.08 6.03 22.47 10.22L20.1 11c-1.06-3.18-4.05-5.5-7.6-5.5-1.95 0-3.73.72-5.12 1.88L10 10H3V3l2.6 2.6C7.45 4 9.85 3 12.5 3zm-.56 8.62l.88.52.88-.52V18c0 .55-.45 1-1 1H5.5a1 1 0 01-1-1v-3.5a1 1 0 011-1h6.44z" />
              </svg>
            </button>

            {/* Skip forward 10s */}
            <button onClick={() => skipSeconds(10)} className="text-white hover:text-red-400 transition-colors p-1" title="Tua 10s">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.5 3c-2.65 0-5.05 1-6.9 2.6L2 3v7h7L6.38 7.38C7.77 6.22 9.55 5.5 11.5 5.5c1.63 0 3.07.53 4.22 1.35L13 10h7V3l-2.62 2.62C16.07 4.53 13.85 3 11.5 3zm.5 9H5.5a.5.5 0 00-.5.5v3.5c0 .28.22.5.5.5H12v-4.5zm2 4.5v-4.5H20v3.38a8.3 8.3 0 01-6 1.12z" />
              </svg>
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1 relative group/vol">
              <button onClick={toggleMute} className="text-white hover:text-red-400 transition-colors p-1">
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 12A4.5 4.5 0 0014 9v3l2.62 2.62c.34.34.53.8.53 1.28A5.5 5.5 0 0112 19.5a5.5 5.5 0 01-4.5-2.23V15.5L4.87 13A8.1 8.1 0 003 12a8.1 8.1 0 001.87 5.12L7.5 13.5A5.6 5.6 0 016 12a5.6 5.6 0 011.5-3.78L12 3.62V9a4.5 4.5 0 004.5 4.5c.91 0 1.74-.27 2.44-.75L19.5 13.5a2.5 2.5 0 00-3-1.5z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 9v3l2.62 2.62c.34.34.53.8.53 1.28A4.5 4.5 0 0012 20.5a4.5 4.5 0 003.75-1.97L19 15.5V9a4.5 4.5 0 00-2.5-3.97z" />
                  </svg>
                )}
              </button>
              <div className="w-0 group-hover/vol:w-20 transition-all overflow-hidden">
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 accent-red-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Time */}
            <span className="text-white text-xs ml-1 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white hover:text-red-400 transition-colors p-1" title="Toàn màn hình (F)">
              {!isFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black overflow-hidden select-none group"
      style={{ maxHeight: isFullscreen ? '100vh' : 'none' }}
    >
      {renderPlayer()}
    </div>
  );
}
