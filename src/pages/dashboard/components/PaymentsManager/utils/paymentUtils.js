// src/pages/dashboard/components/PaymentsManager/utils/paymentUtils.js
// Author: Alexander Echeverria
// Utilidades y constantes compartidas para el sistema de gestión de pagos
// Incluye funciones de formateo, validación y configuraciones del sistema

// Constantes del sistema de pagos
export const PAYMENT_CONSTANTS = {
  // Configuración de paginación
  PAYMENTS_PER_PAGE: 20,
  MAX_SEARCH_LENGTH: 100,
  
  // Límites de tiempo para prioridades
  URGENT_HOURS_THRESHOLD: 4,
  CRITICAL_HOURS_THRESHOLD: 24,
  HIGH_PRIORITY_HOURS_THRESHOLD: 12,
  
  // Estados de pago
  PAYMENT_STATUSES: {
    COMPLETED: 'completed',
    PENDING: 'pending',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  },
  
  // Métodos de pago
  PAYMENT_METHODS: {
    CASH: 'cash',
    CARD: 'card',
    TRANSFER: 'transfer',
    MOBILE: 'mobile'
  },
  
  // Niveles de prioridad
  PRIORITY_LEVELS: {
    NORMAL: 'normal',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
    URGENT: 'urgent'
  },
  
  // Configuración de vista
  VIEW_MODES: {
    GRID: 'grid',
    LIST: 'list'
  },
  
  // Opciones de ordenamiento
  SORT_OPTIONS: {
    WAITING_TIME: 'waiting_time',
    AMOUNT: 'amount',
    NAME: 'name',
    CREATED: 'created',
    DATE: 'date'
  }
};

// Mapeo de métodos de pago a iconos
export const PAYMENT_METHOD_ICONS = {
  [PAYMENT_CONSTANTS.PAYMENT_METHODS.CASH]: 'Banknote',
  [PAYMENT_CONSTANTS.PAYMENT_METHODS.CARD]: 'CreditCard',
  [PAYMENT_CONSTANTS.PAYMENT_METHODS.TRANSFER]: 'Building',
  [PAYMENT_CONSTANTS.PAYMENT_METHODS.MOBILE]: 'Building'
};

// Mapeo de estados a colores CSS
export const PAYMENT_STATUS_COLORS = {
  [PAYMENT_CONSTANTS.PAYMENT_STATUSES.COMPLETED]: 'text-green-600 bg-green-100',
  [PAYMENT_CONSTANTS.PAYMENT_STATUSES.PENDING]: 'text-yellow-600 bg-yellow-100',
  [PAYMENT_CONSTANTS.PAYMENT_STATUSES.FAILED]: 'text-red-600 bg-red-100',
  [PAYMENT_CONSTANTS.PAYMENT_STATUSES.CANCELLED]: 'text-gray-600 bg-gray-100'
};

// Mapeo de prioridades a configuraciones visuales
export const PRIORITY_CONFIGS = {
  [PAYMENT_CONSTANTS.PRIORITY_LEVELS.NORMAL]: {
    color: 'green',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    textClass: 'text-green-800',
    label: 'Normal',
    description: 'Tiempo normal de procesamiento'
  },
  [PAYMENT_CONSTANTS.PRIORITY_LEVELS.MEDIUM]: {
    color: 'yellow',
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-200',
    textClass: 'text-yellow-800',
    label: 'Media',
    description: 'Requiere atención pronto'
  },
  [PAYMENT_CONSTANTS.PRIORITY_LEVELS.HIGH]: {
    color: 'orange',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-200',
    textClass: 'text-orange-800',
    label: 'Alta',
    description: 'Requiere atención prioritaria'
  },
  [PAYMENT_CONSTANTS.PRIORITY_LEVELS.CRITICAL]: {
    color: 'red',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    textClass: 'text-red-800',
    label: 'Crítica',
    description: 'Requiere atención inmediata'
  },
  [PAYMENT_CONSTANTS.PRIORITY_LEVELS.URGENT]: {
    color: 'orange',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-200',
    textClass: 'text-orange-800',
    label: 'Urgente',
    description: 'Tiempo de espera excedido'
  }
};

