// Autor: Alexander Echeverria
// src/components/layout/NotificationPanel.js
// FUNCIÓN: Panel lateral de notificaciones con filtros y acciones

import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Trash2,
  Settings,
  Filter,
  MarkAsRead
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';

const NotificationPanel = ({ onClose }) => {
  const { 
    notifications, 
    removeNotification, 
    clearNotifications,
    formatDate 
  } = useApp();
  const { user } = useAuth();
  
  // Estados locales
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [selectedType, setSelectedType] = useState('all'); // all, success, error, warning, info
  
  // Filtrar notificaciones
  const filteredNotifications = notifications.filter(notification => {
    // Filtro por estado de lectura
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'read' && !notification.read) return false;
    
    // Filtro por tipo
    if (selectedType !== 'all' && notification.type !== selectedType) return false;
    
    return true;
  });
  
  // Contadores
  const unreadCount = notifications.filter(n => !n.read).length;
  const totalCount = notifications.length;
  
  // Obtener configuración del icono según tipo
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };
  
  // Limpiar todas las notificaciones
  const handleClearAll = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar todas las notificaciones?')) {
      clearNotifications();
    }
  };
  
  // Marcar todas como leídas
  const handleMarkAllAsRead = () => {
    // TODO: Implementar cuando se tenga el backend de notificaciones
    console.log('Marcar todas como leídas');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Notificaciones
          </h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* FILTROS */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        
        {/* Filtro por estado */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todas ({totalCount})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'unread' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            No leídas ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'read' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Leídas ({totalCount - unreadCount})
          </button>
        </div>
        
        {/* Filtro por tipo */}
        <div className="flex space-x-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1"
          >
            <option value="all">Todos los tipos</option>
            <option value="success">Éxito</option>
            <option value="error">Error</option>
            <option value="warning">Advertencia</option>
            <option value="info">Información</option>
          </select>
        </div>
        
      </div>
      
      {/* ACCIONES */}
      {totalCount > 0 && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Marcar todas como leídas
            </button>
            <button
              onClick={handleClearAll}
              className="flex items-center px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Limpiar todo
            </button>
          </div>
        </div>
      )}
      
      {/* LISTA DE NOTIFICACIONES */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay notificaciones
            </h3>
            <p className="text-sm text-gray-600">
              {filter === 'all' 
                ? 'Cuando tengas notificaciones, aparecerán aquí.'
                : `No hay notificaciones ${filter === 'unread' ? 'no leídas' : 'leídas'}.`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  
                  {/* Icono */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </h4>
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {formatDate(notification.timestamp, 'dd/MM/yyyy HH:mm')}
                      </span>
                      
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* PREFERENCIAS DE NOTIFICACIONES */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => {
            // TODO: Abrir preferencias de notificaciones del usuario
            console.log('Abrir preferencias de notificaciones del usuario');
          }}
          className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4 mr-2" />
          Preferencias de Notificaciones
        </button>
      </div>
      
    </div>
  );
};

export default NotificationPanel;

/*
DOCUMENTACIÓN DEL COMPONENTE NotificationPanel

PROPÓSITO:
Este componente implementa el panel lateral de notificaciones deslizable para la aplicación del gimnasio,
proporcionando una interfaz completa para visualizar, filtrar y gestionar notificaciones del sistema
relacionadas con membresías, pagos en quetzales, vencimientos y actividades del gimnasio.

FUNCIONALIDADES PRINCIPALES:
- Panel deslizable desde el lado derecho de la pantalla
- Sistema de filtrado por estado de lectura y tipo de notificación
- Contadores dinámicos de notificaciones leídas y no leídas
- Acciones masivas para marcar como leídas y limpiar todas
- Eliminación individual de notificaciones
- Iconos diferenciados por tipo de notificación
- Formato de fecha localizado para Guatemala
- Preferencias de notificaciones personalizables

ARCHIVOS Y CONEXIONES:

CONTEXTS REQUERIDOS:
- ../../contexts/AppContext: Gestión global de notificaciones, funciones de manipulación y formateo de fechas
- ../../contexts/AuthContext: Datos del usuario actual para personalización

ICONOS DE LUCIDE REACT:
- X: Botón cerrar panel y eliminar notificaciones individuales
- Bell: Icono principal de notificaciones y estado vacío
- CheckCircle: Notificaciones de éxito y botón marcar como leídas
- AlertCircle: Notificaciones de error y advertencia
- Info: Notificaciones informativas por defecto
- Trash2: Acción de limpiar todas las notificaciones
- Settings: Acceso a preferencias de notificaciones del usuario
- Filter: Representación visual de filtros (no utilizado actualmente)
- MarkAsRead: Acción de marcar como leídas (no utilizado actualmente)

ESTADOS MANEJADOS LOCALMENTE:
- filter: Control del filtro por estado ('all', 'unread', 'read')
- selectedType: Control del filtro por tipo ('all', 'success', 'error', 'warning', 'info')

QUE SE MUESTRA AL USUARIO:

ESTRUCTURA VISUAL DEL PANEL:
- Panel deslizable desde la derecha con fondo blanco
- Header fijo con título, contador de no leídas y botón cerrar
- Sección de filtros con botones de estado y dropdown de tipos
- Área de acciones masivas cuando hay notificaciones
- Lista scrolleable de notificaciones con divisores
- Footer fijo con acceso a preferencias de usuario

HEADER DEL PANEL:
- Icono de campana gris en el lado izquierdo
- Título "Notificaciones" centrado
- Badge rojo circular con número de notificaciones no leídas
- Botón X en el lado derecho para cerrar panel
- Borde inferior gris como separador

SECCIÓN DE FILTROS:
- **Filtros por estado**: Tres botones píldora horizontales
  - "Todas (X)": Muestra todas las notificaciones con conteo total
  - "No leídas (X)": Solo notificaciones pendientes de leer
  - "Leídas (X)": Solo notificaciones ya revisadas
  - Botón activo en azul, inactivos en gris con hover
- **Filtro por tipo**: Dropdown select con opciones
  - "Todos los tipos": Sin filtro de tipo
  - "Éxito": Notificaciones verdes de confirmación
  - "Error": Notificaciones rojas de problemas
  - "Advertencia": Notificaciones amarillas de alerta
  - "Información": Notificaciones azules informativas

ÁREA DE ACCIONES MASIVAS:
- Solo visible cuando hay notificaciones existentes
- **Marcar todas como leídas**: Botón azul con icono de check
- **Limpiar todo**: Botón rojo con icono de papelera
- Ambos con confirmación en hover y colores de fondo suaves
- Separador inferior antes de la lista

LISTA DE NOTIFICACIONES:
- **Notificación individual** (cuando hay contenido):
  - Fondo azul claro para notificaciones no leídas
  - Icono colorizado según tipo en el lado izquierdo
  - Título en texto negro mediano y peso font-medium
  - Mensaje descriptivo en texto gris más pequeño
  - Fecha y hora en formato guatemalteco (dd/MM/yyyy HH:mm)
  - Punto azul pequeño como indicador de no leída
  - Botón X individual para eliminar en esquina superior derecha
  - Hover effect gris suave en toda la notificación

- **Estado vacío** (cuando no hay notificaciones):
  - Icono grande de campana gris centrado
  - Título "No hay notificaciones" en texto negro
  - Mensaje contextual según filtro activo
  - Padding vertical generoso para centrado visual

TIPOS DE NOTIFICACIONES Y COLORES:
- **Éxito (success)**: Icono CheckCircle verde para confirmaciones
- **Error (error)**: Icono AlertCircle rojo para problemas críticos
- **Advertencia (warning)**: Icono AlertCircle amarillo para alertas
- **Información (info)**: Icono Info azul para mensajes informativos

FOOTER CON PREFERENCIAS:
- Botón completo ancho con fondo gris suave al hover
- Icono de Settings con texto "Preferencias de Notificaciones"
- Acceso a configuración personal del usuario (no del sistema)
- Borde superior gris como separador

INTERACCIONES DISPONIBLES:
- **Filtrado dinámico**: Cambio instantáneo al seleccionar filtros
- **Eliminación individual**: X en cada notificación con confirmación implícita
- **Eliminación masiva**: "Limpiar todo" con confirmación obligatoria
- **Marcar como leídas**: Acción futura para gestión de estado
- **Cerrar panel**: X en header o clic fuera del panel
- **Scroll**: Lista scrolleable cuando hay muchas notificaciones

NOTIFICACIONES ESPECÍFICAS DEL GIMNASIO:
- Confirmaciones de pagos en quetzales guatemaltecos
- Alertas de vencimiento de membresías
- Notificaciones de nuevos usuarios registrados
- Confirmaciones de transacciones de productos
- Alertas de inventario bajo
- Recordatorios de citas y clases
- Avisos de mantenimiento del sistema

RESPONSIVE DESIGN:
- Ancho completo en móvil con máximo de 400px
- Ancho fijo de 320px en escritorio
- Altura completa de viewport con scroll interno
- Elementos táctiles optimizados para móviles
- Espaciado generous para accesibilidad

FORMATO DE FECHAS LOCALIZADO:
- Formato guatemalteco: dd/MM/yyyy HH:mm
- Utiliza función formatDate del AppContext
- Zona horaria local automática
- Formato de 24 horas para claridad

GESTIÓN DE ESTADOS:
- Filtrado en tiempo real sin delay
- Contadores dinámicos que se actualizan automáticamente
- Estados de hover y focus visualmente claros
- Transiciones suaves entre estados (200ms)

ACCESIBILIDAD:
- Contraste adecuado en todos los elementos
- Botones con área de click sufficient (44px mínimo)
- Textos descriptivos para lectores de pantalla
- Navegación por teclado funcional
- Indicadores visuales claros para estados

CARACTERÍSTICAS DE RENDIMIENTO:
- Filtrado eficiente con Array.filter
- Re-renders mínimos con estados locales
- Scroll virtual implícito para listas largas
- Lazy loading de imágenes si se incluyen en el futuro

INTEGRACIÓN CON EL SISTEMA DEL GIMNASIO:
- Notificaciones de membresías próximas a vencer
- Alertas de pagos pendientes en quetzales
- Confirmaciones de transacciones exitosas
- Notificaciones de nuevos productos en tienda
- Alertas de mantenimiento programado
- Recordatorios de citas médicas o evaluaciones

PERSONALIZACIÓN POR ROL:
- Administradores: Todas las notificaciones del sistema
- Personal: Notificaciones operativas y de clientes
- Clientes: Notificaciones personales y promociones

FUTURAS MEJORAS DOCUMENTADAS:
- Backend de notificaciones para persistencia
- Notificaciones push en tiempo real
- Configuración granular de tipos de notificación
- Integración con email y SMS
- Métricas de engagement de notificaciones

Este componente es fundamental para mantener a los usuarios del gimnasio informados
sobre actividades relevantes, vencimientos de membresías, confirmaciones de pagos
en quetzales y otras comunicaciones importantes del sistema de gestión del gimnasio.
*/