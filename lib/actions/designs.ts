'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/guards'
import { uploadImage } from './storage'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isMoodCategoryCompatible } from '@/lib/moods/catalog'

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

    if (!isMoodCategoryCompatible(category)) {
        throw new Error('La categoría debe pertenecer a un mood público.')
    }

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
    revalidatePath('/designs')
    revalidatePath('/studio')
    redirect('/admin/disenos')
}

export async function updateDesign(formData: FormData) {
    await requireAdmin()
    const supabase = await createClient()

    if (!supabase) {
        throw new Error('Supabase client not initialized')
    }

    const designId = String(formData.get('design_id') || '').trim()
    const name = String(formData.get('name') || '').trim()
    const category = String(formData.get('category') || '').trim()
    const priceModifier = parseFloat(String(formData.get('price_modifier') || '0'))
    const dimensions = String(formData.get('dimensions') || '').trim()
    const file = formData.get('image') as File | null
    const isActive = formData.get('is_active') === 'on'

    if (!designId || !name) {
        throw new Error('Missing required fields')
    }

    if (!isMoodCategoryCompatible(category)) {
        throw new Error('La categoría debe pertenecer a un mood público.')
    }

    const payload: Record<string, unknown> = {
        name,
        category,
        price_modifier: Number.isFinite(priceModifier) ? priceModifier : 0,
        dimensions,
        is_active: isActive,
    }

    if (file && file.size > 0) {
        const imageUrl = await uploadImage(file, 'designs')
        if (!imageUrl) {
            throw new Error('Failed to upload image')
        }
        payload.image_url = imageUrl
    }

    const { error } = await supabase
        .from('embroidery_designs')
        .update(payload)
        .eq('id', designId)

    if (error) {
        console.error('Error updating design:', error)
        throw new Error('Failed to update design')
    }

    revalidatePath('/admin/disenos')
    revalidatePath('/designs')
    revalidatePath('/studio')
    redirect('/admin/disenos')
}

export async function updateDesignStatus(formData: FormData) {
    await requireAdmin()
    const supabase = await createClient()

    if (!supabase) {
        throw new Error('Supabase client not initialized')
    }

    const designId = String(formData.get('design_id') || '').trim()
    const isActive = formData.get('is_active') === 'true'

    if (!designId) {
        throw new Error('Design ID is required')
    }

    const { error } = await supabase
        .from('embroidery_designs')
        .update({ is_active: isActive })
        .eq('id', designId)

    if (error) {
        console.error('Error updating design status:', error)
        throw new Error('Failed to update design status')
    }

    revalidatePath('/admin/disenos')
    revalidatePath('/designs')
    revalidatePath('/studio')
}
