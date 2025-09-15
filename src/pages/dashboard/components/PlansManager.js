// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/PlansManager.js
// FUNCIÓN: Gestión MEJORADA de planes - Vista de edición corregida y responsive


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
        return (
          <TransfersTab 
            {...transfersData} 
            {...commonProps} 
            onSave={onSave}
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
          />
        );
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
      
      {/* Contenido del tab activo */}
      {renderActiveTab()}
    </div>
  );
};

export default PaymentsManager;
/**
 * COMENTARIOS FINALES DEL COMPONENTE
 * 
 * PROPÓSITO:
 * Este componente maneja la gestión completa de planes de membresía para el gimnasio.
 * Permite crear, editar, eliminar y configurar planes que se muestran en la página web del gimnasio.
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Creación y edición de planes de membresía con vista previa en tiempo real
 * - Configuración de precios en quetzales guatemaltecos con sistema de descuentos
 * - Selección de iconos personalizados para cada plan
 * - Gestión de características/beneficios de cada plan
 * - Sistema de plan "popular" con destacado visual
 * - Múltiples duraciones: diario, mensual, trimestral y anual
 * - Modal de edición responsive con formulario completo
 * - Vista en tarjetas responsiva para escritorio y móvil
 * - Sistema de cambios sin guardar con alertas
 * 
 * CONEXIONES CON OTROS ARCHIVOS:
 * - AppContext: Para mostrar notificaciones y manejar modo móvil
 * - Lucide React: Para iconografía completa del sistema
 * - No requiere comunicación directa con backend (manejado por componente padre)
 * 
 * DATOS QUE MUESTRA AL USUARIO:
 * - Lista visual de todos los planes configurados
 * - Precios en quetzales guatemaltecos (Q) con descuentos calculados automáticamente
 * - Características/beneficios de cada plan con iconos de verificación
 * - Indicadores visuales para plan popular (destacado con borde dorado)
 * - Vista previa en tiempo real mientras se edita un plan
 * - Iconos personalizables para identificar cada tipo de plan
 * - Duración de cada plan (diario, mensual, trimestral, anual)
 * 
 * VALIDACIONES INCLUIDAS:
 * - Nombre del plan obligatorio
 * - Precio mayor a 0 quetzales
 * - Precio original mayor al precio actual (para descuentos)
 * - Solo un plan puede ser marcado como "popular" a la vez
 * - Debe existir al menos un plan antes de guardar
 * 
 * CARACTERÍSTICAS ESPECIALES:
 * - Cálculo automático de porcentaje de descuento
 * - Mapeo inteligente de datos desde el backend
 * - Sistema de iconos expandible con 8 opciones predefinidas
 * - Gestión de estado local con sincronización de cambios
 * - Interfaz drag-and-drop para reordenar características
 * - Responsivo completo para todos los dispositivos
 */