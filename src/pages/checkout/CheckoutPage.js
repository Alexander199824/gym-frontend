// Autor: Alexander Echeverria
// src/pages/checkout/CheckoutPage.js
// VERSIÓN ACTUALIZADA: Usa gymConfig centralizado sin datos hardcodeados

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Lock, CheckCircle, Loader2, Package, User, MapPin, 
  Truck, Store, Map, X, AlertCircle, Info
} from 'lucide-react';

import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

// IMPORTAR CONFIGURACIÓN CENTRALIZADA
import gymConfigDefault, { 
  getContactInfo, 
  getGymConfig,
  mergeWithDefaults 
} from '../../config/gymConfig';

import { 
  GUATEMALA_LOCATIONS,
  DEPARTMENTS,
  getMunicipalitiesByDepartment,
  getPostalCode,
  isValidMunicipality,
} from '../../data/guatemalaLocations';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

import { PaymentStep } from './CheckoutPayment';
import { ConfirmationStep, OrderSummary } from './CheckoutConfirmation';

// ============================================================================
// CONFIGURACIÓN DE ENVÍO LOCAL - Desde gymConfig
// ============================================================================
const getLocalDeliveryConfig = (gymConfig) => ({
  department: gymConfig.location.state || 'Baja Verapaz',
  municipalities: gymConfig.location.nearbyMunicipalities || [
    'Rabinal', 'Cubulco', 'San Miguel', 'Salamá', 'San Jerónimo'
  ]
});

