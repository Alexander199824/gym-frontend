// src/config/gymConfig.js
// Configuración centralizada del gimnasio desde variables de entorno
// Autor: Alexander Echeverria
// 🆕 ARCHIVO NUEVO - Crear en: src/config/gymConfig.js

/**
 * Configuración completa del gimnasio desde variables de entorno
 * Este archivo actúa como fallback cuando el backend no devuelve datos
 */

const gymConfig = {
  // Información básica
  name: process.env.REACT_APP_GYM_NAME || 'Elite Fitness Club',
  tagline: process.env.REACT_APP_GYM_TAGLINE || 'Transforma tu cuerpo, eleva tu mente',
  description: process.env.REACT_APP_GYM_DESCRIPTION || 'El gimnasio más elite de Guatemala',
  logo: process.env.REACT_APP_LOGO_URL || './assets/images/image.png',

  // Contacto
  contact: {
    phone: process.env.REACT_APP_GYM_PHONE || '+502 2345-6789',
    email: process.env.REACT_APP_GYM_EMAIL || 'info@elitefitness.com',
    supportEmail: process.env.REACT_APP_GYM_EMAIL || 'info@elitefitness.com',
    supportPhone: process.env.REACT_APP_GYM_PHONE || '+502 2345-6789',
    whatsapp: process.env.REACT_APP_SOCIAL_WHATSAPP || 'https://wa.me/50223456789',
  },

  // Ubicación
  location: {
    address: process.env.REACT_APP_GYM_ADDRESS || 'Zona 4 Rabinal Baja Verapaz',
    addressFull: process.env.REACT_APP_GYM_ADDRESS_FULL || '2 cuadras de Municipalidad de Rabinal',
    city: process.env.REACT_APP_GYM_CITY || 'Guatemala',
    country: process.env.REACT_APP_GYM_COUNTRY || 'Guatemala',
    mapsUrl: process.env.REACT_APP_GYM_MAPS_URL || 'https://maps.google.com',
    coordinates: {
      lat: parseFloat(process.env.REACT_APP_GYM_COORDINATES_LAT) || 14.599512,
      lng: parseFloat(process.env.REACT_APP_GYM_COORDINATES_LNG) || -90.513843,
    },
  },

  // Horarios
  hours: {
    weekday: process.env.REACT_APP_GYM_HOURS_WEEKDAY || 'Lunes a Viernes: 5:00 AM - 11:00 PM',
    weekend: process.env.REACT_APP_GYM_HOURS_WEEKEND || 'Sábados y Domingos: 6:00 AM - 10:00 PM',
    full: process.env.REACT_APP_GYM_HOURS_FULL || 'Lun-Vie: 5:00 AM - 11:00 PM | Sáb-Dom: 6:00 AM - 10:00 PM',
    businessHours: process.env.REACT_APP_GYM_HOURS_FULL || 'Lun-Vie: 5:00 AM - 11:00 PM | Sáb-Dom: 6:00 AM - 10:00 PM',
  },

  // Redes sociales
  social: {
    instagram: {
      url: process.env.REACT_APP_SOCIAL_INSTAGRAM || 'https://instagram.com/elitefitness_gt',
      handle: process.env.REACT_APP_SOCIAL_INSTAGRAM_HANDLE || '@elitefitness_gt',
    },
    facebook: {
      url: process.env.REACT_APP_SOCIAL_FACEBOOK || 'https://facebook.com/elitefitnessgua',
      handle: process.env.REACT_APP_SOCIAL_FACEBOOK_HANDLE || 'Elite Fitness Club Guatemala',
    },
    twitter: {
      url: process.env.REACT_APP_SOCIAL_TWITTER || 'https://twitter.com/elitefitness_gt',
      handle: process.env.REACT_APP_SOCIAL_TWITTER_HANDLE || '@elitefitness_gt',
    },
    youtube: process.env.REACT_APP_SOCIAL_YOUTUBE || 'https://youtube.com/@elitefitnessgua',
    tiktok: process.env.REACT_APP_SOCIAL_TIKTOK || 'https://tiktok.com/@elitefitness_gt',
    whatsapp: process.env.REACT_APP_SOCIAL_WHATSAPP || 'https://wa.me/50223456789',
  },

  // Estadísticas
  stats: {
    members: process.env.REACT_APP_GYM_MEMBERS_COUNT || '2000+',
    trainers: process.env.REACT_APP_GYM_TRAINERS_COUNT || '50+',
    experience: process.env.REACT_APP_GYM_EXPERIENCE_YEARS || '15+',
    satisfaction: process.env.REACT_APP_GYM_SATISFACTION_RATE || '98%',
  },

  // Servicios
  amenities: {
    parking: process.env.REACT_APP_GYM_PARKING === 'true',
    lockers: process.env.REACT_APP_GYM_LOCKERS === 'true',
    showers: process.env.REACT_APP_GYM_SHOWERS === 'true',
    wifi: process.env.REACT_APP_GYM_WIFI === 'true',
    ac: process.env.REACT_APP_GYM_AC === 'true',
    security: process.env.REACT_APP_GYM_SECURITY || '24/7',
  },

  // Configuración regional
  regional: {
    timezone: process.env.REACT_APP_TIMEZONE || 'America/Guatemala',
    language: process.env.REACT_APP_DEFAULT_LANGUAGE || 'es',
    currency: process.env.REACT_APP_CURRENCY || 'GTQ',
    currencySymbol: process.env.REACT_APP_CURRENCY_SYMBOL || 'Q',
  },

  // Información bancaria por defecto (puede ser sobrescrita por el backend)
  banking: {
    bankName: 'Banco Industrial',
    accountNumber: '0000-0000-0000',
    accountHolder: process.env.REACT_APP_GYM_NAME || 'Elite Fitness Club',
    accountType: 'Monetaria',
    instructions: [
      'Realiza la transferencia con el monto exacto',
      'Guarda tu comprobante de pago',
      'Sube el comprobante en el siguiente paso (opcional)',
      'La validación toma de 1-2 días hábiles',
    ],
  },

  // Configuración de métodos de pago
  payment: {
    cardEnabled: process.env.REACT_APP_STRIPE_ENABLED === 'true',
    cardProcessingNote: 'Confirmación inmediata - Visa, Mastercard',
    transferEnabled: true,
    transferProcessingNote: 'Sube tu comprobante - Validación manual',
    transferValidationTime: '1-2 días',
    cashEnabled: true,
    cashProcessingNote: 'Paga al visitar - Confirmación manual',
  },

  // Traducciones de días
  translations: {
    days: {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo',
    },
  },
};

