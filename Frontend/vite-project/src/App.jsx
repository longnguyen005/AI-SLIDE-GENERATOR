import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage/LandingPage';
import LoginPage from './pages/AuthPage/LoginPage';
import RegisterPage from './pages/AuthPage/RegisterPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import CreatePresentationPage from './pages/CreatePresentationPage/CreatePresentationPage';
import OutlinePage from './pages/OutlinePage/OutlinePage';
import PreviewPage from './pages/PreviewPage/PreviewPage';
import EditorPage from './pages/EditorPage/EditorPage';
import { getToken } from './service/apiClient';

function RequireAuth({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/create" element={<RequireAuth><CreatePresentationPage /></RequireAuth>} />
      <Route path="/presentations" element={<Navigate to="/dashboard" replace />} />
      <Route path="/outline" element={<Navigate to="/dashboard" replace />} />
      <Route path="/outline/:deckId" element={<RequireAuth><OutlinePage /></RequireAuth>} />
      <Route path="/preview" element={<Navigate to="/dashboard" replace />} />
      <Route path="/preview/:deckId" element={<RequireAuth><PreviewPage /></RequireAuth>} />
      <Route path="/editor" element={<Navigate to="/dashboard" replace />} />
      <Route path="/editor/:deckId" element={<RequireAuth><EditorPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
