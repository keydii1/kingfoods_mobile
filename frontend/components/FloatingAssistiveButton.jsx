import React, { useRef, useState, useEffect, useCallback } from 'react';

import {
    Text,
    TouchableOpacity,
    Animated,
    PanResponder,
    StyleSheet,
} from 'react-native';

import { router, usePathname, useFocusEffect } from 'expo-router';

import { COLORS } from '../constants/colors';
import { getIncidents } from '../constants/services/api';

export default function FloatingAssistiveButton() {

    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnread = useCallback(async () => {
        try {
            const res = await getIncidents();
            const paginated = res?.data || res;
            const items = Array.isArray(paginated) ? paginated : (paginated?.data || []);
            const unread = items.filter(i => i.status !== 'resolved').length;
            setUnreadCount(unread);
        } catch { }
    }, []);

    useFocusEffect(useCallback(() => {
        fetchUnread();
    }, [fetchUnread]));

    // Lấy route hiện tại
    const pathname = usePathname();

    // Vị trí floating button
    const pan = useRef(
        new Animated.ValueXY({
            x: 300,
            y: 500,
        })
    ).current;

    // Gesture kéo thả
    const panResponder = useRef(

        PanResponder.create({

            onMoveShouldSetPanResponder: () => true,

            // Khi bắt đầu kéo
            onPanResponderGrant: () => {

                pan.setOffset({
                    x: pan.x._value,
                    y: pan.y._value,
                });

                pan.setValue({
                    x: 0,
                    y: 0,
                });
            },

            // Khi đang kéo
            onPanResponderMove: Animated.event(
                [
                    null,
                    {
                        dx: pan.x,
                        dy: pan.y,
                    },
                ],
                {
                    useNativeDriver: false,
                }
            ),

            // Khi thả tay
            onPanResponderRelease: () => {
                pan.flattenOffset();
            },

        })

    ).current;

    return (

        <Animated.View
            style={{
                position: 'absolute',
                zIndex: 999,

                transform: [
                    { translateX: pan.x },
                    { translateY: pan.y },
                ],
            }}

            {...panResponder.panHandlers}
        >

            <TouchableOpacity

                style={styles.floatingBtn}

                onPress={() => {

                    if (pathname !== '/notifications') {
                        setUnreadCount(0);
                        router.push('/notifications');
                    }

                }}
            >

                <Text style={styles.floatingIcon}>🔔</Text>

                {unreadCount > 0 && (
                    <Animated.View style={styles.floatingBadge}>
                        <Text style={styles.floatingBadgeText}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                    </Animated.View>
                )}

            </TouchableOpacity>

        </Animated.View>
    );
}

const styles = StyleSheet.create({

    floatingBtn: {

        width: 56,
        height: 56,

        borderRadius: 28,

        backgroundColor: COLORS.primary,

        alignItems: 'center',
        justifyContent: 'center',

        shadowColor: '#000',

        shadowOffset: {
            width: 0,
            height: 4,
        },

        shadowOpacity: 0.3,
        shadowRadius: 8,

        elevation: 8,
    },

    floatingIcon: {
        fontSize: 24,
    },

    floatingBadge: {

        position: 'absolute',

        top: -4,
        right: -4,

        backgroundColor: COLORS.error,

        width: 20,
        height: 20,

        borderRadius: 10,

        alignItems: 'center',
        justifyContent: 'center',
    },

    floatingBadgeText: {

        color: '#fff',

        fontSize: 11,

        fontWeight: '800',
    },

});