import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Clipboard,
  Globe,
  MessageCircle,
  Mail,
  Instagram,
} from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import GrowthStageIcon from './botanical/GrowthStageIcon';
import type { Thread } from '../types';

interface Props {
  thread: Thread;
  customerName: string;
  onPress: () => void;
}

function ChannelIcon({ channel, color }: { channel: string; color: string }) {
  const props = { size: 13, color, strokeWidth: 1.8 };
  switch (channel) {
    case 'paste':      return <Clipboard {...props} />;
    case 'web_intake': return <Globe {...props} />;
    case 'sms':        return <MessageCircle {...props} />;
    case 'email':      return <Mail {...props} />;
    case 'instagram':  return <Instagram {...props} />;
    default:           return <MessageCircle {...props} />;
  }
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Map thread status to a growth stage for the icon
function stageForThread(thread: Thread): string {
  // Use order stage if embedded, otherwise derive from thread status
  return (thread as Thread & { order?: { stage?: string } }).order?.stage ?? thread.status ?? 'inquiry';
}

export default function ThreadItem({ thread, customerName, onPress }: Props) {
  const isUnread = thread.status === 'needs_reply';
  const stage = stageForThread(thread);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar */}
      <View style={[styles.avatar, isUnread && styles.avatarUnread]}>
        <Text style={styles.avatarText}>
          {customerName.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Content */}
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
          <ChannelIcon channel={thread.channel} color={COLORS.sage} />
          <Text style={styles.channelLabel}>{thread.channel.replace('_', ' ')}</Text>
        </View>
      </View>

      {/* Stage icon + unread dot */}
      <View style={styles.trailingStack}>
        <GrowthStageIcon stage={stage} size={22} />
        {isUnread && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.palm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.wood,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.fern,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarUnread: {
    backgroundColor: COLORS.wood,
    borderWidth: 2,
    borderColor: COLORS.mustard,
  },
  avatarText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: COLORS.parchment,
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
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    color: COLORS.parchment,
    flex: 1,
    marginRight: 8,
  },
  nameUnread: {
    fontFamily: 'DMSans_700Bold',
  },
  time: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: COLORS.sage,
  },
  summary: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.sage,
    lineHeight: 18,
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  channelLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: COLORS.sage,
    textTransform: 'capitalize',
  },
  trailingStack: {
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
    marginTop: 2,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.mustard,
  },
});
