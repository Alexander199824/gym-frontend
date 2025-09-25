// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/MembershipPlansManager.js
// FUNCIÓN: Gestión completa de tipos/planes de membresía - Crear, editar, eliminar planes
// CONECTA CON: Backend API /api/membership-plans/*

import React, { useState, useEffect } from 'react';
import {
  Settings, Plus, Edit, Trash2, Eye, X, CheckCircle, 
  Loader, RefreshCw, AlertTriangle, Star, Clock, Calendar,
  DollarSign, Tag, Package, Save
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

const MembershipPlansManager = ({ onSave, onUnsavedChanges }) => {
  const { user: currentUser, hasPermission } = useAuth();
  const { showSuccess, showError, formatCurrency, isMobile } = useApp();
  
  // Estados principales
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Estados para crear/editar plan
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planFormData, setPlanFormData] = useState({
    name: '',
    value: '', // daily, weekly, monthly, etc.
    label: '',
    duration: 30, // días
    price: 250.00,
    originalPrice: 250.00, // para mostrar descuentos
    color: 'bg-purple-100 text-purple-800',
    description: '',
    features: [],
    isPopular: false,
    isActive: true,
    icon: 'Package'
  });
  
  // Colores disponibles para los planes
  const availableColors = [
    { value: 'bg-blue-100 text-blue-800', label: 'Azul', preview: 'bg-blue-100' },
    { value: 'bg-green-100 text-green-800', label: 'Verde', preview: 'bg-green-100' },
    { value: 'bg-purple-100 text-purple-800', label: 'Morado', preview: 'bg-purple-100' },
    { value: 'bg-orange-100 text-orange-800', label: 'Naranja', preview: 'bg-orange-100' },
    { value: 'bg-red-100 text-red-800', label: 'Rojo', preview: 'bg-red-100' },
    { value: 'bg-yellow-100 text-yellow-800', label: 'Amarillo', preview: 'bg-yellow-100' },
    { value: 'bg-gray-100 text-gray-800', label: 'Gris', preview: 'bg-gray-100' },
    { value: 'bg-pink-100 text-pink-800', label: 'Rosa', preview: 'bg-pink-100' }
  ];
  
  // Iconos disponibles
  const availableIcons = [
    { value: 'Package', label: 'Paquete', icon: Package },
    { value: 'Calendar', label: 'Calendario', icon: Calendar },
    { value: 'Clock', label: 'Reloj', icon: Clock },
    { value: 'DollarSign', label: 'Dólar', icon: DollarSign },
    { value: 'Star', label: 'Estrella', icon: Star },
    { value: 'Tag', label: 'Etiqueta', icon: Tag },
    { value: 'CheckCircle', label: 'Check', icon: CheckCircle },
    { value: 'Settings', label: 'Configuración', icon: Settings }
  ];
  
  // Nueva característica temporal
  const [newFeature, setNewFeature] = useState('');
  
  // CARGAR DATOS
  const loadMembershipPlans = async () => {
    try {
      setLoading(true);
      
      // Si no existe endpoint específico para planes, usar datos por defecto
      let plansData;
      try {
        const response = await apiService.get('/membership-plans');
        plansData = response.data || response;
      } catch (error) {
        // Datos por defecto si no existe el endpoint
        console.warn('Endpoint de planes no disponible, usando datos por defecto');
        plansData = [
          { id: 1, name: 'Plan Diario', value: 'daily', label: 'Diaria', duration: 1, price: 25, originalPrice: 30, color: 'bg-blue-100 text-blue-800', description: 'Acceso por un día', features: ['Acceso al gimnasio', 'Equipos básicos'], isPopular: false, isActive: true, icon: 'Clock' },
          { id: 2, name: 'Plan Semanal', value: 'weekly', label: 'Semanal', duration: 7, price: 150, originalPrice: 175, color: 'bg-green-100 text-green-800', description: 'Acceso por una semana', features: ['Acceso al gimnasio', 'Equipos básicos', 'Clases grupales'], isPopular: false, isActive: true, icon: 'Calendar' },
          { id: 3, name: 'Plan Mensual', value: 'monthly', label: 'Mensual', duration: 30, price: 250, originalPrice: 300, color: 'bg-purple-100 text-purple-800', description: 'Acceso por un mes completo', features: ['Acceso ilimitado', 'Todas las clases', 'Asesoría básica'], isPopular: true, isActive: true, icon: 'Star' },
          { id: 4, name: 'Plan Trimestral', value: 'quarterly', label: 'Trimestral', duration: 90, price: 600, originalPrice: 750, color: 'bg-orange-100 text-orange-800', description: 'Acceso por tres meses', features: ['Acceso ilimitado', 'Todas las clases', 'Asesoría personalizada', 'Plan nutricional'], isPopular: false, isActive: true, icon: 'Package' },
          { id: 5, name: 'Plan Anual', value: 'annual', label: 'Anual', duration: 365, price: 2400, originalPrice: 3000, color: 'bg-red-100 text-red-800', description: 'Acceso por un año completo', features: ['Acceso ilimitado', 'Todas las clases', 'Asesoría VIP', 'Plan nutricional', 'Evaluaciones médicas'], isPopular: false, isActive: true, icon: 'CheckCircle' }
        ];
      }
      
      if (Array.isArray(plansData)) {
        setMembershipPlans(plansData);
      } else if (plansData.plans && Array.isArray(plansData.plans)) {
        setMembershipPlans(plansData.plans);
      } else {
        console.warn('Formato de datos de planes inesperado:', plansData);
        setMembershipPlans([]);
      }
      
    } catch (error) {
      console.error('Error al cargar planes de membresía:', error);
      showError('Error al cargar planes de membresía');
      setMembershipPlans([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar datos al montar
  useEffect(() => {
    loadMembershipPlans();
  }, []);
  
  // Notificar cambios no guardados
  useEffect(() => {
    if (onUnsavedChanges) {
      onUnsavedChanges(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onUnsavedChanges]);
  
  // FUNCIONES DE PLAN
  
  // Crear/Actualizar plan
  const handleSavePlan = async () => {
    try {
      setSaving(true);
      
      // Validaciones
      if (!planFormData.name.trim()) {
        showError('El nombre del plan es obligatorio');
        return;
      }
      
      if (!planFormData.value.trim()) {
        showError('El valor del plan es obligatorio');
        return;
      }
      
      if (!planFormData.label.trim()) {
        showError('La etiqueta del plan es obligatoria');
        return;
      }
      
      if (planFormData.price <= 0) {
        showError('El precio debe ser mayor a 0');
        return;
      }
      
      if (planFormData.duration <= 0) {
        showError('La duración debe ser mayor a 0 días');
        return;
      }
      
      // Si es popular, quitar popular de otros
      if (planFormData.isPopular) {
        setMembershipPlans(prev => prev.map(plan => 
          plan.id !== editingPlan?.id ? { ...plan, isPopular: false } : plan
        ));
      }
      
      const planData = {
        ...planFormData,
        features: planFormData.features.filter(f => f.trim() !== '')
      };
      
      let response;
      if (editingPlan) {
        // Actualizar en lista local (simular API)
        setMembershipPlans(prev => prev.map(plan => 
          plan.id === editingPlan.id ? { ...planData, id: editingPlan.id } : plan
        ));
        
        try {
          response = await apiService.put(`/membership-plans/${editingPlan.id}`, planData);
        } catch (error) {
          console.warn('API no disponible, usando actualización local');
        }
        
        showSuccess('Plan de membresía actualizado exitosamente');
      } else {
        // Crear nuevo plan (simular ID)
        const newPlan = { ...planData, id: Date.now() };
        setMembershipPlans(prev => [...prev, newPlan]);
        
        try {
          response = await apiService.post('/membership-plans', planData);
          if (response && response.id) {
            // Actualizar con ID real del servidor
            setMembershipPlans(prev => prev.map(plan => 
              plan.id === newPlan.id ? { ...planData, id: response.id } : plan
            ));
          }
        } catch (error) {
          console.warn('API no disponible, usando creación local');
        }
        
        showSuccess('Plan de membresía creado exitosamente');
      }
      
      // Marcar cambios guardados
      setHasUnsavedChanges(false);
      
      // Cerrar modal
      setShowPlanModal(false);
      setEditingPlan(null);
      resetPlanForm();
      
      // Notificar cambios guardados
      if (onSave) {
        onSave({ type: 'membership-plan', action: editingPlan ? 'updated' : 'created' });
      }
      
    } catch (error) {
      console.error('Error al guardar plan:', error);
      const errorMsg = error.response?.data?.message || 'Error al guardar plan de membresía';
      showError(errorMsg);
    } finally {
      setSaving(false);
    }
  };
  
  // Eliminar plan
  const handleDeletePlan = async (planId) => {
    if (!window.confirm('¿Estás seguro de eliminar este plan de membresía?')) {
      return;
    }
    
    try {
      // Eliminar de lista local
      setMembershipPlans(prev => prev.filter(plan => plan.id !== planId));
      
      try {
        await apiService.delete(`/membership-plans/${planId}`);
      } catch (error) {
        console.warn('API no disponible, usando eliminación local');
      }
      
      showSuccess('Plan de membresía eliminado exitosamente');
      setHasUnsavedChanges(true);
      
    } catch (error) {
      console.error('Error al eliminar plan:', error);
      showError('Error al eliminar plan de membresía');
    }
  };
  
  // Toggle activo/inactivo
  const handleToggleActive = async (planId) => {
    try {
      setMembershipPlans(prev => prev.map(plan => 
        plan.id === planId ? { ...plan, isActive: !plan.isActive } : plan
      ));
      
      const plan = membershipPlans.find(p => p.id === planId);
      try {
        await apiService.patch(`/membership-plans/${planId}`, { isActive: !plan.isActive });
      } catch (error) {
        console.warn('API no disponible, usando actualización local');
      }
      
      showSuccess(`Plan ${plan.isActive ? 'desactivado' : 'activado'} exitosamente`);
      setHasUnsavedChanges(true);
      
    } catch (error) {
      console.error('Error al cambiar estado del plan:', error);
      showError('Error al cambiar estado del plan');
    }
  };
  
  // Reset form
  const resetPlanForm = () => {
    setPlanFormData({
      name: '',
      value: '',
      label: '',
      duration: 30,
      price: 250.00,
      originalPrice: 250.00,
      color: 'bg-purple-100 text-purple-800',
      description: '',
      features: [],
      isPopular: false,
      isActive: true,
      icon: 'Package'
    });
    setNewFeature('');
  };
  
  // Abrir modal para editar
  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanFormData({
      name: plan.name || '',
      value: plan.value || '',
      label: plan.label || '',
      duration: plan.duration || 30,
      price: plan.price || 0,
      originalPrice: plan.originalPrice || plan.price || 0,
      color: plan.color || 'bg-purple-100 text-purple-800',
      description: plan.description || '',
      features: plan.features ? [...plan.features] : [],
      isPopular: plan.isPopular || false,
      isActive: plan.isActive !== undefined ? plan.isActive : true,
      icon: plan.icon || 'Package'
    });
    setShowPlanModal(true);
  };
  
  // Abrir modal para crear
  const handleNewPlan = () => {
    setEditingPlan(null);
    resetPlanForm();
    setShowPlanModal(true);
  };
  
  // Agregar característica
  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setPlanFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
      setHasUnsavedChanges(true);
    }
  };
  
  // Remover característica
  const handleRemoveFeature = (index) => {
    setPlanFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
    setHasUnsavedChanges(true);
  };
  
  // Calcular porcentaje de descuento
  const getDiscountPercentage = (price, originalPrice) => {
    if (originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };
  
  // Obtener icono por nombre
  const getIconComponent = (iconName) => {
    const iconInfo = availableIcons.find(icon => icon.value === iconName);
    return iconInfo ? iconInfo.icon : Package;
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Settings className="w-6 h-6 mr-2 text-blue-600" />
            Gestión de Planes de Membresía
          </h3>
          <p className="text-gray-600 mt-1">
            Configura los tipos de membresías disponibles para tus clientes
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <button
            onClick={loadMembershipPlans}
            className="btn-secondary btn-sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          
          {hasPermission('manage_membership_plans') && (
            <button
              onClick={handleNewPlan}
              className="btn-primary btn-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Plan
            </button>
          )}
        </div>
      </div>
      
      {/* ALERTAS DE CAMBIOS NO GUARDADOS */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Cambios sin guardar
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Tienes cambios que no se han guardado. Asegúrate de guardar antes de salir.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* TARJETAS DE PLANES */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900">
          Planes Configurados ({membershipPlans.filter(p => p.isActive).length} activos)
        </h4>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Cargando planes...</span>
          </div>
        ) : membershipPlans.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay planes configurados</h3>
            <p className="text-gray-600 mb-4">
              Comienza creando tu primer plan de membresía
            </p>
            {hasPermission('manage_membership_plans') && (
              <button onClick={handleNewPlan} className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Crear Plan
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {membershipPlans.map((plan) => {
              const IconComponent = getIconComponent(plan.icon);
              const discount = getDiscountPercentage(plan.price, plan.originalPrice);
              
              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg ${
                    plan.isPopular ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-white' : 'border-gray-200'
                  } ${!plan.isActive ? 'opacity-50' : ''}`}
                >
                  
                  {/* Badge de Popular */}
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center">
                        <Star className="w-3 h-3 mr-1" />
                        POPULAR
                      </span>
                    </div>
                  )}
                  
                  {/* Estado inactivo */}
                  {!plan.isActive && (
                    <div className="absolute -top-3 right-4">
                      <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        INACTIVO
                      </span>
                    </div>
                  )}
                  
                  <div className="p-6">
                    
                    {/* Header del plan */}
                    <div className="text-center mb-6">
                      <div className="mb-4">
                        <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${plan.color.split(' ')[0]} mb-3`}>
                          <IconComponent className={`w-6 h-6 ${plan.color.split(' ').slice(1).join(' ')}`} />
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {plan.name}
                      </h3>
                      
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${plan.color}`}>
                        {plan.label}
                      </span>
                      
                      {plan.description && (
                        <p className="text-gray-600 text-sm mt-2">
                          {plan.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Precio */}
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-3xl font-bold text-gray-900">
                          {formatCurrency(plan.price)}
                        </span>
                        {discount > 0 && (
                          <div className="flex flex-col items-start">
                            <span className="text-sm text-gray-500 line-through">
                              {formatCurrency(plan.originalPrice)}
                            </span>
                            <span className="text-xs font-medium text-green-600">
                              -{discount}%
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-center text-sm text-gray-500 mt-2">
                        <Clock className="w-4 h-4 mr-1" />
                        {plan.duration} día{plan.duration !== 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    {/* Características */}
                    {plan.features && plan.features.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Incluye:</h4>
                        <ul className="space-y-2">
                          {plan.features.slice(0, 4).map((feature, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-600">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                          {plan.features.length > 4 && (
                            <li className="text-sm text-gray-500 italic">
                              +{plan.features.length - 4} característica{plan.features.length - 4 !== 1 ? 's' : ''} más
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                    
                    {/* Acciones */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        {hasPermission('manage_membership_plans') && (
                          <>
                            <button
                              onClick={() => handleEditPlan(plan)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Editar plan"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleToggleActive(plan.id)}
                              className={`${plan.isActive ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`}
                              title={plan.isActive ? 'Desactivar plan' : 'Activar plan'}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDeletePlan(plan.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar plan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                      
                      <span className="text-xs text-gray-500">
                        ID: {plan.value}
                      </span>
                    </div>
                    
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* MODAL PARA CREAR/EDITAR PLAN */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            
            {/* Header del modal */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingPlan ? 'Editar Plan de Membresía' : 'Nuevo Plan de Membresía'}
                </h3>
                <button
                  onClick={() => {
                    setShowPlanModal(false);
                    setEditingPlan(null);
                    resetPlanForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Columna izquierda - Formulario */}
                <div className="space-y-4">
                  
                  {/* Información básica */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Información Básica</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre del Plan *
                        </label>
                        <input
                          type="text"
                          value={planFormData.name}
                          onChange={(e) => {
                            setPlanFormData(prev => ({ ...prev, name: e.target.value }));
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="ej. Plan Premium"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Valor/ID *
                          </label>
                          <input
                            type="text"
                            value={planFormData.value}
                            onChange={(e) => {
                              setPlanFormData(prev => ({ ...prev, value: e.target.value.toLowerCase().replace(/\s+/g, '_') }));
                              setHasUnsavedChanges(true);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="ej. premium"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Etiqueta *
                          </label>
                          <input
                            type="text"
                            value={planFormData.label}
                            onChange={(e) => {
                              setPlanFormData(prev => ({ ...prev, label: e.target.value }));
                              setHasUnsavedChanges(true);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="ej. Premium"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descripción
                        </label>
                        <textarea
                          value={planFormData.description}
                          onChange={(e) => {
                            setPlanFormData(prev => ({ ...prev, description: e.target.value }));
                            setHasUnsavedChanges(true);
                          }}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Descripción del plan..."
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Precios y duración */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Precios y Duración</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Precio Actual * (Q)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={planFormData.price}
                          onChange={(e) => {
                            setPlanFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }));
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Precio Original (Q)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={planFormData.originalPrice}
                          onChange={(e) => {
                            setPlanFormData(prev => ({ ...prev, originalPrice: parseFloat(e.target.value) || 0 }));
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duración (días) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={planFormData.duration}
                          onChange={(e) => {
                            setPlanFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }));
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Apariencia */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Apariencia</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Color del Plan
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {availableColors.map(color => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => {
                                setPlanFormData(prev => ({ ...prev, color: color.value }));
                                setHasUnsavedChanges(true);
                              }}
                              className={`p-2 rounded-lg border-2 transition-all ${
                                planFormData.color === color.value ? 'border-blue-500' : 'border-gray-200'
                              }`}
                              title={color.label}
                            >
                              <div className={`w-full h-8 rounded ${color.preview}`}></div>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Icono
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {availableIcons.map(icon => {
                            const IconComponent = icon.icon;
                            return (
                              <button
                                key={icon.value}
                                type="button"
                                onClick={() => {
                                  setPlanFormData(prev => ({ ...prev, icon: icon.value }));
                                  setHasUnsavedChanges(true);
                                }}
                                className={`p-2 rounded-lg border-2 transition-all flex items-center justify-center ${
                                  planFormData.icon === icon.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                                }`}
                                title={icon.label}
                              >
                                <IconComponent className="w-5 h-5" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Configuración */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Configuración</h4>
                    
                    <div className="space-y-3">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={planFormData.isPopular}
                          onChange={(e) => {
                            setPlanFormData(prev => ({ ...prev, isPopular: e.target.checked }));
                            setHasUnsavedChanges(true);
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Plan Popular</span>
                      </label>
                      
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={planFormData.isActive}
                          onChange={(e) => {
                            setPlanFormData(prev => ({ ...prev, isActive: e.target.checked }));
                            setHasUnsavedChanges(true);
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Plan Activo</span>
                      </label>
                    </div>
                  </div>
                  
                </div>
                
                {/* Columna derecha - Características y Preview */}
                <div className="space-y-4">
                  
                  {/* Características */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Características del Plan</h4>
                    
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Nueva característica..."
                        />
                        <button
                          type="button"
                          onClick={handleAddFeature}
                          className="btn-primary btn-sm"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {planFormData.features.length > 0 && (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {planFormData.features.map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="flex-1 text-sm text-gray-700">{feature}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFeature(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Vista previa */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Vista Previa</h4>
                    
                    <div className={`relative bg-white rounded-xl shadow-sm border-2 transition-all ${
                      planFormData.isPopular ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-white' : 'border-gray-200'
                    }`}>
                      
                      {planFormData.isPopular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center">
                            <Star className="w-3 h-3 mr-1" />
                            POPULAR
                          </span>
                        </div>
                      )}
                      
                      <div className="p-4">
                        <div className="text-center mb-4">
                          <div className="mb-3">
                            {(() => {
                              const IconComponent = getIconComponent(planFormData.icon);
                              return (
                                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${planFormData.color.split(' ')[0]} mb-2`}>
                                  <IconComponent className={`w-5 h-5 ${planFormData.color.split(' ').slice(1).join(' ')}`} />
                                </span>
                              );
                            })()}
                          </div>
                          
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {planFormData.name || 'Nombre del Plan'}
                          </h3>
                          
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${planFormData.color}`}>
                            {planFormData.label || 'Etiqueta'}
                          </span>
                          
                          {planFormData.description && (
                            <p className="text-gray-600 text-xs mt-2">
                              {planFormData.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-center mb-4">
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-xl font-bold text-gray-900">
                              {formatCurrency(planFormData.price)}
                            </span>
                            {planFormData.originalPrice > planFormData.price && (
                              <div className="flex flex-col items-start">
                                <span className="text-xs text-gray-500 line-through">
                                  {formatCurrency(planFormData.originalPrice)}
                                </span>
                                <span className="text-xs font-medium text-green-600">
                                  -{getDiscountPercentage(planFormData.price, planFormData.originalPrice)}%
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-center text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {planFormData.duration} día{planFormData.duration !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        {planFormData.features.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-900 mb-2">Incluye:</h4>
                            <ul className="space-y-1">
                              {planFormData.features.slice(0, 3).map((feature, index) => (
                                <li key={index} className="flex items-center text-xs text-gray-600">
                                  <CheckCircle className="w-3 h-3 text-green-500 mr-1 flex-shrink-0" />
                                  {feature}
                                </li>
                              ))}
                              {planFormData.features.length > 3 && (
                                <li className="text-xs text-gray-500 italic">
                                  +{planFormData.features.length - 3} más
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                </div>
                
              </div>
            </div>
            
            {/* Footer del modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPlanModal(false);
                  setEditingPlan(null);
                  resetPlanForm();
                }}
                className="btn-secondary"
                disabled={saving}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSavePlan}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingPlan ? 'Actualizar' : 'Crear'} Plan
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

export default MembershipPlansManager;