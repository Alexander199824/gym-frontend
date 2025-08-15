# Elite Fitness Club - Documentación Completa de API

## 📋 Información General

### URL Base
```
Desarrollo: http://localhost:3001/api
Producción: https://your-domain.com/api
```

### Versión API
- **Versión:** 2.2.0
- **Última actualización:** 2024

### Headers Requeridos
```javascript
// Para todas las peticiones
{
  "Content-Type": "application/json",
  "Accept": "application/json"
}

// Para rutas autenticadas
{
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}

// Para uploads de archivos
{
  "Content-Type": "multipart/form-data",
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

---

## 🔐 Sistema de Autenticación

### Roles de Usuario
- **admin**: Acceso completo al sistema
- **colaborador**: Gestión limitada (clientes, pagos del día)
- **cliente**: Acceso a sus propios datos

### Obtener JWT Token

#### Login con credenciales
```javascript
POST /auth/login
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}

// Respuesta exitosa
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": {
      "id": 1,
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "usuario@ejemplo.com",
      "role": "cliente",
      "isActive": true,
      "profileImage": ""
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Google OAuth
```javascript
// Redirigir a:
GET /auth/google

// Callback (automático):
GET /auth/google/callback

// El sistema redirige con tokens en la URL:
// https://frontend.com/auth/google-success?token=JWT&refresh=REFRESH&role=cliente&userId=1&name=Juan+Pérez
```

#### Verificar token válido
```javascript
GET /auth/verify
Authorization: Bearer YOUR_TOKEN

// Respuesta
{
  "success": true,
  "message": "Token válido",
  "data": {
    "user": {
      "id": 1,
      "email": "usuario@ejemplo.com", 
      "role": "cliente",
      "name": "Juan Pérez"
    },
    "isAuthenticated": true
  }
}
```

#### Refresh Token
```javascript
POST /auth/refresh-token
{
  "refreshToken": "REFRESH_TOKEN_HERE"
}

// Respuesta
{
  "success": true,
  "data": {
    "token": "NEW_JWT_TOKEN",
    "refreshToken": "NEW_REFRESH_TOKEN"
  }
}
```

---

## 👤 Gestión de Perfil (Clientes)

### Obtener mi perfil
```javascript
GET /auth/profile
Authorization: Bearer TOKEN

// Respuesta
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "usuario@ejemplo.com",
      "phone": "12345678",
      "whatsapp": "12345678",
      "role": "cliente",
      "profileImage": "",
      "dateOfBirth": "1990-01-01",
      "emergencyContact": "87654321",
      "notificationPreferences": {
        "email": true,
        "whatsapp": true
      }
    }
  }
}
```

### Actualizar mi perfil
```javascript
PATCH /auth/profile
Authorization: Bearer TOKEN
{
  "firstName": "Juan Carlos",
  "lastName": "Pérez García",
  "phone": "87654321",
  "whatsapp": "87654321",
  "dateOfBirth": "1990-01-01",
  "emergencyContact": "12345678",
  "notificationPreferences": {
    "email": true,
    "whatsapp": false
  }
}
```

### Subir imagen de perfil
```javascript
POST /auth/profile/image
Authorization: Bearer TOKEN
Content-Type: multipart/form-data

FormData:
- image: File (JPG, PNG, WebP, máximo 5MB)

// Respuesta
{
  "success": true,
  "message": "Imagen de perfil actualizada exitosamente",
  "data": {
    "profileImage": "https://cloudinary.com/...",
    "user": {
      "id": 1,
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "usuario@ejemplo.com",
      "profileImage": "https://cloudinary.com/..."
    }
  }
}
```

### Cambiar contraseña
```javascript
PATCH /auth/change-password
Authorization: Bearer TOKEN
{
  "currentPassword": "contraseña_actual",
  "newPassword": "nueva_contraseña"
}
```

---

## 🎫 Mis Datos (Endpoints para Clientes)

### Mis Membresías
```javascript
GET /auth/my-memberships
Authorization: Bearer TOKEN

// Respuesta
{
  "success": true,
  "data": {
    "memberships": [
      {
        "id": 1,
        "type": "premium",
        "status": "active",
        "price": 250.00,
        "startDate": "2024-01-01",
        "endDate": "2024-02-01",
        "autoRenew": true,
        "registeredByUser": {
          "id": 2,
          "firstName": "Admin",
          "lastName": "Gym"
        }
      }
    ],
    "pagination": { "total": 1 }
  }
}
```

### Mis Pagos
```javascript
GET /auth/my-payments?limit=10&page=1
Authorization: Bearer TOKEN

// Respuesta
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": 1,
        "amount": 250.00,
        "paymentMethod": "cash",
        "paymentType": "membership",
        "status": "completed",
        "paymentDate": "2024-01-15T10:30:00Z",
        "description": "Pago de membresía premium",
        "membership": {
          "id": 1,
          "type": "premium",
          "endDate": "2024-02-01"
        },
        "registeredByUser": {
          "id": 2,
          "firstName": "Admin",
          "lastName": "Gym"
        }
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "pages": 2,
      "limit": 10
    }
  }
}
```

