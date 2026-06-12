import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { callGetOrder } from '../api/client';
import { COLORS } from '../constants/colors';
import PrepSheet from '../components/PrepSheet';
import type { Order } from '../types';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Route = RouteProp<RootStackParamList, 'OrderDetail'>;

export default function OrderDetailScreen() {
  const { params } = useRoute<Route>();
  const [order, setOrder] = useState<Order | null>(null);
  const [customerName, setCustomerName] = useState('Customer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [params.orderId]);

  async function loadOrder() {
    try {
      const { order: o } = await callGetOrder(params.orderId);
      setOrder(o);
      setCustomerName(o.customerName ?? 'Customer');
    } catch {
      // Order not found or access denied
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return <SafeAreaView style={styles.container} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <PrepSheet order={order} customerName={customerName} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
});
