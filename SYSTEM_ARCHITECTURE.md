# System Architecture - Elderly Care App Backend

## Complete System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                       MOBILE APPLICATION                            │
│                   (React Native / Flutter)                          │
└────────────────┬────────────────────────────────────────────────────┘
                 │ HTTP Requests (JSON)
                 │ Authorization: Bearer <JWT_TOKEN>
                 │
┌────────────────▼────────────────────────────────────────────────────┐
│                      EXPRESS SERVER                                 │
│                    (Node.js + Express)                              │
│                   PORT: 3000 (default)                              │
└─────────────────────────────────────────────────────────────────────┘
         │                      │                      │
         │                      │                      │
    ┌────▼─────┐         ┌──────▼──────┐       ┌──────▼──────┐
    │  Routes  │────────▶│ Controllers │──────▶│ Middleware  │
    └──────────┘         └─────────────┘       └─────────────┘
         │                      │                      │
         │                      │                      │
    ┌────▼─────────────────────▼──────────────────────▼────┐
    │                    MONGOOSE ORM                       │
    └───────────────────────────┬───────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   MONGODB DATABASE    │
                    │   Collection: users   │
                    └───────────────────────┘
```

---

## Request Flow Diagram

### Example: Registering an Elderly User

```
1. Mobile App
   │
   │ POST /api/auth/register-elderly
   │ Body: { name, email, password, age, caretakerId, ... }
   │
   ▼
2. Express Server (server.js)
   │
   │ Middleware: express.json() → Parse request body
   │
   ▼
3. Router (/routes/authRoutes.js)
   │
   │ Route: POST /register-elderly
   │
   ▼
4. Controller (/controllers/authController.js)
   │
   │ registerElderly() function
   │ ├─> Check if email exists
   │ ├─> Validate caretaker exists & has correct role
   │ └─> Create user
   │
   ▼
5. Model (/models/User.js)
   │
   │ User.create()
   │ ├─> Mongoose validation (age, email, phone, etc.)
   │ ├─> Pre-save hook: Hash password with bcrypt
   │ └─> Save to MongoDB
   │
   ▼
6. Database (MongoDB)
   │
   │ Insert document into 'users' collection
   │ ├─> Auto-generate _id
   │ ├─> Add createdAt & updatedAt timestamps
   │ └─> Return saved document
   │
   ▼
7. Controller Response
   │
   │ ├─> Generate JWT token
   │ ├─> Populate caretaker details
   │ └─> Return { success, message, data: { user, token } }
   │
   ▼
8. Mobile App Receives Response
   │
   │ ├─> Store JWT token in secure storage
   │ ├─> Save user data in app state
   │ └─> Navigate to dashboard
```

---

## Authentication Flow

### Registration & Login Flow

```
┌─────────────┐
│  New User   │
└──────┬──────┘
       │
       │ Wants to register?
       │
       ├─────────────────┬─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
  [Caretaker]      [Elderly]         [Existing User]
       │                 │                 │
       │                 │                 │
POST /register-    POST /register-    POST /login
  caretaker          elderly            │
       │                 │                 │
       │                 │                 │
       ├─────────────────┴─────────────────┤
       │                                   │
       ▼                                   ▼
   Validate Input                    Find user &
   Hash Password                     Compare password
   Create User                            │
       │                                   │
       ├───────────────────────────────────┤
       │                                   │
       ▼                                   │
   Generate JWT Token ◄───────────────────┘
       │
       │
       ▼
   Return { user, token }
       │
       │
       ▼
   ┌──────────────┐
   │  Mobile App  │
   │ Store Token  │
   └──────────────┘
```

---

## Protected Route Flow

```
Mobile App
    │
    │ GET /api/users/elderly-by-caretaker/:id
    │ Header: Authorization: Bearer <JWT_TOKEN>
    │
    ▼
Express Router
    │
    │ Route: GET /elderly-by-caretaker/:caretakerId
    │
    ▼
Auth Middleware (protect)
    │
    │ 1. Extract token from header
    │ 2. Verify token with JWT_SECRET
    │ 3. Decode token → Get user ID
    │ 4. Find user in database
    │ 5. Check if user is active
    │ 6. Attach user to req.user
    │
    ├─> ❌ Invalid token → 401 Unauthorized
    │
    ▼ ✅ Valid token
Controller (getElderlyByCaretaker)
    │
    │ 1. Get caretakerId from params
    │ 2. Validate caretaker exists
    │ 3. Query elderly users with caretakerId
    │ 4. Populate caretaker details
    │ 5. Return elderly list
    │
    ▼
Response sent to Mobile App
```

---

## Database Schema Visualization

### Users Collection

```
┌────────────────────────────────────────────────────────────────┐
│                        users Collection                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Common Fields (All Users)                                    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ _id: ObjectId (auto-generated)                       │    │
│  │ name: String (required)                              │    │
│  │ email: String (required, unique, indexed)            │    │
│  │ phone: String (required)                             │    │
│  │ password: String (required, hashed, not selected)    │    │
│  │ role: "elderly" | "caretaker" (required, indexed)    │    │
│  │ profilePicture: String                               │    │
│  │ isActive: Boolean (default: true)                    │    │
│  │ createdAt: Date (auto)                               │    │
│  │ updatedAt: Date (auto)                               │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
│  ┌─────────────────────┐          ┌──────────────────────┐   │
│  │ Elderly-Specific    │          │ Caretaker-Specific   │   │
│  ├─────────────────────┤          ├──────────────────────┤   │
│  │ age: Number         │          │ specialization: Str  │   │
│  │ address: String     │          │ experience: Number   │   │
│  │ medicalConditions:  │          │ certification: Str   │   │
│  │   [String]          │          │ availability: Bool   │   │
│  │ emergencyContact: { │          │                      │   │
│  │   name, phone,      │          │                      │   │
│  │   relation          │          │                      │   │
│  │ }                   │          │                      │   │
│  │ caretakerId: ───────┼──────────┼──> references _id    │   │
│  │   ObjectId          │          │    of caretaker      │   │
│  │   (indexed)         │          │                      │   │
│  └─────────────────────┘          └──────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

---

## Folder Structure Map

```
ElderlyCareAppBackend/
│
├── 📁 config/                    Configuration files
│   └── database.js               MongoDB connection logic
│
├── 📁 controllers/               Business logic layer
│   ├── authController.js         Authentication operations
│   │   ├── registerCaretaker()
│   │   ├── registerElderly()
│   │   ├── login()
│   │   └── getMe()
│   │
│   └── userController.js         User operations
│       ├── getElderlyByCaretaker()
│       ├── getAllCaretakers()
│       ├── getUserById()
│       ├── updateUser()
│       ├── deleteUser()
│       └── getCaretakerStats()
│
├── 📁 middleware/                Request interceptors
│   └── auth.js                   Authentication & authorization
│       ├── protect()             JWT validation
│       └── authorize()           Role-based access
│
├── 📁 models/                    Database schemas
│   └── User.js                   User schema (elderly + caretaker)
│       ├── Schema definition
│       ├── Pre-save hooks        (password hashing)
│       ├── Instance methods      (comparePassword, toSafeObject)
│       └── Indexes               (email, role, caretakerId)
│
├── 📁 routes/                    API endpoints
│   ├── authRoutes.js             /api/auth/*
│   │   ├── POST /register-caretaker
│   │   ├── POST /register-elderly
│   │   ├── POST /login
│   │   └── GET /me (protected)
│   │
│   └── userRoutes.js             /api/users/*
│       ├── GET /caretakers
│       ├── GET /elderly-by-caretaker/:id (protected)
│       ├── GET /caretaker-stats/:id (protected)
│       ├── GET /:id (protected)
│       ├── PUT /:id (protected)
│       └── DELETE /:id (protected)
│
├── 📄 .env                       Environment variables
│   ├── PORT
│   ├── MONGODB_URI
│   ├── JWT_SECRET
│   ├── JWT_EXPIRE
│   └── NODE_ENV
│
├── 📄 server.js                  Express app entry point
│   ├── Middleware setup
│   ├── Route registration
│   ├── Error handlers
│   └── Server start
│
├── 📄 package.json               Dependencies & scripts
│
└── 📁 Documentation
    ├── README.md                 Quick start guide
    ├── API_DOCUMENTATION.md      Complete API reference
    ├── QUICK_REFERENCE.md        Quick lookup
    ├── IMPLEMENTATION_SUMMARY.md Implementation overview
    └── SYSTEM_ARCHITECTURE.md    This file
```

