// src/pages/dashboard/components/PlansManager.js
// FUNCIÓN: Gestión SIMPLIFICADA de planes - SOLO datos que aparecen en LandingPage
// INCLUYE: name, price, originalPrice, duration, features, popular, iconName

import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Save, X, CreditCard, Crown, Calendar,
  Shield, Star, Check, AlertTriangle, Percent, Eye, EyeOff
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';

const PlansManager = ({ plans, isLoading, onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, formatCurrency, isMobile } = useApp();
  
  // 📱 Estados locales
  const [localPlans, setLocalPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // 🎯 Iconos disponibles para planes - LOS MISMOS QUE USA LA LANDING PAGE
  const availableIcons = [
    { id: 'crown', component: Crown, name: 'Premium' },
    { id: 'calendar', component: Calendar, name: 'Calendario' },
    { id: 'shield', component: Shield, name: 'Básico' },
    { id: 'star', component: Star, name: 'Popular' }
  ];
  
  // 📅 Tipos de duración - SIMPLIFICADOS
  const durationType = [
    { value: 'monthly', label: 'Mensual' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'yearly', label: 'Anual' }
  ];
  
  // 📊 Plantilla para nuevo plan - SOLO campos que aparecen en LandingPage
  const emptyPlan = {
    id: null,
    name: '',
    price: 0,
    originalPrice: null, // Para mostrar descuentos
    duration: 'monthly',
    iconName: 'crown',
    features: [],
    popular: false
  };
  
  // 🔄 Inicializar planes locales
  useEffect(() => {
    if (plans && Array.isArray(plans)) {
      setLocalPlans(plans);
    }
  }, [plans]);
  
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
  };
  
  // ✏️ Editar plan existente
  const handleEditPlan = (plan) => {
    setEditingPlan({ ...plan });
    setIsCreating(false);
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
    showSuccess(isCreating ? 'Plan creado' : 'Plan actualizado');
  };
  
  // ❌ Cancelar edición
  const handleCancelEdit = () => {
    setEditingPlan(null);
    setIsCreating(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Cargando planes de membresía...</span>
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
            disabled={isCreating || editingPlan}
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
            {(!editingPlan || editingPlan.id !== plan.id) && (
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
                    {plan.name}
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
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
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
            )}
            
            {/* Formulario de edición */}
            {editingPlan && editingPlan.id === plan.id && (
              <div className="p-6 bg-gray-50">
                <PlanForm
                  plan={editingPlan}
                  availableIcons={availableIcons}
                  durationType={durationType}
                  onSave={handleSavePlan}
                  onCancel={handleCancelEdit}
                  onChange={setEditingPlan}
                  isCreating={isCreating}
                  calculateDiscount={calculateDiscount}
                />
              </div>
            )}
            
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
      
    </div>
  );
};

// 📝 COMPONENTE: Formulario de plan simplificado
const PlanForm = ({ 
  plan, 
  availableIcons, 
  durationType,
  onSave, 
  onCancel, 
  onChange, 
  isCreating,
  calculateDiscount
}) => {
  const [newFeature, setNewFeature] = useState('');
  
  // 🏷️ Características comunes para planes
  const commonFeatures = [
    'Acceso ilimitado al gimnasio',
    'Uso de todos los equipos',
    'Casilleros incluidos',
    'Duchas y vestidores',
    'Clases grupales básicas',
    'Evaluación física inicial',
    'Asesoría nutricional básica',
    'Entrenamiento personalizado',
    'Clases grupales premium',
    'Seguimiento nutricional completo',
    'Acceso a zona VIP',
    'Toallas incluidas',
    'Estacionamiento gratuito',
    'Invitados permitidos'
  ];
  
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
  
  const handleToggleFeature = (feature) => {
    const currentFeatures = plan.features || [];
    const hasFeature = currentFeatures.includes(feature);
    
    const newFeatures = hasFeature
      ? currentFeatures.filter(f => f !== feature)
      : [...currentFeatures, feature];
    
    onChange({ ...plan, features: newFeatures });
  };

  return (
    <div className="space-y-6">
      
      {/* Título del formulario */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900">
          {isCreating ? 'Crear Nuevo Plan' : 'Editar Plan'}
        </h4>
        
        <div className="flex space-x-2">
          <button
            onClick={onSave}
            className="btn-primary btn-sm"
          >
            <Save className="w-4 h-4 mr-1" />
            Guardar
          </button>
          
          <button
            onClick={onCancel}
            className="btn-secondary btn-sm"
          >
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Columna izquierda: Información básica */}
        <div className="space-y-4">
          
          {/* Nombre */}
          <div>
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
          <div className="grid grid-cols-2 gap-4">
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
              {plan.originalPrice && plan.originalPrice > plan.price && (
                <p className="text-sm text-green-600 mt-1">
                  Descuento: {calculateDiscount(plan.price, plan.originalPrice)}%
                </p>
              )}
            </div>
          </div>
          
          {/* Duración */}
          <div>
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
          
          {/* Icono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icono
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableIcons.map((icon) => (
                <button
                  key={icon.id}
                  onClick={() => onChange({ ...plan, iconName: icon.id })}
                  className={`p-3 border rounded-lg flex items-center space-x-2 hover:bg-gray-50 ${
                    plan.iconName === icon.id 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-300'
                  }`}
                >
                  <icon.component className={`w-4 h-4 ${
                    plan.iconName === icon.id ? 'text-primary-600' : 'text-gray-600'
                  }`} />
                  <span className="text-sm">{icon.name}</span>
                </button>
              ))}
            </div>
          </div>
          
        </div>
        
        {/* Columna derecha: Características */}
        <div className="space-y-4">
          
          {/* Características del plan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Características del Plan
            </label>
            
            {/* Características actuales */}
            {plan.features && plan.features.length > 0 && (
              <div className="space-y-2 mb-4">
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
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Agregar nueva característica */}
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Nueva característica..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
              />
              <button
                onClick={handleAddFeature}
                className="btn-secondary btn-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {/* Características comunes */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Características comunes:</p>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {commonFeatures.map((feature) => (
                  <button
                    key={feature}
                    onClick={() => handleToggleFeature(feature)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-colors ${
                      plan.features?.includes(feature)
                        ? 'bg-primary-50 border-primary-200 text-primary-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      {plan.features?.includes(feature) ? (
                        <Check className="w-4 h-4 mr-2 text-primary-600" />
                      ) : (
                        <div className="w-4 h-4 mr-2 border border-gray-300 rounded"></div>
                      )}
                      {feature}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-3">
              Las características aparecen como lista de beneficios en cada plan
            </p>
          </div>
          
        </div>
        
      </div>
      
    </div>
  );
};

export default PlansManager;