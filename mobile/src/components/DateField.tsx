import React from 'react'
import { Platform, StyleSheet, TextInput, View, StyleProp, ViewStyle } from 'react-native'

// Native browser date picker on web; plain text input fallback on native.
export default function DateField({
  value,
  onChangeText,
  style,
  placeholder = 'YYYY-MM-DD',
  error,
}: {
  value: string
  onChangeText: (date: string) => void
  style?: StyleProp<ViewStyle>
  placeholder?: string
  error?: boolean
}) {
  if (Platform.OS === 'web') {
    return React.createElement('input', {
      type: 'date',
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChangeText(e.target.value),
      placeholder,
      style: {
        ...styles.webInput,
        ...((style as object) ?? {}),
        ...(error ? { borderColor: '#E74C3C' } : {}),
      },
    })
  }
  return (
    <View style={style}>
      <TextInput
        style={[styles.nativeInput, error && { borderColor: '#E74C3C' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  webInput: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    boxSizing: 'border-box',
    minHeight: 48,
    color: '#2C3E50',
  },
  nativeInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    minHeight: 48,
    color: '#2C3E50',
  },
})