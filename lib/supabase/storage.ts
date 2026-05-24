import { createClient } from './client';

export async function uploadCustomDesign(file: File): Promise<string | null> {
    try {
        const supabase = createClient();
        
        // Generate a unique clean filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `custom-uploads/${fileName}`;

        // Upload to the existing public product-images bucket
        const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Error uploading custom asset:', uploadError);
            return null;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Unexpected error in uploadCustomDesign:', error);
        return null;
    }
}
