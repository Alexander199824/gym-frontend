// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/inventory/components/CategoriesBrandsManager.js
// FUNCIÓN: Gestión completa de categorías y marcas con sub-componentes modulares

import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Search, Tag, 
  Package, Folder, RotateCcw, 
  AlertTriangle, CheckCircle, Building, Hash,
  Link, Globe, Eye, Dumbbell, Heart, Activity, 
  Zap, Target, Trophy, Apple, Coffee, Pill, 
  ShoppingBag, Shirt, Watch, BookOpen, Music, 
  Headphones, Camera, Gamepad2, Car, Home, 
  Wrench, Palette, Globe as GlobeIcon, Shield
} from 'lucide-react';
import { useApp } from '../../../../contexts/AppContext';
import inventoryService from '../../../../services/inventoryService';

// ✅ IMPORTAR LOS SUB-COMPONENTES
import CategoryFormModal from './CategoryFormModal';
import BrandFormModal from './BrandFormModal';

const CategoriesBrandsManager = ({ onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, isMobile } = useApp();
  
  // Estados principales
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Estados para modales - SIMPLIFICADOS
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingBrand, setEditingBrand] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Estados para filtros
  const [activeTab, setActiveTab] = useState('categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // ✅ ICONOS PARA MOSTRAR EN LA LISTA (solo para referencia visual)
  const availableIcons = [
    { name: 'dumbbell', icon: Dumbbell },
    { name: 'heart', icon: Heart },
    { name: 'activity', icon: Activity },
    { name: 'zap', icon: Zap },
    { name: 'target', icon: Target },
    { name: 'trophy', icon: Trophy },
    { name: 'apple', icon: Apple },
    { name: 'coffee', icon: Coffee },
    { name: 'pill', icon: Pill },
    { name: 'shopping-bag', icon: ShoppingBag },
    { name: 'shirt', icon: Shirt },
    { name: 'watch', icon: Watch },
    { name: 'book-open', icon: BookOpen },
    { name: 'music', icon: Music },
    { name: 'headphones', icon: Headphones },
    { name: 'camera', icon: Camera },
    { name: 'gamepad2', icon: Gamepad2 },
    { name: 'car', icon: Car },
    { name: 'home', icon: Home },
    { name: 'wrench', icon: Wrench },
    { name: 'palette', icon: Palette },
    { name: 'globe', icon: GlobeIcon },
    { name: 'shield', icon: Shield },
    { name: 'package', icon: Package },
    { name: 'tag', icon: Tag },
    { name: 'folder', icon: Folder },
    { name: 'building', icon: Building },
    { name: 'hash', icon: Hash }
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
  
  // MÉTODOS DE CATEGORÍAS - SIMPLIFICADOS
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setIsCreating(true);
    setShowCategoryModal(true);
  };
  
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setIsCreating(false);
    setShowCategoryModal(true);
  };
  
  const handleCategorySaved = async (savedCategory) => {
    console.log('✅ Category saved:', savedCategory);
    await loadAllData(); // Recargar datos
    if (onSave) {
      onSave(savedCategory);
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
      showError(`Error al eliminar categoría: ${error.message}`);
    }
  };
  
  // MÉTODOS DE MARCAS - SIMPLIFICADOS
  const handleCreateBrand = () => {
    setEditingBrand(null);
    setIsCreating(true);
    setShowBrandModal(true);
  };
  
  const handleEditBrand = (brand) => {
    setEditingBrand(brand);
    setIsCreating(false);
    setShowBrandModal(true);
  };
  
  const handleBrandSaved = async (savedBrand) => {
    console.log('✅ Brand saved:', savedBrand);
    await loadAllData(); // Recargar datos
    if (onSave) {
      onSave(savedBrand);
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
      showError(`Error al eliminar marca: ${error.message}`);
    }
  };
  
  // OBTENER ICONO DE CATEGORÍA
  const getCategoryIcon = (iconName) => {
    const iconData = availableIcons.find(icon => icon.name === iconName);
    return iconData?.icon || Package;
  };

  return (
    <div className="space-y-6">
      
      {/* ✅ HEADER MEJORADO CON COLORES DEL DASHBOARD */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Categorías y Marcas</h2>
          </div>
          <p className="text-gray-600 mb-4">Gestiona las categorías y marcas de tu inventario</p>
          
          {/* ✅ Métricas con colores consistentes */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{categories.length}</div>
                  <div className="text-sm opacity-90">Categorías</div>
                </div>
                <Folder className="w-8 h-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{brands.length}</div>
                  <div className="text-sm opacity-90">Marcas</div>
                </div>
                <Building className="w-8 h-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{categories.filter(c => c.isActive !== false).length}</div>
                  <div className="text-sm opacity-90">Cat. Activas</div>
                </div>
                <CheckCircle className="w-8 h-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{brands.filter(b => b.isActive !== false).length}</div>
                  <div className="text-sm opacity-90">Mar. Activas</div>
                </div>
                <CheckCircle className="w-8 h-8 opacity-80" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadAllData}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            disabled={isLoading}
          >
            <RotateCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          
          <button
            onClick={activeTab === 'categories' ? handleCreateCategory : handleCreateBrand}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva {activeTab === 'categories' ? 'Categoría' : 'Marca'}
          </button>
        </div>
      </div>
      
      {/* ✅ NAVEGACIÓN DE PESTAÑAS MEJORADA */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-4 px-6 font-medium text-sm transition-all relative ${
              activeTab === 'categories'
                ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Folder className="w-5 h-5" />
              <span>Categorías</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                activeTab === 'categories' 
                  ? 'bg-purple-200 text-purple-800' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {categories.length}
              </span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('brands')}
            className={`flex-1 py-4 px-6 font-medium text-sm transition-all relative ${
              activeTab === 'brands'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Building className="w-5 h-5" />
              <span>Marcas</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                activeTab === 'brands' 
                  ? 'bg-blue-200 text-blue-800' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {brands.length}
              </span>
            </div>
          </button>
        </nav>
      </div>
      
      {/* ✅ FILTROS MEJORADOS */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          
          {/* Búsqueda mejorada */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Buscar ${activeTab === 'categories' ? 'categorías' : 'marcas'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
          </div>
          
          {/* Filtro de estado mejorado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
          >
            {statusFilters.map(filter => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
          
          {/* Información de resultados */}
          <div className="text-sm text-gray-600 text-right">
            {activeTab === 'categories' 
              ? `${filteredCategories.length} de ${categories.length} categorías`
              : `${filteredBrands.length} de ${brands.length} marcas`
            }
          </div>
          
        </div>
      </div>
      
      {/* CONTENIDO DE PESTAÑAS */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Cargando datos...</p>
          </div>
        </div>
      ) : (
        <>
          {/* PESTAÑA: CATEGORÍAS */}
          {activeTab === 'categories' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Folder className="w-12 h-12 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {searchTerm ? 'No se encontraron categorías' : 'No hay categorías'}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {searchTerm 
                      ? 'Intenta cambiar los filtros de búsqueda o crear una nueva categoría'
                      : 'Comienza creando tu primera categoría de productos para organizar tu inventario'
                    }
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={handleCreateCategory}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Crear Primera Categoría
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredCategories.map((category, index) => {
                    const IconComponent = getCategoryIcon(category.iconName);
                    
                    return (
                      <div key={category.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          
                          {/* Información de la categoría */}
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center shadow-sm">
                              <IconComponent className="w-8 h-8 text-purple-600" />
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {category.name}
                                </h3>
                                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                  category.isActive !== false 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {category.isActive !== false ? '✓ Activa' : '✗ Inactiva'}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
                                {category.slug && (
                                  <span className="flex items-center gap-1">
                                    <Link className="w-4 h-4" />
                                    {category.slug}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Hash className="w-4 h-4" />
                                  Orden: {category.displayOrder || index + 1}
                                </span>
                                {category.productCount !== undefined && (
                                  <span className="flex items-center gap-1">
                                    <Package className="w-4 h-4" />
                                    {category.productCount} productos
                                  </span>
                                )}
                              </div>
                              
                              {category.description && (
                                <p className="text-sm text-gray-600 max-w-md">
                                  {category.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Acciones */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Editar categoría"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteCategory(category)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Eliminar categoría"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {/* PESTAÑA: MARCAS */}
          {activeTab === 'brands' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {filteredBrands.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Building className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {searchTerm ? 'No se encontraron marcas' : 'No hay marcas'}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {searchTerm 
                      ? 'Intenta cambiar los filtros de búsqueda o crear una nueva marca'
                      : 'Comienza agregando tu primera marca de productos para organizar tu inventario'
                    }
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={handleCreateBrand}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Crear Primera Marca
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredBrands.map((brand) => (
                    <div key={brand.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        
                        {/* Información de la marca */}
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
                            {brand.logoUrl ? (
                              <img 
                                src={brand.logoUrl} 
                                alt={brand.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <Building className={`w-8 h-8 text-blue-600 ${brand.logoUrl ? 'hidden' : ''}`} />
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {brand.name}
                              </h3>
                              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                brand.isActive !== false 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {brand.isActive !== false ? '✓ Activa' : '✗ Inactiva'}
                              </span>
                              
                              {/* Badge de Cloudinary */}
                              {brand.logoUrl && brand.logoUrl.includes('cloudinary.com') && (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                  ☁️ Cloudinary
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
                              {brand.website && (
                                <a 
                                  href={brand.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                >
                                  <Globe className="w-4 h-4" />
                                  Sitio web
                                </a>
                              )}
                              {brand.productCount !== undefined && (
                                <span className="flex items-center gap-1">
                                  <Package className="w-4 h-4" />
                                  {brand.productCount} productos
                                </span>
                              )}
                            </div>
                            
                            {brand.description && (
                              <p className="text-sm text-gray-600 max-w-md">
                                {brand.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Acciones */}
                        <div className="flex items-center space-x-2">
                          {brand.logoUrl && (
                            <button
                              onClick={() => window.open(brand.logoUrl, '_blank')}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              title="Ver logo completo"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleEditBrand(brand)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar marca"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteBrand(brand)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Eliminar marca"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
      
      {/* ✅ MODALES USANDO SUB-COMPONENTES */}
      <CategoryFormModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        category={editingCategory}
        onSave={handleCategorySaved}
        isCreating={isCreating}
      />
      
      <BrandFormModal
        isOpen={showBrandModal}
        onClose={() => setShowBrandModal(false)}
        brand={editingBrand}
        onSave={handleBrandSaved}
        isCreating={isCreating}
      />
      
    </div>
  );
};

export default CategoriesBrandsManager;