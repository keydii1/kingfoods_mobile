import { Alert as RNAlert } from 'react-native';

let alertHandler = null;

export function registerAlertHandler(handler) {
  alertHandler = handler;
}

export function inferAlertType(title, buttons) {
  const t = (title || '').toLowerCase();
  if (t.includes('lỗi') || t.includes('thất bại') || t.includes('❌')) {
    return 'error';
  }
  if (
    t.includes('thành công') ||
    t.includes('hoàn thành') ||
    t.includes('đã duyệt')
  ) {
    return 'success';
  }
  if (t.includes('sai') || t.includes('định dạng') || t.includes('cảnh báo')) {
    return 'warning';
  }
  if (buttons && buttons.length > 1) {
    return 'confirm';
  }
  return 'info';
}

function normalizeButtons(buttons) {
  if (!buttons || buttons.length === 0) {
    return [{ text: 'Đóng', style: 'default' }];
  }
  return buttons;
}

export function appAlert(title, message, buttons) {
  const normalized = normalizeButtons(buttons);
  if (alertHandler) {
    alertHandler({
      title: title || '',
      message: message || '',
      buttons: normalized,
      type: inferAlertType(title, normalized),
    });
    return;
  }
  RNAlert.alert(title, message, buttons);
}

/** Drop-in replacement for React Native Alert */
export const Alert = {
  alert: appAlert,
};
