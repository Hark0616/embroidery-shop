'use client'

import Image from 'next/image'
import { useMemo, useState, useTransition } from 'react'
import { updateMockupCalibration } from '@/lib/actions/mockups'
import type { CalibrationPoint, CalibrationSurface, EmbroideryDesign, GarmentMockup } from '@/lib/types/database'
import QuadWarpOverlay from '@/components/studio/QuadWarpOverlay'

type SurfaceMap = Record<string, CalibrationSurface>
type CornerKey = keyof CalibrationSurface['points']

const CORNERS: Array<{ key: CornerKey; label: string }> = [
  { key: 'topLeft', label: 'Superior izquierda' },
  { key: 'topRight', label: 'Superior derecha' },
  { key: 'bottomRight', label: 'Inferior derecha' },
  { key: 'bottomLeft', label: 'Inferior izquierda' },
]

const SIZE_LABELS = {
  small: 'Pequeño',
  medium: 'Mediano',
  large: 'Grande',
}

function createSurface(id: string, label: string, view: CalibrationSurface['view']): CalibrationSurface {
  return {
    id,
    label,
    type: 'quad',
    view,
    size: 'medium',
    points: {
      topLeft: { x: 36, y: 30 },
      topRight: { x: 64, y: 30 },
      bottomRight: { x: 64, y: 55 },
      bottomLeft: { x: 36, y: 55 },
    },
    opacity: 0.94,
    blendMode: 'multiply',
  }
}

function surfaceToPolygon(surface: CalibrationSurface) {
  const { topLeft, topRight, bottomRight, bottomLeft } = surface.points
  return `${topLeft.x}% ${topLeft.y}%, ${topRight.x}% ${topRight.y}%, ${bottomRight.x}% ${bottomRight.y}%, ${bottomLeft.x}% ${bottomLeft.y}%`
}

