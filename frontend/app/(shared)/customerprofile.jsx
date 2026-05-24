import { Text, View, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator} from 'react-native';
import { Alert } from '../../utils/appAlert';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../../constants/services/api';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';

const TRANSLATIONS = {
  vi: {
    profile: 'Cá nhân',
    order: 'Đặt hàng',
    stats: 'Thống kê',
    settings: 'Cài đặt',
    contactInfo: 'Thông tin liên hệ',
    manager: 'Người quản lý',
    email: 'Email đăng nhập',
    phone: 'Số điện thoại',
    branchInfo: 'Chi nhánh quản lý',
    branchName: 'Tên chi nhánh',
    address: 'Địa chỉ',
    status: 'Trạng thái',
    active: 'Hoạt động',
    inactive: 'Tạm khóa',
    saveChanges: 'Lưu thay đổi',
    notUpdated: 'Chưa cập nhật',
    noPhone: 'Chưa có',
    noConfig: 'Chưa cấu hình',
    error: 'Lỗi',
    success: 'Thành công',
    pleaseFillName: 'Vui lòng nhập tên người quản lý',
    updateSuccess: 'Cập nhật hồ sơ cửa hàng thành công',
    cannotUpdate: 'Không thể cập nhật hồ sơ',
    managerNamePlaceholder: 'Tên quản lý',
  },
  en: {
    profile: 'Profile',
    order: 'Order',
    stats: 'Statistics',
    settings: 'Settings',
    profileLabel: 'Profile',
    contactInfo: 'Contact Information',
    manager: 'Manager Name',
    email: 'Login Email',
    phone: 'Phone Number',
    branchInfo: 'Managed Branch',
    branchName: 'Branch Name',
    address: 'Address',
    status: 'Status',
    active: 'Active',
    inactive: 'Suspended',
    saveChanges: 'Save Changes',
    notUpdated: 'Not updated',
    noPhone: 'None',
    noConfig: 'Not configured',
    error: 'Error',
    success: 'Success',
    pleaseFillName: 'Please enter the manager name',
    updateSuccess: 'Store profile updated successfully',
    cannotUpdate: 'Cannot update profile',
    managerNamePlaceholder: 'Manager name',
  }
};

function InfoRow({ label, value, valueColor, stacked, textColor, subColor, borderColor }) {
  const useStacked =
    stacked ??
    (typeof value === 'string' && (value.includes('@') || value.length > 26));

  if (useStacked) {
    return (
      <View style={[styles.infoRowStacked, borderColor && { borderTopColor: borderColor }]}>
        <Text style={[styles.infoLabelMuted, subColor && { color: subColor }]}>{label}</Text>
        <Text style={[styles.infoValueFull, { color: valueColor || textColor || '#222' }]}>{value}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.infoRow, borderColor && { borderTopColor: borderColor }]}>
      <Text style={[styles.infoLabel, subColor && { color: subColor }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: valueColor || textColor || '#222' }]}>{value}</Text>
    </View>
  );
}

