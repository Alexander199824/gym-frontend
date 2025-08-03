📚 Manual de API - Elite Fitness Club
Guía completa para desarrolladores Frontend

🔗 URL Base
http://localhost:5000/api

☁️ CLOUDINARY - ARCHIVOS
📋 PROCESO:

Frontend envía archivo al backend
Backend sube automáticamente a Cloudinary
Backend guarda URL en Base de Datos
Backend devuelve URL de Cloudinary al frontend
Frontend usa las URLs como considere mejor

📁 FORMATOS SOPORTADOS:

Imágenes: JPG, JPEG, PNG, WebP, SVG (logos)
Videos: MP4, WebM, MOV, AVI
Límites: 3MB (logos), 5-10MB (imágenes), 100MB (videos)


🔐 AUTENTICACIÓN
Login
httpPOST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@gym.com",
  "password": "admin123"
}
Respuesta:
json{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@gym.com",
      "role": "admin",
      "firstName": "Admin",
      "lastName": "Elite",
      "profileImage": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/profile-images/admin-1.jpg"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  }
}
Registro
httpPOST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "usuario@gym.com",
  "password": "password123",
  "phone": "+502 5555-5555",
  "role": "cliente"
}
Obtener Perfil
httpGET http://localhost:5000/api/auth/profile
Authorization: Bearer {token}
Respuesta:
json{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "juan@gym.com",
      "phone": "+502 5555-5555",
      "role": "cliente",
      "profileImage": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/profile-images/user-1.jpg",
      "dateOfBirth": "1990-05-15",
      "isActive": true
    }
  }
}
Actualizar Perfil
httpPATCH http://localhost:5000/api/auth/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Juan Carlos",
  "lastName": "Pérez García",
  "phone": "+502 5555-5556",
  "dateOfBirth": "1990-05-15",
  "emergencyContact": {
    "name": "María Pérez",
    "phone": "+502 5555-5557"
  }
}
Subir Imagen de Perfil
httpPOST http://localhost:5000/api/auth/profile/image
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData: {
  image: [archivo_imagen]
}
Respuesta:
json{
  "success": true,
  "message": "Imagen de perfil actualizada exitosamente",
  "data": {
    "profileImage": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/profile-images/user-1.jpg",
    "publicId": "gym/profile-images/user-1",
    "user": {
      "id": 1,
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "juan@gym.com",
      "profileImage": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/profile-images/user-1.jpg"
    }
  }
}
Verificar Token
httpGET http://localhost:5000/api/auth/verify
Authorization: Bearer {token}
Refresh Token
httpPOST http://localhost:5000/api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}

👥 GESTIÓN DE USUARIOS
Listar Usuarios (Staff/Admin)
httpGET http://localhost:5000/api/users?page=1&limit=20&role=cliente&search=juan&isActive=true
Authorization: Bearer {token}
Respuesta:
json{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "firstName": "Juan",
        "lastName": "Pérez",
        "email": "juan@gym.com",
        "phone": "+502 5555-5555",
        "role": "cliente",
        "profileImage": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/profile-images/user-1.jpg",
        "isActive": true,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "memberships": []
      }
    ],
    "pagination": {
      "total": 145,
      "page": 1,
      "pages": 8,
      "limit": 20
    }
  }
}
Crear Usuario (Staff/Admin)
httpPOST http://localhost:5000/api/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "María",
  "lastName": "González",
  "email": "maria@example.com",
  "password": "password123",
  "phone": "+502 5555-5558",
  "role": "cliente",
  "dateOfBirth": "1985-03-20"
}
Obtener Usuario por ID
httpGET http://localhost:5000/api/users/{id}
Authorization: Bearer {token}
Actualizar Usuario
httpPATCH http://localhost:5000/api/users/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "María José",
  "role": "colaborador",
  "isActive": true
}
Buscar Usuarios
httpGET http://localhost:5000/api/users/search?q=maria&role=cliente
Authorization: Bearer {token}
Estadísticas de Usuarios (Admin)
httpGET http://localhost:5000/api/users/stats
Authorization: Bearer {token}
Clientes Frecuentes
httpGET http://localhost:5000/api/users/frequent-daily-clients?days=30&minVisits=10
Authorization: Bearer {token}

💳 MEMBRESÍAS
Listar Membresías
httpGET http://localhost:5000/api/memberships?status=active&page=1&limit=20&search=juan
Authorization: Bearer {token}
Crear Membresía
httpPOST http://localhost:5000/api/memberships
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": 1,
  "type": "monthly",
  "price": 250.00,
  "startDate": "2025-01-01",
  "endDate": "2025-02-01",
  "preferredSchedule": {
    "monday": "06:00-08:00",
    "wednesday": "18:00-20:00",
    "friday": "06:00-08:00"
  },
  "notes": "Cliente prefiere horarios matutinos",
  "autoRenew": false
}
Obtener Membresía por ID
httpGET http://localhost:5000/api/memberships/{id}
Authorization: Bearer {token}
Actualizar Membresía
httpPATCH http://localhost:5000/api/memberships/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "quarterly",
  "price": 600.00,
  "endDate": "2025-04-01",
  "status": "active",
  "notes": "Actualizado a plan trimestral"
}
Renovar Membresía
httpPOST http://localhost:5000/api/memberships/{id}/renew
Authorization: Bearer {token}
Content-Type: application/json