### Mi Carrito
```javascript
GET /auth/my-cart
Authorization: Bearer TOKEN

// Respuesta
{
  "success": true,
  "data": {
    "cartItems": [
      {
        "id": 1,
        "quantity": 2,
        "unitPrice": 150.00,
        "product": {
          "id": 1,
          "name": "Proteína Whey",
          "price": 150.00,
          "images": [...]
        }
      }
    ],
    "summary": {
      "itemsCount": 1,
      "subtotal": 300.00,
      "taxAmount": 36.00,
      "shippingAmount": 0,
      "totalAmount": 336.00
    }
  }
}
```

### Mis Órdenes
```javascript
GET /auth/my-orders?limit=10&page=1
Authorization: Bearer TOKEN

// Respuesta
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 1,
        "orderNumber": "ORD-2024-001",
        "status": "delivered",
        "paymentStatus": "paid",
        "subtotal": 300.00,
        "totalAmount": 336.00,
        "createdAt": "2024-01-15T10:00:00Z",
        "deliveryDate": "2024-01-17T15:30:00Z",
        "items": [
          {
            "id": 1,
            "productName": "Proteína Whey",
            "quantity": 2,
            "unitPrice": 150.00,
            "totalPrice": 300.00
          }
        ]
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "pages": 1,
      "limit": 10
    }
  }
}
```

### Mi Horario
```javascript
GET /auth/my-schedule
Authorization: Bearer TOKEN

// Respuesta
{
  "success": true,
  "data": {
    "schedules": [
      {
        "id": 1,
        "dayOfWeek": "monday",
        "preferredStartTime": "06:00",
        "preferredEndTime": "08:00",
        "workoutType": "cardio",
        "priority": 5,
        "isActive": true
      }
    ]
  }
}
```

---

## 🏢 Información del Gimnasio (Público)

### Configuración Principal
```javascript
GET /gym/config

// Respuesta
{
  "success": true,
  "data": {
    "name": "Elite Fitness Club",
    "description": "El mejor gimnasio de Guatemala",
    "tagline": "Transforma tu cuerpo, eleva tu mente",
    "logo": {
      "url": "https://cloudinary.com/...",
      "alt": "Elite Fitness Club Logo",
      "width": 200,
      "height": 80
    },
    "contact": {
      "address": "Zona 10, Guatemala City",
      "phone": "2234-5678",
      "email": "info@elitefitness.com",
      "whatsapp": "50512345678"
    },
    "hours": {
      "full": "Lun-Vie 5:00-22:00, Sáb-Dom 6:00-20:00",
      "weekdays": "5:00-22:00",
      "weekends": "6:00-20:00"
    },
    "social": {
      "instagram": { "url": "https://instagram.com/elite", "active": true },
      "facebook": { "url": "https://facebook.com/elite", "active": true }
    },
    "hero": {
      "title": "Elite Fitness Club",
      "description": "Transforma tu cuerpo, eleva tu mente",
      "ctaText": "Comienza Hoy",
      "ctaButtons": [
        {
          "text": "Primera Semana GRATIS",
          "type": "primary",
          "action": "register",
          "icon": "gift"
        }
      ],
      "videoUrl": "https://cloudinary.com/video.mp4",
      "imageUrl": "https://cloudinary.com/hero.jpg",
      "hasVideo": true,
      "hasImage": true,
      "videoConfig": {
        "autoplay": false,
        "muted": true,
        "loop": true,
        "controls": true,
        "posterUrl": "https://cloudinary.com/hero.jpg"
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
```

### Servicios
```javascript
GET /gym/services

// Respuesta
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Entrenamiento Personalizado",
      "description": "Rutinas diseñadas específicamente para ti",
      "icon": "user",
      "imageUrl": "https://cloudinary.com/...",
      "features": [
        "Evaluación inicial completa",
        "Plan de entrenamiento personalizado",
        "Seguimiento semanal"
      ],
      "active": true,
      "order": 1
    }
  ]
}
```

### Testimonios
```javascript
GET /gym/testimonials

// Respuesta
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "María González",
      "role": "Empresaria",
      "text": "Elite Fitness cambió mi vida completamente...",
      "rating": 5,
      "image": {
        "url": "https://cloudinary.com/...",
        "alt": "María González"
      },
      "verified": true,
      "date": "2024-01-15",
      "active": true
    }
  ],
  "total": 10
}
```

### Estadísticas
```javascript
GET /gym/stats

// Respuesta
{
  "success": true,
  "data": {
    "members": 500,
    "trainers": 15,
    "experience": 10,
    "satisfaction": 98,
    "facilities": 50,
    "customStats": []
  }
}
```

### Planes de Membresía
```javascript
GET /gym/membership-plans

// Respuesta
{
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
        "Uso de equipos básicos"
      ],
      "benefits": [
        { "text": "Acceso al gimnasio", "included": true },
        { "text": "Uso de equipos básicos", "included": true }
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
        "Clases grupales",
        "Entrenador personal"
      ],
      "benefits": [
        { "text": "Todo lo del plan básico", "included": true },
        { "text": "Clases grupales", "included": true },
        { "text": "Entrenador personal", "included": true }
      ],
      "active": true,
      "order": 2,
      "discountPercentage": 17
    }
  ]
}
```

