// src/pages/dashboard/components/PaymentsManager.js
// Author: Alexander Echeverria
// Componente principal para la gestión completa de pagos del sistema
// Maneja navegación entre tabs y orquesta todos los subcomponentes

// src/pages/dashboard/components/PaymentsManager.js
// Author: Alexander Echeverria
// Componente principal para la gestión completa de pagos del sistema
// ACTUALIZADO: Incluye nuevas funcionalidades y componentes mejorados

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
      isMobile
    };
    
    switch (activeTab) {
      case 'payments':
        return <PaymentsTab {...paymentsData} {...commonProps} onSave={onSave} />;
      case 'cash': 
        return (
          <CashTab 
            {...cashData} 
            {...commonProps} 
            onSave={onSave}
            handleCancelCashMembership={cashData.handleCancelCashMembership}
            cancellingIds={cashData.cancellingIds}
            isMembershipProcessing={cashData.isMembershipProcessing}
            getProcessingType={cashData.getProcessingType}
            isCandidateForCancellation={cashData.isCandidateForCancellation}
          />
        );
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
            Sistema completo de gestión financiera con información detallada y comprobantes
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
          urgentCash: cashData.cashMembershipStats?.old || 0
        }}
      />
      
      {/* Contenido del tab activo */}
      {renderActiveTab()}
      
      {/* Información adicional sobre las mejoras */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Sistema Mejorado con Información Detallada
            </h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Transferencias:</strong> Comprobantes se muestran directamente en el dashboard con visualización completa</p>
              <p>• <strong>Efectivo:</strong> Información expandible con detalles completos del cliente y membresía</p>
              <p>• <strong>Historial:</strong> Vista detallada expandible para cada pago con toda la información disponible</p>
              <p>• <strong>Tiempo real:</strong> URLs de comprobantes funcionales como en el test del backend</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsManager;

// Este componente sirve como orquestador principal del sistema de pagos
// Mantiene la navegación entre tabs y coordina todos los subcomponentes
// No maneja lógica de negocio directamente, delegando a hooks especializados