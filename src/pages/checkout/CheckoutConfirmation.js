// src/pages/checkout/CheckoutConfirmation.js
// VERSIÓN FINAL: Usa gymConfig centralizado - 100% sin datos hardcodeados
// Autor: Alexander Echeverria

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Package, Mail, Phone, Store, Home, Truck, Map, Shield, AlertCircle
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

const ConfirmationStep = ({ order, customerInfo, gymConfig }) => {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const currencySymbol = gymConfig?.regional?.currencySymbol || 'Q';

  useEffect(() => {
    console.log('✅ Orden completada exitosamente');
    console.log('📧 Email enviado a:', customerInfo?.email);
    console.log('🏪 Procesado por:', gymConfig?.name);
  }, [customerInfo, gymConfig]);

  const handleContinueShopping = () => {
    clearCart();
    navigate('/store');
  };

  const handleGoHome = () => {
    clearCart();
    navigate('/');
  };

  return (
    <div className="space-y-8">
      {/* BANNER DE ÉXITO */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-8 text-center shadow-xl">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            ¡COMPRA EXITOSA!
          </h1>
          <p className="text-green-100 text-lg md:text-xl mb-4">
            Tu pedido ha sido confirmado y procesado correctamente
          </p>
          <div className="bg-white bg-opacity-20 rounded-lg px-6 py-3">
            <p className="text-green-100 text-sm mb-1">Número de pedido:</p>
            <p className="text-2xl font-bold text-white">
              #{order?.orderNumber || order?.id}
            </p>
          </div>
        </div>
      </div>

      {/* DETALLES Y CONFIRMACIÓN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DETALLES DEL PEDIDO */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Package className="w-6 h-6 text-primary-600 mr-2" />
            Detalles del pedido
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Número:</span>
              <span className="font-semibold">#{order?.orderNumber || order?.id}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Total pagado:</span>
              <span className="font-bold text-xl text-green-600">
                {currencySymbol}{parseFloat(order?.totalAmount || 0).toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Estado:</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-1" />
                Confirmado
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Pago:</span>
              <span className="font-medium">
                {order?.paymentMethod === 'online_card' 
                  ? '💳 Tarjeta' 
                  : order?.paymentMethod === 'cash_on_delivery'
                  ? '💵 Contra entrega'
                  : '💰 Efectivo'
                }
              </span>
            </div>

            {order?.deliveryMethod && (
              <div className="flex justify-between">
                <span className="text-gray-600">Entrega:</span>
                <span className="font-medium">
                  {order.deliveryMethod === 'pickup_store'
                    ? '🏪 Recoger en tienda'
                    : order.deliveryMethod === 'local_delivery'
                    ? '🚚 Envío local'
                    : '🌍 Envío nacional'
                  }
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CONFIRMACIÓN ENVIADA */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Mail className="w-6 h-6 text-blue-600 mr-2" />
            Confirmación enviada
          </h3>
          
          <div className="space-y-3">
            {/* EMAIL */}
            <div className="flex items-center text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
              <span>
                Email enviado a <strong>{customerInfo?.email || gymConfig?.contact?.email || 'tu correo'}</strong>
              </span>
            </div>
            
            {/* WHATSAPP */}
            {gymConfig?.contact?.whatsapp && (
              <div className="flex items-center text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                <span>Actualizaciones por WhatsApp</span>
              </div>
            )}
            
            {/* PROCESADO POR */}
            <div className="flex items-center text-sm">
              <Store className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
              <span>Procesado por <strong>{gymConfig?.name || 'Elite Fitness Club'}</strong></span>
            </div>
            
            {/* SOPORTE */}
            {(gymConfig?.contact?.supportPhone || gymConfig?.contact?.phone) && (
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                <span>Soporte: <strong>{gymConfig?.contact?.supportPhone || gymConfig?.contact?.phone}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BADGES DE PROGRESO */}
      <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-semibold text-green-800">Email confirmado</p>
            <p className="text-sm text-green-600">Detalles enviados</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-semibold text-green-800">WhatsApp activo</p>
            <p className="text-sm text-green-600">Seguimiento en tiempo real</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-semibold text-green-800">En preparación</p>
            <p className="text-sm text-green-600">Comenzamos ahora</p>
          </div>
        </div>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleContinueShopping}
          className="w-full bg-primary-600 text-white py-4 rounded-xl text-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center"
        >
          <Package className="w-5 h-5 mr-2" />
          Seguir comprando
        </button>
        
        <button
          onClick={handleGoHome}
          className="w-full text-primary-600 py-4 rounded-xl text-lg font-semibold hover:bg-primary-50 transition-colors border-2 border-primary-600 flex items-center justify-center"
        >
          <Home className="w-5 h-5 mr-2" />
          Volver al inicio
        </button>
      </div>

      {/* INFORMACIÓN DE AYUDA */}
      {(gymConfig?.contact?.email || gymConfig?.contact?.phone) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-800 font-medium mb-2">
            ¿Necesitas ayuda con tu pedido?
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {gymConfig?.contact?.supportEmail && (
              <span className="text-blue-600">
                📧 {gymConfig.contact.supportEmail}
              </span>
            )}
            {gymConfig?.contact?.supportPhone && (
              <span className="text-blue-600">
                📱 {gymConfig.contact.supportPhone}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// OrderSummary - CORREGIDO: Total que ve el cliente = Productos + Envío
// ============================================================================
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
  const selectedDeliveryOption = deliveryOptions[deliveryMethod];

  // ✅ CÁLCULO CORRECTO PARA MOSTRAR AL CLIENTE:
  // El summary ya contiene el desglose correcto:
  // - totalProductsWithTax: precio de productos CON IVA
  // - Sumamos el envío que el cliente seleccionó
  const productsTotal = summary?.totalProductsWithTax || 0;
  const shipping = parseFloat(shippingCost) || 0;
  const finalTotal = productsTotal + shipping;

  console.log('📊 OrderSummary - Lo que ve el cliente:');
  console.log(`   Productos (con IVA incluido): Q${productsTotal.toFixed(2)}`);
  console.log(`   + Envío: Q${shipping.toFixed(2)}`);
  console.log(`   = TOTAL A PAGAR: Q${finalTotal.toFixed(2)}`);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Resumen del pedido
      </h3>

      {/* LISTA DE PRODUCTOS */}
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.cartId || item.id} className="flex items-center space-x-3">
            <img 
              src={item.image || '/api/placeholder/60/60'}
              alt={item.name}
              className="w-12 h-12 object-cover rounded-lg"
              onError={(e) => e.target.src = '/api/placeholder/60/60'}
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

      {/* DESGLOSE DE PRECIOS */}
      <div className="border-t pt-4 space-y-2">
        {/* PRODUCTOS (con IVA incluido) */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Productos:
            <span className="text-xs text-gray-500 ml-1">(IVA incluido)</span>
          </span>
          <span className="font-medium">{formatCurrency(productsTotal)}</span>
        </div>
        
        {/* ENVÍO */}
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
          <span className="font-medium">
            {shipping === 0 ? (
              <span className="text-green-600 font-semibold">Gratis</span>
            ) : (
              formatCurrency(shipping)
            )}
          </span>
        </div>
        
        {/* TOTAL FINAL - LO QUE EL CLIENTE PAGA */}
        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Total a pagar:</span>
          <span className="text-primary-600">
            {formatCurrency(finalTotal)}
          </span>
        </div>
      </div>

      {/* INFORMACIÓN ADICIONAL DEL ENVÍO */}
      {selectedDeliveryOption && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start text-sm">
            {deliveryMethod === 'pickup_store' ? (
              <Store className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            ) : deliveryMethod === 'local_delivery' ? (
              <Truck className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            ) : (
              <Map className="w-4 h-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
            )}
            <div className="text-gray-700">
              <p className="font-medium">{selectedDeliveryOption.description}</p>
              {selectedDeliveryOption.coverage && (
                <p className="text-xs text-gray-600 mt-1">
                  {selectedDeliveryOption.coverage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BOTÓN DE CONTINUAR */}
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
            {hasErrors 
              ? `Corregir ${errorCount === 1 ? 'error' : 'errores'}` 
              : 'Continuar al pago'
            }
          </button>
        </>
      )}

      {/* BADGES DE INFORMACIÓN */}
      <div className="mt-6 space-y-2 text-sm text-gray-600">
        <div className="flex items-center">
          <Shield className="w-4 h-4 mr-2 text-green-500" />
          <span>Compra 100% segura</span>
        </div>
        
        <div className="flex items-center">
          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
          <span>Precios con IVA incluido</span>
        </div>
        
        {deliveryMethod === 'pickup_store' && (
          <div className="flex items-center">
            <Store className="w-4 h-4 mr-2 text-blue-500" />
            <span>Sin costo de envío</span>
          </div>
        )}
        
        <div className="flex items-center">
          <Mail className="w-4 h-4 mr-2 text-blue-500" />
          <span>Confirmación por email</span>
        </div>
      </div>
    </div>
  );
};

export { ConfirmationStep, OrderSummary };