---

## Data Relationship Diagram

```
                    ┌─────────────────────────┐
                    │     Caretaker 1         │
                    │  Dr. Sarah Johnson      │
                    │  ID: 674a1b2c...        │
                    └──────────┬──────────────┘
                               │
                    ┌──────────┴──────────────────────────┐
                    │                                     │
                    │ caretakerId                         │ caretakerId
                    │                                     │
        ┌───────────▼──────────┐            ┌────────────▼─────────┐
        │   Elderly 1          │            │   Elderly 2          │
        │  Robert Williams     │            │  Mary Johnson        │
        │  Age: 72             │            │  Age: 68             │
        │  Medical: Diabetes   │            │  Medical: Arthritis  │
        └──────────────────────┘            └──────────────────────┘


                    ┌─────────────────────────┐
                    │     Caretaker 2         │
                    │  John Smith             │
                    │  ID: 674a1b2d...        │
                    └──────────┬──────────────┘
                               │
                               │ caretakerId
                               │
                    ┌──────────▼──────────┐
                    │   Elderly 3         │
                    │  Alice Brown        │
                    │  Age: 75            │
                    │  Medical: None      │
                    └─────────────────────┘
```

**Key Points**:
- Each elderly user has EXACTLY ONE caretaker (via `caretakerId`)
- Each caretaker can have ZERO or MORE elderly users
- The relationship is stored in the elderly document
- Queries can go both directions:
  - Find caretaker of an elderly user: `elderly.caretakerId`
  - Find all elderly of a caretaker: `User.find({ caretakerId: id })`

---

## API Endpoint Map

```
http://localhost:3000
│
├── /                              [GET]    Health check
│
└── /api
    │
    ├── /auth
    │   ├── /register-caretaker    [POST]   Public
    │   ├── /register-elderly      [POST]   Public
    │   ├── /login                 [POST]   Public
    │   └── /me                    [GET]    Protected
    │
    └── /users
        ├── /caretakers            [GET]    Public
        ├── /elderly-by-caretaker
        │   └── /:caretakerId      [GET]    Protected
        ├── /caretaker-stats
        │   └── /:caretakerId      [GET]    Protected (Caretaker only)
        ├── /:id                   [GET]    Protected
        ├── /:id                   [PUT]    Protected
        └── /:id                   [DELETE]  Protected
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    REQUEST                              │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   Layer 1: Express Parsing   │
        │   - JSON body parsing        │
        │   - URL encoding             │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │   Layer 2: Route Matching    │
        │   - Find correct route       │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │   Layer 3: Authentication    │
        │   - protect() middleware     │
        │   - Verify JWT token         │
        │   - Load user from database  │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │   Layer 4: Authorization     │
        │   - authorize() middleware   │
        │   - Check user role          │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │   Layer 5: Validation        │
        │   - Mongoose schema          │
        │   - Custom validators        │
        │   - Business logic checks    │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │   Layer 6: Database          │
        │   - Query execution          │
        │   - Password hashing         │
        │   - Data sanitization        │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │        RESPONSE               │
        │   - Exclude password field   │
        │   - Consistent format        │
        └──────────────────────────────┘
```

---

## Deployment Architecture (Production)

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERNET                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Load Balancer                              │
│              (NGINX / AWS ELB)                              │
└──────────────┬───────────────────┬──────────────────────────┘
               │                   │
       ┌───────▼──────┐    ┌───────▼──────┐
       │  Server 1    │    │  Server 2    │
       │  (PM2)       │    │  (PM2)       │
       │  Node.js     │    │  Node.js     │
       └───────┬──────┘    └───────┬──────┘
               │                   │
               └────────┬──────────┘
                        │
            ┌───────────▼──────────────┐
            │   MongoDB Atlas          │
            │   (Replica Set)          │
            │   - Primary              │
            │   - Secondary            │
            │   - Secondary            │
            └──────────────────────────┘
```

---

## Error Handling Flow

```
Request
   │
   ▼
