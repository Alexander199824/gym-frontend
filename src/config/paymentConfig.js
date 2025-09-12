// Autor: Alexander Echeverria
// src/config/paymentConfig.js
// FUNCIÓN: Configuración centralizada del sistema de pagos en quetzales guatemaltecos
// USO: Constantes, configuraciones y validaciones para todo el sistema de pagos

import {
  CreditCard,
  Banknote,
  Building,
  Smartphone,
  Calendar,
  Calculator,
  FileText,
  Settings,
  MoreHorizontal,
  CheckCircle,
  Clock,
  XCircle,
  X,
  AlertCircle
} from 'lucide-react';

// ================================
// 🏦 CONFIGURACIÓN DE MONEDA GUATEMALTECA
// ================================
export const CURRENCY_CONFIG = {
  code: 'GTQ',
  symbol: 'Q',
  name: 'Quetzal Guatemalteco',
  decimals: 2,
  thousandsSeparator: ',',
  decimalSeparator: '.',
  format: 'Q {amount}', // Formato: Q 150.00
  
  // Configuración para formateo
  locale: 'es-GT',
  options: {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }
};

// ================================
// 💳 MÉTODOS DE PAGO DISPONIBLES
// ================================
export const PAYMENT_METHODS = {
  cash: {
    id: 'cash',
    label: 'Efectivo',
    description: 'Pago en efectivo en recepción',
    icon: Banknote,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    enabled: true,
    requiresValidation: false,
    allowsProof: false,
    processingTime: 'Inmediato',
    notes: 'Disponible en horarios de atención'
  },
  
  card: {
    id: 'card',
    label: 'Tarjeta de Crédito/Débito',
    description: 'Pago con tarjeta Visa, MasterCard',
    icon: CreditCard,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    enabled: true,
    requiresValidation: false,
    allowsProof: false,
    processingTime: 'Inmediato',
    notes: 'Procesamiento seguro con Stripe'
  },
  
  transfer: {
    id: 'transfer',
    label: 'Transferencia Bancaria',
    description: 'Transferencia a cuenta del gimnasio',
    icon: Building,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    enabled: true,
    requiresValidation: true,
    allowsProof: true,
    processingTime: '24-48 horas',
    notes: 'Debe subir comprobante de transferencia',
    
    // Cuentas bancarias guatemaltecas
    bankAccounts: [
      {
        bank: 'Banco Industrial',
        accountNumber: '1234-567890-1',
        accountName: 'Elite Fitness Guatemala',
        accountType: 'Monetaria'
      },
      {
        bank: 'Banco G&T Continental',
        accountNumber: '9876-543210-2',
        accountName: 'Elite Fitness Guatemala',
        accountType: 'Empresarial'
      }
    ]
  },
  
  mobile: {
    id: 'mobile',
    label: 'Pago Móvil',
    description: 'Transferencia por app móvil',
    icon: Smartphone,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
    enabled: false, // Deshabilitado por ahora
    requiresValidation: true,
    allowsProof: true,
    processingTime: '1-2 horas',
    notes: 'Próximamente disponible'
  }
};