// Funciones de utilidad para formateo
export const formatUtils = {
  
  // Formatear nombres de métodos de pago para mostrar
  formatPaymentMethod: (method) => {
    const methodLabels = {
      [PAYMENT_CONSTANTS.PAYMENT_METHODS.CASH]: 'Efectivo',
      [PAYMENT_CONSTANTS.PAYMENT_METHODS.CARD]: 'Tarjeta',
      [PAYMENT_CONSTANTS.PAYMENT_METHODS.TRANSFER]: 'Transferencia',
      [PAYMENT_CONSTANTS.PAYMENT_METHODS.MOBILE]: 'Móvil'
    };
    return methodLabels[method] || 'Desconocido';
  },
  
  // Formatear estados de pago para mostrar
  formatPaymentStatus: (status) => {
    const statusLabels = {
      [PAYMENT_CONSTANTS.PAYMENT_STATUSES.COMPLETED]: 'Completado',
      [PAYMENT_CONSTANTS.PAYMENT_STATUSES.PENDING]: 'Pendiente',
      [PAYMENT_CONSTANTS.PAYMENT_STATUSES.FAILED]: 'Fallido',
      [PAYMENT_CONSTANTS.PAYMENT_STATUSES.CANCELLED]: 'Cancelado'
    };
    return statusLabels[status] || 'Completado';
  },
  
  // Formatear tiempo de espera en formato legible
  formatWaitingTime: (hours) => {
    if (!hours || hours < 0) return '0.0h';
    
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours.toFixed(1)}h`;
    }
    
    return `${hours.toFixed(1)}h`;
  },
  
  // Generar iniciales de un nombre
  generateInitials: (name) => {
    if (!name) return 'A';
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
};

// Funciones de validación
export const validationUtils = {
  
  // Validar que un email tenga formato correcto
  isValidEmail: (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // Validar que un teléfono tenga formato guatemalteco
  isValidGuatemalaPhone: (phone) => {
    if (!phone) return false;
    // Formatos válidos: +502XXXXXXXX, 502XXXXXXXX, XXXXXXXX
    const phoneRegex = /^(\+?502)?[2-9]\d{7}$/;
    return phoneRegex.test(phone.replace(/\s|-/g, ''));
  },
  
  // Validar que un monto sea válido
  isValidAmount: (amount) => {
    return amount && !isNaN(amount) && parseFloat(amount) > 0;
  },
  
  // Validar términos de búsqueda
  isValidSearchTerm: (term) => {
    return term && term.length >= 2 && term.length <= PAYMENT_CONSTANTS.MAX_SEARCH_LENGTH;
  }
};

// Funciones de cálculo de prioridad
export const priorityUtils = {
  
  // Calcular prioridad basada en tiempo de espera
  calculatePriority: (hoursWaiting) => {
    if (!hoursWaiting || hoursWaiting < 0) {
      return PAYMENT_CONSTANTS.PRIORITY_LEVELS.NORMAL;
    }
    
    if (hoursWaiting >= PAYMENT_CONSTANTS.CRITICAL_HOURS_THRESHOLD) {
      return PAYMENT_CONSTANTS.PRIORITY_LEVELS.CRITICAL;
    }
    
    if (hoursWaiting >= PAYMENT_CONSTANTS.HIGH_PRIORITY_HOURS_THRESHOLD) {
      return PAYMENT_CONSTANTS.PRIORITY_LEVELS.HIGH;
    }
    
    if (hoursWaiting >= PAYMENT_CONSTANTS.URGENT_HOURS_THRESHOLD) {
      return PAYMENT_CONSTANTS.PRIORITY_LEVELS.URGENT;
    }
    
    return PAYMENT_CONSTANTS.PRIORITY_LEVELS.NORMAL;
  },
  
  // Obtener configuración visual de una prioridad
  getPriorityConfig: (priority) => {
    return PRIORITY_CONFIGS[priority] || PRIORITY_CONFIGS[PAYMENT_CONSTANTS.PRIORITY_LEVELS.NORMAL];
  },
  
  // Determinar si una prioridad es urgente
  isUrgentPriority: (priority) => {
    return [
      PAYMENT_CONSTANTS.PRIORITY_LEVELS.URGENT,
      PAYMENT_CONSTANTS.PRIORITY_LEVELS.HIGH,
      PAYMENT_CONSTANTS.PRIORITY_LEVELS.CRITICAL
    ].includes(priority);
  }
};

// Funciones de filtrado
export const filterUtils = {
  
  // Filtrar pagos por término de búsqueda
  filterPaymentsBySearch: (payments, searchTerm) => {
    if (!searchTerm || !validationUtils.isValidSearchTerm(searchTerm)) {
      return payments;
    }
    
    const term = searchTerm.toLowerCase();
    return payments.filter(payment => {
      const searchableText = [
        payment.user?.name,
        payment.user?.firstName,
        payment.user?.lastName,
        payment.user?.email,
        payment.concept,
        payment.reference
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchableText.includes(term);
    });
  },
  
  // Filtrar membresías por prioridad
  filterMembershipsByPriority: (memberships, priorityFilter) => {
    if (priorityFilter === 'all') return memberships;
    
    return memberships.filter(membership => {
      const priority = priorityUtils.calculatePriority(membership.hoursWaiting || 0);
      return priority === priorityFilter;
    });
  },
  
  // Ordenar items por criterio especificado
  sortItems: (items, sortBy) => {
    const sortedItems = [...items];
    
    switch (sortBy) {
      case PAYMENT_CONSTANTS.SORT_OPTIONS.WAITING_TIME:
        return sortedItems.sort((a, b) => (b.hoursWaiting || 0) - (a.hoursWaiting || 0));
      
      case PAYMENT_CONSTANTS.SORT_OPTIONS.AMOUNT:
        return sortedItems.sort((a, b) => (b.amount || b.price || 0) - (a.amount || a.price || 0));
      
      case PAYMENT_CONSTANTS.SORT_OPTIONS.NAME:
        return sortedItems.sort((a, b) => {
          const nameA = a.user?.name || a.user?.firstName || '';
          const nameB = b.user?.name || b.user?.firstName || '';
          return nameA.localeCompare(nameB);
        });
      
      case PAYMENT_CONSTANTS.SORT_OPTIONS.CREATED:
        return sortedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      case PAYMENT_CONSTANTS.SORT_OPTIONS.DATE:
        return sortedItems.sort((a, b) => {
          const dateA = new Date(a.paymentDate || a.createdAt);
          const dateB = new Date(b.paymentDate || b.createdAt);
          return dateB - dateA;
        });
      
      default:
        return sortedItems;
    }
  }
};

// Funciones de análisis de datos
export const analyticsUtils = {
  
  // Calcular estadísticas básicas de un array de números
  calculateBasicStats: (numbers) => {
    if (!numbers || numbers.length === 0) {
      return { sum: 0, avg: 0, min: 0, max: 0, count: 0 };
    }
    
    const sum = numbers.reduce((acc, num) => acc + (num || 0), 0);
    const count = numbers.length;
    const avg = sum / count;
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    
    return { sum, avg, min, max, count };
  },
  
  // Calcular estadísticas de membresías en efectivo
  calculateCashMembershipStats: (memberships) => {
    if (!memberships || memberships.length === 0) {
      return {
        total: 0,
        urgent: 0,
        totalAmount: 0,
        avgAmount: 0,
        avgHours: 0
      };
    }
    
    const total = memberships.length;
    const urgent = memberships.filter(m => 
      priorityUtils.isUrgentPriority(priorityUtils.calculatePriority(m.hoursWaiting || 0))
    ).length;
    
    const amounts = memberships.map(m => m.price || 0);
    const hours = memberships.map(m => m.hoursWaiting || 0);
    
    const amountStats = analyticsUtils.calculateBasicStats(amounts);
    const hourStats = analyticsUtils.calculateBasicStats(hours);
    
    return {
      total,
      urgent,
      totalAmount: amountStats.sum,
      avgAmount: amountStats.avg,
      avgHours: hourStats.avg
    };
  }
};

// Funciones de utilidad para componentes
export const componentUtils = {
  
  // Determinar clases CSS basadas en prioridad
  getPriorityClasses: (priority) => {
    const config = priorityUtils.getPriorityConfig(priority);
    return `${config.bgClass} ${config.borderClass} ${config.textClass}`;
  },
  
  // Determinar si debe mostrar indicador de urgencia
  shouldShowUrgencyIndicator: (hoursWaiting) => {
    const priority = priorityUtils.calculatePriority(hoursWaiting);
    return priorityUtils.isUrgentPriority(priority);
  },
  
  // Generar mensaje de confirmación para activación
  generateActivationMessage: (membershipData, formatCurrency) => {
    const amount = formatCurrency(membershipData?.price || 0);
    const client = membershipData?.user?.name || 'cliente';
    return `¿Confirmar que recibiste ${amount} en efectivo de ${client}?`;
  }
};

// Exportar todo como un objeto principal también
export default {
  PAYMENT_CONSTANTS,
  PAYMENT_METHOD_ICONS,
  PAYMENT_STATUS_COLORS,
  PRIORITY_CONFIGS,
  formatUtils,
  validationUtils,
  priorityUtils,
  filterUtils,
  analyticsUtils,
  componentUtils
};

// Este archivo centraliza todas las utilidades, constantes y funciones auxiliares
// del sistema de gestión de pagos para evitar duplicación de código
// Facilita el mantenimiento y asegura consistencia en todo el sistema