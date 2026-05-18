import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';
import { COLORS } from '../constants/colors';

const tabs = [
  { key: 'dashboard', icon: '🏠', label: 'Trang chủ', route: '/dashboard' },
  { key: 'team', icon: '👥', label: 'Nhóm', route: '/team' },
  { key: 'search', icon: '🔍', label: 'Tìm kiếm', route: '/ordersearch' },
  { key: 'setting', icon: '🔧', label: 'Tiện ích', route: '/setting' },
  { key: 'profile', icon: '👤', label: 'Tài khoản', route: '/profile' },
];

export default function StaffBottomNav({ active }) {
  const pathname = usePathname();

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.route || active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.navItem}
            disabled={isActive}
            onPress={() => router.push(tab.route)}
          >
            <Text style={[styles.navIcon, isActive && styles.navIconActive]}>{tab.icon}</Text>
            <Text style={[styles.navLabel, isActive && styles.navActive]}>
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
  },
  navItem: { alignItems: 'center' },
  navIcon: { fontSize: 20, marginBottom: 4 },
  navIconActive: { opacity: 0.5 },
  navLabel: { fontSize: 12, color: '#666' },
  navActive: { color: COLORS.primary, fontWeight: '700' },
});