{
  "months": 3,
  "price": 200.00
}
Cancelar Membresía
httpPOST http://localhost:5000/api/memberships/{id}/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Cliente se muda de ciudad"
}
Membresías Vencidas
httpGET http://localhost:5000/api/memberships/expired?days=0
Authorization: Bearer {token}
Membresías Próximas a Vencer
httpGET http://localhost:5000/api/memberships/expiring-soon?days=7
Authorization: Bearer {token}
Planes de Membresía (Público)
httpGET http://localhost:5000/api/memberships/plans
Estadísticas de Membresías
httpGET http://localhost:5000/api/memberships/stats
Authorization: Bearer {token}

💰 PAGOS
Listar Pagos
httpGET http://localhost:5000/api/payments?paymentType=membership&status=completed&page=1&limit=20&startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer {token}
Crear Pago
httpPOST http://localhost:5000/api/payments
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": 1,
  "membershipId": 5,
  "amount": 250.00,
  "paymentMethod": "cash",
  "paymentType": "membership",
  "description": "Pago de membresía mensual",
  "notes": "Pago en efectivo recibido en recepción",
  "paymentDate": "2025-01-15T10:30:00.000Z"
}
Pago Diario
httpPOST http://localhost:5000/api/payments
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": 1,
  "amount": 25.00,
  "paymentMethod": "cash",
  "paymentType": "daily",
  "description": "Pago diario",
  "dailyPaymentCount": 1
}
Pago Múltiple (Bulk Daily)
httpPOST http://localhost:5000/api/payments
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": 1,
  "amount": 125.00,
  "paymentMethod": "cash",
  "paymentType": "bulk_daily",
  "description": "Pago por 5 días",
  "dailyPaymentCount": 5
}
Pago Anónimo (Sin usuario registrado)
httpPOST http://localhost:5000/api/payments
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 25.00,
  "paymentMethod": "cash",
  "paymentType": "daily",
  "description": "Pago diario - cliente no registrado",
  "anonymousClientInfo": {
    "name": "Carlos González",
    "phone": "+502 5555-5559"
  }
}
Obtener Pago por ID
httpGET http://localhost:5000/api/payments/{id}
Authorization: Bearer {token}
Subir Comprobante de Transferencia
httpPOST http://localhost:5000/api/payments/{id}/transfer-proof
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData: {
  proof: [archivo_imagen]
}
Respuesta:
json{
  "success": true,
  "message": "Comprobante subido exitosamente. Pendiente de validación.",
  "data": {
    "transferProof": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/transfer-proofs/proof-123.jpg"
  }
}
Validar Transferencia (Admin)
httpPOST http://localhost:5000/api/payments/{id}/validate-transfer
Authorization: Bearer {token}
Content-Type: application/json

{
  "approved": true,
  "notes": "Transferencia validada correctamente"
}
Transferencias Pendientes
httpGET http://localhost:5000/api/payments/transfers/pending
Authorization: Bearer {token}
Reportes de Pagos Mejorados (Admin)
httpGET http://localhost:5000/api/payments/reports/enhanced?period=month&startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer {token}
Respuesta:
json{
  "success": true,
  "data": {
    "totalIncome": 25750.50,
    "incomeBySource": [
      {
        "source": "Membresías",
        "total": 15000.00,
        "count": 60,
        "percentage": "58.3"
      },
      {
        "source": "Productos",
        "total": 8500.50,
        "count": 45,
        "percentage": "33.0"
      },
      {
        "source": "Pagos Diarios",
        "total": 2250.00,
        "count": 90,
        "percentage": "8.7"
      }
    ],
    "paymentMethodStats": [
      {
        "method": "cash",
        "total": 18000.00,
        "count": 120
      },
      {
        "method": "card",
        "total": 5500.50,
        "count": 35
      },
      {
        "method": "transfer",
        "total": 2250.00,
        "count": 40
      }
    ],
    "dailyTrend": [
      {
        "date": "2025-01-01",
        "memberships": 500,
        "daily": 150,
        "products": 200,
        "other": 0,
        "total": 850
      }
    ],
    "topProducts": [
      {
        "id": 1,
        "name": "Proteína Whey Premium",
        "totalSold": 25,
        "totalRevenue": 8750.00
      }
    ]
  }
}
Crear Pago desde Orden de Tienda
httpPOST http://localhost:5000/api/payments/from-order
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": 1
}

