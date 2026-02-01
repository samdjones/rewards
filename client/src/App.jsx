import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import FamilyGuard from "./components/FamilyGuard";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FamilySetupPage from "./pages/FamilySetupPage";
import FamilySettingsPage from "./pages/FamilySettingsPage";
import Dashboard from "./pages/Dashboard";
import KidsPage from "./pages/KidsPage";
import TasksPage from "./pages/TasksPage";
import RewardsPage from "./pages/RewardsPage";
import ChildDetailPage from "./pages/ChildDetailPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/family/setup"
              element={
                <ProtectedRoute>
                  <FamilySetupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/family/settings"
              element={
                <FamilyGuard>
                  <FamilySettingsPage />
                </FamilyGuard>
              }
            />
            <Route
              path="/"
              element={
                <FamilyGuard>
                  <Dashboard />
                </FamilyGuard>
              }
            />
            <Route
              path="/kids"
              element={
                <FamilyGuard>
                  <KidsPage />
                </FamilyGuard>
              }
            />
            <Route
              path="/tasks"
              element={
                <FamilyGuard>
                  <TasksPage />
                </FamilyGuard>
              }
            />
            <Route
              path="/rewards"
              element={
                <FamilyGuard>
                  <RewardsPage />
                </FamilyGuard>
              }
            />
            <Route
              path="/children/:id"
              element={
                <FamilyGuard>
                  <ChildDetailPage />
                </FamilyGuard>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
