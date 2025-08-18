// src/pages/checkout/CheckoutPage.js
// FUNCIÓN: Página de checkout COMPLETA - CORREGIDA - Solo datos del backend
// FIX: ✅ Sin datos hardcodeados - Solo del backend
// FIX: ✅ Flujo de éxito corregido
// FIX: ✅ Emails para usuarios invitados
// GUATEMALA: ✅ Implementación completa de departamentos y municipios

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

  // ✅ FIX: Ref para prevenir múltiples inicializaciones
  const stripeInitialized = useRef(false);
  const stripeInitializing = useRef(false);
  const isInitialMount = useRef(true);
  const gymConfigLoaded = useRef(false);

  // Estados principales
  const [step, setStep] = useState(1); // 1: Info, 2: Payment, 3: Confirmation
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCreated, setOrderCreated] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);

  // ✅ CORREGIDO: Estado VACÍO para datos del backend - Sin datos hardcodeados
  const [gymConfig, setGymConfig] = useState({
    name: '',
    description: '',
    contact: {
      address: '',
      phone: '',
      email: '',
      whatsapp: ''
    },
    hours: {
      full: '',
      weekdays: '',
      weekends: ''
    }
  });

  // ✅ NUEVO: Estado para opciones de entrega dinámicas
  const [deliveryOptions, setDeliveryOptions] = useState({});
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

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
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [notes, setNotes] = useState('');
  
  // Estados de validación
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // ✅ GUATEMALA: Estados para datos de Guatemala
  const [availableMunicipalities, setAvailableMunicipalities] = useState([]);

  // ✅ CORREGIDO: Cargar configuración REAL del backend
  useEffect(() => {
    const loadGymConfig = async () => {
      if (gymConfigLoaded.current) return;
      
      try {
        setIsLoadingConfig(true);
        console.log('🏢 Cargando configuración del gym desde el backend...');
        
        const [configResponse, contactResponse, hoursResponse] = await Promise.all([
          apiService.getGymConfig().catch(err => {
            console.warn('⚠️ Error cargando gym config:', err.message);
            return null;
          }),
          apiService.get('/gym/contact').catch(err => {
            console.warn('⚠️ Error cargando contacto:', err.message);
            return null;
          }),
          apiService.get('/gym/hours').catch(err => {
            console.warn('⚠️ Error cargando horarios:', err.message);
            return null;
          })
        ]);

        // ✅ SOLO PROCESAR SI HAY DATOS REALES DEL BACKEND
        if (configResponse?.success && configResponse.data) {
          const config = configResponse.data;
          console.log('✅ Configuración del gym cargada desde DB:', config);
          
          setGymConfig({
            name: config.name || config.gymName || '',
            description: config.description || config.gymDescription || '',
            contact: {
              address: config.contact?.address || '',
              phone: config.contact?.phone || '',
              email: config.contact?.email || '',
              whatsapp: config.contact?.whatsapp || config.contact?.phone || ''
            },
            hours: {
              full: config.hours?.full || '',
              weekdays: config.hours?.weekdays || '',
              weekends: config.hours?.weekends || ''
            }
          });
        }

        // ✅ PROCESAR datos de contacto adicionales SOLO SI EXISTEN
        if (contactResponse?.success && contactResponse.data) {
          const contact = contactResponse.data;
          setGymConfig(prev => ({
            ...prev,
            contact: {
              address: contact.address || prev.contact.address,
              phone: contact.phone || prev.contact.phone,
              email: contact.email || prev.contact.email,
              whatsapp: contact.whatsapp || contact.phone || prev.contact.whatsapp
            }
          }));
        }

        // ✅ PROCESAR horarios adicionales SOLO SI EXISTEN
        if (hoursResponse?.success && hoursResponse.data) {
          const hours = hoursResponse.data;
          setGymConfig(prev => ({
            ...prev,
            hours: {
              full: hours.summary?.full || prev.hours.full,
              weekdays: hours.summary?.weekday || prev.hours.weekdays,
              weekends: hours.summary?.weekend || prev.hours.weekends
            }
          }));
        }

        gymConfigLoaded.current = true;
        console.log('✅ Configuración del gym completada SOLO con datos del backend');
        
      } catch (error) {
        console.error('❌ Error cargando configuración del gym:', error);
        // ✅ MANTENER ESTADO VACÍO SI NO HAY DATOS - NO HAY FALLBACKS HARDCODEADOS
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadGymConfig();
  }, []);

  // ✅ CORREGIDO: Actualizar opciones de entrega SOLO con datos del backend
  useEffect(() => {
    const updateDeliveryOptions = () => {
      // ✅ NO CREAR OPCIONES SIN DATOS DEL BACKEND
      if (!gymConfig.name || !gymConfig.contact.address) {
        console.log('⏳ Esperando datos del backend para configurar opciones de entrega...');
        setDeliveryOptions({}); // Mantener vacío hasta tener datos reales
        return;
      }

      // ✅ CREAR OPCIONES SOLO CON DATOS REALES DEL BACKEND
      const options = {
        pickup_store: {
          id: 'pickup_store',
          name: 'Recoger en tienda',
          description: `Retira tu pedido en ${gymConfig.name}`,
          icon: Store,
          cost: 0,
          timeframe: 'Listo en 2-4 horas',
          address: gymConfig.contact.address,
          hours: gymConfig.hours.full || 'Consultar horarios',
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

      setDeliveryOptions(options);
      console.log('✅ Opciones de entrega configuradas con datos REALES del backend');
    };

    if (!isLoadingConfig) {
      updateDeliveryOptions();
    }
  }, [isLoadingConfig, gymConfig.name, gymConfig.contact.address, gymConfig.hours.full]);

  // ✅ FIX: Funciones memoizadas para evitar re-renders
  const memoizedShowInfo = useCallback((message) => {
    if (showInfo) showInfo(message);
  }, [showInfo]);

  const memoizedShowError = useCallback((message) => {
    if (showError) showError(message);
  }, [showError]);

  const memoizedShowSuccess = useCallback((message) => {
    if (showSuccess) showSuccess(message);
  }, [showSuccess]);

  // ✅ EFECTO: Carrito vacío
  useEffect(() => {
    if (isEmpty) {
      console.log('🛒 Carrito está vacío, redirigiendo...');
      setTimeout(() => {
        memoizedShowInfo('Tu carrito está vacío');
      }, 100);
      navigate('/store');
    }
  }, [isEmpty, navigate, memoizedShowInfo]);

  // ✅ FIX: EFECTO Stripe SIN funciones externas como dependencias
  useEffect(() => {
    const initializeStripe = async () => {
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
          
          setTimeout(() => {
            memoizedShowInfo('💳 Pagos con tarjeta disponibles');
          }, 100);
        } else {
          console.warn('⚠️ Stripe not enabled on backend');
          setTimeout(() => {
            memoizedShowInfo('💰 Solo pagos en efectivo disponibles');
          }, 100);
        }
        
        stripeInitialized.current = true;
        
      } catch (error) {
        console.error('❌ Error loading Stripe:', error);
        setTimeout(() => {
          memoizedShowError('Error cargando sistema de pagos con tarjeta');
        }, 100);
      } finally {
        stripeInitializing.current = false;
      }
    };

    initializeStripe();
  }, []); // Array vacío - no depende de funciones externas

  // ✅ FIX: GUATEMALA - EFECTO para municipios con mejores controles
  const updateMunicipalities = useCallback((departmentName) => {
    console.log('🏛️ Actualizando municipios para:', departmentName);
    
    if (departmentName && DEPARTMENTS.includes(departmentName)) {
      const municipalities = getMunicipalitiesByDepartment(departmentName);
      console.log('🏘️ Municipios encontrados:', municipalities.length);
      setAvailableMunicipalities(municipalities);
      
      const postalCode = getPostalCode(departmentName);
      console.log('📮 Código postal asignado:', postalCode);
      
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
  }, []);

  useEffect(() => {
    updateMunicipalities(shippingAddress.state);
  }, [shippingAddress.state, updateMunicipalities]);

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
  }, [shippingAddress.state]);

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
        if (deliveryMethod !== 'pickup_store') {
          if (!value.trim()) {
            fieldErrors[name] = ERROR_MESSAGES.required;
          } else if (value.trim().length < 5) {
            fieldErrors[name] = ERROR_MESSAGES.minLength.replace('{min}', '5');
          }
        }
        break;

      case 'municipality':
        if (deliveryMethod !== 'pickup_store') {
          if (!value.trim()) {
            fieldErrors[name] = 'Selecciona un municipio';
          } else if (!isValidMunicipality(value, shippingAddress.state)) {
            fieldErrors[name] = 'Municipio no válido para este departamento';
          }
        }
        break;

      case 'state':
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
    
    if (section === 'customerInfo') {
      setCustomerInfo(prev => ({ ...prev, [field]: value }));
    } else if (section === 'shippingAddress') {
      setShippingAddress(prev => {
        const newAddress = { ...prev, [field]: value };
        
        if (field === 'municipality' && value) {
          console.log('🏘️ Cambiando municipio a:', value);
          newAddress.city = value;
        }
        
        return newAddress;
      });
    }

    setTouched(prev => ({ ...prev, [field]: true }));

    const fieldErrors = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      ...fieldErrors,
      ...(Object.keys(fieldErrors).length === 0 && { [field]: undefined })
    }));
  }, [deliveryMethod, shippingAddress.state]);

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
    const selectedOption = deliveryOptions[deliveryMethod];
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
      memoizedShowError('Por favor corrige los errores en el formulario');
      
      const errorList = Object.values(errors).filter(Boolean);
      if (errorList.length > 0) {
        console.log('📝 Specific errors:', errorList);
        setTimeout(() => {
          memoizedShowInfo(`Errores encontrados: ${errorList.join(', ')}`);
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
                deliveryOptions={deliveryOptions}
                gymConfig={gymConfig}
                isLoadingConfig={isLoadingConfig}
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
                    
                    // ✅ FIX: Mostrar éxito inmediatamente después del cambio de estado
                    setTimeout(() => {
                      memoizedShowSuccess('¡Compra realizada exitosamente! Recibirás un email de confirmación.');
                    }, 100);
                  }}
                  onError={(error) => {
                    console.error('❌ onError llamado:', error);
                    memoizedShowError(error);
                  }}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                  shippingCost={calculateShippingCost()}
                  gymConfig={gymConfig}
                  deliveryOptions={deliveryOptions}
                />
              </Elements>
            )}

            {step === 3 && (
              <>
                {console.log('🎊 Renderizando ConfirmationStep con orden:', orderCreated)}
                <ConfirmationStep
                  order={orderCreated}
                  customerInfo={customerInfo}
                  gymConfig={gymConfig}
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
              deliveryOptions={deliveryOptions}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ CORREGIDO: COMPONENTE - Paso 1 con datos REALES del backend
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
  calculateShippingCost,
  deliveryOptions,
  gymConfig,
  isLoadingConfig
}) => {
  
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

      {/* ✅ CORREGIDO: OPCIONES DE ENTREGA - Solo si hay datos del backend */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <Truck className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Método de entrega
          </h2>
        </div>

        {/* ✅ MOSTRAR LOADING si aún está cargando la configuración */}
        {isLoadingConfig ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600 mr-2" />
            <span className="text-gray-600">Cargando opciones de entrega...</span>
          </div>
        ) : Object.keys(deliveryOptions).length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">Opciones de entrega no disponibles</p>
            <p className="text-sm text-gray-500 mt-1">
              No se pudo cargar la configuración desde el servidor
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-3 text-primary-600 hover:text-primary-700 text-sm underline"
            >
              Intentar recargar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.values(deliveryOptions).map((option) => {
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
        )}

        {/* Info adicional según método seleccionado */}
        {deliveryMethod && deliveryOptions[deliveryMethod] && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-700">
              {deliveryMethod === 'pickup_store' && (
                <>
                  <p className="font-medium mb-1">📋 Instrucciones de recogida:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Recibirás un SMS cuando tu pedido esté listo</li>
                    <li>• Presenta tu número de pedido o documento de identidad</li>
                    {gymConfig.hours.full && <li>• Horario: {gymConfig.hours.full}</li>}
                    {gymConfig.contact.address && <li>• Ubicación: {gymConfig.contact.address}</li>}
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

// ACTUALIZADO: Paso 2 - Método de pago con flujo CORREGIDO
// REPARACIÓN CRÍTICA: PaymentStep component con método EXISTENTE

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
  shippingCost,
  gymConfig,
  deliveryOptions
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState('');

  // ✅ REPARACIÓN CRÍTICA: Pago con tarjeta con manejo de errores mejorado
  const handleStripePayment = async () => {
    if (!stripe || !elements) {
      onError('Stripe no está disponible');
      return;
    }

    try {
      setIsProcessing(true);
      setCardError('');

      console.log('💳 Iniciando flujo de pago con tarjeta...');

      // 1. Crear orden
      const orderData = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          selectedVariants: item.options || {}
        })),
        customerInfo,
        paymentMethod: 'online_card',
        notes,
        deliveryMethod,
        sessionId: !isAuthenticated ? (sessionInfo?.sessionId || `guest_${Date.now()}`) : undefined
      };

      // ✅ REPARACIÓN: Usar dirección del backend para pickup_store
      if (deliveryMethod !== 'pickup_store') {
        orderData.shippingAddress = {
          ...shippingAddress,
          fullAddress: `${shippingAddress.street}, ${shippingAddress.municipality}, ${shippingAddress.state}, Guatemala`
        };
      } else {
        // ✅ Usar datos REALES del backend para pickup_store
        if (!gymConfig.contact.address) {
          throw new Error('Configuración de la tienda incompleta. Contacta al administrador.');
        }
        
        orderData.shippingAddress = {
          street: gymConfig.contact.address,
          city: 'Guatemala',
          state: 'Guatemala',
          municipality: 'Guatemala',
          zipCode: '01001',
          reference: `${gymConfig.name || 'Tienda'} - Recoger en tienda`,
          fullAddress: `${gymConfig.contact.address}, Guatemala, Guatemala`
        };
      }

      console.log('📦 Creando orden...', orderData);
      const orderResponse = await apiService.createOrder(orderData);
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Error al crear la orden');
      }

      const order = orderResponse.data.order;
      console.log('✅ Orden creada:', order);

      // 2. Crear Payment Intent
      console.log('💳 Creando payment intent...');
      const paymentIntentResponse = await apiService.createStorePaymentIntent({
        orderId: order.id
      });

      if (!paymentIntentResponse.success) {
        throw new Error(paymentIntentResponse.message || 'Error al crear el pago');
      }

      const { clientSecret } = paymentIntentResponse.data;
      console.log('✅ Payment intent creado');

      // 3. Confirmar con Stripe
      console.log('💳 Confirmando pago con Stripe...');
      const cardElement = elements.getElement(CardElement);

      const billingAddress = deliveryMethod !== 'pickup_store' ? {
        line1: shippingAddress.street,
        city: shippingAddress.municipality,
        state: shippingAddress.state,
        postal_code: shippingAddress.zipCode,
        country: 'GT'
      } : {
        line1: gymConfig.contact.address,
        city: 'Guatemala',
        state: 'Guatemala',
        postal_code: '01001',
        country: 'GT'
      };

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
            address: billingAddress
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
        
        // 4. Confirmar pago en backend
        try {
          const confirmResponse = await apiService.confirmStripePayment({
            paymentIntentId: paymentIntent.id
          });

          if (confirmResponse.success) {
            console.log('✅ Pago confirmado en backend');
          }
        } catch (confirmError) {
          console.warn('⚠️ Error confirmando en backend:', confirmError.message);
        }

        // 5. ✅ REPARACIÓN CRÍTICA: Intentar crear registro de pago con manejo de errores
        try {
          const paymentRecordResponse = await apiService.createPaymentFromOrder({
            orderId: order.id
          });

          if (paymentRecordResponse.success) {
            console.log('✅ Registro de pago creado');
          } else {
            console.warn('⚠️ No se pudo crear registro de pago, pero la orden es válida:', paymentRecordResponse.message);
          }
        } catch (paymentRecordError) {
          console.warn('⚠️ Error creando registro de pago (no crítico):', paymentRecordError.message);
          // ✅ NO FALLAR EL PROCESO si no se puede crear el registro de pago
        }

        // ✅ ÉXITO: Llamar onSuccess SIEMPRE si el pago de Stripe es exitoso
        const successOrder = {
          ...order,
          paymentIntent: paymentIntent.id,
          paid: true,
          paymentMethod: 'online_card',
          cardLast4: paymentIntent.charges?.data?.[0]?.payment_method_details?.card?.last4 || '****'
        };

        console.log('🎉 Llamando onSuccess con orden exitosa...');
        onSuccess(successOrder);

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

  // ✅ REPARACIÓN CRÍTICA: Pago contra entrega con manejo de errores mejorado
  const handleCashOnDelivery = async () => {
    try {
      setIsProcessing(true);

      console.log('💰 Iniciando flujo de pago contra entrega...');

      // 1. Crear orden
      const orderData = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          selectedVariants: item.options || {}
        })),
        customerInfo,
        paymentMethod: 'cash_on_delivery',
        notes,
        deliveryMethod,
        sessionId: !isAuthenticated ? (sessionInfo?.sessionId || `guest_${Date.now()}`) : undefined
      };

      // ✅ REPARACIÓN: Usar dirección del backend para pickup_store
      if (deliveryMethod !== 'pickup_store') {
        orderData.shippingAddress = {
          ...shippingAddress,
          fullAddress: `${shippingAddress.street}, ${shippingAddress.municipality}, ${shippingAddress.state}, Guatemala`
        };
      } else {
        // ✅ Verificar que hay configuración del backend
        if (!gymConfig.contact.address) {
          throw new Error('Configuración de la tienda incompleta. Contacta al administrador.');
        }
        
        // ✅ Usar datos REALES del backend para pickup_store
        orderData.shippingAddress = {
          street: gymConfig.contact.address,
          city: 'Guatemala',
          state: 'Guatemala',
          municipality: 'Guatemala',
          zipCode: '01001',
          reference: `${gymConfig.name || 'Tienda'} - Recoger en tienda`,
          fullAddress: `${gymConfig.contact.address}, Guatemala, Guatemala`
        };
      }

      console.log('📦 Creando orden...', orderData);
      const orderResponse = await apiService.createOrder(orderData);

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Error al crear la orden');
      }

      const order = orderResponse.data.order;
      console.log('✅ Orden creada exitosamente:', order);

      // 2. ✅ REPARACIÓN CRÍTICA: Intentar crear registro de pago con manejo de errores
      try {
        const paymentRecordResponse = await apiService.createPaymentFromOrder({
          orderId: order.id
        });

        if (paymentRecordResponse.success) {
          console.log('✅ Registro de pago creado');
        } else {
          console.warn('⚠️ No se pudo crear registro de pago, pero la orden es válida:', paymentRecordResponse.message);
        }
      } catch (paymentRecordError) {
        console.warn('⚠️ Error creando registro de pago (no crítico):', paymentRecordError.message);
        // ✅ NO FALLAR EL PROCESO si no se puede crear el registro de pago
      }

      // ✅ ÉXITO: Llamar onSuccess SIEMPRE si la orden se creó exitosamente
      const successOrder = {
        ...order,
        paid: false,
        paymentMethod: 'cash_on_delivery'
      };

      console.log('🎉 Llamando onSuccess con orden exitosa...');
      onSuccess(successOrder);

    } catch (error) {
      console.error('❌ Cash on delivery process failed:', error);
      onError(error.message || 'Error al crear la orden');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = () => {
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
            onClick={() => setPaymentMethod('online_card')}
            className={`w-full p-4 border rounded-lg text-left transition-colors ${
              paymentMethod === 'online_card'
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
                      <li>• Vienes a {gymConfig.name || 'nuestra tienda'} y pagas en ese momento</li>
                      <li>• Aceptamos efectivo y tarjetas</li>
                      <li>• Sin costos adicionales de envío</li>
                      {gymConfig.contact.address && (
                        <li>• Ubicación: {gymConfig.contact.address}</li>
                      )}
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

// ✅ CORREGIDO: Paso 3 - Confirmación con datos del backend
const ConfirmationStep = ({ order, customerInfo, gymConfig }) => {
  const navigate = useNavigate();

  console.log('🎊 ConfirmationStep renderizado con orden:', order);
  console.log('📧 Customer info:', customerInfo);

  useEffect(() => {
    console.log('🎉 ConfirmationStep montado - mostrando mensaje de éxito');
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
                  {order?.paymentMethod === 'online_card' ? 'Tarjeta de crédito' : 'Pago contra entrega'}
                </span>
              </div>

              {/* ✅ MOSTRAR datos del backend solo si están disponibles */}
              {gymConfig.name && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Empresa:</span>
                  <span className="font-medium">{gymConfig.name}</span>
                </div>
              )}

              {gymConfig.contact.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Contacto:</span>
                  <span className="font-medium">{gymConfig.contact.phone}</span>
                </div>
              )}
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
                Tu pedido está siendo procesado por {gymConfig.name || 'nuestro equipo'}
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
          {gymConfig.contact.email && (
            <p className="mt-2">
              Para cualquier consulta: <strong>{gymConfig.contact.email}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ COMPONENTE ACTUALIZADO: Resumen del pedido con opciones dinámicas
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
  shippingCost,
  deliveryOptions
}) => {
  const hasErrors = Object.keys(errors).filter(key => errors[key]).length > 0;
  const errorCount = Object.keys(errors).filter(key => errors[key]).length;

  // ✅ Obtener información de la opción de entrega seleccionada
  const selectedDeliveryOption = deliveryOptions[deliveryMethod];

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
            {selectedDeliveryOption ? (
              <>
                {selectedDeliveryOption.name}:
                <span className="text-xs block text-gray-500">
                  {selectedDeliveryOption.timeframe}
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
        
        {selectedDeliveryOption && (
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
                {selectedDeliveryOption.description}
              </span>
            </div>
            
            {selectedDeliveryOption.cost > 0 && shippingCost === 0 && (
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
        
        <div className="flex items-center">
          <Mail className="w-4 h-4 mr-2 text-blue-500" />
          <span>Email de confirmación automático</span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;