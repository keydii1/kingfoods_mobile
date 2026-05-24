import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, FlatList, Image } from 'react-native';
import { Alert } from '../../utils/appAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getIncidents, resolveIncident, reportIncident } from '../../constants/services/api';
import { COLORS } from '../../constants/colors';
import { playSound } from '../../utils/soundService';
import StaffBottomNav from '../../components/StaffBottomNav';
import { useAuth } from '../../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

const issueTypes = [
  { key: 'damage', label: 'Hàng hư hỏng', icon: 'nutrition-outline', color: '#e57373' },
  { key: 'missing', label: 'Thiếu hàng', icon: 'help-circle-outline', color: '#ffb74d' },
  { key: 'wrong', label: 'Sai sản phẩm', icon: 'alert-circle-outline', color: '#f06292' },
  { key: 'equipment', label: 'Hỏng thiết bị', icon: 'construct-outline', color: '#4db6ac' },
  { key: 'safety', label: 'An toàn', icon: 'shield-half-outline', color: '#81c784' },
  { key: 'other', label: 'Khác', icon: 'document-text-outline', color: '#90a4ae' },
];

const filters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xử lý' },
  { key: 'resolved', label: 'Đã xử lý' },
];

const incidentImages = {
  missing: require('../../assets/images/incident_missing.png'),
  damage: require('../../assets/images/incident_damage.png'),
  equipment: require('../../assets/images/incident_equipment.png'),
};

