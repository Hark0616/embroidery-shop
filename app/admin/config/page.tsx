import { getDeliveryTime } from '@/lib/actions/config'
import Link from 'next/link'
import ConfigForm from '@/components/admin/ConfigForm'

export default async function ConfigPage() {
    const currentMessage = await getDeliveryTime()

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-2 text-industrial-gray text-xs mb-2 tracking-widest uppercase font-mono">
                    <Link href="/admin" className="hover:text-industrial-white transition-colors">
                        Dashboard
                    </Link>
                    <span>/</span>
                    <span className="text-industrial-warning">Configuración</span>
                </div>
                <h1 className="font-heading font-black text-3xl text-industrial-black uppercase tracking-tighter">
                    Configuración Global
                </h1>
            </div>

            <div className="bg-white border border-industrial-gray/20 p-8 shadow-sm">
                <h2 className="font-heading font-bold text-xl mb-6 uppercase tracking-tight">
                    Tiempos de Entrega
                </h2>

                <ConfigForm initialMessage={currentMessage} />
            </div>
        </div>
    )
}
