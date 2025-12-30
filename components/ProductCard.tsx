'use client';

import React from 'react';
import Image from 'next/image';
import type { Product } from '@/lib/types/database';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.image_url || 'https://picsum.photos/400/400';
  
  return (
    <a 
      href={product.affiliate_link}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="group block"
      onMouseEnter={() => {
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          window.requestIdleCallback(() => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = product.affiliate_link;
            document.head.appendChild(link);
          });
        }
      }}
    >
      {/* Imagen */}
      <div className="relative aspect-[3/4] overflow-hidden bg-white mb-5">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 
            group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          style={{ willChange: 'transform' }}
        />
        
        {/* Badge marca */}
        <span className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm 
          px-3 py-1.5 text-jungle-muted text-[10px] tracking-[0.15em] uppercase">
          {product.brand}
        </span>
      </div>
      
      {/* Info */}
      <div className="space-y-1">
        <h3 className="font-heading text-lg text-jungle-deep 
          group-hover:text-jungle transition-colors duration-300">
          {product.name}
        </h3>
        <p className="text-gold text-sm">
          ${product.price.toFixed(2)}
        </p>
      </div>
    </a>
  );
}