export default function IncidentReportScreen() {
  const { userRole } = useAuth();
  const [photoUri, setPhotoUri] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  const [detail, setDetail] = useState('');
  const [location, setLocation] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [reports, setReports] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loadingReports, setLoadingReports] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lỗi', 'Cần quyền camera để chụp ảnh minh chứng');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.7,
    });
    if (!result.canceled) {
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        setPhotoUri(manipResult.uri);
        setPhotoBase64('data:image/jpeg;base64,' + manipResult.base64);
      } catch (err) {
        setPhotoUri(result.assets[0].uri);
        setPhotoBase64(null);
      }
    }
  };

  const handleChoosePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lỗi', 'Cần quyền thư viện để chọn ảnh minh chứng');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.7,
    });
    if (!result.canceled) {
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        setPhotoUri(manipResult.uri);
        setPhotoBase64('data:image/jpeg;base64,' + manipResult.base64);
      } catch (err) {
        setPhotoUri(result.assets[0].uri);
        setPhotoBase64(null);
      }
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const res = await getIncidents();
      const incidents = Array.isArray(res) ? res : (res?.data || []);
      setReports(incidents.map(r => {
        // Map types back to user-friendly label or fallback
        const typeObj = issueTypes.find(t => t.key === r.reason?.split(':')[0]?.trim()?.toLowerCase()) || 
                        issueTypes.find(t => t.label === r.reason) || 
                        { label: r.reason || 'Khác', icon: 'alert-circle-outline', color: '#666' };
        
        return {
          id: r.id || r._id,
          type: typeObj.label,
          typeKey: typeObj.key || 'other',
          icon: typeObj.icon,
          iconColor: typeObj.color,
          detail: r.reason?.includes(':') ? r.reason.substring(r.reason.indexOf(':') + 1).trim() : (r.reason || 'Sự cố phát sinh'),
          by: r.reporter?.name || r.reporter?.fullName || r.reporter?.username || 'Nhân viên kho',
          time: r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '',
          status: r.status === 'resolved' ? 'resolved' : 'pending',
          photoUrl: r.photoUrl || '',
        };
      }));
    } catch (err) {
      console.log('Fetch incidents error:', err.message);
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  const submitReport = async () => {
    if (!selectedType || !detail) {
      Alert.alert('Lỗi', 'Vui lòng chọn loại sự cố và nhập mô tả');
      return;
    }
    setSubmitting(true);
    try {
      const typeLabel = issueTypes.find(t => t.key === selectedType)?.label || selectedType;
      // Default to taskId: 1 to ensure it maps to database schema constraints
      await reportIncident(1, `${selectedType.toUpperCase()}: ${detail} ${location ? `(Tại vị trí: ${location})` : ''}`, photoBase64 || '');
      
      playSound('success'); // Play premium success beep
      Alert.alert('Thành công', 'Báo cáo sự cố đã được gửi và lưu trữ thành công!');
      
      setSelectedType('');
      setDetail('');
      setLocation('');
      setPhotoUri(null);
      setPhotoBase64(null);
      setShowForm(false);
      setActiveFilter('pending');
      
      // Refresh real list
      fetchReports();
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không gửi được báo cáo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await resolveIncident(id);
      playSound('success');
      Alert.alert('Thành công', 'Sự cố đã được xử lý thành công!');
      setReports(prev => prev.map(r =>
        r.id === id ? { ...r, status: 'resolved' } : r
      ));
    } catch (err) {
      Alert.alert('Lỗi!', err.message || 'Không thể xử lý sự cố');
    }
  };

  const filteredReports = activeFilter === 'all'
    ? reports
    : reports.filter(r => r.status === activeFilter);

  if (loadingReports) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 32 }} />
        <Text style={styles.headerTitle}>Báo cáo sự cố</Text>
        <TouchableOpacity 
          style={[styles.addBtnContainer, showForm && styles.addBtnActive]} 
          onPress={() => setShowForm(!showForm)}
          activeOpacity={0.7}
        >
          <Ionicons name={showForm ? "close" : "add"} size={22} color={showForm ? "#fff" : COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      {!showForm && (
        <View style={styles.filterRow}>
          {filters.map(f => {
            const count = f.key === 'all' 
              ? reports.length 
              : reports.filter(r => r.status === f.key).length;
            const isActive = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterBtn, isActive && styles.filterBtnActive]}
                onPress={() => setActiveFilter(f.key)}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {f.label} {count > 0 ? `(${count})` : '(0)'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {showForm && (
          <View style={styles.formCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="create-outline" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.formTitle}>Báo cáo sự cố mới</Text>
            </View>

            <Text style={styles.formLabel}>Loại sự cố:</Text>
            <View style={styles.typeGrid}>
              {issueTypes.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeBtn, selectedType === t.key && styles.typeBtnActive]}
                  onPress={() => setSelectedType(t.key)}
                >
                  <Ionicons name={t.icon} size={16} color={selectedType === t.key ? '#fff' : '#666'} />
                  <Text style={[styles.typeLabel, selectedType === t.key && styles.typeLabelActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Vị trí kệ hàng (Tùy chọn):</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Khu A - Kệ 14.07.B"
              placeholderTextColor="#aaa"
              value={location}
              onChangeText={setLocation}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <Text style={styles.formLabel}>Mô tả chi tiết sự cố:</Text>
            <TextInput
              style={[styles.input, styles.detailInput]}
              placeholder="Vui lòng mô tả chi tiết sự cố (tên sản phẩm lỗi, số lượng hư hỏng, tình trạng kẹt xe nâng...)"
              placeholderTextColor="#aaa"
              value={detail}
              onChangeText={setDetail}
              multiline
              autoCapitalize="none"
              autoCorrect={true}
            />

            <Text style={styles.formLabel}>Hình ảnh minh chứng (Tùy chọn):</Text>
            {photoUri ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                <TouchableOpacity 
                  style={styles.removePhotoBtn} 
                  onPress={() => { setPhotoUri(null); setPhotoBase64(null); }}
                >
                  <Ionicons name="trash" size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 4 }}>Xóa ảnh</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoRow}>
                <TouchableOpacity style={styles.photoSelectBtn} onPress={handleTakePhoto} activeOpacity={0.7}>
                  <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.photoSelectText}>Chụp ảnh</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoSelectBtn} onPress={handleChoosePhoto} activeOpacity={0.7}>
                  <Ionicons name="images-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.photoSelectText}>Chọn từ thư viện</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={submitReport}
              disabled={submitting}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.submitBtnText}>
                  {submitting ? 'Đang gửi...' : 'Gửi báo cáo sự cố'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {filteredReports.length > 0 ? (
          filteredReports.map(r => {
            const isResolved = r.status === 'resolved';
            return (
              <View 
                key={r.id} 
                style={[
                  styles.reportCard, 
                  isResolved ? styles.reportCardResolved : styles.reportCardPending
                ]}
              >
                <View style={styles.reportHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.iconContainer, { backgroundColor: isResolved ? '#e8f5e9' : '#fff3e0' }]}>
                      <Ionicons name={r.icon} size={18} color={r.iconColor} />
                    </View>
                    <Text style={styles.reportType}>{r.type}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge, 
                    isResolved ? { backgroundColor: '#e8f5e9' } : { backgroundColor: '#fff3e0' }
                  ]}>
                    <Text style={[
                      styles.statusBadgeText, 
                      isResolved ? { color: '#2e7d32' } : { color: '#e65100' }
                    ]}>
                      {isResolved ? 'Đã xử lý' : 'Chờ xử lý'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.reportDetail}>{r.detail}</Text>
                
                {/* Beautiful dynamic Incident Photo */}
                {r.photoUrl ? (
                  <Image 
                    source={{ uri: r.photoUrl }} 
                    style={styles.reportImage} 
                    resizeMode="cover"
                  />
                ) : (
                  incidentImages[r.typeKey] && (
                    <Image 
                      source={incidentImages[r.typeKey]} 
                      style={styles.reportImage} 
                      resizeMode="cover"
                    />
                  )
                )}
                
                <View style={styles.reportFooter}>
                  <View style={{ gap: 2 }}>
                    <Text style={styles.reportBy}>Báo cáo bởi: {r.by}</Text>
                    <Text style={styles.reportTime}>{r.time}</Text>
                  </View>

                  {userRole === 'admin' && !isResolved && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleResolve(r.id)}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>Xử lý xong</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          /* Premium and Welcoming Empty State */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="shield-checkmark" size={60} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Hệ thống vận hành ổn định!</Text>
            <Text style={styles.emptySub}>
              {activeFilter === 'all' 
                ? 'Không ghi nhận sự cố nào phát sinh. Kho hàng Kingfood hiện đang hoạt động vô cùng an toàn và ổn định.' 
                : activeFilter === 'pending'
                  ? 'Tuyệt vời! Không có sự cố tồn đọng nào cần xử lý lúc này.'
                  : 'Chưa có sự cố nào được xử lý thành công.'
              }
            </Text>
            <TouchableOpacity 
              style={styles.emptyActionBtn}
              onPress={() => setShowForm(true)}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.emptyActionText}>Gửi báo cáo sự cố mới</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <StaffBottomNav active="incident" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f4f1' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#222' },
  addBtnContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnActive: {
    backgroundColor: '#f44336',
  },
  filterRow: {
    flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f5f5f5',
    borderWidth: 1, borderColor: '#e0e0e0',
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: { fontSize: 12, fontWeight: '600', color: '#666' },
  filterTextActive: { color: '#fff' },
  scroll: { flex: 1, padding: 16 },
  centerPadding: { paddingVertical: 40, alignItems: 'center' },
  
  // Form Styles
  formCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  formTitle: { fontSize: 15, fontWeight: '800', color: '#222' },
  formLabel: { fontSize: 12, fontWeight: '700', color: '#666', marginBottom: 8, marginTop: 4 },
  typeGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12,
  },
  typeBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    backgroundColor: '#f5f5f5', flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#e0e0e0',
  },
  typeBtnActive: { 
    backgroundColor: COLORS.primary, 
    borderColor: COLORS.primary,
  },
  typeLabel: { fontSize: 12, fontWeight: '600', color: '#555' },
  typeLabelActive: { color: '#fff' },
  input: {
    backgroundColor: '#f8f9fa', borderRadius: 12, padding: 14, fontSize: 14,
    marginBottom: 14, borderWidth: 1, borderColor: '#eee', color: '#222',
  },
  detailInput: { height: 100, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 3,
  },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  
  // Report Card Styles
  reportCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    borderLeftWidth: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  reportCardPending: {
    borderLeftColor: '#ffa726',
  },
  reportCardResolved: {
    borderLeftColor: '#66bb6a',
  },
  reportHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportType: { fontSize: 14, fontWeight: '700', color: '#222' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  reportDetail: { fontSize: 13, color: '#444', lineHeight: 20, marginBottom: 12 },
  reportImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#eee',
  },
  reportFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    borderTopWidth: 0.5, borderTopColor: '#f0f0f0', paddingTop: 10,
  },
  reportBy: { fontSize: 11, color: '#777', fontWeight: '500' },
  reportTime: { fontSize: 11, color: '#aaa', marginTop: 1 },
  actionBtn: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Empty State Styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
    marginTop: 20,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#222',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  emptyActionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  photoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoSelectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  photoSelectText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    width: '100%',
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 14,
  },
  removePhotoBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(211, 47, 47, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
});
