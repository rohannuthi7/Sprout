import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import type { Thread } from '../types';

interface Props {
  thread: Thread;
  customerName: string;
  onPress: () => void;
}

const CHANNEL_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  paste: 'clipboard-outline',
  web_intake: 'globe-outline',
  sms: 'chatbubble-outline',
  email: 'mail-outline',
  instagram: 'logo-instagram',
};

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ThreadItem({ thread, customerName, onPress }: Props) {
  const icon = CHANNEL_ICON[thread.channel] ?? 'chatbubble-outline';
  const isUnread = thread.status === 'needs_reply';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.avatar, isUnread && styles.avatarUnread]}>
        <Text style={styles.avatarText}>
          {customerName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, isUnread && styles.nameUnread]} numberOfLines={1}>
            {customerName}
          </Text>
          <Text style={styles.time}>{timeAgo(thread.lastMessageAt)}</Text>
        </View>
        <Text style={styles.summary} numberOfLines={2}>
          {thread.rollingSummary || 'New inquiry'}
        </Text>
        <View style={styles.bottomRow}>
          <Ionicons name={icon} size={12} color={COLORS.textMuted} style={styles.channelIcon} />
          <Text style={styles.channelLabel}>{thread.channel.replace('_', ' ')}</Text>
        </View>
      </View>
      {isUnread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.sageTan,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarUnread: {
    backgroundColor: COLORS.lightGreen,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.deepGreen,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  nameUnread: {
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  summary: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelIcon: {
    marginRight: 4,
  },
  channelLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'capitalize',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
    marginTop: 4,
  },
});
