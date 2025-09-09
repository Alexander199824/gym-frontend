// Autor: Alexander Echeverria
// src/contexts/AuthContext.js
// FUNCIÓN: AuthContext MEJORADO con refreshUserData para OAuth
// CAMBIOS: Agregada función refreshUserData para compatibilidad con OAuth

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';

// ESTADO INICIAL
const initialState = {
  user: null,                    // Datos del usuario logueado
  isAuthenticated: false,        // ¿Está logueado?
  isLoading: true,              // ¿Cargando datos de auth?
  permissions: [],               // Permisos del usuario
  lastActivity: null,            // Última actividad del usuario
  sessionExpiry: null            // Cuándo expira la sesión
};

// TIPOS DE ACCIONES
const ACTION_TYPES = {
  AUTH_START: 'AUTH_START',           // Iniciando proceso de auth
  AUTH_SUCCESS: 'AUTH_SUCCESS',       // Login exitoso
  AUTH_FAILURE: 'AUTH_FAILURE',       // Error en auth
  LOGOUT: 'LOGOUT',                   // Cerrar sesión
  UPDATE_USER: 'UPDATE_USER',         // Actualizar datos del usuario
  UPDATE_ACTIVITY: 'UPDATE_ACTIVITY', // Actualizar última actividad
  SET_LOADING: 'SET_LOADING'          // Cambiar estado de carga
};

// REDUCER DE AUTENTICACIÓN
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

// HELPER: Calcular permisos basados en el rol - CORREGIDO PARA EVITAR ERRORES
function getUserPermissions(role) {
  const permissions = {
    // Permisos de Cliente
    cliente: [
      'view_own_profile',
      'edit_own_profile',
      'view_own_memberships',
      'view_own_payments',
      'upload_transfer_proof'
    ],
    
    // Permisos de Colaborador - CORREGIDOS PARA VER SIN ERRORES
    colaborador: [
      // Perfil propio
      'view_own_profile',
      'edit_own_profile',
      'view_own_memberships',
      'view_own_payments',
      'upload_transfer_proof',
      
      // Usuarios - PERMISOS ESPECÍFICOS PARA VER CLIENTES
      'view_users',                    // Puede ver usuarios
      'view_client_users_only',        // Solo puede ver clientes
      'view_user_details',             // Puede ver detalles completos de usuarios
      'view_client_full_info',         // Puede ver toda la información de clientes
      'create_users',                  // Puede crear usuarios
      
      // NO TIENE: 'edit_users' - No puede editar usuarios existentes
      // NO TIENE: 'delete_users' - No puede eliminar usuarios
      // NO TIENE: 'view_staff_users' - No puede ver otros colaboradores/admins
      
      // Membresías - COMPLETO
      'view_memberships',
      'create_memberships',
      'edit_memberships',
      'renew_memberships',
      'cancel_memberships',
      
      // Pagos - COMPLETO
      'view_payments',
      'create_payments',
      'validate_transfers',
      'view_expired_memberships',
      'register_daily_income',
      
      // Operaciones diarias
      'view_dashboard_stats',
      'register_gym_visits',
      'manage_daily_operations'
    ],
    
    // Permisos de Admin - TODOS LOS PERMISOS
    admin: [
      // Perfil propio
      'view_own_profile',
      'edit_own_profile',
      'view_own_memberships',
      'view_own_payments',
      'upload_transfer_proof',
      
      // Usuarios - COMPLETO
      'view_users',              // Puede ver todos los usuarios
      'view_all_user_roles',     // Puede ver usuarios de todos los roles
      'view_user_details',       // Puede ver detalles completos
      'view_client_full_info',   // Puede ver toda la información
      'create_users',            // Puede crear usuarios
      'edit_users',              // Puede editar usuarios
      'delete_users',            // Puede eliminar usuarios
      'manage_user_roles',       // Puede cambiar roles
      'view_staff_users',        // Puede ver colaboradores y admins
      
      // Membresías - COMPLETO
      'view_memberships',
      'create_memberships',
      'edit_memberships',
      'delete_memberships',
      'renew_memberships',
      'cancel_memberships',
      
      // Pagos - COMPLETO
      'view_payments',
      'create_payments',
      'validate_transfers',
      'view_expired_memberships',
      'register_daily_income',
      
      // Reportes y análisis
      'view_reports',
      'view_statistics',
      'export_data',
      
      // Operaciones del gimnasio
      'manage_content',
      'manage_services',
      'manage_products',
      'manage_plans',
      'manage_branding',
      'manage_media',
      
      // Administración avanzada
      'manage_roles_permissions',
      'access_admin_panel',
      'manage_backup_restore',
      'view_system_logs'
    ]
  };
  
  return permissions[role] || permissions.cliente;
}

