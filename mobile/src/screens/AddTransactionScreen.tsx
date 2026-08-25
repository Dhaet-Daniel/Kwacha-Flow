import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { incomeApi, expenseApi } from '../api/client'
import { CATEGORIES, INCOME_SOURCES } from '../constants/categories'
import CategoryIcon from '../components/CategoryIcon'
import { showAlert } from '../lib/alerts'
import { Picker } from '@react-native-picker/picker'

const OTHER_SOURCE = '__other__'

export default function AddTransactionScreen({ navigation, route }: any) {
  const { type: initialType } = route.params || { type: 'expense' }

  const [transactionType, setTransactionType] = useState<'income' | 'expense'>(initialType)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [sourceOption, setSourceOption] = useState<string>(INCOME_SOURCES[0].value)
  const [customSource, setCustomSource] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrencePeriod, setRecurrencePeriod] = useState<'monthly' | 'weekly' | 'semester' | null>(null)
  const [loading, setLoading] = useState(false)

  const isExpense = transactionType === 'expense'
  const isOtherSource = sourceOption === OTHER_SOURCE
  const effectiveSource = isOtherSource ? customSource.trim() : sourceOption

  const extractErrorDetail = (error: any): string => {
    const detail = error?.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail.map((d: any) => `${d.loc?.slice(1).join('.')}: ${d.msg}`).join('\n')
    }
    return error?.message || 'Failed to add transaction'
  }

  const handleSubmit = async () => {
    console.log('Submit pressed', { amount, date, categoryId, sourceOption, isExpense })
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      showAlert('Error', 'Please enter a valid amount')
      return
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      showAlert('Error', 'Date must be in YYYY-MM-DD format')
      return
    }

    if (isExpense && !categoryId) {
      showAlert('Error', 'Please select a category')
      return
    }

    if (!isExpense && !effectiveSource) {
      showAlert('Error', 'Please enter a source for income')
      return
    }

    if (!isExpense && isRecurring && !recurrencePeriod) {
      showAlert('Error', 'Please choose how often this income recurs')
      return
    }

    setLoading(true)
    try {
      const payload = {
        amount: parseFloat(amount),
        description: description.trim() || undefined,
        date,
        ...(isExpense
          ? { category_id: categoryId! }
          : {
              source: effectiveSource,
              is_recurring: isRecurring,
              recurrence_period: isRecurring ? recurrencePeriod : null,
            }),
      }

      if (isExpense) {
        await expenseApi.create(payload)
      } else {
        await incomeApi.create(payload)
      }

      showAlert('Success', `${transactionType === 'income' ? 'Income' : 'Expense'} added successfully!`)
      navigation.goBack()
    } catch (error: any) {
      showAlert('Error', extractErrorDetail(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Add {isExpense ? 'Expense' : 'Income'}</Text>

      {/* Type Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, !isExpense && styles.toggleActive]}
          onPress={() => setTransactionType('income')}
        >
          <Text style={[styles.toggleText, !isExpense && styles.toggleTextActive]}>Income</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, isExpense && styles.toggleActive]}
          onPress={() => setTransactionType('expense')}
        >
          <Text style={[styles.toggleText, isExpense && styles.toggleTextActive]}>Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Amount */}
      <Text style={styles.label}>Amount (ZMW)</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      {/* Date */}
      <Text style={styles.label}>Date</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={date}
        onChangeText={setDate}
      />

      {/* Description */}
      <Text style={styles.label}>Description (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="What was this for?"
        value={description}
        onChangeText={setDescription}
      />

      {/* Category (Expense only) */}
      {isExpense && (
        <>
          <Text style={styles.label}>Category</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={categoryId ?? undefined}
              onValueChange={value => {
                console.log('Category selected:', value)
                setCategoryId(value as number)
              }}
              style={styles.picker}
              dropdownIconColor="#2C3E50"
            >
              <Picker.Item label="Select a category..." value={undefined} enabled={false} />
              {CATEGORIES.map(cat => (
                <Picker.Item key={cat.id} label={`${cat.name}`} value={cat.id} />
              ))}
            </Picker>
          </View>

          {/* Compact visual confirmation of the chosen category */}
          {categoryId != null && (
            <View style={styles.selectedCategoryRow}>
              <CategoryIcon name={CATEGORIES.find(c => c.id === categoryId)?.icon} size={18} color={CATEGORIES.find(c => c.id === categoryId)?.color} />
              <Text style={styles.selectedCategoryText}>
                {CATEGORIES.find(c => c.id === categoryId)?.name}
              </Text>
            </View>
          )}
        </>
      )}

      {/* Source (Income only) */}
      {!isExpense && (
        <>
          <Text style={styles.label}>Source</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={sourceOption}
              onValueChange={value => setSourceOption(value as string)}
              style={styles.picker}
              dropdownIconColor="#2C3E50"
            >
              {INCOME_SOURCES.map(src => (
                <Picker.Item key={src.value} label={src.label} value={src.value} />
              ))}
            </Picker>
          </View>

          {isOtherSource && (
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="Enter your income source"
              value={customSource}
              onChangeText={setCustomSource}
            />
          )}

          <View style={styles.recurringContainer}>
            <Text style={styles.label}>Recurring</Text>
            <Switch value={isRecurring} onValueChange={setIsRecurring} />
          </View>

          {isRecurring && (
            <>
              <Text style={styles.label}>Recurrence Period</Text>
              <View style={styles.periodContainer}>
                {(['weekly', 'monthly', 'semester'] as const).map(period => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.periodButton,
                      recurrencePeriod === period && styles.periodActive,
                    ]}
                    onPress={() => setRecurrencePeriod(period)}
                  >
                    <Text style={styles.periodText}>{period}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </>
      )}

      </ScrollView>

      <View style={styles.submitBar}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={`Save ${isExpense ? 'expense' : 'income'}`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Save {isExpense ? 'Expense' : 'Income'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    position: 'relative',
  },
  content: {
    padding: 20,
    // Keeps the last category row clear of the fixed Save bar.
    paddingBottom: 128,
  },
  formScroll: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8ECF0',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  toggleTextActive: {
    color: '#2C3E50',
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
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    overflow: 'hidden',
  },
  picker: {
    height: 48,
    color: '#2C3E50',
  },
  selectedCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  selectedCategoryText: {
    fontSize: 13,
    color: '#2C3E50',
    marginLeft: 6,
    fontWeight: '500',
  },
  recurringContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
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
