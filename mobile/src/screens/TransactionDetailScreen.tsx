import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { incomeApi, expenseApi, Income, Expense } from '../api/client'
import { CATEGORIES } from '../constants/categories'
import CategoryIcon from '../components/CategoryIcon'

function extractErrorDetail(error: any): string {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((d: any) => `${d.loc?.slice(1).join('.')}: ${d.msg}`).join('\n')
  }
  return error?.message || 'Something went wrong'
}

export default function TransactionDetailScreen({ route, navigation }: any) {
  const { id, type } = route.params as { id: string; type: 'income' | 'expense' }
  const isExpense = type === 'expense'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [transaction, setTransaction] = useState<Income | Expense | null>(null)

  // Editable form state
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [source, setSource] = useState('')

  const fetchTransaction = async () => {
    try {
      const res = isExpense ? await expenseApi.get(id) : await incomeApi.get(id)
      const data = res.data
      setTransaction(data)
      setAmount(String(data.amount))
      setDescription(data.description ?? '')
      setDate(data.date)
      if (!isExpense) {
        setSource((data as Income).source)
      } else {
        setCategoryId((data as Expense).category_id ?? null)
      }
    } catch (error: any) {
      Alert.alert('Error', extractErrorDetail(error))
      navigation.goBack()
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchTransaction()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, type])
  )

  const handleDelete = () => {
    Alert.alert('Delete', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await (isExpense ? expenseApi.delete(id) : incomeApi.delete(id))
            Alert.alert('Success', 'Transaction deleted')
            navigation.goBack()
          } catch (error: any) {
            Alert.alert('Error', extractErrorDetail(error))
          }
        },
      },
    ])
  }

  const handleUpdate = async () => {
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount')
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Error', 'Date must be in YYYY-MM-DD format')
      return
    }

    setSaving(true)
    try {
      // Only send editable fields – backend ignores unknowns but keep payloads clean
      const payload = isExpense
        ? {
            amount: parsedAmount,
            description: description.trim() || undefined,
            date,
            category_id: categoryId!,
          }
        : {
            amount: parsedAmount,
            description: description.trim() || undefined,
            date,
            source: source.trim(),
          }

      if (isExpense) {
        await expenseApi.update(id, payload)
      } else {
        await incomeApi.update(id, payload)
      }
      Alert.alert('Success', 'Transaction updated')
      setEditing(false)
      fetchTransaction()
    } catch (error: any) {
      Alert.alert('Error', extractErrorDetail(error))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (!transaction) {
    return (
      <View style={styles.center}>
        <Text>Transaction not found</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.type}>{isExpense ? 'Expense' : 'Income'}</Text>
        <Text style={[styles.amount, { color: isExpense ? '#E74C3C' : '#27AE60' }]}>
          {isExpense ? '-' : '+'} K{Number(transaction.amount).toFixed(2)}
        </Text>
      </View>

      {editing ? (
        <>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          {!isExpense && (
            <>
              <Text style={styles.label}>Source</Text>
              <TextInput style={styles.input} value={source} onChangeText={setSource} />
            </>
          )}

          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            value={description ?? ''}
            onChangeText={setDescription}
            placeholder="Optional"
          />

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
                    <CategoryIcon name={cat.icon} size={20} color={cat.color} />
                    <Text style={styles.categoryName}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.disabled]}
            onPress={handleUpdate}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Save Changes</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{new Date(transaction.date).toLocaleDateString()}</Text>
          </View>

          {!!transaction.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{transaction.description}</Text>
            </View>
          )}

          {isExpense ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{(transaction as Expense).category_name ?? 'Unknown'}</Text>
            </View>
          ) : (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Source</Text>
                <Text style={styles.detailValue}>{(transaction as Income).source}</Text>
              </View>
              {(transaction as Income).is_recurring && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Recurring</Text>
                  <Text style={styles.detailValue}>{(transaction as Income).recurrence_period}</Text>
                </View>
              )}
            </>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  type: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  detailValue: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#2C3E50',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  editText: {
    color: '#fff',
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#E74C3C',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontWeight: '600',
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
    padding: 8,
    margin: '1.5%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  categoryActive: {
    backgroundColor: '#F0F4F8',
  },
  categoryName: {
    fontSize: 10,
    color: '#2C3E50',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#2C3E50',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#E8ECF0',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelText: {
    color: '#7F8C8D',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
})
