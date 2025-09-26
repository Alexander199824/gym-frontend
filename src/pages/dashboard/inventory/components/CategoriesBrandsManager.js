// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/inventory/components/CategoriesBrandsManager.js
// FUNCIÓN: Gestión completa de categorías y marcas con diseño mejorado y compacto

import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Save, X, Search, Tag, 
  Package, Folder, Star, ArrowUp, ArrowDown,
  Loader, RotateCcw, Grid, List, Copy, Check,
  AlertTriangle, CheckCircle, Building, Hash,
  // ✅ ICONOS PARA CATEGORÍAS
  Dumbbell, Heart, Activity, Zap, Target, Trophy,
  Apple, Coffee, Pill, ShoppingBag, Shirt, Watch,
  BookOpen, Music, Headphones, Camera, Gamepad2,
  Car, Home, Wrench, Palette, Globe, Shield,
  // ✅ ICONOS PARA UPLOAD
  Upload, CloudUpload, Image, FileImage, Trash,
  Eye, Download, Link, RefreshCw
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
  
  // ✅ ESTADOS PARA UPLOAD DE MARCAS
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [logoSource, setLogoSource] = useState('url'); // 'url' | 'upload'
  
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
  
  // ✅ MÉTODOS DE UPLOAD PARA MARCAS
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleLogoFile(file);
    }
  };
  
  const handleLogoFile = (file) => {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      showError('Por favor selecciona un archivo de imagen válido');
      return;
    }
    
    // Validar tamaño (3MB max)
    if (file.size > 3 * 1024 * 1024) {
      showError('El archivo es muy grande. Máximo 3MB');
      return;
    }
    
    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview({
        file,
        url: e.target.result,
        name: file.name,
        size: file.size
      });
      
      // Limpiar URL manual si se selecciona archivo
      setEditingBrand(prev => ({ ...prev, logoUrl: '' }));
    };
    reader.readAsDataURL(file);
  };
  
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      handleLogoFile(files[0]);
    }
  };
  
  const clearLogo = () => {
    setLogoPreview(null);
    setEditingBrand(prev => ({ ...prev, logoUrl: '' }));
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };
  
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
  
  // MÉTODOS DE MARCAS
  const handleCreateBrand = () => {
    setEditingBrand({ ...emptyBrand });
    setIsCreating(true);
    setLogoPreview(null);
    setLogoSource('url');
    setShowBrandModal(true);
  };
  
  const handleEditBrand = (brand) => {
    setEditingBrand({ ...brand });
    setIsCreating(false);
    setLogoPreview(null);
    setLogoSource(brand.logoUrl ? 'url' : 'upload');
    setShowBrandModal(true);
  };
  
  const handleSaveBrand = async () => {
    if (!editingBrand.name.trim()) {
      showError('El nombre de la marca es obligatorio');
      return;
    }
    
    setIsSaving(true);
    setUploadingLogo(true);
    
    try {
      let response;
      
      // ✅ SI HAY ARCHIVO, USAR FORMDATA PARA UPLOAD
      if (logoPreview && logoPreview.file) {
        const formData = new FormData();
        formData.append('name', editingBrand.name.trim());
        formData.append('description', editingBrand.description?.trim() || '');
        formData.append('website', editingBrand.website?.trim() || '');
        formData.append('isActive', editingBrand.isActive);
        formData.append('logo', logoPreview.file); // Archivo para Cloudinary
        
        if (isCreating) {
          response = await inventoryService.createBrandWithUpload(formData);
        } else {
          response = await inventoryService.updateBrandWithUpload(editingBrand.id, formData);
        }
      } else {
        // ✅ SI NO HAY ARCHIVO, USAR JSON NORMAL
        if (isCreating) {
          response = await inventoryService.createBrand(editingBrand);
        } else {
          response = await inventoryService.updateBrand(editingBrand.id, editingBrand);
        }
      }
      
      if (response.success) {
        setShowBrandModal(false);
        setEditingBrand(null);
        setLogoPreview(null);
        await loadAllData();
        showSuccess(isCreating ? 'Marca creada exitosamente' : 'Marca actualizada exitosamente');
      }
      
    } catch (error) {
      console.error('❌ Error saving brand:', error);
      showError(`Error al guardar marca: ${error.message}`);
    } finally {
      setIsSaving(false);
      setUploadingLogo(false);
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
                <Star className="w-8 h-8 opacity-80" />
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
      
      {/* ✅ MODAL DE CATEGORÍA REDISEÑADO - MÁS COMPACTO */}
      {showCategoryModal && editingCategory && (
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
                onClick={() => setShowCategoryModal(false)}
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
                onClick={() => setShowCategoryModal(false)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                disabled={isSaving}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSaveCategory}
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
      )}
      
      {/* ✅ MODAL DE MARCA MEJORADO CON UPLOAD */}
      {showBrandModal && editingBrand && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Building className="w-4 h-4 text-white" />
                  </div>
                  {isCreating ? 'Nueva Marca' : 'Editar Marca'}
                </h3>
                <p className="text-gray-600">
                  {isCreating ? 'Crea una nueva marca para categorizar tus productos' : 'Modifica los datos de la marca'}
                </p>
              </div>
              <button
                onClick={() => setShowBrandModal(false)}
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-all"
                disabled={isSaving}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Formulario básico */}
              <div className="space-y-6">
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Nombre de la marca *
                  </label>
                  <input
                    type="text"
                    value={editingBrand.name}
                    onChange={(e) => setEditingBrand(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Ej: Nike, Adidas, MuscleTech, Optimum Nutrition..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Descripción
                  </label>
                  <textarea
                    value={editingBrand.description}
                    onChange={(e) => setEditingBrand(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Describe la marca, su historia, valores o características principales..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Sitio web
                  </label>
                  <input
                    type="url"
                    value={editingBrand.website}
                    onChange={(e) => setEditingBrand(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="https://www.marca.com"
                  />
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingBrand.isActive}
                      onChange={(e) => setEditingBrand(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">Marca activa</span>
                  </label>
                </div>
                
              </div>
              
              {/* ✅ GESTIÓN DE LOGO MEJORADA */}
              <div className="space-y-6">
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Logo de la marca
                  </label>
                  
                  {/* Selector de fuente */}
                  <div className="flex mb-4">
                    <button
                      type="button"
                      onClick={() => setLogoSource('url')}
                      className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-all ${
                        logoSource === 'url'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-gray-200 text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Link className="w-4 h-4 inline mr-2" />
                      URL Externa
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoSource('upload')}
                      className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-all ${
                        logoSource === 'upload'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-gray-200 text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <CloudUpload className="w-4 h-4 inline mr-2" />
                      Subir Imagen
                    </button>
                  </div>
                  
                  {/* Contenido según la fuente seleccionada */}
                  {logoSource === 'url' ? (
                    <div>
                      <input
                        type="url"
                        value={editingBrand.logoUrl}
                        onChange={(e) => setEditingBrand(prev => ({ ...prev, logoUrl: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="https://ejemplo.com/logo.png"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        URL directa a la imagen del logo
                      </p>
                    </div>
                  ) : (
                    <div>
                      {/* ✅ ZONA DE DRAG & DROP */}
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
                          isDragging 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-300 hover:border-blue-400'
                        }`}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        
                        {logoPreview ? (
                          <div className="space-y-4">
                            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={logoPreview.url}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {logoPreview.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(logoPreview.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearLogo();
                              }}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              <Trash className="w-4 h-4 inline mr-1" />
                              Eliminar
                            </button>
                          </div>
                        ) : (
                          <div>
                            <CloudUpload className={`w-12 h-12 mx-auto mb-4 ${
                              isDragging ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                            <p className={`text-lg font-medium mb-2 ${
                              isDragging ? 'text-blue-600' : 'text-gray-900'
                            }`}>
                              {isDragging ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic'}
                            </p>
                            <p className="text-sm text-gray-500">
                              PNG, JPG, WebP hasta 3MB
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {uploadingLogo && (
                        <div className="mt-4 text-center">
                          <div className="inline-flex items-center text-blue-600">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                            Subiendo a Cloudinary...
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Preview del logo actual */}
                {(editingBrand.logoUrl || logoPreview) && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Vista previa</h4>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-white rounded-lg shadow-sm overflow-hidden flex items-center justify-center">
                        <img
                          src={logoPreview?.url || editingBrand.logoUrl}
                          alt="Logo preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="hidden w-full h-full bg-gray-100 flex items-center justify-center">
                          <Image className="w-6 h-6 text-gray-400" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{editingBrand.name || 'Nombre de la marca'}</p>
                        <p className="text-sm text-gray-500">
                          {logoPreview ? 'Imagen nueva' : 'Imagen actual'}
                          {editingBrand.logoUrl?.includes('cloudinary.com') && (
                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              Cloudinary
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
              </div>
              
            </div>
            
            {/* Botones de acción mejorados */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
              <button
                onClick={() => {
                  setShowBrandModal(false);
                  setLogoPreview(null);
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                disabled={isSaving}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSaveBrand}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg disabled:opacity-50"
                disabled={isSaving || !editingBrand.name.trim()}
              >
                {isSaving ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {uploadingLogo ? 'Subiendo...' : 'Guardando...'}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="w-5 h-5 mr-2" />
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