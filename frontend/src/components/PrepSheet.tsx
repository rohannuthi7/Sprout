import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';
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
      {order.dietary.length > 0 && (
        <View style={styles.allergyBlock}>
          <View style={styles.allergyHeader}>
            <TriangleAlert size={20} color={COLORS.terracotta} />
            <Text style={styles.allergyTitle}>ALLERGY / DIETARY — VERIFY BEFORE BAKING</Text>
          </View>
          {order.dietary.map((item, i) => (
            <Text key={i} style={styles.allergyItem}>• {item}</Text>
          ))}
        </View>
      )}

      <Text style={styles.label}>PREP SHEET</Text>
      <Text style={styles.title}>{customerName}</Text>

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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.wood,
    opacity: 0.9,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: COLORS.sage,
  },
  value: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: COLORS.parchment,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  highlight: {
    fontFamily: 'Fraunces_700Bold',
    color: COLORS.mustard,
    fontSize: 17,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.forest,
  },
  content: {
    paddingBottom: 40,
  },
  label: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 26,
    color: COLORS.parchment,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  allergyBlock: {
    backgroundColor: COLORS.forest,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.terracotta,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  allergyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  allergyTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 10,
    color: COLORS.terracotta,
    letterSpacing: 1,
    textTransform: 'uppercase',
    flex: 1,
  },
  allergyItem: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: COLORS.terracotta,
    lineHeight: 24,
    paddingLeft: 4,
  },
  section: {
    backgroundColor: COLORS.palm,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    color: COLORS.sage,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  listItem: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.parchment,
    lineHeight: 24,
  },
  designNotes: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.parchment,
    lineHeight: 22,
  },
});
