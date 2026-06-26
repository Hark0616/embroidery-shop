import { redirect } from 'next/navigation'
import { getUser } from '@/lib/actions/auth'
import Sidebar from '@/components/admin/Sidebar'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-industrial-light">
      <Sidebar />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}

