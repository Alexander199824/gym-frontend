// src/contexts/AuthContext.js
// UBICACIÓN: /gym-frontend/src/contexts/AuthContext.js
// FUNCIÓN: Manejo del estado global de autenticación CORREGIDO
// CAMBIOS: Eliminada redirección automática, retorna datos para que LoginPage maneje redirección
// 🆕 AGREGADO: canManageContent para gestión de contenido

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';

// 🏗️ ESTADO INICIAL
const initialState = {
  user: null,                    // Datos del usuario logueado
  isAuthenticated: false,        // ¿Está logueado?
  isLoading: true,              // ¿Cargando datos de auth?
  permissions: [],               // Permisos del usuario
  lastActivity: null,            // Última actividad del usuario
  sessionExpiry: null            // Cuándo expira la sesión
};

// 🎯 TIPOS DE ACCIONES
const ACTION_TYPES = {
  AUTH_START: 'AUTH_START',           // Iniciando proceso de auth
  AUTH_SUCCESS: 'AUTH_SUCCESS',       // Login exitoso
  AUTH_FAILURE: 'AUTH_FAILURE',       // Error en auth
  LOGOUT: 'LOGOUT',                   // Cerrar sesión
  UPDATE_USER: 'UPDATE_USER',         // Actualizar datos del usuario
  UPDATE_ACTIVITY: 'UPDATE_ACTIVITY', // Actualizar última actividad
  SET_LOADING: 'SET_LOADING'          // Cambiar estado de carga
};

// 🔄 REDUCER DE AUTENTICACIÓN
function authReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.AUTH_START:
      return {
        ...state,
        isLoading: true
      };
      
    case ACTION_TYPES.AUTH_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        permissions: getUserPermissions(action.payload.user.role),
        lastActivity: new Date(),
        sessionExpiry: calculateSessionExpiry()
      };
      
    case ACTION_TYPES.AUTH_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        permissions: [],
        lastActivity: null,
        sessionExpiry: null
      };
      
    case ACTION_TYPES.LOGOUT:
      return {
        ...initialState,
        isLoading: false
      };
      
    case ACTION_TYPES.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
      
    case ACTION_TYPES.UPDATE_ACTIVITY:
      return {
        ...state,
        lastActivity: new Date()
      };
      
    case ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
      
    default:
      return state;
  }
}

// 🔐 HELPER: Calcular permisos basados en el rol
function getUserPermissions(role) {
  const permissions = {
    // 👤 Permisos de Cliente
    cliente: [
      'view_own_profile',
      'edit_own_profile',
      'view_own_memberships',
      'view_own_payments',
      'upload_transfer_proof'
    ],
    
    // 👥 Permisos de Colaborador (incluye cliente + más)
    colaborador: [
      'view_own_profile',
      'edit_own_profile',
      'view_own_memberships',
      'view_own_payments',
      'upload_transfer_proof',
      'view_users',
      'create_users',
      'edit_users',
      'view_memberships',
      'create_memberships',
      'edit_memberships',
      'view_payments',
      'create_payments',
      'view_expired_memberships',
      'register_daily_income'
    ],
    
    // 🔧 Permisos de Admin (todos los permisos)
    admin: [
      'view_own_profile',
      'edit_own_profile',
      'view_own_memberships',
      'view_own_payments',
      'upload_transfer_proof',
      'view_users',
      'create_users',
      'edit_users',
      'delete_users',
      'manage_user_roles',
      'view_memberships',
      'create_memberships',
      'edit_memberships',
      'delete_memberships',
      'view_payments',
      'create_payments',
      'validate_transfers',
      'view_expired_memberships',
      'register_daily_income',
      'view_reports',
      'view_statistics',
      'manage_system_settings',
      'manage_content',           // 🆕 Permiso para gestionar contenido
      'manage_services',          // 🆕 Permiso para gestionar servicios
      'manage_products',          // 🆕 Permiso para gestionar productos
      'manage_plans',             // 🆕 Permiso para gestionar planes
      'manage_branding',          // 🆕 Permiso para gestionar branding
      'manage_media'              // 🆕 Permiso para gestionar multimedia
    ]
  };
  
  return permissions[role] || permissions.cliente;
}

// 📅 HELPER: Calcular cuándo expira la sesión
function calculateSessionExpiry() {
  const expireDays = parseInt(process.env.REACT_APP_TOKEN_EXPIRY) || 7;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + expireDays);
  return expiry;
}

