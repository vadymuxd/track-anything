import { StatusBar } from 'expo-status-bar';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Svg, { Path, Rect, Circle, Polyline } from 'react-native-svg';
import EventsScreen from './screens/EventsScreen';
import LogScreen from './screens/LogScreen';
import HistoryScreen from './screens/HistoryScreen';
import { LogEventDialog } from './components/LogEventDialog';

const Tab = createBottomTabNavigator();

// Minimalistic SVG Icons
const BarChartIcon = ({ color }: { color: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="12" width="4" height="8" fill={color} />
    <Rect x="10" y="8" width="4" height="12" fill={color} />
    <Rect x="16" y="4" width="4" height="16" fill={color} />
  </Svg>
);

const CalendarIcon = ({ color }: { color: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Rect x="3" y="4" width="18" height="18" rx="2" />
    <Path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
);

const ClipboardIcon = ({ color }: { color: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <Path d="M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2" />
  </Svg>
);

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
              headerShown: true,
              headerStyle: {
                backgroundColor: '#fff',
              },
              headerTitleStyle: {
                fontSize: 18,
                fontWeight: '600',
              },
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
                tabBarIcon: ({ color }) => <BarChartIcon color={color} />,
              }}
            />
            <Tab.Screen 
              name="Events" 
              component={EventsScreen}
              options={({ navigation }) => ({ 
                tabBarLabel: 'Events',
                tabBarIcon: ({ color }) => <CalendarIcon color={color} />,
                headerRight: () => (
                  <TouchableOpacity
                    style={{ marginRight: 16 }}
                    onPress={() => {
                      // Navigate to Events screen and trigger the add event action
                      navigation.navigate('Events', { openDialog: true });
                    }}
                  >
                    <Text style={{ fontSize: 32, fontWeight: '300', color: '#000' }}>+</Text>
                  </TouchableOpacity>
                ),
              })}
            />
            <Tab.Screen 
              name="Log" 
              component={LogScreen}
              options={{ 
                tabBarLabel: 'Log',
                tabBarIcon: ({ color }) => <ClipboardIcon color={color} />,
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
    bottom: 80,
    right: 24,
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
