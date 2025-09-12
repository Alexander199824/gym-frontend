// Autor: Alexander Echeverria
// src/components/payments/PaymentConfirmationModal.js
// FUNCIÓN: Modal de confirmación profesional para acciones de pago
// USO: Confirmaciones de transferencias y activaciones de membresías

import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle,
  Building,
  Banknote,
  User,
  Bird,
  Calendar,
  Clock,
  Phone,
  Mail,
  CreditCard,
  FileText,
  ExternalLink,
  Loader2,
  Check,
  XCircle,
  Info
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const PaymentConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  type = 'transfer', // 'transfer' | 'cash_membership' | 'payment'
  action = 'approve', // 'approve' | 'reject' | 'activate'
  data = {},
  loading = false
}) => {
  const { formatDate, formatCurrency, isMobile } = useApp();
  const [notes, setNotes] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');

  // Razones predefinidas para rechazo de transferencias
  const rejectionReasons = [
    'Comprobante no válido',
    'Monto incorrecto',
    'Datos del titular no coinciden',
    'Comprobante ilegible',
    'Transferencia duplicada',
    'Cuenta bancaria no autorizada',
    'Fecha de transferencia incorrecta',
    'Otro motivo (especificar)'
  ];

  // Reset estados al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setNotes('');
      setCustomReason('');
      setSelectedReason('');
    }
  }, [isOpen]);

  // Obtener configuración según el tipo y acción
  const getModalConfig = () => {
    if (type === 'transfer') {
      if (action === 'approve') {
        return {
          title: 'Aprobar Transferencia',
          icon: CheckCircle,
          iconColor: 'text-green-600',
          confirmText: 'Aprobar Transferencia',
          confirmClass: 'btn-success',
          description: 'Esta acción aprobará la transferencia y activará automáticamente la membresía asociada.',
          warningText: '⚠️ Esta acción no se puede deshacer'
        };
      } else {
        return {
          title: 'Rechazar Transferencia',
          icon: XCircle,
          iconColor: 'text-red-600',
          confirmText: 'Rechazar Transferencia',
          confirmClass: 'btn-danger',
          description: 'Esta acción rechazará la transferencia y cancelará la membresía asociada.',
          warningText: '⚠️ El cliente deberá realizar un nuevo pago'
        };
      }
    } else if (type === 'cash_membership') {
      return {
        title: 'Activar Membresía en Efectivo',
        icon: Banknote,
        iconColor: 'text-green-600',
        confirmText: 'Confirmar Pago Recibido',
        confirmClass: 'btn-success',
        description: 'Confirma que recibiste el pago en efectivo y activa la membresía inmediatamente.',
        warningText: '✅ El cliente podrá acceder al gimnasio de inmediato'
      };
    }
    
    return {
      title: 'Confirmar Acción',
      icon: Info,
      iconColor: 'text-blue-600',
      confirmText: 'Confirmar',
      confirmClass: 'btn-primary',
      description: 'Por favor confirma que deseas realizar esta acción.',
      warningText: ''
    };
  };

  const handleConfirm = () => {
    let finalNotes = notes;
    
    // Para rechazos de transferencia, incluir la razón
    if (type === 'transfer' && action === 'reject') {
      finalNotes = selectedReason === 'Otro motivo (especificar)' 
        ? customReason 
        : selectedReason;
        
      if (!finalNotes.trim()) {
        return; // No confirmar sin razón
      }
    }
    
    onConfirm(finalNotes.trim() || undefined);
  };

  const config = getModalConfig();
  const ConfigIcon = config.icon;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className={`bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto ${
        isMobile ? 'mx-2' : ''
      }`}>
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ConfigIcon className={`w-6 h-6 mr-3 ${config.iconColor}`} />
              <h3 className="text-lg font-semibold text-gray-900">
                {config.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="px-6 py-4">
          
          {/* DESCRIPCIÓN */}
          <div className="mb-6">
            <p className="text-gray-700 mb-2">{config.description}</p>
            {config.warningText && (
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {config.warningText}
              </p>
            )}
          </div>

          {/* INFORMACIÓN DEL CLIENTE/PAGO */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              {type === 'transfer' ? 'Detalles de la Transferencia' : 'Detalles de la Membresía'}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Cliente */}
              <div>
                <div className="text-xs text-gray-500 mb-1">Cliente</div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                    <span className="text-sm font-medium text-gray-700">
                      {data.user?.name ? 
                        `${data.user.name[0]}${data.user.name.split(' ')[1]?.[0] || ''}` :
                        'A'
                      }
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {data.user?.name || 'Cliente Anónimo'}
                    </div>
                    {data.user?.email && (
                      <div className="text-xs text-gray-500 flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {data.user.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Monto */}
              <div>
                <div className="text-xs text-gray-500 mb-1">Monto</div>
                <div className="text-xl font-bold text-green-600 flex items-center">
                  <Bird className="w-5 h-5 mr-1" />
                  {formatCurrency(data.amount || data.price || 0)}
                </div>
              </div>

              {/* Fecha */}
              <div>
                <div className="text-xs text-gray-500 mb-1">
                  {type === 'transfer' ? 'Fecha de transferencia' : 'Fecha de creación'}
                </div>
                <div className="text-sm text-gray-700 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(data.paymentDate || data.createdAt, 'dd/MM/yyyy HH:mm')}
                </div>
              </div>

              {/* Tiempo de espera */}
              {data.hoursWaiting && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Tiempo de espera</div>
                  <div className="text-sm text-gray-700 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {data.hoursWaiting.toFixed(1)} horas
                  </div>
                </div>
              )}

              {/* Plan (para membresías) */}
              {data.plan && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Plan seleccionado</div>
                  <div className="text-sm text-gray-700 flex items-center">
                    <CreditCard className="w-4 h-4 mr-1" />
                    {data.plan.name}
                  </div>
                </div>
              )}

              {/* Tipo de membresía (para transferencias) */}
              {data.membership && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Membresía</div>
                  <div className="text-sm text-gray-700 flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {data.membership.type}
                  </div>
                </div>
              )}
            </div>

            {/* Comprobante de transferencia */}
            {type === 'transfer' && data.transferProof && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2">Comprobante de transferencia</div>
                <div className="flex items-center space-x-3">
                  <img
                    src={data.transferProof}
                    alt="Comprobante"
                    className="w-16 h-16 object-cover rounded border cursor-pointer"
                    onClick={() => window.open(data.transferProof, '_blank')}
                  />
                  <button
                    onClick={() => window.open(data.transferProof, '_blank')}
                    className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Ver comprobante completo
                  </button>
                </div>
              </div>
            )}

            {/* Horarios reservados (para membresías) */}
            {type === 'cash_membership' && data.schedule && Object.keys(data.schedule).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2">Horarios reservados</div>
                <div className="bg-blue-50 rounded p-2">
                  <div className="text-xs space-y-1">
                    {Object.entries(data.schedule).slice(0, 3).map(([day, slots]) => (
                      <div key={day}>
                        <span className="font-medium text-blue-900 capitalize">
                          {day.substring(0, 3)}:
                        </span>{' '}
                        <span className="text-blue-700">
                          {slots.map(slot => slot.timeRange).join(', ')}
                        </span>
                      </div>
                    ))}
                    {Object.keys(data.schedule).length > 3 && (
                      <div className="text-blue-600">
                        +{Object.keys(data.schedule).length - 3} días más...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RAZÓN DE RECHAZO (solo para rechazos de transferencia) */}
          {type === 'transfer' && action === 'reject' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Razón del rechazo *
              </label>
              
              <div className="space-y-2 mb-3">
                {rejectionReasons.map((reason) => (
                  <label key={reason} className="flex items-center">
                    <input
                      type="radio"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="mr-2 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">{reason}</span>
                  </label>
                ))}
              </div>

              {/* Campo de texto personalizado */}
              {selectedReason === 'Otro motivo (especificar)' && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Especifica la razón del rechazo..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                  required
                />
              )}
            </div>
          )}

          {/* NOTAS ADICIONALES */}
          {(type !== 'transfer' || action !== 'reject') && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas adicionales (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  type === 'transfer' 
                    ? 'Ej: Comprobante verificado correctamente, monto coincide...'
                    : 'Ej: Cliente llegó puntualmente, pago recibido en efectivo...'
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              />
            </div>
          )}

          {/* ADVERTENCIA FINAL */}
          {type === 'transfer' && action === 'approve' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-green-900 mb-1">
                    Al aprobar esta transferencia:
                  </div>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Se registrará el pago como completado</li>
                    <li>• La membresía se activará automáticamente</li>
                    <li>• El cliente podrá acceder al gimnasio</li>
                    <li>• Se enviará notificación de confirmación</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {type === 'transfer' && action === 'reject' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-red-900 mb-1">
                    Al rechazar esta transferencia:
                  </div>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• La membresía será cancelada</li>
                    <li>• El cliente deberá realizar un nuevo pago</li>
                    <li>• Se enviará notificación con la razón del rechazo</li>
                    <li>• Esta acción quedará registrada en el historial</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {type === 'cash_membership' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-blue-900 mb-1">
                    Al confirmar el pago en efectivo:
                  </div>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Se registrará el pago de {formatCurrency(data.price || 0)}</li>
                    <li>• La membresía se activará inmediatamente</li>
                    <li>• Los horarios seleccionados quedarán reservados</li>
                    <li>• El cliente podrá comenzar a entrenar hoy</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleConfirm}
              disabled={
                loading || 
                (type === 'transfer' && action === 'reject' && (
                  !selectedReason || 
                  (selectedReason === 'Otro motivo (especificar)' && !customReason.trim())
                ))
              }
              className={`${config.confirmClass} flex items-center`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  {type === 'transfer' && action === 'approve' && <Check className="w-4 h-4 mr-2" />}
                  {type === 'transfer' && action === 'reject' && <XCircle className="w-4 h-4 mr-2" />}
                  {type === 'cash_membership' && <CheckCircle className="w-4 h-4 mr-2" />}
                  {config.confirmText}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de utilidad para mostrar confirmaciones simples
export const SimpleConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  message = '¿Estás seguro de que deseas realizar esta acción?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'info', // 'info' | 'warning' | 'danger' | 'success'
  loading = false
}) => {
  const typeConfig = {
    info: { icon: Info, color: 'text-blue-600', buttonClass: 'btn-primary' },
    warning: { icon: AlertTriangle, color: 'text-yellow-600', buttonClass: 'btn-warning' },
    danger: { icon: XCircle, color: 'text-red-600', buttonClass: 'btn-danger' },
    success: { icon: CheckCircle, color: 'text-green-600', buttonClass: 'btn-success' }
  };

  const config = typeConfig[type];
  const IconComponent = config.icon;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        
        <div className="p-6">
          <div className="flex items-center mb-4">
            <IconComponent className={`w-6 h-6 mr-3 ${config.color}`} />
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>
          
          <p className="text-gray-700 mb-6">
            {message}
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              {cancelText}
            </button>
            
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`${config.buttonClass} flex items-center`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmationModal;

/*
DOCUMENTACIÓN DEL COMPONENTE PaymentConfirmationModal

PROPÓSITO:
Modal profesional y completo para confirmación de acciones críticas en el sistema de pagos.
Diseñado para reemplazar los alerts simples del navegador con una interfaz más rica,
informativa y segura para validaciones de transferencias y activaciones de membresías.

FUNCIONALIDADES PRINCIPALES:

TIPOS DE CONFIRMACIÓN SOPORTADOS:
1. Aprobar transferencia bancaria:
   - Muestra detalles completos de la transferencia
   - Preview del comprobante bancario
   - Lista de consecuencias de la aprobación
   - Campo opcional para notas del validador

2. Rechazar transferencia bancaria:
   - Lista de razones predefinidas para rechazo
   - Campo personalizado para "otro motivo"
   - Advertencias sobre las consecuencias
   - Validación obligatoria de razón

3. Activar membresía en efectivo:
   - Detalles del plan y monto a cobrar
   - Información de horarios reservados
   - Confirmación visual del monto exacto
   - Lista de acciones que se ejecutarán

INFORMACIÓN MOSTRADA:
- Avatar y datos del cliente
- Monto destacado en quetzales con icono de quetzal
- Fechas formateadas localmente
- Tiempo de espera calculado
- Detalles del plan o membresía
- Preview de comprobantes (cuando aplique)
- Horarios reservados (para membresías)

VALIDACIONES IMPLEMENTADAS:
- Razón obligatoria para rechazos
- Validación de campos personalizados
- Prevención de acciones duplicadas
- Estados de carga durante procesamiento

CARACTERÍSTICAS DE UX:

DISEÑO PROFESIONAL:
- Modal centrado con overlay oscuro
- Iconografía consistente por tipo de acción
- Colores semánticos (verde=aprobar, rojo=rechazar)
- Secciones bien organizadas con separadores
- Typography jerarquizada

INFORMACIÓN CONTEXTUAL:
- Tarjetas informativas con consecuencias de cada acción
- Advertencias claras sobre irreversibilidad
- Códigos de color por urgencia o tipo
- Feedback visual inmediato

RESPONSIVE DESIGN:
- Adaptable a móvil y escritorio
- Scroll interno para contenido largo
- Botones accesibles en pantallas pequeñas
- Márgenes apropiados para tablets

PROPS PRINCIPALES:
- isOpen: Control de visibilidad
- onClose: Función de cancelación
- onConfirm: Función de confirmación con parámetros
- type: 'transfer' | 'cash_membership' | 'payment'
- action: 'approve' | 'reject' | 'activate'
- data: Objeto con información del pago/membresía
- loading: Estado de procesamiento

CONEXIONES CON OTROS ARCHIVOS:

CONTEXTS UTILIZADOS:
- AppContext: Para formateo de fechas y montos

INTEGRACIÓN:
- Se usa desde PaymentsManager
- Se usa desde TransferValidationView
- Se usa desde CashMembershipManager
- Compatible con hook usePayments

COMPONENTE ADICIONAL:
SimpleConfirmationModal - Para confirmaciones básicas:
- Menor complejidad visual
- Ideal para acciones simples
- Tipos: info, warning, danger, success
- Props minimalistas

CASOS DE USO REALES:

VALIDACIÓN DE TRANSFERENCIAS:
1. Staff ve transferencia pendiente
2. Hace clic en "Aprobar" o "Rechazar"
3. Se abre modal con información completa
4. Para aprobar: puede agregar notas opcionales
5. Para rechazar: debe seleccionar razón obligatoria
6. Confirma acción después de revisar consecuencias
7. Modal se cierra y acción se ejecuta

ACTIVACIÓN DE MEMBRESÍAS:
1. Cliente llega a recepción a pagar efectivo
2. Staff busca membresía pendiente
3. Hace clic en "Recibir [Monto]"
4. Modal muestra detalles completos del pago
5. Confirma monto exacto y plan
6. Verifica horarios seleccionados por cliente
7. Confirma recepción del efectivo
8. Membresía se activa inmediatamente

BENEFICIOS OPERATIVOS:

REDUCCIÓN DE ERRORES:
- Información completa antes de confirmar
- Validaciones obligatorias
- Consecuencias claramente explicadas
- Prevención de acciones accidentales

EXPERIENCIA PROFESIONAL:
- Interfaz moderna y confiable
- Reemplaza alerts básicos del navegador
- Información rica y contextual
- Estados de carga claros

AUDITORÍA Y TRAZABILIDAD:
- Notas opcionales para documentar decisiones
- Razones obligatorias para rechazos
- Registro de quien realizó cada acción
- Timestamps automáticos

ADAPTABILIDAD:
- Fácil extensión para nuevos tipos
- Reutilizable en otros módulos
- Configuración flexible por props
- Mantenimiento centralizado

Este modal es crucial para la operación diaria del gimnasio,
ya que maneja decisiones financieras importantes que afectan
directamente a los clientes y los ingresos del negocio.
La interfaz profesional genera confianza en el staff y
reduce significativamente los errores operativos.
*/