import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { ModelItem, ModelStats, ViewerSettings, AnimationState, NodeTreeNode } from '../types'

export interface ViewerCanvasRef {
  resetCamera: () => void
  setCameraView: (view: 'front' | 'back' | 'top' | 'left' | 'right' | 'iso') => void
  setAnimationPlay: (playing: boolean) => void
  setAnimationClip: (index: number) => void
  setAnimationSpeed: (speed: number) => void
  seekAnimation: (time: number) => void
  toggleNodeVisibility: (nodeId: string, visible: boolean) => void
}

interface ViewerCanvasProps {
  models: ModelItem[]
  selectedModel: ModelItem | null
  isViewAll: boolean
  settings: ViewerSettings
  disabledModelFilenames?: Set<string>
  onStatsLoaded?: (stats: ModelStats) => void
  onHierarchyLoaded?: (tree: NodeTreeNode[]) => void
  onAnimationStateChange?: (state: AnimationState) => void
  onLoadingProgress?: (progress: number, loading: boolean) => void
}

export const ViewerCanvas = forwardRef<ViewerCanvasRef, ViewerCanvasProps>(
  (
    {
      models,
      selectedModel,
      isViewAll,
      settings,
      disabledModelFilenames,
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
    const modelsRootGroupRef = useRef<THREE.Group | null>(null)

    // Animation mixers (supports multiple for multi-model view)
    const mixersRef = useRef<THREE.AnimationMixer[]>([])
    const primaryActionRef = useRef<THREE.AnimationAction | null>(null)
    const clipsRef = useRef<THREE.AnimationClip[]>([])
    const dirLightRef = useRef<THREE.DirectionalLight | null>(null)
    const gridRef = useRef<THREE.GridHelper | null>(null)

    const [animState, setAnimState] = useState<AnimationState>({
      clips: [],
      currentClipIndex: 0,
      isPlaying: true,
      speed: 1,
      time: 0,
      duration: 0,
    })

    const initialCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.5, 4))
    const initialControlsTarget = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.8, 0))
    const sceneSpanRef = useRef<number>(3)

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
        const dist = Math.max(2, sceneSpanRef.current * 1.5)

        switch (view) {
          case 'front':
            cameraRef.current.position.set(target.x, target.y, target.z + dist)
            break
          case 'back':
            cameraRef.current.position.set(target.x, target.y, target.z - dist)
            break
          case 'top':
            cameraRef.current.position.set(target.x, target.y + dist * 1.2, target.z + 0.001)
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
              target.y + dist * 0.6,
              target.z + dist * 0.7
            )
            break
        }
        controlsRef.current.target.copy(target)
        controlsRef.current.update()
      },
      setAnimationPlay: (playing: boolean) => {
        mixersRef.current.forEach((mixer) => {
          mixer.timeScale = playing ? animState.speed : 0
        })
        setAnimState((prev) => {
          const next = { ...prev, isPlaying: playing }
          onAnimationStateChange?.(next)
          return next
        })
      },
      setAnimationClip: (clipIndex: number) => {
        if (mixersRef.current.length === 0 || !clipsRef.current[clipIndex]) return
        const clip = clipsRef.current[clipIndex]
        if (primaryActionRef.current) {
          primaryActionRef.current.stop()
        }
        const action = mixersRef.current[0].clipAction(clip)
        action.reset().play()
        action.timeScale = animState.isPlaying ? animState.speed : 0
        primaryActionRef.current = action

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
        mixersRef.current.forEach((mixer) => {
          mixer.timeScale = animState.isPlaying ? speed : 0
        })
        setAnimState((prev) => {
          const next = { ...prev, speed }
          onAnimationStateChange?.(next)
          return next
        })
      },
      seekAnimation: (time: number) => {
        mixersRef.current.forEach((mixer) => {
          mixer.setTime(time)
        })
        setAnimState((prev) => {
          const next = { ...prev, time }
          onAnimationStateChange?.(next)
          return next
        })
      },
      toggleNodeVisibility: (nodeId: string, visible: boolean) => {
        if (!sceneRef.current) return
        const object = sceneRef.current.getObjectByProperty('uuid', nodeId)
        if (object) {
          object.visible = visible
        }
      },
    }))

    // Setup Three.js Scene, Renderer & Loop
    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      // Scene
      const scene = new THREE.Scene()
      sceneRef.current = scene

      // Root group for all loaded models
      const modelsRoot = new THREE.Group()
      scene.add(modelsRoot)
      modelsRootGroupRef.current = modelsRoot

      // Camera
      const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.01,
        1000
      )
      camera.position.set(0, 1.5, 4)
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

      // Lighting (Warm Key & Cool Fill)
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 1.4)
      hemiLight.position.set(0, 20, 0)
      scene.add(hemiLight)

      const dirLight = new THREE.DirectionalLight(0xfffbeb, 2.5)
      dirLight.position.set(6, 12, 8)
      dirLight.castShadow = true
      dirLight.shadow.mapSize.width = 2048
      dirLight.shadow.mapSize.height = 2048
      dirLight.shadow.camera.near = 0.1
      dirLight.shadow.camera.far = 50
      dirLight.shadow.bias = -0.0003
      scene.add(dirLight)
      dirLightRef.current = dirLight

      const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.2)
      fillLight.position.set(-6, 6, -6)
      scene.add(fillLight)

      // Subtle shadow-catching ground (receives soft shadows)
      const shadowPlaneGeo = new THREE.PlaneGeometry(100, 100)
      const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.35 })
      const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat)
      shadowPlane.rotation.x = -Math.PI / 2
      shadowPlane.position.y = -0.001
      shadowPlane.receiveShadow = true
      scene.add(shadowPlane)

      // Horizontal ground plane grid lines (XY/XZ ground grid with blue center lines)
      const grid = new THREE.GridHelper(10, 20, 0x3b82f6, 0x334155)
      grid.position.y = 0
      scene.add(grid)
      gridRef.current = grid

      // Animation Loop
      const clock = new THREE.Clock()
      let reqId: number

      const animate = () => {
        reqId = requestAnimationFrame(animate)
        const delta = clock.getDelta()

        if (mixersRef.current.length > 0 && animState.isPlaying) {
          mixersRef.current.forEach((mixer) => mixer.update(delta))
          if (primaryActionRef.current) {
            const clipDur = primaryActionRef.current.getClip().duration
            const currentClipTime = primaryActionRef.current.time % (clipDur || 1)
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
      if (rendererRef.current) {
        rendererRef.current.toneMappingExposure = settings.exposure
      }
      if (controlsRef.current) {
        controlsRef.current.autoRotate = settings.autoRotate
        controlsRef.current.autoRotateSpeed = settings.autoRotateSpeed
      }
    }, [settings])

    // Load Models (single model or all models lineup)
    useEffect(() => {
      const modelsRoot = modelsRootGroupRef.current
      const scene = sceneRef.current
      if (!modelsRoot || !scene) return

      // Determine which models to load
      const targetsToLoad: ModelItem[] = isViewAll
        ? models.filter((m) => !disabledModelFilenames?.has(m.filename))
        : selectedModel
        ? [selectedModel]
        : []

      if (targetsToLoad.length === 0) return

      // Clear previous models
      while (modelsRoot.children.length > 0) {
        const obj = modelsRoot.children[0]
        modelsRoot.remove(obj)
        obj.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.geometry.dispose()
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
            mats.forEach((m) => m?.dispose())
          }
        })
      }

      // Stop previous mixers
      mixersRef.current.forEach((mixer) => mixer.stopAllAction())
      mixersRef.current = []
      primaryActionRef.current = null
      clipsRef.current = []

      onLoadingProgress?.(5, true)

      // Setup Draco Loader
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('/draco/gltf/')
      dracoLoader.setDecoderConfig({ type: 'js' })

      const loader = new GLTFLoader()
      loader.setDRACOLoader(dracoLoader)

      // Register KHR_materials_pbrSpecularGlossiness extension plugin
      // Resolves models exported with legacy specular/glossiness workflow that render white
      loader.register((parser) => ({
        name: 'KHR_materials_pbrSpecularGlossiness',
        getMaterialType: () => THREE.MeshStandardMaterial,
        extendMaterialParams: async (materialIndex: number, materialParams: Record<string, any>) => {
          const materialDef = parser.json.materials[materialIndex]
          if (!materialDef.extensions || !materialDef.extensions.KHR_materials_pbrSpecularGlossiness) return
          const ext = materialDef.extensions.KHR_materials_pbrSpecularGlossiness

          if (ext.diffuseFactor) {
            materialParams.color = new THREE.Color(
              ext.diffuseFactor[0],
              ext.diffuseFactor[1],
              ext.diffuseFactor[2]
            )
            if (ext.diffuseFactor.length > 3) {
              materialParams.opacity = ext.diffuseFactor[3]
              if (ext.diffuseFactor[3] < 1) materialParams.transparent = true
            }
          }
          if (ext.diffuseTexture) {
            const texture = await parser.getDependency('texture', ext.diffuseTexture.index)
            if (texture) {
              texture.colorSpace = THREE.SRGBColorSpace
              materialParams.map = texture
            }
          }
          materialParams.roughness = 1.0 - (ext.glossinessFactor !== undefined ? ext.glossinessFactor : 0.5)
          materialParams.metalness = 0.0
        },
      }))

      let totalTriangles = 0
      let totalVertices = 0
      let totalMeshes = 0
      const materialsSet = new Set<string>()
      const allClips: THREE.AnimationClip[] = []

      let loadedCount = 0

      const loadSingle = (item: ModelItem) => {
        return new Promise<{
          item: ModelItem
          scene: THREE.Group
          animations: THREE.AnimationClip[]
          size: THREE.Vector3
          center: THREE.Vector3
          box: THREE.Box3
        }>((resolve, reject) => {
          loader.load(
            item.url,
            (gltf) => {
              const model = gltf.scene
              model.name = item.name

              // Enable shadows and accumulate stats
              model.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                  const mesh = child as THREE.Mesh
                  totalMeshes++
                  mesh.castShadow = true
                  mesh.receiveShadow = true

                  const geom = mesh.geometry
                  if (geom) {
                    totalVertices += geom.attributes.position ? geom.attributes.position.count : 0
                    if (geom.index) {
                      totalTriangles += geom.index.count / 3
                    } else if (geom.attributes.position) {
                      totalTriangles += geom.attributes.position.count / 3
                    }
                  }

                  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
                  mats.forEach((m) => {
                    if (m) materialsSet.add(m.uuid)
                  })
                }
              })

              // Scale to uniform height (1.8m) if enabled
              const initialBox = new THREE.Box3().setFromObject(model)
              const initialSize = new THREE.Vector3()
              initialBox.getSize(initialSize)

              if (settings.uniformHeight && initialSize.y > 0) {
                const targetHeight = 1.8
                const scaleFactor = targetHeight / initialSize.y
                model.scale.set(scaleFactor, scaleFactor, scaleFactor)
                model.updateMatrixWorld(true)
              }

              const box = new THREE.Box3().setFromObject(model)
              const size = new THREE.Vector3()
              box.getSize(size)
              const center = new THREE.Vector3()
              box.getCenter(center)

              loadedCount++
              onLoadingProgress?.(
                Math.round((loadedCount / targetsToLoad.length) * 100),
                true
              )

              resolve({
                item,
                scene: model,
                animations: gltf.animations || [],
                size,
                center,
                box,
              })
            },
            undefined,
            (err) => reject(err)
          )
        })
      }

      Promise.all(targetsToLoad.map((target) => loadSingle(target)))
        .then((results) => {
          const newMixers: THREE.AnimationMixer[] = []

          if (!isViewAll && results.length === 1) {
            // SINGLE MODEL VIEW
            const { scene: model, animations, size, center, box } = results[0]

            // Center model and place on ground y = 0
            model.position.x = -center.x
            model.position.z = -center.z
            model.position.y = -box.min.y

            modelsRoot.add(model)

            // Setup animation
            if (animations.length > 0) {
              clipsRef.current = animations
              const mixer = new THREE.AnimationMixer(model)
              const action = mixer.clipAction(animations[0])
              action.play()
              primaryActionRef.current = action
              newMixers.push(mixer)

              const clipNames = animations.map((c, idx) => c.name || `Animation ${idx + 1}`)
              const newAnimState: AnimationState = {
                clips: clipNames,
                currentClipIndex: 0,
                isPlaying: true,
                speed: 1,
                time: 0,
                duration: animations[0].duration,
              }
              setAnimState(newAnimState)
              onAnimationStateChange?.(newAnimState)
            } else {
              setAnimState({
                clips: [],
                currentClipIndex: 0,
                isPlaying: false,
                speed: 1,
                time: 0,
                duration: 0,
              })
              onAnimationStateChange?.({
                clips: [],
                currentClipIndex: 0,
                isPlaying: false,
                speed: 1,
                time: 0,
                duration: 0,
              })
            }

            // Frame camera
            const maxDim = Math.max(size.x, size.y, size.z) || 2
            sceneSpanRef.current = maxDim

            // Resize horizontal ground grid to fit model
            if (gridRef.current) {
              scene.remove(gridRef.current)
              const gridSize = Math.max(10, Math.ceil(maxDim * 2.5))
              const newGrid = new THREE.GridHelper(gridSize, 20, 0x3b82f6, 0x334155)
              newGrid.position.y = 0
              scene.add(newGrid)
              gridRef.current = newGrid
            }

            if (cameraRef.current && controlsRef.current) {
              const camera = cameraRef.current
              const controls = controlsRef.current

              const targetY = size.y * 0.5
              controls.target.set(0, targetY, 0)
              initialControlsTarget.current.set(0, targetY, 0)

              const cameraDist = maxDim * 1.8
              camera.position.set(cameraDist * 0.7, targetY + cameraDist * 0.4, cameraDist)
              camera.near = Math.max(0.01, maxDim / 100)
              camera.far = Math.max(100, maxDim * 30)
              camera.updateProjectionMatrix()

              initialCameraPos.current.copy(camera.position)
              controls.update()
            }

            // Adjust light shadow box
            if (dirLightRef.current) {
              const d = maxDim * 1.8
              dirLightRef.current.position.set(d, d * 1.6, d)
              dirLightRef.current.shadow.camera.left = -d
              dirLightRef.current.shadow.camera.right = d
              dirLightRef.current.shadow.camera.top = d
              dirLightRef.current.shadow.camera.bottom = -d
              dirLightRef.current.shadow.camera.far = d * 4
              dirLightRef.current.shadow.camera.updateProjectionMatrix()
            }

            onStatsLoaded?.({
              triangles: Math.round(totalTriangles),
              vertices: Math.round(totalVertices),
              meshes: totalMeshes,
              materials: materialsSet.size,
              animationsCount: animations.length,
              dimensions: {
                width: parseFloat(size.x.toFixed(2)),
                height: parseFloat(size.y.toFixed(2)),
                depth: parseFloat(size.z.toFixed(2)),
              },
            })

            onHierarchyLoaded?.([buildHierarchy(model)])
          } else {
            // ALL MODELS CIRCULAR FORMATION (Avengers 1 Iconic 360 Circle)
            const count = results.length
            // Radius of circle based on count and model sizes (~1.7m for 4 characters)
            const circleRadius = Math.max(1.6, (count * 1.5) / (2 * Math.PI))

            results.forEach((r, idx) => {
              const { scene: model, animations, center, box } = r

              // Angle for this hero in the circle
              const angle = (idx / count) * Math.PI * 2

              // Holder group to handle position and outward rotation
              const holder = new THREE.Group()

              // Center model locally so feet are on ground (y = 0) and centered in X/Z
              model.position.x = -center.x
              model.position.z = -center.z
              model.position.y = -box.min.y
              holder.add(model)

              // Position holder on the circle perimeter
              holder.position.x = circleRadius * Math.sin(angle)
              holder.position.z = circleRadius * Math.cos(angle)
              holder.position.y = 0

              // Rotate holder so each character faces outwards (away from center)
              holder.rotation.y = angle

              modelsRoot.add(holder)

              // Animate character if it has animation
              if (animations.length > 0) {
                const mixer = new THREE.AnimationMixer(model)
                const action = mixer.clipAction(animations[0])
                action.play()
                newMixers.push(mixer)
                allClips.push(...animations)

                if (!primaryActionRef.current) {
                  primaryActionRef.current = action
                  clipsRef.current = animations
                }
              }
            })

            // Frame camera to encompass the full circle
            const overallBox = new THREE.Box3().setFromObject(modelsRoot)
            const overallSize = new THREE.Vector3()
            overallBox.getSize(overallSize)
            const overallCenter = new THREE.Vector3()
            overallBox.getCenter(overallCenter)

            const maxSpan = Math.max(overallSize.x, overallSize.z, overallSize.y)
            sceneSpanRef.current = maxSpan

            // Resize ground grid floor
            if (gridRef.current) {
              scene.remove(gridRef.current)
              const gridSize = Math.max(Math.ceil(circleRadius * 5), 18)
              const divisions = Math.max(20, Math.round(gridSize / 1.2))
              const newGrid = new THREE.GridHelper(gridSize, divisions, 0x3b82f6, 0x334155)
              newGrid.position.y = 0
              scene.add(newGrid)
              gridRef.current = newGrid
            }

            if (cameraRef.current && controlsRef.current) {
              const camera = cameraRef.current
              const controls = controlsRef.current

              const targetY = overallSize.y * 0.45
              controls.target.set(0, targetY, 0)
              initialControlsTarget.current.set(0, targetY, 0)

              // Dramatic cinematic camera distance
              const cameraDist = circleRadius * 2.5 + 2.2
              camera.position.set(0, targetY + 0.8, cameraDist)
              camera.near = 0.05
              camera.far = Math.max(200, cameraDist * 20)
              camera.updateProjectionMatrix()

              initialCameraPos.current.copy(camera.position)
              controls.update()
            }

            // Adjust directional light for circular lineup
            if (dirLightRef.current) {
              const d = Math.max(circleRadius * 3, 10)
              dirLightRef.current.position.set(d * 0.7, d * 1.2, d * 0.7)
              dirLightRef.current.shadow.camera.left = -d
              dirLightRef.current.shadow.camera.right = d
              dirLightRef.current.shadow.camera.top = d
              dirLightRef.current.shadow.camera.bottom = -d
              dirLightRef.current.shadow.camera.far = d * 4
              dirLightRef.current.shadow.camera.updateProjectionMatrix()
            }

            // Animation state
            if (allClips.length > 0) {
              const clipNames = allClips.map((c, idx) => c.name || `Animation ${idx + 1}`)
              const newAnimState: AnimationState = {
                clips: clipNames,
                currentClipIndex: 0,
                isPlaying: true,
                speed: 1,
                time: 0,
                duration: primaryActionRef.current?.getClip().duration || 1,
              }
              setAnimState(newAnimState)
              onAnimationStateChange?.(newAnimState)
            } else {
              setAnimState({
                clips: [],
                currentClipIndex: 0,
                isPlaying: false,
                speed: 1,
                time: 0,
                duration: 0,
              })
              onAnimationStateChange?.({
                clips: [],
                currentClipIndex: 0,
                isPlaying: false,
                speed: 1,
                time: 0,
                duration: 0,
              })
            }

            // Consolidated statistics
            onStatsLoaded?.({
              triangles: Math.round(totalTriangles),
              vertices: Math.round(totalVertices),
              meshes: totalMeshes,
              materials: materialsSet.size,
              animationsCount: allClips.length,
              dimensions: {
                width: parseFloat(overallSize.x.toFixed(2)),
                height: parseFloat(overallSize.y.toFixed(2)),
                depth: parseFloat(overallSize.z.toFixed(2)),
              },
            })

            onHierarchyLoaded?.([buildHierarchy(modelsRoot)])
          }

          mixersRef.current = newMixers
          onLoadingProgress?.(100, false)
          dracoLoader.dispose()
        })
        .catch((err) => {
          console.error('Error loading 3D models:', err)
          onLoadingProgress?.(0, false)
          dracoLoader.dispose()
        })
    }, [isViewAll, selectedModel, models, disabledModelFilenames, settings.uniformHeight])

    return (
      <div
        ref={containerRef}
        className="w-full h-full relative select-none"
        style={{
          background:
            settings.backgroundColor === 'dark'
              ? 'radial-gradient(circle at 50% 35%, #182234 0%, #060911 100%)'
              : settings.backgroundColor === 'gradient'
              ? 'radial-gradient(circle at 50% 30%, #334155 0%, #0f172a 100%)'
              : '#020617',
        }}
      />
    )
  }
)

ViewerCanvas.displayName = 'ViewerCanvas'
