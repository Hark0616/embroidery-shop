'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateDeliveryTime } from '@/lib/actions/config'

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className="px-8 py-4 bg-industrial-black text-industrial-white text-xs font-bold tracking-widest uppercase
        hover:bg-industrial-warning hover:text-industrial-black transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending ? 'Guardando...' : 'Guardar Cambios'}
        </button>
    )
}

export default function ConfigForm({ initialMessage }: { initialMessage: string }) {
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function clientAction(formData: FormData) {
        setSuccess(false)
        setError(null)

        try {
            await updateDeliveryTime(formData)
            setSuccess(true)
            // Ocultar mensaje de éxito después de 3 segundos
            setTimeout(() => setSuccess(false), 3000)
        } catch (e) {
            console.error(e)
            setError('Hubo un error al guardar. Verifica la consola o la base de datos.')
        }
    }

    return (
        <form action={clientAction} className="space-y-6">
            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">¡Éxito! </strong>
                    <span className="block sm:inline">Configuración actualizada correctamente.</span>
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

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
                    defaultValue={initialMessage}
                    className="w-full px-4 py-4 bg-industrial-light border border-industrial-gray/20
            text-industrial-black font-bold tracking-wide
            focus:outline-none focus:ring-2 focus:ring-industrial-warning focus:border-industrial-warning
            transition-colors duration-200"
                    placeholder="Ej: 15 DÍAS HÁBILES"
                />
            </div>

            <div className="pt-4 border-t border-industrial-gray/10 flex gap-4">
                <SubmitButton />
                <a
                    href="/admin"
                    className="px-8 py-4 border border-industrial-gray/30 text-industrial-black text-xs font-bold tracking-widest uppercase
            hover:bg-industrial-light transition-colors duration-200 flex items-center"
                >
                    Cancelar
                </a>
            </div>
        </form>
    )
}
