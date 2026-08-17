import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, ActivityIndicator, TextInput, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      setProfile(res.data);
      setFullName(res.data.full_name || '');
      setUniversity(res.data.university || '');
    } catch (error: any) {
      if (error.response?.status === 404) {
        Alert.alert('Profile Missing', 'Please complete your profile.');
      } else {
        Alert.alert('Error', 'Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      // Try to update first, if 404 then create
      const payload = { full_name: fullName, university };
      try {
        await api.put('/users/profile', payload);
      } catch (err: any) {
        if (err.response?.status === 404) {
          await api.post('/users/profile', payload);
        } else {
          throw err;
        }
      }
      Alert.alert('Success', 'Profile saved');
      fetchProfile(); // refresh
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile');
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text>User ID: {session?.user.id}</Text>
      <Text>Email: {session?.user.email}</Text>
      <TextInput style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName} />
      <TextInput style={styles.input} placeholder="University" value={university} onChangeText={setUniversity} />
      <Button title="Save Profile" onPress={saveProfile} />
      <Button title="Sign Out" onPress={signOut} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginVertical: 8, borderRadius: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
