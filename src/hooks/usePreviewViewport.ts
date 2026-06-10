import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import { computeFitView, MAX_ZOOM, MIN_ZOOM, type Pan } from '../lib/previewFit'

export type { Pan }

const INTERACTIVE_NODE_SELECTOR = 'g.node, g.actor, g.task'

function isInteractiveNodeTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(INTERACTIVE_NODE_SELECTOR))
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

  const fitToView = useCallback(
    (container: HTMLElement | null, wrapper: HTMLElement | null) => {
      if (!container || !wrapper) return

      const contentWidth = wrapper.offsetWidth
      const contentHeight = wrapper.offsetHeight
      if (contentWidth === 0 || contentHeight === 0) return

      const { zoom: fitZoom, pan: fitPan } = computeFitView(
        container.clientWidth,
        container.clientHeight,
        contentWidth,
        contentHeight,
      )

      setPan(fitPan)
      onZoomChange(fitZoom)
    },
    [onZoomChange],
  )

  const resetView = useCallback(
    (container: HTMLElement | null, wrapper: HTMLElement | null) => {
      fitToView(container, wrapper)
    },
    [fitToView],
  )

  return {
    pan,
    isDragging,
    scale: zoom / 100,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    fitToView,
    resetView,
  }
}
