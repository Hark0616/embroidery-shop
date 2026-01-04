'use server'

import { requireAdmin } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { uploadImage } from './storage'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProduct(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
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
    base_price: basePrice,
    colors,
    sizes,
    stock_status: stockStatus,
    image_url: imageUrl,
    is_active: true
  })

  if (error) {
    console.error('Error creating product:', error)
    throw new Error('Failed to create product')
  }

  revalidatePath('/admin/prendas')
  redirect('/admin/prendas')
}
