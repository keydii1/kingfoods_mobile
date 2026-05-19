import {
    Stack,
    Redirect,
    usePathname,
} from 'expo-router';

import { AuthProvider, useAuth }
from '../contexts/AuthContext';
import { StoreCartProvider } from '../contexts/StoreCartContext';
import { AppAlertProvider } from '../components/AppAlertProvider';

import FloatingAssistiveButton
from '../components/FloatingAssistiveButton';

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

            {isLoggedIn && !isLoginScreen && !isPickingFlow && userRole === 'staff' && (
                <FloatingAssistiveButton />
            )}

        </>

    );
}

export default function Layout() {

    return (

        <AuthProvider>
            <StoreCartProvider>
                <AppAlertProvider>
                    <LayoutContent />
                </AppAlertProvider>
            </StoreCartProvider>
        </AuthProvider>

    );
}