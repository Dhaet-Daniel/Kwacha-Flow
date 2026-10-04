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
import DateField from '../components/DateField'
import { showAlert } from '../lib/alerts'

export default function CreateSavingsGoalScreen({ navigation, route }: any) {
  const { goalId } = route.params || {}

  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [touched, setTouched] = useState({ name: false, amount: false, date: false })

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

  const nameError = !name.trim() ? 'Enter a goal name.' : ''
  const amountError =
    !targetAmount || isNaN(parseFloat(targetAmount)) || parseFloat(targetAmount) <= 0
      ? 'Enter a target amount above 0.'
      : ''
  const dateError = !targetDate ? 'Pick a target date.' : ''

  const handleSubmit = async () => {
    if (nameError || amountError || dateError) {
      setTouched({ name: true, amount: true, date: true })
      showAlert('Error', 'Please fix the highlighted fields')
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
        style={[styles.input, touched.name && !!nameError && styles.inputError]}
        placeholder="e.g., Laptop Fund"
        value={name}
        onChangeText={setName}
        onBlur={() => setTouched(t => ({ ...t, name: true }))}
      />
      {touched.name && !!nameError && <Text style={styles.errorText}>{nameError}</Text>}

      <Text style={styles.label}>Target Amount (ZMW)</Text>
      <TextInput
        style={[styles.input, touched.amount && !!amountError && styles.inputError]}
        placeholder="0.00"
        keyboardType="numeric"
        value={targetAmount}
        onChangeText={setTargetAmount}
        onBlur={() => setTouched(t => ({ ...t, amount: true }))}
      />
      {touched.amount && !!amountError && <Text style={styles.errorText}>{amountError}</Text>}

      <Text style={styles.label}>Target Date</Text>
      <DateField
        value={targetDate}
        onChangeText={setTargetDate}
        error={touched.date && !!dateError}
      />
      {touched.date && !!dateError && <Text style={styles.errorText}>{dateError}</Text>}

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
  inputError: {
    borderColor: '#E74C3C',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 12,
    marginTop: 6,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitButton: {
    backgroundColor: '#3498DB',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#2E86DE',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})