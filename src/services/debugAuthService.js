// src/services/debugAuthService.js
// FUNCIÓN: Servicio específico para debug de autenticación
// DIAGNÓSTICA: Problemas con roles colaborador/cliente vs admin

class DebugAuthService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    this.debugMode = process.env.NODE_ENV === 'development';
  }

  // 🔍 Test completo del backend de autenticación
  async diagnoseAuthenticationIssue(email, password) {
    const diagnosis = {
      timestamp: new Date().toISOString(),
      email,
      steps: [],
      summary: null,
      recommendations: []
    };

    try {
      console.group('🔬 COMPLETE AUTHENTICATION DIAGNOSIS');
      console.log('📧 Testing email:', email);
      console.log('🔑 Password length:', password.length);

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

      console.log('📊 DIAGNOSIS COMPLETE:', diagnosis);
      console.groupEnd();

      return diagnosis;

    } catch (error) {
      console.error('❌ Diagnosis failed:', error);
      diagnosis.steps.push({
        step: 'diagnosis_error',
        success: false,
        error: error.message,
        details: 'Failed to complete diagnosis'
      });
      
      console.groupEnd();
      return diagnosis;
    }
  }

  // PASO 1: Verificar conectividad básica del backend
  async step1_checkBackendConnectivity() {
    console.log('🔌 STEP 1: Checking backend connectivity...');
    
    try {
      const response = await fetch(`${this.baseURL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend is accessible');
        return {
          step: 'backend_connectivity',
          success: true,
          message: 'Backend is running and accessible',
          data: data,
          responseTime: response.headers.get('x-response-time') || 'N/A'
        };
      } else {
        console.log('⚠️ Backend responded but with error');
        return {
          step: 'backend_connectivity',
          success: false,
          message: `Backend responded with status ${response.status}`,
          status: response.status,
          statusText: response.statusText
        };
      }
    } catch (error) {
      console.log('❌ Cannot connect to backend');
      return {
        step: 'backend_connectivity',
        success: false,
        message: 'Cannot connect to backend',
        error: error.message,
        suggestion: 'Start the backend server: npm run dev'
      };
    }
  }

  // PASO 2: Verificar endpoint de login específico
  async step2_checkLoginEndpoint() {
    console.log('🔐 STEP 2: Checking login endpoint...');
    
    try {
      // Test con datos obviamente incorrectos para ver si el endpoint existe
      const response = await fetch(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'wrongpassword' })
      });

      console.log('📊 Login endpoint status:', response.status);

      if (response.status === 401) {
        console.log('✅ Login endpoint exists and working (401 expected)');
        return {
          step: 'login_endpoint',
          success: true,
          message: 'Login endpoint exists and responds correctly',
          status: response.status,
          note: 'Got 401 as expected for wrong credentials'
        };
      } else if (response.status === 404) {
        console.log('❌ Login endpoint not found');
        return {
          step: 'login_endpoint',
          success: false,
          message: 'Login endpoint not found',
          status: response.status,
          suggestion: 'Implement /api/auth/login in backend'
        };
      } else if (response.status === 422) {
        console.log('✅ Login endpoint exists but validation failed');
        return {
          step: 'login_endpoint',
          success: true,
          message: 'Login endpoint exists with validation',
          status: response.status,
          note: 'Got 422 - validation working'
        };
      } else {
        const responseText = await response.text();
        console.log('⚠️ Unexpected response from login endpoint');
        return {
          step: 'login_endpoint',
          success: false,
          message: `Unexpected response: ${response.status}`,
          status: response.status,
          response: responseText
        };
      }
    } catch (error) {
      console.log('❌ Error testing login endpoint');
      return {
        step: 'login_endpoint',
        success: false,
        message: 'Error testing login endpoint',
        error: error.message
      };
    }
  }

  // PASO 3: Test directo de login con credenciales reales
  async step3_testDirectLogin(email, password) {
    console.log('🧪 STEP 3: Testing direct login...');
    
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

      console.log('📦 Direct login response:', responseData);

      if (response.ok) {
        console.log('✅ Login successful');
        return {
          step: 'direct_login',
          success: true,
          message: 'Login successful',
          data: responseData,
          userRole: responseData.user?.role || 'unknown',
          hasToken: !!responseData.token
        };
      } else {
        console.log(`❌ Login failed with status ${response.status}`);
        
        // Análisis específico por código de error
        let analysis = this.analyzeLoginError(response.status, responseData);
        
        return {
          step: 'direct_login',
          success: false,
          message: `Login failed: ${response.status}`,
          status: response.status,
          data: responseData,
          analysis: analysis
        };
      }
    } catch (error) {
      console.log('❌ Network error during login');
      return {
        step: 'direct_login',
        success: false,
        message: 'Network error during login',
        error: error.message
      };
    }
  }

  // PASO 4: Verificar estructura de la base de datos (a través de endpoints de debug)
  async step4_checkDatabaseStructure() {
    console.log('🗄️ STEP 4: Checking database structure...');
    
    try {
      // Intentar obtener información de usuarios si hay un endpoint de debug
      const response = await fetch(`${this.baseURL}/api/debug/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Database structure accessible');
        return {
          step: 'database_structure',
          success: true,
          message: 'Database structure accessible',
          userCount: data.totalUsers || 0,
          roles: data.roles || [],
          sampleUsers: data.sampleUsers || []
        };
      } else if (response.status === 404) {
        console.log('⚠️ No debug endpoint available');
        return {
          step: 'database_structure',
          success: false,
          message: 'No debug endpoint available',
          status: response.status,
          note: 'Cannot verify database structure'
        };
      } else {
        console.log('❌ Error accessing database structure');
        return {
          step: 'database_structure',
          success: false,
          message: 'Error accessing database structure',
          status: response.status
        };
      }
    } catch (error) {
      console.log('❌ Cannot check database structure');
      return {
        step: 'database_structure',
        success: false,
        message: 'Cannot check database structure',
        error: error.message,
        note: 'This step is optional'
      };
    }
  }

  // PASO 5: Test con usuarios conocidos de cada rol
  async step5_testKnownUsers() {
    console.log('👥 STEP 5: Testing known users...');
    
    const knownUsers = [
      { email: 'admin@gym.com', password: 'admin123', expectedRole: 'admin' },
      { email: 'colaborador@gym.com', password: 'colaborador123', expectedRole: 'colaborador' },
      { email: 'cliente@gym.com', password: 'cliente123', expectedRole: 'cliente' }
    ];

    const results = [];

    for (const user of knownUsers) {
      try {
        console.log(`🧪 Testing ${user.expectedRole}:`, user.email);
        
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
          console.log(`✅ ${user.expectedRole} login: SUCCESS`);
          if (responseData.user?.role === user.expectedRole) {
            console.log(`✅ Role matches: ${responseData.user.role}`);
          } else {
            console.log(`⚠️ Role mismatch: expected ${user.expectedRole}, got ${responseData.user?.role}`);
          }
        } else {
          console.log(`❌ ${user.expectedRole} login: FAILED (${response.status})`);
        }

        results.push(result);

      } catch (error) {
        console.log(`❌ Error testing ${user.expectedRole}:`, error.message);
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
      message: `Tested ${results.length} known users`,
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
            'Wrong email/password combination',
            'User not found in database',
            'Password hash mismatch',
            'Account disabled'
          ],
          backend_message: responseData.message || 'No message provided',
          check: 'Verify user exists with correct credentials'
        };
      
      case 403:
        return {
          type: 'forbidden',
          likely_causes: [
            'User exists but access denied',
            'Account not activated',
            'Role restrictions',
            'Account suspended'
          ],
          backend_message: responseData.message || 'No message provided',
          check: 'Check user status and permissions'
        };
      
      case 404:
        return {
          type: 'not_found',
          likely_causes: [
            'User not found in database',
            'Incorrect email address',
            'User was deleted'
          ],
          backend_message: responseData.message || 'No message provided',
          check: 'Verify user exists in database'
        };

      case 422:
        return {
          type: 'validation_error',
          likely_causes: [
            'Invalid email format',
            'Password too short',
            'Missing required fields'
          ],
          backend_message: responseData.message || 'No message provided',
          validation_errors: responseData.errors || []
        };

      case 500:
        return {
          type: 'server_error',
          likely_causes: [
            'Database connection error',
            'Internal server error',
            'Password hashing error',
            'Token generation error'
          ],
          backend_message: responseData.message || 'No message provided',
          check: 'Check backend logs for detailed error'
        };

      default:
        return {
          type: 'unknown_error',
          status: status,
          backend_message: responseData.message || 'No message provided',
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
      primaryIssue = 'Backend server is not running or not accessible';
    } else if (!loginEndpoint?.success) {
      overallStatus = 'endpoint_missing';
      primaryIssue = 'Login endpoint is not implemented or not working';
    } else if (directLogin?.success) {
      overallStatus = 'working';
      primaryIssue = null;
    } else if (knownUsers?.workingRoles?.includes('admin') && 
               !knownUsers?.workingRoles?.includes('colaborador') && 
               !knownUsers?.workingRoles?.includes('cliente')) {
      overallStatus = 'role_specific_issue';
      primaryIssue = 'Admin works but colaborador/cliente roles have issues';
    } else {
      overallStatus = 'authentication_failure';
      primaryIssue = 'Authentication is failing for unknown reasons';
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
        issue: 'Backend not accessible',
        action: 'Start the backend server',
        command: 'cd gym-backend && npm run dev',
        verify: 'Check that you see "✅ URL: http://localhost:5000" in terminal'
      });
    }

    if (!loginEndpoint?.success && connectivity?.success) {
      recommendations.push({
        priority: 'high',
        category: 'endpoint',
        issue: 'Login endpoint missing',
        action: 'Implement login endpoint in backend',
        files: ['routes/auth.js', 'controllers/authController.js'],
        verify: 'POST /api/auth/login should return 401 for wrong credentials'
      });
    }

    if (knownUsers?.workingRoles?.includes('admin') && 
        knownUsers?.failingRoles?.includes('colaborador')) {
      recommendations.push({
        priority: 'high',
        category: 'database',
        issue: 'Colaborador role not working',
        action: 'Check colaborador user in database',
        checks: [
          'Verify user exists with email "colaborador@gym.com"',
          'Check password hash is correct',
          'Verify role field is "colaborador"',
          'Check user is active/enabled'
        ]
      });
    }

    if (knownUsers?.workingRoles?.includes('admin') && 
        knownUsers?.failingRoles?.includes('cliente')) {
      recommendations.push({
        priority: 'high',
        category: 'database',
        issue: 'Cliente role not working',
        action: 'Check cliente user in database',
        checks: [
          'Verify user exists with email "cliente@gym.com"',
          'Check password hash is correct',
          'Verify role field is "cliente"',
          'Check user is active/enabled'
        ]
      });
    }

    if (directLogin?.analysis?.type === 'server_error') {
      recommendations.push({
        priority: 'high',
        category: 'backend_error',
        issue: 'Internal server error during login',
        action: 'Check backend logs for errors',
        common_fixes: [
          'Check database connection',
          'Verify bcrypt is working correctly',
          'Check JWT secret is configured',
          'Verify all required environment variables'
        ]
      });
    }

    // Recomendación general si no hay problemas específicos
    if (recommendations.length === 0 && !directLogin?.success) {
      recommendations.push({
        priority: 'medium',
        category: 'general',
        issue: 'Authentication failing for unknown reason',
        action: 'Enable debug mode in backend',
        steps: [
          'Set DEBUG=true in .env',
          'Add console.log statements in authController',
          'Check what exact error is occurring',
          'Verify database queries are working'
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
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: admin123
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
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: colaborador123
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
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: cliente123
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
    console.log('🚀 QUICK DIAGNOSIS STARTING...');
    console.log('Use this in browser console: debugAuthService.quickDiagnose("email@test.com", "password")');
    
    const diagnosis = await this.diagnoseAuthenticationIssue(email, password);
    
    console.group('📋 DIAGNOSIS SUMMARY');
    console.log('Overall Status:', diagnosis.summary?.overall_status);
    console.log('Primary Issue:', diagnosis.summary?.primary_issue);
    console.log('Success Rate:', diagnosis.summary?.success_rate + '%');
    console.groupEnd();

    console.group('🔧 RECOMMENDATIONS');
    diagnosis.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`);
      console.log(`   Action: ${rec.action}`);
      if (rec.command) console.log(`   Command: ${rec.command}`);
      if (rec.checks) {
        console.log('   Checks:');
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