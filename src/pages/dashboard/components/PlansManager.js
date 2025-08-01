// src/pages/dashboard/components/PlansManager.js
// FUNCIÓN: Gestión MEJORADA de planes - Vista de edición corregida y responsive
// CAMBIOS: Formulario de edición en modal, mejor layout, vista completa

import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Save, X, CreditCard, Crown, Calendar,
  Shield, Star, Check, AlertTriangle, Percent, Eye, EyeOff,
  Loader
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';

const PlansManager = ({ plans, isLoading, onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, formatCurrency, isMobile } = useApp();
  
  // 📱 Estados locales
  const [localPlans, setLocalPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // 🎯 Iconos disponibles para planes - AMPLIADOS
  const availableIcons = [
    { id: 'crown', component: Crown, name: 'Premium' },
    { id: 'star', component: Star, name: 'Popular' },
    { id: 'shield', component: Shield, name: 'Básico' },
    { id: 'calendar', component: Calendar, name: 'Calendario' },
    { id: 'creditcard', component: CreditCard, name: 'Tarjeta' },
    { id: 'check', component: Check, name: 'Verificado' },
    { id: 'loader', component: Loader, name: 'Dinámico' },
    { id: 'plus', component: Plus, name: 'Completo' }
  ];
  
  // 📅 Tipos de duración - CON DÍA AGREGADO
  const durationType = [
    { value: 'daily', label: 'Diario' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'yearly', label: 'Anual' }
  ];
  
  // 📊 Plantilla para nuevo plan
  const emptyPlan = {
    id: null,
    name: '',
    price: 0,
    originalPrice: null,
    duration: 'monthly',
    iconName: 'crown',
    features: [],
    popular: false
  };
  
  // 🔄 INICIALIZAR CON DATOS ACTUALES - MEJORADO
  useEffect(() => {
    console.log('🔄 PlansManager - Checking for plans data:', {
      hasPlans: !!plans,
      isLoading,
      isArray: Array.isArray(plans),
      length: Array.isArray(plans) ? plans.length : 0,
      plans: plans
    });
    
    if (!isLoading) {
      if (plans && Array.isArray(plans)) {
        console.log('📥 PlansManager - Loading plans from backend:', plans);
        
        // Mapear planes con estructura esperada
        const mappedPlans = plans.map((plan, index) => ({
          id: plan.id || `plan_${index}`,
          name: plan.name || '',
          price: parseFloat(plan.price) || 0,
          originalPrice: plan.originalPrice ? parseFloat(plan.originalPrice) : null,
          duration: plan.duration || 'monthly',
          iconName: plan.iconName || 'crown',
          features: Array.isArray(plan.features) ? plan.features : [],
          popular: plan.popular === true
        }));
        
        console.log('✅ PlansManager - Plans mapped successfully:', {
          total: mappedPlans.length,
          popular: mappedPlans.filter(p => p.popular).length,
          names: mappedPlans.map(p => p.name),
          prices: mappedPlans.map(p => p.price)
        });
        
        setLocalPlans(mappedPlans);
        setIsDataLoaded(true);
        
      } else {
        console.log('⚠️ PlansManager - No plans data or invalid format');
        setLocalPlans([]);
        setIsDataLoaded(true);
      }
    } else {
      console.log('⏳ PlansManager - Data is still loading...');
      setIsDataLoaded(false);
    }
  }, [plans, isLoading]);
  
  // 🔔 Notificar cambios sin guardar
  useEffect(() => {
    onUnsavedChanges(hasChanges);
  }, [hasChanges, onUnsavedChanges]);
  
  // 💾 Guardar todos los cambios
  const handleSaveAll = async () => {
    try {
      // Validar que hay al menos un plan
      if (localPlans.length === 0) {
        showError('Debe haber al menos un plan');
        return;
      }
      
      // Validar que solo hay un plan popular
      const popularPlans = localPlans.filter(plan => plan.popular);
      if (popularPlans.length > 1) {
        showError('Solo puede haber un plan marcado como popular');
        return;
      }
      
      console.log('Guardando planes:', localPlans);
      
      onSave(localPlans);
      setHasChanges(false);
      showSuccess('Planes de membresía guardados exitosamente');
      
      // Cerrar modo edición
      setEditingPlan(null);
      setIsCreating(false);
      setShowEditModal(false);
      
    } catch (error) {
      console.error('Error saving plans:', error);
      showError('Error al guardar planes');
    }
  };
  
  // ➕ Crear nuevo plan
  const handleCreatePlan = () => {
    setIsCreating(true);
    setEditingPlan({
      ...emptyPlan,
      id: `temp_${Date.now()}`
    });
    setShowEditModal(true);
  };
  
  // ✏️ Editar plan existente
  const handleEditPlan = (plan) => {
    console.log('📝 Editing plan:', plan);
    setEditingPlan({ ...plan });
    setIsCreating(false);
    setShowEditModal(true);
  };
  
  // 💾 Guardar plan individual
  const handleSavePlan = () => {
    if (!editingPlan.name.trim()) {
      showError('El nombre del plan es obligatorio');
      return;
    }
    
    if (!editingPlan.price || editingPlan.price <= 0) {
      showError('El precio debe ser mayor a 0');
      return;
    }
    
    if (editingPlan.originalPrice && editingPlan.originalPrice <= editingPlan.price) {
      showError('El precio original debe ser mayor al precio actual');
      return;
    }
    
    // Si se marca como popular, desmarcar otros
    if (editingPlan.popular) {
      localPlans.forEach(plan => {
        if (plan.id !== editingPlan.id) {
          plan.popular = false;
        }
      });
    }
    
    if (isCreating) {
      // Agregar nuevo plan
      const newPlan = {
        ...editingPlan,
        id: `new_${Date.now()}`
      };
      setLocalPlans([...localPlans, newPlan]);
    } else {
      // Actualizar plan existente
      setLocalPlans(localPlans.map(plan => 
        plan.id === editingPlan.id ? editingPlan : plan
      ));
    }
    
    setHasChanges(true);
    setEditingPlan(null);
    setIsCreating(false);
    setShowEditModal(false);
    showSuccess(isCreating ? 'Plan creado' : 'Plan actualizado');
  };
  
  // ❌ Cancelar edición
  const handleCancelEdit = () => {
    setEditingPlan(null);
    setIsCreating(false);
    setShowEditModal(false);
  };
  
  // 🗑️ Eliminar plan
  const handleDeletePlan = (planId) => {
    if (window.confirm('¿Estás seguro de eliminar este plan de membresía?')) {
      setLocalPlans(localPlans.filter(plan => plan.id !== planId));
      setHasChanges(true);
      showSuccess('Plan eliminado');
    }
  };
  
  // ⭐ Toggle plan popular
  const handleTogglePopular = (planId) => {
    setLocalPlans(localPlans.map(plan => ({
      ...plan,
      popular: plan.id === planId ? !plan.popular : false
    })));
    setHasChanges(true);
  };
  
  // 💰 Calcular descuento
  const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  // 🔄 Mostrar loading mientras se cargan los datos
  if (isLoading || !isDataLoaded) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando planes de membresía actuales...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 🔝 HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Planes de Membresía
          </h3>
          <p className="text-gray-600 mt-1">
            Planes que aparecen en la página web
          </p>
          
          {/* Mostrar planes actuales cargados */}
          {isDataLoaded && localPlans.length > 0 && (
            <div className="mt-2 flex space-x-2">
              <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                ✅ {localPlans.length} planes cargados
              </span>
              {localPlans.filter(p => p.popular).length > 0 && (
                <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                  ⭐ {localPlans.filter(p => p.popular).length} popular
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex space-x-3">
          {hasChanges && (
            <button
              onClick={handleSaveAll}
              className="btn-primary btn-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </button>
          )}
          
          <button
            onClick={handleCreatePlan}
            className="btn-secondary btn-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Plan
          </button>
        </div>
      </div>
      
      {/* ⚠️ INDICADOR DE CAMBIOS */}
      {hasChanges && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Tienes cambios sin guardar. No olvides hacer clic en "Guardar Cambios".
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* 📋 LISTA DE PLANES */}
      <div className={`grid gap-6 ${
        isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {localPlans.map((plan, index) => (
          <div 
            key={plan.id} 
            className={`relative bg-white border-2 rounded-xl overflow-hidden transition-all duration-300 ${
              plan.popular 
                ? 'border-yellow-400 shadow-lg transform scale-105' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            
            {/* Badge popular */}
            {plan.popular && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-bold flex items-center">
                  <Star className="w-4 h-4 mr-1 fill-current" />
                  Más Popular
                </span>
              </div>
            )}
            
            {/* Vista normal del plan */}
            <div className="p-6">
              
              {/* Header del plan */}
              <div className="text-center mb-6">
                
                {/* Icono */}
                <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                  {React.createElement(
                    availableIcons.find(icon => icon.id === plan.iconName)?.component || Crown,
                    { className: "w-8 h-8 text-primary-600" }
                  )}
                </div>
                
                {/* Nombre */}
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {plan.name || 'Sin nombre'}
                </h4>
                
                {/* Precio */}
                <div className="mb-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      Q{plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">
                      /{durationType.find(d => d.value === plan.duration)?.label.toLowerCase() || plan.duration}
                    </span>
                  </div>
                  
                  {/* Precio original y descuento */}
                  {plan.originalPrice && plan.originalPrice > plan.price && (
                    <div className="flex items-center justify-center space-x-2 mt-2">
                      <span className="text-gray-500 line-through">
                        Q{plan.originalPrice}
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                        -{calculateDiscount(plan.price, plan.originalPrice)}%
                      </span>
                    </div>
                  )}
                </div>
                
              </div>
              
              {/* Características */}
              {plan.features && plan.features.length > 0 && (
                <div className="space-y-3 mb-6">
                  {plan.features.slice(0, 4).map((feature, idx) => (
                    <div key={idx} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                  {plan.features.length > 4 && (
                    <div className="text-center">
                      <span className="text-sm text-gray-500">
                        +{plan.features.length - 4} más...
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Acciones */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                
                {/* Popular toggle */}
                <button
                  onClick={() => handleTogglePopular(plan.id)}
                  className={`p-2 rounded-lg ${
                    plan.popular 
                      ? 'text-yellow-600 hover:bg-yellow-50' 
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                  title={plan.popular ? 'Quitar de popular' : 'Marcar como popular'}
                >
                  <Star className={`w-4 h-4 ${plan.popular ? 'fill-current' : ''}`} />
                </button>
                
                {/* Acciones principales */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
              </div>
              
            </div>
            
          </div>
        ))}
        
        {/* Mensaje cuando no hay planes */}
        {localPlans.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white border-2 border-dashed border-gray-300 rounded-xl">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay planes configurados
            </h3>
            <p className="text-gray-600 mb-4">
              Los planes aparecen en la sección "Planes de Membresía" de tu página web
            </p>
            <button
              onClick={handleCreatePlan}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Plan
            </button>
          </div>
        )}
      </div>
      
      {/* 🆕 MODAL DE EDICIÓN MEJORADO */}
      {showEditModal && editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            
            {/* Header del modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {isCreating ? 'Crear Nuevo Plan' : `Editar: ${editingPlan.name || 'Plan'}`}
                </h3>
                <p className="text-gray-600 mt-1">
                  {isCreating ? 'Configura los detalles del nuevo plan' : 'Modifica la información del plan'}
                </p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleSavePlan}
                  className="btn-primary"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isCreating ? 'Crear Plan' : 'Guardar Cambios'}
                </button>
                
                <button
                  onClick={handleCancelEdit}
                  className="btn-secondary"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <PlanForm
                plan={editingPlan}
                availableIcons={availableIcons}
                durationType={durationType}
                onChange={setEditingPlan}
                calculateDiscount={calculateDiscount}
              />
            </div>
            
          </div>
        </div>
      )}
      
    </div>
  );
};

// 📝 COMPONENTE: Formulario de plan MEJORADO
const PlanForm = ({ 
  plan, 
  availableIcons, 
  durationType,
  onChange, 
  calculateDiscount
}) => {
  const [newFeature, setNewFeature] = useState('');
  
  const handleAddFeature = () => {
    if (newFeature.trim() && !plan.features.includes(newFeature.trim())) {
      onChange({
        ...plan,
        features: [...(plan.features || []), newFeature.trim()]
      });
      setNewFeature('');
    }
  };
  
  const handleRemoveFeature = (featureToRemove) => {
    onChange({
      ...plan,
      features: plan.features.filter(f => f !== featureToRemove)
    });
  };

  return (
    <div className="space-y-8">
      
      {/* 📊 VISTA PREVIA DEL PLAN */}
      <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-6 border border-primary-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Eye className="w-5 h-5 mr-2 text-primary-600" />
          Vista Previa
        </h4>
        
        <div className="bg-white rounded-lg p-6 shadow-sm max-w-sm mx-auto">
          
          {/* Icono y nombre */}
          <div className="text-center mb-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-primary-100 rounded-full flex items-center justify-center">
              {React.createElement(
                availableIcons.find(icon => icon.id === plan.iconName)?.component || Crown,
                { className: "w-6 h-6 text-primary-600" }
              )}
            </div>
            <h5 className="text-lg font-bold text-gray-900">
              {plan.name || 'Nombre del Plan'}
            </h5>
          </div>
          
          {/* Precio */}
          <div className="text-center mb-4">
            <div className="flex items-baseline justify-center">
              <span className="text-2xl font-bold text-gray-900">
                Q{plan.price || 0}
              </span>
              <span className="text-gray-600 ml-1 text-sm">
                /{durationType.find(d => d.value === plan.duration)?.label.toLowerCase()}
              </span>
            </div>
            
            {plan.originalPrice && plan.originalPrice > plan.price && (
              <div className="flex items-center justify-center space-x-2 mt-1">
                <span className="text-gray-500 line-through text-sm">
                  Q{plan.originalPrice}
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  -{calculateDiscount(plan.price, plan.originalPrice)}%
                </span>
              </div>
            )}
          </div>
          
          {/* Características */}
          {plan.features && plan.features.length > 0 && (
            <div className="space-y-2">
              {plan.features.slice(0, 3).map((feature, idx) => (
                <div key={idx} className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
              {plan.features.length > 3 && (
                <div className="text-center">
                  <span className="text-xs text-gray-500">
                    +{plan.features.length - 3} más beneficios
                  </span>
                </div>
              )}
            </div>
          )}
          
        </div>
      </div>
      
      {/* 📋 FORMULARIO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Columna izquierda: Información básica */}
        <div className="space-y-6">
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h4>
            
            {/* Nombre */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Plan *
              </label>
              <input
                type="text"
                value={plan.name}
                onChange={(e) => onChange({ ...plan, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ej: Plan Premium"
              />
            </div>
            
            {/* Precios */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Actual (Q) *
                </label>
                <input
                  type="number"
                  value={plan.price}
                  onChange={(e) => onChange({ ...plan, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Original (Q)
                </label>
                <input
                  type="number"
                  value={plan.originalPrice || ''}
                  onChange={(e) => onChange({ ...plan, originalPrice: parseFloat(e.target.value) || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Para descuentos"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            
            {plan.originalPrice && plan.originalPrice > plan.price && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  💰 Descuento calculado: {calculateDiscount(plan.price, plan.originalPrice)}%
                </p>
              </div>
            )}
            
            {/* Duración */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración
              </label>
              <select
                value={plan.duration}
                onChange={(e) => onChange({ ...plan, duration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {durationType.map((duration) => (
                  <option key={duration.value} value={duration.value}>
                    {duration.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Plan popular */}
            <div className="mb-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={plan.popular}
                  onChange={(e) => onChange({ ...plan, popular: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Marcar como plan popular
                </span>
                <Star className="w-4 h-4 ml-1 text-yellow-500" />
              </label>
              <p className="text-xs text-gray-500 mt-1">
                El plan popular se destaca visualmente en la página web
              </p>
            </div>
            
          </div>
          
          {/* Icono */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Icono del Plan</h4>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {availableIcons.map((icon) => (
                <button
                  key={icon.id}
                  onClick={() => onChange({ ...plan, iconName: icon.id })}
                  className={`p-3 border rounded-lg flex flex-col items-center space-y-2 hover:bg-gray-50 transition-colors ${
                    plan.iconName === icon.id 
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' 
                      : 'border-gray-300'
                  }`}
                >
                  <icon.component className={`w-5 h-5 ${
                    plan.iconName === icon.id ? 'text-primary-600' : 'text-gray-600'
                  }`} />
                  <span className="text-xs font-medium text-center">{icon.name}</span>
                </button>
              ))}
            </div>
            
            <p className="text-xs text-gray-500 mt-3">
              El icono aparece en la tarjeta del plan en tu página web
            </p>
          </div>
          
        </div>
        
        {/* Columna derecha: Características */}
        <div className="space-y-6">
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Características del Plan</h4>
            
            {/* Características actuales */}
            {plan.features && plan.features.length > 0 && (
              <div className="space-y-2 mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Características incluidas:</p>
                {plan.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg"
                  >
                    <span className="text-sm text-primary-800 flex items-center">
                      <Check className="w-4 h-4 mr-2" />
                      {feature}
                    </span>
                    <button
                      onClick={() => handleRemoveFeature(feature)}
                      className="text-primary-600 hover:text-primary-800 p-1"
                      title="Eliminar característica"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Agregar nueva característica */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agregar nueva característica
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: Acceso 24/7, Clases grupales, Entrenador personal..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                />
                <button
                  onClick={handleAddFeature}
                  disabled={!newFeature.trim()}
                  className="btn-primary px-4"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Escribe características únicas de tu gimnasio como: "Acceso 24/7", "Clases de yoga", "Zona de crossfit", etc.
              </p>
            </div>
            
          </div>
          
        </div>
        
      </div>
      
    </div>
  );
};

export default PlansManager;