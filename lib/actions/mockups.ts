'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { uploadImage } from './storage'
import type { CalibrationSurface, MockupVariant } from '@/lib/types/database'

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
  const redirectTo = formData.get('redirect_to') as string | null
  const variantCount = Number(formData.get('variant_count') || 0)

  if (!productId || !name) {
    throw new Error('Product and name are required')
  }

  let shadowMapUrl: string | null = null
  if (shadowFile && shadowFile.size > 0) {
    shadowMapUrl = await uploadImage(shadowFile, 'products', 'mockup-shadows')
  }

  const variants: MockupVariant[] = []

  if (variantCount > 0) {
    for (let index = 0; index < variantCount; index += 1) {
      const variantColor = formData.get(`variant_color_${index}`) as string
      const variantFile = formData.get(`variant_image_${index}`) as File

      if (!variantFile || variantFile.size === 0) {
        continue
      }

      const variantImageUrl = await uploadImage(variantFile, 'products', 'mockups')
      if (!variantImageUrl) {
        throw new Error(`Failed to upload mockup image for ${variantColor || `variant ${index + 1}`}`)
      }

      variants.push({
        id: slugify(variantColor || `variante-${index + 1}`),
        colorName: variantColor || null,
        imageUrl: variantImageUrl,
        shadowMapUrl,
        isPrimary: variants.length === 0,
      })
    }
  }

  if (variants.length === 0) {
    if (!file || file.size === 0) {
      throw new Error('Mockup image is required')
    }

    const imageUrl = await uploadImage(file, 'products', 'mockups')
    if (!imageUrl) {
      throw new Error('Failed to upload mockup image')
    }

    variants.push({
      id: slugify(colorName || 'default'),
      colorName,
      imageUrl,
      shadowMapUrl,
      isPrimary: true,
    })
  }

  const primaryVariant = variants[0]

  const slug = slugify(rawSlug || name)

  const { data: mockup, error } = await supabase.from('garment_mockups').insert({
    product_id: productId,
    name,
    slug,
    view,
    color_name: primaryVariant.colorName,
    image_url: primaryVariant.imageUrl,
    shadow_map_url: shadowMapUrl,
    variants,
    status: 'needs_calibration',
    is_public: false,
    surfaces: {},
  }).select('id').single()

  if (error) {
    console.error('Error creating mockup:', error)
    throw new Error('Failed to create mockup')
  }

  revalidatePath('/admin/mockups')
  revalidatePath(`/admin/prendas/${productId}`)

  if (redirectTo === 'calibrator' && mockup?.id) {
    redirect(`/admin/mockups/${mockup.id}?from_product=${productId}`)
  }

  if (redirectTo === 'product') {
    redirect(`/admin/prendas/${productId}`)
  }

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

export async function deleteMockupAction(formData: FormData) {
  await requireAdmin()
  const mockupId = formData.get('mockup_id') as string
  const productId = formData.get('product_id') as string

  if (!mockupId) throw new Error('Mockup ID is required')

  const supabase = await createClient()
  if (!supabase) throw new Error('Supabase client not initialized')

  const { error } = await supabase
    .from('garment_mockups')
    .delete()
    .eq('id', mockupId)

  if (error) {
    console.error('Error deleting mockup:', error)
    throw new Error('Failed to delete mockup')
  }

  revalidatePath('/admin/mockups')
  revalidatePath('/studio')
  revalidatePath('/catalog')

  if (productId) {
    revalidatePath(`/admin/prendas/${productId}`)
    redirect(`/admin/prendas/${productId}`)
  } else {
    redirect('/admin/mockups')
  }
}
