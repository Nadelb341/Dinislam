import { useState, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  audioUrl?: string;
  title?: string;
  titleArabic?: string;
  compact?: boolean;
  onComplete?: () => void;
}

const AudioPlayer = ({ 
  audioUrl, 
  title, 
  titleArabic,
  compact = false,
  onComplete 
}: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    onComplete?.();
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!audioUrl) {
    return (
      <div className={cn(
        'flex items-center justify-center gap-2 p-3 rounded-xl bg-muted/50',
        compact ? 'h-10' : 'h-14'
      )}>
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Audio non disponible</span>
      </div>
    );
  }

  return (
    <div className={cn(
      'audio-player rounded-xl p-3',
      compact ? 'flex items-center gap-3' : 'space-y-3'
    )}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Title */}
      {!compact && (title || titleArabic) && (
        <div className="text-center">
          {titleArabic && (
            <p className="font-arabic text-lg text-gold">{titleArabic}</p>
          )}
          {title && (
            <p className="text-sm text-primary-foreground/70">{title}</p>
          )}
        </div>
      )}

      {/* Controls */}
      <div className={cn(
        'flex items-center gap-2',
        compact ? '' : 'justify-center'
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRestart}
          className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          className={cn(
            'text-primary-foreground hover:bg-primary-foreground/10',
            compact ? 'h-10 w-10' : 'h-12 w-12 bg-gold/20 hover:bg-gold/30'
          )}
        >
          {isPlaying ? (
            <Pause className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
          ) : (
            <Play className={compact ? 'h-5 w-5' : 'h-6 w-6'} fill="currentColor" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Progress */}
      <div className={cn(
        'flex items-center gap-2',
        compact ? 'flex-1' : ''
      )}>
        <span className="text-xs text-primary-foreground/70 w-10 text-right">
          {formatTime(currentTime)}
        </span>
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="flex-1"
        />
        <span className="text-xs text-primary-foreground/70 w-10">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

export default AudioPlayer;
