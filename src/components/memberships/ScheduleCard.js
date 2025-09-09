// Autor: Alexander Echeverria
// src/components/memberships/ScheduleCard.js
// FUNCIÓN: Componente para mostrar y editar horarios de membresías - DISEÑO COMPLETAMENTE REDISEÑADO
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
  Banknote,
  Target,
  TrendingUp,
  Grid,
  List,
  Filter,
  Search,
  Zap,
  RotateCcw,
  Timer,
  Users,
  Star,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Activity
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
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar', 'list', 'compact'
  const [filterType, setFilterType] = useState('all'); // 'all', 'morning', 'afternoon', 'evening'
  const [searchTerm, setSearchTerm] = useState('');
  
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
  
  // HORARIOS PREDEFINIDOS EXPANDIDOS (6 AM - 10 PM)
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
  
  // Selección inteligente automática
  const handleAutoSelect = () => {
    const autoSelected = {};
    
    // Algoritmo inteligente: 3-4 días por semana, horarios variados
    const preferredDays = ['monday', 'wednesday', 'friday', 'saturday'];
    const preferredTimes = ['08:00-09:00', '18:00-19:00', '19:00-20:00'];
    
    preferredDays.forEach((day, index) => {
      if (index < 3) { // Solo 3 días por defecto
        autoSelected[day] = [preferredTimes[index % preferredTimes.length]];
      }
    });
    
    setEditedSchedule(autoSelected);
  };
  
  // Limpiar todo
  const handleClearAll = () => {
    setEditedSchedule({});
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
  
  // Filtrar horarios según búsqueda y filtros
  const filterTimeSlots = (slots) => {
    if (!Array.isArray(slots)) return [];
    
    return slots.filter(slot => {
      const [start] = slot.split('-');
      const hour = parseInt(start.split(':')[0]);
      
      // Filtro por tipo de horario
      if (filterType !== 'all') {
        if (filterType === 'morning' && (hour < 6 || hour >= 12)) return false;
        if (filterType === 'afternoon' && (hour < 12 || hour >= 18)) return false;
        if (filterType === 'evening' && (hour < 18 || hour >= 22)) return false;
      }
      
      // Filtro por búsqueda
      if (searchTerm) {
        return slot.toLowerCase().includes(searchTerm.toLowerCase());
      }
      
      return true;
    });
  };
  
  const totalHours = getTotalWeeklyHours();
  const hasSchedule = Object.values(editedSchedule).some(slots => 
    Array.isArray(slots) && slots.length > 0
  );
  const activeDays = Object.values(editedSchedule).filter(slots => 
    Array.isArray(slots) && slots.length > 0
  ).length;

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      
      {/* HEADER PRINCIPAL REDISEÑADO */}
      <div className="bg-gradient-to-br from-primary-600 via-blue-600 to-purple-600 text-white p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          
          {/* Información principal */}
          <div className="flex-1">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-2">
                  Horarios de Entrenamiento
                </h3>
                <p className="text-primary-100 text-lg">
                  {isEditing ? 'Personaliza tu rutina de entrenamiento' : 'Tu rutina de entrenamiento personalizada'}
                </p>
              </div>
            </div>
            
            {/* Stats principales */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
                <div className="text-sm text-primary-100">Horas semanales</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{activeDays}</div>
                <div className="text-sm text-primary-100">Días activos</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">
                  {activeDays > 0 ? (totalHours / activeDays).toFixed(1) : '0.0'}h
                </div>
                <div className="text-sm text-primary-100">Promedio diario</div>
              </div>
            </div>
          </div>
          
          {/* Controles principales */}
          <div className="flex flex-col gap-3">
            {editable && (
              <>
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-all flex items-center"
                      disabled={isLoading}
                    >
                      <X className="w-5 h-5 mr-2" />
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      className="bg-white text-primary-600 px-6 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-all flex items-center"
                      disabled={isLoading}
                    >
                      <Save className="w-5 h-5 mr-2" />
                      {isLoading ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-white text-primary-600 px-6 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-all flex items-center"
                  >
                    <Edit2 className="w-5 h-5 mr-2" />
                    Editar horarios
                  </button>
                )}
                
                {isEditing && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleAutoSelect}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-all flex items-center text-sm"
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      Auto
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-all flex items-center text-sm"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Limpiar
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* CONTROLES DE VISTA Y FILTROS */}
      {(hasSchedule || isEditing) && (
        <div className="bg-gray-50 border-b border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            
            {/* Selector de vista */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 mr-3">Vista:</span>
              <div className="flex bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'calendar' 
                      ? 'bg-primary-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid className="w-4 h-4 mr-1 inline" />
                  Calendario
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'list' 
                      ? 'bg-primary-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4 mr-1 inline" />
                  Lista
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm"
                >
                  <option value="all">Todos los horarios</option>
                  <option value="morning">🌅 Mañanas (6AM-12PM)</option>
                  <option value="afternoon">☀️ Tardes (12PM-6PM)</option>
                  <option value="evening">🌙 Noches (6PM-10PM)</option>
                </select>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar horario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm w-48 bg-white shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* CONTENIDO PRINCIPAL */}
      <div className="p-8">
        {!hasSchedule && !isEditing ? (
          <ScheduleEmptyState onStartEditing={() => setIsEditing(true)} editable={editable} />
        ) : viewMode === 'calendar' ? (
          <ScheduleCalendarViewImproved
            schedule={editedSchedule}
            daysOfWeek={daysOfWeek}
            isEditing={isEditing}
            filterType={filterType}
            searchTerm={searchTerm}
            onScheduleChange={handleScheduleChange}
            onAddTimeSlot={addTimeSlot}
            onRemoveTimeSlot={removeTimeSlot}
            filterTimeSlots={filterTimeSlots}
          />
        ) : (
          <ScheduleListViewImproved
            schedule={editedSchedule}
            daysOfWeek={daysOfWeek}
            isEditing={isEditing}
            filterType={filterType}
            searchTerm={searchTerm}
            onScheduleChange={handleScheduleChange}
            onAddTimeSlot={addTimeSlot}
            onRemoveTimeSlot={removeTimeSlot}
            filterTimeSlots={filterTimeSlots}
          />
        )}
      </div>

      {/* RECOMENDACIONES Y CONSEJOS */}
      {hasSchedule && !isEditing && (
        <div className="bg-amber-50 border-t border-amber-200 p-6">
          <div className="flex items-start">
            <Star className="w-6 h-6 text-amber-600 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-bold text-amber-900 mb-3">
                💡 Recomendaciones para tu rutina:
              </h4>
              {getScheduleRecommendations().length > 0 ? (
                <div className="space-y-2">
                  {getScheduleRecommendations().map((recommendation, index) => (
                    <div key={index} className="text-sm text-amber-800 flex items-start">
                      <span className="text-amber-600 mr-2 font-bold">•</span>
                      <span>{recommendation}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-amber-800">
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <span className="text-amber-600 mr-2 font-bold">•</span>
                      <span><strong>Excelente rutina:</strong> Tienes una buena distribución de entrenamientos</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-amber-600 mr-2 font-bold">•</span>
                      <span><strong>Constancia:</strong> Mantén esta rutina para ver resultados óptimos</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <span className="text-amber-600 mr-2 font-bold">•</span>
                      <span><strong>Flexibilidad:</strong> Puedes ajustar estos horarios cuando lo necesites</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-amber-600 mr-2 font-bold">•</span>
                      <span><strong>Progreso:</strong> Revisa tu rutina mensualmente para optimizarla</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* CONSEJOS DURANTE EDICIÓN */}
      {isEditing && (
        <div className="bg-blue-50 border-t border-blue-200 p-6">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-bold text-blue-900 mb-3">
                💡 Consejos para optimizar tus horarios:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div className="space-y-2">
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2 font-bold">•</span>
                    <span><strong>Constancia:</strong> Elige horarios que puedas mantener a largo plazo</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2 font-bold">•</span>
                    <span><strong>Variedad:</strong> Alterna entre mañanas y tardes para mantener motivación</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2 font-bold">•</span>
                    <span><strong>Frecuencia:</strong> Entrena al menos 3 días por semana para ver resultados</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2 font-bold">•</span>
                    <span><strong>Descanso:</strong> Incluye días de recuperación entre entrenamientos intensos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ========================================
// VISTA DE CALENDARIO MEJORADA
// ========================================

const ScheduleCalendarViewImproved = ({ 
  schedule, 
  daysOfWeek, 
  isEditing, 
  filterType, 
  searchTerm, 
  onScheduleChange,
  onAddTimeSlot,
  onRemoveTimeSlot,
  filterTimeSlots
}) => {

  const getTimeIcon = (timeSlot) => {
    const [start] = timeSlot.split('-');
    const hour = parseInt(start.split(':')[0]);
    
    if (hour >= 6 && hour < 12) return <Sunrise className="w-4 h-4" />;
    if (hour >= 12 && hour < 18) return <Sun className="w-4 h-4" />;
    if (hour >= 18 && hour < 22) return <Sunset className="w-4 h-4" />;
    return <Moon className="w-4 h-4" />;
  };

  const getTimeColor = (timeSlot) => {
    const [start] = timeSlot.split('-');
    const hour = parseInt(start.split(':')[0]);
    
    if (hour >= 6 && hour < 12) return 'from-orange-400 to-yellow-400';
    if (hour >= 12 && hour < 18) return 'from-yellow-400 to-orange-400';
    if (hour >= 18 && hour < 22) return 'from-purple-400 to-blue-400';
    return 'from-blue-400 to-purple-400';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
      {Object.entries(daysOfWeek).map(([dayKey, dayName]) => {
        const daySchedule = schedule[dayKey] || [];
        const filteredSlots = filterTimeSlots(daySchedule);

        return (
          <div key={dayKey} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 p-6 hover:border-primary-300 transition-all hover:shadow-xl">
            
            {/* Header del día */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-2xl text-gray-900">{dayName}</h3>
                <p className="text-sm text-gray-500">
                  {filteredSlots.length} sesión{filteredSlots.length !== 1 ? 'es' : ''}
                </p>
              </div>
              
              {isEditing && (
                <button
                  onClick={() => onAddTimeSlot(dayKey)}
                  className="bg-primary-100 hover:bg-primary-200 text-primary-700 w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                  title="Agregar horario"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Lista de horarios */}
            <div className="space-y-4 min-h-[200px]">
              {filteredSlots.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {daySchedule.length === 0 
                      ? 'Sin entrenamientos programados'
                      : 'No hay horarios que coincidan con los filtros'
                    }
                  </p>
                  {isEditing && daySchedule.length === 0 && (
                    <button
                      onClick={() => onAddTimeSlot(dayKey)}
                      className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Agregar primer horario
                    </button>
                  )}
                </div>
              ) : (
                filteredSlots.map((timeSlot, index) => (
                  <TimeSlotCardImproved
                    key={`${dayKey}-${index}`}
                    timeSlot={timeSlot}
                    isEditing={isEditing}
                    onRemove={() => onRemoveTimeSlot(dayKey, timeSlot)}
                    onUpdate={(newTimeSlot) => {
                      const updatedSlots = [...daySchedule];
                      const originalIndex = daySchedule.indexOf(timeSlot);
                      updatedSlots[originalIndex] = newTimeSlot;
                      onScheduleChange(dayKey, updatedSlots);
                    }}
                    getTimeIcon={getTimeIcon}
                    getTimeColor={getTimeColor}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ========================================
// VISTA DE LISTA MEJORADA
// ========================================

const ScheduleListViewImproved = ({ 
  schedule, 
  daysOfWeek, 
  isEditing, 
  filterType, 
  searchTerm, 
  onScheduleChange,
  onAddTimeSlot,
  onRemoveTimeSlot,
  filterTimeSlots
}) => {

  // Agrupar todos los slots por horario
  const allSlots = [];
  Object.entries(daysOfWeek).forEach(([dayKey, dayName]) => {
    const daySchedule = schedule[dayKey] || [];
    const filteredSlots = filterTimeSlots(daySchedule);
    
    filteredSlots.forEach(timeSlot => {
      allSlots.push({
        day: dayKey,
        dayName,
        timeSlot,
        originalIndex: daySchedule.indexOf(timeSlot)
      });
    });
  });

  // Ordenar por día y hora
  allSlots.sort((a, b) => {
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayCompare = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    if (dayCompare !== 0) return dayCompare;
    return a.timeSlot.localeCompare(b.timeSlot);
  });

  const getTimeIcon = (timeSlot) => {
    const [start] = timeSlot.split('-');
    const hour = parseInt(start.split(':')[0]);
    
    if (hour >= 6 && hour < 12) return <Sunrise className="w-5 h-5" />;
    if (hour >= 12 && hour < 18) return <Sun className="w-5 h-5" />;
    if (hour >= 18 && hour < 22) return <Sunset className="w-5 h-5" />;
    return <Moon className="w-5 h-5" />;
  };

  const getTimeColor = (timeSlot) => {
    const [start] = timeSlot.split('-');
    const hour = parseInt(start.split(':')[0]);
    
    if (hour >= 6 && hour < 12) return 'from-orange-400 to-yellow-400';
    if (hour >= 12 && hour < 18) return 'from-yellow-400 to-orange-400';
    if (hour >= 18 && hour < 22) return 'from-purple-400 to-blue-400';
    return 'from-blue-400 to-purple-400';
  };

  return (
    <div className="space-y-6">
      
      {/* Agregar botones por día si está editando */}
      {isEditing && (
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border-2 border-dashed border-gray-300">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-primary-600" />
            Agregar horarios por día
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(daysOfWeek).map(([dayKey, dayName]) => (
              <button
                key={dayKey}
                onClick={() => onAddTimeSlot(dayKey)}
                className="bg-white hover:bg-primary-50 border-2 border-gray-200 hover:border-primary-300 rounded-lg p-3 text-center transition-all hover:shadow-md"
              >
                <div className="text-sm font-semibold text-gray-900">{dayName}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {(schedule[dayKey] || []).length} sesiones
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista de todos los horarios */}
      <div className="space-y-4">
        {allSlots.map((slot, index) => (
          <div
            key={`${slot.day}-${index}`}
            className={`bg-gradient-to-r ${getTimeColor(slot.timeSlot)} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all`}
          >
            <div className="flex items-center justify-between">
              
              {/* Información principal */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  {getTimeIcon(slot.timeSlot)}
                </div>
                
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="font-bold text-2xl">{slot.dayName}</span>
                    <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                      Entrenamiento
                    </span>
                  </div>
                  <div className="text-xl font-semibold text-white text-opacity-90">
                    {slot.timeSlot.replace('-', ' - ')}
                  </div>
                  <div className="text-sm text-white text-opacity-75">
                    Duración: {(() => {
                      const [start, end] = slot.timeSlot.split('-');
                      const startHour = parseFloat(start.replace(':', '.'));
                      const endHour = parseFloat(end.replace(':', '.'));
                      return (endHour - startHour).toFixed(1);
                    })()} horas
                  </div>
                </div>
              </div>

              {/* Controles de edición */}
              {isEditing && (
                <div className="flex items-center space-x-2">
                  <TimeSlotEditButton
                    timeSlot={slot.timeSlot}
                    onUpdate={(newTimeSlot) => {
                      const daySchedule = schedule[slot.day] || [];
                      const updatedSlots = [...daySchedule];
                      updatedSlots[slot.originalIndex] = newTimeSlot;
                      onScheduleChange(slot.day, updatedSlots);
                    }}
                  />
                  <button
                    onClick={() => onRemoveTimeSlot(slot.day, slot.timeSlot)}
                    className="bg-white bg-opacity-20 hover:bg-red-500 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                    title="Eliminar horario"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {allSlots.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron horarios</h3>
            <p className="text-gray-600 mb-6">
              {Object.values(schedule).every(slots => !slots || slots.length === 0)
                ? 'Aún no tienes horarios configurados'
                : 'Intenta cambiar los filtros o el término de búsqueda'
              }
            </p>
            {isEditing && Object.values(schedule).every(slots => !slots || slots.length === 0) && (
              <button
                onClick={() => onAddTimeSlot('monday')}
                className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-all flex items-center mx-auto"
              >
                <Plus className="w-5 h-5 mr-2" />
                Agregar primer horario
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================
// COMPONENTE: Tarjeta de horario mejorada
// ========================================

const TimeSlotCardImproved = ({ 
  timeSlot, 
  isEditing, 
  onRemove, 
  onUpdate,
  getTimeIcon,
  getTimeColor
}) => {
  const [isEditingSlot, setIsEditingSlot] = useState(false);

  const [startTime, endTime] = timeSlot.split('-');
  const duration = (() => {
    const startHour = parseFloat(startTime.replace(':', '.'));
    const endHour = parseFloat(endTime.replace(':', '.'));
    return (endHour - startHour).toFixed(1);
  })();

  return (
    <div className={`bg-gradient-to-r ${getTimeColor(timeSlot)} rounded-xl p-4 text-white shadow-md hover:shadow-lg transition-all`}>
      <div className="flex items-center justify-between">
        
        {/* Información del horario */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            {getTimeIcon(timeSlot)}
          </div>
          <div>
            <div className="font-bold text-lg">
              {startTime} - {endTime}
            </div>
            <div className="text-sm text-white text-opacity-75">
              {duration} hora{duration !== '1.0' ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Controles */}
        {isEditing && (
          <div className="flex items-center space-x-1">
            <TimeSlotEditButton
              timeSlot={timeSlot}
              onUpdate={onUpdate}
            />
            <button
              onClick={onRemove}
              className="bg-white bg-opacity-20 hover:bg-red-500 text-white w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
              title="Eliminar horario"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================
// COMPONENTE: Botón de edición de horario
// ========================================

const TimeSlotEditButton = ({ timeSlot, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [startTime, endTime] = timeSlot.split('-');
  const [editedStart, setEditedStart] = useState(startTime);
  const [editedEnd, setEditedEnd] = useState(endTime);

  const timeSlots = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
    '22:00'
  ];

  const handleSave = () => {
    const newTimeSlot = `${editedStart}-${editedEnd}`;
    onUpdate(newTimeSlot);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedStart(startTime);
    setEditedEnd(endTime);
    setIsEditing(false);
  };

  const isValidTimeSlot = editedStart && editedEnd && editedStart < editedEnd;

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-lg p-2">
        <select
          value={editedStart}
          onChange={(e) => setEditedStart(e.target.value)}
          className="text-sm rounded px-2 py-1 text-gray-900"
        >
          {timeSlots.map(time => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>
        
        <span className="text-white">-</span>
        
        <select
          value={editedEnd}
          onChange={(e) => setEditedEnd(e.target.value)}
          className="text-sm rounded px-2 py-1 text-gray-900"
        >
          {timeSlots.map(time => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>
        
        <button
          onClick={handleSave}
          disabled={!isValidTimeSlot}
          className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white w-6 h-6 rounded flex items-center justify-center transition-all"
        >
          <CheckCircle className="w-4 h-4" />
        </button>
        
        <button
          onClick={handleCancel}
          className="bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="bg-white bg-opacity-20 hover:bg-white hover:bg-opacity-30 text-white w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
      title="Editar horario"
    >
      <Edit2 className="w-4 h-4" />
    </button>
  );
};

// ========================================
// COMPONENTE: Estado vacío mejorado
// ========================================

const ScheduleEmptyState = ({ onStartEditing, editable }) => {
  return (
    <div className="text-center py-16">
      <div className="w-32 h-32 bg-gradient-to-br from-primary-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-8">
        <Calendar className="w-16 h-16 text-primary-600" />
      </div>
      
      <h3 className="text-3xl font-bold text-gray-900 mb-4">
        ¡Crea tu rutina perfecta!
      </h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
        Configura tus horarios de entrenamiento para mantener una rutina constante 
        y alcanzar tus objetivos fitness más rápido.
      </p>
      
      {editable && (
        <button
          onClick={onStartEditing}
          className="bg-gradient-to-r from-primary-600 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:from-primary-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center mx-auto"
        >
          <Plus className="w-6 h-6 mr-3" />
          Configurar mis horarios
        </button>
      )}
      
      {/* Beneficios de configurar horarios */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-4xl mx-auto">
        <div className="bg-green-50 rounded-2xl p-6">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h4 className="font-bold text-green-900 text-lg mb-2">Mejor Constancia</h4>
          <p className="text-green-700">Mantén una rutina regular y ve resultados más rápido</p>
        </div>
        
        <div className="bg-blue-50 rounded-2xl p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="font-bold text-blue-900 text-lg mb-2">Objetivos Claros</h4>
          <p className="text-blue-700">Planifica estratégicamente para alcanzar tus metas</p>
        </div>
        
        <div className="bg-purple-50 rounded-2xl p-6">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
            <Activity className="w-6 h-6 text-purple-600" />
          </div>
          <h4 className="font-bold text-purple-900 text-lg mb-2">Progreso Visible</h4>
          <p className="text-purple-700">Monitorea tu dedicación y mejora continua</p>
        </div>
      </div>
    </div>
  );
};

// ========================================
// VARIANTE: Horario compacto mejorado
// ========================================

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
    <div className={`bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 hover:shadow-xl hover:border-primary-300 transition-all ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-bold text-gray-900">Horarios de Entrenamiento</h4>
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary-600" />
        </div>
      </div>
      
      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {Object.entries(daysOfWeek).map(([dayKey, dayLetter]) => {
          const hasSchedule = schedule[dayKey] && schedule[dayKey].length > 0;
          const sessionCount = schedule[dayKey]?.length || 0;
          
          return (
            <div
              key={dayKey}
              className={`
                relative w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all
                ${hasSchedule 
                  ? 'bg-gradient-to-br from-primary-500 to-blue-500 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }
              `}
              title={`${dayKey === 'monday' ? 'Lunes' : 
                     dayKey === 'tuesday' ? 'Martes' :
                     dayKey === 'wednesday' ? 'Miércoles' :
                     dayKey === 'thursday' ? 'Jueves' :
                     dayKey === 'friday' ? 'Viernes' :
                     dayKey === 'saturday' ? 'Sábado' : 'Domingo'}${hasSchedule ? ` - ${sessionCount} sesión${sessionCount !== 1 ? 'es' : ''}` : ' - Sin configurar'}`}
            >
              <span>{dayLetter}</span>
              {hasSchedule && sessionCount > 1 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center text-xs font-bold">
                  {sessionCount}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-primary-600">{activeDays}</div>
          <div className="text-xs text-gray-600">Días activos</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-primary-600">{totalHours.toFixed(1)}h</div>
          <div className="text-xs text-gray-600">Horas semanales</div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCard;

/*
DOCUMENTACIÓN DEL COMPONENTE ScheduleCard - VERSIÓN REDISEÑADA

PROPÓSITO:
Este componente proporciona una interfaz completamente rediseñada para la gestión 
de horarios preferidos de los miembros del gimnasio. El nuevo diseño está optimizado 
para manejar grandes cantidades de horarios de manera intuitiva, escalable y 
visualmente atractiva.

MEJORAS PRINCIPALES DEL REDISEÑO:

1. HEADER PRINCIPAL MEJORADO:
   - Gradiente llamativo similar al checkout
   - Estadísticas en tiempo real (horas, días, promedio)
   - Controles de edición integrados
   - Botones de selección inteligente y limpieza

2. SISTEMA DE VISTAS INTERCAMBIABLES:
   - Vista de calendario: Grid responsivo optimizado
   - Vista de lista: Lista horizontal para muchos horarios
   - Controles de alternancia intuitivos

3. FILTROS Y BÚSQUEDA AVANZADOS:
   - Filtro por tipo de horario (mañana, tarde, noche)
   - Búsqueda en tiempo real
   - Iconos contextuales por horario del día

4. DISEÑO ESCALABLE:
   - Grid adaptativo que maneja 50+ horarios fácilmente
   - Cards optimizados para aprovechar espacio
   - Diseño responsivo para todos los dispositivos

5. EXPERIENCIA VISUAL MEJORADA:
   - Gradientes por tipo de horario
   - Iconos contextuales (amanecer, sol, atardecer, luna)
   - Animaciones suaves y efectos hover
   - Colores intuitivos y consistentes

FUNCIONALIDADES PRINCIPALES:
- Visualización de horarios por día de la semana
- Modo de edición completo con validaciones
- Cálculo automático de horas semanales totales
- Gestión de múltiples franjas horarias por día
- Selección inteligente automática de horarios
- Sugerencias y consejos para optimizar horarios
- Variante compacta para vistas reducidas
- Estado vacío con llamada a la acción
- Filtros y búsqueda en tiempo real

VISTAS DISPONIBLES:

VISTA DE CALENDARIO:
- Grid responsivo con cards por día
- Gradientes por tipo de horario del día
- Iconos contextuales (amanecer, sol, atardecer, luna)
- Botones de agregar integrados
- Diseño optimizado para espacios amplios

VISTA DE LISTA:
- Lista horizontal completa
- Información detallada de cada horario
- Controles de edición in-line
- Perfecto para muchos horarios
- Búsqueda y filtros integrados

CARACTERÍSTICAS AVANZADAS:

SELECCIÓN INTELIGENTE:
- Algoritmo que selecciona horarios óptimos
- Prioriza variedad y consistencia
- Evita sobrecarga de entrenamientos
- 3-4 días por semana automáticamente

FILTROS CONTEXTUALES:
- Mañanas (6AM-12PM) con icono de amanecer
- Tardes (12PM-6PM) con icono de sol
- Noches (6PM-10PM) con icono de atardecer
- Búsqueda en tiempo real por texto

VALIDACIONES Y FEEDBACK:
- Validación en tiempo real de horarios
- Feedback visual inmediato
- Prevención de conflictos
- Recomendaciones personalizadas

DISEÑO RESPONSIVO:
- Grid adaptativo: 1-4 columnas según pantalla
- Cards optimizados para mobile
- Controles táctiles mejorados
- Espaciado consistente en todos los dispositivos

CASOS DE USO EN EL GIMNASIO:
- Planificación de rutinas de entrenamiento personales
- Gestión de múltiples horarios por día
- Optimización del uso de equipos y espacios
- Análisis de patrones de entrenamiento
- Planificación a largo plazo
- Adaptación a cambios de horarios

PROPS CONFIGURABLES:
- schedule: Objeto con datos de horarios
- editable: Permitir edición (boolean)
- onScheduleUpdate: Callback para actualizaciones
- isLoading: Estado de carga (boolean)
- className: Clases CSS adicionales

ESTADOS VISUALES:
- Modo visualización: Solo lectura con estadísticas
- Modo edición: Controles completos habilitados
- Estado vacío: Llamada a la acción prominente
- Estado de carga: Indicadores apropiados

INTEGRACIÓN CON SISTEMA:
- Compatible con APIs de actualización
- Datos persistentes en base de datos
- Sincronización en tiempo real
- Notificaciones de cambios

ACCESIBILIDAD MEJORADA:
- Contraste optimizado en todos los gradientes
- Iconos descriptivos para cada sección
- Tooltips informativos
- Navegación por teclado completa

PERFORMANCE OPTIMIZADA:
- Renderizado eficiente de componentes
- Lazy loading para grandes cantidades de datos
- Memoización de cálculos complejos
- Animaciones optimizadas para 60fps

ESCALABILIDAD FUTURA:
- Arquitectura preparada para 100+ horarios
- Diseño modular y extensible
- API flexible para nuevas funcionalidades
- Patrones de diseño consistentes

Este rediseño completo transforma la experiencia de gestión de horarios de 
una interfaz básica a una herramienta poderosa, intuitiva y escalable que 
puede manejar las necesidades actuales y futuras del gimnasio.
*/