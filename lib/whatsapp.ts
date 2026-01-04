export interface OrderDetails {
    productName: string
    designName: string
    color: string
    size: string
    totalPrice?: number
}

export function buildWhatsAppMessage(details: OrderDetails, currentUrl: string): string {
    const phone = '573013732290' // Configurable or env var

    const text = `
Hola! 👋 Me interesa armar este pedido personalizado:

👕 *Base*: ${details.productName}
🎨 *Color*: ${details.color}
📏 *Talla*: ${details.size}
🖼️ *Diseño*: ${details.designName}

🔗 *Referencia*: ${currentUrl}

Quedo atento para confirmar disponibilidad y pago. Gracias!
`.trim()

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}
