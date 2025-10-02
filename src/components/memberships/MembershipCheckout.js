// Autor: Alexander Echeverria
// src/components/memberships/MembershipCheckout.js
// Archivo principal de checkout de membresias

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Lock, 
  CheckCircle,
  Loader2,
  Crown,
  Calendar,
  Check,
  ChevronRight
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import membershipService from '../../services/membershipService';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

import { 
  MembershipInfoStep,
  ScheduleSelectionStepScalable,
  MembershipSummaryImproved,
  MembershipConfirmationStep
} from './MembershipCheckoutSteps';

import { MembershipPaymentStep } from './MembershipPaymentForm';

const traducirDia = (dia, translations = {}) => {
  if (!dia) return dia;
  
  if (translations.days && translations.days[dia]) {
    return translations.days[dia];
  }
  
  const fallbackTranslations = {
    'monday': 'Lunes',
    'tuesday': 'Martes', 
    'wednesday': 'Miércoles',
    'thursday': 'Jueves',
    'friday': 'Viernes',
    'saturday': 'Sábado',
    'sunday': 'Domingo'
  };
  
  return fallbackTranslations[dia] || dia;
};

const formatPrice = (price) => {
  const numPrice = parseFloat(price) || 0;
  return numPrice.toFixed(2);
};

const formatPriceWithSymbol = (price, currency = 'Q') => {
  return `${currency}${formatPrice(price)}`;
};

const getTranslationsFromBackend = async () => {
  try {
    const response = await membershipService.getGymContactInfo();
    return response.data?.translations || {};
  } catch (error) {
    console.error('Error obteniendo traducciones:', error);
    return {};
  }
};

