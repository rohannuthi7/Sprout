import React from 'react';
import { StatusBar } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquare, Layers, CalendarDays, SlidersHorizontal } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';

import LoadingScreen from '../screens/LoadingScreen';
import AuthScreen from '../screens/AuthScreen';
import InboxScreen from '../screens/InboxScreen';
import FlashcardStackScreen from '../screens/FlashcardStackScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PricingConfigScreen from '../screens/PricingConfigScreen';

export type RootStackParamList = {
  Loading: undefined;
  Auth: undefined;
  Main: undefined;
  FlashcardStack: undefined;
  OrderDetail: { orderId: string };
  PricingConfig: undefined;
};

export type TabParamList = {
  Inbox: undefined;
  Orders: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  const { bottom } = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.forest,
          borderTopColor: COLORS.wood,
          borderTopWidth: 1,
          paddingBottom: bottom,
          height: 56 + bottom,
        },
        tabBarActiveTintColor: COLORS.mustard,
        tabBarInactiveTintColor: COLORS.sage,
        tabBarLabelStyle: {
          fontFamily: 'DMSans_600SemiBold',
          fontSize: 11,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, React.ReactNode> = {
            Inbox:    <MessageSquare size={size} color={color} strokeWidth={1.8} />,
            Orders:   <CalendarDays size={size} color={color} strokeWidth={1.8} />,
            Settings: <SlidersHorizontal size={size} color={color} strokeWidth={1.8} />,
          };
          return icons[route.name] ?? <Layers size={size} color={color} strokeWidth={1.8} />;
        },
      })}
    >
      <Tab.Screen name="Inbox" component={InboxScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth(); // user is AuthUser | null (Cognito)

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="FlashcardStack"
              component={FlashcardStackScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="OrderDetail"
              component={OrderDetailScreen}
              options={{
                headerShown: true,
                headerTitle: 'Order Details',
                headerStyle: { backgroundColor: COLORS.forest },
                headerTintColor: COLORS.parchment,
                headerTitleStyle: {
                  fontFamily: 'Fraunces_700Bold',
                  fontSize: 18,
                  color: COLORS.parchment,
                },
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="PricingConfig"
              component={PricingConfigScreen}
              options={{
                headerShown: true,
                headerTitle: 'Pricing Config',
                headerStyle: { backgroundColor: COLORS.forest },
                headerTintColor: COLORS.parchment,
                headerTitleStyle: {
                  fontFamily: 'Fraunces_700Bold',
                  fontSize: 18,
                  color: COLORS.parchment,
                },
                headerBackTitle: '',
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </>
  );
}
