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
      case 'membership_expired':
        return <Clock className="w-4 h-4 text-red-500" />;
      case 'daily_payment':
        return <Coins className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityTypeLabel = (type) => {
    switch (type) {
      case 'user_created':
        return 'Nuevo Usuario';
      case 'membership_created':
        return 'Nueva Membresía';
      case 'payment_received':
        return 'Pago Recibido';
      case 'membership_expired':
        return 'Membresía Vencida';
      case 'daily_payment':
        return 'Pago Diario';
      default:
        return 'Actividad General';
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

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">No hay actividad reciente</p>
        <p className="text-xs text-gray-400 mt-1">
          Las actividades aparecerán aquí cuando ocurran eventos en el sistema
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {activities.map((activity, index) => (
        <div key={activity.id || index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded transition-colors duration-150">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 break-words">
                  {activity.message}
                </p>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-current mr-2 opacity-60"></span>
                  <span className="font-medium mr-2">
                    {getActivityTypeLabel(activity.type)}
                  </span>
                  <span>
                    {new Date(activity.timestamp).toLocaleString('es-GT', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
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
Presenta un feed cronológico de eventos importantes que han ocurrido en la aplicación,
permitiendo al personal administrativo mantenerse al día con los cambios y transacciones.

CARACTERÍSTICAS PRINCIPALES:
- Lista cronológica de actividades del sistema con scroll automático
- Iconos específicos y colores distintivos para diferentes tipos de actividades
- Estado de carga con animación skeleton mientras cargan los datos
- Timestamps formateados en hora local guatemalteca
- Efectos de hover suaves para mejor experiencia de usuario
- Manejo dinámico de diferentes tipos de eventos del gimnasio
- Etiquetas descriptivas en español para cada tipo de actividad
- Manejo de estado vacío con mensaje informativo
- Diseño responsivo que se adapta a diferentes tamaños de contenedor

TIPOS DE ACTIVIDADES SOPORTADAS:
- user_created: Nuevos usuarios registrados (icono de usuario azul)
- membership_created: Nuevas membresías creadas (icono de tarjeta verde)
- payment_received: Pagos recibidos en quetzales (icono de monedas amarillo)
- membership_expired: Membresías que han vencido (icono de reloj rojo)
- daily_payment: Pagos diarios realizados (icono de monedas azul)
- default: Actividades generales del sistema (icono de reloj gris)

ESTRUCTURA DE DATOS ESPERADA:
Recibe un array de actividades con la siguiente estructura:
- id: Identificador único de la actividad (opcional)
- type: Tipo de actividad para determinar el icono y color
- message: Descripción de la actividad en español
- timestamp: Fecha y hora del evento en formato ISO

EJEMPLOS DE MENSAJES TÍPICOS:
- "Juan Pérez se registró como nuevo usuario"
- "María García adquirió una membresía mensual por Q 150.00"
- "Carlos López realizó un pago diario de Q 15.00"
- "La membresía de Ana Rodríguez ha vencido"
- "Se procesó un pago de Q 300.00 para membresía anual"

CONEXIONES CON OTROS ARCHIVOS:
- Importa desde 'react' para funcionalidad del componente
- Importa iconos desde 'lucide-react' (Clock, User, CreditCard, Coins)
- Utilizado en el dashboard principal (/dashboard) para mostrar eventos recientes
- Recibe datos de componentes padre que consultan APIs de actividad y logs del backend
- Se integra con sistemas de notificaciones y auditoría del gimnasio
- Conecta con módulos de:
  * Usuarios (registros y actualizaciones de perfil)
  * Membresías (creación, renovación, vencimientos)
  * Pagos (transacciones en quetzales, pagos diarios y mensuales)
  * Sistema de logs y auditoría del backend
- Comunica con APIs REST que registran eventos del sistema
- Se sincroniza con WebSockets para actualizaciones en tiempo real (opcional)

LO QUE VE EL USUARIO:
- Durante la carga: Lista de placeholders animados (skeleton) que pulsan suavemente
- Cuando no hay actividades: Mensaje informativo "No hay actividad reciente" con icono de reloj
- Para cada actividad reciente:
  * Icono circular con color específico según tipo de evento
  * Mensaje descriptivo en texto negro (ej: "Juan Pérez se registró como nuevo usuario")
  * Etiqueta del tipo de actividad (ej: "Nuevo Usuario", "Pago Recibido")
  * Fecha y hora formateada para Guatemala (ej: "15 ene 2025, 14:30")
  * Punto de color que indica el tipo de actividad
  * Efecto hover gris claro al pasar el mouse sobre cada actividad
- Lista con scroll automático cuando hay muchas actividades
- Formato de fecha guatemalteco: día, mes abreviado, año y hora en formato 24h
- Colores distintivos: azul para usuarios, verde para membresías, amarillo/azul para pagos, rojo para vencimientos

CASOS DE USO EN EL DASHBOARD:
- Monitoreo de nuevas inscripciones en tiempo real
- Seguimiento de pagos diarios y mensuales en quetzales
- Alertas visuales de membresías vencidas
- Registro de actividad del personal administrativo
- Historial de transacciones recientes
- Detección de patrones de uso del gimnasio

PROPÓSITO:
Mantener al personal administrativo informado sobre la actividad en tiempo real del gimnasio,
permitiendo monitorear nuevos registros, pagos en quetzales, vencimientos de membresías y 
cambios importantes en el sistema. Facilita una mejor gestión operativa, detección temprana 
de problemas, identificación de tendencias y seguimiento de la actividad comercial diaria.
Mejora la capacidad de respuesta del personal ante eventos importantes del negocio.
*/