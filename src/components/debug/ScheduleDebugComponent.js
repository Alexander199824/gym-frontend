// src/components/debug/ScheduleDebugComponent.js
// COMPONENTE DE DEBUG PARA VERIFICAR COMUNICACIÓN CON EL BACKEND

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Bug, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Eye,
  Server,
  Clock,
  Users,
  Calendar,
  ArrowRight,
  Code,
  Database,
  Activity
} from 'lucide-react';

import apiService from '../../services/apiService';

const ScheduleDebugComponent = () => {
  const [selectedTest, setSelectedTest] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Test individual endpoints
  const runSingleTest = async (testName, testFn) => {
    setIsRunningTests(true);
    setTestResults(prev => ({
      ...prev,
      [testName]: { status: 'running', message: 'Ejecutando...' }
    }));

    try {
      const result = await testFn();
      setTestResults(prev => ({
        ...prev,
        [testName]: { 
          status: 'success', 
          message: 'Exitoso', 
          data: result,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: { 
          status: 'error', 
          message: error.message || 'Error desconocido',
          error: error,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } finally {
      setIsRunningTests(false);
    }
  };

  // Test todos los endpoints de horarios
  const runAllTests = async () => {
    const tests = [
      {
        name: 'currentSchedule',
        description: 'Obtener horarios actuales',
        fn: () => apiService.getCurrentSchedule()
      },
      {
        name: 'availableOptions',
        description: 'Obtener opciones disponibles',
        fn: () => apiService.getAvailableScheduleOptions()
      },
      {
        name: 'availableOptionsMonday',
        description: 'Opciones para lunes específico',
        fn: () => apiService.getAvailableScheduleOptions('monday')
      },
      {
        name: 'scheduleStats',
        description: 'Estadísticas de horarios',
        fn: () => apiService.getScheduleStats()
      }
    ];

    setIsRunningTests(true);
    
    for (const test of tests) {
      await runSingleTest(test.name, test.fn);
      // Pequeña pausa entre tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunningTests(false);
  };

  const testDefinitions = [
    {
      id: 'currentSchedule',
      name: 'Horarios Actuales',
      description: 'GET /api/memberships/my-schedule',
      icon: Calendar,
      color: 'blue',
      fn: () => apiService.getCurrentSchedule()
    },
    {
      id: 'availableOptions',
      name: 'Opciones Disponibles (Todas)',
      description: 'GET /api/memberships/my-schedule/available-options',
      icon: Clock,
      color: 'green',
      fn: () => apiService.getAvailableScheduleOptions()
    },
    {
      id: 'availableOptionsMonday',
      name: 'Opciones Lunes',
      description: 'GET /api/memberships/my-schedule/available-options?day=monday',
      icon: Activity,
      color: 'purple',
      fn: () => apiService.getAvailableScheduleOptions('monday')
    },
    {
      id: 'scheduleStats',
      name: 'Estadísticas',
      description: 'GET /api/memberships/my-schedule/stats',
      icon: Database,
      color: 'orange',
      fn: () => apiService.getScheduleStats()
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bug className="w-8 h-8 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Debug de Horarios</h1>
              <p className="text-blue-100">Verificar comunicación con el backend</p>
            </div>
          </div>
          
          <button
            onClick={runAllTests}
            disabled={isRunningTests}
            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center"
          >
            {isRunningTests ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Ejecutando...
              </>
            ) : (
              <>
                <Server className="w-4 h-4 mr-2" />
                Probar Todos
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid de Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {testDefinitions.map((test) => {
          const result = testResults[test.id];
          const Icon = test.icon;
          
          return (
            <div key={test.id} className={`border-2 rounded-lg p-4 transition-all hover:shadow-md cursor-pointer ${
              result ? getStatusColor(result.status) : 'bg-white border-gray-200 hover:border-blue-300'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${
                  test.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  test.color === 'green' ? 'bg-green-100 text-green-600' :
                  test.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex items-center space-x-2">
                  {getStatusIcon(result?.status)}
                  <button
                    onClick={() => runSingleTest(test.id, test.fn)}
                    disabled={isRunningTests}
                    className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    title="Ejecutar test"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-1">{test.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{test.description}</p>
              
              {result && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${
                      result.status === 'success' ? 'text-green-700' :
                      result.status === 'error' ? 'text-red-700' :
                      'text-blue-700'
                    }`}>
                      {result.status === 'success' ? 'Exitoso' :
                       result.status === 'error' ? 'Error' :
                       'Ejecutando...'}
                    </span>
                    <span className="text-gray-500">{result.timestamp}</span>
                  </div>
                  
                  <div className="text-xs text-gray-600 bg-white/50 p-2 rounded border">
                    {result.message}
                  </div>
                  
                  {result.data && (
                    <button
                      onClick={() => setSelectedTest({ ...test, result })}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver datos
                    </button>
                  )}
                </div>
              )}
              
              {!result && (
                <button
                  onClick={() => runSingleTest(test.id, test.fn)}
                  disabled={isRunningTests}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 flex items-center"
                >
                  Ejecutar
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Resumen de Resultados */}
      {Object.keys(testResults).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Resumen de Resultados
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(testResults).filter(r => r.status === 'success').length}
              </div>
              <div className="text-sm text-green-700">Tests Exitosos</div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">
                {Object.values(testResults).filter(r => r.status === 'error').length}
              </div>
              <div className="text-sm text-red-700">Tests Fallidos</div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(testResults).length}
              </div>
              <div className="text-sm text-blue-700">Total Ejecutados</div>
            </div>
          </div>
          
          <div className="space-y-2">
            {Object.entries(testResults).map(([testName, result]) => (
              <div key={testName} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                <div className="flex items-center">
                  {getStatusIcon(result.status)}
                  <span className="ml-3 font-medium text-gray-900">
                    {testDefinitions.find(t => t.id === testName)?.name || testName}
                  </span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">{result.timestamp}</span>
                  {result.data && (
                    <button
                      onClick={() => setSelectedTest({ 
                        id: testName,
                        name: testDefinitions.find(t => t.id === testName)?.name || testName,
                        result 
                      })}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Ver
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Datos */}
      {selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Code className="w-5 h-5 mr-2" />
                Datos de: {selectedTest.name}
              </h3>
              <button
                onClick={() => setSelectedTest(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Estado:</h4>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedTest.result.status === 'success' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedTest.result.status === 'success' ? 'Exitoso' : 'Error'}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Mensaje:</h4>
                  <div className="bg-gray-50 p-3 rounded border text-sm">
                    {selectedTest.result.message}
                  </div>
                </div>
                
                {selectedTest.result.data && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Datos Recibidos:</h4>
                    <div className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-sm font-mono">
                      <pre>{JSON.stringify(selectedTest.result.data, null, 2)}</pre>
                    </div>
                  </div>
                )}
                
                {selectedTest.result.error && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Error Detallado:</h4>
                    <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-700">
                      <pre>{JSON.stringify(selectedTest.result.error, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información Adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          ℹ️ Información de Debug
        </h3>
        
        <div className="space-y-3 text-sm text-blue-800">
          <div>
            <strong>Endpoints Probados:</strong>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li><code>GET /api/memberships/my-schedule</code> - Horarios actuales del usuario</li>
              <li><code>GET /api/memberships/my-schedule/available-options</code> - Opciones disponibles</li>
              <li><code>GET /api/memberships/my-schedule/available-options?day=monday</code> - Opciones por día</li>
              <li><code>GET /api/memberships/my-schedule/stats</code> - Estadísticas de horarios</li>
            </ul>
          </div>
          
          <div>
            <strong>¿Qué verificar?</strong>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>✅ Los endpoints responden correctamente</li>
              <li>✅ La estructura de datos coincide con la documentación</li>
              <li>✅ Los campos <code>availableOptions</code> y <code>currentSchedule</code> están presentes</li>
              <li>✅ Los slots tienen <code>id</code>, <code>timeRange</code>, <code>canSelect</code>, etc.</li>
              <li>✅ No hay errores 404 o 500</li>
            </ul>
          </div>
          
          <div>
            <strong>Errores Comunes:</strong>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>🔴 Error 404: Endpoint no implementado en el backend</li>
              <li>🔴 Error 401: Usuario no autenticado</li>
              <li>🔴 Error 403: Usuario sin membresía activa</li>
              <li>🔴 Estructura de datos diferente a la esperada</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDebugComponent;