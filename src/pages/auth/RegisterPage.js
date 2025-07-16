// src/pages/auth/RegisterPage.js
// UBICACIÓN: /gym-frontend/src/pages/auth/RegisterPage.js
// FUNCIÓN: Página de registro para nuevos usuarios (principalmente clientes)
// CONECTA CON: AuthContext para register, backend /api/auth/register

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Calendar,
  Dumbbell,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { ButtonSpinner } from '../../components/common/LoadingSpinner';

// 📝 ESQUEMA DE VALIDACIÓN
const registerSchema = yup.object({
  firstName: yup
    .string()
    .required('El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  lastName: yup
    .string()
    .required('El apellido es requerido')
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres'),
  email: yup
    .string()
    .required('El email es requerido')
    .email('Email inválido'),
  phone: yup
    .string()
    .required('El teléfono es requerido')
    .matches(/^[\+]?[\d\s\-\(\)]+$/, 'Formato de teléfono inválido'),
  whatsapp: yup
    .string()
    .nullable()
    .matches(/^[\+]?[\d\s\-\(\)]+$/, 'Formato de WhatsApp inválido'),
  password: yup
    .string()
    .required('La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  confirmPassword: yup
    .string()
    .required('Confirma tu contraseña')
    .oneOf([yup.ref('password')], 'Las contraseñas no coinciden'),
  dateOfBirth: yup
    .date()
    .nullable()
    .max(new Date(), 'La fecha de nacimiento no puede ser futura')
    .test('age', 'Debes ser mayor de 16 años', function(value) {
      if (!value) return true;
      const today = new Date();
      const birthDate = new Date(value);
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 16;
    }),
  acceptTerms: yup
    .boolean()
    .oneOf([true], 'Debes aceptar los términos y condiciones')
});

const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const { showError, showSuccess } = useApp();
  const navigate = useNavigate();
  
  // 📱 Estados locales
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  
  // 📋 Configuración del formulario
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch
  } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      whatsapp: '',
      password: '',
      confirmPassword: '',
      dateOfBirth: '',
      acceptTerms: false
    }
  });
  
  // 👀 Observar contraseña para validación en tiempo real
  const password = watch('password');
  
  // 🔐 Manejar envío del formulario
  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      
      // Preparar datos para el registro
      const registrationData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        whatsapp: data.whatsapp || data.phone, // Usar teléfono si no hay WhatsApp
        password: data.password,
        dateOfBirth: data.dateOfBirth || null,
        role: 'cliente' // Por defecto, los registros son clientes
      };
      
      await registerUser(registrationData);
      
      setRegistrationComplete(true);
      showSuccess('¡Registro exitoso! Bienvenido al sistema.');
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/dashboard/client');
      }, 2000);
      
    } catch (error) {
      showError(
        error.response?.data?.message || 
        'Error al registrar usuario. Intenta nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // 🔍 Validador de fortaleza de contraseña
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    const checks = [
      { test: /.{6,}/, label: 'Al menos 6 caracteres' },
      { test: /[a-z]/, label: 'Una minúscula' },
      { test: /[A-Z]/, label: 'Una mayúscula' },
      { test: /\d/, label: 'Un número' },
      { test: /[!@#$%^&*(),.?":{}|<>]/, label: 'Un carácter especial' }
    ];
    
    checks.forEach(check => {
      if (check.test.test(password)) strength++;
    });
    
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    const labels = ['Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'];
    
    return {
      strength,
      label: labels[strength - 1] || '',
      color: colors[strength - 1] || 'bg-gray-300',
      checks
    };
  };
  
  const passwordStrength = getPasswordStrength(password);
  
  // ✅ Página de éxito
  if (registrationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Registro exitoso!
          </h2>
          <p className="text-gray-600 mb-6">
            Tu cuenta ha sido creada correctamente. Serás redirigido al dashboard en unos segundos.
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        
        {/* 🏠 Logo y título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Crear cuenta
          </h2>
          <p className="text-gray-600">
            Únete a nuestro gimnasio y comienza tu transformación
          </p>
        </div>
        
        {/* 📝 FORMULARIO DE REGISTRO */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          
          {/* 👤 Nombres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="form-label form-label-required">
                Nombre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  {...register('firstName')}
                  type="text"
                  id="firstName"
                  className={`form-input pl-10 ${errors.firstName ? 'form-input-error' : ''}`}
                  placeholder="Juan"
                  disabled={isLoading}
                />
              </div>
              {errors.firstName && (
                <p className="form-error">{errors.firstName.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="lastName" className="form-label form-label-required">
                Apellido
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  {...register('lastName')}
                  type="text"
                  id="lastName"
                  className={`form-input pl-10 ${errors.lastName ? 'form-input-error' : ''}`}
                  placeholder="Pérez"
                  disabled={isLoading}
                />
              </div>
              {errors.lastName && (
                <p className="form-error">{errors.lastName.message}</p>
              )}
            </div>
          </div>
          
          {/* 📧 Email */}
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
                placeholder="juan@email.com"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="form-error">{errors.email.message}</p>
            )}
          </div>
          
          {/* 📞 Teléfonos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="form-label form-label-required">
                Teléfono
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  {...register('phone')}
                  type="tel"
                  id="phone"
                  className={`form-input pl-10 ${errors.phone ? 'form-input-error' : ''}`}
                  placeholder="+502 1234-5678"
                  disabled={isLoading}
                />
              </div>
              {errors.phone && (
                <p className="form-error">{errors.phone.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="whatsapp" className="form-label">
                WhatsApp
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  {...register('whatsapp')}
                  type="tel"
                  id="whatsapp"
                  className={`form-input pl-10 ${errors.whatsapp ? 'form-input-error' : ''}`}
                  placeholder="(Opcional)"
                  disabled={isLoading}
                />
              </div>
              {errors.whatsapp && (
                <p className="form-error">{errors.whatsapp.message}</p>
              )}
            </div>
          </div>
          
          {/* 📅 Fecha de nacimiento */}
          <div>
            <label htmlFor="dateOfBirth" className="form-label">
              Fecha de nacimiento
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              <input
                {...register('dateOfBirth')}
                type="date"
                id="dateOfBirth"
                className={`form-input pl-10 ${errors.dateOfBirth ? 'form-input-error' : ''}`}
                max={new Date().toISOString().split('T')[0]}
                disabled={isLoading}
              />
            </div>
            {errors.dateOfBirth && (
              <p className="form-error">{errors.dateOfBirth.message}</p>
            )}
          </div>
          
          {/* 🔒 Contraseña */}
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
            
            {/* 💪 Indicador de fortaleza de contraseña */}
            {password && (
              <div className="mt-2">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">
                    {passwordStrength.label}
                  </span>
                </div>
              </div>
            )}
            
            {errors.password && (
              <p className="form-error">{errors.password.message}</p>
            )}
          </div>
          
          {/* 🔒 Confirmar contraseña */}
          <div>
            <label htmlFor="confirmPassword" className="form-label form-label-required">
              Confirmar contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                className={`form-input pl-10 pr-10 ${errors.confirmPassword ? 'form-input-error' : ''}`}
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="form-error">{errors.confirmPassword.message}</p>
            )}
          </div>
          
          {/* ✅ Términos y condiciones */}
          <div className="flex items-start">
            <input
              {...register('acceptTerms')}
              type="checkbox"
              id="acceptTerms"
              className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              disabled={isLoading}
            />
            <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900">
              Acepto los{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500">
                términos y condiciones
              </a>
              {' '}y la{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500">
                política de privacidad
              </a>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="form-error">{errors.acceptTerms.message}</p>
          )}
          
          {/* 🔘 Botón de envío */}
          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="w-full btn-primary btn-lg"
          >
            {isLoading ? (
              <ButtonSpinner />
            ) : (
              'Crear cuenta'
            )}
          </button>
          
        </form>
        
        {/* 🔗 Enlace a login */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link 
              to="/login" 
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Inicia sesión aquí
            </Link>
          </p>
        </div>
        
      </div>
    </div>
  );
};

export default RegisterPage;