# Pages

Page components organized by user role.

## Page Structure

### Root Pages
- **Dashboard.jsx** - Main dashboard (redirects by role)
- **Inventory.jsx** - Inventory management page
- **Landing.jsx** - Landing page
- **Login.jsx** - User login page
- **Register.jsx** - User registration page
- **Scan.jsx** - Food scanning page

### Role-Specific Pages

#### Admin Pages (`admin/`)
- Admin-specific dashboard and management pages

#### Consumer Pages (`consumer/`)
- Consumer-facing features and dashboards

#### Farmer Pages (`farmer/`)
- Farmer-specific tools and dashboards

#### Manager Pages (`manager/`)
- Manager-specific oversight and reporting pages

## Page Guidelines

### Creating New Pages
1. Place in appropriate role directory
2. Use page-level components for complex UIs
3. Implement proper loading and error states
4. Add route protection for authenticated pages
5. Include page metadata and titles

### Route Configuration
Routes are defined in `../AppRoutes.jsx`. When adding new pages:

1. Import the page component
2. Add route with appropriate path
3. Add authentication wrapper if needed
4. Test navigation and redirects

### Page Structure Example

```jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

const PageName = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Please log in</div>;
  }

  return (
    <div className="page-container">
      {/* Page content */}
    </div>
  );
};

export default PageName;
```

## Common Patterns

### Protected Pages
Wrap with authentication check:
```jsx
if (!user) return <Navigate to="/login" />;
```

### Loading States
Show loading indicator during data fetch:
```jsx
if (loading) return <LoadingSpinner />;
```

### Error Handling
Display error messages gracefully:
```jsx
if (error) return <ErrorMessage message={error} />;
```
