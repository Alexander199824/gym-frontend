// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/MembershipCreationWizard.js
// Wizard completo de 5 pasos para crear membresías

import React, { useState, useEffect } from 'react';
import {
  X, ChevronRight, ChevronLeft, Check, Search, User, CreditCard,
  Calendar, Clock, CheckCircle, AlertTriangle, Loader, Package,
  DollarSign, FileText, Info
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';
import membershipCreationService from '../../../services/membershipCreationService';

const MembershipCreationWizard = ({ onClose, onSuccess }) => {
  const { showSuccess, showError, formatDate, formatCurrency } = useApp();

  // Estado del wizard
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Datos del formulario
  const [formData, setFormData] = useState({
    selectedClient: null,
    selectedPlan: null,
    startDate: membershipCreationService.getTodayDate(),
    endDate: '',
    selectedSchedule: {},
    paymentMethod: 'cash',
    notes: ''
  });

  // Estados de búsqueda
  const [clientSearch, setClientSearch] = useState('');
  const [planSearch, setPlanSearch] = useState('');

  // Datos cargados
  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);
  const [scheduleOptions, setScheduleOptions] = useState(null);

  // Validaciones
  const [clientHasActive, setClientHasActive] = useState(false);
  const [activeMembership, setActiveMembership] = useState(null);

  // Estado de selección de horarios
  const [useSameSlot, setUseSameSlot] = useState(false);
  const [commonSlotId, setCommonSlotId] = useState(null);

  const steps = [
    { number: 1, title: 'Cliente', icon: User },
    { number: 2, title: 'Plan', icon: Package },
    { number: 3, title: 'Fechas', icon: Calendar },
    { number: 4, title: 'Horarios', icon: Clock },
    { number: 5, title: 'Confirmar', icon: CheckCircle }
  ];

  // ============================================================================
  // PASO 1: CARGAR CLIENTES
  // ============================================================================

  useEffect(() => {
    if (currentStep === 1) {
      loadClients();
    }
  }, [currentStep, clientSearch]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const result = await membershipCreationService.searchClients(clientSearch, { limit: 50 });
      setClients(result.clients || []);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      showError('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClient = async (client) => {
    setFormData(prev => ({ ...prev, selectedClient: client }));

    // Verificar si tiene membresía activa
    const { hasActive, membership } = await membershipCreationService.checkClientActiveMembership(client.id);
    
    if (hasActive) {
      setClientHasActive(true);
      setActiveMembership(membership);
      showError('Este cliente ya tiene una membresía activa');
    } else {
      setClientHasActive(false);
      setActiveMembership(null);
    }
  };

  // ============================================================================
  // PASO 2: CARGAR PLANES
  // ============================================================================

  useEffect(() => {
    if (currentStep === 2) {
      loadPlans();
    }
  }, [currentStep]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const result = await membershipCreationService.getAvailablePlans();
      setPlans(result.plans || []);
    } catch (error) {
      console.error('Error cargando planes:', error);
      showError('Error al cargar planes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan) => {
    setFormData(prev => {
      const startDate = prev.startDate || membershipCreationService.getTodayDate();
      const endDate = membershipCreationService.calculateEndDate(startDate, plan.duration || plan.durationType);
      
      return {
        ...prev,
        selectedPlan: plan,
        endDate,
        selectedSchedule: {} // Reset horarios al cambiar plan
      };
    });
  };

  // ============================================================================
  // PASO 3: CONFIGURAR FECHAS
  // ============================================================================

  const handleStartDateChange = (newStartDate) => {
    if (!formData.selectedPlan) return;
    
    const endDate = membershipCreationService.calculateEndDate(
      newStartDate, 
      formData.selectedPlan.duration || formData.selectedPlan.durationType
    );
    
    setFormData(prev => ({
      ...prev,
      startDate: newStartDate,
      endDate
    }));
  };

  // ============================================================================
  // PASO 4: CARGAR Y SELECCIONAR HORARIOS
  // ============================================================================

  useEffect(() => {
    if (currentStep === 4 && formData.selectedPlan) {
      loadScheduleOptions();
    }
  }, [currentStep, formData.selectedPlan]);

  const loadScheduleOptions = async () => {
    if (!formData.selectedPlan || formData.selectedPlan.isDailyPlan) {
      return; // Plans diarios no requieren horarios
    }

    try {
      setLoading(true);
      const result = await membershipCreationService.getScheduleOptions(formData.selectedPlan.id);
      setScheduleOptions(result);
    } catch (error) {
      console.error('Error cargando horarios:', error);
      showError('Error al cargar horarios disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSlotForDay = (day, slotId) => {
    setFormData(prev => {
      const currentSchedule = { ...prev.selectedSchedule };
      
      if (currentSchedule[day]?.includes(slotId)) {
        // Remover slot
        currentSchedule[day] = currentSchedule[day].filter(id => id !== slotId);
        if (currentSchedule[day].length === 0) {
          delete currentSchedule[day];
        }
      } else {
        // Agregar slot (máximo 1 por día)
        currentSchedule[day] = [slotId];
      }
      
      return { ...prev, selectedSchedule: currentSchedule };
    });
  };

  const handleApplySameSlotToAll = (slotId) => {
    if (!scheduleOptions) return;

    const newSchedule = {};
    const allowedDays = scheduleOptions.plan?.allowedDays || [];

    allowedDays.forEach(day => {
      const daySchedule = scheduleOptions.availableOptions[day];
      if (daySchedule && daySchedule.isOpen) {
        const slot = daySchedule.slots.find(s => s.id === slotId);
        if (slot && slot.canReserve && slot.available > 0) {
          newSchedule[day] = [slotId];
        }
      }
    });

    setFormData(prev => ({ ...prev, selectedSchedule: newSchedule }));
    setCommonSlotId(slotId);
  };

  // ============================================================================
  // PASO 5: CREAR MEMBRESÍA
  // ============================================================================

  const handleCreateMembership = async () => {
    try {
      setCreating(true);

      const membershipData = {
        userId: formData.selectedClient.id,
        planId: formData.selectedPlan.id,
        selectedSchedule: formData.selectedSchedule,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes || `Membresía creada desde dashboard - Cliente: ${formData.selectedClient.firstName} ${formData.selectedClient.lastName}`
      };

      // Validar datos
      const validation = membershipCreationService.validateMembershipData(membershipData);
      if (!validation.isValid) {
        showError(validation.errors.join(', '));
        return;
      }

      console.log('🚀 Creando membresía con datos:', membershipData);

      // Crear y activar membresía
      const result = await membershipCreationService.createAndActivateMembership(membershipData);

      showSuccess('¡Membresía creada y activada exitosamente!');

      if (onSuccess) {
        onSuccess(result);
      }

      onClose();

    } catch (error) {
      console.error('❌ Error creando membresía:', error);
      showError(error.response?.data?.message || 'Error al crear membresía');
    } finally {
      setCreating(false);
    }
  };

  // ============================================================================
  // NAVEGACIÓN DEL WIZARD
  // ============================================================================

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return formData.selectedClient && !clientHasActive;
      case 2:
        return formData.selectedPlan;
      case 3:
        return formData.startDate && formData.endDate;
      case 4:
        // Si es plan diario, siempre puede avanzar
        if (formData.selectedPlan?.isDailyPlan) return true;
        // Si tiene horarios seleccionados, puede avanzar
        return Object.keys(formData.selectedSchedule).length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 5 && canGoNext()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = (stepNumber) => {
    // Permitir navegar hacia atrás o al paso actual
    if (stepNumber <= currentStep) {
      setCurrentStep(stepNumber);
    }
  };

  // ============================================================================
  // HELPERS DE RENDERIZADO
  // ============================================================================

  const dayNames = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  const filteredClients = clients.filter(client => {
    if (!clientSearch) return true;
    const searchLower = clientSearch.toLowerCase();
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    return fullName.includes(searchLower) || client.email.toLowerCase().includes(searchLower);
  });

  const filteredPlans = plans.filter(plan => {
    if (!planSearch) return true;
    const searchLower = planSearch.toLowerCase();
    return plan.name.toLowerCase().includes(searchLower);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-500 to-purple-600">
          <div>
            <h2 className="text-xl font-bold text-white">Nueva Membresía</h2>
            <p className="text-purple-100 text-sm mt-1">
              Proceso guiado en 5 pasos
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-purple-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* STEPPER */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              const canClick = step.number <= currentStep;

              return (
                <React.Fragment key={step.number}>
                  <button
                    onClick={() => canClick && handleStepClick(step.number)}
                    disabled={!canClick}
                    className={`flex items-center space-x-2 ${
                      canClick ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      isCompleted
                        ? 'bg-green-500 border-green-500'
                        : isActive
                        ? 'bg-purple-500 border-purple-500'
                        : 'bg-white border-gray-300'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <StepIcon className={`w-5 h-5 ${
                          isActive ? 'text-white' : 'text-gray-400'
                        }`} />
                      )}
                    </div>
                    <div className="hidden md:block text-left">
                      <div className={`text-xs font-medium ${
                        isActive ? 'text-purple-600' : 'text-gray-500'
                      }`}>
                        Paso {step.number}
                      </div>
                      <div className={`text-sm font-medium ${
                        isActive ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {step.title}
                      </div>
                    </div>
                  </button>
                  
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${
                      currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* CONTENIDO DEL PASO ACTUAL */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          
          {/* PASO 1: SELECCIONAR CLIENTE */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <User className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Seleccionar Cliente</h3>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 animate-spin text-purple-600 mr-2" />
                  <span className="text-gray-600">Cargando clientes...</span>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
                  {filteredClients.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No se encontraron clientes
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredClients.map(client => (
                        <button
                          key={client.id}
                          onClick={() => handleSelectClient(client)}
                          className={`w-full text-left p-4 hover:bg-purple-50 transition-colors ${
                            formData.selectedClient?.id === client.id ? 'bg-purple-100 border-l-4 border-purple-500' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {client.profileImage ? (
                                <img
                                  src={client.profileImage}
                                  alt=""
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                  <span className="text-lg font-semibold text-purple-600">
                                    {client.firstName[0]}{client.lastName[0]}
                                  </span>
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900">
                                  {client.firstName} {client.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{client.email}</div>
                                {client.phone && (
                                  <div className="text-xs text-gray-400 mt-1">{client.phone}</div>
                                )}
                              </div>
                            </div>
                            {formData.selectedClient?.id === client.id && (
                              <CheckCircle className="w-6 h-6 text-purple-600" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {clientHasActive && activeMembership && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="ml-3">
                      <h4 className="text-sm font-semibold text-orange-800">
                        Cliente con membresía activa
                      </h4>
                      <p className="text-sm text-orange-700 mt-1">
                        Tipo: {activeMembership.type || 'N/A'} | 
                        Vence: {formatDate(activeMembership.endDate, 'dd/MM/yyyy')}
                      </p>
                      <p className="text-xs text-orange-600 mt-2">
                        No se puede crear una nueva membresía mientras tenga una activa.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 2: SELECCIONAR PLAN */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <Package className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Seleccionar Plan</h3>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar plan..."
                  value={planSearch}
                  onChange={(e) => setPlanSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 animate-spin text-purple-600 mr-2" />
                  <span className="text-gray-600">Cargando planes...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPlans.map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => handleSelectPlan(plan)}
                      className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                        formData.selectedPlan?.id === plan.id
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                        {formData.selectedPlan?.id === plan.id && (
                          <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="w-4 h-4 mr-1" />
                          <span className="font-semibold text-purple-600">
                            {formatCurrency(plan.price)}
                          </span>
                          {plan.originalPrice && (
                            <span className="ml-2 line-through text-gray-400">
                              {formatCurrency(plan.originalPrice)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-1" />
                          {plan.duration || plan.durationType}
                        </div>

                        {plan.isDailyPlan && (
                          <div className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                            Sin reserva de horarios
                          </div>
                        )}

                        {plan.popular && (
                          <div className="bg-yellow-50 text-yellow-700 text-xs px-2 py-1 rounded flex items-center">
                            ⭐ Popular
                          </div>
                        )}
                      </div>

                      {plan.description && (
                        <p className="text-xs text-gray-500 mt-2">{plan.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PASO 3: CONFIGURAR FECHAS */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <Calendar className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Configurar Fechas</h3>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-sm font-semibold text-blue-800">
                      Cálculo automático de fecha final
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      La fecha de finalización se calcula automáticamente según el tipo de plan seleccionado.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Finalización (Calculada)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>

                {formData.startDate && formData.endDate && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-green-800">
                      <CheckCircle className="w-5 h-5" />
                      <div>
                        <div className="font-semibold">Duración Total</div>
                        <div className="text-sm">
                          {membershipCreationService.calculateDurationDays(formData.startDate, formData.endDate)} días
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 4: SELECCIONAR HORARIOS */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Seleccionar Horarios</h3>
              </div>

              {formData.selectedPlan?.isDailyPlan ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                  <Info className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                  <h4 className="text-lg font-semibold text-blue-800 mb-2">
                    Plan de 1 Día
                  </h4>
                  <p className="text-blue-700">
                    Las membresías de 1 día NO requieren reserva de horarios.
                    El cliente puede asistir en cualquier momento durante su día de validez.
                  </p>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 animate-spin text-purple-600 mr-2" />
                  <span className="text-gray-600">Cargando horarios disponibles...</span>
                </div>
              ) : scheduleOptions ? (
                <div className="space-y-6">
                  
                  {/* Opción de usar el mismo horario */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        checked={useSameSlot}
                        onChange={(e) => {
                          setUseSameSlot(e.target.checked);
                          if (!e.target.checked) {
                            setCommonSlotId(null);
                          }
                        }}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <label className="text-sm font-medium text-purple-900">
                          Usar el mismo horario para todos los días
                        </label>
                        <p className="text-xs text-purple-700 mt-1">
                          Aplica el mismo slot de tiempo a todos los días permitidos
                        </p>
                      </div>
                    </div>

                    {useSameSlot && (
                      <div className="mt-4 space-y-2">
                        {scheduleOptions.availableOptions[scheduleOptions.allowedDays[0]]?.slots.map(slot => (
                          <button
                            key={slot.id}
                            onClick={() => handleApplySameSlotToAll(slot.id)}
                            className={`w-full text-left p-3 border rounded-lg transition-colors ${
                              commonSlotId === slot.id
                                ? 'border-purple-500 bg-purple-100'
                                : 'border-gray-300 hover:border-purple-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {slot.label || slot.slotLabel}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {slot.openTime?.slice(0, 5)} - {slot.closeTime?.slice(0, 5)}
                                </div>
                              </div>
                              <div className="text-sm">
                                <span className={slot.available > 5 ? 'text-green-600' : 'text-orange-600'}>
                                  {slot.available} disponibles
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selección individual por día */}
                  {!useSameSlot && (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600 mb-4">
                        Selecciona 1 horario por cada día. Puedes omitir días si lo deseas.
                      </div>

                      {scheduleOptions.allowedDays.map(day => {
                        const daySchedule = scheduleOptions.availableOptions[day];
                        if (!daySchedule || !daySchedule.isOpen) {
                          return (
                            <div key={day} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                              <div className="font-medium text-gray-900 mb-1">{dayNames[day]}</div>
                              <div className="text-sm text-gray-500">Gimnasio cerrado</div>
                            </div>
                          );
                        }

                        return (
                          <div key={day} className="border border-gray-300 rounded-lg p-4">
                            <div className="font-medium text-gray-900 mb-3">{dayNames[day]}</div>
                            <div className="space-y-2">
                              {daySchedule.slots.map(slot => {
                                const isSelected = formData.selectedSchedule[day]?.includes(slot.id);
                                const canSelect = slot.canReserve && slot.available > 0;

                                return (
                                  <button
                                    key={slot.id}
                                    onClick={() => canSelect && handleToggleSlotForDay(day, slot.id)}
                                    disabled={!canSelect}
                                    className={`w-full text-left p-3 border rounded-lg transition-colors ${
                                      isSelected
                                        ? 'border-purple-500 bg-purple-50'
                                        : canSelect
                                        ? 'border-gray-300 hover:border-purple-300'
                                        : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="font-medium text-gray-900">
                                          {slot.label || slot.slotLabel}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          {slot.openTime?.slice(0, 5)} - {slot.closeTime?.slice(0, 5)}
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-3">
                                        <div className="text-sm">
                                          <span className={slot.available > 5 ? 'text-green-600' : 'text-orange-600'}>
                                            {slot.available} disp.
                                          </span>
                                        </div>
                                        {isSelected && <CheckCircle className="w-5 h-5 text-purple-600" />}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Resumen de selección */}
                  {Object.keys(formData.selectedSchedule).length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-2">
                        Horarios Seleccionados
                      </h4>
                      <div className="space-y-1 text-sm text-green-700">
                        {Object.entries(formData.selectedSchedule).map(([day, slotIds]) => (
                          <div key={day}>
                            {dayNames[day]}: {slotIds.length} horario(s)
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No se pudieron cargar los horarios disponibles
                </div>
              )}
            </div>
          )}

          {/* PASO 5: CONFIRMAR */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Confirmar y Crear</h3>
              </div>

              {/* Resumen */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-300 rounded-lg p-6 space-y-4">
                <h4 className="font-semibold text-purple-900 text-lg mb-4">
                  Resumen de la Membresía
                </h4>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <User className="w-5 h-5 text-purple-600 mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm text-purple-700">Cliente</div>
                      <div className="font-semibold text-purple-900">
                        {formData.selectedClient?.firstName} {formData.selectedClient?.lastName}
                      </div>
                      <div className="text-sm text-purple-600">
                        {formData.selectedClient?.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Package className="w-5 h-5 text-purple-600 mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm text-purple-700">Plan</div>
                      <div className="font-semibold text-purple-900">
                        {formData.selectedPlan?.name}
                      </div>
                      <div className="text-sm text-purple-600">
                        {formatCurrency(formData.selectedPlan?.price)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-purple-600 mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm text-purple-700">Período</div>
                      <div className="font-semibold text-purple-900">
                        {formatDate(formData.startDate, 'dd/MM/yyyy')} - {formatDate(formData.endDate, 'dd/MM/yyyy')}
                      </div>
                      <div className="text-sm text-purple-600">
                        {membershipCreationService.calculateDurationDays(formData.startDate, formData.endDate)} días
                      </div>
                    </div>
                  </div>

                  {!formData.selectedPlan?.isDailyPlan && Object.keys(formData.selectedSchedule).length > 0 && (
                    <div className="flex items-start">
                      <Clock className="w-5 h-5 text-purple-600 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm text-purple-700">Horarios</div>
                        <div className="font-semibold text-purple-900">
                          {Object.keys(formData.selectedSchedule).length} día(s) con horario
                        </div>
                        <div className="text-sm text-purple-600 space-y-1 mt-1">
                          {Object.keys(formData.selectedSchedule).map(day => (
                            <div key={day}>{dayNames[day]}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Método de pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="card">Tarjeta</option>
                </select>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Adicionales (Opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Notas adicionales sobre esta membresía..."
                />
              </div>

              {/* Info de auto-activación */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-sm font-semibold text-blue-800">
                      Activación Automática
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Al confirmar, la membresía será creada y activada automáticamente. 
                      El pago en {formData.paymentMethod === 'cash' ? 'efectivo' : formData.paymentMethod === 'transfer' ? 'transferencia' : 'tarjeta'} será registrado como completado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER CON BOTONES */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1 || creating}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </button>

          <div className="text-sm text-gray-600">
            Paso {currentStep} de {steps.length}
          </div>

          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              disabled={!canGoNext() || loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleCreateMembership}
              disabled={creating || !canGoNext()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Creando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Crear Membresía
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default MembershipCreationWizard;