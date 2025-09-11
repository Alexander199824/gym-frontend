// Autor: Alexander Echeverria
// src/pages/dashboard/client/ScheduleManager.js
// GESTIÓN COMPLETA DE HORARIOS DEL CLIENTE

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
  Minus,
  Edit3,
  Trash2,
  Eye,
  Save,
  X,
  Timer,
  MapPin,
  Users,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Info,
  Star,
  Zap,
  Target
} from 'lucide-react';

import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

// Componentes
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const ScheduleManager = ({ onBack }) => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo, formatDate, isMobile } = useApp();
  const queryClient = useQueryClient();
  
  // Estados
  const [activeSection, setActiveSection] = useState('current'); // current, available, stats
  const [selectedChanges, setSelectedChanges] = useState({});
  const [previewMode, setPreviewMode] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Query para horarios actuales
  const { data: currentSchedule, isLoading: scheduleLoading, refetch: refetchSchedule } = useQuery({
    queryKey: ['currentSchedule', user?.id, refreshTrigger],
    queryFn: () => apiService.getCurrentSchedule(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      if (error.response?.status !== 404) {
        showError('Error cargando tus horarios actuales');
      }
    }
  });

  // Query para opciones disponibles
  const { data: availableOptions, isLoading: optionsLoading, refetch: refetchOptions } = useQuery({
    queryKey: ['availableScheduleOptions'],
    queryFn: () => apiService.getAvailableScheduleOptions(),
    staleTime: 2 * 60 * 1000,
    enabled: activeSection === 'available',
    onError: (error) => showError('Error cargando opciones disponibles')
  });

  // Query para estadísticas
  const { data: scheduleStats, isLoading: statsLoading } = useQuery({
    queryKey: ['scheduleStats', user?.id],
    queryFn: () => apiService.getScheduleStats(),
    staleTime: 5 * 60 * 1000,
    enabled: activeSection === 'stats',
    retry: 1,
    onError: (error) => {
      if (error.response?.status !== 404) {
        console.warn('Stats not available:', error.message);
      }
    }
  });

  // Mutación para cambiar horarios
  const changeScheduleMutation = useMutation({
    mutationFn: (changes) => apiService.changeClientSchedule(changes),
    onSuccess: (data) => {
      showSuccess('Horarios actualizados exitosamente');
      setSelectedChanges({});
      setPreviewMode(false);
      setRefreshTrigger(prev => prev + 1);
      queryClient.invalidateQueries(['currentSchedule']);
    },
    onError: (error) => {
      if (error.unavailableSlots) {
        showError('Algunos horarios ya no están disponibles');
        showUnavailableSlots(error.unavailableSlots);
      } else {
        showError('Error cambiando horarios: ' + error.message);
      }
    }
  });

  // Mutación para cancelar horario
  const cancelSlotMutation = useMutation({
    mutationFn: ({ day, slotId }) => apiService.cancelScheduleSlot(day, slotId),
    onSuccess: () => {
      showSuccess('Horario cancelado exitosamente');
      setRefreshTrigger(prev => prev + 1);
      queryClient.invalidateQueries(['currentSchedule']);
    },
    onError: (error) => {
      showError('Error cancelando horario: ' + error.message);
    }
  });

  // Handlers
  const handleSlotSelection = (day, slotId) => {
    setSelectedChanges(prev => {
      const newChanges = { ...prev };
      
      if (!newChanges[day]) {
        newChanges[day] = [];
      }
      
      const index = newChanges[day].indexOf(slotId);
      if (index > -1) {
        newChanges[day].splice(index, 1);
        if (newChanges[day].length === 0) {
          delete newChanges[day];
        }
      } else {
        newChanges[day].push(slotId);
      }
      
      return newChanges;
    });
  };

  const handleApplyChanges = () => {
    if (Object.keys(selectedChanges).length === 0) {
      showInfo('No hay cambios para aplicar');
      return;
    }

    changeScheduleMutation.mutate(selectedChanges);
  };

  const handleCancelSlot = (day, slotId) => {
    if (window.confirm('¿Seguro que quieres cancelar este horario?')) {
      cancelSlotMutation.mutate({ day, slotId });
    }
  };

  const handleRefresh = () => {
    refetchSchedule();
    refetchOptions();
    setRefreshTrigger(prev => prev + 1);
  };

  const showUnavailableSlots = (unavailableSlots) => {
    const slotsText = unavailableSlots.map(slot => `${slot.day}: ${slot.reason}`).join('\n');
    alert('Horarios no disponibles:\n' + slotsText);
  };

  // Verificar si hay membresía
  const hasMembership = currentSchedule?.hasMembership;
  const membership = currentSchedule?.membership;

  if (!hasMembership) {
    return <NoMembershipMessage onBack={onBack} />;
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="btn-secondary btn-sm mr-4 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Gestión de Horarios
            </h2>
            <p className="text-gray-600">
              Administra tus horarios de entrenamiento
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="btn-outline btn-sm flex items-center"
            disabled={scheduleLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${scheduleLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Información de membresía */}
      {membership && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Timer className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <h3 className="font-semibold text-blue-900">
                Plan: {membership.summary?.plan || 'Membresía Activa'}
              </h3>
              <p className="text-blue-700 text-sm">
                {membership.summary?.slotsInfo || 'Gestiona tus horarios de entrenamiento'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navegación de secciones */}
      <div className="bg-white rounded-lg shadow-sm p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveSection('current')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSection === 'current'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-4 h-4 mr-2 inline" />
            Mis Horarios
          </button>
          
          <button
            onClick={() => setActiveSection('available')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSection === 'available'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Cambiar Horarios
          </button>
          
          <button
            onClick={() => setActiveSection('stats')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSection === 'stats'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2 inline" />
            Estadísticas
          </button>
        </div>
      </div>

      {/* Contenido de la sección */}
      {activeSection === 'current' && (
        <CurrentScheduleSection
          schedule={currentSchedule}
          isLoading={scheduleLoading}
          onCancelSlot={handleCancelSlot}
          onRefresh={handleRefresh}
          isUpdating={cancelSlotMutation.isLoading}
        />
      )}

      {activeSection === 'available' && (
        <ChangeScheduleSection
          availableOptions={availableOptions}
          isLoading={optionsLoading}
          selectedChanges={selectedChanges}
          onSlotSelection={handleSlotSelection}
          onApplyChanges={handleApplyChanges}
          onClearChanges={() => setSelectedChanges({})}
          isUpdating={changeScheduleMutation.isLoading}
        />
      )}

      {activeSection === 'stats' && (
        <StatsSection
          stats={scheduleStats}
          schedule={currentSchedule}
          isLoading={statsLoading}
        />
      )}
    </div>
  );
};

// Sección: Horarios actuales
const CurrentScheduleSection = ({ 
  schedule, 
  isLoading, 
  onCancelSlot, 
  onRefresh,
  isUpdating 
}) => {
  const { formatDate } = useApp();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner />
        <p className="text-gray-600 mt-4">Cargando tus horarios...</p>
      </div>
    );
  }

  if (!schedule?.currentSchedule) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Sin horarios configurados
        </h3>
        <p className="text-gray-600 mb-6">
          Aún no tienes horarios de entrenamiento configurados.
        </p>
        <button
          onClick={onRefresh}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Configurar Horarios
        </button>
      </div>
    );
  }

  const currentScheduleData = schedule.currentSchedule;
  const totalSlots = Object.values(currentScheduleData).reduce((sum, day) => 
    day.hasSlots ? day.slots.length : 0, 0
  );

  return (
    <div className="space-y-6">
      
      {/* Resumen */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Resumen de Horarios
          </h3>
          <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
            {totalSlots} horario{totalSlots !== 1 ? 's' : ''} activo{totalSlots !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalSlots}</div>
            <div className="text-sm text-gray-600">Total horarios</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(currentScheduleData).filter(day => day.hasSlots).length}
            </div>
            <div className="text-sm text-gray-600">Días activos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {schedule.membership?.summary?.plan || 'Plan'}
            </div>
            <div className="text-sm text-gray-600">Tu plan</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {schedule.membership?.summary?.daysUntilExpiry || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Días restantes</div>
          </div>
        </div>
      </div>

      {/* Calendario semanal */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">
            Tu Calendario Semanal
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {Object.entries(currentScheduleData).map(([day, dayData]) => (
            <DayScheduleRow
              key={day}
              day={day}
              dayData={dayData}
              onCancelSlot={onCancelSlot}
              isUpdating={isUpdating}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente: Fila de día en el calendario
const DayScheduleRow = ({ day, dayData, onCancelSlot, isUpdating }) => {
  const isToday = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return day === today;
  };

  return (
    <div className={`p-6 ${isToday() ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-4">
            <h4 className={`font-semibold ${isToday() ? 'text-blue-900' : 'text-gray-900'}`}>
              {dayData.dayName}
              {isToday() && (
                <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  Hoy
                </span>
              )}
            </h4>
            <p className="text-sm text-gray-600">
              {dayData.hasSlots ? `${dayData.slots.length} horario${dayData.slots.length !== 1 ? 's' : ''}` : 'Sin horarios'}
            </p>
          </div>
        </div>
        
        <div className="flex-1 mx-6">
          {dayData.hasSlots ? (
            <div className="flex flex-wrap gap-2">
              {dayData.slots.map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center bg-gray-100 rounded-lg px-3 py-2 text-sm"
                >
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-medium">{slot.timeRange}</span>
                  {slot.label && (
                    <span className="ml-2 text-gray-500">({slot.label})</span>
                  )}
                  <button
                    onClick={() => onCancelSlot(day, slot.id)}
                    disabled={isUpdating}
                    className="ml-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                    title="Cancelar horario"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 italic">Sin horarios este día</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sección: Cambiar horarios
const ChangeScheduleSection = ({ 
  availableOptions, 
  isLoading, 
  selectedChanges, 
  onSlotSelection,
  onApplyChanges,
  onClearChanges,
  isUpdating 
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner />
        <p className="text-gray-600 mt-4">Cargando opciones disponibles...</p>
      </div>
    );
  }

  if (!availableOptions?.availableOptions) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Sin opciones disponibles
        </h3>
        <p className="text-gray-600">
          No hay horarios disponibles para cambios en este momento.
        </p>
      </div>
    );
  }

  const hasChanges = Object.keys(selectedChanges).length > 0;

  return (
    <div className="space-y-6">
      
      {/* Controles */}
      {hasChanges && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Info className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <h3 className="font-semibold text-blue-900">
                  Cambios seleccionados
                </h3>
                <p className="text-blue-700 text-sm">
                  {Object.keys(selectedChanges).length} día{Object.keys(selectedChanges).length !== 1 ? 's' : ''} • {
                    Object.values(selectedChanges).reduce((sum, slots) => sum + slots.length, 0)
                  } horario{Object.values(selectedChanges).reduce((sum, slots) => sum + slots.length, 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={onClearChanges}
                className="btn-outline btn-sm"
                disabled={isUpdating}
              >
                <X className="w-4 h-4 mr-1" />
                Limpiar
              </button>
              <button
                onClick={onApplyChanges}
                className="btn-primary btn-sm"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 mr-1 animate-spin rounded-full border-b-2 border-white"></div>
                    Aplicando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Aplicar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Opciones por día */}
      <div className="space-y-4">
        {Object.entries(availableOptions.availableOptions).map(([day, dayData]) => (
          <AvailableDayOptions
            key={day}
            day={day}
            dayData={dayData}
            selectedSlots={selectedChanges[day] || []}
            onSlotSelection={onSlotSelection}
          />
        ))}
      </div>
    </div>
  );
};

// Componente: Opciones de día disponible
const AvailableDayOptions = ({ day, dayData, selectedSlots, onSlotSelection }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {dayData.dayName}
        </h3>
        <span className="text-sm text-gray-600">
          {dayData.isOpen ? 
            `${dayData.slots?.filter(s => s.status === 'available').length || 0} disponibles` :
            'Cerrado'
          }
        </span>
      </div>
      
      {dayData.isOpen ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {dayData.slots?.map((slot) => (
            <button
              key={slot.id}
              onClick={() => onSlotSelection(day, slot.id)}
              disabled={slot.status !== 'available' && !slot.isCurrentlyMine}
              className={`
                p-3 rounded-lg border transition-all text-left
                ${selectedSlots.includes(slot.id) ? 
                  'border-primary-500 bg-primary-50 ring-2 ring-primary-200' :
                  slot.status === 'available' ? 
                    'border-gray-200 hover:border-primary-300 hover:bg-primary-25' :
                    slot.isCurrentlyMine ?
                      'border-green-200 bg-green-50' :
                      'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-900">
                  {slot.timeRange}
                </div>
                <div className="text-xs">
                  {slot.isCurrentlyMine && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Actual
                    </span>
                  )}
                  {slot.status === 'available' && !slot.isCurrentlyMine && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {slot.available} disponibles
                    </span>
                  )}
                  {slot.status === 'full' && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      Lleno
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Gimnasio cerrado este día</p>
        </div>
      )}
    </div>
  );
};

// Sección: Estadísticas
const StatsSection = ({ stats, schedule, isLoading }) => {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner />
        <p className="text-gray-600 mt-4">Cargando estadísticas...</p>
      </div>
    );
  }

  const localStats = schedule ? calculateLocalStats(schedule) : null;
  const displayStats = stats || localStats;

  if (!displayStats) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Sin estadísticas disponibles
        </h3>
        <p className="text-gray-600">
          Las estadísticas aparecerán cuando tengas horarios activos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Horarios"
          value={displayStats.totalSlots || 0}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Horarios Usados"
          value={displayStats.usedSlots || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Disponibles"
          value={displayStats.availableSlots || 0}
          icon={Plus}
          color="purple"
        />
        <StatCard
          title="Total Visitas"
          value={displayStats.totalVisits || 0}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Horario favorito */}
      {displayStats.favoriteTime && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <Star className="w-5 h-5 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Tu Horario Favorito
            </h3>
          </div>
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-primary-600 mr-4" />
            <div>
              <div className="font-semibold text-xl text-gray-900">
                {displayStats.favoriteTime}
              </div>
              <div className="text-gray-600">
                Tu horario más frecuente de entrenamiento
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distribución por día */}
      {displayStats.dayDistribution && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución por Día
          </h3>
          <div className="space-y-3">
            {Object.entries(displayStats.dayDistribution).map(([day, count]) => (
              <div key={day} className="flex items-center justify-between">
                <span className="capitalize font-medium">{day}</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${(count / Math.max(...Object.values(displayStats.dayDistribution))) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente: Tarjeta de estadística
const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="ml-4">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-600">{title}</div>
        </div>
      </div>
    </div>
  );
};

// Componente: Sin membresía
const NoMembershipMessage = ({ onBack }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <button
          onClick={onBack}
          className="btn-secondary btn-sm mr-4 flex items-center"
        >
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

// Helper: Calcular estadísticas locales
const calculateLocalStats = (schedule) => {
  if (!schedule?.currentSchedule) return null;

  const currentScheduleData = schedule.currentSchedule;
  const dayNames = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles', 
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  const totalSlots = Object.values(currentScheduleData).reduce((sum, day) => 
    day.hasSlots ? day.slots.length : 0, 0
  );

  const dayDistribution = {};
  let allTimes = [];

  Object.entries(currentScheduleData).forEach(([day, dayData]) => {
    const dayName = dayNames[day] || day;
    dayDistribution[dayName] = dayData.hasSlots ? dayData.slots.length : 0;
    
    if (dayData.hasSlots) {
      allTimes.push(...dayData.slots.map(slot => slot.timeRange));
    }
  });

  // Encontrar horario más común
  const timeFrequency = {};
  allTimes.forEach(time => {
    timeFrequency[time] = (timeFrequency[time] || 0) + 1;
  });

  const favoriteTime = Object.keys(timeFrequency).reduce((a, b) => 
    timeFrequency[a] > timeFrequency[b] ? a : b, null
  );

  return {
    totalSlots,
    usedSlots: totalSlots,
    availableSlots: 0, // Los slots actuales están siendo usados
    totalVisits: totalSlots * 4, // Estimación semanal
    favoriteTime,
    dayDistribution
  };
};

export default ScheduleManager;