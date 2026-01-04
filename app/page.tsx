import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 60; // Revalidate every minute so it doesn't get stale

export default async function Home() {
  const supabase = await createClient();
  let trendingDesigns = [];

  if (supabase) {
    const { data } = await supabase
      .from('embroidery_designs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(4);

    if (data) trendingDesigns = data;
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-industrial-black text-industrial-white">
        <div className="absolute inset-0 z-0 opacity-50">
          {/* Placeholder for Hero Image - In production we should use a real image */}
          <div className="w-full h-full bg-gradient-to-br from-industrial-gray to-industrial-black" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="font-heading font-black text-5xl md:text-8xl tracking-tighter mb-6 uppercase leading-none">
            Fabricación <br />
            <span className="text-industrial-warning">Bajo Pedido</span>
          </h1>
          <p className="font-mono text-sm md:text-base text-gray-400 mb-10 max-w-xl mx-auto tracking-widest uppercase">
            Sin stock. Sin desperdicio. Tu diseño, tu prenda, tu tiempo.
          </p>
          <Link
            href="/catalog"
            className="inline-block bg-industrial-warning text-industrial-black font-bold text-lg px-8 py-4 uppercase tracking-widest hover:bg-white transition-colors"
          >
            Personalizar Ahora
          </Link>
        </div>
      </section>

      {/* Trending Archives Section */}
      <section className="py-24 px-4 bg-industrial-light border-b border-industrial-gray/10">
        <div className="max-w-7xl mx-auto">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
            <div>
              <h2 className="font-heading font-black text-4xl uppercase tracking-tighter text-industrial-black mb-2">
                Archivo <span className="text-transparent bg-clip-text bg-gradient-to-r from-industrial-black to-gray-500">Industrial</span>
              </h2>
              <p className="font-mono text-sm text-industrial-gray uppercase tracking-widest">
                Tendencias Globales / Curaduría Local
              </p>
            </div>

            <Link
              href="/designs"
              className="group flex items-center gap-2 font-bold uppercase tracking-widest text-xs hover:text-industrial-warning transition-colors"
            >
              Ver Librería Completa
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {trendingDesigns.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {trendingDesigns.map((design) => (
                <Link
                  key={design.id}
                  href={`/studio?design=${design.id}`}
                  className="group block relative bg-white border border-transparent hover:border-industrial-gray/20 hover:shadow-xl transition-all duration-500"
                >
                  <div className="aspect-[4/5] relative overflow-hidden bg-gray-50">
                    {design.image_url ? (
                      <Image
                        src={design.image_url}
                        alt={design.name}
                        fill
                        className="object-contain p-6 group-hover:scale-110 transition-transform duration-700 mix-blend-multiply"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 font-mono text-[10px]">NO IMAGE</div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-industrial-black/0 group-hover:bg-industrial-black/5 transition-colors" />

                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-white/90 backdrop-blur-sm border-t border-gray-100">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-industrial-black block text-center">
                        Personalizar
                      </span>
                    </div>
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="font-bold text-xs uppercase tracking-tight group-hover:text-industrial-warning transition-colors">
                      {design.name}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono mt-1 uppercase">
                      {design.category}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-gray-300 rounded-sm">
              <p className="font-mono text-industrial-gray">Cargando archivo...</p>
            </div>
          )}

        </div>
      </section>
    </div>
  );
}
