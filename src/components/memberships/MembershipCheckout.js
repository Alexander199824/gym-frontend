// Autor: Alexander Echeverria
// src/components/memberships/MembershipCheckout.js
// ACTUALIZADO: Selección manual de horarios completamente en español - VERSIÓN COMPLETA
// MEJORAS: Botón más visible, sin auto-selección, instrucciones claras, español perfecto

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
  Clock,
  FileText,
  AlertTriangle,
  X,
  Check,
  Wifi,
  Phone,
  Mail,
  MapPin,
  Eye,
  EyeOff,
  Banknote,
  ChevronRight
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import membershipService from '../../services/membershipService';

// Importar Stripe
import { loadStripe } from '@stripe/stripe-js';
import { 
  Elements, 
  CardElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';

// MEJORADO: Traducción completa de días al español
const DIAS_ESPANOL = {
  'Monday': 'Lunes',
  'Tuesday': 'Martes', 
  'Wednesday': 'Miércoles',
  'Thursday': 'Jueves',
  'Friday': 'Viernes',
  'Saturday': 'Sábado',
  'Sunday': 'Domingo',
  'Mon': 'Lun',
  'Tue': 'Mar',
  'Wed': 'Mié', 
  'Thu': 'Jue',
  'Fri': 'Vie',
  'Sat': 'Sáb',
  'Sun': 'Dom',
  'monday': 'Lunes',
  'tuesday': 'Martes',
  'wednesday': 'Miércoles',
  'thursday': 'Jueves',
  'friday': 'Viernes',
  'saturday': 'Sábado',
  'sunday': 'Domingo'
};

const traducirDia = (dia) => {
  return DIAS_ESPANOL[dia] || dia;
};

// MEJORADO: Función para traducir nombres de días en objetos de horarios
const traducirHorariosAEspanol = (scheduleData) => {
  if (!scheduleData) return {};
  
  const translated = {};
  Object.keys(scheduleData).forEach(day => {
    const dayData = scheduleData[day];
    if (dayData && dayData.dayName) {
      translated[day] = {
        ...dayData,
        dayName: traducirDia(dayData.dayName)
      };
    } else {
      translated[day] = dayData;
    }
  });
  return translated;
};

const MembershipCheckout = ({ selectedPlan, onBack, onSuccess }) => {
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError, showInfo, formatCurrency, isMobile } = useApp();
  
  // Estados principales
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedMembership, setCompletedMembership] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  
  // Estados del flujo
  const [availableSchedules, setAvailableSchedules] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState({}); // CAMBIADO: Inicia vacío
  const [planInfo, setPlanInfo] = useState(null);
  const [scheduleVerified, setScheduleVerified] = useState(false);
  
  // Estados de pago
  const [paymentMethod, setPaymentMethod] = useState('card');
  
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
        console.log('Verificando Stripe...');
        
        const stripeConfig = await membershipService.checkStripeConfig();
        
        if (stripeConfig?.enabled) {
          const publishableKey = stripeConfig.publishableKey;
          const stripe = await loadStripe(publishableKey);
          setStripePromise(Promise.resolve(stripe));
          console.log('Stripe habilitado para producción');
        } else {
          console.warn('Stripe no habilitado');
          showInfo('Pagos con tarjeta no disponibles. Usa transferencia o efectivo.');
        }
        
        stripeInitialized.current = true;
        
      } catch (error) {
        console.error('Error inicializando Stripe:', error);
        showError('Error cargando sistema de pagos con tarjeta.');
      }
    };

    initializeStripe();
  }, [showError, showInfo]);
  
  // EFECTO: Cargar horarios cuando llega al step 2
  useEffect(() => {
    if (step === 2 && selectedPlan && !availableSchedules) {
      loadScheduleOptions();
    }
  }, [step, selectedPlan, availableSchedules]);
  
  // FUNCIÓN MEJORADA: Cargar opciones de horarios SIN auto-selección
  const loadScheduleOptions = async () => {
    try {
      setIsProcessing(true);
      console.log(`Cargando horarios para plan ${selectedPlan.id}...`);
      
      const scheduleData = await membershipService.getScheduleOptions(selectedPlan.id);
      
      // MEJORADO: Traducir nombres de días al español
      const translatedSchedules = traducirHorariosAEspanol(scheduleData.availableOptions);
      
      setAvailableSchedules(translatedSchedules);
      setPlanInfo(scheduleData.plan);
      
      // ELIMINADO: Ya no auto-selecciona horarios
      // NUEVO: Mantener selección vacía para que usuario elija manualmente
      setSelectedSchedule({});
      
      console.log('Horarios cargados exitosamente - Esperando selección del usuario');
      
    } catch (error) {
      console.error('Error cargando horarios:', error);
      showError('Error cargando horarios disponibles');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // FUNCIÓN: Verificar disponibilidad de horarios
  const verifyScheduleAvailability = async () => {
    try {
      setIsProcessing(true);
      console.log('Verificando disponibilidad...');
      
      const verification = await membershipService.checkScheduleAvailability(
        selectedPlan.id, 
        selectedSchedule
      );
      
      if (verification.canPurchase) {
        setScheduleVerified(true);
        showSuccess('Horarios verificados y disponibles');
        return true;
      } else {
        showError('Algunos horarios ya no están disponibles');
        
        // Mostrar conflictos
        verification.conflicts.forEach(conflict => {
          showError(`${conflict.day}: ${conflict.error}`);
        });
        
        return false;
      }
      
    } catch (error) {
      console.error('Error verificando horarios:', error);
      showError('Error verificando disponibilidad de horarios');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // FUNCIÓN: Continuar al siguiente paso
  const handleContinue = async () => {
    if (step === 2) {
      // Verificar horarios antes de continuar al pago
      const verified = await verifyScheduleAvailability();
      if (!verified) return;
    }
    
    if (step < 4) {
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
  
  // FUNCIÓN: Manejar cambio de horario
  const handleScheduleChange = (day, slotIds) => {
    setSelectedSchedule(prev => ({
      ...prev,
      [day]: slotIds
    }));
    setScheduleVerified(false); // Requiere nueva verificación
  };
  
  if (!selectedPlan || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* HEADER MEJORADO */}
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
              {step === 2 && 'Elegir Horarios'}
              {step === 3 && 'Forma de Pago'}
              {step === 4 && '¡Listo!'}
            </h1>
            
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600">Compra Segura</span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE PROGRESO MEJORADA */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-4">
              {/* Paso 1 */}
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  step >= 1 
                    ? 'bg-primary-600 border-primary-600 text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {step > 1 ? <CheckCircle className="w-5 h-5" /> : <span className="font-semibold">1</span>}
                </div>
                <span className="text-xs text-gray-600 mt-1">Confirmar</span>
              </div>
              
              <div className={`w-12 h-0.5 transition-colors ${step > 1 ? 'bg-primary-600' : 'bg-gray-300'}`} />
              
              {/* Paso 2 */}
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  step >= 2 
                    ? 'bg-primary-600 border-primary-600 text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {step > 2 ? <CheckCircle className="w-5 h-5" /> : <span className="font-semibold">2</span>}
                </div>
                <span className="text-xs text-gray-600 mt-1">Horarios</span>
              </div>
              
              <div className={`w-12 h-0.5 transition-colors ${step > 2 ? 'bg-primary-600' : 'bg-gray-300'}`} />
              
              {/* Paso 3 */}
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  step >= 3 
                    ? 'bg-primary-600 border-primary-600 text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {step > 3 ? <CheckCircle className="w-5 h-5" /> : <span className="font-semibold">3</span>}
                </div>
                <span className="text-xs text-gray-600 mt-1">Pagar</span>
              </div>
              
              <div className={`w-12 h-0.5 transition-colors ${step > 3 ? 'bg-primary-600' : 'bg-gray-300'}`} />
              
              {/* Paso 4 */}
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  step >= 4 
                    ? 'bg-primary-600 border-primary-600 text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {step >= 4 ? <CheckCircle className="w-5 h-5" /> : <span className="font-semibold">4</span>}
                </div>
                <span className="text-xs text-gray-600 mt-1">¡Listo!</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {step === 4 ? (
          // Paso 4: Confirmación
          <MembershipConfirmationStep
            membership={completedMembership}
            user={user}
            onBack={onBack}
          />
        ) : (
          // Pasos 1, 2 y 3: Layout con resumen lateral
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

              {step === 2 && (
                <ScheduleSelectionStep
                  plan={selectedPlan}
                  planInfo={planInfo}
                  availableSchedules={availableSchedules}
                  selectedSchedule={selectedSchedule}
                  onScheduleChange={handleScheduleChange}
                  isProcessing={isProcessing}
                  scheduleVerified={scheduleVerified}
                  onContinue={handleContinue}
                />
              )}

              {step === 3 && stripePromise && (
                <Elements stripe={stripePromise}>
                  <MembershipPaymentStep
                    plan={selectedPlan}
                    selectedSchedule={selectedSchedule}
                    user={user}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                    stripePromise={stripePromise}
                    onSuccess={(membership) => {
                      setCompletedMembership(membership);
                      setStep(4);
                      onSuccess && onSuccess(membership);
                    }}
                    onError={(error) => showError(error)}
                  />
                </Elements>
              )}
            </div>

            {/* RESUMEN DE LA MEMBRESÍA MEJORADO */}
            <div className="lg:col-span-1">
              <MembershipSummaryImproved
                plan={selectedPlan}
                selectedSchedule={selectedSchedule}
                user={user}
                step={step}
                onContinue={step === 1 ? handleContinue : null}
                isProcessing={isProcessing}
                formatCurrency={formatCurrency}
                scheduleVerified={scheduleVerified}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// COMPONENTE: Paso 1 - Información de la membresía MEJORADO
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
                <span className="mr-1">Q</span>
                {plan.price}
              </div>
              <div className="text-sm text-gray-600">
                por {plan.durationType}
              </div>
              {plan.originalPrice && plan.originalPrice > plan.price && (
                <div className="text-sm text-green-600 font-medium">
                  Ahorro: Q{plan.originalPrice - plan.price}
                </div>
              )}
            </div>
          </div>
          
          {plan.description && (
            <p className="text-gray-700 mb-4">{plan.description}</p>
          )}
          
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
              <li>• La membresía se activará después del pago y validación</li>
              <li>• Recibirás un correo de confirmación con todos los detalles</li>
              <li>• En el siguiente paso podrás elegir tus horarios preferidos</li>
              <li>• Los pagos con tarjeta se procesan de inmediato</li>
              <li>• Transferencias y efectivo requieren validación manual</li>
            </ul>
          </div>
        </div>
      </div>

      {/* BOTÓN MEJORADO PARA CONTINUAR A HORARIOS */}
      <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Siguiente paso: Elige tus horarios</h3>
            <p className="text-primary-100 text-sm">
              Selecciona cuándo quieres entrenar para personalizar tu experiencia
            </p>
          </div>
          <button
            onClick={onContinue}
            className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center"
          >
            Continuar
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

// COMPONENTE: Paso 2 - Selección de horarios COMPLETAMENTE MEJORADO
const ScheduleSelectionStep = ({ 
  plan, 
  planInfo, 
  availableSchedules, 
  selectedSchedule, 
  onScheduleChange, 
  isProcessing,
  scheduleVerified,
  onContinue 
}) => {
  
  if (isProcessing) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-gray-600">Cargando horarios disponibles...</p>
      </div>
    );
  }

  if (!availableSchedules || !planInfo) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Error cargando horarios disponibles</p>
      </div>
    );
  }

  const selectedSlotsCount = Object.values(selectedSchedule).reduce(
    (sum, slots) => sum + (slots?.length || 0), 0
  );

  return (
    <div className="space-y-6">
      
      {/* INSTRUCCIONES CLARAS PARA EL USUARIO */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200 rounded-xl p-8">
        <div className="text-center mb-6">
          <Calendar className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            ¡Selecciona tus horarios de entrenamiento!
          </h2>
          <p className="text-lg text-gray-700 mb-4">
            Elige los días y horarios cuando planeas venir al gimnasio
          </p>
          
          {/* CONTADOR PROMINENTE */}
          <div className="bg-white rounded-lg p-4 inline-block">
            <div className="text-3xl font-bold text-primary-600">
              {selectedSlotsCount}
              <span className="text-lg text-gray-600">/{planInfo.maxReservationsPerWeek || '∞'}</span>
            </div>
            <div className="text-sm text-gray-600">horarios seleccionados</div>
          </div>
        </div>

        {/* INFORMACIÓN DEL PLAN */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-white rounded-lg p-4">
          <div className="text-center">
            <div className="font-semibold text-gray-800">Días disponibles</div>
            <div className="text-primary-600">{planInfo.allowedDays?.join(', ') || 'Todos los días'}</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-800">Máximo por día</div>
            <div className="text-primary-600">{planInfo.maxSlotsPerDay || 'Sin límite'}</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-800">Máximo semanal</div>
            <div className="text-primary-600">{planInfo.maxReservationsPerWeek || 'Sin límite'}</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-800">Seleccionados</div>
            <div className={`font-bold text-xl ${
              selectedSlotsCount > (planInfo.maxReservationsPerWeek || 999) ? 'text-red-600' : 'text-green-600'
            }`}>
              {selectedSlotsCount}
            </div>
          </div>
        </div>

        {/* MENSAJE DE INSTRUCCIÓN */}
        {selectedSlotsCount === 0 && (
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-medium">
                👆 Selecciona al menos un horario para continuar
              </span>
            </div>
          </div>
        )}
      </div>

      {/* GRID DE DÍAS Y HORARIOS MEJORADO */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          Haz clic en los horarios que prefieres
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(availableSchedules).map(([day, dayData]) => (
            <ScheduleDayCardImproved
              key={day}
              day={day}
              dayData={dayData}
              selectedSlots={selectedSchedule[day] || []}
              onSelectionChange={(slotIds) => onScheduleChange(day, slotIds)}
              maxSlotsPerDay={planInfo.maxSlotsPerDay}
              totalSelected={selectedSlotsCount}
              maxTotal={planInfo.maxReservationsPerWeek}
            />
          ))}
        </div>

        {/* BOTÓN SÚPER COMPACTO */}
        <div className="mt-4 pt-3 border-t">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* ESTADO COMPACTO */}
            <div className="flex items-center text-sm">
              {scheduleVerified ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-green-700 font-medium">¡Horarios confirmados!</span>
                </>
              ) : selectedSlotsCount > 0 ? (
                <>
                  <Clock className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="text-blue-700 font-medium">{selectedSlotsCount} horarios listos</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-gray-600">Selecciona horarios</span>
                </>
              )}
            </div>

            {/* BOTÓN COMPACTO */}
            <button
              onClick={onContinue}
              disabled={selectedSlotsCount === 0 || selectedSlotsCount > (planInfo.maxReservationsPerWeek || 999)}
              className={`px-6 py-2 rounded-lg font-medium transition-all text-sm ${
                selectedSlotsCount === 0 || selectedSlotsCount > (planInfo.maxReservationsPerWeek || 999)
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg'
              }`}
            >
              {selectedSlotsCount === 0 
                ? 'Selecciona primero' 
                : selectedSlotsCount > (planInfo.maxReservationsPerWeek || 999)
                ? `Máximo ${planInfo.maxReservationsPerWeek}`
                : `Continuar al pago →`
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// COMPONENTE: Card para cada día MEJORADO CON NOMBRES EN ESPAÑOL
const ScheduleDayCardImproved = ({ 
  day, 
  dayData, 
  selectedSlots, 
  onSelectionChange, 
  maxSlotsPerDay,
  totalSelected,
  maxTotal
}) => {
  
  const handleSlotToggle = (slotId) => {
    const isSelected = selectedSlots.includes(slotId);
    
    if (isSelected) {
      // Deseleccionar
      onSelectionChange(selectedSlots.filter(id => id !== slotId));
    } else {
      // Verificar límites antes de seleccionar
      if (selectedSlots.length >= (maxSlotsPerDay || 999)) {
        return; // Límite por día alcanzado
      }
      if (totalSelected >= (maxTotal || 999)) {
        return; // Límite total alcanzado
      }
      
      // Seleccionar
      onSelectionChange([...selectedSlots, slotId]);
    }
  };

  // MEJORADO: Asegurar que el nombre del día esté en español
  const dayNameSpanish = dayData.dayName || traducirDia(day);

  if (!dayData.isOpen || dayData.slots.length === 0) {
    return (
      <div className="bg-gray-100 border-2 border-gray-200 rounded-xl p-6">
        <h3 className="font-bold text-xl text-gray-400 mb-2 text-center">
          {dayNameSpanish}
        </h3>
        <p className="text-sm text-gray-400 text-center">Cerrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-primary-300 transition-all hover:shadow-lg">
      <h3 className="font-bold text-xl text-gray-900 mb-4 text-center flex items-center justify-between">
        <span>{dayNameSpanish}</span>
        <span className={`text-lg px-4 py-2 rounded-full ${
          selectedSlots.length > 0 
            ? 'bg-primary-100 text-primary-700 border-2 border-primary-200'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {selectedSlots.length}/{maxSlotsPerDay || '∞'}
        </span>
      </h3>
      
      <div className="space-y-3">
        {dayData.slots.map((slot) => {
          const isSelected = selectedSlots.includes(slot.id);
          const canSelect = slot.canReserve && 
            (!isSelected && selectedSlots.length < (maxSlotsPerDay || 999) && totalSelected < (maxTotal || 999));
          
          return (
            <button
              key={slot.id}
              onClick={() => handleSlotToggle(slot.id)}
              disabled={!slot.canReserve && !isSelected}
              className={`w-full p-4 rounded-xl text-left transition-all transform hover:scale-102 ${
                isSelected
                  ? 'bg-gradient-to-r from-primary-100 to-blue-100 border-3 border-primary-500 text-primary-800 shadow-lg'
                  : canSelect
                  ? 'bg-gray-50 border-2 border-gray-300 hover:bg-primary-50 hover:border-primary-400 text-gray-700 hover:shadow-md'
                  : 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full mr-4 flex items-center justify-center ${
                    isSelected 
                      ? 'bg-primary-600 text-white' 
                      : canSelect 
                      ? 'bg-gray-300 text-gray-600' 
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{slot.label}</div>
                    <div className="text-sm opacity-75">
                      {slot.openTime} - {slot.closeTime}
                    </div>
                  </div>
                </div>
                <div className={`text-xs px-3 py-2 rounded-full font-semibold ${
                  slot.available > 0 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-red-100 text-red-700 border border-red-300'
                }`}>
                  {slot.available}/{slot.capacity} espacios
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// COMPONENTE: Resumen de membresía MEJORADO
const MembershipSummaryImproved = ({ 
  plan, 
  selectedSchedule,
  user, 
  step, 
  onContinue, 
  isProcessing, 
  formatCurrency,
  scheduleVerified
}) => {
  
  const scheduledDays = Object.keys(selectedSchedule).filter(day => 
    selectedSchedule[day] && selectedSchedule[day].length > 0
  ).length;
  
  const totalSlots = Object.values(selectedSchedule).reduce(
    (sum, slots) => sum + (slots?.length || 0), 0
  );
  
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
          Válida por {plan.durationType}
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

      {/* Resumen de horarios MEJORADO */}
      {step >= 2 && (
        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Horarios de entrenamiento
            {scheduleVerified && (
              <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
            )}
          </h4>
          
          {totalSlots === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 italic">
                Aún no has seleccionado horarios
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Selecciona tus horarios preferidos en el paso anterior
              </p>
            </div>
          ) : (
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Días programados:</span>
                <span className="font-semibold text-primary-600">{scheduledDays}</span>
              </div>
              <div className="flex justify-between">
                <span>Horarios totales:</span>
                <span className="font-semibold text-primary-600">{totalSlots}</span>
              </div>
              {!scheduleVerified && step >= 2 && (
                <div className="text-orange-600 text-xs bg-orange-50 p-2 rounded">
                  ⏳ Pendiente de verificación
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detalles del precio */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Plan {plan.name}:</span>
          <span>Q{plan.price.toFixed(2)}</span>
        </div>
        
        {plan.originalPrice && plan.originalPrice > plan.price && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Descuento:</span>
            <span className="text-green-600">
              -Q{(plan.originalPrice - plan.price).toFixed(2)}
            </span>
          </div>
        )}
        
        <div className="border-t pt-3">
          <div className="flex justify-between font-bold text-xl">
            <span>Total:</span>
            <span className="text-primary-600 flex items-center">
              <span className="mr-1">Q</span>
              {plan.price.toFixed(2)}
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

      {/* Botón de continuar MEJORADO */}
      {step === 1 && onContinue && (
        <button
          onClick={onContinue}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-primary-600 to-blue-600 text-white py-4 rounded-xl text-lg font-bold hover:from-primary-700 hover:to-blue-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
        >
          <Calendar className="w-5 h-5 mr-2" />
          Elegir mis horarios
        </button>
      )}

      {/* Garantías y beneficios */}
      <div className="mt-6 space-y-3 text-sm text-gray-600">
        <div className="flex items-center">
          <Shield className="w-4 h-4 mr-2 text-green-500" />
          <span>Proceso 100% seguro</span>
        </div>
        
        <div className="flex items-center">
          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
          <span>Confirmación por correo</span>
        </div>
        
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-blue-500" />
          <span>Horarios personalizados</span>
        </div>
        
        <div className="flex items-center">
          <Phone className="w-4 h-4 mr-2 text-blue-500" />
          <span>Soporte 24/7</span>
        </div>
      </div>
    </div>
  );
};

// COMPONENTE: Paso 3 - Métodos de pago (COMPLETO)
const MembershipPaymentStep = ({ 
  plan, 
  selectedSchedule,
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
  
  // FUNCIÓN: Procesar pago con Stripe (PRODUCCIÓN)
  const handleStripePayment = async () => {
    if (!stripe || !elements) {
      onError('Stripe no está disponible');
      return;
    }

    try {
      setIsProcessing(true);
      setCardError('');

      console.log('Iniciando pago con tarjeta...');

      // 1. Crear Payment Intent
      const paymentIntentData = await membershipService.createMembershipPaymentIntent(
        plan.id, 
        selectedSchedule, 
        user.id
      );

      const { clientSecret } = paymentIntentData;

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
        console.log('Pago confirmado con Stripe');
        
        // 3. Comprar membresía en backend
        const purchaseResult = await membershipService.purchaseMembership(
          plan.id,
          selectedSchedule,
          'card',
          `Pago con tarjeta - Payment Intent: ${paymentIntent.id}`
        );

        console.log('Membresía creada exitosamente');
        
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

  // FUNCIÓN: Crear pago por transferencia
  const handleTransferPayment = async () => {
    try {
      setIsProcessing(true);

      console.log('Creando pago por transferencia...');

      const purchaseResult = await membershipService.purchaseMembership(
        plan.id,
        selectedSchedule,
        'transfer',
        'Pago por transferencia bancaria - Pendiente de validación'
      );

      const paymentId = purchaseResult.payment.id;

      // Subir comprobante si se proporcionó
      if (transferProof) {
        setUploadingProof(true);
        
        try {
          await membershipService.uploadTransferProof(paymentId, transferProof);
          console.log('Comprobante subido exitosamente');
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

      onSuccess(membership);

    } catch (error) {
      console.error('Error en pago por transferencia:', error);
      onError(error.message || 'Error al procesar la transferencia');
    } finally {
      setIsProcessing(false);
      setUploadingProof(false);
    }
  };

  // FUNCIÓN: Crear pago en efectivo
  const handleCashPayment = async () => {
    try {
      setIsProcessing(true);

      console.log('Registrando pago en efectivo...');

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
        status: 'pending_validation'
      };

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
      
      {/* SELECCIÓN DE MÉTODO DE PAGO MEJORADA */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-6">
          <CreditCard className="w-6 h-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">¿Cómo quieres pagar?</h2>
        </div>

        <div className="space-y-4">
          
          {/* Opción: Tarjeta de crédito/débito */}
          {stripePromise && (
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
                    <div className="text-sm text-gray-600">Confirmación inmediata • Visa, Mastercard</div>
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

          {/* Opción: Transferencia bancaria */}
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
                  <div className="text-sm text-gray-600">Sube tu comprobante • Validación manual</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  1-2 días
                </span>
              </div>
            </div>
          </button>

          {/* Opción: Efectivo en gimnasio */}
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
                  <div className="text-sm text-gray-600">Paga al visitar • Confirmación manual</div>
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
        </div>
      </div>

      {/* FORMULARIO DE TARJETA */}
      {paymentMethod === 'card' && (
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

      {/* FORMULARIO DE TRANSFERENCIA */}
      {paymentMethod === 'transfer' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Transferencia bancaria
          </h3>

          {/* Datos bancarios */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-5 mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">
              Datos para transferencia:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Banco:</strong> Banco Industrial</div>
              <div><strong>Cuenta:</strong> 123-456789-0</div>
              <div><strong>Nombre:</strong> Elite Fitness Club S.A.</div>
              <div><strong>Tipo:</strong> Cuenta Monetaria</div>
              <div className="md:col-span-2 text-primary-600 font-bold text-lg flex items-center">
                <span className="mr-1">Q</span>
                <strong>Monto exacto:</strong> Q{plan.price.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Upload de comprobante */}
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

          {/* Instrucciones */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
              <div className="text-sm">
                <p className="text-yellow-800 font-medium mb-2">Proceso de validación</p>
                <ul className="text-yellow-700 space-y-1">
                  <li>1. Realiza la transferencia con el monto exacto</li>
                  <li>2. Sube tu comprobante (opcional pero recomendado)</li>
                  <li>3. Nuestro equipo validará la transferencia en 1-2 días</li>
                  <li>4. Te notificaremos cuando se active tu membresía</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INFORMACIÓN DE EFECTIVO */}
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
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-purple-500 mr-3" />
                <span><strong>Ubicación:</strong> Elite Fitness Club - Recepción</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-purple-500 mr-3" />
                <span><strong>Horario:</strong> Lunes a Domingo 6:00 AM - 10:00 PM</span>
              </div>
              <div className="flex items-center">
                <Banknote className="w-5 h-5 text-purple-500 mr-3" />
                <span><strong>Monto exacto:</strong> Q{plan.price.toFixed(2)}</span>
              </div>
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

      {/* BOTÓN DE PAGAR MEJORADO */}
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
                {paymentMethod === 'card' && `Pagar Q${plan.price.toFixed(2)} con tarjeta`}
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

// COMPONENTE: Paso 4 - Confirmación (COMPLETO)
const MembershipConfirmationStep = ({ membership, user, onBack }) => {
  
  return (
    <div className="space-y-8">
      
      {/* BANNER DE ÉXITO ACTUALIZADO */}
      <div className={`text-white rounded-2xl p-8 text-center shadow-xl ${
        membership?.paymentMethod === 'card' 
          ? 'bg-gradient-to-r from-green-500 to-green-600'
          : 'bg-gradient-to-r from-blue-500 to-blue-600'
      }`}>
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
            {membership?.paymentMethod === 'card' ? (
              <CheckCircle className="w-12 h-12 text-white" />
            ) : (
              <Clock className="w-12 h-12 text-white" />
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            {membership?.paymentMethod === 'card' ? '¡MEMBRESÍA ACTIVADA!' : '¡SOLICITUD REGISTRADA!'}
          </h1>
          <p className="text-blue-100 text-lg md:text-xl mb-4">
            {membership?.paymentMethod === 'card' 
              ? 'Tu membresía está activa y lista para usar'
              : membership?.paymentMethod === 'transfer'
              ? 'Tu transferencia será validada por nuestro equipo'
              : 'Visita el gimnasio para completar tu pago en efectivo'
            }
          </p>
          <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
            <p className="text-blue-100">
              {membership?.paymentMethod === 'card' 
                ? `Membresía ID: ${membership?.id}`
                : `Registro ID: ${membership?.id}`
              }
            </p>
          </div>
        </div>
      </div>

      {/* DETALLES ACTUALIZADOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Información de la membresía */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Crown className="w-6 h-6 text-primary-600 mr-2" />
            {membership?.paymentMethod === 'card' ? 'Tu nueva membresía' : 'Membresía solicitada'}
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Plan:</span>
              <span className="font-semibold">{membership?.plan?.name || 'Plan seleccionado'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Monto:</span>
              <span className="font-bold text-xl text-green-600 flex items-center">
                <span className="mr-1">Q</span>
                {membership?.plan?.price || membership?.amount || '0.00'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Estado:</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                membership?.paymentMethod === 'card' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {membership?.paymentMethod === 'card' ? (
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
                {membership?.paymentMethod === 'card' && 'Tarjeta de crédito/débito'}
                {membership?.paymentMethod === 'transfer' && 'Transferencia bancaria'}
                {membership?.paymentMethod === 'cash' && 'Efectivo en gimnasio'}
              </span>
            </div>

            {/* Mostrar horarios si están disponibles */}
            {membership?.schedule && Object.keys(membership.schedule).length > 0 && (
              <div className="border-t pt-3">
                <span className="text-gray-600">Horarios programados:</span>
                <div className="mt-2 text-sm">
                  {Object.keys(membership.schedule).length} días • 
                  {Object.values(membership.schedule).reduce((sum, slots) => sum + (slots?.length || 0), 0)} slots
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Información de próximos pasos */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Mail className="w-6 h-6 text-blue-600 mr-2" />
            Próximos pasos
          </h3>
          
          <div className="space-y-4">
            {membership?.paymentMethod === 'card' ? (
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
                  <span>Puedes comenzar a entrenar según tus horarios</span>
                </div>
              </>
            ) : membership?.paymentMethod === 'transfer' ? (
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
            ) : (
              <>
                <div className="flex items-center text-sm">
                  <MapPin className="w-4 h-4 text-purple-500 mr-2" />
                  <span>Visita el gimnasio para completar tu pago</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 text-purple-500 mr-2" />
                  <span>Horario: Lunes a Domingo 6:00 AM - 10:00 PM</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Banknote className="w-4 h-4 text-purple-500 mr-2" />
                  <span>Monto: Q{membership?.plan?.price || '0.00'} en efectivo</span>
                </div>
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
=== ACTUALIZACIONES PARA PRODUCCIÓN ===

FLUJO ACTUALIZADO BASADO EN TEST EXITOSO:
1. Paso 1: Información del cliente y plan seleccionado
2. Paso 2: Selección de horarios disponibles (NUEVO)
3. Paso 3: Método de pago (tarjeta, transferencia, efectivo)
4. Paso 4: Confirmación final

ENDPOINTS UTILIZADOS:
- membershipService.getScheduleOptions() -> GET /api/memberships/plans/:id/schedule-options
- membershipService.checkScheduleAvailability() -> POST /api/memberships/purchase/check-availability
- membershipService.createMembershipPaymentIntent() -> POST /api/stripe/create-membership-purchase-intent
- membershipService.purchaseMembership() -> POST /api/memberships/purchase

MÉTODOS DE PAGO IMPLEMENTADOS:

1. TARJETA DE CRÉDITO/DÉBITO:
   - Integración completa con Stripe (sin datos de prueba)
   - Confirmación inmediata al completar pago
   - Activación automática de membresía

2. TRANSFERENCIA BANCARIA:
   - Datos bancarios reales para transferencia
   - Upload opcional de comprobante
   - Validación manual por administradores (1-2 días)
   - Sistema de notificaciones por correo

3. EFECTIVO EN GIMNASIO:
   - Registro de solicitud en sistema
   - Cliente visita gimnasio para pagar
   - Confirmación manual por colaboradores
   - Activación inmediata tras confirmar pago

CARACTERÍSTICAS NUEVAS:
- Selección interactiva de horarios con verificación en tiempo real
- Validación de disponibilidad antes de proceder al pago
- Resumen detallado incluyendo horarios seleccionados
- Estados diferenciados para cada método de pago
- Confirmaciones específicas según método elegido
- Sistema de seguimiento para pagos pendientes

FLUJO DE HORARIOS:
- Carga automática de horarios disponibles por plan
- Selección manual o automática de slots preferidos
- Verificación de disponibilidad en tiempo real
- Límites por día y por semana según plan
- Preview visual de horarios seleccionados

SEGURIDAD Y VALIDACIÓN:
- Sin datos de prueba de Stripe en producción
- Validación de disponibilidad antes de cada compra
- Manejo robusto de errores de pago
- Estados claros para seguimiento de proceso
- Confirmaciones por correo para todos los métodos

EXPERIENCIA DE USUARIO:
- Progreso visual en 4 pasos claros
- Feedback inmediato sobre acciones
- Información contextual para cada método de pago
- Confirmaciones específicas según tipo de pago
- Instrucciones claras para completar proceso
*/