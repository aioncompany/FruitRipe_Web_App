import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type LanguageCode = 'en' | 'mr' | 'hi';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  labels: Record<string, string>;
}

const dictionaries: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Layout
    dashboard: 'Dashboard',
    settings: 'Settings',
    signOut: 'Sign Out',
    toggleTheme: 'Toggle Theme',
    language: 'Language',
    selectLanguage: 'Select Application Language',
    designedFor: 'Designed for',
    // Dashboard
    dashboardTitle: 'Dashboard',
    dashboardSubtitle: 'Overview of all monitoring units',
    searchPlaceholder: 'Search chambers...',
    noChambers: 'No chambers found matching your criteria.',
    lastSeen: 'Last seen',
    online: 'ONLINE',
    offline: 'OFFLINE',
    warning: 'WARNING',
    alert: 'ALERT',
    deviceOffline: 'Device Offline',
    // Chamber Detail
    chamber: 'Chamber',
    serial: 'Serial',
    export: 'Export',
    tabOverview: 'Overview',
    tabEvents: 'Device Events',
    tabSettings: 'Settings & Alerts',
    // Metrics
    temp: 'Temperature',
    humidity: 'Humidity',
    co2: 'CO₂ Level',
    ethylene: 'Ethylene',
    trend: 'Trend',
    // Events
    activityLog: 'Device Activity Log',
    noEvents: 'No events recorded.',
    systemLog: 'System automated log',
    wifiConnected: 'CONNECTED',
    powerOn: 'ON',
    // Settings Form
    alertConfig: 'Alert Configurations',
    saveChanges: 'Save Changes',
    saved: 'Saved',
    range: 'Range',
    minThreshold: 'Min Threshold',
    maxThreshold: 'Max Threshold',
    triggerBelow: 'Trigger alert if below this value',
    triggerAbove: 'Trigger alert if above this value',
    co2Desc: 'Carbon Dioxide Concentration',
    ethyleneDesc: 'Ripening Hormone Control',
    lowHumWarn: 'Low humidity warning',
    highHumWarn: 'High humidity warning',
    alertCo2Limit: 'Alert if CO₂ exceeds this limit',
    alertEthLimit: 'Alert if Ethylene exposure is too high'
  },
  mr: {
    // Layout
    dashboard: 'डॅशबोर्ड',
    settings: 'सेटिंग्ज',
    signOut: 'बाहेर पडा',
    toggleTheme: 'थीम बदला',
    language: 'भाषा',
    selectLanguage: 'अँपची भाषा निवडा',
    designedFor: 'यांच्यासाठी',
    // Dashboard
    dashboardTitle: 'डॅशबोर्ड',
    dashboardSubtitle: 'सर्व युनिट्सचा आढावा',
    searchPlaceholder: 'चेंबर्स शोधा...',
    noChambers: 'आपल्या निकषांशी जुळणारे कोणतेही चेंबर्स आढळले नाहीत.',
    lastSeen: 'शेवटचे पाहिले',
    online: 'ऑनलाइन',
    offline: 'ऑफलाइन',
    warning: 'चेतावणी',
    alert: 'अलर्ट',
    deviceOffline: 'डिव्हाइस ऑफलाइन',
    // Chamber Detail
    chamber: 'चेंबर',
    serial: 'अनुक्रमांक',
    export: 'निर्यात करा',
    tabOverview: 'आढावा',
    tabEvents: 'डिव्हाइस इव्हेंट्स',
    tabSettings: 'सेटिंग्ज आणि अलर्ट',
    // Metrics
    temp: 'तापमान',
    humidity: 'आर्द्रता',
    co2: 'CO₂ स्तर',
    ethylene: 'इथिलीन',
    trend: 'कल',
    // Events
    activityLog: 'डिव्हाइस क्रियाकलाप नोंद',
    noEvents: 'कोणत्याही घटना नोंदवल्या नाहीत.',
    systemLog: 'सिस्टम स्वयंचलित लॉग',
    wifiConnected: 'कनेक्ट झाले',
    powerOn: 'चालू',
    // Settings Form
    alertConfig: 'अलर्ट संरचना',
    saveChanges: 'बदल जतन करा',
    saved: 'जतन केले',
    range: 'श्रेणी',
    minThreshold: 'किमान मर्यादा',
    maxThreshold: 'कमाल मर्यादा',
    triggerBelow: 'मूल्य यापेक्षा कमी असल्यास अलर्ट करा',
    triggerAbove: 'मूल्य यापेक्षा जास्त असल्यास अलर्ट करा',
    co2Desc: 'कार्बन डायऑक्साइड प्रमाण',
    ethyleneDesc: 'पिकवणे हार्मोन नियंत्रण',
    lowHumWarn: 'कमी आर्द्रता चेतावणी',
    highHumWarn: 'उच्च आर्द्रता चेतावणी',
    alertCo2Limit: 'CO₂ मर्यादेपेक्षा जास्त असल्यास अलर्ट',
    alertEthLimit: 'इथिलीन प्रमाण जास्त असल्यास अलर्ट'
  },
  hi: {
    // Layout
    dashboard: 'डैशबोर्ड',
    settings: 'सेटिंग्स',
    signOut: 'साइन आउट',
    toggleTheme: 'थीम बदलें',
    language: 'भाषा',
    selectLanguage: 'ऐप की भाषा चुनें',
    designedFor: 'इनके लिए',
    // Dashboard
    dashboardTitle: 'डैशबोर्ड',
    dashboardSubtitle: 'सभी निगरानी इकाइयों का अवलोकन',
    searchPlaceholder: 'चैंबर खोजें...',
    noChambers: 'आपके मानदंडों से मेल खाने वाले कोई चैंबर नहीं मिले।',
    lastSeen: 'अंतिम बार देखा गया',
    online: 'ऑनलाइन',
    offline: 'ऑफलाइन',
    warning: 'चेतावनी',
    alert: 'अलर्ट',
    deviceOffline: 'डिवाइस ऑफलाइन',
    // Chamber Detail
    chamber: 'चैंबर',
    serial: 'सीरियल',
    export: 'एक्सपोर्ट',
    tabOverview: 'सारांश',
    tabEvents: 'डिवाइस इवेंट्स',
    tabSettings: 'सेटिंग्स और अलर्ट',
    // Metrics
    temp: 'तापमान',
    humidity: 'आर्द्रता',
    co2: 'CO₂ स्तर',
    ethylene: 'एथिलीन',
    trend: 'रुझान',
    // Events
    activityLog: 'डिवाइस गतिविधि लॉग',
    noEvents: 'कोई घटना दर्ज नहीं की गई।',
    systemLog: 'सिस्टम स्वचालित लॉग',
    wifiConnected: 'कनेक्ट किया गया',
    powerOn: 'चालू',
    // Settings Form
    alertConfig: 'अलर्ट कॉन्फ़िगरेशन',
    saveChanges: 'परिवर्तन सहेजें',
    saved: 'सहेजा गया',
    range: 'रेंज',
    minThreshold: 'न्यूनतम सीमा',
    maxThreshold: 'अधिकतम सीमा',
    triggerBelow: 'यदि मान इससे कम है तो अलर्ट करें',
    triggerAbove: 'यदि मान इससे अधिक है तो अलर्ट करें',
    co2Desc: 'कार्बन डाइऑक्साइड सांद्रता',
    ethyleneDesc: 'पकने वाला हार्मोन नियंत्रण',
    lowHumWarn: 'कम आर्द्रता चेतावनी',
    highHumWarn: 'उच्च आर्द्रता चेतावनी',
    alertCo2Limit: 'यदि CO₂ इस सीमा से अधिक है तो अलर्ट',
    alertEthLimit: 'यदि एथिलीन संपर्क बहुत अधिक है तो अलर्ट'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageCode>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language') as LanguageCode;
    if (savedLang && ['en', 'mr', 'hi'].includes(savedLang)) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: LanguageCode) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, labels: dictionaries[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};