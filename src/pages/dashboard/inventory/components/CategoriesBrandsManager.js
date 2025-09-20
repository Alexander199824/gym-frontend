// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/inventory/components/CategoriesBrandsManager.js
// FUNCIÓN: Gestión completa de categorías y marcas conectado al backend real

import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Save, X, Search, Tag, 
  Package, Folder, Star, ArrowUp, ArrowDown,
  Loader, RotateCcw, Grid, List, Copy, Check,
  AlertTriangle, CheckCircle, Building, Hash
} from 'lucide-react';
import { useApp } from '../../../../contexts/AppContext';
import inventoryService from '../../../../services/inventoryService';

const CategoriesBrandsManager = ({ onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, isMobile } = useApp();
  
  // Estados principales
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Estados para modales
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingBrand, setEditingBrand] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para filtros
  const [activeTab, setActiveTab] = useState('categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Plantillas vacías
  const emptyCategory = {
    name: '',
    slug: '',
    description: '',
    iconName: 'package',
    displayOrder: 1,
    isActive: true
  };
  
  const emptyBrand = {
    name: '',
    description: '',
    logoUrl: '',
    website: '',
    isActive: true
  };
  
  // Iconos disponibles para categorías
  const availableIcons = [
    { name: 'package', icon: Package, label: 'Paquete' },
    { name: 'tag', icon: Tag, label: 'Etiqueta' },
    { name: 'star', icon: Star, label: 'Estrella' },
    { name: 'folder', icon: Folder, label: 'Carpeta' },
    { name: 'building', icon: Building, label: 'Edificio' },
    { name: 'hash', icon: Hash, label: 'Hash' }
  ];
  
  // Filtros de estado
  const statusFilters = [
    { id: 'all', label: 'Todos' },
    { id: 'active', label: 'Activos' },
    { id: 'inactive', label: 'Inactivos' }
  ];
  
  // CARGAR DATOS INICIALES
  useEffect(() => {
    loadAllData();
  }, []);
  
  // Notificar cambios sin guardar
  useEffect(() => {
    if (onUnsavedChanges) {
      onUnsavedChanges(hasChanges);
    }
  }, [hasChanges, onUnsavedChanges]);
  
  const loadAllData = async () => {
    setIsLoading(true);
    
    try {
      console.log('📂 Loading categories and brands...');
      
      // Cargar datos en paralelo
      const [categoriesResponse, brandsResponse] = await Promise.all([
        inventoryService.getCategories({ limit: 100 }),
        inventoryService.getBrands({ limit: 100 })
      ]);
      
      // Procesar categorías
      if (categoriesResponse.success && categoriesResponse.data) {
        const categoriesList = categoriesResponse.data.categories || [];
        setCategories(categoriesList);
        console.log(`✅ Loaded ${categoriesList.length} categories`);
      }
      
      // Procesar marcas
      if (brandsResponse.success && brandsResponse.data) {
        const brandsList = brandsResponse.data.brands || [];
        setBrands(brandsList);
        console.log(`✅ Loaded ${brandsList.length} brands`);
      }
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
      showError('Error al cargar categorías y marcas');
    } finally {
      setIsLoading(false);
    }
  };
  
  // FILTRAR DATOS
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && category.isActive !== false) ||
                         (statusFilter === 'inactive' && category.isActive === false);
    
    return matchesSearch && matchesStatus;
  });
  
  const filteredBrands = brands.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (brand.description && brand.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && brand.isActive !== false) ||
                         (statusFilter === 'inactive' && brand.isActive === false);
    
    return matchesSearch && matchesStatus;
  });
  
  // MÉTODOS DE CATEGORÍAS
  const handleCreateCategory = () => {
    setEditingCategory({ ...emptyCategory });
    setIsCreating(true);
    setShowCategoryModal(true);
  };
  
  const handleEditCategory = (category) => {
    setEditingCategory({ ...category });
    setIsCreating(false);
    setShowCategoryModal(true);
  };
  
  const handleSaveCategory = async () => {
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
        setShowCategoryModal(false);
        setEditingCategory(null);
        await loadAllData();
        showSuccess(isCreating ? 'Categoría creada exitosamente' : 'Categoría actualizada exitosamente');
      }
      
    } catch (error) {
      console.error('❌ Error saving category:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) {
      return;
    }
    
    try {
      const response = await inventoryService.deleteCategory(category.id);
      
      if (response.success) {
        await loadAllData();
        showSuccess('Categoría eliminada exitosamente');
      }
      
    } catch (error) {
      console.error('❌ Error deleting category:', error);
    }
  };
  
  const handleReorderCategories = async (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    try {
      const reorderedCategories = [...categories];
      const [movedCategory] = reorderedCategories.splice(fromIndex, 1);
      reorderedCategories.splice(toIndex, 0, movedCategory);
      
      // Actualizar displayOrder
      const categoryOrders = reorderedCategories.map((category, index) => ({
        id: category.id,
        displayOrder: index + 1
      }));
      
      const response = await inventoryService.reorderCategories(categoryOrders);
      
      if (response.success) {
        setCategories(reorderedCategories);
        showSuccess('Orden de categorías actualizado');
      }
      
    } catch (error) {
      console.error('❌ Error reordering categories:', error);
    }
  };
  
  // MÉTODOS DE MARCAS
  const handleCreateBrand = () => {
    setEditingBrand({ ...emptyBrand });
    setIsCreating(true);
    setShowBrandModal(true);
  };
  
  const handleEditBrand = (brand) => {
    setEditingBrand({ ...brand });
    setIsCreating(false);
    setShowBrandModal(true);
  };
  
  const handleSaveBrand = async () => {
    if (!editingBrand.name.trim()) {
      showError('El nombre de la marca es obligatorio');
      return;
    }
    
    setIsSaving(true);
    
    try {
      let response;
      if (isCreating) {
        response = await inventoryService.createBrand(editingBrand);
      } else {
        response = await inventoryService.updateBrand(editingBrand.id, editingBrand);
      }
      
      if (response.success) {
        setShowBrandModal(false);
        setEditingBrand(null);
        await loadAllData();
        showSuccess(isCreating ? 'Marca creada exitosamente' : 'Marca actualizada exitosamente');
      }
      
    } catch (error) {
      console.error('❌ Error saving brand:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteBrand = async (brand) => {
    if (!window.confirm(`¿Estás seguro de eliminar la marca "${brand.name}"?`)) {
      return;
    }
    
    try {
      const response = await inventoryService.deleteBrand(brand.id);
      
      if (response.success) {
        await loadAllData();
        showSuccess('Marca eliminada exitosamente');
      }
      
    } catch (error) {
      console.error('❌ Error deleting brand:', error);
    }
  };
  
  // OBTENER ICONO DE CATEGORÍA
  const getCategoryIcon = (iconName) => {
    const iconData = availableIcons.find(icon => icon.name === iconName);
    return iconData?.icon || Package;
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Categorías y Marcas</h2>
          <p className="text-gray-600">Gestiona las categorías y marcas de tus productos</p>
          
          {/* Métricas rápidas */}
          <div className="mt-3 flex flex-wrap gap-4">
            <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {categories.length} categorías
            </span>
            <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
              {brands.length} marcas
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadAllData}
            className="btn-secondary btn-sm"
            disabled={isLoading}
          >
            <RotateCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          
          <button
            onClick={activeTab === 'categories' ? handleCreateCategory : handleCreateBrand}
            className="btn-primary btn-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva {activeTab === 'categories' ? 'Categoría' : 'Marca'}
          </button>
        </div>
      </div>
      
      {/* NAVEGACIÓN DE PESTAÑAS */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'categories'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Folder className="w-4 h-4 inline mr-2" />
            Categorías ({categories.length})
          </button>
          
          <button
            onClick={() => setActiveTab('brands')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'brands'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building className="w-4 h-4 inline mr-2" />
            Marcas ({brands.length})
          </button>
        </nav>
      </div>
      
      {/* FILTROS */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Buscar ${activeTab === 'categories' ? 'categorías' : 'marcas'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          
          {/* Filtro de estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {statusFilters.map(filter => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
          
          {/* Espacio para más filtros en el futuro */}
          <div></div>
          
        </div>
      </div>
      
      {/* CONTENIDO DE PESTAÑAS */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        </div>
      ) : (
        <>
          {/* PESTAÑA: CATEGORÍAS */}
          {activeTab === 'categories' && (
            <div className="bg-white rounded-lg shadow-sm">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-12">
                  <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No se encontraron categorías' : 'No hay categorías'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm 
                      ? 'Intenta cambiar los filtros de búsqueda'
                      : 'Comienza creando tu primera categoría de productos'
                    }
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={handleCreateCategory}
                      className="btn-primary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primera Categoría
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Header de resultados */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600">
                      Mostrando {filteredCategories.length} de {categories.length} categorías
                    </p>
                  </div>
                  
                  {/* Lista de categorías */}
                  <div className="divide-y divide-gray-200">
                    {filteredCategories.map((category, index) => {
                      const IconComponent = getCategoryIcon(category.iconName);
                      
                      return (
                        <div key={category.id} className="p-6 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            
                            {/* Información de la categoría */}
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <IconComponent className="w-6 h-6 text-purple-600" />
                              </div>
                              
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-medium text-gray-900">
                                    {category.name}
                                  </h3>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    category.isActive !== false 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {category.isActive !== false ? 'Activa' : 'Inactiva'}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                  {category.slug && (
                                    <span>Slug: {category.slug}</span>
                                  )}
                                  <span>Orden: {category.displayOrder || index + 1}</span>
                                  {category.productCount !== undefined && (
                                    <span>{category.productCount} productos</span>
                                  )}
                                </div>
                                
                                {category.description && (
                                  <p className="text-sm text-gray-600 mt-1 max-w-md">
                                    {category.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Acciones */}
                            <div className="flex items-center space-x-2">
                              {/* Botones de reordenamiento */}
                              {index > 0 && (
                                <button
                                  onClick={() => handleReorderCategories(index, index - 1)}
                                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Mover arriba"
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </button>
                              )}
                              
                              {index < filteredCategories.length - 1 && (
                                <button
                                  onClick={() => handleReorderCategories(index, index + 1)}
                                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Mover abajo"
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleEditCategory(category)}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Editar categoría"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteCategory(category)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="Eliminar categoría"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* PESTAÑA: MARCAS */}
          {activeTab === 'brands' && (
            <div className="bg-white rounded-lg shadow-sm">
              {filteredBrands.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No se encontraron marcas' : 'No hay marcas'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm 
                      ? 'Intenta cambiar los filtros de búsqueda'
                      : 'Comienza agregando tu primera marca de productos'
                    }
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={handleCreateBrand}
                      className="btn-primary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primera Marca
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Header de resultados */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600">
                      Mostrando {filteredBrands.length} de {brands.length} marcas
                    </p>
                  </div>
                  
                  {/* Lista de marcas */}
                  <div className="divide-y divide-gray-200">
                    {filteredBrands.map((brand) => (
                      <div key={brand.id} className="p-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          
                          {/* Información de la marca */}
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              {brand.logoUrl ? (
                                <img 
                                  src={brand.logoUrl} 
                                  alt={brand.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              ) : (
                                <Building className="w-6 h-6 text-blue-600" />
                              )}
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-medium text-gray-900">
                                  {brand.name}
                                </h3>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  brand.isActive !== false 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {brand.isActive !== false ? 'Activa' : 'Inactiva'}
                                </span>
                              </div>
                              
                              {brand.website && (
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                  <a 
                                    href={brand.website} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    {brand.website}
                                  </a>
                                  {brand.productCount !== undefined && (
                                    <span>{brand.productCount} productos</span>
                                  )}
                                </div>
                              )}
                              
                              {brand.description && (
                                <p className="text-sm text-gray-600 mt-1 max-w-md">
                                  {brand.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Acciones */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditBrand(brand)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Editar marca"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteBrand(brand)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              title="Eliminar marca"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
      
      {/* MODAL DE CATEGORÍA */}
      {showCategoryModal && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {isCreating ? 'Nueva Categoría' : 'Editar Categoría'}
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={isSaving}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la categoría *
                </label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Ej: Suplementos Deportivos"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug (URL amigable)
                </label>
                <input
                  type="text"
                  value={editingCategory.slug}
                  onChange={(e) => setEditingCategory(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="se-genera-automaticamente"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se genera automáticamente si se deja vacío
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={editingCategory.description}
                  onChange={(e) => setEditingCategory(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Descripción de la categoría..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icono
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {availableIcons.map(iconData => {
                    const IconComponent = iconData.icon;
                    return (
                      <button
                        key={iconData.name}
                        type="button"
                        onClick={() => setEditingCategory(prev => ({ ...prev, iconName: iconData.name }))}
                        className={`p-3 border-2 rounded-lg transition-colors ${
                          editingCategory.iconName === iconData.name
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <IconComponent className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                        <div className="text-xs text-gray-600">{iconData.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orden de visualización
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingCategory.displayOrder}
                    onChange={(e) => setEditingCategory(prev => ({ 
                      ...prev, 
                      displayOrder: parseInt(e.target.value) || 1 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingCategory.isActive}
                      onChange={(e) => setEditingCategory(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Categoría activa</span>
                  </label>
                </div>
              </div>
              
            </div>
            
            {/* Botones de acción */}
            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="btn-secondary"
                disabled={isSaving}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSaveCategory}
                className="btn-primary"
                disabled={isSaving || !editingCategory.name.trim()}
              >
                {isSaving ? (
                  <div className="flex items-center">
                    <Loader className="w-4 h-4 animate-spin mr-2" />
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
      )}
      
      {/* MODAL DE MARCA */}
      {showBrandModal && editingBrand && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {isCreating ? 'Nueva Marca' : 'Editar Marca'}
              </h3>
              <button
                onClick={() => setShowBrandModal(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={isSaving}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la marca *
                </label>
                <input
                  type="text"
                  value={editingBrand.name}
                  onChange={(e) => setEditingBrand(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Ej: Nike, Adidas, MuscleTech..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={editingBrand.description}
                  onChange={(e) => setEditingBrand(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Descripción de la marca..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL del logo
                </label>
                <input
                  type="url"
                  value={editingBrand.logoUrl}
                  onChange={(e) => setEditingBrand(prev => ({ ...prev, logoUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="https://ejemplo.com/logo.png"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sitio web
                </label>
                <input
                  type="url"
                  value={editingBrand.website}
                  onChange={(e) => setEditingBrand(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="https://www.marca.com"
                />
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingBrand.isActive}
                    onChange={(e) => setEditingBrand(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Marca activa</span>
                </label>
              </div>
              
            </div>
            
            {/* Botones de acción */}
            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => setShowBrandModal(false)}
                className="btn-secondary"
                disabled={isSaving}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSaveBrand}
                className="btn-primary"
                disabled={isSaving || !editingBrand.name.trim()}
              >
                {isSaving ? (
                  <div className="flex items-center">
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Guardando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="w-4 h-4 mr-2" />
                    {isCreating ? 'Crear Marca' : 'Guardar Cambios'}
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default CategoriesBrandsManager;