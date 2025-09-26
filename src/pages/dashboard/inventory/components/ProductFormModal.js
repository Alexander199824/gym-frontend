// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/inventory/components/ProductFormModal.js
// FUNCIÓN: Modal reutilizable para crear y editar productos

import React, { useState, useEffect } from 'react';
import {
  Package, Save, X, Loader, Plus, Building, Tag
} from 'lucide-react';
import { useApp } from '../../../../contexts/AppContext';
import inventoryService from '../../../../services/inventoryService';

// ✅ IMPORTAR LOS SUB-COMPONENTES DE CATEGORÍAS Y MARCAS
import CategoryFormModal from './CategoryFormModal';
import BrandFormModal from './BrandFormModal';

const ProductFormModal = ({ 
  isOpen, 
  onClose, 
  product = null, 
  onSave,
  isCreating = false,
  categories = [],
  brands = [],
  onCategoriesUpdate,
  onBrandsUpdate
}) => {
  const { showSuccess, showError } = useApp();
  
  // Estados
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // ✅ ESTADOS PARA SUB-MODALES
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  
  // Plantilla para nuevo producto
  const emptyProduct = {
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    sku: '',
    stockQuantity: '',
    minStock: 5,
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: '',
      unit: 'cm'
    },
    categoryId: '',
    brandId: '',
    isFeatured: false,
    allowOnlinePayment: true,
    allowCardPayment: true,
    allowCashOnDelivery: true,
    deliveryTime: '1-3 días hábiles'
  };
  
  // Inicializar datos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      if (product) {
        setEditingProduct({
          ...product,
          price: product.price?.toString() || '',
          originalPrice: product.originalPrice?.toString() || '',
          stockQuantity: product.stockQuantity?.toString() || '',
          minStock: product.minStock?.toString() || '5',
          weight: product.weight?.toString() || '',
          dimensions: product.dimensions || emptyProduct.dimensions
        });
      } else {
        setEditingProduct({ ...emptyProduct });
      }
    }
  }, [isOpen, product]);
  
  // ✅ HANDLERS PARA CATEGORÍAS
  const handleCreateCategory = () => {
    setShowCategoryModal(true);
  };
  
  const handleCategorySaved = (savedCategory) => {
    console.log('✅ Category saved from product modal:', savedCategory);
    // Actualizar el producto actual con la nueva categoría
    setEditingProduct(prev => ({ ...prev, categoryId: savedCategory.id }));
    // Notificar al componente padre para actualizar la lista
    if (onCategoriesUpdate) {
      onCategoriesUpdate();
    }
    showSuccess('Categoría creada y seleccionada');
  };
  
  // ✅ HANDLERS PARA MARCAS
  const handleCreateBrand = () => {
    setShowBrandModal(true);
  };
  
  const handleBrandSaved = (savedBrand) => {
    console.log('✅ Brand saved from product modal:', savedBrand);
    // Actualizar el producto actual con la nueva marca
    setEditingProduct(prev => ({ ...prev, brandId: savedBrand.id }));
    // Notificar al componente padre para actualizar la lista
    if (onBrandsUpdate) {
      onBrandsUpdate();
    }
    showSuccess('Marca creada y seleccionada');
  };
  
  // MANEJAR GUARDADO
  const handleSave = async () => {
    if (!editingProduct) return;
    
    // Validaciones básicas
    if (!editingProduct.name.trim()) {
      showError('El nombre del producto es obligatorio');
      return;
    }
    
    if (!editingProduct.price || parseFloat(editingProduct.price) <= 0) {
      showError('El precio de venta es obligatorio y debe ser mayor a 0');
      return;
    }
    
    if (!editingProduct.categoryId) {
      showError('Debe seleccionar una categoría');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Formatear datos para API
      const productData = inventoryService.formatProductDataForAPI(editingProduct);
      
      let response;
      if (isCreating) {
        response = await inventoryService.createProduct(productData);
      } else {
        response = await inventoryService.updateProduct(editingProduct.id, productData);
      }
      
      if (response.success) {
        showSuccess(isCreating ? 'Producto creado exitosamente' : 'Producto actualizado exitosamente');
        if (onSave) {
          onSave(response.data);
        }
        onClose();
      }
      
    } catch (error) {
      console.error('❌ Error saving product:', error);
      showError(`Error al guardar producto: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!isOpen || !editingProduct) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                {isCreating ? 'Nuevo Producto' : 'Editar Producto'}
              </h3>
              <p className="text-gray-600">
                {isCreating ? 'Agrega un nuevo producto a tu inventario' : 'Modifica los datos del producto'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-all"
              disabled={isSaving}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* COLUMNA 1: INFORMACIÓN BÁSICA */}
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  Información Básica
                </h4>
                
                <div className="space-y-4">
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre del producto *
                    </label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="Ej: Proteína Whey Premium"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                      placeholder="Descripción detallada del producto..."
                    />
                  </div>
                  
                  {/* ✅ CATEGORÍA CON OPCIÓN DE CREAR */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Categoría *
                      </label>
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Nueva Categoría
                      </button>
                    </div>
                    <select
                      value={editingProduct.categoryId}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, categoryId: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      required
                    >
                      <option value="">Selecciona una categoría</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* ✅ MARCA CON OPCIÓN DE CREAR */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Marca
                      </label>
                      <button
                        type="button"
                        onClick={handleCreateBrand}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Nueva Marca
                      </button>
                    </div>
                    <select
                      value={editingProduct.brandId}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, brandId: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">Selecciona una marca</option>
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      SKU (Código de producto)
                    </label>
                    <input
                      type="text"
                      value={editingProduct.sku}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, sku: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="Código único del producto"
                    />
                  </div>
                  
                </div>
              </div>
            </div>
            
            {/* COLUMNA 2: PRECIOS E INVENTARIO */}
            <div className="space-y-6">
              
              {/* Precios */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                    <span className="text-green-600 text-xs font-bold">Q</span>
                  </div>
                  Precios
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Precio de venta * (Q)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Precio original (Q)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingProduct.originalPrice}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, originalPrice: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">Para mostrar descuentos</p>
                  </div>
                </div>
                
                {/* Preview de descuento */}
                {editingProduct.originalPrice && editingProduct.price && 
                 parseFloat(editingProduct.originalPrice) > parseFloat(editingProduct.price) && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-700 font-medium">Descuento:</span>
                      <span className="text-green-600">
                        {Math.round(((parseFloat(editingProduct.originalPrice) - parseFloat(editingProduct.price)) / parseFloat(editingProduct.originalPrice)) * 100)}%
                      </span>
                      <span className="text-gray-500">
                        (Q{(parseFloat(editingProduct.originalPrice) - parseFloat(editingProduct.price)).toFixed(2)} de ahorro)
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Inventario */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-bold">#</span>
                  </div>
                  Inventario
                </h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cantidad en stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editingProduct.stockQuantity}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, stockQuantity: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Stock mínimo
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editingProduct.minStock}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, minStock: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="5"
                    />
                    <p className="text-xs text-gray-500 mt-1">Alerta cuando llegue a este nivel</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={editingProduct.weight}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, weight: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="0.0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tiempo de entrega
                    </label>
                    <input
                      type="text"
                      value={editingProduct.deliveryTime}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, deliveryTime: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="1-3 días hábiles"
                    />
                  </div>
                </div>
              </div>
              
              {/* Opciones */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Opciones de Producto</h4>
                
                <div className="space-y-4">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.isFeatured}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, isFeatured: e.target.checked }))}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-700">Producto destacado</span>
                      <p className="text-xs text-gray-500">Aparecerá en la sección de productos destacados</p>
                    </div>
                  </label>
                  
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-gray-700">Métodos de pago permitidos</h5>
                    
                    <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.allowOnlinePayment}
                        onChange={(e) => setEditingProduct(prev => ({ ...prev, allowOnlinePayment: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Pago online</span>
                    </label>
                    
                    <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.allowCardPayment}
                        onChange={(e) => setEditingProduct(prev => ({ ...prev, allowCardPayment: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Pago con tarjeta</span>
                    </label>
                    
                    <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.allowCashOnDelivery}
                        onChange={(e) => setEditingProduct(prev => ({ ...prev, allowCashOnDelivery: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Pago contra entrega</span>
                    </label>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
              disabled={isSaving}
            >
              Cancelar
            </button>
            
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg disabled:opacity-50"
              disabled={isSaving || !editingProduct.name || !editingProduct.price || !editingProduct.categoryId}
            >
              {isSaving ? (
                <div className="flex items-center">
                  <Loader className="w-5 h-5 animate-spin mr-2" />
                  Guardando...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="w-5 h-5 mr-2" />
                  {isCreating ? 'Crear Producto' : 'Guardar Cambios'}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* ✅ SUB-MODALES REUTILIZABLES */}
      <CategoryFormModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        category={null}
        onSave={handleCategorySaved}
        isCreating={true}
      />
      
      <BrandFormModal
        isOpen={showBrandModal}
        onClose={() => setShowBrandModal(false)}
        brand={null}
        onSave={handleBrandSaved}
        isCreating={true}
      />
    </>
  );
};

export default ProductFormModal;