export default function CustomerProfileScreen() {
  const { darkMode, language } = useAppPreferences();
  const t = TRANSLATIONS[language] || TRANSLATIONS.vi;
  const insets = useSafeAreaInsets();

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
      Alert.alert(t.error, t.pleaseFillName);
      return;
    }
    try {
      await updateProfile(editForm);
      setUser(prev => ({ ...prev, ...editForm }));
      setEditing(false);
      Alert.alert(t.success, t.updateSuccess);
      fetchProfile(); // reload to get relations properly
    } catch (err) {
      Alert.alert(t.error, err.message || t.cannotUpdate);
    }
  };

  // Theme dynamic colors
  const activeBg = darkMode ? '#121212' : '#f0f4f1';
  const activeCardBg = darkMode ? '#1e1e1e' : '#fff';
  const activeTextColor = darkMode ? '#f3f4f6' : '#222';
  const activeTextGrayColor = darkMode ? '#9ca3af' : '#888';
  const activeBorderColor = darkMode ? '#2d2d2d' : '#eee';

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: activeBg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeBg }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: activeCardBg, borderBottomColor: activeBorderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeTextColor }]}>{t.profile}</Text>
        <TouchableOpacity onPress={editing ? cancelEdit : startEdit}>
          <Ionicons name={editing ? "close" : "create-outline"} size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        {/* Banner */}
            <View style={styles.banner}>
              <View style={styles.avatarContainer}>
                <Ionicons name="storefront" size={42} color="#fff" />
              </View>
              {editing ? (
                <TextInput
                  style={[styles.nameInput, styles.editInput]}
                  value={editForm.name}
                  onChangeText={txt => setEditForm(f => ({ ...f, name: txt }))}
                  placeholder={t.managerNamePlaceholder}
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  autoCapitalize="none"
                  autoCorrect={true}
                  spellCheck={false}
                />
              ) : (
                <Text style={styles.name}>{user?.name || t.notUpdated}</Text>
              )}
              <Text style={styles.branchSub}>
                {user?.branch?.name || 'Chi nhánh Kingfood'}
              </Text>
              
              {editing && (
                <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
                  <Text style={styles.saveBtnText}>{t.saveChanges}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Thông tin liên hệ */}
            <View style={[styles.card, { backgroundColor: activeCardBg }]}>
              <Text style={[styles.cardTitle, { color: activeTextGrayColor }]}>{t.contactInfo}</Text>
              <InfoRow label={t.manager} value={user?.name || t.notUpdated} textColor={activeTextColor} subColor={activeTextGrayColor} borderColor={activeBorderColor} />
              <InfoRow label={t.email} value={user?.email || t.notUpdated} stacked textColor={activeTextColor} subColor={activeTextGrayColor} borderColor={activeBorderColor} />
              
              <View style={[styles.infoRow, { borderTopColor: activeBorderColor }]}>
                <Text style={[styles.infoLabel, { color: activeTextGrayColor }]}>{t.phone}</Text>
                {editing ? (
                  <TextInput
                    style={[styles.inlineInput, { color: activeTextColor, borderBottomColor: COLORS.primary }]}
                    value={editForm.phoneNumber}
                    onChangeText={txt => setEditForm(f => ({ ...f, phoneNumber: txt }))}
                    placeholder={t.phone}
                    placeholderTextColor={activeTextGrayColor}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    autoCorrect={true}
                    spellCheck={false}
                  />
                ) : (
                  <Text style={[styles.infoValue, styles.infoValueInline, { color: activeTextColor }]}>
                    {user?.phoneNumber || t.noPhone}
                  </Text>
                )}
              </View>
            </View>

            {/* Thông tin chi nhánh */}
            <View style={[styles.card, { backgroundColor: activeCardBg }]}>
              <Text style={[styles.cardTitle, { color: activeTextGrayColor }]}>{t.branchInfo}</Text>
              <InfoRow label={t.branchName} value={user?.branch?.name || t.noConfig} textColor={activeTextColor} subColor={activeTextGrayColor} borderColor={activeBorderColor} />
              <InfoRow label={t.address} value={user?.branch?.address || t.noConfig} stacked textColor={activeTextColor} subColor={activeTextGrayColor} borderColor={activeBorderColor} />
              <InfoRow 
                label={t.status} 
                value={user?.status === 'active' ? t.active : t.inactive} 
                valueColor={user?.status === 'active' ? COLORS.primary : COLORS.error} 
                textColor={activeTextColor} 
                subColor={activeTextGrayColor} 
                borderColor={activeBorderColor} 
              />
            </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { backgroundColor: activeCardBg, borderTopColor: activeBorderColor, paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/storeorder')}>
          <Ionicons name="cart-outline" size={22} color={activeTextGrayColor} style={{ marginBottom: 2 }} />
          <Text style={[styles.navLabel, { color: activeTextGrayColor }]}>{t.order}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/storestatistics')}>
          <Ionicons name="stats-chart-outline" size={22} color={activeTextGrayColor} style={{ marginBottom: 2 }} />
          <Text style={[styles.navLabel, { color: activeTextGrayColor }]}>{t.stats}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/setting')}>
          <Ionicons name="settings-outline" size={22} color={activeTextGrayColor} style={{ marginBottom: 2 }} />
          <Text style={[styles.navLabel, { color: activeTextGrayColor }]}>{t.settings}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person" size={22} color={COLORS.primary} style={{ marginBottom: 2 }} />
          <Text style={[styles.navLabel, styles.navActive]}>{t.profile}</Text>
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
    borderRadius: 16, margin: 12, marginBottom: 0,
    paddingVertical: 4, overflow: 'hidden',
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#888', padding: 14, paddingBottom: 8 },
  infoRow: {
    flexDirection: 'row',
    padding: 14,
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    alignItems: 'center',
    gap: 12,
  },
  infoRowStacked: {
    padding: 14,
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    gap: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#888',
    width: 108,
    flexShrink: 0,
  },
  infoLabelMuted: {
    fontSize: 12,
    color: '#888',
  },
  infoValue: {
    flex: 1,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#222',
    textAlign: 'right',
  },
  infoValueInline: {
    lineHeight: 18,
  },
  infoValueFull: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    lineHeight: 21,
  },
  inlineInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#222',
    borderBottomWidth: 1,
    textAlign: 'right',
    paddingVertical: 2,
    minWidth: 0,
  },
  bottomNav: {
    flexDirection: 'row', paddingVertical: 10,
    borderTopWidth: 1,
  },
  navItem: { flex: 1, alignItems: 'center' },
  navLabel: { fontSize: 10, marginTop: 2 },
  navActive: { color: COLORS.primary, fontWeight: '600' },
});
