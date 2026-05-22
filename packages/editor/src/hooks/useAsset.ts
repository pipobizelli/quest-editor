import { useState, useEffect } from 'react'
import { loadImage, getImage, onImageLoaded } from '../assets'

export function useAsset(type: string, subtype: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(() => getImage(type, subtype))

  useEffect(() => {
    const cached = loadImage(type, subtype)
    if (cached) {
      setImage(cached)
      return
    }

    const unsubscribe = onImageLoaded(type, subtype, () => {
      setImage(getImage(type, subtype))
    })

    return unsubscribe
  }, [type, subtype])

  return image
}
