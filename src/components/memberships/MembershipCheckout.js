// src/components/memberships/MembershipCheckout.js
// FUNCIÓN: Sistema de checkout para membresías - ACTUALIZADO para usar APIs exactas del backend
// CARACTERÍSTICAS: ✅ APIs reales del backend ✅ Autenticación ✅ Formatos correctos ✅ Polling status

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  User, 
  Lock, 
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Shield,
  Crown,
  Calendar,
  DollarSign,
  X,
  Info,
  Star,
  Gift,
  Upload,
  FileText,
  Camera,
  Bank,
  Eye,
  Check
} from 'lucide-react';

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

const MembershipCheckout = ({ 
  selectedPlan, 
  onSuccess, 
  onCancel, 
  currentMembership = null 
}) => {
  const { user, token } = useAuth(); // ✅ NUEVO: Necesitamos el token
  const { showSuccess, showError, isMobile } = useApp();
  
  // Estados principales
  const [step, setStep] = useState(1); // 1: Review, 2: Payment, 3: Success
  const [paymentMethod, setPaymentMethod] = useState('stripe'); // ✅ Usar 'stripe' como en la doc
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  
  // Estados del formulario
  const [customerInfo, setCustomerInfo] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  
  // ✅ Estados para transferencia bancaria
  const [transferData, setTransferData] = useState({
    amount: selectedPlan?.price || 0,
    transferDate: new Date().toISOString().split('T')[0],
    reference: '',
    notes: ''
  });
  
  const [transferFile, setTransferFile] = useState(null);
  const [transferPreview, setTransferPreview] = useState(null);
  const [paymentPollingId, setPaymentPollingId] = useState(null);
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ✅ ACTUALIZADO: Inicializar Stripe usando la API real del backend
  useEffect(() => {
    const initializeStripe = async () => {
      try {
        console.log('💳 Inicializando Stripe usando API del backend...');
        
        // ✅ Usar endpoint real: GET /api/stripe/config
        const response = await fetch('/api/stripe/config', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        console.log('🔧 Stripe config response:', data);
        
        if (data.success && data.data?.stripe?.enabled) {
          const publishableKey = data.data.stripe.publishableKey;
          const stripe = await loadStripe(publishableKey);
          setStripePromise(Promise.resolve(stripe));
          console.log('✅ Stripe cargado desde backend:', publishableKey);
        } else {
          console.warn('⚠️ Stripe no habilitado en backend');
          setPaymentMethod('transfer'); // Cambiar a transferencia por defecto
          showError('Pagos con tarjeta no disponibles. Solo transferencia bancaria.');
        }
      } catch (error) {
        console.error('❌ Error cargando Stripe desde backend:', error);
        setPaymentMethod('transfer');
        showError('Error cargando sistema de pagos con tarjeta');
      }
    };

    if (token) {
      initializeStripe();
    }
  }, [token, showError]);

  // ✅ Validación de campos (mantener igual)
  const validateField = (name, value) => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) return 'Este campo es requerido';
        if (value.trim().length < 2) return 'Debe tener al menos 2 caracteres';
        if (!/^[A-Za-zÀ-ÿ\u00f1\u00d1\s\-'\.]+$/.test(value)) return 'Solo se permiten letras y espacios';
        break;
      case 'email':
        if (!value.trim()) return 'El email es requerido';
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) return 'Email inválido';
        break;
      case 'phone':
        if (!value.trim()) return 'El teléfono es requerido';
        const cleanPhone = value.replace(/[\s\-\(\)\+]/g, '');
        if (cleanPhone.length < 7 || cleanPhone.length > 15) return 'Teléfono debe tener entre 7 y 15 dígitos';
        break;
      case 'reference':
        if (paymentMethod === 'transfer' && !value.trim()) return 'La referencia es requerida para transferencias';
        break;
      default:
        return null;
    }
    return null;
  };

  // Manejar cambios en inputs (mantener igual)
  const handleInputChange = (field, value) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  // Manejar cambios en datos de transferencia
  const handleTransferChange = (field, value) => {
    setTransferData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  // ✅ Manejar upload de comprobante
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showError('Solo se permiten archivos JPG, PNG o PDF');
      return;
    }

    // Validar tamaño (5MB máx)
    if (file.size > 5 * 1024 * 1024) {
      showError('El archivo no puede superar 5MB');
      return;
    }

    setTransferFile(file);

    // Crear preview para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setTransferPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setTransferPreview(null);
    }

    console.log('📎 Archivo de comprobante seleccionado:', file.name);
  };

  // ✅ Validar formulario completo
  const validateForm = () => {
    const newErrors = {};
    
    // Validar info personal
    Object.keys(customerInfo).forEach(field => {
      const error = validateField(field, customerInfo[field]);
      if (error) newErrors[field] = error;
    });

    // Validar datos de transferencia si es necesario
    if (paymentMethod === 'transfer') {
      const referenceError = validateField('reference', transferData.reference);
      if (referenceError) newErrors.reference = referenceError;

      if (!transferFile) {
        newErrors.transferFile = 'Debes subir el comprobante de transferencia';
      }
    }
    
    setErrors(newErrors);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      reference: paymentMethod === 'transfer',
      transferFile: paymentMethod === 'transfer'
    });
    
    return Object.keys(newErrors).length === 0;
  };

  // Continuar al paso de pago
  const handleContinueToPayment = () => {
    if (validateForm()) {
      setStep(2);
    } else {
      showError('Por favor corrige los errores en el formulario');
    }
  };

  // ✅ NUEVO: Polling para verificar estado del pago
  const startPaymentStatusPolling = (paymentId) => {
    console.log('🔄 Iniciando polling para pago:', paymentId);
    
    const pollInterval = setInterval(async () => {
      try {
        console.log('🔍 Verificando estado del pago:', paymentId);
        
        // ✅ Usar endpoint real: GET /api/payments/:id
        const response = await fetch(`/api/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          const status = data.data.payment.status;
          console.log('📊 Estado del pago:', status);
          
          if (status === 'completed') {
            clearInterval(pollInterval);
            console.log('✅ Pago completado - mostrando éxito');
            
            setCompletedOrder({
              id: paymentId,
              amount: selectedPlan.price,
              planName: selectedPlan.name,
              paymentMethod: 'transfer',
              status: 'completed'
            });
            setStep(3);
            
            showSuccess('¡Pago aprobado! Tu membresía ha sido activada exitosamente.');
            
          } else if (status === 'failed') {
            clearInterval(pollInterval);
            console.log('❌ Pago falló');
            showError('Tu transferencia fue rechazada. Contacta soporte para más información.');
          }
        }
      } catch (error) {
        console.error('Error verificando estado del pago:', error);
      }
    }, 30000); // Verificar cada 30 segundos

    // Limpiar después de 10 minutos
    setTimeout(() => {
      clearInterval(pollInterval);
      console.log('⏰ Polling detenido después de 10 minutos');
    }, 600000);

    return pollInterval;
  };

  // ✅ Renderizar según el paso actual
  if (step === 3 && completedOrder) {
    return <SuccessStep order={completedOrder} onContinue={onSuccess} />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onCancel}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span>Volver a planes</span>
        </button>
        
        <h2 className="text-2xl font-bold text-gray-900">
          {step === 1 && 'Confirmar membresía'}
          {step === 2 && 'Método de pago'}
        </h2>
        
        <div className="flex items-center text-sm text-gray-600">
          <Shield className="w-4 h-4 mr-1" />
          <span>Pago seguro</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center">
          {[1, 2, 3].map((stepNumber) => (
            <React.Fragment key={stepNumber}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                step >= stepNumber 
                  ? 'bg-primary-600 border-primary-600 text-white' 
                  : 'border-gray-300 text-gray-400'
              }`}>
                {step > stepNumber ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <span className="font-semibold">{stepNumber}</span>
                )}
              </div>
              {stepNumber < 3 && (
                <div className={`flex-1 h-1 mx-4 transition-colors ${
                  step > stepNumber ? 'bg-primary-600' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>Revisar plan</span>
          <span>Pagar</span>
          <span>¡Listo!</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulario principal */}
        <div className="lg:col-span-2">
          {step === 1 && (
            <ReviewStep
              selectedPlan={selectedPlan}
              currentMembership={currentMembership}
              customerInfo={customerInfo}
              transferData={transferData}
              transferFile={transferFile}
              transferPreview={transferPreview}
              errors={errors}
              touched={touched}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              onInputChange={handleInputChange}
              onTransferChange={handleTransferChange}
              onFileUpload={handleFileUpload}
              onContinue={handleContinueToPayment}
              user={user}
              stripeAvailable={!!stripePromise}
            />
          )}

          {step === 2 && (
            <>
              {paymentMethod === 'stripe' && stripePromise ? (
                <Elements stripe={stripePromise}>
                  <PaymentStep
                    selectedPlan={selectedPlan}
                    customerInfo={customerInfo}
                    transferData={transferData}
                    transferFile={transferFile}
                    paymentMethod={paymentMethod}
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                    onSuccess={(order) => {
                      setCompletedOrder(order);
                      setStep(3);
                    }}
                    onError={showError}
                    onBack={() => setStep(1)}
                    token={token}
                    user={user}
                    startPaymentStatusPolling={startPaymentStatusPolling}
                  />
                </Elements>
              ) : (
                <PaymentStep
                  selectedPlan={selectedPlan}
                  customerInfo={customerInfo}
                  transferData={transferData}
                  transferFile={transferFile}
                  paymentMethod={paymentMethod}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                  onSuccess={(order) => {
                    setCompletedOrder(order);
                    setStep(3);
                  }}
                  onError={showError}
                  onBack={() => setStep(1)}
                  token={token}
                  user={user}
                  startPaymentStatusPolling={startPaymentStatusPolling}
                />
              )}
            </>
          )}
        </div>

        {/* Resumen del plan */}
        <div className="lg:col-span-1">
          <PlanSummary 
            selectedPlan={selectedPlan} 
            currentMembership={currentMembership}
            step={step}
          />
        </div>
      </div>
    </div>
  );
};

// ✅ STEP 1: Revisar plan y datos - ACTUALIZADO con mejor UI para método de pago
const ReviewStep = ({ 
  selectedPlan, 
  currentMembership, 
  customerInfo, 
  transferData,
  transferFile,
  transferPreview,
  errors, 
  touched, 
  paymentMethod,
  setPaymentMethod,
  onInputChange, 
  onTransferChange,
  onFileUpload,
  onContinue,
  user,
  stripeAvailable
}) => {
  const isUpgrade = currentMembership && selectedPlan.price > (currentMembership.price || 0);
  const isDowngrade = currentMembership && selectedPlan.price < (currentMembership.price || 0);

  return (
    <div className="space-y-6">
      
      {/* Información personal */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <User className="w-5 h-5 text-primary-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Confirmar información personal
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={customerInfo.firstName}
              onChange={(e) => onInputChange('firstName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                errors.firstName && touched.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Juan"
            />
            {errors.firstName && touched.firstName && (
              <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido *
            </label>
            <input
              type="text"
              value={customerInfo.lastName}
              onChange={(e) => onInputChange('lastName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                errors.lastName && touched.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Pérez"
            />
            {errors.lastName && touched.lastName && (
              <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={customerInfo.email}
              onChange={(e) => onInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                errors.email && touched.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="juan@example.com"
              disabled={!!user?.email}
            />
            {errors.email && touched.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => onInputChange('phone', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                errors.phone && touched.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="5555-5555"
            />
            {errors.phone && touched.phone && (
              <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Selección de método de pago */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Método de pago
        </h3>

        <div className="space-y-3">
          {/* ✅ Pago con tarjeta - solo si está disponible */}
          {stripeAvailable && (
            <button
              onClick={() => setPaymentMethod('stripe')}
              className={`w-full p-4 border rounded-lg text-left transition-colors ${
                paymentMethod === 'stripe'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="w-5 h-5 text-gray-600 mr-3" />
                  <div>
                    <div className="font-medium">Pago con tarjeta</div>
                    <div className="text-sm text-gray-600">Visa, Mastercard • Activación inmediata</div>
                  </div>
                </div>
                <Shield className="w-5 h-5 text-green-500" />
              </div>
            </button>
          )}

          {/* ✅ Transferencia bancaria */}
          <button
            onClick={() => setPaymentMethod('transfer')}
            className={`w-full p-4 border rounded-lg text-left transition-colors ${
              paymentMethod === 'transfer'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Bank className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <div className="font-medium">Transferencia bancaria</div>
                  <div className="text-sm text-gray-600">Requiere comprobante • Validación 1-2 días</div>
                </div>
              </div>
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
          </button>

          {/* ✅ Mostrar alerta si solo está disponible transferencia */}
          {!stripeAvailable && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center text-yellow-700 text-sm">
                <Info className="w-4 h-4 mr-2" />
                <span>Pagos con tarjeta temporalmente no disponibles. Solo transferencia bancaria.</span>
              </div>
            </div>
          )}
        </div>

        {/* ✅ Formulario de transferencia bancaria */}
        {paymentMethod === 'transfer' && (
          <div className="mt-6 space-y-4 border-t pt-6">
            <h4 className="font-medium text-gray-900">
              Datos de la transferencia
            </h4>

            {/* Información bancaria */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2">
                Datos para la transferencia:
              </h5>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Banco:</strong> Banco Industrial</p>
                <p><strong>Número de cuenta:</strong> 123-456789-0</p>
                <p><strong>A nombre de:</strong> Elite Fitness Club S.A.</p>
                <p><strong>Tipo:</strong> Cuenta Monetaria</p>
                <p><strong>Monto a transferir:</strong> Q{selectedPlan.price}</p>
              </div>
            </div>

            {/* Referencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de referencia o boleta *
              </label>
              <input
                type="text"
                value={transferData.reference}
                onChange={(e) => onTransferChange('reference', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                  errors.reference && touched.reference ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: 123456789 o número de boleta"
              />
              {errors.reference && touched.reference && (
                <p className="text-red-600 text-sm mt-1">{errors.reference}</p>
              )}
            </div>

            {/* Upload de comprobante */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comprobante de transferencia *
              </label>
              
              <div className="space-y-3">
                {!transferFile ? (
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        Subir comprobante
                      </p>
                      <p className="text-xs text-gray-600">
                        JPG, PNG o PDF (máximo 5MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={onFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {transferPreview ? (
                          <img 
                            src={transferPreview} 
                            alt="Comprobante"
                            className="w-12 h-12 object-cover rounded mr-3"
                          />
                        ) : (
                          <FileText className="w-12 h-12 text-red-500 mr-3" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {transferFile.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {(transferFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {transferPreview && (
                          <button
                            type="button"
                            onClick={() => window.open(transferPreview, '_blank')}
                            className="p-2 text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setTransferFile(null);
                            setTransferPreview(null);
                          }}
                          className="p-2 text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {errors.transferFile && touched.transferFile && (
                  <p className="text-red-600 text-sm">{errors.transferFile}</p>
                )}
              </div>
            </div>

            {/* Notas adicionales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas adicionales (opcional)
              </label>
              <textarea
                value={transferData.notes}
                onChange={(e) => onTransferChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                rows="3"
                placeholder="Información adicional sobre la transferencia..."
              />
            </div>

            {/* Información importante */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 mb-1">
                    Importante sobre transferencias bancarias:
                  </p>
                  <ul className="text-yellow-700 space-y-1">
                    <li>• La validación puede tomar 1-2 días hábiles</li>
                    <li>• Verifica que el monto sea exacto (Q{selectedPlan.price})</li>
                    <li>• Guarda tu comprobante de transferencia</li>
                    <li>• Te contactaremos para confirmar la activación</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estado actual de membresía (mantener igual) */}
      {currentMembership && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tu membresía actual
          </h3>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">{currentMembership.planName}</h4>
              <p className="text-sm text-gray-600">
                Vence: {new Date(currentMembership.endDate).toLocaleDateString('es-ES')}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">Q{currentMembership.price}</p>
              <p className="text-sm text-gray-600">/{currentMembership.duration}</p>
            </div>
          </div>

          {/* Indicador de cambio */}
          {isUpgrade && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center text-green-700">
                <Star className="w-5 h-5 mr-2" />
                <span className="font-medium">⬆️ Upgrade de plan</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Obtendrás beneficios adicionales con el nuevo plan
              </p>
            </div>
          )}

          {isDowngrade && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center text-yellow-700">
                <Info className="w-5 h-5 mr-2" />
                <span className="font-medium">⬇️ Cambio de plan</span>
              </div>
              <p className="text-sm text-yellow-600 mt-1">
                El nuevo plan se activará en tu próximo período de facturación
              </p>
            </div>
          )}
        </div>
      )}

      {/* Botón continuar */}
      <button
        onClick={onContinue}
        className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
      >
        Continuar al pago
      </button>
    </div>
  );
};

// ✅ STEP 2: Método de pago - ACTUALIZADO para usar APIs reales del backend
const PaymentStep = ({ 
  selectedPlan, 
  customerInfo, 
  transferData,
  transferFile,
  paymentMethod, 
  isProcessing, 
  setIsProcessing, 
  onSuccess, 
  onError, 
  onBack,
  token,
  user,
  startPaymentStatusPolling
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState('');

  // ✅ ACTUALIZADO: Pago con tarjeta usando APIs reales del backend
  const handleCardPayment = async () => {
    if (!stripe || !elements) {
      onError('Sistema de pagos no disponible');
      return;
    }

    try {
      setIsProcessing(true);
      setCardError('');

      console.log('💳 Iniciando pago de membresía con tarjeta...');

      // ✅ 1. Crear payment intent usando API real: POST /api/stripe/create-membership-intent
      const response = await fetch('/api/stripe/create-membership-intent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          membershipType: selectedPlan.type || 'monthly', // ej: "monthly", "yearly"
          price: selectedPlan.price,
          membershipId: selectedPlan.id
        })
      });

      const data = await response.json();
      console.log('🔧 Payment intent response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Error al crear el pago');
      }

      const { clientSecret, paymentIntentId } = data.data;

      // ✅ 2. Confirmar pago con Stripe
      const cardElement = elements.getElement(CardElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${customerInfo.firstName} ${customerInfo.lastName}`,
            email: customerInfo.email,
            phone: customerInfo.phone
          }
        }
      });

      if (error) {
        setCardError(error.message);
        onError('Error en el pago: ' + error.message);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        console.log('✅ Pago confirmado con Stripe');
        
        // ✅ 3. Confirmar en backend usando API real: POST /api/stripe/confirm-payment
        const confirmResponse = await fetch('/api/stripe/confirm-payment', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id
          })
        });

        const confirmData = await confirmResponse.json();
        console.log('🔧 Confirm payment response:', confirmData);

        if (!confirmData.success) {
          throw new Error('Error al confirmar el pago de membresía');
        }

        console.log('✅ Pago de membresía completado exitosamente');
        onSuccess({
          id: paymentIntent.id,
          amount: selectedPlan.price,
          planName: selectedPlan.name,
          paymentMethod: 'stripe',
          cardLast4: paymentIntent.charges?.data?.[0]?.payment_method_details?.card?.last4,
          status: 'completed',
          membership: confirmData.data.membership // ✅ Datos de la membresía creada
        });
      }

    } catch (error) {
      console.error('❌ Error en pago de membresía:', error);
      onError(error.message || 'Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ ACTUALIZADO: Pago por transferencia bancaria usando APIs reales del backend
  const handleBankTransferPayment = async () => {
    try {
      setIsProcessing(true);

      console.log('🏦 Registrando pago de membresía por transferencia...');

      // ✅ 1. Crear pago usando API real: POST /api/payments
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          membershipId: selectedPlan.id, // opcional
          amount: selectedPlan.price,
          paymentMethod: 'transfer', // ✅ Según documentación
          paymentType: 'membership', // ✅ Según documentación
          description: `Membresía ${selectedPlan.name}`,
          notes: transferData.notes || 'Pago por transferencia bancaria'
        })
      });

      const data = await response.json();
      console.log('🔧 Create payment response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Error al crear el pago');
      }

      const payment = data.data.payment;

      // ✅ 2. Subir comprobante usando API real: POST /api/payments/:id/transfer-proof
      if (transferFile) {
        console.log('📎 Subiendo comprobante de transferencia...');
        
        const formData = new FormData();
        formData.append('proof', transferFile);

        const uploadResponse = await fetch(`/api/payments/${payment.id}/transfer-proof`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const uploadData = await uploadResponse.json();
        console.log('🔧 Upload proof response:', uploadData);

        if (!uploadData.success) {
          throw new Error('Error al subir el comprobante');
        }
      }

      console.log('✅ Transferencia de membresía registrada exitosamente');
      
      // ✅ 3. Iniciar polling para verificar estado
      startPaymentStatusPolling(payment.id);

      onSuccess({
        id: payment.id,
        amount: selectedPlan.price,
        planName: selectedPlan.name,
        paymentMethod: 'transfer',
        status: 'pending_verification',
        reference: transferData.reference
      });

    } catch (error) {
      console.error('❌ Error en transferencia de membresía:', error);
      onError(error.message || 'Error al enviar la transferencia');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === 'stripe') {
      handleCardPayment();
    } else if (paymentMethod === 'transfer') {
      handleBankTransferPayment();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Resumen del pago */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Resumen del pago
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Plan seleccionado:</span>
            <span className="font-medium">{selectedPlan.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Duración:</span>
            <span className="font-medium">{selectedPlan.duration}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Método de pago:</span>
            <span className="font-medium">
              {paymentMethod === 'stripe' ? 'Tarjeta de crédito/débito' : 'Transferencia bancaria'}
            </span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total a pagar:</span>
              <span className="text-primary-600">Q{selectedPlan.price}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de pago específico */}
      {paymentMethod === 'stripe' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
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

      {paymentMethod === 'transfer' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Confirmación de transferencia
          </h3>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                <div className="text-sm">
                  <p className="text-green-800 font-medium mb-1">
                    Datos de transferencia recibidos
                  </p>
                  <div className="text-green-700 space-y-1">
                    <p>• Monto: Q{transferData.amount || selectedPlan.price}</p>
                    <p>• Referencia: {transferData.reference}</p>
                    <p>• Fecha: {new Date(transferData.transferDate || Date.now()).toLocaleDateString('es-ES')}</p>
                    <p>• Comprobante: {transferFile?.name}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <p className="font-medium mb-1">¿Qué sigue?</p>
                  <ul className="space-y-1">
                    <li>• Verificaremos tu transferencia en 1-2 días hábiles</li>
                    <li>• Te contactaremos para confirmar la activación</li>
                    <li>• Recibirás una notificación cuando esté lista</li>
                    <li>• Podrás usar tu membresía inmediatamente después</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex space-x-4">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          Volver
        </button>
        
        <button
          onClick={handlePayment}
          disabled={isProcessing || (paymentMethod === 'stripe' && (!stripe || !elements))}
          className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
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
                {paymentMethod === 'stripe' 
                  ? `Pagar Q${selectedPlan.price}`
                  : 'Enviar transferencia'
                }
              </span>
            </>
          )}
        </button>
      </div>

      <div className="flex items-center justify-center text-sm text-gray-500">
        <Shield className="w-4 h-4 mr-1" />
        <span>Tus datos están protegidos con encriptación SSL</span>
      </div>
    </div>
  );
};

