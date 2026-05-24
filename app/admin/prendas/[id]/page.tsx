import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PlacementConfigurator from '@/components/admin/PlacementConfigurator';

export default async function EditPrendaPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    
    if (!supabase) {
        notFound();
    }

    const { data: product } = await supabase
        .from('base_products')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!product) {
        notFound();
    }

    return (
        <div className="p-8 bg-industrial-light min-h-screen">
            {/* Header */}
            <div className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                    <a href="/admin/prendas" className="font-mono text-xs text-industrial-gray uppercase tracking-widest hover:text-industrial-black">
                        ← Volver a Prendas
                    </a>
                </div>
                <h1 className="font-heading font-black text-3xl uppercase tracking-tighter text-industrial-black">
                    Configurar: {product.name}
                </h1>
                <p className="font-mono text-xs text-industrial-gray mt-2 uppercase tracking-widest">
                    Ajusta las zonas de bordado y malla visual
                </p>
            </div>

            {/* Placement Configurator Component */}
            <PlacementConfigurator product={product} />
        </div>
    );
}
