// src/pages/checkout/CheckoutPage.js
// FUNCIÓN: Página de checkout COMPLETA - Payment methods según enum de DB
// FIX: ✅ 'card' cambiado por 'online_card' según enum PostgreSQL
// GUATEMALA: ✅ Implementación completa de departamentos y municipios
// FIX: ✅ Corregidos bucles infinitos en useEffect

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  User, 
  MapPin, 
  Package, 
  ArrowLeft, 
  Lock, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  Home,
  Shield,
  Truck,
  Store,
  Map,
  X,
  Info
} from 'lucide-react';

import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

// ✅ IMPORTAR DATOS COMPLETOS DE GUATEMALA
import { 
  GUATEMALA_LOCATIONS,
  DEPARTMENTS,
  getMunicipalitiesByDepartment,
  getPostalCode,
  isValidMunicipality,
  getFastShippingDepartments,
  getMetropolitanDepartments
} from '../../data/guatemalaLocations';

// Importar Stripe
import { loadStripe } from '@stripe/stripe-js';
import { 
  Elements, 
  CardElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';

// REGEX MEJORADOS - MÁS FLEXIBLES
const VALIDATION_PATTERNS = {
  name: /^[A-Za-zÀ-ÿ\u00f1\u00d1\s\-'\.]+$/, 
  phone: /^[\d\s\-\(\)\+]+$/, 
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
  address: /^[A-Za-zÀ-ÿ\u00f1\u00d1\d\s\-.,#°\/]+$/ 
};

// MENSAJES DE ERROR MEJORADOS
const ERROR_MESSAGES = {
  name: 'Solo se permiten letras, espacios, acentos, guiones y puntos',
  phone: 'Solo se permiten números, espacios, guiones y paréntesis',
  email: 'Ingresa un email válido (ejemplo@correo.com)',
  address: 'Ingresa una dirección válida',
  required: 'Este campo es requerido',
  minLength: 'Debe tener al menos {min} caracteres',
  phoneLength: 'El teléfono debe tener entre 7 y 15 dígitos'
};

// Opciones de entrega mejoradas
const DELIVERY_OPTIONS = {
  pickup_store: {
    id: 'pickup_store',
    name: 'Recoger en tienda',
    description: 'Retira tu pedido en nuestras instalaciones',
    icon: Store,
    cost: 0,
    timeframe: 'Listo en 2-4 horas',
    address: '5ta Avenida 12-34, Zona 10, Guatemala',
    hours: 'Lun-Vie 6:00-20:00, Sáb 6:00-18:00',
    color: 'green'
  },
  local_delivery: {
    id: 'local_delivery',
    name: 'Envío local',
    description: 'Entrega en Guatemala y municipios cercanos',
    icon: Truck,
    cost: 25,
    timeframe: '1-2 días hábiles',
    coverage: 'Ciudad de Guatemala y alrededores',
    color: 'blue'
  },
  national_delivery: {
    id: 'national_delivery',
    name: 'Envío departamental',
    description: 'Entrega a todo el territorio nacional',
    icon: Map,
    cost: 45,
    timeframe: '3-5 días hábiles',
    coverage: 'Todos los departamentos de Guatemala',
    color: 'purple'
  }
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { 
    items, 
    summary, 
    isEmpty, 
    formatCurrency, 
    clearCart,
    sessionInfo 
  } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError, showInfo, isMobile } = useApp();

  // ✅ FIX: Ref para prevenir múltiples inicializaciones de Stripe
  const stripeInitialized = useRef(false);
  const stripeInitializing = useRef(false);
  const isInitialMount = useRef(true);

  // Estados principales
  const [step, setStep] = useState(1); // 1: Info, 2: Payment, 3: Confirmation
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCreated, setOrderCreated] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);

  // Estados del formulario con validación mejorada
  const [customerInfo, setCustomerInfo] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  // ✅ GUATEMALA: Usar datos completos de Guatemala
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '', 
    state: '', // Departamento
    municipality: '', // Municipio
    zipCode: '', 
    reference: ''
  });

  // Estado para método de entrega
  const [deliveryMethod, setDeliveryMethod] = useState('pickup_store');
  // ✅ FIX: Cambiar valor inicial de 'card' a 'cash_on_delivery'
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [notes, setNotes] = useState('');
  
  // Estados de validación
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // ✅ GUATEMALA: Estados para datos de Guatemala
  const [availableMunicipalities, setAvailableMunicipalities] = useState([]);

  // ✅ FIX: Funciones memoizadas para evitar re-renders
  const memoizedShowInfo = useCallback((message) => {
    if (showInfo) showInfo(message);
  }, [showInfo]);

  const memoizedShowError = useCallback((message) => {
    if (showError) showError(message);
  }, [showError]);

  // ✅ DEBUG: Verificar que los datos de Guatemala se carguen correctamente
  useEffect(() => {
    if (isInitialMount.current) {
      console.log('🇬🇹 Verificando datos de Guatemala...');
      console.log('Departamentos disponibles:', DEPARTMENTS?.length || 0);
      console.log('Primer departamento:', DEPARTMENTS?.[0]);
      console.log('Datos completos cargados:', Object.keys(GUATEMALA_LOCATIONS || {}).length);
      
      if (DEPARTMENTS && DEPARTMENTS.length > 0) {
        console.log('✅ Datos de Guatemala cargados correctamente');
      } else {
        console.error('❌ Error: No se cargaron los datos de Guatemala');
      }
      
      isInitialMount.current = false;
    }
  }, []); // Solo en mount inicial

  // ✅ FIX: EFECTO Stripe SIN funciones externas como dependencias
  useEffect(() => {
    const initializeStripe = async () => {
      // ✅ Prevenir múltiples inicializaciones
      if (stripeInitialized.current || stripeInitializing.current) {
        return;
      }

      try {
        stripeInitializing.current = true;
        console.log('💳 Initializing Stripe configuration...');
        
        const stripeConfig = await apiService.getStripeConfig();
        
        if (stripeConfig?.data?.stripe?.enabled) {
          const publishableKey = stripeConfig.data.stripe.publishableKey;
          console.log('🔑 Loading Stripe with publishable key...');
          
          const stripe = await loadStripe(publishableKey);
          setStripePromise(Promise.resolve(stripe));
          console.log('✅ Stripe loaded successfully');
          
          // ✅ FIX: Llamar funciones SIN usar en dependencias
          setTimeout(() => {
            if (showInfo) showInfo('💳 Pagos con tarjeta disponibles');
          }, 100);
        } else {
          console.warn('⚠️ Stripe not enabled on backend');
          setTimeout(() => {
            if (showInfo) showInfo('💰 Solo pagos en efectivo disponibles');
          }, 100);
        }
        
        // ✅ Marcar como inicializado exitosamente
        stripeInitialized.current = true;
        
      } catch (error) {
        console.error('❌ Error loading Stripe:', error);
        setTimeout(() => {
          if (showError) showError('Error cargando sistema de pagos con tarjeta');
        }, 100);
      } finally {
        stripeInitializing.current = false;
      }
    };

    initializeStripe();
  }, []); // ✅ FIX: Array vacío - no depende de funciones externas

  // ✅ FIX: EFECTO carrito vacío SIN showInfo como dependencia
  useEffect(() => {
    if (isEmpty) {
      console.log('🛒 Carrito está vacío, redirigiendo...');
      setTimeout(() => {
        if (showInfo) showInfo('Tu carrito está vacío');
      }, 100);
      navigate('/store');
    }
  }, [isEmpty, navigate]); // ✅ FIX: Removido showInfo de dependencias

  // ✅ FIX: GUATEMALA - EFECTO para municipios con mejores controles
  const updateMunicipalities = useCallback((departmentName) => {
    console.log('🏛️ Actualizando municipios para:', departmentName);
    
    if (departmentName && DEPARTMENTS.includes(departmentName)) {
      const municipalities = getMunicipalitiesByDepartment(departmentName);
      console.log('🏘️ Municipios encontrados:', municipalities.length);
      setAvailableMunicipalities(municipalities);
      
      // Auto-update postal code
      const postalCode = getPostalCode(departmentName);
      console.log('📮 Código postal asignado:', postalCode);
      
      // Update address state ONLY if needed to avoid loops
      setShippingAddress(prev => {
        if (prev.zipCode !== postalCode) {
          return { ...prev, zipCode: postalCode };
        }
        return prev;
      });
    } else {
      console.log('🧹 Limpiando municipios - no hay departamento válido');
      setAvailableMunicipalities([]);
    }
  }, []); // No dependencies to avoid loops

  // ✅ FIX: Efecto SEPARADO para cambios de departamento
  useEffect(() => {
    updateMunicipalities(shippingAddress.state);
  }, [shippingAddress.state, updateMunicipalities]);

  // ✅ FIX: Efecto SEPARADO para reset de municipio cuando cambia departamento
  useEffect(() => {
    if (shippingAddress.state && shippingAddress.municipality) {
      const municipalities = getMunicipalitiesByDepartment(shippingAddress.state);
      if (!municipalities.includes(shippingAddress.municipality)) {
        console.log('🔄 Reseteando municipio porque no pertenece al nuevo departamento');
        setShippingAddress(prev => ({
          ...prev,
          municipality: '',
          city: ''
        }));
      }
    }
  }, [shippingAddress.state]); // Solo depende del state, no del municipality

  // FUNCIÓN MEJORADA: Validar un campo específico
  const validateField = (name, value) => {
    const fieldErrors = {};

    switch (name) {
      case 'name':
        if (!value.trim()) {
          fieldErrors[name] = ERROR_MESSAGES.required;
        } else if (value.trim().length < 2) {
          fieldErrors[name] = ERROR_MESSAGES.minLength.replace('{min}', '2');
        } else if (!VALIDATION_PATTERNS.name.test(value)) {
          fieldErrors[name] = ERROR_MESSAGES.name;
        }
        break;

      case 'email':
        if (!value.trim()) {
          fieldErrors[name] = ERROR_MESSAGES.required;
        } else if (!VALIDATION_PATTERNS.email.test(value)) {
          fieldErrors[name] = ERROR_MESSAGES.email;
        }
        break;

      case 'phone':
        if (!value.trim()) {
          fieldErrors[name] = ERROR_MESSAGES.required;
        } else {
          const cleanPhone = value.replace(/[\s\-\(\)\+]/g, '');
          if (cleanPhone.length < 7 || cleanPhone.length > 15) {
            fieldErrors[name] = ERROR_MESSAGES.phoneLength;
          } else if (!VALIDATION_PATTERNS.phone.test(value)) {
            fieldErrors[name] = ERROR_MESSAGES.phone;
          }
        }
        break;

      case 'street':
        // Solo validar si el método de entrega requiere dirección
        if (deliveryMethod !== 'pickup_store') {
          if (!value.trim()) {
            fieldErrors[name] = ERROR_MESSAGES.required;
          } else if (value.trim().length < 5) {
            fieldErrors[name] = ERROR_MESSAGES.minLength.replace('{min}', '5');
          }
        }
        break;

      case 'municipality':
        // Solo validar si el método de entrega requiere dirección
        if (deliveryMethod !== 'pickup_store') {
          if (!value.trim()) {
            fieldErrors[name] = 'Selecciona un municipio';
          } else if (!isValidMunicipality(value, shippingAddress.state)) {
            fieldErrors[name] = 'Municipio no válido para este departamento';
          }
        }
        break;

      case 'state':
        // Solo validar si el método de entrega requiere dirección
        if (deliveryMethod !== 'pickup_store') {
          if (!value.trim()) {
            fieldErrors[name] = 'Selecciona un departamento';
          } else if (!DEPARTMENTS.includes(value)) {
            fieldErrors[name] = 'Departamento no válido';
          }
        }
        break;

      default:
        break;
    }

    return fieldErrors;
  };

  // ✅ GUATEMALA: Función mejorada para manejar cambio de input
  const handleInputChange = useCallback((section, field, value) => {
    console.log(`📝 Cambiando ${section}.${field} a:`, value);
    
    // Actualizar valor
    if (section === 'customerInfo') {
      setCustomerInfo(prev => ({ ...prev, [field]: value }));
    } else if (section === 'shippingAddress') {
      setShippingAddress(prev => {
        const newAddress = { ...prev, [field]: value };
        
        // ✅ GUATEMALA: Lógica especial para municipio
        if (field === 'municipality' && value) {
          console.log('🏘️ Cambiando municipio a:', value);
          newAddress.city = value; // Usar municipio como ciudad
        }
        
        return newAddress;
      });
    }

    // Marcar como tocado
    setTouched(prev => ({ ...prev, [field]: true }));

    // Validar campo
    const fieldErrors = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      ...fieldErrors,
      ...(Object.keys(fieldErrors).length === 0 && { [field]: undefined })
    }));
  }, [deliveryMethod, shippingAddress.state]); // Incluir dependencias necesarias

  // FUNCIÓN MEJORADA: Filtrar caracteres
  const handleKeyPress = (e, type) => {
    const char = e.key;
    
    if (['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(char)) {
      return;
    }
    
    switch (type) {
      case 'name':
        if (!/[A-Za-zÀ-ÿ\u00f1\u00d1\s\-'\.]/i.test(char)) {
          e.preventDefault();
        }
        break;
        
      case 'phone':
        if (!/[\d\s\-\(\)\+]/.test(char)) {
          e.preventDefault();
        }
        break;
        
      default:
        break;
    }
  };

  // FUNCIÓN MEJORADA: Validar todo el formulario
  const validateForm = () => {
    const newErrors = {};

    // Validar información del cliente (siempre requerida)
    Object.assign(newErrors, validateField('name', customerInfo.name));
    Object.assign(newErrors, validateField('email', customerInfo.email));
    Object.assign(newErrors, validateField('phone', customerInfo.phone));

    // Validar dirección solo si NO es recoger en tienda
    if (deliveryMethod !== 'pickup_store') {
      Object.assign(newErrors, validateField('street', shippingAddress.street));
      Object.assign(newErrors, validateField('state', shippingAddress.state));
      Object.assign(newErrors, validateField('municipality', shippingAddress.municipality));
    }

    setErrors(newErrors);
    
    // Marcar campos relevantes como tocados
    const fieldsToTouch = ['name', 'email', 'phone'];
    if (deliveryMethod !== 'pickup_store') {
      fieldsToTouch.push('street', 'state', 'municipality');
    }
    
    setTouched(fieldsToTouch.reduce((acc, field) => ({ ...acc, [field]: true }), {}));

    const isValid = Object.keys(newErrors).filter(key => newErrors[key]).length === 0;
    
    if (!isValid) {
      console.log('❌ Form validation failed:', newErrors);
    } else {
      console.log('✅ Form validation passed');
    }

    return isValid;
  };

  // FUNCIÓN: Calcular costo de envío según método
  const calculateShippingCost = () => {
    const selectedOption = DELIVERY_OPTIONS[deliveryMethod];
    if (!selectedOption) return 0;
    
    // Aplicar descuento por compra mínima
    const minForFreeShipping = deliveryMethod === 'local_delivery' ? 200 : 
                              deliveryMethod === 'national_delivery' ? 300 : 0;
    
    const subtotal = summary?.subtotal || 0;
    
    if (selectedOption.cost > 0 && subtotal >= minForFreeShipping) {
      return 0; // Envío gratis
    }
    
    return selectedOption.cost;
  };

  // ➡️ FUNCIÓN: Continuar al siguiente paso
  const handleContinue = () => {
    if (validateForm()) {
      setStep(2);
      console.log('✅ Moving to payment step with data:', {
        customerInfo,
        deliveryMethod,
        shippingAddress: deliveryMethod !== 'pickup_store' ? {
          ...shippingAddress,
          fullLocation: `${shippingAddress.municipality}, ${shippingAddress.state}, Guatemala`
        } : null
      });
    } else {
      if (showError) showError('Por favor corrige los errores en el formulario');
      
      const errorList = Object.values(errors).filter(Boolean);
      if (errorList.length > 0) {
        console.log('📝 Specific errors:', errorList);
        setTimeout(() => {
          if (showInfo) showInfo(`Errores encontrados: ${errorList.join(', ')}`);
        }, 1000);
      }
    }
  };

  // ⬅️ FUNCIÓN: Volver al paso anterior
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/store');
    }
  };

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tu carrito está vacío</h2>
          <p className="text-gray-600 mb-6">Agrega algunos productos para continuar con la compra</p>
          <button
            onClick={() => navigate('/store')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Ir a la tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* 🔝 HEADER */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span>Volver</span>
            </button>
            
            <h1 className="text-xl font-semibold text-gray-900">
              {step === 1 && 'Información de envío'}
              {step === 2 && 'Método de pago'}
              {step === 3 && 'Confirmación'}
            </h1>
            
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600">Seguro</span>
              {!isAuthenticated && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Invitado</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 📊 PROGRESS BAR */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((stepNumber) => (
                <React.Fragment key={stepNumber}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                    step >= stepNumber 
                      ? 'bg-primary-600 border-primary-600 text-white' 
                      : 'border-gray-300 text-gray-400'
                  }`}>
                    {step > stepNumber ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{stepNumber}</span>
                    )}
                  </div>
                  {stepNumber < 3 && (
                    <div className={`w-12 h-0.5 transition-colors ${
                      step > stepNumber ? 'bg-primary-600' : 'bg-gray-300'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 📱 CONTENIDO PRINCIPAL */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 📝 FORMULARIO PRINCIPAL */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <CustomerInfoStep
                customerInfo={customerInfo}
                setCustomerInfo={setCustomerInfo}
                shippingAddress={shippingAddress}
                setShippingAddress={setShippingAddress}
                deliveryMethod={deliveryMethod}
                setDeliveryMethod={setDeliveryMethod}
                notes={notes}
                setNotes={setNotes}
                errors={errors}
                touched={touched}
                isAuthenticated={isAuthenticated}
                user={user}
                onInputChange={handleInputChange}
                onKeyPress={handleKeyPress}
                availableMunicipalities={availableMunicipalities}
                calculateShippingCost={calculateShippingCost}
              />
            )}

            {step === 2 && stripePromise && (
              <Elements stripe={stripePromise}>
                <PaymentStep
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  customerInfo={customerInfo}
                  shippingAddress={shippingAddress}
                  deliveryMethod={deliveryMethod}
                  notes={notes}
                  items={items}
                  summary={summary}
                  isAuthenticated={isAuthenticated}
                  sessionInfo={sessionInfo}
                  onSuccess={(order) => {
                    console.log('🎯 onSuccess llamado con orden:', order);
                    setOrderCreated(order);
                    setStep(3);
                    clearCart();
                    console.log('✅ Estado actualizado - Step:', 3, 'Orden guardada:', order.id);
                  }}
                  onError={(error) => {
                    console.error('❌ onError llamado:', error);
                    if (showError) showError(error);
                  }}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                  shippingCost={calculateShippingCost()}
                />
              </Elements>
            )}

            {step === 3 && (
              <>
                {console.log('🎊 Renderizando ConfirmationStep con orden:', orderCreated)}
                <ConfirmationStep
                  order={orderCreated}
                  customerInfo={customerInfo}
                />
              </>
            )}
          </div>

          {/* 📋 RESUMEN DEL PEDIDO */}
          <div className="lg:col-span-1">
            <OrderSummary
              items={items}
              summary={summary}
              formatCurrency={formatCurrency}
              step={step}
              onContinue={handleContinue}
              canContinue={step === 1}
              isProcessing={isProcessing}
              errors={errors}
              deliveryMethod={deliveryMethod}
              shippingCost={calculateShippingCost()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ GUATEMALA: COMPONENTE MEJORADO - Paso 1 con implementación completa de Guatemala
const CustomerInfoStep = ({ 
  customerInfo, 
  shippingAddress, 
  deliveryMethod,
  setDeliveryMethod,
  notes,
  setNotes,
  errors,
  touched,
  isAuthenticated,
  user,
  onInputChange,
  onKeyPress,
  availableMunicipalities,
  calculateShippingCost
}) => {
  
  // ✅ DEBUG: Verificar que los datos lleguen al componente
  useEffect(() => {
    console.log('🏛️ CustomerInfoStep - Departamentos disponibles:', DEPARTMENTS?.length || 0);
    console.log('🏘️ CustomerInfoStep - Municipios disponibles:', availableMunicipalities?.length || 0);
  }, [availableMunicipalities]);
  
  return (
    <div className="space-y-8">
      
      {/* 👤 INFORMACIÓN DEL CLIENTE */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <User className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Información del cliente
          </h2>
          {!isAuthenticated && (
            <span className="ml-auto text-sm text-gray-500">
              ¿Ya tienes cuenta? 
              <button 
                onClick={() => window.location.href = '/login'}
                className="text-primary-600 hover:text-primary-700 ml-1"
              >
                Iniciar sesión
              </button>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo *
            </label>
            <input
              type="text"
              value={customerInfo.name}
              onChange={(e) => onInputChange('customerInfo', 'name', e.target.value)}
              onKeyPress={(e) => onKeyPress(e, 'name')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.name && touched.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Juan Pérez García"
              disabled={isAuthenticated}
            />
            {errors.name && touched.name && (
              <div className="flex items-center mt-1 text-red-600 text-sm">
                <X className="w-4 h-4 mr-1" />
                {errors.name}
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={customerInfo.email}
              onChange={(e) => onInputChange('customerInfo', 'email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.email && touched.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="juan@example.com"
              disabled={isAuthenticated}
            />
            {errors.email && touched.email && (
              <div className="flex items-center mt-1 text-red-600 text-sm">
                <X className="w-4 h-4 mr-1" />
                {errors.email}
              </div>
            )}
          </div>

          {/* Teléfono */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono *
              <span className="text-gray-500 font-normal ml-1">(WhatsApp preferido)</span>
            </label>
            <input
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => onInputChange('customerInfo', 'phone', e.target.value)}
              onKeyPress={(e) => onKeyPress(e, 'phone')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.phone && touched.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="5555-5555 o +502 5555-5555"
            />
            {errors.phone && touched.phone && (
              <div className="flex items-center mt-1 text-red-600 text-sm">
                <X className="w-4 h-4 mr-1" />
                {errors.phone}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OPCIONES DE ENTREGA */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <Truck className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Método de entrega
          </h2>
        </div>

        <div className="space-y-3">
          {Object.values(DELIVERY_OPTIONS).map((option) => {
            const Icon = option.icon;
            const isSelected = deliveryMethod === option.id;
            const cost = option.id === deliveryMethod ? calculateShippingCost() : option.cost;
            
            return (
              <button
                key={option.id}
                onClick={() => setDeliveryMethod(option.id)}
                className={`w-full p-4 border rounded-lg text-left transition-colors ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <Icon className={`w-5 h-5 mr-3 mt-0.5 ${
                      option.color === 'green' ? 'text-green-600' :
                      option.color === 'blue' ? 'text-blue-600' :
                      'text-purple-600'
                    }`} />
                    <div>
                      <div className="font-medium text-gray-900">{option.name}</div>
                      <div className="text-sm text-gray-600 mb-2">{option.description}</div>
                      
                      <div className="text-sm space-y-1">
                        <div className="flex items-center text-gray-700">
                          <span className="font-medium">⏱️ {option.timeframe}</span>
                        </div>
                        
                        {option.address && (
                          <div className="text-gray-600">
                            📍 {option.address}
                          </div>
                        )}
                        
                        {option.hours && (
                          <div className="text-gray-600">
                            🕒 {option.hours}
                          </div>
                        )}
                        
                        {option.coverage && (
                          <div className="text-gray-600">
                            📦 {option.coverage}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {cost === 0 ? 'Gratis' : `Q${cost.toFixed(2)}`}
                    </div>
                    {option.cost > 0 && cost === 0 && (
                      <div className="text-xs text-green-600 font-medium">
                        ¡Envío gratis!
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info adicional según método seleccionado */}
        {deliveryMethod && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-700">
              {deliveryMethod === 'pickup_store' && (
                <>
                  <p className="font-medium mb-1">📋 Instrucciones de recogida:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Recibirás un SMS cuando tu pedido esté listo</li>
                    <li>• Presenta tu número de pedido o documento de identidad</li>
                    <li>• Horario de recogida: Lun-Vie 6:00-20:00, Sáb 6:00-18:00</li>
                    <li>• Ubicación: 5ta Avenida 12-34, Zona 10, Guatemala</li>
                  </ul>
                </>
              )}
              
              {deliveryMethod === 'local_delivery' && (
                <>
                  <p className="font-medium mb-1">📦 Entrega local:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Cobertura en Ciudad de Guatemala y municipios cercanos</li>
                    <li>• Entrega en 1-2 días hábiles</li>
                    <li>• Envío gratis en compras superiores a Q200</li>
                    <li>• Te contactaremos para coordinar la entrega</li>
                  </ul>
                </>
              )}
              
              {deliveryMethod === 'national_delivery' && (
                <>
                  <p className="font-medium mb-1">🚚 Entrega nacional:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Entrega a todos los departamentos de Guatemala</li>
                    <li>• Tiempo de entrega: 3-5 días hábiles</li>
                    <li>• Envío gratis en compras superiores a Q300</li>
                    <li>• Seguimiento por WhatsApp disponible</li>
                  </ul>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ✅ GUATEMALA: DIRECCIÓN DE ENVÍO - Solo si NO es recoger en tienda */}
      {deliveryMethod !== 'pickup_store' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <MapPin className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Dirección de entrega - Guatemala 🇬🇹
            </h2>
          </div>

          <div className="space-y-4">
            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección completa *
              </label>
              <input
                type="text"
                value={shippingAddress.street}
                onChange={(e) => onInputChange('shippingAddress', 'street', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.street && touched.street ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="5ta Avenida 12-34, Zona 10, Colonia Roosevelt"
              />
              {errors.street && touched.street && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <X className="w-4 h-4 mr-1" />
                  {errors.street}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Incluye zona, colonia, barrio o cualquier referencia importante
              </p>
            </div>

            {/* ✅ GUATEMALA: País, Departamento, Municipio */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* País (fijo) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                <div className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg text-gray-600">
                  🇬🇹 Guatemala
                </div>
              </div>

              {/* ✅ GUATEMALA: Departamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento *
                  <span className="text-xs text-gray-500 ml-1">
                    ({DEPARTMENTS?.length || 0} disponibles)
                  </span>
                </label>
                <select
                  value={shippingAddress.state}
                  onChange={(e) => {
                    console.log('🏛️ Seleccionando departamento:', e.target.value);
                    onInputChange('shippingAddress', 'state', e.target.value);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.state && touched.state ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar departamento</option>
                  {DEPARTMENTS && DEPARTMENTS.map(department => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
                {errors.state && touched.state && (
                  <div className="flex items-center mt-1 text-red-600 text-sm">
                    <X className="w-4 h-4 mr-1" />
                    {errors.state}
                  </div>
                )}
                {/* ✅ DEBUG: Mostrar cantidad de departamentos */}
                {DEPARTMENTS && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ {DEPARTMENTS.length} departamentos cargados correctamente
                  </p>
                )}
              </div>

              {/* ✅ GUATEMALA: Municipio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Municipio *
                  <span className="text-xs text-gray-500 ml-1">
                    ({availableMunicipalities?.length || 0} disponibles)
                  </span>
                </label>
                <select
                  value={shippingAddress.municipality}
                  onChange={(e) => {
                    console.log('🏘️ Seleccionando municipio:', e.target.value);
                    onInputChange('shippingAddress', 'municipality', e.target.value);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.municipality && touched.municipality ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={!shippingAddress.state}
                >
                  <option value="">
                    {shippingAddress.state ? 'Seleccionar municipio' : 'Primero selecciona departamento'}
                  </option>
                  {availableMunicipalities && availableMunicipalities.map(municipality => (
                    <option key={municipality} value={municipality}>
                      {municipality}
                    </option>
                  ))}
                </select>
                {errors.municipality && touched.municipality && (
                  <div className="flex items-center mt-1 text-red-600 text-sm">
                    <X className="w-4 h-4 mr-1" />
                    {errors.municipality}
                  </div>
                )}
                {/* ✅ DEBUG: Mostrar cantidad de municipios */}
                {shippingAddress.state && (
                  <p className="text-xs text-blue-600 mt-1">
                    🏘️ {availableMunicipalities?.length || 0} municipios en {shippingAddress.state}
                  </p>
                )}
              </div>
            </div>

            {/* Código postal y referencias */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ✅ GUATEMALA: Código postal automático */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código postal
                  <span className="text-gray-500 text-xs ml-1">(automático)</span>
                </label>
                <input
                  type="text"
                  value={shippingAddress.zipCode}
                  onChange={(e) => onInputChange('shippingAddress', 'zipCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Se llena automáticamente"
                  readOnly
                />
                {shippingAddress.state && shippingAddress.zipCode && (
                  <p className="text-xs text-green-600 mt-1">
                    📮 Código asignado para {shippingAddress.state}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referencias (opcional)
                </label>
                <input
                  type="text"
                  value={shippingAddress.reference}
                  onChange={(e) => onInputChange('shippingAddress', 'reference', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Casa blanca con portón negro, edificio 3er nivel"
                />
              </div>
            </div>

            {/* ✅ GUATEMALA: Resumen de dirección seleccionada */}
            {shippingAddress.state && shippingAddress.municipality && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm">
                  <p className="font-medium text-green-800 mb-1">📍 Dirección seleccionada:</p>
                  <p className="text-green-700">
                    {shippingAddress.municipality}, {shippingAddress.state}, Guatemala
                    {shippingAddress.zipCode && ` (${shippingAddress.zipCode})`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📝 NOTAS ADICIONALES */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <Package className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Instrucciones especiales
          </h2>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          rows="3"
          placeholder={
            deliveryMethod === 'pickup_store' 
              ? "Instrucciones especiales para la preparación de tu pedido..."
              : "Instrucciones especiales para la entrega, horario preferido, etc..."
          }
        />
        <p className="text-xs text-gray-500 mt-1">
          {deliveryMethod === 'pickup_store' 
            ? "Incluye cualquier información especial sobre tu pedido"
            : "Incluye cualquier información que ayude al repartidor a encontrar tu dirección"
          }
        </p>
      </div>
    </div>
  );
};

// ✅ ACTUALIZADO: Paso 2 - Método de pago con valores CORREGIDOS del enum
const PaymentStep = ({ 
  paymentMethod, 
  setPaymentMethod,
  customerInfo,
  shippingAddress,
  deliveryMethod,
  notes,
  items,
  summary,
  isAuthenticated,
  sessionInfo,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
  shippingCost
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState('');
  const { showSuccess, showInfo } = useApp();

  // ✅ FLUJO CORREGIDO: Pago con tarjeta usando rutas del README
  const handleStripePayment = async () => {
    if (!stripe || !elements) {
      onError('Stripe no está disponible');
      return;
    }

    try {
      setIsProcessing(true);
      setCardError('');

      console.log('💳 Iniciando flujo de pago con tarjeta...');
      if (showInfo) showInfo('Procesando pago con tarjeta...');

      // 1. ✅ PASO 1: Crear orden según README - Ruta: POST /api/store/orders
      const orderData = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          selectedVariants: item.options || {}
        })),
        customerInfo,
        // ✅ FIX: Cambiar 'card' por 'online_card' según enum de DB
        paymentMethod: 'online_card', // ✅ VALOR CORRECTO DEL ENUM
        notes,
        deliveryMethod,
        sessionId: !isAuthenticated ? (sessionInfo?.sessionId || `guest_${Date.now()}`) : undefined
      };

      // ✅ FIX: SIEMPRE enviar shippingAddress (requerido por el modelo)
      if (deliveryMethod !== 'pickup_store') {
        // Para entregas normales, usar la dirección del usuario
        orderData.shippingAddress = {
          ...shippingAddress,
          fullAddress: `${shippingAddress.street}, ${shippingAddress.municipality}, ${shippingAddress.state}, Guatemala`
        };
      } else {
        // ✅ Para pickup_store, usar dirección de la tienda (requerido por DB)
        orderData.shippingAddress = {
          street: '5ta Avenida 12-34, Zona 10',
          city: 'Guatemala',
          state: 'Guatemala',
          municipality: 'Guatemala',
          zipCode: '01001',
          reference: 'Elite Fitness Club - Recoger en tienda',
          fullAddress: '5ta Avenida 12-34, Zona 10, Guatemala, Guatemala'
        };
      }

      console.log('📦 Creando orden...', orderData);
      const orderResponse = await apiService.createOrder(orderData);
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Error al crear la orden');
      }

      const order = orderResponse.data.order;
      console.log('✅ Orden creada:', order);

      // 2. ✅ PASO 2: Crear Payment Intent según README - Ruta: POST /api/stripe/create-store-intent
      console.log('💳 Creando payment intent...');
      if (showInfo) showInfo('Configurando pago seguro...');
      
      const paymentIntentResponse = await apiService.createStorePaymentIntent({
        orderId: order.id
      });

      if (!paymentIntentResponse.success) {
        throw new Error(paymentIntentResponse.message || 'Error al crear el pago');
      }

      const { clientSecret } = paymentIntentResponse.data;
      console.log('✅ Payment intent creado');

      // 3. ✅ PASO 3: Confirmar con Stripe (usando SDK)
      console.log('💳 Confirmando pago con Stripe...');
      if (showInfo) showInfo('Confirmando pago...');
      
      const cardElement = elements.getElement(CardElement);

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
            address: deliveryMethod !== 'pickup_store' ? {
              line1: shippingAddress.street,
              city: shippingAddress.municipality,
              state: shippingAddress.state,
              postal_code: shippingAddress.zipCode,
              country: 'GT'
            } : undefined
          }
        }
      });

      if (error) {
        setCardError(error.message || 'Error al procesar el pago');
        onError('Error en el pago: ' + error.message);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        console.log('✅ Pago confirmado con Stripe');
        
        // 4. ✅ PASO 4: Confirmar pago en backend según README - Ruta: POST /api/stripe/confirm-payment
        console.log('📝 Confirmando pago en backend...');
        if (showInfo) showInfo('Registrando pago...');
        
        try {
          const confirmResponse = await apiService.confirmStripePayment({
            paymentIntentId: paymentIntent.id
          });

          if (confirmResponse.success) {
            console.log('✅ Pago confirmado en backend');
          } else {
            console.warn('⚠️ Problema confirmando en backend, pero pago exitoso');
          }
        } catch (confirmError) {
          console.warn('⚠️ Error confirmando en backend:', confirmError.message);
          // No lanzar error aquí porque el pago ya se procesó en Stripe
        }

        // 5. ✅ PASO 5: Crear registro de pago según README - Ruta: POST /api/payments/from-order
        console.log('💰 Creando registro de pago...');
        if (showInfo) showInfo('Finalizando proceso...');
        
        try {
          const paymentRecordResponse = await apiService.createPaymentFromOrder({
            orderId: order.id
          });

          if (paymentRecordResponse.success) {
            console.log('✅ Registro de pago creado');
          } else {
            console.warn('⚠️ Problema creando registro de pago');
          }
        } catch (paymentRecordError) {
          console.warn('⚠️ Error creando registro de pago:', paymentRecordError.message);
          // No lanzar error aquí porque el pago principal ya se procesó
        }

        // 6. ✅ ÉXITO: Notificar éxito y llamar onSuccess INMEDIATAMENTE
        console.log('🎉 Proceso de pago completado exitosamente');
        
        // ✅ FIX: Preparar objeto de orden exitosa
        const successOrder = {
          ...order,
          paymentIntent: paymentIntent.id,
          paid: true,
          paymentMethod: 'online_card', // ✅ VALOR CORRECTO
          cardLast4: paymentIntent.charges?.data?.[0]?.payment_method_details?.card?.last4 || '****'
        };

        console.log('📋 Llamando onSuccess con orden:', successOrder);
        onSuccess(successOrder);

        // ✅ FIX: Mostrar mensaje de éxito después de un pequeño delay para asegurar que el estado se actualice
        setTimeout(() => {
          console.log('🎉 Mostrando mensaje de éxito para pago con tarjeta...');
          if (showSuccess) {
            showSuccess('¡Pago procesado exitosamente! Recibirás un email de confirmación.');
          }
        }, 100);

      } else {
        throw new Error('El pago no se completó correctamente');
      }

    } catch (error) {
      console.error('❌ Payment process failed:', error);
      onError(error.message || 'Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ FLUJO CORREGIDO: Pago contra entrega usando rutas del README
  const handleCashOnDelivery = async () => {
    try {
      setIsProcessing(true);

      console.log('💰 Iniciando flujo de pago contra entrega...');
      if (showInfo) showInfo('Procesando orden...');

      // 1. ✅ PASO 1: Crear orden según README - Ruta: POST /api/store/orders
      const orderData = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          selectedVariants: item.options || {}
        })),
        customerInfo,
        // ✅ MANTENER: 'cash_on_delivery' es correcto según enum
        paymentMethod: 'cash_on_delivery',
        notes,
        deliveryMethod,
        sessionId: !isAuthenticated ? (sessionInfo?.sessionId || `guest_${Date.now()}`) : undefined
      };

      // ✅ FIX: SIEMPRE enviar shippingAddress (requerido por el modelo)
      if (deliveryMethod !== 'pickup_store') {
        // Para entregas normales, usar la dirección del usuario
        orderData.shippingAddress = {
          ...shippingAddress,
          fullAddress: `${shippingAddress.street}, ${shippingAddress.municipality}, ${shippingAddress.state}, Guatemala`
        };
      } else {
        // ✅ Para pickup_store, usar dirección de la tienda (requerido por DB)
        orderData.shippingAddress = {
          street: '5ta Avenida 12-34, Zona 10',
          city: 'Guatemala',
          state: 'Guatemala',
          municipality: 'Guatemala',
          zipCode: '01001',
          reference: 'Elite Fitness Club - Recoger en tienda',
          fullAddress: '5ta Avenida 12-34, Zona 10, Guatemala, Guatemala'
        };
      }

      console.log('📦 Creando orden...', orderData);
      const orderResponse = await apiService.createOrder(orderData);

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Error al crear la orden');
      }

      const order = orderResponse.data.order;
      console.log('✅ Orden creada exitosamente:', order);

      // 2. ✅ PASO 2: Crear registro de pago según README - Ruta: POST /api/payments/from-order
      console.log('💰 Creando registro de pago...');
      if (showInfo) showInfo('Registrando pago pendiente...');
      
      try {
        const paymentRecordResponse = await apiService.createPaymentFromOrder({
          orderId: order.id
        });

        if (paymentRecordResponse.success) {
          console.log('✅ Registro de pago creado');
        } else {
          console.warn('⚠️ Problema creando registro de pago');
        }
      } catch (paymentRecordError) {
        console.warn('⚠️ Error creando registro de pago:', paymentRecordError.message);
        // No lanzar error aquí porque la orden principal ya se creó
      }

      // 3. ✅ ÉXITO: Notificar éxito y llamar onSuccess INMEDIATAMENTE
      console.log('🎉 Proceso de orden completado exitosamente');
      
      // ✅ FIX: Llamar onSuccess ANTES de showSuccess para asegurar que el estado se actualice
      const successOrder = {
        ...order,
        paid: false,
        paymentMethod: 'cash_on_delivery'
      };

      console.log('📋 Llamando onSuccess con orden:', successOrder);
      onSuccess(successOrder);

      // ✅ FIX: Mostrar mensaje de éxito después de un pequeño delay para asegurar que el estado se actualice
      setTimeout(() => {
        console.log('🎉 Mostrando mensaje de éxito...');
        if (showSuccess) {
          showSuccess('¡Orden creada exitosamente! Recibirás un email de confirmación.');
        }
      }, 100);

    } catch (error) {
      console.error('❌ Cash on delivery process failed:', error);
      onError(error.message || 'Error al crear la orden');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = () => {
    // ✅ FIX: Cambiar 'card' por 'online_card'
    if (paymentMethod === 'online_card') {
      handleStripePayment();
    } else {
      handleCashOnDelivery();
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <CreditCard className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Método de pago</h2>
        </div>

        <div className="space-y-4">
          
          <button
            // ✅ FIX: Cambiar 'card' por 'online_card'
            onClick={() => setPaymentMethod('online_card')}
            className={`w-full p-4 border rounded-lg text-left transition-colors ${
              paymentMethod === 'online_card' // ✅ FIX: Cambiar comparación
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CreditCard className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <div className="font-medium">Tarjeta de crédito/débito</div>
                  <div className="text-sm text-gray-600">Visa, Mastercard, American Express</div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-600">Seguro</span>
              </div>
            </div>
          </button>

          <button
            onClick={() => setPaymentMethod('cash_on_delivery')}
            className={`w-full p-4 border rounded-lg text-left transition-colors ${
              paymentMethod === 'cash_on_delivery'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Home className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <div className="font-medium">
                    {deliveryMethod === 'pickup_store' ? 'Pago al recoger' : 'Pago contra entrega'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {deliveryMethod === 'pickup_store' 
                      ? 'Paga cuando recojas tu pedido'
                      : 'Paga cuando recibas tu pedido'
                    }
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {deliveryMethod === 'pickup_store' ? (
                  <Store className="w-4 h-4 text-blue-500" />
                ) : (
                  <Truck className="w-4 h-4 text-blue-500" />
                )}
                <span className="text-xs text-blue-600">Popular</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ✅ FIX: Cambiar 'card' por 'online_card' en la condición */}
      {paymentMethod === 'online_card' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">
            Información de la tarjeta
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Datos de la tarjeta
              </label>
              <div className="p-3 border border-gray-300 rounded-lg">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                    },
                  }}
                  onChange={(event) => {
                    setCardError(event.error ? event.error.message : '');
                  }}
                />
              </div>
              {cardError && (
                <p className="text-red-500 text-sm mt-1">{cardError}</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-800 font-medium mb-1">Modo de pruebas activo</p>
                  <p className="text-blue-700">
                    Usa la tarjeta <code className="bg-white px-1 rounded">4242 4242 4242 4242</code> con cualquier CVC y fecha futura para probar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {paymentMethod === 'cash_on_delivery' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">
            {deliveryMethod === 'pickup_store' ? 'Pago al recoger' : 'Pago contra entrega'}
          </h3>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start">
              {deliveryMethod === 'pickup_store' ? (
                <Store className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
              ) : (
                <Truck className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
              )}
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">¿Cómo funciona?</p>
                <ul className="space-y-1">
                  {deliveryMethod === 'pickup_store' ? (
                    <>
                      <li>• Prepararemos tu pedido en 2-4 horas</li>
                      <li>• Te notificaremos cuando esté listo</li>
                      <li>• Vienes a recoger y pagas en ese momento</li>
                      <li>• Aceptamos efectivo y tarjetas</li>
                      <li>• Sin costos adicionales de envío</li>
                    </>
                  ) : (
                    <>
                      <li>• Recibirás tu pedido en la dirección indicada</li>
                      <li>• Pagas el monto exacto al repartidor</li>
                      <li>• Aceptamos efectivo y tarjetas</li>
                      <li>• Sin costos adicionales</li>
                      <li>• Entrega según el método seleccionado</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ INFORMACIÓN ADICIONAL: Email automático */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <Mail className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
          <div className="text-sm">
            <p className="text-green-800 font-medium mb-1">📧 Confirmación automática</p>
            <p className="text-green-700">
              Recibirás un email con los detalles de tu pedido a <strong>{customerInfo.email}</strong> 
              inmediatamente después de completar la compra.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <button
          onClick={handlePayment}
          // ✅ FIX: Cambiar 'card' por 'online_card' en la condición
          disabled={isProcessing || (paymentMethod === 'online_card' && (!stripe || !elements))}
          className="w-full bg-primary-600 text-white py-4 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Procesando...</span>
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              <span>
                {/* ✅ FIX: Cambiar 'card' por 'online_card' en la condición */}
                {paymentMethod === 'online_card' 
                  ? `Pagar ${((summary?.subtotal || 0) + shippingCost)?.toFixed(2)} GTQ`
                  : 'Confirmar pedido'
                }
              </span>
            </>
          )}
        </button>

        <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
          <Shield className="w-4 h-4 mr-1" />
          <span>Tus datos están protegidos con encriptación SSL</span>
        </div>
      </div>
    </div>
  );
};

// COMPONENTE: Paso 3 - Confirmación (MEJORADO con mejor feedback)
const ConfirmationStep = ({ order, customerInfo }) => {
  const navigate = useNavigate();

  // ✅ DEBUG: Verificar que la orden llegue correctamente
  console.log('🎊 ConfirmationStep renderizado con orden:', order);
  console.log('📧 Customer info:', customerInfo);

  // ✅ EFECTO: Mostrar mensaje de éxito cuando se monta el componente
  useEffect(() => {
    console.log('🎉 ConfirmationStep montado - mostrando mensaje de éxito');
    // Timeout para asegurar que la página se renderice antes del mensaje
    setTimeout(() => {
      console.log('✅ Mostrando alerta de éxito...');
      alert('🎉 ¡Compra realizada exitosamente!\n\n' + 
            '✅ Tu pedido ha sido confirmado\n' + 
            '📧 Recibirás un email de confirmación\n' + 
            '📱 Te contactaremos por WhatsApp\n\n' + 
            'Número de pedido: ' + (order?.orderNumber || order?.id || 'N/A'));
    }, 500);
  }, [order]);

  return (
    <div className="text-center space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Pedido confirmado!
          </h2>
          <p className="text-gray-600">
            Hemos recibido tu pedido y comenzaremos a prepararlo
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Detalles del pedido
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Número de pedido:</span>
                <span className="font-medium">{order?.orderNumber || order?.id}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">Q{order?.totalAmount?.toFixed(2) || '0.00'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="text-green-600 font-medium">Confirmado</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Método de pago:</span>
                <span className="font-medium">
                  {/* ✅ FIX: Mostrar texto correcto según el método */}
                  {order?.paymentMethod === 'online_card' ? 'Tarjeta de crédito' : 'Pago contra entrega'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ NUEVO: Banner de éxito más visible */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
            <div className="text-center">
              <p className="text-green-800 font-bold text-lg">
                ¡Compra realizada exitosamente!
              </p>
              <p className="text-green-600 text-sm mt-1">
                Tu pedido está siendo procesado
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/store')}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Seguir comprando
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full text-primary-600 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
          >
            Volver al inicio
          </button>
        </div>

        {/* ✅ INFORMACIÓN MEJORADA: Email confirmación */}
        <div className="mt-6 text-sm text-gray-500">
          <div className="flex items-center justify-center mb-2">
            <Mail className="w-4 h-4 mr-1 text-green-500" />
            <span className="font-medium text-green-600">Email de confirmación enviado</span>
          </div>
          <p>
            Se ha enviado un email con todos los detalles a <strong>{customerInfo.email}</strong>
          </p>
          <p className="mt-2">
            También recibirás actualizaciones por WhatsApp al teléfono proporcionado
          </p>
        </div>
      </div>
    </div>
  );
};

// COMPONENTE ACTUALIZADO: Resumen del pedido con nuevas opciones
const OrderSummary = ({ 
  items, 
  summary, 
  formatCurrency, 
  step, 
  onContinue, 
  canContinue,
  isProcessing,
  errors,
  deliveryMethod,
  shippingCost
}) => {
  const hasErrors = Object.keys(errors).filter(key => errors[key]).length > 0;
  const errorCount = Object.keys(errors).filter(key => errors[key]).length;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Resumen del pedido
      </h3>

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.cartId || item.id} className="flex items-center space-x-3">
            <img 
              src={item.image || '/api/placeholder/60/60'}
              alt={item.name}
              className="w-12 h-12 object-cover rounded-lg"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {item.name}
              </h4>
              <p className="text-sm text-gray-600">
                Cantidad: {item.quantity}
              </p>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span>{formatCurrency(summary?.subtotal || 0)}</span>
        </div>
        
        {summary?.taxAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">IVA (12%):</span>
            <span>{formatCurrency(summary.taxAmount)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            {deliveryMethod && DELIVERY_OPTIONS[deliveryMethod] ? (
              <>
                {DELIVERY_OPTIONS[deliveryMethod].name}:
                <span className="text-xs block text-gray-500">
                  {DELIVERY_OPTIONS[deliveryMethod].timeframe}
                </span>
              </>
            ) : (
              'Entrega:'
            )}
          </span>
          <span>
            {shippingCost === 0 ? 'Gratis' : formatCurrency(shippingCost)}
          </span>
        </div>
        
        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Total:</span>
          <span className="text-primary-600">
            {formatCurrency((summary?.subtotal || 0) + shippingCost)}
          </span>
        </div>
      </div>

      {canContinue && (
        <>
          {hasErrors && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span>
                  {errorCount === 1 ? '1 error encontrado' : `${errorCount} errores encontrados`}
                </span>
              </div>
              <div className="mt-1 text-xs text-red-600">
                Revisa los campos marcados en rojo
              </div>
            </div>
          )}
          
          <button
            onClick={onContinue}
            disabled={isProcessing || hasErrors}
            className={`w-full mt-6 py-3 rounded-lg font-semibold transition-colors ${
              hasErrors 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {hasErrors ? `Corregir ${errorCount === 1 ? 'error' : 'errores'}` : 'Continuar al pago'}
          </button>
        </>
      )}

      <div className="mt-6 space-y-2 text-sm text-gray-600">
        <div className="flex items-center">
          <Shield className="w-4 h-4 mr-2 text-green-500" />
          <span>Compra 100% segura</span>
        </div>
        
        {deliveryMethod && (
          <>
            <div className="flex items-center">
              {deliveryMethod === 'pickup_store' ? (
                <Store className="w-4 h-4 mr-2 text-green-500" />
              ) : deliveryMethod === 'local_delivery' ? (
                <Truck className="w-4 h-4 mr-2 text-blue-500" />
              ) : (
                <Map className="w-4 h-4 mr-2 text-purple-500" />
              )}
              <span>
                {DELIVERY_OPTIONS[deliveryMethod]?.description || 'Método seleccionado'}
              </span>
            </div>
            
            {DELIVERY_OPTIONS[deliveryMethod]?.cost > 0 && shippingCost === 0 && (
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                <span>¡Envío gratis aplicado!</span>
              </div>
            )}
          </>
        )}
        
        <div className="flex items-center">
          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
          <span>Garantía de satisfacción</span>
        </div>
        
        {/* ✅ NUEVO: Indicador de email automático */}
        <div className="flex items-center">
          <Mail className="w-4 h-4 mr-2 text-blue-500" />
          <span>Email de confirmación automático</span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;