// ================================
// 🎫 TIPOS DE PAGO DISPONIBLES
// ================================
export const PAYMENT_TYPES = {
  membership: {
    id: 'membership',
    label: 'Membresía',
    description: 'Pago de membresía mensual o paquete',
    icon: CreditCard,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    allowsRecurring: true,
    requiresUser: true,
    requiresMembership: true,
    allowsAnonymous: false,
    minAmount: 100,
    maxAmount: 2000,
    defaultDescription: 'Pago de membresía'
  },
  
  daily: {
    id: 'daily',
    label: 'Pago Diario',
    description: 'Acceso por un día',
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    allowsRecurring: false,
    requiresUser: false,
    requiresMembership: false,
    allowsAnonymous: true,
    minAmount: 25,
    maxAmount: 50,
    defaultDescription: 'Acceso por un día',
    
    // Configuración específica para pagos diarios
    pricing: {
      single: 25,
      student: 20,
      senior: 15
    }
  },
  
  bulk_daily: {
    id: 'bulk_daily',
    label: 'Pago Múltiple',
    description: 'Múltiples días de acceso',
    icon: Calculator,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    allowsRecurring: false,
    requiresUser: false,
    requiresMembership: false,
    allowsAnonymous: true,
    minAmount: 50,
    maxAmount: 500,
    defaultDescription: 'Pago por múltiples días',
    
    // Configuración de descuentos por volumen
    discounts: [
      { minDays: 5, maxDays: 9, discount: 0.05 }, // 5% descuento
      { minDays: 10, maxDays: 19, discount: 0.10 }, // 10% descuento
      { minDays: 20, maxDays: 30, discount: 0.15 } // 15% descuento
    ]
  },
  
  product: {
    id: 'product',
    label: 'Producto',
    description: 'Compra de productos de la tienda',
    icon: FileText,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    allowsRecurring: false,
    requiresUser: false,
    requiresMembership: false,
    allowsAnonymous: true,
    minAmount: 10,
    maxAmount: 1000,
    defaultDescription: 'Compra de productos'
  },
  
  service: {
    id: 'service',
    label: 'Servicio',
    description: 'Pago por servicios adicionales',
    icon: Settings,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    allowsRecurring: false,
    requiresUser: true,
    requiresMembership: false,
    allowsAnonymous: false,
    minAmount: 50,
    maxAmount: 500,
    defaultDescription: 'Pago por servicio'
  },
  
  other: {
    id: 'other',
    label: 'Otro',
    description: 'Otros tipos de pago',
    icon: MoreHorizontal,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    allowsRecurring: false,
    requiresUser: false,
    requiresMembership: false,
    allowsAnonymous: true,
    minAmount: 1,
    maxAmount: 5000,
    defaultDescription: 'Pago adicional'
  }
};

// ================================
// 📊 ESTADOS DE PAGO
// ================================
export const PAYMENT_STATUSES = {
  pending: {
    id: 'pending',
    label: 'Pendiente',
    description: 'Esperando procesamiento o validación',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
    allowsCancel: true,
    allowsEdit: false,
    allowsValidation: true,
    isFinal: false
  },
  
  processing: {
    id: 'processing',
    label: 'Procesando',
    description: 'En proceso de validación',
    icon: AlertCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    allowsCancel: false,
    allowsEdit: false,
    allowsValidation: false,
    isFinal: false
  },
  
  completed: {
    id: 'completed',
    label: 'Completado',
    description: 'Pago procesado exitosamente',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    allowsCancel: false,
    allowsEdit: false,
    allowsValidation: false,
    isFinal: true
  },
  
  failed: {
    id: 'failed',
    label: 'Fallido',
    description: 'Error en el procesamiento',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    allowsCancel: false,
    allowsEdit: false,
    allowsValidation: false,
    isFinal: true
  },
  
  cancelled: {
    id: 'cancelled',
    label: 'Cancelado',
    description: 'Pago cancelado por usuario o sistema',
    icon: X,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    allowsCancel: false,
    allowsEdit: false,
    allowsValidation: false,
    isFinal: true
  },
  
  refunded: {
    id: 'refunded',
    label: 'Reembolsado',
    description: 'Dinero devuelto al cliente',
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
    allowsCancel: false,
    allowsEdit: false,
    allowsValidation: false,
    isFinal: true
  }
};

// ================================
// ⚡ CONFIGURACIÓN DE PRIORIDADES PARA TRANSFERENCIAS
// ================================
export const TRANSFER_PRIORITY_CONFIG = {
  critical: {
    id: 'critical',
    label: 'Crítica',
    description: 'Requiere atención inmediata',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    minHours: 72,
    maxHours: null,
    alertLevel: 'high',
    autoNotify: true
  },
  
  high: {
    id: 'high',
    label: 'Alta',
    description: 'Atención prioritaria',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    minHours: 48,
    maxHours: 72,
    alertLevel: 'medium',
    autoNotify: true
  },
  
  medium: {
    id: 'medium',
    label: 'Media',
    description: 'Atención en horario normal',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    minHours: 24,
    maxHours: 48,
    alertLevel: 'low',
    autoNotify: false
  },
  
  normal: {
    id: 'normal',
    label: 'Normal',
    description: 'Tiempo de procesamiento estándar',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    minHours: 0,
    maxHours: 24,
    alertLevel: 'none',
    autoNotify: false
  }
};

