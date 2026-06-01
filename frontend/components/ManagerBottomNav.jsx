import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

const getTabs = (lang) => [
  { key: 'dashboard', icon: 'stats-chart', iconOutline: 'stats-chart-outline', label: lang === 'vi' ? 'Dashboard' : 'Dashboard', route: '/managerdashboard' },
  { key: 'team', icon: 'people', iconOutline: 'people-outline', label: lang === 'vi' ? 'Nhân viên' : 'Staff', route: '/team' },
  { key: 'storelist', icon: 'business', iconOutline: 'business-outline', label: lang === 'vi' ? 'Cửa hàng' : 'Stores', route: '/storelist' },
  { key: 'incident', icon: 'warning', iconOutline: 'warning-outline', label: lang === 'vi' ? 'Sự cố' : 'Incidents', route: '/incidentreport' },
  { key: 'setting', icon: 'settings', iconOutline: 'settings-outline', label: lang === 'vi' ? 'Cài đặt' : 'Settings', route: '/setting' },
];

export default function ManagerBottomNav({ active }) {
  const pathname = usePathname();
  const { darkMode, language } = useAppPreferences();

  const activeNavBg = darkMode ? '#1e1e1e' : '#fff';
  const activeBorderColor = darkMode ? '#2d2d2d' : '#eee';
  const inactiveTextColor = darkMode ? '#9ca3af' : '#888';
  const tabs = getTabs(language);


  return (
    <View style={[styles.bottomNav, { backgroundColor: activeNavBg, borderTopColor: activeBorderColor }]}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.route || active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.navItem}
            disabled={isActive}
            onPress={() => router.replace(tab.route)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isActive ? tab.icon : tab.iconOutline}
              size={22}
              color={isActive ? COLORS.primary : inactiveTextColor}
              style={{ marginBottom: 2 }}
            />
            <Text style={[styles.navLabel, { color: inactiveTextColor }, isActive && styles.navActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 4,
  },
  navItem: { alignItems: 'center', flex: 1 },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '600' },
  navActive: { color: COLORS.primary, fontWeight: '800' },
});