const MembershipCheckout = ({ selectedPlan, onBack, onSuccess }) => {
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError, showInfo, formatCurrency, isMobile } = useApp();
  
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedMembership, setCompletedMembership] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  
  const [availableSchedules, setAvailableSchedules] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState({});
  const [planInfo, setPlanInfo] = useState(null);
  const [scheduleVerified, setScheduleVerified] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  const [gymConfig, setGymConfig] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const [bankInfo, setBankInfo] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [translations, setTranslations] = useState({});
  const [loadingConfig, setLoadingConfig] = useState(true);
  
  const [stripeAvailable, setStripeAvailable] = useState(false);
  
  const stripeInitialized = useRef(false);
  
  useEffect(() => {
    if (!isAuthenticated) {
      showError('Debes iniciar sesión para adquirir una membresía');
      onBack();
    }
  }, [isAuthenticated, onBack, showError]);

  useEffect(() => {
    loadDynamicConfiguration();
  }, []);
  
  useEffect(() => {
    const initializeStripe = async () => {
      if (stripeInitialized.current) return;
      
      const stripeEnabled = process.env.REACT_APP_STRIPE_ENABLED === 'true';
      
      if (!stripeEnabled) {
        setStripeAvailable(false);
        stripeInitialized.current = true;
        return;
      }
      
      try {
        const stripeConfig = await membershipService.checkStripeConfig();
        
        if (stripeConfig?.enabled) {
          const publishableKey = stripeConfig.publishableKey;
          const stripe = await loadStripe(publishableKey);
          setStripePromise(Promise.resolve(stripe));
          setStripeAvailable(true);
        } else {
          setStripeAvailable(false);
          showInfo('Pagos con tarjeta no disponibles. Usa transferencia o efectivo.');
        }
        
        stripeInitialized.current = true;
        
      } catch (error) {
        console.error('Error inicializando Stripe:', error);
        setStripeAvailable(false);
      }
    };

    initializeStripe();
  }, [showError, showInfo]);
  
  useEffect(() => {
    if (step === 2 && selectedPlan && !availableSchedules) {
      loadScheduleOptions();
    }
  }, [step, selectedPlan, availableSchedules]);

  const loadDynamicConfiguration = async () => {
    try {
      setLoadingConfig(true);
      
      console.log('Cargando configuración dinámica del backend...');
      
      const [
        gymConfigResponse,
        contactResponse, 
        bankResponse,
        paymentResponse
      ] = await Promise.all([
        membershipService.getGymConfig?.() || Promise.resolve({ success: false }),
        membershipService.getGymContactInfo(),
        membershipService.getBankTransferInfo(),
        membershipService.getPaymentMethodsConfig()
      ]);
      
      console.log('Respuestas de configuración:', {
        gymConfig: gymConfigResponse?.success,
        contact: contactResponse?.success,
        bank: bankResponse?.success,
        payment: paymentResponse?.success
      });
      
      if (gymConfigResponse?.success) {
        setGymConfig(gymConfigResponse.data);
      }
      
      if (contactResponse?.success) {
        setContactInfo(contactResponse.data);
      }
      
      if (bankResponse?.success) {
        setBankInfo(bankResponse.data);
      }
      
      if (paymentResponse?.success) {
        setPaymentConfig(paymentResponse.data);
      }
      
      const translationsData = await getTranslationsFromBackend();
      setTranslations(translationsData);
      
    } catch (error) {
      console.error('Error cargando configuración dinámica:', error);
      showError('Error cargando información del gimnasio');
    } finally {
      setLoadingConfig(false);
    }
  };
  
  const loadScheduleOptions = async () => {
    try {
      setIsProcessing(true);
      
      const scheduleData = await membershipService.getScheduleOptions(selectedPlan.id);
      
      const translatedSchedules = {};
      Object.entries(scheduleData.availableOptions).forEach(([day, dayData]) => {
        if (dayData) {
          translatedSchedules[day] = {
            ...dayData,
            dayName: traducirDia(day, translations)
          };
        }
      });
      
      setAvailableSchedules(translatedSchedules);
      setPlanInfo(scheduleData.plan);
      setSelectedSchedule({});
      
    } catch (error) {
      console.error('Error cargando horarios:', error);
      showError('Error cargando horarios disponibles');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const verifyScheduleAvailability = async () => {
    try {
      setIsProcessing(true);
      
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
  
  const handleContinue = async () => {
    if (step === 2) {
      const verified = await verifyScheduleAvailability();
      if (!verified) return;
    }
    
    if (step < 4) {
      setStep(step + 1);
    }
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };
  
  const handleScheduleChange = (day, slotId) => {
    setSelectedSchedule(prev => ({
      ...prev,
      [day]: slotId ? [slotId] : []
    }));
    setScheduleVerified(false);
  };

  if (loadingConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-16">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Cargando información del gimnasio...</h3>
          <p className="text-gray-600">Preparando el mejor proceso de compra para ti</p>
        </div>
      </div>
    );
  }
  
  if (!selectedPlan || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4].map((stepNum) => (
                <React.Fragment key={stepNum}>
                  <div className="flex flex-col items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      step >= stepNum 
                        ? 'bg-primary-600 border-primary-600 text-white' 
                        : 'border-gray-300 text-gray-400'
                    }`}>
                      {step > stepNum ? <CheckCircle className="w-5 h-5" /> : <span className="font-semibold">{stepNum}</span>}
                    </div>
                    <span className="text-xs text-gray-600 mt-1">
                      {stepNum === 1 && 'Confirmar'}
                      {stepNum === 2 && 'Horarios'}
                      {stepNum === 3 && 'Pagar'}
                      {stepNum === 4 && '¡Listo!'}
                    </span>
                  </div>
                  {stepNum < 4 && (
                    <div className={`w-12 h-0.5 transition-colors ${step > stepNum ? 'bg-primary-600' : 'bg-gray-300'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {step === 4 ? (
          <MembershipConfirmationStep
            membership={completedMembership}
            user={user}
            contactInfo={contactInfo}
            gymConfig={gymConfig}
            onBack={onBack}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2">
              {step === 1 && (
                <MembershipInfoStep
                  plan={selectedPlan}
                  user={user}
                  contactInfo={contactInfo}
                  onContinue={handleContinue}
                />
              )}

              {step === 2 && (
                <ScheduleSelectionStepScalable
                  plan={selectedPlan}
                  planInfo={planInfo}
                  availableSchedules={availableSchedules}
                  selectedSchedule={selectedSchedule}
                  onScheduleChange={handleScheduleChange}
                  setSelectedSchedule={setSelectedSchedule}
                  isProcessing={isProcessing}
                  scheduleVerified={scheduleVerified}
                  onContinue={handleContinue}
                  translations={translations}
                />
              )}

              {step === 3 && (
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
                    stripeAvailable={stripeAvailable}
                    gymConfig={gymConfig}
                    contactInfo={contactInfo}
                    bankInfo={bankInfo}
                    paymentConfig={paymentConfig}
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
                contactInfo={contactInfo}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembershipCheckout;
export { traducirDia, formatPrice, formatPriceWithSymbol };

/*
=== MEJORAS IMPLEMENTADAS EN UX ===

1. **BOTÓN "APLICAR A TODOS" MEJORADO**:
   - Tamaño más grande y visible
   - Texto claro "Aplicar a todos" además del ícono
   - Colores llamativos (gradiente azul)
   - Hover effects con transformaciones
   - Posicionamiento más prominente

2. **GUÍAS Y EXPLICACIONES MEJORADAS**:
   - Banner especial para planes extendidos explicando la funcionalidad
   - Tips contextuales con ejemplos visuales del botón
   - Mensajes claros sobre cómo usar la función
   - Estados visuales diferenciados según el modo activo

3. **TEXTO COMPLETAMENTE EN ESPAÑOL**:
   - Todos los mensajes al usuario en español
   - Días de la semana traducidos correctamente
   - Etiquetas y botones en español
   - Mensajes de estado y confirmación en español

4. **INDICADORES VISUALES MEJORADOS**:
   - Íconos más grandes y descriptivos
   - Colores diferenciados para cada estado
   - Transiciones suaves entre modos
   - Badges explicativos para identificar funciones

5. **EXPERIENCIA PROGRESIVA**:
   - Función solo aparece para planes extendidos
   - Guías contextuales cuando es relevante
   - Información clara sobre beneficios
   - Controles intuitivos para cambiar entre modos

6. **MENSAJES EDUCATIVOS**:
   - Explicación clara de para qué sirve la función
   - Beneficios destacados ("ahorra tiempo")
   - Ejemplos visuales del botón a buscar
   - Tips sobre cuándo usar cada modo

La interfaz ahora es mucho más clara y educativa, guiando al usuario paso a paso sobre cómo usar la nueva funcionalidad de aplicar el mismo horario a todos los días.hola si
*/