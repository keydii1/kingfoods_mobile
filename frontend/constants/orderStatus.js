import { COLORS } from './colors';

export const ORDER_STATUS = {
  pending: {
    label: 'Chờ xác nhận',
    labelEn: 'Pending Approval',
    color: '#e65100',
    bg: '#fff3e0',
  },
  processing: {
    label: 'Đang xử lý',
    labelEn: 'Processing',
    color: '#1565c0',
    bg: '#e3f2fd',
  },
  shipped: {
    label: 'Đang giao',
    labelEn: 'Shipped',
    color: '#1565c0',
    bg: '#e3f2fd',
  },
  delivered: {
    label: 'Đã giao',
    labelEn: 'Delivered',
    color: COLORS.primary,
    bg: '#e8f5e9',
  },
  cancelled: {
    label: 'Đã huỷ',
    labelEn: 'Cancelled',
    color: '#e53935',
    bg: '#ffebee',
  },
};

export function getOrderStatusMeta(status, lang = 'vi') {
  const meta = ORDER_STATUS[status] || { label: status || '—', labelEn: status || '—', color: '#888', bg: '#f5f5f5' };
  return {
    ...meta,
    label: lang === 'en' ? meta.labelEn : meta.label
  };
}

export function canCustomerCancelOrder(status) {
  return status === 'pending' || status === 'processing';
}
