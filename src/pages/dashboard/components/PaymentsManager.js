// src/pages/dashboard/components/PaymentsManager.js
// Author: Alexander Echeverria
// Componente principal para la gestión completa de pagos del sistema
// Maneja navegación entre tabs y orquesta todos los subcomponentes

// src/pages/dashboard/components/PaymentsManager.js
// Author: Alexander Echeverria
// Componente principal para la gestión completa de pagos del sistema
// ACTUALIZADO: Ahora incluye soporte para modales profesionales de razones y confirmación

import React, { useState } from 'react';
import { Coins, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';

// Importación de hooks personalizados
import usePaymentsData from './PaymentsManager/hooks/usePaymentsData';
import useCashMemberships from './PaymentsManager/hooks/useCashMemberships';
import useTransfers from './PaymentsManager/hooks/useTransfers';
import useStatistics from './PaymentsManager/hooks/useStatistics';

// Importación de componentes de tabs
import PaymentsTab from './PaymentsManager/components/PaymentsTab';
import CashTab from './PaymentsManager/components/CashTab';
import TransfersTab from './PaymentsManager/components/TransfersTab';
import SummaryTab from './PaymentsManager/components/SummaryTab';
import TabNavigation from './PaymentsManager/components/TabNavigation';

// Importación de modales profesionales
import ReasonModal from './PaymentsManager/components/ReasonModal';
import ConfirmationModal from './PaymentsManager/components/ConfirmationModal';

const PaymentsManager = ({ onSave, onUnsavedChanges }) => {
  const { user: currentUser, hasPermission } = useAuth();
  const { showSuccess, showError, formatDate, formatCurrency, isMobile } = useApp();
  
  // Estado principal de navegación
  const [activeTab, setActiveTab] = useState('payments');
  
  // Hooks personalizados para manejo de datos
  const paymentsData = usePaymentsData(onSave);
  const cashData = useCashMemberships(onSave);
  const transfersData = useTransfers(onSave);
  const statisticsData = useStatistics();
  
  // Función para refrescar todos los datos
  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        paymentsData.loadPayments(),
        cashData.loadPendingCashMemberships(),
        transfersData.loadPendingTransfers(),
        statisticsData.loadStatistics(),
        statisticsData.loadFinancialDashboard()
      ]);
      
      showSuccess('Datos actualizados correctamente');
      
    } catch (error) {
      console.error('Error refrescando datos:', error);
      showError('Error al actualizar los datos');
    }
  };
  
  // Renderizado del tab activo
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
        
      case 'cash': 
        return (
          <CashTab 
            {...cashData} 
            {...commonProps}
            handleActivateCashMembership={cashData.handleActivateCashMembership}
            handleCancelCashMembership={cashData.handleCancelCashMembership}
            processingIds={cashData.processingIds}
            cancellingIds={cashData.cancellingIds}
            isMembershipProcessing={cashData.isMembershipProcessing}
            getProcessingType={cashData.getProcessingType}
            isCandidateForCancellation={cashData.isCandidateForCancellation}
            getCashMembershipPriority={cashData.getCashMembershipPriority}
            getCashMembershipPriorityConfig={cashData.getCashMembershipPriorityConfig}
          />
        );
        
      case 'transfers':
        return (
          <TransfersTab 
            {...transfersData} 
            {...commonProps}
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
        return <SummaryTab {...statisticsData} {...commonProps} />;
        
      default:
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

  // Determinar qué modal de razones mostrar basado en el tab activo
  const getCurrentReasonModal = () => {
    switch (activeTab) {
      case 'payments':
        return {
          isOpen: paymentsData.isModalOpen,
          config: paymentsData.modalConfig,
          onConfirm: paymentsData.handleModalConfirm,
          onClose: paymentsData.handleModalClose
        };
        
      case 'cash':
        return {
          isOpen: cashData.isModalOpen,
          config: cashData.modalConfig,
          onConfirm: cashData.handleModalConfirm,
          onClose: cashData.handleModalClose
        };
        
      case 'transfers':
        return {
          isOpen: transfersData.isModalOpen,
          config: transfersData.modalConfig,
          onConfirm: transfersData.handleModalConfirm,
          onClose: transfersData.handleModalClose
        };
        
      default:
        return {
          isOpen: false,
          config: {},
          onConfirm: () => {},
          onClose: () => {}
        };
    }
  };

  // Determinar qué modal de confirmación mostrar basado en el tab activo
  const getCurrentConfirmationModal = () => {
    switch (activeTab) {
      case 'payments':
        return {
          isOpen: paymentsData.isConfirmationOpen || false,
          config: paymentsData.confirmationConfig || {},
          isLoading: paymentsData.isConfirmationLoading || false,
          onConfirm: paymentsData.handleConfirmationConfirm || (() => {}),
          onClose: paymentsData.handleConfirmationClose || (() => {})
        };
        
      case 'cash':
        return {
          isOpen: cashData.isConfirmationOpen,
          config: cashData.confirmationConfig,
          isLoading: cashData.isConfirmationLoading,
          onConfirm: cashData.handleConfirmationConfirm,
          onClose: cashData.handleConfirmationClose
        };
        
      case 'transfers':
        return {
          isOpen: transfersData.isConfirmationOpen || false,
          config: transfersData.confirmationConfig || {},
          isLoading: transfersData.isConfirmationLoading || false,
          onConfirm: transfersData.handleConfirmationConfirm || (() => {}),
          onClose: transfersData.handleConfirmationClose || (() => {})
        };
        
      default:
        return {
          isOpen: false,
          config: {},
          isLoading: false,
          onConfirm: () => {},
          onClose: () => {}
        };
    }
  };

  const currentReasonModal = getCurrentReasonModal();
  const currentConfirmationModal = getCurrentConfirmationModal();

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Header principal del módulo */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
            <Coins className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-green-600 flex-shrink-0" />
            <span className="leading-tight">Gestión de Pagos</span>
          </h3>
          <p className="text-sm sm:text-base text-gray-600 leading-tight">
            Sistema completo de gestión financiera con modales profesionales
          </p>
        </div>
        
        {/* Botón de actualizar */}
        <div className="flex justify-center sm:justify-end">
          <button
            onClick={handleRefreshAll}
            disabled={paymentsData.loading || cashData.loading || transfersData.loading}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${
              (paymentsData.loading || cashData.loading || transfersData.loading) ? 'animate-spin' : ''
            }`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Navegación por tabs */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
      </div>
      
      {/* Estado de carga global */}
      {(paymentsData.loading || cashData.loading || transfersData.loading) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-blue-900">Cargando datos...</h4>
              <div className="text-xs text-blue-700 space-y-1 sm:space-y-0">
                {paymentsData.loading && (
                  <div>• Historial de pagos</div>
                )}
                {cashData.loading && (
                  <div>• Membresías en efectivo</div>
                )}
                {transfersData.loading && (
                  <div>• Transferencias pendientes</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Contenido del tab activo */}
      <div className="min-h-0">
        {renderActiveTab()}
      </div>

      {/* MODAL DE RAZONES - SE RENDERIZA SEGÚN EL TAB ACTIVO */}
      <ReasonModal 
        isOpen={currentReasonModal.isOpen}
        onClose={currentReasonModal.onClose}
        onConfirm={currentReasonModal.onConfirm}
        {...currentReasonModal.config}
      />

      {/* MODAL DE CONFIRMACIÓN PROFESIONAL - NUEVO */}
      <ConfirmationModal 
        isOpen={currentConfirmationModal.isOpen}
        onClose={currentConfirmationModal.onClose}
        onConfirm={currentConfirmationModal.onConfirm}
        isLoading={currentConfirmationModal.isLoading}
        {...currentConfirmationModal.config}
      />
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