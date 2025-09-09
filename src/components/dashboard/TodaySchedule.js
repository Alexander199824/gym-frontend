// Autor: Alexander Echeverria
// Ubicación: /gym-frontend/src/components/dashboard/TodaySchedule.js

import React from 'react';
import { Clock, Calendar, Users, User } from 'lucide-react';

const TodaySchedule = ({ schedule = [], isLoading = false }) => {
  const today = new Date().toLocaleDateString('es-GT', { 
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  // Función para formatear el día en español con primera letra mayúscula
  const formatDay = (dateString) => {
    return dateString.charAt(0).toUpperCase() + dateString.slice(1);
  };

  // Función para determinar el color del horario según el tipo de actividad
  const getActivityColor = (activity) => {
    const activityType = activity?.toLowerCase() || '';
    if (activityType.includes('yoga') || activityType.includes('pilates')) {
      return 'bg-purple-50 border-purple-200 text-purple-700';
    }
    if (activityType.includes('cardio') || activityType.includes('aeróbicos')) {
      return 'bg-red-50 border-red-200 text-red-700';
    }
    if (activityType.includes('pesas') || activityType.includes('fuerza')) {
      return 'bg-orange-50 border-orange-200 text-orange-700';
    }
    if (activityType.includes('zumba') || activityType.includes('baile')) {
      return 'bg-pink-50 border-pink-200 text-pink-700';
    }
    // Color por defecto
    return 'bg-blue-50 border-blue-200 text-blue-700';
  };

  // Función para obtener el icono según el número de participantes
  const getParticipantsIcon = (count) => {
    return count > 1 ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-4">
        <Calendar className="w-5 h-5 text-primary-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">
          Horarios de {formatDay(today)}
        </h3>
      </div>
      
      {schedule.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No hay clases programadas para hoy</p>
          <p className="text-xs text-gray-400 mt-1">
            Los horarios aparecerán cuando se programen actividades
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {schedule.map((slot, index) => {
            const colorClasses = getActivityColor(slot.activity);
            return (
              <div key={slot.id || index} className={`border rounded-lg p-3 hover:shadow-md transition-shadow duration-200 ${colorClasses}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {slot.activity}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      Instructor: {slot.instructor || 'Por asignar'}
                    </p>
                    {slot.room && (
                      <p className="text-xs text-gray-500 mt-1">
                        Sala: {slot.room}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-bold text-current">
                      {slot.startTime} - {slot.endTime}
                    </p>
                    <div className="flex items-center justify-end text-xs text-gray-600 mt-1">
                      {getParticipantsIcon(slot.participants || 0)}
                      <span className="ml-1">
                        {slot.participants || 0} participantes
                      </span>
                    </div>
                    {slot.maxCapacity && (
                      <p className="text-xs text-gray-500">
                        Máx: {slot.maxCapacity}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Barra de ocupación */}
                {slot.maxCapacity && slot.participants > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-current h-1.5 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((slot.participants / slot.maxCapacity) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round((slot.participants / slot.maxCapacity) * 100)}% ocupado
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TodaySchedule;

/*
FUNCIONALIDAD:
Este componente muestra los horarios y clases programadas para el día actual en el gimnasio.
Proporciona una vista organizada de las actividades diarias, instructores asignados y nivel
de participación para facilitar la gestión operativa del gimnasio.

CARACTERÍSTICAS PRINCIPALES:
- Lista cronológica de clases y actividades del día actual
- Formato de fecha en español guatemalteco con día, fecha y mes completo
- Códigos de colores específicos según el tipo de actividad física
- Estado de carga con animación skeleton mientras cargan los horarios
- Información detallada de cada clase: instructor, sala, participantes
- Barras de ocupación visual para mostrar capacidad utilizada
- Iconos dinámicos según número de participantes (individual vs grupal)
- Scroll automático para días con muchas actividades programadas
- Manejo de estados vacíos con mensajes informativos
- Efectos hover para mejor interactividad del usuario

TIPOS DE ACTIVIDADES Y COLORES:
- Yoga/Pilates: Fondo púrpura claro (relajación y flexibilidad)
- Cardio/Aeróbicos: Fondo rojo claro (alta intensidad)
- Pesas/Fuerza: Fondo naranja claro (entrenamiento de fuerza)
- Zumba/Baile: Fondo rosa claro (actividades de baile)
- Actividades generales: Fondo azul claro (por defecto)

ESTRUCTURA DE DATOS ESPERADA:
Recibe un array de horarios con la siguiente estructura:
- id: Identificador único del horario (opcional)
- activity: Nombre de la actividad o clase
- instructor: Nombre del instructor asignado
- startTime: Hora de inicio (formato HH:MM)
- endTime: Hora de finalización (formato HH:MM)
- participants: Número actual de participantes inscritos
- maxCapacity: Capacidad máxima de la clase (opcional)
- room: Sala o área donde se realiza la actividad (opcional)

EJEMPLOS DE HORARIOS TÍPICOS:
- "Yoga Matutino - Instructor: María González - 06:00 - 07:00 - Sala A"
- "Cardio Intensivo - Instructor: Carlos Méndez - 18:00 - 19:00 - 15 participantes"
- "Zumba - Instructor: Ana López - 19:30 - 20:30 - Sala Principal"
- "Entrenamiento de Fuerza - Instructor: José García - 20:00 - 21:00"

CONEXIONES CON OTROS ARCHIVOS:
- Importa desde 'react' para funcionalidad del componente
- Importa iconos desde 'lucide-react' (Clock, Calendar, Users, User)
- Utilizado en el dashboard principal (/dashboard) para mostrar actividades del día
- Recibe datos de componentes padre que consultan APIs de horarios del backend
- Se integra con el sistema de gestión de clases y reservas del gimnasio
- Conecta con módulos de:
  * Instructores para asignación de personal a clases
  * Reservas para conteo de participantes inscritos
  * Salas para disponibilidad de espacios físicos
  * Calendario del gimnasio para programación semanal
  * Sistema de notificaciones para cambios de horario
- Sincroniza con APIs de gestión de clases grupales
- Comunica con sistemas de registro de asistencia

LO QUE VE EL USUARIO:
- Encabezado con fecha completa en español: "Horarios de lunes 15 de enero"
- Durante la carga: Placeholders animados que simulan tarjetas de horarios
- Cuando no hay clases: Mensaje "No hay clases programadas para hoy" con icono de reloj
- Para cada clase programada:
  * Tarjeta con color específico según tipo de actividad
  * Nombre de la actividad en texto destacado (ej: "Yoga Matutino")
  * Nombre del instructor o "Por asignar" si no hay instructor
  * Horario completo (ej: "06:00 - 07:00")
  * Número de participantes con icono apropiado (persona individual o grupo)
  * Sala donde se realiza la actividad (cuando está disponible)
  * Capacidad máxima de la clase (cuando está definida)
  * Barra de ocupación visual mostrando porcentaje de capacidad utilizada
  * Porcentaje de ocupación (ej: "75% ocupado")
  * Efecto hover con sombra sutil al pasar el mouse
- Lista con scroll automático cuando hay muchas clases programadas
- Truncado automático de nombres largos para mantener diseño limpio
- Colores intuitivos: púrpura para yoga, rojo para cardio, naranja para pesas, etc.

CASOS DE USO EN EL DASHBOARD:
- Supervisión de clases programadas para el día actual
- Verificación de asignación de instructores a actividades
- Monitoreo de ocupación y participación en clases grupales
- Identificación de clases con baja participación
- Control de capacidad de salas y espacios del gimnasio
- Planificación de recursos según demanda de actividades
- Seguimiento de horarios pico y actividades más populares

PROPÓSITO:
Facilitar la gestión diaria de actividades del gimnasio proporcionando una vista clara y
organizada de todas las clases programadas, permitiendo al personal administrativo supervisar
la asignación de instructores, monitorear la participación en tiempo real, identificar
oportunidades de optimización de horarios y recursos, y garantizar que todas las actividades
se desarrollen según lo planificado. Mejora la experiencia del cliente al mantener información
actualizada sobre disponibilidad y ocupación de clases.
*/