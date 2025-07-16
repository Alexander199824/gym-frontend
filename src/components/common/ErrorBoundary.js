// src/components/common/ErrorBoundary.js
// UBICACIÓN: /gym-frontend/src/components/common/ErrorBoundary.js
// FUNCIÓN: Captura errores de React y muestra UI de fallback elegante
// USADO EN: App.js como wrapper principal, componentes críticos

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Actualizar el estado para mostrar la UI de fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Capturar detalles del error para logging
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // 📝 LOG DEL ERROR (en producción enviarías a un servicio de monitoreo)
    console.error('❌ Error capturado por ErrorBoundary:', error, errorInfo);
    
    // En producción, aquí enviarías el error a un servicio como Sentry
    if (process.env.NODE_ENV === 'production') {
      // Ejemplo: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  // 🔄 FUNCIÓN PARA RETRY
  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null
    });
  };

  // 🏠 FUNCIÓN PARA IR AL INICIO
  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            {/* 🚨 ICONO DE ERROR */}
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            {/* 📝 MENSAJE DE ERROR */}
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                ¡Ups! Algo salió mal
              </h2>
              <p className="text-gray-600 mb-6">
                Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado automáticamente.
              </p>
            </div>
            
            {/* 🔧 DETALLES DEL ERROR (solo en desarrollo) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Detalles del Error:</h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Error:</strong> {this.state.error?.message}</p>
                  <p><strong>Componente:</strong> {this.state.errorInfo?.componentStack}</p>
                </div>
              </div>
            )}
            
            {/* 🎯 BOTONES DE ACCIÓN */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Intentar de nuevo
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir al inicio
              </button>
            </div>
            
            {/* 💡 INFORMACIÓN ADICIONAL */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Si el problema persiste, contacta al administrador del sistema.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 🎨 VARIANTE SIMPLE PARA COMPONENTES ESPECÍFICOS
export const SimpleErrorBoundary = ({ children, fallback }) => (
  <ErrorBoundary fallback={fallback}>
    {children}
  </ErrorBoundary>
);

// 📊 COMPONENTE DE ERROR PARA TABLAS
export const TableErrorBoundary = ({ children }) => (
  <ErrorBoundary
    fallback={
      <div className="text-center py-8">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-gray-600">Error al cargar los datos</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-primary-500 hover:text-primary-600"
        >
          Recargar página
        </button>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;