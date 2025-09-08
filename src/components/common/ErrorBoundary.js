// Autor: Alexander Echeverria
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

/*
DOCUMENTACIÓN DEL COMPONENTE ErrorBoundary

PROPÓSITO:
Este componente implementa un Error Boundary de React que captura errores de JavaScript
en cualquier lugar del árbol de componentes hijo, registra esos errores y muestra
una interfaz de usuario de respaldo en lugar de que se bloquee toda la aplicación.

FUNCIONALIDADES PRINCIPALES:
- Captura errores de React en componentes hijos
- Muestra interfaz de usuario de respaldo amigable
- Registra errores en consola para debugging
- Opciones de recuperación para el usuario
- Información técnica detallada en modo desarrollo
- Prevención de crashes completos de la aplicación

MÉTODOS DEL CICLO DE VIDA:
- getDerivedStateFromError(): Actualiza el state cuando ocurre un error
- componentDidCatch(): Captura el error y su información para logging

CONEXIONES CON OTROS ARCHIVOS:

COMPONENTES IMPORTADOS:
- Iconos de Lucide React: AlertTriangle, RefreshCw, Home

ARCHIVOS QUE USAN ESTE COMPONENTE:
- App.js: Envuelve toda la aplicación para captura global de errores
- Layout principal: Protege rutas y componentes principales
- Páginas críticas: Dashboard, checkout, autenticación

ESTRUCTURA DE LA APLICACIÓN:
```
<ErrorBoundary>
  <App>
    <Router>
      <Routes>
        <!-- Toda la aplicación protegida -->
      </Routes>
    </Router>
  </App>
</ErrorBoundary>
```

ESTADOS MANEJADOS:
- hasError: Boolean que indica si ocurrió un error
- error: Objeto del error capturado
- errorInfo: Información adicional del error (stack trace)

INTERFAZ DE USUARIO:
- Icono de alerta prominente
- Mensaje amigable en español
- Botón para recargar la página
- Botón para volver al inicio
- Panel expandible con información técnica (solo desarrollo)

CASOS DE USO:
- Errores de renderizado en componentes
- Errores de JavaScript no manejados
- Problemas de estado inconsistente
- Fallos en la carga de datos
- Errores de red o API
- Problemas de compatibilidad del navegador

BENEFICIOS:
- Mejora la experiencia del usuario ante errores
- Previene pantallas blancas o crashes
- Facilita el debugging en desarrollo
- Proporciona opciones de recuperación
- Mantiene la aplicación funcional parcialmente

LIMITACIONES:
- No captura errores en event handlers
- No captura errores en código asíncrono
- No captura errores durante el renderizado del servidor
- No captura errores en el propio error boundary

CONFIGURACIÓN POR ENTORNO:
- Desarrollo: Muestra información técnica detallada
- Producción: Solo muestra interfaz amigable sin detalles técnicos

ESTRATEGIAS DE RECUPERACIÓN:
- Reload completo de la página
- Navegación al inicio de la aplicación
- Preservación del estado cuando es posible

LOGGING Y MONITOREO:
- Errores registrados en console.error
- Stack traces completos disponibles
- Información de componentes afectados
- Facilita integración con servicios de monitoreo

ESTILOS Y DISEÑO:
- Diseño centrado y responsive
- Colores de alerta (rojo) para urgencia
- Botones prominentes para acciones
- Tipografía clara y legible
- Compatible con el sistema de diseño de la aplicación

INTEGRACIÓN CON EL SISTEMA:
- Protege componentes críticos como:
  - Sistema de carrito de compras
  - Procesamiento de pagos
  - Dashboards de usuarios
  - Formularios importantes
  - Navegación principal

Este componente es esencial para mantener la estabilidad y profesionalismo
de la aplicación del gimnasio, asegurando que los errores no interrumpan
completamente la experiencia del usuario.
*/