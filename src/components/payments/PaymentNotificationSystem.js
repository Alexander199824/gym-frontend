2// Autor: Alexander Echeverria
// src/components/payments/PaymentNotificationSystem.js
// FUNCIÓN: Sistema integral de notificaciones para pagos y autorizaciones
// USO: Alertas, notificaciones push, y comunicación con usuarios

import React, { useState, useEffect, useContext, createContext } from 'react';
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  Bird,
  Building,
  Banknote,
  CreditCard,
  User,
  X,
  Eye,
  Check,
  Volume2,
  VolumeX,
  Settings,
  Filter,
  MoreVertical,
  Calendar,
  Timer,
  Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { usePayments } from '../../hooks/usePayments';
import apiService from '../../services/apiService';

// ================================
// 🔔 CONTEXT PARA NOTIFICACIONES
// ================================
const PaymentNotificationContext = createContext({});

export const usePaymentNotifications = () => {
  const context = useContext(PaymentNotificationContext);
  if (!context) {
    throw new Error('usePaymentNotifications debe usarse dentro de PaymentNotificationProvider');
  }
  return context;
};

// ================================
// 🔔 PROVIDER DE NOTIFICACIONES
// ================================
export const PaymentNotificationProvider = ({ children }) => {
  const { user, hasPermission } = useAuth();
  const { showSuccess, showError, formatDate, formatCurrency } = useApp();
  
  // Estados de notificaciones
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'transfers', 'cash', 'system'

  // Referencias para audio
  const audioRef = React.useRef(null);

  // GENERAR NOTIFICACIÓN
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Máximo 50 notificaciones
    setUnreadCount(prev => prev + 1);

    // Reproducir sonido si está habilitado
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.warn);
    }

    return newNotification.id;
  };

  // MARCAR COMO LEÍDA
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // MARCAR TODAS COMO LEÍDAS
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  // ELIMINAR NOTIFICACIÓN
  const removeNotification = (notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  };

  // LIMPIAR TODAS LAS NOTIFICACIONES
  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // OBTENER NOTIFICACIONES FILTRADAS
  const getFilteredNotifications = () => {
    return notifications.filter(notification => {
      switch (filter) {
        case 'unread':
          return !notification.read;
        case 'transfers':
          return notification.category === 'transfer';
        case 'cash':
          return notification.category === 'cash_membership';
        case 'system':
          return notification.category === 'system';
        default:
          return true;
      }
    });
  };

  // ================================
  // 🔔 FUNCIONES DE NOTIFICACIÓN ESPECÍFICAS
  // ================================

  // Notificación de transferencia aprobada
  const notifyTransferApproved = (transferData) => {
    return addNotification({
      type: 'success',
      category: 'transfer',
      title: 'Transferencia Aprobada',
      message: `Transferencia de ${transferData.clientName} por ${formatCurrency(transferData.amount)} ha sido aprobada`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      actions: [
        {
          label: 'Ver detalles',
          action: () => console.log('Ver transferencia:', transferData.transferId)
        }
      ],
      data: transferData
    });
  };

  // Notificación de transferencia rechazada
  const notifyTransferRejected = (transferData) => {
    return addNotification({
      type: 'error',
      category: 'transfer',
      title: 'Transferencia Rechazada',
      message: `Transferencia de ${transferData.clientName} por ${formatCurrency(transferData.amount)} ha sido rechazada`,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      actions: [
        {
          label: 'Ver razón',
          action: () => console.log('Ver razón:', transferData.reason)
        }
      ],
      data: transferData
    });
  };

  // Notificación de membresía activada
  const notifyMembershipActivated = (membershipData) => {
    return addNotification({
      type: 'success',
      category: 'cash_membership',
      title: 'Membresía Activada',
      message: `Membresía de ${membershipData.clientName} activada exitosamente - Pago: ${formatCurrency(membershipData.amount)}`,
      icon: Banknote,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      actions: [
        {
          label: 'Ver cliente',
          action: () => console.log('Ver cliente:', membershipData.clientName)
        }
      ],
      data: membershipData
    });
  };

  // Notificación de transferencia urgente
  const notifyUrgentTransfer = (transferData) => {
    return addNotification({
      type: 'warning',
      category: 'transfer',
      title: 'Transferencia Urgente',
      message: `Transferencia de ${transferData.clientName} lleva ${transferData.hoursWaiting}h esperando validación`,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      priority: 'high',
      actions: [
        {
          label: 'Validar ahora',
          action: () => console.log('Ir a validación:', transferData.transferId)
        }
      ],
      data: transferData
    });
  };

  // Notificación de nuevo pago
  const notifyNewPayment = (paymentData) => {
    return addNotification({
      type: 'info',
      category: 'payment',
      title: 'Nuevo Pago Registrado',
      message: `Pago ${paymentData.paymentMethod} por ${formatCurrency(paymentData.amount)} registrado`,
      icon: CreditCard,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      data: paymentData
    });
  };

  // Notificación de meta alcanzada
  const notifyGoalAchieved = (goalData) => {
    return addNotification({
      type: 'success',
      category: 'system',
      title: '🎉 Meta Alcanzada',
      message: `¡Felicitaciones! Meta de ${goalData.type} alcanzada: ${formatCurrency(goalData.amount)}`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      priority: 'high',
      celebration: true,
      data: goalData
    });
  };

  // Notificación de error de sistema
  const notifySystemError = (errorData) => {
    return addNotification({
      type: 'error',
      category: 'system',
      title: 'Error del Sistema',
      message: errorData.message || 'Se ha producido un error en el sistema de pagos',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      priority: 'high',
      data: errorData
    });
  };

  const contextValue = {
    // Estado
    notifications: getFilteredNotifications(),
    unreadCount,
    soundEnabled,
    isOpen,
    filter,

    // Acciones
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    setIsOpen,
    setSoundEnabled,
    setFilter,

    // Notificaciones específicas
    notifyTransferApproved,
    notifyTransferRejected,
    notifyMembershipActivated,
    notifyUrgentTransfer,
    notifyNewPayment,
    notifyGoalAchieved,
    notifySystemError
  };

  return (
    <PaymentNotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Audio para notificaciones */}
      <audio
        ref={audioRef}
        preload="auto"
        style={{ display: 'none' }}
      >
        <source src="/sounds/notification.mp3" type="audio/mpeg" />
        <source src="/sounds/notification.ogg" type="audio/ogg" />
      </audio>
    </PaymentNotificationContext.Provider>
  );
};

