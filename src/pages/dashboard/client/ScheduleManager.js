// Autor: Alexander Echeverria
// src/pages/dashboard/client/ScheduleManager.js
// SIMPLIFICADO: Vista directa de mis horarios + cambio individual

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Clock, 
  Calendar, 
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Plus,
  Edit3,
  Save,
  X,
  Timer,
  Users,
  Activity,
  Calendar as CalendarIcon,
  Check,
  Clock3,
  Target,
  AlertTriangle,
  Zap,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';

import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

// ================================
// 🛠️ UTILIDADES
// ================================

const DIAS_ESPANOL = {
  'monday': 'Lunes',
  'tuesday': 'Martes', 
  'wednesday': 'Miércoles',
  'thursday': 'Jueves',
  'friday': 'Viernes',
  'saturday': 'Sábado',
  'sunday': 'Domingo'
};

const agruparHorariosPorFranja = (slots) => {
  const franjas = {
    morning: { label: '🌅 Mañana', slots: [], range: '6:00 - 12:00' },
    afternoon: { label: '☀️ Tarde', slots: [], range: '12:00 - 18:00' },
    evening: { label: '🌙 Noche', slots: [], range: '18:00 - 22:00' }
  };

  slots.forEach(slot => {
    const hour = parseInt(slot.openTime.split(':')[0]);
    if (hour < 12) {
      franjas.morning.slots.push(slot);
    } else if (hour < 18) {
      franjas.afternoon.slots.push(slot);
    } else {
      franjas.evening.slots.push(slot);
    }
  });

  return franjas;
};

const extractSlotId = (slot) => {
  if (typeof slot === 'number') return slot;
  if (typeof slot === 'string') return parseInt(slot);
  if (typeof slot === 'object' && slot) {
    return slot.id || slot.slotId || null;
  }
  return null;
};

