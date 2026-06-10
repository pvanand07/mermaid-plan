export interface Pan {
  x: number
  y: number
}

export const PREVIEW_FIT_PADDING = 48
export const MIN_ZOOM = 25
export const MAX_ZOOM = 200

export function computeFitView(
  containerWidth: number,
  containerHeight: number,
  contentWidth: number,
  contentHeight: number,
): { zoom: number; pan: Pan } {
  if (
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    contentWidth <= 0 ||
    contentHeight <= 0
  ) {
    return { zoom: 100, pan: { x: 0, y: 0 } }
  }

  const availableWidth = containerWidth - PREVIEW_FIT_PADDING
  const availableHeight = containerHeight - PREVIEW_FIT_PADDING

  const rawScale = Math.min(
    1,
    availableWidth / contentWidth,
    availableHeight / contentHeight,
  )
  const clampedScale = Math.min(MAX_ZOOM / 100, Math.max(MIN_ZOOM / 100, rawScale))
  const zoom = Math.round(clampedScale * 100)
  const scale = zoom / 100

  return {
    zoom,
    pan: {
      x: (containerWidth / 2) * (1 - scale),
      y: (containerHeight / 2) * (1 - scale),
    },
  }
}
