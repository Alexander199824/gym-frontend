// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/PlanEditorModal.js
// Modal Editor para Planes de Membresía - Componente Separado

import React, { useState, useEffect, useRef } from 'react';
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
import { useApp } from '../../../contexts/AppContext';

const PlanEditorModal = ({ 
  show, 
  plan: initialPlan, 
  isCreating, 
  availableIcons,
  availableColors,
  durationType,
  onSave, 
  onCancel,
  getEmptyPlan,
  getIconComponent,
  getColorStyles,
  calculateDiscount,
  isMobile
}) => {
  const { showSuccess, showError } = useApp();
  
  // Estados del modal
  const [saving, setSaving] = useState(false);
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
  
  // Inicializar datos cuando se abre el modal
  useEffect(() => {
    if (show) {
      if (isCreating) {
        const emptyPlan = getEmptyPlan();
        setPlanFormData(emptyPlan);
        setOriginalFormData(emptyPlan);
      } else if (initialPlan) {
        const planCopy = { ...initialPlan };
        setPlanFormData(planCopy);
        setOriginalFormData(planCopy);
      }
      setModalStep(0);
      setFeatureSearch('');
    }
  }, [show, initialPlan, isCreating, getEmptyPlan]);
  
  // Funciones existentes
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
      if (event.key === 'Escape' && show) {
        event.preventDefault();
        event.stopPropagation();
        handleCancelWithConfirmation();
      }
    };
    
    if (show) {
      document.addEventListener('keydown', handleEscKey, true);
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleEscKey, true);
        document.body.style.overflow = originalStyle;
      };
    }
  }, [show, planFormData, originalFormData]);
  
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
  
  const handleCancel = () => {
    setPlanFormData(getEmptyPlan());
    setOriginalFormData(null);
    setModalStep(0);
    setFeatureSearch('');
    onCancel();
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
      
      onSave(planFormData);
      
    } catch (error) {
      console.error('Error al guardar plan:', error);
      showError('Error al guardar el plan');
    } finally {
      setSaving(false);
    }
  };
  
  if (!show) return null;
  
  const steps = [
    { id: 0, title: 'Info', icon: Info, description: 'Básica' },
    { id: 1, title: 'Características', icon: CheckCircle, description: 'Beneficios' },
    { id: 2, title: 'Precios', icon: DollarSign, description: 'Costos' },
    { id: 3, title: 'Diseño', icon: Palette, description: 'Visual' }
  ];
  
  const currentStep = steps[modalStep] || steps[0];
  
  const canContinueToNextStep = () => {
    switch (modalStep) {
      case 0: return planFormData.name.trim().length > 0;
      case 1: return true;
      case 2: return planFormData.price > 0;
      case 3: return true;
      default: return false;
    }
  };
  
  const canFinish = () => {
    return planFormData.name.trim().length > 0 && planFormData.price > 0;
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
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Progress compacto */}
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Paso {modalStep + 1} de {steps.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full h-1.5 transition-all duration-500"
              style={{ width: `${((modalStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Navegación por pasos compacta */}
        <div className="bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex">
            {steps.map((stepItem, index) => (
              <button
                key={stepItem.id}
                onClick={() => setModalStep(stepItem.id)}
                disabled={index > modalStep && !canContinueToNextStep()}
                className={`flex-1 px-2 py-2 text-xs font-medium border-b-2 transition-all duration-200 ${
                  modalStep === stepItem.id
                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                    : index < modalStep 
                      ? 'border-green-500 text-green-600 hover:bg-green-50'
                      : index === modalStep + 1 && canContinueToNextStep()
                        ? 'border-transparent text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                        : 'border-transparent text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-center space-x-1">
                  {index < modalStep ? (
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
              {modalStep === 0 && (
                <CompactBasicInfoStep 
                  plan={planFormData} 
                  onChange={setPlanFormData} 
                  durationType={durationType}
                />
              )}
              
              {modalStep === 1 && (
                <CompactFeaturesStep 
                  plan={planFormData}
                  onChange={setPlanFormData}
                  predefinedFeatures={predefinedFeatures}
                  featureSearch={featureSearch}
                  onFeatureSearchChange={setFeatureSearch}
                  getFilteredPredefinedFeatures={getFilteredPredefinedFeatures}
                />
              )}
              
              {modalStep === 2 && (
                <CompactPricingStep 
                  plan={planFormData} 
                  onChange={setPlanFormData} 
                  calculateDiscount={calculateDiscount}
                  durationType={durationType}
                />
              )}
              
              {modalStep === 3 && (
                <CompactDesignStep 
                  plan={planFormData} 
                  onChange={setPlanFormData}
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
                  plan={planFormData}
                  getIconComponent={getIconComponent}
                  getColorStyles={getColorStyles}
                  calculateDiscount={calculateDiscount}
                  durationType={durationType}
                />
              </div>
              
              {/* Validaciones compactas */}
              <div className="mt-4 space-y-1">
                <div className="flex items-center text-xs">
                  {planFormData.name.trim() ? (
                    <Check className="w-3 h-3 text-green-400 mr-1" />
                  ) : (
                    <X className="w-3 h-3 text-red-400 mr-1" />
                  )}
                  <span className="text-white/80">Nombre</span>
                </div>
                <div className="flex items-center text-xs">
                  {planFormData.price > 0 ? (
                    <Check className="w-3 h-3 text-green-400 mr-1" />
                  ) : (
                    <X className="w-3 h-3 text-red-400 mr-1" />
                  )}
                  <span className="text-white/80">Precio</span>
                </div>
                <div className="flex items-center text-xs">
                  <span className="text-white/80">{planFormData.features.length} características</span>
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
                onClick={handleCancel}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              
              {modalStep > 0 && (
                <button
                  onClick={() => setModalStep(modalStep - 1)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {modalStep < steps.length - 1 ? (
                <button
                  onClick={() => setModalStep(modalStep + 1)}
                  disabled={!canContinueToNextStep()}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              ) : (
                <button
                  onClick={handleSavePlan}
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

export default PlanEditorModal;