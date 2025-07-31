// src/pages/dashboard/components/PlansManager.js
// FUNCIÓN: Gestión completa de planes de membresía
// INCLUYE: Crear, editar, eliminar, configurar precios y características

import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Save, X, CreditCard, Crown, Calendar,
  Shield, Star, Check, AlertTriangle, DollarSign, Percent,
  Tag, Award, Users, Clock, Zap, Target, Eye, EyeOff,
  TrendingUp, Gift, Package, Heart
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

const PlansManager = ({ plans, isLoading, onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, formatCurrency, isMobile } = useApp();
  
  // 📱 Estados locales
  const [localPlans, setLocalPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // 🎯 Iconos disponibles para planes
  const availableIcons = [
    { id: 'crown', component: Crown, name: 'Premium' },
    { id: 'calendar', component: Calendar, name: 'Calendario' },
    { id: 'shield', component: Shield, name: 'Básico' },
    { id: 'star', component: Star, name: 'Popular' },
    { id: 'award', component: Award, name: 'Elite' },
    { id: 'users', component: Users, name: 'Familiar' },
    { id: 'zap', component: Zap, name: 'Intensivo' },
    { id: 'target', component: Target, name: 'Objetivo' }
  ];
  
  // 📅 Tipos de duración
  const durationType = [
    { value: 'daily', label: 'Diario', description: 'Pago por día' },
    { value: 'weekly', label: 'Semanal', description: 'Pago por semana' },
    { value: 'monthly', label: 'Mensual', description: 'Pago mensual' },
    { value: 'quarterly', label: 'Trimestral', description: 'Pago cada 3 meses' },
    { value: 'yearly', label: 'Anual', description: 'Pago anual' }
  ];
  
  // 📊 Plantilla para nuevo plan
  const emptyPlan = {
    id: null,
    name: '',
    description: '',
    price: 0,
    originalPrice: null,
    duration: 'monthly',
    iconName: 'crown',
    color: '#3b82f6',
    features: [],
    popular: false,
    active: true,
    displayOrder: 0,
    maxMembers: null,
    trialDays: 0,
    setupFee: 0
  };
  
  // 🔄 Inicializar planes locales
  useEffect(() => {
    if (plans && Array.isArray(plans)) {
      setLocalPlans(plans.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
    }
  }, [plans]);
  
  // 🔔 Notificar cambios sin guardar
  useEffect(() => {
    onUnsavedChanges(hasChanges);
  }, [hasChanges, onUnsavedChanges]);
  
  // 💾 Guardar todos los cambios
  const handleSaveAll = async () => {
    try {
      // Validar que hay al menos un plan activo
      const activePlans = localPlans.filter(plan => plan.active);
      if (activePlans.length === 0) {
        showError('Debe haber al menos un plan activo');
        return;
      }
      
      // Validar que solo hay un plan popular
      const popularPlans = localPlans.filter(plan => plan.popular);
      if (popularPlans.length > 1) {
        showError('Solo puede haber un plan marcado como popular');
        return;
      }
      
      // Actualizar orden de planes
      const plansWithOrder = localPlans.map((plan, index) => ({
        ...plan,
        displayOrder: index + 1
      }));
      
      console.log('Guardando planes:', plansWithOrder);
      
      // Simular guardado exitoso
      showSuccess('Planes de membresía guardados exitosamente');
      setHasChanges(false);
      onSave(plansWithOrder);
      
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
      id: `temp_${Date.now()}`,
      displayOrder: localPlans.length + 1
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
        id: `new_${Date.now()}`,
        displayOrder: localPlans.length + 1
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
    const planToDelete = localPlans.find(p => p.id === planId);
    
    if (planToDelete && planToDelete.popular) {
      showError('No puedes eliminar el plan popular. Primero marca otro plan como popular.');
      return;
    }
    
    if (window.confirm('¿Estás seguro de eliminar este plan de membresía?')) {
      setLocalPlans(localPlans.filter(plan => plan.id !== planId));
      setHasChanges(true);
      showSuccess('Plan eliminado');
    }
  };
  
  // 👁️ Toggle activar/desactivar
  const handleToggleActive = (planId) => {
    const activePlans = localPlans.filter(plan => plan.active && plan.id !== planId);
    
    if (activePlans.length === 0) {
      showError('Debe haber al menos un plan activo');
      return;
    }
    
    setLocalPlans(localPlans.map(plan => 
      plan.id === planId 
        ? { ...plan, active: !plan.active }
        : plan
    ));
    setHasChanges(true);
  };
  
  // ⭐ Toggle plan popular
  const handleTogglePopular = (planId) => {
    setLocalPlans(localPlans.map(plan => ({
      ...plan,
      popular: plan.id === planId ? !plan.popular : false
    })));
    setHasChanges(true);
  };
  
  // 🔄 Reordenar planes
  const handleReorderPlan = (planId, direction) => {
    const currentIndex = localPlans.findIndex(p => p.id === planId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= localPlans.length) return;
    
    const newPlans = [...localPlans];
    [newPlans[currentIndex], newPlans[newIndex]] = [newPlans[newIndex], newPlans[currentIndex]];
    
    setLocalPlans(newPlans);
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
            Gestión de Planes de Membresía
          </h3>
          <p className="text-gray-600 mt-1">
            Configura los planes que ofrece tu gimnasio
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
            } ${
              !plan.active ? 'opacity-50' : ''
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
                      { 
                        className: "w-8 h-8 text-primary-600",
                        style: { color: plan.color }
                      }
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
                  
                  {/* Descripción */}
                  {plan.description && (
                    <p className="text-gray-600 text-sm mb-4">
                      {plan.description}
                    </p>
                  )}
                  
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
                
                {/* Información adicional */}
                <div className="space-y-2 text-xs text-gray-500 mb-6">
                  {plan.trialDays > 0 && (
                    <div className="flex items-center">
                      <Gift className="w-4 h-4 mr-2" />
                      {plan.trialDays} días de prueba gratis
                    </div>
                  )}
                  
                  {plan.setupFee > 0 && (
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 mr-2" />
                      Costo de inscripción: Q{plan.setupFee}
                    </div>
                  )}
                  
                  {plan.maxMembers && (
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Máximo {plan.maxMembers} miembros
                    </div>
                  )}
                </div>
                
                {/* Acciones */}
                <div className="flex items-center justify-between">
                  
                  {/* Controles de estado */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(plan.id)}
                      className={`p-2 rounded-lg ${
                        plan.active 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={plan.active ? 'Desactivar' : 'Activar'}
                    >
                      {plan.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    
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
                  </div>
                  
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
              Crea los planes de membresía que ofrece tu gimnasio
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

// 📝 COMPONENTE: Formulario de plan
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
          
          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={plan.description}
              onChange={(e) => onChange({ ...plan, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Descripción breve del plan..."
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
                placeholder="Precio antes del descuento"
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
              Tipo de Duración
            </label>
            <select
              value={plan.duration}
              onChange={(e) => onChange({ ...plan, duration: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {durationType.map((duration) => (
                <option key={duration.value} value={duration.value}>
                  {duration.label} - {duration.description}
                </option>
              ))}
            </select>
          </div>
          
          {/* Costos adicionales */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Días de prueba gratis
              </label>
              <input
                type="number"
                value={plan.trialDays}
                onChange={(e) => onChange({ ...plan, trialDays: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costo de inscripción (Q)
              </label>
              <input
                type="number"
                value={plan.setupFee}
                onChange={(e) => onChange({ ...plan, setupFee: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          {/* Icono y color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icono
              </label>
              <div className="grid grid-cols-4 gap-2">
                {availableIcons.map((icon) => (
                  <button
                    key={icon.id}
                    onClick={() => onChange({ ...plan, iconName: icon.id })}
                    className={`p-2 border rounded-lg flex flex-col items-center space-y-1 hover:bg-gray-50 ${
                      plan.iconName === icon.id 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-300'
                    }`}
                  >
                    <icon.component className={`w-4 h-4 ${
                      plan.iconName === icon.id ? 'text-primary-600' : 'text-gray-600'
                    }`} />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color del plan
              </label>
              <input
                type="color"
                value={plan.color}
                onChange={(e) => onChange({ ...plan, color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-lg"
              />
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
          </div>
          
        </div>
        
      </div>
      
    </div>
  );
};

export default PlansManager;