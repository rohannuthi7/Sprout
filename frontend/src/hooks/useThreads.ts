import { useQuery } from '@tanstack/react-query';
import { callGetThreads } from '../api/client';
import type { Thread } from '../types';

const REFETCH_INTERVAL = 15_000; // 15 s — keeps the inbox feeling live

export function useThreads() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['threads'],
    queryFn: () => callGetThreads(),
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });

  const threads: Thread[] = data?.threads ?? [];

  return {
    threads,
    needsReply: threads.filter(t => t.status === 'needs_reply'),
    parked: threads.filter(t => t.status === 'parked'),
    waitingOnCustomer: threads.filter(t => t.status === 'waiting_on_customer'),
    loading: isLoading,
    error: error?.message ?? null,
  };
}
