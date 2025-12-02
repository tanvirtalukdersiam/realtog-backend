# Basic Node.js Backend

A production-ready Node.js backend built with TypeScript, Express.js, MongoDB, and JWT authentication.

## Features

- TypeScript with ESM (ES Modules)
- Express.js REST API
- MongoDB with Mongoose
- JWT Authentication
- Password hashing with bcrypt
- Request/Response logging with Winston
- Live logs viewer in browser (Development)
- Google OAuth 2.0 login
- Email OTP verification system
- OTP resend functionality
- Error handling middleware
- Input validation with Zod
- Swagger API documentation
- Scalable layered architecture
- Path aliases support

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript (ESM only)
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Validation**: Zod
- **Logging**: Winston
- **Documentation**: Swagger UI

## Project Structure

```
src/
  config/          # Configuration files
  modules/         # Feature modules
    auth/          # Authentication module
    user/          # User module
  middlewares/     # Express middlewares
  utils/           # Utility functions
  constants/       # Constants
  database/        # Database connection
  logs/            # Log files
  swagger/         # Swagger configuration
  app.ts           # Express app setup
  server.ts        # Server entry point
tests/             # Test files
```

## Setup

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd basic-nodejs-backend
```

2. Install dependencies

```bash
npm install
```

3. Create `.env` file

```bash
cp .env.example .env
```

4. Update `.env` with your configuration

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/basic-backend
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10

# Email Configuration (for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# OTP Configuration
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
```

**Note for Gmail users:**

- You need to generate an "App Password" for your Gmail account
- Go to Google Account > Security > 2-Step Verification > App passwords
- Use the generated app password as `EMAIL_PASSWORD`

5. Start MongoDB (if running locally)

```bash
# Make sure MongoDB is running on your machine
```

### Development

```bash
npm run dev
```

Server will start on `http://localhost:3000`

### Production

1. Build the project

```bash
npm run build
```

2. Start the server

```bash
npm start
```

## API Endpoints

### Authentication

#### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "password123"
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "emailOrPhone": "john@example.com",
  "password": "password123"
}
```

#### Get Current User

```http
GET /auth/me
Authorization: Bearer <token>
```

#### Login with Google

```http
GET /auth/google
```

Initiates Google OAuth flow. User will be redirected to Google consent screen, then back to your frontend with a JWT token.

**Callback URL:** `http://localhost:3000/auth/google/callback`

**Frontend Integration:**
After successful authentication, user will be redirected to:
- Success: `${FRONTEND_URL}/auth/google/success?token=<jwt_token>&user=<user_data>`
- Failure: `${FRONTEND_URL}/auth/google/failure?error=authentication_failed`

### OTP Verification

#### Send OTP

```http
POST /otp/send
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Verify OTP

```http
POST /otp/verify
Content-Type: application/json

{
  "email": "john@example.com",
  "code": "123456"
}
```

#### Resend OTP

```http
POST /otp/resend
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### Health Check

```http
GET /health
```

### Live Logs Viewer (Development Only)

```http
GET /logs/view
```

Opens a web interface to view live server logs in real-time.

```http
GET /logs/stream
```

Server-Sent Events (SSE) endpoint for streaming logs (used by the viewer).

## API Documentation

Swagger UI is available at:

```
http://localhost:3000/api-docs
```

## Environment Variables

| Variable           | Description                    | Default                                 |
| ------------------ | ------------------------------ | --------------------------------------- |
| PORT               | Server port                    | 3000                                    |
| NODE_ENV           | Environment                    | development                             |
| MONGO_URI          | MongoDB connection string      | mongodb://localhost:27017/basic-backend |
| JWT_SECRET         | JWT secret key                 | (required)                              |
| JWT_EXPIRES_IN     | JWT expiration time            | 7d                                      |
| BCRYPT_SALT_ROUNDS | Bcrypt salt rounds             | 10                                      |
| EMAIL_HOST         | SMTP server host               | smtp.gmail.com                          |
| EMAIL_PORT         | SMTP server port               | 587                                     |
| EMAIL_USER         | SMTP username/email            | (required)                              |
| EMAIL_PASSWORD     | SMTP password                  | (required)                              |
| EMAIL_FROM         | Sender email address           | EMAIL_USER                              |
| OTP_EXPIRY_MINUTES | OTP expiration time in minutes | 10                                      |
| OTP_LENGTH         | OTP code length                | 6                                       |
| GOOGLE_CLIENT_ID   | Google OAuth Client ID         | (required for Google login)            |
| GOOGLE_CLIENT_SECRET | Google OAuth Client Secret   | (required for Google login)            |
| GOOGLE_CALLBACK_URL | Google OAuth callback URL     | http://localhost:3000/auth/google/callback |
| SESSION_SECRET     | Session secret for Passport    | (required)                              |
| FRONTEND_URL       | Frontend URL for redirects     | http://localhost:3000                   |

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details (development only)"
}
```

## Logging

Logs are stored in `src/logs/` directory:

- `error.log` - Error logs
- `combined.log` - All logs

### Live Logs Viewer (Development Only)

In development mode, you can view live server logs in your browser:

1. Open `http://localhost:3000/logs/view` in your browser
2. Logs will stream in real-time via Server-Sent Events (SSE)
3. Features:
   - Real-time log streaming
   - Color-coded log levels (error, warn, info, debug)
   - Auto-scroll option
   - Clear logs button
   - Connection status indicator

**Note**: The logs viewer is only available in development mode (`NODE_ENV !== 'production'`).

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Google OAuth 2.0 for social login
- Email OTP verification for email validation
- Input validation with Zod
- Environment variables for sensitive data

## Email OTP Verification

The system includes a complete email OTP verification flow:

1. **Registration**: When a user registers, an OTP is automatically sent to their email
2. **Verification**: User can verify their email using the OTP code
3. **Resend**: User can request a new OTP if the previous one expired
4. **Security**:
   - OTPs expire after 10 minutes (configurable)
   - Rate limiting: Users must wait 1 minute between OTP requests
   - Old unverified OTPs are invalidated when a new one is sent

### Email Setup

For Gmail:

1. Enable 2-Step Verification on your Google Account
2. Generate an App Password:
   - Go to Google Account > Security > 2-Step Verification > App passwords
   - Select "Mail" and "Other (Custom name)"
   - Use the generated password as `EMAIL_PASSWORD`

For other email providers:

- Update `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, and `EMAIL_PASSWORD` in `.env`
- Common SMTP settings:
  - Gmail: smtp.gmail.com:587
  - Outlook: smtp-mail.outlook.com:587
  - Yahoo: smtp.mail.yahoo.com:587

## Google OAuth Setup

To enable Google login:

1. **Create Google OAuth Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable Google+ API
   - Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
   - Select "Web application"
   - Add authorized redirect URI: `http://localhost:3000/auth/google/callback` (or your production URL)
   - Copy the Client ID and Client Secret

2. **Update `.env` file:**
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
   SESSION_SECRET=your-session-secret
   FRONTEND_URL=http://localhost:3000
   ```

3. **Frontend Integration:**
   - Add a "Login with Google" button that redirects to `http://localhost:3000/auth/google`
   - Handle the callback on your frontend:
     - Success: Extract token from URL query params
     - Failure: Show error message to user

### Google OAuth Flow

1. User clicks "Login with Google"
2. User is redirected to Google consent screen
3. User authorizes the application
4. Google redirects back to `/auth/google/callback`
5. Backend creates/updates user and generates JWT token
6. User is redirected to frontend with token in URL
7. Frontend stores token and logs user in

## License

ISC
