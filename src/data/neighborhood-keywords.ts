/**
 * Must-include keywords for filtering Unsplash search results per neighborhood.
 * A candidate photo must match at least 1 of these keywords in its
 * description, alt_description, OR tags to pass the relevance filter.
 *
 * Keep keywords broad enough to not over-filter.
 * The city name (abu dhabi / dubai) alone is often sufficient.
 */
export const NEIGHBORHOOD_KEYWORDS: Record<string, readonly string[]> = {
  // === Abu Dhabi ===
  'saadiyat-island': ['saadiyat', 'louvre', 'abu dhabi'],
  'al-maryah-island': ['abu dhabi', 'maryah', 'adgm', 'galleria'],
  'downtown-corniche': ['abu dhabi', 'corniche'],
  'yas-island': ['yas', 'abu dhabi', 'ferrari', 'f1'],
  'al-reem-island': ['abu dhabi', 'reem'],
  'masdar-city': ['masdar', 'abu dhabi'],
  'kizad': ['abu dhabi', 'khalifa', 'port', 'industrial'],

  // === Dubai ===
  'difc': ['difc', 'dubai', 'financial'],
  'downtown-dubai': ['dubai', 'burj khalifa', 'khalifa', 'fountain', 'downtown'],
  'business-bay': ['dubai', 'business bay', 'canal'],
  'dubai-marina': ['dubai', 'marina', 'jbr'],
  'jlt': ['dubai', 'jlt', 'jumeirah lake', 'lake towers'],
  'internet-city-media-city': ['dubai', 'media city', 'internet city'],
  'deira-old-dubai': ['dubai', 'creek', 'deira', 'souk'],
  'dubai-south': ['dubai', 'expo', 'maktoum'],
} as const

/**
 * Negative keywords — photos containing these words get score penalty.
 * Prevents indoor/people/food photos from ranking high.
 */
export const NEGATIVE_KEYWORDS: readonly string[] = [
  'office', 'meeting', 'laptop', 'workspace', 'typing', 'desk',
  'person', 'portrait', 'selfie', 'food', 'plate', 'coffee',
  'notebook', 'phone', 'indoor', 'interior', 'closeup', 'macro',
] as const
