// Autor: Alexander Echeverria
// Archivo: src/hooks/useTranslation.js
// PROPÓSITO: Hook para traducir automáticamente textos del backend de inglés a español

import { useMemo } from 'react';

// DICCIONARIO DE TRADUCCIONES ESPECÍFICO PARA EL GIMNASIO
const MEMBERSHIP_TRANSLATIONS = {
  // Tipos de membresías
  'monthly': 'Membresía Mensual',
  'daily': 'Pase Diario',
  'weekly': 'Membresía Semanal',
  'annual': 'Membresía Anual',
  'yearly': 'Membresía Anual',
  'quarterly': 'Membresía Trimestral',
  'biweekly': 'Membresía Quincenal',
  'lifetime': 'Membresía de por Vida',
  'trial': 'Membresía de Prueba',
  'premium': 'Membresía Premium',
  'basic': 'Membresía Básica',
  'standard': 'Membresía Estándar',
  'vip': 'Membresía VIP',
  'student': 'Membresía Estudiantil',
  'senior': 'Membresía Adulto Mayor',
  'family': 'Membresía Familiar',
  'couple': 'Membresía Pareja',
  'corporate': 'Membresía Corporativa',
  'unlimited': 'Membresía Ilimitada',
  'limited': 'Membresía Limitada',
  
  // Estados de membresías
  'active': 'Activa',
  'inactive': 'Inactiva',
  'expired': 'Vencida',
  'pending': 'Pendiente',
  'suspended': 'Suspendida',
  'cancelled': 'Cancelada',
  'pending_payment': 'Pendiente de Pago',
  'pending_validation': 'Pendiente de Validación',
  'draft': 'Borrador',
  'processing': 'Procesando',
  'completed': 'Completada',
  'failed': 'Fallida',
  'refunded': 'Reembolsada',
  'validated': 'Validada',
  'approved': 'Aprobada',
  'rejected': 'Rechazada',
  
  // Métodos de pago
  'cash': 'Efectivo',
  'card': 'Tarjeta',
  'credit_card': 'Tarjeta de Crédito',
  'debit_card': 'Tarjeta de Débito',
  'transfer': 'Transferencia',
  'bank_transfer': 'Transferencia Bancaria',
  'mobile_payment': 'Pago Móvil',
  'digital_wallet': 'Billetera Digital',
  'check': 'Cheque',
  'online': 'En Línea',
  'offline': 'Presencial',
  'stripe': 'Tarjeta (Stripe)',
  'paypal': 'PayPal',
  
  // Roles de usuario
  'admin': 'Administrador',
  'administrator': 'Administrador',
  'staff': 'Personal',
  'colaborador': 'Personal',
  'employee': 'Empleado',
  'client': 'Cliente',
  'customer': 'Cliente',
  'member': 'Miembro',
  'user': 'Usuario',
  'guest': 'Invitado',
  'trainer': 'Entrenador',
  'instructor': 'Instructor',
  'manager': 'Gerente',
  'owner': 'Propietario',
  
  // Duraciones
  'day': 'Día',
  'days': 'Días',
  'week': 'Semana',
  'weeks': 'Semanas',
  'month': 'Mes',
  'months': 'Meses',
  'year': 'Año',
  'years': 'Años',
  'lifetime': 'De por Vida',
  
  // Estados generales
  'enabled': 'Habilitado',
  'disabled': 'Deshabilitado',
  'available': 'Disponible',
  'unavailable': 'No Disponible',
  'visible': 'Visible',
  'hidden': 'Oculto',
  'public': 'Público',
  'private': 'Privado',
  'featured': 'Destacado',
  'popular': 'Popular',
  'recommended': 'Recomendado',
  'new': 'Nuevo',
  'updated': 'Actualizado',
  'created': 'Creado',
  'deleted': 'Eliminado',
  
  // Acciones y verbos
  'create': 'Crear',
  'created': 'Creado',
  'update': 'Actualizar',
  'updated': 'Actualizado',
  'delete': 'Eliminar',
  'deleted': 'Eliminado',
  'activate': 'Activar',
  'activated': 'Activado',
  'deactivate': 'Desactivar',
  'deactivated': 'Desactivado',
  'suspend': 'Suspender',
  'suspended': 'Suspendido',
  'resume': 'Reanudar',
  'resumed': 'Reanudado',
  'cancel': 'Cancelar',
  'cancelled': 'Cancelado',
  'renew': 'Renovar',
  'renewed': 'Renovado',
  'extend': 'Extender',
  'extended': 'Extendido',
  'expire': 'Vencer',
  'expired': 'Vencido',
  'validate': 'Validar',
  'validated': 'Validado',
  'approve': 'Aprobar',
  'approved': 'Aprobado',
  'reject': 'Rechazar',
  'rejected': 'Rechazado'
};

