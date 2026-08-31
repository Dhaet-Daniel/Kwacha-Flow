import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native'
import { savingsApi, SavingsGoalDetail } from '../api/client'
import { showAlert, showConfirm } from '../lib/alerts'

export default function SavingsGoalDetailScreen({ route, navigation }: any) {
  const { id } = route.params
  const [goal, setGoal] = useState<SavingsGoalDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [contributionAmount, setContributionAmount] = useState('')
  const [showContribution, setShowContribution] = useState(false)

  const fetchGoal = async () => {
    try {
      const res = await savingsApi.get(id)
      setGoal(res.data)
    } catch (e) {
      showAlert('Error', 'Failed to load goal')
      navigation.goBack()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGoal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleAddContribution = async () => {
    if (!contributionAmount || parseFloat(contributionAmount) <= 0) {
      showAlert('Error', 'Please enter a valid amount')
      return
    }

    try {
      await savingsApi.addContribution(id, {
        amount: parseFloat(contributionAmount),
        date: new Date().toISOString().split('T')[0],
        note: 'Manual contribution',
      })
      showAlert('Success', 'Contribution added!')
      setContributionAmount('')
      setShowContribution(false)
      fetchGoal()
    } catch (e) {
      showAlert('Error', 'Failed to add contribution')
    }
  }

  const handleDelete = () => {
    showConfirm('Delete Goal', `Delete "${goal?.name}"?`, async () => {
      try {
        await savingsApi.delete(id)
        navigation.goBack()
      } catch (e) {
        showAlert('Error', 'Failed to delete goal')
      }
    })
  }

  if (loading || !goal) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.name}>{goal.name}</Text>
        <Text style={styles.targetDate}>
          Target: {new Date(goal.target_date).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressLabel}>Progress</Text>
        <Text style={styles.progressPercent}>{goal.progress_percentage.toFixed(1)}%</Text>
        <View style={styles.progressBarContainer}>
          <View
            style={[styles.progressBar, { width: `${Math.min(goal.progress_percentage, 100)}%` }]}
          />
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            K{Number(goal.current_amount).toFixed(2)} saved
          </Text>
          <Text style={styles.progressText}>
            of K{Number(goal.target_amount).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.detailCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Remaining</Text>
          <Text style={styles.detailValue}>K{Number(goal.remaining).toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Months Left</Text>
          <Text style={styles.detailValue}>{goal.months_remaining} months</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Recommended Monthly</Text>
          <Text style={styles.detailValue}>K{Number(goal.required_monthly_saving).toFixed(2)}</Text>
        </View>
        {goal.notes && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Notes</Text>
            <Text style={styles.detailValue}>{goal.notes}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.contributionButton}
        onPress={() => setShowContribution(!showContribution)}
      >
        <Text style={styles.contributionButtonText}>
          {showContribution ? 'Cancel' : '+ Add Contribution'}
        </Text>
      </TouchableOpacity>

      {showContribution && (
        <View style={styles.contributionForm}>
          <TextInput
            style={styles.input}
            placeholder="Amount (ZMW)"
            keyboardType="numeric"
            value={contributionAmount}
            onChangeText={setContributionAmount}
          />
          <TouchableOpacity style={styles.submitContribution} onPress={handleAddContribution}>
            <Text style={styles.submitContributionText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#2C3E50' }]}
          onPress={() => navigation.navigate('CreateSavingsGoal', { goalId: id })}
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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0, backgroundColor: '#F8F9FA' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  name: { fontSize: 22, fontWeight: '700', color: '#2C3E50' },
  targetDate: { fontSize: 14, color: '#7F8C8D', marginTop: 4 },
  progressCard: {
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
  progressLabel: { fontSize: 14, color: '#7F8C8D', marginBottom: 4 },
  progressPercent: { fontSize: 28, fontWeight: '700', color: '#2C3E50', marginBottom: 8 },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#E8ECF0',
    borderRadius: 5,
    marginVertical: 8,
  },
  progressBar: { height: '100%', borderRadius: 5, backgroundColor: '#2ED573' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 14, color: '#7F8C8D' },
  detailCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF0',
  },
  detailLabel: { fontSize: 14, color: '#7F8C8D' },
  detailValue: { fontSize: 14, color: '#2C3E50', fontWeight: '500' },
  contributionButton: {
    backgroundColor: '#2C3E50',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  contributionButtonText: { color: '#fff', fontWeight: '600' },
  contributionForm: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E8ECF0',
  },
  submitContribution: {
    backgroundColor: '#2ED573',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  submitContributionText: { color: '#fff', fontWeight: '600' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8, gap: 12 },
  actionButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  actionButtonText: { color: '#fff', fontWeight: '600' },
})