import React, { useState } from 'react'
import { ModelStats, ViewerSettings, NodeTreeNode } from '../types'
import {
  X,
  Info,
  Maximize2,
  Box,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Triangle,
  CircleDot,
  Palette,
} from 'lucide-react'

interface InspectorPanelProps {
  stats: ModelStats | null
  settings: ViewerSettings
  hierarchy: NodeTreeNode[]
  onUpdateSettings: (newSettings: Partial<ViewerSettings>) => void
  onToggleNodeVisibility: (nodeId: string, visible: boolean) => void
  onClose: () => void
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  stats,
  settings,
  hierarchy,
  onUpdateSettings,
  onToggleNodeVisibility,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'hierarchy' | 'render'>('stats')

  return (
    <aside className="absolute right-0 top-14 bottom-0 w-80 bg-slate-900/95 backdrop-blur-md border-l border-slate-800 z-20 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-slate-800">
        <span className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-blue-400" />
          Model Inspector
        </span>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs bg-slate-950/40">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-2 text-center font-medium transition border-b-2 ${
            activeTab === 'stats'
              ? 'text-blue-400 border-blue-500 bg-slate-900/60'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Statistics
        </button>
        <button
          onClick={() => setActiveTab('render')}
          className={`flex-1 py-2 text-center font-medium transition border-b-2 ${
            activeTab === 'render'
              ? 'text-blue-400 border-blue-500 bg-slate-900/60'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Lighting
        </button>
        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`flex-1 py-2 text-center font-medium transition border-b-2 ${
            activeTab === 'hierarchy'
              ? 'text-blue-400 border-blue-500 bg-slate-900/60'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Hierarchy
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {activeTab === 'stats' && (
          <>
            {stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Triangle className="w-3.5 h-3.5 text-blue-400" />
                      <span>Triangles</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-100">
                      {stats.triangles.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <CircleDot className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Vertices</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-100">
                      {stats.vertices.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Box className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Meshes</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-100">{stats.meshes}</div>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Palette className="w-3.5 h-3.5 text-pink-400" />
                      <span>Materials</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-100">
                      {stats.materials}
                    </div>
                  </div>
                </div>

                {/* Bounding Box Dimensions */}
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Dimensions (Units)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-500">Width (X)</div>
                      <div className="font-mono text-slate-200 mt-0.5">
                        {stats.dimensions.width}
                      </div>
                    </div>
                    <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-500">Height (Y)</div>
                      <div className="font-mono text-slate-200 mt-0.5">
                        {stats.dimensions.height}
                      </div>
                    </div>
                    <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-500">Depth (Z)</div>
                      <div className="font-mono text-slate-200 mt-0.5">
                        {stats.dimensions.depth}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Animations count */}
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Embedded Animations</span>
                  <span className="font-semibold text-blue-400">
                    {stats.animationsCount}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">Select a model to view stats</p>
            )}
          </>
        )}

        {activeTab === 'render' && (
          <div className="space-y-4">
            {/* Exposure */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Exposure</span>
                <span className="font-mono text-slate-400">{settings.exposure.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={3.0}
                step={0.1}
                value={settings.exposure}
                onChange={(e) => onUpdateSettings({ exposure: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Auto Rotate Speed */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Auto-Rotate Speed</span>
                <span className="font-mono text-slate-400">
                  {settings.autoRotateSpeed.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={5.0}
                step={0.5}
                value={settings.autoRotateSpeed}
                onChange={(e) =>
                  onUpdateSettings({ autoRotateSpeed: parseFloat(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Background Style */}
            <div className="space-y-1.5 pt-2">
              <label className="text-slate-300 block">Background Canvas</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'dark', label: 'Dark Void' },
                  { id: 'gradient', label: 'Studio Slate' },
                  { id: 'pure', label: 'Deep Blue' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => onUpdateSettings({ backgroundColor: bg.id })}
                    className={`py-1.5 px-2 rounded border text-[11px] transition ${
                      settings.backgroundColor === bg.id
                        ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hierarchy' && (
          <div className="space-y-1 overflow-x-hidden">
            {hierarchy.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No hierarchy data</p>
            ) : (
              hierarchy.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  onToggleNodeVisibility={onToggleNodeVisibility}
                />
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

const TreeNode: React.FC<{
  node: NodeTreeNode
  onToggleNodeVisibility: (nodeId: string, visible: boolean) => void
}> = ({ node, onToggleNodeVisibility }) => {
  const [expanded, setExpanded] = useState(true)
  const [visible, setVisible] = useState(node.visible)

  const toggleVis = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = !visible
    setVisible(next)
    onToggleNodeVisibility(node.id, next)
  }

  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="text-[11px]">
      <div className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-slate-800/60 group cursor-pointer text-slate-300">
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 text-slate-500 hover:text-slate-300"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : (
          <span className="w-4" />
        )}

        <span className="truncate flex-1 font-mono">{node.name}</span>

        <span className="text-[9px] text-slate-500 bg-slate-800/80 px-1 rounded">
          {node.type}
        </span>

        <button
          onClick={toggleVis}
          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-200 transition"
        >
          {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-red-400" />}
        </button>
      </div>

      {hasChildren && expanded && (
        <div className="pl-3 border-l border-slate-800 ml-2 space-y-0.5 mt-0.5">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onToggleNodeVisibility={onToggleNodeVisibility}
            />
          ))}
        </div>
      )}
    </div>
  )
}
