import { redirect } from 'next/navigation'
import { getUser } from '@/lib/actions/auth'
import Sidebar from '@/components/admin/Sidebar'

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
    <div className="flex min-h-screen bg-mint-soft">
      <Sidebar />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}

