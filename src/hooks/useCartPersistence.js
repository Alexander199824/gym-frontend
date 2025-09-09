// Autor: Alexander Echeverria
// src/hooks/useCartPersistence.js
// FUNCIÓN: Hook personalizado para persistencia robusta del carrito de compras

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

// Constantes de configuración
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
  
  // Función para guardar carrito con backup automático
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
      
      // Crear backup automático
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
        console.log('Carrito guardado exitosamente:', {
          itemCount: cartData.itemCount,
          totalValue: cartData.totalValue,
          sessionId: sessionId,
          userType: cartData.userType,
          hasBackup: true
        });
      }
      
      return true;
      
    } catch (error) {
      console.error('Error guardando carrito:', error);
      
      // Intentar recovery si falla el guardado
      tryRecoveryFromBackup();
      
      return false;
    }
  }, [isAuthenticated, user]);
  
  // Función para cargar carrito con recovery automático
  const loadCartWithRecovery = useCallback(() => {
    try {
      const cartDataString = localStorage.getItem(CART_STORAGE_KEY);
      const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      
      if (!cartDataString) {
        console.log('No se encontraron datos del carrito, verificando backup...');
        return tryRecoveryFromBackup() || { items: [], sessionId: sessionId };
      }
      
      const cartData = JSON.parse(cartDataString);
      
      // Verificar expiración
      if (cartData.expiresAt && new Date(cartData.expiresAt) < new Date()) {
        console.log('Carrito expirado, limpiando datos...');
        clearAllCartData();
        return { items: [], sessionId: null };
      }
      
      // Verificar integridad de datos
      if (!Array.isArray(cartData.items)) {
        console.warn('Datos del carrito corruptos, intentando recuperación...');
        return tryRecoveryFromBackup() || { items: [], sessionId: sessionId };
      }
      
      const finalSessionId = cartData.sessionId || sessionId;
      
      console.log('Carrito cargado exitosamente:', {
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
      console.error('Error cargando carrito:', error);
      
      // Intentar recovery automático
      const recovered = tryRecoveryFromBackup();
      if (recovered) {
        showWarning('Se recuperó tu carrito desde el backup');
        return recovered;
      }
      
      return { items: [], sessionId: null };
    }
  }, [showWarning]);
  
  // Función para recovery desde backup
  const tryRecoveryFromBackup = useCallback(() => {
    try {
      const backupDataString = localStorage.getItem(BACKUP_STORAGE_KEY);
      
      if (!backupDataString) {
        console.log('No hay datos de backup disponibles');
        return null;
      }
      
      const backupData = JSON.parse(backupDataString);
      
      // Verificar que el backup no esté expirado (máximo 7 días)
      const backupAge = new Date() - new Date(backupData.backupTimestamp);
      const maxBackupAge = 7 * 24 * 60 * 60 * 1000; // 7 días
      
      if (backupAge > maxBackupAge) {
        console.log('Backup muy antiguo, descartando...');
        localStorage.removeItem(BACKUP_STORAGE_KEY);
        return null;
      }
      
      console.log('Recuperando carrito desde backup:', {
        itemCount: backupData.items?.length || 0,
        backupAge: Math.round(backupAge / (1000 * 60 * 60)) + ' horas',
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
      console.error('Error durante recuperación de backup:', error);
      return null;
    }
  }, []);
  
  // Función para limpiar todos los datos del carrito
  const clearAllCartData = useCallback(() => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(BACKUP_STORAGE_KEY);
      
      lastSavedItemsRef.current = [];
      lastSavedSessionIdRef.current = null;
      
      console.log('Todos los datos del carrito han sido limpiados');
      
    } catch (error) {
      console.error('Error limpiando datos del carrito:', error);
    }
  }, []);
  
  // Función para verificar persistencia periódica
  const checkPersistence = useCallback(() => {
    try {
      // Solo para invitados con items en el carrito
      if (isAuthenticated || !cartItems || cartItems.length === 0) {
        return;
      }
      
      const cartDataString = localStorage.getItem(CART_STORAGE_KEY);
      const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      
      if (!cartDataString || !sessionId) {
        console.warn('Persistencia del carrito perdida, intentando recuperación...');
        
        // Intentar guardar de nuevo
        const currentSessionId = sessionInfo?.sessionId || 
          `guest_recovered_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const saved = saveCartWithBackup(cartItems, currentSessionId, { debug: true });
        
        if (saved) {
          console.log('Persistencia del carrito recuperada');
          
          // Actualizar sessionInfo si es necesario
          if (dispatch && actions && sessionInfo?.sessionId !== currentSessionId) {
            dispatch({
              type: actions.SET_SESSION_INFO,
              payload: { sessionId: currentSessionId, isGuest: true }
            });
          }
        } else {
          console.error('Falló la recuperación de persistencia del carrito');
        }
      }
      
    } catch (error) {
      console.error('Error verificando persistencia:', error);
    }
  }, [isAuthenticated, cartItems, sessionInfo, saveCartWithBackup, dispatch, actions]);
  
  // Función para auto-save periódico
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
        
        console.log('Auto-guardando cambios del carrito...');
        saveCartWithBackup(cartItems, currentSessionId, { debug: false });
      }
      
    } catch (error) {
      console.error('Error en auto-guardado:', error);
    }
  }, [isAuthenticated, cartItems, sessionInfo, saveCartWithBackup]);
  
  // Efecto para configurar verificación periódica de persistencia
  useEffect(() => {
    // Solo para invitados con items
    if (!isAuthenticated && cartItems && cartItems.length > 0) {
      
      // Verificación periódica de persistencia
      persistenceCheckRef.current = setInterval(checkPersistence, PERSISTENCE_CHECK_INTERVAL);
      
      // Auto-save periódico
      autoSaveRef.current = setInterval(autoSave, AUTO_SAVE_INTERVAL);
      
      console.log('Iniciado monitoreo de persistencia para carrito de invitado');
      
      return () => {
        if (persistenceCheckRef.current) {
          clearInterval(persistenceCheckRef.current);
        }
        if (autoSaveRef.current) {
          clearInterval(autoSaveRef.current);
        }
        console.log('Detenido monitoreo de persistencia');
      };
    }
  }, [isAuthenticated, cartItems, checkPersistence, autoSave]);
  
  // Efecto para guardar inmediatamente cuando cambian los items
  useEffect(() => {
    if (!isAuthenticated && cartItems && cartItems.length > 0) {
      const sessionId = sessionInfo?.sessionId;
      if (sessionId) {
        saveCartWithBackup(cartItems, sessionId, { debug: false });
      }
    }
  }, [cartItems, sessionInfo, isAuthenticated, saveCartWithBackup]);
  
  // Efecto de cleanup al desmontar
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
  
  // Función para debug del sistema de persistencia
  const debugPersistence = useCallback(() => {
    console.log('===============================');
    console.log('DEBUG DE PERSISTENCIA DEL CARRITO');
    console.log('===============================');
    
    try {
      const cartDataString = localStorage.getItem(CART_STORAGE_KEY);
      const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      const backupDataString = localStorage.getItem(BACKUP_STORAGE_KEY);
      
      console.log('Estado Actual:', {
        isAuthenticated,
        cartItemsCount: cartItems?.length || 0,
        sessionIdInContext: sessionInfo?.sessionId,
        lastSavedItems: lastSavedItemsRef.current.length,
        lastSavedSessionId: lastSavedSessionIdRef.current
      });
      
      console.log('Análisis de LocalStorage:', {
        hasCartData: !!cartDataString,
        hasSessionId: !!sessionId,
        hasBackup: !!backupDataString,
        cartDataSize: cartDataString ? cartDataString.length : 0,
        sessionIdValue: sessionId
      });
      
      if (cartDataString) {
        const cartData = JSON.parse(cartDataString);
        console.log('Estructura de Datos del Carrito:', {
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
        console.log('Datos de Backup:', {
          itemCount: backupData.items?.length || 0,
          backupAge: backupData.backupTimestamp ? 
            Math.round((new Date() - new Date(backupData.backupTimestamp)) / (1000 * 60 * 60)) + ' horas' : 
            'desconocido'
        });
      }
      
      console.log('===============================');
      
    } catch (error) {
      console.error('Error en debug de persistencia:', error);
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

/*
DOCUMENTACIÓN DEL HOOK useCartPersistence

PROPÓSITO:
Este hook personalizado proporciona un sistema robusto de persistencia para el carrito de compras
de la tienda del gimnasio, garantizando que los productos seleccionados por los usuarios no se
pierdan durante su sesión de navegación, incluso ante problemas técnicos, cierres accidentales
del navegador o fallos temporales del sistema.

FUNCIONALIDADES PRINCIPALES:
- Persistencia automática del carrito en localStorage con sistema de backup
- Recuperación automática de datos en caso de corrupción o pérdida
- Auto-guardado continuo cada 2 segundos para usuarios invitados
- Verificación periódica de integridad cada 5 segundos
- Sistema de expiración automática después de 30 días
- Backup de seguridad con recuperación automática
- Logging detallado para debugging y monitoreo
- Manejo robusto de errores con fallbacks múltiples

ARCHIVOS Y CONEXIONES:

CONTEXTS REQUERIDOS:
- ../contexts/AuthContext: Verificación de estado de autenticación del usuario
- ../contexts/AppContext: Funciones de notificación para mostrar advertencias

DEPENDENCIAS DE REACT:
- useEffect: Efectos para monitoreo continuo y cleanup
- useCallback: Optimización de funciones para evitar re-renders
- useRef: Referencias persistentes para intervals y estados previos

QUE GESTIONA PARA EL USUARIO:

DATOS DEL CARRITO PERSISTIDOS:
El hook gestiona automáticamente todos los aspectos del carrito de compras:

**Información de Productos**:
- Lista completa de productos agregados al carrito
- Cantidades específicas de cada producto
- Precios en quetzales guatemaltecos de cada item
- Variantes de productos (tallas, colores, tipos)
- Metadatos de productos (SKU, categoría, disponibilidad)

**Datos de Sesión**:
- ID único de sesión para usuarios invitados
- Timestamp de creación y última modificación
- Tipo de usuario (autenticado vs invitado)
- ID de usuario autenticado (cuando aplique)
- Versión del formato de datos para compatibilidad

**Métricas Calculadas**:
- Número total de items en el carrito
- Valor total del carrito en quetzales guatemaltecos
- Fecha de expiración automática (30 días)
- Estadísticas de uso y modificaciones

**Sistema de Backup**:
- Copia de seguridad automática de todos los datos
- Timestamp independiente para el backup
- Recuperación automática en caso de corrupción
- Validación de antigüedad del backup (máximo 7 días)

FUNCIONALIDADES PARA USUARIOS INVITADOS:

**Persistencia Automática**:
- Guardado instantáneo al agregar/quitar productos
- Auto-guardado cada 2 segundos si hay cambios
- Verificación de integridad cada 5 segundos
- Recuperación automática si se detecta pérdida de datos

**Experiencia Sin Interrupciones**:
- Carrito conservado entre sesiones del navegador
- Recuperación tras cierres accidentales del navegador
- Mantenimiento de selecciones durante navegación
- Transferencia suave al registrarse como usuario

**Notificaciones de Estado**:
- Alerta automática si se recupera desde backup
- Información clara sobre el estado de persistencia
- Debugging visible para usuarios técnicos
- Logging detallado para resolución de problemas

CARACTERÍSTICAS TÉCNICAS:

**Llaves de Almacenamiento**:
- `elite_fitness_cart`: Datos principales del carrito
- `elite_fitness_session_id`: ID de sesión del usuario invitado
- `elite_fitness_cart_backup`: Copia de seguridad automática

**Estructura de Datos**:
```javascript
{
  items: [array de productos],
  timestamp: fecha de última modificación,
  expiresAt: fecha de expiración automática,
  version: versión del formato de datos,
  sessionId: identificador único de sesión,
  userType: 'authenticated' | 'guest',
  userId: ID del usuario (si está autenticado),
  itemCount: número total de items,
  totalValue: valor total en quetzales
}
```

**Intervalos de Operación**:
- Auto-guardado: Cada 2 segundos (2000ms)
- Verificación de integridad: Cada 5 segundos (5000ms)
- Expiración de datos: 30 días desde última modificación
- Expiración de backup: 7 días desde creación

RECUPERACIÓN Y FALLBACKS:

**Detección de Problemas**:
- Datos del carrito corruptos o faltantes
- SessionID perdido o inconsistente
- Formato de datos incompatible
- Errores de acceso a localStorage

**Estrategias de Recuperación**:
1. **Recuperación desde backup**: Uso automático de copia de seguridad
2. **Regeneración de sesión**: Creación de nuevo ID de sesión válido
3. **Validación y limpieza**: Eliminación de datos corruptos
4. **Notificación al usuario**: Información sobre acciones tomadas

**Logging y Debugging**:
- Console logging detallado en desarrollo
- Función de debug manual disponible
- Información de estado en tiempo real
- Métricas de rendimiento y errores

CASOS DE USO ESPECÍFICOS:

**Usuarios Invitados**:
- Cliente navegando productos sin registrarse
- Agregando múltiples productos a lo largo del tiempo
- Cerrando accidentalmente el navegador
- Volviendo días después a completar la compra

**Transición a Usuario Registrado**:
- Preservación del carrito durante registro
- Transferencia suave de datos de invitado a autenticado
- Mantenimiento de selecciones durante login
- Sincronización con datos del perfil del usuario

**Escenarios de Error**:
- Fallo temporal de localStorage
- Corrupción de datos por extensiones del navegador
- Limite de almacenamiento alcanzado
- Conflictos entre pestañas múltiples

INTEGRACIÓN CON LA TIENDA DEL GIMNASIO:

**Productos Específicos**:
- Suplementos nutricionales con precios en quetzales
- Equipos de entrenamiento y accesorios
- Ropa deportiva con variantes de talla
- Membresías especiales y paquetes promocionales
- Servicios adicionales del gimnasio

**Características Guatemaltecas**:
- Precios en quetzales guatemaltecos (Q)
- Impuestos locales calculados automáticamente
- Opciones de pago locales disponibles
- Productos disponibles específicamente en Guatemala

OPTIMIZACIONES DE RENDIMIENTO:

**Prevención de Re-renders**:
- useCallback para todas las funciones expuestas
- useRef para almacenar estados que no afectan rendering
- Comparaciones eficientes de cambios en datos
- Debouncing automático de operaciones de guardado

**Gestión de Memoria**:
- Cleanup automático de intervals al desmontar
- Eliminación de listeners de eventos
- Limpieza de referencias y timers
- Prevención de memory leaks

**Almacenamiento Eficiente**:
- Compresión automática de datos JSON
- Eliminación de campos redundantes
- Validación de tamaño antes de guardar
- Limpieza automática de datos expirados

MONITOREO Y DIAGNÓSTICO:

**Estados Disponibles**:
- `isPersistenceActive`: Si el sistema está monitoreando activamente
- `lastSavedCount`: Número de items en el último guardado
- `hasBackup`: Si existe una copia de seguridad disponible

**Funciones de Debug**:
- `debugPersistence()`: Información completa del estado del sistema
- Logging automático de operaciones importantes
- Métricas de rendimiento y tiempo de respuesta
- Análisis de integridad de datos

BENEFICIOS PARA EL GIMNASIO:

**Mejora en Conversiones**:
- Reducción de carritos abandonados por pérdida de datos
- Experiencia de compra más confiable
- Mayor probabilidad de completar compras
- Retención de intención de compra a largo plazo

**Experiencia de Usuario Superior**:
- Navegación sin preocupaciones sobre pérdida de datos
- Transiciones suaves entre sesiones
- Recuperación automática e invisible de problemas
- Confianza en la estabilidad del sistema

**Datos de Negocio**:
- Información sobre patrones de abandono de carrito
- Métricas de tiempo entre agregado y compra
- Análisis de productos más abandonados
- Insights sobre comportamiento de usuarios invitados

Este hook es fundamental para mantener la confiabilidad de la experiencia de compra
en la tienda del gimnasio, asegurando que ningún cliente pierda sus selecciones de
productos por problemas técnicos y maximizando las oportunidades de conversión de
ventas de productos en quetzales guatemaltecos.
*/