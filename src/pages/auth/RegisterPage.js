// Autor: Alexander Echeverria
// Archivo: src/pages/auth/RegisterPage.js

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  CheckCircle,
  ArrowLeft,
  Check,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { ButtonSpinner } from '../../components/common/LoadingSpinner';
import GymLogo from '../../components/common/GymLogo';
import useGymConfig from '../../hooks/useGymConfig';

// Esquema de validación mejorado y estricto
const registerSchema = yup.object({
  firstName: yup
    .string()
    .required('El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
    .test('no-numbers', 'El nombre no puede contener números', (value) => {
      return value ? !/\d/.test(value) : true;
    })
    .test('no-special-chars', 'El nombre no puede contener caracteres especiales', (value) => {
      return value ? !/[!@#$%^&*(),.?":{}|<>]/.test(value) : true;
    }),
  lastName: yup
    .string()
    .required('El apellido es requerido')
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/, 'El apellido solo puede contener letras y espacios')
    .test('no-numbers', 'El apellido no puede contener números', (value) => {
      return value ? !/\d/.test(value) : true;
    })
    .test('no-special-chars', 'El apellido no puede contener caracteres especiales', (value) => {
      return value ? !/[!@#$%^&*(),.?":{}|<>]/.test(value) : true;
    }),
  email: yup
    .string()
    .required('El email es requerido')
    .email('El formato del email es inválido')
    .lowercase('El email debe estar en minúsculas')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El email debe tener un formato válido'),
  phone: yup
    .string()
    .required('El teléfono es requerido')
    .matches(/^[\+]?[\d\s\-\(\)]+$/, 'El teléfono solo puede contener números, espacios, guiones y paréntesis')
    .min(8, 'El teléfono debe tener al menos 8 dígitos')
    .test('valid-guatemala-phone', 'Formato de teléfono inválido para Guatemala', (value) => {
      if (!value) return true;
      // Remover espacios, guiones y paréntesis para validar
      const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
      // Formato Guatemala: +502 XXXX-XXXX o XXXX-XXXX
      return /^(\+502)?[2-9]\d{7}$/.test(cleanPhone);
    }),
  whatsapp: yup
    .string()
    .nullable()
    .notRequired()
    .test('valid-whatsapp', 'Formato de WhatsApp inválido para Guatemala', function(value) {
      if (!value || value.length === 0) return true; // Es opcional
      
      // Validar formato si se proporciona
      if (!/^[\+]?[\d\s\-\(\)]+$/.test(value)) {
        return this.createError({ message: 'El WhatsApp solo puede contener números, espacios, guiones y paréntesis' });
      }
      
      if (value.length < 8) {
        return this.createError({ message: 'El WhatsApp debe tener al menos 8 dígitos' });
      }
      
      const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
      if (!/^(\+502)?[2-9]\d{7}$/.test(cleanPhone)) {
        return this.createError({ message: 'Formato de WhatsApp inválido para Guatemala' });
      }
      
      return true;
    }),
  password: yup
    .string()
    .required('La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres')
    .matches(/^(?=.*[a-z])/, 'La contraseña debe contener al menos una letra minúscula')
    .matches(/^(?=.*[A-Z])/, 'La contraseña debe contener al menos una letra mayúscula')
    .matches(/^(?=.*\d)/, 'La contraseña debe contener al menos un número')
    .matches(/^(?=.*[!@#$%^&*(),.?":{}|<>])/, 'La contraseña debe contener al menos un carácter especial')
    .test('no-spaces', 'La contraseña no puede contener espacios', (value) => {
      return value ? !/\s/.test(value) : true;
    }),
  confirmPassword: yup
    .string()
    .required('Confirma tu contraseña')
    .oneOf([yup.ref('password')], 'Las contraseñas no coinciden'),
  dateOfBirth: yup
    .date()
    .nullable()
    .max(new Date(), 'La fecha de nacimiento no puede ser futura')
    .test('min-age', 'Debes tener al menos 12 años para registrarte', function(value) {
      if (!value) return true;
      const today = new Date();
      const birthDate = new Date(value);
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDifference = today.getMonth() - birthDate.getMonth();
      
      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1 >= 12;
      }
      return age >= 12;
    })
    .test('not-today', 'La fecha de nacimiento no puede ser hoy', function(value) {
      if (!value) return true;
      const today = new Date();
      const birthDate = new Date(value);
      return !(
        birthDate.getFullYear() === today.getFullYear() &&
        birthDate.getMonth() === today.getMonth() &&
        birthDate.getDate() === today.getDate()
      );
    }),
  acceptTerms: yup
    .boolean()
    .oneOf([true], 'Debes aceptar los términos y condiciones para continuar')
});

const RegisterPage = () => {
  const { register: registerUser, login } = useAuth();
  const { showError, showSuccess, isMobile } = useApp();
  const { config } = useGymConfig();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Estados locales del componente
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [oauthError, setOauthError] = useState(null);
  const [registrationMethod, setRegistrationMethod] = useState('credentials');
  
  // Configuración del formulario
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    trigger,
    clearErrors
  } = useForm({
    resolver: yupResolver(registerSchema),
    mode: 'onChange', // Validación en tiempo real
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
  
  // Observar campos para validación en tiempo real
  const password = watch('password');
  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const email = watch('email');
  const phone = watch('phone');
  
  // Manejar callback de OAuth Google
  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    
    if (token || error) {
      handleOAuthCallback();
    }
  }, [searchParams]);
  
  // Función para manejar callback de Google OAuth
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
    const isNewUser = searchParams.get('isNewUser');
    
    if (error) {
      if (error === 'user_exists') {
        setOauthError('Ya existe una cuenta con este email de Google.');
        showError('Ya tienes una cuenta con este email. Te redirigiremos al inicio de sesión.');
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Usuario ya registrado. Por favor inicia sesión.' 
            }
          });
        }, 3000);
      } else {
        setOauthError(message || 'Error en la autenticación con Google');
        showError(message || 'Error al registrarse con Google. Intenta nuevamente.');
      }
      setRegistrationMethod('credentials');
      setIsGoogleLoading(false);
      return;
    }
    
    if (token && refreshToken && loginType === 'google') {
      try {
        console.log('OAuth Google exitoso:', {
          role,
          userId,
          name: decodeURIComponent(name || ''),
          email: decodeURIComponent(email || ''),
          isNewUser
        });
        
        // Guardar tokens en localStorage
        localStorage.setItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token', token);
        localStorage.setItem('elite_fitness_refresh_token', refreshToken);
        localStorage.setItem('elite_fitness_user_role', role);
        localStorage.setItem('elite_fitness_user_id', userId);
        
        if (isNewUser === 'true') {
          setRegistrationComplete(true);
          showSuccess(`¡Bienvenido a Elite Fitness, ${decodeURIComponent(name || '')}! Tu cuenta ha sido creada exitosamente.`);
          
          // Redirigir después de 2 segundos
          setTimeout(() => {
            navigate(getDashboardPathByRole(role));
          }, 2000);
        } else {
          showSuccess(`¡Bienvenido de vuelta, ${decodeURIComponent(name || '')}!`);
          navigate(getDashboardPathByRole(role));
        }
        
      } catch (error) {
        console.error('Error procesando callback OAuth:', error);
        showError('Error al procesar la autenticación. Intenta nuevamente.');
        setRegistrationMethod('credentials');
        setIsGoogleLoading(false);
      }
    }
  };
  
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
  
  // Iniciar Google OAuth para registro
  const handleGoogleRegister = () => {
    try {
      setIsGoogleLoading(true);
      setOauthError(null);
      setRegistrationMethod('google');
      
      // Construir URL del backend para Google OAuth con parámetro de registro
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const googleRegisterUrl = `${baseUrl}/api/auth/google?mode=register`;
      
      console.log('Iniciando OAuth Google para registro:', googleRegisterUrl);
      
      // Redirigir a Google OAuth
      window.location.href = googleRegisterUrl;
      
    } catch (error) {
      console.error('Error al iniciar Google OAuth:', error);
      showError('Error al conectar con Google. Intenta nuevamente.');
      setIsGoogleLoading(false);
      setRegistrationMethod('credentials');
    }
  };
  
  // Manejar envío del formulario tradicional
  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      
      // Limpiar y preparar datos para el registro
      const registrationData = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        whatsapp: data.whatsapp?.trim() || data.phone.trim(),
        password: data.password,
        dateOfBirth: data.dateOfBirth || null,
        role: 'cliente'
      };
      
      console.log('Registrando usuario:', {
        ...registrationData,
        password: '[PROTECTED]'
      });
      
      await registerUser(registrationData);
      
      setRegistrationComplete(true);
      showSuccess('¡Registro exitoso! Bienvenido a Elite Fitness Club.');
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/dashboard/client');
      }, 2000);
      
    } catch (error) {
      console.error('Error en registro:', error);
      
      // Manejar errores específicos del backend
      if (error.response?.status === 409) {
        showError('Ya existe una cuenta con este email. Intenta iniciar sesión.');
      } else if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError(error.message || 'Error al registrar usuario. Intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Validador de fortaleza de contraseña mejorado
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '', checks: [] };
    
    const checks = [
      { test: /.{8,}/, label: 'Al menos 8 caracteres', passed: /.{8,}/.test(password) },
      { test: /[a-z]/, label: 'Una letra minúscula', passed: /[a-z]/.test(password) },
      { test: /[A-Z]/, label: 'Una letra mayúscula', passed: /[A-Z]/.test(password) },
      { test: /\d/, label: 'Un número', passed: /\d/.test(password) },
      { test: /[!@#$%^&*(),.?":{}|<>]/, label: 'Un carácter especial (!@#$%^&*)', passed: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
      { test: /^\S*$/, label: 'Sin espacios', passed: /^\S*$/.test(password) }
    ];
    
    const passedChecks = checks.filter(check => check.passed).length;
    const strength = passedChecks;
    
    const colors = [
      'bg-red-500',      // 0-1: Muy débil
      'bg-red-400',      // 1: Débil
      'bg-orange-500',   // 2: Regular
      'bg-yellow-500',   // 3: Aceptable
      'bg-blue-500',     // 4: Buena
      'bg-green-500',    // 5: Fuerte
      'bg-green-600'     // 6: Muy fuerte
    ];
    const labels = ['Muy débil', 'Débil', 'Regular', 'Aceptable', 'Buena', 'Fuerte', 'Muy fuerte'];
    
    return {
      strength,
      label: labels[strength] || '',
      color: colors[strength] || 'bg-gray-300',
      checks,
      percentage: Math.round((strength / 6) * 100)
    };
  };
  
  const passwordStrength = getPasswordStrength(password);
  
  // Función para obtener clase de validación en tiempo real
  const getFieldValidationClass = (fieldName, value) => {
    if (!value) return '';
    
    switch (fieldName) {
      case 'firstName':
      case 'lastName':
        return /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/.test(value) && value.length >= 2 
          ? 'border-green-300 bg-green-50' 
          : 'border-red-300 bg-red-50';
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) 
          ? 'border-green-300 bg-green-50' 
          : 'border-red-300 bg-red-50';
      case 'phone':
        const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
        return /^(\+502)?[2-9]\d{7}$/.test(cleanPhone) 
          ? 'border-green-300 bg-green-50' 
          : 'border-red-300 bg-red-50';
      default:
        return '';
    }
  };
  
  // Página de éxito
  if (registrationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Animación de éxito */}
          <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <CheckCircle className="w-10 h-10 text-success-600" />
          </div>
          
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">
            ¡Bienvenido a {config?.name || 'Elite Fitness'}!
          </h2>
          
          <p className="text-gray-600 mb-6">
            Tu cuenta ha sido creada exitosamente. Ahora eres parte de nuestra comunidad fitness.
          </p>
          
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
      
      {/* Header con navegación */}
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
                {config && config.logo && config.logo.url ? (
                  <img 
                    src={config.logo.url}
                    alt={config.logo.alt || 'Logo'}
                    className="h-10 w-auto object-contain sm:h-12"
                  />
                ) : (
                  <GymLogo size="md" variant="gradient" showText={false} />
                )}
                <span className="font-display font-bold text-lg text-gray-800 hidden sm:inline">
                  {config?.name || 'Elite Fitness Club'}
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
      
      {/* CONTENIDO PRINCIPAL */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          
          {/* Título y descripción */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">
              Únete a <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {config?.name || 'Elite Fitness'}
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-lg mx-auto">
              Comienza tu transformación hoy mismo. Crea tu cuenta y únete a nuestra comunidad.
            </p>
          </div>
          
          {/* Error de OAuth */}
          {oauthError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl max-w-2xl mx-auto">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Error de autenticación con Google
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    {oauthError}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* FORMULARIO DE REGISTRO */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            
            {/* BOTÓN DE GOOGLE OAUTH PARA REGISTRO */}
            <div className="mb-8">
              <button
                onClick={handleGoogleRegister}
                disabled={isGoogleLoading || isLoading}
                className="w-full flex items-center justify-center px-6 py-4 border border-gray-300 rounded-xl shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                  {isGoogleLoading ? 'Conectando con Google...' : 'Registrarse con Google'}
                </span>
              </button>
              
              <p className="text-center text-sm text-gray-500 mt-3">
                Registrarse con Google es rápido y seguro
              </p>
            </div>
            
            {/* Separador */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">
                  O registrarse con email
                </span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Nombres */}
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
                      className={`form-input pl-12 ${
                        errors.firstName ? 'form-input-error' : 
                        firstName ? getFieldValidationClass('firstName', firstName) : ''
                      }`}
                      placeholder="Juan"
                      disabled={isLoading || isGoogleLoading}
                      onChange={(e) => {
                        // Filtrar caracteres no permitidos en tiempo real
                        const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, '');
                        e.target.value = value;
                        register('firstName').onChange(e);
                      }}
                    />
                    {firstName && !errors.firstName && (
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                    )}
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
                      className={`form-input pl-12 ${
                        errors.lastName ? 'form-input-error' : 
                        lastName ? getFieldValidationClass('lastName', lastName) : ''
                      }`}
                      placeholder="Pérez"
                      disabled={isLoading || isGoogleLoading}
                      onChange={(e) => {
                        // Filtrar caracteres no permitidos en tiempo real
                        const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, '');
                        e.target.value = value;
                        register('lastName').onChange(e);
                      }}
                    />
                    {lastName && !errors.lastName && (
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  {errors.lastName && (
                    <p className="form-error">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
              
              {/* Email */}
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
                    className={`form-input pl-12 ${
                      errors.email ? 'form-input-error' : 
                      email ? getFieldValidationClass('email', email) : ''
                    }`}
                    placeholder="juan@email.com"
                    disabled={isLoading || isGoogleLoading}
                    autoComplete="email"
                  />
                  {email && !errors.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                </div>
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
              </div>
              
              {/* Teléfonos */}
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
                      className={`form-input pl-12 ${
                        errors.phone ? 'form-input-error' : 
                        phone ? getFieldValidationClass('phone', phone) : ''
                      }`}
                      placeholder="+502 1234-5678"
                      disabled={isLoading || isGoogleLoading}
                      onChange={(e) => {
                        // Permitir solo números, espacios, guiones, paréntesis y +
                        const value = e.target.value.replace(/[^0-9\s\-\(\)\+]/g, '');
                        e.target.value = value;
                        register('phone').onChange(e);
                      }}
                    />
                    {phone && !errors.phone && (
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  {errors.phone && (
                    <p className="form-error">{errors.phone.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: +502 XXXX-XXXX o XXXX-XXXX
                  </p>
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
                      disabled={isLoading || isGoogleLoading}
                      onChange={(e) => {
                        // Permitir solo números, espacios, guiones, paréntesis y +
                        const value = e.target.value.replace(/[^0-9\s\-\(\)\+]/g, '');
                        e.target.value = value;
                        register('whatsapp').onChange(e);
                      }}
                    />
                  </div>
                  {errors.whatsapp && (
                    <p className="form-error">{errors.whatsapp.message}</p>
                  )}
                </div>
              </div>
              
              {/* Fecha de nacimiento */}
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
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 12)).toISOString().split('T')[0]}
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>
                {errors.dateOfBirth && (
                  <p className="form-error">{errors.dateOfBirth.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Debes tener al menos 12 años para registrarte
                </p>
              </div>
              
              {/* Contraseñas */}
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
                      disabled={isLoading || isGoogleLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      disabled={isLoading || isGoogleLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  
                  {/* Indicador de fortaleza de contraseña mejorado */}
                  {password && (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${passwordStrength.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 font-medium min-w-0">
                          {passwordStrength.label}
                        </span>
                      </div>
                      
                      {/* Checklist de requisitos */}
                      <div className="grid grid-cols-1 gap-1">
                        {passwordStrength.checks.map((check, index) => (
                          <div key={index} className="flex items-center text-xs">
                            {check.passed ? (
                              <Check className="w-3 h-3 text-green-500 mr-2" />
                            ) : (
                              <X className="w-3 h-3 text-red-500 mr-2" />
                            )}
                            <span className={check.passed ? 'text-green-700' : 'text-red-700'}>
                              {check.label}
                            </span>
                          </div>
                        ))}
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
                      disabled={isLoading || isGoogleLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      disabled={isLoading || isGoogleLoading}
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
              
              {/* Términos y condiciones */}
              <div className="flex items-start space-x-3">
                <input
                  {...register('acceptTerms')}
                  type="checkbox"
                  id="acceptTerms"
                  className="form-checkbox mt-1"
                  disabled={isLoading || isGoogleLoading}
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
                  {' '}de {config?.name || 'Elite Fitness Club'}
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="form-error">{errors.acceptTerms.message}</p>
              )}
              
              {/* Botón de envío */}
              <button
                type="submit"
                disabled={isLoading || isSubmitting || isGoogleLoading}
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
          
          {/* Ya tienes cuenta */}
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

/*
=============================================================================
PROPÓSITO DEL COMPONENTE
=============================================================================

Este componente RegisterPage es la página principal de registro del sistema 
Elite Fitness Club. Permite a los nuevos usuarios crear una cuenta mediante 
dos métodos principales:

1. Registro rápido con Google OAuth (opción recomendada)
2. Registro tradicional con formulario completo

FUNCIONALIDADES PRINCIPALES:
- Integración con Google OAuth para registro rápido
- Validación estricta de formularios con react-hook-form y yup
- Validación en tiempo real con indicadores visuales
- Indicador de fortaleza de contraseña con checklist detallado
- Manejo inteligente de usuarios existentes con redirección al login
- Validaciones específicas para números de teléfono de Guatemala
- Filtrado automático de caracteres no permitidos
- Diseño responsivo y accesible

LO QUE VE EL USUARIO:
- Header con logo del gimnasio y navegación
- Título atractivo con gradiente del nombre del gimnasio
- Botón principal "Registrarse con Google" (opción rápida)
- Separador visual "O registrarse con email"
- Formulario completo con campos:
  * Nombres y apellidos (validación de solo letras)
  * Email (validación de formato)
  * Teléfono y WhatsApp (formato Guatemala)
  * Fecha de nacimiento (opcional, mínimo 12 años)
  * Contraseña con indicador de fortaleza
  * Confirmación de contraseña
  * Checkbox de términos y condiciones
- Indicadores visuales de validación en tiempo real
- Enlaces a términos y condiciones y política de privacidad
- Enlace para usuarios que ya tienen cuenta

FLUJO DE GOOGLE OAUTH:
- Si el usuario no existe: se crea automáticamente y se registra
- Si el usuario ya existe: se redirige al login con mensaje informativo
- Manejo de errores específicos de OAuth
- Guardado automático de tokens y redirección a dashboard

ARCHIVOS Y COMPONENTES CONECTADOS:
=============================================================================

CONTEXTOS UTILIZADOS:
- AuthContext (../../contexts/AuthContext)
  * Función registerUser() para registro tradicional
  * Función login() para casos de OAuth con usuario existente
  
- AppContext (../../contexts/AppContext)
  * showError() y showSuccess() para notificaciones
  * isMobile para detección de dispositivo móvil

HOOKS PERSONALIZADOS:
- useGymConfig (../../hooks/useGymConfig)
  * Configuración del gimnasio (logo, nombre, descripción)

COMPONENTES IMPORTADOS:
- ButtonSpinner (../../components/common/LoadingSpinner)
  * Spinner para estado de carga en botones
- GymLogo (../../components/common/GymLogo)
  * Logo por defecto cuando no hay configuración

RUTAS DE NAVEGACIÓN:
- "/" - Página principal del sitio
- "/login" - Página de inicio de sesión
- "/terms" - Términos y condiciones
- "/privacy" - Política de privacidad
- "/dashboard/client" - Dashboard de clientes (registro exitoso)
- "/dashboard/admin" - Dashboard de administradores
- "/dashboard/staff" - Dashboard de personal

INTEGRACIÓN CON BACKEND:
- Endpoint Google OAuth: ${API_URL}/api/auth/google?mode=register
- Endpoint registro tradicional: utiliza función registerUser() del contexto
- Manejo de parámetros de callback: token, role, userId, name, email, isNewUser
- Manejo de errores específicos: user_exists, invalid credentials, etc.

VALIDACIONES IMPLEMENTADAS:
- Nombres: solo letras y espacios, 2-50 caracteres
- Email: formato válido requerido
- Teléfono: formato Guatemala (+502 XXXX-XXXX)
- WhatsApp: opcional, mismo formato que teléfono
- Contraseña: 8+ caracteres, mayúscula, minúscula, número, carácter especial
- Fecha nacimiento: mínimo 12 años, no fecha futura
- Términos: aceptación obligatoria

CARACTERÍSTICAS ESPECIALES:
- Filtrado en tiempo real de caracteres no permitidos
- Validación visual inmediata con iconos de verificación
- Indicador de fortaleza de contraseña con barra de progreso
- Checklist detallado de requisitos de contraseña
- Formato automático de números telefónicos
- Manejo de estados de carga para ambos métodos de registro

Este componente es fundamental para la adquisición de nuevos usuarios y 
proporciona una experiencia de registro fluida tanto para usuarios que 
prefieren OAuth como para aquellos que prefieren el registro tradicional.
*/