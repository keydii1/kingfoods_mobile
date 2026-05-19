import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { Alert } from '../utils/appAlert';
import { customerLogin } from '../constants/services/api';

export default function CustomerLoginWebScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ email và mật khẩu');
      return;
    }
    setLoading(true);
    try {
      const res = await customerLogin(email.trim(), password.trim());
      const userData = res.customer;
      login(
        'store_manager',
        userData.name || userData.fullName || userData.username,
        userData.id,
        res.accessToken,
        userData.assignedZone
      );
      router.replace('/storeorder');
    } catch (err) {
      Alert.alert('Đăng nhập thất bại', err.message || 'Sai email hoặc mật khẩu cửa hàng!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.webContainer}>
      {/* Left panel: Kingfood Brand Sidebar */}
      <View style={styles.brandSide}>
        <View style={styles.overlay} />
        <View style={styles.brandContent}>
          <View style={styles.logoBadge}>
            <Ionicons name="storefront" size={32} color="#fff" />
          </View>
          <Text style={styles.brandTitle}>Kingfood Market</Text>
          <Text style={styles.brandSubtitle}>Cổng đặt hàng & Quản lý chuỗi cung ứng dành cho Chi nhánh</Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Ionicons name="cart" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>Lên đơn hàng siêu tốc</Text>
                <Text style={styles.featureDesc}>Đặt hàng trực tiếp tới tổng kho với cơ chế tự động khớp SKU chỉ trong vài nhấp chuột.</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Ionicons name="navigate" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>Hành trình đơn trực quan</Text>
                <Text style={styles.featureDesc}>Theo dõi trạng thái soạn hàng, bàn giao xe tải và giao nhận theo thời gian thực.</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Ionicons name="pie-chart" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>Thống kê chi tiêu thông minh</Text>
                <Text style={styles.featureDesc}>Phân tích sản phẩm bán chạy nhất chi nhánh và biểu đồ hoá chỉ tiêu tiêu dùng định kỳ.</Text>
              </View>
            </View>
          </View>

          <Text style={styles.brandFooter}>Hệ thống vận hành tổng kho Kingfood v2.5 © 2026</Text>
        </View>
      </View>

      {/* Right panel: Modern floating login card */}
      <View style={styles.formSide}>
        <View style={styles.loginCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Đăng nhập Cửa hàng</Text>
            <Text style={styles.formSubtitle}>Chào mừng bạn quay lại! Nhập thông tin đăng nhập được cấp.</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Địa chỉ Email đối tác</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#888" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.webTextInput}
                placeholder="branch.q7@kingfoodmarket.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mật khẩu bảo mật</Text>
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
                <Text style={styles.loginBtnTextWeb}>Đăng nhập Cổng mua hàng</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Hoặc bạn là</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.switchLoginBtn} onPress={() => router.replace('/admin-login')}>
            <Ionicons name="shield-checkmark" size={18} color="#475569" style={{ marginRight: 6 }} />
            <Text style={styles.switchLoginText}>Tôi là Quản lý Tổng kho (Admin)</Text>
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
    backgroundColor: '#F26522', // Kingfood Orange theme
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(216,75,6,0.1)',
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
    color: '#ffe0b2',
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
    color: '#ffe0b2',
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
    backgroundColor: '#F26522', // Kingfood Orange theme
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#F26522',
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
