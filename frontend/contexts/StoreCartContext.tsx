import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

export type CartProduct = {
  id: string | number;
  name: string;
  sku: string;
  unit: string;
  price: number;
  image: string;
};

export type CartLine = { product: CartProduct; qty: number };

interface StoreCartContextType {
  cart: CartLine[];
  hydrated: boolean;
  persistCart: boolean;
  setPersistCart: (value: boolean) => void;
  addToCart: (product: CartProduct) => void;
  removeFromCart: (productId: string | number) => void;
  clearCart: () => void;
}

const STORAGE_KEY = 'kingfood_store_cart';
const PERSIST_PREF_KEY = 'kingfood_store_cart_persist';

const StoreCartContext = createContext<StoreCartContextType>({
  cart: [],
  hydrated: false,
  persistCart: true,
  setPersistCart: () => {},
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
});

function storageKey(userId: string | null) {
  return userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
}

export function StoreCartProvider({ children }: { children: ReactNode }) {
  const { userId, isLoggedIn } = useAuth();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [persistCart, setPersistCartState] = useState(true);

  const setPersistCart = useCallback((value: boolean) => {
    setPersistCartState(value);
    AsyncStorage.setItem(PERSIST_PREF_KEY, value ? '1' : '0').catch(() => {});
    if (!value && userId) {
      AsyncStorage.removeItem(storageKey(userId)).catch(() => {});
    } else if (value && userId && cart.length > 0) {
      AsyncStorage.setItem(storageKey(userId), JSON.stringify(cart)).catch(() => {});
    }
  }, [userId, cart]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setHydrated(false);
      if (!isLoggedIn || !userId) {
        setCart([]);
        setHydrated(true);
        return;
      }
      try {
        // Load persistence preference first to avoid race condition
        const persistVal = await AsyncStorage.getItem(PERSIST_PREF_KEY);
        const isPersist = persistVal !== null ? persistVal === '1' : true;
        if (!cancelled) {
          setPersistCartState(isPersist);
        }

        if (isPersist) {
          const raw = await AsyncStorage.getItem(storageKey(userId));
          if (!cancelled && raw) {
            const parsed = JSON.parse(raw) as CartLine[];
            if (Array.isArray(parsed)) {
              setCart(parsed);
              setHydrated(true);
              return;
            }
          }
        }
        if (!cancelled) setCart([]);
      } catch {
        if (!cancelled) setCart([]);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, isLoggedIn]);

  useEffect(() => {
    if (!hydrated || !isLoggedIn || !userId || !persistCart) return;
    AsyncStorage.setItem(storageKey(userId), JSON.stringify(cart)).catch(() => {});
  }, [cart, hydrated, userId, isLoggedIn, persistCart]);

  useEffect(() => {
    if (!isLoggedIn) {
      setCart([]);
      setHydrated(true);
    }
  }, [isLoggedIn]);

  const addToCart = useCallback((product: CartProduct) => {
    setCart(prev => {
      const exist = prev.find(c => c.product.id === product.id);
      if (exist) {
        return prev.map(c =>
          c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string | number) => {
    setCart(prev => {
      const exist = prev.find(c => c.product.id === productId);
      if (exist && exist.qty > 1) {
        return prev.map(c =>
          c.product.id === productId ? { ...c, qty: c.qty - 1 } : c
        );
      }
      return prev.filter(c => c.product.id !== productId);
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    if (userId) {
      AsyncStorage.removeItem(storageKey(userId)).catch(() => {});
    }
  }, [userId]);

  return (
    <StoreCartContext.Provider
      value={{ cart, hydrated, persistCart, setPersistCart, addToCart, removeFromCart, clearCart }}
    >
      {children}
    </StoreCartContext.Provider>
  );
}

export function useStoreCart() {
  const ctx = useContext(StoreCartContext);
  return {
    cart: ctx.cart ?? [],
    hydrated: ctx.hydrated ?? false,
    persistCart: ctx.persistCart ?? true,
    setPersistCart: ctx.setPersistCart ?? (() => {}),
    addToCart: ctx.addToCart,
    removeFromCart: ctx.removeFromCart,
    clearCart: ctx.clearCart,
  };
}
