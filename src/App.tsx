import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Toaster } from './components/ui/sonner';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';
import ProjectLayout from './components/layout/ProjectLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Dashboard Pages
import Home from './pages/dashboard/Home';
import Projects from './pages/dashboard/Projects';
import ProjectOverview from './pages/dashboard/ProjectOverview';
import SearchRequests from './pages/dashboard/SearchRequests';
import SearchHistory from './pages/dashboard/SearchHistory';
import ScrapedContent from './pages/dashboard/ScrapedContent';
import PostAnalysis from './pages/dashboard/PostAnalysis';
import VisualProposal from './pages/dashboard/VisualProposal';
import CreativeBrief from './pages/dashboard/CreativeBrief';
import ReportBuilder from './pages/dashboard/ReportBuilder';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuthStore();
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!session) {
    return <Navigate to="/auth/login" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Home />} />
          <Route path="projects" element={<Projects />} />
          
          {/* Project Specific Routes wrapped in ProjectLayout */}
          <Route path="projects/:id" element={<ProjectLayout />}>
            <Route index element={<ProjectOverview />} />
            <Route path="search" element={<SearchRequests />} />
            <Route path="search-history" element={<SearchHistory />} />
            <Route path="scraped-content" element={<ScrapedContent />} />
            <Route path="post-analysis" element={<PostAnalysis />} />
            <Route path="visual-proposal" element={<VisualProposal />} />
            <Route path="creative-brief" element={<CreativeBrief />} />
            <Route path="report" element={<ReportBuilder />} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
