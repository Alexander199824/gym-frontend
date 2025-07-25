// src/pages/auth/LoginPage.js
// FUNCIÓN: Login REAL con OAuth Google (SIN datos de prueba)
// CONECTA CON: Backend OAuth Google en /api/auth/google

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Dumbbell, 
  AlertCircle,
  ArrowLeft,
  Shield,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import GymLogo from '../../components/common/GymLogo';

const LoginPage = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const { showError, showSuccess } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // 📱 Estados locales
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [oauthError, setOauthError] = useState(null);
  
  // 🎯 Obtener ruta de redirección
  const from = location.state?.from?.pathname || '/dashboard';
  
  // 🔄 Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);
  
  // 🔍 Manejar callback de OAuth Google
  useEffect(() => {
    handleOAuthCallback();
  }, [searchParams]);
  
  // 🔐 Función para manejar callback de Google OAuth
  const handleOAuthCallback = async () => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refresh');
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const loginType = searchParams.get('loginType');
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    
    // ❌ Error en OAuth
    if (error) {
      setOauthError(message || 'Error en la autenticación con Google');
      showError(message || 'Error al iniciar sesión con Google. Intenta nuevamente.');
      return;
    }
    
    // ✅ OAuth exitoso
    if (token && refreshToken && loginType === 'google') {
      try {
        console.log('🎉 OAuth Google exitoso:', {
          role,
          userId,
          name: decodeURIComponent(name || ''),
          email: decodeURIComponent(email || '')
        });
        
        // Guardar tokens
        localStorage.setItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token', token);
        localStorage.setItem('elite_fitness_refresh_token', refreshToken);
        localStorage.setItem('elite_fitness_user_role', role);
        localStorage.setItem('elite_fitness_user_id', userId);
        
        // Actualizar contexto de autenticación
        // El AuthContext debería detectar el token y actualizar el estado
        showSuccess(`¡Bienvenido, ${decodeURIComponent(name || '')}!`);
        
        // Redirigir según el rol
        const redirectPath = getRoleRedirectPath(role);
        navigate(redirectPath, { replace: true });
        
      } catch (error) {
        console.error('Error procesando callback OAuth:', error);
        showError('Error al procesar la autenticación. Intenta nuevamente.');
      }
    }
  };
  
  // 🏠 Obtener ruta de redirección según rol
  const getRoleRedirectPath = (role) => {
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
  
  // 🔐 Iniciar Google OAuth
  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    setOauthError(null);
    
    // Redirigir directamente al endpoint OAuth del backend
    const googleLoginUrl = process.env.REACT_APP_API_URL 
      ? `${process.env.REACT_APP_API_URL}/api/auth/google`
      : 'http://localhost:5000/api/auth/google';
    
    console.log('🚀 Iniciando OAuth Google:', googleLoginUrl);
    window.location.href = googleLoginUrl;
  };
  
  // 📱 Mostrar estado de carga durante OAuth
  if (isLoading || isGoogleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <GymLogo size="xl" variant="gradient" showText={false} />
          <div className="mt-8">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto" />
            <p className="text-gray-600 mt-4">
              {isGoogleLoading ? 'Conectando con Google...' : 'Verificando autenticación...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      
      {/* 🏋️ LADO IZQUIERDO - Branding Elite Fitness */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12 bg-elite-gradient relative overflow-hidden">
        
        {/* Elementos decorativos */}
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-white bg-opacity-10 rounded-full"></div>
        <div className="absolute bottom-20 left-10 w-20 h-20 bg-white bg-opacity-10 rounded-full"></div>
        <div className="absolute top-1/2 right-20 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
        
        <div className="relative z-10 text-center text-white">
          {/* Logo Elite Fitness */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-white bg-opacity-20 backdrop-blur-lg rounded-3xl flex items-center justify-center">
              <Dumbbell className="w-12 h-12 text-white" />
            </div>
          </div>
          
          {/* Título principal */}
          <h1 className="text-5xl font-display font-bold mb-6">
            Elite Fitness Club
          </h1>
          
          {/* Subtítulo */}
          <p className="text-2xl font-light mb-12 opacity-90">
            Transforma tu cuerpo, eleva tu mente
          </p>
          
          {/* Características */}
          <div className="space-y-6 max-w-md mx-auto">
            <div className="flex items-center justify-center space-x-4">
              <div className="w-3 h-3 bg-white rounded-full opacity-80"></div>
              <span className="text-lg">Entrenamiento personalizado</span>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-3 h-3 bg-white rounded-full opacity-80"></div>
              <span className="text-lg">Equipos de última generación</span>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-3 h-3 bg-white rounded-full opacity-80"></div>
              <span className="text-lg">Resultados garantizados</span>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-3 h-3 bg-white rounded-full opacity-80"></div>
              <span className="text-lg">Comunidad fitness elite</span>
            </div>
          </div>
          
          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-white border-opacity-20">
            <div className="text-center">
              <div className="text-3xl font-bold">2000+</div>
              <div className="text-sm opacity-80">Miembros</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">50+</div>
              <div className="text-sm opacity-80">Entrenadores</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">15+</div>
              <div className="text-sm opacity-80">Años</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 📱 LADO DERECHO - Formulario OAuth */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 bg-white relative">
        
        {/* Botón de volver (móvil) */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Link 
            to="/"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </Link>
        </div>
        
        <div className="mx-auto w-full max-w-md">
          
          {/* 🏠 Logo móvil */}
          <div className="flex justify-center mb-8 lg:hidden">
            <GymLogo size="lg" variant="gradient" showText={false} />
          </div>
          
          {/* 📝 Título */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-3">
              Bienvenido de vuelta
            </h2>
            <p className="text-gray-600 text-lg">
              Inicia sesión en tu cuenta Elite Fitness
            </p>
          </div>
          
          {/* ❌ Error de OAuth */}
          {oauthError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Error de autenticación
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    {oauthError}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* 🔐 BOTÓN DE GOOGLE OAUTH */}
          <div className="space-y-6">
            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center px-6 py-4 border border-gray-300 rounded-xl shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-3" />
              ) : (
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span className="text-lg font-semibold">
                {isGoogleLoading ? 'Conectando...' : 'Continuar con Google'}
              </span>
            </button>
            
            {/* 💡 Información adicional */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Usa tu cuenta de Google para acceder de forma segura
              </p>
              <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-1" />
                  <span>Seguro</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span>Rápido</span>
                </div>
                <div className="flex items-center">
                  <Lock className="w-4 h-4 mr-1" />
                  <span>Privado</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 🔗 Enlaces adicionales */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              ¿No tienes una cuenta?
            </p>
            <Link 
              to="/register" 
              className="btn-outline w-full"
            >
              Crear cuenta gratis
            </Link>
          </div>
          
          {/* 🔙 Volver al inicio */}
          <div className="mt-6 text-center">
            <Link 
              to="/" 
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Volver a Elite Fitness Club
            </Link>
          </div>
          
          {/* 🛠️ Información técnica (solo en desarrollo) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm font-semibold text-blue-800">
                  Información de desarrollo
                </span>
              </div>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Backend URL:</strong> {process.env.REACT_APP_API_URL || 'http://localhost:5000'}</p>
                <p><strong>OAuth Endpoint:</strong> /api/auth/google</p>
                <p><strong>Estado:</strong> {isGoogleLoading ? 'Cargando' : 'Listo'}</p>
                {oauthError && <p><strong>Error:</strong> {oauthError}</p>}
              </div>
            </div>
          )}
          
        </div>
      </div>
      
    </div>
  );
};

export default LoginPage;