🛍️ TIENDA
Productos (Público)
httpGET http://localhost:5000/api/store/products?category=1&brand=2&search=proteina&minPrice=100&maxPrice=500&featured=true&page=1&limit=20&sortBy=price&sortOrder=ASC
Respuesta:
json{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Proteína Whey Premium",
        "description": "Proteína de suero de alta calidad",
        "price": 350.00,
        "originalPrice": 400.00,
        "sku": "PROT-WHY-001",
        "stockQuantity": 25,
        "minStock": 5,
        "isFeatured": true,
        "isActive": true,
        "category": {
          "id": 1,
          "name": "Suplementos",
          "slug": "suplementos"
        },
        "brand": {
          "id": 1,
          "name": "Elite Nutrition"
        },
        "images": [
          {
            "id": 1,
            "imageUrl": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/products/producto-1-principal.jpg",
            "altText": "Proteína Whey Premium",
            "isPrimary": true,
            "displayOrder": 1
          }
        ],
        "discountPercentage": 12.5,
        "inStock": true,
        "lowStock": false
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "pages": 3,
      "limit": 20
    }
  }
}
Productos Destacados
httpGET http://localhost:5000/api/store/featured-products?limit=8
Producto por ID
httpGET http://localhost:5000/api/store/products/{id}
Categorías
httpGET http://localhost:5000/api/store/categories
Respuesta:
json{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "Suplementos",
        "slug": "suplementos",
        "description": "Suplementos nutricionales",
        "imageUrl": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/categories/suplementos.jpg",
        "isActive": true,
        "displayOrder": 1,
        "productsCount": 25
      }
    ]
  }
}
Marcas
httpGET http://localhost:5000/api/store/brands
CARRITO
Ver Carrito
httpGET http://localhost:5000/api/store/cart?sessionId=guest_12345
Authorization: Bearer {token} (opcional)
Respuesta:
json{
  "success": true,
  "data": {
    "cartItems": [
      {
        "id": 1,
        "productId": 1,
        "quantity": 2,
        "unitPrice": 350.00,
        "selectedVariants": {
          "flavor": "chocolate",
          "size": "2kg"
        },
        "product": {
          "id": 1,
          "name": "Proteína Whey Premium",
          "images": [
            {
              "imageUrl": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/products/producto-1-principal.jpg",
              "altText": "Proteína Whey Premium",
              "isPrimary": true
            }
          ]
        }
      }
    ],
    "summary": {
      "itemsCount": 1,
      "subtotal": 700.00,
      "taxAmount": 84.00,
      "shippingAmount": 0.00,
      "totalAmount": 784.00
    }
  }
}
Agregar al Carrito
httpPOST http://localhost:5000/api/store/cart
Authorization: Bearer {token} (opcional)
Content-Type: application/json

{
  "productId": 1,
  "quantity": 2,
  "selectedVariants": {
    "flavor": "chocolate",
    "size": "2kg"
  },
  "sessionId": "guest_12345"
}
Actualizar Carrito
httpPUT http://localhost:5000/api/store/cart/{cartItemId}?sessionId=guest_12345
Authorization: Bearer {token} (opcional)
Content-Type: application/json

{
  "quantity": 3
}
Eliminar del Carrito
httpDELETE http://localhost:5000/api/store/cart/{cartItemId}?sessionId=guest_12345
Authorization: Bearer {token} (opcional)
ÓRDENES
Crear Orden (Checkout)
httpPOST http://localhost:5000/api/store/orders
Authorization: Bearer {token} (opcional)
Content-Type: application/json

{
  "sessionId": "guest_12345",
  "customerInfo": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+502 5555-5555"
  },
  "shippingAddress": {
    "street": "5ta Avenida 12-34",
    "city": "Guatemala",
    "state": "Guatemala",
    "zipCode": "01001",
    "reference": "Casa blanca con portón negro"
  },
  "paymentMethod": "cash_on_delivery",
  "deliveryTimeSlot": "morning",
  "notes": "Entregar en horario de oficina"
}
Respuesta:
json{
  "success": true,
  "message": "Orden creada exitosamente",
  "data": {
    "order": {
      "id": 1,
      "orderNumber": "ORD-2025-001",
      "userId": null,
      "subtotal": 700.00,
      "taxAmount": 84.00,
      "shippingAmount": 0.00,
      "totalAmount": 784.00,
      "paymentMethod": "cash_on_delivery",
      "paymentStatus": "pending",
      "status": "pending",
      "customerInfo": {
        "name": "Juan Pérez",
        "email": "juan@example.com",
        "phone": "+502 5555-5555"
      },
      "shippingAddress": {
        "street": "5ta Avenida 12-34",
        "city": "Guatemala",
        "state": "Guatemala",
        "zipCode": "01001"
      },
      "items": [
        {
          "id": 1,
          "productId": 1,
          "productName": "Proteína Whey Premium",
          "quantity": 2,
          "unitPrice": 350.00,
          "totalPrice": 700.00
        }
      ],
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  }
}
Mis Órdenes (Usuario logueado)
httpGET http://localhost:5000/api/store/my-orders?page=1&limit=10
Authorization: Bearer {token}
Ver Orden por ID
httpGET http://localhost:5000/api/store/orders/{id}
Authorization: Bearer {token} (opcional)
ADMINISTRACIÓN DE TIENDA (Staff)
Todas las Órdenes
httpGET http://localhost:5000/api/store/admin/orders?status=pending&page=1&limit=20
Authorization: Bearer {token}
Actualizar Estado de Orden
httpPUT http://localhost:5000/api/store/admin/orders/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "delivered",
  "notes": "Entregado exitosamente al cliente",
  "trackingNumber": "TRACK123"
}
Estados disponibles: pending, confirmed, preparing, shipped, delivered, cancelled
Dashboard de Tienda
httpGET http://localhost:5000/api/store/admin/dashboard
Authorization: Bearer {token}
Respuesta:
json{
  "success": true,
  "data": {
    "ordersToday": 5,
    "revenueToday": 1250.50,
    "pendingOrders": 12,
    "lowStockProducts": 3,
    "recentOrders": [
      {
        "id": 1,
        "orderNumber": "ORD-2025-001",
        "totalAmount": 784.00,
        "status": "pending",
        "user": {
          "firstName": "Juan",
          "lastName": "Pérez"
        },
        "createdAt": "2025-01-15T10:30:00.000Z"
      }
    ]
  }
}
Reporte de Ventas
httpGET http://localhost:5000/api/store/admin/sales-report?startDate=2025-01-01&endDate=2025-01-31&groupBy=day
Authorization: Bearer {token}