const calculateRealRemainingDays = (membership) => {
  if (!membership) return 0;
  
  if (membership.summary?.daysRemaining !== undefined) {
    return membership.summary.daysRemaining;
  }
  
  if (membership.endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(membership.endDate);
    endDate.setHours(23, 59, 59, 999);
    
    if (endDate < today) return 0;
    
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
  
  return 0;
};

const calculateAutoStats = (schedule, membership) => {
  if (!schedule?.currentSchedule || !membership) {
    return {
      totalSlotsReserved: 0,
      weeklySlots: 0,
      daysWithActivity: 0,
      utilizationRate: 0,
      remainingDays: 0,
      estimatedVisits: 0
    };
  }

  const currentScheduleData = schedule.currentSchedule;
  const realRemainingDays = calculateRealRemainingDays(membership);
  
  let totalSlots = 0;
  let daysWithActivity = 0;
  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  
  Object.entries(currentScheduleData).forEach(([day, dayData]) => {
    if (dayData.hasSlots && dayData.slots?.length > 0) {
      totalSlots += dayData.slots.length;
      if (weekdays.includes(day)) {
        daysWithActivity++;
      }
    }
  });
  
  const weeklySlots = totalSlots;
  const utilizationRate = daysWithActivity > 0 ? (daysWithActivity / weekdays.length) * 100 : 0;
  const weeksRemaining = Math.ceil(realRemainingDays / 7);
  const estimatedVisits = weeklySlots * weeksRemaining;
  
  return {
    totalSlotsReserved: totalSlots,
    weeklySlots,
    daysWithActivity,
    utilizationRate: Math.round(utilizationRate),
    remainingDays: realRemainingDays,
    estimatedVisits
  };
};

const ScheduleManager = ({ onBack }) => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useApp();
  const queryClient = useQueryClient();
  
  // Estados
  const [changingSlot, setChangingSlot] = useState(null); // { day: 'monday', slotId: 123 } o { day: 'monday', slotId: null } para agregar
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Query para horarios actuales
  const { data: currentSchedule, isLoading: scheduleLoading, refetch: refetchSchedule, error: scheduleError } = useQuery({
    queryKey: ['currentSchedule', user?.id, refreshTrigger],
    queryFn: async () => {
      try {
        const response = await apiService.getCurrentSchedule();
        return response?.hasMembership ? response : { hasMembership: false };
      } catch (error) {
        if (error.response?.status === 404) {
          return { hasMembership: false };
        }
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000,
    retry: 1
  });

  // Query para opciones disponibles (solo cuando estamos cambiando un slot)
  const { data: availableOptions, isLoading: optionsLoading } = useQuery({
    queryKey: ['availableScheduleOptions', changingSlot?.day],
    queryFn: async () => {
      try {
        const response = await apiService.getAvailableScheduleOptions(changingSlot.day);
        return response;
      } catch (error) {
        return { availableOptions: {} };
      }
    },
    enabled: !!changingSlot,
    staleTime: 1 * 60 * 1000
  });

  // Mutación para cambiar horarios
  const changeScheduleMutation = useMutation({
    mutationFn: async (newSchedule) => {
      return apiService.changeClientSchedule(newSchedule);
    },
    onSuccess: () => {
      showSuccess('Horario actualizado exitosamente');
      setChangingSlot(null);
      setRefreshTrigger(prev => prev + 1);
      queryClient.invalidateQueries(['currentSchedule']);
    },
    onError: (error) => {
      if (error.unavailableSlots) {
        showError('El horario seleccionado ya no está disponible');
      } else {
        showError('Error cambiando horario: ' + (error.message || 'Error desconocido'));
      }
    }
  });

  // Handlers
  const handleStartChange = (day, currentSlotId = null) => {
    setChangingSlot({ day, slotId: currentSlotId });
  };

  const handleSelectNewSlot = (day, newSlotId) => {
    // Crear el objeto de cambio para el backend
    const changeData = {
      [day]: [newSlotId] // Siempre máximo 1 slot por día
    };
    
    changeScheduleMutation.mutate(changeData);
  };

  const handleCancelChange = () => {
    setChangingSlot(null);
  };

  const handleRefresh = () => {
    refetchSchedule();
    setRefreshTrigger(prev => prev + 1);
  };

  // Verificar si hay membresía
  const hasMembership = currentSchedule?.hasMembership;
  const membership = currentSchedule?.membership;

  if (scheduleError && scheduleError.response?.status !== 404) {
    return <ErrorConnectionComponent onBack={onBack} onRefresh={handleRefresh} />;
  }

  if (!hasMembership) {
    return <NoMembershipMessage onBack={onBack} />;
  }

  // Calcular estadísticas automáticas
  const autoStats = calculateAutoStats(currentSchedule, membership);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="btn-secondary btn-sm mr-4 flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mis Horarios</h2>
            <p className="text-gray-600">Gestiona tus horarios de entrenamiento</p>
          </div>
        </div>
        
        <button onClick={handleRefresh} className="btn-outline btn-sm flex items-center" disabled={scheduleLoading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${scheduleLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Información de membresía */}
      {membership && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <Timer className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-900">
                  {membership.plan?.planName || membership.type || 'Membresía Activa'}
                </h3>
                <p className="text-blue-700">
                  <strong>{autoStats.remainingDays}</strong> días restantes • <strong>{autoStats.weeklySlots}</strong> horarios semanales
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{autoStats.utilizationRate}%</div>
              <div className="text-sm text-blue-600">Utilización</div>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas automáticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Horarios Activos" value={autoStats.totalSlotsReserved} icon={Calendar} color="blue" subtitle="por semana" />
        <StatCard title="Días Restantes" value={autoStats.remainingDays} icon={Clock3} color="orange" subtitle="de membresía" />
        <StatCard title="Visitas Estimadas" value={autoStats.estimatedVisits} icon={Activity} color="green" subtitle="restantes" />
        <StatCard title="Días Activos" value={autoStats.daysWithActivity} icon={Target} color="purple" subtitle="de 5 hábiles" />
      </div>

      {/* Vista principal de horarios */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2" />
            Mi Calendario Semanal
          </h3>
        </div>
        
        {scheduleLoading ? (
          <div className="text-center py-12">
            <LoadingSpinner />
            <p className="text-gray-600 mt-4">Cargando tus horarios...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {Object.entries(currentSchedule.currentSchedule || {}).map(([day, dayData]) => (
              <SimpleWeekDayRow
                key={day}
                day={day}
                dayData={dayData}
                onStartChange={handleStartChange}
                isChanging={changingSlot?.day === day}
                canEdit={autoStats.remainingDays > 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal/Panel para cambiar horario */}
      {changingSlot && (
        <ChangeSlotModal
          day={changingSlot.day}
          currentSlotId={changingSlot.slotId}
          availableOptions={availableOptions?.availableOptions?.[changingSlot.day]}
          isLoading={optionsLoading}
          onSelectSlot={handleSelectNewSlot}
          onCancel={handleCancelChange}
          isUpdating={changeScheduleMutation.isLoading}
        />
      )}
    </div>
  );
};

// ================================
// 🧩 COMPONENTE SIMPLE PARA CADA DÍA
// ================================

const SimpleWeekDayRow = ({ day, dayData, onStartChange, isChanging, canEdit }) => {
  const isToday = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return day === today;
  };

  const dayNameSpanish = DIAS_ESPANOL[day] || dayData.dayName || day;

  return (
    <div className={`p-6 ${isToday() ? 'bg-blue-50 border-l-4 border-blue-500' : ''} ${isChanging ? 'bg-yellow-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-4">
            <h4 className={`text-lg font-semibold ${isToday() ? 'text-blue-900' : 'text-gray-900'}`}>
              {dayNameSpanish}
              {isToday() && (
                <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  Hoy
                </span>
              )}
            </h4>
          </div>
        </div>
        
        <div className="flex-1 mx-6">
          {dayData.hasSlots ? (
            <div className="flex flex-wrap gap-2">
              {dayData.slots.map((slot, index) => (
                <div key={slot.id || index} className="flex items-center bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="font-medium text-gray-900">{slot.timeRange}</span>
                    {slot.label && (
                      <span className="ml-2 text-gray-500 text-sm">({slot.label})</span>
                    )}
                  </div>
                  
                  {canEdit && (
                    <button
                      onClick={() => onStartChange(day, slot.id)}
                      disabled={isChanging}
                      className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Cambiar
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center">
              <span className="text-gray-500 italic mr-4">Sin horarios programados</span>
              {canEdit && (
                <button
                  onClick={() => onStartChange(day, null)}
                  disabled={isChanging}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar Horario
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ================================
// 🎯 MODAL PARA CAMBIAR HORARIO
// ================================

const ChangeSlotModal = ({ 
  day, 
  currentSlotId, 
  availableOptions, 
  isLoading, 
  onSelectSlot, 
  onCancel, 
  isUpdating 
}) => {
  const [filterFranja, setFilterFranja] = useState('all');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const dayNameSpanish = DIAS_ESPANOL[day] || day;
  const isAdding = currentSlotId === null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando horarios disponibles...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!availableOptions?.isOpen || !availableOptions?.slots?.length) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin horarios disponibles</h3>
            <p className="text-gray-600 mb-4">No hay horarios disponibles para {dayNameSpanish}</p>
            <button onClick={onCancel} className="btn-secondary">Cerrar</button>
          </div>
        </div>
      </div>
    );
  }

  // Agrupar horarios por franjas
  const franjas = agruparHorariosPorFranja(availableOptions.slots);
  
  // Filtrar slots según la franja seleccionada
  const slotsToShow = filterFranja === 'all' 
    ? availableOptions.slots 
    : franjas[filterFranja]?.slots || [];

  // Mostrar solo los primeros 6 si no está expandido
  const displaySlots = isExpanded ? slotsToShow : slotsToShow.slice(0, 6);
  const hasMoreSlots = slotsToShow.length > 6;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {isAdding ? `Agregar horario - ${dayNameSpanish}` : `Cambiar horario - ${dayNameSpanish}`}
            </h3>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Filtros */}
        {availableOptions.slots.length > 6 && (
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <div className="flex space-x-1">
                <button
                  onClick={() => setFilterFranja('all')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filterFranja === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  Todos ({availableOptions.slots.length})
                </button>
                {Object.entries(franjas).map(([key, franja]) => (
                  franja.slots.length > 0 && (
                    <button
                      key={key}
                      onClick={() => setFilterFranja(key)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        filterFranja === key
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {franja.label.split(' ')[1]} ({franja.slots.length})
                    </button>
                  )
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contenido */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displaySlots.map((slot) => {
              const canSelect = slot.canReserve || slot.isCurrentlyMine;
              const isCurrent = slot.isCurrentlyMine;
              
              return (
                <button
                  key={slot.id}
                  onClick={() => canSelect && onSelectSlot(day, slot.id)}
                  disabled={!canSelect || isUpdating}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    ${isCurrent ? 
                      'border-blue-500 bg-blue-50 ring-1 ring-blue-200' :
                      canSelect ? 
                        'border-gray-200 hover:border-green-400 hover:bg-green-50 hover:shadow-md' :
                        'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="mb-2">
                    <div className="font-semibold text-gray-900">{slot.timeRange}</div>
                    {slot.label && (
                      <div className="text-xs text-gray-500 mt-1">{slot.label}</div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center text-xs">
                      <Users className="w-3 h-3 mr-1 text-gray-400" />
                      <span className="text-gray-600">
                        {slot.available} de {slot.capacity} disponibles
                      </span>
                    </div>
                    
                    <div className="flex space-x-1">
                      {isCurrent && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          Mi horario actual
                        </span>
                      )}
                      {slot.status === 'full' && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                          Lleno
                        </span>
                      )}
                      {slot.status === 'available' && slot.available <= 3 && slot.available > 0 && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                          Pocos cupos
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Botón mostrar más */}
          {hasMoreSlots && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Mostrar menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Ver {slotsToShow.length - 6} horarios más
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button onClick={onCancel} className="btn-secondary" disabled={isUpdating}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ================================
// 🧩 COMPONENTES AUXILIARES
// ================================

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color]} mr-3`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-600">{title}</div>
          {subtitle && (
            <div className="text-xs text-gray-500">{subtitle}</div>
          )}
        </div>
      </div>
    </div>
  );
};

const ErrorConnectionComponent = ({ onBack, onRefresh }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <button onClick={onBack} className="btn-secondary btn-sm mr-4 flex items-center">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver
        </button>
        <h2 className="text-xl font-semibold text-gray-900">Mis Horarios</h2>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">Error de Conexión</h3>
        <p className="text-red-700 mb-4">
          No se pudo conectar con el servidor. Verifica tu conexión a internet.
        </p>
        <button onClick={onRefresh} className="btn-primary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </button>
      </div>
    </div>
  );
};

const NoMembershipMessage = ({ onBack }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <button onClick={onBack} className="btn-secondary btn-sm mr-4 flex items-center">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver
        </button>
        <h2 className="text-xl font-semibold text-gray-900">Mis Horarios</h2>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-8 text-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          
          <h3 className="text-2xl font-bold text-red-800 mb-3">
            Necesitas una membresía activa
          </h3>
          
          <p className="text-red-700 mb-6 max-w-md">
            Para gestionar horarios de entrenamiento, primero necesitas obtener 
            una membresía del gimnasio.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => window.location.href = '/dashboard/client?section=membership'}
              className="btn-primary px-8 py-3 text-lg font-bold hover:scale-105 transition-transform"
            >
              <Zap className="w-5 h-5 mr-2" />
              Obtener Membresía
            </button>
            
            <button
              onClick={() => window.open('/contact', '_blank')}
              className="btn-outline px-6 py-3"
            >
              <Users className="w-4 h-4 mr-2" />
              Contactar Gimnasio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleManager;