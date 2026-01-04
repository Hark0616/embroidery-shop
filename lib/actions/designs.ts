'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/guards'
import { uploadImage } from './storage'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createDesign(formData: FormData) {
    await requireAdmin()
    const supabase = await createClient()

    if (!supabase) {
        throw new Error('Supabase client not initialized')
    }

    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const priceModifier = parseFloat(formData.get('price_modifier') as string)
    const dimensions = formData.get('dimensions') as string
    const file = formData.get('image') as File
    const isActive = formData.get('is_active') === 'on'

    if (!file || file.size === 0) {
        throw new Error('Image is required')
    }

    // Upload image
    const imageUrl = await uploadImage(file, 'designs')

    if (!imageUrl) {
        throw new Error('Failed to upload image')
    }

    const { error } = await supabase.from('embroidery_designs').insert({
        name,
        category,
        price_modifier: priceModifier,
        dimensions,
        image_url: imageUrl,
        is_active: isActive
    })

    if (error) {
        console.error('Error creating design:', error)
        throw new Error('Failed to create design')
    }

    revalidatePath('/admin/disenos')
    redirect('/admin/disenos')
}