🏢 CONFIGURACIÓN DEL GYM
Información General (Público)
httpGET http://localhost:5000/api/gym/config
Respuesta:
json{
  "success": true,
  "data": {
    "name": "Elite Fitness Club",
    "description": "El mejor gimnasio de Guatemala",
    "tagline": "Transforma tu cuerpo, eleva tu mente",
    "logo": {
      "url": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/logos/logo-principal.jpg",
      "alt": "Elite Fitness Club Logo",
      "width": 200,
      "height": 80
    },
    "contact": {
      "address": "5ta Avenida 12-34, Zona 10, Guatemala",
      "phone": "+502 2345-6789",
      "email": "info@elitefitness.com",
      "whatsapp": "+502 5555-5555"
    },
    "hours": {
      "full": "Lun-Vie 5:00-22:00, Sáb-Dom 6:00-20:00",
      "weekdays": "5:00-22:00",
      "weekends": "6:00-20:00"
    },
    "social": {
      "instagram": {
        "url": "https://instagram.com/elitefitness",
        "handle": "@elitefitness",
        "active": true
      },
      "facebook": {
        "url": "https://facebook.com/elitefitness",
        "handle": "Elite Fitness Club",
        "active": true
      },
      "whatsapp": {
        "url": "https://wa.me/50255555555",
        "handle": "WhatsApp",
        "active": true
      }
    },
    "hero": {
      "title": "Bienvenido a Elite Fitness Club",
      "description": "Transforma tu cuerpo, eleva tu mente",
      "ctaText": "Comienza Hoy",
      "ctaButtons": [
        {
          "text": "Primera Semana GRATIS",
          "type": "primary",
          "action": "register",
          "icon": "gift"
        },
        {
          "text": "Ver Tienda",
          "type": "secondary",
          "action": "store",
          "icon": "shopping-cart"
        }
      ],
      "videoUrl": "https://res.cloudinary.com/tu-cloud/video/upload/v123/gym/hero-videos/video-hero.mp4",
      "imageUrl": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/hero-images/hero-bg.jpg",
      "hasVideo": true,
      "hasImage": true,
      "videoConfig": {
        "autoplay": false,
        "muted": true,
        "loop": true,
        "controls": true,
        "posterUrl": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/hero-images/hero-bg.jpg"
      }
    },
    "multimedia": {
      "hasLogo": true,
      "hasVideo": true,
      "hasHeroImage": true,
      "hasAnyMedia": true,
      "imageType": "custom"
    }
  }
}
Servicios (Público)
httpGET http://localhost:5000/api/gym/services
Respuesta:
json{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Entrenamiento Personalizado",
      "description": "Sesiones individuales con entrenadores certificados",
      "icon": "User",
      "imageUrl": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/services/entrenamiento-personalizado.jpg",
      "features": [
        "Plan personalizado según tus objetivos",
        "Seguimiento constante del progreso",
        "Ajustes nutricionales incluidos"
      ],
      "active": true,
      "order": 1
    }
  ]
}
Testimonios (Público)
httpGET http://localhost:5000/api/gym/testimonials
Respuesta:
json{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "María González",
      "role": "Empresaria",
      "text": "Elite Fitness cambió mi vida completamente. Los entrenadores son excepcionales.",
      "rating": 5,
      "image": {
        "url": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/testimonials/maria-gonzalez.jpg",
        "alt": "María González",
        "cloudinaryPublicId": "gym/testimonials/maria-gonzalez"
      },
      "verified": true,
      "date": "2025-01-10",
      "active": true
    }
  ],
  "total": 15
}
Estadísticas (Público)
httpGET http://localhost:5000/api/gym/stats
Respuesta:
json{
  "success": true,
  "data": {
    "members": 500,
    "trainers": 15,
    "experience": 10,
    "satisfaction": 98,
    "facilities": 50,
    "customStats": [
      {
        "label": "Equipos Modernos",
        "value": 200,
        "icon": "Trophy"
      }
    ]
  }
}
Información de Contacto
httpGET http://localhost:5000/api/gym/contact
Horarios
httpGET http://localhost:5000/api/gym/hours
Planes de Membresía (Público)
httpGET http://localhost:5000/api/gym/membership-plans
Respuesta:
json{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Plan Básico",
      "price": 150,
      "originalPrice": null,
      "currency": "GTQ",
      "duration": "mes",
      "popular": false,
      "iconName": "User",
      "color": "#3b82f6",
      "features": [
        "Acceso al gimnasio",
        "Uso de equipos básicos",
        "Duchas y lockers"
      ],
      "benefits": [
        {"text": "Acceso al gimnasio", "included": true},
        {"text": "Uso de equipos básicos", "included": true},
        {"text": "Clases grupales", "included": false}
      ],
      "active": true,
      "order": 1,
      "discountPercentage": 0
    },
    {
      "id": 2,
      "name": "Plan Premium",
      "price": 250,
      "originalPrice": 300,
      "currency": "GTQ",
      "duration": "mes",
      "popular": true,
      "iconName": "Star",
      "color": "#3b82f6",
      "features": [
        "Todo lo del plan básico",
        "Clases grupales ilimitadas",
        "1 sesión de entrenamiento personal"
      ],
      "benefits": [
        {"text": "Todo lo del plan básico", "included": true},
        {"text": "Clases grupales", "included": true},
        {"text": "Entrenamiento personal", "included": true}
      ],
      "active": true,
      "order": 2,
      "discountPercentage": 17
    }
  ]
}
Información Completa
httpGET http://localhost:5000/api/gym/info

