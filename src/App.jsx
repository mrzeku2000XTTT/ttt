import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import HworkPage from './pages/Hwork';
import XunhuaPage from './pages/Xunhua';
import ValorantArenaPage from './pages/ValorantArena';
import FreedomPage from './pages/Freedom';
import VoxaPage from './pages/Voxa';
import DAGVisualizerPage from './pages/DAGVisualizer';
import PromptPage from './pages/Prompto';
import CinekasPage from './pages/Cinemata';
import SpeedPage from './pages/Speed';
import FarlandsPage from './pages/Farlands';
import V1Page from './pages/V1';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/Xunhua" element={<XunhuaPage />} />
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).filter(([path]) => path !== 'Xunhua').map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/Hwork" element={<HworkPage />} />
      <Route path="/Voxa" element={<VoxaPage />} />
      <Route path="/Freedom" element={<FreedomPage />} />
      <Route path="/DAGVisualizer" element={<DAGVisualizerPage />} />
      <Route path="/Prompto" element={<PromptPage />} />
      <Route path="/Cinekas" element={<CinekasPage />} />
      <Route path="/Speed" element={<SpeedPage />} />
      <Route path="/Farlands" element={<FarlandsPage />} />
      <Route path="/v1" element={<V1Page />} />
      <Route path="/ValorantArena" element={<ValorantArenaPage />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App