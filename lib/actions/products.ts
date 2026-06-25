'use server'

import { requireAdmin } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { uploadImage } from './storage'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function hasCalibratedSurface(surfaces: unknown) {
  if (!surfaces || typeof surfaces !== 'object' || Array.isArray(surfaces)) {
    return false
  }

  return Object.keys(surfaces).length > 0
}

export async function createProduct(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const productType = (formData.get('product_type') as string) || 'camiseta'
  const basePrice = parseFloat(formData.get('base_price') as string)
  const colors = formData.getAll('colors') as string[]
  const sizes = formData.getAll('sizes') as string[]
  const stockStatus = formData.get('stock_status') as string
  const file = formData.get('image') as File

  if (!file || file.size === 0) {
    throw new Error('Image is required')
  }

  // Upload image
  const imageUrl = await uploadImage(file, 'products')

  if (!imageUrl) {
    throw new Error('Failed to upload image')
  }

  const { error } = await supabase.from('base_products').insert({
    name,
    slug,
    product_type: productType,
    base_price: basePrice,
    colors,
    sizes,
    stock_status: stockStatus,
    image_url: imageUrl,
    is_active: false
  })

  if (error) {
    console.error('Error creating product:', error)
    throw new Error('Failed to create product')
  }

  revalidatePath('/admin/prendas')
  redirect('/admin/prendas')
}

export async function updateProductPublication(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }

  const productId = formData.get('product_id') as string
  const intent = formData.get('intent') as string

  if (!productId || !['activate', 'deactivate'].includes(intent)) {
    throw new Error('Invalid publication request')
  }

  // Activation does not strictly require a mockup now, permitting fallbacks.

  const { error } = await supabase
    .from('base_products')
    .update({ is_active: intent === 'activate' })
    .eq('id', productId)

  if (error) {
    console.error('Error updating product publication:', error)
    throw new Error('Failed to update garment publication')
  }

  revalidatePath('/admin/prendas')
  revalidatePath(`/admin/prendas/${productId}`)
  revalidatePath('/catalog')
  revalidatePath('/studio')
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin()
  const productId = formData.get('product_id') as string
  if (!productId) throw new Error('Product ID is required')

  const supabase = await createClient()
  if (!supabase) throw new Error('Supabase client not initialized')

  // Explicitly delete mockups first to avoid FK violation
  const { error: mockupError } = await supabase
    .from('garment_mockups')
    .delete()
    .eq('product_id', productId)

  if (mockupError) {
    console.error('Error deleting product mockups:', mockupError)
    throw new Error('Failed to delete associated mockups')
  }

  const { error } = await supabase
    .from('base_products')
    .delete()
    .eq('id', productId)

  if (error) {
    console.error('Error deleting product:', error)
    throw new Error('Failed to delete product')
  }

  revalidatePath('/admin/prendas')
  redirect('/admin/prendas')
}

export async function updateProductDetails(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }

  const productId = formData.get('product_id') as string
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const productType = formData.get('product_type') as string
  const basePrice = parseFloat(formData.get('base_price') as string)
  const stockStatus = formData.get('stock_status') as string

  const colors = formData.getAll('colors') as string[]
  const sizes = formData.getAll('sizes') as string[]

  if (!productId || !name || !slug) {
    throw new Error('Missing required fields')
  }

  const { error: updateError } = await supabase
    .from('base_products')
    .update({
      name,
      slug,
      product_type: productType,
      base_price: basePrice,
      colors,
      sizes,
      stock_status: stockStatus,
    })
    .eq('id', productId)

  if (updateError) {
    console.error('Error updating product details:', updateError)
    throw new Error('Failed to update product details')
  }

  revalidatePath('/admin/prendas')
  revalidatePath(`/admin/prendas/${productId}`)
  revalidatePath('/catalog')
  revalidatePath('/studio')
}

export async function updateProductImage(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }

  const productId = formData.get('product_id') as string
  const file = formData.get('image') as File

  if (!productId) {
    throw new Error('Product ID is required')
  }

  if (!file || file.size === 0) {
    throw new Error('Image is required')
  }

  // Upload image
  const imageUrl = await uploadImage(file, 'products')

  if (!imageUrl) {
    throw new Error('Failed to upload image')
  }

  const { error } = await supabase
    .from('base_products')
    .update({ image_url: imageUrl })
    .eq('id', productId)

  if (error) {
    console.error('Error updating product image:', error)
    throw new Error('Failed to update product image')
  }

  revalidatePath('/admin/prendas')
  revalidatePath(`/admin/prendas/${productId}`)
  revalidatePath('/catalog')
  revalidatePath('/studio')
}
