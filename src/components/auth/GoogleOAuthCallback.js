// src/components/auth/GoogleOAuthCallback.js
// FUNCIÓN: Componente para manejar el callback de Google OAuth
// RUTA: /auth/google-success

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle, Dumbbell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import GymLogo from '../common/GymLogo';
import useGymConfig from '../../hooks/useGymConfig';

const GoogleOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useApp();
  const { refreshUserData } = useAuth();
  const { config } = useGymConfig();
  
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Procesando autenticación con Google...');
  const [userInfo, setUserInfo] = useState(null);

  // 🏠 Obtener ruta de dashboard según rol
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
        // 📝 Extraer parámetros de la URL
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refresh');
        const role = searchParams.get('role');
        const userId = searchParams.get('userId');
        const name = searchParams.get('name');
        const email = searchParams.get('email');
        const loginType = searchParams.get('loginType');
        const error = searchParams.get('error');
        const errorMessage = searchParams.get('message');

        // ❌ Verificar si hay errores
        if (error) {
          console.error('❌ Error en OAuth Google:', errorMessage);
          setStatus('error');
          setMessage(errorMessage || 'Error en la autenticación con Google');
          showError(errorMessage || 'Error al iniciar sesión con Google');
          
          // Redirigir al login después de 3 segundos
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
          return;
        }

        // ✅ Verificar que tenemos todos los datos necesarios
        if (!token || !refreshToken || !loginType || loginType !== 'google') {
          console.error('❌ Datos incompletos en callback OAuth');
          setStatus('error');
          setMessage('Datos de autenticación incompletos');
          showError('Error: Datos de autenticación incompletos');
          
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
          return;
        }

        // 🎯 Procesar datos del usuario
        const decodedName = name ? decodeURIComponent(name.replace(/\+/g, ' ')) : '';
        const decodedEmail = email ? decodeURIComponent(email) : '';
        
        setUserInfo({
          name: decodedName,
          email: decodedEmail,
          role: role,
          id: userId
        });

        console.log('🎉 OAuth Google exitoso:', {
          userId,
          name: decodedName,
          email: decodedEmail,
          role
        });

        // 💾 Guardar tokens en localStorage
        const tokenKey = process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token';
        localStorage.setItem(tokenKey, token);
        localStorage.setItem('elite_fitness_refresh_token', refreshToken);
        localStorage.setItem('elite_fitness_user_role', role);
        localStorage.setItem('elite_fitness_user_id', userId);
        
        // 🔄 Actualizar datos del usuario en el contexto
        if (refreshUserData) {
          await refreshUserData();
        }

        // ✅ Marcar como exitoso
        setStatus('success');
        setMessage(`¡Bienvenido, ${decodedName}!`);
        showSuccess(`¡Autenticación exitosa! Bienvenido, ${decodedName}`);

        // 🎯 Redirigir al dashboard correspondiente
        const redirectPath = getDashboardPathByRole(role);
        
        // Verificar si había una ruta pendiente de redirección
        const pendingRedirect = sessionStorage.getItem('oauth_redirect_after_login');
        const finalRedirect = pendingRedirect || redirectPath;
        
        // Limpiar redirección pendiente
        sessionStorage.removeItem('oauth_redirect_after_login');

        console.log('🚀 Redirigiendo a:', finalRedirect);

        // Redirigir después de mostrar el éxito
        setTimeout(() => {
          navigate(finalRedirect, { replace: true });
        }, 2000);

      } catch (error) {
        console.error('❌ Error procesando callback OAuth:', error);
        setStatus('error');
        setMessage('Error interno al procesar la autenticación');
        showError('Error interno. Intenta iniciar sesión nuevamente.');
        
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    processGoogleCallback();
  }, [searchParams, navigate, showSuccess, showError, refreshUserData]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          
          {/* 🏠 Logo */}
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

          {/* 🔄 Estado: Procesando */}
          {status === 'processing' && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Procesando autenticación
              </h2>
              <p className="text-gray-600">
                {message}
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google OAuth</span>
              </div>
            </div>
          )}

          {/* ✅ Estado: Éxito */}
          {status === 'success' && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                ¡Autenticación exitosa!
              </h2>
              <p className="text-gray-600">
                {message}
              </p>
              {userInfo && (
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <h3 className="font-medium text-gray-900 mb-2">Datos de la cuenta:</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Nombre:</strong> {userInfo.name}</p>
                    <p><strong>Email:</strong> {userInfo.email}</p>
                    <p><strong>Rol:</strong> {userInfo.role}</p>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500">
                Redirigiendo al dashboard...
              </p>
            </div>
          )}

          {/* ❌ Estado: Error */}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Error de autenticación
              </h2>
              <p className="text-gray-600">
                {message}
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">
                  Serás redirigido a la página de login en unos segundos.
                </p>
              </div>
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="btn-primary w-full"
              >
                Volver al login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default GoogleOAuthCallback;