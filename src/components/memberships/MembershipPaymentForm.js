// Autor: Alexander Echeverria
// src/components/memberships/MembershipPaymentForm.js
// Componente del paso 3 con control de pagos con tarjeta via variable de entorno

import React, { useState } from 'react';
import {
  CreditCard,
  Upload,
  Shield,
  Clock,
  Lock,
  Loader2,
  AlertCircle,
  AlertTriangle,
  FileText,
  X,
  MapPin,
  Phone,
  Banknote,
  Info
} from 'lucide-react';

import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import membershipService from '../../services/membershipService';
import { formatPrice } from './MembershipCheckout';

const MembershipPaymentStep = ({ 
  plan, 
  selectedSchedule,
  user,
  paymentMethod, 
  setPaymentMethod,
  isProcessing,
  setIsProcessing,
  stripePromise,
  stripeAvailable,
  gymConfig,
  contactInfo,
  bankInfo,
  paymentConfig,
  onSuccess,
  onError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState('');
  const [transferProof, setTransferProof] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  
  const handleStripePayment = async () => {
    if (!stripe || !elements) {
      onError('Stripe no está disponible');
      return;
    }

    try {
      setIsProcessing(true);
      setCardError('');

      const paymentIntentData = await membershipService.createMembershipPaymentIntent(
        plan.id, 
        selectedSchedule, 
        user.id
      );

      const { clientSecret } = paymentIntentData;
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
        const purchaseResult = await membershipService.purchaseMembership(
          plan.id,
          selectedSchedule,
          'card',
          `Pago con tarjeta - Payment Intent: ${paymentIntent.id}`
        );

        const membership = {
          ...purchaseResult.membership,
          payment: purchaseResult.payment,
          plan: purchaseResult.plan,
          paymentMethod: 'card',
          paid: true
        };

        onSuccess(membership);
      } else {
        throw new Error('El pago no se completó correctamente');
      }

    } catch (error) {
      console.error('Error en pago con tarjeta:', error);
      onError(error.message || 'Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTransferPayment = async () => {
    try {
      setIsProcessing(true);
      
      console.log('Creando pago por transferencia - NO se activará automáticamente');

      const purchaseResult = await membershipService.purchaseMembership(
        plan.id,
        selectedSchedule,
        'transfer',
        'Pago por transferencia bancaria - Pendiente de validación'
      );

      const paymentId = purchaseResult.payment.id;

      if (transferProof) {
        setUploadingProof(true);
        
        try {
          await membershipService.uploadTransferProof(paymentId, transferProof);
        } catch (uploadError) {
          console.warn('Error subiendo comprobante:', uploadError.message);
        }
        
        setUploadingProof(false);
      }

      const membership = {
        ...purchaseResult.membership,
        payment: purchaseResult.payment,
        plan: purchaseResult.plan,
        paymentMethod: 'transfer',
        paid: false,
        status: 'pending_validation',
        proofUploaded: !!transferProof
      };

      console.log('Membresía creada con estado correcto:', membership.status);
      onSuccess(membership);

    } catch (error) {
      console.error('Error en pago por transferencia:', error);
      onError(error.message || 'Error al procesar la transferencia');
    } finally {
      setIsProcessing(false);
      setUploadingProof(false);
    }
  };

  const handleCashPayment = async () => {
    try {
      setIsProcessing(true);
      
      console.log('Creando pago en efectivo - NO se activará automáticamente');

      const purchaseResult = await membershipService.purchaseMembership(
        plan.id,
        selectedSchedule,
        'cash',
        'Pago en efectivo en el gimnasio - Pendiente de confirmación'
      );

      const membership = {
        ...purchaseResult.membership,
        payment: purchaseResult.payment,
        plan: purchaseResult.plan,
        paymentMethod: 'cash',
        paid: false,
        status: 'pending_payment'
      };

      console.log('Membresía creada con estado correcto:', membership.status);
      onSuccess(membership);

    } catch (error) {
      console.error('Error registrando pago en efectivo:', error);
      onError(error.message || 'Error al registrar el pago en efectivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === 'card') {
      handleStripePayment();
    } else if (paymentMethod === 'transfer') {
      handleTransferPayment();
    } else if (paymentMethod === 'cash') {
      handleCashPayment();
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-6">
          <CreditCard className="w-6 h-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">¿Cómo quieres pagar?</h2>
        </div>

        <div className="space-y-4">
          
          {stripeAvailable && stripePromise && (paymentConfig?.cardEnabled !== false) && (
            <button
              onClick={() => setPaymentMethod('card')}
              className={`w-full p-5 border-2 rounded-xl text-left transition-all hover:shadow-md ${
                paymentMethod === 'card'
                  ? 'border-primary-500 bg-primary-50 shadow-sm'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="w-6 h-6 text-gray-600 mr-4" />
                  <div>
                    <div className="font-semibold text-lg">Tarjeta de crédito/débito</div>
                    <div className="text-sm text-gray-600">
                      {paymentConfig?.cardProcessingNote || 'Confirmación inmediata - Visa, Mastercard'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                    Inmediato
                  </span>
                </div>
              </div>
            </button>
          )}

          {!stripeAvailable && (
            <div className="w-full p-5 border-2 border-gray-200 rounded-xl bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="w-6 h-6 text-gray-400 mr-4" />
                  <div>
                    <div className="font-semibold text-lg text-gray-500">Tarjeta de crédito/débito</div>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <Info className="w-4 h-4 mr-1" />
                      Próximamente disponible
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                  No disponible
                </span>
              </div>
            </div>
          )}

          {(paymentConfig?.transferEnabled !== false) && (
            <button
              onClick={() => setPaymentMethod('transfer')}
              className={`w-full p-5 border-2 rounded-xl text-left transition-all hover:shadow-md ${
                paymentMethod === 'transfer'
                  ? 'border-primary-500 bg-primary-50 shadow-sm'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Upload className="w-6 h-6 text-gray-600 mr-4" />
                  <div>
                    <div className="font-semibold text-lg">Transferencia bancaria</div>
                    <div className="text-sm text-gray-600">
                      {paymentConfig?.transferProcessingNote || 'Sube tu comprobante - Validación manual'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {paymentConfig?.transferValidationTime || '1-2 días'}
                  </span>
                </div>
              </div>
            </button>
          )}

          {(paymentConfig?.cashEnabled !== false) && (
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`w-full p-5 border-2 rounded-xl text-left transition-all hover:shadow-md ${
                paymentMethod === 'cash'
                  ? 'border-primary-500 bg-primary-50 shadow-sm'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Banknote className="w-6 h-6 text-gray-600 mr-4" />
                  <div>
                    <div className="font-semibold text-lg">Efectivo en el gimnasio</div>
                    <div className="text-sm text-gray-600">
                      {paymentConfig?.cashProcessingNote || 'Paga al visitar - Confirmación manual'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">
                    En sucursal
                  </span>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>

      {paymentMethod === 'card' && stripeAvailable && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Información de la tarjeta
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Datos de la tarjeta
              </label>
              <div className="p-4 border-2 border-gray-300 rounded-lg focus-within:border-primary-500">
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
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {cardError}
                </p>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <Shield className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                <div className="text-sm">
                  <p className="text-green-800 font-medium mb-1">Pago 100% seguro</p>
                  <p className="text-green-700">
                    Tu información está protegida con encriptación de nivel bancario.
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
            Transferencia bancaria
          </h3>

          {bankInfo && bankInfo.bankName ? (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-5 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">
                Datos para transferencia:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Banco:</strong> {bankInfo.bankName}</div>
                <div><strong>Cuenta:</strong> {bankInfo.accountNumber}</div>
                <div><strong>Nombre:</strong> {bankInfo.accountHolder}</div>
                <div><strong>Tipo:</strong> {bankInfo.accountType}</div>
                <div className="md:col-span-2 text-primary-600 font-bold text-lg flex items-center">
                  <span className="mr-1">Q</span>
                  <strong>Monto exacto:</strong> Q{formatPrice(plan.price)}
                </div>
              </div>
              
              {bankInfo.instructions && bankInfo.instructions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <h5 className="font-medium text-gray-900 mb-2">Instrucciones:</h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {bankInfo.instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                <p className="text-yellow-800">
                  Información bancaria no disponible. 
                  {contactInfo?.supportEmail && (
                    <span> Contacta: {contactInfo.supportEmail}</span>
                  )}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comprobante de transferencia (opcional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-primary-300 transition-colors">
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

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
              <div className="text-sm">
                <p className="text-yellow-800 font-medium mb-2">Proceso de validación</p>
                <ul className="text-yellow-700 space-y-1">
                  <li>1. Realiza la transferencia con el monto exacto</li>
                  <li>2. Sube tu comprobante (opcional pero recomendado)</li>
                  <li>3. Nuestro equipo validará la transferencia en {paymentConfig?.transferValidationTime || '1-2 días'}</li>
                  <li>4. Te notificaremos cuando se active tu membresía</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {paymentMethod === 'cash' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Pago en efectivo
          </h3>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-5 mb-6">
            <h4 className="font-semibold text-purple-900 mb-4">
              Información del pago:
            </h4>
            <div className="space-y-3 text-sm">
              {contactInfo?.location ? (
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-purple-500 mr-3" />
                  <span><strong>Ubicación:</strong> {contactInfo.location}</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-purple-500 mr-3" />
                  <span><strong>Ubicación:</strong> Elite Fitness Club - Recepción</span>
                </div>
              )}
              
              {contactInfo?.businessHours ? (
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-purple-500 mr-3" />
                  <span><strong>Horario:</strong> {contactInfo.businessHours}</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-purple-500 mr-3" />
                  <span><strong>Horario:</strong> Lunes a Domingo 6:00 AM - 10:00 PM</span>
                </div>
              )}
              
              <div className="flex items-center">
                <Banknote className="w-5 h-5 text-purple-500 mr-3" />
                <span><strong>Monto exacto:</strong> Q{formatPrice(plan.price)}</span>
              </div>
              
              {contactInfo?.supportPhone && (
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-purple-500 mr-3" />
                  <span><strong>Teléfono:</strong> {contactInfo.supportPhone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-800 font-medium mb-2">¿Cómo funciona?</p>
                <ul className="text-blue-700 space-y-1">
                  <li>1. Confirma tu membresía ahora</li>
                  <li>2. Visita el gimnasio y paga en efectivo</li>
                  <li>3. Nuestro personal confirmará tu pago</li>
                  <li>4. Tu membresía se activará inmediatamente</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <button
          onClick={handlePayment}
          disabled={isProcessing || uploadingProof || (paymentMethod === 'card' && (!stripe || !elements))}
          className="w-full bg-primary-600 text-white py-4 rounded-xl text-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
        >
          {isProcessing || uploadingProof ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>
                {uploadingProof ? 'Subiendo comprobante...' : 'Procesando...'}
              </span>
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              <span>
                {paymentMethod === 'card' && `Pagar Q${formatPrice(plan.price)} con tarjeta`}
                {paymentMethod === 'transfer' && 'Confirmar transferencia'}
                {paymentMethod === 'cash' && 'Confirmar pago en efectivo'}
              </span>
            </>
          )}
        </button>

        <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
          <Shield className="w-4 h-4 mr-1" />
          <span>Proceso 100% seguro y protegido</span>
        </div>
      </div>
    </div>
  );
};

export { MembershipPaymentStep };