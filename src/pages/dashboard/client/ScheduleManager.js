// Autor: Alexander Echeverria
// src/pages/dashboard/client/ScheduleManager.js
// MEJORADO: Sin modo edición y con información de ocupación corregida

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
  Trash2,
  Eye,
  Save,
  X,
  Timer,
  Users,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Info,
  Star,
  Zap,
  Target,
  Activity,
  Calendar as CalendarIcon,
  ChevronRight,
  Check,
  Clock3,
  MapPin,
  Settings,
  PlusCircle,
  MinusCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  Copy,
  RotateCcw,
  Sparkles,
  RefreshCw as Refresh
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

const traducirDia = (dia) => {
  if (!dia) return dia;
  return DIAS_ESPANOL[dia] || dia;
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
      monthlySlots: 0,
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
  const monthlySlots = weeklySlots * 4;
  const utilizationRate = daysWithActivity > 0 ? (daysWithActivity / weekdays.length) * 100 : 0;
  const weeksRemaining = Math.ceil(realRemainingDays / 7);
  const estimatedVisits = weeklySlots * weeksRemaining;
  
  return {
    totalSlotsReserved: totalSlots,
    weeklySlots,
    monthlySlots,
    daysWithActivity,
    utilizationRate: Math.round(utilizationRate),
    remainingDays: realRemainingDays,
    estimatedVisits
  };
};

