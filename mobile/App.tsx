import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import EventsScreen from './screens/EventsScreen';
import LogScreen from './screens/LogScreen';
import HistoryScreen from './screens/HistoryScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#f8f9fa',
            },
            tabBarStyle: {
              paddingBottom: 5,
              paddingTop: 5,
              height: 60,
            },
          }}
        >
          <Tab.Screen 
            name="History" 
            component={HistoryScreen}
            options={{ tabBarLabel: 'History' }}
          />
          <Tab.Screen 
            name="Events" 
            component={EventsScreen}
            options={{ tabBarLabel: 'Events' }}
          />
          <Tab.Screen 
            name="Log" 
            component={LogScreen}
            options={{ tabBarLabel: 'Log' }}
          />
        </Tab.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
