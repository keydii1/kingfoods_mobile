import { COLORS } from './colors';

export const ORDER_STATUS = {
  pending: {
    label: 'Chờ xác nhận',
    color: '#e65100',
    bg: '#fff3e0',
  },
  processing: {
    label: 'Đang xử lý',
    color: '#1565c0',
    bg: '#e3f2fd',
  },
  shipped: {
    label: 'Đang giao',
    color: '#1565c0',
    bg: '#e3f2fd',
  },
  delivered: {
    label: 'Đã giao',
    color: COLORS.primary,
    bg: '#e8f5e9',
  },
  cancelled: {
    label: 'Đã huỷ',
    color: '#e53935',
    bg: '#ffebee',
  },
};

export function getOrderStatusMeta(status) {
  return ORDER_STATUS[status] || { label: status || '—', color: '#888', bg: '#f5f5f5' };
}

export function canCustomerCancelOrder(status) {
  return status === 'pending' || status === 'processing';
}
