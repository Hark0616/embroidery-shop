import { createClient } from '@/lib/supabase/server';
import VirtualStudio from '@/components/studio/VirtualStudio';
import { BaseProduct, EmbroideryDesign } from '@/lib/types/database';

export const revalidate = 0;

export default async function StudioPage() {
    const supabase = await createClient();

    // Parallel fetching of Products and Designs
    const [productsResult, designsResult] = await Promise.all([
        supabase ? supabase.from('base_products').select('*').eq('is_active', true).order('created_at') : { data: null },
        supabase ? supabase.from('embroidery_designs').select('*').eq('is_active', true).order('created_at') : { data: null }
    ]);

    const products = (productsResult.data || []) as BaseProduct[];
    const designs = (designsResult.data || []) as EmbroideryDesign[];

    return (
        <div className="bg-white min-h-screen">
            <VirtualStudio products={products} designs={designs} />
        </div>
    );
}
