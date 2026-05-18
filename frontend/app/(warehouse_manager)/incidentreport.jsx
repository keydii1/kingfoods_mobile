import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {getIncidents, resolveIncidents, reportIncident} from '../../constants/services/api';
import { COLORS } from '../../constants/colors';

const issueTypes = [
  { key: 'damage', label: 'Hàng hư hỏng', icon: 'close-circle-outline' },
  { key: 'missing', label: 'Thiếu hàng', icon: 'help-circle-outline' },
  { key: 'wrong', label: 'Sai sản phẩm', icon: 'alert-circle-outline' },
  { key: 'equipment', label: 'Hỏng thiết bị', icon: 'construct-outline' },
  { key: 'safety', label: 'An toàn', icon: 'notifications-outline' },
  { key: 'other', label: 'Khác', icon: 'document-text-outline' },
];

export default function IncidentReportScreen() {
  const [selectedType, setSelectedType] = useState('');
  const [detail, setDetail] = useState('');
  const [location, setLocation] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() =>{
    async function fetchReports(){
      try{
        const res = await getIncidents();
        console.log('Incidents fetched:', JSON.stringify(res, null, 2));
        const incidents = Array.isArray(res) ? res : (res?.data || []);
        setReports(incidents.map(r => ({
            id: r.id || r._id,
            type: r.type || r.reason || 'Khác',
            detail: r.detail || r.reason || '',
            by: r.reportedBy || 'Nhân viên',
            time: r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '',
            status: r.status === 'resolved' ? 'Đã xử lí' : 'Chờ xử lý',
        })));
      }
      catch(err){
        console.log('Fetch incidents error:', err.message);
        setReports([]);
      }
      finally{
        setLoadingReports(false);
      }
    }
    fetchReports();
  }, [])

  const submitReport =  async() => {
    if (!selectedType || !detail) {
      Alert.alert('Lỗi', 'Vui lòng chọn loại sự cố và nhập mô tả');
      return;
    }
    setSubmitting(true);
    try{
      await reportIncident('', selectedType, detail);
      Alert.alert('Thành công', 'Báo cáo sự cố đã được gửi');
      setSelectedType(''), setDetail(''), setLocation(''), setShowForm(false);
    }
    catch(err){
      Alert.alert('Lỗi', err.message || 'Không gửi được báo cáo');
    }
    finally{
      setSubmitting(false)
    }
  };

  const handleResolve = async(id) =>{
    try{
      await resolveIncidents(id);
      setReports(prev => prev.map(r =>  
        r.id === id ? {...r, status: 'Đã xử lí'} : r
      ));
    }
    catch(err){
      Alert.alert('Lỗi!', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Báo cáo sự cố</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? "close" : "add"} size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        {showForm && (
          <View style={styles.formCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="create-outline" size={20} color="#222" style={{ marginRight: 6 }} />
              <Text style={styles.formTitle}>Báo cáo mới</Text>
            </View>
            <Text style={styles.formLabel}>Loại sự cố:</Text>
            <View style={styles.typeGrid}>
              {issueTypes.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeBtn, selectedType === t.key && styles.typeBtnActive]}
                  onPress={() => setSelectedType(t.key)}
                >
                  <Ionicons name={t.icon} size={16} color={selectedType === t.key ? COLORS.primary : '#666'} />
                  <Text style={[styles.typeLabel, selectedType === t.key && styles.typeLabelActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Vị trí (VD: Kệ 14.07.B)"
              placeholderTextColor="#aaa"
              value={location}
              onChangeText={setLocation}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={[styles.input, styles.detailInput]}
              placeholder="Mô tả chi tiết sự cố..."
              placeholderTextColor="#aaa"
              value={detail}
              onChangeText={setDetail}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
                    style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                    onPress={submitReport}
                    disabled={submitting}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="send-outline" size={18} color="#fff" />
                      <Text style={styles.submitBtnText}>
                          {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                      </Text>
                    </View>
                </TouchableOpacity>
          </View>
        )}

        {loadingReports ? (
          <ActivityIndicator color = {COLORS.primary} />
        ): (
          reports.map(r => (
            <View key = {r.id} style = {styles.reportCard}>
              <View style = {styles.reportHeader}>
                <Text style = {styles.reportType}>{r.type}</Text>
                <Text style = {styles.reportTime}>{r.time}</Text>
              </View>
              <Text style = {styles.reportDetail}>{r.detail}</Text>
              <View style = {styles.reportFooter}>
                <Text style = {styles.reportBy}>Bởi: {r.by}</Text>
                <View style = {styles.reportStatusRow}>
                  <Text style = {styles.reportStatus}>{r.status}</Text>
                  {r.status !== 'Đã xử lý' && (
                    <TouchableOpacity onPress = {() => handleResolve(r.id)}>
                      <Text style = {styles.resolveBtn}>Đánh dấu xử lí</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
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
  addBtn: { fontSize: 24, fontWeight: '700', color: COLORS.primary },
  scroll: { flex: 1, padding: 16 },
  formCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1.5, borderColor: COLORS.accent,
  },
  formTitle: { fontSize: 15, fontWeight: '700', color: '#222' },
  formLabel: { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 8 },
  typeGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12,
  },
  typeBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    backgroundColor: '#f5f5f5', flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  typeBtnActive: { backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: COLORS.accent },
  typeIcon: { fontSize: 16 },
  typeLabel: { fontSize: 12, fontWeight: '600', color: '#666' },
  typeLabelActive: { color: COLORS.primary },
  input: {
    backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14, fontSize: 14,
    marginBottom: 10,
  },
  detailInput: { height: 100, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#222', marginBottom: 10 },
  reportCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
  },
  reportHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  reportType: { fontSize: 13, fontWeight: '700', color: '#222' },
  reportStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  reportStatusText: { fontSize: 11, fontWeight: '600' },
  reportDetail: { fontSize: 12, color: '#666', lineHeight: 18, marginBottom: 6 },
  reportMeta: { fontSize: 11, color: '#aaa' },
  reportHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  reportTime: { fontSize: 11, color: '#aaa' },
  reportFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6,
  },
  reportBy: { fontSize: 11, color: '#888' },
  reportStatusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  resolveBtn: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
});
