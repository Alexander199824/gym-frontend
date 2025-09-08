// Autor: Alexander Echeverria
// Archivo: src/components/auth/GoogleOAuthCallback.js


import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import GymLogo from '../common/GymLogo';
import useGymConfig from '../../hooks/useGymConfig';

const GoogleOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useApp();
  const { checkAuthStatus } = useAuth();
  const { config } = useGymConfig();
  
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Conectando con tu cuenta...');

  // Obtener ruta de dashboard según rol
  const getDashboardPathByRole = (role) => {
    switch (role) {
      case 'admin':
        return '/dashboard/admin';
      case 'colaborador':
        return '/dashboard/staff';
      case 'cliente':
        return '/dashboard/client';
      default:
        return '/dashboard';
    }
  };

  useEffect(() => {
    const processGoogleCallback = async () => {
      try {
        console.log('Iniciando procesamiento de Google OAuth callback...');
        
        // Extraer parámetros de la URL
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refresh');
        const role = searchParams.get('role');
        const userId = searchParams.get('userId');
        const name = searchParams.get('name');
        const email = searchParams.get('email');
        const loginType = searchParams.get('loginType');
        const error = searchParams.get('error');
        const errorMessage = searchParams.get('message');

        // Log solo información no sensible para debug
        console.log('Procesando autenticación:', {
          hasToken: !!token,
          hasRefreshToken: !!refreshToken,
          loginType,
          hasError: !!error
        });

        // Verificar si hay errores
        if (error) {
          console.error('Error en OAuth Google');
          setStatus('error');
          setMessage('No pudimos completar tu inicio de sesión');
          showError('Error al iniciar sesión con Google');
          
          setTimeout(() => {
            console.log('Redirigiendo a login por error...');
            navigate('/login', { replace: true });
          }, 3000);
          return;
        }

        // Verificar que tenemos todos los datos necesarios
        if (!token || !refreshToken || !loginType || loginType !== 'google') {
          console.error('Datos incompletos en callback OAuth');
          setStatus('error');
          setMessage('Datos de autenticación incompletos');
          showError('Error en la autenticación. Intenta nuevamente.');
          
          setTimeout(() => {
            console.log('Redirigiendo a login por datos incompletos...');
            navigate('/login', { replace: true });
          }, 3000);
          return;
        }

        // Procesar datos del usuario (sin exponerlos en la UI)
        const decodedName = name ? decodeURIComponent(name.replace(/\+/g, ' ')) : '';
        
        // Log seguro solo para debug (sin datos sensibles en producción)
        if (process.env.NODE_ENV === 'development') {
          console.log('OAuth Google exitoso para usuario');
        }

        // Guardar tokens en localStorage
        const tokenKey = process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token';
        console.log('Guardando autenticación...');
        localStorage.setItem(tokenKey, token);
        localStorage.setItem('elite_fitness_refresh_token', refreshToken);
        localStorage.setItem('elite_fitness_user_role', role);
        localStorage.setItem('elite_fitness_user_id', userId);
        console.log('Autenticación guardada');
        
        // Actualizar estado de autenticación
        setMessage('Configurando tu sesión...');
        console.log('Actualizando estado de autenticación...');
        if (checkAuthStatus && typeof checkAuthStatus === 'function') {
          await checkAuthStatus();
          console.log('Estado de autenticación actualizado');
        }

        // Marcar como exitoso (mensaje genérico y amigable)
        setStatus('success');
        setMessage('¡Perfecto! Ya estás conectado');
        
        // Mensaje de éxito amigable sin datos sensibles
        const firstName = decodedName.split(' ')[0] || 'Usuario';
        showSuccess(`¡Bienvenido de vuelta, ${firstName}!`);

        // Determinar ruta de redirección
        const redirectPath = getDashboardPathByRole(role);
        
        // Verificar si había una ruta pendiente de redirección
        const pendingRedirect = sessionStorage.getItem('oauth_redirect_after_login');
        const finalRedirect = pendingRedirect || redirectPath;
        
        // Limpiar redirección pendiente
        if (pendingRedirect) {
          sessionStorage.removeItem('oauth_redirect_after_login');
        }

        console.log('Preparando redirección...');

        // Redirección más rápida y directa
        const redirectTimer = setTimeout(() => {
          console.log('Ejecutando redirección...');
          navigate(finalRedirect, { replace: true });
        }, 1000); // Reducido a 1 segundo
        
        // Backup - si no redirige en 3 segundos, forzar
        const backupTimer = setTimeout(() => {
          console.warn('Redirección de backup ejecutándose...');
          window.location.href = finalRedirect;
        }, 3000);
        
        // Limpiar timers si el componente se desmonta
        return () => {
          clearTimeout(redirectTimer);
          clearTimeout(backupTimer);
        };

      } catch (error) {
        console.error('Error procesando callback OAuth');
        setStatus('error');
        setMessage('Hubo un problema técnico');
        showError('Error interno. Intenta iniciar sesión nuevamente.');
        
        setTimeout(() => {
          console.log('Redirigiendo a login por error interno...');
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    processGoogleCallback();
  }, [searchParams, navigate, showSuccess, showError, checkAuthStatus]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          
          {/* Logo */}
          <div className="flex justify-center mb-8">
            {config && config.logo && config.logo.url ? (
              <img 
                src={config.logo.url}
                alt={config.logo.alt || 'Logo'}
                className="h-20 w-auto object-contain"
              />
            ) : (
              <GymLogo size="lg" variant="gradient" showText={false} />
            )}
          </div>

          {/* Estado: Procesando */}
          {status === 'processing' && (
            <div className="space-y-6">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Iniciando sesión
                </h2>
                <p className="text-gray-600 text-lg">
                  {message}
                </p>
              </div>
              
              <div className="flex items-center justify-center space-x-3 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Conexión segura</span>
              </div>
              
              <div className="text-xs text-gray-400">
                Esto solo tomará unos segundos...
              </div>
            </div>
          )}

          {/* Estado: Éxito */}
          {status === 'success' && (
            <div className="space-y-6">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  ¡Listo!
                </h2>
                <p className="text-gray-600 text-lg">
                  {message}
                </p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 text-sm text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span>Accediendo a tu cuenta...</span>
                </div>
              </div>
              
              {/* Botón de redirección manual como backup */}
              <button
                onClick={() => {
                  const role = searchParams.get('role') || 'cliente';
                  const redirectPath = getDashboardPathByRole(role);
                  console.log('Redirección manual ejecutada');
                  navigate(redirectPath, { replace: true });
                }}
                className="btn-primary w-full"
              >
                Continuar
              </button>
            </div>
          )}

          {/* Estado: Error */}
          {status === 'error' && (
            <div className="space-y-6">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Ups, algo salió mal
                </h2>
                <p className="text-gray-600">
                  {message}
                </p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">
                  Te llevaremos de vuelta para intentar nuevamente.
                </p>
              </div>
              
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="btn-primary w-full"
              >
                Intentar nuevamente
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default GoogleOAuthCallback;

/*
EXPLICACIÓN DEL COMPONENTE:
=========================

PROPÓSITO:
Este componente maneja el callback de autenticación OAuth de Google. Se ejecuta cuando Google 
redirige al usuario de vuelta a la aplicación después del proceso de autenticación.

FUNCIONALIDAD PRINCIPAL:
1. Recibe y procesa los parámetros de autenticación de Google (token, refresh token, datos del usuario)
2. Valida que todos los datos necesarios estén presentes y sean correctos
3. Guarda los tokens de autenticación en localStorage de forma segura
4. Actualiza el estado de autenticación global de la aplicación
5. Redirige al usuario al dashboard correspondiente según su rol

CONEXIONES CON OTROS ARCHIVOS:
=============================

HOOKS Y CONTEXTOS:
- useAuth() desde '../../contexts/AuthContext' - Maneja el estado global de autenticación
- useApp() desde '../../contexts/AppContext' - Proporciona métodos para mostrar notificaciones
- useGymConfig() desde '../../hooks/useGymConfig' - Obtiene configuración del gimnasio (logo, etc.)

COMPONENTES:
- GymLogo desde '../common/GymLogo' - Logo del gimnasio usado como fallback
- Iconos de lucide-react (Loader2, CheckCircle, AlertCircle, Shield) - Para elementos de UI

RUTAS:
- /login - Ruta de redirección en caso de error
- /dashboard/admin - Dashboard para administradores
- /dashboard/staff - Dashboard para colaboradores  
- /dashboard/client - Dashboard para clientes

ESTADOS MANEJADOS:
- 'processing': Mientras se procesan los datos de Google
- 'success': Cuando la autenticación es exitosa
- 'error': Cuando hay algún problema en el proceso

SEGURIDAD:
- No expone datos sensibles en la interfaz de usuario
- Logs seguros que no muestran información personal en producción
- Validación estricta de todos los parámetros recibidos
- Manejo robusto de errores con redirecciones apropiadas

Este componente es crítico para el flujo de autenticación OAuth y debe mantener la 
seguridad como prioridad principal mientras proporciona una experiencia de usuario fluida.
*/