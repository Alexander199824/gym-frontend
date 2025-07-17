// src/pages/auth/LoginPage.js
// UBICACIÓN: /gym-frontend/src/pages/auth/LoginPage.js
// FUNCIÓN: Página de inicio de sesión Elite Fitness - Corregida y actualizada
// CONECTA CON: AuthContext para login, backend /api/auth/login

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Dumbbell, 
  AlertCircle,
  ArrowLeft,
  Shield,
  Zap,
  Trophy
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { ButtonSpinner } from '../../components/common/LoadingSpinner';

// 📝 ESQUEMA DE VALIDACIÓN
const loginSchema = yup.object({
  email: yup
    .string()
    .required('El email es requerido')
    .email('Email inválido'),
  password: yup
    .string()
    .required('La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
});

const LoginPage = () => {
  const { login } = useAuth();
  const { showError } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 📱 Estados locales
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 🎯 Obtener ruta de redirección
  const from = location.state?.from?.pathname || '/dashboard';
  
  // 📋 Configuración del formulario
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });
  
  // 🔐 Manejar envío del formulario
  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      await login(data);
      // La redirección se maneja automáticamente en AuthContext
    } catch (error) {
      showError(
        error.response?.data?.message || 
        'Error al iniciar sesión. Verifica tus credenciales.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // 🔑 Datos de ejemplo para desarrollo
  const demoCredentials = [
    { 
      role: 'Administrador', 
      email: 'admin@elitefitness.com', 
      password: 'Admin123!',
      color: 'bg-danger-500',
      icon: Shield
    },
    { 
      role: 'Personal', 
      email: 'colaborador@elitefitness.com', 
      password: 'Staff123!',
      color: 'bg-primary-500',
      icon: Zap
    },
    { 
      role: 'Cliente', 
      email: 'cliente@elitefitness.com', 
      password: 'Client123!',
      color: 'bg-success-500',
      icon: Trophy
    }
  ];
  
  // ✅ Función para llenar credenciales demo
  const fillDemoCredentials = (email, password) => {
    setValue('email', email);
    setValue('password', password);
  };

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
      
      {/* 📱 LADO DERECHO - Formulario */}
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
            <div className="w-16 h-16 bg-elite-gradient rounded-2xl flex items-center justify-center">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
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
          
          {/* 🔐 FORMULARIO DE LOGIN */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* 📧 Campo de email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label form-label-required">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  name="email"
                  className={`form-input pl-12 ${errors.email ? 'form-input-error' : ''}`}
                  placeholder="tu@email.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>
            
            {/* 🔒 Campo de contraseña */}
            <div className="form-group">
              <label htmlFor="password" className="form-label form-label-required">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className={`form-input pl-12 pr-12 ${errors.password ? 'form-input-error' : ''}`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>
            
            {/* 🔗 Olvidé mi contraseña */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="form-checkbox"
                />
                <label htmlFor="remember-me" className="ml-3 text-sm text-gray-700">
                  Recordarme
                </label>
              </div>
              
              <Link 
                to="/forgot-password" 
                className="text-sm text-primary-600 hover:text-primary-500 font-medium transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            
            {/* 🔘 Botón de envío */}
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full btn-primary btn-lg"
            >
              {isLoading ? (
                <>
                  <ButtonSpinner />
                  <span className="ml-2">Iniciando sesión...</span>
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
            
          </form>
          
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
          
          {/* 🧪 CREDENCIALES DE DEMO (solo en desarrollo) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-5 h-5 text-primary-600 mr-2" />
                <span className="text-sm font-semibold text-gray-800">
                  Cuentas de Prueba
                </span>
              </div>
              <div className="space-y-3">
                {demoCredentials.map((cred, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => fillDemoCredentials(cred.email, cred.password)}
                    className="w-full flex items-center p-3 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-md"
                  >
                    <div className={`w-10 h-10 ${cred.color} rounded-lg flex items-center justify-center mr-3`}>
                      <cred.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium text-gray-900 text-sm">
                        {cred.role}
                      </div>
                      <div className="text-xs text-gray-600">
                        {cred.email}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Haz clic en cualquier tarjeta para usar esas credenciales
              </p>
            </div>
          )}
          
        </div>
      </div>
      
    </div>
  );
};

export default LoginPage;