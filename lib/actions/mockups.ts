'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { uploadImage } from './storage'
import type { CalibrationSurface } from '@/lib/types/database'

type MockupStatus = 'draft' | 'needs_calibration' | 'calibrated' | 'published'

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function createMockup(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }

  const productId = formData.get('product_id') as string
  const name = formData.get('name') as string
  const rawSlug = formData.get('slug') as string
  const view = (formData.get('view') as string) || 'front'
  const colorName = (formData.get('color_name') as string) || null
  const file = formData.get('image') as File
  const shadowFile = formData.get('shadow_map') as File | null

  if (!productId || !name) {
    throw new Error('Product and name are required')
  }

  if (!file || file.size === 0) {
    throw new Error('Mockup image is required')
  }

  const imageUrl = await uploadImage(file, 'products', 'mockups')
  if (!imageUrl) {
    throw new Error('Failed to upload mockup image')
  }

  let shadowMapUrl: string | null = null
  if (shadowFile && shadowFile.size > 0) {
    shadowMapUrl = await uploadImage(shadowFile, 'products', 'mockup-shadows')
  }

  const slug = slugify(rawSlug || name)

  const { error } = await supabase.from('garment_mockups').insert({
    product_id: productId,
    name,
    slug,
    view,
    color_name: colorName,
    image_url: imageUrl,
    shadow_map_url: shadowMapUrl,
    status: 'needs_calibration',
    is_public: false,
    surfaces: {},
  })

  if (error) {
    console.error('Error creating mockup:', error)
    throw new Error('Failed to create mockup')
  }

  revalidatePath('/admin/mockups')
  redirect('/admin/mockups')
}

export async function updateMockupCalibration({
  mockupId,
  surfaces,
  status,
  isPublic,
}: {
  mockupId: string
  surfaces: Record<string, CalibrationSurface>
  status: MockupStatus
  isPublic: boolean
}) {
  await requireAdmin()
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }

  const hasSurfaces = Object.keys(surfaces).length > 0
  if ((status === 'calibrated' || status === 'published' || isPublic) && !hasSurfaces) {
    throw new Error('A mockup needs at least one calibrated surface before publishing')
  }

  const nextStatus: MockupStatus = isPublic ? 'published' : status

  const { error } = await supabase
    .from('garment_mockups')
    .update({
      surfaces,
      status: nextStatus,
      is_public: isPublic,
    })
    .eq('id', mockupId)

  if (error) {
    console.error('Error updating mockup calibration:', error)
    throw new Error('Failed to update mockup calibration')
  }

  revalidatePath('/admin/mockups')
  revalidatePath('/studio')
  revalidatePath('/catalog')

  return { ok: true, status: nextStatus }
}
