import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildReadyProductCheckoutMessage,
  buildReadyProductCheckoutPayload,
  buildReadyProductCheckoutUrl,
  formatCopPrice,
} from '../lib/checkout/ready-product'

const product = {
  id: 'ready_001',
  slug: 'hoodie-superman',
  name: 'Hoodie Superman',
  price: 135000,
}

test('formatCopPrice formats Colombian peso values for checkout copy', () => {
  assert.equal(formatCopPrice(135000), '$135.000')
})

test('buildReadyProductCheckoutPayload keeps the payment-ready contract', () => {
  assert.deepEqual(
    buildReadyProductCheckoutPayload(product, {
      color: 'Negro',
      size: 'M',
      sourceUrl: 'https://texere.vercel.app/shop/hoodie-superman',
    }),
    {
      checkoutType: 'whatsapp',
      productId: 'ready_001',
      slug: 'hoodie-superman',
      name: 'Hoodie Superman',
      price: 135000,
      color: 'Negro',
      size: 'M',
      sourceUrl: 'https://texere.vercel.app/shop/hoodie-superman',
    },
  )
})

test('buildReadyProductCheckoutMessage includes product, price, size, color, link, and lead time', () => {
  const message = buildReadyProductCheckoutMessage(
    product,
    {
      color: 'Negro',
      size: 'M',
      sourceUrl: 'https://texere.vercel.app/shop/hoodie-superman',
    },
    '7 a 10 dias habiles',
  )

  assert.match(message, /Producto: Hoodie Superman/)
  assert.match(message, /Precio: \$135\.000 COP/)
  assert.match(message, /Color: Negro/)
  assert.match(message, /Talla: M/)
  assert.match(message, /Link: https:\/\/texere\.vercel\.app\/shop\/hoodie-superman/)
  assert.match(message, /Tiempo estimado: 7 a 10 dias habiles/)
})

test('buildReadyProductCheckoutUrl sanitizes phone and encodes the WhatsApp message', () => {
  const url = buildReadyProductCheckoutUrl(
    product,
    {
      color: 'Negro',
      size: 'M',
      sourceUrl: 'https://texere.vercel.app/shop/hoodie-superman',
    },
    '7 a 10 dias habiles',
    { phone: '+57 301 373 2290' },
  )
  const decodedMessage = decodeURIComponent(url.split('text=')[1] || '')

  assert.equal(url.startsWith('https://wa.me/573013732290?text='), true)
  assert.match(decodedMessage, /Producto: Hoodie Superman/)
  assert.match(decodedMessage, /Precio: \$135\.000 COP/)
  assert.match(decodedMessage, /Talla: M/)
})
