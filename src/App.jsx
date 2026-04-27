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
import KlockPage from './pages/Klock';
import StakeDAGPage from './pages/StakeDAG';
import SecurityAuditPage from './pages/SecurityAudit';
import CanvasPage from './pages/Canvas';
import HikaruPage from './pages/Hikaru';
import TTTV2Page from './pages/TTTV2';
import WhatIsKaspaPage from './pages/WhatIsKaspa';
import ExplorePage from './pages/Explore';
import AppStoreV2Page from './pages/AppStoreV2';
import UIClonerPage from './pages/UICloner';
import KrustPage from './pages/Krust';
import HaruPage from './pages/Haru';
import HiroPage from './pages/Hiro';
import NEPUPage from './pages/NEPU';
import TELEPage from './pages/TELE';
import RMXPage from './pages/RMX';
import ImageHistoryPage from './pages/ImageHistory';
import OneShotStudioPage from './pages/OneShotStudio';
import SlideDeckBuilderPage from './pages/SlideDeckBuilder';
import AuthRedirect from './pages/AuthRedirect';
import MotionPage from './pages/Motion';
import NODAPage from './pages/NODA';
import LaunchBrandPage from './pages/LaunchBrand';
import KaSshiPlayer from './components/KaSshiPlayer';

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
      <Route path="/" element={<TTTV2Page />} />
      <Route path="/Home" element={
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
      <Route path="/Klock" element={<KlockPage />} />
      <Route path="/StakeDAG" element={<StakeDAGPage />} />
      <Route path="/SecurityAudit" element={<SecurityAuditPage />} />
      <Route path="/Canvas" element={<CanvasPage />} />
      <Route path="/Hikaru" element={<HikaruPage />} />
      <Route path="/TTTV2" element={<TTTV2Page />} />
      <Route path="/WhatIsKaspa" element={<WhatIsKaspaPage />} />
      <Route path="/Explore" element={<ExplorePage />} />
      <Route path="/AppStoreV2" element={<AppStoreV2Page />} />
      <Route path="/ValorantArena" element={<ValorantArenaPage />} />
      <Route path="/UICloner" element={<UIClonerPage />} />
      <Route path="/OneShotStudio" element={<OneShotStudioPage />} />
      <Route path="/SlideDeckBuilder" element={<SlideDeckBuilderPage />} />
      <Route path="/Krust" element={<KrustPage />} />
      <Route path="/Haru" element={<HaruPage />} />
      <Route path="/Hiro" element={<HiroPage />} />
      <Route path="/NEPU" element={<NEPUPage />} />
      <Route path="/TELE" element={<TELEPage />} />
      <Route path="/RMX" element={<ImageHistoryPage />} />
      <Route path="/RMXWorkflow" element={<RMXPage />} />
      <Route path="/Motion" element={<MotionPage />} />
      <Route path="/NODA" element={<NODAPage />} />
      <Route path="/LaunchBrand" element={<LaunchBrandPage />} />
      <Route path="/login" element={<AuthRedirect />} />
      <Route path="/Login" element={<AuthRedirect />} />
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
          <KaSshiPlayer />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App