'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const DELIVERY_TIME_KEY = 'delivery_time_message'
const DEFAULT_MESSAGE = '15 DÍAS HÁBILES'

export async function getDeliveryTime(): Promise<string> {
    const supabase = await createClient()

    if (!supabase) return DEFAULT_MESSAGE

    const { data } = await supabase
        .from('config_global')
        .select('value')
        .eq('key', DELIVERY_TIME_KEY)
        .single()

    return data?.value || DEFAULT_MESSAGE
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
