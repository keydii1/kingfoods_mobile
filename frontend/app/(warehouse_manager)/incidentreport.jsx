import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, FlatList, Image } from 'react-native';
import { Alert } from '../../utils/appAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getIncidents, resolveIncident, reportIncident, getCachedData } from '../../constants/services/api';
import { COLORS } from '../../constants/colors';
import { playSound } from '../../utils/soundService';
import ManagerBottomNav from '../../components/ManagerBottomNav';
import StaffBottomNav from '../../components/StaffBottomNav';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

const cleanLocationName = (name) => {
    if (!name) return '';
    return name.replace(/^[🥦🥫🧴❄️\s]+/, '').replace(/^[^a-zA-Z0-9À-ỹđĐ\s]+/, '').trim();
};

const TRANSLATIONS = {
  vi: {
    headerTitle: 'Báo cáo sự cố',
    newIncident: 'Khai báo sự cố mới',
    incidentType: 'Loại sự cố *',
    summaryLabel: 'Tóm gọn sự cố *',
    summaryPlaceholder: 'Ví dụ: Thiếu 5 lon Coca-Cola ở kệ A12',
    locationLabel: 'Vị trí sự cố (Khu vực / Kệ hàng)',
    locationPlaceholder: 'Ví dụ: Khu A - Kệ 12.02.A',
    detailLabel: 'Nội dung chi tiết *',
    detailPlaceholder: 'Mô tả chi tiết tình trạng sự cố để quản lý nắm rõ thông tin...',
    proofPhoto: 'Ảnh minh chứng sự cố',
    deletePhoto: 'Xoá ảnh',
    takePhoto: 'Chụp ảnh',
    choosePhoto: 'Thư viện',
    submitBtn: 'Gửi báo cáo sự cố',
    emptyStateTitle: 'Hệ thống vận hành ổn định!',
    emptyStateAll: 'Không ghi nhận sự cố nào phát sinh. Kho hàng Kingfood hiện đang hoạt động vô cùng an toàn và ổn định.',
    emptyStatePending: 'Tuyệt vời! Không có sự cố tồn đọng nào cần xử lý lúc này.',
    emptyStateResolved: 'Chưa có sự cố nào được xử lý thành công.',
    resolvedBadge: 'Đã xử lý',
    pendingBadge: 'Chờ xử lý',
    reportedBy: 'Báo cáo bởi',
    resolveBtn: 'Xử lý xong',
    all: 'Tất cả',
    pending: 'Chờ xử lý',
    resolved: 'Đã xử lý',
    cameraPermissionErr: 'Cần quyền camera để chụp ảnh minh chứng',
    libraryPermissionErr: 'Cần quyền thư viện để chọn ảnh minh chứng',
    fillRequiredErr: 'Vui lòng chọn loại sự cố, nhập tóm gọn và mô tả chi tiết',
    successTitle: 'Thành công',
    reportSuccess: 'Báo cáo sự cố đã được gửi và lưu trữ thành công!',
    resolveSuccess: 'Sự cố đã được xử lý thành công!',
    errorTitle: 'Lỗi',
    resolveFailed: 'Không thể xử lý sự cố',
    unassignedZone: 'Chưa phân khu',
    defaultReporter: 'Nhân viên kho',
    missingLabel: 'Thiếu hàng',
    damageLabel: 'Hỏng hóc',
    equipmentLabel: 'Thiết bị',
    safetyLabel: 'An toàn',
    otherLabel: 'Khác',
  },
  en: {
    headerTitle: 'Incident Report',
    newIncident: 'Report New Incident',
    incidentType: 'Incident Type *',
    summaryLabel: 'Incident Summary *',
    summaryPlaceholder: 'e.g. Missing 5 cans of Coca-Cola on Shelf A12',
    locationLabel: 'Incident Location (Zone / Shelf)',
    locationPlaceholder: 'e.g. Zone A - Shelf 12.02.A',
    detailLabel: 'Detailed Description *',
    detailPlaceholder: 'Describe the details of the incident so managers can understand...',
    proofPhoto: 'Proof Photo of Incident',
    deletePhoto: 'Delete Photo',
    takePhoto: 'Take Photo',
    choosePhoto: 'Gallery',
    submitBtn: 'Submit Incident Report',
    emptyStateTitle: 'System Operating Smoothly!',
    emptyStateAll: 'No incidents recorded. Kingfood warehouse is operating safely and stably.',
    emptyStatePending: 'Wonderful! No pending incidents to resolve at this time.',
    emptyStateResolved: 'No incidents successfully resolved yet.',
    resolvedBadge: 'Resolved',
    pendingBadge: 'Pending',
    reportedBy: 'Reported by',
    resolveBtn: 'Mark Resolved',
    all: 'All',
    pending: 'Pending',
    resolved: 'Resolved',
    cameraPermissionErr: 'Camera permission required to take proof photo',
    libraryPermissionErr: 'Gallery permission required to select proof photo',
    fillRequiredErr: 'Please select incident type, enter summary and description',
    successTitle: 'Success',
    reportSuccess: 'Incident report has been submitted and stored successfully!',
    resolveSuccess: 'Incident has been resolved successfully!',
    errorTitle: 'Error',
    resolveFailed: 'Could not resolve incident',
    unassignedZone: 'Unassigned Zone',
    defaultReporter: 'Warehouse Staff',
    missingLabel: 'Missing Items',
    damageLabel: 'Damaged Goods',
    equipmentLabel: 'Equipment Issues',
    safetyLabel: 'Safety Issues',
    otherLabel: 'Other Issues',
  }
};