const ScheduleManager = ({ onBack }) => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo, isMobile } = useApp();
  const queryClient = useQueryClient();
  
  // Estados simplificados (sin editMode)
  const [selectedChanges, setSelectedChanges] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [expandedDays, setExpandedDays] = useState(new Set());

  // Query para horarios actuales
  const { data: currentSchedule, isLoading: scheduleLoading, refetch: refetchSchedule, error: scheduleError } = useQuery({
    queryKey: ['currentSchedule', user?.id, refreshTrigger],
    queryFn: async () => {
      try {
        console.log('📅 Obteniendo horarios actuales via apiService...');
        const response = await apiService.getCurrentSchedule();
        console.log('📅 Horarios actuales recibidos:', response);
        return response?.hasMembership ? response : { hasMembership: false };
      } catch (error) {
        console.error('❌ Error obteniendo horarios:', error);
        if (error.response?.status === 404) {
          return { hasMembership: false };
        }
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000,
    retry: 1
  });

  // Query para opciones disponibles (siempre activa)
  const { data: availableOptions, isLoading: optionsLoading, refetch: refetchOptions } = useQuery({
    queryKey: ['availableScheduleOptions', refreshTrigger],
    queryFn: async () => {
      try {
        if (!currentSchedule?.hasMembership) {
          console.warn('❌ No hay membresía para obtener opciones');
          return { availableOptions: {} };
        }

        console.log('🔍 Obteniendo opciones disponibles via apiService...');
        const response = await apiService.getAvailableScheduleOptions();
        console.log('✅ Opciones disponibles recibidas:', response);

        if (response?.availableOptions) {
          return response;
        }

        console.warn('⚠️ No se encontraron availableOptions en la respuesta');
        return { availableOptions: {} };

      } catch (error) {
        console.error('❌ Error obteniendo opciones:', error);
        return { 
          availableOptions: {},
          error: error.message || 'Error desconocido'
        };
      }
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!currentSchedule?.hasMembership
  });

  // Mutación para cambiar horarios
  const changeScheduleMutation = useMutation({
    mutationFn: async (changes) => {
      console.log('📤 Enviando cambios via apiService:', changes);
      return apiService.changeClientSchedule(changes);
    },
    onSuccess: () => {
      showSuccess('Horarios actualizados exitosamente');
      setSelectedChanges({});
      setExpandedDays(new Set());
      setRefreshTrigger(prev => prev + 1);
      queryClient.invalidateQueries(['currentSchedule']);
      queryClient.invalidateQueries(['availableScheduleOptions']);
    },
    onError: (error) => {
      console.error('❌ Error en mutación:', error);
      if (error.unavailableSlots) {
        showError('Algunos horarios ya no están disponibles');
      } else {
        showError('Error cambiando horarios: ' + (error.message || 'Error desconocido'));
      }
    }
  });

  // Mutación para cancelar horario individual
  const cancelSlotMutation = useMutation({
    mutationFn: async ({ day, slotId }) => {
      const validSlotId = extractSlotId(slotId);
      if (!validSlotId) throw new Error('ID de slot inválido');
      console.log(`🗑️ Cancelando slot via apiService: ${day}/${validSlotId}`);
      return apiService.cancelScheduleSlot(day, validSlotId);
    },
    onSuccess: () => {
      showSuccess('Horario cancelado exitosamente');
      setRefreshTrigger(prev => prev + 1);
      queryClient.invalidateQueries(['currentSchedule']);
      queryClient.invalidateQueries(['availableScheduleOptions']);
    },
    onError: (error) => {
      showError('Error cancelando horario: ' + (error.message || 'Error desconocido'));
    }
  });

  // Handlers
  const handleSlotSelection = (day, slotId) => {
    const validSlotId = extractSlotId(slotId);
    if (!validSlotId) return;

    console.log('🎯 Seleccionando slot:', { day, validSlotId });

    setSelectedChanges(prev => {
      const newChanges = { ...prev };
      
      if (!newChanges[day]) {
        newChanges[day] = [];
      }
      
      const index = newChanges[day].findIndex(id => extractSlotId(id) === validSlotId);
      if (index > -1) {
        newChanges[day].splice(index, 1);
        if (newChanges[day].length === 0) {
          delete newChanges[day];
        }
      } else {
        newChanges[day] = [validSlotId];
      }
      
      console.log('🔄 Cambios actualizados:', newChanges);
      return newChanges;
    });
  };

  const handleApplyChanges = () => {
    if (Object.keys(selectedChanges).length === 0) {
      showInfo('No hay cambios para aplicar');
      return;
    }

    const validatedChanges = {};
    Object.entries(selectedChanges).forEach(([day, slots]) => {
      const validSlots = slots.map(extractSlotId).filter(id => id !== null);
      if (validSlots.length > 0) {
        validatedChanges[day] = validSlots;
      }
    });

    console.log('✅ Aplicando cambios validados:', validatedChanges);
    changeScheduleMutation.mutate(validatedChanges);
  };

  const handleCancelSlot = (day, slotId) => {
    const validSlotId = extractSlotId(slotId);
    if (!validSlotId) {
      showError('ID de horario inválido');
      return;
    }

    if (window.confirm('¿Seguro que quieres cancelar este horario?')) {
      cancelSlotMutation.mutate({ day, slotId: validSlotId });
    }
  };

  const toggleDayExpansion = (day) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(day)) {
        newSet.delete(day);
      } else {
        newSet.add(day);
      }
      return newSet;
    });
  };

  const handleRefresh = () => {
    refetchSchedule();
    refetchOptions();
    setRefreshTrigger(prev => prev + 1);
  };

  // Verificaciones
  const hasMembership = currentSchedule?.hasMembership;
  const membership = currentSchedule?.membership;

  if (scheduleError && scheduleError.response?.status !== 404) {
    return <ErrorConnectionComponent onBack={onBack} onRefresh={handleRefresh} />;
  }

  if (!hasMembership) {
    return <NoMembershipMessage onBack={onBack} />;
  }

  const autoStats = calculateAutoStats(currentSchedule, membership);

  return (
    <div className="space-y-6">
      
      {/* Header simplificado */}
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
        
        <div className="flex space-x-2">
          <button onClick={handleRefresh} className="btn-outline btn-sm flex items-center" disabled={scheduleLoading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${scheduleLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
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

      {/* Cambios pendientes */}
      {Object.keys(selectedChanges).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Info className="w-5 h-5 text-amber-600 mr-2" />
              <div>
                <h3 className="font-semibold text-amber-900">Cambios Pendientes</h3>
                <p className="text-amber-700 text-sm">
                  {Object.keys(selectedChanges).length} día{Object.keys(selectedChanges).length !== 1 ? 's' : ''} • {
                    Object.values(selectedChanges).reduce((sum, slots) => sum + slots.length, 0)
                  } horario{Object.values(selectedChanges).reduce((sum, slots) => sum + slots.length, 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedChanges({})}
                disabled={changeScheduleMutation.isLoading}
                className="btn-outline btn-sm"
              >
                <X className="w-4 h-4 mr-1" />
                Limpiar
              </button>
              <button
                onClick={handleApplyChanges}
                disabled={changeScheduleMutation.isLoading}
                className="btn-primary btn-sm"
              >
                {changeScheduleMutation.isLoading ? (
                  <>
                    <div className="w-4 h-4 mr-1 animate-spin rounded-full border-b-2 border-white"></div>
                    Aplicando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendario semanal */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              Tu Calendario Semanal
            </h3>
            <span className="text-sm text-gray-600 bg-green-100 px-3 py-1 rounded-full">
              Edición Siempre Activa
            </span>
          </div>
        </div>
        
        {scheduleLoading ? (
          <div className="text-center py-12">
            <LoadingSpinner />
            <p className="text-gray-600 mt-4">Cargando tus horarios...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {Object.entries(currentSchedule.currentSchedule || {}).map(([day, dayData]) => (
              <WeekDayRowImproved
                key={day}
                day={day}
                dayData={dayData}
                availableOptions={availableOptions?.availableOptions?.[day]}
                selectedChanges={selectedChanges[day] || []}
                onSlotSelection={handleSlotSelection}
                onCancelSlot={handleCancelSlot}
                onExpandDay={toggleDayExpansion}
                isExpanded={expandedDays.has(day)}
                isUpdating={cancelSlotMutation.isLoading}
                optionsLoading={optionsLoading}
                optionsError={availableOptions?.error}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ================================
// 🧩 COMPONENTE PARA CADA DÍA - MEJORADO
// ================================

const WeekDayRowImproved = ({ 
  day, 
  dayData, 
  availableOptions, 
  selectedChanges, 
  onSlotSelection, 
  onCancelSlot, 
  onExpandDay,
  isExpanded,
  isUpdating,
  optionsLoading,
  optionsError
}) => {
  const isToday = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return day === today;
  };

  const dayNameSpanish = DIAS_ESPANOL[day] || traducirDia(dayData.dayName || day);
  const hasAvailableSlots = availableOptions?.isOpen && availableOptions?.slots?.length > 0;

  return (
    <div className={`${isToday() ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
      {/* Header del día */}
      <div className="p-6">
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
              <p className="text-sm text-gray-600 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {dayData.hasSlots ? 
                  `${dayData.slots.length} horario${dayData.slots.length !== 1 ? 's' : ''}` : 
                  'Sin horarios'
                }
              </p>
            </div>
          </div>
          
          {/* Botón para expandir (siempre visible) */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onExpandDay(isExpanded ? null : day)}
              className="btn-primary btn-sm flex items-center"
              disabled={optionsLoading}
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              {isExpanded ? 'Ocultar Opciones' : 'Ver/Cambiar Horarios'}
            </button>
          </div>
        </div>
        
        {/* Horarios actuales */}
        {dayData.hasSlots && (
          <div className="mt-4 space-y-2">
            {dayData.slots.map((slot, index) => (
              <CurrentSlotCardImproved
                key={slot.id || index}
                slot={slot}
                day={day}
                onCancelSlot={onCancelSlot}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        )}
        
        {/* Sin horarios actuales */}
        {!dayData.hasSlots && (
          <div className="mt-4">
            <div className="w-full p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-dashed border-green-300 rounded-lg">
              <div className="text-center">
                <PlusCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-green-700 font-medium">Sin horarios para {dayNameSpanish}</p>
                <p className="text-green-600 text-sm">Haz clic en "Ver/Cambiar Horarios" para agregar</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Panel expandido (siempre disponible) */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          {optionsLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Cargando opciones...</p>
            </div>
          ) : optionsError ? (
            <div className="text-center py-4 text-red-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Error: {optionsError}</p>
            </div>
          ) : hasAvailableSlots ? (
            <AvailableSlotOptionsImproved
              day={day}
              dayName={dayNameSpanish}
              availableOptions={availableOptions}
              selectedChanges={selectedChanges}
              onSlotSelection={onSlotSelection}
            />
          ) : (
            <div className="text-center py-4 text-gray-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">
                {availableOptions ? 
                  'No hay horarios disponibles para este día' : 
                  'Cargando opciones disponibles...'
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ================================
// 🎯 OPCIONES DISPONIBLES MEJORADAS
// ================================

const AvailableSlotOptionsImproved = ({ 
  day, 
  dayName, 
  availableOptions, 
  selectedChanges, 
  onSlotSelection
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!availableOptions || !availableOptions.slots || availableOptions.slots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No hay slots disponibles para el {dayName}</p>
      </div>
    );
  }

  const slotsToShow = availableOptions.slots || [];
  const displaySlots = isExpanded ? slotsToShow : slotsToShow.slice(0, 6);
  const hasMoreSlots = slotsToShow.length > 6;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-900">
          Horarios Disponibles - {dayName}
        </h4>
        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
          {availableOptions.totalAvailable || slotsToShow.length} disponibles
        </span>
      </div>

      {availableOptions.currentlyHas > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <Info className="w-4 h-4 inline mr-1" />
            Actualmente tienes {availableOptions.currentlyHas} horario{availableOptions.currentlyHas !== 1 ? 's' : ''} el {dayName}
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {displaySlots.map((slot) => {
          const slotId = extractSlotId(slot.id);
          const isSelected = selectedChanges.some(id => extractSlotId(id) === slotId);
          const isCurrentlyMine = slot.isCurrentlyMine || false;
          
          return (
            <button
              key={slot.id}
              onClick={() => onSlotSelection(day, slot.id)}
              disabled={!slot.canSelect}
              className={`
                p-4 rounded-lg border-2 transition-all text-left relative overflow-hidden
                ${isSelected ? 
                  'border-green-500 bg-green-50 ring-2 ring-green-200 shadow-lg transform scale-105' :
                  isCurrentlyMine ?
                    'border-blue-500 bg-blue-50 ring-1 ring-blue-200' :
                    slot.canSelect ? 
                      'border-gray-200 hover:border-blue-300 hover:bg-blue-25 hover:shadow-md' :
                      'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                }
              `}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="bg-green-500 text-white rounded-full p-1">
                    <Check className="w-3 h-3" />
                  </div>
                </div>
              )}
              
              <div className="mb-3">
                <div className="font-semibold text-gray-900 text-lg">{slot.timeRange}</div>
                {slot.label && (
                  <div className="text-xs text-gray-500 mt-1">{slot.label}</div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-xs">
                  <Users className="w-3 h-3 mr-1 text-gray-400" />
                  <span className="text-gray-600">
                    {slot.available || 0} disponibles
                  </span>
                </div>
                
                <div className="flex space-x-1">
                  {isCurrentlyMine && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      Mi horario actual
                    </span>
                  )}
                  {slot.status === 'full' && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                      Lleno
                    </span>
                  )}
                  {slot.status === 'available' && (slot.available <= 3) && slot.available > 0 && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                      Pocos cupos
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {hasMoreSlots && (
        <div className="mt-4 text-center">
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
  );
};

// ================================
// 🧩 COMPONENTES AUXILIARES MEJORADOS
// ================================

const CurrentSlotCardImproved = ({ slot, day, onCancelSlot, isUpdating }) => {
  // Mejorar la información de ocupación
  const getOccupancyInfo = () => {
    const current = slot.currentReservations || 0;
    const capacity = slot.capacity || 1; // Default 1 si no hay capacidad definida
    
    // Si hay capacidad específica, usar esa
    if (slot.capacity && slot.capacity > 0) {
      return `${current}/${capacity}`;
    }
    
    // Si el slot está ocupado por el usuario actual, mostrar 1/1
    if (current > 0) {
      return `1/1`;
    }
    
    // Si no hay ocupación, mostrar 0/1
    return `0/1`;
  };

  const getAvailabilityStatus = () => {
    const available = slot.availability || 0;
    
    if (available > 5) {
      return { class: 'bg-green-100 text-green-700', text: `${available} disponibles` };
    } else if (available > 0) {
      return { class: 'bg-yellow-100 text-yellow-700', text: `${available} disponibles` };
    } else {
      return { class: 'bg-red-100 text-red-700', text: 'Lleno' };
    }
  };

  const occupancyInfo = getOccupancyInfo();
  const availabilityStatus = getAvailabilityStatus();

  return (
    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all group">
      <div className="flex items-center flex-1">
        <div className="bg-blue-100 p-3 rounded-lg mr-4">
          <Clock className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900 text-lg">{slot.timeRange}</div>
          {slot.label && (
            <div className="text-sm text-gray-500 mt-1">{slot.label}</div>
          )}
          <div className="flex items-center text-xs text-gray-400 mt-2 space-x-4">
            <div className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              <span>{occupancyInfo} ocupado</span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${availabilityStatus.class}`}>
              {availabilityStatus.text}
            </span>
          </div>
        </div>
      </div>
      
      {slot.canCancel && (
        <button
          onClick={() => onCancelSlot(day, slot.id)}
          disabled={isUpdating}
          className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ml-4"
          title="Cancelar este horario"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm font-medium">Cancelar</span>
        </button>
      )}
    </div>
  );
};

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