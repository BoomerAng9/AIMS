/**
 * Region Types for A.I.M.S.
 * Supports country, state/province, city, postal code auto-complete
 */

export interface Country {
  code: string;        // ISO 3166-1 alpha-2
  name: string;
  dialCode: string;
  currency: string;
  currencySymbol: string;
  timezone: string;    // Primary timezone
  flag: string;        // Emoji flag
}

export interface Region {
  countryCode: string;
  countryName: string;
  adminArea?: string;      // State/Province
  locality?: string;       // City
  postalCode?: string;
  timezone?: string;
}

export interface UserRegionProfile {
  country: Country;
  adminArea?: string;
  locality?: string;
  postalCode?: string;
  addressLine1?: string;
  addressLine2?: string;
  timezone: string;
  locale: {
    language: string;
    dateFormat: string;
    numberFormat: string;
  };
  currency: {
    code: string;
    symbol: string;
  };
}

// Comprehensive country list with metadata
export const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', dialCode: '+1', currency: 'USD', currencySymbol: '$', timezone: 'America/New_York', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', currency: 'GBP', currencySymbol: '£', timezone: 'Europe/London', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dialCode: '+1', currency: 'CAD', currencySymbol: 'C$', timezone: 'America/Toronto', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dialCode: '+61', currency: 'AUD', currencySymbol: 'A$', timezone: 'Australia/Sydney', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', dialCode: '+49', currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Berlin', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Paris', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', dialCode: '+34', currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Madrid', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', dialCode: '+39', currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Rome', flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Amsterdam', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Brussels', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', currency: 'CHF', currencySymbol: 'Fr', timezone: 'Europe/Zurich', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', dialCode: '+43', currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Vienna', flag: '🇦🇹' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', currency: 'SEK', currencySymbol: 'kr', timezone: 'Europe/Stockholm', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', dialCode: '+47', currency: 'NOK', currencySymbol: 'kr', timezone: 'Europe/Oslo', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', currency: 'DKK', currencySymbol: 'kr', timezone: 'Europe/Copenhagen', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', dialCode: '+358', currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Helsinki', flag: '🇫🇮' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Dublin', flag: '🇮🇪' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Lisbon', flag: '🇵🇹' },
  { code: 'PL', name: 'Poland', dialCode: '+48', currency: 'PLN', currencySymbol: 'zł', timezone: 'Europe/Warsaw', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420', currency: 'CZK', currencySymbol: 'Kč', timezone: 'Europe/Prague', flag: '🇨🇿' },
  { code: 'HU', name: 'Hungary', dialCode: '+36', currency: 'HUF', currencySymbol: 'Ft', timezone: 'Europe/Budapest', flag: '🇭🇺' },
  { code: 'RO', name: 'Romania', dialCode: '+40', currency: 'RON', currencySymbol: 'lei', timezone: 'Europe/Bucharest', flag: '🇷🇴' },
  { code: 'GR', name: 'Greece', dialCode: '+30', currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Athens', flag: '🇬🇷' },
  { code: 'JP', name: 'Japan', dialCode: '+81', currency: 'JPY', currencySymbol: '¥', timezone: 'Asia/Tokyo', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', currency: 'KRW', currencySymbol: '₩', timezone: 'Asia/Seoul', flag: '🇰🇷' },
  { code: 'CN', name: 'China', dialCode: '+86', currency: 'CNY', currencySymbol: '¥', timezone: 'Asia/Shanghai', flag: '🇨🇳' },
  { code: 'IN', name: 'India', dialCode: '+91', currency: 'INR', currencySymbol: '₹', timezone: 'Asia/Kolkata', flag: '🇮🇳' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', currency: 'SGD', currencySymbol: 'S$', timezone: 'Asia/Singapore', flag: '🇸🇬' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', currency: 'HKD', currencySymbol: 'HK$', timezone: 'Asia/Hong_Kong', flag: '🇭🇰' },
  { code: 'TW', name: 'Taiwan', dialCode: '+886', currency: 'TWD', currencySymbol: 'NT$', timezone: 'Asia/Taipei', flag: '🇹🇼' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', currency: 'MYR', currencySymbol: 'RM', timezone: 'Asia/Kuala_Lumpur', flag: '🇲🇾' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', currency: 'THB', currencySymbol: '฿', timezone: 'Asia/Bangkok', flag: '🇹🇭' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', currency: 'PHP', currencySymbol: '₱', timezone: 'Asia/Manila', flag: '🇵🇭' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', currency: 'IDR', currencySymbol: 'Rp', timezone: 'Asia/Jakarta', flag: '🇮🇩' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', currency: 'VND', currencySymbol: '₫', timezone: 'Asia/Ho_Chi_Minh', flag: '🇻🇳' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', currency: 'AED', currencySymbol: 'د.إ', timezone: 'Asia/Dubai', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', currency: 'SAR', currencySymbol: '﷼', timezone: 'Asia/Riyadh', flag: '🇸🇦' },
  { code: 'IL', name: 'Israel', dialCode: '+972', currency: 'ILS', currencySymbol: '₪', timezone: 'Asia/Jerusalem', flag: '🇮🇱' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', currency: 'TRY', currencySymbol: '₺', timezone: 'Europe/Istanbul', flag: '🇹🇷' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', currency: 'ZAR', currencySymbol: 'R', timezone: 'Africa/Johannesburg', flag: '🇿🇦' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', currency: 'EGP', currencySymbol: '£', timezone: 'Africa/Cairo', flag: '🇪🇬' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', currency: 'NGN', currencySymbol: '₦', timezone: 'Africa/Lagos', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', currency: 'KES', currencySymbol: 'KSh', timezone: 'Africa/Nairobi', flag: '🇰🇪' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', currency: 'MXN', currencySymbol: '$', timezone: 'America/Mexico_City', flag: '🇲🇽' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', currency: 'BRL', currencySymbol: 'R$', timezone: 'America/Sao_Paulo', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', currency: 'ARS', currencySymbol: '$', timezone: 'America/Argentina/Buenos_Aires', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', dialCode: '+56', currency: 'CLP', currencySymbol: '$', timezone: 'America/Santiago', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', currency: 'COP', currencySymbol: '$', timezone: 'America/Bogota', flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', dialCode: '+51', currency: 'PEN', currencySymbol: 'S/', timezone: 'America/Lima', flag: '🇵🇪' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', currency: 'NZD', currencySymbol: 'NZ$', timezone: 'Pacific/Auckland', flag: '🇳🇿' },
  { code: 'RU', name: 'Russia', dialCode: '+7', currency: 'RUB', currencySymbol: '₽', timezone: 'Europe/Moscow', flag: '🇷🇺' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380', currency: 'UAH', currencySymbol: '₴', timezone: 'Europe/Kiev', flag: '🇺🇦' },
];

// US States for address auto-complete
export const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
];

// Canadian Provinces
export const CA_PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' },
];

// Helper function to get admin areas by country
export function getAdminAreas(countryCode: string): { code: string; name: string }[] {
  switch (countryCode) {
    case 'US':
      return US_STATES;
    case 'CA':
      return CA_PROVINCES;
    default:
      return [];
  }
}

// Helper function to search countries
export function searchCountries(query: string): Country[] {
  if (!query) return COUNTRIES.slice(0, 10);

  const lowerQuery = query.toLowerCase();
  return COUNTRIES.filter(
    c => c.name.toLowerCase().includes(lowerQuery) ||
         c.code.toLowerCase().includes(lowerQuery)
  ).slice(0, 10);
}

// Helper function to search admin areas
export function searchAdminAreas(
  countryCode: string,
  query: string
): { code: string; name: string }[] {
  const areas = getAdminAreas(countryCode);
  if (!query) return areas.slice(0, 10);

  const lowerQuery = query.toLowerCase();
  return areas.filter(
    a => a.name.toLowerCase().includes(lowerQuery) ||
         a.code.toLowerCase().includes(lowerQuery)
  ).slice(0, 10);
}