function normalizeId(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface MockupCalibratorProps {
  mockup: GarmentMockup & {
    base_products?: {
      name: string
      slug: string
    } | null
  }
  designs: EmbroideryDesign[]
}

export default function MockupCalibrator({ mockup, designs }: MockupCalibratorProps) {
  const initialSurfaces = (mockup.surfaces && typeof mockup.surfaces === 'object' && !Array.isArray(mockup.surfaces)
    ? mockup.surfaces
    : {}) as SurfaceMap

  const [surfaces, setSurfaces] = useState<SurfaceMap>(initialSurfaces)
  const [activeId, setActiveId] = useState(Object.keys(initialSurfaces)[0] || '')
  const [draftLabel, setDraftLabel] = useState('Pecho centro')
  const [previewDesignId, setPreviewDesignId] = useState(designs[0]?.id || '')
  const [isPublic, setIsPublic] = useState(mockup.is_public)
  const [saveMessage, setSaveMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const activeSurface = activeId ? surfaces[activeId] : null
  const previewDesign = useMemo(
    () => designs.find(design => design.id === previewDesignId) || designs[0],
    [designs, previewDesignId],
  )

  const status = isPublic ? 'published' : Object.keys(surfaces).length > 0 ? 'calibrated' : 'needs_calibration'

  const addSurface = () => {
    const id = normalizeId(draftLabel || 'zona')
    if (!id) return

    const uniqueId = surfaces[id] ? `${id}-${Object.keys(surfaces).length + 1}` : id
    const next = createSurface(uniqueId, draftLabel || uniqueId, mockup.view)
    setSurfaces(prev => ({ ...prev, [uniqueId]: next }))
    setActiveId(uniqueId)
    setDraftLabel('')
  }

  const deleteSurface = (id: string) => {
    setSurfaces(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    if (activeId === id) {
      setActiveId('')
    }
  }

  const updateSurface = (id: string, updater: (surface: CalibrationSurface) => CalibrationSurface) => {
    setSurfaces(prev => {
      const current = prev[id]
      if (!current) return prev
      return { ...prev, [id]: updater(current) }
    })
  }

  const updatePoint = (corner: CornerKey, point: CalibrationPoint) => {
    if (!activeId) return
    updateSurface(activeId, surface => ({
      ...surface,
      points: {
        ...surface.points,
        [corner]: {
          x: Math.max(0, Math.min(100, Number(point.x.toFixed(1)))),
          y: Math.max(0, Math.min(100, Number(point.y.toFixed(1)))),
        },
      },
    }))
  }

  const handlePointerMove = (corner: CornerKey, event: React.PointerEvent<HTMLButtonElement>) => {
    if (!(event.buttons & 1)) return
    const rect = event.currentTarget.parentElement?.getBoundingClientRect()
    if (!rect) return
    updatePoint(corner, {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    })
  }

  const save = () => {
    setSaveMessage('')
    startTransition(async () => {
      try {
        const result = await updateMockupCalibration({
          mockupId: mockup.id,
          surfaces,
          status,
          isPublic,
        })
        setSaveMessage(`Guardado como ${result.status}.`)
      } catch (error) {
        setSaveMessage(error instanceof Error ? error.message : 'No se pudo guardar.')
      }
    })
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)] gap-6">
      <section className="bg-white border border-industrial-gray/20 p-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray">
              {mockup.base_products?.name || 'Prenda'} / {mockup.view}
            </p>
            <h2 className="font-heading font-black text-2xl uppercase tracking-tighter">
              {mockup.name}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isPublic ? 'bg-green-500' : Object.keys(surfaces).length > 0 ? 'bg-industrial-warning' : 'bg-gray-300'}`} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray">
              {isPublic ? 'Publicado' : Object.keys(surfaces).length > 0 ? 'Calibrado privado' : 'Pendiente'}
            </span>
          </div>
        </div>

        <div className="relative w-full aspect-[4/5] bg-gray-100 overflow-hidden border border-industrial-gray/10 select-none">
          <Image
            src={mockup.image_url}
            alt={mockup.name}
            fill
            priority
            className="object-contain"
            draggable={false}
          />

          {activeSurface && previewDesign?.image_url && (
            <QuadWarpOverlay imageUrl={previewDesign.image_url} surface={activeSurface} />
          )}

          {mockup.shadow_map_url && (
            <Image
              src={mockup.shadow_map_url}
              alt=""
              fill
              className="object-contain mix-blend-multiply opacity-70 pointer-events-none"
              draggable={false}
            />
          )}

          {Object.values(surfaces).map(surface => (
            <div
              key={surface.id}
              className={`absolute inset-0 ${surface.id === activeId ? 'z-20' : 'z-10'}`}
              style={{
                clipPath: `polygon(${surfaceToPolygon(surface)})`,
                backgroundColor: surface.id === activeId ? 'rgba(234,179,8,0.14)' : 'rgba(10,10,10,0.06)',
                border: surface.id === activeId ? '1px solid rgba(234,179,8,0.7)' : '1px solid rgba(10,10,10,0.2)',
              }}
            />
          ))}

          {activeSurface && (
            <svg className="absolute inset-0 z-30 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polygon
                points={Object.values(activeSurface.points).map(point => `${point.x},${point.y}`).join(' ')}
                fill="none"
                stroke="#eab308"
                strokeWidth="0.35"
                strokeDasharray="1 0.8"
              />
              <line x1={activeSurface.points.topLeft.x} y1={activeSurface.points.topLeft.y} x2={activeSurface.points.bottomRight.x} y2={activeSurface.points.bottomRight.y} stroke="rgba(234,179,8,0.35)" strokeWidth="0.18" />
              <line x1={activeSurface.points.topRight.x} y1={activeSurface.points.topRight.y} x2={activeSurface.points.bottomLeft.x} y2={activeSurface.points.bottomLeft.y} stroke="rgba(234,179,8,0.35)" strokeWidth="0.18" />
            </svg>
          )}

          {activeSurface && CORNERS.map(({ key, label }) => {
            const point = activeSurface.points[key]
            return (
              <button
                key={key}
                type="button"
                aria-label={label}
                onPointerDown={event => {
                  event.currentTarget.setPointerCapture(event.pointerId)
                  handlePointerMove(key, event)
                }}
                onPointerMove={event => handlePointerMove(key, event)}
                className="absolute z-40 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-industrial-black bg-industrial-warning shadow-lg cursor-grab active:cursor-grabbing"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
              />
            )
          })}
        </div>
      </section>

      <aside className="space-y-4">
        <section className="bg-white border border-industrial-gray/20 p-5">
          <h3 className="font-heading font-black text-lg uppercase tracking-tighter mb-1">
            Superficies bordables
          </h3>
          <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray mb-4">
            Crea una zona por área real donde la máquina puede bordar.
          </p>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={draftLabel}
              onChange={event => setDraftLabel(event.target.value)}
              className="min-w-0 flex-1 border border-industrial-gray/20 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-industrial-black"
              placeholder="Pecho centro"
            />
            <button
              type="button"
              onClick={addSurface}
              className="bg-industrial-black text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-industrial-warning hover:text-industrial-black"
            >
              Agregar
            </button>
          </div>

          <div className="space-y-2">
            {Object.values(surfaces).map(surface => (
              <button
                key={surface.id}
                type="button"
                onClick={() => setActiveId(surface.id)}
                className={`w-full text-left border p-3 transition-colors ${surface.id === activeId ? 'border-industrial-black bg-gray-50' : 'border-industrial-gray/20 hover:border-industrial-gray/50'}`}
              >
                <span className="block font-bold text-xs uppercase tracking-widest">{surface.label}</span>
                <span className="block font-mono text-[10px] uppercase tracking-widest text-industrial-gray">
                  {surface.size} / {surface.view}
                </span>
              </button>
            ))}
            {Object.keys(surfaces).length === 0 && (
              <div className="border border-dashed border-industrial-gray/20 p-5 text-center font-mono text-[10px] uppercase tracking-widest text-industrial-gray">
                Aún no hay zonas calibradas.
              </div>
            )}
          </div>
        </section>

        {activeSurface && (
          <section className="bg-white border border-industrial-gray/20 p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-heading font-black text-lg uppercase tracking-tighter">
                  Ajuste fino
                </h3>
                <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray">
                  {activeSurface.label}
                </p>
              </div>
              <button
                type="button"
                onClick={() => deleteSurface(activeSurface.id)}
                className="text-red-600 text-[10px] font-bold uppercase tracking-widest hover:underline"
              >
                Eliminar
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="block font-bold text-xs uppercase tracking-widest mb-2">Nombre visible</span>
                <input
                  type="text"
                  value={activeSurface.label}
                  onChange={event => updateSurface(activeSurface.id, surface => ({ ...surface, label: event.target.value }))}
                  className="w-full border border-industrial-gray/20 px-3 py-2 text-sm font-mono outline-none focus:border-industrial-black"
                />
              </label>

              <label className="block">
                <span className="block font-bold text-xs uppercase tracking-widest mb-2">Tamaño recomendado</span>
                <select
                  value={activeSurface.size}
                  onChange={event => updateSurface(activeSurface.id, surface => ({ ...surface, size: event.target.value as CalibrationSurface['size'] }))}
                  className="w-full border border-industrial-gray/20 px-3 py-2 text-sm font-mono outline-none focus:border-industrial-black"
                >
                  {Object.entries(SIZE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>

              {CORNERS.map(({ key, label }) => {
                const point = activeSurface.points[key]
                return (
                  <div key={key} className="grid grid-cols-[1fr_74px_74px] gap-2 items-end">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray pb-2">
                      {label}
                    </span>
                    <label>
                      <span className="block font-mono text-[9px] uppercase text-industrial-gray mb-1">X</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={point.x}
                        onChange={event => updatePoint(key, { x: Number(event.target.value), y: point.y })}
                        className="w-full border border-industrial-gray/20 px-2 py-2 text-xs font-mono"
                      />
                    </label>
                    <label>
                      <span className="block font-mono text-[9px] uppercase text-industrial-gray mb-1">Y</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={point.y}
                        onChange={event => updatePoint(key, { x: point.x, y: Number(event.target.value) })}
                        className="w-full border border-industrial-gray/20 px-2 py-2 text-xs font-mono"
                      />
                    </label>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <section className="bg-white border border-industrial-gray/20 p-5">
          <h3 className="font-heading font-black text-lg uppercase tracking-tighter mb-4">
            Prueba y publicación
          </h3>

          <label className="block mb-4">
            <span className="block font-bold text-xs uppercase tracking-widest mb-2">Diseño de prueba</span>
            <select
              value={previewDesignId}
              onChange={event => setPreviewDesignId(event.target.value)}
              className="w-full border border-industrial-gray/20 px-3 py-2 text-sm font-mono outline-none focus:border-industrial-black"
            >
              {designs.map(design => (
                <option key={design.id} value={design.id}>{design.name}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center justify-between gap-4 border border-industrial-gray/20 p-3 mb-4">
            <span>
              <span className="block font-bold text-xs uppercase tracking-widest">Publicar mockup</span>
              <span className="block font-mono text-[10px] uppercase tracking-widest text-industrial-gray">
                Solo si ya se ve bien con diseños de prueba.
              </span>
            </span>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={event => setIsPublic(event.target.checked)}
              className="h-5 w-5"
            />
          </label>

          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="w-full bg-industrial-warning px-5 py-4 text-xs font-black uppercase tracking-widest text-industrial-black hover:bg-industrial-black hover:text-white disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : 'Guardar calibración'}
          </button>

          {saveMessage && (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-industrial-gray">
              {saveMessage}
            </p>
          )}
        </section>
      </aside>
    </div>
  )
}
