import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute - Guards dashboard routes so only authenticated users
 * with the correct role can access them.
 *
 * Props:
 *  - allowedRoles: string[] - roles permitted to access this route.
 *                             If empty/omitted, any authenticated user may access.
 *  - children: JSX element to render when access is granted.
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
  const location = useLocation();
  const userRole = localStorage.getItem('userRole');
  const userId   = localStorage.getItem('userId');

  // Not logged in → redirect to /login, remembering where they wanted to go
  if (!userRole || !userId) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wrong role → redirect to the dashboard that belongs to this user
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    const roleHome = {
      admin:     '/admin-dashboard',
      staff:     '/staff-dashboard',
      teacher:   '/staff-dashboard',
      doctor:    '/staff-dashboard',
      donor:     '/donor-dashboard',
      volunteer: '/volunteer-dashboard',
      child:     '/child-dashboard',
    };
    return <Navigate to={roleHome[userRole] || '/login'} replace />;
  }

  return children;
}
