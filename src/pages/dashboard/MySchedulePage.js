// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/MySchedulePage.js
// FUNCIÓN: Gestión completa de horarios para clientes con membresía

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Eye,
  ArrowLeft,
  Save,
  X,
  Info,
  CreditCard,
  MapPin,
  Phone,
  Users,
  Star,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';
import membershipService from '../../services/membershipService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import MembershipCard from '../../components/memberships/MembershipCard';

// Función auxiliar para formatear en Quetzales
const formatQuetzales = (amount) => {
  if (!amount || isNaN(amount)) return 'Q 0.00';
  return `Q ${parseFloat(amount).toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const MySchedulePage = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo, formatDate } = useApp();
  const queryClient = useQueryClient();
  
  // Estados locales
  const [activeTab, setActiveTab] = useState('current'); // 'current', 'available', 'membership'
  const [selectedChanges, setSelectedChanges] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // QUERIES PARA DATOS DEL CLIENTE
  
  // Membresía actual del cliente
  const { data: currentMembership, isLoading: membershipLoading, refetch: refetchMembership } = useQuery({
    queryKey: ['currentMembership', user?.id],
    queryFn: () => membershipService.getCurrentMembership(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      if (error.response?.status !== 404) {
        showError('Error al cargar tu membresía actual');
      }
    }
  });

  // Horarios actuales del cliente
  const { data: currentSchedule, isLoading: scheduleLoading, refetch: refetchSchedule } = useQuery({
    queryKey: ['mySchedule', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/memberships/my-schedule', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar horarios');
      }
      
      const data = await response.json();
      return data.data;
    },
    enabled: !!currentMembership && currentMembership.status !== 'pending_validation',
    staleTime: 2 * 60 * 1000,
    onError: (error) => showError('Error al cargar tus horarios actuales')
  });

  // Opciones de horarios disponibles
  const { data: availableOptions, isLoading: optionsLoading, refetch: refetchOptions } = useQuery({
    queryKey: ['availableScheduleOptions', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/memberships/my-schedule/available-options', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar opciones disponibles');
      }
      
      const data = await response.json();
      return data.data;
    },
    enabled: !!currentMembership && currentMembership.status !== 'pending_validation',
    staleTime: 1 * 60 * 1000,
    onError: (error) => showError('Error al cargar opciones disponibles')
  });

  // Estadísticas de horarios
  const { data: scheduleStats, isLoading: statsLoading } = useQuery({
    queryKey: ['myScheduleStats', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/memberships/my-schedule/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar estadísticas');
      }
      
      const data = await response.json();
      return data.data;
    },
    enabled: !!currentMembership && currentMembership.status !== 'pending_validation',
    staleTime: 5 * 60 * 1000,
    onError: (error) => console.warn('Error cargando estadísticas:', error.message)
  });

  // MUTACIONES PARA ACCIONES

  // Cambiar horarios
  const changeScheduleMutation = useMutation({
    mutationFn: async (changes) => {
      const changeType = Object.keys(changes).length === 1 ? 
        'single_day' : 
        Object.keys(changes).length <= 3 ? 'multiple_days' : 'full_week';

      const response = await fetch('/api/memberships/my-schedule/change', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          changeType,
          changes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cambiar horarios');
      }

      return response.json();
    },
    onSuccess: (data) => {
      showSuccess('Horarios cambiados exitosamente');
      setSelectedChanges({});
      setIsEditing(false);
      setShowPreview(false);
      refetchSchedule();
      refetchOptions();
    },
    onError: (error) => {
      showError(error.message);
    }
  });

  // Cancelar horario específico
  const cancelScheduleMutation = useMutation({
    mutationFn: async ({ day, slotId }) => {
      const response = await fetch(`/api/memberships/my-schedule/${day}/${slotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cancelar horario');
      }

      return response.json();
    },
    onSuccess: () => {
      showSuccess('Horario cancelado exitosamente');
      refetchSchedule();
      refetchOptions();
    },
    onError: (error) => {
      showError(error.message);
    }
  });

  // FUNCIONES DE MANEJO

  const handleSlotSelection = (day, slotId) => {
    if (!isEditing) return;

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

  const handleConfirmChanges = () => {
    if (Object.keys(selectedChanges).length === 0) {
      showError('Selecciona al menos un horario para cambiar');
      return;
    }
    
    changeScheduleMutation.mutate(selectedChanges);
  };

  const handleCancelSlot = (day, slotId) => {
    if (window.confirm('¿Seguro que quieres cancelar este horario?')) {
      cancelScheduleMutation.mutate({ day, slotId });
    }
  };

  const handleRefreshData = () => {
    refetchMembership();
    refetchSchedule();
    refetchOptions();
    showInfo('Datos actualizados');
  };

  // Verificar estado de membresía
  const getMembershipStatus = () => {
    if (!currentMembership) return { status: 'none', message: 'Sin membresía activa', color: 'red' };
    
    if (currentMembership.status === 'pending_validation') {
      return { status: 'pending', message: 'Pendiente validación', color: 'yellow' };
    }
    
    return { status: 'active', message: 'Activa', color: 'green' };
  };

  const membershipStatus = getMembershipStatus();

  // Si no hay membresía
  if (!membershipLoading && !currentMembership) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6">
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Necesitas una membresía activa
              </h1>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Para gestionar tus horarios de gimnasio, primero necesitas obtener una membresía. 
                Una vez que tengas una membresía validada, podrás reservar y administrar tus slots de tiempo.
              </p>
              <div className="space-y-4">
                <button 
                  onClick={() => window.location.href = '/dashboard/client'}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Obtener Membresía
                </button>
                <div className="text-sm text-gray-500">
                  <div className="flex items-center justify-center space-x-4">
                    <span>💳 Pago con tarjeta</span>
                    <span>🏦 Transferencia</span>
                    <span>💵 Efectivo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si la membresía está pendiente de validación
  if (membershipStatus.status === 'pending') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6">
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Membresía en validación
              </h1>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Tu membresía está siendo validada por nuestro equipo. 
                Una vez confirmada, podrás acceder a la gestión de horarios.
              </p>
              
              {/* Mostrar información de la membresía */}
              <div className="max-w-md mx-auto mb-8">
                <MembershipCard 
                  membership={currentMembership}
                  showActions={false}
                  isOwner={true}
                />
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleRefreshData}
                  className="btn-warning"
                  disabled={membershipLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${membershipLoading ? 'animate-spin' : ''}`} />
                  Actualizar estado
                </button>
                
                {currentMembership?.payment?.paymentMethod === 'cash' && (
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => window.open('https://maps.google.com/?q=Elite+Fitness+Club', '_blank')}
                      className="btn-outline btn-sm"
                    >
                      <MapPin className="w-4 h-4 mr-1" />
                      Ver ubicación
                    </button>
                    <button
                      onClick={() => window.open('tel:+50212345678', '_blank')}
                      className="btn-outline btn-sm"
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Llamar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista principal con pestañas
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header con título y acciones */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Mis Horarios de Gimnasio
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona tus slots de tiempo y consulta información de tu membresía
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefreshData}
              className="btn-outline btn-sm"
              disabled={scheduleLoading || optionsLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${(scheduleLoading || optionsLoading) ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            {activeTab === 'available' && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`btn-sm ${isEditing ? 'btn-secondary' : 'btn-primary'}`}
              >
                {isEditing ? (
                  <>
                    <X className="w-4 h-4 mr-1" />
                    Cancelar edición
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    Cambiar horarios
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('current')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'current'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Horarios Actuales
              </div>
            </button>
            <button
              onClick={() => setActiveTab('available')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'available'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Horarios Disponibles
              </div>
            </button>
            <button
              onClick={() => setActiveTab('membership')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'membership'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                Mi Membresía
              </div>
            </button>
          </nav>
        </div>

        {/* Contenido de las pestañas */}
        <div className="p-6">
          
          {/* TAB: Horarios Actuales */}
          {activeTab === 'current' && (
            <div className="space-y-6">
              
              {/* Estadísticas rápidas */}
              {scheduleStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {scheduleStats.totalSlots || 0}
                    </div>
                    <div className="text-sm text-blue-500">Slots Totales</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {scheduleStats.usedSlots || 0}
                    </div>
                    <div className="text-sm text-green-500">En Uso</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {scheduleStats.availableSlots || 0}
                    </div>
                    <div className="text-sm text-yellow-500">Disponibles</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {scheduleStats.favoriteTime || 'N/A'}
                    </div>
                    <div className="text-sm text-purple-500">Horario Favorito</div>
                  </div>
                </div>
              )}

              {scheduleLoading ? (
                <LoadingSpinner />
              ) : currentSchedule && currentSchedule.hasMembership ? (
                <div className="space-y-4">
                  {Object.entries(currentSchedule.currentSchedule || {}).map(([day, dayData]) => (
                    <div key={day} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {dayData.dayName}
                      </h3>
                      {dayData.hasSlots ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {dayData.slots.map((slot) => (
                            <div 
                              key={slot.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div>
                                <span className="font-medium">{slot.timeRange}</span>
                                {slot.label && (
                                  <span className="text-sm text-gray-600 ml-2">
                                    ({slot.label})
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleCancelSlot(day, slot.id)}
                                className="btn-danger btn-sm"
                                disabled={cancelScheduleMutation.isLoading}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Sin horarios este día</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No tienes horarios reservados
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Ve a la pestaña "Horarios Disponibles" para reservar tus slots de tiempo
                  </p>
                  <button
                    onClick={() => setActiveTab('available')}
                    className="btn-primary"
                  >
                    Ver horarios disponibles
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: Horarios Disponibles */}
          {activeTab === 'available' && (
            <div className="space-y-6">
              
              {/* Controles de edición */}
              {isEditing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Info className="w-5 h-5 text-blue-500 mr-2" />
                      <span className="text-blue-800 font-medium">
                        Modo edición: Selecciona los horarios que deseas reservar
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {Object.keys(selectedChanges).length > 0 && (
                        <>
                          <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="btn-outline btn-sm"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {showPreview ? 'Ocultar' : 'Vista previa'}
                          </button>
                          <button
                            onClick={handleConfirmChanges}
                            className="btn-primary btn-sm"
                            disabled={changeScheduleMutation.isLoading}
                          >
                            <Save className="w-4 h-4 mr-1" />
                            Confirmar cambios
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setSelectedChanges({});
                          setIsEditing(false);
                          setShowPreview(false);
                        }}
                        className="btn-secondary btn-sm"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                  
                  {/* Vista previa de cambios */}
                  {showPreview && Object.keys(selectedChanges).length > 0 && (
                    <div className="mt-4 p-4 bg-white rounded-lg border">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Cambios seleccionados:
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(selectedChanges).map(([day, slots]) => (
                          <div key={day} className="text-sm">
                            <span className="font-medium">{day}:</span>
                            <span className="ml-2">
                              {slots.length} slot{slots.length !== 1 ? 's' : ''} seleccionado{slots.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {optionsLoading ? (
                <LoadingSpinner />
              ) : availableOptions ? (
                <div className="space-y-4">
                  {Object.entries(availableOptions.availableOptions || {}).map(([day, dayData]) => (
                    <div key={day} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {dayData.dayName}
                      </h3>
                      {dayData.isOpen ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {dayData.slots.map((slot) => {
                            const isSelected = selectedChanges[day]?.includes(slot.id);
                            const isCurrentlyMine = slot.isCurrentlyMine;
                            const isAvailable = slot.status === 'available';
                            const isFull = slot.status === 'full';
                            
                            return (
                              <div
                                key={slot.id}
                                onClick={() => isEditing && (isAvailable || isCurrentlyMine) && handleSlotSelection(day, slot.id)}
                                className={`
                                  p-3 rounded-lg border-2 transition-all cursor-pointer
                                  ${isCurrentlyMine ? 'border-blue-500 bg-blue-50' :
                                    isSelected ? 'border-orange-500 bg-orange-50' :
                                    isAvailable ? 'border-green-500 bg-green-50 hover:bg-green-100' :
                                    'border-red-300 bg-red-50 opacity-60 cursor-not-allowed'}
                                  ${isEditing && (isAvailable || isCurrentlyMine) ? 'hover:scale-105' : ''}
                                `}
                              >
                                <div className="text-sm font-medium">{slot.timeRange}</div>
                                <div className="text-xs mt-1">
                                  {isCurrentlyMine && <span className="text-blue-600 font-medium">✅ Tu horario actual</span>}
                                  {isSelected && !isCurrentlyMine && <span className="text-orange-600 font-medium">📝 Seleccionado</span>}
                                  {isAvailable && !isSelected && !isCurrentlyMine && (
                                    <span className="text-green-600">✅ {slot.available} disponibles</span>
                                  )}
                                  {isFull && <span className="text-red-600">❌ Lleno</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Cerrado este día</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay horarios disponibles
                  </h3>
                  <p className="text-gray-600">
                    Intenta más tarde o contacta al gimnasio para más información
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB: Mi Membresía */}
          {activeTab === 'membership' && (
            <div className="space-y-6">
              {membershipLoading ? (
                <LoadingSpinner />
              ) : currentMembership ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Información de la membresía */}
                  <div className="space-y-6">
                    <MembershipCard 
                      membership={currentMembership}
                      showActions={true}
                      isOwner={true}
                    />
                    
                    {/* Información adicional del plan */}
                    {currentMembership.plan && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Beneficios de tu plan</h4>
                        {currentMembership.plan.features && Array.isArray(currentMembership.plan.features) ? (
                          <ul className="space-y-2">
                            {currentMembership.plan.features.map((feature, index) => (
                              <li key={index} className="flex items-center text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-600">
                            Acceso completo a las instalaciones del gimnasio
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Estadísticas y acciones */}
                  <div className="space-y-6">
                    
                    {/* Estadísticas de uso */}
                    {scheduleStats && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Estadísticas de uso
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Horarios reservados:</span>
                            <span className="font-medium">{scheduleStats.usedSlots || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Horarios disponibles:</span>
                            <span className="font-medium">{scheduleStats.availableSlots || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Horario favorito:</span>
                            <span className="font-medium">{scheduleStats.favoriteTime || 'N/A'}</span>
                          </div>
                          {scheduleStats.totalVisits && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Visitas este mes:</span>
                              <span className="font-medium">{scheduleStats.totalVisits}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Información de pago */}
                    {currentMembership.payment && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-4">Información de pago</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Método de pago:</span>
                            <span className="font-medium">
                              {currentMembership.payment.paymentMethod === 'card' ? 'Tarjeta' :
                               currentMembership.payment.paymentMethod === 'transfer' ? 'Transferencia' :
                               currentMembership.payment.paymentMethod === 'cash' ? 'Efectivo' :
                               currentMembership.payment.paymentMethod}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Monto pagado:</span>
                            <span className="font-medium text-green-600">
                              {formatQuetzales(currentMembership.payment.amount)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Fecha de pago:</span>
                            <span className="font-medium">
                              {formatDate(currentMembership.payment.paidAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Acciones rápidas */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4">Acciones rápidas</h4>
                      <div className="space-y-3">
                        <button
                          onClick={() => setActiveTab('current')}
                          className="w-full btn-outline text-left flex items-center"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Ver mis horarios actuales
                        </button>
                        <button
                          onClick={() => setActiveTab('available')}
                          className="w-full btn-outline text-left flex items-center"
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Reservar nuevos horarios
                        </button>
                        <button
                          onClick={() => window.location.href = '/dashboard/client'}
                          className="w-full btn-outline text-left flex items-center"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Volver al dashboard
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay información de membresía
                  </h3>
                  <p className="text-gray-600">
                    Error al cargar la información de tu membresía
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default MySchedulePage;

/*
DOCUMENTACIÓN DEL COMPONENTE MySchedulePage

PROPÓSITO:
Este componente implementa la gestión completa de horarios para clientes con membresía activa,
permitiendo ver horarios actuales, reservar nuevos slots, cancelar horarios existentes y
consultar información detallada de su membresía.

FUNCIONALIDADES PRINCIPALES:
- Vista de horarios actuales del cliente con estadísticas
- Exploración y reserva de horarios disponibles
- Cancelación de horarios específicos con confirmación
- Información completa de la membresía y beneficios
- Sistema de edición intuitivo con vista previa
- Validación de estado de membresía antes de acceso
- Estadísticas de uso y patrones de visita

ESTADOS DE MEMBRESÍA MANEJADOS:
- 'none': Sin membresía - Redirige a obtener membresía
- 'pending': Pendiente validación - Muestra estado y opciones de contacto
- 'active': Membresía validada - Acceso completo a gestión de horarios

TABS PRINCIPALES:
1. **Horarios Actuales**: Visualización y cancelación de slots reservados
2. **Horarios Disponibles**: Exploración y reserva de nuevos horarios
3. **Mi Membresía**: Información completa del plan y estadísticas

INTEGRACIÓN CON LA API:
- GET /api/memberships/my-schedule: Horarios actuales del cliente
- GET /api/memberships/my-schedule/available-options: Opciones disponibles
- POST /api/memberships/my-schedule/change: Cambiar horarios seleccionados
- DELETE /api/memberships/my-schedule/{day}/{slotId}: Cancelar horario específico
- GET /api/memberships/my-schedule/stats: Estadísticas de uso

CARACTERÍSTICAS DE UX:
- Modo edición visual con selección múltiple
- Vista previa de cambios antes de confirmar
- Indicadores claros de estado (actual, seleccionado, disponible, lleno)
- Refrescado automático después de cambios
- Navegación intuitiva entre secciones relacionadas

VALIDACIONES DE SEGURIDAD:
- Verificación de token de autenticación en todas las peticiones
- Validación de estado de membresía antes de mostrar contenido
- Confirmación obligatoria para cancelaciones
- Manejo de errores específico por tipo de operación

RESPONSIVIDAD:
- Grid adaptativo para diferentes tamaños de pantalla
- Navegación por pestañas optimizada para móvil
- Botones y controles accesibles en dispositivos táctiles

Este componente es esencial para que los clientes gestionen efectivamente sus horarios
de gimnasio una vez que tienen una membresía validada.
*/