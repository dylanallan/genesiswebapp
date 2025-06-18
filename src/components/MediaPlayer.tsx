import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface MediaPlayerProps {
  src: string;
  type: 'audio' | 'video';
  title?: string;
  onEnded?: () => void;
  className?: string;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  src,
  type,
  title,
  onEnded,
  className
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement>(null);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleCanPlay = () => {
      setIsLoading(false);
      setDuration(media.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(media.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };

    const handleError = (e: Event) => {
      console.error('Media error:', e);
      setError('Failed to load media. Please check the file format and try again.');
      setIsLoading(false);
      toast.error('Media playback error');
    };

    media.addEventListener('canplay', handleCanPlay);
    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('ended', handleEnded);
    media.addEventListener('error', handleError);

    return () => {
      media.removeEventListener('canplay', handleCanPlay);
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('ended', handleEnded);
      media.removeEventListener('error', handleError);
    };
  }, [onEnded]);

  const togglePlay = () => {
    if (!mediaRef.current) return;
    
    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play().catch(err => {
        console.error('Playback error:', err);
        toast.error('Playback failed. Please try again.');
      });
    }
    
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!mediaRef.current) return;
    mediaRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!mediaRef.current) return;
    const newTime = parseFloat(e.target.value);
    mediaRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>
      )}
      
      <div className="p-4">
        {isLoading && (
          <div className="flex items-center justify-center h-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 p-3 rounded-lg text-red-700 text-sm mb-4">
            {error}
          </div>
        )}
        
        {type === 'video' && (
          <div className="mb-4 rounded-lg overflow-hidden bg-black">
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={src}
              className="w-full h-auto"
              playsInline
              preload="metadata"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
        )}
        
        {type === 'audio' && (
          <audio
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={src}
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}
        
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 w-10">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, #e5e7eb ${(currentTime / (duration || 1)) * 100}%)`
              }}
            />
            <span className="text-xs text-gray-500 w-10">{formatTime(duration)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (!mediaRef.current) return;
                  mediaRef.current.currentTime = Math.max(0, mediaRef.current.currentTime - 10);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              
              <button
                onClick={togglePlay}
                className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => {
                  if (!mediaRef.current) return;
                  mediaRef.current.currentTime = Math.min(duration, mediaRef.current.currentTime + 10);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => toast.info('Settings coming soon')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};