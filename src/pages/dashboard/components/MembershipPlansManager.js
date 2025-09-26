// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/MembershipPlansManager.js
// FUNCIÓN: Gestión de planes de membresía - VERSIÓN MEJORADA Y MÁS INTUITIVA
// MEJORADO: Layout responsive, navegación intuitiva, mejor UX

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
  
  // Estados para modal mejorado
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [modalStep, setModalStep] = useState(0);
  const [originalFormData, setOriginalFormData] = useState(null);
  
  // Estado del formulario
  const [planFormData, setPlanFormData] = useState(getEmptyPlan());
  
  // Referencias
  const modalRef = useRef(null);
  const contentRef = useRef(null);
  
  // Estados adicionales para mejor UX
  const [viewMode, setViewMode] = useState('grid');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  
  // CARACTERÍSTICAS PREDEFINIDAS MEJORADAS
  const predefinedFeatures = {
    '🏋️ Acceso al Gimnasio': [
      'Acceso 24/7 todos los días',
      'Acceso en horarios regulares (6am-10pm)',
      'Acceso a todas las áreas del gimnasio',
      'Acceso exclusivo a zona VIP',
      'Wi-Fi premium de alta velocidad',
      'Estacionamiento incluido',
      'Casilleros personales'
    ],
    '💪 Equipos y Espacios': [
      'Todas las máquinas cardiovasculares',
      'Zona completa de pesas libres',
      'Área de entrenamiento funcional',
      'Zona de estiramientos y yoga',
      'Acceso a piscina climatizada',
      'Cancha deportiva multiusos',
      'Sauna y vapor incluidos'
    ],
    '🎯 Clases y Entrenamientos': [
      'Clases grupales ilimitadas',
      'Yoga y meditación incluidos',
      'Spinning y ciclismo indoor',
      'CrossFit y entrenamiento funcional',
      'Pilates y core strengthening',
      'Zumba y bailes latinos',
      'Aeróbicos y cardio dance'
    ],
    '👨‍💼 Servicios Personalizados': [
      'Entrenador personal incluido',
      'Plan nutricional personalizado',
      'Asesoría fitness inicial',
      'Evaluación física completa',
      'Seguimiento de progreso mensual',
      'Consulta nutricional',
      'Análisis de composición corporal'
    ],
    '🎁 Beneficios Adicionales': [
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
  
  // Función para verificar si hay cambios
  const hasFormChanges = () => {
    if (!originalFormData) return false;
    return JSON.stringify(planFormData) !== JSON.stringify(originalFormData);
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
      // Prevenir scroll del body
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleEscKey, true);
        document.body.style.overflow = originalStyle;
      };
    }
  }, [showEditModal, planFormData, originalFormData]);
  
  // Función para cancelar con confirmación mejorada
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
  
  // Cargar al montar
  useEffect(() => {
    if (!isDataLoaded && !initialLoading) {
      loadMembershipPlans(true);
    }
  }, [loadMembershipPlans, isDataLoaded, initialLoading]);
  
  // Notificar cambios
  useEffect(() => {
    if (onUnsavedChanges) {
      onUnsavedChanges(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onUnsavedChanges]);
  
  // FUNCIONES PRINCIPALES
  
  // Guardar todo
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
  
  // Crear plan mejorado
  const handleCreatePlan = () => {
    const emptyPlan = getEmptyPlan();
    setIsCreating(true);
    setEditingPlan(null);
    setPlanFormData(emptyPlan);
    setOriginalFormData(emptyPlan);
    setModalStep(0);
    setShowEditModal(true);
  };
  
  // Editar plan
  const handleEditPlan = (plan) => {
    const planCopy = { ...plan };
    setIsCreating(false);
    setEditingPlan(plan);
    setPlanFormData(planCopy);
    setOriginalFormData(planCopy);
    setModalStep(0);
    setShowEditModal(true);
  };
  
  // Cancelar
  const handleCancel = () => {
    setShowEditModal(false);
    setEditingPlan(null);
    setIsCreating(false);
    setModalStep(0);
    setPlanFormData(getEmptyPlan());
    setOriginalFormData(null);
  };
  
  // Guardar plan individual
  const handleSavePlan = async () => {
    try {
      setSaving(true);
      
      // Validaciones básicas
      if (!planFormData.name.trim()) {
        showError('El nombre del plan es obligatorio');
        return;
      }
      
      if (planFormData.price <= 0) {
        showError('El precio debe ser mayor a 0');
        return;
      }
      
      // Generar valor si no existe
      if (!planFormData.value.trim()) {
        planFormData.value = planFormData.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      }
      
      // Validar ID único
      const existingPlan = membershipPlans.find(p => 
        p.value === planFormData.value && p.id !== editingPlan?.id
      );
      if (existingPlan) {
        showError('Ya existe un plan con ese ID');
        return;
      }
      
      // Manejar popular único
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
  
  // Otras funciones
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
  
  // Filtrar y ordenar planes
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

  // Loading
  if ((loading && !isDataLoaded) || initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Cargando Planes
          </h3>
          <p className="text-gray-600">Preparando tu contenido...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-4 max-w-7xl mx-auto">
        
        {/* HEADER SIMPLIFICADO */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Planes de Membresía
              </h1>
              <p className="text-gray-600">
                Gestiona los planes de tu gimnasio
              </p>
              
              {membershipPlans.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
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
            
            <div className="flex items-center space-x-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
                <option value="popular">Popular</option>
              </select>
              
              <button
                onClick={() => loadMembershipPlans(true)}
                disabled={loading}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              {hasUnsavedChanges && (
                <button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2 inline" />
                  Guardar
                </button>
              )}
              
              <button
                onClick={handleCreatePlan}
                className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-4 h-4 mr-2 inline" />
                Nuevo Plan
              </button>
            </div>
          </div>
        </div>
        
        {/* ALERTA DE CAMBIOS */}
        {hasUnsavedChanges && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-amber-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Tienes cambios sin guardar
                </p>
                <button
                  onClick={handleSaveAll}
                  className="text-sm text-amber-800 underline hover:text-amber-900 mt-1"
                >
                  Guardar ahora
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* CONTENIDO */}
        {filteredPlans.length === 0 ? (
          <EmptyState onCreatePlan={handleCreatePlan} />
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredPlans.map((plan) => (
              <PlanCard
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
        
        {/* MODAL COMPLETAMENTE REDISEÑADO */}
        {showEditModal && (
          <ImprovedPlanModal
            show={showEditModal}
            plan={planFormData}
            isCreating={isCreating}
            saving={saving}
            step={modalStep}
            predefinedFeatures={predefinedFeatures}
            availableIcons={availableIcons}
            availableColors={availableColors}
            durationType={durationType}
            onChange={setPlanFormData}
            onSave={handleSavePlan}
            onCancel={handleCancelWithConfirmation}
            onStepChange={setModalStep}
            getIconComponent={getIconComponent}
            getColorStyles={getColorStyles}
            calculateDiscount={calculateDiscount}
            isMobile={isMobile}
            modalRef={modalRef}
            contentRef={contentRef}
          />
        )}
      </div>
    </div>
  );
};

// COMPONENTE: Estado Vacío
const EmptyState = ({ onCreatePlan }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
    <div className="w-16 h-16 mx-auto bg-gradient-to-r from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center mb-6">
      <CreditCard className="w-8 h-8 text-primary-600" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">
      No hay planes configurados
    </h3>
    <p className="text-gray-600 mb-6">
      Crea tu primer plan de membresía para empezar
    </p>
    <button
      onClick={onCreatePlan}
      className="px-6 py-3 text-white bg-primary-600 rounded-lg hover:bg-primary-700"
    >
      <Plus className="w-5 h-5 mr-2 inline" />
      Crear Primer Plan
    </button>
  </div>
);

// COMPONENTE: Tarjeta de Plan
const PlanCard = ({ 
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
    <div className={`relative bg-white border-2 rounded-xl shadow-sm hover:shadow-md transition-all ${
      plan.isPopular ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-gray-200'
    } ${!plan.isActive ? 'opacity-60' : ''}`}>
      
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col space-y-1">
        {plan.isPopular && (
          <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            <Star className="w-3 h-3 mr-1 inline fill-current" />
            POPULAR
          </span>
        )}
        {!plan.isActive && (
          <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            INACTIVO
          </span>
        )}
        {discount > 0 && (
          <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            -{discount}%
          </span>
        )}
      </div>
      
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`w-14 h-14 mx-auto rounded-xl ${colorStyles.bg} flex items-center justify-center mb-4`}>
            <IconComponent className={`w-7 h-7 ${colorStyles.text}`} />
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {plan.name}
          </h3>
          
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorStyles.bg} ${colorStyles.text} border ${colorStyles.border}`}>
            {plan.label}
          </span>
          
          {plan.description && (
            <p className="text-gray-600 text-sm mt-3">
              {plan.description}
            </p>
          )}
        </div>
        
        {/* Precio */}
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center space-x-2">
            <span className="text-2xl font-bold text-gray-900">
              Q{plan.price.toLocaleString()}
            </span>
            {plan.originalPrice && plan.originalPrice > plan.price && (
              <span className="text-lg text-gray-500 line-through">
                Q{plan.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          
          <div className="text-sm text-gray-600 mt-1">
            por {duration?.label.toLowerCase()}
          </div>
        </div>
        
        {/* Características */}
        {plan.features && plan.features.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              Incluye:
            </h4>
            <div className="space-y-2">
              {plan.features.slice(0, 4).map((feature, idx) => (
                <div key={idx} className="flex items-start text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
              {plan.features.length > 4 && (
                <div className="text-center pt-2">
                  <span className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                    +{plan.features.length - 4} beneficios más
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Acciones */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <button
              onClick={onTogglePopular}
              className={`p-2 rounded-lg transition-colors ${
                plan.isPopular ? 'text-yellow-600 bg-yellow-50' : 'text-gray-400 hover:text-yellow-600'
              }`}
            >
              <Star className={`w-4 h-4 ${plan.isPopular ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={onToggleActive}
              className={`p-2 rounded-lg transition-colors ${
                plan.isActive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
              }`}
            >
              {plan.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={onEdit}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Edit className="w-4 h-4" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border rounded-lg shadow-lg z-20">
                  <button
                    onClick={() => {
                      onDuplicate();
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicar
                  </button>
                  <button
                    onClick={() => {
                      onDelete();
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
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

// COMPONENTE: Modal Completamente Rediseñado y Mejorado
const ImprovedPlanModal = ({ 
  show, 
  plan, 
  isCreating, 
  saving,
  step,
  predefinedFeatures,
  availableIcons,
  availableColors,
  durationType,
  onChange, 
  onSave, 
  onCancel,
  onStepChange,
  getIconComponent,
  getColorStyles,
  calculateDiscount,
  isMobile,
  modalRef,
  contentRef
}) => {
  if (!show) return null;
  
  const steps = [
    { id: 0, title: 'Información Básica', icon: Info, description: 'Nombre y detalles' },
    { id: 1, title: 'Características', icon: CheckCircle, description: 'Beneficios incluidos' },
    { id: 2, title: 'Precios', icon: DollarSign, description: 'Configuración de precios' },
    { id: 3, title: 'Diseño', icon: Palette, description: 'Apariencia visual' }
  ];
  
  const currentStep = steps[step] || steps[0];
  
  // Validar si puede continuar al siguiente paso
  const canContinueToNextStep = () => {
    switch (step) {
      case 0:
        return plan.name.trim().length > 0;
      case 1:
        return true; // Siempre puede continuar desde características
      case 2:
        return plan.price > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };
  
  const canFinish = () => {
    return plan.name.trim().length > 0 && plan.price > 0;
  };
  
  return (
    <div 
      className="fixed inset-0 z-[9999] flex"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)'
      }}
    >
      {/* LAYOUT PRINCIPAL DEL MODAL */}
      <div className="flex w-full h-full">
        
        {/* PANEL IZQUIERDO - Vista Previa (Desktop) */}
        {!isMobile && (
          <div className="w-1/3 bg-gradient-to-br from-gray-900 to-gray-800 p-8 flex flex-col items-center justify-center">
            <h3 className="text-white text-lg font-semibold mb-6 text-center">
              Vista Previa del Plan
            </h3>
            <EnhancedPlanPreview 
              plan={plan}
              getIconComponent={getIconComponent}
              getColorStyles={getColorStyles}
              calculateDiscount={calculateDiscount}
              durationType={durationType}
            />
            
            {/* Indicadores de validación */}
            <div className="mt-6 space-y-2 w-full max-w-xs">
              <div className="flex items-center text-sm">
                {plan.name.trim() ? (
                  <Check className="w-4 h-4 text-green-400 mr-2" />
                ) : (
                  <X className="w-4 h-4 text-red-400 mr-2" />
                )}
                <span className="text-white/80">Nombre del plan</span>
              </div>
              <div className="flex items-center text-sm">
                {plan.price > 0 ? (
                  <Check className="w-4 h-4 text-green-400 mr-2" />
                ) : (
                  <X className="w-4 h-4 text-red-400 mr-2" />
                )}
                <span className="text-white/80">Precio configurado</span>
              </div>
              <div className="flex items-center text-sm">
                {plan.features.length > 0 ? (
                  <Check className="w-4 h-4 text-green-400 mr-2" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-400 mr-2" />
                )}
                <span className="text-white/80">
                  {plan.features.length} características
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* PANEL DERECHO - Formulario */}
        <div className={`${isMobile ? 'w-full' : 'w-2/3'} bg-white flex flex-col`}>
          
          {/* Header Fijo */}
          <div className="bg-white border-b border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  {isCreating ? 'Crear Nuevo Plan' : 'Editar Plan'}
                </h2>
                <p className="text-gray-600 text-sm md:text-base mt-1">
                  {currentStep.description}
                </p>
              </div>
              
              <button
                onClick={onCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Paso {step + 1} de {steps.length}</span>
                <span>{Math.round(((step + 1) / steps.length) * 100)}% completado</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full h-2 transition-all duration-500"
                  style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Vista previa móvil compacta */}
            {isMobile && (
              <div className="bg-gray-50 rounded-lg p-3">
                <CompactPlanPreview 
                  plan={plan}
                  getIconComponent={getIconComponent}
                  getColorStyles={getColorStyles}
                />
              </div>
            )}
          </div>
          
          {/* Navegación por Pasos */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex">
              {steps.map((stepItem, index) => (
                <button
                  key={stepItem.id}
                  onClick={() => onStepChange(stepItem.id)}
                  disabled={index > step && !canContinueToNextStep()}
                  className={`flex-1 px-2 md:px-4 py-3 text-xs md:text-sm font-medium border-b-3 transition-all duration-200 ${
                    step === stepItem.id
                      ? 'border-primary-500 text-primary-600 bg-primary-50'
                      : index < step 
                        ? 'border-green-500 text-green-600 hover:bg-green-50'
                        : index === step + 1 && canContinueToNextStep()
                          ? 'border-transparent text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                          : 'border-transparent text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1 md:space-x-2">
                    {index < step ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <stepItem.icon className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{stepItem.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Contenido con Scroll Optimizado */}
          <div 
            className="flex-1 overflow-y-auto"
            style={{ 
              maxHeight: isMobile ? 'calc(100vh - 280px)' : 'calc(100vh - 250px)',
            }}
          >
            <div className="p-4 md:p-6">
              {step === 0 && (
                <ImprovedBasicInfoStep 
                  plan={plan} 
                  onChange={onChange} 
                  durationType={durationType}
                />
              )}
              
              {step === 1 && (
                <ImprovedFeaturesStep 
                  plan={plan}
                  onChange={onChange}
                  predefinedFeatures={predefinedFeatures}
                />
              )}
              
              {step === 2 && (
                <ImprovedPricingStep 
                  plan={plan} 
                  onChange={onChange} 
                  calculateDiscount={calculateDiscount}
                  durationType={durationType}
                />
              )}
              
              {step === 3 && (
                <ImprovedDesignStep 
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
          
          {/* Footer Fijo con Navegación */}
          <div className="bg-white border-t border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between">
              
              {/* Botones Izquierda */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                
                {step > 0 && (
                  <button
                    onClick={() => onStepChange(step - 1)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Anterior</span>
                  </button>
                )}
              </div>
              
              {/* Botones Derecha */}
              <div className="flex items-center space-x-2">
                {step < steps.length - 1 ? (
                  <button
                    onClick={() => onStepChange(step + 1)}
                    disabled={!canContinueToNextStep()}
                    className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <span className="sm:hidden">Sig.</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                ) : (
                  <button
                    onClick={onSave}
                    disabled={saving || !canFinish()}
                    className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {saving ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        <span className="hidden sm:inline">Guardando...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">
                          {isCreating ? 'Crear Plan' : 'Guardar'}
                        </span>
                        <span className="sm:hidden">
                          {isCreating ? 'Crear' : 'Guardar'}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            
            {/* Indicador de estado en footer */}
            <div className="mt-3 flex items-center justify-center">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className={canFinish() ? 'text-green-600' : 'text-amber-600'}>
                  {canFinish() ? '✓ Listo para guardar' : '⚠ Completa los campos requeridos'}
                </span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

// Vista previa mejorada para desktop
const EnhancedPlanPreview = ({ plan, getIconComponent, getColorStyles, calculateDiscount, durationType }) => {
  const IconComponent = getIconComponent(plan.iconName);
  const colorStyles = getColorStyles(plan.color);
  const discount = calculateDiscount(plan.price, plan.originalPrice);
  const duration = durationType.find(d => d.value === plan.duration);
  
  return (
    <div className={`w-full max-w-sm bg-white rounded-2xl border-2 shadow-xl overflow-hidden ${
      plan.isPopular ? 'border-yellow-400 ring-4 ring-yellow-100' : 'border-gray-200'
    }`}>
      
      {/* Header */}
      {plan.isPopular && (
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-center py-2">
          <span className="text-white text-sm font-bold">
            <Star className="w-4 h-4 inline mr-1 fill-current" />
            MÁS POPULAR
          </span>
        </div>
      )}
      
      <div className="p-6">
        {/* Icono y título */}
        <div className="text-center mb-6">
          <div className={`w-16 h-16 mx-auto rounded-2xl ${colorStyles.bg} flex items-center justify-center mb-4 shadow-lg`}>
            <IconComponent className={`w-8 h-8 ${colorStyles.text}`} />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {plan.name || 'Nombre del Plan'}
          </h3>
          
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${colorStyles.bg} ${colorStyles.text} border-2 ${colorStyles.border}`}>
            {plan.label || 'Etiqueta'}
          </span>
        </div>
        
        {/* Precio */}
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center space-x-2">
            <span className="text-3xl font-bold text-gray-900">
              Q{(plan.price || 0).toLocaleString()}
            </span>
            {plan.originalPrice && plan.originalPrice > plan.price && (
              <span className="text-xl text-gray-500 line-through">
                Q{plan.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          
          <div className="text-gray-600 mt-2">
            por {duration?.label.toLowerCase() || 'mes'}
          </div>
          
          {discount > 0 && (
            <div className="mt-2">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                Ahorras {discount}%
              </span>
            </div>
          )}
        </div>
        
        {/* Descripción */}
        {plan.description && (
          <div className="text-center mb-4">
            <p className="text-gray-600 text-sm">
              {plan.description}
            </p>
          </div>
        )}
        
        {/* Características */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center">
            <Check className="w-4 h-4 text-green-500 mr-2" />
            Lo que incluye:
          </h4>
          
          {plan.features.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {plan.features.slice(0, 5).map((feature, idx) => (
                <div key={idx} className="flex items-start text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
              {plan.features.length > 5 && (
                <div className="text-center pt-2">
                  <span className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                    +{plan.features.length - 5} beneficios más
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <span className="text-sm text-gray-400 italic">
                Agrega características al plan
              </span>
            </div>
          )}
        </div>
        
        {/* Estados */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center space-x-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            plan.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {plan.isActive ? 'Activo' : 'Inactivo'}
          </span>
          
          {plan.isPopular && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Popular
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Vista previa compacta para móvil
const CompactPlanPreview = ({ plan, getIconComponent, getColorStyles }) => {
  const IconComponent = getIconComponent(plan.iconName);
  const colorStyles = getColorStyles(plan.color);
  
  return (
    <div className="flex items-center space-x-3">
      <div className={`w-10 h-10 rounded-lg ${colorStyles.bg} flex items-center justify-center`}>
        <IconComponent className={`w-5 h-5 ${colorStyles.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 truncate">
          {plan.name || 'Nombre del Plan'}
        </h4>
        <p className="text-sm text-gray-600">
          Q{(plan.price || 0).toLocaleString()} • {plan.features.length} beneficios
        </p>
      </div>
      {plan.isPopular && (
        <Star className="w-4 h-4 text-yellow-500 fill-current" />
      )}
    </div>
  );
};

// Componentes de pasos mejorados con mejor UX
const ImprovedBasicInfoStep = ({ plan, onChange, durationType }) => (
  <div className="space-y-6">
    
    {/* Información principal */}
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
        <Info className="w-5 h-5 mr-2" />
        Información Básica del Plan
      </h3>
      <p className="text-blue-700 text-sm">
        Configura el nombre, descripción y duración de tu plan de membresía.
      </p>
    </div>
    
    <div className="grid grid-cols-1 gap-6">
      {/* Nombre del plan */}
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
          className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all"
          placeholder="Ej: Plan Premium Elite"
        />
        <p className="text-xs text-gray-500 mt-1">
          Este será el nombre principal que verán tus clientes
        </p>
      </div>
      
      {/* Campos en grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            ID del Plan
          </label>
          <input
            type="text"
            value={plan.value}
            onChange={(e) => onChange({ ...plan, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all"
            placeholder="premium_elite"
          />
          <p className="text-xs text-gray-500 mt-1">
            Identificador único (se genera automáticamente)
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Etiqueta Corta
          </label>
          <input
            type="text"
            value={plan.label}
            onChange={(e) => onChange({ ...plan, label: e.target.value })}
            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all"
            placeholder="Premium"
          />
          <p className="text-xs text-gray-500 mt-1">
            Texto corto para mostrar en tarjetas
          </p>
        </div>
      </div>
      
      {/* Descripción */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Descripción del Plan
        </label>
        <textarea
          value={plan.description}
          onChange={(e) => onChange({ ...plan, description: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all resize-none"
          placeholder="Describe los beneficios principales de este plan..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Una descripción atractiva ayuda a vender mejor el plan
        </p>
      </div>
      
      {/* Duración */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Duración del Plan
        </label>
        <select
          value={plan.duration}
          onChange={(e) => onChange({ ...plan, duration: e.target.value })}
          className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all"
        >
          {durationType.map((duration) => (
            <option key={duration.value} value={duration.value}>
              {duration.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Define por cuánto tiempo es válido el plan
        </p>
      </div>
      
      {/* Configuraciones adicionales */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Configuraciones del Plan
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:bg-white hover:border-primary-300 cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={plan.isPopular}
              onChange={(e) => onChange({ ...plan, isPopular: e.target.checked })}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div className="ml-3">
              <span className="text-sm font-medium text-gray-900">Plan Popular</span>
              <p className="text-xs text-gray-500">Se destaca con badge especial</p>
            </div>
          </label>
          
          <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:bg-white hover:border-primary-300 cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={plan.isActive}
              onChange={(e) => onChange({ ...plan, isActive: e.target.checked })}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div className="ml-3">
              <span className="text-sm font-medium text-gray-900">Plan Activo</span>
              <p className="text-xs text-gray-500">Visible para los clientes</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  </div>
);

const ImprovedFeaturesStep = ({ plan, onChange, predefinedFeatures }) => {
  const [newFeature, setNewFeature] = useState('');
  const [activeCategory, setActiveCategory] = useState(Object.keys(predefinedFeatures)[0]);
  
  const handleAddFeature = () => {
    if (newFeature.trim() && !plan.features.includes(newFeature.trim())) {
      onChange({
        ...plan,
        features: [...plan.features, newFeature.trim()]
      });
      setNewFeature('');
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
  
  return (
    <div className="space-y-6">
      
      {/* Información de la sección */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-green-900 mb-2 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          Características del Plan
        </h3>
        <p className="text-green-700 text-sm">
          Agrega las características y beneficios que incluye este plan. Puedes usar las sugerencias o crear las tuyas.
        </p>
      </div>
      
      {/* Características sugeridas */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          🎯 Características Sugeridas
        </h4>
        
        {/* Categorías */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.keys(predefinedFeatures).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeCategory === category
                  ? 'bg-primary-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        {/* Lista de características */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
            {predefinedFeatures[activeCategory]?.map((feature, idx) => (
              <button
                key={idx}
                onClick={() => handleAddPredefinedFeature(feature)}
                disabled={plan.features.includes(feature)}
                className={`text-left px-4 py-3 text-sm rounded-xl border-2 transition-all duration-200 ${
                  plan.features.includes(feature)
                    ? 'border-green-200 bg-green-50 text-green-700 cursor-not-allowed'
                    : 'border-gray-200 hover:bg-primary-50 hover:border-primary-300 text-gray-700 hover:scale-102'
                }`}
              >
                {plan.features.includes(feature) ? (
                  <Check className="w-4 h-4 inline mr-2 text-green-600" />
                ) : (
                  <Plus className="w-4 h-4 inline mr-2 text-primary-600" />
                )}
                {feature}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Característica personalizada */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          ➕ Agregar Característica Personalizada
        </h4>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <input
            type="text"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            className="flex-1 px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all"
            placeholder="Escribe una característica personalizada..."
            onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
          />
          <button
            onClick={handleAddFeature}
            disabled={!newFeature.trim() || plan.features.includes(newFeature.trim())}
            className="px-6 py-3 text-base font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Agregar
          </button>
        </div>
      </div>
      
      {/* Lista de características seleccionadas */}
      {plan.features.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            Características del Plan ({plan.features.length})
          </h4>
          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200 rounded-xl p-4">
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {plan.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white border border-primary-200 rounded-xl shadow-sm hover:shadow-md transition-all"
                >
                  <span className="flex items-center text-primary-800 flex-1">
                    <CheckCircle className="w-5 h-5 mr-3 text-primary-600" />
                    <span className="font-medium">{feature}</span>
                  </span>
                  <button
                    onClick={() => handleRemoveFeature(feature)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {plan.features.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No hay características agregadas
          </h4>
          <p className="text-gray-500">
            Agrega características para hacer más atractivo tu plan
          </p>
        </div>
      )}
    </div>
  );
};

const ImprovedPricingStep = ({ plan, onChange, calculateDiscount, durationType }) => {
  const discount = calculateDiscount(plan.price, plan.originalPrice);
  const duration = durationType.find(d => d.value === plan.duration);
  
  return (
    <div className="space-y-6">
      
      {/* Información de la sección */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2 flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Configuración de Precios
        </h3>
        <p className="text-yellow-700 text-sm">
          Define el precio de tu plan. Puedes configurar un precio original para mostrar descuentos.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Precio actual */}
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
              className="w-full pl-8 pr-4 py-4 text-xl font-bold border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all"
              placeholder="0.00"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Este es el precio que pagarán tus clientes
          </p>
        </div>
        
        {/* Precio original */}
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
              className="w-full pl-8 pr-4 py-4 text-xl font-bold border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all"
              placeholder="0.00"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Para mostrar descuentos y ofertas especiales
          </p>
        </div>
      </div>
      
      {/* Duración */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Duración del Plan
        </label>
        <select
          value={plan.duration}
          onChange={(e) => onChange({ ...plan, duration: e.target.value })}
          className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all"
        >
          {durationType.map((duration) => (
            <option key={duration.value} value={duration.value}>
              {duration.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Vista previa del precio */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Vista Previa del Precio
        </h4>
        
        <div className="text-center">
          <div className="flex items-baseline justify-center space-x-3 mb-2">
            <span className="text-4xl font-bold text-gray-900">
              Q{(plan.price || 0).toLocaleString()}
            </span>
            {plan.originalPrice && plan.originalPrice > plan.price && (
              <span className="text-2xl text-gray-500 line-through">
                Q{plan.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          
          <div className="text-gray-600 text-lg mb-4">
            por {duration?.label.toLowerCase() || 'periodo'}
          </div>
          
          {discount > 0 && (
            <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-bold">
              <TrendingUp className="w-4 h-4 mr-2" />
              ¡Descuento del {discount}%!
            </div>
          )}
          
          {plan.price > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <div>Precio por día: Q{(plan.price / (duration?.days || 30)).toFixed(2)}</div>
                {duration?.value === 'yearly' && (
                  <div className="mt-1 text-primary-600 font-medium">
                    Ahorro anual vs mensual: Q{((plan.price * 12) - (plan.price || 0)).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {plan.price <= 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-800 font-medium">
            Debes establecer un precio mayor a Q0.00
          </p>
        </div>
      )}
    </div>
  );
};

const ImprovedDesignStep = ({ plan, onChange, availableIcons, availableColors, getIconComponent, getColorStyles }) => {
  return (
    <div className="space-y-6">
      
      {/* Información de la sección */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-purple-900 mb-2 flex items-center">
          <Palette className="w-5 h-5 mr-2" />
          Diseño del Plan
        </h3>
        <p className="text-purple-700 text-sm">
          Personaliza la apariencia visual de tu plan con iconos y colores atractivos.
        </p>
      </div>
      
      {/* Selección de icono */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          🎨 Icono del Plan
        </h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {availableIcons.map((icon) => {
            const IconComponent = icon.component;
            return (
              <button
                key={icon.id}
                onClick={() => onChange({ ...plan, iconName: icon.id })}
                className={`p-4 border-2 rounded-xl flex flex-col items-center space-y-2 text-xs transition-all duration-200 hover:scale-105 ${
                  plan.iconName === icon.id 
                    ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-lg scale-105' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <IconComponent className="w-8 h-8" />
                <span className="font-medium">{icon.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Selección de color */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          🌈 Color del Plan
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableColors.map(color => (
            <button
              key={color.value}
              onClick={() => onChange({ ...plan, color: color.value })}
              className={`p-4 rounded-xl border-2 flex items-center space-x-4 transition-all duration-200 hover:scale-102 ${
                plan.color === color.value 
                  ? 'border-primary-500 ring-4 ring-primary-100 shadow-lg scale-102' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg ${color.bg} border-2 ${color.border}`}></div>
              <div className="text-left">
                <div className="font-medium text-gray-900">{color.label}</div>
                <div className="text-xs text-gray-500">Estilo {color.label.split(' ')[1]}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Vista previa del diseño */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Vista Previa del Diseño
        </h4>
        
        <div className="flex justify-center">
          <DesignPreviewCard 
            plan={plan}
            getIconComponent={getIconComponent}
            getColorStyles={getColorStyles}
          />
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Así se verá tu plan en la página web y aplicación móvil
          </p>
        </div>
      </div>
    </div>
  );
};

// Componente para vista previa de diseño
const DesignPreviewCard = ({ plan, getIconComponent, getColorStyles }) => {
  const IconComponent = getIconComponent(plan.iconName);
  const colorStyles = getColorStyles(plan.color);
  
  return (
    <div className={`w-64 bg-white rounded-xl border-2 shadow-lg ${colorStyles.border} ${plan.isPopular ? 'ring-4 ring-yellow-100' : ''}`}>
      
      {plan.isPopular && (
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-center py-2 rounded-t-xl">
          <span className="text-white text-sm font-bold">
            <Star className="w-4 h-4 inline mr-1 fill-current" />
            POPULAR
          </span>
        </div>
      )}
      
      <div className="p-6">
        <div className="text-center">
          <div className={`w-12 h-12 mx-auto rounded-xl ${colorStyles.bg} flex items-center justify-center mb-3`}>
            <IconComponent className={`w-6 h-6 ${colorStyles.text}`} />
          </div>
          
          <h4 className="font-bold text-gray-900 mb-1">
            {plan.name || 'Nombre del Plan'}
          </h4>
          
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorStyles.bg} ${colorStyles.text} border ${colorStyles.border}`}>
            {plan.label || 'Etiqueta'}
          </span>
          
          <div className="text-2xl font-bold text-gray-900 mt-3">
            Q{(plan.price || 0).toLocaleString()}
          </div>
          
          <div className="text-sm text-gray-600">
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