import React, { createContext, useContext, useState } from 'react';
import {
  translations,
  categoryTranslations,
  statusTranslations,
  politicianTranslations,
  translateCommentary,
} from './translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem('neta_meter_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const setLang = (newLang) => {
    setLangState(newLang);
    try {
      localStorage.setItem('neta_meter_lang', newLang);
      document.documentElement.lang = newLang;
    } catch {
      // Ignore if localStorage unavailable
    }
  };

  const toggleLang = () => {
    setLang(lang === 'en' ? 'hi' : 'en');
  };

  const t = (key, params = {}) => {
    const langDict = translations[lang] || translations.en;
    let str = langDict[key] ?? translations.en[key] ?? key;
    if (typeof str === 'string') {
      Object.entries(params).forEach(([pKey, pVal]) => {
        str = str.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      });
    }
    return str;
  };

  const translatePolitician = (politician) => {
    if (!politician) return politician;
    if (lang === 'en') return politician;
    const trans = politicianTranslations[politician.name];
    if (!trans) return politician;
    return {
      ...politician,
      name: trans.name || politician.name,
      party: trans.party || politician.party,
      constituency: trans.constituency || politician.constituency,
      state: trans.state || politician.state,
    };
  };

  const translateCategory = (cat) => {
    if (!cat) return cat;
    const key = String(cat).toLowerCase();
    return categoryTranslations[key]?.[lang] || cat;
  };

  const translateStatus = (status) => {
    if (!status) return status;
    const key = String(status).toLowerCase();
    return statusTranslations[key]?.[lang] || status;
  };

  const translateRoundMetric = (metric) => {
    if (lang === 'en' || !metric) return metric;
    const map = {
      'Promise Delivery': t('metricPromiseDelivery'),
      'Citizen Progress': t('metricCitizenProgress'),
      'Area Condition': t('metricAreaCondition'),
      'Verified Evidence': t('metricVerifiedEvidence'),
      'Neta Meter Score': t('metricNetaMeterScore'),
    };
    return map[metric] || metric;
  };

  const translateRoundName = (name) => {
    if (lang === 'en' || !name) return name;
    const map = {
      'Round 1': t('round1'),
      'Round 2': t('round2'),
      'Round 3': t('round3'),
      'Round 4': t('round4'),
      'Final Round': t('finalRound'),
    };
    return map[name] || name;
  };

  const getCommentary = (commentary) => {
    return translateCommentary(commentary, lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        t,
        translatePolitician,
        translateCategory,
        translateStatus,
        translateRoundMetric,
        translateRoundName,
        getCommentary,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
