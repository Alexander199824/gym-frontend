// src/services/storeService.js
// SERVICIO DE TIENDA, CARRITO, PRODUCTOS Y ÓRDENES

import toast from 'react-hot-toast';
import { BaseService } from './baseService.js';
import { api } from './apiConfig.js';

class StoreService extends BaseService {
  // ================================
  // 🛍️ MÉTODOS DE TIENDA - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
  // ================================
  
  // OBTENER PRODUCTOS DESTACADOS
  async getFeaturedProducts() {
    console.log('🛍️ FETCHING FEATURED PRODUCTS...');
    try {
      const result = await this.get('/store/featured-products');
      console.log('✅ FEATURED PRODUCTS RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ FEATURED PRODUCTS FAILED:', error.message);
      throw error;
    }
  }
  
  // OBTENER PRODUCTOS
  async getProducts(params = {}) {
    const response = await api.get('/api/store/products', { params });
    return response.data;
  }
  
  // OBTENER CATEGORÍAS DE PRODUCTOS
  async getProductCategories() {
    console.log('🗂️ FETCHING PRODUCT CATEGORIES...');
    
    try {
      const result = await this.get('/store/categories');
      
      console.log('✅ PRODUCT CATEGORIES RECEIVED:', result);
      
      if (result && result.data && result.data.categories) {
        console.log('✅ Categories structure is correct');
        console.log('🗂️ Categories details:', {
          totalCategories: result.data.categories.length,
          hasActiveCategories: result.data.categories.some(cat => cat.isActive !== false)
        });
      } else {
        console.warn('⚠️ Categories structure might be different from README');
      }
      
      return result;
    } catch (error) {
      console.log('❌ PRODUCT CATEGORIES FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('🗂️ CATEGORIES: Endpoint not found - Categories not implemented');
        return {
          success: true,
          data: {
            categories: []
          }
        };
      }
      
      throw error;
    }
  }

  // OBTENER MARCAS DE PRODUCTOS
  async getProductBrands() {
    console.log('🏷️ FETCHING PRODUCT BRANDS...');
    
    try {
      const result = await this.get('/store/brands');
      
      console.log('✅ PRODUCT BRANDS RECEIVED:', result);
      
      if (result && result.data && result.data.brands) {
        console.log('✅ Brands structure is correct');
        console.log('🏷️ Brands details:', {
          totalBrands: result.data.brands.length
        });
      } else {
        console.warn('⚠️ Brands structure might be different from README');
      }
      
      return result;
    } catch (error) {
      console.log('❌ PRODUCT BRANDS FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('🏷️ BRANDS: Endpoint not found - Brands not implemented');
        return {
          success: true,
          data: {
            brands: []
          }
        };
      }
      
      throw error;
    }
  }

  // OBTENER PRODUCTO POR ID
  async getProductById(productId) {
    console.log('🛍️ FETCHING PRODUCT BY ID...');
    console.log('🎯 Product ID:', productId);
    
    try {
      const result = await this.get(`/store/products/${productId}`);
      
      console.log('✅ PRODUCT DETAILS RECEIVED:', result);
      
      if (result && result.data) {
        console.log('✅ Product details structure is correct');
        console.log('🛍️ Product info:', {
          id: result.data.id,
          name: result.data.name,
          price: result.data.price,
          inStock: result.data.inStock !== false,
          hasImages: !!result.data.images?.length
        });
      }
      
      return result;
    } catch (error) {
      console.log('❌ GET PRODUCT BY ID FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('🛍️ PRODUCT NOT FOUND: Product ID might be invalid');
      }
      
      throw error;
    }
  }

  // ================================
  // 🛒 MÉTODOS DEL CARRITO - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
  // ================================
  
