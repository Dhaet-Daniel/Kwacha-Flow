import axios from 'axios'
import { supabase } from '../lib/supabase'

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
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

export default api
