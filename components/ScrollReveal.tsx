'use client';

import React, { useRef, useState, useEffect } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

// Singleton para compartir un único IntersectionObserver
class SharedIntersectionObserver {
  private observer: IntersectionObserver | null = null;
  private callbacks = new Map<Element, (isIntersecting: boolean) => void>();
  private defaultOptions: IntersectionObserverInit = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  };

  constructor(options?: IntersectionObserverInit) {
    this.defaultOptions = { ...this.defaultOptions, ...options };
    if (typeof window !== 'undefined') {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const callback = this.callbacks.get(entry.target);
            if (callback) {
              callback(entry.isIntersecting);
            }
          });
        },
        this.defaultOptions
      );
    }
  }

  observe(element: Element, callback: (isIntersecting: boolean) => void) {
    if (!this.observer) return;
    this.callbacks.set(element, callback);
    this.observer.observe(element);
  }

  unobserve(element: Element) {
    if (!this.observer) return;
    this.callbacks.delete(element);
    this.observer.unobserve(element);
  }
}

// Instancia global compartida
let sharedObserverInstance: SharedIntersectionObserver | null = null;

function getSharedObserver(options?: IntersectionObserverInit): SharedIntersectionObserver {
  if (typeof window === 'undefined') {
    // SSR fallback - crear instancia dummy que no hace nada
    return new SharedIntersectionObserver(options);
  }

  if (!sharedObserverInstance) {
    sharedObserverInstance = new SharedIntersectionObserver(options);
  }
  return sharedObserverInstance;
}

export default function ScrollReveal({ 
  children, 
  className = '',
  delay = 0,
  direction = 'up'
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = getSharedObserver();
    
    const callback = (isIntersecting: boolean) => {
      if (isIntersecting) {
        setIsVisible(true);
        observer.unobserve(element);
      }
    };

    observer.observe(element, callback);

    return () => {
      observer.unobserve(element);
    };
  }, []);

  const getTransform = () => {
    switch (direction) {
      case 'up': return 'translateY(30px)';
      case 'down': return 'translateY(-30px)';
      case 'left': return 'translateX(30px)';
      case 'right': return 'translateX(-30px)';
      case 'none': return 'none';
      default: return 'translateY(30px)';
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'none' : getTransform(),
        transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`,
        willChange: isVisible ? 'auto' : 'opacity, transform', // Optimización GPU
      }}
    >
      {children}
    </div>
  );
}