const getIssueTypes = (lang) => [
  { key: 'missing', label: lang === 'vi' ? 'Thiếu hàng' : 'Missing Items', icon: 'cube-outline', color: '#ffb74d' },
  { key: 'damage', label: lang === 'vi' ? 'Hỏng hóc' : 'Damaged Goods', icon: 'construct-outline', color: '#e57373' },
  { key: 'equipment', label: lang === 'vi' ? 'Thiết bị' : 'Equipment Issues', icon: 'settings-outline', color: '#64b5f6' },
  { key: 'safety', label: lang === 'vi' ? 'An toàn' : 'Safety Issues', icon: 'shield-half-outline', color: '#81c784' },
  { key: 'other', label: lang === 'vi' ? 'Khác' : 'Other Issues', icon: 'document-text-outline', color: '#90a4ae' },
];

const getFilters = (lang) => [
  { key: 'all', label: lang === 'vi' ? 'Tất cả' : 'All' },
  { key: 'pending', label: lang === 'vi' ? 'Chờ xử lý' : 'Pending' },
  { key: 'resolved', label: lang === 'vi' ? 'Đã xử lý' : 'Resolved' },
];


const incidentImages = {
  missing: require('../../assets/images/incident_missing.png'),
  damage: require('../../assets/images/incident_damage.png'),
  equipment: require('../../assets/images/incident_equipment.png'),
};

