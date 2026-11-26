export const DECK_THEME_OPTIONS = [
  {
    value: 'indigo',
    label: 'Executive Indigo',
    shortLabel: 'Indigo',
    hint: 'Boardroom & SaaS',
  },
  {
    value: 'emerald',
    label: 'Venture Emerald',
    shortLabel: 'Emerald',
    hint: 'Growth & climate',
  },
  {
    value: 'amber',
    label: 'Editorial Amber',
    shortLabel: 'Amber',
    hint: 'Strategy & research',
  },
  {
    value: 'coral',
    label: 'Keynote Coral',
    shortLabel: 'Coral',
    hint: 'Product & pitch',
  },
];

export const VALID_DECK_THEMES = new Set(DECK_THEME_OPTIONS.map((option) => option.value));

export function normalizeDeckTheme(value) {
  const cleaned = String(value || '').trim().toLowerCase();
  return VALID_DECK_THEMES.has(cleaned) ? cleaned : 'indigo';
}
