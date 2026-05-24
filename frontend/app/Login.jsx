import { Alert } from '../utils/appAlert';
import { useState, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {login as apiLogin, customerLogin, forgetPassword, verifyOtp, resetPassword} from '../constants/services/api'
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Animated } from 'react-native';

const roles = [
  { key: 'admin', label: 'Quản lý kho',      icon: 'cube-outline' },
  { key: 'staff',  label: 'Nhân viên kho',     icon: 'construct-outline' },
];

const ZONE_MAP = {
  1: '🥦 Thực phẩm tươi',
  2: '🥫 Đồ khô & Gia vị',
  3: '🧴 Hoá mỹ phẩm',
  4: '❄️ Đồ đông lạnh'
};

export default function LoginScreen() {
  const { login } = useAuth();

  useEffect(() => {
    if (Platform.OS === 'web') {
      router.replace('/customer-login');
    }
  }, []);

  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState(null);
  const [customerMode, setCustomerMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(0); // 0=off, 1=email, 2=otp, 3=newpass
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const resetTokenRef = useRef('');
  const [hasBiometric, setHasBiometric] = useState(false);
  const [biometricCredKey, setBiometricCredKey] = useState(null);
  const bioPulse = useRef(new Animated.Value(1)).current;

  // Pulse animation for the biometric button
  useEffect(() => {
    if (hasBiometric) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(bioPulse, { toValue: 1.12, duration: 900, useNativeDriver: true }),
          Animated.timing(bioPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [hasBiometric]);

  // Check biometric support and existing credentials
  useEffect(() => {
    async function checkBiometrics() {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const isSettingEnabled = await AsyncStorage.getItem('setting_biometric') === 'true';

        if (hasHardware && isEnrolled && isSettingEnabled) {
          // Check credentials for the current mode first, then fallback
          const primaryKey = customerMode ? 'kfood_store_credentials' : 'kfood_wms_credentials';
          const fallbackKey = customerMode ? 'kfood_wms_credentials' : 'kfood_store_credentials';
          
          const primaryCreds = await SecureStore.getItemAsync(primaryKey);
          if (primaryCreds) {
            setHasBiometric(true);
            setBiometricCredKey(primaryKey);
            return;
          }
          const fallbackCreds = await SecureStore.getItemAsync(fallbackKey);
          if (fallbackCreds) {
            setHasBiometric(true);
            setBiometricCredKey(fallbackKey);
            return;
          }
        }
        setHasBiometric(false);
        setBiometricCredKey(null);
      } catch (err) {
        setHasBiometric(false);
        setBiometricCredKey(null);
      }
    }
    checkBiometrics();
  }, [customerMode, role]);

  const handleBiometricLogin = async () => {
    try {
      const key = biometricCredKey || (customerMode ? 'kfood_store_credentials' : 'kfood_wms_credentials');
      const savedCreds = await SecureStore.getItemAsync(key);
      if (!savedCreds) {
        Alert.alert('Thông báo', 'Không tìm thấy thông tin đăng nhập đã lưu. Vui lòng đăng nhập bằng mật khẩu trước.');
        return;
      }

      const parsed = JSON.parse(savedCreds);
      const isStoreLogin = key === 'kfood_store_credentials';

      // Authenticate locally using FaceID or fingerprint
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: isStoreLogin
          ? 'Quét FaceID/Vân tay để đăng nhập cửa hàng'
          : 'Xác thực FaceID/Vân tay nhân viên kho',
        fallbackLabel: 'Nhập mật khẩu',
        disableDeviceFallback: false,
      });

      if (auth.success) {
        setLoading(true);
        let res;
        if (isStoreLogin) {
          // Auto-switch to customer mode if needed
          if (!customerMode) setCustomerMode(true);
          res = await customerLogin(parsed.email, parsed.password);
        } else {
          if (customerMode) setCustomerMode(false);
          res = await apiLogin(parsed.username, parsed.password);
          if (parsed.role) {
            setRole(parsed.role);
          }
        }

        const userData = isStoreLogin ? res.customer : res.user;
        login(
          isStoreLogin ? 'store_manager' : (parsed.role || role),
          userData.name || userData.fullName || userData.username,
          userData.id,
          res.accessToken,
          userData.assignedLocationId ? ZONE_MAP[userData.assignedLocationId] : null,
        );

        const nextRoute = isStoreLogin
          ? '/storeorder'
          : (parsed.role === 'admin' ? '/managerdashboard' : '/dashboard');
        router.replace(nextRoute);
      }
    } catch (err) {
      Alert.alert('Đăng nhập thất bại', err.message || 'Xác thực sinh trắc học không thành công.');
    } finally {
      setLoading(false);
    }
  };

  // Auto trigger biometrics if eligible when entering screen
  useEffect(() => {
    if (hasBiometric && !loading) {
      const timer = setTimeout(() => {
        handleBiometricLogin();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasBiometric]);

  const getDashboardRoute = () => {
    if (customerMode) return '/storeorder';
    switch (role) {
      case 'admin': return '/managerdashboard';
      case 'staff': return '/dashboard';
      default:      return '/dashboard';
    }
  };

  const handleForgotPassword = async () => {
    if (forgotStep === 1) {
      if (!forgotEmail.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập email'); return; }
      setSubmitting(true);
      try {
        await forgetPassword(forgotEmail.trim());
        setForgotStep(2);
      } catch (err) {
        Alert.alert('Lỗi', err.message || 'Không thể gửi yêu cầu');
      } finally { setSubmitting(false); }
    } else if (forgotStep === 2) {
      if (!otp.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập mã OTP'); return; }
      setSubmitting(true);
      try {
        const verifyRes = await verifyOtp(forgotEmail.trim(), otp.trim());
        resetTokenRef.current = verifyRes?.resetToken || '';
        setForgotStep(3);
      } catch (err) {
        Alert.alert('Lỗi', err.message || 'Mã OTP không hợp lệ');
      } finally { setSubmitting(false); }
    } else if (forgotStep === 3) {
      if (!newPassword.trim() || newPassword.length < 6) {
        Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
        return;
      }
      if (!resetTokenRef.current) {
        Alert.alert('Lỗi', 'Token xác thực không hợp lệ, vui lòng thử lại từ đầu');
        return;
      }
      setSubmitting(true);
      try {
        await resetPassword(resetTokenRef.current, newPassword.trim());
        Alert.alert('Thành công', 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.');
        setForgotStep(0);
        setOtp('');
        setNewPassword('');
        resetTokenRef.current = '';
      } catch (err) {
        Alert.alert('Lỗi', err.message || 'Không thể đặt lại mật khẩu');
      } finally { setSubmitting(false); }
    }
  };

  const handleLogin = async () => {
    if (!role && !customerMode) {
        Alert.alert('Lỗi', 'Vui lòng chọn vai trò');
        return;
    }
    if (customerMode) {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
            return;
        }
    } else {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
            return;
        }
    }
    setLoading(true);
    try {
        let res;
        if (customerMode) {
            res = await customerLogin(email.trim(), password.trim());
        } else {
            res = await apiLogin(username.trim(), password.trim());
        }

        // Always save credentials to SecureStore for biometric login
        // SecureStore is encrypted by iOS Keychain / Android Keystore
        // Credentials are deleted when biometric toggle is turned OFF in settings
        try {
          const key = customerMode ? 'kfood_store_credentials' : 'kfood_wms_credentials';
          const credentials = customerMode
            ? { email: email.trim(), password: password.trim() }
            : { username: username.trim(), password: password.trim(), role: role };
          await SecureStore.setItemAsync(key, JSON.stringify(credentials));
        } catch (e) {
          console.log('SecureStore save error:', e);
        }

        const userData = customerMode ? res.customer : res.user;
        login(
            customerMode ? 'store_manager' : role,
            userData.name || userData.fullName || userData.username,
            userData.id,
            res.accessToken,
            userData.assignedLocationId ? ZONE_MAP[userData.assignedLocationId] : null,
        );
        router.replace(getDashboardRoute());
    } catch (err) {
        Alert.alert('Đăng nhập thất bại', err.message || 'Sai tài khoản hoặc mật khẩu!');
    } finally {
        setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}> 
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.logoBox}>
          <Ionicons name="cube" size={44} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Kingfood WMS</Text>
        <Text style={styles.subtitle}>Warehouse Management System</Text>

        <View style={styles.form}>

          {forgotStep > 0 ? (
            <>
              <TouchableOpacity onPress={() => { setForgotStep(0); setOtp(''); setNewPassword(''); }}>
                <Text style={styles.backLink}>← Quay lại đăng nhập</Text>
              </TouchableOpacity>

              {forgotStep === 1 && (
                <>
                  <Text style={styles.zoneLabel}>Nhập email để nhận mã OTP</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="rgba(30,41,59,0.4)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                  />
                </>
              )}

              {forgotStep === 2 && (
                <>
                  <Text style={styles.zoneLabel}>Nhập mã OTP đã gửi đến email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Mã OTP"
                    placeholderTextColor="rgba(30,41,59,0.4)"
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={otp}
                    onChangeText={setOtp}
                  />
                </>
              )}

              {forgotStep === 3 && (
                <>
                  <Text style={styles.zoneLabel}>Nhập mật khẩu mới</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Mật khẩu mới"
                    placeholderTextColor="rgba(30,41,59,0.4)"
                    secureTextEntry
                    autoCapitalize="none"
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                </>
              )}

              <TouchableOpacity style={[styles.loginBtn, submitting && { opacity: 0.7 }]} onPress={handleForgotPassword} disabled={submitting}>
                <Text style={styles.loginBtnText}>
                  {submitting ? 'Đang xử lý...' : forgotStep === 1 ? 'Gửi OTP' : forgotStep === 2 ? 'Xác nhận' : 'Đặt lại mật khẩu'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {customerMode ? (
                <>
                  <TouchableOpacity onPress={() => { setCustomerMode(false); setEmail(''); }}>
                    <Text style={styles.backLink}>← Quay lại</Text>
                  </TouchableOpacity>

                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="rgba(30,41,59,0.4)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.zoneLabel}>Bạn là:</Text>
                  <View style={styles.roleRow}>
                    {roles.map((r) => (
                      <TouchableOpacity
                        key={r.key}
                        style={[styles.roleBtn, role === r.key && styles.roleBtnActive]}
                        onPress={() => { setRole(r.key); }}
                      >
                        <Ionicons 
                          name={r.icon} 
                          size={24} 
                          color={role === r.key ? COLORS.primary : '#94a3b8'} 
                        />
                        <Text style={[styles.roleLabel, role === r.key && styles.roleLabelActive]}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Tên đăng nhập"
                    placeholderTextColor="rgba(30,41,59,0.4)"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={username}
                    onChangeText={setUsername}
                  />
                </>
              )}

              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                placeholderTextColor="rgba(30,41,59,0.4)"
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
              />

              <View style={hasBiometric ? styles.loginActionsRow : null}>
                <TouchableOpacity style={[styles.loginBtn, hasBiometric && { flex: 1 }, loading && { opacity: 0.7 }]} onPress={handleLogin}  disabled={loading}>
                  <Text style={styles.loginBtnText}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text>
                </TouchableOpacity>

                {hasBiometric && (
                  <View style={styles.biometricWrap}>
                    <Animated.View style={{ transform: [{ scale: bioPulse }] }}>
                      <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometricLogin} disabled={loading}>
                        <Ionicons name="finger-print" size={28} color={COLORS.primary} />
                      </TouchableOpacity>
                    </Animated.View>
                    <Text style={styles.biometricLabel}>FaceID</Text>
                  </View>
                )}
              </View>

              {!customerMode && (
                <TouchableOpacity onPress={() => setForgotStep(1)}>
                  <Text style={styles.storeLink}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              )}

              {!customerMode && (
                <TouchableOpacity onPress={() => setCustomerMode(true)}>
                  <Text style={styles.storeLink}>Quản lý cửa hàng? Đăng nhập tại đây</Text>
                </TouchableOpacity>
              )}
            </>
          )}

        </View>

        <Text style={styles.footer}>Kingfood WMS v2.1 © 2025</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoBox: {
    width: 80, height: 80,
    backgroundColor: COLORS.warningBg,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  logoIcon: { fontSize: 40 },
  title: {
    color: COLORS.primary,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textGray,
    fontSize: 13,
    marginBottom: 32,
  },
  form: { width: '100%', gap: 14 },
  input: {
    width: '100%',
    padding: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    fontSize: 15,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  roleBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    gap: 4,
  },
  roleBtnActive: {
    backgroundColor: COLORS.warningBg,
    borderColor: COLORS.primary,
  },
  roleIcon: { fontSize: 22 },
  roleLabel: {
    color: COLORS.textGray,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  roleLabelActive: { color: COLORS.primary, fontWeight: '700' },
  zoneLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 17,
    alignItems: 'center',
    marginTop: 6,
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  footer: {
    color: COLORS.textGray,
    opacity: 0.5,
    fontSize: 12,
    marginTop: 32,
  },
  storeLink: {
    color: COLORS.primary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    textDecorationLine: 'underline',
  },
  backLink: {
    color: COLORS.textGray,
    fontSize: 14,
    marginBottom: 8,
  },
  loginActionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  biometricWrap: {
    alignItems: 'center',
    marginTop: 6,
  },
  biometricBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  biometricLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.5,
  },
});