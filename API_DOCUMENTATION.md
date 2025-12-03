# Elderly Care App Backend - API Documentation

## Table of Contents
1. [Project Structure](#project-structure)
2. [Setup Instructions](#setup-instructions)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Example MongoDB Documents](#example-mongodb-documents)
6. [Postman Testing Guide](#postman-testing-guide)
7. [Error Handling](#error-handling)

---

## Project Structure

```
ElderlyCareAppBackend/
├── config/
│   └── database.js          # MongoDB connection setup
├── controllers/
│   ├── authController.js    # Authentication logic
│   └── userController.js    # User operations logic
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── models/
│   └── User.js              # Mongoose User schema
├── routes/
│   ├── authRoutes.js        # Authentication routes
│   └── userRoutes.js        # User routes
├── .env                     # Environment variables
├── server.js                # Express server entry point
└── package.json
```

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Update `.env` file with your settings:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ElderlyCare
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production_2024
JWT_EXPIRE=30d
NODE_ENV=development
```

### 3. Start MongoDB
Ensure MongoDB is running on your machine:
```bash
# For Linux/Mac
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server will run at: `http://localhost:3000`

---

## Database Schema

### User Collection (Single collection for both roles)

#### Common Fields:
- `name` (String, required, 2-100 chars)
- `email` (String, required, unique, valid email)
- `phone` (String, required, 10 digits)
- `password` (String, required, min 6 chars, hashed with bcrypt)
- `role` (String, required, enum: ['elderly', 'caretaker'])
- `profilePicture` (String, optional)
- `isActive` (Boolean, default: true)
- `createdAt` (Date, auto-generated)
- `updatedAt` (Date, auto-generated)

#### Elderly-Specific Fields:
- `age` (Number, required, min: 60, max: 120)
- `address` (String, required)
- `medicalConditions` (Array of Strings, default: [])
- `emergencyContact` (Object):
  - `name` (String, required)
  - `phone` (String, required, 10 digits)
  - `relation` (String, required)
- `caretakerId` (ObjectId, required, references User with role='caretaker')

#### Caretaker-Specific Fields:
- `specialization` (String, required)
- `experience` (Number, required, min: 0)
- `certification` (String, optional)
- `availability` (Boolean, default: true)

---

## API Endpoints

### Base URL: `http://localhost:3000/api`

---

### Authentication Routes

#### 1. Register Caretaker
- **URL**: `/auth/register-caretaker`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
```json
{
  "name": "Dr. Sarah Johnson",
  "email": "sarah.johnson@example.com",
  "phone": "9876543210",
  "password": "password123",
  "specialization": "Geriatric Care",
  "experience": 5,
  "certification": "Certified Nursing Assistant (CNA)"
}
```
- **Success Response** (201):
```json
{
  "success": true,
  "message": "Caretaker registered successfully",
  "data": {
    "user": {
      "_id": "674a1b2c3d4e5f6a7b8c9d0e",
      "name": "Dr. Sarah Johnson",
      "email": "sarah.johnson@example.com",
      "phone": "9876543210",
      "role": "caretaker",
      "specialization": "Geriatric Care",
      "experience": 5,
      "certification": "Certified Nursing Assistant (CNA)",
      "availability": true,
      "isActive": true,
      "createdAt": "2024-11-27T10:30:00.000Z",
      "updatedAt": "2024-11-27T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 2. Register Elderly User
- **URL**: `/auth/register-elderly`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
```json
{
  "name": "Robert Williams",
  "email": "robert.williams@example.com",
  "phone": "9123456780",
  "password": "password123",
  "age": 72,
  "address": "123 Senior Street, Springfield, IL 62701",
  "medicalConditions": ["Diabetes", "Hypertension", "Arthritis"],
  "emergencyContact": {
    "name": "Emily Williams",
    "phone": "9876543211",
    "relation": "Daughter"
  },
  "caretakerId": "674a1b2c3d4e5f6a7b8c9d0e"
}
```
- **Success Response** (201):
```json
{
  "success": true,
  "message": "Elderly user registered successfully",
  "data": {
    "user": {
      "_id": "674a1b2c3d4e5f6a7b8c9d0f",
      "name": "Robert Williams",
      "email": "robert.williams@example.com",
      "phone": "9123456780",
      "role": "elderly",
      "age": 72,
      "address": "123 Senior Street, Springfield, IL 62701",
      "medicalConditions": ["Diabetes", "Hypertension", "Arthritis"],
      "emergencyContact": {
        "name": "Emily Williams",
        "phone": "9876543211",
        "relation": "Daughter"
      },
      "caretakerId": {
        "_id": "674a1b2c3d4e5f6a7b8c9d0e",
        "name": "Dr. Sarah Johnson",
        "email": "sarah.johnson@example.com",
        "phone": "9876543210",
        "specialization": "Geriatric Care"
      },
      "isActive": true,
      "createdAt": "2024-11-27T10:35:00.000Z",
      "updatedAt": "2024-11-27T10:35:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 3. Login (Both Elderly & Caretaker)
- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
```json
{
  "email": "sarah.johnson@example.com",
  "password": "password123"
}
```
- **Success Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "674a1b2c3d4e5f6a7b8c9d0e",
      "name": "Dr. Sarah Johnson",
      "email": "sarah.johnson@example.com",
      "role": "caretaker",
      "specialization": "Geriatric Care",
      "experience": 5
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 4. Get Current User
- **URL**: `/auth/me`
- **Method**: `GET`
- **Auth Required**: Yes
- **Headers**:
```
Authorization: Bearer <your_jwt_token>
```
- **Success Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "674a1b2c3d4e5f6a7b8c9d0e",
      "name": "Dr. Sarah Johnson",
      "email": "sarah.johnson@example.com",
      "role": "caretaker"
    }
  }
}
```

---

### User Routes

#### 5. Get All Caretakers
- **URL**: `/users/caretakers`
- **Method**: `GET`
- **Auth Required**: No (can be changed)
- **Success Response** (200):
```json
{
  "success": true,
  "count": 2,
  "data": {
    "caretakers": [
      {
        "_id": "674a1b2c3d4e5f6a7b8c9d0e",
        "name": "Dr. Sarah Johnson",
        "email": "sarah.johnson@example.com",
        "phone": "9876543210",
        "specialization": "Geriatric Care",
        "experience": 5,
        "availability": true
      }
    ]
  }
}
```

---

#### 6. Get Elderly Users by Caretaker
- **URL**: `/users/elderly-by-caretaker/:caretakerId`
- **Method**: `GET`
- **Auth Required**: Yes
- **Headers**:
```
Authorization: Bearer <your_jwt_token>
```
- **Success Response** (200):
```json
{
  "success": true,
  "count": 3,
  "data": {
    "caretaker": {
      "id": "674a1b2c3d4e5f6a7b8c9d0e",
      "name": "Dr. Sarah Johnson",
      "email": "sarah.johnson@example.com",
      "specialization": "Geriatric Care"
    },
    "elderlyUsers": [
      {
        "_id": "674a1b2c3d4e5f6a7b8c9d0f",
        "name": "Robert Williams",
        "email": "robert.williams@example.com",
        "age": 72,
        "address": "123 Senior Street, Springfield, IL 62701",
        "medicalConditions": ["Diabetes", "Hypertension"],
        "emergencyContact": {
          "name": "Emily Williams",
          "phone": "9876543211",
          "relation": "Daughter"
        },
        "caretakerId": {
          "_id": "674a1b2c3d4e5f6a7b8c9d0e",
          "name": "Dr. Sarah Johnson",
          "email": "sarah.johnson@example.com",
          "specialization": "Geriatric Care"
        }
      }
    ]
  }
}
```

---

#### 7. Get User by ID
- **URL**: `/users/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **Headers**:
```
Authorization: Bearer <your_jwt_token>
```
- **Success Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "674a1b2c3d4e5f6a7b8c9d0f",
      "name": "Robert Williams",
      "email": "robert.williams@example.com",
      "role": "elderly",
      "age": 72
    }
  }
}
```

---

#### 8. Update User Profile
- **URL**: `/users/:id`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Headers**:
```
Authorization: Bearer <your_jwt_token>
```
- **Request Body**:
```json
{
  "phone": "9123456789",
  "address": "456 New Address, Springfield, IL 62701",
  "medicalConditions": ["Diabetes", "Hypertension", "High Cholesterol"]
}
```
- **Success Response** (200):
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "_id": "674a1b2c3d4e5f6a7b8c9d0f",
      "name": "Robert Williams",
      "phone": "9123456789",
      "address": "456 New Address, Springfield, IL 62701"
    }
  }
}
```

---

#### 9. Get Caretaker Statistics
- **URL**: `/users/caretaker-stats/:caretakerId`
- **Method**: `GET`
- **Auth Required**: Yes (Caretaker only)
- **Headers**:
```
Authorization: Bearer <your_jwt_token>
```
- **Success Response** (200):
```json
{
  "success": true,
  "data": {
    "caretaker": {
      "id": "674a1b2c3d4e5f6a7b8c9d0e",
      "name": "Dr. Sarah Johnson",
      "specialization": "Geriatric Care",
      "experience": 5
    },
    "statistics": {
      "totalElderlyAssigned": 3,
      "elderlyDetails": [
        {
          "_id": "674a1b2c3d4e5f6a7b8c9d0f",
          "name": "Robert Williams",
          "age": 72,
          "medicalConditions": ["Diabetes", "Hypertension"],
          "createdAt": "2024-11-27T10:35:00.000Z"
        }
      ]
    }
  }
}
```

---

#### 10. Deactivate User
- **URL**: `/users/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Headers**:
```
Authorization: Bearer <your_jwt_token>
```
- **Success Response** (200):
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

---

## Example MongoDB Documents

### Caretaker Document
```javascript
{
  "_id": ObjectId("674a1b2c3d4e5f6a7b8c9d0e"),
  "name": "Dr. Sarah Johnson",
  "email": "sarah.johnson@example.com",
  "phone": "9876543210",
  "password": "$2b$10$XxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx", // hashed
  "role": "caretaker",
  "specialization": "Geriatric Care",
  "experience": 5,
  "certification": "Certified Nursing Assistant (CNA)",
  "availability": true,
  "profilePicture": "",
  "isActive": true,
  "createdAt": ISODate("2024-11-27T10:30:00.000Z"),
  "updatedAt": ISODate("2024-11-27T10:30:00.000Z"),
  "__v": 0
}
```

### Elderly Document
```javascript
{
  "_id": ObjectId("674a1b2c3d4e5f6a7b8c9d0f"),
  "name": "Robert Williams",
  "email": "robert.williams@example.com",
  "phone": "9123456780",
  "password": "$2b$10$YyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYy", // hashed
  "role": "elderly",
  "age": 72,
  "address": "123 Senior Street, Springfield, IL 62701",
  "medicalConditions": ["Diabetes", "Hypertension", "Arthritis"],
  "emergencyContact": {
    "name": "Emily Williams",
    "phone": "9876543211",
    "relation": "Daughter"
  },
  "caretakerId": ObjectId("674a1b2c3d4e5f6a7b8c9d0e"),
  "profilePicture": "",
  "isActive": true,
  "createdAt": ISODate("2024-11-27T10:35:00.000Z"),
  "updatedAt": ISODate("2024-11-27T10:35:00.000Z"),
  "__v": 0
}
```

---

## Postman Testing Guide

### Step 1: Setup Postman Collection

1. Open Postman
2. Create a new Collection named "Elderly Care App"
3. Add a variable:
   - Variable: `base_url`
   - Value: `http://localhost:3000/api`
   - Variable: `token`
   - Value: (leave empty, will be set automatically)

### Step 2: Test Flow

#### Test 1: Register a Caretaker
1. Create new request: `POST {{base_url}}/auth/register-caretaker`
2. Body (JSON):
```json
{
  "name": "Dr. Sarah Johnson",
  "email": "sarah.johnson@example.com",
  "phone": "9876543210",
  "password": "password123",
  "specialization": "Geriatric Care",
  "experience": 5,
  "certification": "Certified Nursing Assistant (CNA)"
}
```
3. Send request
4. Copy the `token` from response
5. Save it to Postman environment variable

**Auto-save token script** (Add to Tests tab):
```javascript
if (pm.response.code === 201) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.data.token);
    pm.environment.set("caretakerId", jsonData.data.user._id);
}
```

---

#### Test 2: Login as Caretaker
1. Create new request: `POST {{base_url}}/auth/login`
2. Body (JSON):
```json
{
  "email": "sarah.johnson@example.com",
  "password": "password123"
}
```
3. Send request
4. Token will be auto-saved (if you added the script)

---

#### Test 3: Get All Caretakers
1. Create new request: `GET {{base_url}}/users/caretakers`
2. No authentication required (by default)
3. Send request

---

#### Test 4: Register Elderly User
1. Create new request: `POST {{base_url}}/auth/register-elderly`
2. Body (JSON):
```json
{
  "name": "Robert Williams",
  "email": "robert.williams@example.com",
  "phone": "9123456780",
  "password": "password123",
  "age": 72,
  "address": "123 Senior Street, Springfield, IL 62701",
  "medicalConditions": ["Diabetes", "Hypertension", "Arthritis"],
  "emergencyContact": {
    "name": "Emily Williams",
    "phone": "9876543211",
    "relation": "Daughter"
  },
  "caretakerId": "{{caretakerId}}"
}
```
3. Send request

**Auto-save elderly ID** (Add to Tests tab):
```javascript
if (pm.response.code === 201) {
    var jsonData = pm.response.json();
    pm.environment.set("elderlyId", jsonData.data.user._id);
}
```

---

#### Test 5: Get Current User (Protected Route)
1. Create new request: `GET {{base_url}}/auth/me`
2. Authorization tab:
   - Type: Bearer Token
   - Token: `{{token}}`
3. Send request

---

#### Test 6: Get Elderly by Caretaker
1. Create new request: `GET {{base_url}}/users/elderly-by-caretaker/{{caretakerId}}`
2. Authorization: Bearer Token → `{{token}}`
3. Send request

---

#### Test 7: Update User Profile
1. Create new request: `PUT {{base_url}}/users/{{elderlyId}}`
2. Authorization: Bearer Token → `{{token}}`
3. Body (JSON):
```json
{
  "phone": "9999999999",
  "address": "New Updated Address"
}
```
4. Send request

---

#### Test 8: Get Caretaker Statistics
1. Create new request: `GET {{base_url}}/users/caretaker-stats/{{caretakerId}}`
2. Authorization: Bearer Token → `{{token}}`
3. Send request

---

### Postman Tips

1. **Set Authorization for Entire Collection**:
   - Go to Collection settings
   - Authorization tab → Type: Bearer Token
   - Token: `{{token}}`
   - All requests will inherit this

2. **Test Multiple Elderly Registrations**:
   - Register 2-3 elderly users with the same caretakerId
   - Then test "Get Elderly by Caretaker" to see multiple results

3. **Test Error Cases**:
   - Try registering with existing email
   - Try login with wrong password
   - Try accessing protected routes without token
   - Try registering elderly with invalid caretakerId

---

## Error Handling

### Common Error Responses

#### 400 - Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Email is required",
    "Password must be at least 6 characters long"
  ]
}
```

#### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route. Please login."
}
```