// ================================
// 🔐 CONFIGURACIÓN DE PERMISOS
// ================================
export const PAYMENT_PERMISSIONS = {
  // Permisos de visualización
  VIEW_PAYMENTS_DASHBOARD: 'view_payments_dashboard',
  VIEW_PAYMENTS: 'view_payments',
  VIEW_PENDING_TRANSFERS: 'view_pending_transfers',
  VIEW_CASH_MEMBERSHIPS: 'view_cash_memberships',
  
  // Permisos de creación
  CREATE_PAYMENTS: 'create_payments',
  CREATE_BULK_PAYMENTS: 'create_bulk_payments',
  
  // Permisos de modificación
  EDIT_PAYMENTS: 'edit_payments',
  CANCEL_PAYMENTS: 'cancel_payments',
  
  // Permisos de autorización
  VALIDATE_TRANSFERS: 'validate_transfers',
  ACTIVATE_CASH_MEMBERSHIPS: 'activate_cash_memberships',
  MANAGE_PAYMENTS: 'manage_payments', // Permiso general
  
  // Permisos de reportes
  VIEW_PAYMENT_REPORTS: 'view_payment_reports',
  EXPORT_PAYMENT_DATA: 'export_payment_data'
};

// ================================
// ⏱️ CONFIGURACIÓN DE TIEMPOS
// ================================
export const TIME_CONFIG = {
  // Intervalos de auto-refresh (en milisegundos)
  AUTO_REFRESH: {
    DASHBOARD: 30000, // 30 segundos
    TRANSFERS: 45000, // 45 segundos
    CASH_MEMBERSHIPS: 60000, // 1 minuto
    PAYMENTS: 120000 // 2 minutos
  },
  
  // Timeouts para cache
  CACHE_TIMEOUT: {
    DASHBOARD: 30000, // 30 segundos
    STATISTICS: 300000, // 5 minutos
    USER_DATA: 600000 // 10 minutos
  },
  
  // Configuración de urgencia
  URGENCY_THRESHOLDS: {
    TRANSFER_CRITICAL: 72, // horas
    TRANSFER_HIGH: 48, // horas
    TRANSFER_MEDIUM: 24, // horas
    CASH_MEMBERSHIP_URGENT: 4 // horas
  },
  
  // Timeouts para procesamiento
  PROCESSING_TIMEOUT: {
    VALIDATION: 30000, // 30 segundos
    ACTIVATION: 15000, // 15 segundos
    PAYMENT_CREATION: 45000 // 45 segundos
  }
};

// ================================
// 🎨 CONFIGURACIÓN DE UI
// ================================
export const UI_CONFIG = {
  // Tamaños de paginación
  PAGINATION: {
    PAYMENTS_PER_PAGE: 20,
    PAYMENTS_PER_PAGE_MOBILE: 10,
    TRANSFERS_PER_PAGE: 15,
    CASH_MEMBERSHIPS_PER_PAGE: 12
  },
  
  // Configuración de modales
  MODAL: {
    MAX_WIDTH: '2xl',
    MOBILE_MARGINS: 4,
    Z_INDEX: 100
  },
  
  // Configuración de notificaciones
  NOTIFICATIONS: {
    SUCCESS_DURATION: 5000, // 5 segundos
    ERROR_DURATION: 8000, // 8 segundos
    WARNING_DURATION: 6000, // 6 segundos
    INFO_DURATION: 4000 // 4 segundos
  },
  
  // Configuración de animaciones
  ANIMATIONS: {
    TRANSITION_DURATION: 200,
    HOVER_SCALE: 1.05,
    LOADING_SPINNER_SIZE: 'w-4 h-4',
    BOUNCE_ANIMATION: 'animate-bounce',
    PULSE_ANIMATION: 'animate-pulse'
  }
};

