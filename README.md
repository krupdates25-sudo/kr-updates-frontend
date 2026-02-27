# News Blog Frontend

A professional React-based frontend for the News Blog application with secure authentication and role-based access control.

## Features

### 🔐 Authentication System

- **Professional Login/Register Forms**: Clean, modern UI with smooth animations
- **Secure API Integration**: JWT token-based authentication with automatic token refresh
- **Role-Based Access Control**: Support for admin, moderator, author, and viewer roles
- **Form Validation**: Client-side and server-side validation with real-time feedback
- **Password Security**: Show/hide password functionality and strength validation

### 🎨 Modern UI/UX

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Animated Backgrounds**: Beautiful gradient animations for visual appeal
- **Loading States**: Proper loading indicators and error handling
- **Smooth Transitions**: Form transitions and hover effects

### 🛡️ Security Features

- **Protected Routes**: Role-based route protection
- **Automatic Token Refresh**: Seamless user experience with token renewal
- **Secure Storage**: JWT tokens stored securely with httpOnly cookies
- **Rate Limiting Support**: Built-in support for backend rate limiting
- **Error Handling**: Comprehensive error handling for network and auth issues

## Project Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx          # Professional login form
│   │   └── RegisterForm.jsx       # User registration form
│   └── common/
│       └── ProtectedRoute.jsx     # Route protection component
├── hooks/
│   └── useAuth.js                 # Authentication hook
├── pages/
│   └── AuthPage.jsx               # Main authentication page
├── services/
│   └── authService.js             # API service for authentication
├── App.jsx                        # Main app component with routing
├── main.jsx                       # App entry point
└── index.css                      # Global styles with Tailwind
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Backend URL

Update the backend URL in `src/services/authService.js`:

```javascript
const api = axios.create({
  baseURL: 'http://localhost:5000/api/auth', // Update this to your backend URL
  // ... other config
});
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Access the Application

- Open your browser to `http://localhost:5173`
- You'll be redirected to the authentication page
- Register a new account or login with existing credentials

## Authentication Flow

### Login Process

1. User enters username/email and password
2. Client validates input and sends request to backend
3. Backend validates credentials and returns JWT token
4. Token is stored securely in localStorage and httpOnly cookies
5. User is redirected based on their role:
   - **Admin**: `/admin/dashboard`
   - **Other roles**: `/dashboard`

### Registration Process

1. User fills out registration form with validation
2. Client validates all fields (username, email, password, names)
3. Backend creates new user account
4. User is automatically logged in and redirected

### Role-Based Access

- **Public Routes**: `/auth`, `/unauthorized`
- **Protected Routes**: `/dashboard` (all authenticated users)
- **Admin Routes**: `/admin/dashboard` (admin role only)

## API Integration

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Token refresh
- `GET /api/auth/me` - Get current user profile

### Request Headers

All authenticated requests include:

```javascript
Authorization: Bearer <jwt-token>
```

### Error Handling

- **401 Unauthorized**: Automatic token refresh attempt
- **429 Rate Limited**: User-friendly rate limiting message
- **500 Server Error**: Generic server error handling
- **Network Errors**: Connection issue notifications

## Form Validation

### Login Form

- Username/email: Required, minimum 3 characters
- Password: Required, minimum 6 characters

### Registration Form

- Username: 3-30 characters, alphanumeric + underscores only
- Email: Valid email format required
- Password: Minimum 6 characters
- Confirm Password: Must match password
- First/Last Name: Required, 1-50 characters

## Security Considerations

### Token Management

- JWT tokens stored in localStorage for API requests
- HttpOnly cookies used for additional security
- Automatic token refresh on 401 responses
- Secure logout clears all stored tokens

### CORS Configuration

Backend should be configured with appropriate CORS settings:

```javascript
credentials: true, // Allow cookies
origin: ['http://localhost:5173'], // Frontend URL
```

### Environment Variables

Create a `.env` file for configuration:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=News Blog
```

## Customization

### Styling

- Built with Tailwind CSS for easy customization
- Custom animations defined in AuthPage component
- Responsive design with mobile-first approach

### Adding New Roles

1. Update `useAuth.js` hook with new role checks
2. Add new protected routes in `App.jsx`
3. Update backend role validation

### Custom Validation

Modify validation functions in form components:

```javascript
const validateForm = () => {
  // Add your custom validation logic
};
```

## Development Notes

### State Management

- Uses React hooks for local state management
- Custom `useAuth` hook for authentication state
- No external state management library needed

### Performance

- Lazy loading can be implemented for route components
- Form validation is debounced to prevent excessive API calls
- Token refresh is handled automatically

### Testing

To add tests, install testing dependencies:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

## Troubleshooting

### Blank page on first load / "Expected a JavaScript module but server responded with MIME type text/html"

This happens when the server returns `index.html` for JS/CSS asset requests (e.g. after a deploy or due to SPA fallback rules).

- **In-app fix**: The app shows a "Reload page" message after a few seconds and can auto-reload once. Use a hard refresh (Ctrl+Shift+R / Cmd+Shift+R) if needed.
- **Server fix (recommended)**:
  - Serve built files from `dist/` so that requests to `/assets/*.js` and `*.css` return the real files with `Content-Type: application/javascript` and `text/css`.
  - Apply SPA fallback (rewrite to `index.html`) only for routes that do **not** look like static assets (e.g. do not rewrite paths starting with `/assets/` or containing `.js`/`.css`).
  - **Nginx**: Use `try_files $uri $uri/ /index.html;` but ensure `location /assets/` serves from `dist/assets` with correct types.
  - **Vercel/Netlify**: Use the framework’s default for Vite so asset paths are served correctly.

### Common Issues

**CORS Errors**

- Ensure backend CORS is configured correctly
- Check that `withCredentials: true` is set in axios config

**Token Refresh Failures**

- Verify refresh token endpoint is implemented in backend
- Check token expiration times in backend configuration

**Route Protection Not Working**

- Ensure `useAuth` hook is properly initialized
- Check that tokens are being stored correctly

**Styling Issues**

- Verify Tailwind CSS is properly configured
- Check that all required classes are available

## Backend Requirements

Your backend should implement:

- JWT token generation and validation
- User authentication endpoints
- Role-based authorization
- Rate limiting middleware
- CORS configuration with credentials support

## License

This project is part of the News Blog application. See the main project README for license information.
