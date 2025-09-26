// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/inventory/components/CategoryFormModal.js
// FUNCIÓN: Modal reutilizable para crear y editar categorías

import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Save, X, Search, Tag, 
  Package, Folder, Star, ArrowUp, ArrowDown,
  Loader, RotateCcw, Grid, List, Copy, Check,
  AlertTriangle, CheckCircle, Building, Hash,
  Link,
  // ✅ ICONOS PARA CATEGORÍAS
  Dumbbell, Heart, Activity, Zap, Target, Trophy,
  Apple, Coffee, Pill, ShoppingBag, Shirt, Watch,
  BookOpen, Music, Headphones, Camera, Gamepad2,
  Car, Home, Wrench, Palette, Globe, Shield
} from 'lucide-react';
import { useApp } from '../../../../contexts/AppContext';
import inventoryService from '../../../../services/inventoryService';

const CategoryFormModal = ({ 
  isOpen, 
  onClose, 
  category = null, 
  onSave,
  isCreating = false 
}) => {
  const { showSuccess, showError } = useApp();
  
  // Estados
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Plantilla vacía
  const emptyCategory = {
    name: '',
    slug: '',
    description: '',
    iconName: 'package',
    displayOrder: 1,
    isActive: true
  };
  
  // ✅ ICONOS ORGANIZADOS POR CATEGORÍA
  const availableIcons = [
    // Fitness & Deportes
    { name: 'dumbbell', icon: Dumbbell, label: 'Pesas', category: 'Fitness' },
    { name: 'activity', icon: Activity, label: 'Actividad', category: 'Fitness' },
    { name: 'target', icon: Target, label: 'Objetivo', category: 'Fitness' },
    { name: 'trophy', icon: Trophy, label: 'Trofeo', category: 'Fitness' },
    { name: 'zap', icon: Zap, label: 'Energía', category: 'Fitness' },
    { name: 'heart', icon: Heart, label: 'Salud', category: 'Fitness' },
    
    // Nutrición & Suplementos
    { name: 'apple', icon: Apple, label: 'Nutrición', category: 'Nutrición' },
    { name: 'coffee', icon: Coffee, label: 'Bebidas', category: 'Nutrición' },
    { name: 'pill', icon: Pill, label: 'Suplementos', category: 'Nutrición' },
    
    // Ropa & Accesorios
    { name: 'shirt', icon: Shirt, label: 'Ropa', category: 'Accesorios' },
    { name: 'watch', icon: Watch, label: 'Relojes', category: 'Accesorios' },
    { name: 'shopping-bag', icon: ShoppingBag, label: 'Bolsas', category: 'Accesorios' },
    
    // Tecnología
    { name: 'headphones', icon: Headphones, label: 'Audio', category: 'Tecnología' },
    { name: 'camera', icon: Camera, label: 'Cámara', category: 'Tecnología' },
    { name: 'gamepad2', icon: Gamepad2, label: 'Gaming', category: 'Tecnología' },
    
    // Hogar & Lifestyle
    { name: 'home', icon: Home, label: 'Hogar', category: 'Lifestyle' },
    { name: 'car', icon: Car, label: 'Automóvil', category: 'Lifestyle' },
    { name: 'book-open', icon: BookOpen, label: 'Educación', category: 'Lifestyle' },
    { name: 'music', icon: Music, label: 'Música', category: 'Lifestyle' },
    
    // Herramientas & Servicios
    { name: 'wrench', icon: Wrench, label: 'Herramientas', category: 'Servicios' },
    { name: 'shield', icon: Shield, label: 'Seguridad', category: 'Servicios' },
    { name: 'globe', icon: Globe, label: 'Global', category: 'Servicios' },
    
    // Generales
    { name: 'package', icon: Package, label: 'Paquete', category: 'General' },
    { name: 'tag', icon: Tag, label: 'Etiqueta', category: 'General' },
    { name: 'star', icon: Star, label: 'Estrella', category: 'General' },
    { name: 'folder', icon: Folder, label: 'Carpeta', category: 'General' },
    { name: 'building', icon: Building, label: 'Edificio', category: 'General' },
    { name: 'hash', icon: Hash, label: 'Hash', category: 'General' },
    { name: 'palette', icon: Palette, label: 'Arte', category: 'General' }
  ];
  
  // Agrupar iconos por categoría
  const groupedIcons = availableIcons.reduce((acc, icon) => {
    if (!acc[icon.category]) acc[icon.category] = [];
    acc[icon.category].push(icon);
    return acc;
  }, {});
  
  // Inicializar datos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setEditingCategory(category ? { ...category } : { ...emptyCategory });
    }
  }, [isOpen, category]);
  
  // OBTENER ICONO DE CATEGORÍA
  const getCategoryIcon = (iconName) => {
    const iconData = availableIcons.find(icon => icon.name === iconName);
    return iconData?.icon || Package;
  };
  
  // MANEJAR GUARDADO
  const handleSave = async () => {
    if (!editingCategory.name.trim()) {
      showError('El nombre de la categoría es obligatorio');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Generar slug automáticamente si no existe
      if (!editingCategory.slug) {
        editingCategory.slug = editingCategory.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      
      let response;
      if (isCreating) {
        response = await inventoryService.createCategory(editingCategory);
      } else {
        response = await inventoryService.updateCategory(editingCategory.id, editingCategory);
      }
      
      if (response.success) {
        showSuccess(isCreating ? 'Categoría creada exitosamente' : 'Categoría actualizada exitosamente');
        if (onSave) {
          onSave(response.data);
        }
        onClose();
      }
      
    } catch (error) {
      console.error('❌ Error saving category:', error);
      showError(`Error al guardar categoría: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!isOpen || !editingCategory) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-purple-100">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Tag className="w-4 h-4 text-white" />
              </div>
              {isCreating ? 'Nueva Categoría' : 'Editar Categoría'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {isCreating ? 'Organiza tus productos con categorías' : 'Modifica los datos de la categoría'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-all"
            disabled={isSaving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Preview del icono seleccionado */}
          <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl text-center">
            {(() => {
              const IconComponent = getCategoryIcon(editingCategory.iconName);
              return (
                <div className="flex items-center justify-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center">
                    <IconComponent className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-purple-900">
                      {editingCategory.name || 'Nombre de la categoría'}
                    </p>
                    <p className="text-xs text-purple-600">
                      {availableIcons.find(icon => icon.name === editingCategory.iconName)?.label || 'Icono seleccionado'}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
          
          <div className="space-y-6">
            
            {/* Información básica */}
            <div className="grid grid-cols-1 gap-4">
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de la categoría *
                </label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="Ej: Suplementos Deportivos, Equipos de Gimnasio..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Slug (URL)
                  </label>
                  <input
                    type="text"
                    value={editingCategory.slug}
                    onChange={(e) => setEditingCategory(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="auto-generado"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Orden
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingCategory.displayOrder}
                    onChange={(e) => setEditingCategory(prev => ({ 
                      ...prev, 
                      displayOrder: parseInt(e.target.value) || 1 
                    }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={editingCategory.description}
                  onChange={(e) => setEditingCategory(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                  placeholder="Describe brevemente esta categoría..."
                />
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCategory.isActive}
                    onChange={(e) => setEditingCategory(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">Categoría activa</span>
                </label>
              </div>
              
            </div>
            
            {/* ✅ SELECTOR DE ICONOS COMPACTO */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Seleccionar icono
              </label>
              
              {/* Iconos organizados en grid compacto */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
                {Object.entries(groupedIcons).map(([category, icons]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 sticky top-0 bg-gray-50 py-1">
                      {category}
                    </h4>
                    <div className="grid grid-cols-8 gap-2">
                      {icons.map(iconData => {
                        const IconComponent = iconData.icon;
                        return (
                          <button
                            key={iconData.name}
                            type="button"
                            onClick={() => setEditingCategory(prev => ({ ...prev, iconName: iconData.name }))}
                            className={`w-10 h-10 border-2 rounded-lg transition-all hover:scale-105 flex items-center justify-center ${
                              editingCategory.iconName === iconData.name
                                ? 'border-purple-500 bg-purple-50 shadow-md'
                                : 'border-gray-200 hover:border-purple-300 bg-white'
                            }`}
                            title={iconData.label}
                          >
                            <IconComponent className={`w-5 h-5 ${
                              editingCategory.iconName === iconData.name 
                                ? 'text-purple-600' 
                                : 'text-gray-400'
                            }`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
          
        </div>
        
        {/* Footer con botones */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
            disabled={isSaving}
          >
            Cancelar
          </button>
          
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg disabled:opacity-50"
            disabled={isSaving || !editingCategory.name.trim()}
          >
            {isSaving ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Guardando...
              </div>
            ) : (
              <div className="flex items-center">
                <Save className="w-4 h-4 mr-2" />
                {isCreating ? 'Crear Categoría' : 'Guardar Cambios'}
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryFormModal;