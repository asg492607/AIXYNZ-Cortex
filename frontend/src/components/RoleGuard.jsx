import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * RoleGuard conditionally renders children based on the user's role.
 * Roles: 'viewer' < 'analyst' < 'admin'
 */
const roleHierarchy = {
  admin: 3,
  analyst: 2,
  viewer: 1
};

export default function RoleGuard({ requiredRole = 'viewer', children, fallback = null }) {
  const { user } = useAuth();
  
  if (!user || !user.role) {
    return fallback;
  }

  const userLevel = roleHierarchy[user.role.toLowerCase()] || 0;
  const requiredLevel = roleHierarchy[requiredRole.toLowerCase()] || 1;

  if (userLevel >= requiredLevel) {
    return <>{children}</>;
  }

  return fallback;
}