### Promociones Activas
```javascript
GET /promotions/active

// Respuesta
{
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
```

### Contenido de Landing
```javascript
GET /content/landing

// Respuesta
{
  "success": true,
  "data": {
    "hero": {
      "title": "Transforma tu cuerpo y mente",
      "description": "Únete a Elite Fitness y descubre tu mejor versión...",
      "imageUrl": "",
      "videoUrl": "",
      "ctaText": "Comienza Hoy"
    },
    "services": {
      "title": "Todo lo que necesitas para alcanzar tus metas",
      "subtitle": "Servicios profesionales diseñados para llevarte al siguiente nivel"
    },
    "store": {
      "title": "Productos premium para tu entrenamiento",
      "subtitle": "Descubre nuestra selección de suplementos...",
      "benefits": [
        { "text": "Envío gratis +Q200", "icon": "truck" },
        { "text": "Garantía de calidad", "icon": "shield" }
      ]
    }
  }
}
```

### Tema/Branding
```javascript
GET /branding/theme

// Respuesta
{
  "success": true,
  "data": {
    "colors": {
      "primary": "#14b8a6",
      "secondary": "#ec4899",
      "success": "#22c55e",
      "warning": "#f59e0b"
    },
    "fonts": {
      "primary": "Inter",
      "headings": "Inter"
    },
    "logo_variants": {
      "main": "/uploads/logos/logo-main.png",
      "white": "/uploads/logos/logo-white.png",
      "dark": "/uploads/logos/logo-dark.png",
      "icon": "/uploads/logos/logo-icon.png"
    },
    "customCSS": ".hero { background: linear-gradient(...) }",
    "cssVariables": {
      "--primary-color": "#14b8a6",
      "--secondary-color": "#ec4899"
    }
  }
}
```

---

## 🛍️ Tienda Online

### Productos

#### Obtener productos
```javascript
GET /store/products?category=1&brand=2&search=proteina&minPrice=100&maxPrice=500&page=1&limit=20

// Respuesta
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Proteína Whey Premium",
        "description": "Proteína de alta calidad...",
        "price": 350.00,
        "originalPrice": 400.00,
        "sku": "PROT-001",
        "stockQuantity": 50,
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
            "imageUrl": "https://cloudinary.com/...",
            "altText": "Proteína Whey Premium",
            "isPrimary": true
          }
        ],
        "discountPercentage": 12.5,
        "inStock": true,
        "lowStock": false,
        "isFeatured": true
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "pages": 8,
      "limit": 20
    }
  }
}
```

#### Productos destacados
```javascript
GET /store/featured-products?limit=8

// Respuesta
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Proteína Whey Premium",
        "price": 350.00,
        "originalPrice": 400.00,
        "discountPercentage": 12.5,
        "inStock": true,
        "images": [...]
      }
    ]
  }
}
```

#### Producto por ID
```javascript
GET /store/products/1

// Respuesta
{
  "success": true,
  "data": {
    "product": {
      "id": 1,
      "name": "Proteína Whey Premium",
      "description": "Proteína de suero de leche de alta calidad...",
      "price": 350.00,
      "originalPrice": 400.00,
      "sku": "PROT-001",
      "stockQuantity": 50,
      "specifications": {
        "peso": "2.5kg",
        "sabor": "Chocolate",
        "porciones": "80"
      },
      "category": {
        "id": 1,
        "name": "Suplementos",
        "description": "Suplementos nutricionales"
      },
      "brand": {
        "id": 1,
        "name": "Elite Nutrition",
        "description": "Marca premium de suplementos"
      },
      "images": [
        {
          "id": 1,
          "imageUrl": "https://cloudinary.com/...",
          "altText": "Proteína Whey Premium - Vista frontal",
          "isPrimary": true,
          "displayOrder": 1
        }
      ],
      "discountPercentage": 12.5,
      "inStock": true,
      "lowStock": false
    }
  }
}
```

### Categorías y Marcas

#### Categorías
```javascript
GET /store/categories

// Respuesta
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "Suplementos",
        "slug": "suplementos",
        "description": "Suplementos nutricionales",
        "imageUrl": "https://cloudinary.com/...",
        "isActive": true,
        "displayOrder": 1
      }
    ]
  }
}
```

#### Marcas
```javascript
GET /store/brands

// Respuesta
{
  "success": true,
  "data": {
    "brands": [
      {
        "id": 1,
        "name": "Elite Nutrition",
        "description": "Marca premium de suplementos",
        "logoUrl": "https://cloudinary.com/...",
        "isActive": true
      }
    ]
  }
}
```

### Carrito (Usuarios Registrados e Invitados)

#### Obtener carrito
```javascript
// Para usuarios registrados
GET /store/cart
Authorization: Bearer TOKEN

// Para usuarios invitados
GET /store/cart?sessionId=guest_session_12345

// Respuesta
{
  "success": true,
  "data": {
    "cartItems": [
      {
        "id": 1,
        "productId": 1,
        "quantity": 2,
        "unitPrice": 350.00,
        "selectedVariants": {
          "sabor": "chocolate",
          "tamaño": "2.5kg"
        },
        "product": {
          "id": 1,
          "name": "Proteína Whey Premium",
          "price": 350.00,
          "stockQuantity": 50,
          "images": [...]
        }
      }
    ],
    "summary": {
      "itemsCount": 1,
      "subtotal": 700.00,
      "taxAmount": 84.00,
      "shippingAmount": 0,
      "totalAmount": 784.00
    }
  }
}
```

