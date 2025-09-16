// src/pages/dashboard/components/PaymentsManager.js
// Author: Alexander Echeverria
// Componente principal para la gestión completa de pagos del sistema
// Maneja navegación entre tabs y orquesta todos los subcomponentes

// src/pages/dashboard/components/PaymentsManager.js
// Author: Alexander Echeverria
// Componente principal para la gestión completa de pagos del sistema
// MEJORADO: Integración completa garantizada con funciones de confirmar/cancelar pagos

import React, { useState } from 'react';
import { Coins, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';

// Importación de hooks personalizados
import usePaymentsData from './PaymentsManager/hooks/usePaymentsData';
import useCashMemberships from './PaymentsManager/hooks/useCashMemberships';
import useTransfers from './PaymentsManager/hooks/useTransfers';
import useStatistics from './PaymentsManager/hooks/useStatistics';

// Importación de componentes de tabs mejorados
import PaymentsTab from './PaymentsManager/components/PaymentsTab';
import CashTab from './PaymentsManager/components/CashTab';
import TransfersTab from './PaymentsManager/components/TransfersTab';
import SummaryTab from './PaymentsManager/components/SummaryTab';
import TabNavigation from './PaymentsManager/components/TabNavigation';

const PaymentsManager = ({ onSave, onUnsavedChanges }) => {
  const { user: currentUser, hasPermission } = useAuth();
  const { showSuccess, showError, formatDate, formatCurrency, isMobile } = useApp();
  
  // Estado principal de navegación
  const [activeTab, setActiveTab] = useState('payments');
  
  // Hooks personalizados para manejo de datos - ACTUALIZADO
  const paymentsData = usePaymentsData(onSave);
  const cashData = useCashMemberships(onSave);
  const transfersData = useTransfers(onSave);
  const statisticsData = useStatistics();
  
  // MEJORADO: Función para refrescar todos los datos con mejor logging
  const handleRefreshAll = async () => {
    try {
      console.log('🔄 PaymentsManager: Refrescando todos los datos...');
      
      await Promise.all([
        paymentsData.loadPayments(),
        cashData.loadPendingCashMemberships(),
        transfersData.loadPendingTransfers(),
        statisticsData.loadStatistics(),
        statisticsData.loadFinancialDashboard()
      ]);
      
      console.log('✅ PaymentsManager: Todos los datos actualizados');
      showSuccess('Datos actualizados correctamente');
      
    } catch (error) {
      console.error('❌ Error refrescando datos:', error);
      showError('Error al actualizar los datos');
    }
  };
  
  // MEJORADO: Renderizado del tab activo con verificación de props
  const renderActiveTab = () => {
    const commonProps = {
      formatCurrency,
      formatDate,
      showSuccess,
      showError,
      isMobile,
      onSave
    };
    
    switch (activeTab) {
      case 'payments':
        console.log('🔵 Renderizando PaymentsTab con props:', {
          paymentsCount: paymentsData.payments?.length || 0,
          hasConfirmFunction: !!paymentsData.handleConfirmPayment,
          hasCancelFunction: !!paymentsData.handleCancelPayment
        });
        
        return (
          <PaymentsTab 
            {...paymentsData} 
            {...commonProps} 
            // Props específicas para gestión de pagos pendientes
            handleConfirmPayment={paymentsData.handleConfirmPayment}
            handleCancelPayment={paymentsData.handleCancelPayment}
            isPaymentProcessing={paymentsData.isPaymentProcessing}
            getProcessingType={paymentsData.getProcessingType}
            getPendingPaymentsStats={paymentsData.getPendingPaymentsStats}
            processingIds={paymentsData.processingIds}
          />
        );
        
      case 'cash': 
        console.log('🟢 Renderizando CashTab con props:', {
          membershipsCount: cashData.pendingCashMemberships?.length || 0,
          hasActivateFunction: !!cashData.handleActivateCashMembership,
          hasCancelFunction: !!cashData.handleCancelCashMembership,
          processingCount: cashData.processingIds?.size || 0,
          cancellingCount: cashData.cancellingIds?.size || 0
        });
        
        return (
          <CashTab 
            {...cashData} 
            {...commonProps}
            // IMPORTANTES: Funciones principales siempre verificadas
            handleActivateCashMembership={cashData.handleActivateCashMembership}
            handleCancelCashMembership={cashData.handleCancelCashMembership}
            // Estados de procesamiento
            processingIds={cashData.processingIds}
            cancellingIds={cashData.cancellingIds}
            isMembershipProcessing={cashData.isMembershipProcessing}
            getProcessingType={cashData.getProcessingType}
            // Utilidades
            isCandidateForCancellation={cashData.isCandidateForCancellation}
            getCashMembershipPriority={cashData.getCashMembershipPriority}
            getCashMembershipPriorityConfig={cashData.getCashMembershipPriorityConfig}
          />
        );
        
      case 'transfers':
        console.log('🟣 Renderizando TransfersTab con props:', {
          transfersCount: transfersData.pendingTransfers?.length || 0,
          hasValidateFunction: !!transfersData.handleValidateTransfer,
          processingCount: transfersData.processingIds?.size || 0
        });
        
        return (
          <TransfersTab 
            {...transfersData} 
            {...commonProps}
            // Pasar todas las props necesarias para transferencias
            transferStats={transfersData.transferStats}
            searchTerm={transfersData.searchTerm}
            setSearchTerm={transfersData.setSearchTerm}
            transferViewMode={transfersData.transferViewMode}
            setTransferViewMode={transfersData.setTransferViewMode}
            transferSortBy={transfersData.transferSortBy}
            setTransferSortBy={transfersData.setTransferSortBy}
            transferPriorityFilter={transfersData.transferPriorityFilter}
            setTransferPriorityFilter={transfersData.setTransferPriorityFilter}
            getFilteredTransfers={transfersData.getFilteredTransfers}
            processingIds={transfersData.processingIds}
            isTransferProcessing={transfersData.isTransferProcessing}
            getProcessingType={transfersData.getProcessingType}
            handleValidateTransfer={transfersData.handleValidateTransfer}
          />
        );
        
      case 'summary':
        console.log('🟠 Renderizando SummaryTab');
        return <SummaryTab {...statisticsData} {...commonProps} />;
        
      default:
        console.log('🔵 Renderizando PaymentsTab por defecto');
        return (
          <PaymentsTab 
            {...paymentsData} 
            {...commonProps}
            handleConfirmPayment={paymentsData.handleConfirmPayment}
            handleCancelPayment={paymentsData.handleCancelPayment}
            isPaymentProcessing={paymentsData.isPaymentProcessing}
            getProcessingType={paymentsData.getProcessingType}
            getPendingPaymentsStats={paymentsData.getPendingPaymentsStats}
            processingIds={paymentsData.processingIds}
          />
        );
    }
  };

  // NUEVO: Función para debug de props disponibles
  const debugCurrentTabProps = () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const tabDebugInfo = {
      payments: {
        dataCount: paymentsData.payments?.length || 0,
        functions: {
          handleConfirmPayment: !!paymentsData.handleConfirmPayment,
          handleCancelPayment: !!paymentsData.handleCancelPayment,
          isPaymentProcessing: !!paymentsData.isPaymentProcessing
        }
      },
      cash: {
        dataCount: cashData.pendingCashMemberships?.length || 0,
        functions: {
          handleActivateCashMembership: !!cashData.handleActivateCashMembership,
          handleCancelCashMembership: !!cashData.handleCancelCashMembership,
          isMembershipProcessing: !!cashData.isMembershipProcessing
        },
        processing: {
          activating: cashData.processingIds?.size || 0,
          cancelling: cashData.cancellingIds?.size || 0
        }
      },
      transfers: {
        dataCount: transfersData.pendingTransfers?.length || 0,
        functions: {
          handleValidateTransfer: !!transfersData.handleValidateTransfer,
          isTransferProcessing: !!transfersData.isTransferProcessing
        }
      }
    };
    
    console.log('🔍 PaymentsManager Debug - Props por tab:', tabDebugInfo);
  };

  return (
    <div className="space-y-6">
      
      {/* Header principal del módulo */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Coins className="w-6 h-6 mr-2 text-green-600" />
            Gestión de Pagos
          </h3>
          <p className="text-gray-600 mt-1">
            Sistema completo de gestión financiera con información detallada y comprobantes
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          {/* NUEVO: Botón de debug solo en desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={debugCurrentTabProps}
              className="btn-outline btn-sm text-xs"
              title="Debug props del tab actual"
            >
              🔍 Debug
            </button>
          )}
          
          <button
            onClick={handleRefreshAll}
            disabled={paymentsData.loading || cashData.loading || transfersData.loading}
            className="btn-secondary btn-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${
              (paymentsData.loading || cashData.loading || transfersData.loading) ? 'animate-spin' : ''
            }`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Navegación por tabs */}
      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        counters={{
          totalPayments: paymentsData.totalPayments,
          pendingTransfers: transfersData.transferStats?.total || 0,
          criticalTransfers: transfersData.transferStats?.critical || 0,
          pendingCash: cashData.cashMembershipStats?.total || 0,
          urgentCash: cashData.cashMembershipStats?.old || 0
        }}
      />
      
      {/* MEJORADO: Estado de carga global */}
      {(paymentsData.loading || cashData.loading || transfersData.loading) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Cargando datos...</h4>
              <p className="text-xs text-blue-700">
                {paymentsData.loading && 'Historial de pagos, '}
                {cashData.loading && 'Membresías en efectivo, '}
                {transfersData.loading && 'Transferencias pendientes, '}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Contenido del tab activo */}
      {renderActiveTab()}
      
      {/* ACTUALIZADA: Información adicional sobre las mejoras */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">✓</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Sistema Completo con Gestión Activa de Pagos
            </h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Historial de Pagos:</strong> Confirma o cancela pagos pendientes directamente</p>
              <p>• <strong>Efectivo:</strong> Botones de "Confirmar" y "Anular" siempre visibles para gestión activa</p>
              <p>• <strong>Transferencias:</strong> Valida comprobantes con botones de "Aprobar" y "Rechazar"</p>
              <p>• <strong>Vista Unificada:</strong> Información expandible con detalles completos en todas las secciones</p>
              <p>• <strong>Tiempo Real:</strong> Indicadores de tiempo de espera y prioridades automáticas</p>
              <p>• <strong>Filtros Avanzados:</strong> Búsqueda y filtros en todas las pestañas</p>
              <p>• <strong>Estados Visuales:</strong> Colores y badges para identificar rápidamente el estado</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* NUEVO: Información de estado actual en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
          <div className="text-gray-600">
            <strong>Estado del Sistema:</strong> 
            Pagos: {paymentsData.payments?.length || 0}, 
            Efectivo: {cashData.pendingCashMemberships?.length || 0} 
            ({cashData.processingIds?.size || 0} procesando, {cashData.cancellingIds?.size || 0} cancelando), 
            Transferencias: {transfersData.pendingTransfers?.length || 0}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsManager;

// Este componente sirve como orquestador principal del sistema de pagos
// ACTUALIZADO: Ahora incluye integración completa con gestión de pagos pendientes
// Mantiene la navegación entre tabs y coordina todos los subcomponentes
// No maneja lógica de negocio directamente, delegando a hooks especializados
// Este componente sirve como orquestador principal del sistema de pagos
// Mantiene la navegación entre tabs y coordina todos los subcomponentes
// ACTUALIZADO: Ahora incluye integración completa con transferencias mejoradas

// Este componente sirve como orquestador principal del sistema de pagos
// Mantiene la navegación entre tabs y coordina todos los subcomponentes
// No maneja lógica de negocio directamente, delegando a hooks especializados