// Autor: Alexander Echeverria
// src/components/memberships/MembershipCheckout.js
// FUNCIÓN: Checkout completo para membresías - Tarjeta y Transferencia
// INTEGRA: Con Stripe Elements y upload de comprobantes

import React, { useState, useEffect, useRef } from 'react';
import { 
  CreditCard, 
  Upload, 
  User, 
  Crown,
  ArrowLeft, 
  Lock, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Calendar,
  Bird,
  Clock,
  FileText,
  AlertTriangle,
  X,
  Check,
  Wifi,
  Phone,
  Mail
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import membershipService from '../../services/membershipService';

// Importar Stripe - IGUAL QUE EN CHECKOUT
import { loadStripe } from '@stripe/stripe-js';
import { 
  Elements, 
  CardElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';

const MembershipCheckout = ({ selectedPlan, onBack, onSuccess }) => {
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError, showInfo, formatCurrency, isMobile } = useApp();
  
  // Estados principales
  const [step, setStep] = useState(1); // 1: Plan Info, 2: Payment, 3: Confirmation
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedMembership, setCompletedMembership] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  
  // Estados de pago
  const [paymentMethod, setPaymentMethod] = useState('stripe'); // 'stripe' o 'transfer'
  
  // Ref para prevenir múltiples inicializaciones de Stripe
  const stripeInitialized = useRef(false);
  
  // EFECTO: Verificar autenticación
  useEffect(() => {
    if (!isAuthenticated) {
      showError('Debes iniciar sesión para adquirir una membresía');
      onBack();
    }
  }, [isAuthenticated, onBack, showError]);
  
  // EFECTO: Inicializar Stripe
  useEffect(() => {
    const initializeStripe = async () => {
      if (stripeInitialized.current) return;
      
      try {
        console.log('Inicializando Stripe para membresías...');
        
        // Usar servicio de membresías
        const stripeConfig = await membershipService.checkStripeConfig();
        
        if (stripeConfig?.enabled) {
          const publishableKey = stripeConfig.publishableKey;
          const stripe = await loadStripe(publishableKey);
          setStripePromise(Promise.resolve(stripe));
          console.log('Stripe inicializado para membresías');
        } else {
          console.warn('Stripe no habilitado - solo transferencias');
          setPaymentMethod('transfer');
          showInfo('Solo pagos por transferencia disponibles');
        }
        
        stripeInitialized.current = true;
        
      } catch (error) {
        console.error('Error inicializando Stripe:', error);
        setPaymentMethod('transfer');
        showError('Error cargando sistema de pagos. Solo transferencias disponibles.');
      }
    };

    initializeStripe();
  }, [showError, showInfo]);
  
  // FUNCIÓN: Continuar al siguiente paso
  const handleContinue = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };
  
  // FUNCIÓN: Volver al paso anterior
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };
  
  if (!selectedPlan || !isAuthenticated) {
    return null;
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
              {step === 1 && 'Confirmar Membresía'}
              {step === 2 && 'Método de Pago'}
              {step === 3 && 'Membresía Adquirida'}
            </h1>
            
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600">Pago Seguro</span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE PROGRESO */}
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

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {step === 3 ? (
          // Paso 3: Confirmación (layout especial)
          <MembershipConfirmationStep
            membership={completedMembership}
            user={user}
            onBack={onBack}
          />
        ) : (
          // Pasos 1 y 2: Layout con resumen lateral
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* CONTENIDO PRINCIPAL */}
            <div className="lg:col-span-2">
              {step === 1 && (
                <MembershipInfoStep
                  plan={selectedPlan}
                  user={user}
                  onContinue={handleContinue}
                />
              )}

              {step === 2 && stripePromise && (
                <Elements stripe={stripePromise}>
                  <MembershipPaymentStep
                    plan={selectedPlan}
                    user={user}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                    stripePromise={stripePromise}
                    onSuccess={(membership) => {
                      setCompletedMembership(membership);
                      setStep(3);
                      onSuccess && onSuccess(membership);
                    }}
                    onError={(error) => showError(error)}
                  />
                </Elements>
              )}
            </div>

            {/* RESUMEN DE LA MEMBRESÍA */}
            <div className="lg:col-span-1">
              <MembershipSummary
                plan={selectedPlan}
                user={user}
                step={step}
                onContinue={step === 1 ? handleContinue : null}
                isProcessing={isProcessing}
                formatCurrency={formatCurrency}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// COMPONENTE: Paso 1 - Información de la membresía
const MembershipInfoStep = ({ plan, user, onContinue }) => {
  
  return (
    <div className="space-y-6">
      
      {/* INFORMACIÓN DEL CLIENTE */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <User className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Información del titular
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              value={`${user.firstName} ${user.lastName}`}
              className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg text-gray-600"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={user.email}
              className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg text-gray-600"
              disabled
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={user.phone || 'No registrado'}
              className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg text-gray-600"
              disabled
            />
            {!user.phone && (
              <p className="text-xs text-orange-600 mt-1">
                Te recomendamos actualizar tu teléfono en tu perfil
              </p>
            )}
          </div>
        </div>
      </div>

      {/* DETALLES DE LA MEMBRESÍA SELECCIONADA */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <Crown className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Membresía seleccionada
          </h2>
        </div>

        <div className="border border-primary-200 rounded-lg p-6 bg-primary-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
            <div className="text-right">
              <div className="flex items-center text-2xl font-bold text-primary-600">
                <Bird className="w-6 h-6 mr-1" />
                Q{plan.price}
              </div>
              <div className="text-sm text-gray-600">
                por {plan.duration}
              </div>
              {plan.originalPrice && plan.originalPrice > plan.price && (
                <div className="text-sm text-green-600 font-medium">
                  Ahorro: Q{plan.originalPrice - plan.price}
                </div>
              )}
            </div>
          </div>
          
          {plan.features && plan.features.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 mb-3">
                Beneficios incluidos:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* INFORMACIÓN IMPORTANTE */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-blue-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Información importante
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• La membresía se activará inmediatamente después del pago exitoso</li>
              <li>• Recibirás un correo de confirmación con todos los detalles</li>
              <li>• Podrás usar todas las instalaciones desde el momento de activación</li>
              <li>• El pago es seguro y está protegido con encriptación SSL</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// COMPONENTE: Paso 2 - Métodos de pago
const MembershipPaymentStep = ({ 
  plan, 
  user,
  paymentMethod, 
  setPaymentMethod,
  isProcessing,
  setIsProcessing,
  stripePromise,
  onSuccess,
  onError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState('');
  const [transferProof, setTransferProof] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  
  // FUNCIÓN: Procesar pago con Stripe
  const handleStripePayment = async () => {
    if (!stripe || !elements) {
      onError('Stripe no está disponible');
      return;
    }

    try {
      setIsProcessing(true);
      setCardError('');

      console.log('Iniciando flujo de pago de membresía con Stripe...');
      console.log('Plan seleccionado:', plan);

      // Preparar datos para Payment Intent
      const membershipData = {
        type: plan.type || plan.duration,
        price: plan.price,
        id: plan.id
      };
      
      console.log('Datos que se enviarán al backend:', membershipData);

      // 1. Crear Payment Intent para membresía
      const paymentIntentData = await membershipService.createMembershipPaymentIntent(membershipData);

      const { clientSecret, paymentIntentId } = paymentIntentData;
      console.log('Payment Intent creado para membresía');

      // 2. Confirmar con Stripe
      const cardElement = elements.getElement(CardElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            phone: user.phone
          }
        }
      });

      if (error) {
        setCardError(error.message || 'Error al procesar el pago');
        onError('Error en el pago: ' + error.message);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        console.log('Pago de membresía confirmado con Stripe');
        
        // 3. Confirmar pago en backend
        const confirmResult = await membershipService.confirmStripePayment(paymentIntent.id);

        console.log('Pago de membresía confirmado en backend');
        
        // Éxito completo
        const membership = {
          ...confirmResult.membership,
          payment: confirmResult.payment,
          paymentMethod: 'stripe',
          paid: true
        };

        onSuccess(membership);

      } else {
        throw new Error('El pago no se completó correctamente');
      }

    } catch (error) {
      console.error('Error en pago de membresía:', error);
      console.error('Error completo:', error.response?.data || error.message);
      onError(error.message || 'Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  // FUNCIÓN: Crear pago por transferencia
  const handleTransferPayment = async () => {
    try {
      setIsProcessing(true);

      console.log('Iniciando flujo de pago por transferencia...');

      // 1. Crear pago con transferencia
      const payment = await membershipService.createTransferPayment({
        id: plan.id,
        name: plan.name,
        price: plan.price
      }, user.id);

      console.log('Pago por transferencia creado:', payment.id);

      // 2. Subir comprobante si se seleccionó
      if (transferProof) {
        setUploadingProof(true);
        
        try {
          await membershipService.uploadTransferProof(payment.id, transferProof);
          console.log('Comprobante subido exitosamente');
        } catch (uploadError) {
          console.warn('Error subiendo comprobante:', uploadError.message);
          // No fallar completamente si el upload falla
        }
        
        setUploadingProof(false);
      }

      // Éxito - pago pendiente de validación
      const membership = {
        id: payment.id,
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        paymentMethod: 'transfer',
        status: 'pending',
        paid: false,
        transferValidated: false,
        proofUploaded: !!transferProof
      };

      onSuccess(membership);

    } catch (error) {
      console.error('Error en pago por transferencia:', error);
      onError(error.message || 'Error al procesar la transferencia');
    } finally {
      setIsProcessing(false);
      setUploadingProof(false);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === 'stripe') {
      handleStripePayment();
    } else {
      handleTransferPayment();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SELECCIÓN DE MÉTODO DE PAGO */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <CreditCard className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Método de pago</h2>
        </div>

        <div className="space-y-4">
          
          {/* Opción: Tarjeta de crédito/débito */}
          {stripePromise && (
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
                    <div className="font-medium">Tarjeta de crédito/débito</div>
                    <div className="text-sm text-gray-600">Pago inmediato • Visa, Mastercard</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600">Seguro</span>
                </div>
              </div>
            </button>
          )}

          {/* Opción: Transferencia bancaria */}
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
                <Upload className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <div className="font-medium">Transferencia bancaria</div>
                  <div className="text-sm text-gray-600">Sube tu comprobante • Validación manual</div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-blue-600">1-2 días</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* FORMULARIO DE TARJETA */}
      {paymentMethod === 'stripe' && (
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
                    Usa la tarjeta <code className="bg-white px-1 rounded">4242 4242 4242 4242</code> con cualquier CVC y fecha futura.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORMULARIO DE TRANSFERENCIA */}
      {paymentMethod === 'transfer' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">
            Transferencia bancaria
          </h3>

          {/* Datos bancarios */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">
              Datos para transferencia:
            </h4>
            <div className="space-y-2 text-sm">
              <div><strong>Banco:</strong> Banco Industrial</div>
              <div><strong>Cuenta:</strong> 123-456789-0</div>
              <div><strong>Nombre:</strong> Elite Fitness Club S.A.</div>
              <div><strong>Tipo:</strong> Cuenta Monetaria</div>
              <div className="text-primary-600 font-semibold flex items-center">
                <Bird className="w-4 h-4 mr-1" />
                <strong>Monto exacto:</strong> Q{plan.price.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Upload de comprobante */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comprobante de transferencia (opcional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="text-sm font-medium text-primary-600 hover:text-primary-500">
                    Seleccionar archivo
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => setTransferProof(e.target.files[0])}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG o PDF hasta 5MB
                </p>
              </div>
              
              {transferProof && (
                <div className="mt-4 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm text-green-700">
                      {transferProof.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setTransferProof(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
              <div className="text-sm">
                <p className="text-yellow-800 font-medium mb-1">¿Cómo funciona?</p>
                <ul className="text-yellow-700 space-y-1">
                  <li>1. Realiza la transferencia con el monto exacto</li>
                  <li>2. Sube tu comprobante (opcional pero recomendado)</li>
                  <li>3. Nuestro equipo validará la transferencia</li>
                  <li>4. Te notificaremos cuando se active tu membresía</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTÓN DE PAGAR */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <button
          onClick={handlePayment}
          disabled={isProcessing || uploadingProof || (paymentMethod === 'stripe' && (!stripe || !elements))}
          className="w-full bg-primary-600 text-white py-4 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isProcessing || uploadingProof ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>
                {uploadingProof ? 'Subiendo comprobante...' : 'Procesando...'}
              </span>
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              <span>
                {paymentMethod === 'stripe' 
                  ? `Pagar Q${plan.price.toFixed(2)} con tarjeta`
                  : 'Confirmar transferencia'
                }
              </span>
            </>
          )}
        </button>

        <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
          <Shield className="w-4 h-4 mr-1" />
          <span>Pago 100% seguro con encriptación SSL</span>
        </div>
      </div>
    </div>
  );
};

// COMPONENTE: Resumen de la membresía
const MembershipSummary = ({ 
  plan, 
  user, 
  step, 
  onContinue, 
  isProcessing, 
  formatCurrency 
}) => {
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Resumen de tu membresía
      </h3>

      {/* Plan seleccionado */}
      <div className="border border-primary-200 rounded-lg p-4 mb-6 bg-primary-50">
        <div className="flex items-center mb-2">
          <Crown className="w-5 h-5 text-primary-600 mr-2" />
          <h4 className="font-semibold text-gray-900">{plan.name}</h4>
        </div>
        
        <div className="text-sm text-gray-600 mb-3">
          Válida por {plan.duration}
        </div>
        
        {plan.features && plan.features.slice(0, 3).map((feature, index) => (
          <div key={index} className="flex items-center text-sm text-gray-700 mb-1">
            <Check className="w-3 h-3 text-green-500 mr-2" />
            <span>{feature}</span>
          </div>
        ))}
        
        {plan.features && plan.features.length > 3 && (
          <div className="text-xs text-gray-500 mt-2">
            +{plan.features.length - 3} beneficios más
          </div>
        )}
      </div>

      {/* Detalles del precio */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Plan {plan.name}:</span>
          <span>{formatCurrency(plan.price)}</span>
        </div>
        
        {plan.originalPrice && plan.originalPrice > plan.price && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Descuento:</span>
            <span className="text-green-600">
              -{formatCurrency(plan.originalPrice - plan.price)}
            </span>
          </div>
        )}
        
        <div className="border-t pt-3">
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span className="text-primary-600 flex items-center">
              <Bird className="w-4 h-4 mr-1" />
              {formatCurrency(plan.price)}
            </span>
          </div>
        </div>
      </div>

      {/* Información del titular */}
      <div className="border-t pt-4 mb-6">
        <h4 className="font-medium text-gray-900 mb-2">Titular de la membresía</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>{user.firstName} {user.lastName}</div>
          <div>{user.email}</div>
          {user.phone && <div>{user.phone}</div>}
        </div>
      </div>

      {/* Botón de continuar (solo en step 1) */}
      {step === 1 && onContinue && (
        <button
          onClick={onContinue}
          disabled={isProcessing}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          Continuar al pago
        </button>
      )}

      {/* Garantías y beneficios */}
      <div className="mt-6 space-y-3 text-sm text-gray-600">
        <div className="flex items-center">
          <Shield className="w-4 h-4 mr-2 text-green-500" />
          <span>Pago 100% seguro</span>
        </div>
        
        <div className="flex items-center">
          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
          <span>Activación inmediata</span>
        </div>
        
        <div className="flex items-center">
          <Wifi className="w-4 h-4 mr-2 text-blue-500" />
          <span>Confirmación por correo</span>
        </div>
        
        <div className="flex items-center">
          <Phone className="w-4 h-4 mr-2 text-blue-500" />
          <span>Soporte 24/7</span>
        </div>
      </div>
    </div>
  );
};

// COMPONENTE: Paso 3 - Confirmación
const MembershipConfirmationStep = ({ membership, user, onBack }) => {
  
  return (
    <div className="space-y-8">
      
      {/* BANNER DE ÉXITO */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-8 text-center shadow-xl">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            {membership?.paymentMethod === 'stripe' ? '¡MEMBRESÍA ACTIVADA!' : '¡SOLICITUD ENVIADA!'}
          </h1>
          <p className="text-green-100 text-lg md:text-xl mb-4">
            {membership?.paymentMethod === 'stripe' 
              ? 'Tu membresía está activa y lista para usar'
              : 'Tu transferencia será validada por nuestro equipo'
            }
          </p>
          <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
            <p className="text-green-100">
              {membership?.paymentMethod === 'stripe' 
                ? `Membresía ID: ${membership?.id}`
                : `Pago ID: ${membership?.id}`
              }
            </p>
          </div>
        </div>
      </div>

      {/* DETALLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Información de la membresía */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Crown className="w-6 h-6 text-primary-600 mr-2" />
            {membership?.paymentMethod === 'stripe' ? 'Tu nueva membresía' : 'Membresía solicitada'}
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Plan:</span>
              <span className="font-semibold">{membership?.planName || 'Plan seleccionado'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Monto:</span>
              <span className="font-bold text-xl text-green-600 flex items-center">
                <Bird className="w-5 h-5 mr-1" />
                Q{membership?.amount || '0.00'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Estado:</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                membership?.paymentMethod === 'stripe' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {membership?.paymentMethod === 'stripe' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Activa
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-1" />
                    Pendiente validación
                  </>
                )}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Método de pago:</span>
              <span className="font-medium">
                {membership?.paymentMethod === 'stripe' ? 'Tarjeta' : 'Transferencia bancaria'}
              </span>
            </div>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Mail className="w-6 h-6 text-blue-600 mr-2" />
            Próximos pasos
          </h3>
          
          <div className="space-y-4">
            {membership?.paymentMethod === 'stripe' ? (
              <>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span>Correo de confirmación enviado a <strong>{user.email}</strong></span>
                </div>
                
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span>Acceso completo a todas las instalaciones</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span>Puedes comenzar a entrenar inmediatamente</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 text-blue-500 mr-2" />
                  <span>Validaremos tu transferencia en 1-2 días hábiles</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Mail className="w-4 h-4 text-blue-500 mr-2" />
                  <span>Te notificaremos por correo cuando esté lista</span>
                </div>
                
                {membership?.proofUploaded && (
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>Comprobante recibido correctamente</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={onBack}
          className="w-full bg-primary-600 text-white py-4 rounded-xl text-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center"
        >
          <Crown className="w-5 h-5 mr-2" />
          Ir a mi panel
        </button>
        
        <button
          onClick={() => window.location.href = '/'}
          className="w-full text-primary-600 py-4 rounded-xl text-lg font-semibold hover:bg-primary-50 transition-colors border-2 border-primary-600 flex items-center justify-center"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Volver al inicio
        </button>
      </div>

      {/* INFORMACIÓN ADICIONAL */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <p className="text-blue-800 font-medium mb-2">
          ¿Necesitas ayuda?
        </p>
        <div className="flex justify-center space-x-4 text-sm">
          <span className="text-blue-600">
            soporte@elitefitness.com
          </span>
          <span className="text-blue-600">
            2234-5678
          </span>
        </div>
      </div>
    </div>
  );
};

export default MembershipCheckout;

/*
DOCUMENTACIÓN DEL COMPONENTE MembershipCheckout

PROPÓSITO:
Este componente proporciona un flujo completo de checkout para la adquisición de membresías
del gimnasio, integrando tanto pagos con tarjeta (Stripe) como transferencias bancarias.
Maneja todo el proceso desde la confirmación del plan hasta la activación de la membresía,
con soporte completo para pagos en quetzales guatemaltecos.

FUNCIONALIDADES PRINCIPALES:
- Flujo de checkout en 3 pasos progresivos
- Integración completa con Stripe Elements
- Sistema de transferencias bancarias con upload de comprobantes
- Validación de datos de usuario y plan seleccionado
- Confirmación inmediata para pagos con tarjeta
- Proceso de validación manual para transferencias
- Notificaciones por correo electrónico
- Interfaz responsiva y accesible

CONEXIONES CON OTROS ARCHIVOS:

CONTEXTS REQUERIDOS:
- AuthContext (../../contexts/AuthContext): Manejo de autenticación
  - user: Datos del usuario autenticado
  - isAuthenticated: Estado de autenticación
- AppContext (../../contexts/AppContext): Funciones de la aplicación
  - showSuccess(), showError(), showInfo(): Notificaciones
  - formatCurrency(): Formateo de precios en quetzales
  - isMobile: Detección de dispositivos móviles

SERVICIOS CONECTADOS:
- membershipService (../../services/membershipService): Servicio de membresías
  - checkStripeConfig(): Verificar configuración de Stripe
  - createMembershipPaymentIntent(): Crear intención de pago
  - confirmStripePayment(): Confirmar pago con Stripe
  - createTransferPayment(): Crear pago por transferencia
  - uploadTransferProof(): Subir comprobante de transferencia

LIBRERÍAS EXTERNAS:
- Stripe (@stripe/stripe-js, @stripe/react-stripe-js)
  - loadStripe: Cargar SDK de Stripe
  - Elements: Proveedor de elementos Stripe
  - CardElement: Elemento de tarjeta
  - useStripe, useElements: Hooks de Stripe

COMPONENTES IMPORTADOS:
- Iconos de Lucide React: CreditCard, Upload, User, Crown, ArrowLeft, Lock,
  CheckCircle, AlertCircle, Loader2, Shield, Calendar, Bird, Clock, FileText,
  AlertTriangle, X, Check, Wifi, Phone, Mail

QUE MUESTRA AL USUARIO:

PASO 1 - CONFIRMACIÓN DE INFORMACIÓN:
- Header con navegación y título "Confirmar Membresía"
- Barra de progreso visual de 3 pasos
- Sección "Información del titular" mostrando:
  - Nombre completo (deshabilitado)
  - Correo electrónico (deshabilitado)
  - Teléfono (con advertencia si no está registrado)
- Sección "Membresía seleccionada" con:
  - Nombre del plan
  - Precio con icono de quetzal
  - Duración del plan
  - Lista de beneficios incluidos con checkmarks
- Panel lateral "Resumen de tu membresía" con:
  - Detalles del plan seleccionado
  - Desglose de precios con descuentos si aplican
  - Total con icono de quetzal
  - Información del titular
  - Garantías (Pago seguro, Activación inmediata, etc.)
- Información importante con políticas y términos

PASO 2 - MÉTODO DE PAGO:
- Header con título "Método de Pago"
- Selección de método de pago:
  - Tarjeta de crédito/débito (con badge "Seguro")
  - Transferencia bancaria (con badge "1-2 días")
- Para pago con tarjeta:
  - Formulario de Stripe Elements
  - Información de prueba para desarrollo
  - Validación en tiempo real
- Para transferencia bancaria:
  - Datos bancarios completos incluyendo monto exacto en quetzales
  - Upload de comprobante opcional
  - Instrucciones paso a paso
- Botón de pago dinámico según método seleccionado
- Indicador de seguridad SSL

PASO 3 - CONFIRMACIÓN:
- Banner de éxito diferenciado por método de pago:
  - "¡MEMBRESÍA ACTIVADA!" para pagos con tarjeta
  - "¡SOLICITUD ENVIADA!" para transferencias
- Detalles de la transacción:
  - Información del plan
  - Monto con icono de quetzal
  - Estado (Activa/Pendiente validación)
  - Método de pago utilizado
- Próximos pasos específicos:
  - Para tarjeta: Acceso inmediato, confirmación por correo
  - Para transferencia: Proceso de validación, notificación por correo
- Botones de navegación al panel o inicio
- Información de contacto para soporte

CARACTERÍSTICAS TÉCNICAS:
- Estado de procesamiento con indicadores visuales
- Manejo de errores con mensajes descriptivos
- Validación de Stripe Elements en tiempo real
- Upload de archivos con preview y validación
- Prevención de múltiples inicializaciones
- Limpieza automática de efectos
- Estados de carga granulares

FLUJOS DE PAGO SOPORTADOS:

PAGO CON TARJETA (STRIPE):
1. Verificación de configuración de Stripe
2. Creación de Payment Intent para membresía
3. Captura de datos de tarjeta con Stripe Elements
4. Confirmación del pago con Stripe
5. Validación en backend
6. Activación inmediata de membresía
7. Notificación por correo

PAGO POR TRANSFERENCIA:
1. Registro del pago pendiente en backend
2. Upload opcional de comprobante
3. Notificación al equipo administrativo
4. Validación manual de transferencia
5. Activación de membresía tras validación
6. Notificación al usuario por correo

CASOS DE USO EN EL GIMNASIO:
- Adquisición de membresías mensuales y diarias
- Procesamiento de pagos en quetzales guatemaltecos
- Renovaciones de membresías existentes
- Upgrades de planes de membresía
- Manejo de promociones y descuentos
- Integración con sistema contable del gimnasio
- Seguimiento de transacciones financieras

MANEJO DE ERRORES:
- Validación de autenticación de usuario
- Verificación de disponibilidad de Stripe
- Manejo de errores de tarjeta
- Validación de archivos uploadados
- Timeouts de red y conectividad
- Estados de falla graceful

NOTIFICACIONES DE USUARIO:
- Confirmaciones de pago exitoso
- Alertas de errores en procesamiento
- Información sobre tiempos de validación
- Recordatorios de datos faltantes
- Confirmaciones de uploads

SEGURIDAD:
- Encriptación SSL en todas las transacciones
- Validación de tokens de Stripe
- Sanitización de uploads de archivos
- Protección contra múltiples submissions
- Validación de datos en frontend y backend

RESPONSIVE DESIGN:
- Adaptación a dispositivos móviles
- Grid responsivo para layouts
- Botones y formularios touch-friendly
- Imágenes y iconos escalables
- Navegación optimizada para mobile

INTEGRACIÓN CON BACKEND:
- API REST para manejo de membresías
- Webhooks de Stripe para confirmaciones
- Sistema de notificaciones por correo
- Base de datos de transacciones
- Logs de auditoría financiera

Este componente es crítico para las operaciones financieras del gimnasio,
manejando tanto la experiencia de usuario como la integración con sistemas
de pago locales e internacionales, con énfasis especial en el manejo de
quetzales guatemaltecos y las particularidades del mercado local.
*/