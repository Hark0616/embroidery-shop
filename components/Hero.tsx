import React from 'react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-mint">
      
      {/* Sombra sutil superior para profundidad */}
      <div className="absolute top-0 left-0 right-0 h-40 
        bg-gradient-to-b from-jungle-deep/[0.02] to-transparent" />
      
      {/* Contenido */}
      <div className="relative z-10 text-center px-6 max-w-2xl">
        
        <p className="text-gold text-xs tracking-[0.4em] uppercase mb-10 
          reveal delay-1">
          Natura · NovaVenta
        </p>
        
        <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl 
          text-jungle-deep leading-[1.1] mb-8 reveal delay-2">
          Belleza Natural
        </h1>
        
        <p className="text-jungle-muted text-base font-light mb-14 
          max-w-md mx-auto reveal delay-3">
          Productos naturales que cuidan de ti y del planeta
        </p>
        
        <a href="#productos" 
          className="inline-block text-jungle-deep text-xs tracking-[0.25em] uppercase 
            pb-2 border-b border-jungle-deep/30 
            hover:text-black hover:border-black 
            hover:drop-shadow-[0_2px_4px_rgba(10,22,18,0.6)]
            transition-all duration-300 reveal delay-4">
          Explorar Catálogo
        </a>
      </div>
      
      {/* Gradiente inferior para transición suave */}
      <div className="absolute bottom-0 left-0 right-0 h-32 
        bg-gradient-to-t from-mint-soft to-transparent pointer-events-none" />
    </section>
  );
}