// ============================================================================
// VALIDACIÓN DE PRODUCTOS
// ============================================================================
const validateCartItems = (items) => {
  const invalidItems = [];
  const validItems = [];

  items.forEach(item => {
    const hasValidPrice = item.price && !isNaN(item.price) && item.price > 0;
    const hasValidQuantity = item.quantity && !isNaN(item.quantity) && item.quantity > 0;
    const hasValidId = item.id;

    if (!hasValidPrice || !hasValidQuantity || !hasValidId) {
      invalidItems.push({
        ...item,
        issues: {
          noPrice: !hasValidPrice,
          noQuantity: !hasValidQuantity,
          noId: !hasValidId
        }
      });
    } else {
      validItems.push(item);
    }
  });

  return { validItems, invalidItems };
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
    items, summary, isEmpty, formatCurrency, clearCart,
    sessionInfo, removeItem 
  } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError, showInfo, isMobile } = useApp();

  const stripeInitialized = useRef(false);
  const stripeInitializing = useRef(false);
  const gymConfigLoaded = useRef(false);
  const cartValidated = useRef(false);

  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCreated, setOrderCreated] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [stripeAvailable, setStripeAvailable] = useState(false);
  const [cartHasInvalidItems, setCartHasInvalidItems] = useState(false);
  const [invalidItemsList, setInvalidItemsList] = useState([]);

  // CONFIGURACIÓN DEL GYM - Inicia con defaults
  const [gymConfig, setGymConfig] = useState(gymConfigDefault);
  const [deliveryOptions, setDeliveryOptions] = useState({});
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [localDeliveryConfig, setLocalDeliveryConfig] = useState(
    getLocalDeliveryConfig(gymConfigDefault)
  );

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
  // VALIDACIÓN DEL CARRITO AL MONTAR
  // ============================================================================
  useEffect(() => {
    if (!cartValidated.current && items.length > 0) {
      console.log('🔍 Validando productos del carrito...');
      const { validItems, invalidItems } = validateCartItems(items);
      
      if (invalidItems.length > 0) {
        console.warn('⚠️ Productos inválidos detectados:', invalidItems);
        setCartHasInvalidItems(true);
        setInvalidItemsList(invalidItems);
        
        const issuesList = invalidItems.map(item => {
          const issues = [];
          if (item.issues.noPrice) issues.push('sin precio válido');
          if (item.issues.noQuantity) issues.push('cantidad inválida');
          if (item.issues.noId) issues.push('sin ID');
          return `${item.name || 'Producto desconocido'} (${issues.join(', ')})`;
        }).join('; ');
        
        showError(`Productos inválidos: ${issuesList}`);
      } else {
        console.log('✅ Todos los productos son válidos');
        setCartHasInvalidItems(false);
        setInvalidItemsList([]);
      }
      
      cartValidated.current = true;
    }
  }, [items, showError]);

  // ============================================================================
  // CARGAR CONFIGURACIÓN DEL GYM DESDE BACKEND (con fallback a gymConfig)
  // ============================================================================
  useEffect(() => {
    const loadGymConfig = async () => {
      if (gymConfigLoaded.current) return;
      
      try {
        setIsLoadingConfig(true);
        console.log('📡 Cargando configuración del gym desde backend...');
        
        const [configResponse, contactResponse] = await Promise.all([
          apiService.getGymConfig().catch(err => {
            console.warn('⚠️ Backend no disponible, usando gymConfig.js');
            return null;
          }),
          apiService.get('/gym/contact').catch(err => {
            console.warn('⚠️ Contacto no disponible, usando gymConfig.js');
            return null;
          })
        ]);

        let finalConfig = { ...gymConfigDefault };

        // Combinar con datos del backend si existen
        if (configResponse?.success && configResponse.data) {
          finalConfig = getGymConfig(configResponse.data);
        }

        if (contactResponse?.success && contactResponse.data) {
          const contactInfo = getContactInfo(contactResponse.data);
          finalConfig.contact = {
            ...finalConfig.contact,
            ...contactInfo
          };
        }

        console.log('✅ Configuración cargada:', {
          nombre: finalConfig.name,
          email: finalConfig.contact.email,
          telefono: finalConfig.contact.phone,
          direccion: finalConfig.location.address
        });
        
        setGymConfig(finalConfig);
        
        // Actualizar config de envío local
        setLocalDeliveryConfig(getLocalDeliveryConfig(finalConfig));
        
        gymConfigLoaded.current = true;
        
      } catch (error) {
        console.error('❌ Error cargando configuración:', error);
        console.log('✅ Usando configuración por defecto de gymConfig.js');
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadGymConfig();
  }, []);

  // ============================================================================
  // CONFIGURAR MUNICIPIOS SEGÚN MÉTODO DE ENTREGA
  // ============================================================================
  useEffect(() => {
    if (deliveryMethod === 'local_delivery') {
      console.log('🚚 Envío local - configuración desde gymConfig');
      setShippingAddress(prev => ({
        ...prev,
        state: localDeliveryConfig.department,
        municipality: '',
        city: ''
      }));
      
      setAvailableMunicipalities(localDeliveryConfig.municipalities);
      
      const postalCode = getPostalCode(localDeliveryConfig.department);
      setShippingAddress(prev => ({
        ...prev,
        zipCode: postalCode
      }));
      
    } else if (deliveryMethod === 'national_delivery') {
      if (shippingAddress.state) {
        const municipalities = getMunicipalitiesByDepartment(shippingAddress.state);
        setAvailableMunicipalities(municipalities);
      } else {
        setAvailableMunicipalities([]);
      }
    } else {
      setAvailableMunicipalities([]);
    }
  }, [deliveryMethod, localDeliveryConfig]);

  // ============================================================================
  // CONFIGURAR OPCIONES DE ENTREGA desde gymConfig
  // ============================================================================
  useEffect(() => {
    const updateDeliveryOptions = () => {
      const options = {
        pickup_store: {
          id: 'pickup_store',
          name: 'Recoger en tienda',
          description: `Retira tu pedido en ${gymConfig.name}`,
          icon: Store,
          cost: 0,
          timeframe: 'Listo en 2-4 horas',
          address: gymConfig.location.addressFull || gymConfig.location.address,
          hours: gymConfig.hours.full || gymConfig.hours.businessHours,
          color: 'green'
        },
        local_delivery: {
          id: 'local_delivery',
          name: 'Envío local',
          description: `Entrega en ${localDeliveryConfig.department}`,
          icon: Truck,
          cost: 25,
          timeframe: 'Días específicos',
          coverage: `${localDeliveryConfig.department}: ${localDeliveryConfig.municipalities.join(', ')}`,
          color: 'blue'
        },
        national_delivery: {
          id: 'national_delivery',
          name: 'Envío departamental',
          description: `Entrega a todo ${gymConfig.location.country}`,
          icon: Map,
          cost: 45,
          timeframe: '3-5 días hábiles',
          coverage: `Todos los departamentos de ${gymConfig.location.country}`,
          color: 'purple'
        }
      };

      setDeliveryOptions(options);
      console.log('✅ Opciones de entrega configuradas desde gymConfig');
    };

    if (!isLoadingConfig) {
      updateDeliveryOptions();
    }
  }, [isLoadingConfig, gymConfig, localDeliveryConfig]);

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
      console.log('Carrito vacío, redirigiendo...');
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
        console.log('Stripe deshabilitado en configuración');
        setStripeAvailable(false);
        stripeInitialized.current = true;
        return;
      }

      try {
        stripeInitializing.current = true;
        console.log('Inicializando Stripe...');
        
        const stripeConfig = await apiService.getStripeConfig();
        
        if (stripeConfig?.data?.stripe?.enabled) {
          const publishableKey = stripeConfig.data.stripe.publishableKey;
          const stripe = await loadStripe(publishableKey);
          setStripePromise(Promise.resolve(stripe));
          setStripeAvailable(true);
          console.log('✅ Stripe cargado');
          
          setTimeout(() => {
            memoizedShowInfo('Pagos con tarjeta disponibles');
          }, 100);
        } else {
          console.warn('Stripe no habilitado en backend');
          setStripeAvailable(false);
        }
        
        stripeInitialized.current = true;
        
      } catch (error) {
        console.error('Error cargando Stripe:', error);
        setStripeAvailable(false);
      } finally {
        stripeInitializing.current = false;
      }
    };

    initializeStripe();
  }, [memoizedShowInfo]);

  const updateMunicipalities = useCallback((departmentName) => {
    if (deliveryMethod === 'local_delivery') {
      return;
    }
    
    if (departmentName && DEPARTMENTS.includes(departmentName)) {
      const municipalities = getMunicipalitiesByDepartment(departmentName);
      setAvailableMunicipalities(municipalities);
      
      const postalCode = getPostalCode(departmentName);
      setShippingAddress(prev => {
        if (prev.zipCode !== postalCode) {
          return { ...prev, zipCode: postalCode };
        }
        return prev;
      });
    } else {
      setAvailableMunicipalities([]);
    }
  }, [deliveryMethod]);

  useEffect(() => {
    if (deliveryMethod !== 'local_delivery') {
      updateMunicipalities(shippingAddress.state);
    }
  }, [shippingAddress.state, updateMunicipalities, deliveryMethod]);

  useEffect(() => {
    if (deliveryMethod !== 'local_delivery' && shippingAddress.state && shippingAddress.municipality) {
      const municipalities = getMunicipalitiesByDepartment(shippingAddress.state);
      if (!municipalities.includes(shippingAddress.municipality)) {
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
            if (!localDeliveryConfig.municipalities.includes(value)) {
              fieldErrors[name] = 'Municipio no disponible';
            }
          } else if (!isValidMunicipality(value, shippingAddress.state)) {
            fieldErrors[name] = 'Municipio no válido';
          }
        }
        break;

      case 'state':
        if (deliveryMethod !== 'pickup_store') {
          if (!value.trim()) {
            fieldErrors[name] = 'Selecciona un departamento';
          } else if (deliveryMethod === 'local_delivery' && value !== localDeliveryConfig.department) {
            fieldErrors[name] = `Solo disponible en ${localDeliveryConfig.department}`;
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
    if (section === 'customerInfo') {
      setCustomerInfo(prev => ({ ...prev, [field]: value }));
    } else if (section === 'shippingAddress') {
      setShippingAddress(prev => {
        const newAddress = { ...prev, [field]: value };
        
        if (field === 'municipality' && value) {
          newAddress.city = value;
          
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
  }, [deliveryMethod, shippingAddress.state, localDeliveryConfig]);

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
      console.log('Validación falló:', newErrors);
    }

    return isValid;
  };

  const calculateShippingCost = () => {
    const selectedOption = deliveryOptions[deliveryMethod];
    if (!selectedOption) return 0;
    return selectedOption.cost;
  };

  const handleContinue = () => {
    if (cartHasInvalidItems) {
      memoizedShowError('Elimina los productos inválidos antes de continuar');
      return;
    }

    if (validateForm()) {
      setStep(2);
      console.log('✅ Avanzando al pago');
    } else {
      memoizedShowError('Corrige los errores del formulario');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/store');
    }
  };

  const handleRemoveInvalidItem = (itemId) => {
    removeItem(itemId);
    const { validItems, invalidItems } = validateCartItems(items.filter(i => i.id !== itemId));
    setInvalidItemsList(invalidItems);
    setCartHasInvalidItems(invalidItems.length > 0);
    
    if (invalidItems.length === 0) {
      memoizedShowSuccess('Productos inválidos eliminados');
    }
  };

  if (isEmpty && step !== 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tu carrito está vacío</h2>
          <p className="text-gray-600 mb-6">Agrega productos para continuar</p>
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
      {/* HEADER */}
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

      {/* PROGRESS BAR */}
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

      {/* ALERTA DE PRODUCTOS INVÁLIDOS */}
      {cartHasInvalidItems && step === 1 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-red-900 font-semibold mb-2">
                  ⚠️ Productos inválidos detectados
                </h3>
                <p className="text-red-800 text-sm mb-3">
                  Elimina estos productos para continuar:
                </p>
                <ul className="space-y-2">
                  {invalidItemsList.map((item, index) => (
                    <li key={index} className="bg-white rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.name || 'Producto desconocido'}</p>
                        <p className="text-sm text-red-600">
                          Problemas: 
                          {item.issues.noPrice && ' Precio inválido'}
                          {item.issues.noQuantity && ' Cantidad inválida'}
                          {item.issues.noId && ' Sin ID'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveInvalidItem(item.cartId || item.id)}
                        className="ml-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step === 3 ? (
          <div className="max-w-4xl mx-auto">
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
                  localDeliveryConfig={localDeliveryConfig}
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
                      console.log('✅ Compra exitosa');
                      setOrderCreated(order);
                      setStep(3);
                      
                      setTimeout(() => {
                        memoizedShowSuccess('¡Compra realizada exitosamente!');
                      }, 100);
                      
                      setTimeout(() => {
                        console.log('Limpiando carrito...');
                        clearCart();
                      }, 10000);
                    }}
                    onError={(error) => {
                      console.error('❌ Error en compra:', error);
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

            {/* RESUMEN DEL PEDIDO */}
            <div className="lg:col-span-1">
              <OrderSummary
                items={items}
                summary={summary}
                formatCurrency={formatCurrency}
                step={step}
                onContinue={handleContinue}
                canContinue={step === 1 && !cartHasInvalidItems}
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

// ============================================================================
// COMPONENTE: CustomerInfoStep
// ============================================================================
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
  isLoadingConfig,
  localDeliveryConfig
}) => {
  const isDepartmentLocked = deliveryMethod === 'local_delivery';
  
  return (
    <div className="space-y-8">
      {/* INFORMACIÓN DEL CLIENTE */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <User className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Información del cliente
          </h2>
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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
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
            </label>
            <input
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => onInputChange('customerInfo', 'phone', e.target.value)}
              onKeyPress={(e) => onKeyPress(e, 'phone')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                errors.phone && touched.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="5555-5555"
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

      {/* MÉTODO DE ENTREGA */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <Truck className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Método de entrega
          </h2>
        </div>

        <div className="space-y-3">
          {Object.values(deliveryOptions).map((option) => {
            const Icon = option.icon;
            const isSelected = deliveryMethod === option.id;
            
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
                        
                        {option.coverage && (
                          <div className="text-gray-600">
                            🌍 {option.coverage}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {option.cost === 0 ? 'Gratis' : `${gymConfig.regional.currencySymbol}${option.cost.toFixed(2)}`}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* DIRECCIÓN DE ENTREGA */}
      {deliveryMethod !== 'pickup_store' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <MapPin className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Dirección de entrega
            </h2>
          </div>

          {deliveryMethod === 'local_delivery' && (
            <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 mb-1">
                    📍 Envío Local - {localDeliveryConfig.department}
                  </p>
                  <p className="text-blue-800">
                    Municipios: <strong>{localDeliveryConfig.municipalities.join(', ')}</strong>
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                  errors.street && touched.street ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="5ta Avenida 12-34"
              />
              {errors.street && touched.street && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <X className="w-4 h-4 mr-1" />
                  {errors.street}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                <div className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg text-gray-600">
                  {gymConfig.location.country}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento *
                </label>
                {isDepartmentLocked ? (
                  <div className="w-full px-3 py-2 border border-blue-300 bg-blue-50 rounded-lg text-blue-900 font-medium flex items-center">
                    <Lock className="w-4 h-4 mr-2" />
                    {localDeliveryConfig.department}
                  </div>
                ) : (
                  <select
                    value={shippingAddress.state}
                    onChange={(e) => onInputChange('shippingAddress', 'state', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      errors.state && touched.state ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar</option>
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
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
                </label>
                <select
                  value={shippingAddress.municipality}
                  onChange={(e) => onInputChange('shippingAddress', 'municipality', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                    errors.municipality && touched.municipality ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar</option>
                  {availableMunicipalities.map(mun => (
                    <option key={mun} value={mun}>{mun}</option>
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
                </label>
                <input
                  type="text"
                  value={shippingAddress.zipCode}
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referencias (opcional)
                </label>
                <input
                  type="text"
                  value={shippingAddress.reference}
                  onChange={(e) => onInputChange('shippingAddress', 'reference', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Casa blanca"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOTAS */}
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          rows="3"
          placeholder="Instrucciones adicionales..."
        />
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