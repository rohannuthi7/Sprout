import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
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

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  inquiry: { bg: '#EDF3EC', text: COLORS.primary },
  quoted: { bg: '#FEF3E8', text: '#A0602E' },
  confirming: { bg: '#FEF0DB', text: '#A06820' },
  confirmed: { bg: '#EDF7F0', text: '#2E7D32' },
  completed: { bg: '#E8EAF6', text: '#3949AB' },
};

export default function OrderCard({ order, customerName, onPress }: Props) {
  const days = daysUntil(order.dueDate);
  const stageStyle = STAGE_COLORS[order.stage] ?? { bg: COLORS.sageTan, text: COLORS.deepGreen };
  const hasAllergy = order.dietary.length > 0;
  const isUrgent = days !== null && days <= 3 && days >= 0;

  return (
    <TouchableOpacity style={[styles.card, isUrgent && styles.cardUrgent]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View>
          <Text style={styles.customerName}>{customerName}</Text>
          <Text style={styles.date}>{formatDate(order.dueDate)}</Text>
        </View>
        <View style={[styles.stageBadge, { backgroundColor: stageStyle.bg }]}>
          <Text style={[styles.stageText, { color: stageStyle.text }]}>
            {order.stage}
          </Text>
        </View>
      </View>

      {days !== null && (
        <View style={styles.leadTimeRow}>
          <Ionicons
            name={isUrgent ? 'alert-circle' : 'time-outline'}
            size={14}
            color={isUrgent ? COLORS.danger : COLORS.textMuted}
          />
          <Text style={[styles.leadTime, isUrgent && styles.leadTimeUrgent]}>
            {days === 0 ? 'Due today' : days < 0 ? `${Math.abs(days)}d overdue` : `Due in ${days} days`}
          </Text>
        </View>
      )}

      <View style={styles.details}>
        {order.size && <Text style={styles.detail}>{order.size}</Text>}
        {order.servings && <Text style={styles.detail}>{order.servings} servings</Text>}
        {order.flavors.length > 0 && (
          <Text style={styles.detail}>{order.flavors.join(', ')}</Text>
        )}
        {order.fulfillment && (
          <Text style={styles.detail}>{order.fulfillment}</Text>
        )}
      </View>

      {hasAllergy && (
        <View style={styles.allergyRow}>
          <Ionicons name="warning" size={13} color={COLORS.danger} />
          <Text style={styles.allergyText}>
            {order.dietary.join(', ')}
          </Text>
        </View>
      )}

      {order.quotedPrice !== null && (
        <Text style={styles.price}>${order.quotedPrice.toFixed(2)}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(64, 83, 77, 0.06)',
    elevation: 3,
  },
  cardUrgent: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  date: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  stageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  stageText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  leadTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  leadTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  leadTimeUrgent: {
    color: COLORS.danger,
    fontWeight: '600',
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  detail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  allergyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF0EE',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 8,
  },
  allergyText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'right',
  },
});