// 🏠 HELPER: Determinar ruta de dashboard según rol - MOVIDO AQUÍ
function getDashboardPath(role) {
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
}

// 🏗️ CREAR CONTEXTOS
const AuthContext = createContext();
const AuthDispatchContext = createContext();

// 🎣 HOOK PERSONALIZADO PARA USAR EL CONTEXTO DE AUTH
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

export function useAuthActions() {
  const dispatch = useContext(AuthDispatchContext);
  if (!dispatch) {
    throw new Error('useAuthActions debe usarse dentro de AuthProvider');
  }
  return dispatch;
}

// 🏭 PROVIDER DE AUTENTICACIÓN
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // 🚀 EFECTO: Verificar autenticación al iniciar
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  // ⏰ EFECTO: Monitorear actividad del usuario
  useEffect(() => {
    if (state.isAuthenticated) {
      const activityTimer = setInterval(() => {
        updateActivity();
      }, 60000); // Cada minuto
      
      return () => clearInterval(activityTimer);
    }
  }, [state.isAuthenticated]);
  
  // ⚡ FUNCIONES DE AUTENTICACIÓN
  
  // Verificar estado de autenticación
  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY);
      
      if (!token) {
        dispatch({ type: ACTION_TYPES.AUTH_FAILURE });
        return;
      }
      
      // Verificar token con el servidor
      const response = await apiService.getProfile();
      
      if (response.success && response.data.user) {
        dispatch({ 
          type: ACTION_TYPES.AUTH_SUCCESS, 
          payload: response.data 
        });
      } else {
        dispatch({ type: ACTION_TYPES.AUTH_FAILURE });
      }
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      dispatch({ type: ACTION_TYPES.AUTH_FAILURE });
    }
  };
  
  // ✅ CORREGIDO: Iniciar sesión - SIN redirección automática
  const login = async (credentials) => {
    try {
      dispatch({ type: ACTION_TYPES.AUTH_START });
      
      console.log('🔑 Iniciando login con credenciales:', { email: credentials.email });
      
      const response = await apiService.login(credentials);
      
      if (response.success && response.data.user) {
        console.log('✅ Login exitoso:', {
          userId: response.data.user.id,
          userRole: response.data.user.role,
          userName: `${response.data.user.firstName} ${response.data.user.lastName}`
        });
        
        dispatch({ 
          type: ACTION_TYPES.AUTH_SUCCESS, 
          payload: response.data 
        });
        
        // ✅ RETORNAR DATOS INCLUYENDO RUTA DE REDIRECCIÓN
        const redirectPath = getDashboardPath(response.data.user.role);
        
        return {
          success: true,
          user: response.data.user,
          redirectPath,
          message: 'Login exitoso'
        };
      } else {
        dispatch({ type: ACTION_TYPES.AUTH_FAILURE });
        throw new Error(response.message || 'Error en el login');
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      dispatch({ type: ACTION_TYPES.AUTH_FAILURE });
      throw error;
    }
  };
  
  // Registrarse
  const register = async (userData) => {
    try {
      dispatch({ type: ACTION_TYPES.AUTH_START });
      
      console.log('📝 Iniciando registro:', {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName
      });
      
      const response = await apiService.register(userData);
      
      if (response.success && response.data.user) {
        console.log('✅ Registro exitoso:', {
          userId: response.data.user.id,
          userRole: response.data.user.role
        });
        
        dispatch({ 
          type: ACTION_TYPES.AUTH_SUCCESS, 
          payload: response.data 
        });
        
        // ✅ RETORNAR DATOS INCLUYENDO RUTA DE REDIRECCIÓN
        const redirectPath = getDashboardPath(response.data.user.role);
        
        return {
          success: true,
          user: response.data.user,
          redirectPath,
          message: 'Registro exitoso'
        };
      } else {
        dispatch({ type: ACTION_TYPES.AUTH_FAILURE });
        throw new Error(response.message || 'Error en el registro');
      }
    } catch (error) {
      console.error('❌ Error en registro:', error);
      dispatch({ type: ACTION_TYPES.AUTH_FAILURE });
      throw error;
    }
  };
  
  // Cerrar sesión
  const logout = () => {
    localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY);
    dispatch({ type: ACTION_TYPES.LOGOUT });
    toast.success('Sesión cerrada exitosamente');
    
    // ✅ REDIRECCIÓN CONTROLADA - solo al login
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
  };
  
  // Actualizar perfil del usuario
  const updateProfile = async (profileData) => {
    try {
      const response = await apiService.updateProfile(profileData);
      
      if (response.success) {
        dispatch({ 
          type: ACTION_TYPES.UPDATE_USER, 
          payload: response.data.user 
        });
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };
  
  // Actualizar actividad del usuario
  const updateActivity = () => {
    dispatch({ type: ACTION_TYPES.UPDATE_ACTIVITY });
  };
  
  // 🔒 HELPER: Verificar si el usuario tiene un permiso específico
  const hasPermission = (permission) => {
    return state.permissions.includes(permission);
  };
  
  // 👤 HELPER: Verificar si el usuario tiene un rol específico
  const hasRole = (role) => {
    return state.user?.role === role;
  };
  
  // 🎨 HELPER: Verificar si puede gestionar contenido de la web
  const canManageContent = () => {
    // Los admins pueden gestionar todo el contenido
    if (hasRole('admin')) return true;
    
    // También se puede dar este permiso específico a otros roles
    return hasPermission('manage_content') || 
           hasPermission('manage_system_settings');
  };
  
  // 🏪 HELPER: Verificar si puede gestionar productos de la tienda
  const canManageStore = () => {
    return hasRole('admin') || 
           hasPermission('manage_products') || 
           hasPermission('manage_store');
  };
  
  // 🎯 HELPER: Verificar si puede gestionar servicios
  const canManageServices = () => {
    return hasRole('admin') || 
           hasPermission('manage_services') || 
           hasPermission('manage_content');
  };
  
  // 🎫 HELPER: Verificar si puede gestionar planes de membresía
  const canManagePlans = () => {
    return hasRole('admin') || 
           hasPermission('manage_plans') || 
           hasPermission('manage_memberships');
  };
  
  // 🔋 HELPER: Verificar si la sesión está próxima a expirar
  const isSessionExpiring = () => {
    if (!state.sessionExpiry) return false;
    
    const now = new Date();
    const expiry = new Date(state.sessionExpiry);
    const diffHours = (expiry - now) / (1000 * 60 * 60);
    
    return diffHours <= 24; // Expira en menos de 24 horas
  };
  
  // ✅ NUEVA FUNCIÓN: Obtener ruta de dashboard para rol específico
  const getDashboardPathForRole = (role) => {
    return getDashboardPath(role);
  };
  
  // 📦 VALOR DEL CONTEXTO
  const contextValue = {
    // Estado
    ...state,
    
    // Funciones de autenticación
    login,
    register,
    logout,
    updateProfile,
    updateActivity,
    checkAuthStatus,
    
    // Funciones de utilidad
    hasPermission,
    hasRole,
    isSessionExpiring,
    getDashboardPathForRole,
    
    // 🆕 FUNCIONES DE GESTIÓN DE CONTENIDO
    canManageContent,     // ✅ Gestionar contenido web general
    canManageStore,       // ✅ Gestionar productos de la tienda
    canManageServices,    // ✅ Gestionar servicios del gimnasio
    canManagePlans,       // ✅ Gestionar planes de membresía
    
    // Información adicional
    userRole: state.user?.role,
    userName: state.user ? `${state.user.firstName} ${state.user.lastName}` : null,
    userEmail: state.user?.email
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      <AuthDispatchContext.Provider value={dispatch}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthContext.Provider>
  );
}

// 🛡️ COMPONENTE HOC: Proteger rutas que requieren autenticación
export function withAuth(Component, requiredPermissions = []) {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading, hasPermission } = useAuth();
    
    if (isLoading) {
      return (
        <div className="center-content min-h-screen">
          <div className="loading-pulse w-8 h-8 rounded-full"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      window.location.href = '/login';
      return null;
    }
    
    // Verificar permisos específicos
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(permission => 
        hasPermission(permission)
      );
      
      if (!hasAllPermissions) {
        return (
          <div className="center-content min-h-screen">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-secondary-900 mb-2">
                Acceso Denegado
              </h2>
              <p className="text-secondary-600">
                No tienes permisos para acceder a esta página.
              </p>
            </div>
          </div>
        );
      }
    }
    
    return <Component {...props} />;
  };
}

// 📝 CAMBIOS REALIZADOS:
// ✅ Agregado canManageContent() que retorna true para admins
// ✅ Agregados permisos específicos de gestión de contenido
// ✅ Agregadas funciones canManageStore, canManageServices, canManagePlans
// ✅ Mantiene TODA la funcionalidad original del AuthContext