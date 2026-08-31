import React, { useEffect, useMemo, useState } from 'react'
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

export default function BudgetAllocationsScreen({ navigation, route }: any) {
  const { budgetId, name, period, start_date, end_date } = route.params || {}

  const [allocations, setAllocations] = useState<{ [key: number]: string }>({})
  const [loading, setLoading] = useState(false)
  const isEditing = !!budgetId

  useEffect(() => {
    if (!budgetId) return
    const fetchAllocations = async () => {
      try {
        const res = await budgetApi.get(budgetId)
        const allocMap: { [key: number]: string } = {}
        res.data.allocations.forEach(a => {
          allocMap[a.category_id] = String(a.allocated_amount)
        })
        setAllocations(allocMap)
      } catch (e: any) {
        console.error('Failed to load allocations:', e?.message ?? e)
        showAlert('Error', 'Failed to load budget')
        navigation.goBack()
      }
    }
    fetchAllocations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetId])

  const handleAllocationChange = (categoryId: number, value: string) => {
    setAllocations({ ...allocations, [categoryId]: value })
  }

  const allocationsList = useMemo(
    () =>
      CATEGORIES.map(cat => ({
        category_id: cat.id,
        allocated_amount: parseFloat(allocations[cat.id] || '0') || 0,
      })).filter(a => a.allocated_amount > 0),
    [allocations]
  )

  const isValid = allocationsList.length > 0

  const extractErrorDetail = (error: any): string => {
    const detail = error?.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail.map((d: any) => `${d.loc?.slice(1).join('.')}: ${d.msg}`).join('\n')
    }
    return error?.message || 'Failed to save budget'
  }

  const handleSubmit = async () => {
    if (!isValid) return
    setLoading(true)
    try {
      if (isEditing) {
        await budgetApi.update(budgetId, { name, period, start_date, end_date })
        await budgetApi.updateAllocations(budgetId, allocationsList)
        showAlert('Success', 'Budget updated')
        navigation.pop(2)
      } else {
        const created = await budgetApi.create({
          name,
          period,
          start_date,
          end_date,
          allocations: allocationsList,
          is_active: true,
        })
        showAlert('Success', 'Budget created')
        navigation.popToTop()
        navigation.navigate('BudgetDetail', { id: created.data.id })
      }
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
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Step 2 of 2 · Allocations</Text>
        </View>

        <Text style={styles.title}>How much per category?</Text>
        <Text style={styles.subtitle}>
          Enter an amount for each category you want in this budget.
        </Text>

        <TouchableOpacity style={styles.summaryCard} onPress={() => navigation.goBack()}>
          <View style={styles.summaryText}>
            <Text style={styles.summaryName}>{name || 'Untitled budget'}</Text>
            <Text style={styles.summaryDates}>
              {period} · {start_date} → {end_date}
            </Text>
          </View>
          <Text style={styles.summaryEdit}>Edit</Text>
        </TouchableOpacity>

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
          style={[styles.submitButton, (!isValid || loading) && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!isValid || loading}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>{isEditing ? 'Update Budget' : 'Create Budget'}</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.submitHint}>
          {isValid ? '' : 'Allocate at least one category to continue.'}
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
    marginBottom: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F4F8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  summaryText: {
    flex: 1,
  },
  summaryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
  },
  summaryDates: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  summaryEdit: {
    fontSize: 13,
    color: '#2C6E9B',
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
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