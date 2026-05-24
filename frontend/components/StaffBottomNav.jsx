import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

const tabs = [
  { key: 'dashboard', icon: 'home', iconOutline: 'home-outline', label: 'Trang chủ', route: '/dashboard' },
  { key: 'search', icon: 'cube', iconOutline: 'cube-outline', label: 'Soạn hàng', route: '/ordersearch' },
  { key: 'incident', icon: 'alert-circle', iconOutline: 'alert-circle-outline', label: 'Sự cố', route: '/incidentreport' },
  { key: 'profile', icon: 'person-circle', iconOutline: 'person-circle-outline', label: 'Tài khoản', route: '/profile' },
];

export default function StaffBottomNav({ active }) {
  const pathname = usePathname();
  const { darkMode } = useAppPreferences();

  const activeNavBg = darkMode ? '#1e1e1e' : '#fff';
  const activeBorderColor = darkMode ? '#2d2d2d' : '#f1f5f9';
  const inactiveTextColor = darkMode ? '#9ca3af' : '#94a3b8';

  return (
    <View style={[styles.bottomNav, { backgroundColor: activeNavBg, borderTopColor: activeBorderColor }]}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.route || active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.navItem}
            disabled={isActive}
            onPress={() => router.navigate(tab.route)}
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
    borderTopColor: '#f1f5f9',
    paddingVertical: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 4,
  },
  navItem: { alignItems: 'center', flex: 1 },
  navLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
  navActive: { color: COLORS.primary, fontWeight: '800' },
});
