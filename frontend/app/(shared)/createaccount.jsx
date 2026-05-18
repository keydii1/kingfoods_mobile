import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, TextInput, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '../../constants/colors';
import {createUser} from '../../constants/services/api';


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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [zone, setZone] = useState('');
  const [canManageTeam, setCanManageTeam] = useState(false);

  const handleCreate = async() => {
    if (!name || !username || !password || !role || !zone) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    Alert.alert(
      'Xác nhận',
      `Tạo tài khoản cho ${name} (${role}) tại ${zone}?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Tạo tài khoản',
          onPress: async () => {
            setSubmitting(true);
            try{
              await createUser({
                fullName: name,
                username,
                password,
                role,
                zone,
                canManageTeam,
              });
              Alert.alert('Thành công', `Tài khoản "${username}" đã được tạo. Nhân viên có thể đăng nhập ngay.`);
              setName('');
              setUsername('');
              setPassword('');
              setRole('');
              setZone('');
              setCanManageTeam(false);
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
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo tài khoản</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Thông tin nhân viên</Text>

          <TextInput
            style={styles.input}
            placeholder="Họ và tên"
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Tên đăng nhập"
            placeholderTextColor="#aaa"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Vai trò</Text>
          <View style={styles.optionRow}>
            {roles.map(r => (
              <TouchableOpacity
                key={r.key}
                style={[styles.optionBtn, role === r.key && styles.optionBtnActive]}
                onPress={() => setRole(r.key)}
              >
                <Text style={[styles.optionBtnText, role === r.key && styles.optionBtnTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Khu vực</Text>
          <View style={styles.optionRow}>
            {zones.map(z => (
              <TouchableOpacity
                key={z}
                style={[styles.zoneBtn, zone === z && styles.zoneBtnActive]}
                onPress={() => setZone(z)}
              >
                <Text style={[styles.optionBtnText, zone === z && styles.optionBtnTextActive]}>
                  {z}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Permissions */}
          <Text style={styles.label}>Phân quyền</Text>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={styles.switchName}>Quản lý nhóm</Text>
              <Text style={styles.switchSub}>Có thể xem và quản lý nhân viên</Text>
            </View>
            <Switch
              value={canManageTeam}
              onValueChange={setCanManageTeam}
              trackColor={{ false: '#ddd', true: COLORS.accent }}
              thumbColor="#fff"
            />
          </View>
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
                <Text style={styles.createBtnText}>
                    {submitting ? 'Đang tạo...' : '✅ Tạo tài khoản'}
                </Text>
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