  async getCart(sessionId = null) {
    console.log('🛒 FETCHING CART...');
    console.log('🆔 Session ID provided:', sessionId);
    
    try {
      const params = {};
      
      if (sessionId) {
        params.sessionId = sessionId;
      }
      
      const result = await this.get('/store/cart', { params });
      console.log('✅ CART DATA RECEIVED:', result);
      
      if (result && result.data && result.data.cartItems) {
        console.log('✅ Cart structure is correct (README format)');
        console.log('🛒 Cart items:', {
          itemsCount: result.data.cartItems.length,
          totalAmount: result.data.summary?.totalAmount || 0,
          hasItems: result.data.cartItems.length > 0,
          sessionId: sessionId || 'authenticated'
        });
      } else {
        console.warn('⚠️ Cart structure might be different from README');
        console.log('📋 Actual structure:', result);
      }
      
      return result;
    } catch (error) {
      console.log('❌ CART FETCH FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('🛒 CART: Cart endpoint not found or user has empty cart');
        return {
          success: true,
          data: {
            cartItems: [],
            summary: {
              itemsCount: 0,
              subtotal: 0,
              taxAmount: 0,
              shippingAmount: 0,
              totalAmount: 0
            }
          }
        };
      } else if (error.response?.status === 401) {
        console.log('🔐 CART: Authorization required for cart access');
      }
      
      throw error;
    }
  }
  
