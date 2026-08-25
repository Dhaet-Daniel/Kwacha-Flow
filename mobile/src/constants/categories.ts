export interface CategoryDef {
  id: number
  name: string
  icon: string
  color: string
}

// Mirrors the seeded expense_categories table in Supabase.
// Used as offline fallback; live values come from categoryApi.list()
export const CATEGORIES: CategoryDef[] = [
  { id: 1, name: 'Food', icon: 'fast-food', color: '#FF6B6B' },
  { id: 2, name: 'Transport', icon: 'bus', color: '#4ECDC4' },
  { id: 3, name: 'Accommodation', icon: 'home', color: '#45B7D1' },
  { id: 4, name: 'Data/Airtime', icon: 'wifi', color: '#96CEB4' },
  { id: 5, name: 'Entertainment', icon: 'film', color: '#FFEAA7' },
  { id: 6, name: 'Education', icon: 'school', color: '#DDA0DD' },
  { id: 7, name: 'Shopping', icon: 'cart', color: '#FF9FF3' },
  { id: 8, name: 'Health', icon: 'heartbeat', color: '#FF4757' },
  { id: 9, name: 'Savings', icon: 'piggy-bank', color: '#2ED573' },
  { id: 10, name: 'Miscellaneous', icon: 'more-horiz', color: '#A4B0BE' },
]

export const getCategory = (id: number): CategoryDef | undefined =>
  CATEGORIES.find(c => c.id === id)

export const getCategoryIcon = (id: number): string =>
  getCategory(id)?.icon ?? 'help'

export const getCategoryColor = (id: number): string =>
  getCategory(id)?.color ?? '#A4B0BE'

export const getCategoryName = (id: number): string =>
  getCategory(id)?.name ?? 'Unknown'

export interface IncomeSourceDef {
  label: string
  value: string
}

// Predefined income sources; 'other' reveals a custom input
export const INCOME_SOURCES: IncomeSourceDef[] = [
  { label: 'Allowance', value: 'Allowance' },
  { label: 'Part-time job', value: 'Part-time job' },
  { label: 'Scholarship / Bursary', value: 'Scholarship / Bursary' },
  { label: 'Family support', value: 'Family support' },
  { label: 'Freelance / Side hustle', value: 'Freelance / Side hustle' },
  { label: 'Business', value: 'Business' },
  { label: 'Other', value: '__other__' },
]
