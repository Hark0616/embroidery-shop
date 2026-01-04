import { createClient } from '@/lib/supabase/server';
import DesignBrowser from '@/components/studio/DesignBrowser';

export const revalidate = 0;

export default async function DesignsPage() {
    const supabase = await createClient();
    let designs = [];
    let categories: string[] = [];

    if (supabase) {
        const { data, error } = await supabase
            .from('embroidery_designs')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (!error && data) {
            designs = data;
            // Extract unique categories safely
            const uniqueCats = new Set(data.map(d => d.category).filter(Boolean));
            categories = Array.from(uniqueCats) as string[];
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-screen bg-white">
            <header className="mb-8">
                <h1 className="font-heading font-black text-4xl uppercase tracking-tighter mb-4">
                    Catálogo de <span className="text-industrial-warning">Diseños</span>
                </h1>
                <p className="font-mono text-sm text-industrial-gray max-w-2xl">
                    Explora nuestra biblioteca.
                    <br />
                    Usa el buscador o los filtros para encontrar tu estilo.
                </p>
            </header>

            <DesignBrowser designs={designs} categories={categories} />
        </div>
    );
}
