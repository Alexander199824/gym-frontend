// src/pages/auth/LoginPage.js
// UBICACIÓN: /gym-frontend/src/pages/auth/LoginPage.js
// FUNCIÓN: Página de inicio de sesión con email/contraseña
// CONECTA CON: AuthContext para login, backend /api/auth/login

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff, Mail, Lock, Dumbbell, AlertCircle } from 'lucide-react';
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
    formState: { errors, isSubmitting }
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
    { role: 'Administrador', email: 'admin@gym.com', password: 'Admin123!' },
    { role: 'Personal', email: 'colaborador@gym.com', password: 'Colaborador123!' },
    { role: 'Cliente', email: 'cliente@gym.com', password: 'Cliente123!' }
  ];
  
  // 📱 Función para usar credenciales de demo
  const useDemoCredentials = (email, password) => {
    const emailInput = document.querySelector('input[name="email"]');
    const passwordInput = document.querySelector('input[name="password"]');
    
    if (emailInput && passwordInput) {
      emailInput.value = email;
      passwordInput.value = password;
    }
  };

  return (
    <div className="min-h-screen flex">
      
      {/* 🏋️ LADO IZQUIERDO - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
              <Dumbbell className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Gym Management System
          </h1>
          <p className="text-xl text-primary-100 mb-8">
            Gestión integral para tu gimnasio
          </p>
          <div className="text-primary-200 space-y-2">
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-primary-200 rounded-full mr-3"></div>
              <span>Control de membresías</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-primary-200 rounded-full mr-3"></div>
              <span>Gestión de pagos</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-primary-200 rounded-full mr-3"></div>
              <span>Reportes y análisis</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 📱 LADO DERECHO - Formulario */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8 bg-gray-50">
        <div className="mx-auto w-full max-w-md">
          
          {/* 🏠 Logo móvil */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
          </div>
          
          {/* 📝 Título */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Iniciar sesión
            </h2>
            <p className="text-gray-600">
              Accede a tu cuenta para gestionar el gimnasio
            </p>
          </div>
          
          {/* 🔐 FORMULARIO DE LOGIN */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* 📧 Campo de email */}
            <div>
              <label htmlFor="email" className="form-label form-label-required">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className={`form-input pl-10 ${errors.email ? 'form-input-error' : ''}`}
                  placeholder="tu@email.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>
            
            {/* 🔒 Campo de contraseña */}
            <div>
              <label htmlFor="password" className="form-label form-label-required">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`form-input pl-10 pr-10 ${errors.password ? 'form-input-error' : ''}`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
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
            
            {/* 🔘 Botón de envío */}
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full btn-primary btn-lg"
            >
              {isLoading ? (
                <ButtonSpinner />
              ) : (
                'Iniciar sesión'
              )}
            </button>
            
          </form>
          
          {/* 🔗 Enlaces adicionales */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes una cuenta?{' '}
              <Link 
                to="/register" 
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
          
          {/* 🧪 CREDENCIALES DE DEMO (solo en desarrollo) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-yellow-800">
                  Credenciales de prueba
                </span>
              </div>
              <div className="space-y-2">
                {demoCredentials.map((cred, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => useDemoCredentials(cred.email, cred.password)}
                    className="w-full text-left px-3 py-2 text-xs bg-yellow-100 hover:bg-yellow-200 rounded border border-yellow-300 transition-colors"
                  >
                    <div className="font-medium text-yellow-800">{cred.role}</div>
                    <div className="text-yellow-700">{cred.email}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
        </div>
      </div>
      
    </div>
  );
};

export default LoginPage;