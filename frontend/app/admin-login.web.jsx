import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { Alert } from '../utils/appAlert';
import { login as apiLogin } from '../constants/services/api';

export default function AdminLoginWebScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tài khoản quản trị và mật khẩu');
      return;
    }
    setLoading(true);
    try {
      const res = await apiLogin(username.trim(), password.trim());
      const userData = res.user;
      
      if (userData.role !== 'admin') {
        Alert.alert('Từ chối truy cập', 'Giao diện Web Admin này chỉ dành riêng cho Quản lý tổng kho!');
        setLoading(false);
        return;
      }

      login(
        'admin',
        userData.fullName || userData.username,
        userData.id,
        res.accessToken,
        userData.assignedZone
      );
      router.replace('/managerdashboard');
    } catch (err) {
      Alert.alert('Đăng nhập thất bại', err.message || 'Sai tài khoản quản lý hoặc mật khẩu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.webContainer}>
      {/* Left panel: Industrial WMS Command Center Sidebar */}
      <View style={styles.brandSide}>
        <View style={styles.overlay} />
        <View style={styles.brandContent}>
          <View style={styles.logoBadge}>
            <Ionicons name="cube" size={32} color="#fff" />
          </View>
          <Text style={styles.brandTitle}>WMS Command Center</Text>
          <Text style={styles.brandSubtitle}>Hệ thống Điều hành Tổng kho Hàng & Phân phối Chuỗi cửa hàng Kingfood Market</Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Ionicons name="stats-chart" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>Bảng điều hành thời gian thực (Live Dashboard)</Text>
                <Text style={styles.featureDesc}>Giám sát số lượng SKU nhặt hoàn tất, lượng nhân sự vận hành và các cảnh báo năng suất trực tiếp.</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Ionicons name="construct" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>Điều phối Đơn hàng & Soạn hàng</Text>
                <Text style={styles.featureDesc}>Quản lý trạng thái vòng đời đơn hàng chi tiết từ chờ duyệt, đang soạn hàng, đến giao hàng và hoàn tất.</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Ionicons name="warning" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>Hệ thống Báo thiếu & Xử lý sự cố kệ hàng</Text>
                <Text style={styles.featureDesc}>Tiếp nhận báo cáo thiếu SKU khẩn cấp từ nhân viên lấy hàng, định vị kệ hàng chính xác để kịp thời xử lý.</Text>
              </View>
            </View>
          </View>

          <Text style={styles.brandFooter}>Hệ thống vận hành tổng kho Kingfood v2.5 © 2026</Text>
        </View>
      </View>

      {/* Right panel: Modern security login card */}
      <View style={styles.formSide}>
        <View style={styles.loginCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Quản trị viên Đăng nhập</Text>
            <Text style={styles.formSubtitle}>Cổng truy cập bảo mật cao dành cho Quản lý Tổng kho Kingfood Market.</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tên tài khoản Quản lý</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#888" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.webTextInput}
                placeholder="Ví dụ: admin"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mật khẩu Admin</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#888" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.webTextInput}
                placeholder="••••••••"
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity style={[styles.loginBtnWeb, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.loginBtnTextWeb}>Đăng nhập Command Center</Text>
                <Ionicons name="shield-half" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Hoặc bạn là</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.switchLoginBtn} onPress={() => router.replace('/customer-login')}>
            <Ionicons name="storefront" size={18} color="#475569" style={{ marginRight: 6 }} />
            <Text style={styles.switchLoginText}>Tôi là Quản lý Cửa hàng (Customer)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  brandSide: {
    flex: 1.2,
    backgroundColor: '#1E5E3A', // Deep green WMS brand style
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.15)',
  },
  brandContent: {
    flex: 1,
    padding: 60,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginTop: 20,
  },
  brandSubtitle: {
    fontSize: 16,
    color: '#a7f3d0',
    lineHeight: 24,
    marginTop: 8,
    maxWidth: '85%',
  },
  featuresList: {
    marginVertical: 40,
    gap: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  featureDesc: {
    fontSize: 12,
    color: '#a7f3d0',
    lineHeight: 18,
    marginTop: 4,
  },
  brandFooter: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },

  formSide: {
    flex: 0.8,
    backgroundColor: '#fafbfc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loginCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  formHeader: {
    marginBottom: 32,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e293b',
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginTop: 6,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  webTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    borderWidth: 0,
    outlineWidth: 0,
  },
  loginBtnWeb: {
    backgroundColor: '#1E5E3A', // Industrial deep green theme
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#1E5E3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginTop: 12,
  },
  loginBtnTextWeb: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontSize: 11,
    color: '#94a3b8',
    paddingHorizontal: 12,
    fontWeight: '600',
  },
  switchLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 12,
  },
  switchLoginText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
});
