import { getDeliveryTime } from '@/lib/actions/config'
import Link from 'next/link'
import ConfigForm from '@/components/admin/ConfigForm'

export default async function ConfigPage() {
    const currentMessage = await getDeliveryTime()

    return (
        <div className="p-8 bg-industrial-light min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-xs mb-4 tracking-widest uppercase font-mono">
                        <Link href="/admin" className="text-industrial-gray hover:text-industrial-black transition-colors">
                            Dashboard
                        </Link>
                        <span className="text-industrial-gray/40">→</span>
                        <span className="text-industrial-black font-bold">Configuración</span>
                    </div>
                    <h1 className="font-heading font-black text-3xl text-industrial-black uppercase tracking-tighter">
                        Configuración Global
                    </h1>
                    <p className="font-mono text-xs text-industrial-gray uppercase tracking-widest mt-2">
                        Ajustes generales de la tienda
                    </p>
                </div>

                {/* Tiempos de Entrega */}
                <div className="bg-white border border-industrial-gray/20 p-8 shadow-sm mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="h-8 w-8 flex items-center justify-center bg-industrial-black text-white text-[10px] font-bold">
                            01
                        </span>
                        <div>
                            <h2 className="font-heading font-bold text-xl uppercase tracking-tight">
                                Tiempos de Entrega
                            </h2>
                            <p className="font-mono text-[10px] text-industrial-gray uppercase tracking-widest">
                                Mensaje global visible en toda la tienda
                            </p>
                        </div>
                    </div>
                    <ConfigForm initialMessage={currentMessage} />
                </div>

                {/* Placeholder sections for future expansion */}
                <div className="bg-white border border-dashed border-industrial-gray/20 p-8 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-8 w-8 flex items-center justify-center border border-industrial-gray/20 text-industrial-gray text-[10px] font-bold">
                            02
                        </span>
                        <div>
                            <h2 className="font-heading font-bold text-xl uppercase tracking-tight text-industrial-gray/60">
                                WhatsApp y Contacto
                            </h2>
                            <p className="font-mono text-[10px] text-industrial-gray/40 uppercase tracking-widest">
                                Próximamente
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-dashed border-industrial-gray/20 p-8">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-8 w-8 flex items-center justify-center border border-industrial-gray/20 text-industrial-gray text-[10px] font-bold">
                            03
                        </span>
                        <div>
                            <h2 className="font-heading font-bold text-xl uppercase tracking-tight text-industrial-gray/60">
                                Branding y Colores
                            </h2>
                            <p className="font-mono text-[10px] text-industrial-gray/40 uppercase tracking-widest">
                                Próximamente
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
