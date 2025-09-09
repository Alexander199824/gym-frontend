// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/StockManager.js

import React, { useState } from 'react';
import {
  Plus, Minus, Save, X, Package, ShoppingCart, Truck, 
  AlertTriangle, Info, Calculator, Coins, Calendar,
  User, Receipt, BarChart3, TrendingUp, TrendingDown,
  Check, Clock, RefreshCw
} from 'lucide-react';

const StockManager = ({ stockOperation, onChange, onSave, onCancel, product }) => {
  const [activeTab, setActiveTab] = useState('operation');
  
  // Tipos de operaciones
  const operationTypes = [
    {
      id: 'add',
      label: 'Agregar Stock',
      icon: Plus,
      color: 'green',
      description: 'Aumentar inventario'
    },
    {
      id: 'subtract',
      label: 'Reducir Stock',
      icon: Minus,
      color: 'red',
      description: 'Disminuir inventario'
    },
    {
      id: 'sale',
      label: 'Venta en Tienda',
      icon: ShoppingCart,
      color: 'blue',
      description: 'Venta física directa'
    },
    {
      id: 'adjustment',
      label: 'Ajuste de Inventario',
      icon: RefreshCw,
      color: 'purple',
      description: 'Corrección manual'
    },
    {
      id: 'damage',
      label: 'Producto Dañado',
      icon: AlertTriangle,
      color: 'orange',
      description: 'Pérdida por daños'
    }
  ];
  
  // Razones predefinidas por tipo
  const predefinedReasons = {
    add: [
      'Compra de mercadería',
      'Reposición de stock',
      'Devolución de cliente',
      'Transferencia entre sucursales',
      'Ajuste por inventario físico'
    ],
    subtract: [
      'Venta en línea',
      'Producto de muestra',
      'Obsequio promocional',
      'Transferencia a otra sucursal',
      'Uso interno'
    ],
    sale: [
      'Venta en tienda física',
      'Venta al mostrador',
      'Venta de empleado',
      'Venta promocional'
    ],
    adjustment: [
      'Corrección por conteo físico',
      'Error en sistema',
      'Ajuste por diferencia',
      'Regularización de inventario'
    ],
    damage: [
      'Producto vencido',
      'Daño en transporte',
      'Daño por manipulación',
      'Defecto de fábrica',
      'Pérdida o robo'
    ]
  };
  
  // Tabs del gestor
  const managerTabs = [
    { id: 'operation', label: 'Operación', icon: Package },
    { id: 'calculation', label: 'Cálculos', icon: Calculator },
    { id: 'summary', label: 'Resumen', icon: BarChart3 }
  ];
  
  // Calcular valores
  const currentType = operationTypes.find(type => type.id === stockOperation.type);
  const newStockLevel = stockOperation.type === 'add' 
    ? product.stock + stockOperation.quantity
    : product.stock - stockOperation.quantity;
  
  const isValidOperation = stockOperation.quantity > 0 && 
    (stockOperation.type === 'add' || newStockLevel >= 0);
  
  const totalValue = stockOperation.quantity * (product.price || 0);
  const totalCost = stockOperation.quantity * (product.cost || 0);
  const totalProfit = totalValue - totalCost;
  
  // Verificar alertas
  const getStockAlert = () => {
    if (newStockLevel < 0) {
      return { type: 'error', message: 'No hay suficiente stock disponible' };
    }
    if (newStockLevel <= product.minStock) {
      return { type: 'warning', message: 'El stock quedará por debajo del mínimo' };
    }
    if (newStockLevel > product.maxStock) {
      return { type: 'warning', message: 'El stock excederá el máximo permitido' };
    }
    return null;
  };
  
  const stockAlert = getStockAlert();

  return (
    <div className="space-y-6">
      
      {/* ENCABEZADO */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">
            Gestión de Stock
          </h4>
          <p className="text-gray-600 text-sm mt-1">
            {product.name} • SKU: {product.sku}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={onSave}
            disabled={!isValidOperation || !stockOperation.reason.trim()}
            className="btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-1" />
            Confirmar
          </button>
          
          <button
            onClick={onCancel}
            className="btn-secondary btn-sm"
          >
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </button>
        </div>
      </div>
      
      {/* NAVEGACIÓN */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {managerTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 inline mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* CONTENIDO */}
      <div className="space-y-6">
        
        {/* TAB: Operación */}
        {activeTab === 'operation' && (
          <div className="space-y-6">
            
            {/* Información actual del producto */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h6 className="font-medium text-gray-900 mb-3">Stock Actual</h6>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{product.stock}</div>
                  <div className="text-sm text-gray-600">Disponible</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{product.minStock}</div>
                  <div className="text-sm text-gray-600">Mínimo</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{product.maxStock}</div>
                  <div className="text-sm text-gray-600">Máximo</div>
                </div>
              </div>
              
              {/* Barra de nivel de stock */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Nivel actual</span>
                  <span>{product.stock} unidades</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      product.stock <= product.minStock ? 'bg-red-500' : 
                      product.stock <= product.minStock * 2 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min((product.stock / product.maxStock) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Tipo de operación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Operación
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {operationTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => onChange({ ...stockOperation, type: type.id, reason: '' })}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      stockOperation.type === type.id
                        ? `border-${type.color}-500 bg-${type.color}-50 text-${type.color}-700`
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        stockOperation.type === type.id
                          ? `bg-${type.color}-100`
                          : 'bg-gray-100'
                      }`}>
                        <type.icon className={`w-4 h-4 ${
                          stockOperation.type === type.id
                            ? `text-${type.color}-600`
                            : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Cantidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onChange({ 
                    ...stockOperation, 
                    quantity: Math.max(0, stockOperation.quantity - 1) 
                  })}
                  disabled={stockOperation.quantity <= 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <input
                  type="number"
                  value={stockOperation.quantity}
                  onChange={(e) => onChange({ 
                    ...stockOperation, 
                    quantity: Math.max(0, parseInt(e.target.value) || 0) 
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center"
                  min="0"
                  placeholder="0"
                />
                
                <button
                  onClick={() => onChange({ 
                    ...stockOperation, 
                    quantity: stockOperation.quantity + 1 
                  })}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {/* Botones de cantidad rápida */}
              <div className="flex space-x-2 mt-3">
                {[1, 5, 10, 25, 50].map((qty) => (
                  <button
                    key={qty}
                    onClick={() => onChange({ ...stockOperation, quantity: qty })}
                    className={`px-3 py-1 text-sm border rounded ${
                      stockOperation.quantity === qty
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {qty}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Razón */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón de la Operación
              </label>
              
              {/* Razones predefinidas */}
              {predefinedReasons[stockOperation.type] && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2">Razones comunes:</p>
                  <div className="flex flex-wrap gap-2">
                    {predefinedReasons[stockOperation.type].map((reason) => (
                      <button
                        key={reason}
                        onClick={() => onChange({ ...stockOperation, reason })}
                        className={`px-3 py-1 text-sm border rounded-full transition-colors ${
                          stockOperation.reason === reason
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Campo de texto personalizado */}
              <textarea
                value={stockOperation.reason}
                onChange={(e) => onChange({ ...stockOperation, reason: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe la razón de esta operación..."
              />
            </div>
            
            {/* Alertas de stock */}
            {stockAlert && (
              <div className={`rounded-lg p-4 ${
                stockAlert.type === 'error' 
                  ? 'bg-red-50 border border-red-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex">
                  <AlertTriangle className={`w-5 h-5 ${
                    stockAlert.type === 'error' ? 'text-red-400' : 'text-yellow-400'
                  }`} />
                  <div className="ml-3">
                    <h6 className={`text-sm font-medium ${
                      stockAlert.type === 'error' ? 'text-red-800' : 'text-yellow-800'
                    }`}>
                      {stockAlert.type === 'error' ? 'Error' : 'Advertencia'}
                    </h6>
                    <p className={`text-sm ${
                      stockAlert.type === 'error' ? 'text-red-700' : 'text-yellow-700'
                    }`}>
                      {stockAlert.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        )}
        
        {/* TAB: Cálculos */}
        {activeTab === 'calculation' && stockOperation.quantity > 0 && (
          <div className="space-y-6">
            
            {/* Cambio en el stock */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h6 className="font-medium text-gray-900 mb-4">Cambio en el Stock</h6>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900">{product.stock}</div>
                  <div className="text-sm text-gray-600">Stock Actual</div>
                </div>
                
                <div className="flex items-center justify-center">
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                    stockOperation.type === 'add'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {stockOperation.type === 'add' ? (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>+{stockOperation.quantity}</span>
                      </>
                    ) : (
                      <>
                        <Minus className="w-4 h-4" />
                        <span>-{stockOperation.quantity}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className={`text-lg font-bold ${
                    newStockLevel < 0 ? 'text-red-600' :
                    newStockLevel <= product.minStock ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {newStockLevel}
                  </div>
                  <div className="text-sm text-gray-600">Stock Nuevo</div>
                </div>
              </div>
            </div>
            
            {/* Cálculos monetarios */}
            {(stockOperation.type === 'sale' || stockOperation.type === 'subtract') && product.price > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h6 className="font-medium text-gray-900 mb-4 flex items-center">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-2">
                    Q
                  </div>
                  Cálculos Monetarios
                </h6>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio por unidad:</span>
                    <span className="font-medium">Q{product.price.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cantidad:</span>
                    <span className="font-medium">{stockOperation.quantity} unidades</span>
                  </div>
                  
                  <div className="border-t border-blue-200 pt-3">
                    <div className="flex justify-between text-lg">
                      <span className="font-medium text-gray-900">Valor total:</span>
                      <span className="font-bold text-blue-600">Q{totalValue.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {product.cost > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Costo total:</span>
                        <span className="text-gray-900">Q{totalCost.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Ganancia:</span>
                        <span className={`font-medium ${
                          totalProfit > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Q{totalProfit.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Proyección de nivel de stock */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h6 className="font-medium text-gray-900 mb-4">Proyección de Stock</h6>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Después de esta operación:</span>
                  <span className={`font-medium ${
                    newStockLevel <= product.minStock ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {newStockLevel} unidades
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Capacidad utilizada:</span>
                  <span className="font-medium">
                    {Math.round((newStockLevel / product.maxStock) * 100)}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      newStockLevel <= product.minStock ? 'bg-red-500' : 
                      newStockLevel <= product.minStock * 2 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min((newStockLevel / product.maxStock) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                
                {newStockLevel <= product.minStock && (
                  <div className="flex items-center space-x-2 text-sm text-yellow-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Stock bajo - considera reordenar</span>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        )}
        
        {/* TAB: Resumen */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            
            {/* Resumen de la operación */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h6 className="font-medium text-gray-900 mb-4">Resumen de la Operación</h6>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  {currentType && (
                    <>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${currentType.color}-100`}>
                        <currentType.icon className={`w-5 h-5 text-${currentType.color}-600`} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{currentType.label}</div>
                        <div className="text-sm text-gray-600">{currentType.description}</div>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Producto:</span>
                    <div className="font-medium">{product.name}</div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600">SKU:</span>
                    <div className="font-medium">{product.sku}</div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600">Cantidad:</span>
                    <div className="font-medium">{stockOperation.quantity} unidades</div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600">Stock resultante:</span>
                    <div className={`font-medium ${
                      newStockLevel < 0 ? 'text-red-600' :
                      newStockLevel <= product.minStock ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {newStockLevel} unidades
                    </div>
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-600 text-sm">Razón:</span>
                  <div className="font-medium bg-gray-50 p-3 rounded mt-1">
                    {stockOperation.reason || 'Sin especificar'}
                  </div>
                </div>
                
                {(stockOperation.type === 'sale' && product.price > 0) && (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-green-800 font-medium">Valor de venta:</span>
                      <span className="text-green-800 font-bold text-lg">Q{totalValue.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Validación final */}
            <div className={`border rounded-lg p-4 ${
              isValidOperation && stockOperation.reason.trim()
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-center space-x-3">
                {isValidOperation && stockOperation.reason.trim() ? (
                  <>
                    <Check className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium text-green-800">
                        Lista para confirmar
                      </div>
                      <div className="text-sm text-green-700">
                        La operación es válida y se puede ejecutar
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <div className="font-medium text-red-800">
                        Operación incompleta
                      </div>
                      <div className="text-sm text-red-700">
                        {!isValidOperation && 'Cantidad inválida o stock insuficiente. '}
                        {!stockOperation.reason.trim() && 'Falta especificar la razón.'}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
          </div>
        )}
        
      </div>
      
    </div>
  );
};

export default StockManager;

/*
 * COMPONENTE: StockManager
 * AUTOR: Alexander Echeverria
 * 
 * PROPÓSITO:
 * Este componente gestiona todas las operaciones de inventario y stock del gimnasio.
 * Permite realizar diferentes tipos de movimientos de stock con validaciones, cálculos
 * automáticos y seguimiento detallado de todas las operaciones realizadas.
 * 
 * FUNCIONALIDADES PARA EL USUARIO:
 * 
 * TIPOS DE OPERACIONES DE STOCK:
 * - Agregar Stock: Para aumentar inventario por compras, devoluciones o reposiciones
 * - Reducir Stock: Para disminuir inventario por ventas, muestras o transferencias  
 * - Venta en Tienda: Para registrar ventas físicas directas con cálculo de ingresos
 * - Ajuste de Inventario: Para correcciones manuales y regularizaciones
 * - Producto Dañado: Para registrar pérdidas por daños, vencimientos o robos
 * 
 * INTERFAZ DE TRES PESTAÑAS:
 * 
 * PESTAÑA OPERACIÓN:
 * - Visualización del stock actual con niveles mínimo y máximo
 * - Barra visual del nivel de stock con códigos de color (verde/amarillo/rojo)
 * - Selección del tipo de operación con iconos y descripciones
 * - Control de cantidad con botones +/- y campos numéricos
 * - Botones de cantidad rápida (1, 5, 10, 25, 50 unidades)
 * - Lista de razones predefinidas por cada tipo de operación
 * - Campo de texto libre para razones personalizadas
 * - Alertas automáticas de validación (stock insuficiente, niveles críticos)
 * 
 * PESTAÑA CÁLCULOS:
 * - Visualización del cambio de stock (antes/operación/después)
 * - Cálculos monetarios automáticos para ventas:
 *   * Precio por unidad en Quetzales (Q)
 *   * Valor total de la operación
 *   * Costo total (si está disponible)
 *   * Ganancia calculada (precio - costo)
 * - Proyección del nivel de stock resultante
 * - Porcentaje de capacidad utilizada después de la operación
 * - Barra visual del nuevo nivel de stock
 * - Advertencias automáticas de stock bajo
 * 
 * PESTAÑA RESUMEN:
 * - Resumen completo de la operación antes de confirmar
 * - Información del producto (nombre, SKU)
 * - Detalles de la operación (tipo, cantidad, stock resultante)
 * - Razón de la operación claramente mostrada
 * - Valor monetario destacado para ventas
 * - Validación final con indicadores visuales
 * - Estado de la operación (lista/incompleta)
 * 
 * VALIDACIONES Y SEGURIDAD:
 * - Verificación de stock suficiente antes de operaciones de reducción
 * - Validación de cantidades positivas y numéricas
 * - Obligatoriedad de especificar razón para cada operación
 * - Alertas visuales para operaciones que excedan límites
 * - Confirmación requerida antes de ejecutar operación
 * - Prevención de operaciones inválidas con botones deshabilitados
 * 
 * RAZONES PREDEFINIDAS POR OPERACIÓN:
 * 
 * AGREGAR STOCK:
 * - Compra de mercadería
 * - Reposición de stock
 * - Devolución de cliente
 * - Transferencia entre sucursales
 * - Ajuste por inventario físico
 * 
 * REDUCIR STOCK:
 * - Venta en línea
 * - Producto de muestra
 * - Obsequio promocional
 * - Transferencia a otra sucursal
 * - Uso interno
 * 
 * VENTA EN TIENDA:
 * - Venta en tienda física
 * - Venta al mostrador
 * - Venta de empleado
 * - Venta promocional
 * 
 * AJUSTE DE INVENTARIO:
 * - Corrección por conteo físico
 * - Error en sistema
 * - Ajuste por diferencia
 * - Regularización de inventario
 * 
 * PRODUCTO DAÑADO:
 * - Producto vencido
 * - Daño en transporte
 * - Daño por manipulación
 * - Defecto de fábrica
 * - Pérdida o robo
 * 
 * CONEXIONES Y DEPENDENCIAS:
 * 
 * PROPIEDADES RECIBIDAS:
 * - stockOperation: Objeto con los datos de la operación actual
 * - onChange: Función para actualizar datos de la operación
 * - onSave: Función para confirmar y guardar la operación
 * - onCancel: Función para cancelar la operación
 * - product: Objeto con información completa del producto
 * 
 * ESTRUCTURA DE DATOS:
 * - product: { name, sku, stock, minStock, maxStock, price, cost }
 * - stockOperation: { type, quantity, reason }
 * - Cálculos automáticos: newStockLevel, totalValue, totalCost, totalProfit
 * 
 * COMUNICACIÓN CON COMPONENTE PADRE:
 * - Notifica cambios en tiempo real através de onChange
 * - Confirma operación através de onSave con validaciones completas
 * - Permite cancelación segura através de onCancel
 * - Recibe datos actualizados del producto desde el componente padre
 * 
 * TECNOLOGÍAS:
 * - React con Hooks (useState) para manejo de estado local
 * - Lucide React para iconografía moderna y consistente
 * - Tailwind CSS para estilos responsivos y utilities-first
 * - JavaScript ES6+ para cálculos y validaciones
 * - Conditional rendering para mostrar secciones relevantes
 * 
 * EXPERIENCIA DE USUARIO:
 * - Navegación intuitiva con pestañas organizadas por función
 * - Feedback visual inmediato con colores y alertas
 * - Validación en tiempo real para prevenir errores
 * - Cálculos automáticos para transparencia en operaciones
 * - Razones predefinidas para agilizar el proceso
 * - Confirmación clara antes de ejecutar cambios permanentes
 * 
 * IMPACTO EN EL NEGOCIO:
 * - Control preciso del inventario con trazabilidad completa
 * - Prevención de ventas con stock insuficiente
 * - Seguimiento de costos y ganancias por operación
 * - Historial detallado para auditorías y análisis
 * - Optimización de niveles de stock con alertas automáticas
 * - Gestión eficiente de operaciones diarias del gimnasio
 */