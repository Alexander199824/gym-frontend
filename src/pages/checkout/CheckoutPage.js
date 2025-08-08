// src/pages/checkout/CheckoutPage.js
// FUNCIÓN: Página de checkout ACTUALIZADA - Usando datos completos de departamentos y municipios
// MEJORAS: ✅ Datos completos de Guatemala ✅ Validaciones mejoradas ✅ Códigos postales automáticos

import React, { useState, useEffect } from 'react';
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
  Calendar,
  DollarSign,
  X,
  Info
} from 'lucide-react';

import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

// ✅ NUEVO: Importar datos completos de Guatemala
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

// ✅ REGEX MEJORADOS - MÁS FLEXIBLES
const VALIDATION_PATTERNS = {
  name: /^[A-Za-zÀ-ÿ\u00f1\u00d1\s\-'\.]+$/, // ✅ Agregado punto para abreviaciones
  phone: /^[\d\s\-\(\)\+]+$/, // Mantenido igual
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Mantenido igual
  address: /^[A-Za-zÀ-ÿ\u00f1\u00d1\d\s\-.,#°\/]+$/ // ✅ Agregado slash para direcciones
};

// ✅ MENSAJES DE ERROR MEJORADOS
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

  // Estados principales
  const [step, setStep] = useState(1); // 1: Info, 2: Payment, 3: Confirmation
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCreated, setOrderCreated] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);

  // ✅ ESTADOS DEL FORMULARIO CON VALIDACIÓN MEJORADA
  const [customerInfo, setCustomerInfo] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  // ✅ ACTUALIZADO: Usar datos completos de Guatemala
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: 'Guatemala', // Ciudad se llenará automáticamente según municipio
    state: 'Guatemala', // Por defecto Guatemala (departamento más común)
    municipality: '', // ✅ Campo de municipio
    zipCode: '01001', // Se actualizará automáticamente según departamento
    reference: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [notes, setNotes] = useState('');
  
  // ✅ ESTADOS DE VALIDACIÓN
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // ✅ NUEVOS ESTADOS: Para datos de Guatemala
  const [availableMunicipalities, setAvailableMunicipalities] = useState([]);
  const [isMetropolitanArea, setIsMetropolitanArea] = useState(false);
  const [hasFastShipping, setHasFastShipping] = useState(false);

  // 🚀 EFECTO: Inicializar Stripe
  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const stripeConfig = await apiService.get('/stripe/config');
        
        if (stripeConfig?.data?.stripe?.enabled) {
          const publishableKey = stripeConfig.data.stripe.publishableKey;
          console.log('🔑 Loading Stripe...');
          
          const stripe = await loadStripe(publishableKey);
          setStripePromise(Promise.resolve(stripe));
          console.log('✅ Stripe loaded successfully');
        } else {
          console.warn('⚠️ Stripe not enabled');
        }
      } catch (error) {
        console.error('❌ Error loading Stripe:', error);
      }
    };

    initializeStripe();
  }, []);

  // 🔄 EFECTO: Verificar carrito vacío
  useEffect(() => {
    if (isEmpty) {
      showInfo('Tu carrito está vacío');
      navigate('/store');
    }
  }, [isEmpty, navigate, showInfo]);

  // ✅ NUEVO EFECTO: Actualizar municipios cuando cambie el departamento
  useEffect(() => {
    const municipalities = getMunicipalitiesByDepartment(shippingAddress.state);
    setAvailableMunicipalities(municipalities);
    
    // ✅ Auto-reset municipality cuando cambie departamento
    if (shippingAddress.municipality && !municipalities.includes(shippingAddress.municipality)) {
      setShippingAddress(prev => ({
        ...prev,
        municipality: '',
        zipCode: getPostalCode(prev.state)
      }));
    }
    
    // ✅ Actualizar código postal automáticamente
    setShippingAddress(prev => ({
      ...prev,
      zipCode: getPostalCode(prev.state)
    }));
    
    // ✅ Verificar características del departamento
    const metropolitanDepts = getMetropolitanDepartments();
    const fastShippingDepts = getFastShippingDepartments();
    
    setIsMetropolitanArea(metropolitanDepts.includes(shippingAddress.state));
    setHasFastShipping(fastShippingDepts.includes(shippingAddress.state));
    
    console.log('📍 Department changed:', {
      department: shippingAddress.state,
      municipalitiesCount: municipalities.length,
      isMetropolitan: metropolitanDepts.includes(shippingAddress.state),
      hasFastShipping: fastShippingDepts.includes(shippingAddress.state),
      postalCode: getPostalCode(shippingAddress.state)
    });
    
  }, [shippingAddress.state]);

  // ✅ FUNCIÓN MEJORADA: Validar un campo específico - MÁS FLEXIBLE
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
        // ✅ MEJORADO: Solo validar que no esté vacío y tenga formato básico
        if (!value.trim()) {
          fieldErrors[name] = ERROR_MESSAGES.required;
        } else {
          const cleanPhone = value.replace(/[\s\-\(\)\+]/g, ''); // Limpiar caracteres
          if (cleanPhone.length < 7 || cleanPhone.length > 15) {
            fieldErrors[name] = ERROR_MESSAGES.phoneLength;
          } else if (!VALIDATION_PATTERNS.phone.test(value)) {
            fieldErrors[name] = ERROR_MESSAGES.phone;
          }
        }
        break;

      case 'street':
        if (!value.trim()) {
          fieldErrors[name] = ERROR_MESSAGES.required;
        } else if (value.trim().length < 5) {
          fieldErrors[name] = ERROR_MESSAGES.minLength.replace('{min}', '5');
        }
        break;

      case 'municipality':
        if (!value.trim()) {
          fieldErrors[name] = 'Selecciona un municipio';
        } else if (!isValidMunicipality(value, shippingAddress.state)) {
          fieldErrors[name] = 'Municipio no válido para este departamento';
        }
        break;

      case 'state':
        if (!value.trim()) {
          fieldErrors[name] = 'Selecciona un departamento';
        } else if (!DEPARTMENTS.includes(value)) {
          fieldErrors[name] = 'Departamento no válido';
        }
        break;

      default:
        break;
    }

    return fieldErrors;
  };

  // ✅ FUNCIÓN MEJORADA: Manejar cambio de input - MÁS FLEXIBLE
  const handleInputChange = (section, field, value) => {
    // Actualizar valor
    if (section === 'customerInfo') {
      setCustomerInfo(prev => ({ ...prev, [field]: value }));
    } else if (section === 'shippingAddress') {
      setShippingAddress(prev => {
        const newAddress = { ...prev, [field]: value };
        
        // ✅ MEJORADO: Si cambia el departamento, resetear municipio y actualizar código postal
        if (field === 'state') {
          newAddress.municipality = '';
          newAddress.zipCode = getPostalCode(value);
          
          // ✅ NUEVO: Actualizar city basado en el municipio principal del departamento
          const municipalities = getMunicipalitiesByDepartment(value);
          if (municipalities.length > 0) {
            // Usar el primer municipio (generalmente la cabecera departamental) como city
            newAddress.city = municipalities[0];
          }
        }
        
        // ✅ NUEVO: Si cambia el municipio, actualizar city
        if (field === 'municipality' && value) {
          newAddress.city = value;
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
      // Limpiar error si el campo es válido
      ...(Object.keys(fieldErrors).length === 0 && { [field]: undefined })
    }));
  };

  // ✅ FUNCIÓN MEJORADA: Filtrar caracteres - MÁS PERMISIVA
  const handleKeyPress = (e, type) => {
    const char = e.key;
    
    // ✅ Permitir teclas de control
    if (['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(char)) {
      return;
    }
    
    switch (type) {
      case 'name':
        // ✅ MEJORADO: Más permisivo para nombres
        if (!/[A-Za-zÀ-ÿ\u00f1\u00d1\s\-'\.]/i.test(char)) {
          e.preventDefault();
        }
        break;
        
      case 'phone':
        // Solo números, espacios, guiones, paréntesis, +
        if (!/[\d\s\-\(\)\+]/.test(char)) {
          e.preventDefault();
        }
        break;
        
      default:
        break;
    }
  };

  // ✅ FUNCIÓN MEJORADA: Validar todo el formulario - MÁS ESPECÍFICA
  const validateForm = () => {
    const newErrors = {};

    // Validar información del cliente
    Object.assign(newErrors, validateField('name', customerInfo.name));
    Object.assign(newErrors, validateField('email', customerInfo.email));
    Object.assign(newErrors, validateField('phone', customerInfo.phone));

    // Validar dirección de envío
    Object.assign(newErrors, validateField('street', shippingAddress.street));
    Object.assign(newErrors, validateField('state', shippingAddress.state));
    Object.assign(newErrors, validateField('municipality', shippingAddress.municipality));

    setErrors(newErrors);
    
    // Marcar todos los campos como tocados
    setTouched({
      name: true,
      email: true,
      phone: true,
      street: true,
      state: true,
      municipality: true
    });

    const isValid = Object.keys(newErrors).length === 0;
    
    if (!isValid) {
      console.log('❌ Form validation failed:', newErrors);
    } else {
      console.log('✅ Form validation passed');
    }

    return isValid;
  };

  // ➡️ FUNCIÓN: Continuar al siguiente paso
  const handleContinue = () => {
    if (validateForm()) {
      setStep(2);
      console.log('✅ Moving to payment step with data:', {
        customerInfo,
        shippingAddress: {
          ...shippingAddress,
          fullLocation: `${shippingAddress.municipality}, ${shippingAddress.state}, Guatemala`,
          isMetropolitan: isMetropolitanArea,
          hasFastShipping: hasFastShipping
        }
      });
    } else {
      showError('Por favor corrige los errores en el formulario');
      
      // ✅ NUEVO: Mostrar errores específicos
      const errorList = Object.values(errors).filter(Boolean);
      if (errorList.length > 0) {
        console.log('📝 Specific errors:', errorList);
        setTimeout(() => {
          showInfo(`Errores encontrados: ${errorList.join(', ')}`);
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
                notes={notes}
                setNotes={setNotes}
                errors={errors}
                touched={touched}
                isAuthenticated={isAuthenticated}
                user={user}
                onInputChange={handleInputChange}
                onKeyPress={handleKeyPress}
                availableMunicipalities={availableMunicipalities}
                isMetropolitanArea={isMetropolitanArea}
                hasFastShipping={hasFastShipping}
              />
            )}

            {step === 2 && stripePromise && (
              <Elements stripe={stripePromise}>
                <PaymentStep
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  customerInfo={customerInfo}
                  shippingAddress={shippingAddress}
                  notes={notes}
                  items={items}
                  summary={summary}
                  isAuthenticated={isAuthenticated}
                  sessionInfo={sessionInfo}
                  onSuccess={(order) => {
                    setOrderCreated(order);
                    setStep(3);
                    clearCart();
                  }}
                  onError={(error) => {
                    showError(error);
                  }}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                />
              </Elements>
            )}

            {step === 3 && (
              <ConfirmationStep
                order={orderCreated}
                customerInfo={customerInfo}
              />
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
              shippingAddress={shippingAddress}
              isMetropolitanArea={isMetropolitanArea}
              hasFastShipping={hasFastShipping}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ COMPONENTE MEJORADO: Paso 1 - Información del cliente CON DATOS COMPLETOS DE GUATEMALA
const CustomerInfoStep = ({ 
  customerInfo, 
  shippingAddress, 
  notes,
  setNotes,
  errors,
  touched,
  isAuthenticated,
  user,
  onInputChange,
  onKeyPress,
  availableMunicipalities,
  isMetropolitanArea,
  hasFastShipping
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

      {/* ✅ DIRECCIÓN DE ENVÍO MEJORADA CON DATOS COMPLETOS DE GUATEMALA */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <MapPin className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Dirección de envío
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

          {/* ✅ ACTUALIZADO: País, Departamento, Municipio con datos completos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* País (fijo) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
              <div className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg text-gray-600">
                🇬🇹 Guatemala
              </div>
            </div>

            {/* ✅ ACTUALIZADO: Departamento - Todos los departamentos disponibles */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departamento *</label>
              <select
                value={shippingAddress.state}
                onChange={(e) => onInputChange('shippingAddress', 'state', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.state && touched.state ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar departamento</option>
                {DEPARTMENTS.map(department => (
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

            {/* ✅ ACTUALIZADO: Municipio - Dinámico según departamento seleccionado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Municipio *</label>
              <select
                value={shippingAddress.municipality}
                onChange={(e) => onInputChange('shippingAddress', 'municipality', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.municipality && touched.municipality ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                disabled={!shippingAddress.state}
              >
                <option value="">
                  {shippingAddress.state ? 'Seleccionar municipio' : 'Primero selecciona departamento'}
                </option>
                {availableMunicipalities.map(municipality => (
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
              {shippingAddress.state && availableMunicipalities.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {availableMunicipalities.length} municipios disponibles en {shippingAddress.state}
                </p>
              )}
            </div>
          </div>

          {/* Código postal y referencias */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ✅ ACTUALIZADO: Código postal automático */}
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
              <p className="text-xs text-gray-500 mt-1">
                Basado en el departamento seleccionado
              </p>
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

          {/* ✅ NUEVO: Info específica del área seleccionada */}
          {shippingAddress.state && (
            <div className={`border rounded-lg p-4 ${
              isMetropolitanArea ? 'bg-green-50 border-green-200' : 
              hasFastShipping ? 'bg-blue-50 border-blue-200' : 
              'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start">
                <Info className={`w-5 h-5 mr-2 mt-0.5 ${
                  isMetropolitanArea ? 'text-green-500' : 
                  hasFastShipping ? 'text-blue-500' : 
                  'text-yellow-500'
                }`} />
                <div className="text-sm">
                  <p className={`font-medium mb-1 ${
                    isMetropolitanArea ? 'text-green-800' : 
                    hasFastShipping ? 'text-blue-800' : 
                    'text-yellow-800'
                  }`}>
                    {isMetropolitanArea ? '🚀 Área Metropolitana' : 
                     hasFastShipping ? '📦 Entrega Rápida Disponible' : 
                     '📍 Entrega Nacional'}
                  </p>
                  <p className={
                    isMetropolitanArea ? 'text-green-700' : 
                    hasFastShipping ? 'text-blue-700' : 
                    'text-yellow-700'
                  }>
                    {isMetropolitanArea ? 
                      'Entrega en 1-2 días hábiles. Disponible entrega el mismo día para pedidos antes de las 12:00 PM.' :
                     hasFastShipping ? 
                      'Entrega en 2-3 días hábiles. Cobertura prioritaria en este departamento.' :
                      'Entrega en 3-5 días hábiles. Enviamos a todo el territorio nacional.'
                    }
                  </p>
                  
                  {/* ✅ NUEVO: Costo de envío específico por área */}
                  <div className="mt-2 text-xs">
                    <span className="font-medium">Costo de envío: </span>
                    {isMetropolitanArea ? 
                      'Q25 (Gratis en compras +Q200)' :
                     hasFastShipping ? 
                      'Q35 (Gratis en compras +Q250)' :
                      'Q45 (Gratis en compras +Q300)'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
          placeholder="Instrucciones especiales para la entrega, horario preferido, etc..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Incluye cualquier información que ayude al repartidor a encontrar tu dirección
        </p>
      </div>
    </div>
  );
};

// Los demás componentes (PaymentStep, ConfirmationStep, OrderSummary) mantienen la misma estructura 
// pero se pueden actualizar para mostrar información específica según el área de entrega

// 💳 COMPONENTE: Paso 2 - Método de pago (mantenido igual pero actualizado)
const PaymentStep = ({ 
  paymentMethod, 
  setPaymentMethod,
  customerInfo,
  shippingAddress,
  notes,
  items,
  summary,
  isAuthenticated,
  sessionInfo,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState('');

  const handleStripePayment = async () => {
    if (!stripe || !elements) {
      onError('Stripe no está disponible');
      return;
    }

    try {
      setIsProcessing(true);
      setCardError('');

      const orderData = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          selectedVariants: item.options || {}
        })),
        customerInfo,
        shippingAddress: {
          ...shippingAddress,
          // ✅ ACTUALIZADO: Incluir información completa de ubicación
          fullAddress: `${shippingAddress.street}, ${shippingAddress.municipality}, ${shippingAddress.state}, Guatemala`,
          departmentCode: shippingAddress.zipCode?.substring(0, 2) || '01',
          isMetropolitan: getMetropolitanDepartments().includes(shippingAddress.state),
          hasFastShipping: getFastShippingDepartments().includes(shippingAddress.state)
        },
        paymentMethod: 'card',
        notes,
        sessionId: !isAuthenticated ? (sessionInfo?.sessionId || `guest_${Date.now()}`) : undefined
      };

      const orderResponse = await apiService.post('/store/orders', orderData);
      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Error al crear la orden');
      }

      const order = orderResponse.data.order;
      const paymentIntentResponse = await apiService.post('/stripe/create-store-intent', {
        orderId: order.id
      });

      if (!paymentIntentResponse.success) {
        throw new Error(paymentIntentResponse.message || 'Error al crear el pago');
      }

      const { clientSecret } = paymentIntentResponse.data;
      const cardElement = elements.getElement(CardElement);

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
            address: {
              line1: shippingAddress.street,
              city: shippingAddress.municipality,
              state: shippingAddress.state,
              postal_code: shippingAddress.zipCode,
              country: 'GT'
            }
          }
        }
      });

      if (error) {
        setCardError(error.message || 'Error al procesar el pago');
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        const confirmResponse = await apiService.post('/stripe/confirm-payment', {
          paymentIntentId: paymentIntent.id
        });

        if (confirmResponse.success) {
          onSuccess({
            ...order,
            paymentIntent: paymentIntent.id,
            paid: true
          });
        } else {
          onSuccess({
            ...order,
            paymentIntent: paymentIntent.id,
            paid: true,
            note: 'Pago exitoso, confirmación pendiente'
          });
        }
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

  const handleCashOnDelivery = async () => {
    try {
      setIsProcessing(true);

      const orderData = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          selectedVariants: item.options || {}
        })),
        customerInfo,
        shippingAddress: {
          ...shippingAddress,
          // ✅ ACTUALIZADO: Incluir información completa de ubicación
          fullAddress: `${shippingAddress.street}, ${shippingAddress.municipality}, ${shippingAddress.state}, Guatemala`,
          departmentCode: shippingAddress.zipCode?.substring(0, 2) || '01',
          isMetropolitan: getMetropolitanDepartments().includes(shippingAddress.state),
          hasFastShipping: getFastShippingDepartments().includes(shippingAddress.state)
        },
        paymentMethod: 'cash_on_delivery',
        notes,
        sessionId: !isAuthenticated ? (sessionInfo?.sessionId || `guest_${Date.now()}`) : undefined
      };

      const response = await apiService.post('/store/orders', orderData);

      if (response.success) {
        onSuccess(response.data.order);
      } else {
        throw new Error(response.message || 'Error al crear la orden');
      }

    } catch (error) {
      onError(error.message || 'Error al crear la orden');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === 'card') {
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
            onClick={() => setPaymentMethod('card')}
            className={`w-full p-4 border rounded-lg text-left transition-colors ${
              paymentMethod === 'card'
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
                <DollarSign className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <div className="font-medium">Pago contra entrega</div>
                  <div className="text-sm text-gray-600">Paga cuando recibas tu pedido</div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Truck className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-blue-600">Popular</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {paymentMethod === 'card' && (
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
            Pago contra entrega
          </h3>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start">
              <Truck className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">¿Cómo funciona?</p>
                <ul className="space-y-1">
                  <li>• Recibirás tu pedido en la dirección indicada</li>
                  <li>• Pagas el monto exacto al repartidor</li>
                  <li>• Aceptamos efectivo y tarjetas</li>
                  <li>• No hay costos adicionales</li>
                  <li>• Entrega estimada según tu ubicación</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <button
          onClick={handlePayment}
          disabled={isProcessing || (paymentMethod === 'card' && (!stripe || !elements))}
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
                {paymentMethod === 'card' 
                  ? `Pagar ${summary ? summary.totalAmount?.toFixed(2) : '0.00'} GTQ`
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

// ✅ COMPONENTE: Paso 3 - Confirmación (mantenido igual)
const ConfirmationStep = ({ order, customerInfo }) => {
  const navigate = useNavigate();

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
                  {order?.paymentMethod === 'card' ? 'Tarjeta de crédito' : 'Pago contra entrega'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Entrega estimada:</span>
                <span className="font-medium">Según tu ubicación</span>
              </div>
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

        <div className="mt-6 text-sm text-gray-500">
          <p>
            Se ha enviado un email de confirmación a <strong>{customerInfo.email}</strong>
          </p>
          <p className="mt-2">
            También recibirás actualizaciones por WhatsApp al teléfono proporcionado
          </p>
        </div>
      </div>
    </div>
  );
};

// ✅ COMPONENTE ACTUALIZADO: Resumen del pedido con información de entrega específica
const OrderSummary = ({ 
  items, 
  summary, 
  formatCurrency, 
  step, 
  onContinue, 
  canContinue,
  isProcessing,
  errors,
  shippingAddress,
  isMetropolitanArea,
  hasFastShipping 
}) => {
  const hasErrors = Object.keys(errors).filter(key => errors[key]).length > 0;
  const errorCount = Object.keys(errors).filter(key => errors[key]).length;

  // ✅ NUEVO: Calcular costo de envío específico por área
  const getShippingCost = () => {
    if (!shippingAddress.state) return 25; // Default
    
    if (isMetropolitanArea) {
      return summary?.totalAmount >= 200 ? 0 : 25;
    } else if (hasFastShipping) {
      return summary?.totalAmount >= 250 ? 0 : 35;
    } else {
      return summary?.totalAmount >= 300 ? 0 : 45;
    }
  };

  const shippingCost = getShippingCost();

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
            Envío:
            {shippingAddress.state && (
              <span className="text-xs block text-gray-500">
                {isMetropolitanArea ? 'Área Metropolitana' : 
                 hasFastShipping ? 'Entrega Rápida' : 
                 'Entrega Nacional'}
              </span>
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
        <div className="flex items-center">
          <Truck className="w-4 h-4 mr-2 text-blue-500" />
          <span>
            {isMetropolitanArea ? 'Envío gratis en compras +Q200' :
             hasFastShipping ? 'Envío gratis en compras +Q250' :
             'Envío gratis en compras +Q300'}
          </span>
        </div>
        <div className="flex items-center">
          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
          <span>Garantía de satisfacción</span>
        </div>
        
        {shippingAddress.state && (
          <div className="text-xs text-gray-500 border-t pt-2 mt-2">
            <div>📍 {shippingAddress.municipality}, {shippingAddress.state}</div>
            <div>📦 Entrega: {
              isMetropolitanArea ? '1-2 días hábiles' :
              hasFastShipping ? '2-3 días hábiles' :
              '3-5 días hábiles'
            }</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;