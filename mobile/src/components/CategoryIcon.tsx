import React from 'react'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

// Maps legacy/aliased names to valid MaterialCommunityIcons glyphs
const NAME_ALIASES: Record<string, string> = {
  'more-horiz': 'dots-horizontal',
}

interface CategoryIconProps {
  name?: string | null
  size?: number
  color?: string
}

export default function CategoryIcon({ name, size = 20, color = '#2C3E50' }: CategoryIconProps) {
  const resolved = name ? (NAME_ALIASES[name] ?? name) : 'help'
  return (
    <MaterialCommunityIcons
      name={resolved as any}
      size={size}
      color={color}
      suppressHighlighting
    />
  )
}
