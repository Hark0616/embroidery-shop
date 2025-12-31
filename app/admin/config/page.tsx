import { getDeliveryTime, updateDeliveryTime } from '@/lib/actions/config'
import Link from 'next/link'

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

                <form action={updateDeliveryTime} className="space-y-6">
                    <div>
                        <label htmlFor="message" className="block text-industrial-gray text-xs tracking-wide uppercase mb-2 font-bold">
                            Mensaje Global
                        </label>
                        <p className="text-xs text-gray-500 mb-4">
                            Este texto aparecerá en toda la tienda indicando el tiempo estimado de producción.
                        </p>
                        <input
                            id="message"
                            name="message"
                            type="text"
                            required
                            defaultValue={currentMessage}
                            className="w-full px-4 py-4 bg-industrial-light border border-industrial-gray/20
                text-industrial-black font-bold tracking-wide
                focus:outline-none focus:ring-2 focus:ring-industrial-warning focus:border-industrial-warning
                transition-colors duration-200"
                            placeholder="Ej: 15 DÍAS HÁBILES"
                        />
                    </div>

                    <div className="pt-4 border-t border-industrial-gray/10 flex gap-4">
                        <button
                            type="submit"
                            className="px-8 py-4 bg-industrial-black text-industrial-white text-xs font-bold tracking-widest uppercase
                hover:bg-industrial-warning hover:text-industrial-black transition-colors duration-200"
                        >
                            Guardar Cambios
                        </button>
                        <Link
                            href="/admin"
                            className="px-8 py-4 border border-industrial-gray/30 text-industrial-black text-xs font-bold tracking-widest uppercase
                hover:bg-industrial-light transition-colors duration-200"
                        >
                            Cancelar
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
