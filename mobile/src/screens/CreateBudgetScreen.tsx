import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { budgetApi } from '../api/client'
import { CATEGORIES } from '../constants/categories'
import CategoryIcon from '../components/CategoryIcon'
import { showAlert } from '../lib/alerts'

const FormContainer = Platform.OS === 'web' ? View : KeyboardAvoidingView

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
  const [allocations, setAllocations] = useState<{ [key: number]: string }>({})
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
        const allocMap: { [key: number]: string } = {}
        data.allocations.forEach(a => {
          allocMap[a.category_id] = String(a.allocated_amount)
        })
        setAllocations(allocMap)
      } catch (e: any) {
        console.error('Failed to load budget:', e?.message ?? e)
        showAlert('Error', 'Failed to load budget')
        navigation.goBack()
      }
    }
    fetchBudget()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetId])

  const handleAllocationChange = (categoryId: number, value: string) => {
    setAllocations({ ...allocations, [categoryId]: value })
  }

  const extractErrorDetail = (error: any): string => {
    const detail = error?.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail.map((d: any) => `${d.loc?.slice(1).join('.')}: ${d.msg}`).join('\n')
    }
    return error?.message || 'Failed to save budget'
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      showAlert('Error', 'Please enter a budget name')
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      showAlert('Error', 'Dates must be in YYYY-MM-DD format')
      return
    }
    if (new Date(startDate) > new Date(endDate)) {
      showAlert('Error', 'Start date must be before end date')
      return
    }

    const allocationsList = CATEGORIES.map(cat => ({
      category_id: cat.id,
      allocated_amount: parseFloat(allocations[cat.id] || '0') || 0,
    })).filter(a => a.allocated_amount > 0)

    if (allocationsList.length === 0) {
      showAlert('Error', 'Please allocate at least one category with a positive amount')
      return
    }

    setLoading(true)
    try {
      if (isEditing) {
        await budgetApi.update(budgetId, {
          name: name.trim(),
          period,
          start_date: startDate,
          end_date: endDate,
        })
        await budgetApi.updateAllocations(budgetId, allocationsList)
        showAlert('Success', 'Budget updated')
      } else {
        await budgetApi.create({
          name: name.trim(),
          period,
          start_date: startDate,
          end_date: endDate,
          allocations: allocationsList,
          is_active: true,
        })
        showAlert('Success', 'Budget created')
      }
      navigation.goBack()
    } catch (e: any) {
      showAlert('Error', extractErrorDetail(e))
    } finally {
      setLoading(false)
    }
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
        <Text style={styles.title}>{isEditing ? 'Edit Budget' : 'Create Budget'}</Text>

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

        <Text style={styles.sectionTitle}>Category Allocations</Text>
        <Text style={styles.sectionSub}>Enter amounts for each category you want to budget</Text>

        {CATEGORIES.map(cat => (
          <View key={cat.id} style={styles.allocationRow}>
            <View style={styles.categoryNameRow}>
              <CategoryIcon name={cat.icon} size={18} color={cat.color} />
              <Text style={styles.categoryName}>{cat.name}</Text>
            </View>
            <TextInput
              style={styles.allocationInput}
              placeholder="0.00"
              keyboardType="numeric"
              value={allocations[cat.id] || ''}
              onChangeText={val => handleAllocationChange(cat.id, val)}
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.submitBar}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>
              {isEditing ? 'Update' : 'Create'} Budget
            </Text>
          )}
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
    padding: 20,
    paddingBottom: 128,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 20,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginTop: 24,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 12,
  },
  allocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    color: '#2C3E50',
    marginLeft: 8,
  },
  allocationInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    width: 100,
    textAlign: 'right',
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
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})