🎨 MULTIMEDIA - SUBIR ARCHIVOS
1. Subir Logo del Gym (Admin)
httpPOST http://localhost:5000/api/gym-media/upload-logo
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData: {
  logo: [archivo_imagen]
}
Respuesta:
json{
  "success": true,
  "message": "Logo subido y guardado exitosamente",
  "data": {
    "logoUrl": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/logos/logo-principal.jpg",
    "publicId": "gym/logos/logo-principal",
    "config": {
      "gymName": "Elite Fitness Club",
      "logoUrl": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/logos/logo-principal.jpg"
    }
  }
}
2. Subir Video Hero (Admin)
httpPOST http://localhost:5000/api/gym-media/upload-hero-video
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData: {
  video: [archivo_video]
}
Respuesta:
json{
  "success": true,
  "message": "Video hero subido y guardado exitosamente",
  "data": {
    "videoUrl": "https://res.cloudinary.com/tu-cloud/video/upload/v123/gym/hero-videos/video-hero.mp4",
    "posterUrl": "https://res.cloudinary.com/tu-cloud/video/upload/so_0/v123/gym/hero-videos/video-hero.jpg",
    "publicId": "gym/hero-videos/video-hero",
    "videoInfo": {
      "hasVideo": true,
      "hasCustomImage": false,
      "usingPosterAsImage": true,
      "currentImageUrl": "https://res.cloudinary.com/tu-cloud/video/upload/so_0/v123/gym/hero-videos/video-hero.jpg",
      "imageType": "poster"
    },
    "videoSettings": {
      "autoplay": false,
      "muted": true,
      "loop": true,
      "controls": true
    },
    "frontendData": {
      "videoUrl": "https://res.cloudinary.com/tu-cloud/video/upload/v123/gym/hero-videos/video-hero.mp4",
      "imageUrl": "https://res.cloudinary.com/tu-cloud/video/upload/so_0/v123/gym/hero-videos/video-hero.jpg",
      "hasVideo": true,
      "hasImage": true,
      "imageType": "poster"
    }
  }
}
3. Subir Imagen Hero (Admin)
httpPOST http://localhost:5000/api/gym-media/upload-hero-image
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData: {
  image: [archivo_imagen]
}
Respuesta:
json{
  "success": true,
  "message": "Imagen hero subida y guardada exitosamente",
  "data": {
    "imageUrl": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/hero-images/hero-bg.jpg",
    "publicId": "gym/hero-images/hero-bg",
    "imageInfo": {
      "hasImage": true,
      "hasVideo": true,
      "isCustomImage": true,
      "replacedPoster": true,
      "imageType": "custom"
    },
    "frontendData": {
      "videoUrl": "https://res.cloudinary.com/tu-cloud/video/upload/v123/gym/hero-videos/video-hero.mp4",
      "imageUrl": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/hero-images/hero-bg.jpg",
      "hasVideo": true,
      "hasImage": true,
      "imageType": "custom"
    }
  }
}
4. Subir Imagen de Servicio (Admin)
httpPOST http://localhost:5000/api/gym-media/upload-service-image/{serviceId}
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData: {
  image: [archivo_imagen]
}
Respuesta:
json{
  "success": true,
  "message": "Imagen de servicio subida y guardada exitosamente",
  "data": {
    "serviceId": 1,
    "serviceName": "Entrenamiento Personalizado",
    "imageUrl": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/services/entrenamiento-personalizado.jpg",
    "publicId": "gym/services/entrenamiento-personalizado"
  }
}
5. Subir Imagen de Testimonio (Admin)
httpPOST http://localhost:5000/api/gym-media/upload-testimonial-image/{testimonialId}
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData: {
  image: [archivo_imagen]
}
6. Subir Imagen de Producto (Staff)
httpPOST http://localhost:5000/api/gym-media/upload-product-image/{productId}
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData: {
  image: [archivo_imagen],
  isPrimary: true
}
Respuesta:
json{
  "success": true,
  "message": "Imagen de producto subida y guardada exitosamente",
  "data": {
    "productId": 1,
    "productName": "Proteína Whey Premium",
    "imageId": 5,
    "imageUrl": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/products/proteina-whey-premium.jpg",
    "publicId": "gym/products/proteina-whey-premium",
    "isPrimary": true,
    "displayOrder": 1
  }
}
7. Subir Imagen de Perfil de Usuario (Staff)
httpPOST http://localhost:5000/api/gym-media/upload-user-profile/{userId}
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData: {
  image: [archivo_imagen]
}
8. Información de Archivos Multimedia (Staff)
httpGET http://localhost:5000/api/gym-media/media-info
Authorization: Bearer {token}
Respuesta:
json{
  "success": true,
  "data": {
    "logo": {
      "exists": true,
      "url": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/logos/logo-principal.jpg",
      "publicId": "gym/logos/logo-principal"
    },
    "heroVideo": {
      "exists": true,
      "url": "https://res.cloudinary.com/tu-cloud/video/upload/v123/gym/hero-videos/video-hero.mp4",
      "publicId": "gym/hero-videos/video-hero",
      "settings": {
        "autoplay": false,
        "muted": true,
        "loop": true,
        "controls": true
      }
    },
    "heroImage": {
      "exists": true,
      "url": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/hero-images/hero-bg.jpg",
      "publicId": "gym/hero-images/hero-bg"
    },
    "services": [
      {
        "id": 1,
        "title": "Entrenamiento Personalizado",
        "hasImage": true,
        "imageUrl": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/services/entrenamiento-personalizado.jpg",
        "publicId": "gym/services/entrenamiento-personalizado"
      }
    ],
    "testimonials": [
      {
        "id": 1,
        "name": "María González",
        "hasImage": true,
        "imageUrl": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/testimonials/maria-gonzalez.jpg",
        "publicId": "gym/testimonials/maria-gonzalez"
      }
    ],
    "summary": {
      "totalFiles": 15,
      "hasLogo": true,
      "hasHeroVideo": true,
      "hasHeroImage": true,
      "servicesWithImages": 5,
      "testimonialsWithImages": 8
    }
  }
}
9. Eliminar Archivo (Admin)
httpDELETE http://localhost:5000/api/gym-media/delete/{type}/{id}/{imageId}
Authorization: Bearer {token}
Tipos disponibles:

logo - Elimina logo del gym
hero-video - Elimina video hero
hero-image - Elimina imagen hero
service - Elimina imagen de servicio (requiere {id} = serviceId)
testimonial - Elimina imagen de testimonio (requiere {id} = testimonialId)
product - Elimina imagen de producto (requiere {imageId})
user-profile - Elimina imagen de perfil (requiere {id} = userId)

Ejemplos:
httpDELETE http://localhost:5000/api/gym-media/delete/logo
DELETE http://localhost:5000/api/gym-media/delete/service/1
DELETE http://localhost:5000/api/gym-media/delete/product/0/5
10. Configuración de Video Hero (Admin)
httpPATCH http://localhost:5000/api/gym-media/hero-video-settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "autoplay": false,
  "muted": true,
  "loop": true,
  "controls": true
}
11. Estado del Servicio (Público)
httpGET http://localhost:5000/api/gym-media/status
Respuesta:
json{
  "success": true,
  "data": {
    "cloudinaryConfigured": true,
    "availableUploads": [
      "logo",
      "heroVideo", 
      "heroImage",
      "serviceImage",
      "testimonialImage", 
      "productImage",
      "profileImage"
    ],
    "maxFileSizes": {
      "logo": "3MB",
      "heroVideo": "100MB",
      "heroImage": "10MB",
      "serviceImage": "5MB",
      "testimonialImage": "3MB",
      "productImage": "5MB",
      "profileImage": "5MB"
    },
    "supportedFormats": {
      "images": ["JPG", "JPEG", "PNG", "WebP"],
      "videos": ["MP4", "WebM", "MOV", "AVI"],
      "logos": ["JPG", "JPEG", "PNG", "WebP", "SVG"]
    }
  }
}

📊 DASHBOARD Y REPORTES
Dashboard Unificado (Staff)
httpGET http://localhost:5000/api/dashboard/unified
Authorization: Bearer {token}
Respuesta:
json{
  "success": true,
  "data": {
    "today": {
      "totalIncome": 1250.50,
      "breakdown": {
        "memberships": 750.00,
        "daily": 200.50,
        "products": 300.00
      }
    },
    "stats": {
      "totalUsers": 145,
      "activeMemberships": 89,
      "ordersToday": 5,
      "productsLowStock": 3
    },
    "monthlyFinancial": {
      "totalIncome": 35450.75,
      "totalExpenses": 8200.00,
      "netProfit": 27250.75
    },
    "weeklyTrend": [
      {
        "date": "2025-01-01",
        "memberships": 500,
        "daily": 150,
        "products": 200,
        "other": 0,
        "total": 850
      }
    ]
  }
}
Métricas de Rendimiento (Staff)
httpGET http://localhost:5000/api/dashboard/metrics?period=month
Authorization: Bearer {token}

