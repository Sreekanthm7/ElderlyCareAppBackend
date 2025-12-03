# Quick Reference Guide

## Folder Structure

```
ElderlyCareAppBackend/
│
├── config/
│   └── database.js              # MongoDB connection setup
│
├── controllers/
│   ├── authController.js        # Authentication logic
│   │   ├── registerCaretaker()
│   │   ├── registerElderly()
│   │   ├── login()
│   │   └── getMe()
│   │
│   └── userController.js        # User operations
│       ├── getElderlyByCaretaker()
│       ├── getAllCaretakers()
│       ├── getUserById()
│       ├── updateUser()
│       ├── deleteUser()
│       └── getCaretakerStats()
│
├── middleware/
│   └── auth.js                  # JWT authentication
│       ├── protect()            # Verify JWT token
│       └── authorize()          # Check user role
│
├── models/
│   └── User.js                  # Mongoose schema
│       └── Single collection for both elderly & caretaker
│
├── routes/
│   ├── authRoutes.js            # Authentication endpoints
│   │   ├── POST /register-caretaker
│   │   ├── POST /register-elderly
│   │   ├── POST /login
│   │   └── GET /me
│   │
│   └── userRoutes.js            # User endpoints
│       ├── GET /caretakers
│       ├── GET /elderly-by-caretaker/:caretakerId
│       ├── GET /caretaker-stats/:caretakerId
│       ├── GET /:id
│       ├── PUT /:id
│       └── DELETE /:id
│
├── .env                         # Environment variables
├── server.js                    # Express server entry point
├── package.json                 # Dependencies
├── API_DOCUMENTATION.md         # Complete API docs
├── README.md                    # Project overview
└── QUICK_REFERENCE.md           # This file
```

## Key Relationships

```
┌─────────────────┐
│   Caretaker 1   │──────┐
└─────────────────┘      │
                         │ manages
┌─────────────────┐      │
│   Caretaker 2   │──┐   │
└─────────────────┘  │   │
                     │   │
                     ├───┼──> ┌──────────────┐
                     │   │    │  Elderly 1   │
                     │   │    └──────────────┘
                     │   │
                     │   └──> ┌──────────────┐
                     │        │  Elderly 2   │
                     │        └──────────────┘
                     │
                     └──────> ┌──────────────┐
                              │  Elderly 3   │
                              └──────────────┘

Each elderly user is assigned to EXACTLY ONE caretaker
Each caretaker can manage MULTIPLE elderly users
```

## API Workflow

### 1. Register Caretaker
```
POST /api/auth/register-caretaker
└─> Returns: { user, token }
```

### 2. Register Elderly (with caretaker assignment)
```
POST /api/auth/register-elderly
├─> Requires: caretakerId
├─> Validates: caretaker exists & has correct role
└─> Returns: { user, token }
```

### 3. Login
```
POST /api/auth/login
├─> Works for both elderly & caretaker
└─> Returns: { user, token }
```

### 4. Get Elderly by Caretaker
```
GET /api/users/elderly-by-caretaker/:caretakerId
├─> Requires: JWT token
└─> Returns: All elderly assigned to that caretaker
```

## Database Schema at a Glance

### User Collection (users)

```javascript
{
  // Common to both roles
  name: String (required, 2-100 chars),
  email: String (required, unique, validated),
  phone: String (required, 10 digits),
  password: String (required, hashed, min 6 chars),
  role: "elderly" | "caretaker" (required),
  profilePicture: String,
  isActive: Boolean (default: true),
  createdAt: Date (auto),
  updatedAt: Date (auto),

  // Elderly-specific (required if role = "elderly")
  age: Number (60-120),
  address: String,
  medicalConditions: [String],
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  caretakerId: ObjectId (ref: User),

  // Caretaker-specific (required if role = "caretaker")
  specialization: String,
  experience: Number (≥ 0),
  certification: String,
  availability: Boolean (default: true)
}
```

## Environment Variables

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ElderlyCare
JWT_SECRET=your_super_secret_jwt_key_change_in_production_2024
JWT_EXPIRE=30d
NODE_ENV=development
```

## Postman Quick Setup

1. **Create Collection**: "Elderly Care App"

2. **Set Variables**:
   - `base_url`: `http://localhost:3000/api`
   - `token`: (auto-filled after login)
   - `caretakerId`: (auto-filled after caretaker registration)
   - `elderlyId`: (auto-filled after elderly registration)

3. **Auto-save Token Script** (add to Tests tab of login/register requests):
```javascript
if (pm.response.code === 201 || pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.data.token);
    if (jsonData.data.user.role === "caretaker") {
        pm.environment.set("caretakerId", jsonData.data.user._id);
    } else {
        pm.environment.set("elderlyId", jsonData.data.user._id);
    }
}
```

4. **Set Collection Authorization**:
   - Type: Bearer Token
   - Token: `{{token}}`

## Testing Sequence

```
1. Register Caretaker
   └─> Save caretakerId & token

2. Login as Caretaker
   └─> Verify token works

3. Get All Caretakers
   └─> See the registered caretaker

4. Register Elderly User (use caretakerId from step 1)
   └─> Save elderlyId

5. Get Elderly by Caretaker
   └─> Should see the elderly user from step 4

6. Get Caretaker Stats
   └─> Should show 1 elderly assigned

7. Update Elderly Profile
   └─> Change phone or address

8. Get User by ID
   └─> Verify updates
```

## Common Issues & Solutions

### Issue: "User with this email already exists"
**Solution**: Use a different email or delete the existing user from MongoDB

### Issue: "Not authorized to access this route"
**Solution**: Include the JWT token in Authorization header as `Bearer <token>`

### Issue: "Invalid caretaker assignment"
**Solution**: Ensure the caretakerId exists and belongs to a user with role "caretaker"

### Issue: "MongoDB connection error"
**Solution**: Ensure MongoDB is running on localhost:27017

### Issue: "Token is invalid or expired"
**Solution**: Login again to get a new token

## Production Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Use MongoDB Atlas or production database
- [ ] Set `NODE_ENV=production`
- [ ] Enable CORS for specific origins
- [ ] Add rate limiting (express-rate-limit)
- [ ] Add helmet.js for security headers
- [ ] Set up logging (Winston)
- [ ] Add request validation (express-validator)
- [ ] Enable HTTPS
- [ ] Set up monitoring (PM2, New Relic)
- [ ] Add API documentation (Swagger)
- [ ] Implement refresh tokens
- [ ] Add email verification
- [ ] Set up CI/CD pipeline

## Useful MongoDB Queries

### Find all caretakers
```javascript
db.users.find({ role: "caretaker" })
```

### Find elderly assigned to a specific caretaker
```javascript
db.users.find({
  role: "elderly",
  caretakerId: ObjectId("your_caretaker_id_here")
})
```

### Count elderly per caretaker
```javascript
db.users.aggregate([
  { $match: { role: "elderly" } },
  { $group: { _id: "$caretakerId", count: { $sum: 1 } } }
])
```

### Find all active users
```javascript
db.users.find({ isActive: true })
```

## Contact & Support

For issues or questions, refer to:
- `README.md` - Project overview
- `API_DOCUMENTATION.md` - Complete API reference

**Version**: 1.0.0
