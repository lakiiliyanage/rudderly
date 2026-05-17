import slugify from 'slugify'

export function generateBaseSlug(name: string): string {
  return slugify(name ?? 'agent', { lower: true, strict: true })
}

export function addUniqueSuffix(slug: string): string {
  return slug + '-' + Math.random().toString(16).slice(2, 6)
}
