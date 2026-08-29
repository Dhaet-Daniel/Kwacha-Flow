import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { budgetApi, Budget } from '../api/client'
import { showAlert, showConfirm } from '../lib/alerts'

export default function BudgetsScreen({ navigation }: { navigation: any }) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBudgets = async () => {
    try {
      setError(null)
      const res = await budgetApi.list()
      setBudgets(res.data.data || [])
    } catch (e: any) {
      console.error('Failed to fetch budgets:', e?.message ?? e)
      setError('Could not load budgets. Is the API server running?')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchBudgets()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  )

  const onRefresh = () => {
    setRefreshing(true)
    fetchBudgets()
  }

  const handleDelete = (id: string, name: string) => {
    showConfirm(
      'Delete Budget',
      `Delete "${name}"?`,
      async () => {
        try {
          await budgetApi.delete(id)
          fetchBudgets()
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Budgets</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateBudget')}
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.emptySubText}>Pull down or reload to retry</Text>
        </View>
      ) : budgets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No budgets yet</Text>
          <Text style={styles.emptySubText}>
            Create your first budget to start tracking your spending.
          </Text>
        </View>
      ) : (
        <FlatList
          data={budgets}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.budgetCard}
              onPress={() => navigation.navigate('BudgetDetail', { id: item.id })}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.budgetName}>{item.name}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: item.is_active ? '#27AE60' : '#7F8C8D' },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              <Text style={styles.budgetPeriod}>
                {item.period.charAt(0).toUpperCase() + item.period.slice(1)} •{' '}
                {new Date(item.start_date).toLocaleDateString()} -{' '}
                {new Date(item.end_date).toLocaleDateString()}
              </Text>
              {item.total_budget !== null && item.total_budget !== undefined && (
                <Text style={styles.budgetTotal}>
                  Total Budget: K{Number(item.total_budget).toFixed(2)}
                </Text>
              )}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => navigation.navigate('CreateBudget', { budgetId: item.id })}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item.id, item.name)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
  },
  addButton: {
    backgroundColor: '#2C3E50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  budgetCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  budgetName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  budgetPeriod: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  budgetTotal: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E8ECF0',
    borderRadius: 6,
  },
  editButtonText: {
    color: '#2C3E50',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FDECEA',
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#E74C3C',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
})