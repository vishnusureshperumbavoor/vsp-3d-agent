export interface ModelItem {
  name: string
  filename: string
  url: string
  sizeBytes: number
  sizeFormatted: string
  updatedAt: number
}

export interface ModelStats {
  triangles: number
  vertices: number
  meshes: number
  materials: number
  animationsCount: number
  dimensions: {
    width: number
    height: number
    depth: number
  }
}

export interface ViewerSettings {
  autoRotate: boolean
  autoRotateSpeed: number
  exposure: number
  backgroundColor: string
}

export interface AnimationState {
  clips: string[]
  currentClipIndex: number
  isPlaying: boolean
  speed: number
  time: number
  duration: number
}

export interface NodeTreeNode {
  id: string
  name: string
  type: string
  children?: NodeTreeNode[]
  visible: boolean
}