💼 FINANZAS
Dashboard Financiero (Staff)
httpGET http://localhost:5000/api/financial/dashboard
Authorization: Bearer {token}
Crear Movimiento Financiero (Staff)
httpPOST http://localhost:5000/api/financial/movements
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "expense",
  "category": "equipment",
  "description": "Compra de mancuernas nuevas",
  "amount": 2500.00,
  "paymentMethod": "cash",
  "movementDate": "2025-01-15",
  "notes": "Equipo para área de pesas libre",
  "receiptUrl": "https://res.cloudinary.com/tu-cloud/image/upload/v123/gym/receipts/factura-001.jpg"
}
Listar Movimientos Financieros (Staff)
httpGET http://localhost:5000/api/financial/movements?type=income&category=membership_sale&startDate=2025-01-01&endDate=2025-01-31&page=1&limit=20
Authorization: Bearer {token}
Reporte Financiero Completo (Admin)
httpGET http://localhost:5000/api/financial/reports?period=month&startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer {token}
Reporte Ingresos vs Egresos (Admin)
httpGET http://localhost:5000/api/financial/reports/income-vs-expenses?groupBy=week
Authorization: Bearer {token}

📅 HORARIOS DE USUARIOS
Mis Horarios
httpGET http://localhost:5000/api/schedule/my-schedule
Authorization: Bearer {token}
Actualizar Mis Horarios
httpPUT http://localhost:5000/api/schedule/my-schedule
Authorization: Bearer {token}
Content-Type: application/json

{
  "schedules": [
    {
      "dayOfWeek": "monday",
      "preferredStartTime": "06:00",
      "preferredEndTime": "08:00",
      "workoutType": "cardio",
      "priority": 5,
      "notes": "Cardio matutino"
    },
    {
      "dayOfWeek": "wednesday",
      "preferredStartTime": "18:00",
      "preferredEndTime": "20:00",
      "workoutType": "weights",
      "priority": 4,
      "notes": "Entrenamiento de fuerza"
    }
  ]
}
Agregar Horario Individual
httpPOST http://localhost:5000/api/schedule/my-schedule
Authorization: Bearer {token}
Content-Type: application/json

{
  "dayOfWeek": "friday",
  "preferredStartTime": "19:00",
  "preferredEndTime": "21:00",
  "workoutType": "mixed",
  "priority": 3,
  "notes": "Entrenamiento mixto"
}
Eliminar Horario
httpDELETE http://localhost:5000/api/schedule/my-schedule/{scheduleId}
Authorization: Bearer {token}
Horarios Populares (Staff)
httpGET http://localhost:5000/api/schedule/popular-times
Authorization: Bearer {token}
Disponibilidad del Gym
httpGET http://localhost:5000/api/schedule/availability?dayOfWeek=monday&date=2025-01-20
Authorization: Bearer {token}
Crear Horarios por Defecto
httpPOST http://localhost:5000/api/schedule/create-default
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": 1
}

💳 PAGOS CON STRIPE
Configuración Pública
httpGET http://localhost:5000/api/stripe/config
Respuesta:
json{
  "success": true,
  "data": {
    "stripe": {
      "enabled": true,
      "mode": "test",
      "currency": "gtq",
      "publishableKey": "pk_test_...",
      "country": "GT"
    },
    "message": "Stripe habilitado"
  }
}
Crear Payment Intent para Membresía
httpPOST http://localhost:5000/api/stripe/create-membership-intent
Authorization: Bearer {token}
Content-Type: application/json

{
  "membershipId": 1,
  "membershipType": "monthly",
  "price": 250.00
}
Respuesta:
json{
  "success": true,
  "message": "Intención de pago creada exitosamente",
  "data": {
    "clientSecret": "pi_1234567890_secret_abcdef",
    "paymentIntentId": "pi_1234567890",
    "amount": 25000,
    "currency": "gtq",
    "membership": {
      "type": "monthly",
      "price": 250.00
    },
    "user": {
      "id": 1,
      "name": "Juan Pérez",
      "email": "juan@gym.com"
    }
  }
}
Crear Payment Intent para Pago Diario
httpPOST http://localhost:5000/api/stripe/create-daily-intent
Authorization: Bearer {token} (opcional)
Content-Type: application/json

{
  "amount": 25.00,
  "dailyCount": 1,
  "clientInfo": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+502 5555-5555"
  }
}
Crear Payment Intent para Tienda
httpPOST http://localhost:5000/api/stripe/create-store-intent
Authorization: Bearer {token} (opcional)
Content-Type: application/json

{
  "orderId": 1
}
Confirmar Pago Exitoso
httpPOST http://localhost:5000/api/stripe/confirm-payment
Authorization: Bearer {token} (opcional)
Content-Type: application/json

