/**
 * Google Place ID mapping for UAE neighborhoods.
 * Obtained via Text Search API — see scripts/lookup-place-ids.mjs
 *
 * To refresh: GOOGLE_PLACES_API_KEY=xxx node scripts/lookup-place-ids.mjs
 */
export const GOOGLE_PLACE_IDS: Readonly<Record<string, string>> = {
  // === Abu Dhabi ===
  'saadiyat-island': 'ChIJYRsgrvddXj4RHvV3y9oG32E',     // Saadiyat Island
  'al-maryah-island': 'ChIJ9210VFNmXj4RsXFYDOrNsxw',    // Al Maryah Island
  'downtown-corniche': 'ChIJFXiv_txlXj4Rxwlz4hvxVck',    // Corniche Beach
  'yas-island': 'ChIJFUMXnH1FXj4RjuQ3zzNfor4',          // Yas Island
  'al-reem-island': 'ChIJ3cx4zb5nXj4RRdOyI77vS60',      // Al Reem Island
  'masdar-city': 'ChIJ8fHzaaNIXj4RW84Hcbf8eCw',         // Masdar City
  'kizad': 'ChIJn0aeqc7-Xj4R4iecR7GPF28',               // Khalifa Industrial Zone

  // === Dubai ===
  'difc': 'ChIJTSevApJCXz4Ry6uFtXbgsRo',                // Dubai International Financial Centre
  'downtown-dubai': 'ChIJS-JnijRDXz4R4rfO4QLlRf8',       // Burj Khalifa
  'business-bay': 'ChIJV_Ql7y1oXz4RDpVweQnE1D0',        // Business Bay
  'dubai-marina': 'ChIJX47nvlBrXz4RVW5QiQ0Xvjw',        // Dubai Marina Walk
  'jlt': 'ChIJrYFul61sXz4R3D-GuGTkC6g',                // Almas Tower (JLT landmark)
  'internet-city-media-city': 'ChIJZwjxwkRrXz4RxwvrTkr4urI', // Dubai Media City
  'deira-old-dubai': 'ChIJLTy3FUBDXz4Rhnt9HVVW1vM',     // Deira Old Souk
} as const
