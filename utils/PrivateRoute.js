import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children, role }) => {
  const { currentUser, loading, role: userRole } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!currentUser) return <Navigate to='/login' />;
  if (role && userRole !== role) return <Navigate to='/' />;

  return children;
};

export default PrivateRoute;
