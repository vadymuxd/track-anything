import { StatusBar } from 'expo-status-bar';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import EventsScreen from './screens/EventsScreen';
import HistoryScreen from './screens/HistoryScreen';
import LogsScreen from './screens/LogsScreen';
import { LogEventDialog } from './components/LogEventDialog';
import { CustomHeader } from './components/CustomHeader';

const Tab = createBottomTabNavigator();

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { error };
  }
  componentDidCatch(error: any, info: any) {
    console.log('[ErrorBoundary] Error:', error?.message || error);
    console.log('[ErrorBoundary] Stack:', error?.stack);
    console.log('[ErrorBoundary] Component stack:', info?.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:24 }}>
          <View style={{ maxWidth:320 }}>
            <StatusBar style="auto" />
            <View style={{ marginBottom:16 }}>
              <View style={{ marginBottom:8 }}>
                {/* Minimal inline fallback */}
              </View>
              <View>
                <View style={{ marginBottom:12 }}>
                  <View>
                    <View>
                      <View>
                        {/* Intentionally nested Views for simple layout without extra styles */}
                      </View>
                    </View>
                  </View>
                </View>
                <View>
                  <View>
                    {/* Fallback content */}
                  </View>
                </View>
              </View>
            </View>
            <View style={{ marginBottom:12 }}>
              <View>
                <View>
                  <View>
                    <View>
                      <View>
                        {/* Display error message */}
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            <View>
              <View>
                <View>
                  <View>
                    <View>
                      <View>
                        {/* Provide reload hint */}
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            <View style={{ marginTop:12 }}>
              <View>
                <View>
                  <View>
                    <View>
                      <View>
                        {/* Show raw error for debugging */}
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

export default function App() {
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogSaved = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <RootErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={{
              header: ({ route }) => <CustomHeader title={route.name} />,
              headerShown: true,
              tabBarStyle: {
                paddingBottom: 25,
                paddingTop: 5,
                height: 80,
                borderTopWidth: 1,
                borderTopColor: '#e0e0e0',
              },
              tabBarActiveTintColor: '#000',
              tabBarInactiveTintColor: '#666',
              tabBarIcon: ({ focused, color }) => null,
            }}
          >
            <Tab.Screen 
              name="History" 
              component={HistoryScreen}
              options={{ 
                tabBarLabel: 'History',
                tabBarIcon: ({ color }) => <MaterialIcons name="insert-chart" size={24} color={color} />,
              }}
            />
            <Tab.Screen 
              name="Events" 
              component={EventsScreen}
              options={{ 
                tabBarLabel: 'Events',
                tabBarIcon: ({ color }) => <MaterialIcons name="event" size={24} color={color} />,
              }}
            />
            <Tab.Screen 
              name="Logs" 
              component={LogsScreen}
              options={{ 
                // Keep Logs as a route (for burger navigation) but hide its tab completely
                tabBarButton: () => null,
                tabBarItemStyle: { display: 'none' },
              }}
            />
          </Tab.Navigator>
          
          <TouchableOpacity
            style={appStyles.fab}
            onPress={() => setIsLogDialogOpen(true)}
          >
            <Text style={appStyles.fabText}>+</Text>
          </TouchableOpacity>

          <LogEventDialog
            visible={isLogDialogOpen}
            onClose={() => setIsLogDialogOpen(false)}
            onSave={handleLogSaved}
          />

          <StatusBar style="auto" />
        </NavigationContainer>
      </SafeAreaProvider>
    </RootErrorBoundary>
  );
}

const appStyles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 52,
    left: '50%',
    marginLeft: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#dc3545',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
});
