/**
 * Google Places API (New) client — server-only
 * NEVER import in client code (leaks API key)
 *
 * Uses Places API (New):
 *  - Place Details for photo references
 *  - Photo Media for image download URLs
 */

export interface GooglePlacePhoto {
  readonly name: string
  readonly widthPx: number
  readonly heightPx: number
  readonly authorAttributions: ReadonlyArray<{
    readonly displayName: string
    readonly uri: string
  }>
}

interface PlaceDetailsResponse {
  readonly photos?: readonly GooglePlacePhoto[]
}

function getApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) throw new Error('GOOGLE_PLACES_API_KEY not configured')
  return key
}

/**
 * Fetch photos for a Google Place ID via Place Details (New) API.
 * Only requests the `photos` field to minimize cost.
 */
export async function fetchPlacePhotos(
  placeId: string,
  maxPhotos = 10
): Promise<readonly GooglePlacePhoto[]> {
  const key = getApiKey()

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}?key=${key}`,
    {
      headers: {
        'X-Goog-FieldMask': 'photos',
      },
      signal: AbortSignal.timeout(10000),
    }
  )

  if (!response.ok) {
    throw new Error(`Google Places Details failed: ${response.status}`)
  }

  const data: PlaceDetailsResponse = await response.json()
  return (data.photos ?? []).slice(0, maxPhotos)
}

/**
 * Build full-size photo download URL (1200px wide).
 * Google returns a 302 redirect to lh3.googleusercontent.com.
 * API key is injected server-side — NEVER store the result in DB or return to client.
 */
export function buildPhotoUrl(photoName: string, maxWidth = 1200): string {
  const key = getApiKey()
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${key}`
}

/**
 * Build a key-free reference URL for DB storage.
 * Does NOT include the API key — safe to store/return to clients.
 * Must be resolved via buildPhotoUrl() before fetching.
 */
export function buildPhotoRef(photoName: string, maxWidth = 1200): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}`
}

/**
 * Build thumbnail reference URL (400px, key-free for DB storage).
 */
export function buildPhotoThumbRef(photoName: string): string {
  return buildPhotoRef(photoName, 400)
}

/**
 * Resolve a Google Places photo URL by following the 302 redirect
 * to get the final lh3.googleusercontent.com CDN URL.
 * The CDN URL is temporary but lasts long enough for admin preview.
 * Returns null if resolution fails.
 */
export async function resolvePhotoRedirect(photoName: string, maxWidth = 400): Promise<string | null> {
  try {
    const url = buildPhotoUrl(photoName, maxWidth)
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    })
    const location = response.headers.get('location')
    return location ?? null
  } catch {
    return null
  }
}

/**
 * Score a Google Places photo.
 * Base score 70 (higher than Unsplash 50) because Google photos
 * are verified to be from the actual location.
 */
export function scoreGooglePhoto(photo: GooglePlacePhoto): number {
  let score = 70
  if (photo.widthPx >= 2400) score += 15
  else if (photo.widthPx >= 1600) score += 8
  if (photo.heightPx > 0 && photo.widthPx / photo.heightPx >= 1.3) score += 5
  return Math.min(score, 100)
}
