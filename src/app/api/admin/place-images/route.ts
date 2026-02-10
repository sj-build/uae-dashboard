import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { verifySessionToken } from '@/lib/auth'
import { buildPhotoUrl } from '@/lib/google-places'

export const maxDuration = 55

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_DOMAINS = [
  'images.unsplash.com',
  'plus.unsplash.com',
  'places.googleapis.com',
  'lh3.googleusercontent.com',
]

async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  if (!session?.value) return false
  const { valid } = verifySessionToken(session.value)
  return valid
}

function validateImageBuffer(buffer: Buffer): string | null {
  if (buffer.length > MAX_IMAGE_SIZE) {
    return `Image exceeds maximum size of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`
  }
  // JPEG magic bytes: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return null
  }
  // PNG magic bytes: 89 50 4E 47
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return null
  }
  return 'Downloaded file is not a valid JPEG or PNG image'
}

function isAllowedDomain(url: string): boolean {
  try {
    const parsed = new URL(url)
    const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', '10.', '192.168.']
    if (blocked.some(b => parsed.hostname.includes(b))) return false
    return ALLOWED_IMAGE_DOMAINS.some(d => parsed.hostname.endsWith(d))
  } catch {
    return false
  }
}

/**
 * For Google Places photo URLs stored without API key,
 * resolve to a full URL with the key injected.
 */
/**
 * For Google Places photo URLs stored without API key,
 * resolve to a full URL with the key injected.
 * Returns original URL if not a Google Places photo or key unavailable.
 */
function resolveImageUrl(url: string): string {
  const GOOGLE_PHOTO_PATTERN = /^https:\/\/places\.googleapis\.com\/v1\/(places\/[^/]+\/photos\/[^/]+)\/media/
  const match = url.match(GOOGLE_PHOTO_PATTERN)
  if (match) {
    try {
      const photoName = match[1]
      const parsed = new URL(url)
      const maxWidth = parseInt(parsed.searchParams.get('maxWidthPx') ?? '1200', 10)
      return buildPhotoUrl(photoName, maxWidth)
    } catch {
      return url
    }
  }
  return url
}

async function downloadAndMirror(
  imageSourceUrl: string,
  slug: string,
): Promise<{ imageUrl: string; buffer: Buffer } | { error: string; status: number }> {
  const supabase = getSupabaseAdmin()

  const fetchUrl = resolveImageUrl(imageSourceUrl)
  const imageResponse = await fetch(fetchUrl, {
    signal: AbortSignal.timeout(15000),
  })

  if (!imageResponse.ok) {
    return { error: `Failed to download image: ${imageResponse.status}`, status: 502 }
  }

  const arrayBuffer = await imageResponse.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const validationError = validateImageBuffer(buffer)
  if (validationError) {
    return { error: validationError, status: 400 }
  }

  const storagePath = `place-selected/${slug}.jpg`
  const { error: uploadError } = await supabase.storage
    .from('neighborhood-images')
    .upload(storagePath, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (uploadError) {
    return { error: `Storage upload failed: ${uploadError.message}`, status: 500 }
  }

  const { data: urlData } = supabase.storage
    .from('neighborhood-images')
    .getPublicUrl(storagePath)

  return { imageUrl: urlData.publicUrl, buffer }
}

/**
 * GET /api/admin/place-images?slug=difc
 * Returns candidates and current selection for a place.
 * Without slug: returns all places overview.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const isAuthed = await checkAdminAuth()
  if (!isAuthed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const supabase = getSupabaseAdmin()

    if (slug) {
      const [candidates, selected] = await Promise.all([
        supabase
          .from('place_image_candidates')
          .select('*')
          .eq('place_slug', slug)
          .order('score', { ascending: false }),
        supabase
          .from('place_image_selected')
          .select('*')
          .eq('place_slug', slug)
          .single(),
      ])

      return NextResponse.json({
        slug,
        candidates: candidates.data ?? [],
        selected: selected.data ?? null,
      })
    }

    const { data: allSelected } = await supabase
      .from('place_image_selected')
      .select('place_slug, image_url, updated_at')
      .order('place_slug')

    return NextResponse.json({
      selected: allSelected ?? [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

const SelectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).max(80),
  candidate_id: z.number().int().positive().optional(),
  manual_url: z.string().url().optional(),
})

/**
 * POST /api/admin/place-images
 * Select a candidate: download -> mirror to Storage -> upsert place_image_selected
 */
export async function POST(request: Request): Promise<NextResponse> {
  const isAuthed = await checkAdminAuth()
  if (!isAuthed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = SelectSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    const { slug, candidate_id, manual_url } = parsed.data

    if (!candidate_id && !manual_url) {
      return NextResponse.json(
        { error: 'Either candidate_id or manual_url required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    let imageUrl: string
    let sourceInfo: Record<string, unknown>

    if (manual_url) {
      // SSRF protection: only allow known image domains
      if (!isAllowedDomain(manual_url)) {
        return NextResponse.json(
          { error: 'Only Unsplash or Google Places image URLs are allowed' },
          { status: 400 }
        )
      }

      const result = await downloadAndMirror(manual_url, slug)
      if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: result.status })
      }
      imageUrl = result.imageUrl
      sourceInfo = { provider: 'manual', url: manual_url }
    } else {
      // Select from candidates
      const { data: candidate, error } = await supabase
        .from('place_image_candidates')
        .select('*')
        .eq('id', candidate_id)
        .single()

      if (error || !candidate) {
        return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
      }

      const result = await downloadAndMirror(candidate.image_url, slug)
      if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: result.status })
      }
      imageUrl = result.imageUrl
      sourceInfo = {
        provider: candidate.provider,
        provider_ref: candidate.provider_ref,
        photographer: candidate.photographer,
        photographer_url: candidate.photographer_url,
        license: candidate.license,
        source_url: candidate.source_url,
        attribution: candidate.meta?.attribution,
      }
    }

    // Upsert place_image_selected
    const { error: upsertError } = await supabase
      .from('place_image_selected')
      .upsert({
        place_slug: slug,
        image_url: imageUrl,
        source: sourceInfo,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'place_slug',
      })

    if (upsertError) {
      return NextResponse.json(
        { error: `Failed to save selection: ${upsertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      slug,
      image_url: imageUrl,
      source: sourceInfo,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Selection failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
