import {Text, View, StyleSheet, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {COLORS} from '../../constants/colors';
import StaffBottomNav from '../../components/StaffBottomNav';


// mockdata 1 sản phẩm thay vì nhiều
const wrongItem ={
    scannedSKU: 'KF-00789',
    scannedName:'Mì Hảo Hảo',
    expectedSKU:'KF-00456',
    expectedName:'Nước tương chin-su 500ml'
}

export default function PickingErrorScreen(){
    return (
        <SafeAreaView style = {styles.safeArea}>
            <View style = {styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backBtn}>‹</Text>
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>
                        Picking Error
                    </Text>

                    <View style={styles.headerRight} />
                </View>
                {/* Hình tròn màu đỏ */}
                <View style = {styles.errorWrapper}>
                    <View style = {styles.errorOuter}>
                        <View style = {styles.errorInner}>
                            <Text style = {styles.errorX}>X</Text>
                        </View>
                    </View>
                </View>
                {/* Title: Sai sản phẩm */}
                <Text style = {styles.title}>Sai sản phẩm</Text>
                {/* Mô tả */}
                <Text style = {styles.description}>Mã bạn vừa quét không khớp với sản phẩm cần lấy</Text>
                {/* Cảnh báo */}
                <Text style ={styles.warning}>Tuyệt đối không được bỏ vào thùng, hãy kiểm tra lại hàng</Text>
                {/* Info card */}
                <View style = {styles.infoCard}>
                    <Text style = {styles.infoLabel}>
                        Bạn vừa quét: 
                    </Text>
                    <Text style = {styles.scannedText}>{wrongItem.scannedSKU}:({wrongItem.scannedName})</Text>
                    <Text style = {styles.expectedText}>Bạn cần lấy:{''}
                    <Text style = {styles.expectedHighlight}>{wrongItem.expectedSKU} • {wrongItem.expectedName}</Text> </Text>
                </View>
                {/* retry button */}
                <TouchableOpacity 
                style = {styles.retryBtn}
                onPress ={() => router.back()}>
                <Text style = {styles.retryBtnText}>Quét lại lần nữa</Text>
                </TouchableOpacity>
                {/* Report button */}
                <TouchableOpacity 
                style = {styles.reportBtn}
                onPress = {() => router.replace('/reportissue')}>
                <Text style = {styles.reportBtnText}>Báo cáo sự cố</Text>
                </TouchableOpacity>
            </View>
        <StaffBottomNav />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#220000',
  },
  header: {
    position: 'absolute',
    top: 12,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
 },

 backBtn: {
    fontSize: 34,
    color: '#fff',
    fontWeight: '300',
 },

 headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
 },

 headerRight: {
    width: 24,
 },

  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },

  // Error Circle
  errorWrapper: {
    alignItems: 'center',
    marginBottom: 28,
  },

  errorOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorInner: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#ff1744',
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorX: {
    fontSize: 54,
    color: '#111',
    fontWeight: '300',
  },

  // Text
  title: {
    textAlign: 'center',
    color: '#ff5252',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 18,
  },

  description: {
    textAlign: 'center',
    color: '#f5f5f5',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 6,
  },

  warning: {
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    marginBottom: 28,
  },

  // Info Card
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },

  infoLabel: {
    textAlign: 'center',
    color: '#9e9e9e',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
  },

  scannedText: {
    textAlign: 'center',
    color: '#ff5252',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 14,
  },

  expectedText: {
    textAlign: 'center',
    color: '#e0e0e0',
    fontSize: 14,
  },

  expectedHighlight: {
    color: '#00e676',
    fontWeight: '800',
  },

  // Buttons
  retryBtn: {
    backgroundColor: '#d61f26',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 18,
  },

  retryBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },

  reportBtn: {
    backgroundColor: '#607d8b',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },

  reportBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

});