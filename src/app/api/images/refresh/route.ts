import { NextResponse } from 'next/server'
import { z } from 'zod'
import { refreshNeighborhoodImages } from '@/lib/image-refresh'

export const maxDuration = 55

const RequestSchema = z.object({
  city: z.enum(['abudhabi', 'dubai']),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(80),
  queries: z.array(z.string().max(200)).min(1).max(5).optional(),
  setActive: z.boolean().default(true),
  topN: z.number().int().min(1).max(5).default(3),
})

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const secret = request.headers.get('x-admin-secret') || request.headers.get('authorization')?.replace('Bearer ', '')
    const expected = process.env.ADMIN_PASSWORD ?? process.env.CRON_SECRET
    if (!expected || secret !== expected) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    const result = await refreshNeighborhoodImages({
      city: parsed.data.city,
      slug: parsed.data.slug,
      queries: parsed.data.queries,
      setActive: parsed.data.setActive,
      topN: parsed.data.topN,
    })

    return NextResponse.json(result, { status: result.success ? 200 : 404 })
  } catch (error) {
    console.error('Image refresh error:', error)
    return NextResponse.json(
      { success: false, error: 'Image refresh failed' },
      { status: 500 }
    )
  }
}
