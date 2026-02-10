/**
 * Unsplash search queries per neighborhood
 * Keep queries SHORT (2-3 words) for better Unsplash results.
 * Longer queries return fewer/irrelevant results on Unsplash.
 */
export const NEIGHBORHOOD_QUERIES: Record<string, readonly string[]> = {
  // === Abu Dhabi ===
  'saadiyat-island': [
    'Louvre Abu Dhabi',
    'Saadiyat Island',
    'Abu Dhabi museum',
  ],
  'al-maryah-island': [
    'Abu Dhabi skyline',
    'Abu Dhabi financial district',
    'Abu Dhabi waterfront towers',
  ],
  'downtown-corniche': [
    'Abu Dhabi Corniche',
    'Abu Dhabi skyline sunset',
    'Corniche Abu Dhabi',
  ],
  'yas-island': [
    'Yas Marina Abu Dhabi',
    'Ferrari World Abu Dhabi',
    'Yas Island',
  ],
  'al-reem-island': [
    'Abu Dhabi towers',
    'Abu Dhabi skyline modern',
  ],
  'masdar-city': [
    'Masdar City',
    'Abu Dhabi sustainable',
  ],
  'kizad': [
    'Khalifa Port Abu Dhabi',
    'Abu Dhabi port industrial',
  ],

  // === Dubai ===
  'difc': [
    'DIFC Dubai',
    'Dubai financial centre',
    'Gate Building Dubai',
  ],
  'downtown-dubai': [
    'Burj Khalifa',
    'Dubai fountain',
    'Downtown Dubai skyline',
  ],
  'business-bay': [
    'Business Bay Dubai',
    'Dubai canal skyline',
    'Dubai Business Bay night',
  ],
  'dubai-marina': [
    'Dubai Marina',
    'Dubai Marina skyline',
    'JBR Dubai beach',
  ],
  'jlt': [
    'Jumeirah Lake Towers',
    'JLT Dubai',
    'Dubai lake towers skyline',
  ],
  'internet-city-media-city': [
    'Dubai Media City',
    'Dubai Internet City',
    'Dubai technology district',
  ],
  'deira-old-dubai': [
    'Dubai Creek',
    'Dubai Gold Souk',
    'Old Dubai souks',
  ],
} as const
