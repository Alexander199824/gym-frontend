// Autor: Alexander Echeverria
// Ubicación: /gym-frontend/src/components/dashboard/RecentPayments.js

import React from 'react';
import { Coins, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const RecentPayments = ({ payments = [], isLoading = false }) => {
  const { formatCurrency } = useApp();

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'cash':
        return <Banknote className="w-4 h-4 text-green-600" />;
      case 'card':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'transfer':
        return <Smartphone className="w-4 h-4 text-purple-600" />;
      case 'bank':
        return <Smartphone className="w-4 h-4 text-indigo-600" />;
      default:
        return <Coins className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'cash':
        return 'Efectivo';
      case 'card':
        return 'Tarjeta';
      case 'transfer':
        return 'Transferencia';
      case 'bank':
        return 'Depósito Bancario';
      default:
        return 'Otro';
    }
  };

  const getPaymentTypeLabel = (type) => {
    switch (type) {
      case 'membership':
        return 'Membresía';
      case 'daily':
        return 'Pago Diario';
      case 'registration':
        return 'Inscripción';
      default:
        return 'Pago';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="animate-pulse bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded mb-1 w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Coins className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">No hay pagos registrados hoy</p>
        <p className="text-xs text-gray-400 mt-1">
          Los pagos aparecerán aquí cuando se procesen transacciones
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {payments.map((payment) => (
        <div key={payment.id} className="bg-green-50 border border-green-200 rounded-lg p-3 hover:bg-green-100 transition-colors duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                {getPaymentIcon(payment.paymentMethod)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {payment.user?.firstName} {payment.user?.lastName}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {getPaymentTypeLabel(payment.paymentType)} - {getPaymentMethodLabel(payment.paymentMethod)}
                </p>
                {payment.description && (
                  <p className="text-xs text-gray-500 truncate mt-1">
                    {payment.description}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <p className="text-sm font-bold text-green-700">
                {formatCurrency ? formatCurrency(payment.amount) : `Q${payment.amount.toFixed(2)}`}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(payment.paymentDate).toLocaleTimeString('es-GT', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              {payment.status && (
                <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                  payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                  payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {payment.status === 'completed' ? 'Completado' :
                   payment.status === 'pending' ? 'Pendiente' : payment.status}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentPayments;

/*
FUNCIONALIDAD:
Este componente muestra los pagos más recientes realizados en el gimnasio durante el día actual.
Proporciona una vista rápida y detallada de las transacciones financieras en quetzales guatemaltecos
para monitoreo en tiempo real del flujo de ingresos del negocio.

CARACTERÍSTICAS PRINCIPALES:
- Lista cronológica de pagos del día con información financiera completa
- Iconos específicos y colores distintivos para cada método de pago
- Estado de carga con animación skeleton mientras cargan los datos
- Formato de moneda en quetzales guatemaltecos (Q) con decimales
- Información completa del usuario que realizó el pago
- Distinción clara entre tipos de pagos (membresía, diario, inscripción)
- Timestamps con hora local guatemalteca formateada
- Diseño visual con códigos de colores verdes para pagos exitosos
- Scroll automático para listas largas de transacciones
- Estados de pago con etiquetas de estado (completado, pendiente)
- Efectos hover para mejor interactividad

MÉTODOS DE PAGO SOPORTADOS:
- cash: Efectivo (icono de billetes verde) - Pagos en efectivo en quetzales
- card: Tarjeta de crédito/débito (icono de tarjeta azul) - Visa, Mastercard locales
- transfer: Transferencia móvil (icono de smartphone púrpura) - Tigo Money, Claro Pay
- bank: Depósito bancario (icono de smartphone índigo) - Banrural, BAM, G&T
- default: Método genérico (icono de monedas gris)

TIPOS DE PAGOS MANEJADOS:
- membership: Pagos de membresías mensuales o anuales
- daily: Pagos diarios por uso del gimnasio
- registration: Pagos de inscripción inicial
- default: Otros tipos de pagos especiales

ESTRUCTURA DE DATOS ESPERADA:
Recibe un array de pagos con la siguiente estructura:
- id: Identificador único del pago
- user: Objeto con firstName y lastName del usuario
- paymentMethod: Método de pago utilizado (cash, card, transfer, bank)
- paymentType: Tipo de pago (membership, daily, registration)
- amount: Monto del pago en quetzales (número decimal)
- paymentDate: Fecha y hora del pago en formato ISO
- description: Descripción adicional del pago (opcional)
- status: Estado del pago (completed, pending, failed) (opcional)

EJEMPLOS DE TRANSACCIONES TÍPICAS:
- "Carlos Méndez - Membresía - Efectivo: Q 150.00"
- "María López - Pago Diario - Tarjeta: Q 15.00"  
- "José García - Inscripción - Transferencia: Q 50.00"
- "Ana Rodríguez - Membresía - Depósito Bancario: Q 300.00"

CONEXIONES CON OTROS ARCHIVOS:
- Importa desde 'react' para funcionalidad del componente
- Importa iconos desde 'lucide-react' (Coins, CreditCard, Banknote, Smartphone)
- Utiliza useApp desde '../../contexts/AppContext' para formateo de moneda en quetzales
- Utilizado en el dashboard principal (/dashboard) para mostrar actividad financiera reciente
- Recibe datos de componentes padre que consultan APIs de pagos del backend
- Se integra con sistemas de facturación y contabilidad del gimnasio
- Conecta con módulos de:
  * Usuarios para obtener información de los pagadores
  * Membresías para pagos mensuales y anuales
  * Pagos diarios para acceso temporal al gimnasio
  * Sistema POS para procesamiento de transacciones
  * APIs de bancos guatemaltecos para depósitos y transferencias
- Sincroniza con PaymentChart.js para estadísticas de ingresos
- Comunica con RecentActivity.js para mostrar actividad general
- Conecta con APIs REST de transacciones y WebSockets para actualizaciones en vivo

LO QUE VE EL USUARIO:
- Durante la carga: Lista de placeholders animados (skeleton) que simulan transacciones
- Cuando no hay pagos: Mensaje "No hay pagos registrados hoy" con icono de monedas
- Para cada pago reciente:
  * Tarjeta con fondo verde claro que indica transacción exitosa
  * Icono circular blanco con símbolo del método de pago en colores específicos
  * Nombre completo del cliente que realizó el pago
  * Tipo de pago y método usado (ej: "Membresía - Efectivo")
  * Monto en quetzales con formato Q###.## (ej: "Q 150.00")
  * Hora del pago en formato guatemalteco (ej: "14:30")
  * Descripción adicional cuando está disponible
  * Etiqueta de estado: verde para "Completado", amarillo para "Pendiente"
  * Efecto hover que cambia el fondo a verde más intenso
- Lista con scroll automático cuando hay muchas transacciones
- Formato de hora guatemalteco en 24 horas
- Truncado automático de nombres largos con puntos suspensivos

CASOS DE USO EN EL DASHBOARD:
- Monitoreo de ingresos diarios en tiempo real
- Verificación de pagos de membresías procesados
- Seguimiento de transacciones por método de pago
- Control de pagos diarios de usuarios temporales
- Supervisión de inscripciones nuevas
- Identificación de problemas con pagos pendientes
- Análisis de preferencias de pago de los clientes

PROPÓSITO:
Facilitar el monitoreo en tiempo real de los ingresos del gimnasio en quetzales guatemaltecos,
permitiendo al personal administrativo verificar pagos recientes, identificar patrones de pago
por método y tipo, mantener control sobre la actividad financiera diaria, y garantizar que
todas las transacciones se procesen correctamente. Mejora la gestión operativa y contable
proporcionando visibilidad inmediata del flujo de efectivo y facilitando la conciliación
diaria de ingresos con los diferentes métodos de pago utilizados en Guatemala.
*/