#### Agregar al carrito
```javascript
// Para usuarios registrados
POST /store/cart
Authorization: Bearer TOKEN

// Para usuarios invitados
POST /store/cart

{
  "productId": 1,
  "quantity": 2,
  "selectedVariants": {
    "sabor": "chocolate",
    "tamaño": "2.5kg"
  },
  "sessionId": "guest_session_12345" // Solo para invitados
}

// Respuesta
{
  "success": true,
  "message": "Producto agregado al carrito exitosamente"
}
```

#### Actualizar cantidad
```javascript
// Para usuarios registrados
PUT /store/cart/1
Authorization: Bearer TOKEN

// Para usuarios invitados
PUT /store/cart/1?sessionId=guest_session_12345

{
  "quantity": 3
}

// Respuesta
{
  "success": true,
  "message": "Carrito actualizado exitosamente"
}
```

#### Eliminar del carrito
```javascript
// Para usuarios registrados
DELETE /store/cart/1
Authorization: Bearer TOKEN

// Para usuarios invitados
DELETE /store/cart/1?sessionId=guest_session_12345

// Respuesta
{
  "success": true,
  "message": "Item eliminado del carrito"
}
```

### Órdenes

#### Crear orden (Checkout)
```javascript
// Para usuarios registrados
POST /store/orders
Authorization: Bearer TOKEN

// Para usuarios invitados
POST /store/orders

{
  "sessionId": "guest_session_12345", // Solo para invitados
  "customerInfo": { // Solo para invitados
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@ejemplo.com",
    "phone": "12345678"
  },
  "shippingAddress": {
    "street": "Calle Principal 123",
    "city": "Guatemala",
    "state": "Guatemala",
    "zipCode": "01001",
    "country": "Guatemala"
  },
  "paymentMethod": "cash_on_delivery", // cash_on_delivery, card_on_delivery, online_card, transfer
  "deliveryTimeSlot": "morning", // morning, afternoon, evening
  "notes": "Entregar en recepción"
}

// Respuesta
{
  "success": true,
  "message": "Orden creada exitosamente",
  "data": {
    "order": {
      "id": 1,
      "orderNumber": "ORD-2024-001",
      "userId": 1, // null para invitados
      "customerInfo": null, // Info del cliente para invitados
      "subtotal": 700.00,
      "taxAmount": 84.00,
      "shippingAmount": 25.00,
      "totalAmount": 809.00,
      "paymentMethod": "cash_on_delivery",
      "paymentStatus": "pending",
      "status": "pending",
      "shippingAddress": {...},
      "deliveryTimeSlot": "morning",
      "notes": "Entregar en recepción",
      "items": [
        {
          "id": 1,
          "productId": 1,
          "productName": "Proteína Whey Premium",
          "productSku": "PROT-001",
          "quantity": 2,
          "unitPrice": 350.00,
          "totalPrice": 700.00,
          "selectedVariants": {...}
        }
      ]
    }
  }
}
```

#### Obtener orden por ID
```javascript
// Para usuarios registrados
GET /store/orders/1
Authorization: Bearer TOKEN

// Para usuarios invitados (solo órdenes sin usuario)
GET /store/orders/1

// Respuesta
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "orderNumber": "ORD-2024-001",
      "status": "confirmed",
      "paymentStatus": "paid",
      "totalAmount": 809.00,
      "trackingNumber": "TRACK123",
      "estimatedDelivery": "2024-01-20",
      "items": [...],
      "shippingAddress": {...}
    }
  }
}
```

---

## 💳 Pagos con Stripe

### Configuración de Stripe
```javascript
GET /stripe/config

// Respuesta
{
  "success": true,
  "data": {
    "stripe": {
      "enabled": true,
      "mode": "test", // test o live
      "publishableKey": "pk_test_...",
      "currency": "gtq"
    },
    "message": "Stripe habilitado"
  }
}
```

### Payment Intents

#### Para Membresías
```javascript
POST /stripe/create-membership-intent
Authorization: Bearer TOKEN
{
  "membershipId": 1, // Opcional
  "membershipType": "premium",
  "price": 250.00
}

// Respuesta
{
  "success": true,
  "message": "Intención de pago creada exitosamente",
  "data": {
    "clientSecret": "pi_1234_secret_5678",
    "paymentIntentId": "pi_1234567890",
    "amount": 25000, // En centavos
    "currency": "gtq",
    "membership": {
      "type": "premium",
      "price": 250.00
    },
    "user": {
      "id": 1,
      "name": "Juan Pérez",
      "email": "juan@ejemplo.com"
    }
  }
}
```

