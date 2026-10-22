import React from 'react'
import { ViewerSettings } from '../types'
import {
  RotateCcw,
  Camera,
  Grid,
  Compass,
  Repeat,
  Sun,
  Layers,
  Sparkles,
} from 'lucide-react'

interface ToolbarProps {
  settings: ViewerSettings
  onUpdateSettings: (newSettings: Partial<ViewerSettings>) => void
  onResetCamera: () => void
  onSetCameraView: (view: 'front' | 'back' | 'top' | 'left' | 'right' | 'iso') => void
  onTakeScreenshot: () => void
  showInspector: boolean
  onToggleInspector: () => void
  activeModelName?: string
}

export const Toolbar: React.FC<ToolbarProps> = ({
  settings,
  onUpdateSettings,
  onResetCamera,
  onSetCameraView,
  onTakeScreenshot,
  showInspector,
  onToggleInspector,
  activeModelName,
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 flex items-center justify-between z-10 select-none">
      {/* Current Model Title & Views */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
          <span className="text-xs font-semibold text-slate-200 capitalize truncate max-w-[180px] sm:max-w-[280px]">
            {activeModelName ? activeModelName.replace(/_/g, ' ') : 'No Model Loaded'}
          </span>
        </div>

        {/* View Presets */}
        <div className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => onSetCameraView('iso')}
            className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
            title="Isometric View"
          >
            Iso
          </button>
          <button
            onClick={() => onSetCameraView('front')}
            className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
            title="Front View"
          >
            Front
          </button>
          <button
            onClick={() => onSetCameraView('top')}
            className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
            title="Top View"
          >
            Top
          </button>
          <button
            onClick={() => onSetCameraView('right')}
            className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
            title="Right View"
          >
            Right
          </button>
        </div>
      </div>

      {/* Tools & Toggles */}
      <div className="flex items-center gap-2">
        {/* Wireframe */}
        <button
          onClick={() => onUpdateSettings({ wireframe: !settings.wireframe })}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
            settings.wireframe
              ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
              : 'text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800'
          }`}
          title="Toggle Wireframe mode"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Wireframe</span>
        </button>

        {/* Grid */}
        <button
          onClick={() => onUpdateSettings({ grid: !settings.grid })}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
            settings.grid
              ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
              : 'text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800'
          }`}
          title="Toggle Grid floor"
        >
          <Grid className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Grid</span>
        </button>

        {/* Axes */}
        <button
          onClick={() => onUpdateSettings({ axes: !settings.axes })}
          className={`p-1.5 rounded-lg border transition ${
            settings.axes
              ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
              : 'text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800'
          }`}
          title="Toggle Axes helper"
        >
          <Compass className="w-4 h-4" />
        </button>

        {/* Auto Rotate */}
        <button
          onClick={() => onUpdateSettings({ autoRotate: !settings.autoRotate })}
          className={`p-1.5 rounded-lg border transition ${
            settings.autoRotate
              ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
              : 'text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800'
          }`}
          title="Toggle Auto-Rotate turntable"
        >
          <Repeat className="w-4 h-4" />
        </button>

        {/* Shadows */}
        <button
          onClick={() => onUpdateSettings({ shadows: !settings.shadows })}
          className={`p-1.5 rounded-lg border transition ${
            settings.shadows
              ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
              : 'text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800'
          }`}
          title="Toggle Shadows"
        >
          <Sun className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-800 mx-1" />

        {/* Reset Camera */}
        <button
          onClick={onResetCamera}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg border border-slate-800 transition"
          title="Reset Camera Framing"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Snapshot */}
        <button
          onClick={onTakeScreenshot}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg border border-slate-800 transition"
          title="Download PNG snapshot"
        >
          <Camera className="w-4 h-4" />
        </button>

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
