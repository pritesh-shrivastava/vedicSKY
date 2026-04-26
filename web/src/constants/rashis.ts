export const RASHI_SHORT: string[] = [
  'Ar', 'Ta', 'Ge', 'Ca', 'Le', 'Vi',
  'Li', 'Sc', 'Sa', 'Cp', 'Aq', 'Pi',
]

export const RASHI_FULL: string[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

// Devanagari — full names used in South Indian chart corner labels
export const RASHI_DEV: string[] = [
  'मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या',
  'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन',
]

// Devanagari — short labels for inside the zodiac wheel
export const RASHI_DEV_SHORT: string[] = [
  'मेष', 'वृष', 'मिथ', 'कर्क', 'सिंह', 'कन्या',
  'तुला', 'वृश्चि', 'धनु', 'मकर', 'कुंभ', 'मीन',
]

// Fixed sign positions for South Indian chart
// key = "col,row" (col 0-3, row 0-3), value = rashi index (0=Aries … 11=Pisces)
export const SOUTH_GRID: Record<string, number> = {
  '0,3': 11, '1,3': 0, '2,3': 1,  '3,3': 2,
  '0,2': 10,                        '3,2': 3,
  '0,1': 9,                         '3,1': 4,
  '0,0': 8,  '1,0': 7, '2,0': 6,  '3,0': 5,
}