#### Para Pagos Diarios
```javascript
// Para usuarios registrados
POST /stripe/create-daily-intent
Authorization: Bearer TOKEN

// Para usuarios invitados
POST /stripe/create-daily-intent

{
  "amount": 25.00,
  "dailyCount": 1,
  "clientInfo": { // Solo para usuarios no registrados
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "phone": "12345678"
  }
}

// Respuesta
{
  "success": true,
  "message": "Intención de pago diario creada exitosamente",
  "data": {
    "clientSecret": "pi_1234_secret_5678",
    "paymentIntentId": "pi_1234567890",
    "amount": 2500,
    "currency": "gtq",
    "dailyData": {
      "amount": 25.00,
      "count": 1
    },
    "clientInfo": {
      "name": "Juan Pérez",
      "email": "juan@ejemplo.com"
    },
    "isRegisteredUser": false
  }
}
```

#### Para Productos de Tienda
```javascript
// Para usuarios registrados
POST /stripe/create-store-intent
Authorization: Bearer TOKEN

// Para usuarios invitados
POST /stripe/create-store-intent

{
  "orderId": 1
}

// Respuesta
{
  "success": true,
  "message": "Intención de pago para tienda creada exitosamente",
  "data": {
    "clientSecret": "pi_1234_secret_5678",
    "paymentIntentId": "pi_1234567890",
    "amount": 80900, // En centavos
    "currency": "gtq",
    "order": {
      "id": 1,
      "orderNumber": "ORD-2024-001",
      "totalAmount": 809.00,
      "itemsCount": 2
    },
    "customer": {
      "name": "Juan Pérez",
      "email": "juan@ejemplo.com",
      "address": {...}
    }
  }
}
```

### Confirmar Pago
```javascript
// Para usuarios registrados
POST /stripe/confirm-payment
Authorization: Bearer TOKEN

// Para usuarios invitados
POST /stripe/confirm-payment

{
  "paymentIntentId": "pi_1234567890"
}

// Respuesta
{
  "success": true,
  "message": "Pago confirmado y registrado exitosamente",
  "data": {
    "payment": {
      "id": 1,
      "amount": 250.00,
      "paymentMethod": "card",
      "paymentType": "membership",
      "status": "completed",
      "cardLast4": "4242",
      "paymentDate": "2024-01-15T10:30:00Z"
    },
    "stripe": {
      "paymentIntentId": "pi_1234567890",
      "status": "succeeded"
    }
  }
}
```

---

## 🎬 Gestión de Multimedia (Solo Admin)

### Estado del Servicio
```javascript
GET /gym-media/status

// Respuesta
{
  "success": true,
  "data": {
    "cloudinaryConfigured": true,
    "availableUploads": ["logo", "heroVideo", "heroImage", "serviceImage", "testimonialImage"],
    "maxFileSizes": {
      "logo": "3MB",
      "heroVideo": "100MB",
      "heroImage": "10MB",
      "serviceImage": "5MB"
    },
    "supportedFormats": {
      "images": ["JPG", "JPEG", "PNG", "WebP"],
      "videos": ["MP4", "WebM", "MOV", "AVI"]
    }
  }
}
```

### Subir Logo
```javascript
POST /gym-media/upload-logo
Authorization: Bearer ADMIN_TOKEN
Content-Type: multipart/form-data

FormData:
- logo: File (JPG, PNG, WebP, SVG, máximo 3MB)

// Respuesta
{
  "success": true,
  "message": "Logo subido y guardado exitosamente",
  "data": {
    "logoUrl": "https://cloudinary.com/...",
    "publicId": "gym/logos/abc123",
    "config": {
      "gymName": "Elite Fitness Club",
      "logoUrl": "https://cloudinary.com/..."
    }
  }
}
```

### Subir Video Hero
```javascript
POST /gym-media/upload-hero-video
Authorization: Bearer ADMIN_TOKEN
Content-Type: multipart/form-data

FormData:
- video: File (MP4, WebM, MOV, AVI, máximo 100MB)

// Respuesta
{
  "success": true,
  "message": "Video hero subido y guardado exitosamente",
  "data": {
    "videoUrl": "https://cloudinary.com/video.mp4",
    "posterUrl": "https://cloudinary.com/video_poster.jpg",
    "publicId": "gym/hero-videos/xyz789",
    "videoInfo": {
      "hasVideo": true,
      "hasCustomImage": false,
      "usingPosterAsImage": true,
      "currentImageUrl": "https://cloudinary.com/video_poster.jpg",
      "imageType": "poster"
    },
    "videoSettings": {
      "autoplay": false,
      "muted": true,
      "loop": true,
      "controls": true
    }
  }
}
```

### Subir Imagen Hero
```javascript
POST /gym-media/upload-hero-image
Authorization: Bearer ADMIN_TOKEN
Content-Type: multipart/form-data

FormData:
- image: File (JPG, PNG, WebP, máximo 10MB)

// Respuesta
{
  "success": true,
  "message": "Imagen hero subida y guardada exitosamente",
  "data": {
    "imageUrl": "https://cloudinary.com/hero.jpg",
    "publicId": "gym/hero-images/def456",
    "imageInfo": {
      "hasImage": true,
      "hasVideo": true,
      "isCustomImage": true,
      "imageType": "custom"
    }
  }
}
```

