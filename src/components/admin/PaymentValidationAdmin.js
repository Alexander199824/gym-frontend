// src/components/admin/PaymentValidationAdmin.js
// Autor: Alexander Echeverria
// Panel de administración para validar pagos pendientes (transferencias y efectivo)

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Upload,
  DollarSign,
  CreditCard,
  User,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Filter,
  Search,
  FileText,
  MapPin,
  Phone,
  Mail,
  Bird,
  Shield,
  Loader2
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

const PaymentValidationAdmin = () => {
  const { showSuccess, showError, showInfo, formatDate, formatCurrency } = useApp();
  const queryClient = useQueryClient();
  
  // Estados locales
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'transfer', 'cash', 'pending', 'completed'
  const [searchTerm, setSearchTerm] = useState('');
  const [showProofModal, setShowProofModal] = useState(false);
  
  // Query para obtener pagos pendientes
  const { data: pendingPayments, isLoading, refetch } = useQuery({
    queryKey: ['pendingPayments', filter],
    queryFn: () => apiService.get('/api/admin/payments/pending', {
      params: { 
        filter,
        search: searchTerm || undefined
      }
    }),
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 30 * 1000, // Actualizar cada 30 segundos
    onError: (error) => showError('Error cargando pagos pendientes')
  });

  // Mutación para validar pago
  const validatePaymentMutation = useMutation({
    mutationFn: ({ paymentId, action, notes }) => 
      apiService.post(`/api/admin/payments/${paymentId}/validate`, {
        action, // 'approve' o 'reject'
        validationNotes: notes
      }),
    onSuccess: (data, { action }) => {
      showSuccess(`Pago ${action === 'approve' ? 'aprobado' : 'rechazado'} exitosamente`);
      queryClient.invalidateQueries(['pendingPayments']);
      setSelectedPayment(null);
    },
    onError: (error) => {
      showError('Error al validar el pago: ' + (error.response?.data?.message || error.message));
    }
  });

  // Mutación para confirmar pago en efectivo
  const confirmCashPaymentMutation = useMutation({
    mutationFn: ({ paymentId, notes }) => 
      apiService.post(`/api/admin/payments/${paymentId}/confirm-cash`, {
        confirmationNotes: notes
      }),
    onSuccess: () => {
      showSuccess('Pago en efectivo confirmado exitosamente');
      queryClient.invalidateQueries(['pendingPayments']);
      setSelectedPayment(null);
    },
    onError: (error) => {
      showError('Error confirmando pago en efectivo: ' + (error.response?.data?.message || error.message));
    }
  });

  // Filtrar pagos
  const filteredPayments = pendingPayments?.data?.payments?.filter(payment => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        payment.user?.firstName?.toLowerCase().includes(searchLower) ||
        payment.user?.lastName?.toLowerCase().includes(searchLower) ||
        payment.user?.email?.toLowerCase().includes(searchLower) ||
        payment.id?.toString().includes(searchLower) ||
        payment.membership?.plan?.name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  const handleValidatePayment = (paymentId, action, notes = '') => {
    if (!notes && action === 'reject') {
      showError('Debes proporcionar un motivo para rechazar el pago');
      return;
    }
    
    validatePaymentMutation.mutate({ paymentId, action, notes });
  };

  const handleConfirmCashPayment = (paymentId, notes = '') => {
    confirmCashPaymentMutation.mutate({ paymentId, notes });
  };

  const getPaymentMethodInfo = (method) => {
    switch (method) {
      case 'transfer':
        return {
          label: 'Transferencia Bancaria',
          icon: Upload,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        };
      case 'cash':
        return {
          label: 'Efectivo en Gimnasio',
          icon: DollarSign,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50'
        };
      default:
        return {
          label: 'Método Desconocido',
          icon: CreditCard,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50'
        };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Validación de Pagos</h2>
          <p className="text-gray-600">Valida transferencias bancarias y confirma pagos en efectivo</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="btn-outline btn-sm flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{filteredPayments.length} pagos pendientes</span>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por cliente, email o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por método */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
            >
              <option value="all">Todos los métodos</option>
              <option value="transfer">Solo transferencias</option>
              <option value="cash">Solo efectivo</option>
              <option value="pending">Solo pendientes</option>
              <option value="completed">Solo completados</option>
            </select>
          </div>

          {/* Estadísticas rápidas */}
          <div className="flex items-center justify-end space-x-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-blue-600">
                {filteredPayments.filter(p => p.paymentMethod === 'transfer').length}
              </div>
              <div className="text-gray-600">Transferencias</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-600">
                {filteredPayments.filter(p => p.paymentMethod === 'cash').length}
              </div>
              <div className="text-gray-600">Efectivo</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de pagos pendientes */}
      <div className="bg-white rounded-lg shadow-sm">
        
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando pagos pendientes...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay pagos pendientes
            </h3>
            <p className="text-gray-600">
              Todos los pagos han sido procesados correctamente.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPayments.map((payment) => (
              <PaymentItem
                key={payment.id}
                payment={payment}
                onSelect={setSelectedPayment}
                onValidate={handleValidatePayment}
                onConfirmCash={handleConfirmCashPayment}
                isProcessing={validatePaymentMutation.isLoading || confirmCashPaymentMutation.isLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalles del pago */}
      {selectedPayment && (
        <PaymentDetailsModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onValidate={handleValidatePayment}
          onConfirmCash={handleConfirmCashPayment}
          isProcessing={validatePaymentMutation.isLoading || confirmCashPaymentMutation.isLoading}
        />
      )}
    </div>
  );
};

// Componente para cada item de pago
const PaymentItem = ({ payment, onSelect, onValidate, onConfirmCash, isProcessing }) => {
  const { formatDate, formatCurrency } = useApp();
  
  const methodInfo = payment.paymentMethod === 'transfer' ? {
    label: 'Transferencia',
    icon: Upload,
    color: 'text-blue-600'
  } : {
    label: 'Efectivo',
    icon: DollarSign,
    color: 'text-purple-600'
  };

  const MethodIcon = methodInfo.icon;

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        
        {/* Información principal */}
        <div className="flex items-center space-x-4">
          
          {/* Icono del método */}
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
            <MethodIcon className={`w-6 h-6 ${methodInfo.color}`} />
          </div>
          
          {/* Detalles */}
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">
                {payment.user?.firstName} {payment.user?.lastName}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {payment.status === 'pending' ? 'Pendiente' :
                 payment.status === 'completed' ? 'Completado' : 'Fallido'}
              </span>
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <div>Plan: {payment.membership?.plan?.name || 'No especificado'}</div>
              <div>Email: {payment.user?.email}</div>
              <div>Fecha: {formatDate(payment.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Monto y acciones */}
        <div className="text-right">
          <div className="flex items-center text-2xl font-bold text-primary-600 mb-2">
            <Bird className="w-5 h-5 mr-1" />
            {formatCurrency(payment.amount)}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onSelect(payment)}
              className="btn-outline btn-sm flex items-center"
            >
              <Eye className="w-4 h-4 mr-1" />
              Ver detalles
            </button>
            
            {payment.status === 'pending' && (
              <>
                {payment.paymentMethod === 'transfer' ? (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => onValidate(payment.id, 'approve')}
                      disabled={isProcessing}
                      className="btn-success btn-sm flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => onValidate(payment.id, 'reject', 'Transferencia no válida')}
                      disabled={isProcessing}
                      className="btn-danger btn-sm flex items-center"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rechazar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onConfirmCash(payment.id)}
                    disabled={isProcessing}
                    className="btn-success btn-sm flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Confirmar pago
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal de detalles del pago
const PaymentDetailsModal = ({ payment, onClose, onValidate, onConfirmCash, isProcessing }) => {
  const { formatDate, formatCurrency } = useApp();
  const [notes, setNotes] = useState('');
  const [showProof, setShowProof] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Detalles del Pago #{payment.id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          
          {/* Información del cliente */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Información del Cliente
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Nombre:</span> {payment.user?.firstName} {payment.user?.lastName}
              </div>
              <div>
                <span className="font-medium">Email:</span> {payment.user?.email}
              </div>
              <div>
                <span className="font-medium">Teléfono:</span> {payment.user?.phone || 'No registrado'}
              </div>
              <div>
                <span className="font-medium">ID Usuario:</span> {payment.user?.id}
              </div>
            </div>
          </div>

          {/* Información del pago */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Detalles del Pago
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Método:</span> {
                  payment.paymentMethod === 'transfer' ? 'Transferencia Bancaria' : 'Efectivo en Gimnasio'
                }
              </div>
              <div>
                <span className="font-medium">Monto:</span> 
                <span className="text-lg font-bold text-primary-600 ml-1">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
              <div>
                <span className="font-medium">Estado:</span> 
                <span className={`ml-1 px-2 py-1 rounded text-xs ${
                  payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {payment.status === 'pending' ? 'Pendiente' :
                   payment.status === 'completed' ? 'Completado' : 'Fallido'}
                </span>
              </div>
              <div>
                <span className="font-medium">Fecha:</span> {formatDate(payment.createdAt)}
              </div>
            </div>
          </div>

          {/* Información de la membresía */}
          {payment.membership && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Crown className="w-5 h-5 mr-2" />
                Membresía
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Plan:</span> {payment.membership.plan?.name}
                </div>
                <div>
                  <span className="font-medium">Duración:</span> {payment.membership.plan?.durationType}
                </div>
                <div>
                  <span className="font-medium">ID Membresía:</span> {payment.membership.id}
                </div>
                <div>
                  <span className="font-medium">Estado:</span> {payment.membership.status}
                </div>
              </div>
            </div>
          )}

          {/* Comprobante de transferencia */}
          {payment.paymentMethod === 'transfer' && payment.transferProofUrl && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Comprobante de Transferencia
              </h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowProof(!showProof)}
                  className="btn-outline btn-sm flex items-center"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {showProof ? 'Ocultar' : 'Ver'} Comprobante
                </button>
                <a
                  href={payment.transferProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline btn-sm flex items-center"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Descargar
                </a>
              </div>
              
              {showProof && (
                <div className="mt-4">
                  <img
                    src={payment.transferProofUrl}
                    alt="Comprobante de transferencia"
                    className="max-w-full h-auto rounded-lg border"
                  />
                </div>
              )}
            </div>
          )}

          {/* Notas de validación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas de validación (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agregar comentarios sobre la validación..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
            />
          </div>
        </div>

        {/* Footer con acciones */}
        {payment.status === 'pending' && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cerrar
            </button>
            
            {payment.paymentMethod === 'transfer' ? (
              <>
                <button
                  onClick={() => {
                    onValidate(payment.id, 'reject', notes || 'Transferencia rechazada');
                    onClose();
                  }}
                  disabled={isProcessing}
                  className="btn-danger flex items-center"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Rechazar Transferencia
                </button>
                <button
                  onClick={() => {
                    onValidate(payment.id, 'approve', notes);
                    onClose();
                  }}
                  disabled={isProcessing}
                  className="btn-success flex items-center"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Aprobar Transferencia
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onConfirmCash(payment.id, notes);
                  onClose();
                }}
                disabled={isProcessing}
                className="btn-success flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Confirmar Pago en Efectivo
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentValidationAdmin;

/*
=== PANEL DE ADMINISTRACIÓN PARA VALIDACIÓN DE PAGOS ===

FUNCIONALIDADES PRINCIPALES:
- Listado de pagos pendientes de validación
- Validación de transferencias bancarias (aprobar/rechazar)
- Confirmación de pagos en efectivo en gimnasio
- Visualización de comprobantes de transferencia
- Búsqueda y filtrado avanzado
- Actualización en tiempo real

TIPOS DE PAGOS GESTIONADOS:
1. TRANSFERENCIAS BANCARIAS:
   - Ver comprobante subido por el cliente
   - Aprobar o rechazar con notas
   - Activación automática de membresía al aprobar

2. EFECTIVO EN GIMNASIO:
   - Confirmar recepción de pago físico
   - Activación inmediata al confirmar
   - Registro de colaborador que confirma

CARACTERÍSTICAS DE LA INTERFAZ:
- Vista de lista con información esencial
- Modal detallado para cada pago
- Filtros por método y estado
- Búsqueda por cliente o ID
- Estadísticas en tiempo real
- Acciones rápidas desde la lista

FLUJO DE VALIDACIÓN:
1. Cliente realiza pago (transferencia/efectivo)
2. Pago aparece como "pendiente" en panel admin
3. Administrador revisa detalles y comprobantes
4. Toma acción (aprobar/rechazar/confirmar)
5. Sistema actualiza estado y activa membresía
6. Cliente recibe notificación automática

ENDPOINTS UTILIZADOS:
- GET /api/admin/payments/pending: Obtener pagos pendientes
- POST /api/admin/payments/:id/validate: Validar transferencia
- POST /api/admin/payments/:id/confirm-cash: Confirmar efectivo

ESTADOS DE PAGO:
- 'pending': Esperando validación
- 'completed': Validado y membresía activada
- 'failed': Rechazado por administrador

SEGURIDAD:
- Solo accesible por administradores
- Registro de quién valida cada pago
- Notas obligatorias para rechazos
- Auditoría completa de acciones

NOTIFICACIONES:
- Email automático al cliente tras validación
- Actualización de estado en dashboard cliente
- Alertas de pagos pendientes para admin

USO EN PRODUCCIÓN:
- Revisión diaria de transferencias
- Confirmación inmediata de pagos en efectivo
- Seguimiento de ingresos por validar
- Gestión de casos problemáticos
*/