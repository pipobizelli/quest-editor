const imageCache = new Map<string, HTMLImageElement>()
const loadingSet = new Set<string>()
const listeners = new Map<string, Set<() => void>>()

export interface AssetConfig {
  basePath: string
  getPath?: (type: string, subtype: string) => string
}

let config: AssetConfig = {
  basePath: '/assets',
}

export function configureAssets(options: Partial<AssetConfig>) {
  config = { ...config, ...options }
}

export function getAssetPath(type: string, subtype: string): string {
  if (config.getPath) {
    return config.getPath(type, subtype)
  }
  return `${config.basePath}/${type}/${subtype}.png`
}

export function loadImage(type: string, subtype: string): HTMLImageElement | null {
  const path = getAssetPath(type, subtype)

  const cached = imageCache.get(path)
  if (cached) return cached

  if (loadingSet.has(path)) return null

  loadingSet.add(path)
  const img = new Image()
  img.src = path
  img.onload = () => {
    imageCache.set(path, img)
    loadingSet.delete(path)
    listeners.get(path)?.forEach((cb) => cb())
  }
  img.onerror = () => {
    loadingSet.delete(path)
  }

  return null
}

export function onImageLoaded(type: string, subtype: string, callback: () => void): () => void {
  const path = getAssetPath(type, subtype)
  let set = listeners.get(path)
  if (!set) {
    set = new Set()
    listeners.set(path, set)
  }
  set.add(callback)
  return () => set!.delete(callback)
}

export function getImage(type: string, subtype: string): HTMLImageElement | null {
  const path = getAssetPath(type, subtype)
  return imageCache.get(path) ?? null
}
