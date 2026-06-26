export const DEFAULT_WHATSAPP_PHONE = '573013732290'
export const DEFAULT_WHATSAPP_MESSAGE = 'Hola, quiero hacer un pedido en TEXERE.ART.'
export const WHATSAPP_PHONE_KEY = 'whatsapp_phone'
export const WHATSAPP_MESSAGE_KEY = 'whatsapp_message'

export type ConfigRow = {
  key: string
  value: string | null
}

export type WhatsAppConfig = {
  phone: string
  message: string
}

export function normalizeWhatsAppPhone(value: string | null | undefined) {
  return String(value || '').replace(/[^0-9]/g, '')
}

export function buildWhatsAppContactUrl(phone: string | null | undefined, message?: string | null) {
  const normalizedPhone = normalizeWhatsAppPhone(phone) || DEFAULT_WHATSAPP_PHONE
  const cleanMessage = String(message || '').trim()

  if (!cleanMessage) {
    return `https://wa.me/${normalizedPhone}`
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(cleanMessage)}`
}

export function resolveWhatsAppConfig(rows: ConfigRow[] | null | undefined, envPhone?: string | null): WhatsAppConfig {
  const phoneFromDb = rows?.find(row => row.key === WHATSAPP_PHONE_KEY)?.value
  const messageFromDb = rows?.find(row => row.key === WHATSAPP_MESSAGE_KEY)?.value
  const normalizedPhone = normalizeWhatsAppPhone(phoneFromDb || envPhone || DEFAULT_WHATSAPP_PHONE)

  return {
    phone: normalizedPhone || DEFAULT_WHATSAPP_PHONE,
    message: messageFromDb?.trim() || DEFAULT_WHATSAPP_MESSAGE,
  }
}
