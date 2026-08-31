import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { budgetApi } from '../api/client'
import { showAlert } from '../lib/alerts'

const FormContainer = Platform.OS === 'web' ? View : KeyboardAvoidingView

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export default function CreateBudgetScreen({ navigation, route }: any) {
  const { budgetId } = route.params || {}

  const [name, setName] = useState('')
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'semester'>('monthly')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    return d.toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!budgetId) return
    setIsEditing(true)
    const fetchBudget = async () => {
      try {
        const res = await budgetApi.get(budgetId)
        const data = res.data
        setName(data.name)
        setPeriod(data.period)
        setStartDate(data.start_date)
        setEndDate(data.end_date)
      } catch (e: any) {
        console.error('Failed to load budget:', e?.message ?? e)
        showAlert('Error', 'Failed to load budget')
        navigation.goBack()
      }
    }
    fetchBudget()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetId])

  const isValid =
    !!name.trim() &&
    DATE_RE.test(startDate) &&
    DATE_RE.test(endDate) &&
    new Date(startDate) <= new Date(endDate)

  const handleNext = () => {
    if (!isValid) return
    navigation.navigate('BudgetAllocations', {
      budgetId,
      name: name.trim(),
      period,
      start_date: startDate,
      end_date: endDate,
    })
  }

  return (
    <FormContainer
      style={styles.container}
      {...(Platform.OS !== 'web' ? { behavior: Platform.OS === 'ios' ? 'padding' : undefined } : {})}
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Step 1 of 2 · Budget settings</Text>
        </View>

        <Text style={styles.title}>{isEditing ? 'Edit Budget' : 'Create Budget'}</Text>
        <Text style={styles.subtitle}>
          First, tell us the basics about this budget. Amounts come next.
        </Text>

        <Text style={styles.label}>Budget Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., March 2026"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Period</Text>
        <View style={styles.periodContainer}>
          {(['monthly', 'weekly', 'semester'] as const).map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodButton, period === p && styles.periodActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Start Date</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={startDate}
          onChangeText={setStartDate}
        />

        <Text style={styles.label}>End Date</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={endDate}
          onChangeText={setEndDate}
        />
      </ScrollView>

      <View style={styles.submitBar}>
        <TouchableOpacity
          style={[styles.submitButton, !isValid && styles.submitDisabled]}
          onPress={handleNext}
          disabled={!isValid}
          accessibilityRole="button"
        >
          <Text style={styles.submitText}>Next: Allocations →</Text>
        </TouchableOpacity>
        <Text style={styles.submitHint}>
          {isValid ? '' : 'Fill in the name and valid dates to continue.'}
        </Text>
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
    padding: 20,
    paddingBottom: 128,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C6E9B',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 6,
    marginBottom: 8,
  },
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
  periodContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    backgroundColor: '#fff',
  },
  periodActive: {
    borderColor: '#2C3E50',
    backgroundColor: '#F0F4F8',
  },
  periodText: {
    fontSize: 13,
    color: '#2C3E50',
  },
  periodTextActive: {
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#2C3E50',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  submitBar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E8ECF0',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    elevation: 8,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 6,
    minHeight: 16,
  },
})