export default function IncidentReportScreen() {
  const { userRole } = useAuth();
  const { darkMode, language } = useAppPreferences();

  const activeBg = darkMode ? '#121212' : '#f0f4f1';
  const activeHeaderBg = darkMode ? '#1e1e1e' : '#fff';
  const activeBorderColor = darkMode ? '#2d2d2d' : '#eee';
  const activeTextColor = darkMode ? '#f3f4f6' : '#222';
  const activeCardBg = darkMode ? '#1e1e1e' : '#fff';
  const activeTextGrayColor = darkMode ? '#9ca3af' : '#666';
  const activeInputBg = darkMode ? '#2d2d2d' : '#f8f9fa';

  const t = TRANSLATIONS[language];
  const issueTypes = getIssueTypes(language);
  const filters = getFilters(language);

  const [photoUri, setPhotoUri] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  const [summary, setSummary] = useState('');
  const [detail, setDetail] = useState('');
  const [location, setLocation] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  const cachedIncidents = getCachedData('/admin/picking/incidents');
  const initialReports = Array.isArray(cachedIncidents) ? cachedIncidents.map(r => {
    const typeObj = issueTypes.find(t => t.key === r.reason?.split(':')[0]?.trim()?.toLowerCase()) || 
                    issueTypes.find(t => t.label === r.reason) || 
                    { label: r.reason || t.otherLabel, icon: 'alert-circle-outline', color: '#666' };
    
    return {
      id: r.id || r._id,
      type: typeObj.label,
      typeKey: typeObj.key || 'other',
      icon: typeObj.icon,
      iconColor: typeObj.color,
      detail: r.reason?.includes(':') ? r.reason.substring(r.reason.indexOf(':') + 1).trim() : (r.reason || 'Sự cố phát sinh'),
      by: r.reporter?.name || r.reporter?.fullName || r.reporter?.username || t.defaultReporter,
      time: r.createdAt ? new Date(r.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '',
      status: r.status === 'resolved' ? 'resolved' : 'pending',
      photoUrl: r.photoUrl || '',
    };
  }) : [];

  const [reports, setReports] = useState(initialReports);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loadingReports, setLoadingReports] = useState(!cachedIncidents);
  const [submitting, setSubmitting] = useState(false);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t.errorTitle, t.cameraPermissionErr);
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
      Alert.alert(t.errorTitle, t.libraryPermissionErr);
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
                        { label: r.reason || t.otherLabel, icon: 'alert-circle-outline', color: '#666' };
        
        return {
          id: r.id || r._id,
          type: typeObj.label,
          typeKey: typeObj.key || 'other',
          icon: typeObj.icon,
          iconColor: typeObj.color,
          detail: r.reason?.includes(':') ? r.reason.substring(r.reason.indexOf(':') + 1).trim() : (r.reason || 'Sự cố phát sinh'),
          by: r.reporter?.name || r.reporter?.fullName || r.reporter?.username || t.defaultReporter,
          time: r.createdAt ? new Date(r.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '',
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
    if (!selectedType || !summary || !detail) {
      Alert.alert(t.errorTitle, t.fillRequiredErr);
      return;
    }
    setSubmitting(true);
    try {
      const typeLabel = issueTypes.find(t => t.key === selectedType)?.label || selectedType;
      // Default to taskId: 1 to ensure it maps to database schema constraints
      // Embed [summary] into the reason string so admin can easily read the brief
      const reasonText = `${selectedType.toUpperCase()}: [${summary}] ${detail} ${location ? `(Tại vị trí: ${location})` : ''}`;
      await reportIncident(1, reasonText, photoBase64 || '');
      
      playSound('success'); // Play premium success beep
      Alert.alert(t.successTitle, t.reportSuccess);
      
      setSelectedType('');
      setSummary('');
      setDetail('');
      setLocation('');
      setPhotoUri(null);
      setPhotoBase64(null);
      setShowForm(false);
      setActiveFilter('pending');
      
      // Refresh real list
      fetchReports();
    } catch (err) {
      Alert.alert(t.errorTitle, err.message || 'Không gửi được báo cáo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await resolveIncident(id);
      playSound('success');
      Alert.alert(t.successTitle, t.resolveSuccess);
      setReports(prev => prev.map(r =>
        r.id === id ? { ...r, status: 'resolved' } : r
      ));
    } catch (err) {
      Alert.alert(t.errorTitle, err.message || t.resolveFailed);
    }
  };

  const filteredReports = activeFilter === 'all'
    ? reports
    : reports.filter(r => r.status === activeFilter);

  if (loadingReports) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: activeBg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: activeHeaderBg, borderBottomColor: activeBorderColor }]}>
        <View style={{ width: 32 }} />
        <Text style={[styles.headerTitle, { color: activeTextColor }]}>{t.headerTitle}</Text>
        <TouchableOpacity 
          style={[styles.addBtnContainer, { backgroundColor: darkMode ? '#2d2d2d' : '#e8f5e9' }]} 
          onPress={() => {
            setShowForm(!showForm);
            // Reset form states on toggle
            if (!showForm) {
              setSelectedType('missing');
              setSummary('');
              setDetail('');
              setLocation('');
              setPhotoUri(null);
              setPhotoBase64(null);
            }
          }}
          activeOpacity={0.7}
        >
          <Ionicons name={showForm ? "close-outline" : "add-outline"} size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs - Hide when showForm is true */}
      {!showForm && (
        <View style={[styles.filterRow, { backgroundColor: activeHeaderBg, borderBottomColor: activeBorderColor }]}>
          {filters.map(f => {
            const count = f.key === 'all' 
              ? reports.length 
              : reports.filter(r => r.status === f.key).length;
            const isActive = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filterBtn, 
                  { backgroundColor: darkMode ? '#2d2d2d' : '#f5f5f5', borderColor: darkMode ? '#3d3d3d' : '#e0e0e0' },
                  isActive && styles.filterBtnActive
                ]}
                onPress={() => setActiveFilter(f.key)}
              >
                <Text style={[styles.filterText, { color: darkMode ? '#9ca3af' : '#666' }, isActive && styles.filterTextActive]}>
                  {f.label} {count > 0 ? `(${count})` : '(0)'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {showForm ? (
        // Premium Reporting Form using pre-defined styles
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <View style={[styles.formCard, { backgroundColor: activeCardBg }]}>
            <Text style={[styles.formTitle, { color: activeTextColor, marginBottom: 16 }]}>{t.newIncident}</Text>
            
            {/* Loại sự cố */}
            <Text style={[styles.formLabel, { color: activeTextGrayColor }]}>{t.incidentType}</Text>
            <View style={styles.typeGrid}>
              {issueTypes.map(type => {
                const isSelected = selectedType === type.key;
                return (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeBtn, 
                      { backgroundColor: darkMode ? '#2d2d2d' : '#f5f5f5', borderColor: darkMode ? '#3d3d3d' : '#e0e0e0' },
                      isSelected && styles.typeBtnActive
                    ]}
                    onPress={() => setSelectedType(type.key)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={type.icon} size={16} color={isSelected ? '#fff' : type.color} />
                    <Text style={[
                      styles.typeLabel, 
                      { color: darkMode ? '#cbd5e1' : '#555' }, 
                      isSelected && styles.typeLabelActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tóm gọn sự cố */}
            <Text style={[styles.formLabel, { color: activeTextGrayColor }]}>{t.summaryLabel}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: activeInputBg, color: activeTextColor, borderColor: activeBorderColor }]}
              placeholder={t.summaryPlaceholder}
              placeholderTextColor={darkMode ? '#64748b' : '#888'}
              value={summary}
              onChangeText={setSummary}
              autoCapitalize="sentences"
            />

            {/* Vị trí */}
            <Text style={[styles.formLabel, { color: activeTextGrayColor }]}>{t.locationLabel}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: activeInputBg, color: activeTextColor, borderColor: activeBorderColor }]}
              placeholder={t.locationPlaceholder}
              placeholderTextColor={darkMode ? '#64748b' : '#888'}
              value={location}
              onChangeText={setLocation}
              autoCapitalize="characters"
            />

            {/* Chi tiết sự cố */}
            <Text style={[styles.formLabel, { color: activeTextGrayColor }]}>{t.detailLabel}</Text>
            <TextInput
              style={[styles.input, styles.detailInput, { backgroundColor: activeInputBg, color: activeTextColor, borderColor: activeBorderColor }]}
              placeholder={t.detailPlaceholder}
              placeholderTextColor={darkMode ? '#64748b' : '#888'}
              value={detail}
              onChangeText={setDetail}
              multiline
              numberOfLines={4}
            />

            {/* Ảnh minh chứng */}
            <Text style={[styles.formLabel, { color: activeTextGrayColor }]}>{t.proofPhoto}</Text>
            {photoUri ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                <TouchableOpacity 
                  style={styles.removePhotoBtn} 
                  onPress={() => {
                    setPhotoUri(null);
                    setPhotoBase64(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{t.deletePhoto}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoRow}>
                <TouchableOpacity style={[styles.photoSelectBtn, { backgroundColor: activeCardBg, borderColor: activeBorderColor }]} onPress={handleTakePhoto} activeOpacity={0.7}>
                  <Ionicons name="camera-outline" size={18} color={COLORS.primary} />
                  <Text style={[styles.photoSelectText, { color: activeTextColor }]}>{t.takePhoto}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.photoSelectBtn, { backgroundColor: activeCardBg, borderColor: activeBorderColor }]} onPress={handleChoosePhoto} activeOpacity={0.7}>
                  <Ionicons name="images-outline" size={18} color={COLORS.primary} />
                  <Text style={[styles.photoSelectText, { color: activeTextColor }]}>{t.choosePhoto}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Nút gửi */}
            <TouchableOpacity 
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
              onPress={submitReport}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>{t.submitBtn}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        // Danh sách sự cố hiện tại
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>


        {filteredReports.length > 0 ? (
          filteredReports.map(r => {
            const isResolved = r.status === 'resolved';
            return (
              <View 
                key={r.id} 
                style={[
                  styles.reportCard, 
                  { backgroundColor: activeCardBg, borderLeftColor: isResolved ? '#66bb6a' : '#ffa726' },
                  darkMode && { shadowColor: '#000', elevation: 1 }
                ]}
              >
                <View style={styles.reportHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.iconContainer, { backgroundColor: isResolved ? '#e8f5e9' : '#fff3e0' }]}>
                      <Ionicons name={r.icon} size={18} color={r.iconColor} />
                    </View>
                    <Text style={[styles.reportType, { color: activeTextColor }]}>{r.type}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge, 
                    isResolved ? { backgroundColor: '#e8f5e9' } : { backgroundColor: '#fff3e0' }
                  ]}>
                    <Text style={[
                      styles.statusBadgeText, 
                      isResolved ? { color: '#2e7d32' } : { color: '#e65100' }
                    ]}>
                      {isResolved ? t.resolvedBadge : t.pendingBadge}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.reportDetail, { color: darkMode ? '#cbd5e1' : '#444' }]}>{r.detail}</Text>
                
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
                    <Text style={[styles.reportBy, { color: activeTextGrayColor }]}>{t.reportedBy}: {r.by}</Text>
                    <Text style={[styles.reportTime, { color: darkMode ? '#64748b' : '#aaa' }]}>{r.time}</Text>
                  </View>

                  {(userRole === 'admin' || userRole === 'warehouse_manager') && !isResolved && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleResolve(r.id)}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>{t.resolveBtn}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          /* Premium and Welcoming Empty State */
          <View style={[styles.emptyContainer, { backgroundColor: activeCardBg }]}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="shield-checkmark" size={60} color={COLORS.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: activeTextColor }]}>{t.emptyStateTitle}</Text>
            <Text style={[styles.emptySub, { color: activeTextGrayColor }]}>
              {activeFilter === 'all' 
                ? t.emptyStateAll 
                : activeFilter === 'pending'
                  ? t.emptyStatePending
                  : t.emptyStateResolved
              }
            </Text>

          </View>
        )}
      </ScrollView>
      )}
      
      {/* Dynamic Role-Based Bottom Navigation */}
      {userRole === 'admin' || userRole === 'warehouse_manager' ? (
        <ManagerBottomNav active="incident" />
      ) : (
        <StaffBottomNav active="incident" />
      )}
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
