import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TriangleAlert, Clock } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import GrowthStageIcon from './botanical/GrowthStageIcon';
import type { Order } from '../types';

interface Props {
  order: Order;
  customerName: string;
  onPress: () => void;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'No date set';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function OrderCard({ order, customerName, onPress }: Props) {
  const days = daysUntil(order.dueDate);
  const hasAllergy = order.dietary.length > 0;
  const isUrgent = days !== null && days <= 5 && days >= 0;
  const isVeryUrgent = days !== null && days <= 3 && days >= 0;

  const leadTimeText = days === null
    ? null
    : days === 0
    ? 'Due today'
    : days < 0
    ? `${Math.abs(days)}d overdue`
    : `Due in ${days} day${days === 1 ? '' : 's'}`;

  const leadTimeColor = isVeryUrgent ? COLORS.terracotta : isUrgent ? COLORS.mustard : COLORS.sage;

  return (
    <TouchableOpacity
      style={[styles.card, isVeryUrgent && styles.cardUrgent]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* ── Lead time — top, prominent ── */}
      {leadTimeText && (
        <View style={styles.leadTimeRow}>
          {isUrgent
            ? <TriangleAlert size={13} color={leadTimeColor} strokeWidth={2} />
            : <Clock size={13} color={leadTimeColor} strokeWidth={1.8} />
          }
          <Text style={[styles.leadTime, { color: leadTimeColor }]}>
            {leadTimeText}
          </Text>
        </View>
      )}

      {/* ── Header row ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.customerName}>{customerName}</Text>
          <Text style={styles.date}>{formatDate(order.dueDate)}</Text>
        </View>
        <View style={styles.stageBadge}>
          <GrowthStageIcon stage={order.stage} size={20} />
          <Text style={styles.stageText}>{order.stage}</Text>
        </View>
      </View>

      {/* ── Allergy strip — forest-inset ── */}
      {hasAllergy && (
        <View style={styles.allergyStrip}>
          <TriangleAlert size={13} color={COLORS.terracotta} strokeWidth={2.5} />
          <Text style={styles.allergyText}>
            {order.dietary.join(', ')}
          </Text>
        </View>
      )}

      {/* ── Detail pills ── */}
      <View style={styles.details}>
        {order.size && <Text style={styles.detail}>{order.size}</Text>}
        {order.servings && <Text style={styles.detail}>{order.servings} srv</Text>}
        {order.flavors.length > 0 && (
          <Text style={styles.detail}>{order.flavors.join(', ')}</Text>
        )}
        {order.fulfillment && (
          <Text style={styles.detail}>{order.fulfillment}</Text>
        )}
      </View>

      {order.quotedPrice !== null && (
        <Text style={styles.price}>${order.quotedPrice.toFixed(2)}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.palm,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0A1208',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  cardUrgent: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.terracotta,
  },
  leadTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  leadTime: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerLeft: { flex: 1, marginRight: 12 },
  customerName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: COLORS.parchment,
    marginBottom: 2,
  },
  date: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.sage,
  },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.canopy,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.wood,
  },
  stageText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    color: COLORS.sage,
    textTransform: 'capitalize',
  },
  // Forest-inset strip so terracotta text passes AA contrast
  allergyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.forest,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.terracotta,
  },
  allergyText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    color: COLORS.terracotta,
    flex: 1,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 8,
  },
  detail: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: COLORS.sage,
    backgroundColor: COLORS.canopy,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  price: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 16,
    color: COLORS.mustard,
    textAlign: 'right',
  },
});
