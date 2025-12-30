import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

type AuditAction =
    | 'LOGIN'
    | 'LOGOUT'
    | 'CREATE_PRODUCT'
    | 'UPDATE_PRODUCT'
    | 'DELETE_PRODUCT'
    | 'TOGGLE_PRODUCT'

export async function logAudit(
    action: AuditAction,
    resource: string,
    details?: Record<string, any>
) {
    try {
        const supabase = await createClient()
        if (!supabase) return

        const { data: { user } } = await supabase.auth.getUser()

        // Attempt to get IP address
        const headersList = headers()
        const ip = headersList.get('x-forwarded-for') || 'unknown'

        await supabase.from('audit_logs').insert({
            user_id: user?.id || null,
            action,
            resource,
            details,
            ip_address: ip
        })
    } catch (error) {
        // Fail silently to avoid breaking the main flow, but log to console
        console.error('Audit Log Error:', error)
    }
}