### Configurar Video Hero
```javascript
PATCH /gym-media/hero-video-settings
Authorization: Bearer ADMIN_TOKEN
{
  "autoplay": true,
  "muted": true,
  "loop": false,
  "controls": true
}

// Respuesta
{
  "success": true,
  "message": "Configuración de video actualizada",
  "data": {
    "videoSettings": {
      "autoplay": true,
      "muted": true,
      "loop": false,
      "controls": true
    }
  }
}
```

### Información de Archivos
```javascript
GET /gym-media/media-info
Authorization: Bearer STAFF_TOKEN

// Respuesta
{
  "success": true,
  "data": {
    "logo": {
      "exists": true,
      "url": "https://cloudinary.com/...",
      "publicId": "gym/logos/abc123"
    },
    "heroVideo": {
      "exists": true,
      "url": "https://cloudinary.com/video.mp4",
      "publicId": "gym/hero-videos/xyz789",
      "settings": {
        "autoplay": false,
        "muted": true,
        "loop": true,
        "controls": true
      }
    },
    "summary": {
      "totalFiles": 5,
      "hasLogo": true,
      "hasHeroVideo": true,
      "hasHeroImage": true
    }
  }
}
```

---

## 📊 Dashboard y Reportes (Solo Staff)

### Dashboard Unificado
```javascript
GET /dashboard/unified?period=month
Authorization: Bearer STAFF_TOKEN

// Respuesta
{
  "success": true,
  "data": {
    "period": "month", // Para admin: month/week/today. Para colaborador: siempre "today"
    "userRole": "admin", // admin, colaborador
    "summary": {
      "totalIncome": 15750.00,
      "paymentsCount": 63,
      "activeMemberships": 45,
      "expiringSoon": 8,
      "newUsers": 12
    },
    "breakdown": {
      "paymentsBy": [
        {
          "type": "membership",
          "total": 12500.00,
          "count": 50
        },
        {
          "type": "daily",
          "total": 3250.00,
          "count": 13
        }
      ],
      "topPaymentMethods": [
        {
          "method": "cash",
          "count": 35
        },
        {
          "method": "card",
          "count": 28
        }
      ]
    },
    // Solo para colaboradores:
    "collaboratorInfo": {
      "id": 2,
      "name": "Juan Colaborador",
      "todayOnly": true,
      "message": "Dashboard personal del día actual"
    }
  }
}
```

### Métricas de Rendimiento
```javascript
GET /dashboard/metrics?days=30
Authorization: Bearer STAFF_TOKEN

// Respuesta
{
  "success": true,
  "data": {
    "period": 30,
    "userRole": "admin",
    "totalDays": 30,
    "averageDailyIncome": 525.00,
    "bestDay": {
      "date": "2024-01-15",
      "income": 850.00,
      "transactions": 12
    },
    "weeklyTrend": {
      "direction": "up", // up, down, stable
      "percentage": 15.5,
      "firstWeekTotal": 3200.00,
      "lastWeekTotal": 3696.00
    },
    "dailyMetrics": [
      {
        "date": "2024-01-01",
        "income": 450.00,
        "transactions": 8
      }
    ],
    // Solo para colaboradores:
    "personalMetrics": true,
    "collaboratorName": "Juan Colaborador",
    "note": "Estas métricas incluyen únicamente los pagos que registraste"
  }
}
```

---

## 💰 Reportes Financieros

### Reporte Personal Diario (Solo Colaboradores)
```javascript
GET /payments/my-daily-report
Authorization: Bearer COLABORADOR_TOKEN

// Respuesta
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "collaboratorId": 2,
    "collaboratorName": "Juan Colaborador",
    "summary": {
      "totalAmount": 1250.00,
      "totalCount": 8,
      "byType": {
        "membership": {
          "total": 1000.00,
          "count": 4
        },
        "daily": {
          "total": 250.00,
          "count": 4
        }
      }
    },
    "payments": [
      {
        "id": 15,
        "amount": 250.00,
        "paymentMethod": "cash",
        "paymentType": "membership",
        "user": {
          "id": 10,
          "firstName": "María",
          "lastName": "García"
        }
      }
    ]
  }
}
```

### Estadísticas Diarias Personales (Solo Colaboradores)
```javascript
GET /payments/my-daily-stats
Authorization: Bearer COLABORADOR_TOKEN

// Respuesta
{
  "success": true,
  "data": {
    "today": {
      "amount": 1250.00,
      "count": 8,
      "date": "2024-01-15"
    },
    "comparison": {
      "weeklyAverage": 1100.00,
      "percentageVsAverage": "113.6"
    },
    "collaborator": {
      "id": 2,
      "name": "Juan Colaborador"
    }
  }
}
```

### Reportes de Pagos (Solo Staff)
```javascript
GET /payments/reports?period=month&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer STAFF_TOKEN

// Respuesta (Admin ve todo, colaborador solo sus datos del día)
{
  "success": true,
  "data": {
    "totalIncome": 15750.00,
    "period": "month", // Para colaborador siempre "today"
    "userRole": "admin",
    "incomeByType": [
      {
        "type": "membership",
        "total": 12500.00,
        "count": 50
      }
    ],
    "incomeByMethod": [
      {
        "method": "cash",
        "total": 8900.00,
        "count": 35
      }
    ],
    "dailyPayments": [
      {
        "date": "2024-01-15",
        "total": 850.00,
        "count": 12
      }
    ]
  }
}
```

