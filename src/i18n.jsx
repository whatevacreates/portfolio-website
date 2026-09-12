import { createContext, useContext } from 'react';

// two-language site: English is the source of truth, German rides along as
// inline pairs — tr(en, de) picks per the context language. Content that
// exists only in English (case stories, blog articles) simply passes de=null
// and stays English in both languages.
export const LangContext = createContext('en');

export const useT = () => {
  const lang = useContext(LangContext);
  return (en, de) => (lang === 'de' && de != null ? de : en);
};

export const getLang = () => {
  try { return localStorage.getItem('lang') === 'de' ? 'de' : 'en'; } catch { return 'en'; }
};

export const saveLang = (lang) => {
  try { localStorage.setItem('lang', lang); } catch { /* private mode */ }
};
