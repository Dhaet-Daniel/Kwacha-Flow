import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { budgetApi, BudgetDetail } from '../api/client'
import CategoryIcon from '../components/CategoryIcon'
import { showAlert, showConfirm } from '../lib/alerts'

const FormContainer = Platform.OS === 'web' ? View : KeyboardAvoidingView

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ok':
      return '#27AE60'
    case 'warning':
      return '#F39C12'
    case 'exceeded':
      return '#E74C3C'
    default:
      return '#7F8C8D'
  }
}

export default function BudgetDetailScreen({ route, navigation }: any) {
  const { id } = route.params
  const [budget, setBudget] = useState<BudgetDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBudget = async () => {
    try {
      setError(null)
      const res = await budgetApi.get(id)
      setBudget(res.data)
    } catch (e: any) {
      console.error('Failed to load budget:', e?.message ?? e)
      setError('Could not load budget. Is the API server running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBudget()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleDelete = () => {
    showConfirm(
      'Delete Budget',
      `Delete "${budget?.name}"?`,
      async () => {
        try {
          await budgetApi.delete(id)
          navigation.goBack()
        } catch (e: any) {
          console.error('Failed to delete budget:', e?.message ?? e)
          showAlert('Error', 'Failed to delete budget')
        }
      },
    )
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (error || !budget) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Budget not found'}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true)
            fetchBudget()
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const totalAllocated = budget.allocations.reduce((sum, a) => sum + a.allocated_amount, 0)

  return (
    <FormContainer
      style={styles.container}
      {...(Platform.OS !== 'web' ? { behavior: Platform.OS === 'ios' ? 'padding' : undefined } : {})}
    >
      <ScrollView style={styles.formScroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{budget.name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: budget.is_active ? '#27AE60' : '#7F8C8D' },
            ]}
          >
            <Text style={styles.statusText}>{budget.is_active ? 'Active' : 'Inactive'}</Text>
          </View>
          <Text style={styles.period}>
            {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} •{' '}
            {new Date(budget.start_date).toLocaleDateString()} -{' '}
            {new Date(budget.end_date).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Allocated</Text>
            <Text style={styles.summaryValue}>K{Number(totalAllocated).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={[styles.summaryValue, { color: '#E74C3C' }]}>
              K{Number(budget.total_spent).toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text style={[styles.summaryValue, { color: '#27AE60' }]}>
              K{Number(budget.total_remaining).toFixed(2)}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(budget.overall_percentage, 100)}%`,
                  backgroundColor: getStatusColor(
                    budget.overall_percentage > 90
                      ? 'exceeded'
                      : budget.overall_percentage > 70
                        ? 'warning'
                        : 'ok',
                  ),
                },
              ]}
            />
          </View>
          <Text style={styles.overallPercent}>{budget.overall_percentage.toFixed(1)}% used</Text>
          {budget.days_remaining !== null && budget.days_remaining !== undefined && (
            <Text style={styles.dailyLimit}>
              {budget.days_remaining} days left • Recommended: K
              {Number(budget.daily_recommended_limit ?? 0).toFixed(2)}/day
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        {budget.allocations.map(cat => (
          <View key={cat.category_id} style={styles.categoryRow}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryNameRow}>
                <CategoryIcon
                  name={cat.category_icon ?? 'help'}
                  size={16}
                  color={cat.category_color ?? '#7F8C8D'}
                />
                <Text style={styles.categoryName}>{cat.category_name}</Text>
              </View>
              <Text style={styles.categoryAmounts}>
                K{Number(cat.spent_amount).toFixed(2)} / K{Number(cat.allocated_amount).toFixed(2)}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(cat.percentage_used, 100)}%`,
                    backgroundColor: getStatusColor(cat.status),
                  },
                ]}
              />
            </View>
            <Text style={styles.categoryPercent}>
              {cat.percentage_used.toFixed(1)}% used • Remaining: K{Number(cat.remaining).toFixed(2)}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#2C3E50' }]}
          onPress={() => navigation.navigate('CreateBudget', { budgetId: id })}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#E74C3C' }]}
          onPress={handleDelete}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </FormContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#F8F9FA',
    position: 'relative',
  },
  formScroll: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    padding: 16,
    paddingBottom: 128,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  header: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E50',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  period: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 6,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E8ECF0',
    borderRadius: 4,
    marginVertical: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  overallPercent: {
    fontSize: 13,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  dailyLimit: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginTop: 8,
    marginBottom: 12,
  },
  categoryRow: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 15,
    color: '#2C3E50',
    marginLeft: 6,
  },
  categoryAmounts: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  categoryPercent: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
  },
  actionBar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E8ECF0',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    elevation: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#2C3E50',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
})