// Hook principal de traducción
export const useTranslation = () => {
  
  // Función para traducir una palabra o frase
  const translate = useMemo(() => {
    return (text, fallbackToOriginal = true) => {
      if (!text || typeof text !== 'string') {
        return text;
      }
      
      // Convertir a minúsculas para buscar en el diccionario
      const lowerText = text.toLowerCase().trim();
      
      // Buscar traducción exacta
      if (MEMBERSHIP_TRANSLATIONS[lowerText]) {
        return MEMBERSHIP_TRANSLATIONS[lowerText];
      }
      
      // Buscar traducciones parciales (para textos compuestos)
      let translatedText = text;
      Object.keys(MEMBERSHIP_TRANSLATIONS).forEach(key => {
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        if (regex.test(translatedText)) {
          translatedText = translatedText.replace(regex, MEMBERSHIP_TRANSLATIONS[key]);
        }
      });
      
      // Si encontramos alguna traducción, devolverla
      if (translatedText !== text) {
        return translatedText;
      }
      
      // Si no hay traducción y queremos fallback, devolver original
      if (fallbackToOriginal) {
        return text;
      }
      
      // Si no queremos fallback y no hay traducción, devolver null
      return null;
    };
  }, []);
  
  // Función específica para tipos de membresía
  const translateMembershipType = useMemo(() => {
    return (membership) => {
      // Si tiene un plan con nombre, usarlo (puede estar ya en español)
      if (membership?.plan?.name) {
        return membership.plan.name;
      }
      
      // Si tiene tipo, traducirlo
      if (membership?.type) {
        return translate(membership.type);
      }
      
      // Fallback
      return 'Membresía';
    };
  }, [translate]);
  
  // Función específica para estados de membresía
  const translateMembershipStatus = useMemo(() => {
    return (status) => {
      return translate(status) || status;
    };
  }, [translate]);
  
  // Función específica para métodos de pago
  const translatePaymentMethod = useMemo(() => {
    return (method) => {
      return translate(method) || method;
    };
  }, [translate]);
  
  // Función para traducir objetos completos
  const translateObject = useMemo(() => {
    return (obj, fieldsToTranslate = []) => {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }
      
      const translated = { ...obj };
      
      fieldsToTranslate.forEach(field => {
        if (translated[field]) {
          translated[field] = translate(translated[field]);
        }
      });
      
      return translated;
    };
  }, [translate]);
  
  // Función para detectar si un texto está en inglés
  const isEnglish = useMemo(() => {
    return (text) => {
      if (!text || typeof text !== 'string') {
        return false;
      }
      
      const lowerText = text.toLowerCase().trim();
      return Object.keys(MEMBERSHIP_TRANSLATIONS).includes(lowerText);
    };
  }, []);
  
  return {
    translate,
    translateMembershipType,
    translateMembershipStatus,
    translatePaymentMethod,
    translateObject,
    isEnglish
  };
};

// Hook específico para membresías
export const useMembershipTranslation = () => {
  const { translateMembershipType, translateMembershipStatus, translatePaymentMethod } = useTranslation();
  
  const translateMembership = useMemo(() => {
    return (membership) => {
      if (!membership) return membership;
      
      return {
        ...membership,
        translatedType: translateMembershipType(membership),
        translatedStatus: translateMembershipStatus(membership.status),
        translatedPaymentMethod: membership.paymentMethod ? 
          translatePaymentMethod(membership.paymentMethod) : null
      };
    };
  }, [translateMembershipType, translateMembershipStatus, translatePaymentMethod]);
  
  return {
    translateMembershipType,
    translateMembershipStatus,
    translatePaymentMethod,
    translateMembership
  };
};

export default useTranslation;