// Autor: Alexander Echeverria
// src/components/memberships/MembershipCheckoutSteps.js
// Componentes de los pasos 1, 2, resumen y confirmacion

import React, { useState } from 'react';
import {
  User,
  Crown,
  AlertCircle,
  Check,
  Calendar,
  Clock,
  CheckCircle,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Shield,
  Copy,
  RefreshCw,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
  Filter,
  AlertTriangle,
  Banknote,
  Loader2
} from 'lucide-react';

import { formatPrice } from './MembershipCheckout';

const agruparHorariosPorFranja = (slots) => {
  const franjas = {
    morning: { label: 'Mañana', slots: [], range: '6:00 - 12:00' },
    afternoon: { label: 'Tarde', slots: [], range: '12:00 - 18:00' },
    evening: { label: 'Noche', slots: [], range: '18:00 - 22:00' }
  };

  slots.forEach(slot => {
    const hour = parseInt(slot.openTime.split(':')[0]);
    if (hour < 12) {
      franjas.morning.slots.push(slot);
    } else if (hour < 18) {
      franjas.afternoon.slots.push(slot);
    } else {
      franjas.evening.slots.push(slot);
    }
  });

  return franjas;
};

const MembershipInfoStep = ({ plan, user, contactInfo, onContinue }) => {
  
  return (
    <div className="space-y-6">
      
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
                {formatPrice(plan.price)}
              </div>
              <div className="text-sm text-gray-600">
                por {plan.durationType}
              </div>
              {plan.originalPrice && parseFloat(plan.originalPrice) > parseFloat(plan.price) && (
                <div className="text-sm text-green-600 font-medium">
                  Ahorro: Q{formatPrice((parseFloat(plan.originalPrice) || 0) - (parseFloat(plan.price) || 0))}
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-blue-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Información importante
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>La membresía se activará después del pago y validación</li>
              <li>Recibirás un correo de confirmación con todos los detalles</li>
              <li>En el siguiente paso podrás elegir tus horarios preferidos</li>
              <li>Los pagos con tarjeta se procesan de inmediato</li>
              <li>Transferencias y efectivo requieren validación manual</li>
            </ul>
            {contactInfo?.supportEmail && (
              <p className="text-xs text-blue-600 mt-2">
                ¿Dudas? Contacta: {contactInfo.supportEmail}
              </p>
            )}
          </div>
        </div>
      </div>

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

const ScheduleSelectionStepScalable = ({ 
  plan, 
  planInfo, 
  availableSchedules, 
  selectedSchedule, 
  onScheduleChange,
  setSelectedSchedule,
  isProcessing,
  scheduleVerified,
  onContinue,
  translations = {}
}) => {
  
  const [sameScheduleForAll, setSameScheduleForAll] = useState(false);
  const [baseScheduleDay, setBaseScheduleDay] = useState(null);
  const [baseScheduleSlot, setBaseScheduleSlot] = useState(null);
  
  if (isProcessing) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-6" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Cargando horarios disponibles...</h3>
        <p className="text-gray-600">Estamos preparando las mejores opciones para ti</p>
      </div>
    );
  }

  if (!availableSchedules || !planInfo) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-6" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Error cargando horarios</h3>
        <p className="text-gray-600">No pudimos cargar los horarios disponibles</p>
      </div>
    );
  }

  const selectedDaysCount = Object.values(selectedSchedule).filter(slots => slots && slots.length > 0).length;
  const maxWeeklySlots = planInfo.maxReservationsPerWeek || 999;
  
  const isExtendedPlan = planInfo.durationType && (
    planInfo.durationType.toLowerCase().includes('semana') ||
    planInfo.durationType.toLowerCase().includes('mes') ||
    planInfo.durationType.toLowerCase().includes('año') ||
    planInfo.durationType.toLowerCase().includes('week') ||
    planInfo.durationType.toLowerCase().includes('month') ||
    planInfo.durationType.toLowerCase().includes('year')
  );
  
  const applyScheduleToAllDays = (sourceDay, slotId) => {
    const sourceSlot = availableSchedules[sourceDay]?.slots?.find(slot => slot.id === slotId);
    if (!sourceSlot) return;
    
    const newSchedule = {};
    
    Object.keys(availableSchedules).forEach(day => {
      const dayData = availableSchedules[day];
      if (dayData && dayData.isOpen && dayData.slots.length > 0) {
        const matchingSlot = dayData.slots.find(slot => 
          slot.openTime === sourceSlot.openTime && 
          slot.closeTime === sourceSlot.closeTime &&
          slot.canReserve
        );
        
        if (matchingSlot) {
          newSchedule[day] = [matchingSlot.id];
        }
      }
    });
    
    setSelectedSchedule(newSchedule);
    setSameScheduleForAll(true);
    setBaseScheduleDay(sourceDay);
    setBaseScheduleSlot(slotId);
  };
  
  const clearAllSchedules = () => {
    setSelectedSchedule({});
    setSameScheduleForAll(false);
    setBaseScheduleDay(null);
    setBaseScheduleSlot(null);
  };
  
  const switchToIndividualMode = () => {
    setSameScheduleForAll(false);
    setBaseScheduleDay(null);
    setBaseScheduleSlot(null);
  };

  const handleScheduleSelection = (day, slotId) => {
    if (sameScheduleForAll) {
      setSameScheduleForAll(false);
      setBaseScheduleDay(null);
      setBaseScheduleSlot(null);
    }
    
    onScheduleChange(day, slotId);
  };

  return (
    <div className="space-y-6">
      
      <div className="bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-200 rounded-xl p-6">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-full mb-3">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Elige tus horarios de entrenamiento
          </h2>
          <p className="text-gray-600 mb-4">
            {sameScheduleForAll ? (
              <>Mismo horario aplicado a todos los días disponibles</>
            ) : (
              <>Selecciona 1 horario por día para crear tu rutina perfecta</>
            )}
          </p>
          
          {!sameScheduleForAll && isExtendedPlan && selectedDaysCount === 0 && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center mb-2">
                <Sparkles className="w-6 h-6 mr-2" />
                <strong className="text-lg">Función especial disponible</strong>
              </div>
              <p className="text-sm text-center">
                ¿Siempre entrenas a la misma hora? Selecciona cualquier horario y usa el botón 
                <span className="bg-white bg-opacity-20 mx-1 px-3 py-1 rounded-lg text-sm font-bold">
                  Aplicar a todos
                </span>
                para programar automáticamente todos los días disponibles.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-primary-600 mb-1">
              {selectedDaysCount}
            </div>
            <div className="text-sm text-gray-600">días seleccionados</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-blue-600 mb-1">1</div>
            <div className="text-sm text-gray-600">horario máximo por día</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {maxWeeklySlots === 999 ? '∞' : maxWeeklySlots}
            </div>
            <div className="text-sm text-gray-600">límite semanal</div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {sameScheduleForAll ? (
            <div className="bg-green-100 border border-green-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Copy className="w-6 h-6 text-green-600 mr-3" />
                  <div>
                    <div className="font-semibold text-green-800 text-lg">
                      Mismo horario aplicado a todos los días
                    </div>
                    <div className="text-sm text-green-700 mt-1">
                      {baseScheduleSlot && baseScheduleDay && availableSchedules[baseScheduleDay] && (
                        (() => {
                          const slot = availableSchedules[baseScheduleDay].slots.find(s => s.id === baseScheduleSlot);
                          return slot ? `Horario: ${slot.openTime} - ${slot.closeTime}` : '';
                        })()
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={switchToIndividualMode}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Horarios variados
                  </button>
                  <button
                    onClick={clearAllSchedules}
                    className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Reiniciar
                  </button>
                </div>
              </div>
            </div>
          ) : selectedDaysCount === 0 ? (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
                <div className="font-medium text-yellow-800 mb-3 text-lg">
                  Selecciona tus horarios favoritos para continuar
                </div>
                {isExtendedPlan && (
                  <div className="text-sm text-yellow-700 bg-yellow-50 p-4 rounded-lg mt-3 border border-yellow-200">
                    <div className="flex items-center justify-center mb-3">
                      <Zap className="w-5 h-5 mr-2" />
                      <strong>Consejo útil:</strong>
                    </div>
                    <p className="mb-2">
                      ¿Prefieres entrenar siempre a la misma hora? 
                    </p>
                    <p>
                      Selecciona cualquier horario y busca el botón 
                      <span className="bg-blue-600 text-white mx-2 px-3 py-1 rounded-lg text-xs font-bold inline-flex items-center">
                        <Copy className="w-3 h-3 mr-1" />
                        Aplicar a todos
                      </span>
                      para programar automáticamente todos los días disponibles.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="w-6 h-6 text-blue-600 mr-3" />
                  <div>
                    <div className="font-medium text-blue-800 text-lg">
                      Modo: Horarios personalizados por día
                    </div>
                    {isExtendedPlan && (
                      <div className="text-sm text-blue-700 mt-1">
                        Puedes usar el botón 
                        <span className="bg-blue-600 text-white mx-1 px-2 py-1 rounded text-xs font-bold">
                          Aplicar a todos
                        </span>
                        en cualquier horario seleccionado para aplicarlo a todos los días
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {selectedDaysCount > 0 && !sameScheduleForAll && (
            <div className="text-center">
              <button
                onClick={clearAllSchedules}
                className="inline-flex items-center px-6 py-3 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors shadow-md hover:shadow-lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Limpiar todos los horarios
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="space-y-6">
          {Object.entries(availableSchedules).map(([day, dayData]) => (
            <ScheduleDayRowScalable
              key={day}
              day={day}
              dayData={dayData}
              selectedSlot={selectedSchedule[day]?.[0] || null}
              onSlotSelect={(slotId) => handleScheduleSelection(day, slotId)}
              onApplyToAll={(slotId) => applyScheduleToAllDays(day, slotId)}
              totalSelected={selectedDaysCount}
              maxTotal={maxWeeklySlots}
              sameScheduleMode={sameScheduleForAll}
              isBaseSchedule={baseScheduleDay === day}
              planDuration={planInfo.durationType}
              isExtendedPlan={isExtendedPlan}
              translations={translations}
            />
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            
            <div className="flex items-center">
              {scheduleVerified ? (
                <>
                  <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
                  <div>
                    <div className="font-semibold text-green-700">¡Horarios confirmados!</div>
                    <div className="text-sm text-green-600">Listos para el pago</div>
                  </div>
                </>
              ) : selectedDaysCount > 0 ? (
                <>
                  <Clock className="w-6 h-6 mr-3 text-blue-600" />
                  <div>
                    <div className="font-semibold text-blue-700">
                      {selectedDaysCount} días programados
                      {sameScheduleForAll && <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">Mismo horario</span>}
                    </div>
                    <div className="text-sm text-blue-600">Listos para verificar</div>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6 mr-3 text-gray-500" />
                  <div>
                    <div className="font-semibold text-gray-700">Selecciona tus horarios</div>
                    <div className="text-sm text-gray-600">Al menos un día para continuar</div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={onContinue}
              disabled={selectedDaysCount === 0 || selectedDaysCount > maxWeeklySlots}
              className={`px-8 py-3 rounded-xl font-bold transition-all ${
                selectedDaysCount === 0 || selectedDaysCount > maxWeeklySlots
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {selectedDaysCount === 0 
                ? 'Selecciona horarios primero' 
                : selectedDaysCount > maxWeeklySlots
                ? `Máximo ${maxWeeklySlots} días`
                : `Continuar al pago`
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ScheduleDayRowScalable = ({ 
  day, 
  dayData, 
  selectedSlot, 
  onSlotSelect,
  onApplyToAll,
  totalSelected,
  maxTotal,
  sameScheduleMode,
  isBaseSchedule,
  planDuration,
  isExtendedPlan,
  translations = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterFranja, setFilterFranja] = useState('all');

  const dayNameSpanish = dayData.dayName || day;

  if (!dayData.isOpen || dayData.slots.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-gray-400 mr-3" />
            <h3 className="font-semibold text-gray-400">{dayNameSpanish}</h3>
          </div>
          <span className="text-sm text-gray-400 bg-gray-200 px-3 py-1 rounded-full">
            Cerrado
          </span>
        </div>
      </div>
    );
  }

  const franjas = agruparHorariosPorFranja(dayData.slots);
  
  const slotsToShow = filterFranja === 'all' 
    ? dayData.slots 
    : franjas[filterFranja]?.slots || [];

  const displaySlots = isExpanded ? slotsToShow : slotsToShow.slice(0, 6);
  const hasMoreSlots = slotsToShow.length > 6;

  const handleSlotClick = (slotId) => {
    if (selectedSlot === slotId) {
      onSlotSelect(null);
    } else {
      if (totalSelected >= maxTotal && !selectedSlot) {
        return;
      }
      onSlotSelect(slotId);
    }
  };

  return (
    <div className={`border rounded-lg transition-all ${
      sameScheduleMode && isBaseSchedule 
        ? 'border-green-400 bg-green-50 shadow-lg' 
        : selectedSlot 
        ? 'border-primary-300 bg-primary-50' 
        : 'border-gray-200'
    }`}>
      
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className={`w-5 h-5 mr-3 ${
              sameScheduleMode && isBaseSchedule ? 'text-green-600' : 'text-primary-600'
            }`} />
            <div>
              <h3 className="font-bold text-lg text-gray-900 flex items-center">
                {dayNameSpanish}
                {sameScheduleMode && isBaseSchedule && (
                  <span className="ml-3 text-xs bg-green-200 text-green-800 px-3 py-1 rounded-full font-medium">
                    Horario base
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600">{dayData.slots.length} horarios disponibles</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {selectedSlot ? (
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                sameScheduleMode && isBaseSchedule
                  ? 'bg-green-100 text-green-700'
                  : 'bg-primary-100 text-primary-700'
              }`}>
                {sameScheduleMode && isBaseSchedule ? 'Horario base' : 'Seleccionado'}
              </div>
            ) : (
              <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                Sin seleccionar
              </div>
            )}
          </div>
        </div>

        {dayData.slots.length > 6 && (
          <div className="flex items-center space-x-2 mt-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex space-x-1">
              <button
                onClick={() => setFilterFranja('all')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filterFranja === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                Todos
              </button>
              {Object.entries(franjas).map(([key, franja]) => (
                franja.slots.length > 0 && (
                  <button
                    key={key}
                    onClick={() => setFilterFranja(key)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      filterFranja === key
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {franja.label} ({franja.slots.length})
                  </button>
                )
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {displaySlots.map((slot) => {
            const isSelected = selectedSlot === slot.id;
            const canSelect = slot.canReserve && (totalSelected < maxTotal || isSelected);
            
            return (
              <div key={slot.id} className="relative">
                <button
                  onClick={() => handleSlotClick(slot.id)}
                  disabled={!slot.canReserve && !isSelected}
                  className={`w-full p-3 rounded-lg text-center transition-all border-2 text-sm ${
                    isSelected
                      ? sameScheduleMode && isBaseSchedule
                        ? 'bg-green-600 border-green-600 text-white shadow-lg transform scale-105'
                        : 'bg-primary-600 border-primary-600 text-white shadow-lg transform scale-105'
                      : canSelect
                      ? 'bg-white border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-gray-700 shadow-sm hover:shadow-md'
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="font-bold">{slot.label}</div>
                  <div className="text-xs opacity-90 mt-1">
                    {slot.openTime}-{slot.closeTime}
                  </div>
                  <div className={`text-xs mt-1 px-2 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-white bg-opacity-20 text-white'
                      : slot.available > 5
                      ? 'bg-green-100 text-green-700'
                      : slot.available > 0
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {slot.available}/{slot.capacity}
                  </div>
                </button>
                
                {isSelected && isExtendedPlan && !sameScheduleMode && (
                  <div className="absolute -top-3 -right-3 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyToAll(slot.id);
                      }}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-1 text-xs font-bold"
                      title="Aplicar este horario a todos los días disponibles"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Aplicar a todos</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {hasMoreSlots && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Ver {slotsToShow.length - 6} horarios más
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const MembershipSummaryImproved = ({ 
  plan, 
  selectedSchedule,
  user, 
  step, 
  onContinue, 
  isProcessing, 
  formatCurrency,
  scheduleVerified,
  contactInfo
}) => {
  
  const scheduledDays = Object.keys(selectedSchedule).filter(day => 
    selectedSchedule[day] && selectedSchedule[day].length > 0
  ).length;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Resumen de tu membresía
      </h3>

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

      {step >= 2 && (
        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Horarios de entrenamiento
            {scheduleVerified && (
              <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
            )}
          </h4>
          
          {scheduledDays === 0 ? (
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
                <span>Límite:</span>
                <span className="font-semibold text-primary-600">1 por día</span>
              </div>
              {!scheduleVerified && step >= 2 && (
                <div className="text-orange-600 text-xs bg-orange-50 p-2 rounded">
                  Pendiente de verificación
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Plan {plan.name}:</span>
          <span>Q{formatPrice(plan.price)}</span>
        </div>
        
        {plan.originalPrice && parseFloat(plan.originalPrice) > parseFloat(plan.price) && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Descuento:</span>
            <span className="text-green-600">
              -Q{formatPrice((parseFloat(plan.originalPrice) || 0) - (parseFloat(plan.price) || 0))}
            </span>
          </div>
        )}
        
        <div className="border-t pt-3">
          <div className="flex justify-between font-bold text-xl">
            <span>Total:</span>
            <span className="text-primary-600 flex items-center">
              <span className="mr-1">Q</span>
              {formatPrice(plan.price)}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t pt-4 mb-6">
        <h4 className="font-medium text-gray-900 mb-2">Titular de la membresía</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>{user.firstName} {user.lastName}</div>
          <div>{user.email}</div>
          {user.phone && <div>{user.phone}</div>}
        </div>
      </div>

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
          <span>1 horario por día</span>
        </div>
        
        <div className="flex items-center">
          <Phone className="w-4 h-4 mr-2 text-blue-500" />
          <span>Soporte 24/7</span>
        </div>
        
        {contactInfo?.supportEmail && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            Soporte: {contactInfo.supportEmail}
          </div>
        )}
      </div>
    </div>
  );
};

const MembershipConfirmationStep = ({ membership, user, contactInfo, gymConfig, onBack }) => {
  
  return (
    <div className="space-y-8">
      
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
            {membership?.paymentMethod === 'card' ? 'MEMBRESÍA ACTIVADA' : 'SOLICITUD REGISTRADA'}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
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
                {formatPrice(membership?.plan?.price || membership?.amount || 0)}
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

            {membership?.schedule && Object.keys(membership.schedule).length > 0 && (
              <div className="border-t pt-3">
                <span className="text-gray-600">Horarios programados:</span>
                <div className="mt-2 text-sm">
                  {Object.keys(membership.schedule).length} días configurados
                </div>
              </div>
            )}
          </div>
        </div>

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
                
                {contactInfo?.businessHours ? (
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 text-purple-500 mr-2" />
                    <span>Horario: {contactInfo.businessHours}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 text-purple-500 mr-2" />
                    <span>Horario: Lunes a Domingo 6:00 AM - 10:00 PM</span>
                  </div>
                )}
                
                <div className="flex items-center text-sm">
                  <Banknote className="w-4 h-4 text-purple-500 mr-2" />
                  <span>Monto: Q{formatPrice(membership?.plan?.price || 0)} en efectivo</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <p className="text-blue-800 font-medium mb-2">
          ¿Necesitas ayuda?
        </p>
        <div className="flex justify-center space-x-4 text-sm">
          {contactInfo?.supportEmail && (
            <span className="text-blue-600">
              {contactInfo.supportEmail}
            </span>
          )}
          {contactInfo?.supportPhone && (
            <span className="text-blue-600">
              {contactInfo.supportPhone}
            </span>
          )}
          {(!contactInfo?.supportEmail && !contactInfo?.supportPhone) && (
            <>
              <span className="text-blue-600">soporte@elitefitness.com</span>
              <span className="text-blue-600">2234-5678</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export {
  MembershipInfoStep,
  ScheduleSelectionStepScalable,
  ScheduleDayRowScalable,
  MembershipSummaryImproved,
  MembershipConfirmationStep
};