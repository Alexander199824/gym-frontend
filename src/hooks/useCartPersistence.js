// src/hooks/useCartPersistence.js
// FUNCIÓN: Hook personalizado para persistencia robusta del carrito
// FUNCIONALIDAD: ✅ Garantiza persistencia ✅ Auto-sync ✅ Recovery automático ✅ Debug integrado

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

// 🗂️ CONSTANTES
const CART_STORAGE_KEY = 'elite_fitness_cart';
const SESSION_STORAGE_KEY = 'elite_fitness_session_id';
const BACKUP_STORAGE_KEY = 'elite_fitness_cart_backup';
const PERSISTENCE_CHECK_INTERVAL = 5000; // 5 segundos
const AUTO_SAVE_INTERVAL = 2000; // 2 segundos

export const useCartPersistence = (cartItems, sessionInfo, dispatch, actions) => {
  const { isAuthenticated, user } = useAuth();
  const { showWarning } = useApp();
  
  // Referencias para evitar re-renders innecesarios
  const lastSavedItemsRef = useRef([]);
  const lastSavedSessionIdRef = useRef(null);
  const persistenceCheckRef = useRef(null);
  const autoSaveRef = useRef(null);
  
  // ✅ FUNCIÓN: Guardar carrito con backup automático
  const saveCartWithBackup = useCallback((items, sessionId, options = {}) => {
    try {
      const timestamp = new Date().toISOString();
      const cartData = {
        items: items || [],
        timestamp,
        expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(), // 30 días
        version: '1.2',
        sessionId: sessionId,
        userType: isAuthenticated ? 'authenticated' : 'guest',
        userId: user?.id || null,
        itemCount: items ? items.length : 0,
        totalValue: items ? items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0
      };
      
      // Guardar datos principales
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
      
      // Guardar sessionId por separado
      if (sessionId) {
        localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
      }
      
      // ✅ NUEVO: Crear backup automático
      const backupData = {
        ...cartData,
        backupTimestamp: timestamp,
        originalKey: CART_STORAGE_KEY
      };
      localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backupData));
      
      // Actualizar referencias
      lastSavedItemsRef.current = items || [];
      lastSavedSessionIdRef.current = sessionId;
      
      if (options.debug) {
        console.log('💾 Cart saved successfully:', {
          itemCount: cartData.itemCount,
          totalValue: cartData.totalValue,
          sessionId: sessionId,
          userType: cartData.userType,
          hasBackup: true
        });
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Error saving cart:', error);
      
      // Intentar recovery si falla el guardado
      tryRecoveryFromBackup();
      
      return false;
    }
  }, [isAuthenticated, user]);
  
  // ✅ FUNCIÓN: Cargar carrito con recovery automático
  const loadCartWithRecovery = useCallback(() => {
    try {
      const cartDataString = localStorage.getItem(CART_STORAGE_KEY);
      const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      
      if (!cartDataString) {
        console.log('📥 No cart data found, checking backup...');
        return tryRecoveryFromBackup() || { items: [], sessionId: sessionId };
      }
      
      const cartData = JSON.parse(cartDataString);
      
      // Verificar expiración
      if (cartData.expiresAt && new Date(cartData.expiresAt) < new Date()) {
        console.log('🗑️ Cart expired, clearing data...');
        clearAllCartData();
        return { items: [], sessionId: null };
      }
      
      // Verificar integridad de datos
      if (!Array.isArray(cartData.items)) {
        console.warn('⚠️ Cart data corrupted, attempting recovery...');
        return tryRecoveryFromBackup() || { items: [], sessionId: sessionId };
      }
      
      const finalSessionId = cartData.sessionId || sessionId;
      
      console.log('📥 Cart loaded successfully:', {
        itemCount: cartData.items.length,
        sessionId: finalSessionId,
        userType: cartData.userType || 'unknown',
        timestamp: cartData.timestamp
      });
      
      return {
        items: cartData.items,
        sessionId: finalSessionId
      };
      
    } catch (error) {
      console.error('❌ Error loading cart:', error);
      
      // Intentar recovery automático
      const recovered = tryRecoveryFromBackup();
      if (recovered) {
        showWarning('Se recuperó tu carrito desde el backup');
        return recovered;
      }
      
      return { items: [], sessionId: null };
    }
  }, [showWarning]);
  
  // ✅ FUNCIÓN: Recovery desde backup
  const tryRecoveryFromBackup = useCallback(() => {
    try {
      const backupDataString = localStorage.getItem(BACKUP_STORAGE_KEY);
      
      if (!backupDataString) {
        console.log('📥 No backup data available');
        return null;
      }
      
      const backupData = JSON.parse(backupDataString);
      
      // Verificar que el backup no esté expirado (máximo 7 días)
      const backupAge = new Date() - new Date(backupData.backupTimestamp);
      const maxBackupAge = 7 * 24 * 60 * 60 * 1000; // 7 días
      
      if (backupAge > maxBackupAge) {
        console.log('🗑️ Backup too old, discarding...');
        localStorage.removeItem(BACKUP_STORAGE_KEY);
        return null;
      }
      
      console.log('🔄 Recovering cart from backup:', {
        itemCount: backupData.items?.length || 0,
        backupAge: Math.round(backupAge / (1000 * 60 * 60)) + ' hours',
        sessionId: backupData.sessionId
      });
      
      // Restaurar desde backup
      if (Array.isArray(backupData.items)) {
        // Restaurar datos principales desde backup
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
          items: backupData.items,
          timestamp: new Date().toISOString(),
          expiresAt: backupData.expiresAt,
          version: backupData.version,
          sessionId: backupData.sessionId,
          userType: backupData.userType,
          recoveredFromBackup: true
        }));
        
        return {
          items: backupData.items,
          sessionId: backupData.sessionId
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Error during backup recovery:', error);
      return null;
    }
  }, []);
  
  // ✅ FUNCIÓN: Limpiar todos los datos del carrito
  const clearAllCartData = useCallback(() => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(BACKUP_STORAGE_KEY);
      
      lastSavedItemsRef.current = [];
      lastSavedSessionIdRef.current = null;
      
      console.log('🧹 All cart data cleared');
      
    } catch (error) {
      console.error('❌ Error clearing cart data:', error);
    }
  }, []);
  
  // ✅ FUNCIÓN: Verificar persistencia periódica
  const checkPersistence = useCallback(() => {
    try {
      // Solo para invitados con items en el carrito
      if (isAuthenticated || !cartItems || cartItems.length === 0) {
        return;
      }
      
      const cartDataString = localStorage.getItem(CART_STORAGE_KEY);
      const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      
      if (!cartDataString || !sessionId) {
        console.warn('⚠️ Cart persistence lost, attempting recovery...');
        
        // Intentar guardar de nuevo
        const currentSessionId = sessionInfo?.sessionId || 
          `guest_recovered_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const saved = saveCartWithBackup(cartItems, currentSessionId, { debug: true });
        
        if (saved) {
          console.log('✅ Cart persistence recovered');
          
          // Actualizar sessionInfo si es necesario
          if (dispatch && actions && sessionInfo?.sessionId !== currentSessionId) {
            dispatch({
              type: actions.SET_SESSION_INFO,
              payload: { sessionId: currentSessionId, isGuest: true }
            });
          }
        } else {
          console.error('❌ Failed to recover cart persistence');
        }
      }
      
    } catch (error) {
      console.error('❌ Error checking persistence:', error);
    }
  }, [isAuthenticated, cartItems, sessionInfo, saveCartWithBackup, dispatch, actions]);
  
  // ✅ FUNCIÓN: Auto-save periódico
  const autoSave = useCallback(() => {
    try {
      // Solo para invitados
      if (isAuthenticated || !cartItems || cartItems.length === 0) {
        return;
      }
      
      // Verificar si hay cambios
      const currentItemsString = JSON.stringify(cartItems);
      const lastSavedItemsString = JSON.stringify(lastSavedItemsRef.current);
      const currentSessionId = sessionInfo?.sessionId;
      
      if (currentItemsString !== lastSavedItemsString || 
          currentSessionId !== lastSavedSessionIdRef.current) {
        
        console.log('🔄 Auto-saving cart changes...');
        saveCartWithBackup(cartItems, currentSessionId, { debug: false });
      }
      
    } catch (error) {
      console.error('❌ Error in auto-save:', error);
    }
  }, [isAuthenticated, cartItems, sessionInfo, saveCartWithBackup]);
  
  // ✅ EFECTO: Configurar verificación periódica de persistencia
  useEffect(() => {
    // Solo para invitados con items
    if (!isAuthenticated && cartItems && cartItems.length > 0) {
      
      // Verificación periódica de persistencia
      persistenceCheckRef.current = setInterval(checkPersistence, PERSISTENCE_CHECK_INTERVAL);
      
      // Auto-save periódico
      autoSaveRef.current = setInterval(autoSave, AUTO_SAVE_INTERVAL);
      
      console.log('🔄 Started persistence monitoring for guest cart');
      
      return () => {
        if (persistenceCheckRef.current) {
          clearInterval(persistenceCheckRef.current);
        }
        if (autoSaveRef.current) {
          clearInterval(autoSaveRef.current);
        }
        console.log('🛑 Stopped persistence monitoring');
      };
    }
  }, [isAuthenticated, cartItems, checkPersistence, autoSave]);
  
  // ✅ EFECTO: Guardar inmediatamente cuando cambian los items
  useEffect(() => {
    if (!isAuthenticated && cartItems && cartItems.length > 0) {
      const sessionId = sessionInfo?.sessionId;
      if (sessionId) {
        saveCartWithBackup(cartItems, sessionId, { debug: false });
      }
    }
  }, [cartItems, sessionInfo, isAuthenticated, saveCartWithBackup]);
  
  // ✅ EFECTO: Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (persistenceCheckRef.current) {
        clearInterval(persistenceCheckRef.current);
      }
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, []);
  
  // ✅ FUNCIÓN: Debug del sistema de persistencia
  const debugPersistence = useCallback(() => {
    console.log('🔍 ===============================');
    console.log('💾 CART PERSISTENCE DEBUG');
    console.log('🔍 ===============================');
    
    try {
      const cartDataString = localStorage.getItem(CART_STORAGE_KEY);
      const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      const backupDataString = localStorage.getItem(BACKUP_STORAGE_KEY);
      
      console.log('📊 Current State:', {
        isAuthenticated,
        cartItemsCount: cartItems?.length || 0,
        sessionIdInContext: sessionInfo?.sessionId,
        lastSavedItems: lastSavedItemsRef.current.length,
        lastSavedSessionId: lastSavedSessionIdRef.current
      });
      
      console.log('💾 LocalStorage Analysis:', {
        hasCartData: !!cartDataString,
        hasSessionId: !!sessionId,
        hasBackup: !!backupDataString,
        cartDataSize: cartDataString ? cartDataString.length : 0,
        sessionIdValue: sessionId
      });
      
      if (cartDataString) {
        const cartData = JSON.parse(cartDataString);
        console.log('📋 Cart Data Structure:', {
          itemCount: cartData.items?.length || 0,
          timestamp: cartData.timestamp,
          version: cartData.version,
          userType: cartData.userType,
          hasExpiry: !!cartData.expiresAt,
          isExpired: cartData.expiresAt ? new Date(cartData.expiresAt) < new Date() : false
        });
      }
      
      if (backupDataString) {
        const backupData = JSON.parse(backupDataString);
        console.log('🔄 Backup Data:', {
          itemCount: backupData.items?.length || 0,
          backupAge: backupData.backupTimestamp ? 
            Math.round((new Date() - new Date(backupData.backupTimestamp)) / (1000 * 60 * 60)) + ' hours' : 
            'unknown'
        });
      }
      
      console.log('🔍 ===============================');
      
    } catch (error) {
      console.error('❌ Error in persistence debug:', error);
    }
  }, [isAuthenticated, cartItems, sessionInfo]);
  
  // Retornar funciones útiles
  return {
    saveCartWithBackup,
    loadCartWithRecovery,
    clearAllCartData,
    tryRecoveryFromBackup,
    debugPersistence,
    
    // Estado de persistencia
    isPersistenceActive: !isAuthenticated && cartItems && cartItems.length > 0,
    lastSavedCount: lastSavedItemsRef.current.length,
    hasBackup: !!localStorage.getItem(BACKUP_STORAGE_KEY)
  };
};

export default useCartPersistence;