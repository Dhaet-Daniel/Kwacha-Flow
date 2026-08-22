import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import TransactionDetailScreen from './src/screens/TransactionDetailScreen';
import { ActivityIndicator, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function ProfileButton({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.profileButton} onPress={onPress}>
      <MaterialCommunityIcons name="account-circle-outline" size={26} color="#2C3E50" />
    </TouchableOpacity>
  );
}

function MainTabs({ navigation }: any) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleStyle: styles.headerTitle,
        tabBarActiveTintColor: '#2C3E50',
        tabBarInactiveTintColor: '#A4B0BE',
      }}
    >
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          title: 'Kwacha Flow',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="swap-vertical" size={size} color={color} />
          ),
          headerRight: () => (
            <ProfileButton onPress={() => navigation.navigate('Profile')} />
          ),
        }}
      />
      {/* Future tabs: Budget, AI insights, etc. */}
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{ title: 'New Transaction' }}
      />
      <Stack.Screen
        name="TransactionDetail"
        component={TransactionDetailScreen}
        options={({ route }: any) => ({
          title: route.params?.type === 'income' ? 'Income Details' : 'Expense Details',
        })}
      />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        <>
          <Stack.Screen name="Main" component={MainStack} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
    color: '#2C3E50',
  },
  profileButton: {
    marginRight: 12,
    padding: 4,
  },
});
