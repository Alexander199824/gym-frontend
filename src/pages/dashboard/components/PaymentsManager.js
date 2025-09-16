// src/pages/dashboard/components/PaymentsManager.js
// Author: Alexander Echeverria
// Componente principal para la gestión completa de pagos del sistema
// Maneja navegación entre tabs y orquesta todos los subcomponentes

// src/pages/dashboard/components/PaymentsManager.js
// Author: Alexander Echeverria
// Componente principal para la gestión completa de pagos del sistema
// Maneja navegación entre tabs y orquesta todos los subcomponentes

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
      
      {/* Estado de carga global */}
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