#### 403 - Forbidden
```json
{
  "success": false,
  "message": "User role 'elderly' is not authorized to access this route"
}
```

#### 404 - Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

#### 500 - Server Error
```json
{
  "success": false,
  "message": "Server error",
  "error": "Detailed error message (only in development)"
}
```

---

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with salt rounds of 10
2. **JWT Authentication**: Token-based authentication with configurable expiration
3. **Role-Based Access Control**: Middleware to restrict routes by user role
4. **Input Validation**: Mongoose schema validation for all user inputs
5. **Email Uniqueness**: Prevents duplicate user registrations
6. **Caretaker Validation**: Ensures elderly users are assigned to valid caretakers

---

## Production Deployment Checklist

- [ ] Change `JWT_SECRET` to a strong, random string
- [ ] Set `NODE_ENV=production` in .env
- [ ] Use environment-specific MongoDB URI
- [ ] Enable CORS for frontend domains only
- [ ] Add rate limiting middleware
- [ ] Set up logging (Winston, Morgan)
- [ ] Enable HTTPS
- [ ] Add input sanitization (express-validator)
- [ ] Set up MongoDB indexes for performance
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Implement refresh tokens
- [ ] Add email verification
- [ ] Set up monitoring (PM2, New Relic)

---

## Support

For questions or issues, please contact the development team.

**Version**: 1.0.0
**Last Updated**: November 27, 2024
