// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/UsersManager.js
// ✅ VERSION COMPLETA - CON PESTAÑA DE TESTIMONIOS
// ✅ TODAS LAS FUNCIONALIDADES ORIGINALES MANTENIDAS

import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, Filter, Edit, Trash2, Eye, UserCheck, UserX,
  Calendar, Phone, Mail, MapPin, AlertCircle, CheckCircle, Loader,
  Download, Upload, RefreshCw, MoreHorizontal, Settings, Star,
  TrendingUp, TrendingDown, Activity, X, Shield, Lock, Info,
  User, Clock, FileText, Heart, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

// ✅ IMPORT del componente de testimonios
import TestimonialsAdminManager from './TestimonialsAdminManager';

const UsersManager = ({ onSave, onUnsavedChanges }) => {
  const { 
    user: currentUser, 
    hasPermission,
    canViewUsersOfRole,
    getViewableUserRoles,
    canCreateUsers,
    canEditUsers,
    canDeleteUsers,
    canViewUserDetails,
    canEditSpecificUser,
    canDeleteSpecificUser,
    userRole
  } = useAuth();
  
  const { showSuccess, showError, formatDate, formatCurrency, isMobile } = useApp();
  
  // ✅ NUEVO: Estado para pestañas
  const [activeTab, setActiveTab] = useState('users');
  
  // Estados principales
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(isMobile ? 10 : 20);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Estados para crear/editar usuario
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Estados para VER DETALLES de usuario (SIN EDITAR)
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

  // Estados para validaciones
  const [fieldErrors, setFieldErrors] = useState({});
  
  // ✅ NUEVO: Definición de pestañas
  const tabs = [
    {
      id: 'users',
      label: 'Usuarios',
      icon: Users,
      description: 'Gestión de usuarios del sistema'
    },
    {
      id: 'testimonials',
      label: 'Testimonios',
      icon: MessageSquare,
      description: 'Gestión de testimonios y sugerencias'
    }
  ];
  
  // Obtener roles disponibles según permisos del usuario actual
  const getAvailableUserRoles = () => {
    const viewableRoles = getViewableUserRoles();
    const allRoles = [
      { value: 'cliente', label: 'Cliente', color: 'bg-green-100 text-green-800' },
      { value: 'colaborador', label: 'Personal', color: 'bg-blue-100 text-blue-800' },
      { value: 'admin', label: 'Administrador', color: 'bg-purple-100 text-purple-800' }
    ];
    
    const availableForFilters = allRoles.filter(role => viewableRoles.includes(role.value));
    
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

  // FUNCIONES DE VALIDACIÓN
  
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
  
  // CARGAR DATOS CON FILTROS DE ROL APLICADOS
  const loadUsers = async () => {
  try {
    setLoading(true);
    
    const viewableRoles = getViewableUserRoles();
    
    const params = {
      page: currentPage,
      limit: usersPerPage,
      search: searchTerm || undefined,
      sortBy,
      sortOrder
    };
    
    // Aplicar filtro de rol
    if (viewableRoles.length === 1) {
      params.role = viewableRoles[0];
    } else if (selectedRole !== 'all' && viewableRoles.includes(selectedRole)) {
      params.role = selectedRole;
    }
    
    // Aplicar filtro de estado
    if (selectedStatus !== 'all') {
      params.isActive = selectedStatus === 'active';
    }
    
    console.log('Cargando usuarios con parámetros:', params);
    
    // ✅ CAMBIO PRINCIPAL: apiService ahora retorna { users: [...], pagination: {...} }
    const response = await apiService.getUsers(params);
    
    console.log('📦 Response from apiService:', response);
    
    // ✅ Extraer users y pagination de la respuesta
    if (response && response.users) {
      const { users: fetchedUsers, pagination } = response;
      
      // Filtrar usuarios según permisos (validación extra del lado del cliente)
      const filteredUsers = fetchedUsers.filter(user => {
        return canViewUsersOfRole(user.role);
      });
      
      setUsers(filteredUsers);
      setTotalUsers(pagination?.total || filteredUsers.length);
      
      console.log('✅ Users loaded successfully:', {
        displayed: filteredUsers.length,
        total: pagination?.total,
        page: pagination?.page
      });
      
    } else {
      console.warn('⚠️ Unexpected response format');
      setUsers([]);
      setTotalUsers(0);
    }
    
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    
    if (userRole === 'admin') {
      showError('Error al cargar usuarios: ' + (error.message || 'Error desconocido'));
    } else {
      console.log('Error silenciado para colaborador');
    }
    
    setUsers([]);
    setTotalUsers(0);
  } finally {
    setLoading(false);
  }
};
  
  // Cargar estadísticas
  const loadUserStats = async () => {
  try {
    // ✅ CAMBIO: Pasar el rol actual para filtrado correcto en el backend
    const stats = await apiService.getUserStats(userRole);
    
    console.log('📊 Stats received:', stats);
    
    // Las stats ya vienen filtradas según el rol del usuario
    setUserStats(stats);
    
  } catch (error) {
    console.log('Error al cargar estadísticas (silenciado):', error.message);
    
    // Calcular stats locales como fallback
    const viewableRoles = getViewableUserRoles();
    const filteredUsers = users.filter(user => viewableRoles.includes(user.role));
    
    const localStats = {
      totalUsers: filteredUsers.length,
      totalActiveUsers: filteredUsers.filter(u => u.isActive).length,
      totalInactiveUsers: filteredUsers.filter(u => !u.isActive).length,
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
  
  // Cargar datos al montar
  useEffect(() => {
    const loadDataSilently = async () => {
      try {
        await loadUsers();
      } catch (error) {
        console.log('Carga inicial (error silenciado):', error.message);
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
          console.log('Carga de estadísticas (error silenciado):', error.message);
        }
      };
      
      loadStatsSilently();
    }
  }, [users, totalUsers]);
  
  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
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
  
  // FUNCIONES DE USUARIO
  
  const handleViewUserDetails = (user) => {
  if (!canViewUserDetails(user)) {
    console.log('No se pueden ver detalles (permisos)');
    return;
  }
  
  console.log('👁️ Viewing user details:', user.email); // ✅ AGREGADO
  
  setViewingUser(user);
  setShowUserDetailsModal(true);
 };
  
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
    
    // Validación extra para colaboradores
    if (userRole === 'colaborador' && userFormData.role !== 'cliente') {
      showError('Los colaboradores solo pueden crear usuarios clientes');
      return;
    }
    
    const userData = {
      ...userFormData,
      emergencyContact: userFormData.emergencyContact.name 
        ? userFormData.emergencyContact 
        : undefined
    };
    
    if (editingUser) {
      // ✅ ACTUALIZAR USUARIO EXISTENTE
      if (!canEditSpecificUser(editingUser)) {
        showError('No tienes permisos para editar este usuario');
        return;
      }
      
      // ✅ CAMBIO: updateUser ahora retorna el usuario directamente
      // Los mensajes toast se manejan automáticamente en el servicio
      await apiService.updateUser(
        editingUser.id, 
        userData,
        userRole,
        currentUser?.id
      );
      
      console.log('✅ User updated successfully');
      
    } else {
      // ✅ CREAR USUARIO NUEVO
      // ✅ CAMBIO: createUser ahora retorna el usuario directamente
      // Los mensajes toast se manejan automáticamente en el servicio
      await apiService.createUser(userData, userRole);
      
      console.log('✅ User created successfully');
    }
    
    // Recargar datos
    await loadUsers();
    await loadUserStats();
    
    // Cerrar modal y limpiar
    setShowUserModal(false);
    setEditingUser(null);
    resetUserForm();
    
    if (onSave) {
      onSave({ 
        type: 'user', 
        action: editingUser ? 'updated' : 'created' 
      });
    }
    
  } catch (error) {
    console.error('Error al guardar usuario:', error);
    // El error ya fue mostrado por el servicio con toast
    // No necesitamos mostrar otro mensaje aquí
  } finally {
    setSaving(false);
  }
};
  
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
    // ✅ CAMBIO: deleteUser ahora maneja todo el flujo correctamente
    // Pasa el rol y el ID del usuario actual para validaciones
    await apiService.deleteUser(userId, userRole, currentUser?.id);
    
    console.log('✅ User deleted successfully');
    // El mensaje de éxito ya se mostró en el servicio
    
    // Recargar datos
    await loadUsers();
    await loadUserStats();
    
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    // El error ya fue mostrado por el servicio con toast
  }
};
  
  const handleToggleUserStatus = async (userId, currentStatus) => {
  const userToToggle = users.find(u => u.id === userId);
  
  if (!canEditSpecificUser(userToToggle)) {
    console.log('Colaborador no puede cambiar estado (permisos)');
    return;
  }
  
  try {
    // ✅ CAMBIO: Usar updateUser para cambiar solo el estado
    // Pasamos solo { isActive: !currentStatus } como actualización parcial
    await apiService.updateUser(
      userId,
      { isActive: !currentStatus },
      userRole,
      currentUser?.id
    );
    
    console.log('✅ User status toggled successfully');
    // El mensaje de éxito ya se mostró en el servicio
    
    // Recargar datos
    await loadUsers();
    await loadUserStats();
    
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    // El error ya fue mostrado por el servicio con toast
  }
};
  
  const resetUserForm = () => {
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
  
  const handleEditUser = (user) => {
  if (!canEditSpecificUser(user)) {
    console.log('Colaborador no puede editar (permisos)');
    return;
  }
  
  setEditingUser(user);
  setUserFormData({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    password: '', // Siempre vacío al editar
    phone: user.phone || '',
    role: user.role || 'cliente',
    // ✅ CAMBIO: Formato correcto de fecha para input type="date"
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
    emergencyContact: {
      name: user.emergencyContact?.name || '',
      phone: user.emergencyContact?.phone || ''
    },
    isActive: user.isActive !== false // Default true si no está definido
  });
  setFieldErrors({});
  setShowUserModal(true);
};
  const handleNewUser = () => {
    if (!canCreateUsers()) {
      showError('No tienes permisos para crear usuarios');
      return;
    }
    
    setEditingUser(null);
    resetUserForm();
    setShowUserModal(true);
  };
  
  const getRoleInfo = (role) => {
    return userRoles.forFilters.find(r => r.value === role) || 
           { value: role, label: role, color: 'bg-gray-100 text-gray-800' };
  };
  
  const totalPages = Math.max(1, Math.ceil(totalUsers / usersPerPage));

  const truncateText = (text, maxLength = 20) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      
      {/* ✅ NAVEGACIÓN POR PESTAÑAS */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                title={tab.description}
              >
                <TabIcon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* ✅ PESTAÑA: USUARIOS (TODO EL CONTENIDO ORIGINAL COMPLETO) */}
      {activeTab === 'users' && (
        <>
          
          {/* ENCABEZADO */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Users className="w-6 h-6 mr-2 text-blue-600" />
                Gestión de Usuarios
                
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
          
          {/* ESTADÍSTICAS RÁPIDAS */}
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
          
          {/* FILTROS Y BÚSQUEDA */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
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
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
              
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
          
          {/* TABLA DE USUARIOS */}
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
                                
                                {canViewUserDetails(user) && (
                                  <button
                                    onClick={() => handleViewUserDetails(user)}
                                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-all hover:scale-105"
                                    title="Ver información completa"
                                  >
                                    <Eye className="w-5 h-5" />
                                  </button>
                                )}
                                
                                {canEditSpecificUser(user) && (
                                  <button
                                    onClick={() => handleEditUser(user)}
                                    className="bg-amber-100 hover:bg-amber-200 text-amber-700 p-2 rounded-lg transition-all hover:scale-105"
                                    title="Editar usuario"
                                  >
                                    <Edit className="w-5 h-5" />
                                  </button>
                                )}
                                
                                {canDeleteSpecificUser(user) && (
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-all hover:scale-105"
                                    title="Eliminar usuario"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                )}
                                
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
                
                {/* Mobile Cards */}
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
                            
                            {canViewUserDetails(user) && (
                              <button
                                onClick={() => handleViewUserDetails(user)}
                                className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg"
                                title="Ver información completa"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            
                            {canEditSpecificUser(user) && (
                              <button
                                onClick={() => handleEditUser(user)}
                                className="bg-amber-100 hover:bg-amber-200 text-amber-700 p-2 rounded-lg"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            
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
                
                {/* PAGINACIÓN */}
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
          
          {/* MODAL PARA VER DETALLES COMPLETOS DEL USUARIO */}
          {showUserDetailsModal && viewingUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-screen overflow-y-auto">
                
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
                
                <div className="px-6 py-4">
                  
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
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
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Correo Electrónico</label>
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
                            <p className="text-sm text-green-600">Configurada</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                </div>
                
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
          
          {/* MODAL PARA CREAR/EDITAR USUARIO */}
          {showUserModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
                
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
                
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
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
                        Correo Electrónico *
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
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rol *
                      </label>
                      {userRole === 'colaborador' ? (
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
        </>
      )}
      
      {/* ✅ PESTAÑA: TESTIMONIOS */}
      {activeTab === 'testimonials' && (
        <TestimonialsAdminManager 
          onSave={onSave}
          onUnsavedChanges={onUnsavedChanges}
        />
      )}
      
    </div>
  );
};

export default UsersManager;
/*
 * COMPONENTE: UsersManager
 * AUTOR: Alexander Echeverria
 * 
 * PROPÓSITO:
 * Este componente proporciona una gestión completa y segura de usuarios del gimnasio con un 
 * sistema avanzado de permisos que diferencia entre administradores y colaboradores.
 * Permite visualizar, crear, editar y eliminar usuarios con controles de acceso específicos.
 * 
 * FUNCIONALIDADES PARA ADMINISTRADORES:
 * 
 * GESTIÓN COMPLETA DE USUARIOS:
 * - Ver todos los usuarios del sistema (clientes, colaboradores, administradores)
 * - Crear usuarios con cualquier rol disponible
 * - Editar información completa de cualquier usuario
 * - Eliminar usuarios del sistema
 * - Activar/desactivar cuentas de usuario
 * - Cambiar roles y permisos
 * 
 * DASHBOARD Y ESTADÍSTICAS:
 * - Total de usuarios registrados en el sistema
 * - Usuarios activos e inactivos
 * - Nuevos usuarios del mes actual
 * - Distribución por roles (cliente, colaborador, administrador)
 * - Gráficos de tendencias y crecimiento
 * 
 * FUNCIONALIDADES PARA COLABORADORES:
 * 
 * ACCESO LIMITADO Y SEGURO:
 * - Ver únicamente información de clientes (no otros colaboradores ni admins)
 * - Crear nuevos usuarios solo con rol de cliente
 * - Ver detalles completos de clientes sin poder editarlos
 * - Indicadores visuales claros de permisos limitados
 * - Acceso a estadísticas filtradas solo de clientes
 * 
 * RESTRICCIONES DE SEGURIDAD:
 * - No puede editar usuarios existentes
 * - No puede eliminar usuarios
 * - No puede cambiar estados de usuarios
 * - Solo visualización de datos sin acciones destructivas
 * - Errores silenciados para mejor experiencia de usuario
 * 
 * SISTEMA DE BÚSQUEDA Y FILTROS:
 * 
 * BÚSQUEDA AVANZADA:
 * - Búsqueda por nombre completo de usuario
 * - Búsqueda por dirección de correo electrónico
 * - Búsqueda en tiempo real sin necesidad de botones
 * - Resultados instantáneos mientras el usuario escribe
 * 
 * FILTROS INTELIGENTES:
 * - Filtro por rol (adaptado a permisos del usuario actual)
 * - Filtro por estado (activo/inactivo)
 * - Ordenamiento por fecha de creación, nombre, rol
 * - Filtros persistentes durante la sesión
 * 
 * FORMULARIO DE CREACIÓN/EDICIÓN:
 * 
 * INFORMACIÓN PERSONAL:
 * - Nombre y apellido con validación de caracteres especiales
 * - Correo electrónico con validación de formato
 * - Teléfono con formato internacional (+502)
 * - Fecha de nacimiento con validación de edad mínima (13 años)
 * 
 * INFORMACIÓN DE SEGURIDAD:
 * - Contraseña con validación de fortaleza (mínimo 6 caracteres, letras y números)
 * - Selección de rol (limitada según permisos del usuario actual)
 * - Estado activo/inactivo del usuario
 * 
 * CONTACTO DE EMERGENCIA:
 * - Nombre del contacto de emergencia
 * - Teléfono del contacto con validación
 * - Campos opcionales pero recomendados para seguridad
 * 
 * VALIDACIONES Y SEGURIDAD:
 * 
 * VALIDACIONES EN TIEMPO REAL:
 * - Nombres: Solo letras, espacios, guiones y acentos
 * - Teléfonos: Solo números y caracteres (+, -, (), espacios)
 * - Correos: Formato válido con verificación completa
 * - Contraseñas: Combinación de letras y números
 * - Edad: Mínimo 13 años calculado automáticamente
 * 
 * CONTROLES DE ACCESO:
 * - Verificación de permisos antes de cada acción
 * - Botones condicionados según rol del usuario
 * - Filtrado automático de datos según permisos
 * - Logs silenciosos para colaboradores sin permisos
 * 
 * INTERFAZ DE USUARIO:
 * 
 * VISTA DE ESCRITORIO:
 * - Tabla completa con información organizada en columnas
 * - Avatar personalizable o iniciales automáticas
 * - Estados visuales con colores (verde=activo, rojo=inactivo)
 * - Botones de acción con iconos descriptivos
 * - Tooltips informativos en cada botón
 * 
 * VISTA MÓVIL:
 * - Tarjetas responsivas para dispositivos pequeños
 * - Información condensada pero completa
 * - Botones adaptados para touch
 * - Navegación optimizada para móviles
 * 
 * PAGINACIÓN Y RENDIMIENTO:
 * - Paginación inteligente (10 usuarios en móvil, 20 en escritorio)
 * - Navegación entre páginas con contadores
 * - Indicadores de progreso durante la carga
 * - Optimización de consultas según filtros
 * 
 * MODAL DE DETALLES COMPLETOS:
 * 
 * INFORMACIÓN EXPANDIDA:
 * - Vista completa de todos los datos del usuario
 * - Información personal organizada en secciones
 * - Datos del sistema (fechas, IDs, configuraciones)
 * - Contacto de emergencia si está configurado
 * - Estadísticas adicionales (tiempo como usuario, tipo)
 * 
 * EXPERIENCIA VISUAL:
 * - Avatar grande o iniciales prominentes
 * - Códigos de color para roles y estados
 * - Secciones organizadas con iconos descriptivos
 * - Información de contexto y ayuda
 * 
 * CONEXIONES Y DEPENDENCIAS:
 * 
 * CONTEXTOS:
 * - AuthContext: Sistema completo de autenticación y autorización
 *   * Verificación de roles y permisos específicos
 *   * Funciones de control de acceso granular
 *   * Información del usuario actual
 * - AppContext: Utilidades del sistema
 *   * Notificaciones de éxito y error
 *   * Formateo de fechas y monedas
 *   * Detección de dispositivos móviles
 * 
 * SERVICIOS API:
 * - apiService: Comunicación con el backend
 * 
 * ENDPOINTS CONECTADOS:
 * - GET /api/users: Obtiene lista de usuarios con filtros y paginación
 * - POST /api/users: Crea nuevos usuarios con validación
 * - PUT /api/users/:id: Actualiza información de usuarios existentes
 * - DELETE /api/users/:id: Elimina usuarios del sistema
 * - GET /api/users/stats: Obtiene estadísticas y métricas de usuarios
 * 
 * FUNCIONES DE PERMISOS UTILIZADAS:
 * - canViewUsersOfRole(role): Verifica si puede ver usuarios de un rol específico
 * - getViewableUserRoles(): Obtiene lista de roles que puede visualizar
 * - canCreateUsers(): Verifica permisos de creación
 * - canEditUsers(): Verifica permisos de edición general
 * - canDeleteUsers(): Verifica permisos de eliminación general
 * - canViewUserDetails(user): Verifica si puede ver detalles de un usuario específico
 * - canEditSpecificUser(user): Verifica si puede editar un usuario específico
 * - canDeleteSpecificUser(user): Verifica si puede eliminar un usuario específico
 * 
 * PROPIEDADES RECIBIDAS:
 * - onSave: Función callback ejecutada tras operaciones exitosas
 * - onUnsavedChanges: Función callback para notificar cambios pendientes
 * 
 * TECNOLOGÍAS:
 * - React con Hooks (useState, useEffect) para manejo de estado complejo
 * - Lucide React para iconografía moderna y consistente
 * - Tailwind CSS para estilos responsivos y utilities-first
 * - JavaScript ES6+ con validaciones avanzadas
 * - Expresiones regulares para validación de formatos
 * - Cálculos de edad y fechas automáticos
 * 
 * IMPACTO EN EL NEGOCIO:
 * - Control centralizado de acceso al sistema
 * - Gestión segura de información de clientes
 * - Trazabilidad completa de usuarios y cambios
 * - Facilita el trabajo del personal con permisos apropiados
 * - Protege información sensible con controles de acceso
 * - Mejora la eficiencia operativa con búsquedas y filtros
 * - Cumple con estándares de seguridad y privacidad
 * 
 * BENEFICIOS PARA EL USUARIO:
 * - Interfaz intuitiva adaptada al rol del usuario
 * - Feedback inmediato en todas las acciones
 * - Formularios con validación en tiempo real
 * - Búsqueda rápida y efectiva de usuarios
 * - Vista detallada de información completa
 * - Experiencia optimizada para móviles y escritorio
 * - Operaciones seguras con confirmaciones apropiadas
 */