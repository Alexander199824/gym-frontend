// Autor: Alexander Echeverria
// src/components/memberships/MembershipCard.js
// FUNCIÓN: Componente para mostrar información de membresías - CON TRADUCCIÓN AUTOMÁTICA
// USADO EN: ClientDashboard, páginas de membresías

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  CreditCard, 
  AlertCircle, 
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  User,
  Banknote,
  Loader2
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useMembershipTranslation } from '../../hooks/useTranslation';
import apiService from '../../services/apiService';

// FUNCIÓN HELPER: Convertir precio a número y formatear de forma segura
const formatPrice = (price) => {
  const numPrice = parseFloat(price) || 0;
  return numPrice.toFixed(2);
};

const MembershipCard = ({ 
  membership, 
  showActions = false,
  isOwner = false,
  onRenew = null,
  onCancel = null,
  onEdit = null,
  className = ''
}) => {
  const { formatCurrency, formatDate, showError } = useApp();
  const { translateMembershipType, translateMembershipStatus, translatePaymentMethod } = useMembershipTranslation();
  
  // Estados para datos dinámicos del backend
  const [gymConfig, setGymConfig] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  
  // Cargar configuración del gimnasio y datos de contacto al montar
  useEffect(() => {
    loadGymConfiguration();
  }, []);

  const loadGymConfiguration = async () => {
    try {
      setLoadingConfig(true);
      
      // Obtener configuración del gimnasio del backend
      const [configResponse, contactResponse] = await Promise.all([
        apiService.getGymConfig(),
        apiService.getGymContactInfo() // Nuevo endpoint necesario
      ]);
      
      if (configResponse?.success) {
        setGymConfig(configResponse.data);
      }
      
      if (contactResponse?.success) {
        setContactInfo(contactResponse.data);
      }
      
    } catch (error) {
      console.error('Error cargando configuración del gimnasio:', error);
      showError('Error cargando información del gimnasio');
    } finally {
      setLoadingConfig(false);
    }
  };
  
  // Calcular días hasta vencimiento
  const getDaysUntilExpiry = (endDate) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  const daysUntilExpiry = getDaysUntilExpiry(membership.endDate);
  
  // Estado de la membresía - DINÁMICO basado en backend
  const getStatusConfig = () => {
    // Usar traducción automática del backend
    const translatedStatus = translateMembershipStatus(membership.status);
    
    // Estados específicos que vienen del backend
    switch (membership.status) {
      case 'active':
        if (daysUntilExpiry < 0) {
          return {
            label: translatedStatus || 'Vencida',
            color: 'red',
            bg: 'bg-red-50',
            text: 'text-red-700',
            border: 'border-red-200',
            icon: XCircle
          };
        } else if (daysUntilExpiry <= 3) {
          return {
            label: translatedStatus || 'Por vencer',
            color: 'yellow',
            bg: 'bg-yellow-50',
            text: 'text-yellow-700',
            border: 'border-yellow-200',
            icon: AlertCircle
          };
        } else if (daysUntilExpiry <= 7) {
          return {
            label: translatedStatus || 'Vence pronto',
            color: 'orange',
            bg: 'bg-orange-50',
            text: 'text-orange-700',
            border: 'border-orange-200',
            icon: Clock
          };
        } else {
          return {
            label: translatedStatus || 'Activa',
            color: 'green',
            bg: 'bg-green-50',
            text: 'text-green-700',
            border: 'border-green-200',
            icon: CheckCircle
          };
        }
      case 'pending_validation':
        return {
          label: translatedStatus || 'Pendiente de validación',
          color: 'yellow',
          bg: 'bg-yellow-50',
          text: 'text-yellow-700',
          border: 'border-yellow-200',
          icon: Clock
        };
      case 'pending_payment':
        return {
          label: translatedStatus || 'Pendiente de pago',
          color: 'blue',
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          icon: AlertCircle
        };
      default:
        return {
          label: translatedStatus || 'Estado desconocido',
          color: 'gray',
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          icon: AlertCircle
        };
    }
  };
  
  const statusConfig = getStatusConfig();
  
  // Progreso de la membresía
  const calculateProgress = () => {
    const start = new Date(membership.startDate);
    const end = new Date(membership.endDate);
    const now = new Date();
    
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const usedDays = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
    
    return Math.min((usedDays / totalDays) * 100, 100);
  };
  
  const progress = calculateProgress();
  
  // Función para obtener tipo de membresía - DINÁMICO
  const getMembershipTypeName = () => {
    // Usar traducción del backend
    const translatedType = translateMembershipType(membership);
    
    // Si hay plan con nombre, usarlo
    if (membership.plan?.name) {
      return membership.plan.name;
    }
    
    // Usar traducción del backend o tipo original
    return translatedType || membership.type || 'Membresía';
  };

  // Función para traducir método de pago - DINÁMICO
  const getPaymentMethodName = () => {
    if (!membership.paymentMethod) return 'No especificado';
    
    // Usar traducción automática del backend
    const translated = translatePaymentMethod(membership.paymentMethod);
    
    // Usar traducción del backend o valor original
    return translated || membership.paymentMethod;
  };

  // Mostrar loader mientras carga configuración
  if (loadingConfig) {
    return (
      <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600 mr-2" />
          <span className="text-gray-600">Cargando información...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      bg-white rounded-lg shadow-lg border ${statusConfig.border} p-6 
      transition-all duration-200 hover:shadow-xl
      ${className}
    `}>
      
      {/* ENCABEZADO CON INFORMACIÓN DINÁMICA */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${statusConfig.bg}
          `}>
            <CreditCard className={`w-5 h-5 ${statusConfig.text}`} />
          </div>
          
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {getMembershipTypeName()}
            </h3>
            <p className="text-sm text-gray-600">
              ID: {membership.id.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center">
          <statusConfig.icon className={`w-5 h-5 ${statusConfig.text} mr-2`} />
          <span className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${statusConfig.bg} ${statusConfig.text}
          `}>
            {statusConfig.label}
          </span>
        </div>
      </div>
      
      {/* INFORMACIÓN DEL USUARIO (si no es owner) */}
      {!isOwner && membership.user && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <User className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-900">
              {membership.user.firstName} {membership.user.lastName}
            </span>
            <span className="ml-2 text-sm text-gray-500">
              {membership.user.email}
            </span>
          </div>
        </div>
      )}
      
      {/* INFORMACIÓN DE FECHAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <Calendar className="w-4 h-4 mr-2" />
            Fecha de inicio
          </div>
          <p className="text-sm font-medium text-gray-900">
            {formatDate(membership.startDate)}
          </p>
        </div>
        
        <div>
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <Clock className="w-4 h-4 mr-2" />
            Fecha de vencimiento
          </div>
          <p className="text-sm font-medium text-gray-900">
            {formatDate(membership.endDate)}
          </p>
        </div>
      </div>
      
      {/* PRECIO - FORMATO DINÁMICO DESDE BACKEND */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Banknote className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm text-gray-600">Precio pagado:</span>
          </div>
          <span className="text-lg font-bold text-green-600">
            {/* Usar formatCurrency del backend */}
            {formatCurrency(membership.price || membership.amount || 0)}
          </span>
        </div>
      </div>
      
      {/* PROGRESO - SOLO PARA MEMBRESÍAS ACTIVAS */}
      {membership.status === 'active' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progreso de la membresía:</span>
            <span className="text-sm font-medium text-gray-900">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                daysUntilExpiry < 0 ? 'bg-red-500' :
                daysUntilExpiry <= 3 ? 'bg-yellow-500' :
                daysUntilExpiry <= 7 ? 'bg-orange-500' :
                'bg-green-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* TIEMPO RESTANTE - SOLO PARA ACTIVAS */}
      {membership.status === 'active' && (
        <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
          <div className="text-center">
            {daysUntilExpiry < 0 ? (
              <div className="text-red-600">
                <p className="text-lg font-bold">¡Membresía vencida!</p>
                <p className="text-sm">
                  Venció hace {Math.abs(daysUntilExpiry)} día{Math.abs(daysUntilExpiry) !== 1 ? 's' : ''}
                </p>
                <p className="text-xs mt-1">Renueva para continuar usando el gimnasio</p>
              </div>
            ) : (
              <div className={
                daysUntilExpiry <= 3 ? 'text-red-600' :
                daysUntilExpiry <= 7 ? 'text-yellow-600' :
                'text-green-600'
              }>
                <p className="text-2xl font-bold">
                  {daysUntilExpiry} día{daysUntilExpiry !== 1 ? 's' : ''}
                </p>
                <p className="text-sm">
                  restante{daysUntilExpiry !== 1 ? 's' : ''}
                </p>
                {daysUntilExpiry <= 7 && (
                  <p className="text-xs mt-1">
                    {daysUntilExpiry <= 3 ? '⚠️ Renueva pronto' : '📅 Considera renovar'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ESTADO DE VALIDACIÓN PARA TRANSFERENCIAS */}
      {membership.status === 'pending_validation' && (
        <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Membresía pendiente de validación
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Nuestro equipo está validando tu pago. Te notificaremos cuando esté lista.
              </p>
              {contactInfo?.supportEmail && (
                <p className="text-xs text-yellow-700 mt-1">
                  ¿Dudas? Contacta: {contactInfo.supportEmail}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ESTADO DE PAGO PENDIENTE PARA EFECTIVO */}
      {membership.status === 'pending_payment' && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <Banknote className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Completa tu pago en el gimnasio
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Visita nuestras instalaciones para activar tu membresía.
              </p>
              {gymConfig?.location && (
                <p className="text-xs text-blue-700 mt-1">
                  📍 {gymConfig.location}
                </p>
              )}
              {gymConfig?.businessHours && (
                <p className="text-xs text-blue-700 mt-1">
                  🕒 {gymConfig.businessHours}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* RENOVACIÓN AUTOMÁTICA */}
      {membership.autoRenew && membership.status === 'active' && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <RefreshCw className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm text-blue-700 font-medium">
              Renovación automática activada
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Se renovará automáticamente el {formatDate(membership.endDate)}
          </p>
        </div>
      )}
      
      {/* MÉTODO DE PAGO - DINÁMICO */}
      {membership.paymentMethod && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Método de pago:</span>
            <span className="text-sm font-medium text-gray-900">
              {getPaymentMethodName()}
            </span>
          </div>
        </div>
      )}
      
      {/* NOTAS */}
      {membership.notes && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Notas:</strong> {membership.notes}
          </p>
        </div>
      )}
      
      {/* ACCIONES */}
      {showActions && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
          
          {/* Renovar - Solo para activas o vencidas */}
          {(membership.status === 'active' || membership.status === 'expired') && onRenew && (
            <button
              onClick={onRenew}
              className="btn-success btn-sm flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Renovar membresía
            </button>
          )}
          
          {/* Editar - Solo para no canceladas */}
          {onEdit && membership.status !== 'cancelled' && (
            <button
              onClick={onEdit}
              className="btn-secondary btn-sm flex items-center"
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar información
            </button>
          )}
          
          {/* Cancelar - Solo para activas */}
          {onCancel && membership.status === 'active' && (
            <button
              onClick={onCancel}
              className="btn-danger btn-sm flex items-center"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Cancelar membresía
            </button>
          )}
        </div>
      )}
      
    </div>
  );
};

// VARIANTE: Tarjeta compacta - TAMBIÉN DINÁMICA
export const CompactMembershipCard = ({ 
  membership, 
  onClick = null,
  showUser = false 
}) => {
  const { formatCurrency, formatDate } = useApp();
  const { translateMembershipType, translateMembershipStatus } = useMembershipTranslation();
  
  const daysUntilExpiry = Math.ceil((new Date(membership.endDate) - new Date()) / (1000 * 60 * 60 * 24));
  
  const getStatusColor = () => {
    if (membership.status === 'pending_validation') return 'text-yellow-500';
    if (membership.status === 'pending_payment') return 'text-blue-500';
    if (membership.status !== 'active') return 'text-gray-500';
    if (daysUntilExpiry < 0) return 'text-red-500';
    if (daysUntilExpiry <= 3) return 'text-yellow-500';
    return 'text-green-500';
  };
  
  const getStatusText = () => {
    // Usar traducción del backend
    const translatedStatus = translateMembershipStatus(membership.status);
    
    if (membership.status === 'pending_validation') return translatedStatus || 'Pendiente validación';
    if (membership.status === 'pending_payment') return translatedStatus || 'Pendiente pago';
    if (membership.status !== 'active') return translatedStatus || 'Inactiva';
    if (daysUntilExpiry < 0) return 'Vencida';
    if (daysUntilExpiry <= 3) return 'Por vencer';
    return 'Activa';
  };
  
  const getMembershipTypeName = () => {
    // Usar traducción del backend
    const translated = translateMembershipType(membership);
    
    if (membership.plan?.name) return membership.plan.name;
    return translated || membership.type || 'Membresía';
  };
  
  return (
    <div 
      className={`
        bg-white rounded-lg shadow border p-4 transition-all duration-200
        ${onClick ? 'hover:shadow-lg cursor-pointer hover:border-primary-300' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          {showUser && membership.user && (
            <p className="text-sm font-medium text-gray-900 mb-1">
              {membership.user.firstName} {membership.user.lastName}
            </p>
          )}
          <p className="text-sm font-semibold text-gray-800">
            {getMembershipTypeName()}
          </p>
          <p className="text-xs text-gray-600">
            Vence: {formatDate(membership.endDate)}
          </p>
        </div>
        
        <div className="text-right">
          <div className="flex items-center justify-end mb-1">
            <Banknote className="w-3 h-3 text-green-600 mr-1" />
            <p className="text-sm font-medium text-gray-900">
              {formatCurrency(membership.price || membership.amount || 0)}
            </p>
          </div>
          <p className={`text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </p>
          {membership.status === 'active' && daysUntilExpiry > 0 && (
            <p className="text-xs text-gray-500">
              {daysUntilExpiry} día{daysUntilExpiry !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembershipCard;


/*
DOCUMENTACIÓN DEL COMPONENTE MembershipCard

PROPÓSITO:
Este componente proporciona una interfaz visual completa para mostrar información
detallada de membresías del gimnasio. Presenta de manera clara el estado, progreso,
fechas importantes y acciones disponibles para cada membresía, facilitando la
gestión tanto para usuarios como para administradores.

FUNCIONALIDADES PRINCIPALES:
- Visualización completa de información de membresías
- Cálculo automático de días hasta vencimiento
- Indicadores visuales de estado con códigos de color
- Barra de progreso para membresías activas
- Sección de acciones configurables
- Información del usuario asociado (cuando aplica)
- Variante compacta para vistas de lista
- Indicadores de renovación automática

CONEXIONES CON OTROS ARCHIVOS:

CONTEXTS REQUERIDOS:
- AppContext (../../contexts/AppContext): Contexto principal de la aplicación
  - formatCurrency(): Formatea precios en quetzales
  - formatDate(): Formatea fechas en formato local

RUTAS DE NAVEGACIÓN:
- Link to="/dashboard/memberships/${membership.id}": Navegación a detalles de membresía
- Utiliza React Router para navegación entre páginas

COMPONENTES IMPORTADOS:
- Iconos de Lucide React: Calendar, Clock, CreditCard, AlertCircle, CheckCircle, 
  XCircle, RefreshCw, Eye, Edit, Trash2, User, Bird

ARCHIVOS QUE LO UTILIZAN:
- ClientDashboard: Panel principal de clientes
- Páginas de membresías: Listados y gestión de membresías
- Componentes de administración: Gestión administrativa

QUE MUESTRA AL USUARIO:
- Encabezado con icono de tarjeta de crédito y tipo de membresía (Mensual/Diaria)
- ID de membresía (últimos 8 caracteres)
- Estado visual con icono y etiqueta de color:
  - Verde: "Activa" (más de 7 días restantes)
  - Naranja: "Vence pronto" (7 días o menos)
  - Amarillo: "Por vencer" (3 días o menos)
  - Rojo: "Vencida" (fecha pasada)
  - Gris: "Suspendida" o "Cancelada"
- Información del usuario (nombre y email) cuando no es el propietario
- Sección de fechas mostrando:
  - Fecha de inicio con icono de calendario
  - Fecha de vencimiento con icono de reloj
- Precio en quetzales con icono de ave quetzal
- Barra de progreso visual para membresías activas
- Contador de días restantes con formato:
  - "X días restantes" (verde si >7, amarillo si ≤7, rojo si ≤3)
  - "¡Membresía vencida! Venció hace X días" (rojo)
- Indicador de renovación automática (azul) cuando está activada
- Sección de notas adicionales cuando existen
- Botones de acción disponibles:
  - "Ver detalles" con icono de ojo
  - "Renovar" con icono de refresh (membresías activas/vencidas)
  - "Editar" con icono de lápiz (membresías no canceladas)
  - "Cancelar" con icono de X (solo membresías activas)

VARIANTE COMPACTA:
- Versión reducida para listas con información esencial
- Muestra tipo de membresía, fecha de vencimiento y precio
- Incluye información del usuario cuando se solicita
- Estado simplificado con colores
- Precio con icono de quetzal en formato compacto

CÁLCULOS AUTOMÁTICOS:
- Días hasta vencimiento: Diferencia entre fecha actual y fecha de fin
- Progreso de membresía: Porcentaje de tiempo transcurrido
- Estado dinámico: Basado en días restantes y estado de la membresía

ESTADOS DE MEMBRESÍA SOPORTADOS:
- active: Membresía activa (con sub-estados por días restantes)
- expired: Membresía vencida
- suspended: Membresía suspendida temporalmente
- cancelled: Membresía cancelada permanentemente

PROPS CONFIGURABLES:
- membership: Objeto con datos de la membresía
- showActions: Mostrar botones de acción (boolean)
- isOwner: Si el usuario actual es el dueño (boolean)
- onRenew: Función callback para renovación
- onCancel: Función callback para cancelación
- onEdit: Función callback para edición
- className: Clases CSS adicionales

CASOS DE USO EN EL GIMNASIO:
- Dashboard de clientes: Visualización de membresía actual
- Panel administrativo: Gestión de membresías de usuarios
- Listados de membresías: Vista de múltiples membresías
- Procesamiento de renovaciones: Gestión de pagos en quetzales
- Seguimiento de vencimientos: Alertas y notificaciones
- Gestión de suspensiones: Control de acceso al gimnasio

CARACTERÍSTICAS VISUALES:
- Diseño responsivo con grid adaptativo
- Animaciones suaves en hover y transiciones
- Códigos de color intuitivos para estados
- Tipografía clara y jerarquizada
- Espaciado consistente y legible

INTEGRACIÓN FINANCIERA:
- Formateo de precios en quetzales guatemaltecos
- Icono de ave quetzal para identificar moneda local
- Compatibilidad con sistema de pagos del gimnasio
- Seguimiento de transacciones y renovaciones

ACCESIBILIDAD:
- Iconos descriptivos para cada sección
- Colores con suficiente contraste
- Estructura semántica clara
- Información textual complementaria

MANEJO DE ERRORES:
- Estado "Desconocido" para casos no contemplados
- Validación de fechas y cálculos
- Fallbacks para datos faltantes
- Manejo graceful de props opcionales

Este componente es fundamental para la experiencia de usuario en la gestión
de membresías del gimnasio, proporcionando toda la información necesaria de
manera clara y accesible, con énfasis especial en el manejo de la moneda
local (quetzales) y los flujos típicos de un gimnasio guatemalteco.
*/