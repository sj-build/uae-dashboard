/**
 * Unsplash API client — server-only
 * NEVER import in client code (leaks API key)
 */

export interface UnsplashPhoto {
  readonly id: string
  readonly width: number
  readonly height: number
  readonly description: string | null
  readonly alt_description: string | null
  readonly urls: {
    readonly raw: string
    readonly full: string
    readonly regular: string
    readonly small: string
  }
  readonly links: {
    readonly html: string
    readonly download_location: string
  }
  readonly user: {
    readonly name: string
    readonly links: { readonly html: string }
  }
  readonly likes: number
  readonly tags?: ReadonlyArray<{ readonly title: string }>
}

interface UnsplashSearchResponse {
  readonly total: number
  readonly results: readonly UnsplashPhoto[]
}

function getAccessKey(): string {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) throw new Error('UNSPLASH_ACCESS_KEY not configured')
  return key
}

export async function searchPhotos(
  query: string,
  count = 8,
  orientation: 'landscape' | 'portrait' | 'squarish' = 'landscape'
): Promise<readonly UnsplashPhoto[]> {
  const key = getAccessKey()
  const params = new URLSearchParams({
    query,
    per_page: String(Math.min(count, 30)),
    orientation,
  })

  const response = await fetch(
    `https://api.unsplash.com/search/photos?${params}`,
    {
      headers: { Authorization: `Client-ID ${key}` },
      signal: AbortSignal.timeout(10000),
    }
  )

  if (!response.ok) {
    throw new Error(`Unsplash search failed: ${response.status}`)
  }

  const data: UnsplashSearchResponse = await response.json()
  return data.results
}

/**
 * Trigger download tracking (required by Unsplash API guidelines)
 */
export async function trackDownload(photo: UnsplashPhoto): Promise<void> {
  const key = getAccessKey()
  try {
    await fetch(photo.links.download_location, {
      headers: { Authorization: `Client-ID ${key}` },
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // Non-critical — best effort
  }
}

/**
 * Download photo bytes at specified width
 */
export async function downloadPhoto(
  photo: UnsplashPhoto,
  width = 2400
): Promise<Buffer> {
  const url = `${photo.urls.raw}&w=${width}&q=85&fm=jpg&fit=crop`

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    throw new Error(`Failed to download photo ${photo.id}: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Calculate quality score for ranking candidates
 */
export function scorePhoto(photo: UnsplashPhoto): number {
  let score = 50
  if (photo.width >= 2400) score += 20
  else if (photo.width >= 1600) score += 10
  if (photo.likes >= 500) score += 10
  else if (photo.likes >= 100) score += 5
  if (photo.height > 0 && photo.width / photo.height >= 1.3) score += 5 // landscape bias
  return Math.min(score, 100)
}

export function buildAttribution(photo: UnsplashPhoto): string {
  return `Photo by ${photo.user.name} on Unsplash`
}
