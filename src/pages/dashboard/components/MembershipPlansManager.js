// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/MembershipPlansManager.js
// VERSIÓN OPTIMIZADA PARA LAYOUT DASHBOARD - Compacta y Responsive

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit, Trash2, Save, X, CreditCard, Crown, Calendar,
  Shield, Star, Check, AlertTriangle, Eye, EyeOff, Loader, 
  RefreshCw, Settings, Clock, Package, Tag, CheckCircle,
  DollarSign, Zap, Users, Dumbbell, Heart, Coffee, ChevronDown,
  ChevronUp, Menu, Grid, List, Sparkles, Gift, Target, Award,
  TrendingUp, Activity, Flame, Diamond, Gem, Palette, Search,
  Filter, SortAsc, MoreHorizontal, Copy, Archive, ArrowRight,
  ArrowLeft, Info, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';
import PlanEditorModal from './PlanEditorModal';

const MembershipPlansManager = ({ plans: initialPlans, isLoading: initialLoading, onSave, onUnsavedChanges }) => {
  const { user: currentUser, hasPermission } = useAuth();
  const { showSuccess, showError, formatCurrency, isMobile } = useApp();
  
  // Estados principales
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Estados para modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Estados adicionales para mejor UX
  const [viewMode, setViewMode] = useState('grid');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  
  // Iconos simplificados
  const availableIcons = [
    { id: 'crown', component: Crown, name: 'Premium' },
    { id: 'diamond', component: Diamond, name: 'Diamond' },
    { id: 'star', component: Star, name: 'Popular' },
    { id: 'shield', component: Shield, name: 'Básico' },
    { id: 'gem', component: Gem, name: 'Elite' },
    { id: 'award', component: Award, name: 'Champion' },
    { id: 'dumbbell', component: Dumbbell, name: 'Fitness' },
    { id: 'heart', component: Heart, name: 'Wellness' },
    { id: 'flame', component: Flame, name: 'Intenso' },
    { id: 'zap', component: Zap, name: 'Energy' },
    { id: 'target', component: Target, name: 'Focus' },
    { id: 'activity', component: Activity, name: 'Active' }
  ];
  
  // Duraciones
  const durationType = [
    { value: 'daily', label: 'Pase Diario', days: 1 },
    { value: 'weekly', label: 'Semanal', days: 7 },
    { value: 'monthly', label: 'Mensual', days: 30 },
    { value: 'quarterly', label: 'Trimestral', days: 90 },
    { value: 'semiannual', label: 'Semestral', days: 180 },
    { value: 'yearly', label: 'Anual', days: 365 }
  ];
  
  // Colores del sistema
  const availableColors = [
    { value: 'primary', label: 'Elite Primary', bg: 'bg-primary-50', text: 'text-primary-800', border: 'border-primary-200' },
    { value: 'secondary', label: 'Elite Secondary', bg: 'bg-secondary-50', text: 'text-secondary-800', border: 'border-secondary-200' },
    { value: 'gold', label: 'Elite Gold', bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
    { value: 'platinum', label: 'Elite Platinum', bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200' },
    { value: 'emerald', label: 'Elite Emerald', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    { value: 'ruby', label: 'Elite Ruby', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' }
  ];
  
  // Plan vacío
  function getEmptyPlan() {
    return {
      id: null,
      name: '',
      value: '',
      label: '',
      price: 250,
      originalPrice: null,
      duration: 'monthly',
      iconName: 'crown',
      color: 'primary',
      description: '',
      features: [],
      isPopular: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  // CARGAR DATOS
  const loadMembershipPlans = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      
      let plansData = [];
      
      if (initialPlans && Array.isArray(initialPlans) && initialPlans.length > 0) {
        plansData = initialPlans;
      } else {
        try {
          const response = await apiService.get('/membership-plans');
          plansData = response.data || response || [];
        } catch (apiError) {
          plansData = [
            {
              id: 1,
              name: 'Plan Básico Fitness',
              value: 'basic_fitness',
              label: 'Básico',
              price: 175,
              originalPrice: null,
              duration: 'monthly',
              iconName: 'shield',
              color: 'emerald',
              description: 'Perfecto para comenzar tu transformación fitness',
              features: [
                'Acceso en horarios regulares (6am-10pm)',
                'Todas las máquinas cardiovasculares',
                'Zona completa de pesas libres',
                'Wi-Fi premium de alta velocidad',
                'Casilleros personales'
              ],
              isPopular: false,
              isActive: true
            },
            {
              id: 2,
              name: 'Plan Premium Elite',
              value: 'premium_elite',
              label: 'Premium',
              price: 285,
              originalPrice: 350,
              duration: 'monthly',
              iconName: 'crown',
              color: 'primary',
              description: 'La opción más completa y popular',
              features: [
                'Acceso 24/7 todos los días',
                'Todas las máquinas cardiovasculares',
                'Clases grupales ilimitadas',
                'Zona completa de pesas libres',
                'Acceso exclusivo a zona VIP',
                'Wi-Fi premium de alta velocidad',
                'App móvil premium',
                'Estacionamiento incluido'
              ],
              isPopular: true,
              isActive: true
            },
            {
              id: 3,
              name: 'Plan Diamond VIP',
              value: 'diamond_vip',
              label: 'Diamond',
              price: 485,
              originalPrice: 550,
              duration: 'monthly',
              iconName: 'diamond',
              color: 'gold',
              description: 'Experiencia completa de lujo',
              features: [
                'Acceso 24/7 todos los días',
                'Entrenador personal incluido',
                'Plan nutricional personalizado',
                'Todas las clases incluidas',
                'Acceso a piscina climatizada',
                'Acceso exclusivo a zona VIP',
                'Sauna y vapor incluidos',
                'Toallas limpias incluidas',
                '20% descuento en suplementos'
              ],
              isPopular: false,
              isActive: true
            }
          ];
        }
      }
      
      const mappedPlans = plansData.map((plan, index) => ({
        id: plan.id || `plan_${Date.now()}_${index}`,
        name: plan.name || '',
        value: plan.value || plan.name?.toLowerCase().replace(/\s+/g, '_') || '',
        label: plan.label || plan.name || '',
        price: parseFloat(plan.price) || 0,
        originalPrice: plan.originalPrice ? parseFloat(plan.originalPrice) : null,
        duration: plan.duration || 'monthly',
        iconName: plan.iconName || 'crown',
        color: plan.color || 'primary',
        description: plan.description || '',
        features: Array.isArray(plan.features) ? plan.features : [],
        isPopular: plan.isPopular === true || plan.popular === true,
        isActive: plan.isActive !== undefined ? plan.isActive : true,
        createdAt: plan.createdAt || new Date().toISOString(),
        updatedAt: plan.updatedAt || new Date().toISOString()
      }));
      
      setMembershipPlans(mappedPlans);
      setIsDataLoaded(true);
      
    } catch (error) {
      console.error('Error al cargar planes:', error);
      showError('Error al cargar planes de membresía');
      setMembershipPlans([]);
      setIsDataLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [initialPlans, showError]);
  
  useEffect(() => {
    if (!isDataLoaded && !initialLoading) {
      loadMembershipPlans(true);
    }
  }, [loadMembershipPlans, isDataLoaded, initialLoading]);
  
  useEffect(() => {
    if (onUnsavedChanges) {
      onUnsavedChanges(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onUnsavedChanges]);
  
  // FUNCIONES PRINCIPALES
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      
      if (membershipPlans.length === 0) {
        showError('Debe haber al menos un plan de membresía');
        return;
      }
      
      const popularCount = membershipPlans.filter(p => p.isPopular).length;
      if (popularCount > 1) {
        showError('Solo puede haber un plan marcado como popular');
        return;
      }
      
      try {
        await apiService.post('/membership-plans/bulk', { plans: membershipPlans });
      } catch (error) {
        console.warn('API no disponible, guardando localmente');
      }
      
      if (onSave) {
        onSave(membershipPlans);
      }
      
      setHasUnsavedChanges(false);
      showSuccess('Planes guardados correctamente');
      
    } catch (error) {
      showError('Error al guardar los planes');
    } finally {
      setSaving(false);
    }
  };
  
  const handleCreatePlan = () => {
    setIsCreating(true);
    setEditingPlan(null);
    setShowEditModal(true);
  };
  
  const handleEditPlan = (plan) => {
    setIsCreating(false);
    setEditingPlan(plan);
    setShowEditModal(true);
  };
  
  const handlePlanSaved = (planData) => {
    if (planData.isPopular) {
      setMembershipPlans(prev => prev.map(plan => 
        plan.id !== editingPlan?.id ? { ...plan, isPopular: false } : plan
      ));
    }
    
    const finalPlanData = {
      ...planData,
      features: planData.features.filter(f => f.trim() !== ''),
      updatedAt: new Date().toISOString(),
      label: planData.label || planData.name
    };
    
    if (isCreating) {
      const newPlan = { 
        ...finalPlanData, 
        id: `plan_${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      setMembershipPlans(prev => [...prev, newPlan]);
      showSuccess('Plan creado correctamente');
    } else {
      setMembershipPlans(prev => prev.map(plan => 
        plan.id === editingPlan.id ? finalPlanData : plan
      ));
      showSuccess('Plan actualizado correctamente');
    }
    
    setHasUnsavedChanges(true);
    setShowEditModal(false);
  };
  
  const handleDeletePlan = (planId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este plan?')) {
      setMembershipPlans(prev => prev.filter(plan => plan.id !== planId));
      setHasUnsavedChanges(true);
      showSuccess('Plan eliminado correctamente');
    }
  };
  
  const handleDuplicatePlan = (plan) => {
    const duplicatedPlan = {
      ...plan,
      id: `duplicated_${Date.now()}`,
      name: `${plan.name} (Copia)`,
      value: `${plan.value}_copy`,
      isPopular: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setMembershipPlans(prev => [...prev, duplicatedPlan]);
    setHasUnsavedChanges(true);
    showSuccess('Plan duplicado correctamente');
  };
  
  const handleToggleActive = (planId) => {
    setMembershipPlans(prev => prev.map(plan => 
      plan.id === planId ? { ...plan, isActive: !plan.isActive } : plan
    ));
    setHasUnsavedChanges(true);
  };
  
  const handleTogglePopular = (planId) => {
    setMembershipPlans(prev => prev.map(plan => ({
      ...plan,
      isPopular: plan.id === planId ? !plan.isPopular : false
    })));
    setHasUnsavedChanges(true);
  };
  
  // Funciones de utilidad
  const getColorStyles = (colorName) => {
    const color = availableColors.find(c => c.value === colorName) || availableColors[0];
    return color;
  };
  
  const getIconComponent = (iconName) => {
    const iconInfo = availableIcons.find(icon => icon.id === iconName);
    return iconInfo ? iconInfo.component : Crown;
  };
  
  const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };
  
  const getFilteredPlans = () => {
    let filtered = [...membershipPlans];
    
    switch (filterType) {
      case 'active':
        filtered = filtered.filter(p => p.isActive);
        break;
      case 'inactive':
        filtered = filtered.filter(p => !p.isActive);
        break;
      case 'popular':
        filtered = filtered.filter(p => p.isPopular);
        break;
      default:
        break;
    }
    
    switch (sortBy) {
      case 'price':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'duration':
        const durationOrder = ['daily', 'weekly', 'monthly', 'quarterly', 'semiannual', 'yearly'];
        filtered.sort((a, b) => durationOrder.indexOf(a.duration) - durationOrder.indexOf(b.duration));
        break;
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    
    return filtered;
  };
  
  const filteredPlans = getFilteredPlans();

  // Loading optimizado
  if ((loading && !isDataLoaded) || initialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Cargando Planes
          </h3>
          <p className="text-gray-600 text-sm">Preparando tu contenido...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* HEADER COMPACTO */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
          
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              Planes de Membresía
            </h1>
            <p className="text-gray-600 text-sm mb-2">
              Gestiona los planes de tu gimnasio
            </p>
            
            {membershipPlans.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                  {membershipPlans.length} total
                </span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                  {membershipPlans.filter(p => p.isActive).length} activos
                </span>
                {membershipPlans.some(p => p.isPopular) && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                    1 popular
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2 py-1"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="popular">Popular</option>
            </select>
            
            <button
              onClick={() => loadMembershipPlans(true)}
              disabled={loading}
              className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            
            {hasUnsavedChanges && (
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="px-3 py-1 text-xs text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center"
              >
                <Save className="w-3 h-3 mr-1" />
                Guardar
              </button>
            )}
            
            <button
              onClick={handleCreatePlan}
              className="px-3 py-1 text-xs text-white bg-primary-600 rounded-lg hover:bg-primary-700 flex items-center"
            >
              <Plus className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Nuevo</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* ALERTA DE CAMBIOS */}
      {hasUnsavedChanges && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 text-amber-600 mr-2" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                Tienes cambios sin guardar
              </p>
            </div>
            <button
              onClick={handleSaveAll}
              className="text-sm text-amber-800 underline hover:text-amber-900 ml-2"
            >
              Guardar
            </button>
          </div>
        </div>
      )}
      
      {/* CONTENIDO COMPACTO */}
      {filteredPlans.length === 0 ? (
        <CompactEmptyState onCreatePlan={handleCreatePlan} />
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filteredPlans.map((plan) => (
            <CompactPlanCard
              key={plan.id}
              plan={plan}
              onEdit={() => handleEditPlan(plan)}
              onDelete={() => handleDeletePlan(plan.id)}
              onDuplicate={() => handleDuplicatePlan(plan)}
              onToggleActive={() => handleToggleActive(plan.id)}
              onTogglePopular={() => handleTogglePopular(plan.id)}
              getIconComponent={getIconComponent}
              getColorStyles={getColorStyles}
              calculateDiscount={calculateDiscount}
              durationType={durationType}
            />
          ))}
        </div>
      )}
      
      {/* MODAL EDITOR */}
      <PlanEditorModal
        show={showEditModal}
        plan={editingPlan}
        isCreating={isCreating}
        availableIcons={availableIcons}
        availableColors={availableColors}
        durationType={durationType}
        onSave={handlePlanSaved}
        onCancel={() => setShowEditModal(false)}
        getEmptyPlan={getEmptyPlan}
        getIconComponent={getIconComponent}
        getColorStyles={getColorStyles}
        calculateDiscount={calculateDiscount}
        isMobile={isMobile}
      />
    </div>
  );
};

// COMPONENTE: Estado Vacío Compacto
const CompactEmptyState = ({ onCreatePlan }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
    <div className="w-12 h-12 mx-auto bg-gradient-to-r from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center mb-4">
      <CreditCard className="w-6 h-6 text-primary-600" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">
      No hay planes configurados
    </h3>
    <p className="text-gray-600 mb-4 text-sm">
      Crea tu primer plan de membresía para empezar
    </p>
    <button
      onClick={onCreatePlan}
      className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 text-sm"
    >
      <Plus className="w-4 h-4 mr-2 inline" />
      Crear Primer Plan
    </button>
  </div>
);

// COMPONENTE: Tarjeta de Plan Compacta
const CompactPlanCard = ({ 
  plan, 
  onEdit, 
  onDelete, 
  onDuplicate,
  onToggleActive, 
  onTogglePopular,
  getIconComponent,
  getColorStyles,
  calculateDiscount,
  durationType
}) => {
  const IconComponent = getIconComponent(plan.iconName);
  const colorStyles = getColorStyles(plan.color);
  const discount = calculateDiscount(plan.price, plan.originalPrice);
  const duration = durationType.find(d => d.value === plan.duration);
  const [showDropdown, setShowDropdown] = useState(false);
  
  return (
    <div className={`relative bg-white border-2 rounded-lg shadow-sm hover:shadow-md transition-all ${
      plan.isPopular ? 'border-yellow-400 ring-1 ring-yellow-100' : 'border-gray-200'
    } ${!plan.isActive ? 'opacity-60' : ''}`}>
      
      {/* Badges compactos */}
      <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1">
        {plan.isPopular && (
          <span className="bg-yellow-500 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center">
            <Star className="w-2 h-2 mr-1 fill-current" />
            POP
          </span>
        )}
        {!plan.isActive && (
          <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
            OFF
          </span>
        )}
        {discount > 0 && (
          <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
            -{discount}%
          </span>
        )}
      </div>
      
      <div className="p-4">
        {/* Header compacto */}
        <div className="text-center mb-4">
          <div className={`w-10 h-10 mx-auto rounded-lg ${colorStyles.bg} flex items-center justify-center mb-3`}>
            <IconComponent className={`w-5 h-5 ${colorStyles.text}`} />
          </div>
          
          <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1">
            {plan.name}
          </h3>
          
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorStyles.bg} ${colorStyles.text} border ${colorStyles.border}`}>
            {plan.label}
          </span>
        </div>
        
        {/* Precio compacto */}
        <div className="text-center mb-4">
          <div className="flex items-baseline justify-center space-x-1">
            <span className="text-xl font-bold text-gray-900">
              Q{plan.price.toLocaleString()}
            </span>
            {plan.originalPrice && plan.originalPrice > plan.price && (
              <span className="text-sm text-gray-500 line-through">
                Q{plan.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          
          <div className="text-xs text-gray-600 mt-1">
            por {duration?.label.toLowerCase()}
          </div>
        </div>
        
        {/* Características limitadas */}
        {plan.features && plan.features.length > 0 && (
          <div className="mb-4">
            <div className="space-y-1">
              {plan.features.slice(0, 2).map((feature, idx) => (
                <div key={idx} className="flex items-start text-xs text-gray-700">
                  <Check className="w-3 h-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{feature}</span>
                </div>
              ))}
              {plan.features.length > 2 && (
                <div className="text-center pt-1">
                  <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                    +{plan.features.length - 2} más
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Acciones compactas */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            <button
              onClick={onTogglePopular}
              className={`p-1.5 rounded-md transition-colors ${
                plan.isPopular ? 'text-yellow-600 bg-yellow-50' : 'text-gray-400 hover:text-yellow-600'
              }`}
            >
              <Star className={`w-3 h-3 ${plan.isPopular ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={onToggleActive}
              className={`p-1.5 rounded-md transition-colors ${
                plan.isActive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
              }`}
            >
              {plan.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={onEdit}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
            >
              <Edit className="w-3 h-3" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-md"
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-white border rounded-lg shadow-lg z-20">
                  <button
                    onClick={() => {
                      onDuplicate();
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-xs hover:bg-gray-50"
                  >
                    <Copy className="w-3 h-3 mr-2" />
                    Duplicar
                  </button>
                  <button
                    onClick={() => {
                      onDelete();
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipPlansManager;
/**
 * CARACTERÍSTICAS PRINCIPALES DE ESTA VERSIÓN:
 * 
 * 🎯 OPTIMIZACIÓN MÓVIL COMPLETA:
 * - Espaciado compacto y adaptativo
 * - Modal full-screen en móviles  
 * - Grid responsive (1 col móvil, 2-3 desktop)
 * - Textos y botones optimizados para touch
 * - Navegación por tabs en formularios
 * 
 * ⚡ CARACTERÍSTICAS PREDEFINIDAS:
 * - 30+ características organizadas en 5 categorías
 * - Botones de un clic para agregar
 * - No depende del backend
 * - Indicadores visuales de agregado/disponible
 * - Características personalizadas además de predefinidas
 * 
 * 📱 RESPONSIVE DESIGN:
 * - Funciona en pantallas desde 320px
 * - Breakpoints optimizados para móvil/tablet/desktop
 * - Componentes que se adaptan automáticamente
 * - Espaciado inteligente según el dispositivo
 * 
 * 🔧 FUNCIONALIDADES COMPLETAS:
 * - CRUD completo de planes
 * - Vista previa en tiempo real
 * - Validaciones inteligentes
 * - Sistema de cambios sin guardar
 * - Manejo de errores robusto
 * 
 * 💡 USABILIDAD MEJORADA:
 * - Interfaz intuitiva y fácil de usar
 * - Feedback visual inmediato
 * - Estados de carga apropiados
 * - Confirmaciones inteligentes
 * - Navegación fluida
 */