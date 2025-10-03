// src/pages/checkout/CheckoutPayment.js
// VERSIÓN ACTUALIZADA: Usa gymConfig centralizado sin datos hardcodeados

import React, { useState } from 'react';
import {
  CreditCard, Home, Shield, Truck, Store, AlertCircle, Lock, Loader2, Mail, Info
} from 'lucide-react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useCart } from '../../contexts/CartContext';
import apiService from '../../services/apiService';

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
  stripeAvailable,
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
  const { calculateCartSummary } = useCart();

  // ============================================================================
  // 🎯 FUNCIÓN PARA PREPARAR DATOS DE LA ORDEN CON CÁLCULOS CORRECTOS
  // ============================================================================
  const prepareOrderData = () => {
    console.log('\n💳 ===== PREPARANDO DATOS DE LA ORDEN =====');
    
    // ✅ CALCULAR CORRECTAMENTE usando la función del contexto
    const cartSummary = calculateCartSummary(items, shippingCost);
    
    console.log('📊 Resumen calculado:');
    console.log(`   Total productos (con IVA): ${gymConfig.regional.currencySymbol}${cartSummary.totalProductsWithTax}`);
    console.log(`   Envío: ${gymConfig.regional.currencySymbol}${cartSummary.shippingAmount}`);
    console.log(`   TOTAL que ve el cliente: ${gymConfig.regional.currencySymbol}${cartSummary.totalAmount}`);
    
    console.log('\n📋 Desglose para el backend:');
    console.log(`   Subtotal (sin IVA): ${gymConfig.regional.currencySymbol}${cartSummary.subtotal}`);
    console.log(`   IVA (12%): ${gymConfig.regional.currencySymbol}${cartSummary.taxAmount}`);
    console.log(`   Envío: ${gymConfig.regional.currencySymbol}${cartSummary.shippingAmount}`);
    console.log(`   = TOTAL: ${gymConfig.regional.currencySymbol}${cartSummary.totalAmount}`);
    
    // ✅ PREPARAR DATOS DE LA ORDEN
    const orderData = {
      items: items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price, // Precio CON IVA (como está en BD)
        selectedVariants: item.options || {}
      })),
      
      // ✅ VALORES DESGLOSADOS CORRECTAMENTE
      subtotal: cartSummary.subtotal,       // Sin IVA
      taxAmount: cartSummary.taxAmount,     // IVA desglosado
      shippingAmount: cartSummary.shippingAmount, // Envío
      totalAmount: cartSummary.totalAmount, // Total final
      
      customerInfo,
      paymentMethod: paymentMethod,
      notes,
      deliveryMethod,
      sessionId: !isAuthenticated ? (sessionInfo?.sessionId || `guest_${Date.now()}`) : undefined
    };

    // Agregar dirección de envío usando datos de gymConfig
    if (deliveryMethod !== 'pickup_store') {
      orderData.shippingAddress = {
        ...shippingAddress,
        fullAddress: `${shippingAddress.street}, ${shippingAddress.municipality}, ${shippingAddress.state}, ${gymConfig.location.country}`
      };
    } else {
      // Usar dirección del gymConfig para pickup
      if (!gymConfig.location.address) {
        throw new Error('Configuración de la tienda incompleta.');
      }
      
      orderData.shippingAddress = {
        street: gymConfig.location.addressFull || gymConfig.location.address,
        city: gymConfig.location.city,
        state: gymConfig.location.state || shippingAddress.state,
        municipality: gymConfig.location.city,
        zipCode: gymConfig.location.coordinates?.lat ? '00000' : shippingAddress.zipCode,
        reference: `${gymConfig.name} - Recoger en tienda`,
        fullAddress: `${gymConfig.location.addressFull || gymConfig.location.address}, ${gymConfig.location.city}, ${gymConfig.location.country}`
      };
    }

    console.log('\n✅ Datos de la orden preparados:');
    console.log(`   Items: ${orderData.items.length}`);
    console.log(`   Subtotal: ${gymConfig.regional.currencySymbol}${orderData.subtotal}`);
    console.log(`   IVA: ${gymConfig.regional.currencySymbol}${orderData.taxAmount}`);
    console.log(`   Envío: ${gymConfig.regional.currencySymbol}${orderData.shippingAmount}`);
    console.log(`   TOTAL: ${gymConfig.regional.currencySymbol}${orderData.totalAmount}`);
    console.log('===== FIN PREPARACIÓN =====\n');

    return orderData;
  };

  // ============================================================================
  // PAGO CON TARJETA (STRIPE)
  // ============================================================================
  const handleStripePayment = async () => {
    if (!stripe || !elements) {
      onError('Stripe no está disponible');
      return;
    }

    try {
      setIsProcessing(true);
      setCardError('');

      console.log('💳 Iniciando pago con tarjeta Stripe...');

      // ✅ PREPARAR DATOS CON CÁLCULOS CORRECTOS
      const orderData = prepareOrderData();

      console.log('📤 Creando orden en el backend...');
      const orderResponse = await apiService.createOrder(orderData);
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Error al crear la orden');
      }

      const order = orderResponse.data.order;
      console.log(`✅ Orden creada: ${order.orderNumber}`);
      console.log(`   Total de la orden: ${gymConfig.regional.currencySymbol}${order.totalAmount}`);

      console.log('💳 Creando payment intent...');
      const paymentIntentResponse = await apiService.createStorePaymentIntent({
        orderId: order.id
      });

      if (!paymentIntentResponse.success) {
        throw new Error(paymentIntentResponse.message || 'Error al crear el pago');
      }

      const { clientSecret } = paymentIntentResponse.data;

      console.log('💳 Confirmando pago con Stripe...');
      const cardElement = elements.getElement(CardElement);

      // Usar datos de gymConfig para billing address
      const billingAddress = deliveryMethod !== 'pickup_store' ? {
        line1: shippingAddress.street,
        city: shippingAddress.municipality,
        state: shippingAddress.state,
        postal_code: shippingAddress.zipCode,
        country: 'GT'
      } : {
        line1: gymConfig.location.addressFull || gymConfig.location.address,
        city: gymConfig.location.city || '',
        state: gymConfig.location.state || '',
        postal_code: '00000',
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
        
        try {
          const confirmResponse = await apiService.confirmStripePayment({
            paymentIntentId: paymentIntent.id
          });

          if (!confirmResponse.success) {
            throw new Error(`Error al registrar el pago: ${confirmResponse.message}`);
          }

          console.log('✅ Pago confirmado en backend');
          
          const successOrder = {
            ...order,
            paymentIntent: paymentIntent.id,
            paid: true,
            paymentMethod: 'online_card',
            cardLast4: paymentIntent.charges?.data?.[0]?.payment_method_details?.card?.last4 || '****',
            backendConfirmed: true
          };

          onSuccess(successOrder);

        } catch (confirmError) {
          onError(`El pago se procesó, pero hubo un error al registrarlo. ID: ${paymentIntent.id}. Error: ${confirmError.message}`);
          return;
        }

      } else {
        throw new Error('El pago no se completó correctamente');
      }

    } catch (error) {
      console.error('❌ Error en pago con tarjeta:', error);
      onError(error.message || 'Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================================
  // PAGO CONTRA ENTREGA
  // ============================================================================
  const handleCashOnDelivery = async () => {
    try {
      setIsProcessing(true);

      console.log('💵 Iniciando pago contra entrega...');

      // ✅ PREPARAR DATOS CON CÁLCULOS CORRECTOS
      const orderData = prepareOrderData();

      console.log('📤 Creando orden contra entrega en el backend...');
      const orderResponse = await apiService.createOrder(orderData);

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Error al crear la orden');
      }

      const order = orderResponse.data.order;
      console.log(`✅ Orden creada: ${order.orderNumber}`);
      console.log(`   Total de la orden: ${gymConfig.regional.currencySymbol}${order.totalAmount}`);

      const successOrder = {
        ...order,
        paid: false,
        paymentMethod: 'cash_on_delivery'
      };

      onSuccess(successOrder);

    } catch (error) {
      console.error('❌ Error en pago contra entrega:', error);
      onError(error.message || 'Error al crear la orden');
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================================
  // MANEJADOR PRINCIPAL DE PAGO
  // ============================================================================
  const handlePayment = () => {
    if (paymentMethod === 'online_card') {
      handleStripePayment();
    } else {
      handleCashOnDelivery();
    }
  };

  // ============================================================================
  // CALCULAR TOTAL QUE VE EL CLIENTE (usando símbolos de gymConfig)
  // ============================================================================
  const totalProductsWithTax = summary?.totalProductsWithTax || 0;
  const totalToShow = totalProductsWithTax + shippingCost;
  const currencySymbol = gymConfig.regional.currencySymbol;

  return (
    <div className="space-y-6">
      
      {/* MÉTODOS DE PAGO */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <CreditCard className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Método de pago</h2>
        </div>

        <div className="space-y-4">
          
          {/* TARJETA */}
          {stripeAvailable ? (
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
          ) : (
            <div className="w-full p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium text-gray-500">Tarjeta de crédito/débito</div>
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

          {/* EFECTIVO */}
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

      {/* FORMULARIO DE TARJETA */}
      {paymentMethod === 'online_card' && stripeAvailable && (
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
                        '::placeholder': { color: '#aab7c4' },
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

      {/* INSTRUCCIONES DE PAGO CONTRA ENTREGA */}
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
                      <li>✅ Prepararemos tu pedido en 2-4 horas</li>
                      <li>📱 Te notificaremos cuando esté listo</li>
                      <li>🏪 Vienes a {gymConfig.name} y pagas</li>
                      <li>💳 Aceptamos efectivo y tarjetas</li>
                      <li>🚫 Sin costos de envío</li>
                    </>
                  ) : (
                    <>
                      <li>📦 Recibirás tu pedido en la dirección indicada</li>
                      <li>💰 Pagas el monto exacto al repartidor</li>
                      <li>💳 Aceptamos efectivo y tarjetas</li>
                      <li>🚚 Incluye costo de envío: {currencySymbol}{shippingCost.toFixed(2)}</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMACIÓN DE EMAIL */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <Mail className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
          <div className="text-sm">
            <p className="text-green-800 font-medium mb-1">Confirmación automática</p>
            <p className="text-green-700">
              Recibirás un email a <strong>{customerInfo.email}</strong> con los detalles de tu pedido.
            </p>
          </div>
        </div>
      </div>

      {/* BOTÓN DE PAGO */}
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
                  ? `Pagar ${currencySymbol}${totalToShow.toFixed(2)}`
                  : 'Confirmar pedido'
                }
              </span>
            </>
          )}
        </button>

        <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
          <Shield className="w-4 h-4 mr-1" />
          <span>Tus datos están protegidos</span>
        </div>
      </div>
    </div>
  );
};

export { PaymentStep };