'use server'

import { requireAdmin } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { uploadImage } from './storage'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseList(value: FormDataEntryValue | null) {
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

async function getUniqueSlug(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  table: 'product_drops' | 'ready_products',
  value: string,
) {
  const baseSlug = slugify(value) || `${table}-${Date.now()}`
  let candidate = baseSlug
  let suffix = 2

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .eq('slug', candidate)
      .limit(1)

    if (error) {
      console.error(`Error checking ${table} slug:`, error)
      throw new Error('No se pudo validar el slug.')
    }

    if (!data || data.length === 0) {
      return candidate
    }

    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

export async function createDrop(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }

  const name = String(formData.get('name') || '').trim()
  const rawSlug = String(formData.get('slug') || '').trim()
  const description = String(formData.get('description') || '').trim() || null
  const status = (String(formData.get('status') || 'draft') || 'draft') as 'draft' | 'published' | 'hidden'
  const sortOrder = parseNumber(formData.get('sort_order'))
  const imageFile = formData.get('image') as File | null

  if (!name) {
    throw new Error('El nombre del drop es obligatorio.')
  }

  const slug = await getUniqueSlug(supabase, 'product_drops', rawSlug || name)
  let imageUrl: string | null = null

  if (imageFile && imageFile.size > 0) {
    imageUrl = await uploadImage(imageFile, 'products', 'drops')
    if (!imageUrl) throw new Error('No se pudo subir la imagen del drop.')
  }

  const { error } = await supabase.from('product_drops').insert({
    name,
    slug,
    description,
    image_url: imageUrl,
    status,
    sort_order: sortOrder,
  })

  if (error) {
    console.error('Error creating drop:', error)
    throw new Error('No se pudo crear el drop.')
  }

  revalidatePath('/')
  revalidatePath('/shop')
  revalidatePath('/admin/recomendados')
  redirect('/admin/recomendados')
}

export async function createReadyProduct(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }

  const name = String(formData.get('name') || '').trim()
  const rawSlug = String(formData.get('slug') || '').trim()
  const dropId = String(formData.get('drop_id') || '').trim() || null
  const baseProductId = String(formData.get('base_product_id') || '').trim() || null
  const designId = String(formData.get('design_id') || '').trim() || null
  const sku = String(formData.get('sku') || '').trim() || null
  const shortDescription = String(formData.get('short_description') || '').trim() || null
  const description = String(formData.get('description') || '').trim() || null
  const status = (String(formData.get('status') || 'draft') || 'draft') as 'draft' | 'published' | 'hidden' | 'sold_out'
  const primaryColor = String(formData.get('primary_color') || '').trim() || null
  const availableColors = parseList(formData.get('available_colors'))
  const availableSizes = parseList(formData.get('available_sizes'))
  const tags = parseList(formData.get('tags')).map(tag => tag.toLowerCase())
  const price = parseNumber(formData.get('price'), NaN)
  const compareAtRaw = String(formData.get('compare_at_price') || '').trim()
  const compareAtPrice = compareAtRaw ? parseNumber(compareAtRaw) : null
  const isFeatured = formData.get('is_featured') === 'on'
  const sortOrder = parseNumber(formData.get('sort_order'))
  const heroFile = formData.get('hero_image') as File | null
  const galleryFiles = formData.getAll('gallery_images') as File[]

  if (!name) throw new Error('El nombre del producto armado es obligatorio.')
  if (!Number.isFinite(price) || price <= 0) throw new Error('El precio final debe ser mayor a cero.')
  if (availableSizes.length === 0) throw new Error('Agrega al menos una talla disponible.')
  if (!primaryColor && availableColors.length === 0) throw new Error('Agrega al menos un color o color principal.')
  if (!heroFile || heroFile.size === 0) throw new Error('La foto principal final es obligatoria.')

  const slug = await getUniqueSlug(supabase, 'ready_products', rawSlug || name)
  const heroImageUrl = await uploadImage(heroFile, 'products', 'ready-products')

  if (!heroImageUrl) {
    throw new Error('No se pudo subir la foto principal.')
  }

  const galleryImageUrls: string[] = []
  for (const file of galleryFiles) {
    if (!file || file.size === 0) continue
    const uploaded = await uploadImage(file, 'products', 'ready-products/gallery')
    if (uploaded) galleryImageUrls.push(uploaded)
  }

  const normalizedColors = availableColors.length > 0
    ? availableColors
    : primaryColor
      ? [primaryColor]
      : []

  const { error } = await supabase.from('ready_products').insert({
    drop_id: dropId,
    base_product_id: baseProductId,
    design_id: designId,
    name,
    slug,
    sku,
    short_description: shortDescription,
    description,
    status,
    primary_color: primaryColor,
    available_colors: normalizedColors,
    available_sizes: availableSizes,
    price,
    compare_at_price: compareAtPrice,
    hero_image_url: heroImageUrl,
    gallery_image_urls: galleryImageUrls,
    tags,
    is_featured: isFeatured,
    sort_order: sortOrder,
  })

  if (error) {
    console.error('Error creating ready product:', error)
    throw new Error('No se pudo crear el producto armado.')
  }

  revalidatePath('/')
  revalidatePath('/shop')
  revalidatePath('/admin/recomendados')
  redirect('/admin/recomendados')
}