### Estadísticas de Invitados (Solo Staff)
```javascript
GET /payments/guest-stats?period=month
Authorization: Bearer STAFF_TOKEN

// Respuesta
{
  "success": true,
  "data": {
    "period": "month",
    "guestPayments": {
      "total": 25,
      "totalAmount": 1250.00,
      "averageOrderValue": 50.00,
      "percentage": 15.8
    },
    "registeredPayments": {
      "total": 133,
      "totalAmount": 6650.00,
      "averageOrderValue": 50.00,
      "percentage": 84.2
    },
    "comparison": {
      "totalPayments": 158,
      "guestVsRegisteredRatio": "0.19",
      "averageOrderComparison": "100.0%"
    },
    "insights": {
      "guestConversionOpportunity": true,
      "averageOrderHigher": false,
      "significantGuestVolume": false
    }
  }
}
```

---

## 📅 Gestión de Horarios

### Mi Horario
```javascript
GET /schedule/my-schedule
Authorization: Bearer TOKEN

// Respuesta
{
  "success": true,
  "data": {
    "schedules": [
      {
        "id": 1,
        "dayOfWeek": "monday",
        "preferredStartTime": "06:00",
        "preferredEndTime": "08:00",
        "workoutType": "cardio",
        "priority": 5,
        "notes": "Preferencia por cardio matutino",
        "isActive": true
      }
    ]
  }
}
```

### Actualizar Mi Horario
```javascript
PUT /schedule/my-schedule
Authorization: Bearer TOKEN
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
      "workoutType": "strength",
      "priority": 4,
      "notes": "Entrenamiento de fuerza"
    }
  ]
}

// Respuesta
{
  "success": true,
  "message": "Horarios actualizados exitosamente",
  "data": {
    "schedules": [...]
  }
}
```

### Agregar Horario Específico
```javascript
POST /schedule/my-schedule
Authorization: Bearer TOKEN
{
  "dayOfWeek": "friday",
  "preferredStartTime": "17:00",
  "preferredEndTime": "19:00",
  "workoutType": "mixed",
  "priority": 3,
  "notes": "Entrenamiento de fin de semana"
}

// Respuesta
{
  "success": true,
  "message": "Horario agregado exitosamente",
  "data": {
    "schedule": {
      "id": 5,
      "dayOfWeek": "friday",
      "preferredStartTime": "17:00",
      "preferredEndTime": "19:00",
      "workoutType": "mixed",
      "priority": 3,
      "notes": "Entrenamiento de fin de semana",
      "isActive": true
    }
  }
}
```

### Eliminar Horario
```javascript
DELETE /schedule/my-schedule/5
Authorization: Bearer TOKEN

// Respuesta
{
  "success": true,
  "message": "Horario eliminado exitosamente"
}
```

### Horarios Populares (Solo Staff)
```javascript
GET /schedule/popular-times
Authorization: Bearer STAFF_TOKEN

// Respuesta
{
  "success": true,
  "data": {
    "popularTimes": [
      {
        "hour": "06:00",
        "userCount": 25,
        "day": "monday"
      }
    ],
    "dayStatistics": [
      {
        "day": "monday",
        "count": 45,
        "avgPriority": "4.2"
      }
    ],
    "workoutTypeStats": [
      {
        "type": "cardio",
        "count": 35
      }
    ]
  }
}
```

---

## ❌ Códigos de Error

### Errores de Autenticación
```javascript
// 401 - No autorizado
{
  "success": false,
  "message": "Token de autenticación requerido"
}

// 401 - Token inválido
{
  "success": false,
  "message": "Token inválido o expirado"
}

// 403 - Sin permisos
{
  "success": false,
  "message": "No tienes permisos para realizar esta acción"
}
```

### Errores de Validación
```javascript
// 400 - Datos inválidos
{
  "success": false,
  "message": "Datos de entrada inválidos",
  "errors": [
    {
      "field": "email",
      "message": "Email debe ser válido"
    },
    {
      "field": "password",
      "message": "Contraseña debe tener al menos 6 caracteres"
    }
  ]
}
```

### Errores de Recursos
```javascript
// 404 - No encontrado
{
  "success": false,
  "message": "Recurso no encontrado"
}

// 409 - Conflicto
{
  "success": false,
  "message": "El email ya está registrado"
}
```

### Errores de Servidor
```javascript
// 500 - Error interno
{
  "success": false,
  "message": "Error interno del servidor",
  "error": "Descripción técnica del error"
}

// 503 - Servicio no disponible
{
  "success": false,
  "message": "Servicio de archivos no configurado. Configura Cloudinary para subir imágenes."
}
```

---

## 🔧 Variables de Entorno Relevantes

### URLs del Frontend
```bash
# URLs de redirección para diferentes roles
FRONTEND_URL=http://localhost:3000
FRONTEND_CLIENT_URL=http://localhost:3000
FRONTEND_ADMIN_URL=http://localhost:3000/admin

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Base de datos
DATABASE_URL=postgresql://...
```

