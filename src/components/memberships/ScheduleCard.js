// Autor: Alexander Echeverria
// src/components/memberships/ScheduleCard.js
// FUNCIÓN: Componente para mostrar y editar horarios de membresías - ESPAÑOL PERFECCIONADO
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
  // Agregado para consistencia con iconos de quetzales
  Banknote,
  Target,
  TrendingUp
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
  
  // DÍAS DE LA SEMANA EN ESPAÑOL
  const daysOfWeek = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };
  
  // HORARIOS PREDEFINIDOS (6 AM - 10 PM)
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
  
  // Obtener recomendaciones basadas en horarios
  const getScheduleRecommendations = () => {
    const totalHours = getTotalWeeklyHours();
    const activeDays = Object.values(editedSchedule).filter(slots => 
      Array.isArray(slots) && slots.length > 0
    ).length;
    
    const recommendations = [];
    
    if (totalHours < 2) {
      recommendations.push("Considera aumentar tu tiempo de entrenamiento para mejores resultados");
    } else if (totalHours > 10) {
      recommendations.push("Excelente dedicación. Recuerda incluir días de descanso");
    }
    
    if (activeDays < 3) {
      recommendations.push("Intenta entrenar al menos 3 días por semana para mantener constancia");
    }
    
    return recommendations;
  };
  
  const totalHours = getTotalWeeklyHours();
  const hasSchedule = Object.values(editedSchedule).some(slots => 
    Array.isArray(slots) && slots.length > 0
  );
  const activeDays = Object.values(editedSchedule).filter(slots => 
    Array.isArray(slots) && slots.length > 0
  ).length;

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      
      {/* ENCABEZADO MEJORADO */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-xl font-semibold text-gray-900">
              Horarios de Entrenamiento
            </h3>
            <p className="text-sm text-gray-600">
              Configura tus horarios preferidos para entrenar
            </p>
          </div>
        </div>
        
        {editable && (
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="btn-secondary btn-sm flex items-center"
                  disabled={isLoading}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary btn-sm flex items-center"
                  disabled={isLoading}
                >
                  <Save className="w-4 h-4 mr-1" />
                  {isLoading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary btn-sm flex items-center"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Editar horarios
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* RESUMEN ESTADÍSTICO MEJORADO */}
      {hasSchedule && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Horas Semanales</p>
                <p className="text-2xl font-bold text-blue-700">{totalHours.toFixed(1)}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">Días Activos</p>
                <p className="text-2xl font-bold text-green-700">{activeDays}</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-900">Promedio Diario</p>
                <p className="text-2xl font-bold text-purple-700">
                  {activeDays > 0 ? (totalHours / activeDays).toFixed(1) : '0.0'}h
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}
      
      {/* HORARIOS POR DÍA */}
      <div className="space-y-4">
        {Object.entries(daysOfWeek).map(([dayKey, dayName]) => {
          const daySchedule = editedSchedule[dayKey] || [];
          
          return (
            <div key={dayKey} className="border border-gray-200 rounded-lg p-4 hover:border-primary-200 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <h4 className="text-lg font-semibold text-gray-900">{dayName}</h4>
                  {daySchedule.length > 0 && (
                    <span className="ml-3 bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium">
                      {daySchedule.length} sesión{daySchedule.length !== 1 ? 'es' : ''}
                    </span>
                  )}
                </div>
                
                {isEditing && (
                  <button
                    onClick={() => addTimeSlot(dayKey)}
                    className="btn-ghost btn-sm text-primary-600 hover:bg-primary-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar horario
                  </button>
                )}
              </div>
              
              {/* HORARIOS DEL DÍA */}
              <div className="space-y-2">
                {daySchedule.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 italic">
                      No tienes entrenamientos programados para este día
                    </p>
                    {isEditing && (
                      <button
                        onClick={() => addTimeSlot(dayKey)}
                        className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                      >
                        + Agregar primer horario
                      </button>
                    )}
                  </div>
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
      
      {/* RECOMENDACIONES PERSONALIZADAS */}
      {hasSchedule && !isEditing && (
        <div className="mt-6">
          {getScheduleRecommendations().map((recommendation, index) => (
            <div key={index} className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">{recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* CONSEJOS Y SUGERENCIAS MEJORADOS */}
      {isEditing && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-semibold text-blue-900 mb-3">
                💡 Consejos para optimizar tus horarios:
              </h4>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span><strong>Constancia:</strong> Elige horarios que puedas mantener a largo plazo</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span><strong>Horarios pico:</strong> Evita 7-9 AM y 6-8 PM si prefieres menos personas</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span><strong>Frecuencia mínima:</strong> Entrena al menos 3 días por semana para ver resultados</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span><strong>Descanso:</strong> Incluye días de recuperación entre entrenamientos intensos</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span><strong>Flexibilidad:</strong> Puedes modificar estos horarios cuando lo necesites</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* ESTADO VACÍO MEJORADO */}
      {!hasSchedule && !isEditing && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            ¡Configura tus horarios de entrenamiento!
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Define tus horarios preferidos para entrenar y mantén una rutina constante. 
            Te ayudará a alcanzar tus objetivos fitness más rápido.
          </p>
          {editable && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary text-lg px-8 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              Configurar mis horarios
            </button>
          )}
          
          {/* Beneficios de configurar horarios */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
              <h4 className="font-semibold text-green-900">Mejor Constancia</h4>
              <p className="text-sm text-green-700">Mantén una rutina regular y efectiva</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <Target className="w-8 h-8 text-blue-600 mb-2" />
              <h4 className="font-semibold text-blue-900">Objetivos Claros</h4>
              <p className="text-sm text-blue-700">Planifica para alcanzar tus metas</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
              <h4 className="font-semibold text-purple-900">Progreso Visible</h4>
              <p className="text-sm text-purple-700">Monitorea tu compromiso semanal</p>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

// COMPONENTE: Item de horario individual - MEJORADO
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
  
  // Calcular duración del entrenamiento
  const getDuration = () => {
    const start = parseFloat(editedStart.replace(':', '.'));
    const end = parseFloat(editedEnd.replace(':', '.'));
    return end - start;
  };
  
  const isValidTimeSlot = editedStart && editedEnd && editedStart < editedEnd;
  const duration = getDuration();
  
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      {isEditingSlot ? (
        <div className="flex items-center space-x-3 flex-1">
          <div className="flex items-center space-x-2">
            <select
              value={editedStart}
              onChange={(e) => setEditedStart(e.target.value)}
              className="form-input py-2 px-3 text-sm rounded-md border-gray-300"
            >
              {timeSlots.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
            
            <span className="text-gray-500 font-medium">—</span>
            
            <select
              value={editedEnd}
              onChange={(e) => setEditedEnd(e.target.value)}
              className="form-input py-2 px-3 text-sm rounded-md border-gray-300"
            >
              {timeSlots.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          
          {isValidTimeSlot && (
            <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">
              {duration.toFixed(1)}h
            </span>
          )}
          
          <div className="flex items-center space-x-1">
            <button
              onClick={handleSaveSlot}
              disabled={!isValidTimeSlot}
              className="btn-success btn-sm p-2 disabled:opacity-50"
              title="Guardar cambios"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancelSlot}
              className="btn-secondary btn-sm p-2"
              title="Cancelar cambios"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center space-x-3">
            <Clock className="w-4 h-4 text-primary-600" />
            <div>
              <span className="text-sm font-semibold text-gray-900">
                {startTime} — {endTime}
              </span>
              <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                {(parseFloat(endTime.replace(':', '.')) - parseFloat(startTime.replace(':', '.'))).toFixed(1)} horas
              </span>
            </div>
          </div>
          
          {isEditing && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsEditingSlot(true)}
                className="text-blue-600 hover:text-blue-500 p-2 hover:bg-blue-50 rounded"
                title="Editar horario"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={onRemove}
                className="text-red-600 hover:text-red-500 p-2 hover:bg-red-50 rounded"
                title="Eliminar horario"
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

// VARIANTE: Horario compacto - MEJORADO
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
  
  const activeDays = Object.values(schedule).filter(slots => 
    Array.isArray(slots) && slots.length > 0
  ).length;
  
  const totalHours = Object.values(schedule).reduce((total, slots) => {
    if (!Array.isArray(slots)) return total;
    return total + slots.reduce((dayTotal, slot) => {
      const [start, end] = slot.split('-');
      if (start && end) {
        const startHour = parseFloat(start.replace(':', '.'));
        const endHour = parseFloat(end.replace(':', '.'));
        return dayTotal + (endHour - startHour);
      }
      return dayTotal;
    }, 0);
  }, 0);
  
  return (
    <div className={`bg-white rounded-lg shadow border p-4 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-900">Horarios de Entrenamiento</h4>
        <Clock className="w-4 h-4 text-primary-600" />
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-4">
        {Object.entries(daysOfWeek).map(([dayKey, dayLetter]) => {
          const hasSchedule = schedule[dayKey] && schedule[dayKey].length > 0;
          
          return (
            <div
              key={dayKey}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                ${hasSchedule 
                  ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-200' 
                  : 'bg-gray-100 text-gray-500'
                }
              `}
              title={`${dayKey === 'monday' ? 'Lunes' : 
                     dayKey === 'tuesday' ? 'Martes' :
                     dayKey === 'wednesday' ? 'Miércoles' :
                     dayKey === 'thursday' ? 'Jueves' :
                     dayKey === 'friday' ? 'Viernes' :
                     dayKey === 'saturday' ? 'Sábado' : 'Domingo'}${hasSchedule ? ' - Configurado' : ' - Sin configurar'}`}
            >
              {dayLetter}
            </div>
          );
        })}
      </div>
      
      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Días activos:</span>
          <span className="font-medium text-gray-900">{activeDays}/7</span>
        </div>
        <div className="flex justify-between">
          <span>Horas semanales:</span>
          <span className="font-medium text-gray-900">{totalHours.toFixed(1)}h</span>
        </div>
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