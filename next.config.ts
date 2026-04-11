import type { NextConfig } from "next";

// Validação de Segurança de Ambiente (Brazil Platform)
if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('inhkgvtsqqmrckxbbmld')) {
  console.warn('\x1b[33m%s\x1b[0m', '⚠️ AVISO: A URL do Supabase configurada pode não ser a da plataforma brasileira (BR). Verifique se está usando o projeto correto para evitar conflitos de dados.');
}


import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Compressão
  compress: true,
  
  // Otimização de imagens
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 ano
    unoptimized: true,
  },
  
  // Headers de cache para assets estáticos e segurança
  async headers() {
    const securityHeaders = [
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https://*.googleusercontent.com https://lh3.googleusercontent.com",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.groq.com https://api.resend.com",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "upgrade-insecure-requests",
        ].join('; '),
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      },
      {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin',
      },
      {
        key: 'Cross-Origin-Resource-Policy',
        value: 'same-origin',
      },
      {
        key: 'Cross-Origin-Embedder-Policy',
        value: 'require-corp',
      },
    ]

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // Cache longo para assets estáticos
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Sem cache para páginas dinâmicas
        source: '/(dashboard|perfil|onboarding)(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-store, no-cache, must-revalidate',
          },
        ],
      },
    ]
  },
  
  // Experimental
  experimental: {
    optimizeCss: true,
  },
  
  // Remover console.log em produção, exceto avisos e erros
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
};

export default bundleAnalyzer(nextConfig);
