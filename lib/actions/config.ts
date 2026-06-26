'use server'

import { createClient, createPublicClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
    DEFAULT_DELIVERY_TIME_MESSAGE,
    DELIVERY_TIME_KEY,
    LEGACY_DELIVERY_TIME_KEY,
    resolveDeliveryTime,
} from '@/lib/config/delivery-time'
import {
    WHATSAPP_MESSAGE_KEY,
    WHATSAPP_PHONE_KEY,
    resolveWhatsAppConfig,
} from '@/lib/config/whatsapp'

export async function getDeliveryTime(): Promise<string> {
    const supabase = createPublicClient()

    if (!supabase) return DEFAULT_DELIVERY_TIME_MESSAGE

    const { data } = await supabase
        .from('config_global')
        .select('key, value')
        .in('key', [DELIVERY_TIME_KEY, LEGACY_DELIVERY_TIME_KEY])

    return resolveDeliveryTime(data)
}

export async function getWhatsAppConfig() {
    const supabase = createPublicClient()

    if (!supabase) {
        return resolveWhatsAppConfig(null, process.env.NEXT_PUBLIC_WHATSAPP_PHONE)
    }

    const { data } = await supabase
        .from('config_global')
        .select('key, value')
        .in('key', [WHATSAPP_PHONE_KEY, WHATSAPP_MESSAGE_KEY])

    return resolveWhatsAppConfig(data, process.env.NEXT_PUBLIC_WHATSAPP_PHONE)
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

export async function updateWhatsAppConfig(formData: FormData) {
    const supabase = await createClient()

    if (!supabase) {
        throw new Error('Supabase client not initialized')
    }

    const phone = String(formData.get('phone') || '').trim()
    const message = String(formData.get('message') || '').trim()

    if (!phone) {
        throw new Error('Phone is required')
    }

    const { error } = await supabase
        .from('config_global')
        .upsert([
            {
                key: WHATSAPP_PHONE_KEY,
                value: phone,
                updated_at: new Date().toISOString(),
            },
            {
                key: WHATSAPP_MESSAGE_KEY,
                value: message,
                updated_at: new Date().toISOString(),
            },
        ], { onConflict: 'key' })

    if (error) {
        console.error('Error updating WhatsApp config:', error)
        throw new Error('Failed to update WhatsApp configuration')
    }

    revalidatePath('/')
    revalidatePath('/shop')
    revalidatePath('/studio')
    revalidatePath('/admin/config')
}
