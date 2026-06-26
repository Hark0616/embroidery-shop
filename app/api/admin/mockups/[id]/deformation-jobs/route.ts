import { NextResponse, type NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getCornerIndices, normalizeSurface } from '@/lib/mesh-utils'
import { hasRunPodDeformationConfig, startRunPodDeformationJob } from '@/lib/deformation/runpod'
import type { CalibrationSurface, MockupVariant } from '@/lib/types/database'
import type { DeformationGridSize } from '@/lib/deformation/types'

type RouteContext = {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin()

    if (!hasRunPodDeformationConfig()) {
      return NextResponse.json(
        {
          error: 'RunPod no está configurado. Define RUNPOD_DEFORMATION_ENDPOINT_ID y RUNPOD_API_KEY.',
        },
        { status: 503 },
      )
    }

    const body = await request.json()
    const surface = body.surface as CalibrationSurface | undefined
    const variantId = typeof body.variantId === 'string' ? body.variantId : null

    if (!surface) {
      return NextResponse.json({ error: 'Surface is required' }, { status: 400 })
    }

    const normalized = normalizeSurface(surface)
    const cornerIndices = getCornerIndices(normalized.gridSize)
    const corners = {
      topLeft: normalized.meshPoints[cornerIndices[0]],
      topRight: normalized.meshPoints[cornerIndices[1]],
      bottomLeft: normalized.meshPoints[cornerIndices[2]],
      bottomRight: normalized.meshPoints[cornerIndices[3]],
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 })
    }

    const { data: mockup, error } = await supabase
      .from('garment_mockups')
      .select('*, base_products(name, slug, product_type)')
      .eq('id', params.id)
      .single()

    if (error || !mockup) {
      return NextResponse.json({ error: 'Mockup not found' }, { status: 404 })
    }

    const variants = Array.isArray(mockup.variants) ? mockup.variants as MockupVariant[] : []
    const selectedVariant = variantId ? variants.find(variant => variant.id === variantId) : null
    const imageUrl = selectedVariant?.imageUrl || mockup.image_url

    if (!imageUrl) {
      return NextResponse.json({ error: 'Mockup image is required' }, { status: 400 })
    }

    const gridSize = (normalized.gridSize === 7 ? 7 : normalized.gridSize === 3 ? 3 : 5) as DeformationGridSize
    const baseProduct = Array.isArray(mockup.base_products) ? mockup.base_products[0] : mockup.base_products

    const job = await startRunPodDeformationJob({
      imageUrl,
      surfaceId: normalized.id,
      gridSize,
      corners,
      coordinateSpace: {
        type: 'container-percent',
        aspectRatio: 0.8,
        objectFit: 'contain',
      },
      garmentType: baseProduct?.product_type || baseProduct?.name || null,
      view: normalized.view,
      variantId,
    })

    return NextResponse.json(job)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not start deformation job' },
      { status: 500 },
    )
  }
}

