import { createClient } from '@/lib/supabase/server';
import VirtualStudio from '@/components/studio/VirtualStudio';
import { BaseProduct, EmbroideryDesign, GarmentMockup } from '@/lib/types/database';

export const revalidate = 0;

export default async function StudioPage() {
    const supabase = await createClient();

    // Parallel fetching of Products, Designs and published calibrated mockups.
    const [productsResult, designsResult, mockupsResult] = await Promise.all([
        supabase ? supabase.from('base_products').select('*').eq('is_active', true).order('created_at') : { data: null },
        supabase ? supabase.from('embroidery_designs').select('*').eq('is_active', true).order('created_at') : { data: null },
        supabase
            ? supabase
                .from('garment_mockups')
                .select('*')
                .eq('is_public', true)
                .eq('status', 'published')
                .order('sort_order')
            : { data: null },
    ]);

    const products = (productsResult.data || []) as BaseProduct[];
    const designs = (designsResult.data || []) as EmbroideryDesign[];
    const mockups = (mockupsResult.data || []) as GarmentMockup[];

    return (
        <div className="bg-white min-h-screen">
            <VirtualStudio products={products} designs={designs} mockups={mockups} />
        </div>
    );
}
