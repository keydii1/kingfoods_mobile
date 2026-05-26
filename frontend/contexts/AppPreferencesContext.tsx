import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

interface AppPreferencesContextType {
  darkMode: boolean;
  language: 'vi' | 'en';
  biometric: boolean;
  pushNotify: boolean;
  setDarkMode: (value: boolean) => void;
  setLanguage: (value: 'vi' | 'en') => void;
  setBiometric: (value: boolean) => void;
  setPushNotify: (value: boolean) => void;
}

const AppPreferencesContext = createContext<AppPreferencesContextType>({
  darkMode: false,
  language: 'vi',
  biometric: false,
  pushNotify: true,
  setDarkMode: () => {},
  setLanguage: () => {},
  setBiometric: () => {},
  setPushNotify: () => {},
});

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkModeState] = useState(false);
  const [language, setLanguageState] = useState<'vi' | 'en'>('vi');
  const [biometric, setBiometricState] = useState(false);
  const [pushNotify, setPushNotifyState] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const keys = [
          'setting_darkMode',
          'setting_language',
          'setting_biometric',
          'setting_pushNotify',
        ];
        const stores = await AsyncStorage.multiGet(keys);
        stores.forEach(([key, val]) => {
          if (val !== null) {
            const bool = val === 'true';
            if (key === 'setting_darkMode') setDarkModeState(bool);
            if (key === 'setting_language') setLanguageState(val as 'vi' | 'en');
            if (key === 'setting_biometric') setBiometricState(bool);
            if (key === 'setting_pushNotify') setPushNotifyState(bool);
          }
        });
      } catch (err) {
        console.log('Error loading preferences', err);
      }
    }
    load();
  }, []);

  const setDarkMode = useCallback((val: boolean) => {
    setDarkModeState(val);
    AsyncStorage.setItem('setting_darkMode', String(val)).catch(() => {});
  }, []);

  const setLanguage = useCallback((val: 'vi' | 'en') => {
    setLanguageState(val);
    AsyncStorage.setItem('setting_language', val).catch(() => {});
  }, []);

  const setBiometric = useCallback((val: boolean) => {
    setBiometricState(val);
    AsyncStorage.setItem('setting_biometric', String(val)).catch(() => {});
    if (!val) {
      SecureStore.deleteItemAsync('kfood_store_credentials').catch(() => {});
      SecureStore.deleteItemAsync('kfood_wms_credentials').catch(() => {});
    }
  }, []);

  const setPushNotify = useCallback((val: boolean) => {
    setPushNotifyState(val);
    AsyncStorage.setItem('setting_pushNotify', String(val)).catch(() => {});
  }, []);

  return (
    <AppPreferencesContext.Provider
      value={{
        darkMode,
        language,
        biometric,
        pushNotify,
        setDarkMode,
        setLanguage,
        setBiometric,
        setPushNotify,
      }}
    >
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  return useContext(AppPreferencesContext);
}
