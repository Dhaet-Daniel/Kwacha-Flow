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
import { savingsApi, SavingsGoal } from '../api/client'
import { showAlert, showConfirm } from '../lib/alerts'

type GoalWithProgress = SavingsGoal & { progress_percentage: number }

export default function SavingsScreen({ navigation }: any) {
  const [goals, setGoals] = useState<GoalWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGoals = async () => {
    try {
      setError(null)
      const res = await savingsApi.list()
      // Fetch details for each goal to get progress
      const goalsWithProgress = await Promise.all(
        res.data.data.map(async (goal: SavingsGoal) => {
          const detail = await savingsApi.get(goal.id)
          return { ...goal, progress_percentage: detail.data.progress_percentage }
        })
      )
      setGoals(goalsWithProgress)
    } catch (e: any) {
      console.error('Failed to fetch savings goals:', e?.message ?? e)
      setError('Could not load savings goals. Is the API server running?')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchGoals()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  )

  const onRefresh = () => {
    setRefreshing(true)
    fetchGoals()
  }

  const handleDelete = (id: string, name: string) => {
    showConfirm('Delete Goal', `Delete "${name}"?`, async () => {
      try {
        await savingsApi.delete(id)
        fetchGoals()
      } catch (e) {
        showAlert('Error', 'Failed to delete goal')
      }
    })
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true)
            fetchGoals()
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Savings Goals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateSavingsGoal')}
        >
          <Text style={styles.addButtonText}>+ New Goal</Text>
        </TouchableOpacity>
      </View>

      {goals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No savings goals yet</Text>
          <Text style={styles.emptySubText}>
            Set a goal to start saving towards something important.
          </Text>
        </View>
      ) : (
        <FlatList
          data={goals}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.goalCard}
              onPress={() => navigation.navigate('SavingsGoalDetail', { id: item.id })}
              activeOpacity={0.7}
            >
              <View style={styles.goalHeader}>
                <Text style={styles.goalName}>{item.name}</Text>
                <Text style={styles.goalPercent}>
                  {item.progress_percentage.toFixed(1)}% complete
                </Text>
              </View>
              <Text style={styles.goalTarget}>
                Target: K{Number(item.target_amount).toFixed(2)}
              </Text>
              <Text style={styles.goalProgress}>
                Saved: K{Number(item.current_amount).toFixed(2)}
              </Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min(item.progress_percentage || 0, 100)}%`,
                      backgroundColor: '#2ED573',
                    },
                  ]}
                />
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => navigation.navigate('CreateSavingsGoal', { goalId: item.id })}
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
  container: { flex: 1, minHeight: 0, backgroundColor: '#F8F9FA' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#2C3E50' },
  addButton: {
    backgroundColor: '#2C3E50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  goalCard: {
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
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalName: { fontSize: 18, fontWeight: '600', color: '#2C3E50' },
  goalPercent: { fontSize: 13, color: '#7F8C8D' },
  goalTarget: { fontSize: 14, color: '#7F8C8D', marginTop: 2 },
  goalProgress: { fontSize: 14, color: '#2C3E50', marginTop: 2 },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E8ECF0',
    borderRadius: 4,
    marginTop: 8,
  },
  progressBar: { height: '100%', borderRadius: 4 },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 10,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E8ECF0',
    borderRadius: 6,
  },
  editButtonText: { color: '#2C3E50', fontSize: 13, fontWeight: '600' },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FDECEA',
    borderRadius: 6,
  },
  deleteButtonText: { color: '#E74C3C', fontSize: 13, fontWeight: '600' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: { fontSize: 20, fontWeight: '600', color: '#2C3E50', marginBottom: 8 },
  emptySubText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
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