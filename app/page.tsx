import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
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

      {/* Featured / Concept Section */}
      <section className="py-24 px-4 bg-industrial-light">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="font-heading font-black text-4xl md:text-5xl uppercase tracking-tighter text-industrial-black">
                Laboratorio de <span className="text-transparent bg-clip-text bg-gradient-to-r from-industrial-black to-gray-500">Diseño</span>
              </h2>
              <p className="text-industrial-gray text-lg font-light leading-relaxed">
                No vendemos ropa. Vendemos la capacidad de materializar lo que tienes en la cabeza. Elige la base, elige el bordado, nosotros lo construimos.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-industrial-gray/20">
                <div>
                  <h3 className="font-bold text-xl mb-2">01. Elige</h3>
                  <p className="text-sm text-gray-600">Hoodies, Tees y Caps de alto gramaje.</p>
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-2">02. Configura</h3>
                  <p className="text-sm text-gray-600">Visualiza tu diseño en tiempo real.</p>
                </div>
              </div>
            </div>
            <div className="aspect-square bg-industrial-gray rounded-sm overflow-hidden relative">
              {/* Concept Image Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center text-gray-700 font-mono text-xs uppercase tracking-widest">
                [Imagen de Concepto]
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
