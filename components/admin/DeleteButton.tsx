'use client'

import { useTransition } from 'react'

interface DeleteButtonProps {
  action: (formData: FormData) => Promise<void>
  payload: Record<string, string>
  confirmMessage?: string
  label: string
  className?: string
}

export default function DeleteButton({
  action,
  payload,
  confirmMessage = '¿Estás seguro?',
  label,
  className
}: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!window.confirm(confirmMessage)) return

    const formData = new FormData()
    Object.entries(payload).forEach(([key, val]) => {
      formData.append(key, val)
    })

    startTransition(async () => {
      try {
        await action(formData)
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al eliminar')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <button
        type="submit"
        disabled={isPending}
        className={className}
      >
        {isPending ? 'Eliminando...' : label}
      </button>
    </form>
  )
}
