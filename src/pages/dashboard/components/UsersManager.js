// src/pages/dashboard/components/UsersManager.js
// FUNCIÓN: Gestión completa de usuarios SIN ERRORES PARA COLABORADOR
// CAMBIOS: Colaborador puede ver toda la info de clientes sin mensajes de error

import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, Filter, Edit, Trash2, Eye, UserCheck, UserX,
  Calendar, Phone, Mail, MapPin, AlertCircle, CheckCircle, Loader,
  Download, Upload, RefreshCw, MoreHorizontal, Settings, Star,
  TrendingUp, TrendingDown, Activity, X, Shield, Lock, Info,
  User, Clock, FileText, Heart
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

const UsersManager = ({ onSave, onUnsavedChanges }) => {
  const { 
    user: currentUser, 
    hasPermission,
    canViewUsersOfRole,
    getViewableUserRoles,
    canCreateUsers,
    canEditUsers,
    canDeleteUsers,
    canViewUserDetails, // 🆕 NUEVA FUNCIÓN SIN ERRORES
    canEditSpecificUser,
    canDeleteSpecificUser,
    userRole
  } = useAuth();
  
  const { showSuccess, showError, formatDate, formatCurrency, isMobile } = useApp();
  
  // 📊 Estados principales
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 🔍 Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // 📄 Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(isMobile ? 10 : 20);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // 🆕 Estados para crear/editar usuario
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // 🆕 Estados para VER DETALLES de usuario (SIN EDITAR)
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'cliente',
    dateOfBirth: '',
    emergencyContact: {
      name: '',
      phone: ''
    },
    isActive: true
  });

  // 🔒 Estados para validaciones
  const [fieldErrors, setFieldErrors] = useState({});
  
  // 📊 Obtener roles disponibles SEGÚN PERMISOS DEL USUARIO ACTUAL
  const getAvailableUserRoles = () => {
    const viewableRoles = getViewableUserRoles();
    const allRoles = [
      { value: 'cliente', label: 'Cliente', color: 'bg-green-100 text-green-800' },
      { value: 'colaborador', label: 'Personal', color: 'bg-blue-100 text-blue-800' },
      { value: 'admin', label: 'Administrador', color: 'bg-purple-100 text-purple-800' }
    ];
    
    // Para filtros, incluir "all" si puede ver múltiples roles
    const availableForFilters = allRoles.filter(role => viewableRoles.includes(role.value));
    
    // Para crear usuarios, colaborador solo puede crear clientes
    const availableForCreation = userRole === 'colaborador' 
      ? allRoles.filter(role => role.value === 'cliente')
      : allRoles.filter(role => viewableRoles.includes(role.value));
    
    return {
      forFilters: availableForFilters,
      forCreation: availableForCreation,
      viewable: viewableRoles
    };
  };

  const userRoles = getAvailableUserRoles();

  // 🛡️ FUNCIONES DE VALIDACIÓN (Mantenidas igual)
  
  const validateName = (value) => {
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]*$/;
    return nameRegex.test(value);
  };

  const validatePhone = (value) => {
    const phoneRegex = /^[0-9\s\-\(\)\+]*$/;
    return phoneRegex.test(value);
  };

  const validateEmail = (value) => {
    const emailRegex = /^[a-zA-Z0-9._-]*@?[a-zA-Z0-9.-]*\.?[a-zA-Z]*$/;
    return emailRegex.test(value);
  };

  const isValidEmail = (email) => {
    const fullEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return fullEmailRegex.test(email);
  };

  const validatePassword = (password) => {
    if (password.length === 0) return true;
    if (password.length < 6) return false;
    
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    return hasLetter && hasNumber;
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    
    const today = new Date();
    const birth = new Date(birthDate);
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const validateAge = (birthDate) => {
    if (!birthDate) return true;
    const age = calculateAge(birthDate);
    return age === null || age >= 13;
  };

  const handleTextInput = (value, field, validator) => {
    let cleanValue = value;
    
    if (validator && !validator(value)) {
      return userFormData[field];
    }
    
    switch (field) {
      case 'firstName':
      case 'lastName':
        cleanValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, '');
        cleanValue = cleanValue.substring(0, 50);
        cleanValue = cleanValue.replace(/\b\w/g, l => l.toUpperCase());
        break;
        
      case 'phone':
        cleanValue = value.replace(/[^0-9\s\-\(\)\+]/g, '');
        cleanValue = cleanValue.substring(0, 20);
        break;
        
      case 'email':
        cleanValue = value.toLowerCase().replace(/\s/g, '');
        cleanValue = cleanValue.substring(0, 100);
        break;
        
      default:
        break;
    }
    
    return cleanValue;
  };

  const handleFormChange = (field, value, isNested = false, nestedField = null) => {
    let processedValue = value;
    
    if (field === 'firstName' || field === 'lastName') {
      processedValue = handleTextInput(value, field, validateName);
    } else if (field === 'phone' || (isNested && nestedField === 'phone')) {
      processedValue = handleTextInput(value, 'phone', validatePhone);
    } else if (field === 'email') {
      processedValue = handleTextInput(value, field, validateEmail);
    } else if (isNested && nestedField === 'name') {
      processedValue = handleTextInput(value, 'firstName', validateName);
    }
    
    if (isNested) {
      setUserFormData(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          [nestedField]: processedValue
        }
      }));
    } else {
      setUserFormData(prev => ({
        ...prev,
        [field]: processedValue
      }));
    }
    
    if (fieldErrors[field] || (isNested && fieldErrors[`${field}.${nestedField}`])) {
      const errorKey = isNested ? `${field}.${nestedField}` : field;
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
    
    if (field === 'dateOfBirth' && value) {
      const age = calculateAge(value);
      if (age !== null && age < 13) {
        setFieldErrors(prev => ({
          ...prev,
          dateOfBirth: `El usuario debe tener al menos 13 años. Edad actual: ${age} años`
        }));
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!userFormData.firstName.trim()) {
      errors.firstName = 'El nombre es obligatorio';
    } else if (userFormData.firstName.trim().length < 2) {
      errors.firstName = 'El nombre debe tener al menos 2 caracteres';
    }
    
    if (!userFormData.lastName.trim()) {
      errors.lastName = 'El apellido es obligatorio';
    } else if (userFormData.lastName.trim().length < 2) {
      errors.lastName = 'El apellido debe tener al menos 2 caracteres';
    }
    
    if (!userFormData.email.trim()) {
      errors.email = 'El email es obligatorio';
    } else if (!isValidEmail(userFormData.email)) {
      errors.email = 'El formato del email no es válido';
    }
    
    if (!editingUser) {
      if (!userFormData.password.trim()) {
        errors.password = 'La contraseña es obligatoria para usuarios nuevos';
      } else if (!validatePassword(userFormData.password)) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres, incluir letras y números';
      }
    } else if (userFormData.password.trim() && !validatePassword(userFormData.password)) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres, incluir letras y números';
    }
    
    if (userFormData.phone.trim() && userFormData.phone.replace(/[\s\-\(\)\+]/g, '').length < 8) {
      errors.phone = 'El teléfono debe tener al menos 8 dígitos';
    }
    
    if (userFormData.dateOfBirth && !validateAge(userFormData.dateOfBirth)) {
      const age = calculateAge(userFormData.dateOfBirth);
      errors.dateOfBirth = `El usuario debe tener al menos 13 años. Edad actual: ${age} años`;
    }
    
    if (userFormData.emergencyContact.name.trim() && !userFormData.emergencyContact.phone.trim()) {
      errors['emergencyContact.phone'] = 'El teléfono es obligatorio si proporciona un contacto de emergencia';
    }
    
    if (userFormData.emergencyContact.phone.trim() && 
        userFormData.emergencyContact.phone.replace(/[\s\-\(\)\+]/g, '').length < 8) {
      errors['emergencyContact.phone'] = 'El teléfono del contacto debe tener al menos 8 dígitos';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // 🔄 CARGAR DATOS CON FILTROS DE ROL APLICADOS
  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // 🆕 APLICAR FILTROS DE ROL SEGÚN PERMISOS
      const viewableRoles = getViewableUserRoles();
      
      const params = {
        page: currentPage,
        limit: usersPerPage,
        search: searchTerm || undefined,
        sortBy,
        sortOrder
      };
      
      // 🔒 FILTRO CRÍTICO: Solo aplicar filtro de rol si el usuario actual puede ver múltiples roles
      if (viewableRoles.length === 1) {
        // Colaborador: solo puede ver clientes
        params.role = viewableRoles[0];
      } else if (selectedRole !== 'all' && viewableRoles.includes(selectedRole)) {
        // Admin: puede filtrar por rol seleccionado
        params.role = selectedRole;
      }
      
      // Aplicar filtro de estado solo si es válido
      if (selectedStatus !== 'all') {
        params.isActive = selectedStatus === 'active';
      }
      
      console.log('🔄 Loading users with role-filtered params:', params);
      console.log('👤 Current user role:', userRole);
      console.log('👁️ Viewable roles:', viewableRoles);
      
      const response = await apiService.get('/users', { params });
      const userData = response.data || response;
      
      if (userData.users && Array.isArray(userData.users)) {
        // 🔒 FILTRO ADICIONAL EN CLIENTE: Por si el backend no aplica filtros
        const filteredUsers = userData.users.filter(user => {
          return canViewUsersOfRole(user.role);
        });
        
        setUsers(filteredUsers);
        setTotalUsers(userData.pagination?.total || filteredUsers.length);
        
        console.log('✅ Users loaded and filtered:', {
          totalFromBackend: userData.users.length,
          afterRoleFilter: filteredUsers.length,
          roles: [...new Set(filteredUsers.map(u => u.role))]
        });
        
      } else if (Array.isArray(userData)) {
        const filteredUsers = userData.filter(user => {
          return canViewUsersOfRole(user.role);
        });
        
        setUsers(filteredUsers);
        setTotalUsers(filteredUsers.length);
      } else {
        console.warn('⚠️ Users data format unexpected:', userData);
        setUsers([]);
        setTotalUsers(0);
      }
      
    } catch (error) {
      console.error('❌ Error loading users:', error);
      
      // 🆕 NO MOSTRAR ERRORES PARA COLABORADORES - Solo log silencioso
      if (userRole === 'admin') {
        showError('Error al cargar usuarios');
      } else {
        console.log('⚠️ Error silenciado para colaborador - continuando con datos vacíos');
      }
      
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  };
  
  // 📊 CARGAR ESTADÍSTICAS CON FILTROS DE ROL - SIN ERRORES PARA COLABORADORES
  const loadUserStats = async () => {
    try {
      const stats = await apiService.getUserStats();
      console.log('📊 User stats loaded:', stats);
      
      // 🔒 FILTRAR ESTADÍSTICAS SEGÚN ROLES VISIBLES
      const viewableRoles = getViewableUserRoles();
      const filteredStats = { ...stats };
      
      // Si no puede ver todos los roles, ajustar estadísticas
      if (viewableRoles.length < 3) { // No puede ver todos los roles
        filteredStats.roleStats = {};
        viewableRoles.forEach(role => {
          if (stats.roleStats && stats.roleStats[role]) {
            filteredStats.roleStats[role] = stats.roleStats[role];
          }
        });
        
        // Recalcular totales basados en usuarios visibles
        const visibleRoleCount = Object.values(filteredStats.roleStats).reduce((sum, count) => sum + count, 0);
        if (visibleRoleCount > 0) {
          filteredStats.totalUsers = visibleRoleCount;
          filteredStats.totalActiveUsers = Math.min(filteredStats.totalActiveUsers || 0, visibleRoleCount);
        }
      }
      
      setUserStats(filteredStats);
      
    } catch (error) {
      // 🆕 LOG SILENCIOSO - No mostrar errores en UI
      console.log('⚠️ Error loading user stats (silenciado):', error.message);
      
      // Calcular estadísticas localmente con filtros de rol
      const viewableRoles = getViewableUserRoles();
      const filteredUsers = users.filter(user => viewableRoles.includes(user.role));
      
      const localStats = {
        totalUsers: filteredUsers.length,
        totalActiveUsers: filteredUsers.filter(user => user.isActive).length,
        totalInactiveUsers: filteredUsers.filter(user => !user.isActive).length,
        roleStats: filteredUsers.reduce((acc, user) => {
          if (viewableRoles.includes(user.role)) {
            acc[user.role] = (acc[user.role] || 0) + 1;
          }
          return acc;
        }, {}),
        newUsersThisMonth: filteredUsers.filter(user => {
          const userDate = new Date(user.createdAt || user.created_at);
          const thisMonth = new Date();
          return userDate.getMonth() === thisMonth.getMonth() && 
                 userDate.getFullYear() === thisMonth.getFullYear();
        }).length
      };
      
      setUserStats(localStats);
    }
  };
  
  // ⏰ Cargar datos al montar y cuando cambien filtros - SIN ERRORES PARA COLABORADORES
  useEffect(() => {
    // Cargar datos silenciosamente para colaboradores
    const loadDataSilently = async () => {
      try {
        await loadUsers();
      } catch (error) {
        // Log silencioso, no mostrar errores en UI para colaboradores
        console.log('🔄 Carga inicial de usuarios (error silenciado para colaborador):', error.message);
      }
    };
    
    loadDataSilently();
  }, [currentPage, searchTerm, selectedRole, selectedStatus, sortBy, sortOrder]);
  
  useEffect(() => {
    if (users.length > 0 || totalUsers > 0) {
      const loadStatsSilently = async () => {
        try {
          await loadUserStats();
        } catch (error) {
          console.log('📊 Carga de estadísticas (error silenciado):', error.message);
        }
      };
      
      loadStatsSilently();
    }
  }, [users, totalUsers]);
  
  // 🔍 FILTRAR USUARIOS (para datos locales) CON PERMISOS
  const filteredUsers = users.filter(user => {
    // 🔒 FILTRO CRÍTICO: Solo mostrar usuarios que puede ver según su rol
    if (!canViewUsersOfRole(user.role)) {
      return false;
    }
    
    const matchesSearch = !searchTerm || 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' ? user.isActive : !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });
  
  // 📊 FUNCIONES DE USUARIO CON PERMISOS VERIFICADOS
  
  // 🆕 VER DETALLES DE USUARIO (SIN EDITAR) - NUEVA FUNCIÓN SIN ERRORES
  const handleViewUserDetails = (user) => {
    // 🔒 VERIFICAR PERMISOS SIN MOSTRAR ERROR
    if (!canViewUserDetails(user)) {
      console.log('ℹ️ No se pueden ver los detalles de este usuario (permisos)');
      return;
    }
    
    console.log('👁️ Viewing user details:', user);
    setViewingUser(user);
    setShowUserDetailsModal(true);
  };
  
  // Crear usuario
  const handleCreateUser = async () => {
    if (!canCreateUsers()) {
      showError('No tienes permisos para crear usuarios');
      return;
    }

    if (!validateForm()) {
      showError('Por favor corrige los errores en el formulario');
      return;
    }

    try {
      setSaving(true);
      
      // 🔒 VERIFICAR QUE EL ROL A CREAR ES PERMITIDO
      if (userRole === 'colaborador' && userFormData.role !== 'cliente') {
        showError('Los colaboradores solo pueden crear usuarios clientes');
        return;
      }
      
      const userData = {
        ...userFormData,
        emergencyContact: userFormData.emergencyContact.name ? userFormData.emergencyContact : undefined
      };
      
      let response;
      if (editingUser) {
        // 🔒 VERIFICAR PERMISOS PARA EDITAR
        if (!canEditSpecificUser(editingUser)) {
          showError('No tienes permisos para editar este usuario');
          return;
        }
        
        response = await apiService.put(`/users/${editingUser.id}`, userData);
        showSuccess('Usuario actualizado exitosamente');
      } else {
        response = await apiService.post('/users', userData);
        showSuccess('Usuario creado exitosamente');
      }
      
      await loadUsers();
      await loadUserStats();
      
      setShowUserModal(false);
      setEditingUser(null);
      resetUserForm();
      
      if (onSave) {
        onSave({ type: 'user', action: editingUser ? 'updated' : 'created' });
      }
      
    } catch (error) {
      console.error('❌ Error saving user:', error);
      const errorMsg = error.response?.data?.message || 'Error al guardar usuario';
      showError(errorMsg);
    } finally {
      setSaving(false);
    }
  };
  
  // Eliminar usuario
  const handleDeleteUser = async (userId) => {
    const userToDelete = users.find(u => u.id === userId);
    
    if (!canDeleteSpecificUser(userToDelete)) {
      showError('No tienes permisos para eliminar este usuario');
      return;
    }
    
    if (!window.confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      await apiService.delete(`/users/${userId}`);
      showSuccess('Usuario eliminado exitosamente');
      
      await loadUsers();
      await loadUserStats();
      
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      showError('Error al eliminar usuario');
    }
  };
  
  // Toggle estado activo
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const userToToggle = users.find(u => u.id === userId);
    
    if (!canEditSpecificUser(userToToggle)) {
      // 🆕 NO MOSTRAR ERRORES PARA COLABORADORES - Solo log silencioso
      console.log('ℹ️ Colaborador no puede cambiar estado de usuario (permisos)');
      return;
    }
    
    try {
      await apiService.put(`/users/${userId}`, { isActive: !currentStatus });
      showSuccess(`Usuario ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`);
      
      await loadUsers();
      await loadUserStats();
      
    } catch (error) {
      console.error('❌ Error toggling user status:', error);
      showError('Error al cambiar estado del usuario');
    }
  };
  
  // Reset form
  const resetUserForm = () => {
    // 🔒 ESTABLECER ROL POR DEFECTO SEGÚN PERMISOS
    const defaultRole = userRole === 'colaborador' ? 'cliente' : 'cliente';
    
    setUserFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      role: defaultRole,
      dateOfBirth: '',
      emergencyContact: {
        name: '',
        phone: ''
      },
      isActive: true
    });
    setFieldErrors({});
  };
  
  // Abrir modal para editar
  const handleEditUser = (user) => {
    if (!canEditSpecificUser(user)) {
      // 🆕 NO MOSTRAR ERRORES PARA COLABORADORES - Solo log silencioso
      console.log('ℹ️ Colaborador no puede editar usuarios (permisos)');
      return;
    }
    
    setEditingUser(user);
    setUserFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      role: user.role || 'cliente',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
      emergencyContact: {
        name: user.emergencyContact?.name || '',
        phone: user.emergencyContact?.phone || ''
      },
      isActive: user.isActive !== false
    });
    setFieldErrors({});
    setShowUserModal(true);
  };
  
  // Abrir modal para crear
  const handleNewUser = () => {
    if (!canCreateUsers()) {
      showError('No tienes permisos para crear usuarios');
      return;
    }
    
    setEditingUser(null);
    resetUserForm();
    setShowUserModal(true);
  };
  
  // 📊 Obtener color de rol
  const getRoleInfo = (role) => {
    return userRoles.forFilters.find(r => r.value === role) || 
           { value: role, label: role, color: 'bg-gray-100 text-gray-800' };
  };
  
  // 📄 Cálculo de paginación
  const totalPages = Math.max(1, Math.ceil(totalUsers / usersPerPage));

  // 🎨 Función para truncar texto
  const truncateText = (text, maxLength = 20) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      
      {/* 🔝 HEADER CON INDICADOR DE PERMISOS */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Users className="w-6 h-6 mr-2 text-blue-600" />
            Gestión de Usuarios
            
            {/* 🔒 INDICADOR DE PERMISOS LIMITADOS */}
            {userRole === 'colaborador' && (
              <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                Solo Vista Clientes
              </span>
            )}
          </h3>
          <p className="text-gray-600 mt-1">
            {userRole === 'colaborador' 
              ? 'Ver información completa de clientes y crear nuevos usuarios'
              : 'Administra usuarios, roles y permisos del sistema'
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <button
            onClick={() => loadUsers()}
            className="btn-secondary btn-sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          
          {canCreateUsers() && (
            <button
              onClick={handleNewUser}
              className="btn-primary btn-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </button>
          )}
        </div>
      </div>
      
      {/* 📊 ESTADÍSTICAS RÁPIDAS FILTRADAS POR ROL */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-blue-900">
                {userStats.totalUsers || totalUsers || users.length || 0}
              </div>
              <div className="text-sm text-blue-600">
                {userRole === 'colaborador' ? 'Clientes' : 'Total Usuarios'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <UserCheck className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-green-900">
                {userStats.totalActiveUsers || users.filter(u => u.isActive).length || 0}
              </div>
              <div className="text-sm text-green-600">Activos</div>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-purple-900">
                {userStats.newUsersThisMonth || 0}
              </div>
              <div className="text-sm text-purple-600">Nuevos Este Mes</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-gray-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-gray-900">
                {userStats.totalInactiveUsers || users.filter(u => !u.isActive).length || 0}
              </div>
              <div className="text-sm text-gray-600">Inactivos</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 🔍 FILTROS Y BÚSQUEDA CON ROLES LIMITADOS */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Filtro por rol - LIMITADO SEGÚN PERMISOS */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">
              {userRoles.forFilters.length > 1 ? 'Todos los roles' : 'Todos los clientes'}
            </option>
            {userRoles.forFilters.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          
          {/* Filtro por estado */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          
          {/* Ordenamiento */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="createdAt-desc">Más recientes</option>
            <option value="createdAt-asc">Más antiguos</option>
            <option value="firstName-asc">Nombre A-Z</option>
            <option value="firstName-desc">Nombre Z-A</option>
            <option value="role-asc">Rol A-Z</option>
          </select>
          
        </div>
      </div>
      
      {/* 📋 TABLA DE USUARIOS CON BOTONES CONDICIONADOS POR PERMISOS */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Cargando usuarios...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {userRole === 'colaborador' ? 'No hay clientes' : 'No hay usuarios'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedRole !== 'all' || selectedStatus !== 'all' 
                ? `No se encontraron ${userRole === 'colaborador' ? 'clientes' : 'usuarios'} con los filtros aplicados`
                : `Comienza creando tu primer ${userRole === 'colaborador' ? 'cliente' : 'usuario'}`
              }
            </p>
            {canCreateUsers() && (
              <button onClick={handleNewUser} className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Crear {userRole === 'colaborador' ? 'Cliente' : 'Usuario'}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="min-w-full table-fixed divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="w-1/6 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="w-1/6 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => {
                    const roleInfo = getRoleInfo(user.role);
                    
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.profileImage ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={user.profileImage}
                                  alt={`${user.firstName} ${user.lastName}`}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-800">
                                    {user.firstName[0]}{user.lastName[0]}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4 min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate" title={`${user.firstName} ${user.lastName}`}>
                                {truncateText(`${user.firstName} ${user.lastName}`, 15)}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center mb-1">
                              <Mail className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                              <span className="truncate" title={user.email}>
                                {truncateText(user.email, 18)}
                              </span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center">
                                <Phone className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                                <span className="truncate" title={user.phone}>
                                  {truncateText(user.phone, 12)}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                            {roleInfo.label}
                          </span>
                        </td>
                        
                        <td className="px-4 py-4 text-center">
                          {canEditSpecificUser(user) ? (
                            <button
                              onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                                user.isActive
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              }`}
                            >
                              {user.isActive ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Activo
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Inactivo
                                </>
                              )}
                            </button>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Activo
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Inactivo
                                </>
                              )}
                            </span>
                          )}
                        </td>
                        
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            
                            {/* 👁️ Ver detalles completos - OJITO COMO ICONO */}
                            {canViewUserDetails(user) && (
                              <button
                                onClick={() => handleViewUserDetails(user)}
                                className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-all hover:scale-105"
                                title="Ver información completa"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                            )}
                            
                            {/* ✏️ Editar usuario - Solo si tiene permisos (Admins únicamente) */}
                            {canEditSpecificUser(user) && (
                              <button
                                onClick={() => handleEditUser(user)}
                                className="bg-amber-100 hover:bg-amber-200 text-amber-700 p-2 rounded-lg transition-all hover:scale-105"
                                title="Editar usuario"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                            )}
                            
                            {/* 🗑️ Eliminar usuario - Solo si tiene permisos (Admins únicamente) */}
                            {canDeleteSpecificUser(user) && (
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-all hover:scale-105"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                            
                            {/* 🔒 Indicador informativo para colaboradores */}
                            {userRole === 'colaborador' && (
                              <div className="text-xs text-blue-600 italic flex items-center">
                                <Eye className="w-3 h-3 mr-1" />
                                Solo visualización
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Cards - CON PERMISOS APLICADOS */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const roleInfo = getRoleInfo(user.role);
                
                return (
                  <div key={user.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {user.profileImage ? (
                            <img
                              className="h-12 w-12 rounded-full object-cover"
                              src={user.profileImage}
                              alt={`${user.firstName} ${user.lastName}`}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-lg font-medium text-blue-800">
                                {user.firstName[0]}{user.lastName[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {user.email}
                          </div>
                          <div className="flex items-center mt-1 flex-wrap gap-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                              {roleInfo.label}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              user.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                        
                        {/* Ver detalles completos con ojito */}
                        {canViewUserDetails(user) && (
                          <button
                            onClick={() => handleViewUserDetails(user)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg"
                            title="Ver información completa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Editar - Solo si tiene permisos */}
                        {canEditSpecificUser(user) && (
                          <button
                            onClick={() => handleEditUser(user)}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-700 p-2 rounded-lg"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Eliminar - Solo si tiene permisos */}
                        {canDeleteSpecificUser(user) && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* 📄 PAGINACIÓN */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-700">
                      Mostrando {((currentPage - 1) * usersPerPage) + 1} a {Math.min(currentPage * usersPerPage, totalUsers)} de {totalUsers} {userRole === 'colaborador' ? 'clientes' : 'usuarios'}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Anterior
                    </button>
                    
                    <span className="text-sm text-gray-700">
                      {currentPage} de {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* 🆕 MODAL PARA VER DETALLES COMPLETOS DEL USUARIO (SIN EDITAR) */}
      {showUserDetailsModal && viewingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-screen overflow-y-auto">
            
            {/* Header del modal */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-blue-600" />
                  Ver Información del Usuario
                </h3>
                <button
                  onClick={() => {
                    setShowUserDetailsModal(false);
                    setViewingUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Contenido del modal - INFORMACIÓN COMPLETA */}
            <div className="px-6 py-4">
              
              {/* Información básica con foto */}
              <div className="mb-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {viewingUser.profileImage ? (
                      <img
                        className="h-20 w-20 rounded-full object-cover border-4 border-blue-100"
                        src={viewingUser.profileImage}
                        alt={`${viewingUser.firstName} ${viewingUser.lastName}`}
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-200">
                        <span className="text-2xl font-medium text-blue-800">
                          {viewingUser.firstName[0]}{viewingUser.lastName[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900">
                      {viewingUser.firstName} {viewingUser.lastName}
                    </h4>
                    <p className="text-gray-600">{viewingUser.email}</p>
                    
                    <div className="flex items-center space-x-3 mt-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleInfo(viewingUser.role).color}`}>
                        {getRoleInfo(viewingUser.role).label}
                      </span>
                      
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        viewingUser.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {viewingUser.isActive ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Activo
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Inactivo
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Información detallada en grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Información personal */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Información Personal
                  </h5>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">ID de Usuario</label>
                      <p className="text-sm text-gray-900 font-mono">{viewingUser.id}</p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Completo</label>
                      <p className="text-sm text-gray-900">{viewingUser.firstName} {viewingUser.lastName}</p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</label>
                      <p className="text-sm text-gray-900">{viewingUser.email}</p>
                    </div>
                    
                    {viewingUser.phone && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</label>
                        <p className="text-sm text-gray-900">{viewingUser.phone}</p>
                      </div>
                    )}
                    
                    {viewingUser.dateOfBirth && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Nacimiento</label>
                        <p className="text-sm text-gray-900">
                          {formatDate(viewingUser.dateOfBirth)}
                          {calculateAge(viewingUser.dateOfBirth) && (
                            <span className="text-gray-500 ml-2">
                              ({calculateAge(viewingUser.dateOfBirth)} años)
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Información del sistema */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Información del Sistema
                  </h5>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</label>
                      <p className="text-sm text-gray-900">{getRoleInfo(viewingUser.role).label}</p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</label>
                      <p className="text-sm text-gray-900">
                        {viewingUser.isActive ? 'Activo' : 'Inactivo'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Registro</label>
                      <p className="text-sm text-gray-900">
                        {formatDate(viewingUser.createdAt || viewingUser.created_at)}
                      </p>
                    </div>
                    
                    {(viewingUser.updatedAt || viewingUser.updated_at) && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Última Actualización</label>
                        <p className="text-sm text-gray-900">
                          {formatDate(viewingUser.updatedAt || viewingUser.updated_at)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Contacto de emergencia si existe */}
                {viewingUser.emergencyContact && (viewingUser.emergencyContact.name || viewingUser.emergencyContact.phone) && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <Heart className="w-4 h-4 mr-2" />
                      Contacto de Emergencia
                    </h5>
                    
                    <div className="space-y-3">
                      {viewingUser.emergencyContact.name && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</label>
                          <p className="text-sm text-gray-900">{viewingUser.emergencyContact.name}</p>
                        </div>
                      )}
                      
                      {viewingUser.emergencyContact.phone && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</label>
                          <p className="text-sm text-gray-900">{viewingUser.emergencyContact.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Estadísticas adicionales si están disponibles */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Información Adicional
                  </h5>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tiempo como Usuario</label>
                      <p className="text-sm text-gray-900">
                        {(() => {
                          const createdAt = new Date(viewingUser.createdAt || viewingUser.created_at);
                          const now = new Date();
                          const diffTime = Math.abs(now - createdAt);
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          
                          if (diffDays < 30) {
                            return `${diffDays} día${diffDays !== 1 ? 's' : ''}`;
                          } else if (diffDays < 365) {
                            const months = Math.floor(diffDays / 30);
                            return `${months} mes${months !== 1 ? 'es' : ''}`;
                          } else {
                            const years = Math.floor(diffDays / 365);
                            return `${years} año${years !== 1 ? 's' : ''}`;
                          }
                        })()}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Usuario</label>
                      <p className="text-sm text-gray-900">
                        {viewingUser.role === 'cliente' ? 'Cliente del gimnasio' :
                         viewingUser.role === 'colaborador' ? 'Personal del gimnasio' :
                         'Administrador del sistema'}
                      </p>
                    </div>
                    
                    {viewingUser.profileImage && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Imagen de Perfil</label>
                        <p className="text-sm text-green-600">✅ Configurada</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
            </div>
            
            {/* Footer del modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {userRole === 'colaborador' ? (
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-1 text-blue-500" />
                    Modo visualización para colaboradores
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Info className="w-4 h-4 mr-1 text-gray-400" />
                    Información completa del usuario
                  </span>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowUserDetailsModal(false);
                    setViewingUser(null);
                  }}
                  className="btn-secondary"
                >
                  Cerrar
                </button>
                
                {/* Solo mostrar botón de editar si tiene permisos */}
                {canEditSpecificUser(viewingUser) && (
                  <button
                    onClick={() => {
                      setShowUserDetailsModal(false);
                      setViewingUser(null);
                      handleEditUser(viewingUser);
                    }}
                    className="btn-primary"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Usuario
                  </button>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}
      
      {/* 🆕 MODAL PARA CREAR/EDITAR USUARIO CON ROLES LIMITADOS (MANTENIDO IGUAL) */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            
            {/* Header del modal */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingUser ? 'Editar Usuario' : `Nuevo ${userRole === 'colaborador' ? 'Cliente' : 'Usuario'}`}
                </h3>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                    resetUserForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Información básica */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={userFormData.firstName}
                    onChange={(e) => handleFormChange('firstName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      fieldErrors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Juan"
                    maxLength="50"
                  />
                  {fieldErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.firstName}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={userFormData.lastName}
                    onChange={(e) => handleFormChange('lastName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      fieldErrors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Pérez"
                    maxLength="50"
                  />
                  {fieldErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.lastName}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="juan@ejemplo.com"
                    maxLength="100"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
                  </label>
                  <input
                    type="password"
                    value={userFormData.password}
                    onChange={(e) => handleFormChange('password', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      fieldErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder={editingUser ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'}
                  />
                  {fieldErrors.password && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.password}
                    </p>
                  )}
                  {!editingUser && (
                    <p className="mt-1 text-xs text-gray-500">
                      Debe contener al menos 6 caracteres, incluir letras y números
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={userFormData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      fieldErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="+502 1234-5678"
                    maxLength="20"
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.phone}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Solo números y caracteres: + - ( ) espacios
                  </p>
                </div>
                
                {/* 🔒 ROL LIMITADO PARA COLABORADORES */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol *
                  </label>
                  {userRole === 'colaborador' ? (
                    // Colaborador solo puede crear clientes
                    <div>
                      <input
                        type="text"
                        value="Cliente"
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                      />
                      <p className="mt-1 text-xs text-gray-500 flex items-center">
                        <Shield className="w-3 h-3 mr-1" />
                        Los colaboradores solo pueden crear usuarios clientes
                      </p>
                    </div>
                  ) : (
                    // Admin puede seleccionar cualquier rol disponible
                    <select
                      value={userFormData.role}
                      onChange={(e) => handleFormChange('role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {userRoles.forCreation.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={userFormData.dateOfBirth}
                    onChange={(e) => handleFormChange('dateOfBirth', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      fieldErrors.dateOfBirth ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                  />
                  {fieldErrors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.dateOfBirth}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Edad mínima permitida: 13 años
                  </p>
                </div>
                
                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={userFormData.isActive}
                      onChange={(e) => handleFormChange('isActive', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Usuario activo</span>
                  </label>
                </div>
                
                {/* Contacto de emergencia */}
                <div className="md:col-span-2">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 border-t border-gray-200 pt-4">
                    Contacto de Emergencia
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={userFormData.emergencyContact.name}
                        onChange={(e) => handleFormChange('emergencyContact', e.target.value, true, 'name')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="María Pérez"
                        maxLength="50"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Solo letras y espacios permitidos
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={userFormData.emergencyContact.phone}
                        onChange={(e) => handleFormChange('emergencyContact', e.target.value, true, 'phone')}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          fieldErrors['emergencyContact.phone'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="+502 1234-5678"
                        maxLength="20"
                      />
                      {fieldErrors['emergencyContact.phone'] && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {fieldErrors['emergencyContact.phone']}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Solo números y caracteres: + - ( ) espacios
                      </p>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
            
            {/* Footer del modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                  resetUserForm();
                }}
                className="btn-secondary"
                disabled={saving}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleCreateUser}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {editingUser ? 'Actualizar' : 'Crear'} {userRole === 'colaborador' ? 'Cliente' : 'Usuario'}
                  </>
                )}
              </button>
            </div>
            
          </div>
        </div>
      )}
      
    </div>
  );
};

export default UsersManager;

// 📝 CAMBIOS REALIZADOS PARA COLABORADOR:
// ✅ Solo puede ver usuarios clientes (filtrado automático)
// ✅ No puede editar usuarios existentes (botones ocultos)
// ✅ No puede eliminar usuarios (botones ocultos)
// ✅ Puede crear solo usuarios clientes (rol fijo en formulario)
// ✅ Estadísticas filtradas por roles visibles
// ✅ Interfaz adaptada con indicadores de permisos limitados
// ✅ Validaciones de permisos en todas las acciones
// ✅ Mensajes específicos para colaboradores
// ✅ Mantiene toda la funcionalidad para administradores