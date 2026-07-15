import './App.css'
import React from 'react';
import WalletLockGate from '@/components/wallet/WalletLockGate';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import TitleManager from '@/lib/TitleManager'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import HworkPage from './pages/Hwork';
import XunhuaPage from './pages/Xunhua';
import ValorantArenaPage from './pages/ValorantArena';
import ValorantRangePage from './pages/ValorantRange';
import FreedomPage from './pages/Freedom';
import VoxaPage from './pages/Voxa';
import VoxaLearnPage from './pages/VoxaLearn';
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
import TTTV3Page from './pages/TTTV3';
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
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ForgotPasswordPage from './pages/ForgotPassword';
import ResetPasswordPage from './pages/ResetPassword';
import MotionPage from './pages/Motion';
import MotionLandingPage from './pages/MotionLanding';
import MotionIdeasPage from './pages/MotionIdeas';
import MotionPromptsPage from './pages/MotionPrompts';
import NODAPage from './pages/NODA';
import NODALandingPage from './pages/NODALanding';
import LaunchBrandPage from './pages/LaunchBrand';
import APEXPage from './pages/APEX';
import MIRAGEPage from './pages/MIRAGE';
import MIRAGEStudioPage from './pages/MIRAGEStudio';
import TTTGatePage from './pages/TTTGate';
import TTTLandingPage from './pages/TTTLanding';
import UltraMockPage from './pages/UltraMock';
import KatagamiPage from './pages/Katagami';
import DoomPage from './pages/Doom';
import BeatCutPage from './pages/BeatCut';
import TrinityPage from './pages/Trinity';
import KinePage from './pages/Kine';
import AIAgentHubPage from './pages/AIAgentHub';
import FrameZPage from './pages/FrameZ';
import DocsPage from './pages/Docs';
import ThumbnailCreatorPage from './pages/ThumbnailCreator';
import QuickStoryboardPage from './pages/QuickStoryboard';
import StoryboardStylesPage from './pages/StoryboardStyles';
import StoryboardPresetsPage from './pages/StoryboardPresets';
import StoryboardProjectsPage from './pages/StoryboardProjects';
import StoryboardBRollPage from './pages/StoryboardBRoll';
import StoryboardThemePage from './pages/StoryboardTheme';
import MoodBoardPage from './pages/MoodBoard';
import AboutPage from './pages/About';
import WalletHubPage from './pages/WalletHub';
import KasthleticsPage from './pages/Kasthletics';
import MetaMimicPage from './pages/MetaMimic';
import ARCPage from './pages/ARC';
import DoubleOPage from './pages/DoubleO';
import DoubleONotesPage from './pages/DoubleONotes';
import DoubleOWorkshopPage from './pages/DoubleOWorkshop';
import WorldWalkerPage from './pages/WorldWalker';
import MotionFlyPage from './pages/MotionFly';
import ORINLandingPage from './pages/ORINLanding';
import ORINPage from './pages/ORIN';
import PingguoPage from './pages/Pingguo';
import ORBTPage from './pages/ORBT';
import VideoStudioPage from './pages/VideoStudio';
import TTTBuilderPage from './pages/TTTBuilder';
import TTTOSPage from './pages/TTTOS';
import GhostFrameLandingPage from './pages/GhostFrameLanding';
import GhostFrameStudioPage from './pages/GhostFrameStudio';
import TipPageComponent from './pages/TipPage';
import HirePage from './pages/Hire';
import NodePage from './pages/Node';
import PortalPage from './pages/Portal';
import WorldOfAIPage from './pages/WorldOfAI';
import WorldOfKaspaPage from './pages/WorldOfKaspa';
import KaSshiPlayer from './components/KaSshiPlayer';
import KaspaForgePage from './pages/KaspaForge';
import CommunityHubPage from './pages/CommunityHub';
import TTTZWalletPage from './pages/TTTZWallet';
import ScenarioBotPage from './pages/ScenarioBot';
import SuperZKPage from './pages/SuperZK';
import KasBillboardPage from './pages/KasBillboard';
import KasSwordPage from './pages/KasSword';
import VisionPage from './pages/Vision';
import TTT3ManifestoPDFPage from './pages/TTT3ManifestoPDF';
import AgenticWorldPage from './pages/AgenticWorld';
import KaspaNationsPage from './pages/KaspaNations';
import KaspaNationPage from './pages/KaspaNation';
import KascovPage from './pages/Kascov';
import ClipWhileLivePage from './pages/ClipWhileLive';
import KlipzPage from './pages/Klipz';
import IgraHorizonPage from './pages/IgraHorizon';
import IgraAgentPage from './pages/IgraAgent';
import AporiaDEXPage from './pages/AporiaDEX';
import KaspaCommandPage from './pages/KaspaCommand';
import KCCPage from './pages/KCC';
import KCCNftPage from './pages/KCCNft';
import AWAPage from './pages/AWA';
import TreePage from './pages/Tree';
import KuttPage from './pages/Kutt';
import SectorVIPage from './pages/SectorVI';
import Sector6Page from './pages/Sector6';

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
      // Public app: do NOT force-redirect unauthenticated visitors (that caused
      // an infinite /login refresh loop). Just render the app as a guest.
      // Login is available via the explicit Login buttons in the UI.
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/Xunhua" element={<XunhuaPage />} />
      <Route path="/" element={<TTTLandingPage />} />
      <Route path="/TTTGate" element={<TTTGatePage />} />
      <Route path="/Home" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Pages['Wallet'] && (
        <Route path="/Wallet" element={
          <LayoutWrapper currentPageName="Wallet">
            <WalletLockGate>
              {React.createElement(Pages['Wallet'])}
            </WalletLockGate>
          </LayoutWrapper>
        } />
      )}
      {Object.entries(Pages).filter(([path]) => path !== 'Xunhua' && path !== 'Wallet').map(([path, Page]) => (
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
      <Route path="/VoxaLearn" element={<VoxaLearnPage />} />
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
      <Route path="/TTTV3" element={<TTTV3Page />} />
      <Route path="/WhatIsKaspa" element={<WhatIsKaspaPage />} />
      <Route path="/Explore" element={<ExplorePage />} />
      <Route path="/AppStoreV2" element={<AppStoreV2Page />} />
      <Route path="/ValorantArena" element={<ValorantArenaPage />} />
      <Route path="/ValorantRange" element={<ValorantRangePage />} />
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
      <Route path="/Motion" element={<MotionLandingPage />} />
      <Route path="/MotionStudio" element={<MotionPage />} />
      <Route path="/MotionIdeas" element={<MotionIdeasPage />} />
      <Route path="/MotionPrompts" element={<MotionPromptsPage />} />
      <Route path="/NODA" element={<NODALandingPage />} />
      <Route path="/NODAStudio" element={<NODAPage />} />
      <Route path="/LaunchBrand" element={<LaunchBrandPage />} />
      <Route path="/APEX" element={<APEXPage />} />
      <Route path="/MIRAGE" element={<MIRAGEPage />} />
      <Route path="/MIRAGEStudio" element={<MIRAGEStudioPage />} />
      <Route path="/UltraMock" element={<UltraMockPage />} />
      <Route path="/Doom" element={<DoomPage />} />
      <Route path="/BeatCut" element={<BeatCutPage />} />
      <Route path="/Trinity" element={<TrinityPage />} />
      <Route path="/Kine" element={<KinePage />} />
      <Route path="/AIAgentHub" element={<AIAgentHubPage />} />
      <Route path="/AgentHub" element={<AIAgentHubPage />} />
      <Route path="/FrameZ" element={<FrameZPage />} />
      <Route path="/ThumbnailCreator" element={<ThumbnailCreatorPage />} />
      <Route path="/QuickStoryboard" element={<QuickStoryboardPage />} />
      <Route path="/StoryboardStyles" element={<StoryboardStylesPage />} />
      <Route path="/StoryboardPresets" element={<StoryboardPresetsPage />} />
      <Route path="/StoryboardProjects" element={<StoryboardProjectsPage />} />
      <Route path="/StoryboardBRoll" element={<StoryboardBRollPage />} />
      <Route path="/StoryboardTheme" element={<StoryboardThemePage />} />
      <Route path="/MoodBoard" element={<MoodBoardPage />} />
      <Route path="/About" element={<AboutPage />} />
      <Route path="/WalletHub" element={<WalletLockGate><WalletHubPage /></WalletLockGate>} />
      <Route path="/Kasthletics" element={<KasthleticsPage />} />
      <Route path="/MetaMimic" element={<MetaMimicPage />} />
      <Route path="/ARC" element={<ARCPage />} />
      <Route path="/DoubleO" element={<DoubleOPage />} />
      <Route path="/DoubleONotes" element={<DoubleONotesPage />} />
      <Route path="/DoubleOWorkshop" element={<DoubleOWorkshopPage />} />
      <Route path="/WorldWalker" element={<WorldWalkerPage />} />
      <Route path="/MotionFly" element={<MotionFlyPage />} />
      <Route path="/ORINLanding" element={<ORINLandingPage />} />
      <Route path="/ORIN" element={<ORINPage />} />
      <Route path="/Pingguo" element={<PingguoPage />} />
      <Route path="/ORBT" element={<ORBTPage />} />
      <Route path="/VideoStudio" element={<VideoStudioPage />} />
      <Route path="/TTTBuilder" element={<TTTBuilderPage />} />
      <Route path="/TTTOS" element={<TTTOSPage />} />
      <Route path="/GhostFrame" element={<GhostFrameLandingPage />} />
      <Route path="/GhostFrameStudio" element={<GhostFrameStudioPage />} />
      <Route path="/Tip" element={<TipPageComponent />} />
      <Route path="/Portal" element={<PortalPage />} />
      <Route path="/WorldOfAI" element={<WorldOfAIPage />} />
      <Route path="/WorldOfKaspa" element={<WorldOfKaspaPage />} />
      <Route path="/Hire" element={<HirePage />} />
      <Route path="/KaspaForge" element={<KaspaForgePage />} />
      <Route path="/CommunityHub" element={<CommunityHubPage />} />
      <Route path="/TTTZWallet" element={<TTTZWalletPage />} />
      <Route path="/ScenarioBot" element={<ScenarioBotPage />} />
      <Route path="/SuperZK" element={<SuperZKPage />} />
      <Route path="/KCC" element={<KCCPage />} />
      <Route path="/KCCNft" element={<KCCNftPage />} />
      <Route path="/KasBillboard" element={<KasBillboardPage />} />
      <Route path="/KasSword" element={<KasSwordPage />} />
      <Route path="/Vision" element={<VisionPage />} />
      <Route path="/TTT3Manifesto" element={<TTT3ManifestoPDFPage />} />
      <Route path="/AgenticWorld" element={<AgenticWorldPage />} />
      <Route path="/AWA" element={<AWAPage />} />
      <Route path="/Tree" element={<TreePage />} />
      <Route path="/Kutt" element={<KuttPage />} />
      <Route path="/SectorVI" element={<SectorVIPage />} />
      <Route path="/Sector6" element={<Sector6Page />} />
      <Route path="/KaspaCommand" element={<KaspaCommandPage />} />
      <Route path="/KaspaNations" element={<KaspaNationsPage />} />
      <Route path="/KaspaNations/:slug" element={<KaspaNationPage />} />
      <Route path="/Kascov" element={<KascovPage />} />
      <Route path="/ClipWhileLive" element={<ClipWhileLivePage />} />
      <Route path="/Klipz" element={<KlipzPage />} />
      <Route path="/IgraHorizon" element={<IgraHorizonPage />} />
      <Route path="/IgraAgent" element={<IgraAgentPage />} />
      <Route path="/DEX" element={<AporiaDEXPage />} />
      <Route path="/Aporia" element={<AporiaDEXPage />} />
      <Route path="/Node" element={
        <LayoutWrapper currentPageName="Node">
          <NodePage />
        </LayoutWrapper>
      } />
      <Route path="/Docs" element={
        <LayoutWrapper currentPageName="Docs">
          <DocsPage />
        </LayoutWrapper>
      } />
      <Route path="/Katagami" element={
        <LayoutWrapper currentPageName="Katagami">
          <KatagamiPage />
        </LayoutWrapper>
      } />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/Login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
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
          <TitleManager />
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