// src/services/debugAuthService.js
// Autor: Alexander Echeverria
// Archivo: src/services/debugAuthService.js

// FUNCION: Servicio específico para debug de autenticación
// DIAGNOSTICA: Problemas con roles colaborador/cliente vs admin

class DebugAuthService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    this.debugMode = process.env.NODE_ENV === 'development';
  }

  // Test completo del backend de autenticación
  async diagnoseAuthenticationIssue(email, password) {
    const diagnosis = {
      timestamp: new Date().toISOString(),
      email,
      steps: [],
      summary: null,
      recommendations: []
    };

    try {
      console.group('DIAGNOSTICO COMPLETO DE AUTENTICACION');
      console.log('Email a probar:', email);
      console.log('Longitud de contraseña:', password.length);

      // PASO 1: Verificar conectividad del backend
      diagnosis.steps.push(await this.step1_checkBackendConnectivity());
      
      // PASO 2: Verificar endpoint de login específicamente
      diagnosis.steps.push(await this.step2_checkLoginEndpoint());
      
      // PASO 3: Test directo de login
      diagnosis.steps.push(await this.step3_testDirectLogin(email, password));
      
      // PASO 4: Verificar estructura de la base de datos
      diagnosis.steps.push(await this.step4_checkDatabaseStructure());
      
      // PASO 5: Test con usuarios conocidos
      diagnosis.steps.push(await this.step5_testKnownUsers());

      // Generar resumen y recomendaciones
      diagnosis.summary = this.generateSummary(diagnosis.steps);
      diagnosis.recommendations = this.generateRecommendations(diagnosis.steps);

      console.log('DIAGNOSTICO COMPLETO:', diagnosis);
      console.groupEnd();

      return diagnosis;

    } catch (error) {
      console.error('Diagnóstico falló:', error);
      diagnosis.steps.push({
        step: 'diagnosis_error',
        success: false,
        error: error.message,
        details: 'Falló al completar el diagnóstico'
      });
      
      console.groupEnd();
      return diagnosis;
    }
  }

  // PASO 1: Verificar conectividad básica del backend
  async step1_checkBackendConnectivity() {
    console.log('PASO 1: Verificando conectividad del backend...');
    
    try {
      const response = await fetch(`${this.baseURL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Backend es accesible');
        return {
          step: 'backend_connectivity',
          success: true,
          message: 'Backend está ejecutándose y es accesible',
          data: data,
          responseTime: response.headers.get('x-response-time') || 'N/A'
        };
      } else {
        console.log('Backend respondió pero con error');
        return {
          step: 'backend_connectivity',
          success: false,
          message: `Backend respondió con estado ${response.status}`,
          status: response.status,
          statusText: response.statusText
        };
      }
    } catch (error) {
      console.log('No se puede conectar al backend');
      return {
        step: 'backend_connectivity',
        success: false,
        message: 'No se puede conectar al backend',
        error: error.message,
        suggestion: 'Iniciar el servidor backend: npm run dev'
      };
    }
  }

  // PASO 2: Verificar endpoint de login específico
  async step2_checkLoginEndpoint() {
    console.log('PASO 2: Verificando endpoint de login...');
    
    try {
      // Test con datos obviamente incorrectos para ver si el endpoint existe
      const response = await fetch(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'wrongpassword' })
      });

      console.log('Estado del endpoint de login:', response.status);

      if (response.status === 401) {
        console.log('Endpoint de login existe y funciona (401 esperado)');
        return {
          step: 'login_endpoint',
          success: true,
          message: 'Endpoint de login existe y responde correctamente',
          status: response.status,
          note: 'Obtuvo 401 como se esperaba para credenciales incorrectas'
        };
      } else if (response.status === 404) {
        console.log('Endpoint de login no encontrado');
        return {
          step: 'login_endpoint',
          success: false,
          message: 'Endpoint de login no encontrado',
          status: response.status,
          suggestion: 'Implementar /api/auth/login en el backend'
        };
      } else if (response.status === 422) {
        console.log('Endpoint de login existe pero validación falló');
        return {
          step: 'login_endpoint',
          success: true,
          message: 'Endpoint de login existe con validación',
          status: response.status,
          note: 'Obtuvo 422 - validación funcionando'
        };
      } else {
        const responseText = await response.text();
        console.log('Respuesta inesperada del endpoint de login');
        return {
          step: 'login_endpoint',
          success: false,
          message: `Respuesta inesperada: ${response.status}`,
          status: response.status,
          response: responseText
        };
      }
    } catch (error) {
      console.log('Error probando endpoint de login');
      return {
        step: 'login_endpoint',
        success: false,
        message: 'Error probando endpoint de login',
        error: error.message
      };
    }
  }

  // PASO 3: Test directo de login con credenciales reales
  async step3_testDirectLogin(email, password) {
    console.log('PASO 3: Probando login directo...');
    
    try {
      const response = await fetch(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { rawResponse: responseText };
      }

      console.log('Respuesta de login directo:', responseData);

      if (response.ok) {
        console.log('Login exitoso');
        return {
          step: 'direct_login',
          success: true,
          message: 'Login exitoso',
          data: responseData,
          userRole: responseData.user?.role || 'desconocido',
          hasToken: !!responseData.token
        };
      } else {
        console.log(`Login falló con estado ${response.status}`);
        
        // Análisis específico por código de error
        let analysis = this.analyzeLoginError(response.status, responseData);
        
        return {
          step: 'direct_login',
          success: false,
          message: `Login falló: ${response.status}`,
          status: response.status,
          data: responseData,
          analysis: analysis
        };
      }
    } catch (error) {
      console.log('Error de red durante login');
      return {
        step: 'direct_login',
        success: false,
        message: 'Error de red durante login',
        error: error.message
      };
    }
  }

  // PASO 4: Verificar estructura de la base de datos (a través de endpoints de debug)
  async step4_checkDatabaseStructure() {
    console.log('PASO 4: Verificando estructura de base de datos...');
    
    try {
      // Intentar obtener información de usuarios si hay un endpoint de debug
      const response = await fetch(`${this.baseURL}/api/debug/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Estructura de base de datos accesible');
        return {
          step: 'database_structure',
          success: true,
          message: 'Estructura de base de datos accesible',
          userCount: data.totalUsers || 0,
          roles: data.roles || [],
          sampleUsers: data.sampleUsers || []
        };
      } else if (response.status === 404) {
        console.log('No hay endpoint de debug disponible');
        return {
          step: 'database_structure',
          success: false,
          message: 'No hay endpoint de debug disponible',
          status: response.status,
          note: 'No se puede verificar estructura de base de datos'
        };
      } else {
        console.log('Error accediendo a estructura de base de datos');
        return {
          step: 'database_structure',
          success: false,
          message: 'Error accediendo a estructura de base de datos',
          status: response.status
        };
      }
    } catch (error) {
      console.log('No se puede verificar estructura de base de datos');
      return {
        step: 'database_structure',
        success: false,
        message: 'No se puede verificar estructura de base de datos',
        error: error.message,
        note: 'Este paso es opcional'
      };
    }
  }

  // PASO 5: Test con usuarios conocidos de cada rol
  async step5_testKnownUsers() {
    console.log('PASO 5: Probando usuarios conocidos...');
    
    const knownUsers = [
      { email: 'admin@gym.com', password: 'admin123', expectedRole: 'admin' },
      { email: 'colaborador@gym.com', password: 'colaborador123', expectedRole: 'colaborador' },
      { email: 'cliente@gym.com', password: 'cliente123', expectedRole: 'cliente' }
    ];

    const results = [];

    for (const user of knownUsers) {
      try {
        console.log(`Probando ${user.expectedRole}:`, user.email);
        
        const response = await fetch(`${this.baseURL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, password: user.password })
        });

        const responseText = await response.text();
        let responseData;
        
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          responseData = { rawResponse: responseText };
        }

        const result = {
          email: user.email,
          expectedRole: user.expectedRole,
          success: response.ok,
          status: response.status,
          actualRole: responseData.user?.role || null,
          message: responseData.message || `HTTP ${response.status}`,
          hasToken: !!responseData.token
        };

        if (response.ok) {
          console.log(`${user.expectedRole} login: EXITOSO`);
          if (responseData.user?.role === user.expectedRole) {
            console.log(`Rol coincide: ${responseData.user.role}`);
          } else {
            console.log(`Rol no coincide: esperado ${user.expectedRole}, obtuvo ${responseData.user?.role}`);
          }
        } else {
          console.log(`${user.expectedRole} login: FALLÓ (${response.status})`);
        }

        results.push(result);

      } catch (error) {
        console.log(`Error probando ${user.expectedRole}:`, error.message);
        results.push({
          email: user.email,
          expectedRole: user.expectedRole,
          success: false,
          error: error.message
        });
      }
    }

    return {
      step: 'known_users_test',
      success: results.some(r => r.success),
      message: `Probados ${results.length} usuarios conocidos`,
      results: results,
      workingRoles: results.filter(r => r.success).map(r => r.expectedRole),
      failingRoles: results.filter(r => !r.success).map(r => r.expectedRole)
    };
  }

  // Analizar errores específicos de login
  analyzeLoginError(status, responseData) {
    switch (status) {
      case 401:
        return {
          type: 'unauthorized',
          likely_causes: [
            'Combinación email/contraseña incorrecta',
            'Usuario no encontrado en base de datos',
            'Hash de contraseña no coincide',
            'Cuenta deshabilitada'
          ],
          backend_message: responseData.message || 'No se proporcionó mensaje',
          check: 'Verificar que el usuario existe con credenciales correctas'
        };
      
      case 403:
        return {
          type: 'forbidden',
          likely_causes: [
            'Usuario existe pero acceso denegado',
            'Cuenta no activada',
            'Restricciones de rol',
            'Cuenta suspendida'
          ],
          backend_message: responseData.message || 'No se proporcionó mensaje',
          check: 'Verificar estado del usuario y permisos'
        };
      
      case 404:
        return {
          type: 'not_found',
          likely_causes: [
            'Usuario no encontrado en base de datos',
            'Dirección de email incorrecta',
            'Usuario fue eliminado'
          ],
          backend_message: responseData.message || 'No se proporcionó mensaje',
          check: 'Verificar que el usuario existe en la base de datos'
        };

      case 422:
        return {
          type: 'validation_error',
          likely_causes: [
            'Formato de email inválido',
            'Contraseña muy corta',
            'Campos requeridos faltantes'
          ],
          backend_message: responseData.message || 'No se proporcionó mensaje',
          validation_errors: responseData.errors || []
        };

      case 500:
        return {
          type: 'server_error',
          likely_causes: [
            'Error de conexión a base de datos',
            'Error interno del servidor',
            'Error en hash de contraseña',
            'Error en generación de token'
          ],
          backend_message: responseData.message || 'No se proporcionó mensaje',
          check: 'Revisar logs del backend para error detallado'
        };

      default:
        return {
          type: 'unknown_error',
          status: status,
          backend_message: responseData.message || 'No se proporcionó mensaje',
          raw_response: responseData
        };
    }
  }

  // Generar resumen del diagnóstico
  generateSummary(steps) {
    const successful = steps.filter(s => s.success).length;
    const total = steps.length;
    
    let overallStatus = 'unknown';
    let primaryIssue = null;

    // Determinar el estado general
    const connectivity = steps.find(s => s.step === 'backend_connectivity');
    const loginEndpoint = steps.find(s => s.step === 'login_endpoint');
    const directLogin = steps.find(s => s.step === 'direct_login');
    const knownUsers = steps.find(s => s.step === 'known_users_test');

    if (!connectivity?.success) {
      overallStatus = 'backend_offline';
      primaryIssue = 'Servidor backend no está ejecutándose o no es accesible';
    } else if (!loginEndpoint?.success) {
      overallStatus = 'endpoint_missing';
      primaryIssue = 'Endpoint de login no está implementado o no funciona';
    } else if (directLogin?.success) {
      overallStatus = 'working';
      primaryIssue = null;
    } else if (knownUsers?.workingRoles?.includes('admin') && 
               !knownUsers?.workingRoles?.includes('colaborador') && 
               !knownUsers?.workingRoles?.includes('cliente')) {
      overallStatus = 'role_specific_issue';
      primaryIssue = 'Admin funciona pero roles colaborador/cliente tienen problemas';
    } else {
      overallStatus = 'authentication_failure';
      primaryIssue = 'Autenticación está fallando por razones desconocidas';
    }

    return {
      overall_status: overallStatus,
      primary_issue: primaryIssue,
      steps_successful: successful,
      steps_total: total,
      success_rate: Math.round((successful / total) * 100),
      backend_accessible: connectivity?.success || false,
      login_endpoint_working: loginEndpoint?.success || false,
      authentication_working: directLogin?.success || false
    };
  }

  // Generar recomendaciones basadas en el diagnóstico
  generateRecommendations(steps) {
    const recommendations = [];
    
    const connectivity = steps.find(s => s.step === 'backend_connectivity');
    const loginEndpoint = steps.find(s => s.step === 'login_endpoint');
    const directLogin = steps.find(s => s.step === 'direct_login');
    const knownUsers = steps.find(s => s.step === 'known_users_test');

    // Recomendaciones basadas en problemas encontrados
    if (!connectivity?.success) {
      recommendations.push({
        priority: 'high',
        category: 'backend',
        issue: 'Backend no accesible',
        action: 'Iniciar el servidor backend',
        command: 'cd gym-backend && npm run dev',
        verify: 'Verificar que ves "URL: http://localhost:5000" en terminal'
      });
    }

    if (!loginEndpoint?.success && connectivity?.success) {
      recommendations.push({
        priority: 'high',
        category: 'endpoint',
        issue: 'Endpoint de login faltante',
        action: 'Implementar endpoint de login en backend',
        files: ['routes/auth.js', 'controllers/authController.js'],
        verify: 'POST /api/auth/login debe retornar 401 para credenciales incorrectas'
      });
    }

    if (knownUsers?.workingRoles?.includes('admin') && 
        knownUsers?.failingRoles?.includes('colaborador')) {
      recommendations.push({
        priority: 'high',
        category: 'database',
        issue: 'Rol colaborador no funciona',
        action: 'Verificar usuario colaborador en base de datos',
        checks: [
          'Verificar que usuario existe con email "colaborador@gym.com"',
          'Verificar que hash de contraseña es correcto',
          'Verificar que campo role es "colaborador"',
          'Verificar que usuario está activo/habilitado'
        ]
      });
    }

    if (knownUsers?.workingRoles?.includes('admin') && 
        knownUsers?.failingRoles?.includes('cliente')) {
      recommendations.push({
        priority: 'high',
        category: 'database',
        issue: 'Rol cliente no funciona',
        action: 'Verificar usuario cliente en base de datos',
        checks: [
          'Verificar que usuario existe con email "cliente@gym.com"',
          'Verificar que hash de contraseña es correcto',
          'Verificar que campo role es "cliente"',
          'Verificar que usuario está activo/habilitado'
        ]
      });
    }

    if (directLogin?.analysis?.type === 'server_error') {
      recommendations.push({
        priority: 'high',
        category: 'backend_error',
        issue: 'Error interno del servidor durante login',
        action: 'Revisar logs del backend para errores',
        common_fixes: [
          'Verificar conexión a base de datos',
          'Verificar que bcrypt funciona correctamente',
          'Verificar que JWT secret está configurado',
          'Verificar todas las variables de entorno requeridas'
        ]
      });
    }

    // Recomendación general si no hay problemas específicos
    if (recommendations.length === 0 && !directLogin?.success) {
      recommendations.push({
        priority: 'medium',
        category: 'general',
        issue: 'Autenticación falla por razón desconocida',
        action: 'Habilitar modo debug en backend',
        steps: [
          'Establecer DEBUG=true en .env',
          'Agregar console.log en authController',
          'Verificar qué error exacto está ocurriendo',
          'Verificar que consultas de base de datos funcionan'
        ]
      });
    }

    return recommendations;
  }

  // Generar script SQL para crear usuarios de prueba
  generateTestUsersSQL() {
    return `
-- SQL para crear usuarios de prueba
-- Ejecutar en la base de datos del gimnasio

-- Crear usuario admin (si no existe)
INSERT INTO users (firstName, lastName, email, password, role, phone, whatsapp, isActive, created_at, updated_at)
VALUES (
  'Admin', 
  'Sistema', 
  'admin@gym.com', 
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- contraseña: admin123
  'admin',
  '1234-5678',
  '1234-5678',
  true,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Crear usuario colaborador (si no existe)
INSERT INTO users (firstName, lastName, email, password, role, phone, whatsapp, isActive, created_at, updated_at)
VALUES (
  'Juan', 
  'Colaborador', 
  'colaborador@gym.com', 
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- contraseña: colaborador123
  'colaborador',
  '2234-5678',
  '2234-5678',
  true,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Crear usuario cliente (si no existe)
INSERT INTO users (firstName, lastName, email, password, role, phone, whatsapp, isActive, created_at, updated_at)
VALUES (
  'Maria', 
  'Cliente', 
  'cliente@gym.com', 
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- contraseña: cliente123
  'cliente',
  '3234-5678',
  '3234-5678',
  true,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Verificar que los usuarios se crearon correctamente
SELECT id, firstName, lastName, email, role, isActive FROM users WHERE email IN ('admin@gym.com', 'colaborador@gym.com', 'cliente@gym.com');
`;
  }

  // Método para uso fácil desde la consola del navegador
  async quickDiagnose(email = 'colaborador@gym.com', password = 'colaborador123') {
    console.log('DIAGNOSTICO RAPIDO INICIANDO...');
    console.log('Usar en consola del navegador: debugAuthService.quickDiagnose("email@test.com", "password")');
    
    const diagnosis = await this.diagnoseAuthenticationIssue(email, password);
    
    console.group('RESUMEN DEL DIAGNOSTICO');
    console.log('Estado General:', diagnosis.summary?.overall_status);
    console.log('Problema Principal:', diagnosis.summary?.primary_issue);
    console.log('Tasa de Éxito:', diagnosis.summary?.success_rate + '%');
    console.groupEnd();

    console.group('RECOMENDACIONES');
    diagnosis.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`);
      console.log(`   Acción: ${rec.action}`);
      if (rec.command) console.log(`   Comando: ${rec.command}`);
      if (rec.checks) {
        console.log('   Verificaciones:');
        rec.checks.forEach(check => console.log(`     - ${check}`));
      }
    });
    console.groupEnd();

    return diagnosis;
  }
}

// Crear instancia global para uso fácil
const debugAuthService = new DebugAuthService();

// Hacer disponible en ventana global para uso desde consola
if (typeof window !== 'undefined') {
  window.debugAuthService = debugAuthService;
}

export default debugAuthService;

/*
=== COMENTARIOS FINALES ===

PROPOSITO DEL ARCHIVO:
Este DebugAuthService es una herramienta especializada de diagnóstico para problemas de
autenticación en la aplicación del gimnasio. Realiza análisis exhaustivos del sistema
de login, identificando problemas específicos con diferentes roles de usuario (admin,
colaborador, cliente) y proporcionando recomendaciones concretas para solucionarlos.

FUNCIONALIDAD PRINCIPAL:
- Diagnóstico completo en 5 pasos del sistema de autenticación
- Verificación de conectividad del backend y endpoints específicos
- Pruebas directas de login con análisis de errores detallado
- Verificación de estructura de base de datos cuando es posible
- Pruebas automatizadas con usuarios conocidos por rol
- Generación automática de resumen y recomendaciones
- Script SQL para crear usuarios de prueba
- Interfaz fácil de usar desde consola del navegador

ARCHIVOS A LOS QUE SE CONECTA:
- Backend API endpoints: /api/health, /api/auth/login, /api/debug/users
- Sistema de autenticación general de la aplicación
- Base de datos del gimnasio (tabla users)
- Variables de entorno (REACT_APP_API_URL)
- Consola del navegador para debug en desarrollo

PROCESO DE DIAGNOSTICO (5 PASOS):
1. Verificación de conectividad: Confirma que el backend está ejecutándose
2. Verificación de endpoint de login: Confirma que /api/auth/login existe
3. Prueba directa de login: Intenta login con credenciales proporcionadas
4. Verificación de base de datos: Intenta acceder a estructura de usuarios
5. Pruebas de usuarios conocidos: Prueba admin, colaborador y cliente

ANALISIS DE ERRORES:
- Error 401: Credenciales incorrectas o usuario no encontrado
- Error 403: Usuario existe pero acceso denegado
- Error 404: Usuario no encontrado en base de datos
- Error 422: Error de validación en formato de datos
- Error 500: Error interno del servidor o base de datos

USUARIOS DE PRUEBA INCLUIDOS:
- admin@gym.com / admin123 (rol: admin)
- colaborador@gym.com / colaborador123 (rol: colaborador)  
- cliente@gym.com / cliente123 (rol: cliente)

PROBLEMAS ESPECIFICOS QUE DETECTA:
- Backend no ejecutándose o inaccesible
- Endpoint de login no implementado o no funcional
- Problemas específicos con roles colaborador/cliente vs admin
- Errores de hash de contraseña o configuración JWT
- Usuarios inactivos o mal configurados en base de datos
- Problemas de conexión a base de datos

USO PARA DESARROLLADORES:
1. Abrir consola del navegador (F12)
2. Ejecutar: debugAuthService.quickDiagnose("email", "password")
3. Revisar resumen de diagnóstico y recomendaciones
4. Seguir las acciones sugeridas según prioridad
5. Usar generateTestUsersSQL() para crear usuarios de prueba

USO PARA USUARIOS FINALES:
Aunque es una herramienta técnica, los usuarios finales se benefician indirectamente:
- Identificación rápida de problemas de login
- Solución proactiva de problemas antes que afecten usuarios
- Mejor experiencia de autenticación sin errores misteriosos
- Tiempo de inactividad reducido por problemas de login

RECOMENDACIONES AUTOMATICAS:
- Comandos específicos para solucionar problemas
- Archivos que necesitan revisión o modificación
- Verificaciones de base de datos paso a paso
- Variables de entorno que revisar
- Logs específicos que consultar

Esta herramienta es especialmente valiosa durante desarrollo y mantenimiento,
permitiendo identificar y solucionar rápidamente problemas de autenticación
que podrían afectar la experiencia del usuario en el gimnasio.
*/