// ================================
// 🔔 COMPONENTE DE CAMPANA DE NOTIFICACIONES
// ================================
export const PaymentNotificationBell = ({ className = "" }) => {
  const {
    unreadCount,
    isOpen,
    setIsOpen,
    soundEnabled,
    setSoundEnabled
  } = usePaymentNotifications();

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-colors ${
          unreadCount > 0
            ? 'text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100'
            : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100'
        }`}
        title={`${unreadCount} notificaciones sin leer`}
      >
        <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'animate-pulse' : ''}`} />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Indicador de sonido */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 text-xs"
        title={soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
      >
        {soundEnabled ? <Volume2 className="w-2 h-2" /> : <VolumeX className="w-2 h-2" />}
      </button>
    </div>
  );
};

// ================================
// 🔔 PANEL DE NOTIFICACIONES
// ================================
export const PaymentNotificationPanel = ({ maxHeight = "400px" }) => {
  const {
    notifications,
    unreadCount,
    isOpen,
    setIsOpen,
    filter,
    setFilter,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  } = usePaymentNotifications();

  const { formatDate, formatCurrency } = useApp();

  if (!isOpen) return null;

  // Filtros disponibles
  const filters = [
    { value: 'all', label: 'Todas', count: notifications.length },
    { value: 'unread', label: 'Sin leer', count: unreadCount },
    { value: 'transfers', label: 'Transferencias', count: notifications.filter(n => n.category === 'transfer').length },
    { value: 'cash', label: 'Efectivo', count: notifications.filter(n => n.category === 'cash_membership').length },
    { value: 'system', label: 'Sistema', count: notifications.filter(n => n.category === 'system').length }
  ];

  return (
    <div className="absolute right-0 top-full mt-2 w-96 max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Notificaciones
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
              {unreadCount}
            </span>
          )}
        </h3>
        
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filtros */}
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="flex space-x-1 overflow-x-auto">
          {filters.map((filterOption) => (
            <button
              key={filterOption.value}
              onClick={() => setFilter(filterOption.value)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === filterOption.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterOption.label}
              {filterOption.count > 0 && (
                <span className="ml-1">({filterOption.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Acciones */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Marcar todas como leídas
          </button>
          
          <button
            onClick={clearAll}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Limpiar todas
          </button>
        </div>
      )}

      {/* Lista de notificaciones */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No hay notificaciones</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onRemove={removeNotification}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ================================
// 🔔 COMPONENTE DE NOTIFICACIÓN INDIVIDUAL
// ================================
const NotificationItem = ({ notification, onMarkAsRead, onRemove, formatDate, formatCurrency }) => {
  const IconComponent = notification.icon || Info;
  
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative ${
        !notification.read ? 'bg-blue-50' : ''
      } ${notification.celebration ? 'animate-pulse' : ''}`}
      onClick={handleClick}
    >
      {/* Indicador de no leído */}
      {!notification.read && (
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
      )}

      <div className="flex items-start space-x-3 ml-4">
        
        {/* Icono */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${notification.bgColor}`}>
          <IconComponent className={`w-4 h-4 ${notification.color}`} />
        </div>
        
        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-medium text-gray-900 ${!notification.read ? 'font-semibold' : ''}`}>
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.message}
              </p>
              
              {/* Acciones */}
              {notification.actions && notification.actions.length > 0 && (
                <div className="flex items-center space-x-3 mt-2">
                  {notification.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.action();
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 ml-2">
              {/* Tiempo */}
              <span className="text-xs text-gray-500">
                {formatDate(notification.timestamp, 'HH:mm')}
              </span>
              
              {/* Botón de eliminar */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(notification.id);
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Eliminar notificación"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de prioridad */}
      {notification.priority === 'high' && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l"></div>
      )}
    </div>
  );
};

// ================================
// 🔔 HOOK PARA MONITOREAR PAGOS Y GENERAR NOTIFICACIONES
// ================================
export const usePaymentNotificationMonitor = () => {
  const { combinedStats } = usePayments({ autoRefresh: true, refreshInterval: 30000 });
  const {
    notifyTransferApproved,
    notifyTransferRejected,
    notifyMembershipActivated,
    notifyUrgentTransfer,
    notifyNewPayment,
    notifyGoalAchieved,
    notifySystemError
  } = usePaymentNotifications();

  // Estados para tracking de cambios
  const [previousStats, setPreviousStats] = useState({});

  useEffect(() => {
    if (Object.keys(previousStats).length === 0) {
      setPreviousStats(combinedStats);
      return;
    }

    // Detectar transferencias críticas
    if (combinedStats.urgentTransfers > previousStats.urgentTransfers) {
      console.log('Nueva transferencia crítica detectada');
      // Aquí podrías cargar más detalles y generar notificación específica
    }

    // Detectar cambios en membresías en efectivo
    if (combinedStats.pendingCashMemberships.count < previousStats.pendingCashMemberships.count) {
      console.log('Membresía en efectivo activada');
      // Notificación de membresía activada
    }

    // Detectar si se alcanzó una meta
    if (combinedStats.totalIncome >= 15000 && previousStats.totalIncome < 15000) {
      notifyGoalAchieved({
        type: 'ingresos mensuales',
        amount: combinedStats.totalIncome
      });
    }

    setPreviousStats(combinedStats);
  }, [combinedStats, previousStats, notifyGoalAchieved]);

  return {
    // Funciones para generar notificaciones desde componentes
    notifyTransferApproved,
    notifyTransferRejected,
    notifyMembershipActivated,
    notifyUrgentTransfer,
    notifyNewPayment,
    notifyGoalAchieved,
    notifySystemError
  };
};

// ================================
// 🔔 COMPONENTE PRINCIPAL - SISTEMA COMPLETO
// ================================
const PaymentNotificationSystem = ({ children }) => {
  return (
    <PaymentNotificationProvider>
      {children}
    </PaymentNotificationProvider>
  );
};

export default PaymentNotificationSystem;

/*
DOCUMENTACIÓN DEL SISTEMA DE NOTIFICACIONES DE PAGOS

PROPÓSITO:
Sistema completo de notificaciones para el sistema de pagos del gimnasio guatemalteco.
Proporciona alertas en tiempo real, notificaciones push, y comunicación efectiva
sobre eventos críticos de pagos, transferencias y membresías.

COMPONENTES PRINCIPALES:

🔔 PaymentNotificationProvider:
- Context provider para el sistema de notificaciones
- Maneja estado global de notificaciones
- Controla sonidos y configuraciones
- Proporciona funciones para generar notificaciones específicas

🔔 PaymentNotificationBell:
- Icono de campana con contador de notificaciones sin leer
- Indicador visual de nuevas notificaciones
- Control de sonido integrado
- Animaciones para llamar la atención

🔔 PaymentNotificationPanel:
- Panel desplegable con lista de notificaciones
- Sistema de filtros (todas, sin leer, transferencias, efectivo, sistema)
- Acciones para marcar como leídas y limpiar
- Scroll infinito para historial completo

🔔 NotificationItem:
- Componente individual para cada notificación
- Iconos contextuales por tipo de evento
- Acciones específicas por notificación
- Estados visuales (leída/sin leer, prioridad)

TIPOS DE NOTIFICACIONES SOPORTADOS:

✅ TRANSFERENCIAS:
- notifyTransferApproved(): Transferencia aprobada exitosamente
- notifyTransferRejected(): Transferencia rechazada con motivo
- notifyUrgentTransfer(): Transferencias que llevan >72h esperando

💵 MEMBRESÍAS EN EFECTIVO:
- notifyMembershipActivated(): Membresía activada al recibir pago
- Incluye detalles del cliente y monto recibido

💳 PAGOS GENERALES:
- notifyNewPayment(): Nuevo pago registrado en el sistema
- Información del método y monto

🎯 SISTEMA Y METAS:
- notifyGoalAchieved(): Meta mensual alcanzada (celebración)
- notifySystemError(): Errores críticos del sistema

CARACTERÍSTICAS AVANZADAS:

🔊 AUDIO Y SONIDO:
- Sonidos de notificación configurables
- Control de activación/desactivación de audio
- Soporte para múltiples formatos de audio

🎨 ESTADOS VISUALES:
- Colores por tipo de notificación
- Animaciones para notificaciones importantes
- Indicadores de prioridad (barra lateral)
- Estados de lectura/sin leer

📱 FILTROS Y ORGANIZACIÓN:
- Filtro por categoría (transferencias, efectivo, sistema)
- Filtro por estado (todas, sin leer)
- Contador por filtro
- Historial persistente

⚡ ACCIONES CONTEXTUALES:
- Botones de acción específicos por notificación
- Enlaces directos a detalles
- Capacidad de ejecutar acciones desde notificación

INTEGRACIÓN CON HOOKS:

🔗 usePaymentNotifications():
- Hook principal para acceder al sistema
- Funciones para generar notificaciones
- Estado global de notificaciones
- Configuración de filtros y sonido

🔗 usePaymentNotificationMonitor():
- Monitoreo automático de cambios en pagos
- Detección de eventos importantes
- Generación automática de notificaciones
- Integración con usePayments hook

USO EN LA APLICACIÓN:

SETUP PRINCIPAL:
```jsx
// App.js o layout principal
import PaymentNotificationSystem from './components/payments/PaymentNotificationSystem';

function App() {
  return (
    <PaymentNotificationSystem>
      <YourApp />
    </PaymentNotificationSystem>
  );
}
```

CAMPANA EN HEADER:
```jsx
// Header component
import { PaymentNotificationBell, PaymentNotificationPanel } from './PaymentNotificationSystem';

function Header() {
  return (
    <div className="relative">
      <PaymentNotificationBell />
      <PaymentNotificationPanel />
    </div>
  );
}
```

GENERAR NOTIFICACIONES:
```jsx
// En PaymentsManager o componentes de pago
import { usePaymentNotifications } from './PaymentNotificationSystem';

function PaymentsComponent() {
  const { notifyTransferApproved } = usePaymentNotifications();
  
  const handleApproveTransfer = async (transfer) => {
    await validateTransfer(transfer.id, true);
    
    notifyTransferApproved({
      transferId: transfer.id,
      clientName: transfer.user.name,
      amount: transfer.amount
    });
  };
}
```

MONITOREO AUTOMÁTICO:
```jsx
// En dashboard principal
import { usePaymentNotificationMonitor } from './PaymentNotificationSystem';

function Dashboard() {
  usePaymentNotificationMonitor(); // Auto-monitoreo activado
  return <DashboardContent />;
}
```

EVENTOS MONITOREADOS AUTOMÁTICAMENTE:

📊 MÉTRICAS EN TIEMPO REAL:
- Cambios en transferencias urgentes
- Nuevas membresías en efectivo
- Cumplimiento de metas mensuales
- Errores del sistema

🔔 NOTIFICACIONES AUTOMÁTICAS:
- Transferencias críticas (+72h)
- Metas de ingresos alcanzadas
- Problemas de conectividad
- Cambios significativos en métricas

PERSONALIZACIÓN:

🎨 TEMAS Y COLORES:
- Colores por tipo de notificación
- Iconos contextuales
- Animaciones configurables

🔊 CONFIGURACIÓN DE SONIDO:
- Activar/desactivar audio
- Sonidos personalizados
- Volumen configurable

📱 FILTROS PERSONALIZABLES:
- Categorías específicas
- Estados de lectura
- Prioridades

BENEFICIOS OPERATIVOS:

⚡ RESPUESTA RÁPIDA:
- Alertas inmediatas de eventos críticos
- Notificaciones de transferencias urgentes
- Comunicación efectiva entre staff

📊 SEGUIMIENTO MEJORADO:
- Historial completo de eventos
- Filtros para análisis específico
- Acciones directas desde notificaciones

🎯 CUMPLIMIENTO DE METAS:
- Celebración de logros importantes
- Seguimiento de progreso en tiempo real
- Motivación para el equipo

INTEGRACIÓN FUTURA:

📱 NOTIFICACIONES PUSH:
- Soporte para web push notifications
- Integración con Service Workers
- Notificaciones fuera de la aplicación

📧 EMAIL Y SMS:
- Integración con servicios de email
- SMS para eventos críticos
- Notificaciones multicanal

🔔 PERSONALIZACIÓN AVANZADA:
- Configuración por rol de usuario
- Horarios de notificación
- Escalamiento automático

Este sistema de notificaciones es esencial para mantener
al staff del gimnasio informado sobre eventos críticos
de pagos, mejorando la respuesta y la experiencia del cliente
en el contexto guatemalteco.
*/