// HELPER: Calcular cuándo expira la sesión
function calculateSessionExpiry() {
  const expireDays = parseInt(process.env.REACT_APP_TOKEN_EXPIRY) || 7;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + expireDays);
  return expiry;
}

// HELPER: Determinar ruta de dashboard según rol
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

// CREAR CONTEXTOS
const AuthContext = createContext();
const AuthDispatchContext = createContext();

// HOOK PERSONALIZADO PARA USAR EL CONTEXTO DE AUTH
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

// PROVIDER DE AUTENTICACIÓN
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // EFECTO: Verificar autenticación al iniciar
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  // EFECTO: Monitorear actividad del usuario
  useEffect(() => {
    if (state.isAuthenticated) {
      const activityTimer = setInterval(() => {
        updateActivity();
      }, 60000); // Cada minuto
      
      return () => clearInterval(activityTimer);
    }
  }, [state.isAuthenticated]);
  
  // FUNCIONES DE AUTENTICACIÓN
  
  // Verificar estado de autenticación
  const checkAuthStatus = async () => {
    try {
      console.log('Verificando estado de autenticación...');
      const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
      
      if (!token) {
        console.log('No hay token, marcando como no autenticado');
        dispatch({ type: ACTION_TYPES.AUTH_FAILURE });
        return;
      }
      
      console.log('Token encontrado, verificando con el servidor...');
      
      // Verificar token con el servidor
      const response = await apiService.getProfile();
      
      if (response.success && response.data.user) {
        console.log('Usuario autenticado correctamente:', {
          userId: response.data.user.id,
          role: response.data.user.role,
          name: `${response.data.user.firstName} ${response.data.user.lastName}`
        });
        
        dispatch({ 
          type: ACTION_TYPES.AUTH_SUCCESS, 
          payload: response.data 
        });
      } else {
        console.log('Token inválido o usuario no encontrado');
        dispatch({ type: ACTION_TYPES.AUTH_FAILURE });
      }
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      dispatch({ type: ACTION_TYPES.AUTH_FAILURE });
    }
  };
  
  // NUEVA FUNCIÓN: Refrescar datos del usuario (para OAuth)
  const refreshUserData = async () => {
    try {
      console.log('Refrescando datos del usuario...');
      
      const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
      
      if (!token) {
        console.log('No hay token para refrescar');
        dispatch({ type: ACTION_TYPES.AUTH_FAILURE });
        return false;
      }
      
      // Obtener datos frescos del usuario
      const response = await apiService.getProfile();
      
      if (response.success && response.data.user) {
        console.log('Datos del usuario refrescados exitosamente:', {
          userId: response.data.user.id,
          role: response.data.user.role,
          name: `${response.data.user.firstName} ${response.data.user.lastName}`
        });
        
        dispatch({ 
          type: ACTION_TYPES.AUTH_SUCCESS, 
          payload: response.data 
        });
        
        return true;
      } else {
        console.log('Error al obtener datos frescos del usuario');
        dispatch({ type: ACTION_TYPES.AUTH_FAILURE });
        return false;
      }
    } catch (error) {
      console.error('Error al refrescar datos del usuario:', error);
      // No marcar como fallo si ya estaba autenticado
      if (!state.isAuthenticated) {
        dispatch({ type: ACTION_TYPES.AUTH_FAILURE });
      }
      return false;
    }
  };
  
  // Iniciar sesión
  const login = async (credentials) => {
    try {
      dispatch({ type: ACTION_TYPES.AUTH_START });
      
      console.log('Iniciando login con credenciales:', { email: credentials.email });
      
      const response = await apiService.login(credentials);
      
      if (response.success && response.data.user) {
        console.log('Login exitoso:', {
          userId: response.data.user.id,
          userRole: response.data.user.role,
          userName: `${response.data.user.firstName} ${response.data.user.lastName}`
        });
        
        dispatch({ 
          type: ACTION_TYPES.AUTH_SUCCESS, 
          payload: response.data 
        });
        
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
      console.error('Error en login:', error);
      dispatch({ type: ACTION_TYPES.AUTH_FAILURE });
      throw error;
    }
  };
  
  // Registrarse
  const register = async (userData) => {
    try {
      dispatch({ type: ACTION_TYPES.AUTH_START });
      
      console.log('Iniciando registro:', {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName
      });
      
      const response = await apiService.register(userData);
      
      if (response.success && response.data.user) {
        console.log('Registro exitoso:', {
          userId: response.data.user.id,
          userRole: response.data.user.role
        });
        
        dispatch({ 
          type: ACTION_TYPES.AUTH_SUCCESS, 
          payload: response.data 
        });
        
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
      console.error('Error en registro:', error);
      dispatch({ type: ACTION_TYPES.AUTH_FAILURE });
      throw error;
    }
  };
  
  // Cerrar sesión
  const logout = () => {
    localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
    localStorage.removeItem('elite_fitness_refresh_token');
    localStorage.removeItem('elite_fitness_user_role');
    localStorage.removeItem('elite_fitness_user_id');
    dispatch({ type: ACTION_TYPES.LOGOUT });
    toast.success('Sesión cerrada exitosamente');
    
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
  
  // HELPER: Verificar si el usuario tiene un permiso específico
  const hasPermission = (permission) => {
    return state.permissions.includes(permission);
  };
  
  // HELPER: Verificar si el usuario tiene un rol específico
  const hasRole = (role) => {
    return state.user?.role === role;
  };
  
  // HELPER: Verificar si puede ver usuarios de cierto rol
  const canViewUsersOfRole = (targetRole) => {
    const currentUserRole = state.user?.role;
    
    // Admin puede ver todos los roles
    if (currentUserRole === 'admin') {
      return true;
    }
    
    // Colaborador SOLO puede ver clientes
    if (currentUserRole === 'colaborador') {
      return targetRole === 'cliente';
    }
    
    // Cliente no puede ver otros usuarios
    if (currentUserRole === 'cliente') {
      return false;
    }
    
    return false;
  };
  
  // HELPER: Obtener roles que el usuario actual puede ver
  const getViewableUserRoles = () => {
    const currentUserRole = state.user?.role;
    
    switch (currentUserRole) {
      case 'admin':
        return ['admin', 'colaborador', 'cliente']; // Puede ver todos
      case 'colaborador':
        return ['cliente']; // Solo puede ver clientes
      case 'cliente':
        return []; // No puede ver otros usuarios
      default:
        return [];
    }
  };
  
  // HELPER: Verificar si puede crear usuarios
  const canCreateUsers = () => {
    return hasPermission('create_users');
  };
  
  // HELPER: Verificar si puede editar usuarios EN GENERAL
  const canEditUsers = () => {
    return hasPermission('edit_users');
  };
  
  // HELPER: Verificar si puede eliminar usuarios EN GENERAL
  const canDeleteUsers = () => {
    return hasPermission('delete_users');
  };
  
  // HELPER: Verificar si puede VER DETALLES de un usuario específico
  const canViewUserDetails = (targetUser) => {
    const currentUserRole = state.user?.role;
    
    // Verificar si tiene permisos básicos para ver detalles
    if (!hasPermission('view_user_details') && !hasPermission('view_client_full_info')) {
      return false;
    }
    
    // No puede verse a sí mismo en la gestión de usuarios (debe usar perfil)
    if (targetUser && targetUser.id === state.user?.id) {
      return false;
    }
    
    // Admin puede ver detalles de todos
    if (currentUserRole === 'admin') {
      return true;
    }
    
    // Colaborador puede ver detalles solo de clientes
    if (currentUserRole === 'colaborador') {
      return targetUser ? targetUser.role === 'cliente' : false;
    }
    
    return false;
  };
  
  // HELPER: Verificar si puede editar un usuario específico
  const canEditSpecificUser = (targetUser) => {
    const currentUserRole = state.user?.role;
    
    // No puede editarse a sí mismo desde la gestión de usuarios
    if (targetUser && targetUser.id === state.user?.id) {
      return false;
    }
    
    // Admin puede editar todos excepto a sí mismo
    if (currentUserRole === 'admin') {
      return hasPermission('edit_users');
    }
    
    // Colaborador NO puede editar usuarios (solo crear y ver)
    if (currentUserRole === 'colaborador') {
      return false;
    }
    
    return false;
  };
  
  // HELPER: Verificar si puede eliminar un usuario específico
  const canDeleteSpecificUser = (targetUser) => {
    const currentUserRole = state.user?.role;
    
    // No puede eliminarse a sí mismo
    if (targetUser && targetUser.id === state.user?.id) {
      return false;
    }
    
    // Admin puede eliminar todos excepto a sí mismo
    if (currentUserRole === 'admin') {
      return hasPermission('delete_users');
    }
    
    // Colaborador NO puede eliminar usuarios
    if (currentUserRole === 'colaborador') {
      return false;
    }
    
    return false;
  };
  
  // HELPER: Verificar si puede gestionar contenido de la web
  const canManageContent = () => {
    if (hasRole('admin')) return true;
    return hasPermission('manage_content');
  };
  
  // HELPER: Verificar si puede gestionar productos de la tienda
  const canManageStore = () => {
    return hasRole('admin') || 
           hasPermission('manage_products') || 
           hasPermission('manage_store');
  };
  
  // HELPER: Verificar si puede gestionar servicios
  const canManageServices = () => {
    return hasRole('admin') || 
           hasPermission('manage_services') || 
           hasPermission('manage_content');
  };
  
  // HELPER: Verificar si puede gestionar planes de membresía
  const canManagePlans = () => {
    return hasRole('admin') || 
           hasPermission('manage_plans') || 
           hasPermission('manage_memberships');
  };
  
  // HELPER: Verificar si la sesión está próxima a expirar
  const isSessionExpiring = () => {
    if (!state.sessionExpiry) return false;
    
    const now = new Date();
    const expiry = new Date(state.sessionExpiry);
    const diffHours = (expiry - now) / (1000 * 60 * 60);
    
    return diffHours <= 24;
  };
  
  // FUNCIÓN: Obtener ruta de dashboard para rol específico
  const getDashboardPathForRole = (role) => {
    return getDashboardPath(role);
  };
  
  // VALOR DEL CONTEXTO
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
    refreshUserData,              // NUEVA FUNCIÓN PARA OAUTH
    
    // Funciones de utilidad básicas
    hasPermission,
    hasRole,
    isSessionExpiring,
    getDashboardPathForRole,
    
    // FUNCIONES DE GESTIÓN DE USUARIOS CORREGIDAS
    canViewUsersOfRole,          // ¿Puede ver usuarios de X rol?
    getViewableUserRoles,        // ¿Qué roles puede ver?
    canCreateUsers,              // ¿Puede crear usuarios?
    canEditUsers,                // ¿Puede editar usuarios en general?
    canDeleteUsers,              // ¿Puede eliminar usuarios en general?
    canViewUserDetails,          // ¿Puede ver detalles de usuario específico?
    canEditSpecificUser,         // ¿Puede editar usuario específico?
    canDeleteSpecificUser,       // ¿Puede eliminar usuario específico?
    
    // Funciones de gestión de contenido
    canManageContent,
    canManageStore,
    canManageServices,
    canManagePlans,
    
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

// COMPONENTE HOC: Proteger rutas que requieren autenticación
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

/*
DOCUMENTACIÓN DEL CONTEXTO AuthContext

PROPÓSITO:
Este contexto maneja todo el sistema de autenticación y autorización del gimnasio
Elite Fitness Club. Proporciona funciones para login, registro, gestión de sesiones,
verificación de permisos y control de acceso basado en roles. Es el núcleo de
seguridad que protege las operaciones financieras en quetzales y los datos sensibles
de clientes y staff del gimnasio.

FUNCIONALIDADES PRINCIPALES:
- Sistema de autenticación completo (login/register/logout)
- Gestión de sesiones con expiración automática
- Sistema de permisos granulares por rol de usuario
- Protección de rutas con HOC withAuth
- Refrescar datos de usuario para OAuth
- Verificación de tokens y estado de sesión
- Control de acceso a funciones específicas del gimnasio
- Manejo de roles jerárquicos (cliente/colaborador/admin)

CONEXIONES CON OTROS ARCHIVOS:

SERVICIOS CONECTADOS:
- apiService (../services/apiService): Servicio principal de API
  - login(): Autenticación de credenciales
  - register(): Registro de nuevos usuarios
  - getProfile(): Obtener datos del perfil usuario
  - updateProfile(): Actualizar información personal

COMPONENTES QUE LO UTILIZAN:
- ClientDashboard: Panel de clientes con verificación de permisos
- MembershipCard: Verificación para acciones de membresía
- PaymentHistoryCard: Control de acceso a datos financieros
- MembershipCheckout: Verificación para procesar pagos
- ScheduleCard: Permisos para editar horarios
- Todos los componentes que requieren autenticación

HOOKS QUE LO USAN:
- useAuth(): Hook principal para acceder al contexto
- useAuthActions(): Hook para acciones de dispatch
- Cualquier hook personalizado que requiera verificación de usuario

LIBRERÍAS EXTERNAS:
- react-hot-toast: Notificaciones de sistema (logout, errores)

ROLES DEL SISTEMA:

CLIENTE:
- Permisos limitados a sus propios datos
- Puede ver y editar su perfil personal
- Acceso a sus membresías y pagos
- Puede subir comprobantes de transferencia
- Dashboard: /dashboard/client

COLABORADOR (STAFF):
- Todos los permisos de cliente
- Puede ver SOLO clientes (no otros staff/admins)
- Crear nuevos usuarios clientes
- Gestión completa de membresías y pagos
- Validar transferencias bancarias
- Registrar visitas y operaciones diarias
- NO puede editar o eliminar usuarios existentes
- Dashboard: /dashboard/staff

ADMIN:
- Todos los permisos del sistema
- Ver, crear, editar y eliminar cualquier usuario
- Gestión completa de roles y permisos
- Acceso a reportes y estadísticas
- Configuración de contenido y servicios
- Administración de productos y planes
- Gestión de branding y medios
- Dashboard: /dashboard/admin

QUE MUESTRA AL USUARIO:

ESTADOS DE CARGA:
- Spinner de carga durante verificación de autenticación
- Indicadores de procesamiento durante login/registro

MENSAJES DE AUTENTICACIÓN:
- "Login exitoso" al autenticarse correctamente
- "Registro exitoso" al crear cuenta nueva
- "Sesión cerrada exitosamente" al hacer logout
- "Error en el login/registro" en caso de fallo

MENSAJES DE AUTORIZACIÓN:
- "Acceso Denegado" (título en rojo)
- "No tienes permisos para acceder a esta página" (explicación)
- Redirección automática a /login si no está autenticado

NAVEGACIÓN AUTOMÁTICA:
- Redirección a dashboard específico según rol después del login
- Redirección a /login al cerrar sesión
- Protección automática de rutas sin autorización

FUNCIONES DE VERIFICACIÓN:

PERMISOS BÁSICOS:
- hasPermission(permission): Verificar permiso específico
- hasRole(role): Verificar rol exacto del usuario
- isSessionExpiring(): Verificar si sesión está por expirar

GESTIÓN DE USUARIOS:
- canViewUsersOfRole(role): ¿Puede ver usuarios de X rol?
- getViewableUserRoles(): Lista de roles que puede ver
- canCreateUsers(): ¿Puede crear nuevos usuarios?
- canEditUsers(): ¿Puede editar usuarios en general?
- canDeleteUsers(): ¿Puede eliminar usuarios?
- canViewUserDetails(user): ¿Puede ver detalles de usuario específico?
- canEditSpecificUser(user): ¿Puede editar usuario específico?
- canDeleteSpecificUser(user): ¿Puede eliminar usuario específico?

GESTIÓN DE CONTENIDO:
- canManageContent(): ¿Puede gestionar contenido web?
- canManageStore(): ¿Puede gestionar productos de tienda?
- canManageServices(): ¿Puede gestionar servicios del gimnasio?
- canManagePlans(): ¿Puede gestionar planes de membresía?

CASOS DE USO EN EL GIMNASIO:

OPERACIONES FINANCIERAS:
- Control de acceso a pagos en quetzales
- Validación de transferencias bancarias
- Protección de datos de transacciones
- Autorización para procesar reembolsos

GESTIÓN DE MEMBRESÍAS:
- Verificación para crear/editar/cancelar membresías
- Control de acceso a renovaciones
- Autorización para ver vencimientos
- Permisos para registrar pagos diarios

ADMINISTRACIÓN DE USUARIOS:
- Jerarquía de permisos: Cliente < Colaborador < Admin
- Colaboradores pueden crear clientes pero no editarlos
- Admins tienen control total sobre usuarios
- Protección contra auto-eliminación

OPERACIONES DIARIAS:
- Registro de visitas al gimnasio
- Validación de comprobantes de pago
- Gestión de estadísticas diarias
- Control de acceso a reportes financieros

CARACTERÍSTICAS TÉCNICAS:

PERSISTENCIA DE SESIÓN:
- Tokens almacenados en localStorage
- Verificación automática al cargar la aplicación
- Limpieza automática de datos al logout
- Soporte para refresh tokens (OAuth)

SEGURIDAD:
- Verificación de tokens con el servidor
- Expiración automática de sesiones
- Limpieza de datos sensibles al cerrar sesión
- Logs detallados para auditoría

MANEJO DE ERRORES:
- Captura de errores de autenticación
- Fallback graceful en caso de fallo de red
- Mensajes descriptivos para usuarios
- Logs de debugging para desarrolladores

INTEGRATION CON OAUTH:
- Función refreshUserData() para compatibilidad OAuth
- Manejo de múltiples tipos de tokens
- Sincronización de datos de usuario
- Soporte para autenticación externa

PROTECCIÓN DE RUTAS:
- HOC withAuth para componentes protegidos
- Verificación automática de permisos requeridos
- Redirección automática según estado de auth
- Mensajes de acceso denegado personalizados

OPTIMIZACIÓN:
- Verificación de autenticación solo al inicio
- Cache de permisos en memoria
- Actualización de actividad automática
- Limpieza de timers al desmontar

Este contexto es fundamental para la seguridad del gimnasio en Guatemala,
protegiendo todas las operaciones financieras en quetzales, controlando
el acceso a datos sensibles de clientes, y garantizando que solo personal
autorizado pueda realizar operaciones críticas del negocio.
*/