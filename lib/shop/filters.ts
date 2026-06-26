export function normalizeShopFilter(value: string | string[] | null | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value

  return String(rawValue || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
}

export function buildShopHref({
  drop,
}: {
  drop?: string | null
}) {
  const params = new URLSearchParams()
  const normalizedDrop = normalizeShopFilter(drop)

  if (normalizedDrop) params.set('drop', normalizedDrop)

  const query = params.toString()
  return query ? `/shop?${query}` : '/shop'
}
