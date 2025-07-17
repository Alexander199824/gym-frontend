// src/pages/auth/RegisterPage.js
// UBICACIÓN: /gym-frontend/src/pages/auth/RegisterPage.js
// FUNCIÓN: Página de registro Elite Fitness - Corregida y actualizada
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
  ArrowLeft,
  Shield,
  Star,
  Trophy
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
        whatsapp: data.whatsapp || data.phone,
        password: data.password,
        dateOfBirth: data.dateOfBirth || null,
        role: 'cliente'
      };
      
      await registerUser(registrationData);
      
      setRegistrationComplete(true);
      showSuccess('¡Registro exitoso! Bienvenido a Elite Fitness Club.');
      
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
    
    const colors = ['bg-danger-500', 'bg-warning-500', 'bg-warning-400', 'bg-primary-500', 'bg-success-500'];
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
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Animación de éxito */}
          <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <CheckCircle className="w-10 h-10 text-success-600" />
          </div>
          
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">
            ¡Bienvenido a Elite Fitness!
          </h2>
          
          <p className="text-gray-600 mb-6">
            Tu cuenta ha sido creada exitosamente. Ahora eres parte de la comunidad fitness más elite de Guatemala.
          </p>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-center text-sm text-gray-600">
              <Trophy className="w-4 h-4 text-primary-500 mr-2" />
              Primera semana gratis incluida
            </div>
            <div className="flex items-center justify-center text-sm text-gray-600">
              <Star className="w-4 h-4 text-secondary-500 mr-2" />
              Evaluación física gratuita
            </div>
            <div className="flex items-center justify-center text-sm text-gray-600">
              <Shield className="w-4 h-4 text-success-500 mr-2" />
              Plan personalizado incluido
            </div>
          </div>
          
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            Redirigiendo a tu dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* 🔝 Header con navegación */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo y volver */}
            <div className="flex items-center space-x-4">
              <Link 
                to="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Volver</span>
              </Link>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-elite-gradient rounded-xl flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-bold text-lg text-gray-800 hidden sm:inline">
                  Elite Fitness Club
                </span>
              </div>
            </div>
            
            {/* Ya tienes cuenta */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 text-sm hidden sm:inline">¿Ya tienes cuenta?</span>
              <Link to="/login" className="btn-ghost">
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* 📝 CONTENIDO PRINCIPAL */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          
          {/* 📝 Título y descripción */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">
              Únete a <span className="text-gradient-elite">Elite Fitness</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-lg mx-auto">
              Comienza tu transformación hoy mismo. Primera semana gratis para nuevos miembros.
            </p>
          </div>
          
          {/* 🏆 Beneficios destacados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="text-center p-4 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Primera semana gratis</h3>
              <p className="text-sm text-gray-600">Conoce nuestras instalaciones sin compromiso</p>
            </div>
            
            <div className="text-center p-4 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-secondary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Evaluación gratuita</h3>
              <p className="text-sm text-gray-600">Análisis completo de tu estado físico</p>
            </div>
            
            <div className="text-center p-4 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-success-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Plan personalizado</h3>
              <p className="text-sm text-gray-600">Diseñado específicamente para ti</p>
            </div>
          </div>
          
          {/* 📝 FORMULARIO DE REGISTRO */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* 👤 Nombres */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="form-group">
                  <label htmlFor="firstName" className="form-label form-label-required">
                    Nombre
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      {...register('firstName')}
                      type="text"
                      id="firstName"
                      className={`form-input pl-12 ${errors.firstName ? 'form-input-error' : ''}`}
                      placeholder="Juan"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="form-error">{errors.firstName.message}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="lastName" className="form-label form-label-required">
                    Apellido
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      {...register('lastName')}
                      type="text"
                      id="lastName"
                      className={`form-input pl-12 ${errors.lastName ? 'form-input-error' : ''}`}
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
                    className={`form-input pl-12 ${errors.email ? 'form-input-error' : ''}`}
                    placeholder="juan@email.com"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
              </div>
              
              {/* 📞 Teléfonos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="form-group">
                  <label htmlFor="phone" className="form-label form-label-required">
                    Teléfono
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      {...register('phone')}
                      type="tel"
                      id="phone"
                      className={`form-input pl-12 ${errors.phone ? 'form-input-error' : ''}`}
                      placeholder="+502 1234-5678"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.phone && (
                    <p className="form-error">{errors.phone.message}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="whatsapp" className="form-label">
                    WhatsApp <span className="text-gray-500">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      {...register('whatsapp')}
                      type="tel"
                      id="whatsapp"
                      className={`form-input pl-12 ${errors.whatsapp ? 'form-input-error' : ''}`}
                      placeholder="Mismo que teléfono"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.whatsapp && (
                    <p className="form-error">{errors.whatsapp.message}</p>
                  )}
                </div>
              </div>
              
              {/* 📅 Fecha de nacimiento */}
              <div className="form-group">
                <label htmlFor="dateOfBirth" className="form-label">
                  Fecha de nacimiento <span className="text-gray-500">(Opcional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    {...register('dateOfBirth')}
                    type="date"
                    id="dateOfBirth"
                    className={`form-input pl-12 ${errors.dateOfBirth ? 'form-input-error' : ''}`}
                    max={new Date().toISOString().split('T')[0]}
                    disabled={isLoading}
                  />
                </div>
                {errors.dateOfBirth && (
                  <p className="form-error">{errors.dateOfBirth.message}</p>
                )}
              </div>
              
              {/* 🔒 Contraseñas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                      className={`form-input pl-12 pr-12 ${errors.password ? 'form-input-error' : ''}`}
                      placeholder="••••••••"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
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
                    <div className="mt-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 font-medium">
                          {passwordStrength.label}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {errors.password && (
                    <p className="form-error">{errors.password.message}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label form-label-required">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      className={`form-input pl-12 pr-12 ${errors.confirmPassword ? 'form-input-error' : ''}`}
                      placeholder="••••••••"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
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
              </div>
              
              {/* ✅ Términos y condiciones */}
              <div className="flex items-start space-x-3">
                <input
                  {...register('acceptTerms')}
                  type="checkbox"
                  id="acceptTerms"
                  className="form-checkbox mt-1"
                  disabled={isLoading}
                />
                <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                  Acepto los{' '}
                  <Link to="/terms" className="text-primary-600 hover:text-primary-500 font-medium">
                    términos y condiciones
                  </Link>
                  {' '}y la{' '}
                  <Link to="/privacy" className="text-primary-600 hover:text-primary-500 font-medium">
                    política de privacidad
                  </Link>
                  {' '}de Elite Fitness Club
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
                  <>
                    <ButtonSpinner />
                    <span className="ml-2">Creando tu cuenta...</span>
                  </>
                ) : (
                  'Crear mi cuenta gratis'
                )}
              </button>
              
            </form>
          </div>
          
          {/* 🔗 Ya tienes cuenta */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link 
                to="/login" 
                className="text-primary-600 hover:text-primary-500 font-medium transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;