// ✅ STEP 3: Confirmación exitosa (mantener igual)
const SuccessStep = ({ order, onContinue }) => {
  return (
    <div className="text-center space-y-8">
      
      {/* Icono de éxito */}
      <div className="flex justify-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>
      </div>

      {/* Mensaje principal */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {order.status === 'completed' ? '¡Pago exitoso!' : '¡Solicitud enviada!'}
        </h2>
        <p className="text-xl text-gray-600">
          {order.status === 'completed' 
            ? 'Tu membresía ha sido activada correctamente'
            : 'Hemos recibido tu solicitud de membresía'
          }
        </p>
      </div>

      {/* Detalles del pedido */}
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto">
        <h3 className="font-semibold text-gray-900 mb-4">Detalles de la compra</h3>
        <div className="space-y-3 text-left">
          <div className="flex justify-between">
            <span className="text-gray-600">Plan:</span>
            <span className="font-medium">{order.planName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Monto:</span>
            <span className="font-medium">Q{order.amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Método:</span>
            <span className="font-medium">
              {order.paymentMethod === 'stripe' ? 'Tarjeta' : 'Transferencia'}
            </span>
          </div>
          {order.cardLast4 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Tarjeta:</span>
              <span className="font-medium">**** **** **** {order.cardLast4}</span>
            </div>
          )}
          {order.reference && (
            <div className="flex justify-between">
              <span className="text-gray-600">Referencia:</span>
              <span className="font-medium">{order.reference}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Estado:</span>
            <span className={`font-medium ${
              order.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {order.status === 'completed' ? '✅ Activa' : '⏳ En verificación'}
            </span>
          </div>
        </div>
      </div>

      {/* Información específica según el método */}
      {order.status === 'pending_verification' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <h4 className="font-medium text-yellow-800 mb-2">
            ⏳ Verificando tu transferencia
          </h4>
          <p className="text-sm text-yellow-700">
            Verificaremos tu pago en 1-2 días hábiles y te contactaremos para activar tu membresía.
          </p>
        </div>
      )}

      {order.status === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
          <h4 className="font-medium text-green-800 mb-2">
            🎉 ¡Membresía activada!
          </h4>
          <p className="text-sm text-green-700">
            Ya puedes acceder a todas nuestras instalaciones y servicios.
          </p>
        </div>
      )}

      {/* Botón continuar */}
      <button
        onClick={onContinue}
        className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
      >
        Volver al dashboard
      </button>
    </div>
  );
};

// ✅ Resumen del plan seleccionado (mantener igual)
const PlanSummary = ({ selectedPlan, currentMembership, step }) => {
  if (!selectedPlan) return null;

  const IconComponent = selectedPlan.iconName === 'crown' ? Crown : 
                      selectedPlan.iconName === 'calendar-days' ? Calendar : 
                      Shield;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Plan seleccionado
      </h3>

      <div className="space-y-4">
        {/* Icono y nombre del plan */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 flex items-center justify-center">
            <IconComponent className="w-8 h-8 text-primary-600" />
          </div>
          <h4 className="text-xl font-bold text-gray-900">{selectedPlan.name}</h4>
          {selectedPlan.popular && (
            <span className="inline-block mt-2 bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              🔥 Más Popular
            </span>
          )}
        </div>

        {/* Precio */}
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">
            Q{selectedPlan.price}
          </div>
          <div className="text-gray-600">
            /{selectedPlan.duration}
          </div>
          {selectedPlan.originalPrice && selectedPlan.originalPrice > selectedPlan.price && (
            <div className="text-sm text-gray-500">
              <span className="line-through">Q{selectedPlan.originalPrice}</span>
              <span className="ml-2 text-green-600 font-semibold">
                Ahorra Q{selectedPlan.originalPrice - selectedPlan.price}
              </span>
            </div>
          )}
        </div>

        {/* Características */}
        {selectedPlan.features && selectedPlan.features.length > 0 && (
          <div>
            <h5 className="font-medium text-gray-900 mb-3">Incluye:</h5>
            <ul className="space-y-2">
              {selectedPlan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Estado actual */}
        {currentMembership && (
          <div className="border-t pt-4">
            <h5 className="font-medium text-gray-900 mb-2">Membresía actual:</h5>
            <p className="text-sm text-gray-600">
              {currentMembership.planName} - Q{currentMembership.price}
            </p>
            <p className="text-xs text-gray-500">
              Vence: {new Date(currentMembership.endDate).toLocaleDateString('es-ES')}
            </p>
          </div>
        )}

        {/* Garantía */}
        <div className="border-t pt-4">
          <div className="flex items-center text-sm text-gray-600">
            <Shield className="w-4 h-4 mr-2" />
            <span>Garantía de satisfacción</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipCheckout;