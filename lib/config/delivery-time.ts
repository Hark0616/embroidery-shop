export const DELIVERY_TIME_KEY = 'delivery_time_message'
export const LEGACY_DELIVERY_TIME_KEY = 'lead_time_message'
export const DEFAULT_DELIVERY_TIME_MESSAGE = '15 DÍAS HÁBILES'

export type DeliveryTimeConfigRow = {
  key: string
  value: string | null
}

export function resolveDeliveryTime(rows: DeliveryTimeConfigRow[] | null | undefined) {
  const preferred = rows?.find(row => row.key === DELIVERY_TIME_KEY)
  const legacy = rows?.find(row => row.key === LEGACY_DELIVERY_TIME_KEY)

  return preferred?.value || legacy?.value || DEFAULT_DELIVERY_TIME_MESSAGE
}