/**
 * Función helper para combinar datos del backend con el config por defecto
 * @param {Object} backendData - Datos del backend
 * @param {Object} defaultData - Datos por defecto del config
 * @returns {Object} - Datos combinados (backend tiene prioridad)
 */
export const mergeWithDefaults = (backendData, defaultData) => {
  if (!backendData || Object.keys(backendData).length === 0) {
    return defaultData;
  }
  
  // Si backendData existe, lo usamos pero mantenemos defaults para campos faltantes
  return {
    ...defaultData,
    ...backendData,
  };
};

/**
 * Obtener información de contacto completa
 * Combina backend con defaults del .env
 */
export const getContactInfo = (backendContactInfo) => {
  return mergeWithDefaults(backendContactInfo, {
    supportEmail: gymConfig.contact.supportEmail,
    supportPhone: gymConfig.contact.supportPhone,
    email: gymConfig.contact.email,
    phone: gymConfig.contact.phone,
    whatsapp: gymConfig.contact.whatsapp,
    businessHours: gymConfig.hours.businessHours,
    location: gymConfig.location.address,
    address: gymConfig.location.address,
    addressFull: gymConfig.location.addressFull,
  });
};

/**
 * Obtener información bancaria completa
 * Combina backend con defaults del .env
 */
export const getBankInfo = (backendBankInfo) => {
  return mergeWithDefaults(backendBankInfo, gymConfig.banking);
};

/**
 * Obtener configuración de métodos de pago
 * Combina backend con defaults del .env
 */
export const getPaymentConfig = (backendPaymentConfig) => {
  return mergeWithDefaults(backendPaymentConfig, gymConfig.payment);
};

/**
 * Obtener configuración del gimnasio
 * Combina backend con defaults del .env
 */
export const getGymConfig = (backendGymConfig) => {
  return mergeWithDefaults(backendGymConfig, {
    name: gymConfig.name,
    tagline: gymConfig.tagline,
    description: gymConfig.description,
    logo: gymConfig.logo,
  });
};

/**
 * Obtener traducciones
 * Combina backend con defaults del .env
 */
export const getTranslations = (backendTranslations) => {
  return mergeWithDefaults(backendTranslations, gymConfig.translations);
};

/**
 * Hook personalizado para usar la configuración del gimnasio
 * @returns {Object} - Configuración completa del gimnasio
 */
export const useGymConfig = () => {
  return gymConfig;
};

export default gymConfig;