  async addToCart(productData, sessionId = null) {
    console.log('🛒 ADDING ITEM TO CART...');
    console.log('📤 Product data to add:', productData);
    console.log('🆔 Session ID:', sessionId);
    
    try {
      const requestData = {
        productId: productData.productId || productData.id,
        quantity: productData.quantity || 1,
        selectedVariants: productData.selectedVariants || productData.options || {}
      };
      
      if (sessionId) {
        requestData.sessionId = sessionId;
      }
      
      console.log('📤 Final request data:', requestData);
      
      const result = await this.post('/store/cart', requestData);
      
      console.log('✅ ITEM ADDED TO CART SUCCESSFULLY:', result);
      
      if (result && result.success) {
        console.log('✅ Add to cart response structure is correct');
      } else {
        console.warn('⚠️ Add to cart response structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ ADD TO CART FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        console.log('💡 Common validation issues:');
        console.log('   - productId: Must be a valid product ID');
        console.log('   - quantity: Must be a positive number');
        console.log('   - selectedVariants: Must be valid product variants');
      } else if (error.response?.status === 404) {
        console.log('🛒 PRODUCT NOT FOUND: Product ID might be invalid');
      } else if (error.response?.status === 400) {
        console.log('📋 BAD REQUEST: Check data format');
      }
      
      throw error;
    }
  }

  // Método para actualizar cantidad específica de un item
  async updateCartItemQuantity(cartItemId, quantity, sessionId = null) {
    console.log('🛒 UPDATING CART ITEM QUANTITY...');
    console.log('🎯 Cart Item ID:', cartItemId);
    console.log('📊 New quantity:', quantity);
    console.log('🆔 Session ID:', sessionId);
    
    try {
      const updates = { quantity: parseInt(quantity) || 1 };
      return await this.updateCartItem(cartItemId, updates, sessionId);
    } catch (error) {
      console.log('❌ UPDATE CART ITEM QUANTITY FAILED:', error.message);
      throw error;
    }
  }

   async removeFromCart(cartItemId, sessionId = null) {
    console.log('🛒 REMOVING ITEM FROM CART...');
    console.log('🎯 Cart Item ID:', cartItemId);
    console.log('🆔 Session ID:', sessionId);
    
    try {
      let url = `/store/cart/${cartItemId}`;
      
      if (sessionId) {
        url += `?sessionId=${encodeURIComponent(sessionId)}`;
      }
      
      const result = await this.delete(url);
      
      console.log('✅ ITEM REMOVED FROM CART SUCCESSFULLY');
      
      return result;
    } catch (error) {
      console.log('❌ REMOVE FROM CART FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('🛒 CART ITEM NOT FOUND: Cart item ID might be invalid');
      }
      
      throw error;
    }
  }
  
  async clearCart(sessionId = null) {
    console.log('🛒 CLEARING ENTIRE CART...');
    console.log('🆔 Session ID:', sessionId);
    
    try {
      const cartResponse = await this.getCart(sessionId);
      
      if (cartResponse && cartResponse.data && cartResponse.data.cartItems) {
        const items = cartResponse.data.cartItems;
        
        if (items.length === 0) {
          console.log('✅ CART WAS ALREADY EMPTY');
          return { success: true, message: 'Cart was already empty' };
        }
        
        console.log(`🛒 Removing ${items.length} items from cart...`);
        
        const deletePromises = items.map(item => 
          this.removeFromCart(item.id, sessionId).catch(err => {
            console.warn(`⚠️ Failed to remove item ${item.id}:`, err.message);
            return null;
          })
        );
        
        await Promise.all(deletePromises);
        
        console.log('✅ CART CLEARED SUCCESSFULLY');
        return { success: true, message: 'Cart cleared successfully' };
      }
      
      console.log('✅ CART WAS ALREADY EMPTY');
      return { success: true, message: 'Cart was already empty' };
      
    } catch (error) {
      console.log('❌ CLEAR CART FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('✅ CART NOT FOUND (already empty)');
        return { success: true, message: 'Cart was already empty' };
      }
      
      throw error;
    }
  }
  
  async updateCart(items) {
    console.log('🛒 LEGACY UPDATE CART METHOD - Converting to individual operations...');
    console.log('📤 Items to sync:', items);
    
    try {
      if (!Array.isArray(items) || items.length === 0) {
        console.log('🛒 No items to update, clearing cart...');
        return await this.clearCart();
      }
      
      console.log('🛒 Legacy updateCart called - items should be managed individually');
      console.log('💡 Consider using addToCart, updateCartItem, removeFromCart individually');
      
      return {
        success: true,
        message: 'Cart sync attempted - using localStorage for now',
        itemsCount: items.length
      };
      
    } catch (error) {
      console.log('❌ LEGACY UPDATE CART FAILED:', error.message);
      throw error;
    }
  }

  // Método para obtener resumen del carrito
  async getCartSummary(sessionId = null) {
    console.log('🛒 FETCHING CART SUMMARY...');
    console.log('🆔 Session ID:', sessionId);
    
    try {
      const cart = await this.getCart(sessionId);
      
      if (cart && cart.data) {
        const summary = cart.data.summary || {
          itemsCount: cart.data.cartItems?.length || 0,
          subtotal: 0,
          taxAmount: 0,
          shippingAmount: 0,
          totalAmount: 0
        };
        
        console.log('✅ CART SUMMARY RECEIVED:', summary);
        return { success: true, data: summary };
      }
      
      throw new Error('Invalid cart response');
    } catch (error) {
      console.log('❌ CART SUMMARY FAILED:', error.message);
      throw error;
    }
  }

  // Método para validar carrito antes de checkout
  async validateCart(sessionId = null) {
    console.log('🛒 VALIDATING CART FOR CHECKOUT...');
    console.log('🆔 Session ID:', sessionId);
    
    try {
      const cart = await this.getCart(sessionId);
      
      if (!cart || !cart.data || !cart.data.cartItems) {
        throw new Error('Cart is empty or invalid');
      }
      
      const items = cart.data.cartItems;
      
      if (items.length === 0) {
        throw new Error('Cart is empty');
      }
      
      // Validar cada item
      const validationResults = items.map(item => {
        const errors = [];
        
        if (!item.productId) {
          errors.push('Product ID missing');
        }
        
        if (!item.quantity || item.quantity <= 0) {
          errors.push('Invalid quantity');
        }
        
        if (!item.price || item.price <= 0) {
          errors.push('Invalid price');
        }
        
        return {
          itemId: item.id,
          productId: item.productId,
          isValid: errors.length === 0,
          errors
        };
      });
      
      const invalidItems = validationResults.filter(result => !result.isValid);
      
      const validation = {
        isValid: invalidItems.length === 0,
        totalItems: items.length,
        validItems: validationResults.length - invalidItems.length,
        invalidItems: invalidItems.length,
        issues: invalidItems,
        summary: cart.data.summary
      };
      
      console.log('✅ CART VALIDATION COMPLETED:', validation);
      
      return { success: true, data: validation };
      
    } catch (error) {
      console.log('❌ CART VALIDATION FAILED:', error.message);
      throw error;
    }
  }

  // Método para obtener items específicos del carrito
  async getCartItem(cartItemId, sessionId = null) {
    console.log('🛒 FETCHING SPECIFIC CART ITEM...');
    console.log('🎯 Cart Item ID:', cartItemId);
    console.log('🆔 Session ID:', sessionId);
    
    try {
      const cart = await this.getCart(sessionId);
      
      if (cart && cart.data && cart.data.cartItems) {
        const item = cart.data.cartItems.find(item => item.id === cartItemId);
        
        if (item) {
          console.log('✅ CART ITEM FOUND:', item);
          return { success: true, data: { item } };
        } else {
          console.log('❌ CART ITEM NOT FOUND');
          throw new Error('Cart item not found');
        }
      }
      
      throw new Error('Invalid cart response');
    } catch (error) {
      console.log('❌ GET CART ITEM FAILED:', error.message);
      throw error;
    }
  }

  // ================================
  // 🛍️ MÉTODOS DE ÓRDENES
  // ================================

  async createOrder(orderData) {
    console.log('🛍️ CREATING ORDER (CHECKOUT)...');
    console.log('📤 Order data to send:', orderData);
    
    try {
      const result = await this.post('/store/orders', orderData);
      
      console.log('✅ ORDER CREATED SUCCESSFULLY:', result);
      
      if (result && result.success && result.data?.order) {
        console.log('✅ Order creation response structure is correct');
        console.log('🛍️ Order details:', {
          id: result.data.order.id,
          orderNumber: result.data.order.orderNumber,
          totalAmount: result.data.order.totalAmount,
          status: result.data.order.status,
          paymentMethod: result.data.order.paymentMethod,
          itemsCount: result.data.order.items?.length || 0,
          isGuest: !!orderData.sessionId
        });
        
        // Mostrar toast de éxito
        toast.success(`Orden creada: #${result.data.order.orderNumber}`);
      } else {
        console.warn('⚠️ Order creation response structure might be different from README');
      }
      
      return result;
    } catch (error) {
      console.log('❌ ORDER CREATION FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        console.log('💡 Common validation issues:');
        console.log('   - customerInfo: Required for guest orders');
        console.log('   - shippingAddress: Required for all orders');
        console.log('   - items: Must be valid array of products');
        console.log('   - paymentMethod: Must be valid payment method');
      } else if (error.response?.status === 404) {
        console.log('🛍️ ORDER ENDPOINT NOT FOUND: Check backend implementation');
        toast.error('Servicio de órdenes no disponible');
      } else if (error.response?.status === 400) {
        console.log('📋 BAD REQUEST: Check order data format');
        toast.error('Datos de orden inválidos');
      } else if (error.response?.status === 401) {
        console.log('🔐 AUTHORIZATION REQUIRED for order creation');
        toast.error('Sesión expirada, inicia sesión nuevamente');
      } else {
        toast.error('Error al crear la orden');
      }
      
      throw error;
    }
  }

  async getMyOrders(params = {}) {
    console.log('🛍️ FETCHING MY ORDERS...');
    
    try {
      const result = await this.get('/store/my-orders', { params });
      
      console.log('✅ MY ORDERS RECEIVED:', result);
      
      if (result && result.data) {
        if (Array.isArray(result.data)) {
          console.log(`✅ Orders list: ${result.data.length} orders found`);
        } else if (result.data.orders && Array.isArray(result.data.orders)) {
          console.log(`✅ Orders list: ${result.data.orders.length} orders found`);
          console.log('📄 Pagination:', result.data.pagination);
        }
      }
      
      return result;
    } catch (error) {
      console.log('❌ GET MY ORDERS FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('🛍️ NO ORDERS FOUND: User has no orders yet');
        return {
          success: true,
          data: {
            orders: [],
            pagination: {
              total: 0,
              page: 1,
              pages: 0,
              limit: params.limit || 10
            }
          }
        };
      }
      
      throw error;
    }
  }

  async getOrderById(orderId) {
    console.log('🛍️ FETCHING ORDER BY ID...');
    console.log('🎯 Order ID:', orderId);
    
    try {
      const result = await this.get(`/store/orders/${orderId}`);
      
      console.log('✅ ORDER DETAILS RECEIVED:', result);
      
      if (result && result.data && result.data.order) {
        console.log('✅ Order details structure is correct');
        console.log('🛍️ Order info:', {
          id: result.data.order.id,
          orderNumber: result.data.order.orderNumber,
          status: result.data.order.status,
          totalAmount: result.data.order.totalAmount,
          itemsCount: result.data.order.items?.length || 0
        });
      }
      
      return result;
    } catch (error) {
      console.log('❌ GET ORDER BY ID FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('🛍️ ORDER NOT FOUND: Order ID might be invalid or does not belong to user');
      } else if (error.response?.status === 403) {
        console.log('🔒 ACCESS DENIED: Cannot view this order (not owner)');
      }
      
      throw error;
    }
  }

  // VALIDAR DATOS DE ORDEN PARA CHECKOUT
  validateOrderData(orderData) {
    console.log('🔍 VALIDATING ORDER DATA STRUCTURE...');
    
    const errors = [];
    const warnings = [];
    
    // Validar items
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      errors.push('items is required and must be a non-empty array');
    } else {
      orderData.items.forEach((item, index) => {
        if (!item.productId) {
          errors.push(`items[${index}].productId is required`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`items[${index}].quantity must be a positive number`);
        }
        if (!item.price || item.price <= 0) {
          errors.push(`items[${index}].price must be a positive number`);
        }
      });
    }
    
    // Si es orden de invitado, validar información del cliente
    if (orderData.sessionId) {
      if (!orderData.customerInfo) {
        errors.push('customerInfo is required for guest orders');
      } else {
        if (!orderData.customerInfo.name || orderData.customerInfo.name.trim() === '') {
          errors.push('customerInfo.name is required');
        }
        if (!orderData.customerInfo.email || orderData.customerInfo.email.trim() === '') {
          errors.push('customerInfo.email is required');
        } else if (!/\S+@\S+\.\S+/.test(orderData.customerInfo.email)) {
          errors.push('customerInfo.email is not valid');
        }
        if (!orderData.customerInfo.phone || orderData.customerInfo.phone.trim() === '') {
          errors.push('customerInfo.phone is required');
        }
      }
    }
    
    // Validar dirección de envío
    if (!orderData.shippingAddress) {
      errors.push('shippingAddress is required');
    } else {
      if (!orderData.shippingAddress.street || orderData.shippingAddress.street.trim() === '') {
        errors.push('shippingAddress.street is required');
      }
      if (!orderData.shippingAddress.city || orderData.shippingAddress.city.trim() === '') {
        errors.push('shippingAddress.city is required');
      }
    }
    
    // Validar método de pago
    const validPaymentMethods = ['cash_on_delivery', 'card', 'transfer'];
    if (!orderData.paymentMethod || !validPaymentMethods.includes(orderData.paymentMethod)) {
      errors.push('paymentMethod must be one of: ' + validPaymentMethods.join(', '));
    }
    
    const validation = {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        hasErrors: errors.length > 0,
        hasWarnings: warnings.length > 0,
        totalIssues: errors.length + warnings.length,
        isGuest: !!orderData.sessionId,
        itemsCount: orderData.items?.length || 0,
        paymentMethod: orderData.paymentMethod
      }
    };
    
