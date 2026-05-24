import {
    Stack,
    Redirect,
    usePathname,
} from 'expo-router';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { AuthProvider, useAuth }
from '../contexts/AuthContext';
import { StoreCartProvider } from '../contexts/StoreCartContext';
import { AppAlertProvider } from '../components/AppAlertProvider';
import { AppPreferencesProvider } from '../contexts/AppPreferencesContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();


function LayoutContent() {

    const { isLoggedIn, userRole } = useAuth();

    const pathname = usePathname();

    const isLoginScreen =
        pathname === '/Login' ||
        pathname === '/customer-login' ||
        pathname === '/admin-login';

    const isPickingFlow =
        pathname.includes('pickingflow');

    if (!isLoggedIn && !isLoginScreen) {

        return <Redirect href="/Login" />;
    }

    return (

        <>
            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    animationDuration: 200,
                }}
            />
        </>

    );
}

export default function Layout() {
    const [loaded, error] = useFonts({
        ...Ionicons.font,
        ...MaterialIcons.font,
    });

    useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    if (!loaded && !error) {
        return null;
    }

    return (

        <AuthProvider>
            <AppPreferencesProvider>
                <StoreCartProvider>
                    <AppAlertProvider>
                        <LayoutContent />
                    </AppAlertProvider>
                </StoreCartProvider>
            </AppPreferencesProvider>
        </AuthProvider>

    );
}