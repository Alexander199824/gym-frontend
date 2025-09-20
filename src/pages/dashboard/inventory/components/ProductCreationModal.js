// src/pages/dashboard/inventory/components/ProductCreationModal.js
// COMPONENTE DE CREACIÓN DE PRODUCTOS BASADO EN EL TEST EXITOSO
// Usa exactamente el mismo patrón que funciona al 100% en el backend

import React, { useState, useEffect } from 'react';
import {
  X, Save, Package, DollarSign, Hash, Tag, Weight,
  Ruler, Star, CreditCard, Truck, Image, Plus,
  Upload, AlertCircle, CheckCircle, Loader, Eye
} from 'lucide-react';
import { useApp } from '../../../../contexts/AppContext';
import apiService from '../../../../services/apiService';

const ProductCreationModal = ({ 
  isOpen, 
  onClose, 
  onProductCreated,
  editingProduct = null 
}) => {
  const { showSuccess, showError, formatCurrency } = useApp();
  
  // Estado del formulario basado en el test exitoso
  const [formData, setFormData] = useState({
    // Información básica
    name: '',
    description: '',
    sku: '',
    
    // Precios
    price: 0,
    originalPrice: 0,
    
    // Inventario
    stockQuantity: 0,
    minStock: 5,
    weight: 0,
    
    // Dimensiones (como en el test)
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
      unit: 'cm'
    },
    
    // Categoría y marca
    categoryId: '',
    brandId: '',
    
    // Configuraciones
    isFeatured: false,
    isActive: true,
    allowOnlinePayment: true,
    allowCardPayment: true,
    allowCashOnDelivery: true,
    deliveryTime: '1-2 días hábiles'
  });
  
  // Estados de control
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Estados para imagen
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploaded, setImageUploaded] = useState(false);
  
  // Estados de validación
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1: Datos básicos, 2: Imagen, 3: Confirmación
  
  // Cargar datos necesarios al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      if (editingProduct) {
        loadProductData();
      } else {
        generateSKU();
      }
    }
  }, [isOpen, editingProduct]);
  
  // Limpiar al cerrar
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);
  
  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      console.log('ProductCreationModal: Loading categories and brands...');
      
      // Cargar categorías y marcas en paralelo
      const [categoriesResponse, brandsResponse] = await Promise.all([
        apiService.getManagementCategories(),
        apiService.getManagementBrands()
      ]);
      
      console.log('Categories response:', categoriesResponse);
      console.log('Brands response:', brandsResponse);
      
      // Extraer datos según la estructura del backend
      const categoryData = categoriesResponse?.data?.categories || categoriesResponse?.data || [];
      const brandData = brandsResponse?.data?.brands || brandsResponse?.data || [];
      
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setBrands(Array.isArray(brandData) ? brandData : []);
      
      console.log('ProductCreationModal: Loaded', {
        categories: categoryData.length,
        brands: brandData.length
      });
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      showError('Error cargando categorías y marcas');
      
      // Fallback con datos mínimos
      setCategories([
        { id: 1, name: 'Suplementos' },
        { id: 2, name: 'Ropa Deportiva' },
        { id: 3, name: 'Accesorios' }
      ]);
      setBrands([
        { id: 1, name: 'Universal Nutrition' },
        { id: 2, name: 'Nike' },
        { id: 3, name: 'Adidas' }
      ]);
    } finally {
      setLoadingData(false);
    }
  };
  
  const loadProductData = () => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        description: editingProduct.description || '',
        sku: editingProduct.sku || '',
        price: parseFloat(editingProduct.price) || 0,
        originalPrice: parseFloat(editingProduct.originalPrice) || 0,
        stockQuantity: parseInt(editingProduct.stockQuantity) || 0,
        minStock: parseInt(editingProduct.minStock) || 5,
        weight: parseFloat(editingProduct.weight) || 0,
        dimensions: editingProduct.dimensions || {
          length: 0, width: 0, height: 0, unit: 'cm'
        },
        categoryId: editingProduct.categoryId || '',
        brandId: editingProduct.brandId || '',
        isFeatured: Boolean(editingProduct.isFeatured),
        isActive: Boolean(editingProduct.isActive !== false),
        allowOnlinePayment: Boolean(editingProduct.allowOnlinePayment !== false),
        allowCardPayment: Boolean(editingProduct.allowCardPayment !== false),
        allowCashOnDelivery: Boolean(editingProduct.allowCashOnDelivery !== false),
        deliveryTime: editingProduct.deliveryTime || '1-2 días hábiles'
      });
    }
  };
  
  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const sku = `PROD-${timestamp}-${random}`;
    setFormData(prev => ({ ...prev, sku }));
  };
  
  const resetForm = () => {
    setFormData({
      name: '', description: '', sku: '', price: 0, originalPrice: 0,
      stockQuantity: 0, minStock: 5, weight: 0,
      dimensions: { length: 0, width: 0, height: 0, unit: 'cm' },
      categoryId: '', brandId: '', isFeatured: false, isActive: true,
      allowOnlinePayment: true, allowCardPayment: true, allowCashOnDelivery: true,
      deliveryTime: '1-2 días hábiles'
    });
    setSelectedImage(null);
    setImagePreview(null);
    setImageUploaded(false);
    setErrors({});
    setStep(1);
  };
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  const handleDimensionChange = (dimension, value) => {
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [dimension]: parseFloat(value) || 0
      }
    }));
  };
  
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        showError('Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      // Validar tamaño (máximo 10MB como en el test)
      if (file.size > 10 * 1024 * 1024) {
        showError('La imagen es demasiado grande. Máximo 10MB permitido');
        return;
      }
      
      setSelectedImage(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Validaciones obligatorias
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del producto es obligatorio';
    }
    
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'El precio debe ser mayor a 0';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Debe seleccionar una categoría';
    }
    
    if (formData.stockQuantity < 0) {
      newErrors.stockQuantity = 'El stock no puede ser negativo';
    }
    
    if (formData.minStock < 0) {
      newErrors.minStock = 'El stock mínimo no puede ser negativo';
    }
    
    // Validar SKU único (en el futuro se puede validar con el backend)
    if (!formData.sku.trim()) {
      newErrors.sku = 'El SKU es obligatorio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSaveProduct = async () => {
    if (!validateForm()) {
      showError('Por favor corrige los errores en el formulario');
      return;
    }
    
    setIsSaving(true);
    
    try {
      console.log('ProductCreationModal: Saving product...', formData);
      
      // Formatear datos exactamente como en el test exitoso
      const productPayload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        sku: formData.sku.trim(),
        stockQuantity: parseInt(formData.stockQuantity),
        minStock: parseInt(formData.minStock),
        weight: parseFloat(formData.weight) || null,
        dimensions: formData.dimensions,
        categoryId: parseInt(formData.categoryId),
        brandId: formData.brandId ? parseInt(formData.brandId) : null,
        isFeatured: Boolean(formData.isFeatured),
        isActive: Boolean(formData.isActive),
        allowOnlinePayment: Boolean(formData.allowOnlinePayment),
        allowCardPayment: Boolean(formData.allowCardPayment),
        allowCashOnDelivery: Boolean(formData.allowCashOnDelivery),
        deliveryTime: formData.deliveryTime.trim()
      };
      
      console.log('ProductCreationModal: Product payload:', productPayload);
      
      let productResponse;
      
      if (editingProduct) {
        // Actualizar producto existente
        productResponse = await apiService.updateProduct(editingProduct.id, productPayload);
      } else {
        // Crear nuevo producto
        productResponse = await apiService.createProduct(productPayload);
      }
      
      console.log('ProductCreationModal: Product response:', productResponse);
      
      if (productResponse.success) {
        const createdProduct = productResponse.data.product;
        console.log('ProductCreationModal: Product saved successfully:', createdProduct);
        
        // Si hay imagen seleccionada, subirla
        if (selectedImage && createdProduct.id) {
          await handleImageUpload(createdProduct.id);
        }
        
        showSuccess(editingProduct ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
        
        // Notificar al componente padre
        if (onProductCreated) {
          onProductCreated(createdProduct);
        }
        
        // Ir al paso de confirmación
        setStep(3);
        
        // Cerrar modal después de un momento
        setTimeout(() => {
          onClose();
        }, 2000);
        
      } else {
        throw new Error(productResponse.message || 'Error al guardar el producto');
      }
      
    } catch (error) {
      console.error('Error saving product:', error);
      showError(error.response?.data?.message || error.message || 'Error al guardar el producto');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleImageUpload = async (productId) => {
    if (!selectedImage || !productId) return;
    
    setUploadingImage(true);
    
    try {
      console.log('ProductCreationModal: Uploading image for product', productId);
      
      // Usar exactamente el mismo patrón del test exitoso
      const formData = new FormData();
      formData.append('image', selectedImage, selectedImage.name);
      
      const response = await apiService.uploadProductImage(
        productId,
        formData,
        true, // isPrimary
        formData.name + ' - Imagen principal', // altText
        1 // displayOrder
      );
      
      console.log('ProductCreationModal: Image upload response:', response);
      
      if (response.success) {
        setImageUploaded(true);
        console.log('ProductCreationModal: Image uploaded successfully to Cloudinary');
        showSuccess('Imagen subida exitosamente a Cloudinary');
      }
      
    } catch (error) {
      console.error('Error uploading image:', error);
      showError('Error al subir la imagen: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploadingImage(false);
    }
  };
  
  const calculateDiscount = () => {
    if (formData.originalPrice && formData.price && formData.originalPrice > formData.price) {
      return Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100);
    }
    return 0;
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <p className="text-sm text-gray-600">
                {editingProduct ? 'Actualiza la información del producto' : 'Agrega un nuevo producto al inventario'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
            disabled={isSaving}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-8">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Información del Producto</span>
            </div>
            
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Imagen del Producto</span>
            </div>
            
            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Confirmación</span>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600">Cargando categorías y marcas...</p>
              </div>
            </div>
          ) : step === 1 ? (
            // Paso 1: Información del producto
            <div className="space-y-6">
              
              {/* Información Básica */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 text-purple-600 mr-2" />
                  Información Básica
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ej: Proteína Whey Premium"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU *
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => handleInputChange('sku', e.target.value)}
                        placeholder="PROD-123456-ABC"
                        className={`flex-1 px-3 py-2 border rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                          errors.sku ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={generateSKU}
                        className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 transition-colors"
                        title="Generar SKU automático"
                      >
                        <Hash className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría *
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => handleInputChange('categoryId', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        errors.categoryId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marca
                    </label>
                    <select
                      value={formData.brandId}
                      onChange={(e) => handleInputChange('brandId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Seleccionar marca</option>
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Descripción detallada del producto..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Precios */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                  Precios
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio de Venta * (Quetzales)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="0.00"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        errors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio Original (Quetzales)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.originalPrice}
                      onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descuento
                      </label>
                      <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-center">
                        <span className="text-lg font-bold text-purple-600">
                          {calculateDiscount()}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Inventario */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 text-blue-600 mr-2" />
                  Inventario
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Actual
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stockQuantity}
                      onChange={(e) => handleInputChange('stockQuantity', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        errors.stockQuantity ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.stockQuantity && <p className="text-red-500 text-sm mt-1">{errors.stockQuantity}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Mínimo
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minStock}
                      onChange={(e) => handleInputChange('minStock', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        errors.minStock ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.minStock && <p className="text-red-500 text-sm mt-1">{errors.minStock}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      placeholder="0.0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Dimensiones */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Ruler className="w-5 h-5 text-orange-600 mr-2" />
                  Dimensiones
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Largo (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.dimensions.length}
                      onChange={(e) => handleDimensionChange('length', e.target.value)}
                      placeholder="0.0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ancho (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.dimensions.width}
                      onChange={(e) => handleDimensionChange('width', e.target.value)}
                      placeholder="0.0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alto (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.dimensions.height}
                      onChange={(e) => handleDimensionChange('height', e.target.value)}
                      placeholder="0.0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidad
                    </label>
                    <select
                      value={formData.dimensions.unit}
                      onChange={(e) => handleDimensionChange('unit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="cm">Centímetros</option>
                      <option value="in">Pulgadas</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Configuraciones */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Star className="w-5 h-5 text-yellow-600 mr-2" />
                  Configuraciones
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Producto Destacado</label>
                        <p className="text-xs text-gray-500">Se mostrará en la página principal</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isFeatured}
                          onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Producto Activo</label>
                        <p className="text-xs text-gray-500">Visible en la tienda</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => handleInputChange('isActive', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Pago Online</label>
                        <p className="text-xs text-gray-500">Permite compras online</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.allowOnlinePayment}
                          onChange={(e) => handleInputChange('allowOnlinePayment', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Contra Entrega</label>
                        <p className="text-xs text-gray-500">Pago al recibir</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.allowCashOnDelivery}
                          onChange={(e) => handleInputChange('allowCashOnDelivery', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiempo de Entrega
                  </label>
                  <input
                    type="text"
                    value={formData.deliveryTime}
                    onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                    placeholder="Ej: 1-2 días hábiles"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              
            </div>
          ) : step === 2 ? (
            // Paso 2: Imagen del producto
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Imagen del Producto</h3>
                <p className="text-gray-600">Agrega una imagen para que los clientes puedan ver el producto</p>
              </div>
              
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                {imagePreview ? (
                  <div className="text-center">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mx-auto mb-4 max-w-xs h-48 object-cover rounded-lg"
                    />
                    <p className="text-sm text-gray-600 mb-4">
                      {selectedImage?.name} ({(selectedImage?.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                      className="btn-secondary btn-sm"
                    >
                      Cambiar Imagen
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-gray-900">
                        Selecciona una imagen del producto
                      </p>
                      <p className="text-sm text-gray-600">
                        PNG, JPG, WEBP hasta 10MB. Se subirá automáticamente a Cloudinary.
                      </p>
                    </div>
                    <div className="mt-6">
                      <label className="btn-primary cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Seleccionar Archivo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Image Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Image className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Información sobre las imágenes
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Las imágenes se suben automáticamente a Cloudinary</li>
                      <li>• Se optimizan automáticamente para web</li>
                      <li>• Se pueden agregar más imágenes después de crear el producto</li>
                      <li>• La primera imagen será la imagen principal</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Paso 3: Confirmación
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ¡Producto {editingProduct ? 'Actualizado' : 'Creado'} Exitosamente!
                </h3>
                <p className="text-gray-600">
                  El producto ha sido {editingProduct ? 'actualizado' : 'agregado'} al inventario 
                  {imageUploaded ? ' y la imagen se subió a Cloudinary' : ''}.
                </p>
              </div>
              
              {/* Resumen del producto */}
              <div className="bg-gray-50 rounded-lg p-6 text-left max-w-md mx-auto">
                <h4 className="font-medium text-gray-900 mb-3">Resumen del Producto</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nombre:</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">SKU:</span>
                    <span className="font-medium">{formData.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio:</span>
                    <span className="font-medium">{formatCurrency(formData.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stock:</span>
                    <span className="font-medium">{formData.stockQuantity} unidades</span>
                  </div>
                  {calculateDiscount() > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Descuento:</span>
                      <span className="font-medium text-green-600">{calculateDiscount()}%</span>
                    </div>
                  )}
                  {imageUploaded && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Imagen:</span>
                      <span className="font-medium text-green-600">✓ Subida a Cloudinary</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {step === 1 && 'Completa la información básica del producto'}
            {step === 2 && 'Selecciona una imagen para el producto (opcional)'}
            {step === 3 && 'Producto guardado exitosamente'}
          </div>
          
          <div className="flex items-center space-x-3">
            {step > 1 && step < 3 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="btn-secondary"
                disabled={isSaving}
              >
                Anterior
              </button>
            )}
            
            {step === 1 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-primary"
                disabled={!validateForm()}
              >
                Siguiente
              </button>
            )}
            
            {step === 2 && (
              <button
                type="button"
                onClick={handleSaveProduct}
                className="btn-primary"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    {editingProduct ? 'Actualizando...' : 'Creando...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
                  </>
                )}
              </button>
            )}
            
            {step === 3 && (
              <button
                type="button"
                onClick={onClose}
                className="btn-primary"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ProductCreationModal;