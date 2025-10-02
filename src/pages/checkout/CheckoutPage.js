// Autor: Alexander Echeverria
// src/pages/checkout/CheckoutPage.js
// Sistema de checkout con envío local limitado a Baja Verapaz

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Lock, 
  CheckCircle,
  Loader2,
  Package,
  User,
  MapPin,
  Truck,
  Store,
  Map,
  X,
  AlertCircle,
  Info
} from 'lucide-react';

import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

import { 
  GUATEMALA_LOCATIONS,
  DEPARTMENTS,
  getMunicipalitiesByDepartment,
  getPostalCode,
  isValidMunicipality,
  getFastShippingDepartments,
  getMetropolitanDepartments
} from '../../data/guatemalaLocations';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

import { PaymentStep } from './CheckoutPayment';
import { ConfirmationStep, OrderSummary } from './CheckoutConfirmation';

// ============================================================================
// CONFIGURACIÓN DE ENVÍO LOCAL LIMITADO
// ============================================================================
const LOCAL_DELIVERY_CONFIG = {
  department: 'Baja Verapaz',
  municipalities: [
    'Cubulco',
    'Rabinal',
    'Salamá',
    'San Jerónimo',
    'San Miguel Chicaj'
  ]
};

const VALIDATION_PATTERNS = {
  name: /^[A-Za-zÀ-ÿ\u00f1\u00d1\s\-'\.]+$/, 
  phone: /^[\d\s\-\(\)\+]+$/, 
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
  address: /^[A-Za-zÀ-ÿ\u00f1\u00d1\d\s\-.,#°\/]+$/ 
};

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

  const stripeInitialized = useRef(false);
  const stripeInitializing = useRef(false);
  const isInitialMount = useRef(true);
  const gymConfigLoaded = useRef(false);

  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCreated, setOrderCreated] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [stripeAvailable, setStripeAvailable] = useState(false);

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

  const [deliveryOptions, setDeliveryOptions] = useState({});
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  const [customerInfo, setCustomerInfo] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '', 
    state: '',
    municipality: '',
    zipCode: '', 
    reference: ''
  });

  const [deliveryMethod, setDeliveryMethod] = useState('pickup_store');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [notes, setNotes] = useState('');
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const [availableMunicipalities, setAvailableMunicipalities] = useState([]);

  // ============================================================================
  // EFECTO: Configurar departamento y municipios según método de entrega
  // ============================================================================
  useEffect(() => {
    if (deliveryMethod === 'local_delivery') {
      console.log('🚚 Envío local activado - configurando Baja Verapaz...');
      
      // Establecer Baja Verapaz automáticamente
      setShippingAddress(prev => ({
        ...prev,
        state: LOCAL_DELIVERY_CONFIG.department,
        municipality: '', // Limpiar municipio para que el usuario seleccione
        city: ''
      }));
      
      // Establecer municipios limitados
      setAvailableMunicipalities(LOCAL_DELIVERY_CONFIG.municipalities);
      
      // Obtener código postal de Baja Verapaz
      const postalCode = getPostalCode(LOCAL_DELIVERY_CONFIG.department);
      setShippingAddress(prev => ({
        ...prev,
        zipCode: postalCode
      }));
      
      console.log('✅ Configuración de envío local aplicada:', {
        department: LOCAL_DELIVERY_CONFIG.department,
        municipalities: LOCAL_DELIVERY_CONFIG.municipalities
      });
      
    } else if (deliveryMethod === 'national_delivery') {
      // Para envío nacional, permitir todos los departamentos y municipios
      if (shippingAddress.state) {
        const municipalities = getMunicipalitiesByDepartment(shippingAddress.state);
        setAvailableMunicipalities(municipalities);
      } else {
        setAvailableMunicipalities([]);
      }
    } else if (deliveryMethod === 'pickup_store') {
      // Limpiar dirección para pickup en tienda
      setAvailableMunicipalities([]);
    }
  }, [deliveryMethod]);

  useEffect(() => {
    const loadGymConfig = async () => {
      if (gymConfigLoaded.current) return;
      
      try {
        setIsLoadingConfig(true);
        console.log('Cargando configuración del gym desde el backend...');
        
        const [configResponse, contactResponse, hoursResponse] = await Promise.all([
          apiService.getGymConfig().catch(err => {
            console.warn('Error cargando gym config:', err.message);
            return null;
          }),
          apiService.get('/gym/contact').catch(err => {
            console.warn('Error cargando contacto:', err.message);
            return null;
          }),
          apiService.get('/gym/hours').catch(err => {
            console.warn('Error cargando horarios:', err.message);
            return null;
          })
        ]);

        if (configResponse?.success && configResponse.data) {
          const config = configResponse.data;
          console.log('Configuración del gym cargada desde DB:', config);
          
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
        console.log('Configuración del gym completada solo con datos del backend');
        
      } catch (error) {
        console.error('Error cargando configuración del gym:', error);
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadGymConfig();
  }, []);

  useEffect(() => {
    const updateDeliveryOptions = () => {
      if (!gymConfig.name || !gymConfig.contact.address) {
        console.log('Esperando datos del backend para configurar opciones de entrega...');
        setDeliveryOptions({});
        return;
      }

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
          description: 'Entrega en Baja Verapaz (Cubulco, Rabinal, Salamá, San Jerónimo, San Miguel Chicaj)',
          icon: Truck,
          cost: 25,
          timeframe: '1-2 días hábiles',
          coverage: 'Baja Verapaz únicamente',
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
      console.log('Opciones de entrega configuradas con datos reales del backend');
    };

    if (!isLoadingConfig) {
      updateDeliveryOptions();
    }
  }, [isLoadingConfig, gymConfig.name, gymConfig.contact.address, gymConfig.hours.full]);

  const memoizedShowInfo = useCallback((message) => {
    if (showInfo) showInfo(message);
  }, [showInfo]);

  const memoizedShowError = useCallback((message) => {
    if (showError) showError(message);
  }, [showError]);

  const memoizedShowSuccess = useCallback((message) => {
    if (showSuccess) showSuccess(message);
  }, [showSuccess]);

  useEffect(() => {
    if (isEmpty && step !== 3) {
      console.log('Carrito está vacío, redirigiendo...');
      setTimeout(() => {
        memoizedShowInfo('Tu carrito está vacío');
      }, 100);
      navigate('/store');
    }
  }, [isEmpty, navigate, memoizedShowInfo, step]);

  useEffect(() => {
    const initializeStripe = async () => {
      if (stripeInitialized.current || stripeInitializing.current) {
        return;
      }

      const stripeEnabled = process.env.REACT_APP_STRIPE_ENABLED === 'true';
      
      if (!stripeEnabled) {
        console.log('Stripe deshabilitado por variable de entorno');
        setStripeAvailable(false);
        stripeInitialized.current = true;
        return;
      }

      try {
        stripeInitializing.current = true;
        console.log('Inicializando configuración de Stripe...');
        
        const stripeConfig = await apiService.getStripeConfig();
        
        if (stripeConfig?.data?.stripe?.enabled) {
          const publishableKey = stripeConfig.data.stripe.publishableKey;
          console.log('Cargando Stripe con clave pública...');
          
          const stripe = await loadStripe(publishableKey);
          setStripePromise(Promise.resolve(stripe));
          setStripeAvailable(true);
          console.log('Stripe cargado exitosamente');
          
          setTimeout(() => {
            memoizedShowInfo('Pagos con tarjeta disponibles');
          }, 100);
        } else {
          console.warn('Stripe no habilitado en backend');
          setStripeAvailable(false);
          setTimeout(() => {
            memoizedShowInfo('Solo pagos en efectivo disponibles');
          }, 100);
        }
        
        stripeInitialized.current = true;
        
      } catch (error) {
        console.error('Error cargando Stripe:', error);
        setStripeAvailable(false);
        setTimeout(() => {
          memoizedShowError('Error cargando sistema de pagos con tarjeta');
        }, 100);
      } finally {
        stripeInitializing.current = false;
      }
    };

    initializeStripe();
  }, []);

  // ============================================================================
  // ACTUALIZACIÓN DE MUNICIPIOS - Solo para envío nacional
  // ============================================================================
  const updateMunicipalities = useCallback((departmentName) => {
    // Si es envío local, los municipios ya están fijados
    if (deliveryMethod === 'local_delivery') {
      console.log('📍 Envío local - municipios fijos de Baja Verapaz');
      return;
    }
    
    console.log('Actualizando municipios para:', departmentName);
    
    if (departmentName && DEPARTMENTS.includes(departmentName)) {
      const municipalities = getMunicipalitiesByDepartment(departmentName);
      console.log('Municipios encontrados:', municipalities.length);
      setAvailableMunicipalities(municipalities);
      
      const postalCode = getPostalCode(departmentName);
      console.log('Código postal asignado:', postalCode);
      
      setShippingAddress(prev => {
        if (prev.zipCode !== postalCode) {
          return { ...prev, zipCode: postalCode };
        }
        return prev;
      });
    } else {
      console.log('Limpiando municipios - no hay departamento válido');
      setAvailableMunicipalities([]);
    }
  }, [deliveryMethod]);

  useEffect(() => {
    // Solo actualizar municipios si no es envío local
    if (deliveryMethod !== 'local_delivery') {
      updateMunicipalities(shippingAddress.state);
    }
  }, [shippingAddress.state, updateMunicipalities, deliveryMethod]);

  useEffect(() => {
    // Solo validar cambios si no es envío local
    if (deliveryMethod !== 'local_delivery' && shippingAddress.state && shippingAddress.municipality) {
      const municipalities = getMunicipalitiesByDepartment(shippingAddress.state);
      if (!municipalities.includes(shippingAddress.municipality)) {
        console.log('Reseteando municipio porque no pertenece al nuevo departamento');
        setShippingAddress(prev => ({
          ...prev,
          municipality: '',
          city: ''
        }));
      }
    }
  }, [shippingAddress.state, deliveryMethod]);

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
          } else if (deliveryMethod === 'local_delivery') {
            // Validar contra municipios limitados
            if (!LOCAL_DELIVERY_CONFIG.municipalities.includes(value)) {
              fieldErrors[name] = 'Municipio no disponible para envío local';
            }
          } else if (!isValidMunicipality(value, shippingAddress.state)) {
            fieldErrors[name] = 'Municipio no válido para este departamento';
          }
        }
        break;

      case 'state':
        if (deliveryMethod !== 'pickup_store') {
          if (!value.trim()) {
            fieldErrors[name] = 'Selecciona un departamento';
          } else if (deliveryMethod === 'local_delivery' && value !== LOCAL_DELIVERY_CONFIG.department) {
            fieldErrors[name] = 'Solo disponible en Baja Verapaz';
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

  const handleInputChange = useCallback((section, field, value) => {
    console.log(`Cambiando ${section}.${field} a:`, value);
    
    if (section === 'customerInfo') {
      setCustomerInfo(prev => ({ ...prev, [field]: value }));
    } else if (section === 'shippingAddress') {
      setShippingAddress(prev => {
        const newAddress = { ...prev, [field]: value };
        
        if (field === 'municipality' && value) {
          console.log('Cambiando municipio a:', value);
          newAddress.city = value;
          
          // Actualizar código postal por municipio si es necesario
          // Para Guatemala, usamos el código postal del departamento
          if (prev.state) {
            const postalCode = getPostalCode(prev.state);
            newAddress.zipCode = postalCode;
          }
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

  const validateForm = () => {
    const newErrors = {};

    Object.assign(newErrors, validateField('name', customerInfo.name));
    Object.assign(newErrors, validateField('email', customerInfo.email));
    Object.assign(newErrors, validateField('phone', customerInfo.phone));

    if (deliveryMethod !== 'pickup_store') {
      Object.assign(newErrors, validateField('street', shippingAddress.street));
      Object.assign(newErrors, validateField('state', shippingAddress.state));
      Object.assign(newErrors, validateField('municipality', shippingAddress.municipality));
    }

    setErrors(newErrors);
    
    const fieldsToTouch = ['name', 'email', 'phone'];
    if (deliveryMethod !== 'pickup_store') {
      fieldsToTouch.push('street', 'state', 'municipality');
    }
    
    setTouched(fieldsToTouch.reduce((acc, field) => ({ ...acc, [field]: true }), {}));

    const isValid = Object.keys(newErrors).filter(key => newErrors[key]).length === 0;
    
    if (!isValid) {
      console.log('Validación de formulario falló:', newErrors);
    } else {
      console.log('Validación de formulario exitosa');
    }

    return isValid;
  };

  const calculateShippingCost = () => {
    const selectedOption = deliveryOptions[deliveryMethod];
    if (!selectedOption) return 0;
    
    // Retornar el costo fijo sin promociones de envío gratis
    return selectedOption.cost;
  };

  const handleContinue = () => {
    if (validateForm()) {
      setStep(2);
      console.log('Moviéndose al paso de pago con datos:', {
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
        console.log('Errores específicos:', errorList);
        setTimeout(() => {
          memoizedShowInfo(`Errores encontrados: ${errorList.join(', ')}`);
        }, 1000);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/store');
    }
  };

  if (isEmpty && step !== 3) {
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step === 3 ? (
          <div className="max-w-4xl mx-auto">
            {console.log('Renderizando ConfirmationStep con orden:', orderCreated)}
            <ConfirmationStep
              order={orderCreated}
              customerInfo={customerInfo}
              gymConfig={gymConfig}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

              {step === 2 && (
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
                    stripeAvailable={stripeAvailable}
                    onSuccess={(order) => {
                      console.log('onSuccess llamado con orden:', order);
                      setOrderCreated(order);
                      setStep(3);
                      
                      console.log('Estado actualizado - Step:', 3, 'Orden guardada:', order.id);
                      
                      setTimeout(() => {
                        memoizedShowSuccess('¡Compra realizada exitosamente! Recibirás un email de confirmación.');
                      }, 100);
                      
                      setTimeout(() => {
                        console.log('Limpiando carrito después de mostrar confirmación...');
                        clearCart();
                      }, 10000);
                    }}
                    onError={(error) => {
                      console.error('onError llamado:', error);
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
            </div>

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
        )}
      </div>
    </div>
  );
};

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
  // Determinar si el departamento debe estar bloqueado
  const isDepartmentLocked = deliveryMethod === 'local_delivery';
  
  return (
    <div className="space-y-8">
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

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <Truck className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Método de entrega
          </h2>
        </div>

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
              const cost = calculateShippingCost();
              
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
                            <span className="font-medium">{option.timeframe}</span>
                          </div>
                          
                          {option.address && (
                            <div className="text-gray-600">
                              {option.address}
                            </div>
                          )}
                          
                          {option.hours && (
                            <div className="text-gray-600">
                              {option.hours}
                            </div>
                          )}
                          
                          {option.coverage && (
                            <div className="text-gray-600">
                              {option.coverage}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {option.cost === 0 ? 'Gratis' : `Q${option.cost.toFixed(2)}`}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {deliveryMethod && deliveryOptions[deliveryMethod] && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-700">
              {deliveryMethod === 'pickup_store' && (
                <>
                  <p className="font-medium mb-1">Instrucciones de recogida:</p>
                  <ul className="space-y-1 text-xs">
                    <li>Recibirás un SMS cuando tu pedido esté listo</li>
                    <li>Presenta tu número de pedido o documento de identidad</li>
                    {gymConfig.hours.full && <li>Horario: {gymConfig.hours.full}</li>}
                    {gymConfig.contact.address && <li>Ubicación: {gymConfig.contact.address}</li>}
                  </ul>
                </>
              )}
              
              {deliveryMethod === 'local_delivery' && (
                <>
                  <p className="font-medium mb-1">Entrega local - Baja Verapaz:</p>
                  <ul className="space-y-1 text-xs">
                    <li>✅ Cobertura limitada a 5 municipios: Cubulco, Rabinal, Salamá, San Jerónimo, San Miguel Chicaj</li>
                    <li>⏱️ Entrega en 1-2 días hábiles</li>
                    <li>💵 Costo de envío: Q25.00</li>
                    <li>📱 Te contactaremos para coordinar la entrega</li>
                  </ul>
                </>
              )}
              
              {deliveryMethod === 'national_delivery' && (
                <>
                  <p className="font-medium mb-1">Entrega nacional:</p>
                  <ul className="space-y-1 text-xs">
                    <li>Entrega a todos los departamentos de Guatemala</li>
                    <li>Tiempo de entrega: 3-5 días hábiles</li>
                    <li>Costo de envío: Q45.00</li>
                    <li>Seguimiento por WhatsApp disponible</li>
                  </ul>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {deliveryMethod !== 'pickup_store' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <MapPin className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Dirección de entrega - Guatemala
            </h2>
          </div>

          {/* Alerta especial para envío local */}
          {deliveryMethod === 'local_delivery' && (
            <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 mb-1">
                    📍 Envío Local - Solo Baja Verapaz
                  </p>
                  <p className="text-blue-800">
                    El envío local está limitado al departamento de <strong>Baja Verapaz</strong> en los siguientes municipios: 
                    <strong> Cubulco, Rabinal, Salamá, San Jerónimo y San Miguel Chicaj</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                <div className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg text-gray-600">
                  Guatemala
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento *
                </label>
                {isDepartmentLocked ? (
                  <div className="w-full px-3 py-2 border border-blue-300 bg-blue-50 rounded-lg text-blue-900 font-medium flex items-center">
                    <Lock className="w-4 h-4 mr-2" />
                    {LOCAL_DELIVERY_CONFIG.department}
                  </div>
                ) : (
                  <select
                    value={shippingAddress.state}
                    onChange={(e) => {
                      console.log('Seleccionando departamento:', e.target.value);
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
                )}
                {errors.state && touched.state && (
                  <div className="flex items-center mt-1 text-red-600 text-sm">
                    <X className="w-4 h-4 mr-1" />
                    {errors.state}
                  </div>
                )}
              </div>

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
                    console.log('Seleccionando municipio:', e.target.value);
                    onInputChange('shippingAddress', 'municipality', e.target.value);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.municipality && touched.municipality ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={!shippingAddress.state && deliveryMethod !== 'local_delivery'}
                >
                  <option value="">
                    {deliveryMethod === 'local_delivery' 
                      ? 'Seleccionar municipio de Baja Verapaz'
                      : shippingAddress.state 
                        ? 'Seleccionar municipio' 
                        : 'Primero selecciona departamento'
                    }
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Código asignado para {shippingAddress.state}
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

            {shippingAddress.state && shippingAddress.municipality && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm">
                  <p className="font-medium text-green-800 mb-1">Dirección seleccionada:</p>
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

export default CheckoutPage;
/*
=============================================================================
PROPÓSITO DEL COMPONENTE
=============================================================================

Este componente CheckoutPage es el núcleo del proceso de compra del sistema 
Elite Fitness Club. Maneja todo el flujo de checkout desde la información 
del cliente hasta la confirmación final del pedido, integrando múltiples 
sistemas de pago y opciones de entrega.

FUNCIONALIDADES PRINCIPALES:
- Proceso de checkout en 3 pasos (Información → Pago → Confirmación)
- Integración completa con datos geográficos de Guatemala
- Validación estricta de formularios en tiempo real
- Múltiples métodos de pago (Stripe y contra entrega)
- Opciones de entrega dinámicas basadas en configuración del backend
- Cálculo automático de costos de envío con promociones
- Soporte para usuarios invitados y autenticados
- Confirmación por email automática
- Manejo robusto de errores y estados de carga

LO QUE VE EL USUARIO:
- Header con navegación y indicador de seguridad
- Barra de progreso visual de 3 pasos
- Paso 1 - Información del cliente:
  * Formulario de datos personales (nombre, email, teléfono)
  * Selector de método de entrega con precios dinámicos
  * Formulario de dirección para Guatemala (departamentos/municipios)
  * Campo de instrucciones especiales
- Paso 2 - Método de pago:
  * Opción tarjeta de crédito/débito con Stripe
  * Opción pago contra entrega o al recoger
  * Campos seguros para información de tarjeta
  * Confirmación de email automático
- Paso 3 - Confirmación:
  * Banner de éxito con número de pedido
  * Resumen compacto en tarjetas
  * Estado de confirmación visual
  * Botones para continuar comprando o ir al inicio
- Resumen del pedido lateral:
  * Lista de productos con imágenes
  * Desglose de precios (subtotal, envío, total)
  * Información de método de entrega seleccionado
  * Validación de errores en tiempo real

ARCHIVOS Y COMPONENTES CONECTADOS:
=============================================================================

CONTEXTOS UTILIZADOS:
- CartContext (../../contexts/CartContext)
  * Gestión del carrito de compras (items, summary, formatCurrency)
  * Función clearCart() para limpiar después de compra exitosa
  * sessionInfo para usuarios invitados

- AuthContext (../../contexts/AuthContext)
  * Verificación de autenticación (isAuthenticated, user)
  * Datos del usuario para pre-llenar formularios

- AppContext (../../contexts/AppContext)
  * Notificaciones globales (showSuccess, showError, showInfo)
  * Detección de dispositivo móvil (isMobile)

SERVICIOS DE API:
- apiService (../../services/apiService)
  * getGymConfig() - Configuración del gimnasio
  * createOrder() - Crear orden de compra
  * createStorePaymentIntent() - Crear intención de pago Stripe
  * confirmStripePayment() - Confirmar pago procesado
  * getStripeConfig() - Configuración de Stripe

DATOS GEOGRÁFICOS:
- guatemalaLocations (../../data/guatemalaLocations)
  * DEPARTMENTS - Lista de departamentos de Guatemala
  * getMunicipalitiesByDepartment() - Municipios por departamento
  * getPostalCode() - Códigos postales automáticos
  * isValidMunicipality() - Validación de municipios

INTEGRACIÓN STRIPE:
- @stripe/stripe-js - Carga del SDK de Stripe
- @stripe/react-stripe-js - Componentes React para Stripe
- Elements, CardElement - Elementos de formulario de tarjeta
- useStripe, useElements - Hooks para interactuar con Stripe

COMPONENTES INTERNOS:
- CustomerInfoStep - Paso 1 del proceso de checkout
- PaymentStep - Paso 2 con métodos de pago
- ConfirmationStep - Paso 3 de confirmación exitosa
- OrderSummary - Resumen lateral del pedido

RUTAS DE NAVEGACIÓN:
- "/store" - Tienda de productos (redirige si carrito vacío)
- "/login" - Página de inicio de sesión para invitados
- "/" - Página principal del sitio

VALIDACIONES IMPLEMENTADAS:
- Nombres: solo letras, espacios, acentos (2-50 caracteres)
- Email: formato válido requerido
- Teléfono: números, espacios, guiones (7-15 dígitos)
- Dirección: campos requeridos según método de entrega
- Departamento/Municipio: validación contra datos de Guatemala
- Código postal: asignación automática por departamento

FLUJO DE PROCESAMIENTO:
1. Validación de formulario completa
2. Creación de orden en backend con todos los datos
3. Para tarjeta: Creación de PaymentIntent y confirmación con Stripe
4. Para efectivo: Confirmación directa de orden
5. Actualización de estado y mostrar confirmación
6. Envío de email automático al cliente
7. Limpieza de carrito después de confirmación

CARACTERÍSTICAS ESPECIALES:
- Carga dinámica de configuración desde backend
- Opciones de entrega configurables por administrador
- Cálculo inteligente de envío gratis por monto mínimo
- Soporte completo para Guatemala (22 departamentos, 340+ municipios)
- Filtrado de caracteres en tiempo real
- Validación visual inmediata con iconos
- Manejo robusto de errores de pago
- Estados de carga optimizados para UX
- Modo invitado con sesión temporal

Este componente es crítico para la conversión de ventas y representa
la culminación del proceso de compra, integrando múltiples sistemas
para proporcionar una experiencia fluida y segura al usuario.
*/