import { useQuery } from '@tanstack/react-query';
import { callGetOrders } from '../api/client';
import type { Order, OrderStage } from '../types';

const REFETCH_INTERVAL = 20_000;

export function useOrders(stage?: OrderStage) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', stage],
    queryFn: () => callGetOrders(stage),
    refetchInterval: REFETCH_INTERVAL,
  });

  const orders: Order[] = data?.orders ?? [];

  const byLeadTime = [...orders].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  });

  return {
    orders,
    confirmedOrders: orders.filter(o => ['confirmed', 'completed'].includes(o.stage)),
    byLeadTime,
    loading: isLoading,
    error: error?.message ?? null,
  };
}
