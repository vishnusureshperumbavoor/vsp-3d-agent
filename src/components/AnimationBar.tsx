import React from 'react'
import { AnimationState } from '../types'
import { Play, Pause, Film } from 'lucide-react'

interface AnimationBarProps {
  animState: AnimationState
  onPlayPause: (playing: boolean) => void
  onClipChange: (index: number) => void
  onSpeedChange: (speed: number) => void
  onSeek: (time: number) => void
}

export const AnimationBar: React.FC<AnimationBarProps> = ({
  animState,
  onPlayPause,
  onClipChange,
  onSpeedChange,
  onSeek,
}) => {
  if (animState.clips.length === 0) return null

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const s = (sec % 60).toFixed(1)
    return `${mins}:${Number(s) < 10 ? '0' : ''}${s}s`
  }

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl p-3 shadow-2xl flex flex-col gap-2.5 select-none">
      <div className="flex items-center justify-between gap-3">
        {/* Play/Pause & Clip Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onPlayPause(!animState.isPlaying)}
            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow-md shadow-blue-500/20"
            title={animState.isPlaying ? 'Pause' : 'Play'}
          >
            {animState.isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white translate-x-0.5" />
            )}
          </button>

          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Film className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={animState.currentClipIndex}
              onChange={(e) => onClipChange(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {animState.clips.map((name, i) => (
                <option key={i} value={i}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800 text-[11px]">
          {[0.5, 1, 1.5, 2].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-1.5 py-0.5 rounded transition ${
                animState.speed === s
                  ? 'bg-blue-600/40 text-blue-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Scrub bar */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono text-slate-400 w-12 text-right">
          {formatSeconds(animState.time)}
        </span>
        <input
          type="range"
          min={0}
          max={animState.duration || 1}
          step={0.01}
          value={animState.time}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-[11px] font-mono text-slate-500 w-12">
          {formatSeconds(animState.duration)}
        </span>
      </div>
    </div>
  )
}
