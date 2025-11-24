import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import EventsScreen from './screens/EventsScreen';
import LogScreen from './screens/LogScreen';
import HistoryScreen from './screens/HistoryScreen';

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
  return (
    <RootErrorBoundary>
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
              tabBarActiveTintColor: '#007bff',
              tabBarInactiveTintColor: 'gray',
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
    </RootErrorBoundary>
  );
}
