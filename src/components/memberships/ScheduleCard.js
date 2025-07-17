// src/components/memberships/ScheduleCard.js
// UBICACIÓN: /gym-frontend/src/components/memberships/ScheduleCard.js
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
  CheckCircle
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
  
  // 📅 DÍAS DE LA SEMANA
  const daysOfWeek = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };
  
  // 🕐 HORARIOS PREDEFINIDOS
  const timeSlots = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
    '22:00'
  ];
  
  // 🔄 Manejar cambios en el horario
  const handleScheduleChange = (day, timeSlots) => {
    setEditedSchedule(prev => ({
      ...prev,
      [day]: timeSlots
    }));
  };
  
  // ➕ Agregar nuevo horario
  const addTimeSlot = (day) => {
    const currentSlots = editedSchedule[day] || [];
    const newSlot = '09:00-10:00'; // Horario por defecto
    
    if (!currentSlots.includes(newSlot)) {
      handleScheduleChange(day, [...currentSlots, newSlot]);
    }
  };
  
  // 🗑️ Eliminar horario
  const removeTimeSlot = (day, timeSlot) => {
    const currentSlots = editedSchedule[day] || [];
    const updatedSlots = currentSlots.filter(slot => slot !== timeSlot);
    handleScheduleChange(day, updatedSlots);
  };
  
  // 💾 Guardar cambios
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
  
  // ❌ Cancelar edición
  const handleCancel = () => {
    setEditedSchedule(schedule);
    setIsEditing(false);
  };
  
  // 🎯 Validar horario
  const validateTimeSlot = (timeSlot) => {
    const [start, end] = timeSlot.split('-');
    return start && end && start < end;
  };
  
  // 📊 Contar total de horas semanales
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
      
      {/* 📊 HEADER */}
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
      
      {/* 📈 RESUMEN */}
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
      
      {/* 📅 HORARIOS POR DÍA */}
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
              
              {/* 🕐 HORARIOS DEL DÍA */}
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
      
      {/* 💡 SUGERENCIAS */}
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
      
      {/* 📊 ESTADO VACÍO */}
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

// 🕐 COMPONENTE: Item de horario individual (✅ CORREGIDO)
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
  
  // ✅ CORRECCIÓN: Definir timeSlots dentro del componente
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

// 📊 VARIANTE: Horario compacto
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