// ================================
// 🚨 MENSAJES DE VALIDACIÓN
// ================================
export const VALIDATION_MESSAGES = {
  REQUIRED: {
    AMOUNT: 'El monto es obligatorio',
    PAYMENT_METHOD: 'El método de pago es obligatorio',
    PAYMENT_TYPE: 'El tipo de pago es obligatorio',
    PAYMENT_DATE: 'La fecha de pago es obligatoria',
    CLIENT_NAME: 'El nombre del cliente es obligatorio para pagos anónimos',
    REJECTION_REASON: 'La razón del rechazo es obligatoria'
  },
  
  FORMAT: {
    AMOUNT_POSITIVE: 'El monto debe ser mayor a 0 quetzales',
    AMOUNT_MAX: 'El monto excede el límite permitido',
    EMAIL_INVALID: 'El formato del email no es válido',
    PHONE_INVALID: 'El formato del teléfono no es válido',
    DATE_FUTURE: 'La fecha no puede ser futura',
    DATE_PAST: 'La fecha es demasiado antigua'
  },
  
  BUSINESS: {
    MEMBERSHIP_ALREADY_ACTIVE: 'La membresía ya está activa',
    TRANSFER_ALREADY_PROCESSED: 'La transferencia ya fue procesada',
    INSUFFICIENT_PERMISSIONS: 'No tienes permisos para realizar esta acción',
    PAYMENT_NOT_FOUND: 'El pago no fue encontrado',
    DAILY_PAYMENT_LIMIT: 'Se ha excedido el límite diario de pagos'
  }
};

// ================================
// 📋 RAZONES PREDEFINIDAS PARA RECHAZO DE TRANSFERENCIAS
// ================================
export const REJECTION_REASONS = [
  'Comprobante no válido',
  'Monto incorrecto',
  'Datos del titular no coinciden',
  'Comprobante ilegible',
  'Transferencia duplicada',
  'Cuenta bancaria no autorizada',
  'Fecha de transferencia incorrecta',
  'Número de referencia inválido',
  'Banco no reconocido',
  'Formato de comprobante incorrecto',
  'Otro motivo (especificar)'
];

// ================================
// 🏪 CONFIGURACIÓN DE MEMBRESÍAS
// ================================
export const MEMBERSHIP_CONFIG = {
  // Estados de membresía
  STATUSES: {
    PENDING: 'pending',
    ACTIVE: 'active',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
    SUSPENDED: 'suspended'
  },
  
  // Tipos de membresía
  TYPES: {
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
    SEMI_ANNUAL: 'semi_annual',
    ANNUAL: 'annual',
    STUDENT: 'student',
    SENIOR: 'senior'
  },
  
  // Precios base (en quetzales)
  PRICING: {
    monthly: 350,
    quarterly: 900,
    semi_annual: 1650,
    annual: 3000,
    student: 250,
    senior: 200
  }
};

// ================================
// 🛠️ FUNCIONES DE UTILIDAD
// ================================
export const PAYMENT_UTILS = {
  // Formatear monto en quetzales
  formatCurrency: (amount) => {
    return new Intl.NumberFormat(CURRENCY_CONFIG.locale, CURRENCY_CONFIG.options).format(amount);
  },
  
  // Obtener configuración de método de pago
  getPaymentMethodConfig: (methodId) => {
    return PAYMENT_METHODS[methodId] || PAYMENT_METHODS.cash;
  },
  
  // Obtener configuración de tipo de pago
  getPaymentTypeConfig: (typeId) => {
    return PAYMENT_TYPES[typeId] || PAYMENT_TYPES.other;
  },
  
  // Obtener configuración de estado
  getPaymentStatusConfig: (statusId) => {
    return PAYMENT_STATUSES[statusId] || PAYMENT_STATUSES.pending;
  },
  
  // Calcular prioridad de transferencia por horas de espera
  getTransferPriority: (hoursWaiting) => {
    if (hoursWaiting >= TRANSFER_PRIORITY_CONFIG.critical.minHours) {
      return TRANSFER_PRIORITY_CONFIG.critical;
    } else if (hoursWaiting >= TRANSFER_PRIORITY_CONFIG.high.minHours) {
      return TRANSFER_PRIORITY_CONFIG.high;
    } else if (hoursWaiting >= TRANSFER_PRIORITY_CONFIG.medium.minHours) {
      return TRANSFER_PRIORITY_CONFIG.medium;
    } else {
      return TRANSFER_PRIORITY_CONFIG.normal;
    }
  },
  
  // Validar monto según tipo de pago
  validateAmount: (amount, paymentType) => {
    const config = PAYMENT_TYPES[paymentType];
    if (!config) return { valid: false, error: 'Tipo de pago inválido' };
    
    if (amount < config.minAmount) {
      return {
        valid: false,
        error: `El monto mínimo para ${config.label} es ${PAYMENT_UTILS.formatCurrency(config.minAmount)}`
      };
    }
    
    if (amount > config.maxAmount) {
      return {
        valid: false,
        error: `El monto máximo para ${config.label} es ${PAYMENT_UTILS.formatCurrency(config.maxAmount)}`
      };
    }
    
    return { valid: true };
  },
  
  // Calcular descuento para pagos múltiples
  calculateBulkDiscount: (days, baseAmount) => {
    const discounts = PAYMENT_TYPES.bulk_daily.discounts;
    for (const discount of discounts) {
      if (days >= discount.minDays && days <= discount.maxDays) {
        return baseAmount * discount.discount;
      }
    }
    return 0;
  },
  
  // Generar descripción automática
  generateDescription: (paymentType, additionalInfo = {}) => {
    const config = PAYMENT_TYPES[paymentType];
    if (!config) return 'Pago';
    
    let description = config.defaultDescription;
    
    if (paymentType === 'bulk_daily' && additionalInfo.days) {
      description += ` - ${additionalInfo.days} días`;
    }
    
    if (paymentType === 'membership' && additionalInfo.membershipType) {
      description += ` - ${additionalInfo.membershipType}`;
    }
    
    return description;
  }
};

