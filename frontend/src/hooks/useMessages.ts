import { useQuery } from '@tanstack/react-query';
import { callGetMessages } from '../api/client';
import type { Message } from '../types';

const REFETCH_INTERVAL = 10_000;

export function useMessages(threadId: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['messages', threadId],
    queryFn: () => callGetMessages(threadId!),
    enabled: !!threadId,
    refetchInterval: REFETCH_INTERVAL,
  });

  return {
    messages: (data?.messages ?? []) as Message[],
    loading: isLoading,
    error: error?.message ?? null,
  };
}