{
  "paymentIntentId": "pi_1234567890"
}
Respuesta:
json{
  "success": true,
  "message": "Pago confirmado y registrado exitosamente",
  "data": {
    "payment": {
      "id": 15,
      "amount": 250.00,
      "paymentMethod": "card",
      "paymentType": "membership",
      "status": "completed",
      "cardLast4": "4242",
      "paymentDate": "2025-01-15T10:30:00.000Z"
    },
    "stripe": {
      "paymentIntentId": "pi_1234567890",
      "status": "succeeded"
    }
  }
}
Crear Reembolso (Staff)
httpPOST http://localhost:5000/api/stripe/refund
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentId": 15,
  "amount": 125.00,
  "reason": "Solicitud del cliente"
}
Estado del Servicio Stripe
httpGET http://localhost:5000/api/stripe/status

🧹 ADMINISTRACIÓN AVANZADA
Información del Sistema (Admin)
httpGET http://localhost:5000/api/admin/system-info
Authorization: Bearer {token}
Respuesta:
json{
  "success": true,
  "data": {
    "services": {
      "cloudinary": true,
      "email": false,
      "whatsapp": true,
      "googleOAuth": true
    },
    "database": {
      "connected": true,
      "timezone": "UTC-6"
    },
    "server": {
      "nodeVersion": "v18.19.0",
      "uptime": 3600,
      "environment": "development"
    }
  }
}
Subir Archivo General (Admin)
httpPOST http://localhost:5000/api/admin/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData: {
  file: [archivo]
}
Limpieza de Datos (Admin)
Resumen de Datos
httpGET http://localhost:5000/api/data-cleanup/summary
Authorization: Bearer {token}
Limpiar Usuarios de Prueba
httpDELETE http://localhost:5000/api/data-cleanup/test-users
Authorization: Bearer {token}
Limpiar Datos de Tienda
httpDELETE http://localhost:5000/api/data-cleanup/store-data
Authorization: Bearer {token}
Limpieza Completa (⚠️ PELIGROSO)
httpDELETE http://localhost:5000/api/data-cleanup/all
Authorization: Bearer {token}

🎨 CONTENIDO ESPECÍFICO PARA FRONTEND
Contenido de Landing
httpGET http://localhost:5000/api/content/landing
Tema de Branding
httpGET http://localhost:5000/api/branding/theme
Promociones Activas
httpGET http://localhost:5000/api/promotions/active
Respuesta:
json{
  "success": true,
  "data": {
    "freeWeekActive": true,
    "promotionalText": "Primera Semana GRATIS",
    "badge": "🔥 OFERTA ESPECIAL",
    "ctaButtons": [
      {
        "text": "🔥 Semana GRATIS",
        "type": "primary",
        "action": "register",
        "icon": "gift",
        "color": "#ef4444"
      }
    ],
    "bannerPromo": {
      "active": true,
      "text": "🎉 Promoción especial: Primera semana GRATIS",
      "backgroundColor": "#fef3c7",
      "textColor": "#92400e"
    }
  }
}

🚀 ENDPOINTS DE UTILIDAD
Health Check
httpGET http://localhost:5000/api/health
Lista de Endpoints Disponibles
httpGET http://localhost:5000/api/endpoints
Servicios Disponibles de Auth
httpGET http://localhost:5000/api/auth/services

🔧 ROLES Y PERMISOS
Roles Disponibles:

admin: Acceso completo a todo el sistema
colaborador: Gestión de usuarios, membresías, pagos, tienda
cliente: Acceso a su perfil, horarios, órdenes

Permisos por Endpoint:

🌐 Público: Sin autenticación requerida
🔒 Usuario: Requiere Authorization: Bearer {token}
👥 Staff: Requiere rol admin o colaborador
⚡ Admin: Requiere rol admin únicamente


❌ MANEJO DE ERRORES
Códigos de Estado HTTP:

200: Éxito
201: Creado exitosamente
400: Error en la solicitud
401: No autorizado
403: Prohibido (sin permisos)
404: No encontrado
500: Error interno del servidor
503: Servicio no disponible

Formato de Error:
json{
  "success": false,
  "message": "Descripción del error",
  "error": "Detalles técnicos del error"
}

🔑 HEADERS REQUERIDOS
Para rutas protegidas:
httpAuthorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Para subir archivos:
httpAuthorization: Bearer {token}
Content-Type: multipart/form-data

📋 NOTAS IMPORTANTES

🔄 Tokens JWT: Tienen expiración, usar refresh token para renovar
👤 Roles: Verificar permisos antes de mostrar opciones en UI
📁 Archivos: Máximo 5MB imágenes, 100MB videos
🎨 Formatos: JPG, PNG, WebP para imágenes; MP4, WebM para videos
🛒 Carrito: Funciona con usuarios logueados o sessionId para invitados
💳 Stripe: Requiere configuración en variables de entorno
☁️ Cloudinary: URLs se guardan automáticamente en BD al subir archivos
🌐 URLs: El backend siempre devuelve URLs completas y listas para usar
📱 LocalHost: Usar http://localhost:5000/api para desarrollo