// ================================
// 📱 CONFIGURACIÓN PARA DISPOSITIVOS
// ================================
export const DEVICE_CONFIG = {
  // Breakpoints responsivos
  BREAKPOINTS: {
    mobile: '(max-width: 768px)',
    tablet: '(min-width: 769px) and (max-width: 1024px)',
    desktop: '(min-width: 1025px)'
  },
  
  // Configuraciones específicas por dispositivo
  MOBILE: {
    paymentsPerPage: 10,
    modalMaxWidth: '100%',
    buttonSize: 'lg',
    fontSize: 'sm'
  },
  
  TABLET: {
    paymentsPerPage: 15,
    modalMaxWidth: '90%',
    buttonSize: 'md',
    fontSize: 'base'
  },
  
  DESKTOP: {
    paymentsPerPage: 20,
    modalMaxWidth: '2xl',
    buttonSize: 'md',
    fontSize: 'base'
  }
};

// Exportar configuración por defecto
export default {
  CURRENCY_CONFIG,
  PAYMENT_METHODS,
  PAYMENT_TYPES,
  PAYMENT_STATUSES,
  TRANSFER_PRIORITY_CONFIG,
  PAYMENT_PERMISSIONS,
  TIME_CONFIG,
  UI_CONFIG,
  VALIDATION_MESSAGES,
  REJECTION_REASONS,
  MEMBERSHIP_CONFIG,
  PAYMENT_UTILS,
  DEVICE_CONFIG
};

