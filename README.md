# GLB 3D Model Viewer

A standalone web application built with **React**, **Three.js**, **Vite**, and **Tailwind CSS** to view, inspect, and animate `.glb` and `.gltf` 3D models from a local, git-ignored asset directory.

---

## Features

- **Automatic Asset Discovery:** Scans `public/models/` dynamically via Vite middleware (`/api/models`). No manual file uploads or drag-and-drop required.
- **Git-Ignored Asset Folder:** Keep large binary 3D assets in `public/models/` without polluting your git repository.
- **PBR Rendering:** Physically Based Rendering with environment reflections (`RoomEnvironment`), soft directional shadows, and ACES Filmic tone mapping.
- **Draco Compression Support:** Bundled local WASM Draco decoder in `public/draco/` for compressed GLTF/GLB models.
- **Animation Player:**
  - Play / Pause controls
  - Multi-clip selector dropdown
  - Scrub timeline with time markers
  - Speed selector (0.5x, 1x, 1.5x, 2x)
- **Model Inspector:**
  - Real-time statistics: Triangles, Vertices, Meshes, Unique Materials count
  - Bounding box dimensions (Width, Height, Depth)
  - Interactive Scene Hierarchy Tree with visibility toggle for each mesh/bone
  - Real-time Exposure & Turntable speed sliders
- **Camera & Viewport Controls:**
  - Orbit, Pan, and Zoom with damping
  - Camera presets: Front, Back, Top, Right, Isometric
  - Center and auto-fit to any model size
  - Quick toggles: Wireframe, Ground Grid, Coordinate Axes, Auto-Rotate, Shadows
  - Snapshot download (PNG export)
- **Keyboard Shortcuts:**
  - `Space`: Play / Pause animation
  - `W`: Toggle Wireframe mode
  - `G`: Toggle Ground Grid
  - `R`: Reset camera view to default
  - `I`: Toggle Inspector panel

---

## Getting Started

### 1. Installation

```bash
cd glb-viewer
npm install
```

### 2. Add Your Models

Place your `.glb` or `.gltf` models inside:
```
public/models/
```
*(All `.glb`, `.gltf`, and `.bin` files in this folder are automatically excluded from Git via `.gitignore`).*

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production

```bash
npm run build
npm run preview
```

When building, a `public/models.json` manifest is automatically created for static deployment.
