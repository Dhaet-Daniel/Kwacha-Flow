import axios from 'axios'
import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'

// Android emulators reach the host machine's loopback via 10.0.2.2.
// Web and iOS keep using EXPO_PUBLIC_API_URL (localhost).
const API_URL =
  Platform.OS === 'android'
    ? process.env.EXPO_PUBLIC_API_URL_ANDROID || 'http://10.0.2.2:8000/api/v1'
    : process.env.EXPO_PUBLIC_API_URL

// Turns backend-relative asset paths (e.g. /api/v1/users/avatar/<id>) into
// absolute URLs the <Image> element can load on any platform.
const API_ORIGIN = (() => {
  try {
    return new URL(API_URL).origin
  } catch {
    return ''
  }
})()

export function resolveAssetUrl(url: string): string {
  return url.startsWith('http') ? url : `${API_ORIGIN}${url}`
}

const api = axios.create({
  baseURL: API_URL,
})

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// ---------- Types ----------

export interface Income {
  id: string
  user_id: string
  amount: number
  currency: string
  source: string
  description: string | null
  date: string
  is_recurring: boolean
  recurrence_period: 'monthly' | 'weekly' | 'semester' | null
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  user_id: string
  amount: number
  currency: string
  category_id: number
  description: string | null
  date: string
  created_at: string
  updated_at: string
  category_name?: string | null
}

export interface Category {
  id: number
  name: string
  icon: string | null
  color: string | null
  is_system: boolean
}

export interface TransactionListResponse<T> {
  data: T[]
  total: number
  limit: number
  offset: number
}

export interface BudgetAllocation {
  id: string
  budget_id: string
  category_id: number
  allocated_amount: number
}

