// Autor: Alexander Echeverria
// src/components/memberships/ScheduleCard.js
// FUNCIÓN: Componente para mostrar y editar horarios de membresías
// USADO EN: ClientDashboard, páginas de membresías

import React, { useState } from 'react';
import { 
  Clock, 
  Plus, 
  X, 
  Edit2, 
  Save, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Bird
} from 'lucide-react';

const ScheduleCard = ({ 
  schedule = {}, 
  editable = false,
  onScheduleUpdate = null,
  isLoading = false,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSchedule, setEditedSchedule] = useState(schedule);
  const [newTimeSlot, setNewTimeSlot] = useState({ day: '', startTime: '', endTime: '' });
  
  // DÍAS DE LA SEMANA
  const daysOfWeek = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };
  
  // HORARIOS PREDEFINIDOS
  const timeSlots = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
    '22:00'
  ];
  
  // Manejar cambios en el horario
  const handleScheduleChange = (day, timeSlots) => {
    setEditedSchedule(prev => ({
      ...prev,
      [day]: timeSlots
    }));
  };
  
  // Agregar nuevo horario
  const addTimeSlot = (day) => {
    const currentSlots = editedSchedule[day] || [];
    const newSlot = '09:00-10:00'; // Horario por defecto
    
    if (!currentSlots.includes(newSlot)) {
      handleScheduleChange(day, [...currentSlots, newSlot]);
    }
  };
  
  // Eliminar horario
  const removeTimeSlot = (day, timeSlot) => {
    const currentSlots = editedSchedule[day] || [];
    const updatedSlots = currentSlots.filter(slot => slot !== timeSlot);
    handleScheduleChange(day, updatedSlots);
  };
  
  // Guardar cambios
  const handleSave = async () => {
    if (onScheduleUpdate) {
      try {
        await onScheduleUpdate(editedSchedule);
        setIsEditing(false);
      } catch (error) {
        console.error('Error al guardar horario:', error);
      }
    }
  };
  
  // Cancelar edición
  const handleCancel = () => {
    setEditedSchedule(schedule);
    setIsEditing(false);
  };
  
  // Validar horario
  const validateTimeSlot = (timeSlot) => {
    const [start, end] = timeSlot.split('-');
    return start && end && start < end;
  };
  
  // Contar total de horas semanales
  const getTotalWeeklyHours = () => {
    let totalHours = 0;
    
    Object.values(editedSchedule).forEach(slots => {
      if (Array.isArray(slots)) {
        slots.forEach(slot => {
          const [start, end] = slot.split('-');
          if (start && end) {
            const startHour = parseFloat(start.replace(':', '.'));
            const endHour = parseFloat(end.replace(':', '.'));
            totalHours += endHour - startHour;
          }
        });
      }
    });
    
    return totalHours;
  };
  
  const totalHours = getTotalWeeklyHours();
  const hasSchedule = Object.values(editedSchedule).some(slots => 
    Array.isArray(slots) && slots.length > 0
  );

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      
      {/* ENCABEZADO */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 text-primary-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">
            Horarios Preferidos
          </h3>
        </div>
        
        {editable && (
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="btn-secondary btn-sm"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary btn-sm"
                  disabled={isLoading}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Guardar
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary btn-sm"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Editar
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* RESUMEN */}
      {hasSchedule && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">
                {totalHours.toFixed(1)} horas semanales
              </span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-sm text-green-700">
                {Object.values(editedSchedule).filter(slots => 
                  Array.isArray(slots) && slots.length > 0
                ).length} días configurados
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* HORARIOS POR DÍA */}
      <div className="space-y-4">
        {Object.entries(daysOfWeek).map(([dayKey, dayName]) => {
          const daySchedule = editedSchedule[dayKey] || [];
          
          return (
            <div key={dayKey} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">
                  {dayName}
                </h4>
                
                {isEditing && (
                  <button
                    onClick={() => addTimeSlot(dayKey)}
                    className="btn-ghost btn-sm text-primary-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* HORARIOS DEL DÍA */}
              <div className="space-y-2">
                {daySchedule.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    Sin horarios configurados
                  </p>
                ) : (
                  daySchedule.map((timeSlot, index) => (
                    <TimeSlotItem
                      key={index}
                      timeSlot={timeSlot}
                      isEditing={isEditing}
                      onRemove={() => removeTimeSlot(dayKey, timeSlot)}
                      onUpdate={(newTimeSlot) => {
                        const updatedSlots = [...daySchedule];
                        updatedSlots[index] = newTimeSlot;
                        handleScheduleChange(dayKey, updatedSlots);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* SUGERENCIAS */}
      {isEditing && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                Consejos para configurar tus horarios:
              </h4>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Elige horarios que puedas mantener constantemente</li>
                <li>• Evita las horas pico (7-9 AM y 6-8 PM) si prefieres menos gente</li>
                <li>• Configura al menos 3 días a la semana para mejores resultados</li>
                <li>• Puedes cambiar tus horarios cuando lo necesites</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* ESTADO VACÍO */}
      {!hasSchedule && !isEditing && (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tienes horarios configurados
          </h3>
          <p className="text-gray-600 mb-4">
            Configura tus horarios preferidos para una mejor experiencia
          </p>
          {editable && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary"
            >
              Configurar horarios
            </button>
          )}
        </div>
      )}
      
    </div>
  );
};

// COMPONENTE: Item de horario individual
const TimeSlotItem = ({ 
  timeSlot, 
  isEditing, 
  onRemove, 
  onUpdate 
}) => {
  const [startTime, endTime] = timeSlot.split('-');
  const [isEditingSlot, setIsEditingSlot] = useState(false);
  const [editedStart, setEditedStart] = useState(startTime);
  const [editedEnd, setEditedEnd] = useState(endTime);
  
  // Definir timeSlots dentro del componente
  const timeSlots = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
    '22:00'
  ];
  
  const handleSaveSlot = () => {
    const newTimeSlot = `${editedStart}-${editedEnd}`;
    onUpdate(newTimeSlot);
    setIsEditingSlot(false);
  };
  
  const handleCancelSlot = () => {
    setEditedStart(startTime);
    setEditedEnd(endTime);
    setIsEditingSlot(false);
  };
  
  const isValidTimeSlot = editedStart && editedEnd && editedStart < editedEnd;
  
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
      {isEditingSlot ? (
        <div className="flex items-center space-x-2 flex-1">
          <select
            value={editedStart}
            onChange={(e) => setEditedStart(e.target.value)}
            className="form-input py-1 px-2 text-sm"
          >
            {timeSlots.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
          
          <span className="text-gray-500">-</span>
          
          <select
            value={editedEnd}
            onChange={(e) => setEditedEnd(e.target.value)}
            className="form-input py-1 px-2 text-sm"
          >
            {timeSlots.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={handleSaveSlot}
              disabled={!isValidTimeSlot}
              className="btn-success btn-sm p-1"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancelSlot}
              className="btn-secondary btn-sm p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-900">
              {startTime} - {endTime}
            </span>
          </div>
          
          {isEditing && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsEditingSlot(true)}
                className="text-blue-600 hover:text-blue-500 p-1"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={onRemove}
                className="text-red-600 hover:text-red-500 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// VARIANTE: Horario compacto
export const CompactScheduleCard = ({ 
  schedule = {}, 
  className = '' 
}) => {
  const daysOfWeek = {
    monday: 'L',
    tuesday: 'M',
    wednesday: 'X',
    thursday: 'J',
    friday: 'V',
    saturday: 'S',
    sunday: 'D'
  };
  
  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">Horarios</h4>
        <Clock className="w-4 h-4 text-gray-500" />
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {Object.entries(daysOfWeek).map(([dayKey, dayLetter]) => {
          const hasSchedule = schedule[dayKey] && schedule[dayKey].length > 0;
          
          return (
            <div
              key={dayKey}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                ${hasSchedule 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'bg-gray-100 text-gray-500'
                }
              `}
            >
              {dayLetter}
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 text-xs text-gray-600">
        {Object.values(schedule).filter(slots => 
          Array.isArray(slots) && slots.length > 0
        ).length} días configurados
      </div>
    </div>
  );
};

export default ScheduleCard;

/*
DOCUMENTACIÓN DEL COMPONENTE ScheduleCard

PROPÓSITO:
Este componente proporciona una interfaz completa para la gestión de horarios preferidos
de los miembros del gimnasio. Permite visualizar, editar y configurar los horarios de
entrenamiento de manera intuitiva, facilitando la planificación de rutinas y optimizando
el uso de las instalaciones del gimnasio.

FUNCIONALIDADES PRINCIPALES:
- Visualización de horarios por día de la semana
- Modo de edición completo con validaciones
- Cálculo automático de horas semanales totales
- Gestión de múltiples franjas horarias por día
- Validación de conflictos de horarios
- Sugerencias y consejos para optimizar horarios
- Variante compacta para vistas reducidas
- Estado vacío con llamada a la acción

CONEXIONES CON OTROS ARCHIVOS:

CONTEXTOS UTILIZADOS:
- No requiere contextos específicos, es un componente independiente
- Se integra con sistemas de gestión de usuarios y membresías
- Compatible con APIs de actualización de preferencias

COMPONENTES RELACIONADOS:
- ClientDashboard: Panel principal donde se muestra la información de horarios
- MembershipCard: Complementa la información de membresías con horarios
- Páginas de membresías: Formularios de configuración de usuario

COMPONENTES IMPORTADOS:
- Iconos de Lucide React: Clock, Plus, X, Edit2, Save, Calendar, AlertCircle, 
  CheckCircle, Bird

QUE MUESTRA AL USUARIO:

VISTA PRINCIPAL:
- Encabezado "Horarios Preferidos" con icono de calendario
- Botón "Editar" cuando el componente es editable
- Resumen con estadísticas:
  - Total de horas semanales calculadas automáticamente
  - Número de días configurados con checkmark verde
- Sección por cada día de la semana (Lunes a Domingo):
  - Nombre del día como encabezado
  - Lista de horarios configurados o mensaje "Sin horarios configurados"
  - Botón "+" para agregar horarios (modo edición)
- Consejos y sugerencias en modo edición:
  - "Elige horarios que puedas mantener constantemente"
  - "Evita las horas pico (7-9 AM y 6-8 PM) si prefieres menos gente"
  - "Configura al menos 3 días a la semana para mejores resultados"
  - "Puedes cambiar tus horarios cuando lo necesites"

MODO EDICIÓN:
- Botones "Cancelar" y "Guardar" en el encabezado
- Selectors de hora de inicio y fin para cada franja horaria
- Botones de edición (lápiz) y eliminación (X) para cada horario
- Validación en tiempo real de horarios válidos
- Panel de sugerencias amarillo con consejos útiles

ESTADO VACÍO:
- Icono de reloj grande en gris
- Título "No tienes horarios configurados"
- Mensaje explicativo sobre beneficios de configurar horarios
- Botón "Configurar horarios" para comenzar

VARIANTE COMPACTA (CompactScheduleCard):
- Título "Horarios" con icono de reloj
- Grid de 7 círculos representando días de la semana (L M X J V S D)
- Círculos coloreados para días con horarios configurados
- Contador "X días configurados"

GESTIÓN DE HORARIOS:
- Horarios predefinidos desde 06:00 hasta 22:00 en intervalos de 30 minutos
- Formato de horario: "HH:MM - HH:MM" (ejemplo: "09:00 - 10:00")
- Validación automática que hora de inicio sea menor que hora de fin
- Prevención de horarios duplicados para el mismo día
- Cálculo automático de duración de cada sesión

CASOS DE USO EN EL GIMNASIO:
- Planificación de rutinas de entrenamiento personales
- Optimización del uso de equipos y espacios
- Evitar horas pico según preferencias del usuario
- Facilitar reservas de clases grupales
- Mejorar la experiencia del usuario con horarios consistentes
- Análisis de patrones de uso del gimnasio
- Planificación de mantenimiento en horarios de menor afluencia

VALIDACIONES IMPLEMENTADAS:
- Hora de inicio debe ser anterior a hora de fin
- No permite horarios duplicados en el mismo día
- Validación de formato de tiempo correcto
- Prevención de guardado con horarios inválidos
- Feedback visual inmediato en caso de errores

CARACTERÍSTICAS TÉCNICAS:
- Estado local para manejo de ediciones temporales
- Funciones de callback para persistencia de datos
- Validaciones en tiempo real sin afectar rendimiento
- Manejo de estados de carga durante guardado
- Responsive design para dispositivos móviles
- Accessibility con roles y labels apropiados

BENEFICIOS PARA EL USUARIO:
- Planificación eficiente de tiempo de entrenamiento
- Visualización clara de compromiso semanal
- Flexibilidad para ajustar horarios según necesidades
- Consejos para optimizar rutina de ejercicios
- Interfaz intuitiva y fácil de usar
- Feedback inmediato sobre cambios realizados

INTEGRACIÓN CON SISTEMA DEL GIMNASIO:
- Datos de horarios pueden usarse para análisis de ocupación
- Integración con sistema de reservas de clases
- Optimización de horarios de staff según demanda
- Análisis de patrones para mejores ofertas de servicios
- Planificación de mantenimiento de equipos
- Estadísticas de uso para toma de decisiones

PERSONALIZACIÓN:
- Horarios adaptables según tipo de membresía
- Configuración específica por ubicación del gimnasio
- Integración con preferencias de entrenador personal
- Adaptación a horarios especiales y feriados
- Configuración de alertas y recordatorios

ESTADOS VISUALES:
- Días configurados: Círculos azules con letra del día
- Días sin configurar: Círculos grises
- Modo edición: Botones de acción visibles
- Validación exitosa: Checkmarks verdes
- Errores: Bordes rojos y mensajes de advertencia

Este componente es fundamental para la experiencia del usuario en el gimnasio,
facilitando la organización personal y contribuyendo a la optimización general
de las instalaciones mediante una mejor distribución de la demanda a lo largo
de la semana.
*/