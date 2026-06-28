'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { updateMockupCalibration } from '@/lib/actions/mockups'
import type { CalibrationPoint, CalibrationSurface, EmbroideryDesign, GarmentMockup } from '@/lib/types/database'
import MeshWarpOverlay from '@/components/studio/MeshWarpOverlay'
import {
  createUniformGrid,
  createMeshSurface,
  getCornerIndices,
  getPointRole,
  indexToRowCol,
  normalizeSurface,
  reinterpolateFromCorners,
} from '@/lib/mesh-utils'
import { getMockupVariants } from '@/lib/mockup-variants'
import { validateSurface } from '@/lib/deformation/surface-validation'
import type { DeformationProposal } from '@/lib/deformation/types'

type SurfaceMap = Record<string, CalibrationSurface>
type EditMode = 'corners' | 'grid' | 'preview'
type AssistStatus = 'idle' | 'preparing' | 'queued' | 'analyzing' | 'ready' | 'error'

const DEFAULT_GRID_SIZE = 5

const GRID_SIZE_OPTIONS = [
  { value: 3, label: '3×3', description: 'Rápido' },
  { value: 5, label: '5×5', description: 'Recomendado' },
  { value: 7, label: '7×7', description: 'Alta precisión' },
]

const BLEND_OPTIONS: Array<{ value: CalibrationSurface['blendMode']; label: string }> = [
  { value: 'multiply', label: 'Multiply' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'normal', label: 'Normal' },
]

const ASSIST_STATUS_LABELS: Record<AssistStatus, string> = {
  idle: 'Sin iniciar',
  preparing: 'Preparando',
  queued: 'En cola',
  analyzing: 'Analizando',
  ready: 'Listo',
  error: 'Error',
}

const SIZE_LABELS: Record<string, string> = {
  small: 'Pequeño',
  medium: 'Mediano',
  large: 'Grande',
}

const SURFACE_PRESETS: Record<string, Array<{ id: string; label: string; size: CalibrationSurface['size'] }>> = {
  apparel: [
    { id: 'pecho-centro', label: 'Centro Pecho', size: 'medium' },
    { id: 'pecho-izquierdo', label: 'Pecho Izquierdo (Logo)', size: 'small' },
    { id: 'espalda-centro', label: 'Espalda Grande', size: 'large' },
    { id: 'manga', label: 'Manga', size: 'small' },
  ],
  hoodie: [
    { id: 'pecho-centro', label: 'Centro Pecho', size: 'medium' },
    { id: 'pecho-izquierdo', label: 'Pecho Izquierdo (Logo)', size: 'small' },
    { id: 'espalda-centro', label: 'Espalda Grande', size: 'large' },
    { id: 'manga', label: 'Manga', size: 'small' },
  ],
  gorra: [
    { id: 'frente-centro', label: 'Frente Centro', size: 'small' },
    { id: 'lateral-izquierdo', label: 'Lateral Izquierdo', size: 'small' },
  ],
  tote: [
    { id: 'centro', label: 'Centro', size: 'large' },
    { id: 'frente-bajo', label: 'Frente Bajo', size: 'medium' },
  ],
}

function getPresetGroup(productType?: string | null, name?: string | null, slug?: string | null) {
  const normalizedType = (productType || '').toLowerCase()
  const normalizedName = (name || '').toLowerCase()
  const normalizedSlug = (slug || '').toLowerCase()
  const combined = `${normalizedType} ${normalizedName} ${normalizedSlug}`
  
  if (combined.includes('gorra') || combined.includes('cap')) return SURFACE_PRESETS.gorra
  if (combined.includes('hoodie')) return SURFACE_PRESETS.hoodie
  if (combined.includes('tote') || combined.includes('bolso')) return SURFACE_PRESETS.tote
  return SURFACE_PRESETS.apparel
}

