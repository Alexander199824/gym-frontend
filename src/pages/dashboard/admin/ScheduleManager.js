// Autor: Alexander Echeverria
// SISTEMA COMPLETO DE GESTIÓN DE HORARIOS
// - Un solo botón principal para crear franjas
// - Modal con selección múltiple de días
// - Envío directo al backend
// - Vista por día SOLO para visualizar/editar/eliminar

import React, { useState, useEffect } from 'react';
import {
  Clock, Users, Calendar, Settings, Save, RefreshCw, AlertTriangle, 
  CheckCircle, Plus, Minus, Copy, Trash2, Edit3, UserCheck, UserX,
  Eye, BarChart3, Target, Loader, Bug, Download, Upload, X, Check
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

const ScheduleManager = () => {
  const { user, canManageContent } = useAuth();
  const { showError, showSuccess, isMobile } = useApp();
  
  // Estados principales
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [lastChangedCapacity, setLastChangedCapacity] = useState(null);
  const [showCapacityDetails, setShowCapacityDetails] = useState(false);
  
  // Estados para modal de crear franja (NUEVO)
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [isCreatingSlot, setIsCreatingSlot] = useState(false);
  const [newSlotForm, setNewSlotForm] = useState({
    selectedDays: [],
    label: '',
    open: '09:00',
    close: '18:00',
    capacity: 30
  });
  
  // Estados para datos de horarios
  const [scheduleData, setScheduleData] = useState({
    hours: {
      monday: { isOpen: false, timeSlots: [] },
      tuesday: { isOpen: false, timeSlots: [] },
      wednesday: { isOpen: false, timeSlots: [] },
      thursday: { isOpen: false, timeSlots: [] },
      friday: { isOpen: false, timeSlots: [] },
      saturday: { isOpen: false, timeSlots: [] },
      sunday: { isOpen: false, timeSlots: [] }
    }
  });
  
  // Estados para métricas
  const [capacityMetrics, setCapacityMetrics] = useState({
    data: null,
    isLoading: false,
    error: null
  });
  
  // Días de la semana
  const daysOfWeek = [
    { key: 'monday', label: 'Lunes', shortLabel: 'Lun' },
    { key: 'tuesday', label: 'Martes', shortLabel: 'Mar' },
    { key: 'wednesday', label: 'Miércoles', shortLabel: 'Mié' },
    { key: 'thursday', label: 'Jueves', shortLabel: 'Jue' },
    { key: 'friday', label: 'Viernes', shortLabel: 'Vie' },
    { key: 'saturday', label: 'Sábado', shortLabel: 'Sáb' },
    { key: 'sunday', label: 'Domingo', shortLabel: 'Dom' }
  ];
  
  // Verificar permisos
  useEffect(() => {
    if (!canManageContent) {
      showError('No tienes permisos para gestionar los horarios del gimnasio');
      return;
    }
  }, [canManageContent, showError]);
  
  // Cargar datos de horarios
  const loadScheduleData = async () => {
    console.log('ScheduleManager - Cargando datos de horarios...');
    
    try {
      setIsLoading(true);
      
      // Cargar configuración del gimnasio con horarios
      try {
        const gymConfigResponse = await apiService.getGymConfigEditor();
        const configData = gymConfigResponse?.data || gymConfigResponse;
        
        if (configData && configData.hours) {
          console.log('Horarios cargados desde configuración:', configData.hours);
          
          // Mapear horarios flexibles
          const mappedHours = mapFlexibleHours(configData.hours);
          
          setScheduleData({
            hours: mappedHours
          });
          
          console.log('Horarios mapeados para ScheduleManager:', mappedHours);
        } else {
          console.log('No se encontraron horarios en la configuración');
        }
        
      } catch (error) {
        console.log('Error cargando configuración del gimnasio:', error.message);
        showError('Error al cargar los horarios actuales');
      }
      
      // Cargar métricas de capacidad
      setCapacityMetrics({ data: null, isLoading: true, error: null });
      try {
        const capacityResponse = await apiService.getCapacityMetrics();
        const capacity = capacityResponse?.data || capacityResponse;
        setCapacityMetrics({ data: capacity, isLoading: false, error: null });
        console.log('Métricas de capacidad cargadas:', capacity);
      } catch (error) {
        console.log('Métricas de capacidad no disponibles:', error.message);
        setCapacityMetrics({ data: null, isLoading: false, error });
      }
      
    } catch (error) {
      console.error('Error cargando datos de horarios:', error);
      showError('Error al cargar los datos de horarios');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Mapear horarios flexibles desde backend
  const mapFlexibleHours = (backendHours) => {
    const mappedHours = {};
    
    daysOfWeek.forEach(day => {
      const backendDay = backendHours?.[day.key];
      
      if (backendDay) {
        if (backendDay.timeSlots && Array.isArray(backendDay.timeSlots)) {
          mappedHours[day.key] = {
            isOpen: backendDay.isOpen || false,
            timeSlots: backendDay.timeSlots
          };
        } else if (backendDay.open && backendDay.close) {
          mappedHours[day.key] = {
            isOpen: backendDay.isOpen || false,
            timeSlots: backendDay.isOpen ? [{
              open: backendDay.open,
              close: backendDay.close,
              capacity: backendDay.capacity || 30,
              reservations: backendDay.reservations || 0,
              label: ''
            }] : []
          };
        } else {
          mappedHours[day.key] = {
            isOpen: backendDay.isOpen || false,
            timeSlots: []
          };
        }
      } else {
        mappedHours[day.key] = {
          isOpen: false,
          timeSlots: []
        };
      }
    });
    
    return mappedHours;
  };
  
  // Refrescar datos
  const refreshScheduleData = () => {
    setRefreshKey(prev => prev + 1);
    loadScheduleData();
    showSuccess('Datos de horarios actualizados');
  };
  
  // Cargar datos al montar
  useEffect(() => {
    console.log('ScheduleManager montado, cargando datos...');
    loadScheduleData();
  }, [refreshKey]);
  
  // Calcular métricas
  const calculatedMetrics = React.useMemo(() => {
    const openDays = daysOfWeek.filter(day => scheduleData.hours[day.key]?.isOpen);
    
    let totalCapacity = 0;
    let totalReservations = 0;
    
    openDays.forEach(day => {
      const dayData = scheduleData.hours[day.key];
      dayData.timeSlots.forEach(slot => {
        totalCapacity += slot.capacity || 0;
        totalReservations += slot.reservations || 0;
      });
    });
    
    const averageOccupancy = totalCapacity > 0 ? 
      Math.round((totalReservations / totalCapacity) * 100) : 0;
    
    const availableSpaces = totalCapacity - totalReservations;
    
    let busiestDay = { day: '', occupancy: 0 };
    openDays.forEach(day => {
      const dayData = scheduleData.hours[day.key];
      let dayCapacity = 0;
      let dayReservations = 0;
      
      dayData.timeSlots.forEach(slot => {
        dayCapacity += slot.capacity || 0;
        dayReservations += slot.reservations || 0;
      });
      
      const dayOccupancy = dayCapacity > 0 ? (dayReservations / dayCapacity) * 100 : 0;
      
      if (dayOccupancy > busiestDay.occupancy) {
        busiestDay = { day: day.label, occupancy: dayOccupancy };
      }
    });
    
    return {
      totalCapacity,
      totalReservations,
      averageOccupancy,
      availableSpaces,
      busiestDay: busiestDay.day,
      busiestOccupancy: Math.round(busiestDay.occupancy),
      openDaysCount: openDays.length,
      totalSlotsCount: openDays.reduce((sum, day) => sum + scheduleData.hours[day.key].timeSlots.length, 0)
    };
  }, [scheduleData.hours]);
  
  const markAsChanged = () => {
    setHasUnsavedChanges(true);
  };
  
  // ==============================================
  // FUNCIONES DEL MODAL PARA CREAR FRANJAS
  // ==============================================
  
  const openAddSlotModal = () => {
    setNewSlotForm({
      selectedDays: [],
      label: '',
      open: '09:00',
      close: '18:00',
      capacity: 30
    });
    setShowAddSlotModal(true);
  };
  
  const closeAddSlotModal = () => {
    setShowAddSlotModal(false);
    setNewSlotForm({
      selectedDays: [],
      label: '',
      open: '09:00',
      close: '18:00',
      capacity: 30
    });
  };
  
  const toggleDaySelection = (dayKey) => {
    setNewSlotForm(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(dayKey)
        ? prev.selectedDays.filter(d => d !== dayKey)
        : [...prev.selectedDays, dayKey]
    }));
  };
  
  const selectAllDays = () => {
    setNewSlotForm(prev => ({
      ...prev,
      selectedDays: daysOfWeek.map(d => d.key)
    }));
  };
  
  const deselectAllDays = () => {
    setNewSlotForm(prev => ({
      ...prev,
      selectedDays: []
    }));
  };
  
  // CREAR FRANJA - ENVÍA DIRECTO AL BACKEND
  const handleCreateSlotInBackend = async () => {
    if (newSlotForm.selectedDays.length === 0) {
      showError('Debes seleccionar al menos un día');
      return;
    }
    
    if (!newSlotForm.open || !newSlotForm.close) {
      showError('Debes especificar horario de apertura y cierre');
      return;
    }
    
    if (newSlotForm.capacity < 1 || newSlotForm.capacity > 500) {
      showError('La capacidad debe estar entre 1 y 500');
      return;
    }
    
    if (newSlotForm.open >= newSlotForm.close) {
      showError('El horario de cierre debe ser después del de apertura');
      return;
    }
    
    try {
      setIsCreatingSlot(true);
      
      const newSlot = {
        open: newSlotForm.open,
        close: newSlotForm.close,
        capacity: parseInt(newSlotForm.capacity),
        reservations: 0,
        label: newSlotForm.label.trim()
      };
      
      // Obtener datos actuales del backend
      const currentConfig = await apiService.getGymConfigEditor();
      const currentHours = currentConfig?.data?.hours || scheduleData.hours;
      
      // Crear copia
      const updatedHours = JSON.parse(JSON.stringify(currentHours));
      
      // Agregar franja a cada día seleccionado
      newSlotForm.selectedDays.forEach(dayKey => {
        if (!updatedHours[dayKey]) {
          updatedHours[dayKey] = { isOpen: false, timeSlots: [] };
        }
        
        updatedHours[dayKey].isOpen = true;
        
        if (!updatedHours[dayKey].timeSlots) {
          updatedHours[dayKey].timeSlots = [];
        }
        
        updatedHours[dayKey].timeSlots.push({ ...newSlot });
      });
      
      const fullScheduleString = generateFullScheduleString(updatedHours);
      
      const dataToSave = {
        ...updatedHours,
        full: fullScheduleString
      };
      
      console.log('Enviando nueva franja al backend:', dataToSave);
      
      let result;
      try {
        result = await apiService.saveFlexibleSchedule(dataToSave);
      } catch (error) {
        console.log('Usando método de guardado general como fallback');
        result = await apiService.saveGymConfigSection('schedule', { hours: dataToSave });
      }
      
      if (result && result.success) {
        const dayNames = newSlotForm.selectedDays.map(key => 
          daysOfWeek.find(d => d.key === key)?.label
        ).join(', ');
        
        showSuccess(`Franja horaria creada exitosamente en: ${dayNames}`);
        
        closeAddSlotModal();
        
        // Recargar desde backend
        await loadScheduleData();
        
        setHasUnsavedChanges(false);
        
      } else {
        showError('Error al crear la franja horaria');
      }
      
    } catch (error) {
      console.error('Error creando franja horaria:', error);
      
      if (error.response?.status === 422) {
        showError('Error de validación en la franja horaria');
      } else if (error.response?.status === 403) {
        showError('Sin permisos para crear franjas horarias');
      } else {
        showError('Error al crear la franja horaria');
      }
    } finally {
      setIsCreatingSlot(false);
    }
  };
  
  // ==============================================
  // FIN FUNCIONES DEL MODAL
  // ==============================================
  
  const toggleDayOpen = (day) => {
    setScheduleData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          isOpen: !prev.hours[day].isOpen,
          timeSlots: !prev.hours[day].isOpen ? [] : prev.hours[day].timeSlots
        }
      }
    }));
    markAsChanged();
  };
  
  const removeTimeSlot = (day, slotIndex) => {
    setScheduleData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          timeSlots: prev.hours[day].timeSlots.filter((_, index) => index !== slotIndex)
        }
      }
    }));
    markAsChanged();
  };
  
  const updateTimeSlot = (day, slotIndex, field, value) => {
    setScheduleData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          timeSlots: prev.hours[day].timeSlots.map((slot, index) => 
            index === slotIndex ? { ...slot, [field]: value } : slot
          )
        }
      }
    }));
    markAsChanged();
    
    if (field === 'capacity') {
      setLastChangedCapacity(value);
    }
  };
  
  const duplicateTimeSlot = (day, slotIndex) => {
    const slotToDuplicate = scheduleData.hours[day].timeSlots[slotIndex];
    const duplicatedSlot = {
      ...slotToDuplicate,
      reservations: 0,
      label: slotToDuplicate.label ? `${slotToDuplicate.label} (copia)` : ''
    };
    
    setScheduleData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          timeSlots: [...prev.hours[day].timeSlots, duplicatedSlot]
        }
      }
    }));
    markAsChanged();
  };
  
  const applyCapacityToAllSlots = (capacity) => {
    if (!capacity || capacity <= 0) return;
    
    const updatedHours = { ...scheduleData.hours };
    let appliedCount = 0;
    
    Object.keys(updatedHours).forEach(day => {
      if (updatedHours[day].isOpen) {
        updatedHours[day].timeSlots.forEach(slot => {
          slot.capacity = capacity;
          appliedCount++;
        });
      }
    });
    
    setScheduleData(prev => ({
      ...prev,
      hours: updatedHours
    }));
    markAsChanged();
    showSuccess(`Capacidad de ${capacity} aplicada a ${appliedCount} franjas horarias`);
    setLastChangedCapacity(null);
  };
  
  const generateFullScheduleString = (hours) => {
    const openDays = daysOfWeek.filter(day => hours[day.key]?.isOpen);
    
    if (openDays.length === 0) {
      return 'Consultar horarios';
    }
    
    const scheduleStrings = [];
    
    openDays.forEach(day => {
      const dayData = hours[day.key];
      if (dayData.timeSlots.length === 0) return;
      
      const slotsString = dayData.timeSlots.map(slot => {
        const baseTime = `${slot.open}-${slot.close}`;
        return slot.label ? `${baseTime} (${slot.label})` : baseTime;
      }).join(', ');
      
      scheduleStrings.push(`${day.shortLabel}: ${slotsString}`);
    });
    
    return scheduleStrings.join(' | ');
  };
  
  const getOccupancyColor = (reservations, capacity) => {
    if (capacity === 0) return 'gray';
    const percentage = (reservations / capacity) * 100;
    
    if (percentage >= 90) return 'red';
    if (percentage >= 75) return 'yellow';
    if (percentage >= 50) return 'blue';
    return 'green';
  };
  
  const handleSaveSchedule = async () => {
    try {
      setIsSaving(true);
      
      const openDaysWithoutSlots = daysOfWeek.filter(day => 
        scheduleData.hours[day.key].isOpen && scheduleData.hours[day.key].timeSlots.length === 0
      );
      
      if (openDaysWithoutSlots.length > 0) {
        showError(`Los días marcados como abiertos deben tener al menos una franja horaria: ${openDaysWithoutSlots.map(d => d.label).join(', ')}`);
        return;
      }
      
      const hasInvalidCapacity = Object.values(scheduleData.hours).some(day => 
        day.isOpen && day.timeSlots.some(slot => slot.capacity < 1 || slot.capacity > 500)
      );
      
      if (hasInvalidCapacity) {
        showError('La capacidad debe estar entre 1 y 500 usuarios por franja horaria');
        return;
      }
      
      const dataToSave = {
        ...scheduleData.hours,
        full: generateFullScheduleString(scheduleData.hours)
      };
      
      console.log('Guardando horarios:', dataToSave);
      
      let result;
      try {
        result = await apiService.saveFlexibleSchedule(dataToSave);
      } catch (error) {
        console.log('Usando método de guardado general como fallback');
        result = await apiService.saveGymConfigSection('schedule', { hours: dataToSave });
      }
      
      if (result && result.success) {
        console.log('Horarios guardados exitosamente:', result);
        
        await loadScheduleData();
        
        showSuccess('Horarios guardados exitosamente');
        setHasUnsavedChanges(false);
        
        try {
          const capacityResponse = await apiService.getCapacityMetrics();
          const capacity = capacityResponse?.data || capacityResponse;
          setCapacityMetrics({ data: capacity, isLoading: false, error: null });
        } catch (error) {
          console.log('No se pudieron actualizar las métricas de capacidad:', error.message);
        }
        
      } else {
        showSuccess('Horarios guardados');
        setHasUnsavedChanges(false);
      }
      
    } catch (error) {
      console.error('Error guardando horarios:', error);
      
      if (error.response?.status === 422) {
        showError('Error de validación en los horarios');
      } else if (error.response?.status === 403) {
        showError('Sin permisos para guardar horarios');
      } else if (error.response?.status === 404) {
        showError('Función no disponible en el servidor');
      } else {
        showError('Error al guardar horarios');
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  const exportSchedule = () => {
    const dataStr = JSON.stringify(scheduleData.hours, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `horarios-gimnasio-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showSuccess('Horarios exportados exitosamente');
  };
  
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (!canManageContent) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-900">Acceso Denegado</h3>
              <p className="text-red-800 mt-1">
                No tienes permisos para gestionar los horarios del gimnasio.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      
      {/* DEBUG INFO */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="w-8 h-8 bg-purple-500 hover:bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
            title="Información de Debug"
          >
            <Bug className="w-4 h-4" />
          </button>
          
          {showDebugInfo && (
            <div className="absolute bottom-10 right-0 bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-800 shadow-lg min-w-80">
              <div className="font-medium mb-2">ScheduleManager - Debug</div>
              <div className="space-y-1">
                <div>Usuario: {user?.firstName} {user?.lastName}</div>
                <div>Cambios sin guardar: {hasUnsavedChanges ? 'Sí' : 'No'}</div>
                <div>Días abiertos: {calculatedMetrics.openDaysCount}/7</div>
                <div>Total franjas: {calculatedMetrics.totalSlotsCount}</div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Clock className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Horarios
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Configura horarios flexibles del gimnasio con múltiples franjas por día
          </p>
          
          {calculatedMetrics.openDaysCount > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                {calculatedMetrics.openDaysCount} días abiertos
              </span>
              <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                {calculatedMetrics.totalSlotsCount} franjas horarias
              </span>
              <span className="text-xs text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                Capacidad: {calculatedMetrics.totalCapacity}
              </span>
              <span className="text-xs text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                Ocupación: {calculatedMetrics.averageOccupancy}%
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          {showCapacityDetails && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Espacios libres:</span>
                  <span className="font-medium text-green-600">{calculatedMetrics.availableSpaces}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Día más ocupado:</span>
                  <span className="font-medium text-red-600">{calculatedMetrics.busiestDay}</span>
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setShowCapacityDetails(!showCapacityDetails)}
            className="btn-secondary btn-sm"
          >
            {showCapacityDetails ? <Eye className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
          </button>
          
          <button
            onClick={exportSchedule}
            className="btn-secondary btn-sm"
            title="Exportar horarios"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={refreshScheduleData}
            className="btn-secondary btn-sm"
            title="Actualizar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {hasUnsavedChanges && (
            <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Cambios sin guardar
            </div>
          )}
        </div>
      </div>
      
      {/* ALERTAS */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Tienes cambios sin guardar en los horarios. Recuerda guardar antes de salir.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{calculatedMetrics.totalCapacity}</div>
          <div className="text-sm text-gray-600">Capacidad Total</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{calculatedMetrics.availableSpaces}</div>
          <div className="text-sm text-gray-600">Espacios Libres</div>
        </div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            calculatedMetrics.averageOccupancy >= 90 ? 'text-red-600' :
            calculatedMetrics.averageOccupancy >= 75 ? 'text-yellow-600' :
            calculatedMetrics.averageOccupancy >= 50 ? 'text-blue-600' : 'text-green-600'
          }`}>
            {calculatedMetrics.averageOccupancy}%
          </div>
          <div className="text-sm text-gray-600">Ocupación Promedio</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">{calculatedMetrics.busiestDay || 'N/A'}</div>
          <div className="text-sm text-gray-600">Día Más Ocupado</div>
        </div>
      </div>
      
      {/* HERRAMIENTAS RÁPIDAS CON BOTÓN PRINCIPAL */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Herramientas Rápidas</h3>
          
          <div className="flex items-center space-x-2">
            {/* BOTÓN PRINCIPAL PARA CREAR FRANJA */}
            <button
              onClick={openAddSlotModal}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Franja Horaria</span>
            </button>
            
            {lastChangedCapacity && (
              <button
                onClick={() => applyCapacityToAllSlots(lastChangedCapacity)}
                className="btn-secondary btn-sm bg-blue-50 text-blue-700 border-blue-200"
                title={`Aplicar capacidad de ${lastChangedCapacity} a todas las franjas`}
              >
                <Copy className="w-4 h-4 mr-1" />
                {lastChangedCapacity} a todas
              </button>
            )}
            
            <button
              onClick={handleSaveSchedule}
              disabled={isSaving || !hasUnsavedChanges}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Horarios</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* VISTA POR DÍA - SOLO VISUALIZACIÓN Y EDICIÓN */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600">Cargando horarios actuales...</p>
            </div>
          </div>
        ) : (
          daysOfWeek.map((day) => {
            const dayData = scheduleData.hours[day.key];
            
            return (
              <div key={day.key} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-gray-300 transition-colors">
                
                {/* Header del día - SIN botón agregar franja */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-28">
                      <span className="font-medium text-gray-900 text-lg">{day.label}</span>
                    </div>
                    
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={dayData.isOpen}
                        onChange={() => toggleDayOpen(day.key)}
                        className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">Abierto</span>
                    </label>
                    
                    {dayData.isOpen && (
                      <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {dayData.timeSlots.length} franja{dayData.timeSlots.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Franjas horarias */}
                {dayData.isOpen ? (
                  <div className="space-y-4">
                    {dayData.timeSlots.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded border-2 border-dashed border-gray-300">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="font-medium">No hay franjas horarias configuradas</p>
                        <p className="text-sm mt-1">Usa el botón "Agregar Franja Horaria" arriba para crear franjas</p>
                      </div>
                    ) : (
                      dayData.timeSlots.map((slot, slotIndex) => {
                        const occupancyPercentage = slot.capacity > 0 ? 
                          Math.round((slot.reservations / slot.capacity) * 100) : 0;
                        const occupancyColor = getOccupancyColor(slot.reservations, slot.capacity);
                        
                        return (
                          <div key={slotIndex} className="bg-gray-50 rounded-lg p-4 relative border border-gray-200">
                            
                            <div className="absolute top-2 right-2 flex space-x-1">
                              <button
                                onClick={() => duplicateTimeSlot(day.key, slotIndex)}
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Duplicar franja"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => removeTimeSlot(day.key, slotIndex)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Eliminar franja"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Etiqueta (opcional)
                                </label>
                                <input
                                  type="text"
                                  value={slot.label || ''}
                                  onChange={(e) => updateTimeSlot(day.key, slotIndex, 'label', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  placeholder="ej: Mañana, Tarde"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Horario</label>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="time"
                                    value={slot.open}
                                    onChange={(e) => updateTimeSlot(day.key, slotIndex, 'open', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  />
                                  <span className="text-xs text-gray-500">a</span>
                                  <input
                                    type="time"
                                    value={slot.close}
                                    onChange={(e) => updateTimeSlot(day.key, slotIndex, 'close', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  />
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Capacidad</label>
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => updateTimeSlot(day.key, slotIndex, 'capacity', Math.max(1, slot.capacity - 5))}
                                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  
                                  <input
                                    type="number"
                                    value={slot.capacity || 0}
                                    onChange={(e) => updateTimeSlot(day.key, slotIndex, 'capacity', parseInt(e.target.value) || 0)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    min="1"
                                    max="500"
                                  />
                                  
                                  <button
                                    type="button"
                                    onClick={() => updateTimeSlot(day.key, slotIndex, 'capacity', Math.min(500, slot.capacity + 5))}
                                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Ocupación</label>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span>{slot.reservations}/{slot.capacity}</span>
                                    <span className={`font-medium ${
                                      occupancyColor === 'red' ? 'text-red-600' :
                                      occupancyColor === 'yellow' ? 'text-yellow-600' :
                                      occupancyColor === 'blue' ? 'text-blue-600' : 'text-green-600'
                                    }`}>
                                      {occupancyPercentage}%
                                    </span>
                                  </div>
                                  
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full transition-all ${
                                        occupancyColor === 'red' ? 'bg-red-500' :
                                        occupancyColor === 'yellow' ? 'bg-yellow-500' :
                                        occupancyColor === 'blue' ? 'bg-blue-500' : 'bg-green-500'
                                      }`}
                                      style={{ width: `${Math.min(100, occupancyPercentage)}%` }}
                                    />
                                  </div>
                                  
                                  <div className="flex items-center justify-center space-x-2 mt-2">
                                    <button
                                      type="button"
                                      onClick={() => updateTimeSlot(day.key, slotIndex, 'reservations', Math.max(0, slot.reservations - 1))}
                                      className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                                      disabled={slot.reservations <= 0}
                                      title="Quitar usuario"
                                    >
                                      <UserX className="w-4 h-4" />
                                    </button>
                                    
                                    <button
                                      type="button"
                                      onClick={() => updateTimeSlot(day.key, slotIndex, 'reservations', Math.min(slot.capacity, slot.reservations + 1))}
                                      className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                                      disabled={slot.reservations >= slot.capacity}
                                      title="Agregar usuario"
                                    >
                                      <UserCheck className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 rounded border border-gray-200">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Cerrado este día</p>
                  </div>
                )}
                
              </div>
            );
          })
        )}
      </div>
      
      {/* VISTA PREVIA */}
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h6 className="font-medium text-blue-900 mb-2 flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            Vista previa en página web:
          </h6>
          <p className="text-blue-800 text-sm">
            "{generateFullScheduleString(scheduleData.hours)}"
          </p>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="ml-3">
              <h6 className="text-sm font-medium text-gray-800">
                ¿Cómo funcionan las franjas horarias flexibles?
              </h6>
              <div className="text-sm text-gray-700 mt-1 space-y-1">
                <p>• <strong>Creación centralizada:</strong> Usa el botón "Agregar Franja Horaria" para crear en uno o varios días</p>
                <p>• <strong>Días independientes:</strong> Cada día puede tener múltiples franjas horarias</p>
                <p>• <strong>Capacidad individual:</strong> Cada franja tiene su propia capacidad</p>
                <p>• <strong>Etiquetas personalizadas:</strong> Identifica franjas con etiquetas opcionales</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* MODAL PARA CREAR FRANJAS */}
      {showAddSlotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Agregar Franja Horaria</h2>
                  <p className="text-sm text-gray-600">Selecciona días y configura la franja</p>
                </div>
              </div>
              
              <button
                onClick={closeAddSlotModal}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-lg transition-all"
                disabled={isCreatingSlot}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-gray-900 flex items-center">
                    Selecciona los días
                    <span className="ml-2 text-red-500">*</span>
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={selectAllDays}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium px-2 py-1 hover:bg-purple-50 rounded"
                      type="button"
                    >
                      Todos
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={deselectAllDays}
                      className="text-xs text-gray-600 hover:text-gray-700 font-medium px-2 py-1 hover:bg-gray-100 rounded"
                      type="button"
                    >
                      Ninguno
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.key}
                      onClick={() => toggleDaySelection(day.key)}
                      type="button"
                      className={`p-3 rounded-lg border-2 font-medium text-sm transition-all ${
                        newSlotForm.selectedDays.includes(day.key)
                          ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{day.label}</span>
                        {newSlotForm.selectedDays.includes(day.key) && (
                          <CheckCircle className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                
                {newSlotForm.selectedDays.length > 0 && (
                  <div className="mt-3 text-sm text-purple-700 bg-purple-50 px-4 py-2 rounded-lg border border-purple-200 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {newSlotForm.selectedDays.length} día{newSlotForm.selectedDays.length !== 1 ? 's' : ''} seleccionado{newSlotForm.selectedDays.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
              
              <div>
                <label className="text-sm font-bold text-gray-900 block mb-2">
                  Etiqueta (opcional)
                </label>
                <input
                  type="text"
                  value={newSlotForm.label}
                  onChange={(e) => setNewSlotForm(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="ej: Mañana, Tarde, Evento"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isCreatingSlot}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-900 block mb-2 flex items-center">
                    Hora de Apertura
                    <span className="ml-2 text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={newSlotForm.open}
                    onChange={(e) => setNewSlotForm(prev => ({ ...prev, open: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
                    disabled={isCreatingSlot}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-bold text-gray-900 block mb-2 flex items-center">
                    Hora de Cierre
                    <span className="ml-2 text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={newSlotForm.close}
                    onChange={(e) => setNewSlotForm(prev => ({ ...prev, close: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
                    disabled={isCreatingSlot}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-bold text-gray-900 block mb-2 flex items-center">
                  Capacidad
                  <span className="ml-2 text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setNewSlotForm(prev => ({ ...prev, capacity: Math.max(1, prev.capacity - 5) }))}
                    className="p-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                    disabled={isCreatingSlot}
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  
                  <input
                    type="number"
                    value={newSlotForm.capacity}
                    onChange={(e) => setNewSlotForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl font-bold focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    min="1"
                    max="500"
                    disabled={isCreatingSlot}
                  />
                  
                  <button
                    type="button"
                    onClick={() => setNewSlotForm(prev => ({ ...prev, capacity: Math.min(500, prev.capacity + 5) }))}
                    className="p-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                    disabled={isCreatingSlot}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">Máximo: 500 personas</p>
              </div>
              
              {newSlotForm.selectedDays.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    Vista Previa
                  </h3>
                  <div className="text-sm text-blue-800 space-y-2">
                    <div className="flex items-start">
                      <span className="font-bold w-24">Días:</span>
                      <span className="flex-1">{newSlotForm.selectedDays.map(key => 
                        daysOfWeek.find(d => d.key === key)?.label
                      ).join(', ')}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-bold w-24">Horario:</span>
                      <span className="flex-1">{newSlotForm.open} - {newSlotForm.close}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-bold w-24">Capacidad:</span>
                      <span className="flex-1">{newSlotForm.capacity} personas</span>
                    </div>
                    {newSlotForm.label && (
                      <div className="flex items-start">
                        <span className="font-bold w-24">Etiqueta:</span>
                        <span className="flex-1">{newSlotForm.label}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeAddSlotModal}
                className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all"
                disabled={isCreatingSlot}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleCreateSlotInBackend}
                disabled={newSlotForm.selectedDays.length === 0 || isCreatingSlot}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 shadow-lg"
              >
                {isCreatingSlot ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Creando...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Crear Franja Horaria</span>
                  </>
                )}
              </button>
            </div>
            
          </div>
        </div>
      )}
      
    </div>
  );
};

export default ScheduleManager;