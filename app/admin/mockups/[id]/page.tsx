import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MockupCalibrator from '@/components/admin/MockupCalibrator'

export default async function EditMockupPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { from_product?: string }
}) {
  const supabase = await createClient()

  if (!supabase) {
    notFound()
  }

  const [{ data: mockup }, { data: designs }] = await Promise.all([
    supabase
      .from('garment_mockups')
      .select('*, base_products(name, slug, product_type)')
      .eq('id', params.id)
      .single(),
    supabase
      .from('embroidery_designs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  ])

  if (!mockup) {
    notFound()
  }

  const backHref = searchParams?.from_product
    ? `/admin/prendas/${searchParams.from_product}`
    : '/admin/mockups'
  const backLabel = searchParams?.from_product ? '← Volver a la prenda' : '← Volver a mockups'

  return (
    <div className="p-8 bg-industrial-light min-h-screen">
      <div className="mb-8">
        <Link href={backHref} className="font-mono text-xs text-industrial-gray uppercase tracking-widest hover:text-industrial-black">
          {backLabel}
        </Link>
        <h1 className="font-heading font-black text-3xl uppercase tracking-tighter text-industrial-black mt-4">
          Calibrar mockup
        </h1>
        <p className="font-mono text-xs text-industrial-gray mt-2 uppercase tracking-widest">
          Define la superficie bordable. El mockup solo debe publicarse cuando el preview se vea convincente.
        </p>
      </div>

      <MockupCalibrator mockup={mockup as any} designs={(designs || []) as any} />
    </div>
  )
}
