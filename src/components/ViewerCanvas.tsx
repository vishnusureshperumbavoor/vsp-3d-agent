import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { ModelStats, ViewerSettings, AnimationState, NodeTreeNode } from '../types'

export interface ViewerCanvasRef {
  resetCamera: () => void
  setCameraView: (view: 'front' | 'back' | 'top' | 'left' | 'right' | 'iso') => void
  takeScreenshot: (filename?: string) => void
  setAnimationPlay: (playing: boolean) => void
  setAnimationClip: (index: number) => void
  setAnimationSpeed: (speed: number) => void
  seekAnimation: (time: number) => void
  toggleNodeVisibility: (nodeId: string, visible: boolean) => void
}

interface ViewerCanvasProps {
  modelUrl: string | null
  settings: ViewerSettings
  onStatsLoaded?: (stats: ModelStats) => void
  onHierarchyLoaded?: (tree: NodeTreeNode[]) => void
  onAnimationStateChange?: (state: AnimationState) => void
  onLoadingProgress?: (progress: number, loading: boolean) => void
}

export const ViewerCanvas = forwardRef<ViewerCanvasRef, ViewerCanvasProps>(
  (
    {
      modelUrl,
      settings,
      onStatsLoaded,
      onHierarchyLoaded,
      onAnimationStateChange,
      onLoadingProgress,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const controlsRef = useRef<OrbitControls | null>(null)
    const modelGroupRef = useRef<THREE.Group | null>(null)
    const mixerRef = useRef<THREE.AnimationMixer | null>(null)
    const currentActionRef = useRef<THREE.AnimationAction | null>(null)
    const clipsRef = useRef<THREE.AnimationClip[]>([])
    const gridRef = useRef<THREE.GridHelper | null>(null)
    const axesRef = useRef<THREE.AxesHelper | null>(null)
    const dirLightRef = useRef<THREE.DirectionalLight | null>(null)

    const [animState, setAnimState] = useState<AnimationState>({
      clips: [],
      currentClipIndex: 0,
      isPlaying: true,
      speed: 1,
      time: 0,
      duration: 0,
    })

    const initialCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 2, 5))
    const initialControlsTarget = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0))
    const modelSizeRef = useRef<number>(2)

    // Build hierarchy tree for the inspector
    const buildHierarchy = (object: THREE.Object3D): NodeTreeNode => {
      const node: NodeTreeNode = {
        id: object.uuid,
        name: object.name || `${object.type} (${object.id})`,
        type: object.type,
        visible: object.visible,
      }
      if (object.children && object.children.length > 0) {
        node.children = object.children.map((child) => buildHierarchy(child))
      }
      return node
    }

    // Forward ref methods
    useImperativeHandle(ref, () => ({
      resetCamera: () => {
        if (!cameraRef.current || !controlsRef.current) return
        cameraRef.current.position.copy(initialCameraPos.current)
        controlsRef.current.target.copy(initialControlsTarget.current)
        controlsRef.current.update()
      },
      setCameraView: (view) => {
        if (!cameraRef.current || !controlsRef.current) return
        const target = initialControlsTarget.current
        const dist = modelSizeRef.current * 1.8 || 4

        switch (view) {
          case 'front':
            cameraRef.current.position.set(target.x, target.y, target.z + dist)
            break
          case 'back':
            cameraRef.current.position.set(target.x, target.y, target.z - dist)
            break
          case 'top':
            cameraRef.current.position.set(target.x, target.y + dist, target.z + 0.0001)
            break
          case 'left':
            cameraRef.current.position.set(target.x - dist, target.y, target.z)
            break
          case 'right':
            cameraRef.current.position.set(target.x + dist, target.y, target.z)
            break
          case 'iso':
            cameraRef.current.position.set(
              target.x + dist * 0.7,
              target.y + dist * 0.7,
              target.z + dist * 0.7
            )
            break
        }
        controlsRef.current.target.copy(target)
        controlsRef.current.update()
      },
      takeScreenshot: (filename = 'model-snapshot.png') => {
        if (!rendererRef.current) return
        const renderer = rendererRef.current
        const strDownloadMime = 'image/octet-stream'
        const imgData = renderer.domElement.toDataURL('image/png')
        const strData = imgData.replace(/^data:image\/[^;]*/, strDownloadMime)
        const link = document.createElement('a')
        link.download = filename
        link.href = strData
        link.click()
      },
      setAnimationPlay: (playing: boolean) => {
        if (currentActionRef.current) {
          currentActionRef.current.paused = !playing
        }
        setAnimState((prev) => {
          const next = { ...prev, isPlaying: playing }
          onAnimationStateChange?.(next)
          return next
        })
      },
      setAnimationClip: (clipIndex: number) => {
        if (!mixerRef.current || !clipsRef.current[clipIndex]) return
        if (currentActionRef.current) {
          currentActionRef.current.stop()
        }
        const clip = clipsRef.current[clipIndex]
        const action = mixerRef.current.clipAction(clip)
        action.reset().play()
        action.timeScale = animState.speed
        currentActionRef.current = action

        setAnimState((prev) => {
          const next = {
            ...prev,
            currentClipIndex: clipIndex,
            time: 0,
            duration: clip.duration,
            isPlaying: true,
          }
          onAnimationStateChange?.(next)
          return next
        })
      },
      setAnimationSpeed: (speed: number) => {
        if (currentActionRef.current) {
          currentActionRef.current.timeScale = speed
        }
        setAnimState((prev) => {
          const next = { ...prev, speed }
          onAnimationStateChange?.(next)
          return next
        })
      },
      seekAnimation: (time: number) => {
        if (currentActionRef.current && mixerRef.current) {
          currentActionRef.current.time = time
          mixerRef.current.update(0)
          setAnimState((prev) => {
            const next = { ...prev, time }
            onAnimationStateChange?.(next)
            return next
          })
        }
      },
      toggleNodeVisibility: (nodeId: string, visible: boolean) => {
        if (!sceneRef.current) return
        const object = sceneRef.current.getObjectByProperty('uuid', nodeId)
        if (object) {
          object.visible = visible
        }
      },
    }))

    // Setup Three.js Scene and Loop
    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      // Scene
      const scene = new THREE.Scene()
      sceneRef.current = scene

      // Camera
      const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.01,
        1000
      )
      camera.position.set(0, 1.5, 3)
      cameraRef.current = camera

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(container.clientWidth, container.clientHeight)
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = settings.exposure
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.outputColorSpace = THREE.SRGBColorSpace
      rendererRef.current = renderer
      container.appendChild(renderer.domElement)

      // Environment & Tone Mapping
      const pmremGenerator = new THREE.PMREMGenerator(renderer)
      pmremGenerator.compileEquirectangularShader()
      const roomEnv = new RoomEnvironment()
      const envTexture = pmremGenerator.fromScene(roomEnv).texture
      scene.environment = envTexture

      // OrbitControls
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.screenSpacePanning = true
      controls.minDistance = 0.05
      controls.maxDistance = 500
      controls.autoRotate = settings.autoRotate
      controls.autoRotateSpeed = settings.autoRotateSpeed
      controlsRef.current = controls

      // Lighting
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2)
      hemiLight.position.set(0, 20, 0)
      scene.add(hemiLight)

      const dirLight = new THREE.DirectionalLight(0xffffff, 2.5)
      dirLight.position.set(5, 10, 7)
      dirLight.castShadow = true
      dirLight.shadow.mapSize.width = 2048
      dirLight.shadow.mapSize.height = 2048
      dirLight.shadow.camera.near = 0.1
      dirLight.shadow.camera.far = 40
      dirLight.shadow.bias = -0.0005
      scene.add(dirLight)
      dirLightRef.current = dirLight

      const fillLight = new THREE.DirectionalLight(0xa5c4f2, 1.0)
      fillLight.position.set(-5, 5, -5)
      scene.add(fillLight)

      // Grid Helper
      const grid = new THREE.GridHelper(10, 20, 0x3b82f6, 0x334155)
      grid.position.y = 0
      grid.visible = settings.grid
      scene.add(grid)
      gridRef.current = grid

      // Axes Helper
      const axes = new THREE.AxesHelper(1.5)
      axes.visible = settings.axes
      scene.add(axes)
      axesRef.current = axes

      // Clock & Animation Loop
      const clock = new THREE.Clock()
      let reqId: number

      const animate = () => {
        reqId = requestAnimationFrame(animate)
        const delta = clock.getDelta()

        if (mixerRef.current && animState.isPlaying) {
          mixerRef.current.update(delta)
          if (currentActionRef.current) {
            const clipDuration = currentActionRef.current.getClip().duration
            const currentClipTime = currentActionRef.current.time % clipDuration
            setAnimState((prev) => ({ ...prev, time: currentClipTime }))
          }
        }

        controls.update()
        renderer.render(scene, camera)
      }

      animate()

      // Resize Observer
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width
          const height = entry.contentRect.height
          if (width > 0 && height > 0) {
            camera.aspect = width / height
            camera.updateProjectionMatrix()
            renderer.setSize(width, height)
          }
        }
      })
      resizeObserver.observe(container)

      // Cleanup
      return () => {
        cancelAnimationFrame(reqId)
        resizeObserver.disconnect()
        pmremGenerator.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement)
        }
      }
    }, [])

    // Update settings reactively
    useEffect(() => {
      if (gridRef.current) gridRef.current.visible = settings.grid
      if (axesRef.current) axesRef.current.visible = settings.axes
      if (rendererRef.current) {
        rendererRef.current.toneMappingExposure = settings.exposure
        rendererRef.current.shadowMap.enabled = settings.shadows
      }
      if (controlsRef.current) {
        controlsRef.current.autoRotate = settings.autoRotate
        controlsRef.current.autoRotateSpeed = settings.autoRotateSpeed
      }
      if (modelGroupRef.current) {
        modelGroupRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
            mats.forEach((m) => {
              if (m && 'wireframe' in m) {
                ;(m as THREE.MeshStandardMaterial).wireframe = settings.wireframe
              }
            })
          }
        })
      }
    }, [settings])

    // Load Model when modelUrl changes
    useEffect(() => {
      if (!modelUrl || !sceneRef.current) return

      const scene = sceneRef.current

      // Clear previous model & mixer
      if (modelGroupRef.current) {
        scene.remove(modelGroupRef.current)
        modelGroupRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.geometry.dispose()
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose())
            } else {
              mesh.material.dispose()
            }
          }
        })
        modelGroupRef.current = null
      }
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
        mixerRef.current = null
      }
      currentActionRef.current = null
      clipsRef.current = []

      onLoadingProgress?.(0, true)

      // Setup DRACOLoader
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('/draco/gltf/')
      dracoLoader.setDecoderConfig({ type: 'js' })

      const loader = new GLTFLoader()
      loader.setDRACOLoader(dracoLoader)

      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene
          modelGroupRef.current = model
          scene.add(model)

          // Enable shadows and gather statistics
          let triangles = 0
          let vertices = 0
          let meshes = 0
          const materialsSet = new Set<string>()

          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh
              meshes++
              mesh.castShadow = true
              mesh.receiveShadow = true

              const geom = mesh.geometry
              if (geom) {
                vertices += geom.attributes.position ? geom.attributes.position.count : 0
                if (geom.index) {
                  triangles += geom.index.count / 3
                } else if (geom.attributes.position) {
                  triangles += geom.attributes.position.count / 3
                }
              }

              const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
              mats.forEach((m) => {
                if (m) {
                  materialsSet.add(m.uuid)
                  if ('wireframe' in m) {
                    ;(m as THREE.MeshStandardMaterial).wireframe = settings.wireframe
                  }
                }
              })
            }
          })

          // Calculate bounding box and center model
          const box = new THREE.Box3().setFromObject(model)
          const size = new THREE.Vector3()
          box.getSize(size)
          const center = new THREE.Vector3()
          box.getCenter(center)

          // Position model so its bottom sits on the ground (y = 0)
          model.position.x = -center.x
          model.position.z = -center.z
          model.position.y = -box.min.y

          // Re-adjust grid size to match model scale
          const maxDim = Math.max(size.x, size.y, size.z) || 1
          modelSizeRef.current = maxDim
          if (gridRef.current) {
            scene.remove(gridRef.current)
            const gridSize = Math.max(10, Math.ceil(maxDim * 2.5))
            const newGrid = new THREE.GridHelper(gridSize, 20, 0x3b82f6, 0x334155)
            newGrid.position.y = 0
            newGrid.visible = settings.grid
            scene.add(newGrid)
            gridRef.current = newGrid
          }

          // Adjust directional light shadow camera according to model size
          if (dirLightRef.current) {
            const d = maxDim * 1.5
            dirLightRef.current.position.set(d, d * 1.5, d)
            dirLightRef.current.shadow.camera.left = -d
            dirLightRef.current.shadow.camera.right = d
            dirLightRef.current.shadow.camera.top = d
            dirLightRef.current.shadow.camera.bottom = -d
            dirLightRef.current.shadow.camera.far = d * 4
            dirLightRef.current.shadow.camera.updateProjectionMatrix()
          }

          // Frame camera to model
          if (cameraRef.current && controlsRef.current) {
            const camera = cameraRef.current
            const controls = controlsRef.current

            const targetY = size.y * 0.5
            controls.target.set(0, targetY, 0)
            initialControlsTarget.current.set(0, targetY, 0)

            const cameraDist = maxDim * 1.8
            camera.position.set(cameraDist * 0.7, targetY + cameraDist * 0.4, cameraDist)
            camera.near = Math.max(0.01, maxDim / 100)
            camera.far = Math.max(100, maxDim * 20)
            camera.updateProjectionMatrix()

            initialCameraPos.current.copy(camera.position)
            controls.update()
          }

          // Emit stats
          onStatsLoaded?.({
            triangles: Math.round(triangles),
            vertices: Math.round(vertices),
            meshes,
            materials: materialsSet.size,
            animationsCount: gltf.animations.length,
            dimensions: {
              width: parseFloat(size.x.toFixed(2)),
              height: parseFloat(size.y.toFixed(2)),
              depth: parseFloat(size.z.toFixed(2)),
            },
          })

          // Emit hierarchy
          onHierarchyLoaded?.([buildHierarchy(model)])

          // Handle animations
          if (gltf.animations && gltf.animations.length > 0) {
            clipsRef.current = gltf.animations
            const mixer = new THREE.AnimationMixer(model)
            mixerRef.current = mixer

            const firstClip = gltf.animations[0]
            const action = mixer.clipAction(firstClip)
            action.play()
            currentActionRef.current = action

            const clipNames = gltf.animations.map(
              (clip, idx) => clip.name || `Animation ${idx + 1}`
            )

            const newAnimState: AnimationState = {
              clips: clipNames,
              currentClipIndex: 0,
              isPlaying: true,
              speed: 1,
              time: 0,
              duration: firstClip.duration,
            }
            setAnimState(newAnimState)
            onAnimationStateChange?.(newAnimState)
          } else {
            const noAnimState: AnimationState = {
              clips: [],
              currentClipIndex: 0,
              isPlaying: false,
              speed: 1,
              time: 0,
              duration: 0,
            }
            setAnimState(noAnimState)
            onAnimationStateChange?.(noAnimState)
          }

          onLoadingProgress?.(100, false)
          dracoLoader.dispose()
        },
        (xhr) => {
          if (xhr.total > 0) {
            const pct = Math.round((xhr.loaded / xhr.total) * 100)
            onLoadingProgress?.(pct, true)
          }
        },
        (error) => {
          console.error('Error loading GLTF model:', error)
          onLoadingProgress?.(0, false)
          dracoLoader.dispose()
        }
      )
    }, [modelUrl])

    return (
      <div
        ref={containerRef}
        className="w-full h-full relative select-none"
        style={{
          background:
            settings.backgroundColor === 'dark'
              ? 'radial-gradient(circle at 50% 40%, #1e293b 0%, #090d16 100%)'
              : settings.backgroundColor === 'gradient'
              ? 'radial-gradient(circle at 50% 30%, #334155 0%, #0f172a 100%)'
              : '#020617',
        }}
      />
    )
  }
)
ViewerCanvas.displayName = 'ViewerCanvas'
