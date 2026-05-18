import React, { useRef } from 'react';

import {
    Text,
    TouchableOpacity,
    Animated,
    PanResponder,
    StyleSheet,
} from 'react-native';

import { router, usePathname } from 'expo-router';

import { COLORS } from '../constants/colors';

export default function FloatingAssistiveButton() {

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

                    // Chỉ push nếu chưa ở notifications
                    if (pathname !== '/notifications') {
                        router.push('/notifications');
                    }

                }}
            >

                <Text style={styles.floatingIcon}>
                    🔔
                </Text>

                {/* Badge */}
                <Animated.View style={styles.floatingBadge}>
                    <Text style={styles.floatingBadgeText}>
                        3
                    </Text>
                </Animated.View>

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