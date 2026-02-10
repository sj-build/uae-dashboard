import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import placesData from '@/../supabase/seed/places.json'
import { upsertDocumentFromPlace } from '@/lib/db'

export const maxDuration = 55

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('Supabase configuration missing')
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET ?? process.env.ADMIN_PASSWORD
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    let upserted = 0
    let synced = 0

    // 1. Seed places table
    for (const place of placesData) {
      const { error } = await supabase
        .from('places')
        .upsert(place, { onConflict: 'slug' })

      if (error) {
        console.error(`Failed to upsert ${place.slug}:`, error.message)
      } else {
        upserted++
      }
    }

    // 2. Sync to documents for RAG
    const { data: allPlaces } = await supabase
      .from('places')
      .select('*')

    if (allPlaces) {
      for (const place of allPlaces) {
        try {
          await upsertDocumentFromPlace(place)
          synced++
        } catch (err) {
          console.error(`Failed to sync place ${place.slug} to documents:`, err)
        }
      }
    }

    return NextResponse.json({
      success: true,
      total: placesData.length,
      upserted,
      synced,
    })
  } catch (error) {
    console.error('Seed places error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