---

## 🚀 Ejemplos de Uso Completos

### Flujo Completo: Usuario Invitado Compra Productos

```javascript
// 1. Obtener productos destacados
const products = await fetch('/api/store/featured-products');

// 2. Agregar al carrito (sin login)
const sessionId = 'guest_' + Math.random().toString(36).substr(2, 9);
await fetch('/api/store/cart', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 1,
    quantity: 2,
    sessionId: sessionId
  })
});

// 3. Ver carrito
const cart = await fetch(`/api/store/cart?sessionId=${sessionId}`);

// 4. Crear orden
const order = await fetch('/api/store/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: sessionId,
    customerInfo: {
      firstName: "Juan",
      lastName: "Pérez",
      email: "juan@ejemplo.com",
      phone: "12345678"
    },
    shippingAddress: {
      street: "Calle Principal 123",
      city: "Guatemala",
      zipCode: "01001"
    },
    paymentMethod: "online_card"
  })
});

// 5. Pagar con Stripe
const paymentIntent = await fetch('/api/stripe/create-store-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: order.data.order.id
  })
});

// 6. Confirmar pago (después de Stripe)
const confirmation = await fetch('/api/stripe/confirm-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    paymentIntentId: paymentIntent.data.paymentIntentId
  })
});
```

### Flujo Completo: Cliente Registrado Gestiona Membresía

```javascript
// 1. Login
const login = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: "cliente@ejemplo.com",
    password: "contraseña123"
  })
});

const token = login.data.token;
const authHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

// 2. Ver mis membresías
const memberships = await fetch('/api/auth/my-memberships', {
  headers: authHeaders
});

// 3. Ver planes disponibles
const plans = await fetch('/api/gym/membership-plans');

// 4. Crear payment intent para nueva membresía
const paymentIntent = await fetch('/api/stripe/create-membership-intent', {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({
    membershipType: "premium",
    price: 250.00
  })
});

// 5. Confirmar pago (después de procesar con Stripe)
const confirmation = await fetch('/api/stripe/confirm-payment', {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({
    paymentIntentId: paymentIntent.data.paymentIntentId
  })
});

// 6. Ver historial de pagos
const payments = await fetch('/api/auth/my-payments?limit=10&page=1', {
  headers: authHeaders
});
```

### Flujo Completo: Admin Gestiona Multimedia

```javascript
const adminToken = "admin_jwt_token";
const adminHeaders = {
  'Authorization': `Bearer ${adminToken}`
};

// 1. Verificar estado del servicio
const status = await fetch('/api/gym-media/status');

// 2. Subir logo
const logoFormData = new FormData();
logoFormData.append('logo', logoFile);

const logoUpload = await fetch('/api/gym-media/upload-logo', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${adminToken}` },
  body: logoFormData
});

// 3. Subir video hero
const videoFormData = new FormData();
videoFormData.append('video', videoFile);

const videoUpload = await fetch('/api/gym-media/upload-hero-video', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${adminToken}` },
  body: videoFormData
});

// 4. Configurar settings de video
const videoSettings = await fetch('/api/gym-media/hero-video-settings', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    autoplay: true,
    muted: true,
    loop: false,
    controls: true
  })
});

// 5. Obtener configuración actualizada para el frontend
const gymConfig = await fetch('/api/gym/config');
```

---

## 📱 Integración con Frontend

### Headers Recomendados
```javascript
// Para todas las peticiones
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Client-Version': '1.0.0'
};

// Función helper para autenticación
function getAuthHeaders(token) {
  return {
    ...defaultHeaders,
    'Authorization': `Bearer ${token}`
  };
}
```

### Manejo de Errores
```javascript
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error en la API');
    }

    return data;
  } catch (error) {
    console.error('Error en API:', error);
    throw error;
  }
}
```

### Gestión de Tokens
```javascript
// Guardar token
localStorage.setItem('auth_token', token);
localStorage.setItem('refresh_token', refreshToken);

// Obtener token
const token = localStorage.getItem('auth_token');

// Verificar si necesita refresh
async function checkTokenValid() {
  try {
    await fetch('/api/auth/verify', {
      headers: getAuthHeaders(token)
    });
    return true;
  } catch {
    // Intentar refresh
    try {
      const refreshResponse = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({
          refreshToken: localStorage.getItem('refresh_token')
        })
      });
      
      if (refreshResponse.ok) {
        const newTokens = await refreshResponse.json();
        localStorage.setItem('auth_token', newTokens.data.token);
        localStorage.setItem('refresh_token', newTokens.data.refreshToken);
        return true;
      }
    } catch {
      // Redirigir a login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      return false;
    }
  }
}
```

---

## 🔗 Enlaces Útiles

- **Health Check:** `GET /api/health`
- **Lista de Endpoints:** `GET /api/endpoints`
- **Configuración OAuth:** `GET /api/auth/oauth-config`
- **Estado de Stripe:** `GET /api/stripe/status`
- **Estado de Multimedia:** `GET /api/gym-media/status`

---

**Nota:** Esta documentación cubre la versión 2.2.0 de la API. Para soporte técnico o dudas específicas, contacta al equipo de desarrollo backend.