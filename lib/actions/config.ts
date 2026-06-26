'use server'

import { createClient, createPublicClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
    DEFAULT_DELIVERY_TIME_MESSAGE,
    DELIVERY_TIME_KEY,
    LEGACY_DELIVERY_TIME_KEY,
    resolveDeliveryTime,
} from '@/lib/config/delivery-time'

export async function getDeliveryTime(): Promise<string> {
    const supabase = createPublicClient()

    if (!supabase) return DEFAULT_DELIVERY_TIME_MESSAGE

    const { data } = await supabase
        .from('config_global')
        .select('key, value')
        .in('key', [DELIVERY_TIME_KEY, LEGACY_DELIVERY_TIME_KEY])

    return resolveDeliveryTime(data)
}

export async function updateDeliveryTime(formData: FormData) {
    const supabase = await createClient()

    if (!supabase) {
        throw new Error('Supabase client not initialized')
    }

    const message = formData.get('message') as string

    if (!message) {
        throw new Error('Message is required')
    }

    // Upsert allows inserting if not exists, or updating if it does
    const { error } = await supabase
        .from('config_global')
        .upsert({
            key: DELIVERY_TIME_KEY,
            value: message,
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' })

    if (error) {
        console.error('Error updating config:', error)
        throw new Error('Failed to update configuration')
    }

    revalidatePath('/')
    revalidatePath('/admin/config')
}
