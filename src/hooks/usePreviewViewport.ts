import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'

const INTERACTIVE_NODE_SELECTOR = 'g.node, g.actor, g.task'

function isInteractiveNodeTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(INTERACTIVE_NODE_SELECTOR))
}

const MIN_ZOOM = 25
const MAX_ZOOM = 200

export interface Pan {
  x: number
  y: number
}

export function usePreviewViewport(
  zoom: number,
  onZoomChange: (zoom: number) => void,
) {
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

  const clampZoom = useCallback(
    (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value)),
    [],
  )

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      if (isInteractiveNodeTarget(event.target)) return
      event.currentTarget.setPointerCapture(event.pointerId)
      dragStart.current = {
        x: event.clientX,
        y: event.clientY,
        panX: pan.x,
        panY: pan.y,
      }
      setIsDragging(true)
    },
    [pan.x, pan.y],
  )

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging) return
      const dx = event.clientX - dragStart.current.x
      const dy = event.clientY - dragStart.current.y
      setPan({
        x: dragStart.current.panX + dx,
        y: dragStart.current.panY + dy,
      })
    },
    [isDragging],
  )

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setIsDragging(false)
  }, [])

  const onWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      event.preventDefault()

      const container = event.currentTarget
      const rect = container.getBoundingClientRect()
      const pointerX = event.clientX - rect.left
      const pointerY = event.clientY - rect.top

      const currentScale = zoom / 100
      const zoomFactor = event.deltaY < 0 ? 1.08 : 1 / 1.08
      const nextScale = clampZoom(Math.round(currentScale * zoomFactor * 100)) / 100
      const ratio = nextScale / currentScale

      setPan((currentPan) => ({
        x: pointerX - (pointerX - currentPan.x) * ratio,
        y: pointerY - (pointerY - currentPan.y) * ratio,
      }))
      onZoomChange(Math.round(nextScale * 100))
    },
    [clampZoom, onZoomChange, zoom],
  )

  const resetView = useCallback(() => {
    setPan({ x: 0, y: 0 })
    onZoomChange(100)
  }, [onZoomChange])

  return {
    pan,
    isDragging,
    scale: zoom / 100,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    resetView,
  }
}
