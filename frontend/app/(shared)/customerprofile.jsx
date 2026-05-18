import { Text, View, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../../constants/services/api';

function InfoRow({ label, value, valueColor }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

export default function CustomerProfileScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  async function fetchProfile() {
    try {
      setLoading(true);
      const res = await getProfile();
      setUser(res);
      setEditForm({
        name: res?.name || '',
        phoneNumber: res?.phoneNumber || '',
      });
    } catch (err) {
      console.log('Customer profile fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  const startEdit = () => {
    setEditForm({
      name: user?.name || '',
      phoneNumber: user?.phoneNumber || '',
    });
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên người quản lý');
      return;
    }
    try {
      await updateProfile(editForm);
      setUser(prev => ({ ...prev, ...editForm }));
      setEditing(false);
      Alert.alert('Thành công', 'Cập nhật hồ sơ cửa hàng thành công');
      fetchProfile(); // reload to get relations properly
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể cập nhật hồ sơ');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ sơ cửa hàng</Text>
        <TouchableOpacity onPress={editing ? cancelEdit : startEdit}>
          <Ionicons name={editing ? "close" : "create-outline"} size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Banner */}
            <View style={styles.banner}>
              <View style={styles.avatarContainer}>
                <Ionicons name="storefront" size={42} color="#fff" />
              </View>
              {editing ? (
                <TextInput
                  style={[styles.nameInput, styles.editInput]}
                  value={editForm.name}
                  onChangeText={t => setEditForm(f => ({ ...f, name: t }))}
                  placeholder="Tên quản lý"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  autoComplete="off"
                  importantForAutofill="no"
                  textContentType="oneTimeCode"
                />
              ) : (
                <Text style={styles.name}>{user?.name || 'Chưa cập nhật'}</Text>
              )}
              <Text style={styles.branchSub}>
                {user?.branch?.name || 'Chi nhánh Kingfood'}
              </Text>
              
              {editing && (
                <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
                  <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Thông tin liên hệ */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Thông tin liên hệ</Text>
              <InfoRow label="Người quản lý" value={user?.name || 'Chưa cập nhật'} />
              <InfoRow label="Email đăng nhập" value={user?.email || 'Chưa cập nhật'} />
              
              <View style={styles.infoRowContainer}>
                <Text style={styles.infoLabel}>Số điện thoại</Text>
                {editing ? (
                  <TextInput
                    style={styles.inlineInput}
                    value={editForm.phoneNumber}
                    onChangeText={t => setEditForm(f => ({ ...f, phoneNumber: t }))}
                    placeholder="Số điện thoại"
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    autoComplete="off"
                    importantForAutofill="no"
                    textContentType="oneTimeCode"
                  />
                ) : (
                  <Text style={styles.infoValue}>{user?.phoneNumber || 'Chưa có'}</Text>
                )}
              </View>
            </View>

            {/* Thông tin chi nhánh */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Chi nhánh quản lý</Text>
              <InfoRow label="Tên chi nhánh" value={user?.branch?.name || 'Chưa cấu hình'} />
              <InfoRow label="Địa chỉ" value={user?.branch?.address || 'Chưa cấu hình'} />
              <InfoRow label="Trạng thái" value={user?.status === 'active' ? 'Hoạt động' : 'Tạm khóa'} valueColor={user?.status === 'active' ? COLORS.primary : COLORS.error} />
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/storeorder')}>
          <Ionicons name="cart-outline" size={22} color="#aaa" style={{ marginBottom: 2 }} />
          <Text style={styles.navLabel}>Đặt hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/storestatistics')}>
          <Ionicons name="stats-chart-outline" size={22} color="#aaa" style={{ marginBottom: 2 }} />
          <Text style={styles.navLabel}>Thống kê</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/setting')}>
          <Ionicons name="settings-outline" size={22} color="#aaa" style={{ marginBottom: 2 }} />
          <Text style={styles.navLabel}>Cài đặt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person" size={22} color={COLORS.primary} style={{ marginBottom: 2 }} />
          <Text style={[styles.navLabel, styles.navActive]}>Cá nhân</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f4f1' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  scroll: { flex: 1 },
  banner: {
    backgroundColor: COLORS.primary, paddingVertical: 24, paddingHorizontal: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarContainer: {
    width: 82, height: 82, borderRadius: 41, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  name: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  nameInput: {
    fontSize: 18, fontWeight: '700', color: '#fff', borderBottomWidth: 1.5,
    borderBottomColor: '#fff', minWidth: 180, textAlign: 'center', paddingVertical: 4,
  },
  branchSub: { fontSize: 13, color: '#e8f5e9', fontWeight: '500' },
  saveBtn: {
    backgroundColor: '#fff', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16,
    marginTop: 14,
  },
  saveBtnText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, margin: 12, marginBottom: 0,
    paddingVertical: 4, overflow: 'hidden',
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#888', padding: 14, paddingBottom: 8 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', padding: 14,
    borderTopWidth: 0.5, borderTopColor: '#eee', alignItems: 'center',
  },
  infoRowContainer: {
    flexDirection: 'row', justifyContent: 'space-between', padding: 14,
    borderTopWidth: 0.5, borderTopColor: '#eee', alignItems: 'center', height: 48,
  },
  infoLabel: { fontSize: 13, color: '#888' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#222' },
  inlineInput: {
    fontSize: 13, fontWeight: '600', color: '#222', borderBottomWidth: 1,
    borderBottomColor: COLORS.primary, width: 140, textAlign: 'right', paddingVertical: 2,
  },
  bottomNav: {
    flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#eee',
  },
  navItem: { flex: 1, alignItems: 'center' },
  navLabel: { fontSize: 10, color: '#aaa', marginTop: 2 },
  navActive: { color: COLORS.primary, fontWeight: '600' },
});
