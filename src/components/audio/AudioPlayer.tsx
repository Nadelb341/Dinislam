import { useState, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, MoreVertical, RefreshCw, Trash2, Download, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { useUrlLisible } from '@/lib/fichiersPrives';

interface AudioPlayerProps {
  audioUrl?: string;
  title?: string;
  titleArabic?: string;
  compact?: boolean;
  onComplete?: () => void;
  /** Called with the selected File when user wants to replace audio */
  onReplace?: (file: File) => void;
  /** Called when user confirms deletion */
  onDelete?: () => void;
  /** Whether the current user can replace/delete this audio */
  canManage?: boolean;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

const AudioPlayer = ({
  audioUrl: urlEnregistree,
  title, 
  titleArabic,
  compact = false,
  onComplete,
  onReplace,
  onDelete,
  canManage = false,
}: AudioPlayerProps) => {
  // 🔒 Messages audio (espace `messages-audio`) et corrections (`recitations`, `devoirs-audios`) : joués avec un lien signé.
  // Tout autre audio (contenus publics) : adresse inchangée, tout de suite.
  const audioUrl = useUrlLisible(urlEnregistree);
  const enAttente = !!urlEnregistree && !audioUrl;
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
      audioRef.current.playbackRate = playbackRate;
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
    if (audioRef.current && audioUrl) {
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

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = title || 'audio';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReplaceClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onReplace) {
      onReplace(file);
    }
    e.target.value = '';
  };

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    onDelete?.();
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const showMenu = !!audioUrl;
  const showManageItems = canManage && (!!onReplace || !!onDelete);

  if (!urlEnregistree) {
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
    <>
      <div className={cn(
        'audio-player rounded-xl p-3 relative',
        compact ? 'flex items-center gap-3' : 'space-y-3'
      )}>
        <audio
          key={audioUrl ?? 'attente'}
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />

        {/* Hidden file input for replace */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".mp3,.wav,.ogg,.webm,.m4a,audio/*"
          onChange={handleFileSelected}
        />

        {/* 3-dot menu */}
        {showMenu && (
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {showManageItems && onReplace && (
                  <DropdownMenuItem onClick={handleReplaceClick}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Remplacer l'audio
                  </DropdownMenuItem>
                )}
                {showManageItems && onDelete && (
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer l'audio
                  </DropdownMenuItem>
                )}
                {showManageItems && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Gauge className="h-4 w-4 mr-2" />
                    Vitesse de lecture
                    {playbackRate !== 1 && (
                      <span className="ml-auto text-xs text-muted-foreground">{playbackRate}x</span>
                    )}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {PLAYBACK_RATES.map(rate => (
                      <DropdownMenuItem
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={cn(playbackRate === rate && 'bg-accent font-semibold')}
                      >
                        {rate}x
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Title */}
        {!compact && (title || titleArabic) && (
          <div className="text-center pr-8">
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
            disabled={enAttente}
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

        {/* Playback rate indicator */}
        {playbackRate !== 1 && (
          <div className="text-center">
            <span className="text-[10px] text-primary-foreground/50">Vitesse: {playbackRate}x</span>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Supprimer l'audio"
        description="Êtes-vous sûr de vouloir supprimer cet audio ? Cette action est irréversible."
      />
    </>
  );
};

export default AudioPlayer;
