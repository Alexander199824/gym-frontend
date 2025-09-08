// Autor: Alexander Echeverria
// Ubicación: /gym-frontend/src/components/dashboard/RecentActivity.js

import React from 'react';
import { Clock, User, CreditCard, Coins } from 'lucide-react';

const RecentActivity = ({ activities = [], isLoading = false }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_created':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'membership_created':
        return <CreditCard className="w-4 h-4 text-green-500" />;
      case 'payment_received':
        return <Coins className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center space-x-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{activity.message}</p>
            <p className="text-xs text-gray-500">
              {new Date(activity.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivity;

/*
FUNCIONALIDAD:
Este componente muestra la actividad reciente del sistema del gimnasio en tiempo real.
Presenta un feed de eventos importantes que han ocurrido en la aplicación.

CARACTERÍSTICAS:
- Lista cronológica de actividades del sistema
- Iconos específicos para diferentes tipos de actividades
- Estado de carga con animación skeleton
- Timestamps formateados en hora local
- Efectos de hover para mejor experiencia de usuario
- Manejo dinámico de diferentes tipos de eventos

TIPOS DE ACTIVIDADES:
- user_created: Nuevos usuarios registrados (icono de usuario azul)
- membership_created: Nuevas membresías creadas (icono de tarjeta verde)
- payment_received: Pagos recibidos (icono de monedas amarillo)
- default: Actividades generales (icono de reloj gris)

ESTRUCTURA DE DATOS:
Recibe un array de actividades con la siguiente estructura:
- type: Tipo de actividad para determinar el icono
- message: Descripción de la actividad
- timestamp: Fecha y hora del evento

CONEXIONES:
- Importa desde 'react' para funcionalidad del componente
- Importa iconos desde 'lucide-react' (Clock, User, CreditCard, Coins)
- Utilizado en el dashboard principal para mostrar eventos recientes
- Recibe datos de componentes padre que consultan APIs de actividad/logs
- Se integra con sistemas de notificaciones y auditoría
- Conecta con módulos de usuarios, membresías y pagos

PROPÓSITO:
Mantener al personal administrativo informado sobre la actividad en tiempo real del gimnasio,
permitiendo monitorear nuevos registros, pagos y cambios importantes en el sistema para
una mejor gestión operativa y detección temprana de problemas o tendencias.
*/