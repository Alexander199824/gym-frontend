// Autor: Alexander Echeverria
// src/components/common/ErrorBoundary.js

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para mostrar la interfaz de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Registro del error en la consola
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
    
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
            
            {/* Título principal */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Algo salió mal
            </h1>
            
            {/* Descripción del error */}
            <p className="text-gray-600 mb-8">
              Lo sentimos, ocurrió un error inesperado en la aplicación. Puedes intentar recargar la página o volver al inicio.
            </p>
            
            {/* Botones de acción para el usuario */}
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full btn-primary py-3 font-semibold flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recargar página
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full btn-secondary py-3 font-semibold flex items-center justify-center"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir al inicio
              </button>
            </div>
            
            {/* Información técnica detallada - solo en desarrollo */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Información técnica del error
                </summary>
                <div className="mt-4 p-4 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </div>
                  <div>
                    <strong>Rastreo de componentes:</strong>
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
==========================================
DOCUMENTACIÓN DEL COMPONENTE ErrorBoundary
==========================================

PROPÓSITO GENERAL:
Este componente implementa un Error Boundary de React que actúa como una red de seguridad
para capturar errores de JavaScript en cualquier lugar del árbol de componentes hijo.
Previene que errores inesperados bloqueen toda la aplicación del gimnasio y proporciona
una experiencia de recuperación amigable para los usuarios.

QUÉ MUESTRA AL USUARIO:
Cuando ocurre un error en la aplicación, el usuario ve:
- Pantalla de error amigable con icono de alerta triangular rojo
- Mensaje claro en español: "Algo salió mal" 
- Explicación simple: "ocurrió un error inesperado en la aplicación"
- Dos opciones de recuperación claramente visibles:
  * Botón azul "Recargar página" con icono de actualización
  * Botón gris "Ir al inicio" con icono de casa
- En modo desarrollo: Panel expandible con información técnica detallada
- Diseño centrado, responsive y profesional que mantiene la identidad visual

FUNCIONALIDADES PRINCIPALES:
- Captura automática de errores de React en componentes hijos
- Prevención de pantallas blancas o crashes completos de la aplicación
- Interfaz de recuperación intuitiva con opciones claras
- Logging detallado de errores para debugging
- Información técnica disponible solo para desarrolladores
- Mantenimiento de la experiencia de usuario durante fallos

ARCHIVOS A LOS QUE SE CONECTA:

COMPONENTES IMPORTADOS:
- 'lucide-react': Biblioteca de iconos
  * AlertTriangle: Icono de advertencia para mostrar error
  * RefreshCw: Icono de recarga para el botón de reinicio
  * Home: Icono de casa para el botón de inicio

ARCHIVOS QUE UTILIZAN ESTE COMPONENTE:
- src/App.js: Envuelve toda la aplicación para protección global
- src/components/layout/Layout.js: Protege el layout principal
- src/pages/admin/AdminDashboard.js: Protege panel de administración
- src/pages/client/ClientDashboard.js: Protege panel del cliente
- src/pages/store/Store.js: Protege la tienda y carrito de compras
- src/pages/auth/Login.js: Protege procesos de autenticación
- src/pages/checkout/Checkout.js: Protege el proceso de pago crítico

ESTRUCTURA TÍPICA EN LA APLICACIÓN:
```javascript
// En App.js
<ErrorBoundary>
  <Router>
    <AuthContextProvider>
      <CartContextProvider>
        <Routes>
          <!-- Toda la aplicación del gimnasio protegida -->
        </Routes>
      </CartContextProvider>
    </AuthContextProvider>
  </Router>
</ErrorBoundary>
```

CONTEXTOS Y SERVICIOS RELACIONADOS:
- src/contexts/AuthContext.js: Errores de autenticación
- src/contexts/CartContext.js: Errores del carrito de compras
- src/contexts/GymContext.js: Errores de datos del gimnasio
- src/services/apiService.js: Errores de comunicación con backend
- src/services/paymentService.js: Errores de procesamiento de pagos

MÉTODOS DEL CICLO DE VIDA DE REACT:
- getDerivedStateFromError(): Actualiza el estado cuando se detecta un error
- componentDidCatch(): Captura información detallada del error para logging
- render(): Muestra UI de error o componentes hijos normalmente

ESTADOS INTERNOS MANEJADOS:
- hasError: Boolean que controla si mostrar la UI de error
- error: Objeto completo del error capturado con mensaje y stack trace
- errorInfo: Información adicional incluyendo el árbol de componentes afectado

TIPOS DE ERRORES QUE CAPTURA:
- Errores de renderizado en componentes React
- Errores de JavaScript no manejados en componentes
- Problemas de estado inconsistente entre componentes
- Errores en el procesamiento de props o estado
- Fallos en la actualización de componentes
- Errores de referencias a objetos undefined o null

LIMITACIONES IMPORTANTES:
- NO captura errores en manejadores de eventos (onClick, onChange, etc.)
- NO captura errores en código asíncrono (setTimeout, promesas)
- NO captura errores durante el renderizado del servidor (SSR)
- NO captura errores en el propio ErrorBoundary

ESTRATEGIAS DE RECUPERACIÓN PARA EL USUARIO:
1. Recarga completa: window.location.reload()
   - Reinicia toda la aplicación desde cero
   - Limpia cualquier estado corrupto en memoria
   - Útil para errores de estado inconsistente

2. Navegación al inicio: window.location.href = '/'
   - Lleva al usuario a la página principal del gimnasio
   - Mantiene la sesión del usuario si está autenticado
   - Permite continuar usando otras funciones de la aplicación

DIFERENCIAS POR ENTORNO:
- DESARROLLO: Muestra información técnica completa con stack traces
- PRODUCCIÓN: Solo muestra interfaz amigable sin detalles técnicos

CASOS DE USO ESPECÍFICOS EN EL GIMNASIO:
- Errores durante la inscripción a clases
- Fallos en el procesamiento de pagos de membresías
- Problemas al cargar horarios de entrenadores
- Errores en la visualización de estadísticas del cliente
- Fallos en la carga de productos de la tienda
- Problemas con la reserva de equipamiento

INTEGRACIÓN CON MONITOREO:
- Errores registrados en console.error para debugging local
- Stack traces completos disponibles para análisis
- Información de componentes afectados para localizar problemas
- Preparado para integración con servicios como Sentry o LogRocket

BENEFICIOS PARA LA EXPERIENCIA DEL USUARIO:
- Previene pérdida total de funcionalidad de la aplicación
- Proporciona opciones claras de recuperación
- Mantiene la confianza del usuario con mensajes profesionales
- Reduce la frustración con soluciones inmediatas
- Preserva datos cuando es posible (sesión, carrito, etc.)

BENEFICIOS PARA DESARROLLO Y MANTENIMIENTO:
- Facilita la identificación de errores en producción
- Proporciona información detallada para fixing de bugs
- Mejora la estabilidad general de la aplicación
- Reduce tickets de soporte por errores inesperados
- Permite debugging más eficiente en desarrollo

Este componente es fundamental para mantener la profesionalidad y confiabilidad
de la aplicación del gimnasio, asegurando que los usuarios siempre tengan una
experiencia estable y opciones de recuperación ante cualquier problema técnico.
*/