export interface Budget {
  id: string
  user_id: string
  name: string
  period: 'monthly' | 'weekly' | 'semester'
  start_date: string
  end_date: string
  total_budget: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BudgetCategoryDetail {
  category_id: number
  category_name: string
  category_icon: string | null
  category_color: string | null
  allocated_amount: number
  spent_amount: number
  remaining: number
  percentage_used: number
  status: 'ok' | 'warning' | 'exceeded'
}

export interface BudgetDetail extends Budget {
  allocations: BudgetCategoryDetail[]
  total_spent: number
  total_remaining: number
  overall_percentage: number
  days_remaining: number | null
  daily_recommended_limit: number | null
}

export interface BudgetListResponse {
  data: Budget[]
  total: number
}

// ---------- Income endpoints ----------

export const incomeApi = {
  list: (params?: {
    start?: string
    end?: string
    limit?: number
    offset?: number
  }) =>
    api.get<TransactionListResponse<Income>>('/transactions/incomes', { params }),
  get: (id: string) => api.get<Income>(`/transactions/incomes/${id}`),
  create: (data: Partial<Income>) => api.post<Income>('/transactions/incomes', data),
  update: (id: string, data: Partial<Income>) => api.put<Income>(`/transactions/incomes/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/incomes/${id}`),
}

// ---------- Expense endpoints ----------

export const expenseApi = {
  list: (params?: {
    start?: string
    end?: string
    category_id?: number
    limit?: number
    offset?: number
  }) =>
    api.get<TransactionListResponse<Expense>>('/transactions/expenses', { params }),
  get: (id: string) => api.get<Expense>(`/transactions/expenses/${id}`),
  create: (data: Partial<Expense>) => api.post<Expense>('/transactions/expenses', data),
  update: (id: string, data: Partial<Expense>) => api.put<Expense>(`/transactions/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/expenses/${id}`),
}

// ---------- Categories ----------

export const categoryApi = {
  list: () => api.get<Category[]>('/transactions/categories'),
}

// ---------- Summary ----------

export const summaryApi = {
  get: (params?: { start?: string; end?: string }) =>
    api.get<{ total_income: number; total_expenses: number; net: number }>(
      '/transactions/summary',
      { params },
    ),
}

// ---------- Budgets ----------

export const budgetApi = {
  list: () => api.get<BudgetListResponse>('/budgets'),
  active: () => api.get<BudgetDetail>('/budgets/active'),
  get: (id: string) => api.get<BudgetDetail>(`/budgets/${id}`),
  create: (data: Partial<Budget> & { allocations?: { category_id: number; allocated_amount: number }[] }) =>
    api.post<Budget>('/budgets', data),
  update: (id: string, data: Partial<Budget>) => api.put<Budget>(`/budgets/${id}`, data),
  delete: (id: string) => api.delete(`/budgets/${id}`),
  updateAllocations: (id: string, allocations: { category_id: number; allocated_amount: number }[]) =>
    api.put(`/budgets/${id}/allocations`, allocations),
}

// ---------- Dashboard ----------

export interface BudgetHealthItem {
  category_id: number
  category_name: string
  allocated: number
  spent: number
  remaining: number
  percentage: number
  status: 'ok' | 'warning' | 'exceeded'
}

export interface RecentTransactionItem {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
}

export interface InsightItem {
  id: string
  type: string
  message: string
  created_at: string
}

export interface DashboardData {
  balance: number
  total_income: number
  total_expenses: number
  savings_total: number
  budget_health: BudgetHealthItem[]
  recent_transactions: RecentTransactionItem[]
  insights: InsightItem[]
  active_budget_id: string | null
  savings_goals_count: number
}

export const dashboardApi = {
  get: () => api.get<DashboardData>('/dashboard'),
}

export const demoApi = {
  seed: () => api.post('/demo/seed'),
}

// ---------- Profile ----------

export interface UserProfile {
  id: string
  full_name: string
  university: string | null
  year_of_study: number | null
  currency: string
  preferences: Record<string, unknown> | null
  avatar_url?: string | null
  created_at: string
  updated_at: string
}

export const profileApi = {
  get: () => api.get<UserProfile>('/users/profile'),
  create: (data: Partial<UserProfile>) => api.post<UserProfile>('/users/profile', data),
  update: (data: Partial<UserProfile>) => api.put<UserProfile>('/users/profile', data),
}

export const avatarApi = {
  upload: (form: FormData) => api.put<{ avatar_url: string }>('/users/profile/avatar', form),
}

// ---------- Savings ----------

export interface SavingsGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface SavingsGoalDetail extends SavingsGoal {
  remaining: number
  progress_percentage: number
  months_remaining: number
  required_monthly_saving: number
}

export interface SavingsTransaction {
  id: string
  goal_id: string
  user_id: string
  amount: number
  date: string
  note?: string | null
  created_at: string
}

export interface SavingsGoalInput {
  name: string
  target_amount: number
  target_date: string
  notes?: string | null
}

export interface SavingsTransactionInput {
  amount: number
  date: string
  note?: string | null
}

export interface SavingsGoalListResponse {
  data: SavingsGoal[]
  total: number
}

export interface SavingsTransactionListResponse {
  data: SavingsTransaction[]
  total: number
}

export const savingsApi = {
  list: () => api.get<SavingsGoalListResponse>('/savings/goals'),
  create: (data: SavingsGoalInput) => api.post<SavingsGoal>('/savings/goals', data),
  get: (id: string) => api.get<SavingsGoalDetail>(`/savings/goals/${id}`),
  update: (id: string, data: Partial<SavingsGoalInput>) =>
    api.put<SavingsGoal>(`/savings/goals/${id}`, data),
  delete: (id: string) => api.delete(`/savings/goals/${id}`),
  addContribution: (id: string, data: SavingsTransactionInput) =>
    api.post<SavingsTransaction>(`/savings/goals/${id}/contributions`, data),
  getContributions: (id: string) =>
    api.get<SavingsTransactionListResponse>(`/savings/goals/${id}/contributions`),
}

export default api
