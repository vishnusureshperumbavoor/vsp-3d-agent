import React, { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX, Play } from 'lucide-react'

export const AudioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = volume
    audio.loop = true

    // Attempt autoplay immediately
    const attemptPlay = () => {
      audio
        .play()
        .then(() => {
          setIsPlaying(true)
        })
        .catch(() => {
          // Browser autoplay restriction: play on first user interaction anywhere
          const startOnInteraction = () => {
            audio
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => {})
          }
          window.addEventListener('pointerdown', startOnInteraction, { once: true })
          window.addEventListener('keydown', startOnInteraction, { once: true })
        })
    }

    attemptPlay()
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(console.error)
    }
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    const nextMuted = !isMuted
    audio.muted = nextMuted
    setIsMuted(nextMuted)
  }

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol)
    if (audioRef.current) {
      audioRef.current.volume = newVol
      if (newVol === 0) {
        setIsMuted(true)
        audioRef.current.muted = true
      } else if (isMuted) {
        setIsMuted(false)
        audioRef.current.muted = false
      }
    }
  }

  return (
    <div className="relative flex items-center bg-slate-950/70 border border-slate-800 rounded-lg p-1 gap-1.5 shadow-sm">
      <audio ref={audioRef} src="/audio/theme.mp3" preload="auto" />

      {/* Play/Pause Button with Animated Soundwave */}
      <button
        onClick={togglePlay}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition ${
          isPlaying
            ? 'bg-gradient-to-r from-emerald-600/30 to-blue-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`}
        title={isPlaying ? 'Pause Music' : 'Play Music'}
      >
        {isPlaying ? (
          <div className="flex items-center gap-0.5 h-3 w-3 justify-center">
            <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-pulse" />
            <span
              className="w-0.5 h-2 bg-emerald-400 rounded-full animate-pulse"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="w-0.5 h-3 bg-emerald-400 rounded-full animate-pulse"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        ) : (
          <Play className="w-3 h-3 text-slate-400 fill-slate-400" />
        )}
        <span className="hidden lg:inline text-[11px] font-medium tracking-wide">
          {isPlaying ? 'Playing BGM' : 'Music Off'}
        </span>
      </button>

      {/* Volume / Mute */}
      <div
        className="relative flex items-center"
        onMouseEnter={() => setShowVolumeSlider(true)}
        onMouseLeave={() => setShowVolumeSlider(false)}
      >
        <button
          onClick={toggleMute}
          className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800/60 transition"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {/* Hover Volume Slider */}
        {showVolumeSlider && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 pt-1 z-30">
            <div className="bg-slate-900 border border-slate-700/80 rounded-lg p-2 shadow-xl flex flex-col items-center gap-1.5 w-24">
              <span className="text-[10px] text-slate-400 font-mono">
                {Math.round(volume * 100)}%
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
