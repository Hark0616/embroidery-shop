import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { canActivateGarment } from '@/lib/admin/readiness'
import { isMoodCategoryCompatible } from '@/lib/moods/catalog'
import type { BaseProduct, EmbroideryDesign, GarmentMockup, ProductDrop, ReadyProduct } from '@/lib/types/database'

type ProductWithMockups = BaseProduct & {
  garment_mockups?: Pick<GarmentMockup, 'status' | 'is_public' | 'surfaces'>[]
}

async function getDashboardData() {
  const supabase = await createClient()

  if (!supabase) {
    return {
      drops: [] as ProductDrop[],
      readyProducts: [] as ReadyProduct[],
      baseProducts: [] as ProductWithMockups[],
      designs: [] as EmbroideryDesign[],
      mockups: [] as GarmentMockup[],
    }
  }

  const [dropsResult, readyProductsResult, baseProductsResult, designsResult, mockupsResult] = await Promise.all([
    supabase.from('product_drops').select('*'),
    supabase.from('ready_products').select('*'),
    supabase.from('base_products').select('*, garment_mockups(status, is_public, surfaces)'),
    supabase.from('embroidery_designs').select('*'),
    supabase.from('garment_mockups').select('*'),
  ])

  return {
    drops: (dropsResult.data || []) as ProductDrop[],
    readyProducts: (readyProductsResult.data || []) as ReadyProduct[],
    baseProducts: (baseProductsResult.data || []) as ProductWithMockups[],
    designs: (designsResult.data || []) as EmbroideryDesign[],
    mockups: (mockupsResult.data || []) as GarmentMockup[],
  }
}

function StatCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="bg-white border border-industrial-gray/10 p-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray">{label}</p>
      <p className="font-heading font-black text-4xl tracking-tighter mt-2">{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray mt-2">{detail}</p>
    </div>
  )
}

function QuickLink({ href, label, tone = 'dark' }: { href: string; label: string; tone?: 'dark' | 'light' }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${
        tone === 'dark'
          ? 'bg-industrial-black text-white hover:bg-industrial-warning hover:text-industrial-black'
          : 'border border-industrial-black text-industrial-black hover:bg-industrial-black hover:text-white'
      }`}
    >
      {label}
    </Link>
  )
}

export default async function AdminDashboard() {
  const { drops, readyProducts, baseProducts, designs, mockups } = await getDashboardData()

  const publishedDrops = drops.filter(drop => drop.status === 'published').length
  const publishedReadyProducts = readyProducts.filter(product => product.status === 'published').length
  const soldOutProducts = readyProducts.filter(product => product.status === 'sold_out').length
  const featuredProducts = readyProducts.filter(product => product.is_featured && product.status === 'published').length
  const readyProductsWithoutPhoto = readyProducts.filter(product => !product.hero_image_url).length

  const activeBaseProducts = baseProducts.filter(product => product.is_active).length
  const activeDesigns = designs.filter(design => design.is_active).length
  const pendingMockups = mockups.filter(mockup => mockup.status !== 'published' || !mockup.is_public).length
  const publishedMockups = mockups.filter(mockup => mockup.status === 'published' && mockup.is_public).length
  const activeProductsWithoutPublicMockup = baseProducts.filter(
    product => product.is_active && !canActivateGarment(product.garment_mockups || []),
  )
  const incompatibleDesigns = designs.filter(
    design => design.is_active && !isMoodCategoryCompatible(design.category),
  )

  const alerts = [
    readyProductsWithoutPhoto > 0
      ? `${readyProductsWithoutPhoto} producto listo no tiene foto final.`
      : '',
    activeProductsWithoutPublicMockup.length > 0
      ? `${activeProductsWithoutPublicMockup.length} prenda activa no tiene mockup publicado.`
      : '',
    incompatibleDesigns.length > 0
      ? `${incompatibleDesigns.length} diseño activo tiene categoría fuera de moods públicos.`
      : '',
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-industrial-light text-industrial-black p-8">
      <div className="mb-10 border-b border-industrial-gray/10 pb-5">
        <h1 className="font-heading font-black text-3xl uppercase tracking-tighter">Dashboard</h1>
        <p className="font-mono text-xs text-industrial-gray uppercase tracking-widest mt-1">
          Operación dividida en drops listos y personalización.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        <section className="bg-white border border-industrial-gray/20 p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray mb-2">
                Home / shop
              </p>
              <h2 className="font-heading font-black text-2xl uppercase tracking-tighter">
                Vender drops listos
              </h2>
            </div>
            <QuickLink href="/admin/recomendados/productos/new" label="Nuevo producto listo" />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard label="Drops publicados" value={publishedDrops} detail="Agrupan productos listos" />
            <StatCard label="Productos publicados" value={publishedReadyProducts} detail="Visibles en /shop" />
            <StatCard label="Agotados" value={soldOutProducts} detail="Visibles sin compra" />
            <StatCard label="Destacados" value={featuredProducts} detail="Aparecen en home" />
          </div>
          <div className="flex flex-wrap gap-3">
            <QuickLink href="/admin/recomendados/drops/new" label="Nuevo drop" tone="light" />
            <QuickLink href="/admin/recomendados" label="Gestionar drops listos" tone="light" />
          </div>
        </section>

        <section className="bg-white border border-industrial-gray/20 p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray mb-2">
                Designs / catalog / studio
              </p>
              <h2 className="font-heading font-black text-2xl uppercase tracking-tighter">
                Preparar personalización
              </h2>
            </div>
            <QuickLink href="/admin/prendas/new" label="Nueva prenda base" />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard label="Prendas activas" value={activeBaseProducts} detail="Disponibles en Studio" />
            <StatCard label="Diseños activos" value={activeDesigns} detail="Disponibles en /designs" />
            <StatCard label="Mockups pendientes" value={pendingMockups} detail="Falta calibrar/publicar" />
            <StatCard label="Mockups publicados" value={publishedMockups} detail="Usados por Studio" />
          </div>
          <div className="flex flex-wrap gap-3">
            <QuickLink href="/admin/disenos/new" label="Nuevo diseño" tone="light" />
            <QuickLink href="/admin/mockups" label="Mockups pendientes" tone="light" />
          </div>
        </section>
      </div>

      <section className={`border p-6 ${alerts.length > 0 ? 'bg-industrial-warning/10 border-industrial-warning' : 'bg-white border-industrial-gray/20'}`}>
        <h2 className="font-heading font-black text-xl uppercase tracking-tighter mb-4">
          Alertas operativas
        </h2>
        {alerts.length > 0 ? (
          <ul className="space-y-2">
            {alerts.map(alert => (
              <li key={alert} className="font-mono text-xs uppercase tracking-widest text-industrial-black">
                {alert}
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-mono text-xs uppercase tracking-widest text-industrial-gray">
            No hay alertas críticas de publicación.
          </p>
        )}
      </section>
    </div>
  )
}
