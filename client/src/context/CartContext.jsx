import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

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
