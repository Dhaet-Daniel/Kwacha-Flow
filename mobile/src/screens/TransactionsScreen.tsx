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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { incomeApi, expenseApi, Income, Expense } from '../api/client'
import TransactionCard from '../components/TransactionCard'

type TransactionRow =
  | ({ type: 'income' } & Income)
  | ({ type: 'expense' } & Expense)

export default function TransactionsScreen({ navigation }: { navigation: any }) {
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = async () => {
    try {
      setError(null)
      const [incomeRes, expenseRes] = await Promise.all([
        incomeApi.list({ limit: 50 }),
        expenseApi.list({ limit: 50 }),
      ])

      const incomes: TransactionRow[] = incomeRes.data.data.map(item => ({
        ...item,
        type: 'income' as const,
      }))
      const expenses: TransactionRow[] = expenseRes.data.data.map(item => ({
        ...item,
        type: 'expense' as const,
      }))

      const all = [...incomes, ...expenses]
      all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setTransactions(all)
    } catch (e: any) {
      console.error('Failed to fetch transactions:', e?.message ?? e)
      setError('Could not load transactions. Is the API server running?')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchTransactions()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  )

  const onRefresh = () => {
    setRefreshing(true)
    fetchTransactions()
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
      {error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.emptySubText}>Pull down or reload to retry</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptySubText}>
            Tap the + button to add your first income or expense
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TransactionCard
              id={item.id}
              type={item.type}
              amount={Number(item.amount)}
              description={item.description}
              categoryId={'category_id' in item ? item.category_id : undefined}
              categoryName={
                item.type === 'expense' ? item.category_name : undefined
              }
              source={item.type === 'income' ? item.source : undefined}
              date={item.date}
              onPress={() =>
                navigation.navigate('TransactionDetail', { id: item.id, type: item.type })
              }
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
        />
      )}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AddTransaction')}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>
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
  listContent: {
    paddingVertical: 8,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
})