/*
DOCUMENTACIÓN DEL ARCHIVO paymentConfig.js

PROPÓSITO:
Centralizar todas las configuraciones, constantes y utilidades del sistema de pagos
del gimnasio guatemalteco. Facilita el mantenimiento, consistencia y escalabilidad
del sistema al tener un único punto de verdad para todas las configuraciones.

SECCIONES PRINCIPALES:

🏦 CONFIGURACIÓN DE MONEDA:
- Configuración específica para quetzales guatemaltecos (GTQ)
- Formato de moneda con símbolo Q
- Opciones de localización para Guatemala (es-GT)
- Separadores de miles y decimales apropiados

💳 MÉTODOS DE PAGO:
- Efectivo: Disponible inmediatamente en recepción
- Tarjeta: Procesamiento con Stripe
- Transferencia: Requiere validación manual con cuentas guatemaltecas
- Pago móvil: En desarrollo (deshabilitado)

🎫 TIPOS DE PAGO:
- Membresía: Pagos recurrentes con requisitos específicos
- Pago diario: Acceso por día con precios diferenciados
- Pago múltiple: Múltiples días con descuentos por volumen
- Producto: Compras de tienda
- Servicio: Servicios adicionales
- Otro: Pagos misceláneos

📊 ESTADOS DE PAGO:
- Pendiente: Esperando procesamiento
- Procesando: En validación
- Completado: Exitoso
- Fallido: Error en procesamiento
- Cancelado: Cancelado por usuario/sistema
- Reembolsado: Dinero devuelto

⚡ CONFIGURACIÓN DE PRIORIDADES:
- Crítica: +72 horas (rojo)
- Alta: 48-72 horas (naranja)
- Media: 24-48 horas (amarillo)
- Normal: 0-24 horas (verde)

🔐 PERMISOS:
- Permisos granulares para cada acción
- Separación entre visualización, creación, modificación
- Permisos específicos para validación y activación

⏱️ CONFIGURACIÓN DE TIEMPOS:
- Intervalos de auto-refresh optimizados
- Timeouts de cache apropiados
- Umbrales de urgencia configurables
- Timeouts de procesamiento

🎨 CONFIGURACIÓN DE UI:
- Tamaños de paginación por dispositivo
- Configuración de modales responsivos
- Duraciones de notificaciones
- Configuración de animaciones

FUNCIONES UTILITARIAS INCLUIDAS:

formatCurrency(): Formatea montos en quetzales guatemaltecos
getPaymentMethodConfig(): Obtiene configuración de método de pago
getPaymentTypeConfig(): Obtiene configuración de tipo de pago
getPaymentStatusConfig(): Obtiene configuración de estado
getTransferPriority(): Calcula prioridad por tiempo de espera
validateAmount(): Valida montos según tipo de pago
calculateBulkDiscount(): Calcula descuentos por volumen
generateDescription(): Genera descripciones automáticas

BENEFICIOS DE LA CENTRALIZACIÓN:

MANTENIMIENTO:
- Un solo lugar para cambiar configuraciones
- Fácil actualización de precios y políticas
- Consistencia en toda la aplicación
- Reducción de duplicación de código

ESCALABILIDAD:
- Fácil agregar nuevos métodos de pago
- Extensible para nuevos tipos de membresía
- Configuración flexible por dispositivo
- Preparado para internacionalización

CONSISTENCIA:
- Colores y estilos uniformes
- Mensajes de validación coherentes
- Iconografía consistente
- Formatos de moneda estandarizados

INTEGRACIÓN CON OTROS ARCHIVOS:

COMPONENTES QUE LO USAN:
- PaymentsManager: Configuraciones principales
- TransferValidationView: Configuración de prioridades
- CashMembershipManager: Tipos y estados
- PaymentConfirmationModal: Razones de rechazo
- usePayments hook: Utilidades y configuraciones

SERVICIOS QUE LO USAN:
- paymentService: Configuraciones de validación
- apiService: Configuraciones de formateo
- Componentes de UI: Configuraciones visuales

CONTEXTS QUE LO USAN:
- AppContext: Configuraciones de moneda
- AuthContext: Configuraciones de permisos

CARACTERÍSTICAS ESPECÍFICAS PARA GUATEMALA:

MONEDA NACIONAL:
- Quetzal guatemalteco (GTQ) como única moneda
- Símbolo Q reconocido localmente
- Formato de moneda apropiado (Q 150.00)

BANCOS LOCALES:
- Banco Industrial y G&T Continental
- Cuentas bancarias configuradas
- Soporte para transferencias locales

PRECIOS LOCALES:
- Rangos de precios apropiados para el mercado
- Descuentos por estudiantes y tercera edad
- Precios competitivos para el sector

USO EN DESARROLLO:

IMPORTACIÓN:
import { PAYMENT_METHODS, CURRENCY_CONFIG } from '../config/paymentConfig';

EJEMPLO DE USO:
const method = PAYMENT_METHODS.transfer;
const formatted = PAYMENT_UTILS.formatCurrency(350);
const priority = PAYMENT_UTILS.getTransferPriority(48);

VALIDACIÓN:
const validation = PAYMENT_UTILS.validateAmount(100, 'daily');

Este archivo es fundamental para mantener la coherencia y facilitar
el crecimiento del sistema de pagos del gimnasio guatemalteco.
*/