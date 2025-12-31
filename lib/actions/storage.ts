'use server'

import { createClient } from '@/lib/supabase/server'

export async function uploadImage(file: File, bucket: string, folder: string = ''): Promise<string | null> {
    try {
        const supabase = await createClient()

        if (!supabase) {
            console.error('Supabase client could not be initialized')
            return null
        }

        // Create a unique file name
        const fileExt = file.name.split('.').pop()
        const fileName = `${folder ? folder + '/' : ''}${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`

        const { error: uploadError, data } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (uploadError) {
            console.error('Error uploading image:', uploadError)
            return null
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName)

        return publicUrl
    } catch (error) {
        console.error('Unexpected error uploading image:', error)
        return null
    }
}
