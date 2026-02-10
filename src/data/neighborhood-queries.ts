/**
 * Default Unsplash search queries per neighborhood
 * Each neighborhood has 2-3 queries to get diverse candidates
 */
export const NEIGHBORHOOD_QUERIES: Record<string, readonly string[]> = {
  // === Abu Dhabi ===
  'saadiyat-island': [
    'Saadiyat Island Louvre Abu Dhabi exterior',
    'Saadiyat Island Abu Dhabi beach',
    'Saadiyat cultural district Abu Dhabi',
  ],
  'al-maryah-island': [
    'Al Maryah Island Abu Dhabi skyline',
    'Galleria Al Maryah Island Abu Dhabi',
    'ADGM Abu Dhabi financial district',
  ],
  'downtown-corniche': [
    'Abu Dhabi Corniche skyline',
    'Abu Dhabi skyline corniche sunset',
    'Abu Dhabi downtown waterfront',
  ],
  'yas-island': [
    'Yas Island Abu Dhabi sunset',
    'Yas Marina Circuit Abu Dhabi',
    'Yas Bay waterfront Abu Dhabi night',
  ],
  'al-reem-island': [
    'Al Reem Island Abu Dhabi towers',
    'Abu Dhabi residential towers waterfront',
  ],
  'masdar-city': [
    'Masdar City Abu Dhabi architecture',
    'Masdar City sustainable city',
  ],
  'kizad': [
    'Khalifa Port Abu Dhabi',
    'Abu Dhabi industrial zone port',
  ],

  // === Dubai ===
  'difc': [
    'DIFC Gate Building Dubai',
    'DIFC Dubai skyline night',
    'Dubai International Financial Centre',
  ],
  'downtown-dubai': [
    'Burj Khalifa Dubai skyline night',
    'Dubai Fountain night',
    'Downtown Dubai aerial view',
  ],
  'business-bay': [
    'Business Bay Dubai canal skyline',
    'Business Bay Dubai towers night',
  ],
  'dubai-marina': [
    'Dubai Marina skyline',
    'Dubai Marina waterfront',
    'Dubai Marina towers',
  ],
  'jlt': [
    'Jumeirah Lake Towers Dubai',
    'JLT Dubai skyline',
    'Dubai lake towers',
  ],
  'internet-city-media-city': [
    'Dubai Media City',
    'Dubai technology park',
    'Dubai modern office skyline',
  ],
  'deira-old-dubai': [
    'Dubai Creek traditional',
    'Old Dubai souks',
    'Deira Dubai waterfront',
  ],
  'dubai-south': [
    'Dubai Expo city',
    'Dubai South district',
    'Al Maktoum Airport Dubai',
  ],
} as const
