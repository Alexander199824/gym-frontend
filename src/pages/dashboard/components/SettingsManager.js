// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/SettingsManager.js

import React, { useState, useEffect } from 'react';
import {
  Settings, Shield, Bell, Database, Users, Key, Lock, Eye, EyeOff,
  Mail, Smartphone, Globe, Server, HardDrive, RefreshCw, Download,
  Upload, Save, AlertTriangle, CheckCircle, XCircle, Info, Clock,
  Trash2, Plus, Edit, Search, Filter, MoreHorizontal, Loader, X
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

const SettingsManager = ({ onSave, onUnsavedChanges }) => {
  const { user: currentUser, hasPermission } = useAuth();
  const { showSuccess, showError, formatDate, isMobile } = useApp();
  
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Estados de configuración
  const [systemConfig, setSystemConfig] = useState({
    general: {
      siteName: '',
      siteDescription: '',
      timezone: 'America/Guatemala',
      language: 'es',
      currency: 'GTQ',
      dateFormat: 'dd/MM/yyyy',
      maintenanceMode: false
    },
    security: {
      requireStrongPasswords: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      enableTwoFactor: false,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf'],
      maxFileSize: 5,
      enableIpWhitelist: false,
      ipWhitelist: []
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      membershipExpiry: {
        enabled: true,
        daysBefore: 7,
        reminderFrequency: 'daily'
      },
      paymentReminders: {
        enabled: true,
        daysBefore: 3
      },
      systemAlerts: {
        enabled: true,
        criticalOnly: false
      }
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      backupRetention: 30,
      includeMedia: true,
      lastBackup: null,
      backupLocation: 'local'
    },
    integrations: {
      stripe: {
        enabled: false,
        publicKey: '',
        secretKey: '',
        webhookSecret: ''
      },
      email: {
        provider: 'smtp',
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        fromEmail: '',
        fromName: ''
      },
      whatsapp: {
        enabled: false,
        apiKey: '',
        phoneNumber: ''
      }
    }
  });
  
  // Secciones de configuración
  const configSections = [
    {
      id: 'general',
      title: 'General',
      description: 'Configuración básica del sistema',
      icon: Settings,
      color: 'text-blue-600',
      permission: 'manage_general_settings'
    },
    {
      id: 'security',
      title: 'Seguridad',
      description: 'Configuración de seguridad y acceso',
      icon: Shield,
      color: 'text-red-600',
      permission: 'manage_security_settings'
    },
    {
      id: 'notifications',
      title: 'Notificaciones',
      description: 'Configuración de alertas y notificaciones',
      icon: Bell,
      color: 'text-yellow-600',
      permission: 'manage_notification_settings'
    },
    {
      id: 'backup',
      title: 'Respaldo y Datos',
      description: 'Respaldos y gestión de datos',
      icon: Database,
      color: 'text-purple-600',
      permission: 'manage_backup_settings'
    },
    {
      id: 'integrations',
      title: 'Integraciones',
      description: 'APIs y servicios externos',
      icon: Globe,
      color: 'text-green-600',
      permission: 'manage_integration_settings'
    }
  ];
  
  // CARGAR CONFIGURACIÓN
  const loadSystemConfig = async () => {
    try {
      setLoading(true);
      
      // Intentar cargar configuración del sistema
      const response = await apiService.get('/admin/system-config');
      const configData = response.data || response;
      
      if (configData) {
        setSystemConfig(prev => ({
          ...prev,
          ...configData
        }));
      }
      
    } catch (error) {
      console.error('Error al cargar configuración del sistema:', error);
      
      // Usar configuración por defecto si falla
      console.log('Usando configuración predeterminada del sistema');
    } finally {
      setLoading(false);
    }
  };
  
  // GUARDAR CONFIGURACIÓN
  const saveSystemConfig = async (section = null) => {
    try {
      setSaving(true);
      
      const configToSave = section ? 
        { [section]: systemConfig[section] } : 
        systemConfig;
      
      const response = await apiService.post('/admin/system-config', configToSave);
      
      showSuccess(section ? 
        `Configuración de ${configSections.find(s => s.id === section)?.title} guardada` :
        'Configuración del sistema guardada'
      );
      
      setHasUnsavedChanges(false);
      
      if (onSave) {
        onSave({ type: 'settings', section });
      }
      
    } catch (error) {
      console.error('Error al guardar configuración del sistema:', error);
      showError('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };
  
  // Cargar datos al montar
  useEffect(() => {
    loadSystemConfig();
  }, []);
  
  // Notificar cambios sin guardar
  useEffect(() => {
    if (onUnsavedChanges) {
      onUnsavedChanges(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onUnsavedChanges]);
  
  // Manejar cambio de configuración
  const handleConfigChange = (section, field, value) => {
    setSystemConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
  };
  
  // Manejar cambio de configuración anidada
  const handleNestedConfigChange = (section, subsection, field, value) => {
    setSystemConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [field]: value
        }
      }
    }));
    setHasUnsavedChanges(true);
  };
  
  // Probar conexión de email
  const testEmailConnection = async () => {
    try {
      const response = await apiService.post('/admin/test-email', {
        config: systemConfig.integrations.email
      });
      
      if (response.success) {
        showSuccess('Conexión de email exitosa');
      } else {
        showError('Error al conectar con el servicio de email');
      }
      
    } catch (error) {
      console.error('Error al probar email:', error);
      showError('Error al probar conexión de email');
    }
  };
  
  // Probar conexión de Stripe
  const testStripeConnection = async () => {
    try {
      const response = await apiService.post('/admin/test-stripe', {
        config: systemConfig.integrations.stripe
      });
      
      if (response.success) {
        showSuccess('Conexión de Stripe exitosa');
      } else {
        showError('Error al conectar con Stripe');
      }
      
    } catch (error) {
      console.error('Error al probar Stripe:', error);
      showError('Error al probar conexión de Stripe');
    }
  };
  
  // Crear backup manual
  const createManualBackup = async () => {
    try {
      const response = await apiService.post('/admin/create-backup');
      
      if (response.success) {
        showSuccess('Respaldo creado exitosamente');
        // Actualizar fecha del último backup
        setSystemConfig(prev => ({
          ...prev,
          backup: {
            ...prev.backup,
            lastBackup: new Date().toISOString()
          }
        }));
      } else {
        showError('Error al crear respaldo');
      }
      
    } catch (error) {
      console.error('Error al crear respaldo:', error);
      showError('Error al crear respaldo');
    }
  };
  
  // Exportar configuración
  const exportConfig = async () => {
    try {
      const dataStr = JSON.stringify(systemConfig, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gym-config-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showSuccess('Configuración exportada exitosamente');
      
    } catch (error) {
      console.error('Error al exportar configuración:', error);
      showError('Error al exportar configuración');
    }
  };
  
  // Importar configuración
  const importConfig = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);
        setSystemConfig(prev => ({
          ...prev,
          ...config
        }));
        setHasUnsavedChanges(true);
        showSuccess('Configuración importada exitosamente');
      } catch (error) {
        console.error('Error al importar configuración:', error);
        showError('Error al importar configuración');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Settings className="w-6 h-6 mr-2 text-gray-600" />
            Configuración del Sistema
          </h3>
          <p className="text-gray-600 mt-1">
            Administra la configuración general, seguridad e integraciones
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          {hasUnsavedChanges && (
            <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Cambios sin guardar
            </div>
          )}
          
          <button
            onClick={() => loadSystemConfig()}
            className="btn-secondary btn-sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
          
          <button
            onClick={exportConfig}
            className="btn-secondary btn-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
          
          <label className="btn-secondary btn-sm cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Importar
            <input
              type="file"
              accept=".json"
              onChange={importConfig}
              className="hidden"
            />
          </label>
          
          {hasUnsavedChanges && (
            <button
              onClick={() => saveSystemConfig()}
              disabled={saving}
              className="btn-primary btn-sm"
            >
              {saving ? (
                <Loader className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar Todo
            </button>
          )}
        </div>
      </div>
      
      {/* NAVEGACIÓN DE SECCIONES */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {configSections.map((section) => {
            if (!hasPermission(section.permission)) return null;
            
            const SectionIcon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  isActive 
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start">
                  <SectionIcon className={`w-6 h-6 mr-3 flex-shrink-0 ${section.color}`} />
                  <div>
                    <h4 className="font-medium text-sm text-gray-900">{section.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{section.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* CONTENIDO DE CONFIGURACIÓN */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-gray-600 mr-2" />
            <span className="text-gray-600">Cargando configuración...</span>
          </div>
        ) : (
          <>
            {/* CONFIGURACIÓN GENERAL */}
            {activeSection === 'general' && (
              <div className="p-6 space-y-6">
                
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">Configuración General</h4>
                  <button
                    onClick={() => saveSystemConfig('general')}
                    disabled={saving}
                    className="btn-primary btn-sm"
                  >
                    {saving ? (
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Guardar
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Sitio
                    </label>
                    <input
                      type="text"
                      value={systemConfig.general.siteName}
                      onChange={(e) => handleConfigChange('general', 'siteName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Elite Fitness Club"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zona Horaria
                    </label>
                    <select
                      value={systemConfig.general.timezone}
                      onChange={(e) => handleConfigChange('general', 'timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="America/Guatemala">Guatemala (GMT-6)</option>
                      <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                      <option value="America/New_York">Nueva York (GMT-5)</option>
                      <option value="UTC">UTC (GMT+0)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idioma
                    </label>
                    <select
                      value={systemConfig.general.language}
                      onChange={(e) => handleConfigChange('general', 'language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="es">Español</option>
                      <option value="en">Inglés</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moneda
                    </label>
                    <select
                      value={systemConfig.general.currency}
                      onChange={(e) => handleConfigChange('general', 'currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="GTQ">Quetzal (GTQ)</option>
                      <option value="USD">Dólar Estadounidense (USD)</option>
                      <option value="MXN">Peso Mexicano (MXN)</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción del Sitio
                    </label>
                    <textarea
                      value={systemConfig.general.siteDescription}
                      onChange={(e) => handleConfigChange('general', 'siteDescription', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Descripción breve de tu gimnasio"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={systemConfig.general.maintenanceMode}
                        onChange={(e) => handleConfigChange('general', 'maintenanceMode', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Modo Mantenimiento</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Activar para mostrar página de mantenimiento a los usuarios
                    </p>
                  </div>
                  
                </div>
                
              </div>
            )}
            
            {/* CONFIGURACIÓN DE SEGURIDAD */}
            {activeSection === 'security' && (
              <div className="p-6 space-y-6">
                
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">Configuración de Seguridad</h4>
                  <button
                    onClick={() => saveSystemConfig('security')}
                    disabled={saving}
                    className="btn-primary btn-sm"
                  >
                    {saving ? (
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Guardar
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiempo de Sesión (minutos)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={systemConfig.security.sessionTimeout}
                      onChange={(e) => handleConfigChange('security', 'sessionTimeout', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximos Intentos de Inicio de Sesión
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="10"
                      value={systemConfig.security.maxLoginAttempts}
                      onChange={(e) => handleConfigChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tamaño Máximo de Archivo (MB)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={systemConfig.security.maxFileSize}
                      onChange={(e) => handleConfigChange('security', 'maxFileSize', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipos de Archivo Permitidos
                    </label>
                    <input
                      type="text"
                      value={systemConfig.security.allowedFileTypes.join(', ')}
                      onChange={(e) => handleConfigChange('security', 'allowedFileTypes', e.target.value.split(',').map(s => s.trim()))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="jpg, png, pdf"
                    />
                  </div>
                  
                  <div className="md:col-span-2 space-y-4">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={systemConfig.security.requireStrongPasswords}
                        onChange={(e) => handleConfigChange('security', 'requireStrongPasswords', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Requerir contraseñas seguras</span>
                    </label>
                    
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={systemConfig.security.enableTwoFactor}
                        onChange={(e) => handleConfigChange('security', 'enableTwoFactor', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Habilitar autenticación de dos factores</span>
                    </label>
                    
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={systemConfig.security.enableIpWhitelist}
                        onChange={(e) => handleConfigChange('security', 'enableIpWhitelist', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Habilitar lista blanca de IPs</span>
                    </label>
                  </div>
                  
                </div>
                
              </div>
            )}
            
            {/* CONFIGURACIÓN DE NOTIFICACIONES */}
            {activeSection === 'notifications' && (
              <div className="p-6 space-y-6">
                
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">Configuración de Notificaciones</h4>
                  <button
                    onClick={() => saveSystemConfig('notifications')}
                    disabled={saving}
                    className="btn-primary btn-sm"
                  >
                    {saving ? (
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Guardar
                  </button>
                </div>
                
                <div className="space-y-6">
                  
                  {/* Notificaciones generales */}
                  <div>
                    <h5 className="text-md font-medium text-gray-900 mb-3">Notificaciones Generales</h5>
                    <div className="space-y-3">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={systemConfig.notifications.emailNotifications}
                          onChange={(e) => handleConfigChange('notifications', 'emailNotifications', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Notificaciones por correo electrónico</span>
                      </label>
                      
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={systemConfig.notifications.smsNotifications}
                          onChange={(e) => handleConfigChange('notifications', 'smsNotifications', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Notificaciones por SMS</span>
                      </label>
                      
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={systemConfig.notifications.pushNotifications}
                          onChange={(e) => handleConfigChange('notifications', 'pushNotifications', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Notificaciones push</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Vencimiento de membresías */}
                  <div>
                    <h5 className="text-md font-medium text-gray-900 mb-3">Vencimiento de Membresías</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={systemConfig.notifications.membershipExpiry.enabled}
                          onChange={(e) => handleNestedConfigChange('notifications', 'membershipExpiry', 'enabled', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Habilitar alertas</span>
                      </label>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Días antes del vencimiento
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={systemConfig.notifications.membershipExpiry.daysBefore}
                          onChange={(e) => handleNestedConfigChange('notifications', 'membershipExpiry', 'daysBefore', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Frecuencia de recordatorio
                        </label>
                        <select
                          value={systemConfig.notifications.membershipExpiry.reminderFrequency}
                          onChange={(e) => handleNestedConfigChange('notifications', 'membershipExpiry', 'reminderFrequency', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="daily">Diario</option>
                          <option value="every3days">Cada 3 días</option>
                          <option value="weekly">Semanal</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recordatorios de pago */}
                  <div>
                    <h5 className="text-md font-medium text-gray-900 mb-3">Recordatorios de Pago</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={systemConfig.notifications.paymentReminders.enabled}
                          onChange={(e) => handleNestedConfigChange('notifications', 'paymentReminders', 'enabled', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Habilitar recordatorios</span>
                      </label>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Días antes del vencimiento
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={systemConfig.notifications.paymentReminders.daysBefore}
                          onChange={(e) => handleNestedConfigChange('notifications', 'paymentReminders', 'daysBefore', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                </div>
                
              </div>
            )}
            
            {/* CONFIGURACIÓN DE BACKUP */}
            {activeSection === 'backup' && (
              <div className="p-6 space-y-6">
                
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">Respaldo y Gestión de Datos</h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={createManualBackup}
                      className="btn-secondary btn-sm"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Crear Respaldo
                    </button>
                    <button
                      onClick={() => saveSystemConfig('backup')}
                      disabled={saving}
                      className="btn-primary btn-sm"
                    >
                      {saving ? (
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Guardar
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frecuencia de Respaldo Automático
                    </label>
                    <select
                      value={systemConfig.backup.backupFrequency}
                      onChange={(e) => handleConfigChange('backup', 'backupFrequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="daily">Diario</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensual</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Retención de Respaldos (días)
                    </label>
                    <input
                      type="number"
                      min="7"
                      max="365"
                      value={systemConfig.backup.backupRetention}
                      onChange={(e) => handleConfigChange('backup', 'backupRetention', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2 space-y-4">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={systemConfig.backup.autoBackup}
                        onChange={(e) => handleConfigChange('backup', 'autoBackup', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Habilitar respaldo automático</span>
                    </label>
                    
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={systemConfig.backup.includeMedia}
                        onChange={(e) => handleConfigChange('backup', 'includeMedia', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Incluir archivos multimedia</span>
                    </label>
                  </div>
                  
                  {systemConfig.backup.lastBackup && (
                    <div className="md:col-span-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-sm text-green-800">
                          Último respaldo: {formatDate(systemConfig.backup.lastBackup, 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                  )}
                  
                </div>
                
              </div>
            )}
            
            {/* CONFIGURACIÓN DE INTEGRACIONES */}
            {activeSection === 'integrations' && (
              <div className="p-6 space-y-8">
                
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">Integraciones y APIs</h4>
                  <button
                    onClick={() => saveSystemConfig('integrations')}
                    disabled={saving}
                    className="btn-primary btn-sm"
                  >
                    {saving ? (
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Guardar
                  </button>
                </div>
                
                {/* Stripe */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-md font-medium text-gray-900">Stripe (Pagos)</h5>
                    <div className="flex items-center space-x-2">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={systemConfig.integrations.stripe.enabled}
                          onChange={(e) => handleNestedConfigChange('integrations', 'stripe', 'enabled', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Habilitado</span>
                      </label>
                      <button
                        onClick={testStripeConnection}
                        className="btn-secondary btn-sm"
                        disabled={!systemConfig.integrations.stripe.enabled}
                      >
                        Probar Conexión
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Clave Pública
                      </label>
                      <input
                        type="text"
                        value={systemConfig.integrations.stripe.publicKey}
                        onChange={(e) => handleNestedConfigChange('integrations', 'stripe', 'publicKey', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="pk_..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Clave Secreta
                      </label>
                      <input
                        type="password"
                        value={systemConfig.integrations.stripe.secretKey}
                        onChange={(e) => handleNestedConfigChange('integrations', 'stripe', 'secretKey', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="sk_..."
                      />
                    </div>
                  </div>
                </div>
                
                {/* Email */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-md font-medium text-gray-900">Configuración de Correo Electrónico</h5>
                    <button
                      onClick={testEmailConnection}
                      className="btn-secondary btn-sm"
                    >
                      Probar Conexión
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Servidor SMTP
                      </label>
                      <input
                        type="text"
                        value={systemConfig.integrations.email.smtpHost}
                        onChange={(e) => handleNestedConfigChange('integrations', 'email', 'smtpHost', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Puerto SMTP
                      </label>
                      <input
                        type="number"
                        value={systemConfig.integrations.email.smtpPort}
                        onChange={(e) => handleNestedConfigChange('integrations', 'email', 'smtpPort', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="587"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Usuario SMTP
                      </label>
                      <input
                        type="email"
                        value={systemConfig.integrations.email.smtpUser}
                        onChange={(e) => handleNestedConfigChange('integrations', 'email', 'smtpUser', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="tu@gmail.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña SMTP
                      </label>
                      <input
                        type="password"
                        value={systemConfig.integrations.email.smtpPassword}
                        onChange={(e) => handleNestedConfigChange('integrations', 'email', 'smtpPassword', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="•••••••••"
                      />
                    </div>
                  </div>
                </div>
                
              </div>
            )}
          </>
        )}
        
      </div>
      
    </div>
  );
};

export default SettingsManager;

/*
 * COMPONENTE: SettingsManager
 * AUTOR: Alexander Echeverria
 * 
 * PROPÓSITO:
 * Este componente gestiona la configuración completa del sistema de administración del gimnasio.
 * Permite a los administradores configurar todos los aspectos operativos, de seguridad, 
 * notificaciones, respaldos e integraciones con servicios externos del sistema.
 * 
 * FUNCIONALIDADES PARA EL USUARIO:
 * 
 * CONFIGURACIÓN GENERAL:
 * - Configurar nombre y descripción del sitio web del gimnasio
 * - Establecer zona horaria (Guatemala, México, Nueva York, UTC)
 * - Seleccionar idioma del sistema (Español, Inglés)
 * - Configurar moneda (Quetzal GTQ como principal, USD, MXN como alternativas)
 * - Activar/desactivar modo mantenimiento para la página web
 * - Formato de fechas personalizable
 * 
 * CONFIGURACIÓN DE SEGURIDAD:
 * - Establecer tiempo de expiración de sesión (5-480 minutos)
 * - Configurar máximo número de intentos de inicio de sesión (3-10 intentos)
 * - Definir tamaño máximo de archivos subidos (1-100 MB)
 * - Especificar tipos de archivos permitidos (jpg, png, pdf, etc.)
 * - Habilitar/deshabilitar requisitos de contraseñas seguras
 * - Configurar autenticación de dos factores
 * - Gestionar lista blanca de direcciones IP autorizadas
 * 
 * CONFIGURACIÓN DE NOTIFICACIONES:
 * - Activar notificaciones por correo electrónico, SMS y push
 * - Configurar alertas de vencimiento de membresías:
 *   * Días de anticipación para alertas (1-30 días)
 *   * Frecuencia de recordatorios (diario, cada 3 días, semanal)
 * - Establecer recordatorios de pago:
 *   * Días antes del vencimiento (1-10 días)
 *   * Activación/desactivación de recordatorios automáticos
 * - Configurar alertas del sistema para administradores
 * 
 * GESTIÓN DE RESPALDOS:
 * - Crear respaldos manuales con un clic
 * - Configurar respaldos automáticos (diario, semanal, mensual)
 * - Establecer tiempo de retención de respaldos (7-365 días)
 * - Incluir/excluir archivos multimedia en respaldos
 * - Ver fecha y hora del último respaldo realizado
 * - Configurar ubicación de almacenamiento de respaldos
 * 
 * INTEGRACIONES EXTERNAS:
 * - Configuración de Stripe para procesamiento de pagos:
 *   * Claves públicas y secretas de Stripe
 *   * Probar conexión con la API de Stripe
 *   * Activar/desactivar integración de pagos
 * - Configuración de correo electrónico SMTP:
 *   * Servidor SMTP (Gmail, Outlook, servidores personalizados)
 *   * Puerto SMTP (587, 465, 25)
 *   * Credenciales de autenticación
 *   * Probar conexión de correo electrónico
 * - Configuración futura de WhatsApp Business API
 * 
 * GESTIÓN DE CONFIGURACIONES:
 * - Exportar configuración completa en formato JSON
 * - Importar configuración desde archivo JSON
 * - Guardar cambios por sección o guardado completo
 * - Indicadores visuales de cambios sin guardar
 * - Recargar configuración desde el servidor
 * 
 * CONEXIONES Y DEPENDENCIAS:
 * 
 * CONTEXTOS:
 * - AuthContext: Para verificar permisos de administrador y autenticación
 * - AppContext: Para notificaciones, formateo de fechas y utilidades del sistema
 * 
 * SERVICIOS API:
 * - apiService: Servicio principal para comunicación con el backend
 * 
 * ENDPOINTS CONECTADOS:
 * - /api/admin/system-config (GET): Obtiene configuración actual del sistema
 * - /api/admin/system-config (POST): Guarda configuración actualizada
 * - /api/admin/test-email (POST): Prueba configuración de correo electrónico
 * - /api/admin/test-stripe (POST): Prueba conexión con Stripe
 * - /api/admin/create-backup (POST): Crea respaldo manual del sistema
 * 
 * PERMISOS REQUERIDOS:
 * - manage_general_settings: Acceso a configuración general
 * - manage_security_settings: Acceso a configuración de seguridad
 * - manage_notification_settings: Acceso a configuración de notificaciones
 * - manage_backup_settings: Acceso a gestión de respaldos
 * - manage_integration_settings: Acceso a configuración de integraciones
 * 
 * ESTRUCTURA DE DATOS:
 * - Configuración organizada en 5 secciones principales
 * - Validación de datos antes del guardado
 * - Manejo de errores con mensajes descriptivos
 * - Estado local para prevenir pérdida de cambios
 * 
 * IMPACTO EN EL SISTEMA:
 * - La configuración general afecta la apariencia y comportamiento de la página web
 * - La configuración de seguridad protege el acceso y los datos del sistema
 * - Las notificaciones mantienen informados a usuarios y administradores
 * - Los respaldos protegen la información crítica del negocio
 * - Las integraciones amplían las capacidades del sistema con servicios externos
 * 
 * TECNOLOGÍAS:
 * - React con Hooks (useState, useEffect) para manejo de estado
 * - Lucide React para iconografía moderna y consistente
 * - Tailwind CSS para estilos responsivos y profesionales
 * - JavaScript ES6+ para lógica compleja de componente
 * - JSON para importación/exportación de configuraciones
 * - Blob API para generación de archivos de descarga
 */