// src/pages/checkout/CheckoutPage.js
// FUNCIÓN: Página de checkout CON VALIDACIONES COMPLETAS - Invitados + autenticados + Stripe
// VALIDACIONES: ✅ Nombres solo letras ✅ Teléfonos solo números ✅ Email formato correcto ✅ Campos requeridos

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
  Clock,
  Shield,
  Truck,
  Eye,
  EyeOff,
  Calendar,
  DollarSign,
  X
} from 'lucide-react';

import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

// Importar Stripe
import { loadStripe } from '@stripe/stripe-js';
import { 
  Elements, 
  CardElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';

// ✅ REGEX PARA VALIDACIONES
const VALIDATION_PATTERNS = {
  name: /^[A-Za-zÀ-ÿ\u00f1\u00d1\s\-']+$/, // Solo letras, espacios, acentos, guiones, apostrofes
  phone: /^[\d\s\-\(\)\+]+$/, // Solo números, espacios, guiones, paréntesis, +
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Email válido
  address: /^[A-Za-zÀ-ÿ\u00f1\u00d1\d\s\-.,#°]+$/ // Letras, números, espacios, caracteres de dirección
};

// ✅ MENSAJES DE ERROR
const ERROR_MESSAGES = {
  name: 'Solo se permiten letras, espacios y acentos',
  phone: 'Solo se permiten números, espacios, guiones y paréntesis',
  email: 'Ingresa un email válido (ejemplo@correo.com)',
  address: 'Ingresa una dirección válida',
  required: 'Este campo es requerido',
  minLength: 'Debe tener al menos {min} caracteres',
  phoneLength: 'El teléfono debe tener entre 8 y 15 dígitos'
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

  // ✅ ESTADOS DEL FORMULARIO CON VALIDACIÓN
  const [customerInfo, setCustomerInfo] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: 'Guatemala',
    state: 'Guatemala',
    zipCode: '01001',
    reference: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('morning');
  const [notes, setNotes] = useState('');
  
  // ✅ ESTADOS DE VALIDACIÓN
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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

  // ✅ FUNCIÓN: Validar un campo específico
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
        const cleanPhone = value.replace(/\s/g, '');
        if (!value.trim()) {
          fieldErrors[name] = ERROR_MESSAGES.required;
        } else if (!VALIDATION_PATTERNS.phone.test(value)) {
          fieldErrors[name] = ERROR_MESSAGES.phone;
        } else if (cleanPhone.length < 8 || cleanPhone.length > 15) {
          fieldErrors[name] = ERROR_MESSAGES.phoneLength;
        }
        break;

      case 'street':
        if (!value.trim()) {
          fieldErrors[name] = ERROR_MESSAGES.required;
        } else if (value.trim().length < 5) {
          fieldErrors[name] = ERROR_MESSAGES.minLength.replace('{min}', '5');
        } else if (!VALIDATION_PATTERNS.address.test(value)) {
          fieldErrors[name] = ERROR_MESSAGES.address;
        }
        break;

      default:
        break;
    }

    return fieldErrors;
  };

  // ✅ FUNCIÓN: Manejar cambio de input con validación en tiempo real
  const handleInputChange = (section, field, value) => {
    // Actualizar valor
    if (section === 'customerInfo') {
      setCustomerInfo(prev => ({ ...prev, [field]: value }));
    } else if (section === 'shippingAddress') {
      setShippingAddress(prev => ({ ...prev, [field]: value }));
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

  // ✅ FUNCIÓN: Filtrar caracteres no permitidos mientras se escribe
  const handleKeyPress = (e, type) => {
    const char = e.key;
    
    switch (type) {
      case 'name':
        // Solo letras, espacios, acentos, guiones, apostrofes
        if (!/[A-Za-zÀ-ÿ\u00f1\u00d1\s\-']/.test(char) && char !== 'Backspace' && char !== 'Delete') {
          e.preventDefault();
        }
        break;
        
      case 'phone':
        // Solo números, espacios, guiones, paréntesis, +
        if (!/[\d\s\-\(\)\+]/.test(char) && char !== 'Backspace' && char !== 'Delete') {
          e.preventDefault();
        }
        break;
        
      default:
        break;
    }
  };

  // 📝 FUNCIÓN: Validar todo el formulario
  const validateForm = () => {
    const newErrors = {};

    // Validar información del cliente
    Object.assign(newErrors, validateField('name', customerInfo.name));
    Object.assign(newErrors, validateField('email', customerInfo.email));
    Object.assign(newErrors, validateField('phone', customerInfo.phone));

    // Validar dirección de envío
    Object.assign(newErrors, validateField('street', shippingAddress.street));

    setErrors(newErrors);
    
    // Marcar todos los campos como tocados
    setTouched({
      name: true,
      email: true,
      phone: true,
      street: true
    });

    return Object.keys(newErrors).length === 0;
  };

  // ➡️ FUNCIÓN: Continuar al siguiente paso
  const handleContinue = () => {
    if (validateForm()) {
      setStep(2);
    } else {
      showError('Por favor corrige los errores en el formulario');
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
                deliveryTimeSlot={deliveryTimeSlot}
                setDeliveryTimeSlot={setDeliveryTimeSlot}
                notes={notes}
                setNotes={setNotes}
                errors={errors}
                touched={touched}
                isAuthenticated={isAuthenticated}
                user={user}
                onInputChange={handleInputChange}
                onKeyPress={handleKeyPress}
              />
            )}

            {step === 2 && stripePromise && (
              <Elements stripe={stripePromise}>
                <PaymentStep
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  customerInfo={customerInfo}
                  shippingAddress={shippingAddress}
                  deliveryTimeSlot={deliveryTimeSlot}
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
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ COMPONENTE: Paso 1 - Información del cliente CON VALIDACIONES
const CustomerInfoStep = ({ 
  customerInfo, 
  shippingAddress, 
  deliveryTimeSlot,
  setDeliveryTimeSlot,
  notes,
  setNotes,
  errors,
  touched,
  isAuthenticated,
  user,
  onInputChange,
  onKeyPress
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
              placeholder="Juan Pérez"
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
            </label>
            <input
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => onInputChange('customerInfo', 'phone', e.target.value)}
              onKeyPress={(e) => onKeyPress(e, 'phone')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.phone && touched.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="+502 5555-5555"
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

      {/* 📍 DIRECCIÓN DE ENVÍO */}
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
              Dirección *
            </label>
            <input
              type="text"
              value={shippingAddress.street}
              onChange={(e) => onInputChange('shippingAddress', 'street', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.street && touched.street ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="5ta Avenida 12-34, Zona 10"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <select
                value={shippingAddress.city}
                onChange={(e) => onInputChange('shippingAddress', 'city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="Guatemala">Guatemala</option>
                <option value="Mixco">Mixco</option>
                <option value="Villa Nueva">Villa Nueva</option>
                <option value="Petapa">Petapa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
              <select
                value={shippingAddress.state}
                onChange={(e) => onInputChange('shippingAddress', 'state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="Guatemala">Guatemala</option>
                <option value="Sacatepéquez">Sacatepéquez</option>
                <option value="Escuintla">Escuintla</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código postal</label>
              <input
                type="text"
                value={shippingAddress.zipCode}
                onChange={(e) => onInputChange('shippingAddress', 'zipCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="01001"
              />
            </div>
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
      </div>

      {/* ⏰ HORARIO DE ENTREGA */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <Clock className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Horario de entrega
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { value: 'morning', label: 'Mañana', time: '8:00 AM - 12:00 PM' },
            { value: 'afternoon', label: 'Tarde', time: '1:00 PM - 5:00 PM' },
            { value: 'evening', label: 'Noche', time: '6:00 PM - 9:00 PM' }
          ].map((slot) => (
            <button
              key={slot.value}
              onClick={() => setDeliveryTimeSlot(slot.value)}
              className={`p-4 border rounded-lg text-left transition-colors ${
                deliveryTimeSlot === slot.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">{slot.label}</div>
              <div className="text-sm text-gray-600">{slot.time}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 📝 NOTAS ADICIONALES */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <Package className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Notas adicionales
          </h2>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          rows="3"
          placeholder="Instrucciones especiales para la entrega..."
        />
      </div>
    </div>
  );
};

// 💳 COMPONENTE: Paso 2 - Método de pago (igual que antes)
const PaymentStep = ({ 
  paymentMethod, 
  setPaymentMethod,
  customerInfo,
  shippingAddress,
  deliveryTimeSlot,
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
        shippingAddress,
        paymentMethod: 'card',
        deliveryTimeSlot,
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
              city: shippingAddress.city,
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
        shippingAddress,
        paymentMethod: 'cash_on_delivery',
        deliveryTimeSlot,
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

// ✅ COMPONENTE: Paso 3 - Confirmación (igual que antes)
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
        </div>
      </div>
    </div>
  );
};

// 📋 COMPONENTE: Resumen del pedido CON INDICADOR DE ERRORES
const OrderSummary = ({ 
  items, 
  summary, 
  formatCurrency, 
  step, 
  onContinue, 
  canContinue,
  isProcessing,
  errors 
}) => {
  const hasErrors = Object.keys(errors).length > 0;

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
          <span className="text-gray-600">Envío:</span>
          <span>{summary?.shippingAmount > 0 ? formatCurrency(summary.shippingAmount) : 'Gratis'}</span>
        </div>
        
        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Total:</span>
          <span className="text-primary-600">
            {formatCurrency(summary?.totalAmount || 0)}
          </span>
        </div>
      </div>

      {canContinue && (
        <>
          {hasErrors && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span>Corrige los errores para continuar</span>
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
            Continuar al pago
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
          <span>Envío gratis en compras +Q200</span>
        </div>
        <div className="flex items-center">
          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
          <span>Garantía de satisfacción</span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;