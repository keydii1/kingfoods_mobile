import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Switch, ActivityIndicator} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert } from '../../utils/appAlert';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '../../constants/colors';
import {createUser, getLocations} from '../../constants/services/api';


const roles = [
  { key: 'picker', label: 'Nhân viên pick' },
  { key: 'packer', label: 'Nhân viên pack' },
  { key: 'supervisor', label: 'Giám sát' },
  { key: 'manager', label: 'Quản lý' },
];

const zones = ['Khu A', 'Khu B', 'Khu C', 'Khu D'];

export default function CreateAccountScreen() {
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('picker');
  const [dbLocations, setDbLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [canManageTeam, setCanManageTeam] = useState(false);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await getLocations();
        setDbLocations(Array.isArray(res) ? res : (res?.data || res?.items || []));
      } catch (err) {
        console.log('Failed to fetch locations:', err);
      } finally {
        setLoadingLocations(false);
      }
    }
    fetchLocations();
  }, []);

  const handleCreate = async() => {
    if (!name || !email || !username || !password || !role || !selectedLocationId) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin và chọn Khu vực');
      return;
    }
    const chosenLoc = dbLocations.find(l => l.id === selectedLocationId);
    const locationName = chosenLoc ? chosenLoc.name : '';
    Alert.alert(
      'Xác nhận',
      `Tạo tài khoản cho ${name} (${role}) tại ${locationName}?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Tạo tài khoản',
          onPress: async () => {
            setSubmitting(true);
            try{
              await createUser({
                name,
                email,
                username,
                password,
                role: role === 'picker' || role === 'packer' ? 'staff' : 'admin',
                assignedLocationId: selectedLocationId,
                canManageTeam: false,
              });
              Alert.alert('Thành công', `Tài khoản "${username}" đã được tạo. Nhân viên có thể đăng nhập ngay.`);
              setName('');
              setEmail('');
              setUsername('');
              setPassword('');
              setRole('');
              setSelectedLocationId(null);
              router.back();
            } catch (err) {
              Alert.alert('❌ Lỗi', err.message || 'Không tạo được tài khoản');
            } finally {
              setSubmitting(false);
            }
                },
            },
        ]
    );
};

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo tài khoản</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="person-outline" size={20} color="#222" style={{ marginRight: 6 }} />
            <Text style={styles.cardTitle}>Thông tin nhân viên</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Họ và tên"
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Địa chỉ Email"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Tên đăng nhập"
            placeholderTextColor="#aaa"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Vai trò</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[styles.optionBtn, styles.optionBtnActive, { opacity: 0.9, backgroundColor: '#e8f5e9', borderColor: COLORS.accent, borderWidth: 1 }]}
              disabled={true}
            >
              <Text style={[styles.optionBtnText, styles.optionBtnTextActive, { fontWeight: '700', color: COLORS.primary }]}>
                Nhân viên soạn hàng (Picker)
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Khu vực kệ kho làm việc: *</Text>
          {loadingLocations ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 12 }} />
          ) : (
            <View style={styles.optionRow}>
              {dbLocations.map(l => (
                <TouchableOpacity
                  key={l.id}
                  style={[styles.zoneBtn, selectedLocationId === l.id && styles.zoneBtnActive]}
                  onPress={() => setSelectedLocationId(l.id)}
                >
                  <Text style={[styles.optionBtnText, selectedLocationId === l.id && styles.optionBtnTextActive]}>
                    {l.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Permissions */}
          <Text style={styles.label}>Phân quyền</Text>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={styles.switchName}>Báo cáo sự cố</Text>
              <Text style={styles.switchSub}>Có thể gửi báo cáo sự cố</Text>
            </View>
            <Switch
              value={true}
              trackColor={{ false: '#ddd', true: COLORS.accent }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity
                style={[styles.createBtn, submitting && { opacity: 0.7 }]}
                onPress={handleCreate}
                disabled={submitting}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.createBtnText}>
                      {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                  </Text>
                </View>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f4f1' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backBtn: { fontSize: 28, color: COLORS.primary },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  scroll: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 16 },
  input: {
    backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14, fontSize: 14,
    marginBottom: 12,
  },
  label: {
    fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 8, marginTop: 4,
  },
  optionRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12,
  },
  optionBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  optionBtnActive: { backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: COLORS.accent },
  optionBtnText: { fontSize: 12, fontWeight: '600', color: '#666' },
  optionBtnTextActive: { color: COLORS.primary },
  zoneBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  zoneBtnActive: { backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: COLORS.accent },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#eee',
  },
  switchLabel: { flex: 1, marginRight: 10 },
  switchName: { fontSize: 13, fontWeight: '600', color: '#222' },
  switchSub: { fontSize: 11, color: '#888', marginTop: 2 },
  createBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 16,
  },
  createBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
