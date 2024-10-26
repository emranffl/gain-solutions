# JWT Implementation Guide

## Overview

This implementation uses JSON Web Tokens (JWT) for authentication, leveraging the `jose` library for token generation. The system creates signed tokens containing user information and various security claims.

## Key Components

### 1. Token Generation

```typescript
const token = await new SignJWT({ 
  id: user.id.toString(), 
  email: user.email 
})
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("72h")
  .sign(secret)
```

### 2. Security Features

#### Secret Key

- Uses `NEXTAUTH_SECRET` from environment variables
- Encoded using TextEncoder for proper byte representation

```typescript
const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
```

#### Token Claims

1. **Protected Header**
   - Algorithm: HS256 (HMAC with SHA-256)

2. **Payload Claims**
   - `id`: User's ID (converted to string)
   - `email`: User's email address
   - `iat` (Issued At): Automatically set to current timestamp
   - `exp` (Expiration Time): Set to 72 hours from issuance
   - `iss` (Issuer): Set to site URL from environment variables
   - `sub` (Subject): Set to request host
   - `aud` (Audience): Set to user agent

## Authentication Flow

1. **Request Processing**

   ```typescript
   const { email, password } = await req.json()
   ```

2. **User Verification**

   ```typescript
   const user = await prisma.user.findUnique({
     where: { email },
   })
   ```

3. **Password Validation**

   ```typescript
   if (!user || !(await compare(pass, user.password))) {
     return responseHandler({
       status: 400,
       error: "Bad Request",
       message: "Invalid email or password",
     })
   }
   ```

4. **Response Format**

   ```typescript
   const { password, ...rest } = user
   return responseHandler({
     status: 200,
     results: { 
       ...rest, 
       token: `Bearer ${token}` 
     },
   })
   ```

## Security Considerations

### 1. Token Configuration

- **Expiration**: 72-hour lifetime
- **Bearer Format**: Token is prefixed with "Bearer " for standard authorization
- **Claim-based security**: Multiple claims for validation

### 2. Error Handling

```typescript
try {
  // Token generation logic
} catch (error) {
  return responseHandler({
    status: 500,
    error: "Internal Server Error",
    message: (error as Error).message,
    stack: (error as Error).stack,
  })
}
```

### 3. Data Protection

- Password is excluded from response
- Secure password comparison using bcrypt
- Environment variables for sensitive data

## Best Practices Implemented

1. **Security**
   - Use of strong hashing algorithm (HS256)
   - Secure password comparison
   - Environment variables for secrets
   - Token expiration

2. **Error Handling**
   - Comprehensive error messages
   - Proper status codes
   - Stack traces in development

3. **Data Sanitization**
   - Password removal from response
   - Type safety with TypeScript
   - Proper error typing

## Usage Example

```typescript
// Client-side request
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'userPassword'
  })
});

// Response structure
{
  status: 200,
  results: {
    id: "user_id",
    email: "user@example.com",
    token: "Bearer eyJhbGciOiJIUzI1NiIs..."
  }
}
```

## Token Verification Process

For protected routes, verify the token using:

```typescript
import { jwtVerify } from 'jose';

const { payload } = await jwtVerify(token, secret, {
    algorithms: ["HS256"],
    issuer: process.env.NEXT_PUBLIC_SITE_URL,
    subject: String(req.headers.get("host")),
    audience: String(req.headers.get("user-agent")),
})
```

## Conclusion

This guide outlines the implementation of JWT authentication in a Next.js application. The system generates secure tokens with user information and claims, ensuring a robust authentication mechanism.