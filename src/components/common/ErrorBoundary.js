// src/components/common/ErrorBoundary.js
// FUNCIÓN: Componente para manejar errores de React

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el state para mostrar la UI de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log del error
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Icono de error */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            {/* Título */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Oops! Algo salió mal
            </h1>
            
            {/* Descripción */}
            <p className="text-gray-600 mb-8">
              Lo sentimos, ocurrió un error inesperado. Puedes intentar recargar la página o volver al inicio.
            </p>
            
            {/* Botones de acción */}
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full btn-primary py-3 font-semibold"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recargar página
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full btn-secondary py-3 font-semibold"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir al inicio
              </button>
            </div>
            
            {/* Información técnica (solo en desarrollo) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Información técnica
                </summary>
                <div className="mt-4 p-4 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </div>
                  <div>
                    <strong>Stack trace:</strong>
                    <pre className="whitespace-pre-wrap mt-1">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;