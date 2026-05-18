import { useState, useRef } from 'react';
import { router } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {login as apiLogin, customerLogin, forgetPassword, verifyOtp, resetPassword} from '../constants/services/api'
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';

const roles = [
  { key: 'admin', label: 'Quản lý kho',      icon: '📦' },
  { key: 'staff',  label: 'Nhân viên kho',     icon: '👷' },
];

export default function LoginScreen() {
  const { login } = useAuth();
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
        if (!email.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập email');
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
        const userData = customerMode ? res.customer : res.user;
        login(
            customerMode ? 'store_manager' : role,
            userData.name || userData.fullName || userData.username,
            userData.id,
            res.accessToken,
            userData.assignedZone,
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
          <Text style={styles.logoIcon}>📦</Text>
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
                    placeholderTextColor="rgba(255,255,255,0.45)"
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
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    keyboardType="number-pad"
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
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    secureTextEntry
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
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    keyboardType="email-address"
                    autoCapitalize="none"
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
                        <Text style={styles.roleIcon}>{r.icon}</Text>
                        <Text style={[styles.roleLabel, role === r.key && styles.roleLabelActive]}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Tên đăng nhập"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    value={username}
                    onChangeText={setUsername}
                  />
                </>
              )}

              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                placeholderTextColor="rgba(255,255,255,0.45)"
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity style={[styles.loginBtn, loading && { opacity: 0.7 }]} onPress={handleLogin}  disabled={loading}>
                <Text style={styles.loginBtnText}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text>
              </TouchableOpacity>

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
    backgroundColor: COLORS.primary,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoBox: {
    width: 80, height: 80,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logoIcon: { fontSize: 40 },
  title: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginBottom: 32,
  },
  form: { width: '100%', gap: 14 },
  input: {
    width: '100%',
    padding: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: COLORS.white,
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
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    gap: 4,
  },
  roleBtnActive: {
    backgroundColor: 'rgba(76,175,80,0.3)',
    borderColor: COLORS.accent,
  },
  roleIcon: { fontSize: 22 },
  roleLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  roleLabelActive: { color: COLORS.white },
  zoneLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: COLORS.accent,
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
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    marginTop: 32,
  },
  storeLink: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    textDecorationLine: 'underline',
  },
  backLink: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 8,
  },
});