// src/pages/dashboard/components/BrandingEditor.js
// FUNCIÓN: Editor completo de branding y paleta de colores
// INCLUYE: Colores primarios, secundarios, fuentes, estilos de botones

import React, { useState, useEffect } from 'react';
import {
  Save, RotateCcw, Eye, Palette, Type, Square, Circle, 
  AlertTriangle, Copy, Check, Zap, Download, Upload,
  RefreshCw, Heart, Star, Crown, Shield, Target
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';

const BrandingEditor = ({ gymConfig, onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, isMobile } = useApp();
  
  // 📱 Estados locales
  const [brandingData, setBrandingData] = useState({
    // Paleta de colores
    colors: {
      primary: '#3b82f6',      // Azul principal
      primaryDark: '#1d4ed8',  // Azul oscuro
      primaryLight: '#93c5fd', // Azul claro
      secondary: '#f59e0b',    // Amarillo/Naranja
      accent: '#10b981',       // Verde
      neutral: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827'
      }
    },
    
    // Tipografía
    fonts: {
      heading: 'Inter', // Fuente para títulos
      body: 'Inter',    // Fuente para texto
      display: 'Inter'  // Fuente para displays grandes
    },
    
    // Estilos de componentes
    components: {
      buttons: {
        primary: {
          background: 'primary',
          color: 'white',
          borderRadius: '8px',
          fontWeight: '600'
        },
        secondary: {
          background: 'transparent',
          color: 'primary',
          border: '2px solid primary',
          borderRadius: '8px',
          fontWeight: '600'
        }
    },
      cards: {
        borderRadius: '12px',
        shadow: 'medium',
        background: 'white'
      }
    },
    
    // Configuración de tema
    theme: {
      mode: 'light', // light | dark
      colorScheme: 'blue', // blue | green | purple | orange | red
      borderRadius: 'medium', // small | medium | large
      spacing: 'comfortable' // compact | comfortable | spacious
    }
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('colors');
  const [previewMode, setPreviewMode] = useState(false);
  const [copiedColor, setCopiedColor] = useState('');
  
  // 🎨 Esquemas de color predefinidos
  const colorSchemes = [
    {
      name: 'Azul Fitness',
      id: 'blue',
      colors: {
        primary: '#3b82f6',
        primaryDark: '#1d4ed8',
        primaryLight: '#93c5fd',
        secondary: '#f59e0b',
        accent: '#10b981'
      }
    },
    {
      name: 'Verde Energía',
      id: 'green',
      colors: {
        primary: '#10b981',
        primaryDark: '#047857',
        primaryLight: '#6ee7b7',
        secondary: '#f59e0b',
        accent: '#3b82f6'
      }
    },
    {
      name: 'Púrpura Elite',
      id: 'purple',
      colors: {
        primary: '#8b5cf6',
        primaryDark: '#7c3aed',
        primaryLight: '#c4b5fd',
        secondary: '#f59e0b',
        accent: '#ef4444'
      }
    },
    {
      name: 'Naranja Dinámico',
      id: 'orange',
      colors: {
        primary: '#f97316',
        primaryDark: '#ea580c',
        primaryLight: '#fdba74',
        secondary: '#3b82f6',
        accent: '#10b981'
      }
    },
    {
      name: 'Rojo Intenso',
      id: 'red',
      colors: {
        primary: '#ef4444',
        primaryDark: '#dc2626',
        primaryLight: '#fca5a5',
        secondary: '#f59e0b',
        accent: '#10b981'
      }
    }
  ];
  
  // 🔤 Fuentes disponibles
  const availableFonts = [
    { id: 'inter', name: 'Inter', css: 'Inter, sans-serif' },
    { id: 'roboto', name: 'Roboto', css: 'Roboto, sans-serif' },
    { id: 'poppins', name: 'Poppins', css: 'Poppins, sans-serif' },
    { id: 'montserrat', name: 'Montserrat', css: 'Montserrat, sans-serif' },
    { id: 'opensans', name: 'Open Sans', css: 'Open Sans, sans-serif' },
    { id: 'lato', name: 'Lato', css: 'Lato, sans-serif' },
    { id: 'nunito', name: 'Nunito', css: 'Nunito, sans-serif' }
  ];
  
  // 🔗 Tabs del editor
  const editorTabs = [
    { id: 'colors', label: 'Colores', icon: Palette },
    { id: 'typography', label: 'Tipografía', icon: Type },
    { id: 'components', label: 'Componentes', icon: Square },
    { id: 'theme', label: 'Tema', icon: Crown }
  ];
  
  // 🔄 Inicializar con datos existentes
  useEffect(() => {
    if (gymConfig?.data?.branding) {
      setBrandingData({
        ...brandingData,
        ...gymConfig.data.branding
      });
    }
  }, [gymConfig]);
  
  // 🔔 Notificar cambios sin guardar
  useEffect(() => {
    onUnsavedChanges(hasChanges);
  }, [hasChanges, onUnsavedChanges]);
  
  // 📝 Manejar cambios en colores
  const handleColorChange = (path, value) => {
    setBrandingData(prev => {
      const updated = { ...prev };
      const pathArray = path.split('.');
      let current = updated;
      
      for (let i = 0; i < pathArray.length - 1; i++) {
        current = current[pathArray[i]];
      }
      
      current[pathArray[pathArray.length - 1]] = value;
      return updated;
    });
    setHasChanges(true);
  };
  
  // 🎨 Aplicar esquema de color
  const applyColorScheme = (scheme) => {
    setBrandingData(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        ...scheme.colors
      },
      theme: {
        ...prev.theme,
        colorScheme: scheme.id
      }
    }));
    setHasChanges(true);
    showSuccess(`Esquema de color "${scheme.name}" aplicado`);
  };
  
  // 📋 Copiar color al portapapeles
  const handleCopyColor = async (color) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedColor(color);
      setTimeout(() => setCopiedColor(''), 2000);
      showSuccess('Color copiado al portapapeles');
    } catch (error) {
      showError('Error al copiar color');
    }
  };
  
  // 🔄 Resetear a valores por defecto
  const handleReset = () => {
    if (window.confirm('¿Estás seguro de resetear todos los valores de branding?')) {
      setBrandingData({
        colors: {
          primary: '#3b82f6',
          primaryDark: '#1d4ed8',
          primaryLight: '#93c5fd',
          secondary: '#f59e0b',
          accent: '#10b981',
          neutral: {
            50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db',
            400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151',
            800: '#1f2937', 900: '#111827'
          }
        },
        fonts: { heading: 'Inter', body: 'Inter', display: 'Inter' },
        components: {
          buttons: {
            primary: { background: 'primary', color: 'white', borderRadius: '8px', fontWeight: '600' },
            secondary: { background: 'transparent', color: 'primary', border: '2px solid primary', borderRadius: '8px', fontWeight: '600' }
          },
          cards: { borderRadius: '12px', shadow: 'medium', background: 'white' }
        },
        theme: { mode: 'light', colorScheme: 'blue', borderRadius: 'medium', spacing: 'comfortable' }
      });
      setHasChanges(true);
      showSuccess('Branding reseteado a valores por defecto');
    }
  };
  
  // 💾 Guardar cambios
  const handleSave = async () => {
    try {
      console.log('Guardando configuración de branding:', brandingData);
      
      // Simular guardado exitoso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave({ branding: brandingData });
      setHasChanges(false);
      showSuccess('Branding actualizado exitosamente');
      
    } catch (error) {
      console.error('Error saving branding:', error);
      showError('Error al guardar branding');
    }
  };
  
  // 📤 Exportar configuración
  const handleExport = () => {
    const dataStr = JSON.stringify(brandingData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'branding-config.json';
    link.click();
    URL.revokeObjectURL(url);
    showSuccess('Configuración exportada');
  };

  return (
    <div className="space-y-6">
      
      {/* 🔝 HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Editor de Branding
          </h3>
          <p className="text-gray-600 mt-1">
            Personaliza los colores, fuentes y estilo de tu gimnasio
          </p>
        </div>
        
        <div className="flex space-x-2">
          {hasChanges && (
            <button
              onClick={handleSave}
              className="btn-primary btn-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </button>
          )}
          
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`btn-secondary btn-sm ${previewMode ? 'bg-primary-100 text-primary-700' : ''}`}
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Salir Vista Previa' : 'Vista Previa'}
          </button>
          
          <button
            onClick={handleExport}
            className="btn-secondary btn-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
          
          <button
            onClick={handleReset}
            className="btn-secondary btn-sm text-red-600 hover:bg-red-50"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </button>
        </div>
      </div>
      
      {/* ⚠️ INDICADOR DE CAMBIOS */}
      {hasChanges && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Tienes cambios sin guardar en el branding.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* 🔗 NAVEGACIÓN POR TABS */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex space-x-1 overflow-x-auto">
          {editorTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4 inline mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* 📋 CONTENIDO SEGÚN TAB ACTIVO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel de edición */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          
          {/* TAB: Colores */}
          {activeTab === 'colors' && (
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-900">
                Paleta de Colores
              </h4>
              
              {/* Esquemas predefinidos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Esquemas Predefinidos
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {colorSchemes.map((scheme) => (
                    <button
                      key={scheme.id}
                      onClick={() => applyColorScheme(scheme)}
                      className={`p-3 border rounded-lg text-left hover:border-gray-400 transition-colors ${
                        brandingData.theme.colorScheme === scheme.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex space-x-1">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: scheme.colors.primary }}
                          ></div>
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: scheme.colors.secondary }}
                          ></div>
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: scheme.colors.accent }}
                          ></div>
                        </div>
                        <span className="font-medium text-sm">{scheme.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Colores principales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Colores Principales
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Color primario */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Primario
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={brandingData.colors.primary}
                        onChange={(e) => handleColorChange('colors.primary', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={brandingData.colors.primary}
                          onChange={(e) => handleColorChange('colors.primary', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <button
                        onClick={() => handleCopyColor(brandingData.colors.primary)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {copiedColor === brandingData.colors.primary ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Color secundario */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Secundario
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={brandingData.colors.secondary}
                        onChange={(e) => handleColorChange('colors.secondary', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={brandingData.colors.secondary}
                          onChange={(e) => handleColorChange('colors.secondary', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <button
                        onClick={() => handleCopyColor(brandingData.colors.secondary)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {copiedColor === brandingData.colors.secondary ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Color de acento */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Acento
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={brandingData.colors.accent}
                        onChange={(e) => handleColorChange('colors.accent', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={brandingData.colors.accent}
                          onChange={(e) => handleColorChange('colors.accent', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <button
                        onClick={() => handleCopyColor(brandingData.colors.accent)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {copiedColor === brandingData.colors.accent ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                </div>
              </div>
              
              {/* Variaciones del color primario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Variaciones del Color Primario
                </label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Primario Oscuro
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={brandingData.colors.primaryDark}
                        onChange={(e) => handleColorChange('colors.primaryDark', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={brandingData.colors.primaryDark}
                        onChange={(e) => handleColorChange('colors.primaryDark', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Primario Claro
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={brandingData.colors.primaryLight}
                        onChange={(e) => handleColorChange('colors.primaryLight', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={brandingData.colors.primaryLight}
                        onChange={(e) => handleColorChange('colors.primaryLight', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* TAB: Tipografía */}
          {activeTab === 'typography' && (
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-900">
                Tipografía
              </h4>
              
              <div className="space-y-4">
                
                {/* Fuente para títulos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuente para Títulos
                  </label>
                  <select
                    value={brandingData.fonts.heading}
                    onChange={(e) => handleColorChange('fonts.heading', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {availableFonts.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 p-3 bg-gray-50 rounded">
                    <h1 style={{ fontFamily: availableFonts.find(f => f.id === brandingData.fonts.heading)?.css }}>
                      Elite Fitness Center
                    </h1>
                  </div>
                </div>
                
                {/* Fuente para texto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuente para Texto
                  </label>
                  <select
                    value={brandingData.fonts.body}
                    onChange={(e) => handleColorChange('fonts.body', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {availableFonts.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 p-3 bg-gray-50 rounded">
                    <p style={{ fontFamily: availableFonts.find(f => f.id === brandingData.fonts.body)?.css }}>
                      Tu mejor versión te espera. Únete a nuestra comunidad de fitness y descubre todo tu potencial.
                    </p>
                  </div>
                </div>
                
                {/* Fuente para display */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuente para Displays
                  </label>
                  <select
                    value={brandingData.fonts.display}
                    onChange={(e) => handleColorChange('fonts.display', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {availableFonts.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 p-3 bg-gray-50 rounded">
                    <h1 className="text-4xl font-bold" style={{ fontFamily: availableFonts.find(f => f.id === brandingData.fonts.display)?.css }}>
                      ¡TRANSFORMA TU VIDA!
                    </h1>
                  </div>
                </div>
                
              </div>
            </div>
          )}
          
          {/* TAB: Componentes */}
          {activeTab === 'components' && (
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-900">
                Estilo de Componentes
              </h4>
              
              {/* Border radius global */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Redondez de Bordes
                </label>
                <div className="flex space-x-3">
                  {[
                    { value: 'small', label: 'Pequeño', radius: '4px' },
                    { value: 'medium', label: 'Mediano', radius: '8px' },
                    { value: 'large', label: 'Grande', radius: '12px' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleColorChange('theme.borderRadius', option.value)}
                      className={`px-4 py-2 border rounded text-sm ${
                        brandingData.theme.borderRadius === option.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      style={{ borderRadius: option.radius }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Espaciado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Espaciado
                </label>
                <div className="flex space-x-3">
                  {[
                    { value: 'compact', label: 'Compacto' },
                    { value: 'comfortable', label: 'Cómodo' },
                    { value: 'spacious', label: 'Espacioso' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleColorChange('theme.spacing', option.value)}
                      className={`px-4 py-2 border rounded-lg text-sm ${
                        brandingData.theme.spacing === option.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* TAB: Tema */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-900">
                Configuración de Tema
              </h4>
              
              {/* Modo de color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Modo de Color
                </label>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleColorChange('theme.mode', 'light')}
                    className={`px-6 py-3 border rounded-lg text-sm flex items-center space-x-2 ${
                      brandingData.theme.mode === 'light'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Circle className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>Modo Claro</span>
                  </button>
                  
                  <button
                    onClick={() => handleColorChange('theme.mode', 'dark')}
                    className={`px-6 py-3 border rounded-lg text-sm flex items-center space-x-2 ${
                      brandingData.theme.mode === 'dark'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Circle className="w-4 h-4 fill-gray-800 text-gray-800" />
                    <span>Modo Oscuro</span>
                  </button>
                </div>
              </div>
              
              {/* Resumen de configuración */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Resumen de Configuración</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Esquema de color:</span>
                    <span className="capitalize">{brandingData.theme.colorScheme}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fuente principal:</span>
                    <span className="capitalize">{brandingData.fonts.heading}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Redondez de bordes:</span>
                    <span className="capitalize">{brandingData.theme.borderRadius}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Espaciado:</span>
                    <span className="capitalize">{brandingData.theme.spacing}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </div>
        
        {/* Panel de vista previa */}
        <div className="lg:col-span-1">
          <BrandingPreview 
            branding={brandingData}
            availableFonts={availableFonts}
          />
        </div>
        
      </div>
      
    </div>
  );
};

// 👁️ COMPONENTE: Vista previa del branding
const BrandingPreview = ({ branding, availableFonts }) => {
  const headingFont = availableFonts.find(f => f.id === branding.fonts.heading)?.css || 'Inter, sans-serif';
  const bodyFont = availableFonts.find(f => f.id === branding.fonts.body)?.css || 'Inter, sans-serif';
  
  const borderRadiusValue = {
    small: '4px',
    medium: '8px',
    large: '12px'
  }[branding.theme.borderRadius] || '8px';
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
      <h4 className="text-lg font-medium text-gray-900 mb-4">Vista Previa</h4>
      
      <div className="space-y-4">
        
        {/* Preview de colores */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Paleta de Colores</h5>
          <div className="flex space-x-2">
            <div 
              className="w-8 h-8 rounded border border-gray-200"
              style={{ backgroundColor: branding.colors.primary }}
              title="Primario"
            ></div>
            <div 
              className="w-8 h-8 rounded border border-gray-200"
              style={{ backgroundColor: branding.colors.secondary }}
              title="Secundario"
            ></div>
            <div 
              className="w-8 h-8 rounded border border-gray-200"
              style={{ backgroundColor: branding.colors.accent }}
              title="Acento"
            ></div>
          </div>
        </div>
        
        {/* Preview de tipografía */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Tipografía</h5>
          <div className="space-y-2">
            <h3 
              className="text-lg font-bold"
              style={{ 
                fontFamily: headingFont,
                color: branding.colors.primary 
              }}
            >
              Título Principal
            </h3>
            <p 
              className="text-sm text-gray-600"
              style={{ fontFamily: bodyFont }}
            >
              Este es un ejemplo de texto en la fuente del cuerpo. Se ve claro y legible.
            </p>
          </div>
        </div>
        
        {/* Preview de botones */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Botones</h5>
          <div className="space-y-2">
            <button
              className="w-full py-2 px-4 text-sm font-semibold text-white transition-colors"
              style={{
                backgroundColor: branding.colors.primary,
                borderRadius: borderRadiusValue
              }}
            >
              Botón Primario
            </button>
            
            <button
              className="w-full py-2 px-4 text-sm font-semibold transition-colors"
              style={{
                backgroundColor: 'transparent',
                color: branding.colors.primary,
                border: `2px solid ${branding.colors.primary}`,
                borderRadius: borderRadiusValue
              }}
            >
              Botón Secundario
            </button>
          </div>
        </div>
        
        {/* Preview de tarjeta */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Tarjetas</h5>
          <div 
            className="p-4 border border-gray-200 bg-white shadow-sm"
            style={{ borderRadius: borderRadiusValue }}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: branding.colors.primary }}
              >
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h6 
                  className="font-medium text-sm"
                  style={{ fontFamily: headingFont }}
                >
                  Entrenamiento Personal
                </h6>
                <p 
                  className="text-xs text-gray-500"
                  style={{ fontFamily: bodyFont }}
                >
                  Planes personalizados
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Preview de estado de marca */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Marca</h5>
          <div className="text-center p-3 bg-gray-50" style={{ borderRadius: borderRadiusValue }}>
            <h4 
              className="text-lg font-bold"
              style={{ 
                fontFamily: headingFont,
                color: branding.colors.primary 
              }}
            >
              Elite Fitness
            </h4>
            <p 
              className="text-xs"
              style={{ 
                fontFamily: bodyFont,
                color: branding.colors.secondary 
              }}
            >
              Tu mejor versión te espera
            </p>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default BrandingEditor;