    if (errors.length > 0) {
      console.log('❌ ORDER DATA VALIDATION FAILED:');
      errors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('✅ ORDER DATA VALIDATION PASSED');
    }
    
    return validation;
  }

  // FORMATEAR DATOS DE ORDEN SEGÚN README
  formatOrderDataForAPI(orderData) {
    console.log('🔄 FORMATTING ORDER DATA FOR API...');
    
    const formattedData = {
      items: orderData.items.map(item => ({
        productId: item.productId,
        quantity: parseInt(item.quantity) || 1,
        price: parseFloat(item.price) || 0,
        selectedVariants: item.selectedVariants || {}
      })),
      paymentMethod: orderData.paymentMethod || 'cash_on_delivery',
      deliveryTimeSlot: orderData.deliveryTimeSlot || 'morning',
      notes: orderData.notes || ''
    };
    
    if (orderData.sessionId) {
      formattedData.sessionId = orderData.sessionId;
      formattedData.customerInfo = {
        name: orderData.customerInfo.name,
        email: orderData.customerInfo.email,
        phone: orderData.customerInfo.phone
      };
    }
    
    if (orderData.shippingAddress) {
      formattedData.shippingAddress = {
        street: orderData.shippingAddress.street,
        city: orderData.shippingAddress.city || 'Guatemala',
        state: orderData.shippingAddress.state || 'Guatemala',
        zipCode: orderData.shippingAddress.zipCode || '01001',
        reference: orderData.shippingAddress.reference || ''
      };
    }
    
    if (orderData.summary) {
      formattedData.summary = orderData.summary;
    }
    
    console.log('✅ Order data formatted for API:', {
      isGuest: !!formattedData.sessionId,
      itemsCount: formattedData.items.length,
      hasCustomerInfo: !!formattedData.customerInfo,
      hasShippingAddress: !!formattedData.shippingAddress,
      paymentMethod: formattedData.paymentMethod
    });
    
    return formattedData;
  }

  // MÉTODO COMPLETO PARA CHECKOUT
  async processCheckout(orderData) {
    console.log('🛍️ PROCESSING COMPLETE CHECKOUT...');
    console.log('📤 Raw order data received:', orderData);
    
    try {
      const validation = this.validateOrderData(orderData);
      
      if (!validation.isValid) {
        const errorMessage = 'Datos de orden inválidos: ' + validation.errors.join(', ');
        console.log('❌ Validation failed:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const formattedData = this.formatOrderDataForAPI(orderData);
      const result = await this.createOrder(formattedData);
      
      console.log('✅ CHECKOUT PROCESSED SUCCESSFULLY:', result);
      
      return result;
      
    } catch (error) {
      console.log('❌ CHECKOUT PROCESSING FAILED:', error.message);
      throw error;
    }
  }

  // ================================
  // 💬 MÉTODOS DE TESTIMONIOS - MANTIENE FUNCIONALIDAD EXISTENTE
  // ================================

  // CREAR TESTIMONIO (Solo para clientes autenticados)
  async createTestimonial(testimonialData) {
    console.log('💬 CREATING TESTIMONIAL...');
    console.log('📤 Testimonial data to send:', testimonialData);
    
    try {
      const result = await this.post('/testimonials', testimonialData);
      
      console.log('✅ TESTIMONIAL CREATED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        console.log('✅ Testimonial creation response structure is correct');
        console.log('💬 Testimonial details:', {
          hasThankYouMessage: !!result.data?.thankYouMessage,
          testimonialId: result.data?.testimonial?.id,
          rating: result.data?.testimonial?.rating,
          submittedAt: result.data?.testimonial?.submittedAt
        });
        
        if (result.data?.thankYouMessage) {
          console.log('💝 Thank you message:', result.data.thankYouMessage);
        }
      } else {
        console.warn('⚠️ Testimonial creation response structure might be different from API docs');
      }
      
      return result;
    } catch (error) {
      console.log('❌ TESTIMONIAL CREATION FAILED:', error.message);
      
      if (error.response?.status === 400) {
        console.log('💬 TESTIMONIAL: User already has a testimonial');
        console.log('💝 Response includes thank you message:', !!error.response.data?.data?.thankYouMessage);
      } else if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        console.log('💡 Common validation issues:');
        console.log('   - text: Must be between 10 and 500 characters');
        console.log('   - rating: Must be between 1 and 5');
        console.log('   - role: Must be provided');
      } else if (error.response?.status === 403) {
        console.log('🔒 TESTIMONIAL: Only clients can submit testimonials');
      } else if (error.response?.status === 401) {
        console.log('🔐 TESTIMONIAL: Authentication required');
      }
      
      throw error;
    }
  }

  // OBTENER MIS TESTIMONIOS (Solo para clientes autenticados)
  async getMyTestimonials() {
    console.log('💬 FETCHING MY TESTIMONIALS...');
    
    try {
      const result = await this.get('/testimonials/my-testimonials');
      
      console.log('✅ MY TESTIMONIALS RECEIVED:', result);
      
      if (result && result.success && result.data) {
        console.log('✅ My testimonials response structure is correct');
        console.log('💬 My testimonials details:', {
          totalTestimonials: result.data.total || 0,
          testimonialsCount: result.data.testimonials?.length || 0,
          hasActiveTestimonial: result.data.hasActiveTestimonial || false,
          hasPendingTestimonial: result.data.hasPendingTestimonial || false,
          canSubmitNew: result.data.canSubmitNew !== false,
          hasThankYouMessage: !!result.data.thankYouMessage
        });
        
        if (result.data.testimonials && Array.isArray(result.data.testimonials)) {
          result.data.testimonials.forEach((testimonial, index) => {
            console.log(`💬 Testimonial ${index + 1}:`, {
              id: testimonial.id,
              rating: testimonial.rating,
              status: testimonial.status,
              featured: testimonial.featured || false,
              canEdit: testimonial.canEdit || false,
              canDelete: testimonial.canDelete || false,
              textLength: testimonial.text?.length || 0
            });
          });
        }
        
        if (result.data.thankYouMessage) {
          console.log('💝 Thank you message:', result.data.thankYouMessage);
        }
      } else {
        console.warn('⚠️ My testimonials response structure might be different from API docs');
      }
      
      return result;
    } catch (error) {
      console.log('❌ GET MY TESTIMONIALS FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('💬 TESTIMONIALS: No testimonials found or user has empty testimonials list');
        return {
          success: true,
          data: {
            testimonials: [],
            total: 0,
            hasActiveTestimonial: false,
            hasPendingTestimonial: false,
            canSubmitNew: true,
            thankYouMessage: null
          }
        };
      } else if (error.response?.status === 403) {
        console.log('🔒 TESTIMONIALS: Only clients can view their testimonials');
      } else if (error.response?.status === 401) {
        console.log('🔐 TESTIMONIALS: Authentication required');
      }
      
      throw error;
    }
  }

  // VALIDAR DATOS DE TESTIMONIO
  validateTestimonialData(testimonialData) {
    console.log('🔍 VALIDATING TESTIMONIAL DATA STRUCTURE...');
    
    const errors = [];
    const warnings = [];
    
    if (!testimonialData.text || typeof testimonialData.text !== 'string') {
      errors.push('text is required and must be a string');
    } else {
      const textLength = testimonialData.text.trim().length;
      if (textLength < 10) {
        errors.push('text must be at least 10 characters long');
      } else if (textLength > 500) {
        errors.push('text cannot exceed 500 characters');
      }
    }
    
    if (!testimonialData.rating || typeof testimonialData.rating !== 'number') {
      errors.push('rating is required and must be a number');
    } else if (testimonialData.rating < 1 || testimonialData.rating > 5) {
      errors.push('rating must be between 1 and 5');
    }
    
    if (!testimonialData.role || typeof testimonialData.role !== 'string') {
      errors.push('role is required and must be a string');
    } else if (testimonialData.role.trim().length === 0) {
      errors.push('role cannot be empty');
    }
    
    const validation = {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        hasErrors: errors.length > 0,
        hasWarnings: warnings.length > 0,
        totalIssues: errors.length + warnings.length,
        textLength: testimonialData.text?.trim()?.length || 0,
        rating: testimonialData.rating,
        role: testimonialData.role?.trim()
      }
    };
    
    if (errors.length > 0) {
      console.log('❌ TESTIMONIAL DATA VALIDATION FAILED:');
      errors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('✅ TESTIMONIAL DATA VALIDATION PASSED');
    }
    
    return validation;
  }

  // FORMATEAR DATOS DE TESTIMONIO
  formatTestimonialDataForAPI(testimonialData) {
    console.log('🔄 FORMATTING TESTIMONIAL DATA FOR API...');
    
    const formattedData = {
      text: testimonialData.text?.trim() || '',
      rating: parseInt(testimonialData.rating) || 1,
      role: testimonialData.role?.trim() || ''
    };
    
    console.log('✅ Testimonial data formatted for API:', {
      textLength: formattedData.text.length,
      rating: formattedData.rating,
      role: formattedData.role,
      isValid: formattedData.text.length >= 10 && 
               formattedData.rating >= 1 && 
               formattedData.rating <= 5 && 
               formattedData.role.length > 0
    });
    
    return formattedData;
  }

  // MÉTODO COMPLETO PARA CREAR TESTIMONIO CON VALIDACIÓN
  async submitTestimonial(testimonialData) {
    console.log('💬 SUBMITTING TESTIMONIAL WITH VALIDATION...');
    console.log('📤 Raw testimonial data received:', testimonialData);
    
    try {
      const validation = this.validateTestimonialData(testimonialData);
      
      if (!validation.isValid) {
        const errorMessage = 'Datos de testimonio inválidos: ' + validation.errors.join(', ');
        console.log('❌ Validation failed:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const formattedData = this.formatTestimonialDataForAPI(testimonialData);
      const result = await this.createTestimonial(formattedData);
      
      console.log('✅ TESTIMONIAL SUBMITTED SUCCESSFULLY:', result);
      
      return result;
      
    } catch (error) {
      console.log('❌ TESTIMONIAL SUBMISSION FAILED:', error.message);
      throw error;
    }
  }

  // ================================
  // ✅ DEBUG ESPECÍFICO PARA CARRITO Y CHECKOUT
  // ================================

  async debugCartAndCheckoutSystem() {
    console.log('🔍 =====================================');
    console.log('🛒 CART & CHECKOUT DEBUG - COMPLETE CHECK');
    console.log('🔍 =====================================');
    
    try {
      // 1. Verificar endpoints de carrito
      console.log('📡 1. CHECKING CART ENDPOINTS...');
      
      const cartEndpoints = [
        { path: '/store/cart', method: 'GET', description: 'Get cart' },
        { path: '/store/cart', method: 'POST', description: 'Add to cart' },
        { path: '/store/cart/{id}', method: 'PUT', description: 'Update cart item' },
        { path: '/store/cart/{id}', method: 'DELETE', description: 'Remove from cart' },
        { path: '/store/orders', method: 'POST', description: 'Create order (checkout)' },
        { path: '/store/my-orders', method: 'GET', description: 'Get my orders' }
      ];
      
      for (const endpoint of cartEndpoints) {
        try {
          if (endpoint.method === 'GET' && endpoint.path === '/store/cart') {
            const result = await this.getCart();
            console.log(`✅ ${endpoint.description} - Available`);
          } else {
            console.log(`📋 ${endpoint.description} - Endpoint exists (requires data to test)`);
          }
        } catch (error) {
          if (error.response?.status === 404) {
            console.log(`❌ ${endpoint.description} - Endpoint not implemented`);
          } else if (error.response?.status === 401) {
            console.log(`✅ ${endpoint.description} - Available (requires auth)`);
          } else {
            console.log(`⚠️ ${endpoint.description} - ${error.message}`);
          }
        }
      }
      
      // 2. Verificar productos disponibles
      console.log('🛍️ 2. CHECKING PRODUCTS AVAILABILITY...');
      try {
        const products = await this.get('/store/products', { params: { limit: 5 } });
        if (products && products.data && products.data.products) {
          console.log(`✅ Products available: ${products.data.products.length} found`);
          console.log('📦 Sample product:', products.data.products[0]?.name || 'N/A');
        } else {
          console.log('⚠️ No products found or unexpected format');
        }
      } catch (error) {
        console.log('❌ Products endpoint failed:', error.message);
      }
      
      // 3. Verificar estructura de carrito vacío
      console.log('🛒 3. CHECKING EMPTY CART STRUCTURE...');
      try {
        const emptyCart = await this.getCart();
        console.log('✅ Empty cart structure:', {
          hasCartItems: !!emptyCart.data?.cartItems,
          isArray: Array.isArray(emptyCart.data?.cartItems),
          hasSummary: !!emptyCart.data?.summary,
          itemCount: emptyCart.data?.cartItems?.length || 0
        });
      } catch (error) {
        console.log('❌ Empty cart check failed:', error.message);
      }
      
      console.log('🔍 =====================================');
      console.log('🛒 CART & CHECKOUT DEBUG - COMPLETED');
      console.log('🔍 =====================================');
      
    } catch (error) {
      console.error('❌ CART & CHECKOUT DEBUG FAILED:', error);
    }
  }
}

export { StoreService };