import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { registerAlertHandler } from '../utils/appAlert';

const TYPE_META = {
  success: {
    icon: 'checkmark-circle',
    iconColor: COLORS.primary,
    badgeBg: COLORS.successBg,
    ringColor: COLORS.accent,
    accent: COLORS.primary,
  },
  error: {
    icon: 'close-circle',
    iconColor: COLORS.error,
    badgeBg: COLORS.errorBg,
    ringColor: '#ef9a9a',
    accent: COLORS.error,
  },
  warning: {
    icon: 'warning',
    iconColor: '#e65100',
    badgeBg: COLORS.warningBg,
    ringColor: '#ffcc80',
    accent: '#e65100',
  },
  info: {
    icon: 'information-circle',
    iconColor: COLORS.info,
    badgeBg: COLORS.infoBg,
    ringColor: '#90caf9',
    accent: COLORS.info,
  },
  confirm: {
    icon: 'help-circle',
    iconColor: COLORS.primary,
    badgeBg: COLORS.successBg,
    ringColor: COLORS.accent,
    accent: COLORS.primary,
  },
};

function AlertIcon({ type }) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const meta = TYPE_META[type] || TYPE_META.info;

  useEffect(() => {
    scale.setValue(0.5);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [type, scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.iconWrap,
        { backgroundColor: meta.badgeBg, borderColor: meta.ringColor, opacity },
        { transform: [{ scale }] },
      ]}
    >
      <Ionicons name={meta.icon} size={40} color={meta.iconColor} />
    </Animated.View>
  );
}

export function AppAlertProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState(null);
  const slide = useRef(new Animated.Value(36)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const activeConfigRef = useRef(null);

  const dismiss = useCallback(() => {
    const configToDismiss = activeConfigRef.current;
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 24, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      if (activeConfigRef.current === configToDismiss) {
        setVisible(false);
        setConfig(null);
        activeConfigRef.current = null;
      }
    });
  }, [fade, slide]);

  const show = useCallback(
    (next) => {
      activeConfigRef.current = next;
      setConfig(next);
      setVisible(true);
      slide.setValue(36);
      fade.setValue(0);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slide, { toValue: 0, friction: 8, tension: 68, useNativeDriver: true }),
      ]).start();
    },
    [fade, slide]
  );

  useEffect(() => {
    registerAlertHandler(show);
    return () => registerAlertHandler(null);
  }, [show]);

  const handlePress = (btn) => {
    dismiss();
    setTimeout(() => btn.onPress?.(), 180);
  };

  const type = config?.type || 'info';
  const meta = TYPE_META[type] || TYPE_META.info;
  const buttons = config?.buttons || [{ text: 'Đóng', style: 'default' }];
  const multi = buttons.length > 2;

  return (
    <>
      {children}
      <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
        <Animated.View style={[styles.backdrop, { opacity: fade }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
          <Animated.View style={[styles.card, { transform: [{ translateY: slide }] }]}>
            <AlertIcon type={type} />
            <Text style={styles.title}>{config?.title}</Text>
            {config?.message ? (
              <Text style={styles.message}>{config.message}</Text>
            ) : null}

            <View style={[styles.actions, multi && styles.actionsStack]}>
              {buttons.map((btn, i) => {
                const isCancel = btn.style === 'cancel';
                const isDestructive = btn.style === 'destructive';
                const isPrimary =
                  !isCancel &&
                  !isDestructive &&
                  (buttons.length === 1 || i === buttons.length - 1);

                return (
                  <TouchableOpacity
                    key={`${btn.text}-${i}`}
                    style={[
                      styles.btn,
                      multi && styles.btnStacked,
                      isCancel && styles.btnCancel,
                      isDestructive && styles.btnDestructive,
                      isPrimary && { backgroundColor: meta.accent },
                      !isPrimary && !isCancel && !isDestructive && buttons.length > 1 && styles.btnSecondary,
                    ]}
                    onPress={() => handlePress(btn)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.btnText,
                        isCancel && styles.btnTextCancel,
                        isDestructive && styles.btnTextDestructive,
                        isPrimary && styles.btnTextPrimary,
                      ]}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 26,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 14,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: COLORS.textGray,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  actionsStack: {
    flexDirection: 'column',
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnStacked: {
    flex: 0,
    width: '100%',
  },
  btnCancel: {
    backgroundColor: '#f0f0f0',
  },
  btnSecondary: {
    backgroundColor: '#e8f5e9',
  },
  btnDestructive: {
    backgroundColor: COLORS.errorBg,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  btnTextCancel: {
    color: COLORS.textGray,
  },
  btnTextDestructive: {
    color: COLORS.error,
    fontWeight: '800',
  },
  btnTextPrimary: {
    color: '#fff',
    fontWeight: '800',
  },
});
