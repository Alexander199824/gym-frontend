// src/config/gymConfig.js
// Configuración centralizada del gimnasio desde variables de entorno
// Autor: Alexander Echeverria
// VERSIÓN MEJORADA: Configuración completa sin datos hardcodeados

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
    supportEmail: process.env.REACT_APP_GYM_SUPPORT_EMAIL || process.env.REACT_APP_GYM_EMAIL || 'info@elitefitness.com',
    supportPhone: process.env.REACT_APP_GYM_SUPPORT_PHONE || process.env.REACT_APP_GYM_PHONE || '+502 2345-6789',
    whatsapp: process.env.REACT_APP_SOCIAL_WHATSAPP || 'https://wa.me/50223456789',
  },

  // Ubicación
  location: {
    address: process.env.REACT_APP_GYM_ADDRESS || 'Zona 4 Rabinal Baja Verapaz',
    addressFull: process.env.REACT_APP_GYM_ADDRESS_FULL || '2 cuadras de Municipalidad de Rabinal',
    city: process.env.REACT_APP_GYM_CITY || 'Rabinal',
    state: process.env.REACT_APP_GYM_STATE || 'Baja Verapaz',
    country: process.env.REACT_APP_GYM_COUNTRY || 'Guatemala',
    mapsUrl: process.env.REACT_APP_GYM_MAPS_URL || 'https://maps.google.com',
    coordinates: {
      lat: parseFloat(process.env.REACT_APP_GYM_COORDINATES_LAT) || 15.0855,
      lng: parseFloat(process.env.REACT_APP_GYM_COORDINATES_LNG) || -90.4892,
    },
    // Municipios cercanos para envío local
    nearbyMunicipalities: process.env.REACT_APP_GYM_NEARBY_MUNICIPALITIES 
      ? process.env.REACT_APP_GYM_NEARBY_MUNICIPALITIES.split(',').map(m => m.trim())
      : ['Rabinal', 'Cubulco', 'San Miguel Chicaj', 'Salamá', 'San Jerónimo'],
  },

  // Horarios
  hours: {
    weekday: process.env.REACT_APP_GYM_HOURS_WEEKDAY || 'Lunes a Viernes: 5:00 AM - 10:00 PM',
    weekend: process.env.REACT_APP_GYM_HOURS_WEEKEND || 'Sábados: 6:00 AM - 8:00 PM',
    full: process.env.REACT_APP_GYM_HOURS_FULL || 'Lun-Vie: 5:00 AM - 10:00 PM, Sáb: 6:00 AM - 8:00 PM',
    businessHours: process.env.REACT_APP_GYM_HOURS_BUSINESS || 'Lun-Vie: 5:00 AM - 10:00 PM',
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

  // Servicios y amenidades
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
    dateFormat: process.env.REACT_APP_DATE_FORMAT || 'DD/MM/YYYY',
    timeFormat: process.env.REACT_APP_TIME_FORMAT || 'HH:mm',
  },

  // Información bancaria por defecto (puede ser sobrescrita por el backend)
  banking: {
    bankName: process.env.REACT_APP_BANK_NAME || 'Banco Industrial',
    accountNumber: process.env.REACT_APP_BANK_ACCOUNT_NUMBER || '0000-0000-0000',
    accountHolder: process.env.REACT_APP_BANK_ACCOUNT_HOLDER || process.env.REACT_APP_GYM_NAME || 'Elite Fitness Club',
    accountType: process.env.REACT_APP_BANK_ACCOUNT_TYPE || 'Monetaria',
    instructions: process.env.REACT_APP_BANK_INSTRUCTIONS 
      ? process.env.REACT_APP_BANK_INSTRUCTIONS.split('|')
      : [
          'Realiza la transferencia con el monto exacto',
          'Guarda tu comprobante de pago',
          'Sube el comprobante en el siguiente paso (opcional)',
          'La validación toma de 1-2 días hábiles',
        ],
  },

  // Configuración de métodos de pago
  payment: {
    cardEnabled: process.env.REACT_APP_STRIPE_ENABLED === 'true',
    cardProcessingNote: process.env.REACT_APP_CARD_PROCESSING_NOTE || 'Confirmación inmediata - Visa, Mastercard',
    transferEnabled: process.env.REACT_APP_TRANSFER_ENABLED === 'true',
    transferProcessingNote: process.env.REACT_APP_TRANSFER_PROCESSING_NOTE || 'Sube tu comprobante - Validación manual',
    transferValidationTime: process.env.REACT_APP_TRANSFER_VALIDATION_TIME || '1-2 días',
    cashEnabled: process.env.REACT_APP_CASH_ENABLED !== 'false', // Por defecto habilitado
    cashProcessingNote: process.env.REACT_APP_CASH_PROCESSING_NOTE || 'Paga al visitar - Confirmación manual',
  },

  // Configuración de envíos
  shipping: {
    localDelivery: {
      enabled: process.env.REACT_APP_LOCAL_DELIVERY_ENABLED !== 'false',
      cost: parseFloat(process.env.REACT_APP_LOCAL_DELIVERY_COST) || 25,
      timeframe: process.env.REACT_APP_LOCAL_DELIVERY_TIMEFRAME || 'Días específicos',
      minOrder: parseFloat(process.env.REACT_APP_LOCAL_DELIVERY_MIN_ORDER) || 0,
    },
    nationalDelivery: {
      enabled: process.env.REACT_APP_NATIONAL_DELIVERY_ENABLED !== 'false',
      cost: parseFloat(process.env.REACT_APP_NATIONAL_DELIVERY_COST) || 45,
      timeframe: process.env.REACT_APP_NATIONAL_DELIVERY_TIMEFRAME || '3-5 días hábiles',
      minOrder: parseFloat(process.env.REACT_APP_NATIONAL_DELIVERY_MIN_ORDER) || 0,
    },
    pickupStore: {
      enabled: process.env.REACT_APP_PICKUP_STORE_ENABLED !== 'false',
      timeframe: process.env.REACT_APP_PICKUP_STORE_TIMEFRAME || 'Listo en 2-4 horas',
    },
    freeShippingThreshold: parseFloat(process.env.REACT_APP_FREE_SHIPPING_THRESHOLD) || 200,
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
    months: {
      january: 'Enero',
      february: 'Febrero',
      march: 'Marzo',
      april: 'Abril',
      may: 'Mayo',
      june: 'Junio',
      july: 'Julio',
      august: 'Agosto',
      september: 'Septiembre',
      october: 'Octubre',
      november: 'Noviembre',
      december: 'Diciembre',
    },
  },

  // Configuración de la tienda
  store: {
    enabled: process.env.REACT_APP_STORE_ENABLED !== 'false',
    showPricesWithTax: process.env.REACT_APP_SHOW_PRICES_WITH_TAX !== 'false',
    taxRate: parseFloat(process.env.REACT_APP_TAX_RATE) || 0.12,
    taxName: process.env.REACT_APP_TAX_NAME || 'IVA',
    minimumOrder: parseFloat(process.env.REACT_APP_MINIMUM_ORDER) || 0,
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
  
  // Merge profundo de objetos
  const merged = { ...defaultData };
  
  for (const key in backendData) {
    if (backendData[key] !== null && backendData[key] !== undefined) {
      if (typeof backendData[key] === 'object' && !Array.isArray(backendData[key])) {
        merged[key] = mergeWithDefaults(backendData[key], defaultData[key] || {});
      } else {
        merged[key] = backendData[key];
      }
    }
  }
  
  return merged;
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
    contact: gymConfig.contact,
    location: gymConfig.location,
    hours: gymConfig.hours,
    social: gymConfig.social,
    stats: gymConfig.stats,
    amenities: gymConfig.amenities,
    regional: gymConfig.regional,
  });
};

/**
 * Obtener configuración de envíos
 * Combina backend con defaults del .env
 */
export const getShippingConfig = (backendShippingConfig) => {
  return mergeWithDefaults(backendShippingConfig, gymConfig.shipping);
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

/**
 * Formatear precio con símbolo de moneda
 * @param {number} amount - Monto a formatear
 * @param {boolean} includeSymbol - Incluir símbolo de moneda
 * @returns {string} - Precio formateado
 */
export const formatPrice = (amount, includeSymbol = true) => {
  const formatted = parseFloat(amount).toFixed(2);
  return includeSymbol 
    ? `${gymConfig.regional.currencySymbol}${formatted}`
    : formatted;
};

/**
 * Formatear fecha según configuración regional
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
export const formatDate = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return gymConfig.regional.dateFormat
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year);
};

/**
 * Obtener mensaje de soporte
 * @returns {string} - Mensaje con información de contacto
 */
export const getSupportMessage = () => {
  return `Para soporte, contáctanos:
📧 ${gymConfig.contact.supportEmail}
📱 ${gymConfig.contact.supportPhone}
💬 ${gymConfig.contact.whatsapp}`;
};

export default gymConfig;