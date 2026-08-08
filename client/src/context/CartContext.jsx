import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/api';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const ABANDONED_MS = 20 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 1000;

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const lastActivityRef = useRef(Date.now());
  const remindedRef = useRef(sessionStorage.getItem('hm_cart_reminded') === '1');

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Abandoned-cart tracking: any cart mutation resets the idle clock, and when
  // the cart sits untouched (logged-in user) past ABANDONED_MS we ping the server
  // once to WhatsApp-remind the customer. The `reminded` flag (sessionStorage)
  // prevents repeat pings until the cart is emptied again.
  useEffect(() => {
    if (cart.length === 0) {
      remindedRef.current = false;
      sessionStorage.removeItem('hm_cart_reminded');
      return;
    }
    lastActivityRef.current = Date.now();
  }, [cart]);

  useEffect(() => {
    if (!user || cart.length === 0) return;
    const check = () => {
      if (remindedRef.current) return;
      if (Date.now() - lastActivityRef.current < ABANDONED_MS) return;
      remindedRef.current = true;
      sessionStorage.setItem('hm_cart_reminded', '1');
      const items = cart.map(i => ({ name: i.name, quantity: i.quantity }));
      const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
      api.post('/orders/abandoned-cart', { items, subtotal }).catch(() => {
        remindedRef.current = false;
        sessionStorage.removeItem('hm_cart_reminded');
      });
    };
    const timer = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [user, cart]);

  const addToCart = (product, quantity = 1, variant = null, colorObj = null) => {
    const cartKey = variant
      ? `${product._id}-${variant._id}${colorObj ? '-' + (colorObj._id || colorObj.name) : ''}`
      : product._id;

    const price = variant?.price ?? product.price;
    const mrp = variant?.mrp ?? product.mrp;
    const image = colorObj?.image || product.images?.[0] || '';
    const colorName = colorObj?.name || '';

    setCart(prev => {
      const existing = prev.find(item => item.cartKey === cartKey);
      if (existing) {
        return prev.map(item => item.cartKey === cartKey ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, {
        cartKey,
        _id: product._id,
        name: product.name,
        price,
        mrp,
        image,
        brand: product.brand,
        quantity,
        variant: variant ? {
          _id: variant._id,
          ram: variant.ram,
          storage: variant.storage,
          sku: variant.sku,
          price: variant.price,
          mrp: variant.mrp,
        } : null,
        selectedColor: colorName,
        variantLabel: [
          variant?.ram,
          variant?.storage,
          colorName,
        ].filter(Boolean).join(' / '),
      }];
    });
  };

  const removeFromCart = (cartKey) => {
    setCart(prev => prev.filter(item => item.cartKey !== cartKey));
  };

  const updateQuantity = (cartKey, quantity) => {
    if (quantity < 1) return removeFromCart(cartKey);
    setCart(prev => prev.map(item => item.cartKey === cartKey ? { ...item, quantity } : item));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const clearGuestCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, clearGuestCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}
