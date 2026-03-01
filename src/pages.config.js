/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIAnalytics from './pages/AIAnalytics';
import AK from './pages/AK';
import ALPHA from './pages/ALPHA';
import APIDocumentation from './pages/APIDocumentation';
import AYOMUIZ from './pages/AYOMUIZ';
import AYOMUIZ2 from './pages/AYOMUIZ2';
import AYOMUIZHub from './pages/AYOMUIZHub';
import About from './pages/About';
import AgentFYE from './pages/AgentFYE';
import AgentZK from './pages/AgentZK';
import AgentZK2 from './pages/AgentZK2';
import AgentZKChat from './pages/AgentZKChat';
import AgentZKDirectory from './pages/AgentZKDirectory';
import AgentZKProfile from './pages/AgentZKProfile';
import Analytics from './pages/Analytics';
import AppStore from './pages/AppStore';
import Arcade from './pages/Arcade';
import Area51 from './pages/Area51';
import Arhtuun from './pages/Arhtuun';
import Articles from './pages/Articles';
import AuraDashboard from './pages/AuraDashboard';
import B44Prompts from './pages/B44Prompts';
import BMTUniv from './pages/BMTUniv';
import BRAHIM from './pages/BRAHIM';
import BRAHIMHub from './pages/BRAHIMHub';
import BackgroundGenerator from './pages/BackgroundGenerator';
import Bible from './pages/Bible';
import BingoLobbyBrowser from './pages/BingoLobbyBrowser';
import BingoLobbyPlay from './pages/BingoLobbyPlay';
import BingoLobbyRoom from './pages/BingoLobbyRoom';
import BlockRun from './pages/BlockRun';
import Bridge from './pages/Bridge';
import Browser from './pages/Browser';
import BuildGuide from './pages/BuildGuide';
import Builders from './pages/Builders';
import BullMoon from './pages/BullMoon';
import Calculator from './pages/Calculator';
import Career from './pages/Career';
import CargoWays from './pages/CargoWays';
import Cart from './pages/Cart';
import Categories from './pages/Categories';
import Champions from './pages/Champions';
import Channel from './pages/Channel';
import Channels from './pages/Channels';
import CivicVerify from './pages/CivicVerify';
import CoinSpace from './pages/CoinSpace';
import ConnectWallet from './pages/ConnectWallet';
import Contact from './pages/Contact';
import ContributorHistory from './pages/ContributorHistory';
import CosmicEye from './pages/CosmicEye';
import Countdown from './pages/Countdown';
import CountryDetail from './pages/CountryDetail';
import Courses from './pages/Courses';
import CreateListing from './pages/CreateListing';
import CreateShopListing from './pages/CreateShopListing';
import Creator from './pages/Creator';
import CreditCode from './pages/CreditCode';
import CryptoHire from './pages/CryptoHire';
import DAGFeed from './pages/DAGFeed';
import DAGKnightWallet from './pages/DAGKnightWallet';
import DGT from './pages/DGT';
import DateNight from './pages/DateNight';
import DeployContract from './pages/DeployContract';
import DevProfile from './pages/DevProfile';
import Docs from './pages/Docs';
import Duel from './pages/Duel';
import DuelLobby from './pages/DuelLobby';
import ESC from './pages/ESC';
import Earth from './pages/Earth';
import Echo from './pages/Echo';
import EditListing from './pages/EditListing';
import EmployerTask from './pages/EmployerTask';
import Enoch from './pages/Enoch';
import Explorer from './pages/Explorer';
import FHZ from './pages/FHZ';
import Feed from './pages/Feed';
import FluxKmail from './pages/FluxKmail';
import Focus from './pages/Focus';
import Gate from './pages/Gate';
import Gift from './pages/Gift';
import GlobalHistory from './pages/GlobalHistory';
import God from './pages/God';
import GridSplit from './pages/GridSplit';
import Guide from './pages/Guide';
import HAYPHASE from './pages/HAYPHASE';
import HYPEMIND from './pages/HYPEMIND';
import Hercules from './pages/Hercules';
import History from './pages/History';
import Home from './pages/Home';
import Hub from './pages/Hub';
import IOS from './pages/IOS';
import IWork from './pages/IWork';
import ImageHistory from './pages/ImageHistory';
import Jobs from './pages/Jobs';
import JustDance from './pages/JustDance';
import KASBOOKS from './pages/KASBOOKS';
import KASBridge from './pages/KASBridge';
import KASIA from './pages/KASIA';
import KASari from './pages/KASari';
import KCbridge from './pages/KCbridge';
import KFlow from './pages/KFlow';
import KGigZ from './pages/KGigZ';
import KP from './pages/KP';
import KPaint from './pages/KPaint';
import KUniversity from './pages/KUniversity';
import KWSuccess from './pages/KWSuccess';
import KaShop from './pages/KaShop';
import KaSkool from './pages/KaSkool';
import KaSkoolProfile from './pages/KaSkoolProfile';
import KasCompute from './pages/KasCompute';
import KasFans from './pages/KasFans';
import KasLens from './pages/KasLens';
import KasPlay from './pages/KasPlay';
import Kasdate from './pages/Kasdate';
import Kasmi from './pages/Kasmi';
import KaspaBalanceViewer from './pages/KaspaBalanceViewer';
import KaspaHub from './pages/KaspaHub';
import KaspaLFG from './pages/KaspaLFG';
import KaspaLocal from './pages/KaspaLocal';
import KaspaNode from './pages/KaspaNode';
import KaspaNodeMap from './pages/KaspaNodeMap';
import KaspaSTORE from './pages/KaspaSTORE';
import KaspaTTT from './pages/KaspaTTT';
import Kasplore from './pages/Kasplore';
import Kehinde from './pages/Kehinde';
import Keystone from './pages/Keystone';
import KnowledgeBase from './pages/KnowledgeBase';
import Kolade from './pages/Kolade';
import Konekt from './pages/Konekt';
import Ksocial from './pages/Ksocial';
import Kurncy from './pages/Kurncy';
import Kurve from './pages/Kurve';
import LLMScraper from './pages/LLMScraper';
import Landing from './pages/Landing';
import LearnMore from './pages/LearnMore';
import Learning from './pages/Learning';
import Life from './pages/Life';
import LinkChecker from './pages/LinkChecker';
import Lobby from './pages/Lobby';
import MMN from './pages/MMN';
import MODZ from './pages/MODZ';
import MODZHub from './pages/MODZHub';
import Machine from './pages/Machine';
import MarketX from './pages/MarketX';
import Marketplace from './pages/Marketplace';
import Matrix from './pages/Matrix';
import MobileTest from './pages/MobileTest';
import Movies from './pages/Movies';
import MyChannel from './pages/MyChannel';
import NASA from './pages/NASA';
import NFTMint from './pages/NFTMint';
import Nextdoor from './pages/Nextdoor';
import Olatomiwa from './pages/Olatomiwa';
import OlatomiwaHub from './pages/OlatomiwaHub';
import OliviaApps from './pages/OliviaApps';
import OnChainPOS from './pages/OnChainPOS';
import Oracle from './pages/Oracle';
import OriginStory from './pages/OriginStory';
import OuTKasTT from './pages/OuTKasTT';
import POLFeed from './pages/POLFeed';
import Peculiar from './pages/Peculiar';
import Pera from './pages/Pera';
import Poki from './pages/Poki';
import Privacy from './pages/Privacy';
import Profile from './pages/Profile';
import ProofOfBullish from './pages/ProofOfBullish';
import QRScanner from './pages/QRScanner';
import Receive from './pages/Receive';
import RegisterBusiness from './pages/RegisterBusiness';
import RegisterCreditCode from './pages/RegisterCreditCode';
import RegisterTTTID from './pages/RegisterTTTID';
import Resonance from './pages/Resonance';
import SIMPLE from './pages/SIMPLE';
import SSHManager from './pages/SSHManager';
import SWAN from './pages/SWAN';
import SalvationStory from './pages/SalvationStory';
import SealedWalletDetails from './pages/SealedWalletDetails';
import Seeles from './pages/Seeles';
import SendTip from './pages/SendTip';
import Settings from './pages/Settings';
import SharedCart from './pages/SharedCart';
import ShiLLz from './pages/ShiLLz';
import Shill from './pages/Shill';
import Shop from './pages/Shop';
import ShopItemView from './pages/ShopItemView';
import Singularity from './pages/Singularity';
import St from './pages/St';
import StateOfMind from './pages/StateOfMind';
import Subscription from './pages/Subscription';
import TD from './pages/TD';
import TTT from './pages/TTT';
import TTTAudit from './pages/TTTAudit';
import TTTClassic from './pages/TTTClassic';
import TTTIDProfile from './pages/TTTIDProfile';
import TTTProfile from './pages/TTTProfile';
import TTTWallet from './pages/TTTWallet';
import Taiwo from './pages/Taiwo';
import TapToTip from './pages/TapToTip';
import TemplateBuilder from './pages/TemplateBuilder';
import Terms from './pages/Terms';
import Terra from './pages/Terra';
import TestJobAPI from './pages/TestJobAPI';
import TestKaspaAPI from './pages/TestKaspaAPI';
import TestZelcore from './pages/TestZelcore';
import TetrisBattle from './pages/TetrisBattle';
import TheRealm from './pages/TheRealm';
import TikTokWorkflow from './pages/TikTokWorkflow';
import Timer from './pages/Timer';
import Tools from './pages/Tools';
import TradeView from './pages/TradeView';
import TransportProtocol from './pages/TransportProtocol';
import Truman from './pages/Truman';
import TruthLanding from './pages/TruthLanding';
import UNI from './pages/UNI';
import UserProfile from './pages/UserProfile';
import VPImport from './pages/VPImport';
import VProgs from './pages/VProgs';
import Valorant from './pages/Valorant';
import Vault from './pages/Vault';
import Veritas from './pages/Veritas';
import Vibe from './pages/Vibe';
import VibeSession from './pages/VibeSession';
import VibeSetup from './pages/VibeSetup';
import VibeWallet from './pages/VibeWallet';
import VoxInvicta from './pages/VoxInvicta';
import Waitlist from './pages/Waitlist';
import Wallet from './pages/Wallet';
import Window from './pages/Window';
import WorkerTask from './pages/WorkerTask';
import X from './pages/X';
import XYZ from './pages/XYZ';
import Xunhua from './pages/Xunhua';
import ZKVault from './pages/ZKVault';
import ZKWallet from './pages/ZKWallet';
import ZekuAI from './pages/ZekuAI';
import Zelcore from './pages/Zelcore';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAnalytics": AIAnalytics,
    "AK": AK,
    "ALPHA": ALPHA,
    "APIDocumentation": APIDocumentation,
    "AYOMUIZ": AYOMUIZ,
    "AYOMUIZ2": AYOMUIZ2,
    "AYOMUIZHub": AYOMUIZHub,
    "About": About,
    "AgentFYE": AgentFYE,
    "AgentZK": AgentZK,
    "AgentZK2": AgentZK2,
    "AgentZKChat": AgentZKChat,
    "AgentZKDirectory": AgentZKDirectory,
    "AgentZKProfile": AgentZKProfile,
    "Analytics": Analytics,
    "AppStore": AppStore,
    "Arcade": Arcade,
    "Area51": Area51,
    "Arhtuun": Arhtuun,
    "Articles": Articles,
    "AuraDashboard": AuraDashboard,
    "B44Prompts": B44Prompts,
    "BMTUniv": BMTUniv,
    "BRAHIM": BRAHIM,
    "BRAHIMHub": BRAHIMHub,
    "BackgroundGenerator": BackgroundGenerator,
    "Bible": Bible,
    "BingoLobbyBrowser": BingoLobbyBrowser,
    "BingoLobbyPlay": BingoLobbyPlay,
    "BingoLobbyRoom": BingoLobbyRoom,
    "BlockRun": BlockRun,
    "Bridge": Bridge,
    "Browser": Browser,
    "BuildGuide": BuildGuide,
    "Builders": Builders,
    "BullMoon": BullMoon,
    "Calculator": Calculator,
    "Career": Career,
    "CargoWays": CargoWays,
    "Cart": Cart,
    "Categories": Categories,
    "Champions": Champions,
    "Channel": Channel,
    "Channels": Channels,
    "CivicVerify": CivicVerify,
    "CoinSpace": CoinSpace,
    "ConnectWallet": ConnectWallet,
    "Contact": Contact,
    "ContributorHistory": ContributorHistory,
    "CosmicEye": CosmicEye,
    "Countdown": Countdown,
    "CountryDetail": CountryDetail,
    "Courses": Courses,
    "CreateListing": CreateListing,
    "CreateShopListing": CreateShopListing,
    "Creator": Creator,
    "CreditCode": CreditCode,
    "CryptoHire": CryptoHire,
    "DAGFeed": DAGFeed,
    "DAGKnightWallet": DAGKnightWallet,
    "DGT": DGT,
    "DateNight": DateNight,
    "DeployContract": DeployContract,
    "DevProfile": DevProfile,
    "Docs": Docs,
    "Duel": Duel,
    "DuelLobby": DuelLobby,
    "ESC": ESC,
    "Earth": Earth,
    "Echo": Echo,
    "EditListing": EditListing,
    "EmployerTask": EmployerTask,
    "Enoch": Enoch,
    "Explorer": Explorer,
    "FHZ": FHZ,
    "Feed": Feed,
    "FluxKmail": FluxKmail,
    "Focus": Focus,
    "Gate": Gate,
    "Gift": Gift,
    "GlobalHistory": GlobalHistory,
    "God": God,
    "GridSplit": GridSplit,
    "Guide": Guide,
    "HAYPHASE": HAYPHASE,
    "HYPEMIND": HYPEMIND,
    "Hercules": Hercules,
    "History": History,
    "Home": Home,
    "Hub": Hub,
    "IOS": IOS,
    "IWork": IWork,
    "ImageHistory": ImageHistory,
    "Jobs": Jobs,
    "JustDance": JustDance,
    "KASBOOKS": KASBOOKS,
    "KASBridge": KASBridge,
    "KASIA": KASIA,
    "KASari": KASari,
    "KCbridge": KCbridge,
    "KFlow": KFlow,
    "KGigZ": KGigZ,
    "KP": KP,
    "KPaint": KPaint,
    "KUniversity": KUniversity,
    "KWSuccess": KWSuccess,
    "KaShop": KaShop,
    "KaSkool": KaSkool,
    "KaSkoolProfile": KaSkoolProfile,
    "KasCompute": KasCompute,
    "KasFans": KasFans,
    "KasLens": KasLens,
    "KasPlay": KasPlay,
    "Kasdate": Kasdate,
    "Kasmi": Kasmi,
    "KaspaBalanceViewer": KaspaBalanceViewer,
    "KaspaHub": KaspaHub,
    "KaspaLFG": KaspaLFG,
    "KaspaLocal": KaspaLocal,
    "KaspaNode": KaspaNode,
    "KaspaNodeMap": KaspaNodeMap,
    "KaspaSTORE": KaspaSTORE,
    "KaspaTTT": KaspaTTT,
    "Kasplore": Kasplore,
    "Kehinde": Kehinde,
    "Keystone": Keystone,
    "KnowledgeBase": KnowledgeBase,
    "Kolade": Kolade,
    "Konekt": Konekt,
    "Ksocial": Ksocial,
    "Kurncy": Kurncy,
    "Kurve": Kurve,
    "LLMScraper": LLMScraper,
    "Landing": Landing,
    "LearnMore": LearnMore,
    "Learning": Learning,
    "Life": Life,
    "LinkChecker": LinkChecker,
    "Lobby": Lobby,
    "MMN": MMN,
    "MODZ": MODZ,
    "MODZHub": MODZHub,
    "Machine": Machine,
    "MarketX": MarketX,
    "Marketplace": Marketplace,
    "Matrix": Matrix,
    "MobileTest": MobileTest,
    "Movies": Movies,
    "MyChannel": MyChannel,
    "NASA": NASA,
    "NFTMint": NFTMint,
    "Nextdoor": Nextdoor,
    "Olatomiwa": Olatomiwa,
    "OlatomiwaHub": OlatomiwaHub,
    "OliviaApps": OliviaApps,
    "OnChainPOS": OnChainPOS,
    "Oracle": Oracle,
    "OriginStory": OriginStory,
    "OuTKasTT": OuTKasTT,
    "POLFeed": POLFeed,
    "Peculiar": Peculiar,
    "Pera": Pera,
    "Poki": Poki,
    "Privacy": Privacy,
    "Profile": Profile,
    "ProofOfBullish": ProofOfBullish,
    "QRScanner": QRScanner,
    "Receive": Receive,
    "RegisterBusiness": RegisterBusiness,
    "RegisterCreditCode": RegisterCreditCode,
    "RegisterTTTID": RegisterTTTID,
    "Resonance": Resonance,
    "SIMPLE": SIMPLE,
    "SSHManager": SSHManager,
    "SWAN": SWAN,
    "SalvationStory": SalvationStory,
    "SealedWalletDetails": SealedWalletDetails,
    "Seeles": Seeles,
    "SendTip": SendTip,
    "Settings": Settings,
    "SharedCart": SharedCart,
    "ShiLLz": ShiLLz,
    "Shill": Shill,
    "Shop": Shop,
    "ShopItemView": ShopItemView,
    "Singularity": Singularity,
    "St": St,
    "StateOfMind": StateOfMind,
    "Subscription": Subscription,
    "TD": TD,
    "TTT": TTT,
    "TTTAudit": TTTAudit,
    "TTTClassic": TTTClassic,
    "TTTIDProfile": TTTIDProfile,
    "TTTProfile": TTTProfile,
    "TTTWallet": TTTWallet,
    "Taiwo": Taiwo,
    "TapToTip": TapToTip,
    "TemplateBuilder": TemplateBuilder,
    "Terms": Terms,
    "Terra": Terra,
    "TestJobAPI": TestJobAPI,
    "TestKaspaAPI": TestKaspaAPI,
    "TestZelcore": TestZelcore,
    "TetrisBattle": TetrisBattle,
    "TheRealm": TheRealm,
    "TikTokWorkflow": TikTokWorkflow,
    "Timer": Timer,
    "Tools": Tools,
    "TradeView": TradeView,
    "TransportProtocol": TransportProtocol,
    "Truman": Truman,
    "TruthLanding": TruthLanding,
    "UNI": UNI,
    "UserProfile": UserProfile,
    "VPImport": VPImport,
    "VProgs": VProgs,
    "Valorant": Valorant,
    "Vault": Vault,
    "Veritas": Veritas,
    "Vibe": Vibe,
    "VibeSession": VibeSession,
    "VibeSetup": VibeSetup,
    "VibeWallet": VibeWallet,
    "VoxInvicta": VoxInvicta,
    "Waitlist": Waitlist,
    "Wallet": Wallet,
    "Window": Window,
    "WorkerTask": WorkerTask,
    "X": X,
    "XYZ": XYZ,
    "Xunhua": Xunhua,
    "ZKVault": ZKVault,
    "ZKWallet": ZKWallet,
    "ZekuAI": ZekuAI,
    "Zelcore": Zelcore,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};