function normalizeId(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── Undo/Redo ─────────────────────────────────────────────────

type HistoryEntry = { surfaces: SurfaceMap; activeId: string }
const MAX_HISTORY = 30

function useHistory(initial: HistoryEntry) {
  const [past, setPast] = useState<HistoryEntry[]>([])
  const [present, setPresent] = useState<HistoryEntry>(initial)
  const [future, setFuture] = useState<HistoryEntry[]>([])

  const push = useCallback((entry: HistoryEntry) => {
    setPast(p => [...p.slice(-(MAX_HISTORY - 1)), present])
    setPresent(entry)
    setFuture([])
  }, [present])

  const undo = useCallback(() => {
    if (past.length === 0) return
    const previous = past[past.length - 1]
    setPast(p => p.slice(0, -1))
    setFuture(f => [present, ...f])
    setPresent(previous)
  }, [past, present])

  const redo = useCallback(() => {
    if (future.length === 0) return
    const next = future[0]
    setFuture(f => f.slice(1))
    setPast(p => [...p, present])
    setPresent(next)
  }, [future, present])

  return { state: present, push, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 }
}

// ─── Component ─────────────────────────────────────────────────

interface MockupCalibratorProps {
  mockup: GarmentMockup & {
    base_products?: {
      name: string
      slug: string
      product_type?: string | null
    } | null
  }
  designs: EmbroideryDesign[]
}

export default function MockupCalibrator({ mockup, designs }: MockupCalibratorProps) {
  // Normalize existing surfaces to mesh format
  const initialSurfaces = useMemo(() => {
    const raw = (mockup.surfaces && typeof mockup.surfaces === 'object' && !Array.isArray(mockup.surfaces)
      ? mockup.surfaces
      : {}) as SurfaceMap

    const normalized: SurfaceMap = {}
    for (const [key, surface] of Object.entries(raw)) {
      normalized[key] = normalizeSurface(surface, DEFAULT_GRID_SIZE)
    }
    return normalized
  }, [mockup.surfaces])

  const initialActiveId = Object.keys(initialSurfaces)[0] || ''
  const mockupVariants = useMemo(() => getMockupVariants(mockup), [mockup])

  const history = useHistory({ surfaces: initialSurfaces, activeId: initialActiveId })
  const { surfaces, activeId } = history.state

  const [editMode, setEditMode] = useState<EditMode>('corners')
  const [draftLabel, setDraftLabel] = useState('Pecho centro')
  const [previewDesignId, setPreviewDesignId] = useState(designs[0]?.id || '')
  const [previewVariantId, setPreviewVariantId] = useState(mockupVariants[0]?.id || '')
  const [isPublic, setIsPublic] = useState(mockup.is_public)
  const [saveMessage, setSaveMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const [dragPointIndex, setDragPointIndex] = useState<number | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 })
  const [assistStatus, setAssistStatus] = useState<AssistStatus>('idle')
  const [assistMessage, setAssistMessage] = useState('')
  const [assistJobId, setAssistJobId] = useState('')
  const [assistProposals, setAssistProposals] = useState<DeformationProposal[]>([])
  const [importJson, setImportJson] = useState('')
  const [activeTab, setActiveTab] = useState<'zones' | 'mesh' | 'preview'>('zones')

  const imageContainerRef = useRef<HTMLDivElement>(null)

  const previewVariant = useMemo(
    () => mockupVariants.find(variant => variant.id === previewVariantId) || mockupVariants[0],
    [mockupVariants, previewVariantId],
  )
  const previewMockupImage = previewVariant?.imageUrl || mockup.image_url
  const previewShadowMap = previewVariant?.shadowMapUrl || mockup.shadow_map_url

  useEffect(() => {
    if (mockupVariants.length > 0 && !mockupVariants.some(variant => variant.id === previewVariantId)) {
      setPreviewVariantId(mockupVariants[0].id)
    }
  }, [mockupVariants, previewVariantId])

  // Synchronize fullscreen state with browser native fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Keyboard shortcuts (Ctrl+S for save, H to toggle sidebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        save()
      }
      
      const target = e.target as HTMLElement
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if (!isTyping) {
        if (e.key.toLowerCase() === 'h') {
          e.preventDefault()
          setShowSidebar(prev => !prev)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [surfaces, isPublic])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const container = document.getElementById('calibrator-container')
      container?.requestFullscreen().catch((err) => {
        console.error('Error entering fullscreen:', err)
      })
    } else {
      document.exitFullscreen()
    }
  }

  const activeSurface = activeId ? surfaces[activeId] : null
  const normalizedActive = activeSurface ? normalizeSurface(activeSurface, DEFAULT_GRID_SIZE) : null
  const shadowIntensity = Math.round((normalizedActive?.shadowOpacity ?? 0.7) * 100)

  // Stable zoom origin to prevent cursor feedback loop when dragging points while zoomed in
  useEffect(() => {
    if (normalizedActive) {
      const pts = normalizedActive.meshPoints
      if (pts && pts.length > 0) {
        let minX = 100, maxX = 0, minY = 100, maxY = 0
        pts.forEach(p => {
          if (p.x < minX) minX = p.x
          if (p.x > maxX) maxX = p.x
          if (p.y < minY) minY = p.y
          if (p.y > maxY) maxY = p.y
        })
        setZoomOrigin({
          x: (minX + maxX) / 2,
          y: (minY + maxY) / 2
        })
      }
    }
  }, [activeId, isZoomed])

  const presetSurfaces = useMemo(
    () => getPresetGroup(
      mockup.base_products?.product_type,
      mockup.base_products?.name,
      mockup.base_products?.slug
    ),
    [mockup.base_products?.product_type, mockup.base_products?.name, mockup.base_products?.slug],
  )
  const previewDesign = useMemo(
    () => designs.find(d => d.id === previewDesignId) || designs[0],
    [designs, previewDesignId],
  )
  const canPublish = Object.keys(surfaces).length > 0

  // Which points to show based on edit mode
  const visiblePointIndices = useMemo(() => {
    if (!normalizedActive) return []
    const gs = normalizedActive.gridSize
    const totalPoints = gs * gs
    const all = Array.from({ length: totalPoints }, (_, i) => i)

    if (editMode === 'preview') return []
    if (editMode === 'corners') {
      return getCornerIndices(gs) as unknown as number[]
    }
    return all // grid mode
  }, [normalizedActive, editMode])

  // ─── Actions ─────────────────────────────────────────────────

  const updateState = (newSurfaces: SurfaceMap, newActiveId?: string) => {
    history.push({ surfaces: newSurfaces, activeId: newActiveId ?? activeId })
  }

  const addSurface = (label = draftLabel, size: CalibrationSurface['size'] = 'medium', explicitId?: string) => {
    const id = explicitId || normalizeId(label || 'zona')
    if (!id) return
    const uniqueId = surfaces[id] ? `${id}-${Object.keys(surfaces).length + 1}` : id
    const next = createMeshSurface(uniqueId, label || uniqueId, mockup.view, size, DEFAULT_GRID_SIZE)
    updateState({ ...surfaces, [uniqueId]: next }, uniqueId)
    setDraftLabel('')
    setEditMode('corners')
    setActiveTab('mesh')
  }

  const deleteSurface = (id: string) => {
    const next = { ...surfaces }
    delete next[id]
    const newActive = activeId === id ? (Object.keys(next)[0] || '') : activeId
    updateState(next, newActive)
    if (Object.keys(next).length === 0) {
      setActiveTab('zones')
    }
  }

  const setActiveId = (id: string) => {
    history.push({ surfaces, activeId: id })
  }

  const updateActiveSurface = (updater: (s: CalibrationSurface) => CalibrationSurface) => {
    if (!activeId || !surfaces[activeId]) return
    updateState({ ...surfaces, [activeId]: updater(surfaces[activeId]) })
  }

  const handleMeshPointMove = (pointIndex: number, newPoint: CalibrationPoint, isShiftPressed = false) => {
    if (!normalizedActive || !activeId) return

    let targetX = newPoint.x
    let targetY = newPoint.y

    if (isZoomed) {
      const S = 2.2
      const Ox = zoomOrigin.x
      const Oy = zoomOrigin.y
      targetX = Ox + (newPoint.x - Ox) / S
      targetY = Oy + (newPoint.y - Oy) / S
    }

    // Ensure within bounds
    targetX = Math.max(0, Math.min(100, targetX))
    targetY = Math.max(0, Math.min(100, targetY))

    let newMeshPoints = [...normalizedActive.meshPoints]

    if (isShiftPressed) {
      const oldPoint = normalizedActive.meshPoints[pointIndex]
      const dx = targetX - oldPoint.x
      const dy = targetY - oldPoint.y

      if (dx !== 0 || dy !== 0) {
        newMeshPoints = normalizedActive.meshPoints.map((p, idx) => {
          if (idx === pointIndex) {
            return {
              x: Number(targetX.toFixed(1)),
              y: Number(targetY.toFixed(1)),
            }
          }
          return {
            x: Math.max(0, Math.min(100, Number((p.x + dx).toFixed(1)))),
            y: Math.max(0, Math.min(100, Number((p.y + dy).toFixed(1)))),
          }
        })
      }
    } else {
      newMeshPoints[pointIndex] = {
        x: Number(targetX.toFixed(1)),
        y: Number(targetY.toFixed(1)),
      }
    }

    // Track pinned points (user-moved)
    const role = getPointRole(pointIndex, normalizedActive.gridSize)
    let newPinned = [...(normalizedActive.pinnedPoints || [])]
    if (!isShiftPressed && role !== 'corner' && !newPinned.includes(pointIndex)) {
      newPinned.push(pointIndex)
    }

    // In corner mode, re-interpolate non-pinned points if we dragged a corner normally
    if (editMode === 'corners' && role === 'corner' && !isShiftPressed) {
      const interpolated = reinterpolateFromCorners(newMeshPoints, newPinned, normalizedActive.gridSize)
      updateState({
        ...surfaces,
        [activeId]: {
          ...normalizedActive,
          meshPoints: interpolated,
          pinnedPoints: newPinned,
        },
      })
    } else {
      updateState({
        ...surfaces,
        [activeId]: {
          ...normalizedActive,
          meshPoints: newMeshPoints,
          pinnedPoints: newPinned,
        },
      })
    }
  }

  const handleResetGrid = () => {
    if (!normalizedActive || !activeId) return
    const interpolated = reinterpolateFromCorners(normalizedActive.meshPoints, [], normalizedActive.gridSize)
    updateState({
      ...surfaces,
      [activeId]: {
        ...normalizedActive,
        meshPoints: interpolated,
        pinnedPoints: [],
      },
    })
  }

  const handleGridSizeChange = (newSize: number) => {
    if (!normalizedActive || !activeId) return
    const corners = getCornerIndices(normalizedActive.gridSize)
    const tl = normalizedActive.meshPoints[corners[0]]
    const tr = normalizedActive.meshPoints[corners[1]]
    const bl = normalizedActive.meshPoints[corners[2]]
    const br = normalizedActive.meshPoints[corners[3]]

    const newMeshPoints = createUniformGrid(tl, tr, bl, br, newSize)

    updateState({
      ...surfaces,
      [activeId]: {
        ...normalizedActive,
        gridSize: newSize,
        meshPoints: newMeshPoints,
        pinnedPoints: [],
      },
    })
  }

  // ─── Pointer handling ────────────────────────────────────────

  const handlePointerDown = (pointIndex: number, e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragPointIndex(pointIndex)
    const container = imageContainerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    handleMeshPointMove(pointIndex, {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    }, e.shiftKey)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragPointIndex === null || !(e.buttons & 1)) return
    const container = imageContainerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    handleMeshPointMove(dragPointIndex, {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    }, e.shiftKey)
  }

  const handlePointerUp = () => {
    setDragPointIndex(null)
  }

  // ─── Assisted deformation ─────────────────────────────────────

  const requestDeformationAssistance = async () => {
    if (!normalizedActive) return

    setAssistStatus('preparing')
    setAssistMessage('Preparando imagen y esquinas de la zona...')
    setAssistProposals([])
    setAssistJobId('')

    try {
      const startResponse = await fetch(`/api/admin/mockups/${mockup.id}/deformation-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surface: normalizedActive,
          variantId: previewVariant?.id || null,
        }),
      })
      const startPayload = await startResponse.json()

      if (!startResponse.ok) {
        throw new Error(startPayload.error || 'No se pudo iniciar la asistencia.')
      }

      const jobId = startPayload.jobId as string
      setAssistJobId(jobId)
      setAssistStatus('queued')
      setAssistMessage('Job enviado a GPU. Esperando turno...')

      for (let attempt = 0; attempt < 90; attempt += 1) {
        await sleep(2000)
        const statusResponse = await fetch(`/api/admin/mockups/${mockup.id}/deformation-jobs/${jobId}`, {
          cache: 'no-store',
        })
        const statusPayload = await statusResponse.json()

        if (!statusResponse.ok) {
          throw new Error(statusPayload.error || 'No se pudo leer el estado del worker.')
        }

        if (statusPayload.status === 'FAILED' || statusPayload.status === 'CANCELLED' || statusPayload.status === 'TIMED_OUT') {
          throw new Error(statusPayload.error || `El worker terminó con estado ${statusPayload.status}.`)
        }

        if (statusPayload.status === 'COMPLETED') {
          const proposals = statusPayload.output?.proposals || []
          if (!Array.isArray(proposals) || proposals.length === 0) {
            throw new Error('El worker no devolvió propuestas de malla.')
          }
          setAssistProposals(proposals)
          setAssistStatus('ready')
          setAssistMessage('Listo. Revisa las propuestas y aplica la que mejor siga la prenda.')
          return
        }

        setAssistStatus('analyzing')
        setAssistMessage(statusPayload.status === 'IN_QUEUE'
          ? 'GPU en cola. Mantén esta pantalla abierta.'
          : 'Analizando textura, relieve y curvatura de la zona...')
      }

      throw new Error('La asistencia tardó demasiado. Intenta de nuevo o usa el modo manual.')
    } catch (error) {
      setAssistStatus('error')
      setAssistMessage(error instanceof Error ? error.message : 'No se pudo completar la asistencia.')
    }
  }

  const applyDeformationProposal = (proposal: DeformationProposal) => {
    if (!normalizedActive || !activeId) return
    const validation = validateSurface({
      ...normalizedActive,
      gridSize: proposal.gridSize,
      meshPoints: proposal.meshPoints,
    })

    if (!validation.ok) {
      setAssistStatus('error')
      setAssistMessage(`La propuesta no es válida: ${validation.errors.join('; ')}`)
      return
    }

    const cornerSet = new Set(getCornerIndices(proposal.gridSize) as unknown as number[])
    const pinnedPoints = proposal.meshPoints
      .map((_, index) => index)
      .filter(index => !cornerSet.has(index))

    updateState({
      ...surfaces,
      [activeId]: {
        ...normalizedActive,
        gridSize: proposal.gridSize,
        meshPoints: proposal.meshPoints.map(point => ({
          x: Number(point.x.toFixed(1)),
          y: Number(point.y.toFixed(1)),
        })),
        pinnedPoints,
        assistSource: proposal.source,
        assistVersion: proposal.workerVersion,
        assistConfidence: proposal.confidence,
        assistWarnings: proposal.warnings,
        generatedAt: new Date().toISOString(),
      },
    })
    setEditMode('preview')
    setAssistStatus('ready')
    setAssistMessage(`Propuesta "${proposal.label}" aplicada. Revisa el preview antes de publicar.`)
  }

  const exportActiveSurface = async () => {
    if (!normalizedActive) return
    const payload = JSON.stringify(normalizedActive, null, 2)
    try {
      await navigator.clipboard.writeText(payload)
      setAssistMessage('JSON copiado al portapapeles.')
    } catch {
      setImportJson(payload)
      setAssistMessage('No se pudo copiar; dejé el JSON en el campo de importación.')
    }
  }

  const importActiveSurface = () => {
    if (!normalizedActive || !activeId || !importJson.trim()) return

    try {
      const parsed = JSON.parse(importJson) as Partial<CalibrationSurface>
      const candidate: CalibrationSurface = {
        ...normalizedActive,
        ...parsed,
        id: activeId,
        label: parsed.label || normalizedActive.label,
        type: 'mesh',
      }
      const validation = validateSurface(candidate)

      if (!validation.ok) {
        throw new Error(validation.errors.join('; '))
      }

      updateState({
        ...surfaces,
        [activeId]: candidate,
      })
      setAssistStatus('ready')
      setAssistMessage('JSON importado en la zona activa.')
    } catch (error) {
      setAssistStatus('error')
      setAssistMessage(error instanceof Error ? error.message : 'JSON inválido.')
    }
  }

  // ─── Save ────────────────────────────────────────────────────

  const save = (publishOverride?: boolean) => {
    const nextIsPublic = typeof publishOverride === 'boolean' ? publishOverride : isPublic
    const nextStatus = nextIsPublic ? 'published' : Object.keys(surfaces).length > 0 ? 'calibrated' : 'needs_calibration'

    setSaveMessage('')
    setIsPublic(nextIsPublic)
    startTransition(async () => {
      try {
        const result = await updateMockupCalibration({
          mockupId: mockup.id,
          surfaces,
          status: nextStatus,
          isPublic: nextIsPublic,
        })
        setSaveMessage(
          nextIsPublic
            ? `✓ Publicado. Ya puede aparecer en Studio público.`
            : `✓ Guardado privado. Para verlo en Studio público usa "Publicar mockup".`,
        )
      } catch (error) {
        setSaveMessage(error instanceof Error ? error.message : 'No se pudo guardar.')
      }
    })
  }

  // ─── Render ──────────────────────────────────────────────────

  const getHandleStyle = (role: 'corner' | 'edge' | 'interior', isPinned: boolean) => {
    if (role === 'corner') return 'h-8 w-8 border-[3px] border-industrial-black bg-yellow-400 shadow-xl z-50 hover:scale-125'
    if (role === 'edge') return 'h-6 w-6 border-2 border-industrial-black bg-orange-400 shadow-lg z-40 hover:scale-125'
    return `h-4 w-4 border-2 ${isPinned ? 'border-blue-700 bg-blue-400' : 'border-blue-400 bg-blue-200'} shadow z-30 hover:scale-150`
  }

  const getHandleLabel = (index: number, gridSize: number) => {
    const [row, col] = indexToRowCol(index, gridSize)
    const role = getPointRole(index, gridSize)
    const suffix = ' (Shift+Arrastrar para mover toda la malla)'
    if (role === 'corner') {
      if (row === 0 && col === 0) return 'Sup. izquierda' + suffix
      if (row === 0 && col === gridSize - 1) return 'Sup. derecha' + suffix
      if (row === gridSize - 1 && col === 0) return 'Inf. izquierda' + suffix
      return 'Inf. derecha' + suffix
    }
    return `Punto (${row}, ${col})` + suffix
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <section className="grid grid-cols-4 gap-2">
        {[
          { step: '1', label: 'Zona', tab: 'zones' as const, done: Object.keys(surfaces).length > 0, detail: `${Object.keys(surfaces).length}` },
          { step: '2', label: 'Mesh', tab: 'mesh' as const, done: !!normalizedActive, detail: normalizedActive ? `${normalizedActive.gridSize}×${normalizedActive.gridSize}` : '' },
          { step: '3', label: 'Probar', tab: 'preview' as const, done: !!previewDesign, detail: '' },
          { step: '4', label: 'Publicar', tab: 'preview' as const, done: isPublic, detail: isPublic ? 'ON' : '' },
        ].map(({ step, label, done, detail, tab }) => (
          <button
            key={step}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`border p-2 bg-white transition-all text-left cursor-pointer hover:border-industrial-black ${done ? 'border-industrial-black' : 'border-industrial-gray/20'}`}
          >
            <div className="flex items-center gap-2">
              <span className={`h-5 w-5 flex-shrink-0 flex items-center justify-center border text-[9px] font-bold ${done ? 'bg-industrial-black text-white border-industrial-black' : 'border-industrial-gray/30 text-industrial-gray'}`}>
                {done ? '✓' : step}
              </span>
              <div className="min-w-0">
                <span className="block font-bold text-[10px] uppercase tracking-widest leading-tight">{label}</span>
                {detail && <span className="block font-mono text-[8px] text-industrial-gray uppercase tracking-widest">{detail}</span>}
              </div>
            </div>
          </button>
        ))}
      </section>

      <div id="calibrator-container" className={isFullscreen 
        ? `fixed inset-0 z-[9999] bg-industrial-light p-6 grid ${showSidebar ? 'grid-cols-[minmax(0,1.35fr)_minmax(400px,0.65fr)]' : 'grid-cols-1'} gap-6 overflow-hidden animate-fade-in h-screen w-screen` 
        : `grid ${showSidebar ? 'grid-cols-[minmax(0,1.35fr)_minmax(400px,0.65fr)]' : 'grid-cols-1'} gap-6`
      }>
        {/* Left: Image + Overlay */}
        <section className={isFullscreen 
          ? "bg-white border border-industrial-gray/20 p-4 flex flex-col justify-center items-center h-full overflow-hidden" 
          : "bg-white border border-industrial-gray/20 p-4"
        }>
          <div className="w-full flex items-center justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray">
                {mockup.base_products?.name || 'Prenda'} / {mockup.view}
              </p>
              <h2 className="font-heading font-black text-xl uppercase tracking-tighter truncate">
                {mockup.name}
              </h2>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Status */}
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${isPublic ? 'bg-green-500' : Object.keys(surfaces).length > 0 ? 'bg-yellow-500' : 'bg-gray-300'}`} />
                <span className="font-mono text-[9px] uppercase tracking-widest text-industrial-gray">
                  {isPublic ? 'Publicado' : Object.keys(surfaces).length > 0 ? 'Calibrado' : 'Pendiente'}
                </span>
              </div>
              {/* Quick Save */}
              <button
                type="button"
                onClick={() => save()}
                disabled={isPending}
                className="h-7 px-3 flex items-center justify-center border border-industrial-black bg-industrial-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-industrial-warning hover:text-industrial-black disabled:opacity-50 transition-colors"
                title="Guardar (Ctrl+S)"
              >
                {isPending ? '...' : 'Guardar'}
              </button>
            </div>
          </div>

          {mockupVariants.length > 1 && (
            <div className="w-full flex items-center gap-1.5 mb-3 overflow-x-auto">
              {mockupVariants.map(variant => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setPreviewVariantId(variant.id)}
                  className={`flex-shrink-0 border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    previewVariant?.id === variant.id
                      ? 'border-industrial-black bg-industrial-black text-white'
                      : 'border-industrial-gray/20 bg-white hover:border-industrial-gray text-industrial-black'
                  }`}
                >
                  {variant.colorName || 'Base'}
                </button>
              ))}
            </div>
          )}

          {/* Unified Toolbar */}
          <div className="w-full flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1">
              {/* Edit Modes */}
              {([
                { mode: 'corners' as EditMode, label: '4 Esquinas', icon: '◇' },
                { mode: 'grid' as EditMode, label: 'Grid', icon: '⊞' },
                { mode: 'preview' as EditMode, label: 'Preview', icon: '◉' },
              ]).map(({ mode, label, icon }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setEditMode(mode)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                    editMode === mode
                      ? 'bg-industrial-black text-white border-industrial-black'
                      : 'bg-white text-industrial-gray border-industrial-gray/20 hover:border-industrial-black hover:text-industrial-black'
                  }`}
                >
                  {icon} {label}
                </button>
              ))}

              {/* Separator */}
              <span className="w-px h-5 bg-industrial-gray/15 mx-1" />

              {/* Undo/Redo */}
              <button
                type="button"
                onClick={history.undo}
                disabled={!history.canUndo}
                className="h-7 w-7 flex items-center justify-center border border-industrial-gray/20 text-xs hover:bg-gray-50 disabled:opacity-30"
                title="Deshacer (Ctrl+Z)"
              >
                ↩
              </button>
              <button
                type="button"
                onClick={history.redo}
                disabled={!history.canRedo}
                className="h-7 w-7 flex items-center justify-center border border-industrial-gray/20 text-xs hover:bg-gray-50 disabled:opacity-30"
                title="Rehacer"
              >
                ↪
              </button>
            </div>

            <div className="flex items-center gap-1">
              {/* Zoom Focus Toggle */}
              {normalizedActive && (
                <button
                  type="button"
                  onClick={() => setIsZoomed(!isZoomed)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                    isZoomed
                      ? 'bg-blue-600 text-white border-blue-600 animate-pulse'
                      : 'bg-white text-industrial-gray border-industrial-gray/20 hover:border-industrial-black hover:text-industrial-black'
                  }`}
                  title="Zoom a zona activa"
                >
                  {isZoomed ? 'Zoom 2.2x' : 'Zoom'}
                </button>
              )}

              {/* Sidebar Toggle */}
              <button
                type="button"
                onClick={() => setShowSidebar(!showSidebar)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                  !showSidebar
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-industrial-gray border-industrial-gray/20 hover:border-industrial-black hover:text-industrial-black'
                }`}
                title="Panel (H)"
              >
                Panel
              </button>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                  isFullscreen
                    ? 'bg-industrial-warning text-industrial-black border-industrial-warning'
                    : 'bg-white text-industrial-gray border-industrial-gray/20 hover:border-industrial-black hover:text-industrial-black'
                }`}
                title="Pantalla completa"
              >
                Full
              </button>
            </div>
          </div>

          {/* Image Canvas Window */}
          <div className={isFullscreen ? "flex-1 min-h-0 w-full flex items-center justify-center" : ""}>
            <div
              ref={imageContainerRef}
              className={isFullscreen 
                ? "relative h-full max-h-full max-w-full aspect-[4/5] bg-gray-100 overflow-hidden border border-industrial-gray/10 select-none mx-auto" 
                : "relative w-full aspect-[4/5] bg-gray-100 overflow-hidden border border-industrial-gray/10 select-none"
              }
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
            {/* Magnifying glass inner wrapper */}
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                transform: isZoomed ? 'scale(2.2)' : 'scale(1)',
                transformOrigin: isZoomed ? `${zoomOrigin.x}% ${zoomOrigin.y}%` : 'center',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform-origin 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* Base mockup image */}
              <Image
                src={previewMockupImage}
                alt={mockup.name}
                fill
                priority
                className="object-contain"
                draggable={false}
              />

              {/* Design overlay with mesh warp */}
              {normalizedActive && previewDesign?.image_url && (
                <MeshWarpOverlay
                  imageUrl={previewDesign.image_url}
                  gridSize={normalizedActive.gridSize}
                  meshPoints={normalizedActive.meshPoints}
                  opacity={normalizedActive.opacity}
                  blendMode={normalizedActive.blendMode}
                />
              )}

              {/* Shadow map */}
              {previewShadowMap && (
                <Image
                  src={previewShadowMap}
                  alt=""
                  fill
                  className="object-contain mix-blend-multiply pointer-events-none"
                  style={{ opacity: shadowIntensity / 100 }}
                  draggable={false}
                />
              )}

              {/* Grid lines visualization */}
              {normalizedActive && editMode !== 'preview' && (
                <svg className="absolute inset-0 z-20 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Draw grid lines */}
                  {Array.from({ length: normalizedActive.gridSize }).map((_, row) => (
                    Array.from({ length: normalizedActive.gridSize - 1 }).map((_, col) => {
                      const idx = row * normalizedActive.gridSize + col
                      const nextIdx = idx + 1
                      const p1 = normalizedActive.meshPoints[idx]
                      const p2 = normalizedActive.meshPoints[nextIdx]
                      return (
                        <line key={`h-${row}-${col}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                          stroke={editMode === 'corners' ? 'rgba(234,179,8,0.3)' : 'rgba(59,130,246,0.4)'}
                          strokeWidth="0.2"
                        />
                      )
                    })
                  ))}
                  {Array.from({ length: normalizedActive.gridSize - 1 }).map((_, row) => (
                    Array.from({ length: normalizedActive.gridSize }).map((_, col) => {
                      const idx = row * normalizedActive.gridSize + col
                      const belowIdx = (row + 1) * normalizedActive.gridSize + col
                      const p1 = normalizedActive.meshPoints[idx]
                      const p2 = normalizedActive.meshPoints[belowIdx]
                      return (
                        <line key={`v-${row}-${col}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                          stroke={editMode === 'corners' ? 'rgba(234,179,8,0.3)' : 'rgba(59,130,246,0.4)'}
                          strokeWidth="0.2"
                        />
                      )
                    })
                  ))}
                  {/* Outer border */}
                  {(() => {
                    const gs = normalizedActive.gridSize
                    const pts = normalizedActive.meshPoints
                    const topEdge = Array.from({ length: gs }, (_, i) => pts[i])
                    const rightEdge = Array.from({ length: gs }, (_, i) => pts[i * gs + gs - 1])
                    const bottomEdge = Array.from({ length: gs }, (_, i) => pts[(gs - 1) * gs + i]).reverse()
                    const leftEdge = Array.from({ length: gs }, (_, i) => pts[i * gs]).reverse()
                    const border = [...topEdge, ...rightEdge.slice(1), ...bottomEdge.slice(1), ...leftEdge.slice(1)]
                    const d = border.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
                    return <path d={d} fill="none" stroke="#eab308" strokeWidth="0.35" strokeDasharray="1 0.8" />
                  })()}
                </svg>
              )}

              {/* Inactive surface indicators */}
              {Object.values(surfaces).filter(s => s.id !== activeId).map(surface => {
                const norm = normalizeSurface(surface, DEFAULT_GRID_SIZE)
                const corners = getCornerIndices(norm.gridSize)
                const pts = corners.map(i => norm.meshPoints[i])
                return (
                  <svg key={surface.id} className="absolute inset-0 z-10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polygon
                      points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="rgba(10,10,10,0.06)"
                      stroke="rgba(10,10,10,0.2)"
                      strokeWidth="0.3"
                    />
                  </svg>
                )
              })}

              {/* Draggable handles */}
              {normalizedActive && visiblePointIndices.map(pointIndex => {
                const point = normalizedActive.meshPoints[pointIndex]
                const role = getPointRole(pointIndex, normalizedActive.gridSize)
                const isPinned = normalizedActive.pinnedPoints?.includes(pointIndex) || false
                const label = getHandleLabel(pointIndex, normalizedActive.gridSize)

                return (
                  <button
                    key={pointIndex}
                    type="button"
                    aria-label={label}
                    title={label}
                    onPointerDown={(e) => handlePointerDown(pointIndex, e)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full cursor-grab active:cursor-grabbing transition-transform ${getHandleStyle(role, isPinned)}`}
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </section>

        {/* Right: Controls */}
        {showSidebar && (
          <aside className="flex flex-col bg-white border border-industrial-gray/20" style={{ height: isFullscreen ? 'calc(100vh - 4.5rem)' : '720px', minHeight: '600px', maxHeight: isFullscreen ? 'calc(100vh - 4.5rem)' : 'calc(100vh - 8rem)' }}>
            {/* Tabs Header */}
            <div className="grid grid-cols-3 border-b border-industrial-gray/20 bg-gray-50 font-mono text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
              <button
                type="button"
                onClick={() => setActiveTab('zones')}
                className={`py-3 text-center border-r border-industrial-gray/10 transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                  activeTab === 'zones'
                    ? 'bg-white border-b-2 border-b-industrial-warning text-industrial-black font-black'
                    : 'text-industrial-gray hover:bg-gray-100 hover:text-industrial-black'
                }`}
              >
                <span>Zonas</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('mesh')}
                className={`py-3 text-center border-r border-industrial-gray/10 transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                  activeTab === 'mesh'
                    ? 'bg-white border-b-2 border-b-industrial-warning text-industrial-black font-black'
                    : 'text-industrial-gray hover:bg-gray-100 hover:text-industrial-black'
                }`}
              >
                <span>Malla</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`py-3 text-center transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-white border-b-2 border-b-industrial-warning text-industrial-black font-black'
                    : 'text-industrial-gray hover:bg-gray-100 hover:text-industrial-black'
                }`}
              >
                <span>Probar</span>
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Tab 1: Zonas */}
              {activeTab === 'zones' && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="font-heading font-black text-base uppercase tracking-tighter">
                    Zonas bordables
                  </h3>

                  <div className="grid grid-cols-2 gap-2">
                    {presetSurfaces.map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => addSurface(preset.label, preset.size, preset.id)}
                        className="border border-industrial-gray/20 px-3 py-3 text-left hover:border-industrial-black hover:bg-gray-50 transition-colors"
                      >
                        <span className="block font-bold text-[10px] uppercase tracking-widest">{preset.label}</span>
                        <span className="block font-mono text-[9px] uppercase tracking-widest text-industrial-gray mt-1">
                          {SIZE_LABELS[preset.size]}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2 border-t border-industrial-gray/10 pt-4">
                    <input
                      type="text"
                      value={draftLabel}
                      onChange={e => setDraftLabel(e.target.value)}
                      className="min-w-0 flex-1 border border-industrial-gray/20 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-industrial-black"
                      placeholder="Nombre de zona..."
                    />
                    <button
                      type="button"
                      onClick={() => addSurface()}
                      className="bg-industrial-black text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-industrial-warning hover:text-industrial-black transition-colors"
                    >
                      Agregar
                    </button>
                  </div>

                  <div className="space-y-2 border-t border-industrial-gray/10 pt-3">
                    {Object.values(surfaces).map(surface => (
                      <button
                        key={surface.id}
                        type="button"
                        onClick={() => {
                          setActiveId(surface.id)
                          setActiveTab('mesh')
                        }}
                        className={`w-full text-left border p-3 transition-colors ${
                          surface.id === activeId ? 'border-industrial-black bg-gray-50' : 'border-industrial-gray/20 hover:border-industrial-gray/50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="block font-bold text-xs uppercase tracking-widest">{surface.label}</span>
                          {surface.id === activeId && <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Activa →</span>}
                        </div>
                        <span className="block font-mono text-[10px] uppercase tracking-widest text-industrial-gray mt-1">
                          {surface.size} / {surface.view} / {(surface as any).gridSize || 2}×{(surface as any).gridSize || 2} mesh
                        </span>
                      </button>
                    ))}
                    {Object.keys(surfaces).length === 0 && (
                      <div className="border border-dashed border-industrial-gray/20 p-5 text-center font-mono text-[10px] uppercase tracking-widest text-industrial-gray">
                        Aún no hay zonas creadas. Usa los presets de arriba para empezar.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Malla (IA y Ajustes de red) */}
              {activeTab === 'mesh' && (
                <div className="space-y-4 animate-fade-in">
                  {!normalizedActive ? (
                    <div className="border border-dashed border-industrial-gray/20 p-8 text-center space-y-4">
                      <p className="font-mono text-[11px] uppercase tracking-widest text-industrial-gray">
                        No hay ninguna zona seleccionada.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('zones')}
                        className="bg-industrial-black text-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-industrial-warning hover:text-industrial-black transition-colors"
                      >
                        ← Seleccionar o Crear Zona
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Assist deformation (IA) */}
                      <section className="space-y-4 border border-industrial-gray/10 p-4 bg-gray-50">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-heading font-black text-sm uppercase tracking-tighter">
                              Asistir deformación
                            </h4>
                          </div>
                          <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase tracking-widest ${
                            assistStatus === 'ready'
                              ? 'border-green-500 text-green-700 bg-green-50'
                              : assistStatus === 'error'
                                ? 'border-red-300 text-red-700 bg-red-50'
                                : assistStatus === 'idle'
                                  ? 'border-industrial-gray/20 text-industrial-gray'
                                  : 'border-industrial-warning text-industrial-black bg-industrial-warning/10'
                          }`}>
                            {ASSIST_STATUS_LABELS[assistStatus]}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={requestDeformationAssistance}
                          disabled={assistStatus === 'preparing' || assistStatus === 'queued' || assistStatus === 'analyzing'}
                          className="w-full bg-industrial-black text-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-industrial-warning hover:text-industrial-black disabled:opacity-50 transition-colors"
                        >
                          {assistStatus === 'preparing' || assistStatus === 'queued' || assistStatus === 'analyzing'
                            ? 'Generando propuestas...'
                            : 'Asistir deformación'}
                        </button>

                        {assistJobId && (
                          <p className="font-mono text-[9px] uppercase tracking-widest text-industrial-gray break-all">
                            Job GPU: {assistJobId}
                          </p>
                        )}

                        {assistMessage && (
                          <p className={`font-mono text-[10px] uppercase tracking-widest ${
                            assistStatus === 'error' ? 'text-red-600' : 'text-industrial-gray'
                          }`}>
                            {assistMessage}
                          </p>
                        )}

                        {assistProposals.length > 0 && (
                          <div className="space-y-2 border-t border-industrial-gray/10 pt-3">
                            <span className="block font-bold text-[9px] uppercase tracking-widest text-industrial-gray">Propuestas encontradas:</span>
                            {assistProposals.map(proposal => (
                              <button
                                key={proposal.id}
                                type="button"
                                onClick={() => applyDeformationProposal(proposal)}
                                className="w-full border border-industrial-gray/20 p-2.5 text-left bg-white hover:border-industrial-black hover:bg-gray-50 transition-colors"
                              >
                                <span className="flex items-center justify-between gap-3">
                                  <span className="font-bold text-[10px] uppercase tracking-widest">{proposal.label}</span>
                                  <span className="font-mono text-[9px] uppercase tracking-widest text-industrial-gray">
                                    {proposal.gridSize}×{proposal.gridSize} / {Math.round(proposal.confidence * 100)}%
                                  </span>
                                </span>
                                {proposal.warnings.length > 0 && (
                                  <span className="block mt-1.5 font-mono text-[9px] uppercase tracking-widest text-industrial-gray">
                                    {proposal.warnings.join(' · ')}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </section>

                      {/* Mesh Settings */}
                      <section className="space-y-4">
                        <div className="flex items-center justify-between border-b border-industrial-gray/10 pb-2">
                          <span className="font-heading font-black text-sm uppercase tracking-tighter">
                            Configuración de malla
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`¿Seguro que deseas eliminar la zona "${normalizedActive.label}"?`)) {
                                deleteSurface(normalizedActive.id)
                              }
                            }}
                            className="text-red-600 text-[10px] font-bold uppercase tracking-widest hover:underline"
                          >
                            Eliminar zona
                          </button>
                        </div>

                        {/* Grid Resolution */}
                        <div>
                          <span className="block font-bold text-xs uppercase tracking-widest mb-2">Resolución del mesh</span>
                          <div className="grid grid-cols-3 gap-2">
                            {GRID_SIZE_OPTIONS.map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleGridSizeChange(opt.value)}
                                className={`border p-2 text-center transition-colors ${
                                  normalizedActive.gridSize === opt.value
                                    ? 'border-industrial-black bg-industrial-black text-white'
                                    : 'border-industrial-gray/20 hover:border-industrial-black bg-white text-industrial-black'
                                }`}
                              >
                                <span className="block font-bold text-xs">{opt.label}</span>
                                <span className="block font-mono text-[8px] uppercase tracking-widest text-current opacity-60 mt-0.5">{opt.description}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Size */}
                        <label className="block">
                          <span className="block font-bold text-xs uppercase tracking-widest mb-1.5">Tamaño recomendado</span>
                          <select
                            value={normalizedActive.size}
                            onChange={e => updateActiveSurface(s => ({ ...s, size: e.target.value as CalibrationSurface['size'] }))}
                            className="w-full border border-industrial-gray/20 px-3 py-2 text-xs font-mono outline-none focus:border-industrial-black"
                          >
                            {Object.entries(SIZE_LABELS).map(([v, l]) => (
                              <option key={v} value={v}>{l}</option>
                            ))}
                          </select>
                        </label>

                        {/* Reset grid */}
                        <button
                          type="button"
                          onClick={handleResetGrid}
                          className="w-full border border-industrial-gray/20 bg-white px-3 py-2.5 text-center font-bold text-[10px] uppercase tracking-widest hover:border-industrial-black hover:bg-gray-50 transition-colors"
                        >
                          ↺ Resetear grid (re-interpolar)
                        </button>
                      </section>

                      {/* Import/Export advanced (Details) */}
                      <details className="group border border-industrial-gray/20 mt-4 bg-white">
                        <summary className="flex justify-between items-center p-3 cursor-pointer select-none font-mono text-[9px] uppercase tracking-widest hover:bg-gray-50">
                          <span>JSON Avanzado (Importar/Exportar)</span>
                          <span className="transition-transform group-open:rotate-180 text-[8px]">▼</span>
                        </summary>
                        <div className="p-3 border-t border-industrial-gray/10 bg-gray-50 space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={exportActiveSurface}
                              className="bg-white border border-industrial-gray/20 px-3 py-2 text-[9px] font-bold uppercase tracking-widest hover:border-industrial-black"
                            >
                              Exportar JSON
                            </button>
                            <button
                              type="button"
                              onClick={importActiveSurface}
                              className="bg-white border border-industrial-gray/20 px-3 py-2 text-[9px] font-bold uppercase tracking-widest hover:border-industrial-black"
                            >
                              Importar JSON
                            </button>
                          </div>
                          <textarea
                            value={importJson}
                            onChange={event => setImportJson(event.target.value)}
                            className="min-h-[80px] w-full border border-industrial-gray/20 bg-white px-3 py-2 text-[9px] font-mono outline-none focus:border-industrial-black"
                            placeholder="Pega aquí una grilla exportada para reemplazar la zona activa..."
                          />
                        </div>
                      </details>
                    </>
                  )}
                </div>
              )}

              {/* Tab 3: Apariencia, Prueba y Publicación */}
              {activeTab === 'preview' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Test Design Selection */}
                  <section className="space-y-3">
                    <label className="block">
                      <span className="block font-bold text-xs uppercase tracking-widest mb-1.5">Diseño de prueba</span>
                      <select
                        value={previewDesignId}
                        onChange={e => setPreviewDesignId(e.target.value)}
                        className="w-full border border-industrial-gray/20 px-3 py-2 text-xs font-mono outline-none focus:border-industrial-black"
                      >
                        {designs.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </label>
                  </section>

                  {/* Render parameters (only if active zone) */}
                  {normalizedActive && (
                    <section className="space-y-4 border-t border-industrial-gray/10 pt-3">
                      <span className="block font-bold text-[10px] uppercase tracking-widest text-industrial-gray">
                        Apariencia en zona activa ({normalizedActive.label}):
                      </span>

                      {/* Opacity */}
                      <label className="block">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs uppercase tracking-widest">Opacidad</span>
                          <span className="font-mono text-[10px] font-bold">{Math.round((normalizedActive.opacity ?? 0.94) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={Math.round((normalizedActive.opacity ?? 0.94) * 100)}
                          onChange={e => updateActiveSurface(s => ({ ...s, opacity: Number(e.target.value) / 100 }))}
                          className="w-full accent-yellow-500"
                        />
                      </label>

                      {/* Blend Mode */}
                      <div>
                        <span className="block font-bold text-xs uppercase tracking-widest mb-2">Modo de mezcla</span>
                        <div className="grid grid-cols-3 gap-2">
                          {BLEND_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => updateActiveSurface(s => ({ ...s, blendMode: opt.value }))}
                              className={`border px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors ${
                                (normalizedActive.blendMode || 'multiply') === opt.value
                                  ? 'border-industrial-black bg-industrial-black text-white'
                                  : 'border-industrial-gray/20 bg-white hover:border-industrial-black'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Shadow map intensity */}
                      {previewShadowMap && (
                        <label className="block">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-xs uppercase tracking-widest">Intensidad de sombras</span>
                            <span className="font-mono text-[10px] font-bold">{shadowIntensity}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={shadowIntensity}
                            onChange={e => updateActiveSurface(s => ({ ...s, shadowOpacity: Number(e.target.value) / 100 }))}
                            className="w-full accent-yellow-500"
                          />
                        </label>
                      )}
                    </section>
                  )}

                  {/* Name field (Fine tuning) */}
                  {normalizedActive && (
                    <label className="block border-t border-industrial-gray/10 pt-3">
                      <span className="block font-bold text-xs uppercase tracking-widest mb-1.5">Nombre visible de zona</span>
                      <input
                        type="text"
                        value={normalizedActive.label}
                        onChange={e => updateActiveSurface(s => ({ ...s, label: e.target.value }))}
                        className="w-full border border-industrial-gray/20 px-3 py-2 text-xs font-mono outline-none focus:border-industrial-black"
                      />
                    </label>
                  )}

                  {/* Save and Publish */}
                  <section className="space-y-4 border-t border-industrial-gray/10 pt-4">
                    <h4 className="font-heading font-black text-sm uppercase tracking-tighter">
                      Publicación
                    </h4>

                    <label className="flex items-center justify-between gap-4 border border-industrial-gray/20 p-3 bg-gray-50">
                      <span>
                        <span className="block font-bold text-xs uppercase tracking-widest">Estado público</span>
                        <span className="block font-mono text-[9px] uppercase tracking-widest text-industrial-gray mt-0.5">
                          {isPublic ? 'Visible en el Studio público.' : 'Privado hasta que lo publiques.'}
                        </span>
                      </span>
                      <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase tracking-widest ${isPublic ? 'border-green-500 text-green-700 bg-green-50' : 'border-gray-300 text-gray-500 bg-gray-50'}`}>
                        {isPublic ? 'Publicado' : 'Privado'}
                      </span>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => save(false)}
                        disabled={isPending}
                        className="w-full border border-industrial-gray/30 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-industrial-black hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        {isPending ? 'Guardando...' : 'Guardar privado'}
                      </button>
                      <button
                        type="button"
                        onClick={() => save(true)}
                        disabled={isPending || !canPublish}
                        className="w-full bg-industrial-warning px-4 py-3 text-[10px] font-black uppercase tracking-widest text-industrial-black hover:bg-industrial-black hover:text-white disabled:opacity-50 transition-colors"
                      >
                        Publicar mockup
                      </button>
                    </div>

                    {!canPublish && (
                      <p className="font-mono text-[9px] uppercase tracking-widest text-red-650">
                        Crea al menos una zona bordable antes de publicar.
                      </p>
                    )}

                    {saveMessage && (
                      <p className={`font-mono text-[10px] uppercase tracking-widest ${saveMessage.startsWith('✓') ? 'text-green-600' : 'text-industrial-gray'}`}>
                        {saveMessage}
                      </p>
                    )}
                  </section>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
