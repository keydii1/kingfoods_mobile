import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const tabs = [
  { key: 'dashboard', icon: 'home', iconOutline: 'home-outline', label: 'Trang chủ', route: '/dashboard' },
  { key: 'team', icon: 'people', iconOutline: 'people-outline', label: 'Nhóm', route: '/team' },
  { key: 'search', icon: 'search', iconOutline: 'search-outline', label: 'Tìm kiếm', route: '/ordersearch' },
  { key: 'setting', icon: 'construct', iconOutline: 'construct-outline', label: 'Tiện ích', route: '/setting' },
  { key: 'profile', icon: 'person-circle', iconOutline: 'person-circle-outline', label: 'Tài khoản', route: '/profile' },
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
            onPress={() => router.navigate(tab.route)}
          >
            <Ionicons
              name={isActive ? tab.icon : tab.iconOutline}
              size={22}
              color={isActive ? COLORS.primary : '#999'}
              style={{ marginBottom: 2 }}
            />
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
  navLabel: { fontSize: 11, color: '#999', fontWeight: '500' },
  navActive: { color: COLORS.primary, fontWeight: '700' },
});
