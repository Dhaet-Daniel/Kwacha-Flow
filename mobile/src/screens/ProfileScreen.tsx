import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
  Platform,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { Picker } from '@react-native-picker/picker'
import { useFocusEffect } from '@react-navigation/native'
import {
  profileApi,
  dashboardApi,
  avatarApi,
  resolveAssetUrl,
  UserProfile,
  DashboardData,
} from '../api/client'
import { useAuth } from '../context/AuthContext'
import { showAlert } from '../lib/alerts'

type ProfileField = 'full_name' | 'university' | 'year_of_study' | 'currency'
type EditingState = { field: ProfileField; value: string } | null

const AVATAR_COLORS = ['#3498DB', '#9B59B6', '#1ABC9C', '#E67E22', '#E74C3C', '#2C3E50']
const CURRENCIES = ['ZMW', 'USD', 'KES', 'EUR', 'GBP', 'ZAR']
const CURRENCY_SYMBOL: Record<string, string> = {
  ZMW: 'K',
  USD: '$',
  KES: 'KSh',
  EUR: '€',
  GBP: '£',
  ZAR: 'R',
}
const YEARS = [1, 2, 3, 4, 5]

function getInitials(profile: UserProfile | null, email?: string): string {
  const name = profile?.full_name?.trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase()
  }
  return (email?.[0] ?? '?').toUpperCase()
}

