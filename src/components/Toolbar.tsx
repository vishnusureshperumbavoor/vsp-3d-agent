import React from 'react'
import { ViewerSettings } from '../types'
import {
  RotateCcw,
  Repeat,
  Sparkles,
  Users,
  Box,
} from 'lucide-react'

interface ToolbarProps {
  settings: ViewerSettings
  onUpdateSettings: (newSettings: Partial<ViewerSettings>) => void
  onResetCamera: () => void
  onSetCameraView: (view: 'front' | 'back' | 'top' | 'left' | 'right' | 'iso') => void
  showInspector: boolean
  onToggleInspector: () => void
  activeModelName?: string
  isViewAll?: boolean
  totalModelsCount?: number
}

export const Toolbar: React.FC<ToolbarProps> = ({
  settings,
  onUpdateSettings,
  onResetCamera,
  onSetCameraView,
  showInspector,
  onToggleInspector,
  activeModelName,
  isViewAll,
  totalModelsCount,
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 flex items-center justify-between z-10 select-none">
      {/* Current Model Title & Views */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
          {isViewAll ? (
            <div className="flex items-center gap-1.5 text-blue-400">
              <Users className="w-4 h-4" />
              <span className="text-xs font-semibold text-slate-100">
                All Models Lineup ({totalModelsCount})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-300">
              <Box className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-slate-200 capitalize truncate max-w-[180px] sm:max-w-[280px]">
                {activeModelName ? activeModelName.replace(/_/g, ' ') : 'No Model Loaded'}
              </span>
            </div>
          )}
        </div>

        {/* View Presets */}
        <div className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => onSetCameraView('iso')}
            className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
            title="Isometric View"
          >
            Iso
          </button>
          <button
            onClick={() => onSetCameraView('front')}
            className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
            title="Front View"
          >
            Front
          </button>
          <button
            onClick={() => onSetCameraView('top')}
            className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
            title="Top View"
          >
            Top
          </button>
          <button
            onClick={() => onSetCameraView('right')}
            className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
            title="Right View"
          >
            Right
          </button>
        </div>
      </div>

      {/* Tools & Actions */}
      <div className="flex items-center gap-2">
        {/* Auto Rotate Turntable */}
        <button
          onClick={() => onUpdateSettings({ autoRotate: !settings.autoRotate })}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
            settings.autoRotate
              ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
              : 'text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800'
          }`}
          title="Toggle Turntable Rotation"
        >
          <Repeat className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Rotate</span>
        </button>

        {/* Reset Camera */}
        <button
          onClick={onResetCamera}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-lg border border-slate-800 text-xs font-medium transition"
          title="Reset Camera Framing"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <div className="h-5 w-px bg-slate-800 mx-1" />

        {/* Inspector Panel Toggle */}
        <button
          onClick={onToggleInspector}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
            showInspector
              ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/20'
              : 'text-slate-300 hover:text-white border-slate-800 hover:bg-slate-800'
          }`}
          title="Toggle Model Info / Inspector"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Inspector</span>
        </button>
      </div>
    </header>
  )
}
