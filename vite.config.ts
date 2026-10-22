import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface DiscoveredModel {
  name: string
  filename: string
  url: string
  sizeBytes: number
  sizeFormatted: string
  updatedAt: number
}

function modelDiscoveryPlugin(): Plugin {
  const getModelList = (modelsDir: string): DiscoveredModel[] => {
    if (!fs.existsSync(modelsDir)) return []
    const files: string[] = fs.readdirSync(modelsDir)
    return files
      .filter((file: string) => /\.(glb|gltf)$/i.test(file))
      .map((file: string): DiscoveredModel => {
        const fullPath = path.join(modelsDir, file)
        const stat = fs.statSync(fullPath)
        return {
          name: file.replace(/\.(glb|gltf)$/i, ''),
          filename: file,
          url: `/models/${encodeURIComponent(file)}`,
          sizeBytes: stat.size,
          sizeFormatted:
            stat.size > 1024 * 1024
              ? (stat.size / (1024 * 1024)).toFixed(2) + ' MB'
              : (stat.size / 1024).toFixed(1) + ' KB',
          updatedAt: stat.mtimeMs,
        }
      })
      .sort((a: DiscoveredModel, b: DiscoveredModel) => a.name.localeCompare(b.name))
  }

  return {
    name: 'glb-model-discovery',
    configureServer(server) {
      server.middlewares.use('/api/models', (_req, res) => {
        const modelsDir = path.resolve(__dirname, 'public/models')
        const models = getModelList(modelsDir)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(models))
      })
    },
    buildStart() {
      const modelsDir = path.resolve(__dirname, 'public/models')
      const models = getModelList(modelsDir)
      const outPath = path.resolve(__dirname, 'public/models.json')
      fs.writeFileSync(outPath, JSON.stringify(models, null, 2))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), modelDiscoveryPlugin()],
  server: {
    port: 5173,
    host: true,
  },
})
