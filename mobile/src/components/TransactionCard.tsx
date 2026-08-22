import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { getCategoryIcon, getCategoryColor } from '../constants/categories'
import CategoryIcon from './CategoryIcon'

interface TransactionCardProps {
  id: string
  type: 'income' | 'expense'
  amount: number
  description?: string | null
  categoryId?: number | null
  categoryName?: string | null
  source?: string | null
  date: string
  onPress?: () => void
}

export default function TransactionCard({
  type,
  amount,
  description,
  categoryId,
  categoryName,
  source,
  date,
  onPress,
}: TransactionCardProps) {
  const isExpense = type === 'expense'
  const sign = isExpense ? '-' : '+'
  const color = isExpense ? '#E74C3C' : '#27AE60'
  const categoryColor = categoryId ? getCategoryColor(categoryId) : '#A4B0BE'
  const displayName = isExpense ? (categoryName || 'Expense') : (source || 'Income')

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: categoryColor + '30' }]}>
        <CategoryIcon name={categoryId ? getCategoryIcon(categoryId) : 'help'} color={categoryColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        {!!description && (
          <Text style={styles.description} numberOfLines={1}>
            {description}
          </Text>
        )}
        <Text style={styles.date}>{new Date(date).toLocaleDateString()}</Text>
      </View>
      <Text style={[styles.amount, { color }]}>
        {sign} K{Number(amount).toFixed(2)}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  description: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 1,
  },
  date: {
    fontSize: 11,
    color: '#A4B0BE',
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
})
