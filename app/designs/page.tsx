import { createClient } from '@/lib/supabase/server';
import DesignBrowser from '@/components/studio/DesignBrowser';
import Link from 'next/link';

export const revalidate = 0;

export default async function DesignsPage() {
    const supabase = await createClient();
    let designs: any[] = [];
    let categories: string[] = [];

    if (supabase) {
        const { data, error } = await supabase
            .from('embroidery_designs')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (!error && data) {
            designs = data;
            const uniqueCats = new Set(data.map((d: any) => d.category).filter(Boolean));
            categories = Array.from(uniqueCats) as string[];
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen bg-white">
            <header className="mb-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-6">
                    <Link
                        href="/"
                        className="font-mono text-[10px] text-industrial-gray uppercase tracking-widest hover:text-industrial-black transition-colors"
                    >
                        Inicio
                    </Link>
                    <span className="text-industrial-gray/30">→</span>
                    <span className="font-mono text-[10px] text-industrial-black uppercase tracking-widest font-bold">
                        Diseños
                    </span>
                </div>

                <h1 className="font-heading font-black text-4xl md:text-5xl uppercase tracking-tighter mb-3">
                    Librería de{' '}
                    <span className="text-industrial-warning">Diseños</span>
                </h1>
                <p className="font-mono text-xs md:text-sm text-industrial-gray max-w-2xl uppercase tracking-widest leading-relaxed">
                    +{designs.length || '∞'} diseños disponibles para bordar.
                    <br />
                    Filtra por estilo, busca por nombre, o explora por mood.
                </p>
            </header>

            <DesignBrowser designs={designs} categories={categories} />
        </div>
    );
}
