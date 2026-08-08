import { createContext, useContext, useState, useEffect } from 'react';

const CompareContext = createContext();
export const useCompare = () => useContext(CompareContext);

export const MAX_COMPARE = 3;
const STORAGE_KEY = 'hm_compare';

export function CompareProvider({ children }) {
  const [compare, setCompare] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compare));
  }, [compare]);

  const isInCompare = (id) => compare.includes(id);

  const toggleCompare = (id) => {
    if (compare.includes(id)) {
      setCompare(prev => prev.filter(p => p !== id));
      return 'removed';
    }
    if (compare.length >= MAX_COMPARE) return 'full';
    setCompare(prev => [...prev, id]);
    return 'added';
  };

  const removeFromCompare = (id) => setCompare(prev => prev.filter(p => p !== id));
  const clearCompare = () => setCompare([]);

  return (
    <CompareContext.Provider value={{ compare, isInCompare, toggleCompare, removeFromCompare, clearCompare }}>
      {children}
    </CompareContext.Provider>
  );
}
