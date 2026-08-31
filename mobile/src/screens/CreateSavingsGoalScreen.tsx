import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { savingsApi } from '../api/client'
import { showAlert } from '../lib/alerts'

export default function CreateSavingsGoalScreen({ navigation, route }: any) {
  const { goalId } = route.params || {}

  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (goalId) {
      setIsEditing(true)
      const fetchGoal = async () => {
        try {
          const res = await savingsApi.get(goalId)
          const data = res.data
          setName(data.name)
          setTargetAmount(String(data.target_amount))
          setTargetDate(data.target_date)
          setNotes(data.notes || '')
        } catch (e) {
          showAlert('Error', 'Failed to load goal')
          navigation.goBack()
        }
      }
      fetchGoal()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalId])

  const handleSubmit = async () => {
    if (!name.trim()) {
      showAlert('Error', 'Please enter a goal name')
      return
    }
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      showAlert('Error', 'Please enter a valid target amount')
      return
    }
    if (!targetDate) {
      showAlert('Error', 'Please enter a target date')
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: name.trim(),
        target_amount: parseFloat(targetAmount),
        target_date: targetDate,
        notes: notes || undefined,
      }

      if (isEditing) {
        await savingsApi.update(goalId, payload)
        showAlert('Success', 'Goal updated')
        navigation.goBack()
      } else {
        const created = await savingsApi.create(payload)
        showAlert('Success', 'Goal created')
        navigation.replace('SavingsGoalDetail', { id: created.data.id })
      }
    } catch (e: any) {
      showAlert('Error', e?.response?.data?.detail || 'Failed to save goal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{isEditing ? 'Edit Savings Goal' : 'Create Savings Goal'}</Text>

      <Text style={styles.label}>Goal Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Laptop Fund"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Target Amount (ZMW)</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        keyboardType="numeric"
        value={targetAmount}
        onChangeText={setTargetAmount}
      />

      <Text style={styles.label}>Target Date</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={targetDate}
        onChangeText={setTargetDate}
      />

      <Text style={styles.label}>Notes (Optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Add any notes..."
        multiline
        numberOfLines={4}
        value={notes}
        onChangeText={setNotes}
      />

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>
            {isEditing ? 'Update' : 'Create'} Goal
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0, backgroundColor: '#F8F9FA' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#2C3E50', marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E8ECF0',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitButton: {
    backgroundColor: '#2C3E50',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})