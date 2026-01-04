/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compresión y optimización
  compress: true,

  // Optimización de imágenes - usando remotePatterns (recomendado en Next.js 14+)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      // Preparado para futuras integraciones (Supabase, Cloudinary, etc.)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    // Formatos modernos para mejor compresión
    formats: ['image/avif', 'image/webp'],
    // Optimización de calidad
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Headers de seguridad
  async headers() {
    return [
      {
        // Headers para todas las rutas
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },

          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; img-src 'self' https: data: blob:; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.vercel-scripts.com https://vercel.live; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https://vercel.live; frame-src 'self' https://vercel.live;",
          },
        ],
      },
      {
        // Headers adicionales para rutas admin (cuando existan)
        source: '/admin/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig



