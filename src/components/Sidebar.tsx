import React, { useState } from 'react'
import { ModelItem } from '../types'
import {
  Box,
  Search,
  RefreshCw,
  FolderOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  Users,
} from 'lucide-react'

interface SidebarProps {
  models: ModelItem[]
  selectedModel: ModelItem | null
  onSelectModel: (model: ModelItem) => void
  onRefresh: () => void
  isLoading: boolean
  isViewAll: boolean
  onSelectViewAll: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  models,
  selectedModel,
  onSelectModel,
  onRefresh,
  isLoading,
  isViewAll,
  onSelectViewAll,
}) => {
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState('')

  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalSizeMB = (
    models.reduce((sum, m) => sum + m.sizeBytes, 0) / (1024 * 1024)
  ).toFixed(1)

  return (
    <aside
      className={`relative z-20 flex flex-col h-full bg-slate-900/95 backdrop-blur-md border-r border-slate-800 transition-all duration-300 ${
        collapsed ? 'w-14' : 'w-80'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-100 tracking-wide">
                GLB Viewer
              </h1>
              <p className="text-[11px] text-slate-400">
                {models.length} models ({totalSizeMB} MB)
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition ml-auto"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed ? (
        <>
          {/* Search & Refresh */}
          <div className="p-3 border-b border-slate-800/80 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search models..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
              <span className="flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                public/models
              </span>
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 disabled:opacity-50 transition"
                title="Refresh models list"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                Sync
              </button>
            </div>
          </div>

          {/* Model List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {/* View All Models Action Button */}
            {models.length > 0 && (
              <button
                onClick={onSelectViewAll}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition flex items-center justify-between group mb-2 border ${
                  isViewAll
                    ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border-blue-500/60 text-blue-200 shadow-md shadow-blue-500/10'
                    : 'hover:bg-slate-800/60 text-slate-300 border-slate-800/80 bg-slate-950/40'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <Users
                    className={`w-4 h-4 shrink-0 transition ${
                      isViewAll ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="font-semibold tracking-wide">
                    View All Models
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/50 font-medium">
                    {models.length} Lineup
                  </span>
                  {isViewAll && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                </div>
              </button>
            )}

            {filteredModels.length === 0 ? (
              <div className="text-center py-12 px-4 text-slate-500 text-xs">
                {search ? (
                  'No models matched your search.'
                ) : (
                  <div>
                    <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-slate-400">No GLB files found</p>
                    <p className="text-[11px] mt-1 text-slate-500">
                      Add .glb files to public/models/
                    </p>
                  </div>
                )}
              </div>
            ) : (
              filteredModels.map((model) => {
                const isSelected = !isViewAll && selectedModel?.filename === model.filename
                return (
                  <button
                    key={model.filename}
                    onClick={() => onSelectModel(model)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition flex items-center justify-between group ${
                      isSelected
                        ? 'bg-blue-600/20 border border-blue-500/40 text-blue-200 shadow-sm shadow-blue-500/10'
                        : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <Box
                        className={`w-4 h-4 shrink-0 transition ${
                          isSelected
                            ? 'text-blue-400'
                            : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      />
                      <span className="truncate font-medium capitalize">
                        {model.name.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50 font-mono">
                        {model.sizeFormatted}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer note */}
          <div className="p-2.5 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between bg-slate-950/40">
            <span>Asset Folder: gitignored</span>
            <span className="text-emerald-400/80 flex items-center gap-1">● Ready</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center py-3 gap-3">
          <button
            onClick={onRefresh}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
            title="Sync folder"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onSelectViewAll}
            className={`p-2 rounded-lg transition ${
              isViewAll ? 'text-blue-400 bg-blue-600/20' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="View all models lineup"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  )
}
