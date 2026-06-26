import { DEFAULT_WHATSAPP_PHONE, buildWhatsAppContactUrl } from './config/whatsapp'

export interface OrderDetails {
    productName: string
    designName: string
    color: string
    size: string
    totalPrice?: number
}

export function buildWhatsAppMessage(
    details: OrderDetails,
    currentUrl: string,
    phone = DEFAULT_WHATSAPP_PHONE,
): string {
    const text = `
Hola! 👋 Me interesa armar este pedido personalizado:

👕 *Base*: ${details.productName}
🎨 *Color*: ${details.color}
📏 *Talla*: ${details.size}
🖼️ *Diseño*: ${details.designName}

🔗 *Referencia*: ${currentUrl}

Quedo atento para confirmar disponibilidad y pago. Gracias!
`.trim()

    return buildWhatsAppContactUrl(phone, text)
}
