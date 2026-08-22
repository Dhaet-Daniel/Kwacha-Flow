import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native'
import { incomeApi, expenseApi } from '../api/client'
import { CATEGORIES } from '../constants/categories'
import CategoryIcon from '../components/CategoryIcon'

export default function AddTransactionScreen({ navigation, route }: any) {
  const { type: initialType } = route.params || { type: 'expense' }

  const [transactionType, setTransactionType] = useState<'income' | 'expense'>(initialType)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [source, setSource] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrencePeriod, setRecurrencePeriod] = useState<'monthly' | 'weekly' | 'semester' | null>(null)
  const [loading, setLoading] = useState(false)

  const isExpense = transactionType === 'expense'

  const extractErrorDetail = (error: any): string => {
    const detail = error?.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail.map((d: any) => `${d.loc?.slice(1).join('.')}: ${d.msg}`).join('\n')
    }
    return error?.message || 'Failed to add transaction'
  }

  const handleSubmit = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount')
      return
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Error', 'Date must be in YYYY-MM-DD format')
      return
    }

    if (isExpense && !categoryId) {
      Alert.alert('Error', 'Please select a category')
      return
    }

    if (!isExpense && !source.trim()) {
      Alert.alert('Error', 'Please enter a source for income')
      return
    }

    if (!isExpense && isRecurring && !recurrencePeriod) {
      Alert.alert('Error', 'Please choose how often this income recurs')
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
              source: source.trim(),
              is_recurring: isRecurring,
              recurrence_period: isRecurring ? recurrencePeriod : null,
            }),
      }

      if (isExpense) {
        await expenseApi.create(payload)
      } else {
        await incomeApi.create(payload)
      }

      Alert.alert('Success', `${transactionType === 'income' ? 'Income' : 'Expense'} added successfully!`)
      navigation.goBack()
    } catch (error: any) {
      Alert.alert('Error', extractErrorDetail(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  categoryId === cat.id && { ...styles.categoryActive, borderColor: cat.color },
                ]}
                onPress={() => setCategoryId(cat.id)}
              >
                <CategoryIcon name={cat.icon} size={24} color={cat.color} />
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Source (Income only) */}
      {!isExpense && (
        <>
          <Text style={styles.label}>Source</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Allowance, Part-time job"
            value={source}
            onChangeText={setSource}
          />

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

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Save {isExpense ? 'Expense' : 'Income'}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  categoryButton: {
    width: '30%',
    padding: 10,
    margin: '1.5%',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E8ECF0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  categoryActive: {
    backgroundColor: '#F0F4F8',
  },
  categoryName: {
    fontSize: 11,
    color: '#2C3E50',
    textAlign: 'center',
    marginTop: 4,
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
    marginTop: 30,
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
