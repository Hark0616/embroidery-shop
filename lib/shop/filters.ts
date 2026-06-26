export function normalizeShopFilter(value: string | string[] | null | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value

  return String(rawValue || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
}

export function buildShopHref({
  drop,
  tag,
}: {
  drop?: string | null
  tag?: string | null
}) {
  const params = new URLSearchParams()
  const normalizedDrop = normalizeShopFilter(drop)
  const normalizedTag = normalizeShopFilter(tag)

  if (normalizedDrop) params.set('drop', normalizedDrop)
  if (normalizedTag) params.set('tag', normalizedTag)

  const query = params.toString()
  return query ? `/shop?${query}` : '/shop'
}
