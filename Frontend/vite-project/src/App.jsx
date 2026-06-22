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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/create" element={<CreatePresentationPage />} />
      <Route path="/outline" element={<OutlinePage />} />
      <Route path="/preview" element={<PreviewPage />} />
      <Route path="/editor" element={<EditorPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
