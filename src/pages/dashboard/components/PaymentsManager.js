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
  const paymentsData = usePaymentsData();
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
      isMobile
    };
    
    switch (activeTab) {
      case 'payments':
        return <PaymentsTab {...paymentsData} {...commonProps} onSave={onSave} />;
      case 'cash': 
        return <CashTab {...cashData} {...commonProps} onSave={onSave} />;
      case 'transfers':
        return <TransfersTab {...transfersData} {...commonProps} onSave={onSave} />;
      case 'summary':
        return <SummaryTab {...statisticsData} {...commonProps} />;
      default:
        return <PaymentsTab {...paymentsData} {...commonProps} onSave={onSave} />;
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
            Sistema completo de gestión financiera en quetzales guatemaltecos
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <button
            onClick={handleRefreshAll}
            disabled={paymentsData.loading}
            className="btn-secondary btn-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${paymentsData.loading ? 'animate-spin' : ''}`} />
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
          pendingTransfers: transfersData.pendingTransfers?.length || 0,
          pendingCash: cashData.cashMembershipStats?.total || 0,
          urgentCash: cashData.cashMembershipStats?.urgent || 0
        }}
      />
      
      {/* Contenido del tab activo */}
      {renderActiveTab()}
    </div>
  );
};

export default PaymentsManager;

// Este componente sirve como orquestador principal del sistema de pagos
// Mantiene la navegación entre tabs y coordina todos los subcomponentes
// No maneja lógica de negocio directamente, delegando a hooks especializados