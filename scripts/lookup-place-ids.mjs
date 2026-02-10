#!/usr/bin/env node
/**
 * 1-time script: look up Google Place IDs for all 15 UAE neighborhoods.
 * Usage: GOOGLE_PLACES_API_KEY=xxx node scripts/lookup-place-ids.mjs
 *
 * Paste the output into src/data/google-place-ids.ts
 */

const API_KEY = process.env.GOOGLE_PLACES_API_KEY
if (!API_KEY) {
  console.error('Set GOOGLE_PLACES_API_KEY env var')
  process.exit(1)
}

const PLACES = [
  // Abu Dhabi
  { slug: 'saadiyat-island', query: 'Saadiyat Island Abu Dhabi' },
  { slug: 'al-maryah-island', query: 'Al Maryah Island Abu Dhabi' },
  { slug: 'downtown-corniche', query: 'Corniche Abu Dhabi' },
  { slug: 'yas-island', query: 'Yas Island Abu Dhabi' },
  { slug: 'al-reem-island', query: 'Al Reem Island Abu Dhabi' },
  { slug: 'masdar-city', query: 'Masdar City Abu Dhabi' },
  { slug: 'kizad', query: 'KIZAD Khalifa Industrial Zone Abu Dhabi' },
  // Dubai
  { slug: 'difc', query: 'Dubai International Financial Centre DIFC' },
  { slug: 'downtown-dubai', query: 'Downtown Dubai Burj Khalifa' },
  { slug: 'business-bay', query: 'Business Bay Dubai' },
  { slug: 'dubai-marina', query: 'Dubai Marina' },
  { slug: 'jlt', query: 'Jumeirah Lake Towers JLT Dubai' },
  { slug: 'internet-city-media-city', query: 'Dubai Internet City Media City' },
  { slug: 'deira-old-dubai', query: 'Deira Old Dubai' },
  { slug: 'dubai-south', query: 'Dubai South Expo City' },
]

async function lookupPlaceId(query) {
  const response = await fetch(
    'https://places.googleapis.com/v1/places:searchText',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName',
      },
      body: JSON.stringify({ textQuery: query }),
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API error ${response.status}: ${text}`)
  }

  const data = await response.json()
  const place = data.places?.[0]
  if (!place) return null

  return { id: place.id, name: place.displayName?.text }
}

async function main() {
  console.log('Looking up Place IDs...\n')

  for (const { slug, query } of PLACES) {
    try {
      const result = await lookupPlaceId(query)
      if (result) {
        console.log(`  '${slug}': '${result.id}',  // ${result.name}`)
      } else {
        console.log(`  // '${slug}': NOT FOUND (query: "${query}")`)
      }
    } catch (err) {
      console.log(`  // '${slug}': ERROR - ${err.message}`)
    }

    // Rate limit courtesy
    await new Promise(r => setTimeout(r, 200))
  }

  console.log('\nDone. Paste above into src/data/google-place-ids.ts')
}

main()
