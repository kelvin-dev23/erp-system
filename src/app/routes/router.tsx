import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";

import { Customers } from "../../pages/Customers";
import { Dashboard } from "../../pages/Dashboard";
import { Login } from "../../pages/Login";
import { Orders } from "../../pages/Orders";
import { Products } from "../../pages/Products";
import { Reports } from "../../pages/Reports";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },

  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "products", element: <Products /> },
      { path: "customers", element: <Customers /> },
      { path: "orders", element: <Orders /> },
      { path: "/reports", element: <Reports /> },
    ],
  },

  { path: "*", element: <Navigate to="/login" replace /> },
]);
