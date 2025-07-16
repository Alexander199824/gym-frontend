// src/components/layout/NotificationPanel.js
// UBICACIÓN: /gym-frontend/src/components/layout/NotificationPanel.js
// FUNCIÓN: Panel lateral de notificaciones con filtros y acciones
// CONECTA CON: AppContext para notificaciones, futuro sistema de notificaciones

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
  
  // 📱 Estados locales
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [selectedType, setSelectedType] = useState('all'); // all, success, error, warning, info
  
  // 🔍 Filtrar notificaciones
  const filteredNotifications = notifications.filter(notification => {
    // Filtro por estado de lectura
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'read' && !notification.read) return false;
    
    // Filtro por tipo
    if (selectedType !== 'all' && notification.type !== selectedType) return false;
    
    return true;
  });
  
  // 📊 Contadores
  const unreadCount = notifications.filter(n => !n.read).length;
  const totalCount = notifications.length;
  
  // 🎨 Obtener configuración del icono según tipo
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
  
  // 🗑️ Limpiar todas las notificaciones
  const handleClearAll = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar todas las notificaciones?')) {
      clearNotifications();
    }
  };
  
  // 🔄 Marcar todas como leídas (futuro)
  const handleMarkAllAsRead = () => {
    // TODO: Implementar cuando se tenga el backend de notificaciones
    console.log('Marcar todas como leídas');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      
      {/* 🔝 HEADER */}
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
      
      {/* 🎛️ FILTROS */}
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
      
      {/* 🎯 ACCIONES */}
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
      
      {/* 📋 LISTA DE NOTIFICACIONES */}
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
      
      {/* 🔧 CONFIGURACIÓN */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => {
            // TODO: Abrir configuración de notificaciones
            console.log('Abrir configuración de notificaciones');
          }}
          className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4 mr-2" />
          Configurar notificaciones
        </button>
      </div>
      
    </div>
  );
};

export default NotificationPanel;