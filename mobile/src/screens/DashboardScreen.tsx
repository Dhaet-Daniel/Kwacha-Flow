import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { dashboardApi, DashboardData } from '../api/client'

export default function DashboardScreen({ navigation }: any) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = async () => {
    try {
      setError(null)
      const res = await dashboardApi.get()
      setData(res.data)
    } catch (e: any) {
      console.error('Failed to fetch dashboard:', e?.message ?? e)
      setError('Could not load dashboard. Is the API server running?')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchDashboard()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  )

  const onRefresh = () => {
    setRefreshing(true)
    fetchDashboard()
  }

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'No data available'}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true)
            fetchDashboard()
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.welcome}>Welcome back! 👋</Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>K{data.balance.toFixed(2)}</Text>
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceRowLabel}>Income</Text>
            <Text style={[styles.balanceRowValue, { color: '#27AE60' }]}>
              +K{data.total_income.toFixed(2)}
            </Text>
          </View>
          <View>
            <Text style={styles.balanceRowLabel}>Spending</Text>
            <Text style={[styles.balanceRowValue, { color: '#E74C3C' }]}>
              -K{data.total_expenses.toFixed(2)}
            </Text>
          </View>
          <View>
            <Text style={styles.balanceRowLabel}>Savings</Text>
            <Text style={[styles.balanceRowValue, { color: '#3498DB' }]}>
              K{data.savings_total.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {data.budget_health.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Health</Text>
          {data.budget_health.map(cat => (
            <View key={cat.category_id} style={styles.budgetItem}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetName}>{cat.category_name}</Text>
                <Text style={styles.budgetAmounts}>
                  K{cat.spent.toFixed(2)} / K{cat.allocated.toFixed(2)}
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min(cat.percentage, 100)}%`,
                      backgroundColor: getStatusColor(cat.status),
                    },
                  ]}
                />
              </View>
              <Text style={styles.budgetPercent}>
                {cat.percentage.toFixed(1)}% used • Remaining: K{cat.remaining.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {data.recent_transactions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {data.recent_transactions.map(tx => (
            <View key={tx.id} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionCategory}>{tx.category}</Text>
                <Text style={styles.transactionDesc}>
                  {tx.description || 'No description'}
                </Text>
                <Text style={styles.transactionDate}>
                  {new Date(tx.date).toLocaleDateString()}
                </Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: tx.type === 'income' ? '#27AE60' : '#E74C3C' },
                ]}
              >
                {tx.type === 'income' ? '+' : '-'}K{tx.amount.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {data.insights.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Insights</Text>
          {data.insights.map(insight => (
            <View key={insight.id} style={styles.insightItem}>
              <Text style={styles.insightText}>{insight.message}</Text>
              <Text style={styles.insightDate}>
                {new Date(insight.created_at).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#F8F9FA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  welcome: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  balanceCard: {
    backgroundColor: '#2C3E50',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  balanceLabel: {
    color: '#A4B0BE',
    fontSize: 14,
    marginBottom: 4,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  balanceRowLabel: {
    color: '#A4B0BE',
    fontSize: 12,
    marginBottom: 2,
  },
  balanceRowValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  seeAll: {
    color: '#3498DB',
    fontSize: 14,
    fontWeight: '500',
  },
  budgetItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  budgetName: {
    fontSize: 14,
    color: '#2C3E50',
  },
  budgetAmounts: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E8ECF0',
    borderRadius: 3,
    marginVertical: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  budgetPercent: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  transactionItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  transactionCategory: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2C3E50',
  },
  transactionDesc: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  transactionDate: {
    fontSize: 11,
    color: '#A4B0BE',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  insightItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
  },
  insightText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  insightDate: {
    fontSize: 11,
    color: '#A4B0BE',
    marginTop: 4,
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