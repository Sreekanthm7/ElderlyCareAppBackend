# Elderly Care App - Backend

A production-ready Node.js + Express + MongoDB backend for an elderly care mobile application with role-based user management (Elderly & Caretaker).

## Features

- Single user collection with role-based differentiation (elderly/caretaker)
- One-to-many relationship: 1 caretaker manages multiple elderly users
- Bcrypt password hashing for security
- JWT-based authentication
- Automatic timestamps (createdAt, updatedAt)
- Comprehensive validation for caretaker assignments
- RESTful API design
- Production-ready error handling

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
cd ElderlyCareAppBackend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Update `.env` file with your MongoDB URI and JWT secret
   - For production, generate a strong JWT secret

4. Start MongoDB:
```bash
# Linux/Mac
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

5. Run the server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

Server will be running at: `http://localhost:3000`

## Project Structure

```
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   └── userController.js    # User operations
├── middleware/
│   └── auth.js              # JWT validation
├── models/
│   └── User.js              # Mongoose schema
├── routes/
│   ├── authRoutes.js        # Auth endpoints
│   └── userRoutes.js        # User endpoints
├── .env                     # Environment variables
├── server.js                # Express server
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register-caretaker` - Register new caretaker
- `POST /api/auth/register-elderly` - Register new elderly user
- `POST /api/auth/login` - Login (both roles)
- `GET /api/auth/me` - Get current user (protected)

### Users
- `GET /api/users/caretakers` - Get all caretakers
- `GET /api/users/elderly-by-caretaker/:id` - Get elderly by caretaker (protected)
- `GET /api/users/:id` - Get user by ID (protected)
- `PUT /api/users/:id` - Update user (protected)
- `DELETE /api/users/:id` - Deactivate user (protected)
- `GET /api/users/caretaker-stats/:id` - Get caretaker statistics (protected)

## Database Schema

### User Collection

**Common Fields:**
- name, email, phone, password (hashed)
- role: "elderly" | "caretaker"
- profilePicture, isActive
- createdAt, updatedAt (auto-generated)

**Elderly-Specific:**
- age, address, medicalConditions
- emergencyContact (name, phone, relation)
- caretakerId (reference to caretaker)

**Caretaker-Specific:**
- specialization, experience, certification
- availability

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Get the token from:
1. Registration response
2. Login response

## Testing

See `API_DOCUMENTATION.md` for:
- Detailed API documentation
- Example requests/responses
- Postman testing guide
- MongoDB document examples

### Quick Test

1. Register a caretaker:
```bash
curl -X POST http://localhost:3000/api/auth/register-caretaker \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Sarah Johnson",
    "email": "sarah@example.com",
    "phone": "9876543210",
    "password": "password123",
    "specialization": "Geriatric Care",
    "experience": 5
  }'
```

2. Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah@example.com",
    "password": "password123"
  }'
```

## Environment Variables

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ElderlyCare
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=30d
NODE_ENV=development
```

## Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT token authentication
- Role-based access control
- Input validation using Mongoose schemas
- Protected routes with middleware
- Caretaker assignment validation

## Error Handling

All API responses follow a consistent format:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

## Development

### Scripts

- `npm start` - Run production server
- `npm run dev` - Run development server with nodemon

### Adding New Features

1. Create model in `models/`
2. Create controller in `controllers/`
3. Create routes in `routes/`
4. Register routes in `server.js`

## Production Deployment

Before deploying to production:

1. Set strong `JWT_SECRET` in environment variables
2. Set `NODE_ENV=production`
3. Use production MongoDB URI (MongoDB Atlas recommended)
4. Enable CORS for specific origins only
5. Add rate limiting
6. Set up logging (Winston/Morgan)
7. Enable HTTPS
8. Add input sanitization
9. Set up monitoring (PM2)
10. Configure environment-specific settings

## License

ISC

## Version

1.0.0

## Author

Elderly Care App Development Team

---

For detailed API documentation, see `API_DOCUMENTATION.md`
