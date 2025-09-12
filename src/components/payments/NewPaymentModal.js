// src/components/payments/NewPaymentModal.js
// FUNCIÓN: Modal simple para crear nuevos pagos desde el dashboard
// USO: Se abre desde el botón "Nuevo Pago" del PaymentsManager

import React, { useState, useEffect } from 'react';
import {
  X,
  Bird,
  CheckCircle,
  Loader2,
  CreditCard,
  Banknote,
  Building,
  Smartphone,
  User,
  Calendar,
  FileText
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const NewPaymentModal = ({ isOpen, onClose, onSave }) => {
  const { formatCurrency } = useApp();
  const [loading, setLoading] = useState(false);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    paymentType: 'membership',
    paymentMethod: 'cash',
    amount: 0,
    description: '',
    notes: '',
    paymentDate: new Date().toISOString().split('T')[0],
    userId: '',
    membershipId: '',
    dailyPaymentCount: 1,
    anonymousClientInfo: {
      name: '',
      phone: '',
      email: ''
    }
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        paymentType: 'membership',
        paymentMethod: 'cash',
        amount: 0,
        description: '',
        notes: '',
        paymentDate: new Date().toISOString().split('T')[0],
        userId: '',
        membershipId: '',
        dailyPaymentCount: 1,
        anonymousClientInfo: {
          name: '',
          phone: '',
          email: ''
        }
      });
    }
  }, [isOpen]);

  // Opciones de configuración
  const paymentTypes = [
    { value: 'membership', label: 'Membresía', icon: CreditCard, description: 'Pago de cuota mensual o plan' },
    { value: 'daily', label: 'Pago Diario', icon: Calendar, description: 'Acceso por día individual' },
    { value: 'bulk_daily', label: 'Pago Múltiple', icon: FileText, description: 'Varios días consecutivos' },
    { value: 'product', label: 'Producto', icon: FileText, description: 'Venta de productos' },
    { value: 'service', label: 'Servicio', icon: User, description: 'Servicios adicionales' },
    { value: 'other', label: 'Otro', icon: FileText, description: 'Otros conceptos' }
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Efectivo', icon: Banknote, description: 'Pago en efectivo en recepción' },
    { value: 'card', label: 'Tarjeta', icon: CreditCard, description: 'Tarjeta de crédito/débito' },
    { value: 'transfer', label: 'Transferencia', icon: Building, description: 'Transferencia bancaria' },
    { value: 'mobile', label: 'Pago Móvil', icon: Smartphone, description: 'Aplicaciones de pago' }
  ];

  // Manejar cambios en el formulario
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAnonymousChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      anonymousClientInfo: {
        ...prev.anonymousClientInfo,
        [field]: value
      }
    }));
  };

  // Validar formulario
  const validateForm = () => {
    const errors = [];

    if (!formData.amount || formData.amount <= 0) {
      errors.push('El monto debe ser mayor a 0');
    }

    if (!formData.userId && !formData.anonymousClientInfo.name.trim()) {
      errors.push('Debe especificar un usuario o nombre del cliente');
    }

    if (formData.paymentType === 'membership' && !formData.membershipId && !formData.userId) {
      errors.push('Para pagos de membresía debe especificar el ID de membresía o usuario');
    }

    return errors;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar
    const errors = validateForm();
    if (errors.length > 0) {
      alert(`Errores en el formulario:\n${errors.join('\n')}`);
      return;
    }

    setLoading(true);
    
    try {
      // Simular guardado (aquí iría la llamada real al API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Notificar éxito
      if (onSave) {
        onSave({
          type: 'payment_created',
          data: formData
        });
      }
      
      // Cerrar modal
      onClose();
      
    } catch (error) {
      console.error('Error al crear pago:', error);
      alert('Error al crear el pago. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedType = paymentTypes.find(t => t.value === formData.paymentType);
  const selectedMethod = paymentMethods.find(m => m.value === formData.paymentMethod);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Bird className="w-6 h-6 mr-3 text-green-600" />
              Registrar Nuevo Pago
            </h3>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Registra pagos en quetzales guatemaltecos
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Contenido */}
          <div className="px-6 py-4 space-y-6">
            
            {/* Tipo de Pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Pago *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {paymentTypes.map(type => {
                  const IconComponent = type.icon;
                  return (
                    <label key={type.value} className="relative">
                      <input
                        type="radio"
                        value={type.value}
                        checked={formData.paymentType === type.value}
                        onChange={(e) => handleChange('paymentType', e.target.value)}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.paymentType === type.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                        <div className="flex items-center">
                          <IconComponent className={`w-5 h-5 mr-3 ${
                            formData.paymentType === type.value ? 'text-green-600' : 'text-gray-400'
                          }`} />
                          <div>
                            <div className={`font-medium ${
                              formData.paymentType === type.value ? 'text-green-900' : 'text-gray-900'
                            }`}>
                              {type.label}
                            </div>
                            <div className="text-xs text-gray-500">
                              {type.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Método de Pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Método de Pago *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {paymentMethods.map(method => {
                  const IconComponent = method.icon;
                  return (
                    <label key={method.value} className="relative">
                      <input
                        type="radio"
                        value={method.value}
                        checked={formData.paymentMethod === method.value}
                        onChange={(e) => handleChange('paymentMethod', e.target.value)}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.paymentMethod === method.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                        <div className="flex items-center">
                          <IconComponent className={`w-5 h-5 mr-3 ${
                            formData.paymentMethod === method.value ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <div>
                            <div className={`font-medium ${
                              formData.paymentMethod === method.value ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {method.label}
                            </div>
                            <div className="text-xs text-gray-500">
                              {method.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Monto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto en Quetzales (GTQ) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Bird className="h-4 w-4 text-green-500" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                {formData.amount > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency(formData.amount)}
                  </div>
                )}
              </div>
              
              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Pago *
                </label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => handleChange('paymentDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
            </div>

            {/* Información del usuario/membresía */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID de Usuario
                </label>
                <input
                  type="text"
                  value={formData.userId}
                  onChange={(e) => handleChange('userId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Dejar vacío para cliente anónimo"
                />
              </div>
              
              {formData.paymentType === 'membership' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID de Membresía
                  </label>
                  <input
                    type="text"
                    value={formData.membershipId}
                    onChange={(e) => handleChange('membershipId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="ID de la membresía (opcional)"
                  />
                </div>
              )}
            </div>

            {/* Para pagos múltiples */}
            {formData.paymentType === 'bulk_daily' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Días
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.dailyPaymentCount}
                    onChange={(e) => handleChange('dailyPaymentCount', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            )}

            {/* Cliente anónimo */}
            {!formData.userId && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-3">
                  Información del Cliente Anónimo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.anonymousClientInfo.name}
                      onChange={(e) => handleAnonymousChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nombre del cliente"
                      required={!formData.userId}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.anonymousClientInfo.phone}
                      onChange={(e) => handleAnonymousChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="+502 1234-5678"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.anonymousClientInfo.email}
                      onChange={(e) => handleAnonymousChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="email@ejemplo.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Descripción y notas */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del Pago
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Descripción breve del pago"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Adicionales
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Notas adicionales sobre el pago..."
                />
              </div>
            </div>

            {/* Resumen */}
            {formData.amount > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Resumen del Pago</h4>
                <div className="text-sm text-green-800 space-y-1">
                  <div>
                    <span className="font-medium">Tipo:</span> {selectedType?.label}
                  </div>
                  <div>
                    <span className="font-medium">Método:</span> {selectedMethod?.label}
                  </div>
                  <div>
                    <span className="font-medium">Monto:</span> 
                    <span className="text-lg font-bold ml-1 flex items-center inline">
                      <Bird className="w-4 h-4 mr-1" />
                      {formatCurrency(formData.amount)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Cliente:</span> {formData.userId || formData.anonymousClientInfo.name || 'Sin especificar'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={loading || !formData.amount}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Registrar Pago
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPaymentModal;