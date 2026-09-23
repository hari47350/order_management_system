import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [cart, setCart] = useState({ items: [], totalItems: 0, subtotal: 0 });
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!isAuthenticated || isAdmin) return;
    try {
      setLoading(true);
      const res = await api.get('/cart');
      setCart(res.data);
    } catch (err) {
      console.error('Failed to load cart', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      fetchCart();
    } else {
      setCart({ items: [], totalItems: 0, subtotal: 0 });
    }
  }, [isAuthenticated, isAdmin]);

  const addToCart = async (productId, quantity = 1) => {
    const res = await api.post('/cart/items', { productId, quantity });
    setCart(res.data);
    return res.data;
  };

  const updateQuantity = async (itemId, quantity) => {
    const res = await api.put(`/cart/items/${itemId}?quantity=${quantity}`);
    setCart(res.data);
    return res.data;
  };

  const removeItem = async (itemId) => {
    const res = await api.delete(`/cart/items/${itemId}`);
    setCart(res.data);
    return res.data;
  };

  const clearCart = async () => {
    await api.delete('/cart');
    setCart({ items: [], totalItems: 0, subtotal: 0 });
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