function avatarColor(seed: string): string {
  const sum = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

export default function ProfileScreen() {
  const { session, signOut } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [editing, setEditing] = useState<EditingState>(null)
  const [saving, setSaving] = useState(false)
  const [picking, setPicking] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)

  const load = async () => {
    try {
      await Promise.all([
        (async () => {
          try {
            const res = await profileApi.get()
            setProfile(res.data)
          } catch (e: any) {
            if (e?.response?.status === 404) setProfile(null)
            else throw e
          }
        })(),
        (async () => {
          try {
            const res = await dashboardApi.get()
            setStats(res.data)
          } catch (e: any) {
            console.error('Failed to fetch dashboard stats:', e?.message ?? e)
          }
        })(),
      ])
    } catch (e: any) {
      console.error('Failed to load profile:', e?.message ?? e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      load()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  )

  const onRefresh = () => {
    setRefreshing(true)
    load()
  }

  const pickAvatar = async () => {
    if (picking) return
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) {
        showAlert('Error', 'Permission to access your photos is required')
        return
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })
      if (result.canceled || !result.assets?.length) return
      const asset = result.assets[0]

      setPicking(true)
      const form = new FormData()
      if (Platform.OS === 'web') {
        if (asset.file) {
          form.append('file', asset.file, asset.file.name || 'avatar.jpg')
        } else {
          const res = await fetch(asset.uri)
          const blob = await res.blob()
          form.append('file', blob, asset.fileName || 'avatar.jpg')
        }
      } else {
        form.append('file', {
          uri: asset.uri,
          name: asset.fileName || 'avatar.jpg',
          type: asset.mimeType || 'image/jpeg',
        } as any)
      }

      const res = await avatarApi.upload(form)
      setAvatarFailed(false)
      setProfile(prev => (prev ? { ...prev, avatar_url: res.data.avatar_url } : prev))
      showAlert('Success', 'Profile picture updated')
    } catch (error: any) {
      showAlert('Error', error?.response?.data?.detail ?? 'Could not upload a new picture')
    } finally {
      setPicking(false)
    }
  }

  const email = session?.user.email ?? ''
  const currency = profile?.currency || 'ZMW'
  const symbol = CURRENCY_SYMBOL[currency] ?? 'K'
  const avatarUrl = profile?.avatar_url ? resolveAssetUrl(profile.avatar_url) : null
  const memberSince = session?.user.created_at
    ? new Date(session.user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—'

  const fieldLabel: Record<ProfileField, string> = {
    full_name: 'Full Name',
    university: 'University',
    year_of_study: 'Year of Study',
    currency: 'Currency',
  }

  const fieldValue: Record<ProfileField, string> = {
    full_name: profile?.full_name ?? '',
    university: profile?.university ?? '',
    year_of_study: profile?.year_of_study != null ? String(profile.year_of_study) : '',
    currency,
  }

  const openEditor = (field: ProfileField) => setEditing({ field, value: fieldValue[field] })

  const saveField = async () => {
    if (!editing) return
    let nextValue: string | number | null = editing.value.trim()
    if (editing.field === 'full_name' && !nextValue) {
      showAlert('Error', 'Please enter your full name')
      return
    }
    if (editing.field === 'university' && !nextValue) nextValue = null
    if (editing.field === 'year_of_study') {
      nextValue = editing.value ? parseInt(editing.value, 10) : null
    }
    if (editing.field === 'currency' && !nextValue) nextValue = 'ZMW'

    setSaving(true)
    try {
      const payload = {
        full_name: profile?.full_name ?? '',
        university: profile?.university ?? null,
        year_of_study: profile?.year_of_study ?? null,
        currency: profile?.currency ?? 'ZMW',
        [editing.field]: nextValue,
      }
      let res
      try {
        res = await profileApi.update(payload)
      } catch (err: any) {
        if (err?.response?.status === 404) {
          res = await profileApi.create(payload)
        } else {
          throw err
        }
      }
      setProfile(res.data)
      setEditing(null)
      showAlert('Success', `${fieldLabel[editing.field]} updated`)
    } catch (error: any) {
      showAlert('Error', error?.response?.data?.detail ?? 'Could not save your profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error: any) {
      showAlert('Error', error?.message ?? 'Could not sign out')
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2C3E50" />
      </View>
    )
  }

  const editorTitle = editing ? fieldLabel[editing.field] : ''
  const isPickEditor = editing?.field === 'year_of_study' || editing?.field === 'currency'

  const statItems = [
    { label: 'Balance', value: stats ? `${symbol}${stats.balance.toFixed(2)}` : '—', color: '#2C3E50' },
    { label: 'Saved', value: stats ? `${symbol}${stats.savings_total.toFixed(2)}` : '—', color: '#27AE60' },
    { label: 'Goals', value: stats ? String(stats.savings_goals_count) : '—', color: '#3498DB' },
  ]

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
          <TouchableOpacity
            style={[styles.avatar, { backgroundColor: avatarColor(email || 'user') }]}
            onPress={pickAvatar}
            disabled={picking}
            activeOpacity={0.85}
            accessibilityRole="imagebutton"
            accessibilityLabel="Change profile picture"
          >
            {avatarUrl && !avatarFailed ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <Text style={styles.avatarText}>{getInitials(profile, email)}</Text>
            )}
            <View style={styles.avatarBadge}>
              {picking ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons name="camera" size={14} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>
            {profile?.avatar_url ? 'Tap to change photo' : 'Tap to add a photo'}
          </Text>
        </View>
          <Text style={styles.name}>{profile?.full_name || 'Complete your profile'}</Text>
          <Text style={styles.email}>{email}</Text>
          {profile?.university ? (
            <Text style={styles.university}>{profile.university}</Text>
          ) : null}
          <View style={styles.memberRow}>
            <MaterialCommunityIcons name="calendar-check-outline" size={14} color="#A4B0BE" />
            <Text style={styles.memberText}>Member since {memberSince}</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {statItems.map(item => (
            <View key={item.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{item.label}</Text>
              <Text style={[styles.statValue, { color: item.color }]} numberOfLines={1}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Settings list */}
        <Text style={styles.sectionTitle}>Profile details</Text>
        <View style={styles.listCard}>
          {([
            {
              key: 'full_name' as ProfileField,
              icon: 'badge-account-outline',
              label: 'Full Name',
              value: profile?.full_name || '—',
            },
            {
              key: 'university' as ProfileField,
              icon: 'school-outline',
              label: 'University',
              value: profile?.university || '—',
            },
            {
              key: 'year_of_study' as ProfileField,
              icon: 'calendar-range',
              label: 'Year of Study',
              value: profile?.year_of_study != null ? `Year ${profile.year_of_study}` : '—',
            },
            {
              key: 'currency' as ProfileField,
              icon: 'bank-outline',
              label: 'Currency',
              value: currency,
            },
          ] as const).map((row, i, rows) => (
            <TouchableOpacity
              key={row.key}
              style={[styles.row, i < rows.length - 1 && styles.rowBorder]}
              onPress={() => openEditor(row.key)}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${row.label}`}
            >
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons name={row.icon} size={18} color="#2C3E50" />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue} numberOfLines={1}>
                  {row.value}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#3498DB" />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.listCard}>
          <View style={[styles.row, styles.rowBorder, { opacity: 1 }]}>
            <View style={styles.rowIcon}>
              <MaterialCommunityIcons name="email-outline" size={18} color="#7F8C8D" />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Email</Text>
              <Text style={styles.rowValue} numberOfLines={1}>
                {email}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.row, styles.signOutRow]}
            onPress={handleSignOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <MaterialCommunityIcons name="logout" size={18} color="#E74C3C" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.appTag}>Kwacha Flow · v1.0.0</Text>
      </ScrollView>

      {/* Field editor modal */}
      <Modal
        visible={!!editing}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit {editorTitle.toLowerCase()}</Text>

            {isPickEditor ? (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={editing?.value ?? ''}
                  onValueChange={value => setEditing(prev => (prev ? { ...prev, value: String(value) } : prev))}
                  style={styles.picker}
                  dropdownIconColor="#2C3E50"
                >
                  {editing?.field === 'currency' ? (
                    CURRENCIES.map(c => <Picker.Item key={c} label={c} value={c} />)
                  ) : (
                    <>
                      <Picker.Item label="Not specified" value="" />
                      {YEARS.map(y => (
                        <Picker.Item key={y} label={`Year ${y}`} value={String(y)} />
                      ))}
                    </>
                  )}
                </Picker>
              </View>
            ) : (
              <TextInput
                style={styles.modalInput}
                value={editing?.value ?? ''}
                onChangeText={value => setEditing(prev => (prev ? { ...prev, value } : prev))}
                placeholder={`Enter ${editorTitle.toLowerCase()}`}
                autoFocus
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditing(null)}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.submitDisabled]}
                onPress={saveField}
                disabled={saving}
                accessibilityRole="button"
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#F8F9FA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#2C3E50',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  avatarHint: {
    color: '#A4B0BE',
    fontSize: 12,
    marginTop: 8,
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#3498DB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2C3E50',
  },
  name: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  email: {
    color: '#A4B0BE',
    fontSize: 14,
    marginTop: 2,
  },
  university: {
    color: '#BDC3C7',
    fontSize: 14,
    marginTop: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  memberText: {
    color: '#A4B0BE',
    fontSize: 12,
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECF0',
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    marginBottom: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8ECF0',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowBody: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
  },
  signOutRow: {
    justifyContent: 'flex-start',
  },
  signOutText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  appTag: {
    textAlign: 'center',
    color: '#A4B0BE',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E8ECF0',
  },
  pickerContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    overflow: 'hidden',
  },
  picker: {
    height: 48,
    color: '#2C3E50',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  cancelText: {
    color: '#7F8C8D',
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3498DB',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E86DE',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  saveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  submitDisabled: {
    opacity: 0.6,
  },
})