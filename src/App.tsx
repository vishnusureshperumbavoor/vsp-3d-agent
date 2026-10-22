import { useState, useEffect, useRef } from 'react'
import {
  ModelItem,
  ViewerSettings,
  ModelStats,
  AnimationState,
  NodeTreeNode,
} from './types'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { ViewerCanvas, ViewerCanvasRef } from './components/ViewerCanvas'
import { AnimationBar } from './components/AnimationBar'
import { InspectorPanel } from './components/InspectorPanel'
import { Loader2 } from 'lucide-react'

export function App() {
  const [models, setModels] = useState<ModelItem[]>([])
  const [selectedModel, setSelectedModel] = useState<ModelItem | null>(null)
  const [isViewAll, setIsViewAll] = useState(false)
  const [isFetchingModels, setIsFetchingModels] = useState(false)

  // Loading state of 3D asset
  const [modelLoading, setModelLoading] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)

  // Inspection stats
  const [stats, setStats] = useState<ModelStats | null>(null)
  const [hierarchy, setHierarchy] = useState<NodeTreeNode[]>([])
  const [showInspector, setShowInspector] = useState(false)

  // Animation state
  const [animState, setAnimState] = useState<AnimationState>({
    clips: [],
    currentClipIndex: 0,
    isPlaying: true,
    speed: 1,
    time: 0,
    duration: 0,
  })

  // Settings
  const [settings, setSettings] = useState<ViewerSettings>({
    autoRotate: false,
    autoRotateSpeed: 2.5,
    exposure: 1.0,
    backgroundColor: 'dark',
  })

  const viewerRef = useRef<ViewerCanvasRef>(null)

  // Fetch model list
  const fetchModels = async () => {
    setIsFetchingModels(true)
    try {
      const res = await fetch('/api/models')
      if (res.ok) {
        const data: ModelItem[] = await res.json()
        setModels(data)
        if (data.length > 0 && !selectedModel) {
          setSelectedModel(data[0])
        }
      } else {
        const fallbackRes = await fetch('/models.json')
        if (fallbackRes.ok) {
          const data: ModelItem[] = await fallbackRes.json()
          setModels(data)
          if (data.length > 0 && !selectedModel) {
            setSelectedModel(data[0])
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch /api/models, trying fallback /models.json', err)
      try {
        const fallbackRes = await fetch('/models.json')
        if (fallbackRes.ok) {
          const data: ModelItem[] = await fallbackRes.json()
          setModels(data)
          if (data.length > 0 && !selectedModel) {
            setSelectedModel(data[0])
          }
        }
      } catch (e) {
        console.error('Error fetching fallback models list:', e)
      }
    } finally {
      setIsFetchingModels(false)
    }
  }

  useEffect(() => {
    fetchModels()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault()
          if (animState.clips.length > 0) {
            viewerRef.current?.setAnimationPlay(!animState.isPlaying)
          }
          break
        case 'r':
          viewerRef.current?.resetCamera()
          break
        case 'i':
          setShowInspector((prev) => !prev)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [animState.clips.length, animState.isPlaying])

  const updateSettings = (partial: Partial<ViewerSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }))
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar
        models={models}
        selectedModel={selectedModel}
        isViewAll={isViewAll}
        onSelectModel={(m) => {
          setIsViewAll(false)
          setSelectedModel(m)
        }}
        onSelectViewAll={() => {
          setIsViewAll(true)
        }}
        onRefresh={fetchModels}
        isLoading={isFetchingModels}
      />

      {/* Main Viewport Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Top Toolbar */}
        <Toolbar
          settings={settings}
          onUpdateSettings={updateSettings}
          onResetCamera={() => viewerRef.current?.resetCamera()}
          onSetCameraView={(view) => viewerRef.current?.setCameraView(view)}
          showInspector={showInspector}
          onToggleInspector={() => setShowInspector(!showInspector)}
          activeModelName={selectedModel?.name}
          isViewAll={isViewAll}
          totalModelsCount={models.length}
        />

        {/* 3D Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <ViewerCanvas
            ref={viewerRef}
            models={models}
            selectedModel={selectedModel}
            isViewAll={isViewAll}
            settings={settings}
            onStatsLoaded={(st) => setStats(st)}
            onHierarchyLoaded={(tree) => setHierarchy(tree)}
            onAnimationStateChange={(ast) => setAnimState(ast)}
            onLoadingProgress={(pct, loading) => {
              setLoadProgress(pct)
              setModelLoading(loading)
            }}
          />

          {/* Model Loading Overlay */}
          {modelLoading && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3 select-none">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-xs font-semibold text-slate-200">
                  {isViewAll
                    ? `Loading all ${models.length} models lineup...`
                    : `Loading ${selectedModel?.name.replace(/_/g, ' ')}...`}
                </p>
                <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                  <div
                    className="h-full bg-blue-500 transition-all duration-150"
                    style={{ width: `${loadProgress}%` }}
                  />
                </div>
                <p className="text-[11px] font-mono text-slate-400">{loadProgress}%</p>
              </div>
            </div>
          )}

          {/* Bottom Animation Controls */}
          <AnimationBar
            animState={animState}
            onPlayPause={(playing) => viewerRef.current?.setAnimationPlay(playing)}
            onClipChange={(idx) => viewerRef.current?.setAnimationClip(idx)}
            onSpeedChange={(speed) => viewerRef.current?.setAnimationSpeed(speed)}
            onSeek={(t) => viewerRef.current?.seekAnimation(t)}
          />

          {/* Right Inspector Panel */}
          {showInspector && (
            <InspectorPanel
              stats={stats}
              settings={settings}
              hierarchy={hierarchy}
              onUpdateSettings={updateSettings}
              onToggleNodeVisibility={(id, vis) =>
                viewerRef.current?.toggleNodeVisibility(id, vis)
              }
              onClose={() => setShowInspector(false)}
            />
          )}

          {/* Controls Quick Hints */}
          <div className="absolute bottom-3 left-4 z-10 hidden lg:flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/60 backdrop-blur px-2.5 py-1 rounded-md border border-slate-800 pointer-events-none select-none">
            <span>Left-click: Orbit</span>
            <span>•</span>
            <span>Right-click: Pan</span>
            <span>•</span>
            <span>Scroll: Zoom</span>
            <span>•</span>
            <span className="font-mono text-slate-300">Space</span>: Play/Pause
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
