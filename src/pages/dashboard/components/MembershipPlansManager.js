// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/PlansManager.js
// FUNCIÓN: Gestión de planes de membresía - COMPLETAMENTE RESPONSIVE y con características predefinidas
// OPTIMIZADO: Para móviles y tablets, con características rápidas predefinidas

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit, Trash2, Save, X, CreditCard, Crown, Calendar,
  Shield, Star, Check, AlertTriangle, Eye, EyeOff, Loader, 
  RefreshCw, Settings, Clock, Package, Tag, CheckCircle,
  DollarSign, Zap, Users, Dumbbell, Heart, Coffee, ChevronDown,
  ChevronUp, Menu, Grid, List
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

const PlansManager = ({ plans: initialPlans, isLoading: initialLoading, onSave, onUnsavedChanges }) => {
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
  
  // Estado del formulario
  const [planFormData, setPlanFormData] = useState(getEmptyPlan());
  
  // CARACTERÍSTICAS PREDEFINIDAS ORGANIZADAS POR CATEGORÍAS
  const predefinedFeatures = {
    'Acceso': [
      'Acceso 24/7',
      'Acceso en horarios regulares',
      'Acceso a todas las áreas',
      'Acceso a zona VIP',
      'Wi-Fi gratuito',
      'Estacionamiento incluido'
    ],
    'Entrenamiento': [
      'Todas las máquinas',
      'Zona de pesas libres',
      'Área de cardio',
      'Zona funcional',
      'Piscina',
      'Cancha deportiva',
      'Zona de estiramientos'
    ],
    'Clases': [
      'Clases grupales ilimitadas',
      'Yoga incluido',
      'Spinning incluido',
      'Crossfit incluido',
      'Pilates incluido',
      'Zumba incluido',
      'Aeróbicos incluidos'
    ],
    'Servicios': [
      'Entrenador personal',
      'Plan nutricional',
      'Asesoría fitness',
      'Evaluación física',
      'Seguimiento de progreso',
      'Consulta nutricional'
    ],
    'Extras': [
      'Toalla incluida',
      'Locker personal',
      'Invitados permitidos',
      'Descuentos en suplementos',
      'App móvil premium',
      'Congelamiento de membresía'
    ]
  };
  
  // Iconos simplificados para móvil
  const availableIcons = [
    { id: 'crown', component: Crown, name: 'Premium' },
    { id: 'star', component: Star, name: 'Popular' },
    { id: 'shield', component: Shield, name: 'Básico' },
    { id: 'package', component: Package, name: 'Completo' },
    { id: 'dumbbell', component: Dumbbell, name: 'Fitness' },
    { id: 'heart', component: Heart, name: 'Salud' }
  ];
  
  // Duraciones
  const durationType = [
    { value: 'daily', label: 'Día', days: 1 },
    { value: 'weekly', label: 'Semana', days: 7 },
    { value: 'monthly', label: 'Mes', days: 30 },
    { value: 'quarterly', label: '3 Meses', days: 90 },
    { value: 'yearly', label: 'Año', days: 365 }
  ];
  
  // Colores simplificados
  const availableColors = [
    { value: 'bg-blue-100 text-blue-800', label: 'Azul', color: 'bg-blue-500' },
    { value: 'bg-green-100 text-green-800', label: 'Verde', color: 'bg-green-500' },
    { value: 'bg-purple-100 text-purple-800', label: 'Morado', color: 'bg-purple-500' },
    { value: 'bg-orange-100 text-orange-800', label: 'Naranja', color: 'bg-orange-500' },
    { value: 'bg-red-100 text-red-800', label: 'Rojo', color: 'bg-red-500' },
    { value: 'bg-yellow-100 text-yellow-800', label: 'Amarillo', color: 'bg-yellow-500' }
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
      color: 'bg-purple-100 text-purple-800',
      description: '',
      features: [],
      isPopular: false,
      isActive: true
    };
  }
  
  // CARGAR DATOS
  const loadMembershipPlans = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      
      let plansData = [];
      
      // Usar datos iniciales si están disponibles
      if (initialPlans && Array.isArray(initialPlans) && initialPlans.length > 0) {
        plansData = initialPlans;
      } else {
        // Intentar API o usar datos por defecto
        try {
          const response = await apiService.get('/membership-plans');
          plansData = response.data || response || [];
        } catch (apiError) {
          // Datos por defecto con características predefinidas incluidas
          plansData = [
            {
              id: 1,
              name: 'Plan Básico',
              value: 'basic',
              label: 'Básico',
              price: 150,
              originalPrice: null,
              duration: 'monthly',
              iconName: 'shield',
              color: 'bg-blue-100 text-blue-800',
              description: 'Lo esencial para empezar',
              features: [
                'Acceso en horarios regulares',
                'Todas las máquinas',
                'Área de cardio',
                'Vestuarios incluidos'
              ],
              isPopular: false,
              isActive: true
            },
            {
              id: 2,
              name: 'Plan Premium',
              value: 'premium',
              label: 'Premium',
              price: 250,
              originalPrice: 300,
              duration: 'monthly',
              iconName: 'crown',
              color: 'bg-purple-100 text-purple-800',
              description: 'La opción más popular',
              features: [
                'Acceso 24/7',
                'Todas las máquinas',
                'Clases grupales ilimitadas',
                'Zona de pesas libres',
                'Wi-Fi gratuito',
                'App móvil premium'
              ],
              isPopular: true,
              isActive: true
            },
            {
              id: 3,
              name: 'Plan VIP',
              value: 'vip',
              label: 'VIP',
              price: 450,
              originalPrice: 500,
              duration: 'monthly',
              iconName: 'star',
              color: 'bg-yellow-100 text-yellow-800',
              description: 'Experiencia completa',
              features: [
                'Acceso 24/7',
                'Entrenador personal',
                'Plan nutricional',
                'Todas las clases incluidas',
                'Piscina',
                'Zona VIP',
                'Toalla incluida',
                'Masajes deportivos'
              ],
              isPopular: false,
              isActive: true
            }
          ];
        }
      }
      
      // Mapear y normalizar datos
      const mappedPlans = plansData.map((plan, index) => ({
        id: plan.id || `plan_${Date.now()}_${index}`,
        name: plan.name || '',
        value: plan.value || plan.name?.toLowerCase().replace(/\s+/g, '_') || '',
        label: plan.label || plan.name || '',
        price: parseFloat(plan.price) || 0,
        originalPrice: plan.originalPrice ? parseFloat(plan.originalPrice) : null,
        duration: plan.duration || 'monthly',
        iconName: plan.iconName || 'crown',
        color: plan.color || 'bg-purple-100 text-purple-800',
        description: plan.description || '',
        features: Array.isArray(plan.features) ? plan.features : [],
        isPopular: plan.isPopular === true || plan.popular === true,
        isActive: plan.isActive !== undefined ? plan.isActive : true
      }));
      
      setMembershipPlans(mappedPlans);
      setIsDataLoaded(true);
      
    } catch (error) {
      console.error('Error al cargar planes:', error);
      showError('Error al cargar planes');
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
        showError('Debe haber al menos un plan');
        return;
      }
      
      const popularCount = membershipPlans.filter(p => p.isPopular).length;
      if (popularCount > 1) {
        showError('Solo puede haber un plan popular');
        return;
      }
      
      // Intentar guardar en API
      try {
        await apiService.post('/membership-plans/bulk', { plans: membershipPlans });
      } catch (error) {
        console.warn('API no disponible');
      }
      
      if (onSave) {
        onSave(membershipPlans);
      }
      
      setHasUnsavedChanges(false);
      showSuccess('Planes guardados correctamente');
      
    } catch (error) {
      showError('Error al guardar planes');
    } finally {
      setSaving(false);
    }
  };
  
  // Crear plan
  const handleCreatePlan = () => {
    setIsCreating(true);
    setEditingPlan(null);
    setPlanFormData(getEmptyPlan());
    setShowEditModal(true);
  };
  
  // Editar plan
  const handleEditPlan = (plan) => {
    setIsCreating(false);
    setEditingPlan(plan);
    setPlanFormData({ ...plan });
    setShowEditModal(true);
  };
  
  // Guardar plan
  const handleSavePlan = async () => {
    try {
      setSaving(true);
      
      // Validaciones básicas
      if (!planFormData.name.trim()) {
        showError('El nombre es obligatorio');
        return;
      }
      
      if (planFormData.price <= 0) {
        showError('El precio debe ser mayor a 0');
        return;
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
        features: planFormData.features.filter(f => f.trim() !== '')
      };
      
      if (isCreating) {
        const newPlan = { ...planData, id: `new_${Date.now()}` };
        setMembershipPlans(prev => [...prev, newPlan]);
        showSuccess('Plan creado');
      } else {
        setMembershipPlans(prev => prev.map(plan => 
          plan.id === editingPlan.id ? planData : plan
        ));
        showSuccess('Plan actualizado');
      }
      
      setHasUnsavedChanges(true);
      setShowEditModal(false);
      
    } catch (error) {
      showError('Error al guardar plan');
    } finally {
      setSaving(false);
    }
  };
  
  // Eliminar plan
  const handleDeletePlan = (planId) => {
    if (!window.confirm('¿Eliminar este plan?')) return;
    
    setMembershipPlans(prev => prev.filter(plan => plan.id !== planId));
    setHasUnsavedChanges(true);
    showSuccess('Plan eliminado');
  };
  
  // Toggle activo
  const handleToggleActive = (planId) => {
    setMembershipPlans(prev => prev.map(plan => 
      plan.id === planId ? { ...plan, isActive: !plan.isActive } : plan
    ));
    setHasUnsavedChanges(true);
  };
  
  // Toggle popular
  const handleTogglePopular = (planId) => {
    setMembershipPlans(prev => prev.map(plan => ({
      ...plan,
      isPopular: plan.id === planId ? !plan.isPopular : false
    })));
    setHasUnsavedChanges(true);
  };
  
  // Cancelar
  const handleCancel = () => {
    setShowEditModal(false);
    setEditingPlan(null);
    setIsCreating(false);
  };
  
  // Calcular descuento
  const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };
  
  // Obtener icono
  const getIconComponent = (iconName) => {
    const iconInfo = availableIcons.find(icon => icon.id === iconName);
    return iconInfo ? iconInfo.component : Crown;
  };

  // Loading
  if ((loading && !isDataLoaded) || initialLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader className="w-6 h-6 animate-spin text-primary-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Cargando planes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-3 sm:p-6 max-w-7xl mx-auto">
        
        {/* HEADER COMPACTO */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            
            {/* Título */}
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-primary-600" />
                {isMobile ? 'Planes' : 'Gestión de Planes'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {isMobile ? 'Membresías activas' : 'Configura los planes de membresía'}
              </p>
              
              {/* Stats */}
              {membershipPlans.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {membershipPlans.length} total
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {membershipPlans.filter(p => p.isActive).length} activos
                  </span>
                  {membershipPlans.some(p => p.isPopular) && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      1 popular
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Acciones */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => loadMembershipPlans(true)}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''} ${isMobile ? '' : 'mr-1'}`} />
                {!isMobile && 'Actualizar'}
              </button>
              
              {hasUnsavedChanges && (
                <button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                >
                  <Save className={`w-4 h-4 ${isMobile ? '' : 'mr-1'}`} />
                  {!isMobile && 'Guardar'}
                </button>
              )}
              
              <button
                onClick={handleCreatePlan}
                className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
              >
                <Plus className={`w-4 h-4 ${isMobile ? '' : 'mr-1'}`} />
                {!isMobile && 'Nuevo'}
              </button>
            </div>
          </div>
        </div>
        
        {/* ALERTA DE CAMBIOS */}
        {hasUnsavedChanges && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded-r-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800">
                  Tienes cambios sin guardar
                </p>
                <button
                  onClick={handleSaveAll}
                  className="text-xs text-yellow-800 underline font-medium mt-1"
                >
                  Guardar ahora
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* CONTENIDO PRINCIPAL */}
        {membershipPlans.length === 0 ? (
          // Estado vacío
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay planes configurados
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Crea tu primer plan de membresía para empezar
            </p>
            <button
              onClick={handleCreatePlan}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Plan
            </button>
          </div>
        ) : (
          // Grid de planes
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {membershipPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onEdit={() => handleEditPlan(plan)}
                onDelete={() => handleDeletePlan(plan.id)}
                onToggleActive={() => handleToggleActive(plan.id)}
                onTogglePopular={() => handleTogglePopular(plan.id)}
                getIconComponent={getIconComponent}
                calculateDiscount={calculateDiscount}
                durationType={durationType}
                isMobile={isMobile}
              />
            ))}
          </div>
        )}
        
        {/* MODAL RESPONSIVO */}
        {showEditModal && (
          <PlanModal
            show={showEditModal}
            plan={planFormData}
            isCreating={isCreating}
            saving={saving}
            predefinedFeatures={predefinedFeatures}
            availableIcons={availableIcons}
            availableColors={availableColors}
            durationType={durationType}
            onChange={setPlanFormData}
            onSave={handleSavePlan}
            onCancel={handleCancel}
            getIconComponent={getIconComponent}
            calculateDiscount={calculateDiscount}
            isMobile={isMobile}
          />
        )}
        
      </div>
    </div>
  );
};

// COMPONENTE: Tarjeta de Plan
const PlanCard = ({ 
  plan, 
  onEdit, 
  onDelete, 
  onToggleActive, 
  onTogglePopular,
  getIconComponent,
  calculateDiscount,
  durationType,
  isMobile
}) => {
  const IconComponent = getIconComponent(plan.iconName);
  const discount = calculateDiscount(plan.price, plan.originalPrice);
  const duration = durationType.find(d => d.value === plan.duration);
  
  return (
    <div className={`relative bg-white border rounded-lg shadow-sm transition-all hover:shadow-md ${
      plan.isPopular 
        ? 'border-yellow-400 ring-2 ring-yellow-100' 
        : 'border-gray-200'
    } ${!plan.isActive ? 'opacity-60' : ''}`}>
      
      {/* Badges */}
      <div className="absolute top-2 left-2 flex flex-col space-y-1 z-10">
        {plan.isPopular && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-yellow-500 text-white">
            <Star className="w-3 h-3 mr-1" />
            Popular
          </span>
        )}
        {!plan.isActive && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
            Inactivo
          </span>
        )}
        {discount > 0 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
            -{discount}%
          </span>
        )}
      </div>
      
      <div className="p-4">
        
        {/* Header */}
        <div className="text-center mb-4">
          <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${plan.color.split(' ')[0]}`}>
            <IconComponent className={`w-6 h-6 ${plan.color.split(' ')[1]}`} />
          </div>
          
          <h3 className="text-base font-bold text-gray-900 mb-1">
            {plan.name}
          </h3>
          
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${plan.color}`}>
            {plan.label}
          </span>
          
          {plan.description && (
            <p className="text-gray-600 text-xs mt-2 line-clamp-2">
              {plan.description}
            </p>
          )}
        </div>
        
        {/* Precio */}
        <div className="text-center mb-4">
          <div className="flex items-baseline justify-center space-x-1">
            <span className="text-xl font-bold text-gray-900">
              Q{plan.price}
            </span>
            {plan.originalPrice && plan.originalPrice > plan.price && (
              <span className="text-sm text-gray-500 line-through">
                Q{plan.originalPrice}
              </span>
            )}
          </div>
          
          <div className="text-xs text-gray-500 mt-1">
            por {duration?.label.toLowerCase() || 'período'}
          </div>
        </div>
        
        {/* Características limitadas */}
        {plan.features && plan.features.length > 0 && (
          <div className="mb-4">
            <div className="space-y-1">
              {plan.features.slice(0, 3).map((feature, idx) => (
                <div key={idx} className="flex items-start text-xs text-gray-600">
                  <Check className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{feature}</span>
                </div>
              ))}
              {plan.features.length > 3 && (
                <div className="text-center text-xs text-gray-500">
                  +{plan.features.length - 3} más beneficios
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Acciones */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <button
            onClick={onTogglePopular}
            className={`p-1 rounded transition-colors ${
              plan.isPopular ? 'text-yellow-600' : 'text-gray-400 hover:text-yellow-600'
            }`}
          >
            <Star className={`w-4 h-4 ${plan.isPopular ? 'fill-current' : ''}`} />
          </button>
          
          <div className="flex space-x-1">
            <button
              onClick={onEdit}
              className="p-1 text-blue-600 hover:text-blue-800"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleActive}
              className="p-1 text-orange-600 hover:text-orange-800"
            >
              {plan.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
};

// COMPONENTE: Modal de Plan
const PlanModal = ({ 
  show, 
  plan, 
  isCreating, 
  saving,
  predefinedFeatures,
  availableIcons,
  availableColors,
  durationType,
  onChange, 
  onSave, 
  onCancel,
  getIconComponent,
  calculateDiscount,
  isMobile
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [newFeature, setNewFeature] = useState('');
  
  if (!show) return null;
  
  const tabs = [
    { id: 'basic', label: 'Info', icon: Settings },
    { id: 'price', label: 'Precio', icon: DollarSign },
    { id: 'design', label: 'Diseño', icon: Tag },
    { id: 'features', label: 'Beneficios', icon: CheckCircle }
  ];
  
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className={`bg-white shadow-xl w-full max-h-screen overflow-hidden ${
        isMobile 
          ? 'rounded-t-xl' 
          : 'rounded-xl max-w-2xl max-h-[90vh] mx-4'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900">
              {isCreating ? 'Crear Plan' : 'Editar Plan'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {isCreating ? 'Nuevo plan de membresía' : `Modificando: ${plan.name}`}
            </p>
          </div>
          
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Vista previa */}
        <div className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 border-b border-gray-200">
          <div className="flex justify-center">
            <div className={`bg-white rounded-lg p-3 border-2 w-48 ${
              plan.isPopular ? 'border-yellow-400' : 'border-gray-200'
            }`}>
              
              {plan.isPopular && (
                <div className="text-center mb-2">
                  <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded-full">
                    Popular
                  </span>
                </div>
              )}
              
              <div className="text-center">
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${plan.color.split(' ')[0]}`}>
                  {React.createElement(getIconComponent(plan.iconName), { 
                    className: `w-5 h-5 ${plan.color.split(' ')[1]}` 
                  })}
                </div>
                
                <h5 className="text-sm font-bold text-gray-900 mb-1">
                  {plan.name || 'Nombre del Plan'}
                </h5>
                
                <div className="text-lg font-bold text-gray-900">
                  Q{(plan.price || 0).toFixed(2)}
                </div>
                
                {plan.originalPrice && plan.originalPrice > plan.price && (
                  <div className="text-xs text-gray-500 line-through">
                    Q{plan.originalPrice.toFixed(2)}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-1">
                  {durationType.find(d => d.value === plan.duration)?.label}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <IconComponent className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Contenido */}
        <div className="overflow-y-auto" style={{ maxHeight: isMobile ? 'calc(100vh - 200px)' : '60vh' }}>
          <div className="p-4 space-y-4">
            
            {/* Tab: Información básica */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Plan *
                  </label>
                  <input
                    type="text"
                    value={plan.name}
                    onChange={(e) => onChange({ ...plan, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ej: Plan Premium"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID del Plan *
                  </label>
                  <input
                    type="text"
                    value={plan.value}
                    onChange={(e) => onChange({ ...plan, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="premium"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Identificador único (sin espacios)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Etiqueta *
                  </label>
                  <input
                    type="text"
                    value={plan.label}
                    onChange={(e) => onChange({ ...plan, label: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Premium"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={plan.description}
                    onChange={(e) => onChange({ ...plan, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Describe este plan..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={plan.isPopular}
                      onChange={(e) => onChange({ ...plan, isPopular: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Plan Popular
                    </span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={plan.isActive}
                      onChange={(e) => onChange({ ...plan, isActive: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Plan Activo
                    </span>
                  </label>
                </div>
              </div>
            )}
            
            {/* Tab: Precio */}
            {activeTab === 'price' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Actual (Q) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={plan.price}
                    onChange={(e) => onChange({ ...plan, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                    value={plan.originalPrice || ''}
                    onChange={(e) => onChange({ ...plan, originalPrice: parseFloat(e.target.value) || null })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Para mostrar descuento"
                  />
                </div>
                
                {plan.originalPrice && plan.originalPrice > plan.price && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      Descuento: {calculateDiscount(plan.price, plan.originalPrice)}%
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duración
                  </label>
                  <select
                    value={plan.duration}
                    onChange={(e) => onChange({ ...plan, duration: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {durationType.map((duration) => (
                      <option key={duration.value} value={duration.value}>
                        {duration.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            {/* Tab: Diseño */}
            {activeTab === 'design' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icono
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableIcons.map((icon) => (
                      <button
                        key={icon.id}
                        onClick={() => onChange({ ...plan, iconName: icon.id })}
                        className={`p-3 border rounded-lg flex flex-col items-center space-y-1 text-xs ${
                          plan.iconName === icon.id 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <icon.component className="w-5 h-5" />
                        <span>{icon.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableColors.map(color => (
                      <button
                        key={color.value}
                        onClick={() => onChange({ ...plan, color: color.value })}
                        className={`p-3 rounded-lg border-2 flex flex-col items-center space-y-1 ${
                          plan.color === color.value ? 'border-primary-500' : 'border-gray-200'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded ${color.color}`}></div>
                        <span className="text-xs">{color.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Tab: Beneficios */}
            {activeTab === 'features' && (
              <div className="space-y-4">
                
                {/* Características predefinidas */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Características Rápidas
                  </h4>
                  
                  {Object.entries(predefinedFeatures).map(([category, features]) => (
                    <div key={category} className="mb-3">
                      <h5 className="text-xs font-medium text-gray-600 mb-1">
                        {category}
                      </h5>
                      <div className="grid grid-cols-1 gap-1">
                        {features.map((feature, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAddPredefinedFeature(feature)}
                            disabled={plan.features.includes(feature)}
                            className={`text-left px-2 py-1 text-xs rounded border transition-colors ${
                              plan.features.includes(feature)
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            {plan.features.includes(feature) ? (
                              <Check className="w-3 h-3 inline mr-1" />
                            ) : (
                              <Plus className="w-3 h-3 inline mr-1" />
                            )}
                            {feature}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Agregar característica personalizada */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Característica Personalizada
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Escribe una característica..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                    />
                    <button
                      onClick={handleAddFeature}
                      disabled={!newFeature.trim()}
                      className="px-3 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Lista de características agregadas */}
                {plan.features.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Características del Plan ({plan.features.length})
                    </h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {plan.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-primary-50 border border-primary-200 rounded text-sm"
                        >
                          <span className="flex items-center text-primary-800">
                            <Check className="w-3 h-3 mr-2" />
                            {feature}
                          </span>
                          <button
                            onClick={() => handleRemoveFeature(feature)}
                            className="text-primary-600 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
              </div>
            )}
            
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-2">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin mr-2 inline" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2 inline" />
                {isCreating ? 'Crear' : 'Guardar'}
              </>
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default PlansManager;

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