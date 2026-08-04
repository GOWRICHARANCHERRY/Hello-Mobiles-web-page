import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import translations from '../i18n';
import { useAuth } from './AuthContext';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

const STORAGE_KEY = 'hm_language';

export function LanguageProvider({ children }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    return 'en';
  });

  useEffect(() => {
    if (user?.language && !localStorage.getItem(STORAGE_KEY)) {
      setLanguageState(user.language);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang) => {
    localStorage.setItem(STORAGE_KEY, lang);
    setLanguageState(lang);
  };

  const t = useCallback((key, vars) => {
    let str = translations[language]?.[key] ?? translations.en[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.split(`{${k}}`).join(String(v));
      });
    }
    return str;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
