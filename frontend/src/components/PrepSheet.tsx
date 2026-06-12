import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import type { Order } from '../types';

interface Props {
  order: Order;
  customerName: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function PrepSheet({ order, customerName }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Prep Sheet</Text>
      <Text style={styles.subtitle}>{customerName}</Text>

      {order.dietary.length > 0 && (
        <View style={styles.allergyBlock}>
          <View style={styles.allergyHeader}>
            <Ionicons name="warning" size={20} color={COLORS.danger} />
            <Text style={styles.allergyTitle}>⚠️ DIETARY / ALLERGIES</Text>
          </View>
          {order.dietary.map((item, i) => (
            <Text key={i} style={styles.allergyItem}>• {item}</Text>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Row label="Due Date" value={formatDate(order.dueDate)} />
        {order.dueTime && <Row label="Due Time" value={order.dueTime} />}
        <Row label="Fulfillment" value={order.fulfillment ?? 'TBD'} capitalize />
        <Row label="Servings" value={order.servings ? String(order.servings) : 'TBD'} />
        <Row label="Size" value={order.size ?? 'TBD'} />
      </View>

      {order.flavors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Flavors</Text>
          {order.flavors.map((f, i) => (
            <Text key={i} style={styles.listItem}>• {f}</Text>
          ))}
        </View>
      )}

      {order.designNotes ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Design Notes</Text>
          <Text style={styles.designNotes}>{order.designNotes}</Text>
        </View>
      ) : null}

      {order.quotedPrice !== null && (
        <View style={styles.section}>
          <Row label="Quoted Price" value={`$${order.quotedPrice.toFixed(2)}`} highlight />
          <Row
            label="Deposit"
            value={order.depositStatus === 'paid' ? 'Paid ✓' : order.depositStatus === 'requested' ? 'Requested' : 'Not requested'}
          />
        </View>
      )}
    </ScrollView>
  );
}

function Row({
  label,
  value,
  capitalize,
  highlight,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, capitalize && rowStyles.capitalize, highlight && rowStyles.highlight]}>
        {value}
      </Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  label: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  highlight: {
    color: COLORS.primary,
    fontSize: 16,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.deepGreen,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  allergyBlock: {
    backgroundColor: '#FFF0EE',
    borderWidth: 2,
    borderColor: COLORS.danger,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  allergyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  allergyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.danger,
    letterSpacing: 0.5,
  },
  allergyItem: {
    fontSize: 14,
    color: COLORS.danger,
    fontWeight: '600',
    lineHeight: 22,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  listItem: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  designNotes: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
});
