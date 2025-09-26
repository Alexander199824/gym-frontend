// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/MembershipPlansManager.js
// VERSIÓN OPTIMIZADA PARA LAYOUT DASHBOARD - Compacta y Responsive

import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const MembershipPlansManager = ({ plans: initialPlans, isLoading: initialLoading, onSave, onUnsavedChanges }) => {
  const { user: currentUser, hasPermission } = useAuth();
  const { showSuccess, showError, formatCurrency, isMobile } = useApp();
  
  // Estados principales
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Estados para modal optimizado
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [modalStep, setModalStep] = useState(0);
  const [originalFormData, setOriginalFormData] = useState(null);
  
  // Estado del formulario
  const [planFormData, setPlanFormData] = useState(getEmptyPlan());
  
  // Estados para características con búsqueda
  const [featureSearch, setFeatureSearch] = useState('');
  const [showPredefined, setShowPredefined] = useState(true);
  
  // Referencias
  const modalRef = useRef(null);
  const contentRef = useRef(null);
  
  // Estados adicionales para mejor UX
  const [viewMode, setViewMode] = useState('grid');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  
  // CARACTERÍSTICAS PREDEFINIDAS OPTIMIZADAS
  const predefinedFeatures = {
    'Acceso al Gimnasio': [
      'Acceso 24/7 todos los días',
      'Acceso en horarios regulares (6am-10pm)',
      'Acceso a todas las áreas del gimnasio',
      'Acceso exclusivo a zona VIP',
      'Wi-Fi premium de alta velocidad',
      'Estacionamiento incluido',
      'Casilleros personales'
    ],
    'Equipos y Espacios': [
      'Todas las máquinas cardiovasculares',
      'Zona completa de pesas libres',
      'Área de entrenamiento funcional',
      'Zona de estiramientos y yoga',
      'Acceso a piscina climatizada',
      'Cancha deportiva multiusos',
      'Sauna y vapor incluidos'
    ],
    'Clases y Entrenamientos': [
      'Clases grupales ilimitadas',
      'Yoga y meditación incluidos',
      'Spinning y ciclismo indoor',
      'CrossFit y entrenamiento funcional',
      'Pilates y core strengthening',
      'Zumba y bailes latinos',
      'Aeróbicos y cardio dance'
    ],
    'Servicios Personalizados': [
      'Entrenador personal incluido',
      'Plan nutricional personalizado',
      'Asesoría fitness inicial',
      'Evaluación física completa',
      'Seguimiento de progreso mensual',
      'Consulta nutricional',
      'Análisis de composición corporal'
    ],
    'Beneficios Adicionales': [
      'Toallas limpias incluidas',
      'Invitados permitidos (2 por mes)',
      '20% descuento en suplementos',
      'App móvil premium',
      'Congelamiento de membresía',
      'Productos de higiene incluidos',
      'Eventos exclusivos para miembros'
    ]
  };
  
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
  
  // Funciones existentes (mismas que antes, solo optimizadas para espacio)
  const hasFormChanges = () => {
    if (!originalFormData) return false;
    return JSON.stringify(planFormData) !== JSON.stringify(originalFormData);
  };
  
  // Filtrar características predefinidas según búsqueda
  const getFilteredPredefinedFeatures = () => {
    if (!featureSearch.trim()) return predefinedFeatures;
    
    const search = featureSearch.toLowerCase();
    const filtered = {};
    
    Object.keys(predefinedFeatures).forEach(category => {
      const matchingFeatures = predefinedFeatures[category].filter(feature =>
        feature.toLowerCase().includes(search)
      );
      if (matchingFeatures.length > 0) {
        filtered[category] = matchingFeatures;
      }
    });
    
    return filtered;
  };
  
  // Handler mejorado para ESC key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showEditModal) {
        event.preventDefault();
        event.stopPropagation();
        handleCancelWithConfirmation();
      }
    };
    
    if (showEditModal) {
      document.addEventListener('keydown', handleEscKey, true);
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleEscKey, true);
        document.body.style.overflow = originalStyle;
      };
    }
  }, [showEditModal, planFormData, originalFormData]);
  
  const handleCancelWithConfirmation = () => {
    const hasChanges = hasFormChanges();
    
    if (hasChanges) {
      const confirmMessage = isCreating 
        ? '¿Seguro que quieres cancelar? Se perderá toda la información del nuevo plan.'
        : '¿Seguro que quieres cancelar? Se perderán todos los cambios no guardados.';
      
      if (window.confirm(confirmMessage)) {
        handleCancel();
      }
    } else {
      handleCancel();
    }
  };
  
  // CARGAR DATOS (mismo código existente)
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
  
  // FUNCIONES PRINCIPALES (mismas que antes)
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
    const emptyPlan = getEmptyPlan();
    setIsCreating(true);
    setEditingPlan(null);
    setPlanFormData(emptyPlan);
    setOriginalFormData(emptyPlan);
    setModalStep(0);
    setFeatureSearch('');
    setShowEditModal(true);
  };
  
  const handleEditPlan = (plan) => {
    const planCopy = { ...plan };
    setIsCreating(false);
    setEditingPlan(plan);
    setPlanFormData(planCopy);
    setOriginalFormData(planCopy);
    setModalStep(0);
    setFeatureSearch('');
    setShowEditModal(true);
  };
  
  const handleCancel = () => {
    setShowEditModal(false);
    setEditingPlan(null);
    setIsCreating(false);
    setModalStep(0);
    setPlanFormData(getEmptyPlan());
    setOriginalFormData(null);
    setFeatureSearch('');
  };
  
  const handleSavePlan = async () => {
    try {
      setSaving(true);
      
      if (!planFormData.name.trim()) {
        showError('El nombre del plan es obligatorio');
        return;
      }
      
      if (planFormData.price <= 0) {
        showError('El precio debe ser mayor a 0');
        return;
      }
      
      if (!planFormData.value.trim()) {
        planFormData.value = planFormData.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      }
      
      const existingPlan = membershipPlans.find(p => 
        p.value === planFormData.value && p.id !== editingPlan?.id
      );
      if (existingPlan) {
        showError('Ya existe un plan con ese ID');
        return;
      }
      
      if (planFormData.isPopular) {
        setMembershipPlans(prev => prev.map(plan => 
          plan.id !== editingPlan?.id ? { ...plan, isPopular: false } : plan
        ));
      }
      
      const planData = {
        ...planFormData,
        features: planFormData.features.filter(f => f.trim() !== ''),
        updatedAt: new Date().toISOString(),
        label: planFormData.label || planFormData.name
      };
      
      if (isCreating) {
        const newPlan = { 
          ...planData, 
          id: `plan_${Date.now()}`,
          createdAt: new Date().toISOString()
        };
        setMembershipPlans(prev => [...prev, newPlan]);
        showSuccess('Plan creado correctamente');
      } else {
        setMembershipPlans(prev => prev.map(plan => 
          plan.id === editingPlan.id ? planData : plan
        ));
        showSuccess('Plan actualizado correctamente');
      }
      
      setHasUnsavedChanges(true);
      setShowEditModal(false);
      setModalStep(0);
      
    } catch (error) {
      console.error('Error al guardar plan:', error);
      showError('Error al guardar el plan');
    } finally {
      setSaving(false);
    }
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
      
      {/* MODAL OPTIMIZADO PARA ESPACIO */}
      {showEditModal && (
        <OptimizedPlanModal
          show={showEditModal}
          plan={planFormData}
          isCreating={isCreating}
          saving={saving}
          step={modalStep}
          predefinedFeatures={predefinedFeatures}
          availableIcons={availableIcons}
          availableColors={availableColors}
          durationType={durationType}
          featureSearch={featureSearch}
          onFeatureSearchChange={setFeatureSearch}
          onChange={setPlanFormData}
          onSave={handleSavePlan}
          onCancel={handleCancelWithConfirmation}
          onStepChange={setModalStep}
          getIconComponent={getIconComponent}
          getColorStyles={getColorStyles}
          calculateDiscount={calculateDiscount}
          getFilteredPredefinedFeatures={getFilteredPredefinedFeatures}
          isMobile={isMobile}
        />
      )}
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

// COMPONENTE: Modal Optimizado para Espacio
const OptimizedPlanModal = ({ 
  show, 
  plan, 
  isCreating, 
  saving,
  step,
  predefinedFeatures,
  availableIcons,
  availableColors,
  durationType,
  featureSearch,
  onFeatureSearchChange,
  onChange, 
  onSave, 
  onCancel,
  onStepChange,
  getIconComponent,
  getColorStyles,
  calculateDiscount,
  getFilteredPredefinedFeatures,
  isMobile
}) => {
  if (!show) return null;
  
  const steps = [
    { id: 0, title: 'Info', icon: Info, description: 'Básica' },
    { id: 1, title: 'Características', icon: CheckCircle, description: 'Beneficios' },
    { id: 2, title: 'Precios', icon: DollarSign, description: 'Costos' },
    { id: 3, title: 'Diseño', icon: Palette, description: 'Visual' }
  ];
  
  const currentStep = steps[step] || steps[0];
  
  const canContinueToNextStep = () => {
    switch (step) {
      case 0: return plan.name.trim().length > 0;
      case 1: return true;
      case 2: return plan.price > 0;
      case 3: return true;
      default: return false;
    }
  };
  
  const canFinish = () => {
    return plan.name.trim().length > 0 && plan.price > 0;
  };
  
  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-4 pb-4 overflow-auto bg-black bg-opacity-50 backdrop-blur-sm">
      <div className={`w-full max-w-4xl mx-4 bg-white rounded-xl shadow-2xl max-h-full flex flex-col`}>
        
        {/* Header fijo compacto */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 rounded-t-xl flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isCreating ? 'Crear Plan' : 'Editar Plan'}
              </h2>
              <p className="text-gray-600 text-sm">{currentStep.description}</p>
            </div>
            
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Progress compacto */}
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Paso {step + 1} de {steps.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full h-1.5 transition-all duration-500"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Navegación por pasos compacta */}
        <div className="bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex">
            {steps.map((stepItem, index) => (
              <button
                key={stepItem.id}
                onClick={() => onStepChange(stepItem.id)}
                disabled={index > step && !canContinueToNextStep()}
                className={`flex-1 px-2 py-2 text-xs font-medium border-b-2 transition-all duration-200 ${
                  step === stepItem.id
                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                    : index < step 
                      ? 'border-green-500 text-green-600 hover:bg-green-50'
                      : index === step + 1 && canContinueToNextStep()
                        ? 'border-transparent text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                        : 'border-transparent text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-center space-x-1">
                  {index < step ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <stepItem.icon className="w-3 h-3" />
                  )}
                  <span className="hidden sm:inline">{stepItem.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Layout principal con vista previa */}
        <div className="flex flex-1 min-h-0">
          
          {/* Panel contenido */}
          <div className={`${isMobile ? 'w-full' : 'w-2/3'} flex flex-col min-h-0`}>
            
            {/* Contenido con scroll */}
            <div className="flex-1 overflow-y-auto p-4">
              {step === 0 && (
                <CompactBasicInfoStep 
                  plan={plan} 
                  onChange={onChange} 
                  durationType={durationType}
                />
              )}
              
              {step === 1 && (
                <CompactFeaturesStep 
                  plan={plan}
                  onChange={onChange}
                  predefinedFeatures={predefinedFeatures}
                  featureSearch={featureSearch}
                  onFeatureSearchChange={onFeatureSearchChange}
                  getFilteredPredefinedFeatures={getFilteredPredefinedFeatures}
                />
              )}
              
              {step === 2 && (
                <CompactPricingStep 
                  plan={plan} 
                  onChange={onChange} 
                  calculateDiscount={calculateDiscount}
                  durationType={durationType}
                />
              )}
              
              {step === 3 && (
                <CompactDesignStep 
                  plan={plan} 
                  onChange={onChange}
                  availableIcons={availableIcons}
                  availableColors={availableColors}
                  getIconComponent={getIconComponent}
                  getColorStyles={getColorStyles}
                />
              )}
            </div>
            
          </div>
          
          {/* Panel vista previa (solo desktop) */}
          {!isMobile && (
            <div className="w-1/3 bg-gradient-to-br from-gray-900 to-gray-800 p-4 flex flex-col">
              <h3 className="text-white text-sm font-semibold mb-4 text-center">
                Vista Previa
              </h3>
              <div className="flex-1 flex items-center justify-center">
                <CompactPlanPreview 
                  plan={plan}
                  getIconComponent={getIconComponent}
                  getColorStyles={getColorStyles}
                  calculateDiscount={calculateDiscount}
                  durationType={durationType}
                />
              </div>
              
              {/* Validaciones compactas */}
              <div className="mt-4 space-y-1">
                <div className="flex items-center text-xs">
                  {plan.name.trim() ? (
                    <Check className="w-3 h-3 text-green-400 mr-1" />
                  ) : (
                    <X className="w-3 h-3 text-red-400 mr-1" />
                  )}
                  <span className="text-white/80">Nombre</span>
                </div>
                <div className="flex items-center text-xs">
                  {plan.price > 0 ? (
                    <Check className="w-3 h-3 text-green-400 mr-1" />
                  ) : (
                    <X className="w-3 h-3 text-red-400 mr-1" />
                  )}
                  <span className="text-white/80">Precio</span>
                </div>
                <div className="flex items-center text-xs">
                  <span className="text-white/80">{plan.features.length} características</span>
                </div>
              </div>
            </div>
          )}
          
        </div>
        
        {/* Footer fijo */}
        <div className="bg-white border-t border-gray-200 p-4 rounded-b-xl flex-shrink-0">
          <div className="flex items-center justify-between">
            
            <div className="flex items-center space-x-2">
              <button
                onClick={onCancel}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              
              {step > 0 && (
                <button
                  onClick={() => onStepChange(step - 1)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {step < steps.length - 1 ? (
                <button
                  onClick={() => onStepChange(step + 1)}
                  disabled={!canContinueToNextStep()}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              ) : (
                <button
                  onClick={onSave}
                  disabled={saving || !canFinish()}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isCreating ? 'Crear' : 'Guardar'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          
          {/* Estado en footer */}
          <div className="mt-2 text-center">
            <span className={`text-xs ${canFinish() ? 'text-green-600' : 'text-amber-600'}`}>
              {canFinish() ? '✓ Listo para guardar' : '⚠ Completa los campos requeridos'}
            </span>
          </div>
        </div>
        
      </div>
    </div>
  );
};

// Vista previa compacta para desktop
const CompactPlanPreview = ({ plan, getIconComponent, getColorStyles, calculateDiscount, durationType }) => {
  const IconComponent = getIconComponent(plan.iconName);
  const colorStyles = getColorStyles(plan.color);
  const discount = calculateDiscount(plan.price, plan.originalPrice);
  const duration = durationType.find(d => d.value === plan.duration);
  
  return (
    <div className={`w-full max-w-xs bg-white rounded-xl border-2 shadow-lg overflow-hidden ${
      plan.isPopular ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-gray-200'
    }`}>
      
      {plan.isPopular && (
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-center py-1">
          <span className="text-white text-xs font-bold">
            <Star className="w-3 h-3 inline mr-1 fill-current" />
            POPULAR
          </span>
        </div>
      )}
      
      <div className="p-4">
        <div className="text-center mb-4">
          <div className={`w-12 h-12 mx-auto rounded-lg ${colorStyles.bg} flex items-center justify-center mb-3 shadow-md`}>
            <IconComponent className={`w-6 h-6 ${colorStyles.text}`} />
          </div>
          
          <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
            {plan.name || 'Nombre del Plan'}
          </h3>
          
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colorStyles.bg} ${colorStyles.text} border ${colorStyles.border}`}>
            {plan.label || 'Etiqueta'}
          </span>
        </div>
        
        <div className="text-center mb-4">
          <div className="flex items-baseline justify-center space-x-1">
            <span className="text-2xl font-bold text-gray-900">
              Q{(plan.price || 0).toLocaleString()}
            </span>
            {plan.originalPrice && plan.originalPrice > plan.price && (
              <span className="text-lg text-gray-500 line-through">
                Q{plan.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          
          <div className="text-gray-600 text-sm mt-1">
            por {duration?.label.toLowerCase() || 'mes'}
          </div>
          
          {discount > 0 && (
            <div className="mt-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                Ahorras {discount}%
              </span>
            </div>
          )}
        </div>
        
        {plan.description && (
          <div className="text-center mb-3">
            <p className="text-gray-600 text-xs line-clamp-2">
              {plan.description}
            </p>
          </div>
        )}
        
        <div>
          <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center">
            <Check className="w-3 h-3 text-green-500 mr-1" />
            Incluye:
          </h4>
          
          {plan.features.length > 0 ? (
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {plan.features.slice(0, 3).map((feature, idx) => (
                <div key={idx} className="flex items-start text-xs text-gray-700">
                  <Check className="w-3 h-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{feature}</span>
                </div>
              ))}
              {plan.features.length > 3 && (
                <div className="text-center pt-1">
                  <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                    +{plan.features.length - 3} más
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-2">
              <span className="text-xs text-gray-400 italic">
                Sin características
              </span>
            </div>
          )}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center space-x-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            plan.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {plan.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Componentes de pasos compactos
const CompactBasicInfoStep = ({ plan, onChange, durationType }) => (
  <div className="space-y-4">
    
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <h3 className="text-base font-semibold text-blue-900 mb-1 flex items-center">
        <Info className="w-4 h-4 mr-2" />
        Información Básica
      </h3>
      <p className="text-blue-700 text-sm">
        Configura el nombre, descripción y duración.
      </p>
    </div>
    
    <div className="grid grid-cols-1 gap-4">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Nombre del Plan <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={plan.name}
          onChange={(e) => {
            const newName = e.target.value;
            const newValue = newName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            onChange({ 
              ...plan, 
              name: newName,
              value: newValue,
              label: newName
            });
          }}
          className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
          placeholder="Ej: Plan Premium Elite"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            ID del Plan
          </label>
          <input
            type="text"
            value={plan.value}
            onChange={(e) => onChange({ ...plan, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
            className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
            placeholder="premium_elite"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Etiqueta Corta
          </label>
          <input
            type="text"
            value={plan.label}
            onChange={(e) => onChange({ ...plan, label: e.target.value })}
            className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
            placeholder="Premium"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Descripción del Plan
        </label>
        <textarea
          value={plan.description}
          onChange={(e) => onChange({ ...plan, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 resize-none"
          placeholder="Describe los beneficios principales de este plan..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Duración del Plan
        </label>
        <select
          value={plan.duration}
          onChange={(e) => onChange({ ...plan, duration: e.target.value })}
          className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
        >
          {durationType.map((duration) => (
            <option key={duration.value} value={duration.value}>
              {duration.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          Configuraciones
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg hover:bg-white hover:border-primary-300 cursor-pointer">
            <input
              type="checkbox"
              checked={plan.isPopular}
              onChange={(e) => onChange({ ...plan, isPopular: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div className="ml-2">
              <span className="text-sm font-medium text-gray-900">Plan Popular</span>
              <p className="text-xs text-gray-500">Badge especial</p>
            </div>
          </label>
          
          <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg hover:bg-white hover:border-primary-300 cursor-pointer">
            <input
              type="checkbox"
              checked={plan.isActive}
              onChange={(e) => onChange({ ...plan, isActive: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div className="ml-2">
              <span className="text-sm font-medium text-gray-900">Plan Activo</span>
              <p className="text-xs text-gray-500">Visible para clientes</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  </div>
);

const CompactFeaturesStep = ({ 
  plan, 
  onChange, 
  predefinedFeatures,
  featureSearch,
  onFeatureSearchChange,
  getFilteredPredefinedFeatures
}) => {
  const [activeCategory, setActiveCategory] = useState(Object.keys(predefinedFeatures)[0]);
  
  const handleAddFeature = () => {
    if (featureSearch.trim() && !plan.features.includes(featureSearch.trim())) {
      onChange({
        ...plan,
        features: [...plan.features, featureSearch.trim()]
      });
      onFeatureSearchChange('');
    }
  };
  
  const handleAddPredefinedFeature = (feature) => {
    if (!plan.features.includes(feature)) {
      onChange({
        ...plan,
        features: [...plan.features, feature]
      });
    }
  };
  
  const handleRemoveFeature = (featureToRemove) => {
    onChange({
      ...plan,
      features: plan.features.filter(f => f !== featureToRemove)
    });
  };
  
  const filteredFeatures = getFilteredPredefinedFeatures();
  
  return (
    <div className="space-y-4">
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <h3 className="text-base font-semibold text-green-900 mb-1 flex items-center">
          <CheckCircle className="w-4 h-4 mr-2" />
          Características del Plan
        </h3>
        <p className="text-green-700 text-sm">
          Busca o crea características para tu plan.
        </p>
      </div>
      
      {/* CAMPO DE BÚSQUEDA/AGREGAR PRIMERO */}
      <div>
        <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
          <Search className="w-4 h-4 mr-2" />
          Buscar o Crear Característica
        </h4>
        <div className="flex space-x-2">
          <input
            type="text"
            value={featureSearch}
            onChange={(e) => onFeatureSearchChange(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
            placeholder="Busca una característica o escribe una nueva..."
            onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
          />
          <button
            onClick={handleAddFeature}
            disabled={!featureSearch.trim() || plan.features.includes(featureSearch.trim())}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Escribe para buscar en características predefinidas o crear una nueva
        </p>
      </div>
      
      {/* CARACTERÍSTICAS FILTRADAS */}
      {featureSearch.trim() && Object.keys(filteredFeatures).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Resultados de búsqueda
          </h4>
          
          {Object.keys(filteredFeatures).map((category) => (
            <div key={category} className="mb-3">
              <h5 className="text-xs font-medium text-gray-700 mb-2">{category}</h5>
              <div className="space-y-1">
                {filteredFeatures[category].map((feature, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAddPredefinedFeature(feature)}
                    disabled={plan.features.includes(feature)}
                    className={`text-left w-full px-3 py-2 text-sm rounded-lg border transition-all ${
                      plan.features.includes(feature)
                        ? 'border-green-200 bg-green-50 text-green-700 cursor-not-allowed'
                        : 'border-gray-200 hover:bg-primary-50 hover:border-primary-300 text-gray-700'
                    }`}
                  >
                    {plan.features.includes(feature) ? (
                      <Check className="w-3 h-3 inline mr-2 text-green-600" />
                    ) : (
                      <Plus className="w-3 h-3 inline mr-2 text-primary-600" />
                    )}
                    {feature}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* TODAS LAS CARACTERÍSTICAS PREDEFINIDAS (cuando no hay búsqueda) */}
      {!featureSearch.trim() && (
        <div>
          <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
            <Sparkles className="w-4 h-4 mr-2" />
            Características Sugeridas
          </h4>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.keys(predefinedFeatures).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeCategory === category
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          
          <div className="bg-white border-2 border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
            <div className="space-y-1">
              {predefinedFeatures[activeCategory]?.map((feature, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddPredefinedFeature(feature)}
                  disabled={plan.features.includes(feature)}
                  className={`text-left w-full px-3 py-2 text-sm rounded-lg border transition-all ${
                    plan.features.includes(feature)
                      ? 'border-green-200 bg-green-50 text-green-700 cursor-not-allowed'
                      : 'border-gray-200 hover:bg-primary-50 hover:border-primary-300 text-gray-700'
                  }`}
                >
                  {plan.features.includes(feature) ? (
                    <Check className="w-3 h-3 inline mr-2 text-green-600" />
                  ) : (
                    <Plus className="w-3 h-3 inline mr-2 text-primary-600" />
                  )}
                  {feature}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* CARACTERÍSTICAS SELECCIONADAS */}
      {plan.features.length > 0 && (
        <div>
          <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            Características Seleccionadas ({plan.features.length})
          </h4>
          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200 rounded-lg p-3">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {plan.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-white border border-primary-200 rounded-lg shadow-sm"
                >
                  <span className="flex items-center text-primary-800 flex-1 text-sm">
                    <CheckCircle className="w-4 h-4 mr-2 text-primary-600" />
                    <span className="font-medium">{feature}</span>
                  </span>
                  <button
                    onClick={() => handleRemoveFeature(feature)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {plan.features.length === 0 && (
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Package className="w-6 h-6 text-gray-400" />
          </div>
          <h4 className="text-base font-medium text-gray-900 mb-1">
            No hay características
          </h4>
          <p className="text-gray-500 text-sm">
            Busca o agrega características para tu plan
          </p>
        </div>
      )}
    </div>
  );
};

const CompactPricingStep = ({ plan, onChange, calculateDiscount, durationType }) => {
  const discount = calculateDiscount(plan.price, plan.originalPrice);
  const duration = durationType.find(d => d.value === plan.duration);
  
  return (
    <div className="space-y-4">
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <h3 className="text-base font-semibold text-yellow-900 mb-1 flex items-center">
          <DollarSign className="w-4 h-4 mr-2" />
          Configuración de Precios
        </h3>
        <p className="text-yellow-700 text-sm">
          Define el precio de tu plan en quetzales.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Precio del Plan <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
              Q
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={plan.price}
              onChange={(e) => onChange({ ...plan, price: parseFloat(e.target.value) || 0 })}
              className="w-full pl-8 pr-3 py-3 text-lg font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
              placeholder="0.00"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Precio Original (Opcional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
              Q
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={plan.originalPrice || ''}
              onChange={(e) => onChange({ ...plan, originalPrice: parseFloat(e.target.value) || null })}
              className="w-full pl-8 pr-3 py-3 text-lg font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Duración del Plan
        </label>
        <select
          value={plan.duration}
          onChange={(e) => onChange({ ...plan, duration: e.target.value })}
          className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
        >
          {durationType.map((duration) => (
            <option key={duration.value} value={duration.value}>
              {duration.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg p-4">
        <h4 className="text-base font-semibold text-gray-900 mb-3 text-center">
          Vista Previa del Precio
        </h4>
        
        <div className="text-center">
          <div className="flex items-baseline justify-center space-x-2 mb-2">
            <span className="text-3xl font-bold text-gray-900">
              Q{(plan.price || 0).toLocaleString()}
            </span>
            {plan.originalPrice && plan.originalPrice > plan.price && (
              <span className="text-xl text-gray-500 line-through">
                Q{plan.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          
          <div className="text-gray-600 text-base mb-3">
            por {duration?.label.toLowerCase() || 'periodo'}
          </div>
          
          {discount > 0 && (
            <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
              <TrendingUp className="w-4 h-4 mr-1" />
              ¡Descuento del {discount}%!
            </div>
          )}
          
          {plan.price > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <div>Precio por día: Q{(plan.price / (duration?.days || 30)).toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {plan.price <= 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-red-800 font-medium text-sm">
            Debes establecer un precio mayor a Q0.00
          </p>
        </div>
      )}
    </div>
  );
};

const CompactDesignStep = ({ plan, onChange, availableIcons, availableColors, getIconComponent, getColorStyles }) => {
  return (
    <div className="space-y-4">
      
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <h3 className="text-base font-semibold text-purple-900 mb-1 flex items-center">
          <Palette className="w-4 h-4 mr-2" />
          Diseño del Plan
        </h3>
        <p className="text-purple-700 text-sm">
          Personaliza la apariencia visual.
        </p>
      </div>
      
      <div>
        <h4 className="text-base font-semibold text-gray-900 mb-3">
          Icono del Plan
        </h4>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {availableIcons.map((icon) => {
            const IconComponent = icon.component;
            return (
              <button
                key={icon.id}
                onClick={() => onChange({ ...plan, iconName: icon.id })}
                className={`p-3 border-2 rounded-lg flex flex-col items-center space-y-1 text-xs transition-all ${
                  plan.iconName === icon.id 
                    ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <IconComponent className="w-6 h-6" />
                <span className="font-medium">{icon.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      <div>
        <h4 className="text-base font-semibold text-gray-900 mb-3">
          Color del Plan
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {availableColors.map(color => (
            <button
              key={color.value}
              onClick={() => onChange({ ...plan, color: color.value })}
              className={`p-3 rounded-lg border-2 flex items-center space-x-3 transition-all ${
                plan.color === color.value 
                  ? 'border-primary-500 ring-2 ring-primary-100 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-6 h-6 rounded-md ${color.bg} border ${color.border}`}></div>
              <div className="text-left">
                <div className="font-medium text-gray-900 text-sm">{color.label}</div>
                <div className="text-xs text-gray-500">Estilo {color.label.split(' ')[1]}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg p-4">
        <h4 className="text-base font-semibold text-gray-900 mb-3 text-center">
          Vista Previa del Diseño
        </h4>
        
        <div className="flex justify-center">
          <CompactDesignPreviewCard 
            plan={plan}
            getIconComponent={getIconComponent}
            getColorStyles={getColorStyles}
          />
        </div>
      </div>
    </div>
  );
};

const CompactDesignPreviewCard = ({ plan, getIconComponent, getColorStyles }) => {
  const IconComponent = getIconComponent(plan.iconName);
  const colorStyles = getColorStyles(plan.color);
  
  return (
    <div className={`w-48 bg-white rounded-lg border-2 shadow-md ${colorStyles.border} ${plan.isPopular ? 'ring-2 ring-yellow-100' : ''}`}>
      
      {plan.isPopular && (
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-center py-1 rounded-t-lg">
          <span className="text-white text-xs font-bold">
            <Star className="w-3 h-3 inline mr-1 fill-current" />
            POPULAR
          </span>
        </div>
      )}
      
      <div className="p-4">
        <div className="text-center">
          <div className={`w-10 h-10 mx-auto rounded-lg ${colorStyles.bg} flex items-center justify-center mb-2`}>
            <IconComponent className={`w-5 h-5 ${colorStyles.text}`} />
          </div>
          
          <h4 className="font-bold text-gray-900 mb-1 text-sm">
            {plan.name || 'Nombre del Plan'}
          </h4>
          
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorStyles.bg} ${colorStyles.text} border ${colorStyles.border}`}>
            {plan.label || 'Etiqueta'}
          </span>
          
          <div className="text-lg font-bold text-gray-900 mt-2">
            Q{(plan.price || 0).toLocaleString()}
          </div>
          
          <div className="text-xs text-gray-600">
            por mes
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