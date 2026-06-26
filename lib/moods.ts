export function buildMoodHref(mood: string) {
  return mood === 'custom'
    ? '/studio?custom=true'
    : `/designs?mood=${encodeURIComponent(mood)}`
}
