import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../constants/colors';
import { useOrders } from '../hooks/useOrders';
import OrderCard from '../components/OrderCard';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { Order } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function OrdersScreen() {
  const navigation = useNavigation<Nav>();
  // customerName is now resolved server-side and included in each Order object
  const { byLeadTime, loading } = useOrders();

  const active = byLeadTime.filter(o =>
    ['inquiry', 'quoted', 'confirming', 'confirmed'].includes(o.stage)
  );
  const completed = byLeadTime.filter(o =>
    ['completed', 'declined', 'archived'].includes(o.stage)
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.title}>Orders</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.subtitle}>
          {active.length} active · {completed.length} past
        </Text>
      </View>

      <FlatList
        data={[...active, ...(completed.length > 0 ? [{ divider: true } as unknown as Order] : []), ...completed]}
        keyExtractor={(item, i) => ('divider' in (item as object) ? `divider_${i}` : (item as Order).id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          if ('divider' in (item as object)) {
            return <Text style={styles.sectionLabel}>Past Orders</Text>;
          }
          const order = item as Order;
          return (
            <OrderCard
              order={order}
              customerName={order.customerName ?? 'Customer'}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyText}>Confirmed orders will appear here.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.deepGreen },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  list: { padding: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 12,
  },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary },
});
