// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/MembershipPlansManager.js
// VERSIÓN ACTUALIZADA CON SERVICIO INDEPENDIENTE - Mantiene diseño compacto y responsive
// ✅ CONECTADO AL BACKEND REAL CON membershipPlansService

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
import membershipPlansService from '../../../services/membershipPlansService'; // 🆕 NUEVO SERVICIO
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
  
  // 🆕 NUEVO: Estados para estadísticas del servicio
  const [stats, setStats] = useState(null);
  const [serviceHealth, setServiceHealth] = useState(null);
  
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
      durationType: 'monthly', // 🆕 NUEVO: Campo requerido por el backend
      iconName: 'crown',
      color: 'primary',
      description: '',
      features: [],
      isPopular: false,
      isActive: true,
      displayOrder: 0, // 🆕 NUEVO: Campo para orden
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  // 🆕 NUEVO: CARGAR DATOS USANDO EL SERVICIO INDEPENDIENTE
  const loadMembershipPlans = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      
      console.log('📋 MembershipPlansManager: Cargando planes con servicio independiente...');
      
      // ✅ USAR EL NUEVO SERVICIO EN LUGAR DE apiService
      const response = await membershipPlansService.getAllPlans();
      
      if (response.success && response.data?.plans) {
        const plans = response.data.plans;
        
        console.log(`✅ ${plans.length} planes cargados desde servicio:`, plans);
        
        // Los planes ya vienen procesados desde el servicio
        setMembershipPlans(plans);
        setIsDataLoaded(true);
        
        // 🆕 MOSTRAR SI LOS DATOS VIENEN DE CACHE
        if (response.fromCache) {
          console.log('⚡ Datos cargados desde cache');
        }
        
        // 🆕 CARGAR ESTADÍSTICAS SI ESTÁ DISPONIBLE
        try {
          const statsResponse = await membershipPlansService.getPlansStats();
          if (statsResponse.success) {
            setStats(statsResponse.data);
            console.log('📊 Estadísticas cargadas:', statsResponse.data);
          }
        } catch (statsError) {
          console.log('⚠️ Estadísticas no disponibles:', statsError.message);
        }
        
      } else {
        throw new Error('Respuesta inválida del servicio');
      }
      
    } catch (error) {
      console.error('❌ Error cargando planes:', error);
      
      // Mostrar error específico del servicio
      if (error.statusCode === 401) {
        showError('Sesión expirada. Por favor inicia sesión nuevamente.');
      } else if (error.statusCode === 403) {
        showError('No tienes permisos para ver los planes de membresía.');
      } else {
        showError(`Error cargando planes: ${error.message}`);
      }
      
      // Mantener datos existentes si los hay
      if (membershipPlans.length === 0) {
        setMembershipPlans([]);
      }
      setIsDataLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [showError, membershipPlans.length]);
  
  // 🆕 NUEVO: CARGAR HEALTH CHECK DEL SERVICIO
  const loadServiceHealth = useCallback(async () => {
    try {
      const health = await membershipPlansService.healthCheck();
      setServiceHealth(health);
      console.log('🏥 Service health:', health);
    } catch (error) {
      console.warn('⚠️ Service health check failed:', error.message);
      setServiceHealth({ healthy: false, error: error.message });
    }
  }, []);
  
  useEffect(() => {
    if (!isDataLoaded && !initialLoading) {
      loadMembershipPlans(true);
      loadServiceHealth();
    }
  }, [loadMembershipPlans, loadServiceHealth, isDataLoaded, initialLoading]);
  
  useEffect(() => {
    if (onUnsavedChanges) {
      onUnsavedChanges(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onUnsavedChanges]);
  
  // 🆕 NUEVO: GUARDAR USANDO OPERACIÓN BULK DEL SERVICIO
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
      
      console.log('💾 Guardando todos los planes con servicio bulk...');
      
      // ✅ USAR OPERACIÓN BULK DEL SERVICIO
      const response = await membershipPlansService.saveBulkPlans(membershipPlans);
      
      if (response.success) {
        // Actualizar con los datos guardados
        setMembershipPlans(response.data.plans);
        setHasUnsavedChanges(false);
        showSuccess(`${response.data.plans.length} planes guardados correctamente`);
        
        if (onSave) {
          onSave(response.data.plans);
        }
        
        // Recargar estadísticas
        try {
          const statsResponse = await membershipPlansService.getPlansStats();
          if (statsResponse.success) {
            setStats(statsResponse.data);
          }
        } catch (statsError) {
          console.warn('⚠️ Error recargando estadísticas:', statsError.message);
        }
      }
      
    } catch (error) {
      console.error('❌ Error guardando planes:', error);
      showError(`Error guardando planes: ${error.message}`);
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
  
  // 🆕 NUEVO: GUARDAR PLAN INDIVIDUAL USANDO EL SERVICIO
  const handlePlanSaved = async (planData) => {
    try {
      console.log(`${isCreating ? '➕ Creando' : '✏️ Actualizando'} plan con servicio...`);
      
      // Verificar que solo haya un plan popular
      if (planData.isPopular) {
        setMembershipPlans(prev => prev.map(plan => 
          plan.id !== editingPlan?.id ? { ...plan, isPopular: false } : plan
        ));
      }
      
      const finalPlanData = {
        ...planData,
        features: planData.features.filter(f => f.trim() !== ''),
        updatedAt: new Date().toISOString(),
        label: planData.label || planData.name,
        durationType: planData.durationType || planData.duration || 'monthly' // ✅ ASEGURAR CAMPO REQUERIDO
      };
      
      if (isCreating) {
        // ✅ CREAR CON EL SERVICIO
        const response = await membershipPlansService.createPlan(finalPlanData);
        
        if (response.success) {
          setMembershipPlans(prev => [...prev, response.data.plan]);
          showSuccess('Plan creado correctamente');
        }
      } else {
        // ✅ ACTUALIZAR CON EL SERVICIO
        const response = await membershipPlansService.updatePlan(editingPlan.id, finalPlanData);
        
        if (response.success) {
          setMembershipPlans(prev => prev.map(plan => 
            plan.id === editingPlan.id ? response.data.plan : plan
          ));
          showSuccess('Plan actualizado correctamente');
        }
      }
      
      // Marcar como guardado directamente (no hay cambios sin guardar)
      setHasUnsavedChanges(false);
      setShowEditModal(false);
      
      // Recargar estadísticas
      try {
        const statsResponse = await membershipPlansService.getPlansStats();
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }
      } catch (statsError) {
        console.warn('⚠️ Error recargando estadísticas:', statsError.message);
      }
      
    } catch (error) {
      console.error(`❌ Error ${isCreating ? 'creando' : 'actualizando'} plan:`, error);
      showError(`Error ${isCreating ? 'creando' : 'actualizando'} plan: ${error.message}`);
    }
  };
  
  // 🆕 NUEVO: ELIMINAR CON EL SERVICIO
  const handleDeletePlan = async (planId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este plan? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      console.log(`🗑️ Eliminando plan ${planId} con servicio...`);
      
      // Preguntar si forzar eliminación
      const forceDelete = window.confirm(
        '¿Forzar eliminación aunque tenga membresías asociadas?\n\n' +
        'Selecciona "Aceptar" para forzar eliminación o "Cancelar" para eliminación normal.'
      );
      
      // ✅ ELIMINAR CON EL SERVICIO
      const response = await membershipPlansService.deletePlan(planId, { 
        force: forceDelete 
      });
      
      if (response.success) {
        setMembershipPlans(prev => prev.filter(plan => plan.id !== planId));
        showSuccess('Plan eliminado correctamente');
        
        // Recargar estadísticas
        try {
          const statsResponse = await membershipPlansService.getPlansStats();
          if (statsResponse.success) {
            setStats(statsResponse.data);
          }
        } catch (statsError) {
          console.warn('⚠️ Error recargando estadísticas:', statsError.message);
        }
      }
      
    } catch (error) {
      console.error('❌ Error eliminando plan:', error);
      showError(`Error eliminando plan: ${error.message}`);
    }
  };
  
  // 🆕 NUEVO: DUPLICAR PLAN USANDO CREACIÓN
  const handleDuplicatePlan = async (plan) => {
    try {
      console.log(`📋 Duplicando plan "${plan.name}"...`);
      
      const duplicatedPlanData = {
        ...plan,
        id: null, // Sin ID para que se cree como nuevo
        name: `${plan.name} (Copia)`,
        value: `${plan.value}_copy`,
        label: `${plan.label || plan.name} (Copia)`,
        isPopular: false, // Las copias no pueden ser populares
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // ✅ CREAR LA COPIA CON EL SERVICIO
      const response = await membershipPlansService.createPlan(duplicatedPlanData);
      
      if (response.success) {
        setMembershipPlans(prev => [...prev, response.data.plan]);
        showSuccess('Plan duplicado correctamente');
      }
      
    } catch (error) {
      console.error('❌ Error duplicando plan:', error);
      showError(`Error duplicando plan: ${error.message}`);
    }
  };
  
  // 🆕 NUEVO: TOGGLE STATUS CON EL SERVICIO
  const handleToggleActive = async (planId) => {
    try {
      console.log(`🔄 Cambiando estado del plan ${planId}...`);
      
      // ✅ USAR TOGGLE DEL SERVICIO
      const response = await membershipPlansService.togglePlanStatus(planId);
      
      if (response.success) {
        setMembershipPlans(prev => prev.map(plan => 
          plan.id === planId ? response.data.plan : plan
        ));
        
        const newStatus = response.data.plan.isActive ? 'activado' : 'desactivado';
        showSuccess(`Plan ${newStatus} correctamente`);
      }
      
    } catch (error) {
      console.error('❌ Error cambiando estado del plan:', error);
      showError(`Error cambiando estado: ${error.message}`);
    }
  };
  
  const handleTogglePopular = (planId) => {
    setMembershipPlans(prev => prev.map(plan => ({
      ...plan,
      isPopular: plan.id === planId ? !plan.isPopular : false
    })));
    setHasUnsavedChanges(true);
  };
  
  // Funciones de utilidad (sin cambios)
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
        filtered.sort((a, b) => durationOrder.indexOf(a.durationType) - durationOrder.indexOf(b.durationType));
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
          <p className="text-gray-600 text-sm">
            {serviceHealth?.healthy === false ? 
              'Verificando conexión...' : 
              'Preparando tu contenido...'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* HEADER COMPACTO CON ESTADÍSTICAS MEJORADAS */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">
                Planes de Membresía
              </h1>
              
              {/* 🆕 NUEVO: Indicador de estado del servicio */}
              {serviceHealth && (
                <div className={`w-2 h-2 rounded-full ${serviceHealth.healthy ? 'bg-green-500' : 'bg-red-500'}`} 
                     title={serviceHealth.healthy ? 'Servicio operativo' : 'Servicio con problemas'} />
              )}
            </div>
            
            <p className="text-gray-600 text-sm mb-2">
              Gestiona los planes de tu gimnasio
            </p>
            
            {/* 🆕 NUEVO: Estadísticas mejoradas del servicio */}
            {stats ? (
              <div className="flex flex-wrap gap-2">
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                  {stats.summary.totalPlans} total
                </span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                  {stats.summary.activePlans} activos
                </span>
                {stats.summary.popularPlans > 0 && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                    {stats.summary.popularPlans} popular
                  </span>
                )}
                {stats.isLocal && (
                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                    Cache local
                  </span>
                )}
              </div>
            ) : membershipPlans.length > 0 && (
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
      
      {/* 🆕 NUEVO: Alerta de servicio no saludable */}
      {serviceHealth && !serviceHealth.healthy && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                Servicio con problemas: {serviceHealth.error}
              </p>
            </div>
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

// COMPONENTE: Estado Vacío Compacto (sin cambios)
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

// COMPONENTE: Tarjeta de Plan Compacta (sin cambios en la UI)
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
  const duration = durationType.find(d => d.value === plan.durationType || d.value === plan.duration);
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
 * 🎯 VERSIÓN ACTUALIZADA CON SERVICIO INDEPENDIENTE
 * 
 * ✅ CAMBIOS PRINCIPALES:
 * 
 * 1. **IMPORTACIÓN DEL SERVICIO**:
 *    - ✅ Importa membershipPlansService en lugar de usar apiService
 *    - ✅ Mantiene todas las importaciones existentes
 * 
 * 2. **OPERACIONES CRUD ACTUALIZADAS**:
 *    - ✅ loadMembershipPlans() usa getAllPlans() del servicio
 *    - ✅ handlePlanSaved() usa createPlan() y updatePlan()
 *    - ✅ handleDeletePlan() usa deletePlan() con opciones
 *    - ✅ handleToggleActive() usa togglePlanStatus()
 *    - ✅ handleDuplicatePlan() usa createPlan() para duplicar
 *    - ✅ handleSaveAll() usa saveBulkPlans()
 * 
 * 3. **CARACTERÍSTICAS NUEVAS**:
 *    - 📊 Carga estadísticas automáticamente del servicio
 *    - 🏥 Health check del servicio con indicador visual
 *    - ⚡ Soporte para cache del servicio (muestra si viene de cache)
 *    - 🛡️ Manejo mejorado de errores específicos por código de estado
 *    - 💾 Operaciones bulk para guardado masivo
 * 
 * 4. **MANTENIMIENTO DEL DISEÑO**:
 *    - ✅ NO se cambió ningún componente visual
 *    - ✅ Todos los estilos Tailwind se mantienen igual
 *    - ✅ CompactPlanCard sin modificaciones visuales
 *    - ✅ Modal y estados de UI idénticos
 *    - ✅ Responsive design preservado
 * 
 * 5. **VALIDACIONES Y DATOS**:
 *    - ✅ Valida durationType requerido por el backend
 *    - ✅ Campos adicionales como displayOrder
 *    - ✅ Manejo automático de IDs en duplicación
 *    - ✅ Actualización automática de estadísticas
 * 
 * 6. **EXPERIENCIA DE USUARIO**:
 *    - 🔴 Indicador visual del estado del servicio
 *    - 📊 Estadísticas en tiempo real del backend
 *    - ⚡ Información de cache cuando aplica
 *    - 🚨 Alertas específicas para problemas del servicio
 *    - 💬 Mensajes de error más descriptivos
 * 
 * 🚀 **RESULTADO**:
 * - Funcionalidad 100% conectada al backend real
 * - Mantiene el diseño compacto y responsive existente
 * - Mejor manejo de errores y estados
 * - Estadísticas y métricas automáticas
 * - Cache inteligente para mejor rendimiento
 * - Compatibilidad total con el código existente
 * 
 * ✨ Solo necesitas reemplazar el archivo existente con esta versión
 * y el componente funcionará con el backend real sin perder el diseño.
 */
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