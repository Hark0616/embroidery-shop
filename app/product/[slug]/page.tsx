import { createClient } from '@/lib/supabase/server';
import { getDeliveryTime } from '@/lib/actions/config';
import Image from 'next/image';
import ConfiguratorClient from './ConfiguratorClient';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const supabase = await createClient();
    const { data: product } = await supabase!
        .from('base_products')
        .select('name')
        .eq('slug', params.slug)
        .single();

    return {
        title: product ? `${product.name} | Configurator` : 'Product Not Found',
    };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
    const supabase = await createClient();

    // 1. Fetch Base Product
    const { data: product, error: productError } = await supabase!
        .from('base_products')
        .select('*')
        .eq('slug', params.slug)
        .single();

    if (productError || !product) {
        notFound();
    }

    // 2. Fetch Active Designs
    const { data: designs, error: designsError } = await supabase!
        .from('embroidery_designs')
        .select('*')
        .eq('is_active', true)
        .order('name');

    // 3. Fetch Lead Time
    const leadTime = await getDeliveryTime();

    return (
        <div className="min-h-screen bg-white">
            <ConfiguratorClient
                product={product}
                designs={designs || []}
                leadTime={leadTime}
            />
        </div>
    );
}