Try {
   Controller Logic
}
   │
   ├─> ✅ Success
   │      │
   │      ▼
   │   res.status(200).json({
   │     success: true,
   │     data: { ... }
   │   })
   │
   └─> ❌ Error
          │
          ├─> Validation Error (400)
          │      │
          │      ▼
          │   res.status(400).json({
          │     success: false,
          │     message: "Validation error",
          │     errors: [...]
          │   })
          │
          ├─> Unauthorized (401)
          │      │
          │      ▼
          │   res.status(401).json({
          │     success: false,
          │     message: "Not authorized"
          │   })
          │
          ├─> Forbidden (403)
          │      │
          │      ▼
          │   res.status(403).json({
          │     success: false,
          │     message: "Access denied"
          │   })
          │
          ├─> Not Found (404)
          │      │
          │      ▼
          │   res.status(404).json({
          │     success: false,
          │     message: "Resource not found"
          │   })
          │
          └─> Server Error (500)
                 │
                 ▼
              res.status(500).json({
                success: false,
                message: "Server error",
                error: details (if dev)
              })
```

---

## Complete Workflow Example

### Scenario: Caretaker Views Their Assigned Elderly Users

```
1. Mobile App
   │
   │ User: Dr. Sarah Johnson (Caretaker)
   │ Action: Opens "My Patients" screen
   │
   ▼
2. API Call
   │
   │ GET /api/users/elderly-by-caretaker/674a1b2c3d4e5f6a7b8c9d0e
   │ Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   │
   ▼
3. Express Router
   │
   │ Match route: /elderly-by-caretaker/:caretakerId
   │
   ▼
4. Middleware: protect()
   │
   │ ├─> Extract token from header
   │ ├─> Verify token: jwt.verify(token, JWT_SECRET)
   │ ├─> Decode: { id: "674a1b2c3d4e5f6a7b8c9d0e" }
   │ ├─> Find user: User.findById(id)
   │ └─> Attach to req.user
   │
   ▼
5. Controller: getElderlyByCaretaker()
   │
   │ ├─> Extract caretakerId from params
   │ ├─> Validate caretaker exists
   │ ├─> Query: User.find({
   │ │     role: "elderly",
   │ │     caretakerId: caretakerId
   │ │   })
   │ └─> Populate caretaker details
   │
   ▼
6. MongoDB Query
   │
   │ Find all documents where:
   │   - role = "elderly"
   │   - caretakerId = ObjectId("674a1b2c3d4e5f6a7b8c9d0e")
   │
   │ Results: [
   │   { name: "Robert Williams", age: 72, ... },
   │   { name: "Mary Johnson", age: 68, ... },
   │   { name: "John Davis", age: 81, ... }
   │ ]
   │
   ▼
7. Response
   │
   │ {
   │   "success": true,
   │   "count": 3,
   │   "data": {
   │     "caretaker": {
   │       "id": "674a1b2c3d4e5f6a7b8c9d0e",
   │       "name": "Dr. Sarah Johnson"
   │     },
   │     "elderlyUsers": [ ... ]
   │   }
   │ }
   │
   ▼
8. Mobile App
   │
   │ Display list of 3 elderly patients
   │ - Robert Williams (72)
   │ - Mary Johnson (68)
   │ - John Davis (81)
```

---

## Technology Stack Summary

```
┌─────────────────────────────────────────────┐
│           FRONTEND (Your Choice)            │
│   React Native / Flutter / Native App      │
└──────────────────┬──────────────────────────┘
                   │ REST API (JSON)
┌──────────────────▼──────────────────────────┐
│              BACKEND                        │
│  ┌────────────────────────────────────┐   │
│  │  Runtime: Node.js                   │   │
│  │  Framework: Express.js              │   │
│  │  Authentication: JWT                │   │
│  │  Password Hashing: bcrypt           │   │
│  │  Validation: Mongoose               │   │
│  └────────────────────────────────────┘   │
└──────────────────┬──────────────────────────┘
                   │ Mongoose ODM
┌──────────────────▼──────────────────────────┐
│            DATABASE                         │
│  ┌────────────────────────────────────┐   │
│  │  Database: MongoDB                  │   │
│  │  Collection: users                  │   │
│  │  Indexes: email, role, caretakerId │   │
│  └────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

**This architecture is production-ready, scalable, and follows industry best practices!**

Version: 1.0.0
