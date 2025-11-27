import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Wrench, MessageSquare, Key, Save, Trash2, Plus, Eye, EyeOff, Send, Loader2, Settings, Zap, Lock, CheckCircle2, AlertCircle, Wallet, Code, Copy, RefreshCw, Clock, Search, Brain, ChevronDown, ChevronUp, Users, Bot, ShoppingBag, ShoppingCart, Upload, Image as ImageIcon, ExternalLink, Twitter, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from 'react-markdown';
import ShopWidget from "./ShopWidget";
import TTTVWidget from "./TTTVWidget";

const REPLIT_BASE_URL = 'https://tttxxx.live';

// Placeholder for createPageUrl if it's not defined elsewhere.
// In a real application, this would likely be provided by a routing library or framework.
const createPageUrl = (pageName, params = {}) => {
  let url = `/${pageName.toLowerCase()}`;
  const query = new URLSearchParams(params).toString();
  if (query) {
    url += `?${query}`;
  }
  return url;
};

export default function ToolsModal({ onClose, agentZKId }) {
  const [activeTab, setActiveTab] = useState('chat');
  const [secrets, setSecrets] = useState([]);
  const [newSecret, setNewSecret] = useState({ key: "", value: "", description: "" });
  const [isAddingSecret, setIsAddingSecret] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = new useState(new Set());
  const [isSaving, setIsSaving] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState(null);

  // API Key state
  const [apiKey, setApiKey] = useState(null);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [testWalletAddress, setTestWalletAddress] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false); // Renamed for clarity from copiedWalletAddress

  // UPDATED: Three separate iframe refs (matching test page)
  const zkCreateIframeRef = useRef(null);
  const zkImportIframeRef = useRef(null);
  const zkBalanceIframeRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // UPDATED: Separate ready states
  const [zkCreateReady, setZkCreateReady] = useState(false);
  const [zkImportReady, setZkImportReady] = useState(false);
  const [zkBalanceReady, setZkBalanceReady] = useState(false);
  
  const [walletMode, setWalletMode] = useState('list');
  const [importMnemonic, setImportMnemonic] = useState('');
  const [isProcessingWallet, setIsProcessingWallet] = useState(false);
  const [currentZKWallet, setCurrentZKWallet] = useState(null);
  const [zkBalance, setZKBalance] = useState(null);
  const [zkUtxos, setZKUtxos] = useState([]);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);

  // VP IMPORTS state
  const [vpBalance, setVpBalance] = useState(null);

  // NEW: Seed phrase for Agent AI linking
  const [agentSeedPhrase, setAgentSeedPhrase] = useState('');
  const [isLinkingWallet, setIsLinkingWallet] = useState(false);
  const [linkedWalletAddress, setLinkedWalletAddress] = useState(null); // This holds the 'primary' linked wallet address

  // NEW: Multiple linked wallets
  const [linkedWallets, setLinkedWallets] = useState([]);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [agentName, setAgentName] = useState('Agent ZK');

  // NEW: Status messages
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error' | 'info', text: string }

  // NEW: State for collapsible analysis cards
  const [collapsedAnalysis, setCollapsedAnalysis] = useState({});

  // NEW: Agent connection state
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectAddress, setConnectAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connections, setConnections] = useState([]);
  const [activeConnection, setActiveConnection] = useState(null);
  const [showConnectionsList, setShowConnectionsList] = useState(false);
  
  // NEW: Connection message input state
  const [connectionMessages, setConnectionMessages] = useState({}); // { [connectionId]: messageText }
  const [currentUser, setCurrentUser] = useState(null);

  // Shills state
  const [shills, setShills] = useState([]);
  const [newShill, setNewShill] = useState({ title: "", message: "", link: "" });
  const [isAddingShill, setIsAddingShill] = useState(false);
  const [isSavingShill, setIsSavingShill] = useState(false);

  // KNS KID state
  const [knsKidUrl, setKnsKidUrl] = useState('');
  const [isUploadingKns, setIsUploadingKns] = useState(false);
  const knsFileInputRef = useRef(null);
  
  // NEW: Social links state
  const [socialLinks, setSocialLinks] = useState({
    twitter: '',
    website: '',
    telegram: ''
  });
  const [isEditingSocials, setIsEditingSocials] = useState(false);
  const [isSavingSocials, setIsSavingSocials] = useState(false);

  // NEW: Agent profile state
  const [agentProfile, setAgentProfile] = useState(null);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedAgentId, setCopiedAgentId] = useState(false);

  // NEW: Location tracking state
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationSharing, setLocationSharing] = useState(false);

  useEffect(() => {
    loadCurrentUser();
    loadSecrets();
    loadApiKey();
    loadCurrentZKWallet();
    loadLinkedWallet();
    loadLinkedWallets();
    loadConnections();
    loadShills();
    loadKnsKid();
    loadSocialLinks();
    loadAgentProfile(); // NEW
    loadUserLocation();

    // UPDATED: Message handler matching test page pattern
    const handleMessage = (event) => {
      if (event.origin !== REPLIT_BASE_URL) return;
      if (!event.data?.type) return;

      console.log('[ToolsModal] 📨 Message:', event.data.type, 'Full payload:', event.data);

      // === READY SIGNALS ===
      if (event.data.type === 'ZK_CREATE_READY') {
        console.log('[ToolsModal] ✅ ZK Create ready');
        setZkCreateReady(true);
        return;
      }

      if (event.data.type === 'ZK_IMPORT_READY') {
        console.log('[ToolsModal] ✅ ZK Import ready');
        setZkImportReady(true);
        return;
      }

      if (event.data.type === 'ZK_BALANCE_READY') {
        console.log('[ToolsModal] ✅ ZK Balance ready');
        setZkBalanceReady(true);
        return;
      }

      // === WALLET CREATED ===
      if (event.data.type === 'ZK_WALLET_CREATED' && event.data.data) {
        console.log('[ToolsModal] 🎉 Wallet created:', event.data.data);
        handleZKWalletCreated(event.data.data);
        return;
      }

      // === WALLET IMPORTED (CLIENT-SIDE SIGNING) ===
      if (event.data.type === 'ZK_WALLET_IMPORTED' && event.data.data) {
        console.log('[ToolsModal] 🎉 Wallet imported (client-side):', event.data.data);
        console.log('[ToolsModal] 📊 Address:', event.data.data.address);
        console.log('[ToolsModal] 💰 Balance:', event.data.data.balance);
        console.log('[ToolsModal] ✅ Valid:', event.data.data.valid);
        console.log('[ToolsModal] 🔐 Mode:', event.data.data.derivation_mode);
        
        handleZKWalletImported(event.data.data);
        return;
      }

      // === BALANCE RESULT ===
      if (event.data.type === 'ZK_BALANCE_RESULT' && event.data.data) {
        console.log('[ToolsModal] 💰 Balance result:', JSON.stringify(event.data.data));
        handleBalanceResult(event.data.data);
        return;
      }

      // === UTXOS RESULT ===
      if (event.data.type === 'ZK_UTXOS_RESULT' && event.data.data) {
        console.log('[ToolsModal] 📊 UTXOs result:', event.data.data);
        handleUTXOsResult(event.data.data);
        return;
      }

      // === ERROR HANDLING ===
      if (event.data.type === 'ZK_ERROR') {
        console.error('[ToolsModal] ❌ Error:', event.data.error);
        setIsProcessingWallet(false);
        setIsLoadingWallet(false);
        showStatus('error', 'Error: ' + event.data.error);
        return;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [importMnemonic, agentZKId]);

  const showStatus = (type, text, duration = 3000) => {
    setStatusMessage({ type, text });
    if (duration > 0) {
      setTimeout(() => setStatusMessage(null), duration);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (err) {
      console.error('Failed to load current user:', err);
    }
  };

  const loadSecrets = async () => {
    try {
      const user = await base44.auth.me();
      const agentSecrets = user.agent_zk_secrets || [];
      setSecrets(agentSecrets);
    } catch (err) {
      console.error('Failed to load secrets:', err);
    }
  };

  const loadApiKey = async () => {
    try {
      const user = await base44.auth.me();
      if (user.agent_zk_api_key) {
        setApiKey(user.agent_zk_api_key);
      }
    } catch (err) {
      console.error('Failed to load API key:', err);
    }
  };

  const loadCurrentZKWallet = async () => {
    try {
      const user = await base44.auth.me();
      if (user.agent_zk_wallets && user.agent_zk_wallets.length > 0) {
        const latestWallet = user.agent_zk_wallets[user.agent_zk_wallets.length - 1];
        console.log('[ToolsModal] 📂 Loaded wallet from database:', latestWallet.address);
        setCurrentZKWallet(latestWallet);
        
        // Don't auto-load here - wait for useEffect to trigger
      }
    } catch (err) {
      console.error('Failed to load ZK wallet:', err);
    }
  };

  const loadLinkedWallet = async () => {
    try {
      const user = await base44.auth.me();
      if (user.agent_linked_wallet_address) {
        setLinkedWalletAddress(user.agent_linked_wallet_address);
      }
    } catch (err) {
      console.error('Failed to load linked wallet:', err);
    }
  };

  const loadLinkedWallets = async () => {
    try {
      const user = await base44.auth.me();
      const agentWallets = user.agent_zk_wallets || [];
      
      // Filter wallets that are linked for Agent AI
      const linked = agentWallets.filter(w => w.linkedForAgent === true);
      setLinkedWallets(linked);
      
      // Set agent name based on first linked wallet's truncated address
      if (linked.length > 0) {
        const firstWallet = linked[0].address;
        const truncated = `${firstWallet.substring(0, 8)}...${firstWallet.substring(firstWallet.length - 4)}`;
        setAgentName(`Agent ZK (${truncated})`);
      } else {
        setAgentName('Agent ZK');
      }

      // For backward compatibility - set first linked wallet as primary IF NO explicit primary is set
      if (linked.length > 0 && !linkedWalletAddress) {
        setLinkedWalletAddress(linked[0].address);
      } else if (linked.length === 0) { // Ensure primary is null if no wallets
        setLinkedWalletAddress(null);
      }
    } catch (err) {
      console.error('Failed to load linked wallets:', err);
    }
  };

  const loadConnections = async () => {
    try {
      const user = await base44.auth.me();
      
      // Get connections where user is requester or target
      const myConnections = await base44.entities.AgentZKConnection.filter({});
      
      const userConnections = myConnections.filter(conn => 
        conn.requester_email === user.email || conn.target_email === user.email
      );
      
      setConnections(userConnections);
      console.log('[ToolsModal] 📡 Loaded', userConnections.length, 'connections');
    } catch (err) {
      console.error('Failed to load connections:', err);
    }
  };

  const loadShills = async () => {
    try {
      const user = await base44.auth.me();
      const userShills = user.agent_zk_shills || [];
      setShills(userShills);
    } catch (err) {
      console.error('Failed to load shills:', err);
    }
  };

  const loadKnsKid = async () => {
    try {
      const user = await base44.auth.me();
      setKnsKidUrl(user.agent_zk_kns_kid_url || '');
    } catch (err) {
      console.error('Failed to load KNS KID:', err);
    }
  };

  const loadSocialLinks = async () => {
    try {
      const user = await base44.auth.me();
      setSocialLinks({
        twitter: user.agent_zk_twitter || '',
        website: user.agent_zk_website || '',
        telegram: user.agent_zk_telegram || ''
      });
    } catch (err) {
      console.error('Failed to load social links:', err);
    }
  };

  const loadAgentProfile = async () => {
    try {
      const user = await base44.auth.me();
      
      // Try to get Agent ZK profile
      const profiles = await base44.entities.AgentZKProfile.filter({
        user_email: user.email
      });
      
      if (profiles.length > 0) {
        setAgentProfile(profiles[0]);
      }
    } catch (err) {
      console.error('Failed to load agent profile:', err);
    }
  };

  const loadUserLocation = async () => {
    try {
      const user = await base44.auth.me();
      const locations = await base44.entities.UserLocation.filter({
        user_email: user.email
      });
      
      if (locations.length > 0) {
        setUserLocation(locations[0]);
        setLocationSharing(locations[0].share_with_app);
      }
    } catch (err) {
      console.error('Failed to load location:', err);
    }
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      showStatus('error', 'Geolocation not supported by browser');
      return;
    }

    setIsLoadingLocation(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude, accuracy } = position.coords;

      // Get city/country from reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const geoData = await response.json();

      const locationData = {
        user_email: currentUser.email,
        latitude,
        longitude,
        city: geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Unknown',
        country: geoData.address?.country || 'Unknown',
        encrypted_location: btoa(JSON.stringify({ latitude, longitude, timestamp: Date.now() })),
        share_with_app: locationSharing,
        last_updated: new Date().toISOString(),
        accuracy
      };

      if (userLocation) {
        await base44.entities.UserLocation.update(userLocation.id, locationData);
      } else {
        await base44.entities.UserLocation.create(locationData);
      }

      await loadUserLocation();
      showStatus('success', `✅ Location updated: ${locationData.city}, ${locationData.country}`);
    } catch (err) {
      console.error('Failed to get location:', err);
      if (err.code === 1) {
        showStatus('error', 'Location permission denied');
      } else {
        showStatus('error', 'Failed to get location: ' + err.message);
      }
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleToggleLocationSharing = async () => {
    if (!userLocation) {
      showStatus('error', 'Please enable location first');
      return;
    }

    const newSharingState = !locationSharing;
    
    try {
      await base44.entities.UserLocation.update(userLocation.id, {
        share_with_app: newSharingState
      });
      
      setLocationSharing(newSharingState);
      showStatus('success', newSharingState ? '✅ Location shared with app' : '✅ Location private to Agent ZK only');
    } catch (err) {
      showStatus('error', 'Failed to update sharing: ' + err.message);
    }
  };

  const handleSaveSocialLinks = async () => {
    setIsSavingSocials(true);
    try {
      await base44.auth.updateMe({
        agent_zk_twitter: socialLinks.twitter,
        agent_zk_website: socialLinks.website,
        agent_zk_telegram: socialLinks.telegram
      });
      setIsEditingSocials(false);
      showStatus('success', '✅ Social links saved!');
    } catch (err) {
      showStatus('error', 'Failed to save links: ' + err.message);
    } finally {
      setIsSavingSocials(false);
    }
  };

  const handleKnsUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showStatus('error', 'Please upload an image file');
      return;
    }

    setIsUploadingKns(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.auth.updateMe({
        agent_zk_kns_kid_url: file_url
      });
      
      setKnsKidUrl(file_url);
      showStatus('success', '✅ KNS.KID uploaded successfully!');
    } catch (err) {
      showStatus('error', 'Failed to upload KNS.KID: ' + err.message);
    } finally {
      setIsUploadingKns(false);
    }
  };

  const handleAddShill = async () => {
    if (!newShill.title || !newShill.message) {
      showStatus('error', 'Please provide both title and message');
      return;
    }

    setIsSavingShill(true);
    try {
      const user = await base44.auth.me();
      const shillEntry = {
        ...newShill,
        created_at: new Date().toISOString(),
        id: Date.now().toString()
      };
      
      const updatedShills = [...shills, shillEntry];
      
      await base44.auth.updateMe({
        agent_zk_shills: updatedShills
      });
      
      setShills(updatedShills);
      setNewShill({ title: "", message: "", link: "" });
      setIsAddingShill(false);
      showStatus('success', '✅ Shill added successfully!');
    } catch (err) {
      showStatus('error', 'Failed to save shill: ' + err.message);
    } finally {
      setIsSavingShill(false);
    }
  };

  const handleDeleteShill = async (shillId) => {
    const confirmed = confirm('Delete this shill?');
    if (!confirmed) return;
    
    setIsSavingShill(true);
    try {
      const updatedShills = shills.filter(s => s.id !== shillId);
      await base44.auth.updateMe({
        agent_zk_shills: updatedShills
      });
      setShills(updatedShills);
      showStatus('success', '✅ Shill deleted');
    } catch (err) {
      showStatus('error', 'Failed to delete shill: ' + err.message);
    } finally {
      setIsSavingShill(false);
    }
  };

  const copyShillToClipboard = (shill) => {
    const text = `${shill.title}\n\n${shill.message}${shill.link ? '\n\n' + shill.link : ''}`;
    navigator.clipboard.writeText(text);
    showStatus('success', '✅ Shill copied to clipboard!');
  };

  const handleRemoveLinkedWallet = async (walletAddress) => {
    const confirmed = confirm(`Remove this wallet from Agent ZK access?\n\n${walletAddress.substring(0, 20)}...`);
    if (!confirmed) return;

    try {
      const user = await base44.auth.me();
      const agentWallets = user.agent_zk_wallets || [];
      
      // Update the wallet to remove linkedForAgent flag
      const updatedWallets = agentWallets.map(w => 
        w.address === walletAddress 
          ? { ...w, linkedForAgent: false }
          : w
      );

      await base44.auth.updateMe({
        agent_zk_wallets: updatedWallets
      });

      // Reload linked wallets
      await loadLinkedWallets();
      
      // If this was the primary linked wallet, update it
      if (linkedWalletAddress === walletAddress) {
        const remainingLinked = updatedWallets.filter(w => w.linkedForAgent === true);
        setLinkedWalletAddress(remainingLinked.length > 0 ? remainingLinked[0].address : null);
      }

      showStatus('success', '✅ Wallet removed from Agent ZK access');
    } catch (err) {
      console.error('Failed to remove wallet:', err);
      showStatus('error', 'Failed to remove wallet: ' + err.message);
    }
  };

  // Auto-load balance when wallet is loaded and iframe is ready
  useEffect(() => {
    if (currentZKWallet && zkBalanceReady && !isLoadingWallet && !zkBalance) {
      console.log('[ToolsModal] 🔄 Auto-loading balance for wallet:', currentZKWallet.address);
      loadZKWalletData(currentZKWallet.address);
    }
  }, [currentZKWallet, zkBalanceReady]);

  const loadZKWalletData = async (address) => {
    if (!zkBalanceReady) {
      console.warn('[ToolsModal] ⚠️ Balance iframe not ready yet');
      return;
    }

    if (!address) {
      console.error('[ToolsModal] ❌ No address provided to loadZKWalletData');
      return;
    }

    console.log('[ToolsModal] 📊 Requesting balance for:', address);
    setIsLoadingWallet(true);
    setZKBalance(null); // Clear old balance
    
    // Send balance request to iframe
    setTimeout(() => {
      if (zkBalanceIframeRef.current?.contentWindow) {
        console.log('[ToolsModal] 📤 Sending ZK_GET_BALANCE to iframe');
        zkBalanceIframeRef.current.contentWindow.postMessage({
          type: 'ZK_GET_BALANCE',
          address: address,
          id: Date.now()
        }, REPLIT_BASE_URL);
      } else {
        console.error('[ToolsModal] ❌ Balance iframe not available');
        setIsLoadingWallet(false);
      }
    }, 100);

    // Send UTXOs request
    setTimeout(() => {
      if (zkBalanceIframeRef.current?.contentWindow) {
        console.log('[ToolsModal] 📤 Sending ZK_GET_UTXOS to iframe');
        zkBalanceIframeRef.current.contentWindow.postMessage({
          type: 'ZK_GET_UTXOS',
          address: address,
          id: Date.now()
        }, REPLIT_BASE_URL);
      }
    }, 1500);
  };

  const handleBalanceResult = (data) => {
    console.log('[ToolsModal] 💰 Processing balance result:', JSON.stringify(data));
    
    if (thinkingStatus?.includes('Analyzing') || thinkingStatus?.includes('Fetching')) {
      // VP Import flow
      const balance = parseFloat(data.balanceKAS) || 0;
      
      setVpBalance({
        address: data.address,
        balance: balance,
        utxos: []
      });

      setThinkingStatus('✅ Balance fetched!');
      
      setTimeout(() => {
        const truncated = getTruncatedAddress(data.address);
        let response = `✅ **Wallet Analysis Complete** (${truncated})\n\n`;
        response += `📊 **Balance:** ${balance.toFixed(8)} KAS\n\n`;
        response += `📜 **Checking transaction history...**\n`;

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString()
        }]);
        
        // Request UTXOs
        zkBalanceIframeRef.current?.contentWindow?.postMessage({
          type: 'ZK_GET_UTXOS',
          address: data.address,
          id: Date.now()
        }, REPLIT_BASE_URL);
      }, 500);
    } else {
      // Direct balance check for wallet tab
      let balanceKAS = 0;
      
      // Try multiple ways to extract balance
      if (data.balanceKAS !== undefined) {
        balanceKAS = parseFloat(data.balanceKAS);
      } else if (data.balance !== undefined) {
        if (typeof data.balance === 'object' && data.balance.kas) {
          balanceKAS = parseFloat(data.balance.kas);
        } else if (typeof data.balance === 'number') {
          balanceKAS = data.balance;
        } else if (typeof data.balance === 'string') {
          balanceKAS = parseFloat(data.balance);
        }
      }
      
      console.log('[ToolsModal] ✅ Setting balance:', balanceKAS, 'KAS');
      
      setZKBalance({ balanceKAS: balanceKAS });
      setIsLoadingWallet(false);
    }
  };

  const handleUTXOsResult = (data) => {
    console.log('[ToolsModal] 📊 Processing UTXOs:', data);
    
    if (thinkingStatus && (thinkingStatus.includes('Checking transaction history...') || thinkingStatus.includes('✅ Balance fetched!'))) {
      // VP Import flow
      const utxos = data.history || [];
      
      setVpBalance(prev => ({
        ...prev,
        utxos: utxos
      }));

      setTimeout(() => {
        let response = '';
        
        if (utxos.length > 0) {
          const lastTx = utxos[0];
          response += `\n📜 **Last Transaction:**\n`;
          response += `- Amount: ${(lastTx.amount / 100000000).toFixed(8)} KAS\n`;
          if (lastTx.txId) response += `- TX ID: ${lastTx.txId.substring(0, 20)}...\n`;
          if (lastTx.timestamp) response += `- Date: ${new Date(lastTx.timestamp).toLocaleString()}\n`;
          response += `\n📈 **Total Transactions:** ${utxos.length}\n`;
        } else {
          response += `\n📜 **Transaction History:** No transactions found\n`;
        }

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString()
        }]);
        
        setThinkingStatus(null);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }, 500);
    } else {
      // Direct UTXO check for wallet tab
      const history = data.history || [];
      console.log('[ToolsModal] 📊 Setting UTXOs:', history.length, 'transactions');
      
      setZKUtxos(history);
      setIsLoadingWallet(false);
    }
  };

  const handleZKWalletCreated = async (walletData) => {
    console.log('[ToolsModal] 💾 Saving created wallet (client-side derived)');
    console.log('[ToolsModal] 📍 Address:', walletData.address);
    console.log('[ToolsModal] 🔢 Word count:', walletData.wordCount);
    console.log('[ToolsModal] 🔐 Derivation mode:', walletData.derivation_mode);
    
    setIsProcessingWallet(false);

    try {
      const user = await base44.auth.me();
      const existingWallets = user.agent_zk_wallets || [];

      const newWallet = {
        address: walletData.address,
        wordCount: walletData.wordCount || walletData.mnemonic.split(' ').filter(w => w).length,
        createdAt: new Date().toISOString(),
        type: 'zk_wallet',
        encryptedSeed: btoa(walletData.mnemonic.trim().toLowerCase()),
        derivation_mode: walletData.derivation_mode || 'client-side'
      };

      await base44.auth.updateMe({
        agent_zk_wallets: [...existingWallets, newWallet]
      });

      setCurrentZKWallet(newWallet);
      setWalletMode('list');
      
      showStatus('success', `✅ ZK Wallet created! Address: ${walletData.address.substring(0, 20)}... (Save your seed phrase securely!)`, 5000);
    } catch (err) {
      console.error('[ToolsModal] ❌ Save failed:', err);
      showStatus('error', 'Failed to save wallet: ' + err.message);
    }
  };

  const handleZKWalletImported = async (walletData) => {
    console.log('[ToolsModal] 💾 Processing imported wallet');
    console.log('[ToolsModal] 📍 Full data:', JSON.stringify(walletData, null, 2));
    
    setIsProcessingWallet(false);

    try {
      const user = await base44.auth.me();
      const existingWallets = user.agent_zk_wallets || [];

      const walletExists = existingWallets.some(w => w.address === walletData.address);
      
      if (walletExists) {
        const existingWallet = existingWallets.find(w => w.address === walletData.address);
        console.log('[ToolsModal] ⚠️ Wallet already exists:', existingWallet.address);
        
        // IMPORTANT: Set balance FIRST before setting currentZKWallet
        if (walletData.balance) {
          let balanceKAS = 0;
          if (typeof walletData.balance === 'object' && walletData.balance.kas) {
            balanceKAS = parseFloat(walletData.balance.kas);
          } else if (typeof walletData.balance === 'number') {
            balanceKAS = walletData.balance;
          } else if (typeof walletData.balance === 'string') {
            balanceKAS = parseFloat(walletData.balance);
          }
          
          if (!isNaN(balanceKAS) && balanceKAS !== null) {
            console.log('[ToolsModal] 💰 Setting balance from import (existing wallet):', balanceKAS, 'KAS');
            setZKBalance({ balanceKAS: balanceKAS });
            setIsLoadingWallet(false);
          }
        }
        
        // THEN set current wallet (won't trigger reload because balance is already set)
        setCurrentZKWallet(existingWallet);
        setWalletMode('list');
        setImportMnemonic('');
        
        const bal = typeof walletData.balance === 'object' 
          ? parseFloat(walletData.balance.kas || 0)
          : parseFloat(walletData.balance || 0);
        showStatus('info', `⚠️ Wallet already exists! Balance: ${bal.toFixed(8)} KAS`);
        return;
      }

      // Create new wallet record
      const newWallet = {
        address: walletData.address,
        wordCount: walletData.wordCount,
        createdAt: new Date().toISOString(),
        type: 'zk_wallet',
        encryptedSeed: btoa(importMnemonic.trim().toLowerCase()),
        derivation_mode: walletData.derivation_mode || 'client-side'
      };

      console.log('[ToolsModal] 💾 Saving new wallet to database');
      await base44.auth.updateMe({
        agent_zk_wallets: [...existingWallets, newWallet]
      });

      // CRITICAL FIX: Parse and set balance BEFORE setting currentZKWallet
      let hasValidBalance = false;
      
      if (walletData.balance) {
        let balanceKAS = 0;
        
        if (typeof walletData.balance === 'object') {
          balanceKAS = parseFloat(walletData.balance.kas || walletData.balance.balanceKAS || 0);
        } else if (typeof walletData.balance === 'number') {
          balanceKAS = walletData.balance;
        } else if (typeof walletData.balance === 'string') {
          balanceKAS = parseFloat(walletData.balance);
        }
        
        if (!isNaN(balanceKAS) && balanceKAS !== null) {
          console.log('[ToolsModal] 💰 Setting balance BEFORE setting current wallet:', balanceKAS, 'KAS');
          setZKBalance({ balanceKAS: balanceKAS });
          setIsLoadingWallet(false);
          hasValidBalance = true;
        }
      }

      // NOW set current wallet - useEffect won't trigger reload because zkBalance is already set
      console.log('[ToolsModal] ✅ Wallet saved, setting as current (balance already set)');
      setCurrentZKWallet(newWallet);
      setWalletMode('list');
      setImportMnemonic('');
      
      if (hasValidBalance) {
        const bal = typeof walletData.balance === 'object' 
          ? parseFloat(walletData.balance.kas || 0)
          : parseFloat(walletData.balance || 0);
        showStatus('success', `✅ ZK Wallet imported! Address: ${newWallet.address.substring(0, 20)}... | Balance: ${bal.toFixed(8)} KAS`);
      } else {
        // No valid balance in import response - will be loaded by useEffect
        console.log('[ToolsModal] 📊 No balance in import response, will load via useEffect...');
        showStatus('success', `✅ ZK Wallet imported! Address: ${newWallet.address.substring(0, 20)}... (Loading balance...)`);
      }
      
    } catch (err) {
      console.error('[ToolsModal] ❌ Import failed:', err);
      showStatus('error', 'Failed to save wallet: ' + err.message);
      setWalletMode('import');
    }
  };

  const handleCreateZKWallet = () => {
    if (!zkCreateReady) {
      showStatus('info', '⏳ ZK Create system loading...');
      return;
    }

    console.log('[ToolsModal] 🚀 Creating ZK wallet (client-side)');
    setIsProcessingWallet(true);

    setTimeout(() => {
      if (zkCreateIframeRef.current?.contentWindow) {
        zkCreateIframeRef.current.contentWindow.postMessage({
          type: 'ZK_CREATE_WALLET',
          id: Date.now()
        }, REPLIT_BASE_URL);
        console.log('[ToolsModal] 📤 Create wallet message sent (client-side signing)');
      } else {
        console.error('[ToolsModal] ❌ Create iframe not ready');
        setIsProcessingWallet(false);
        showStatus('error', '❌ System not ready. Please refresh the page.');
      }
    }, 100);
  };

  const handleImportZKWallet = () => {
    if (!importMnemonic.trim()) {
      showStatus('error', 'Please enter a seed phrase');
      return;
    }

    if (!zkImportReady) {
      showStatus('info', '⏳ ZK Import system loading...');
      return;
    }

    const words = importMnemonic.trim().toLowerCase().split(/\s+/).filter(w => w);
    if (words.length !== 12 && words.length !== 24) {
      showStatus('error', 'Seed phrase must be 12 or 24 words');
      return;
    }

    console.log('[ToolsModal] 🚀 Importing ZK wallet (client-side signing)');
    console.log('[ToolsModal] 🔢 Word count:', words.length);
    setIsProcessingWallet(true);

    setTimeout(() => {
      if (zkImportIframeRef.current?.contentWindow) {
        zkImportIframeRef.current.contentWindow.postMessage({
          type: 'ZK_IMPORT_WALLET',
          seedPhrase: words.join(' '),
          id: Date.now()
        }, REPLIT_BASE_URL);
        console.log('[ToolsModal] 📤 Import wallet message sent (client-side signing & derivation)');
      } else {
        console.error('[ToolsModal] ❌ Import iframe not ready');
        setIsProcessingWallet(false);
        showStatus('error', '❌ System not ready. Please refresh the page.');
      }
    }, 100);
  };

  const handleLinkWalletForAgent = async () => {
    if (!agentSeedPhrase.trim()) {
      showStatus('error', 'Please enter a seed phrase');
      return;
    }

    if (!zkImportReady) {
      showStatus('info', '⏳ Wallet system loading, please wait...');
      return;
    }

    const words = agentSeedPhrase.trim().toLowerCase().split(/\s+/).filter(w => w);
    if (words.length !== 12 && words.length !== 24) {
      showStatus('error', 'Seed phrase must be 12 or 24 words');
      return;
    }

    console.log('[ToolsModal] 🔗 Linking wallet for Agent AI access');
    setIsLinkingWallet(true);
    showStatus('info', '🔐 Deriving wallet address...', 0);

    // Create a one-time message handler for this specific import
    const linkHandler = async (event) => {
      if (event.origin !== REPLIT_BASE_URL) return;
      if (event.data?.type !== 'ZK_WALLET_IMPORTED') return;

      window.removeEventListener('message', linkHandler);

      const walletData = event.data.data;
      console.log('[ToolsModal] 📍 Wallet derived for Agent:', walletData.address);

      try {
        const user = await base44.auth.me();
        const existingWallets = user.agent_zk_wallets || [];

        const agentWallet = {
          address: walletData.address,
          wordCount: words.length,
          createdAt: new Date().toISOString(),
          type: 'agent_linked',
          encryptedSeed: btoa(agentSeedPhrase.trim().toLowerCase()),
          derivation_mode: 'client-side',
          linkedForAgent: true
        };

        // Check if wallet already exists
        const walletExists = existingWallets.some(w => w.address === walletData.address);
        
        let updatedWallets;
        if (walletExists) {
          // Update existing wallet: mark as linked and update seed if needed
          updatedWallets = existingWallets.map(w => 
            w.address === walletData.address 
              ? { ...w, linkedForAgent: true, encryptedSeed: btoa(agentSeedPhrase.trim().toLowerCase()) }
              : w
          );
          showStatus('info', '⚠️ Wallet already exists - updating...', 0);
        } else {
          // Add new wallet
          updatedWallets = [...existingWallets, agentWallet];
        }

        // Generate API key if none exists or if it needs to be refreshed (e.g. for this wallet)
        console.log('[ToolsModal] 🔑 Generating API key for Agent access...');
        showStatus('info', '🔑 Generating API key...', 0);
        
        const response = await base44.functions.invoke('generateZKApiKey', {
          walletAddress: walletData.address // Link key to this newly linked wallet
        });

        if (response.data.success) {
          const apiKey = response.data.api_key;

          // Save updated wallet list and new API key/linked address
          await base44.auth.updateMe({
            agent_zk_wallets: updatedWallets,
            agent_zk_api_key: apiKey,
            agent_linked_wallet_address: walletData.address // Set this as primary linked wallet
          });

          setApiKey(apiKey);
          setLinkedWalletAddress(walletData.address);
          setAgentSeedPhrase('');
          setIsLinkingWallet(false);
          
          await loadLinkedWallets(); // Reload the list of linked wallets for display
          setShowAddWallet(false); // Hide the add wallet form after success

          showStatus('success', `✅ Wallet linked! Agent ZK can now access ${walletData.address.substring(0, 15)}...`);
        } else {
          throw new Error(response.data.error || 'Failed to generate API key');
        }

      } catch (err) {
        console.error('[ToolsModal] ❌ Link failed:', err);
        showStatus('error', 'Failed to link wallet: ' + err.message);
        setIsLinkingWallet(false);
      }
    };

    window.addEventListener('message', linkHandler);

    // Send to import iframe
    setTimeout(() => {
      if (zkImportIframeRef.current?.contentWindow) {
        zkImportIframeRef.current.contentWindow.postMessage({
          type: 'ZK_IMPORT_WALLET',
          seedPhrase: words.join(' '),
          id: Date.now()
        }, REPLIT_BASE_URL);
        console.log('[ToolsModal] 📤 Deriving wallet for Agent link...');
      } else {
        console.error('[ToolsModal] ❌ Import iframe not ready');
        window.removeEventListener('message', linkHandler);
        setIsLinkingWallet(false);
        showStatus('error', '❌ System not ready. Please refresh the page.');
      }
    }, 100);
  };

  const handleConnectToAgent = async () => {
    if (!connectAddress.trim()) {
      showStatus('error', 'Please enter a Kaspa address');
      return;
    }

    if (!connectAddress.startsWith('kaspa:')) {
      showStatus('error', 'Address must start with "kaspa:"');
      return;
    }

    setIsConnecting(true);

    try {
      const user = await base44.auth.me();
      
      // Search for user with this Kaspa address
      // NOTE: Using asServiceRole on client is a security risk if not tightly controlled on backend
      const allUsers = await base44.asServiceRole.entities.User.filter({});
      const targetUser = allUsers.find(u => 
        u.created_wallet_address === connectAddress || 
        u.kasware_address === connectAddress ||
        (u.agent_zk_wallets && u.agent_zk_wallets.some(w => w.address === connectAddress))
      );

      if (!targetUser) {
        showStatus('error', `No Agent ZK user found with address ${connectAddress.substring(0, 15)}...`);
        setIsConnecting(false);
        return;
      }

      if (targetUser.email === user.email) {
        showStatus('error', 'You cannot connect to yourself!');
        setIsConnecting(false);
        return;
      }

      // Check if connection already exists
      const existingConnection = connections.find(conn => 
        (conn.requester_address === connectAddress && conn.target_email === user.email) ||
        (conn.target_address === connectAddress && conn.requester_email === user.email) ||
        (conn.requester_email === user.email && conn.target_email === targetUser.email) ||
        (conn.target_email === user.email && conn.requester_email === targetUser.email)
      );

      if (existingConnection) {
        showStatus('info', `Connection already exists with ${targetUser.username || targetUser.email}`);
        setActiveConnection(existingConnection);
        setShowConnectModal(false);
        setConnectAddress('');
        setIsConnecting(false);
        return;
      }

      // Create new connection
      const newConnection = await base44.entities.AgentZKConnection.create({
        requester_email: user.email,
        requester_address: user.created_wallet_address || (user.agent_zk_wallets?.[0]?.address || 'unknown'),
        target_address: connectAddress,
        target_email: targetUser.email,
        status: 'pending',
        conversation_id: `conv_${Date.now()}_${user.id}_${targetUser.id}`,
        messages: [{
          sender: user.email,
          content: `🤝 Connection request from Agent ZK (${user.username || user.email})`,
          timestamp: new Date().toISOString()
        }],
        last_message_at: new Date().toISOString(),
        is_active: true
      });

      await loadConnections();
      setActiveConnection(newConnection);
      setShowConnectModal(false);
      setConnectAddress('');
      
      showStatus('success', `✅ Connection request sent to ${targetUser.username || targetUser.email}!`);

      // Add system message to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `🤝 **Connection Established**\n\nYou've sent a connection request to **${targetUser.username || targetUser.email}** (${connectAddress.substring(0, 15)}...).\n\nCheck the **Connections** tab for updates.`,
        timestamp: new Date().toISOString()
      }]);

    } catch (err) {
      console.error('[ToolsModal] ❌ Connection failed:', err);
      showStatus('error', 'Failed to connect: ' + err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSendConnectionMessage = async (connectionId, message) => {
    if (!message || !message.trim()) return;
    
    try {
      const user = await base44.auth.me();
      const connection = connections.find(c => c.id === connectionId);
      
      if (!connection) return;

      const updatedMessages = [
        ...(connection.messages || []),
        {
          sender: user.email,
          content: message,
          timestamp: new Date().toISOString()
        }
      ];

      await base44.entities.AgentZKConnection.update(connectionId, {
        messages: updatedMessages,
        last_message_at: new Date().toISOString()
      });

      // Clear the input for this connection
      setConnectionMessages(prev => ({
        ...prev,
        [connectionId]: ''
      }));

      await loadConnections(); // Refresh connections to show updated messages
      showStatus('success', '✅ Message sent!');
    } catch (err) {
      console.error('[ToolsModal] ❌ Failed to send message:', err);
      showStatus('error', 'Failed to send message');
    }
  };

  const handleOpenFullChat = (connection) => {
    // Open the full chat page for this connection
    const chatUrl = createPageUrl("AgentZKChat", { id: connection.id });
    window.location.href = chatUrl;
  };

  const handleLogoutWallet = async () => {
    const confirmed = confirm('Remove current wallet from this device?\n\n⚠️ Make sure you have your seed phrase backed up!');
    if (!confirmed) return;

    try {
      const user = await base44.auth.me();
      const existingWallets = user.agent_zk_wallets || [];
      
      const updatedWallets = existingWallets.filter(w => w.address !== currentZKWallet?.address);
      
      await base44.auth.updateMe({
        agent_zk_wallets: updatedWallets
      });

      setCurrentZKWallet(null);
      setZKBalance(null);
      setZKUtxos([]);
      setWalletMode('list');
      
      showStatus('success', '✅ Wallet removed from device');
    } catch (err) {
      console.error('[ToolsModal] ❌ Logout failed:', err);
      showStatus('error', 'Failed to remove wallet: ' + err.message);
    }
  };

  const getTruncatedAddress = (address) => {
    if (!address) return '';
    return address.length > 20 ? `${address.substring(0, 10)}...${address.substring(address.length - 6)}` : address;
  };

  const handleImportToVPIframe = async (address) => {
    if (!zkBalanceReady) {
      setThinkingStatus('⚠️ Balance checker not ready');
      setTimeout(() => {
        setThinkingStatus(null);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }, 3000);
      return;
    }

    setThinkingStatus('🔍 Analyzing wallet...');
    
    await new Promise(resolve => setTimeout(resolve, 500));

    setThinkingStatus('📊 Fetching balance...');
    
    zkBalanceIframeRef.current?.contentWindow?.postMessage({
      type: 'ZK_GET_BALANCE',
      address: address,
      id: Date.now()
    }, REPLIT_BASE_URL);
  };

  const handleAddSecret = async () => {
    if (!newSecret.key || !newSecret.value) {
      showStatus('error', 'Please provide both key and value');
      return;
    }

    setIsSaving(true);
    try {
      const user = await base44.auth.me();
      const updatedSecrets = [...secrets, newSecret];
      
      await base44.auth.updateMe({
        agent_zk_secrets: updatedSecrets
      });
      
      setSecrets(updatedSecrets);
      setNewSecret({ key: "", value: "", description: "" });
      setIsAddingSecret(false);
      showStatus('success', '✅ Secret added successfully!');
    } catch (err) {
      showStatus('error', 'Failed to save secret: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSecret = async (index) => {
    const confirmed = confirm('Delete this secret?');
    if (!confirmed) return;
    
    setIsSaving(true);
    try {
      const updatedSecrets = secrets.filter((_, i) => i !== index);
      await base44.auth.updateMe({
        agent_zk_secrets: updatedSecrets
      });
      setSecrets(updatedSecrets);
      showStatus('success', '✅ Secret deleted');
    } catch (err) {
      showStatus('error', 'Failed to delete secret: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRevealSecret = (index) => {
    const newRevealed = new Set(revealedSecrets);
    if (newRevealed.has(index)) {
      newRevealed.delete(index);
    } else {
      newRevealed.add(index);
    }
    setRevealedSecrets(newRevealed);
  };

  const handleGenerateApiKey = async () => {
    setIsGeneratingKey(true);
    try {
      // If a wallet is linked (primary or first of the multiple), generate API key for that specific wallet
      const payload = linkedWalletAddress ? { walletAddress: linkedWalletAddress } : {};
      const response = await base44.functions.invoke('generateZKApiKey', payload);
      const { api_key } = response.data;
      
      // Update only the API key, not necessarily linked wallet address if it's not changing
      await base44.auth.updateMe({
        agent_zk_api_key: api_key
        // Keep agent_linked_wallet_address as is, unless explicitly changed by linking process
      });
      
      setApiKey(api_key);
      showStatus('success', '✅ API Key generated successfully!');
    } catch (err) {
      showStatus('error', 'Failed to generate API key: ' + err.message);
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleTestApi = async () => {
    if (!testWalletAddress.trim()) {
      showStatus('error', 'Please enter a wallet address to test');
      return;
    }

    if (!apiKey) {
      showStatus('error', 'Please generate an API key first');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`https://6901295fa9bcfaa0f5ba2c2a.base44.repl.co/functions/zkEndpointExecutor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          endpoint: 'balance',
          address: testWalletAddress
        })
      });

      const data = await response.json();
      
      setTestResult({
        success: response.ok,
        status: response.status,
        data: data
      });
    } catch (err) {
      setTestResult({
        success: false,
        error: err.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  const fetchWalletsBalance = async () => {
    setThinkingStatus(`🔐 Accessing ${linkedWallets.length} wallet${linkedWallets.length > 1 ? 's' : ''}...`);

    try {
      if (!zkImportReady) {
        throw new Error('ZK Import system not ready');
      }

      const walletResults = [];

      const processWallet = (wallet, index) => {
        return new Promise((resolve) => {
          const seedPhrase = atob(wallet.encryptedSeed);
          console.log(`[ToolsModal] 🔓 Processing wallet ${index + 1}/${linkedWallets.length}`);

          const handler = (event) => {
            if (event.origin !== REPLIT_BASE_URL) return;
            if (event.data?.type !== 'ZK_WALLET_IMPORTED') return;

            window.removeEventListener('message', handler);

            const walletData = event.data.data;
            console.log(`[ToolsModal] 💰 Balance fetched for wallet ${index + 1}:`, walletData);

            let balanceKAS = 0;
            if (walletData.balance) {
              if (typeof walletData.balance === 'object' && walletData.balance.kas) {
                balanceKAS = parseFloat(walletData.balance.kas);
              } else if (typeof walletData.balance === 'number') {
                balanceKAS = walletData.balance;
              } else if (typeof walletData.balance === 'string') {
                balanceKAS = parseFloat(walletData.balance);
              }
            }

            walletResults.push({
              address: wallet.address,
              balance: balanceKAS,
              wordCount: wallet.wordCount,
              history: walletData.history || []
            });

            resolve();
          };

          window.addEventListener('message', handler);

          setTimeout(() => {
            if (zkImportIframeRef.current?.contentWindow) {
              zkImportIframeRef.current.contentWindow.postMessage({
                type: 'ZK_IMPORT_WALLET',
                seedPhrase: seedPhrase,
                id: Date.now() + index
              }, REPLIT_BASE_URL);
              console.log(`[ToolsModal] 📤 Sent seed for wallet ${index + 1} to iframe for balance fetch`);
            } else {
              console.error(`[ToolsModal] ❌ Import iframe not available for wallet ${index + 1}`);
              window.removeEventListener('message', handler);
              walletResults.push({ address: wallet.address, balance: 0, error: 'Import system unavailable' });
              resolve();
            }
          }, index * 500);

          setTimeout(() => {
            window.removeEventListener('message', handler);
            if (walletResults.length < index + 1) { // If not already processed by the success handler
              walletResults.push({
                address: wallet.address,
                balance: 0,
                error: 'Timeout'
              });
            }
            resolve();
          }, 15000); // 15 seconds timeout per wallet
        });
      };

      for (let i = 0; i < linkedWallets.length; i++) {
        setThinkingStatus(`💰 Fetching balance for wallet ${i + 1}/${linkedWallets.length}...`);
        await processWallet(linkedWallets[i], i);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const truncateAddr = (addr) => `${addr.substring(0, 10)}...${addr.substring(addr.length - 6)}`;
      
      let responseText = `✅ **Portfolio Overview** (${linkedWallets.length} wallet${linkedWallets.length > 1 ? 's' : ''})\n\n`;
      
      let totalBalance = 0;
      walletResults.forEach((result, idx) => {
        totalBalance += result.balance;
        responseText += `**Wallet ${idx + 1}:**\n`;
        responseText += `📍 ${truncateAddr(result.address)}\n`;
        responseText += `💰 ${result.balance.toFixed(8)} KAS\n`;
        if (result.error) {
          responseText += `⚠️ ${result.error}\n`;
        }
        responseText += `\n`;
      });

      responseText += `━━━━━━━━━━━━━━━━━━━━\n`;
      responseText += `💎 **Total Balance:** ${totalBalance.toFixed(8)} KAS\n`;
      responseText += `📊 **USD Value:** $${(totalBalance * 0.051).toFixed(2)} (approx)\n`;

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString()
      }]);

      setThinkingStatus(null);
      setIsSending(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    } catch (err) {
      console.error('[ToolsModal] ❌ Balance fetch failed:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ **Error:** ${err.message}\n\nMake sure you've linked wallets in the API tab.`,
        timestamp: new Date().toISOString()
      }]);
      setThinkingStatus(null);
      setIsSending(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const checkPaymentHistory = async () => {
    setThinkingStatus('📜 Checking transaction history...');

    try {
      if (linkedWallets.length === 0) {
        throw new Error('No wallets linked. Please link a wallet in the API tab to check transaction history.');
      }

      const wallet = linkedWallets[0]; // For now, let's just check the first linked wallet
      
      console.log('[ToolsModal] 📊 Fetching transaction history for:', wallet.address);

      // Use a base44 function to get UTXOs
      const response = await base44.functions.invoke('getKaspaUTXOs', {
        address: wallet.address
      });

      console.log('[ToolsModal] 📦 UTXO Response:', response.data);

      if (response.data.success && response.data.history) {
        const history = response.data.history;
        
        // Sort by timestamp (most recent first)
        history.sort((a, b) => b.timestamp - a.timestamp);

        const recentPayments = history.slice(0, 5); // Display last 5 transactions

        let responseText = `📜 **Recent Transactions** for ${wallet.address.substring(0, 15)}...\n\n`;

        if (recentPayments.length === 0) {
          responseText += "No recent transactions found.\n";
        } else {
          recentPayments.forEach((tx, idx) => {
            const amount = (tx.amount / 100000000).toFixed(8); // Convert sompis to KAS
            const date = new Date(tx.timestamp).toLocaleString();
            const txId = tx.txId ? `${tx.txId.substring(0, 10)}...` : 'N/A';

            responseText += `**${idx + 1}. ${amount} KAS**\n`;
            responseText += `📅 ${date}\n`;
            responseText += `🔗 TX: ${txId}\n\n`;
          });

          // Check if user got paid recently (last 24 hours)
          const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
          const paymentsInLast24Hours = history.filter(tx => tx.timestamp > oneDayAgo);

          if (paymentsInLast24Hours.length > 0) {
            responseText += `\n✅ **You received ${paymentsInLast24Hours.length} payment${paymentsInLast24Hours.length > 1 ? 's' : ''} in the last 24 hours!**\n`;
          }
        }

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: responseText,
          timestamp: new Date().toISOString()
        }]);

      } else {
        throw new Error(response.data.error || 'Failed to fetch transaction history from backend');
      }

      setThinkingStatus(null);
      setIsSending(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    } catch (err) {
      console.error('[ToolsModal] ❌ Payment check failed:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ **Error checking payments:** ${err.message}`,
        timestamp: new Date().toISOString()
      }]);
      setThinkingStatus(null);
      setIsSending(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);
    setThinkingStatus('🤔 Agent ZK is thinking...');

    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    try {
      const lowerInput = messageText.toLowerCase();

      // NEW: TTTV QUERY - Show video widget
      if (lowerInput === 'tttv' || lowerInput === 'tv' || (lowerInput.includes('watch') && (lowerInput.includes('video') || lowerInput.includes('tttv')))) {
        console.log('[ToolsModal] 📺 TTTV query detected');
        setThinkingStatus('📺 Loading TTTV videos...');

        try {
          const trendingVideos = await base44.entities.TTTVVideo.filter({ is_trending: true }, '-added_date', 10);
          
          console.log('[ToolsModal] 🎬 Loaded', trendingVideos.length, 'trending videos');
          
          if (trendingVideos.length === 0) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: '📺 **TTTV is empty**\n\nNo trending videos right now. Check back later!',
              timestamp: new Date().toISOString()
            }]);
            setThinkingStatus(null);
            setIsSending(false);
            return;

          }

          // Show TTTV Widget
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            isTTTVWidget: true, // Marker for rendering TTTVWidget
            videos: trendingVideos
          }]);

          setThinkingStatus(null);
          setIsSending(false);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          return;

        } catch (err) {
          console.error('[ToolsModal] ❌ TTTV query failed:', err);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `❌ Failed to load TTTV videos. Error: ${err.message}\n\nTry again or visit the TTTV page directly.`,
            timestamp: new Date().toISOString()
          }]);
          setThinkingStatus(null);
          setIsSending(false);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          return;
        }
      }
      
      // SHOP QUERY - Show ALL items in grid + AI insight
      if (lowerInput.includes('shop') || lowerInput.includes('store') || lowerInput.includes('buy') || 
          lowerInput.includes('products') || lowerInput.includes('items for sale') || lowerInput.includes('marketplace')) {
        
        console.log('[ToolsModal] 🛍️ Shop query detected');
        setThinkingStatus('🛍️ Loading TTT Shop...');

        try {
          const shopItems = await base44.entities.ShopItem.filter({ status: 'active' }, '-created_date', 50);
          
          console.log('[ToolsModal] 📦 Loaded', shopItems.length, 'shop items');
          
          if (shopItems.length === 0) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: '🛍️ **TTT Shop is empty**\n\nNo items available right now.',
              timestamp: new Date().toISOString()
            }]);
            setThinkingStatus(null);
            setIsSending(false);
            return;
          }

          setThinkingStatus('💰 Checking your balance...');

          let totalBalance = 0;
          const walletBalances = [];
          
          if (linkedWallets.length > 0) {
            for (const wallet of linkedWallets) {
              try {
                const seedPhrase = atob(wallet.encryptedSeed);
                
                const balancePromise = new Promise((resolve) => {
                  const handler = (event) => {
                    if (event.origin !== REPLIT_BASE_URL) return;
                    if (event.data?.type !== 'ZK_WALLET_IMPORTED') return;
                    
                    window.removeEventListener('message', handler);
                    const walletData = event.data.data;
                    
                    let balanceKAS = 0;
                    if (walletData.balance) {
                      if (typeof walletData.balance === 'object' && walletData.balance.kas) {
                        balanceKAS = parseFloat(walletData.balance.kas);
                      } else if (typeof walletData.balance === 'number') {
                        balanceKAS = walletData.balance;
                      } else if (typeof walletData.balance === 'string') {
                        balanceKAS = parseFloat(walletData.balance);
                      }
                    }
                    
                    resolve(balanceKAS);
                  };
                  
                  window.addEventListener('message', handler);
                  
                  setTimeout(() => {
                    if (zkImportIframeRef.current?.contentWindow) {
                      zkImportIframeRef.current.contentWindow.postMessage({
                        type: 'ZK_IMPORT_WALLET',
                        seedPhrase: seedPhrase,
                        id: Date.now() + Math.random()
                      }, REPLIT_BASE_URL);
                    } else {
                      window.removeEventListener('message', handler);
                      resolve(0);
                    }
                  }, 100);
                  
                  setTimeout(() => {
                    window.removeEventListener('message', handler);
                    resolve(0);
                  }, 5000);
                });
                
                const balance = await balancePromise;
                totalBalance += balance;
                walletBalances.push({
                  address: wallet.address,
                  balance: balance
                });
                
              } catch (err) {
                console.error('[ToolsModal] Error fetching balance:', err);
              }
            }
          }
          
          console.log('[ToolsModal] 💰 Total user balance:', totalBalance.toFixed(2), 'KAS');
          console.log('[ToolsModal] 📊 Showing ALL', shopItems.length, 'items');

          // SHOW SHOP WIDGET FIRST
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            isShopWidget: true,
            shopItems: shopItems,
            totalItems: shopItems.length,
            userBalance: totalBalance
          }]);

          // Generate AI insight based on user's balance and items
          setThinkingStatus('🧠 Analyzing your shopping options...');
          
          await new Promise(resolve => setTimeout(resolve, 500));

          try {
            // Prepare data for AI
            const affordableItems = shopItems.filter(item => {
              const totalCost = (item.price_kas || 0) + (item.shipping_cost_kas || 0); // Handle potential undefined values
              return totalCost <= totalBalance;
            });

            const expensiveItems = shopItems.filter(item => {
              const totalCost = (item.price_kas || 0) + (item.shipping_cost_kas || 0);
              return totalCost > totalBalance;
            });

            const cheapestItem = shopItems.reduce((min, item) => {
              const totalCost = (item.price_kas || 0) + (item.shipping_cost_kas || 0);
              const minCost = (min.price_kas || 0) + (min.shipping_cost_kas || 0);
              return totalCost < minCost ? item : min;
            });

            const mostExpensiveItem = shopItems.reduce((max, item) => {
              const totalCost = (item.price_kas || 0) + (item.shipping_cost_kas || 0);
              const maxCost = (max.price_kas || 0) + (max.shipping_cost_kas || 0);
              return totalCost > maxCost ? item : max;
            });

            // Build wallet breakdown
            let walletBreakdownForAI = '';
            if (walletBalances.length > 0) {
              walletBreakdownForAI = '\n\n**Your Wallets:**\n';
              walletBalances.forEach((w, idx) => {
                const truncated = `${w.address.substring(0, 10)}...${w.address.substring(w.address.length - 6)}`;
                walletBreakdownForAI += `${idx + 1}. ${truncated}: **${w.balance.toFixed(2)} KAS**\n`;
              });
            }

            const aiPrompt = `You are Agent ZK, analyzing a shop for the user.

**Shop Statistics:**
- Total Items: ${shopItems.length}
- Your Balance: ${totalBalance.toFixed(2)} KAS across ${linkedWallets.length} wallet${linkedWallets.length > 1 ? 's' : ''}
- Affordable Items: ${affordableItems.length}
- Out of Budget: ${expensiveItems.length}
- Cheapest Item: ${cheapestItem.title} (${((cheapestItem.price_kas || 0) + (cheapestItem.shipping_cost_kas || 0)).toFixed(2)} KAS)
- Most Expensive: ${mostExpensiveItem.title} (${((mostExpensiveItem.price_kas || 0) + (mostExpensiveItem.shipping_cost_kas || 0)).toFixed(2)} KAS)

**User Asked:** "${messageText}"

**Your Task:**
Provide a brief, personalized shopping insight (3-4 sentences):
1. Comment on their buying power
2. Highlight what they can afford
3. Suggest items if any are affordable
4. Be friendly and conversational

Use emojis sparingly (💰 🛍️ ✨). Keep it concise and helpful.`;

            const aiResponse = await base44.integrations.Core.InvokeLLM({
              prompt: aiPrompt
            });

            let insight = '';
            if (typeof aiResponse === 'string') {
              insight = aiResponse;
            } else if (aiResponse.response) {
              insight = aiResponse.response;
            } else if (aiResponse.content) {
              insight = aiResponse.content;
            } else {
              // Fallback insight
              if (totalBalance === 0) {
                insight = `💰 **No Balance Detected**\n\nYou don't have any KAS in your connected wallets yet. Add funds to start shopping!\n\nCheapest item: **${cheapestItem.title}** at ${((cheapestItem.price_kas || 0) + (cheapestItem.shipping_cost_kas || 0)).toFixed(2)} KAS.`;
              } else if (affordableItems.length === 0) {
                insight = `💰 **Balance: ${totalBalance.toFixed(2)} KAS**\n\nYou need more KAS to buy these items. The cheapest one is **${cheapestItem.title}** at ${((cheapestItem.price_kas || 0) + (cheapestItem.shipping_cost_kas || 0)).toFixed(2)} KAS.`;
              } else if (affordableItems.length === shopItems.length && shopItems.length > 0) {
                insight = `🛍️ **Great news!** You can afford **all ${shopItems.length} items** with your ${totalBalance.toFixed(2)} KAS balance.\n\nStart with **${cheapestItem.title}** (${(cheapestItem.price_kas || 0).toFixed(2)} KAS) or go big with **${mostExpensiveItem.title}**!`;
              } else if (affordableItems.length > 0) {
                insight = `💰 **Balance: ${totalBalance.toFixed(2)} KAS**\n\nYou can buy **${affordableItems.length} out of ${shopItems.length}** items. Consider **${affordableItems[0].title}** at ${(affordableItems[0].price_kas || 0).toFixed(2)} KAS!`;
              } else {
                 insight = `🛍️ I've loaded the shop! You have ${totalBalance.toFixed(2)} KAS. Take a look at the available items!`;
              }
            }

            // Add wallet breakdown if available
            if (walletBreakdownForAI) {
              insight += walletBreakdownForAI;
            }

            // Add total at the end
            insight += `\n\n💎 **Total Portfolio:** ${totalBalance.toFixed(2)} KAS`;

            setMessages(prev => [...prev, {
              role: 'assistant',
              content: insight,
              timestamp: new Date().toISOString()
            }]);

          } catch (aiErr) {
            console.error('[ToolsModal] ⚠️ AI insight failed:', aiErr);
            
            // Fallback insight without AI
            let fallbackInsight = `🛍️ **${shopItems.length} items available**\n\n`;
            
            if (totalBalance === 0) {
              fallbackInsight += `⚠️ No balance detected. Add KAS to start shopping!`;
            } else {
              const affordable = shopItems.filter(item => {
                const cost = (item.price_kas || 0) + (item.shipping_cost_kas || 0);
                return cost <= totalBalance;
              });
              
              fallbackInsight += `💰 Your balance: **${totalBalance.toFixed(2)} KAS**\n`;
              fallbackInsight += `✅ You can afford **${affordable.length}** item${affordable.length !== 1 ? 's' : ''}`;
              
              if (walletBalances.length > 0) {
                fallbackInsight += '\n\n**Your Wallets:**\n';
                walletBalances.forEach((w, idx) => {
                  const truncated = `${w.address.substring(0, 10)}...${w.address.substring(w.address.length - 6)}`;
                  fallbackInsight += `${idx + 1}. ${truncated}: ${w.balance.toFixed(2)} KAS\n`;
                });
              }
            }
            
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: fallbackInsight,
              timestamp: new Date().toISOString()
            }]);
          }

          setThinkingStatus(null);
          setIsSending(false);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

          return; // Exit here - no AI commentary after the widget

        } catch (err) {
          console.error('[ToolsModal] ❌ Shop query failed:', err);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `❌ Failed to load shop. Error: ${err.message}\n\nTry again or visit the Shop page directly.`,
            timestamp: new Date().toISOString()
          }]);
          setThinkingStatus(null);
          setIsSending(false);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          return;
        }
      }

      // NEW: Check for "connect" command
      if (lowerInput === 'connect' || lowerInput === '/connect' || lowerInput === 'connect agent') {
        setShowConnectModal(true);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `🤝 **Connect to Another Agent ZK**\n\nEnter the Kaspa address of the Agent ZK user you want to connect with.\n\nYou can message them once connected!`,
          timestamp: new Date().toISOString()
        }]);
        setThinkingStatus(null);
        setIsSending(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        return;
      }

      // NEW: Check for "connections" or "messages" command
      if (lowerInput === 'connections' || lowerInput === '/connections' || 
          lowerInput === 'messages' || lowerInput === 'my connections') {
        setActiveTab('connections'); // Switch to connections tab
        
        let responseText = `📡 **Your Agent ZK Connections** (${connections.length})\n\n`;
        
        if (connections.length === 0) {
          responseText += `No connections yet. Type **"connect"** to connect with another Agent ZK user!`;
        } else {
          responseText += `You have ${connections.length} active connection${connections.length > 1 ? 's' : ''}.\n\n`;
          responseText += `Click **Connections** tab above to view and message them.`;
        }

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: responseText,
          timestamp: new Date().toISOString()
        }]);
        setThinkingStatus(null);
        setIsSending(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        return;
      }
      
      // Get current date/time and location context
      const now = new Date();
      const currentDateTime = now.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
      });

      // Add location context if available
      let locationContext = '';
      if (userLocation) {
        locationContext = `\n**User Location:** ${userLocation.city}, ${userLocation.country} (Last updated: ${new Date(userLocation.last_updated).toLocaleString()})`;
      }
      
      // Priority 1: Check if message contains a Kaspa address (check for external address queries FIRST)
      const addressMatch = messageText.match(/kaspa:[a-z0-9]{61,63}/i);
      
      if (addressMatch) {
        const address = addressMatch[0];
        console.log('[ToolsModal] 🔍 Detected Kaspa address query:', address);
        
        // Check if user is asking about payments/transactions
        if (lowerInput.includes('paid') || lowerInput.includes('receive') || lowerInput.includes('payment') || 
            lowerInput.includes('transaction') || lowerInput.includes('sent') || lowerInput.includes('get') ||
            lowerInput.includes('balance') || lowerInput.includes('check') || lowerInput.includes('fund') ||
            lowerInput.includes('latest') || lowerInput.includes('last')) {
          
          setThinkingStatus('🔍 Analyzing wallet transactions...');
          
          try {
            // Fetch UTXOs for the address
            const response = await base44.functions.invoke('getKaspaUTXOs', {
              address: address
            });

            console.log('[ToolsModal] 📦 UTXO Response:', response.data);

            // Check if we got a valid response
            if (!response || !response.data) {
              throw new Error('No response from blockchain API');
            }

            // Handle API errors gracefully
            if (!response.data.success && response.data.error) {
              throw new Error(response.data.error);
            }

            const history = response.data.history || [];
            const balance = response.data.balanceKAS || 0;

            // Create collapsible analysis card
            const analysisId = Date.now().toString();
            let responseText = `📊 **Wallet Analysis**: ${address.substring(0, 20)}...\n\n`;
            responseText += `💰 **Current Balance:** ${balance.toFixed(8)} KAS\n\n`;

            if (history.length === 0) {
              responseText += `📜 **No transaction history found.**\n`;
              responseText += `This wallet has no incoming or outgoing transactions.`;
            } else {
              // Sort by timestamp (most recent first)
              history.sort((a, b) => b.timestamp - a.timestamp);

              // Check for recent payments (last 24 hours)
              const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
              const recentPayments = history.filter(tx => tx.timestamp > oneDayAgo);

              if (recentPayments.length > 0) {
                responseText += `✅ **YES! This wallet received ${recentPayments.length} payment${recentPayments.length > 1 ? 's' : ''} in the last 24 hours:**\n\n`;
                
                recentPayments.slice(0, 3).forEach((tx, idx) => {
                  const amount = (tx.amount / 100000000).toFixed(8);
                  const date = new Date(tx.timestamp).toLocaleString();
                  const txId = tx.txId ? `${tx.txId.substring(0, 10)}...` : 'N/A';

                  responseText += `**${amount} KAS** 📅 ${date} 🔗 TX: ${txId}\n`;
                });
                responseText += '\n';
              } else {
                responseText += `❌ **No payments in the last 24 hours.**\n\n`;
              }

              // Show last 5 transactions overall
              responseText += `📜 **Last ${Math.min(history.length, 5)} Transactions:**\n\n`;
              
              history.slice(0, 5).forEach((tx, idx) => {
                const amount = (tx.amount / 100000000).toFixed(8);
                const date = new Date(tx.timestamp).toLocaleString();
                const txId = tx.txId ? `${tx.txId.substring(0, 10)}...` : 'N/A';

                responseText += `**${amount} KAS** 📅 ${date} 🔗 TX: ${txId}\n`;
              });

              responseText += `\n💡 **Total Transactions:** ${history.length}`;
            }

            // Add the analysis message (collapsible)
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: responseText,
              timestamp: new Date().toISOString(),
              isAnalysis: true,
              analysisId: analysisId,
              analysisData: {
                address: address,
                balance: balance,
                history: history,
                recentPayments: history.filter(tx => tx.timestamp > (Date.now() - 24 * 60 * 60 * 1000)).length
              }
            }]);

            setThinkingStatus('🧠 Interpreting data...');
            
            // NOW add AI interpretation
            setTimeout(async () => {
              try {
                const aiPrompt = `You are Agent ZK, analyzing a Kaspa wallet for the user.

**Wallet Data:**
- Address: ${address.substring(0, 20)}...
- Balance: ${balance.toFixed(8)} KAS
- Total Transactions: ${history.length}
- Recent Activity (24h): ${history.filter(tx => tx.timestamp > (Date.now() - 24 * 60 * 60 * 1000)).length} transactions

**User Asked:** "${messageText}"

Provide a brief, conversational interpretation of this wallet's activity. Consider:
- Is this an active wallet?
- What patterns do you notice?
- Any observations about the transaction amounts?
- Should the user be concerned or excited about anything?

Keep it concise (2-3 sentences), friendly, and insightful. Use emojis sparingly (💡 🔍 💰).`;

                const aiResponse = await base44.integrations.Core.InvokeLLM({
                  prompt: aiPrompt
                });

                let interpretation = '';
                if (typeof aiResponse === 'string') {
                  interpretation = aiResponse;
                } else if (aiResponse.response) {
                  interpretation = aiResponse.response;
                } else if (aiResponse.content) {
                  interpretation = aiResponse.content;
                } else {
                  interpretation = `💡 This wallet shows ${history.length > 0 ? 'activity with ' + history.length + ' transactions' : 'no transaction history yet'}.`;
                }

                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: interpretation,
                  timestamp: new Date().toISOString()
                }]);

                setThinkingStatus(null);
                setIsSending(false);
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

              } catch (aiErr) {
                console.error('[ToolsModal] ⚠️ AI interpretation failed:', aiErr);
                setThinkingStatus(null);
                setIsSending(false);
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
              }
            }, 500);

            return; // Exit here, AI interpretation will be added async

          } catch (err) {
            console.error('[ToolsModal] ❌ Address check failed:', err);
            
            // Provide user-friendly error message
            let errorMessage = `⚠️ **Unable to fetch wallet data**\n\n`;
            errorMessage += `Address: ${address.substring(0, 20)}...\n\n`;
            
            if (err.message.includes('timeout') || err.message.includes('network')) {
              errorMessage += `❌ **Network Error:** The blockchain API is temporarily unavailable. Please try again in a moment.\n\n`;
            } else if (err.message.includes('500')) {
              errorMessage += `❌ **API Error:** The blockchain service is experiencing issues. This is temporary and should resolve soon.\n\n`;
            } else if (err.message.includes('404') || err.message.includes('not found') || err.message.includes('invalid')) {
              errorMessage += `❌ **Invalid Address:** The wallet address may be invalid or doesn't exist on the network. Please double-check it.\n\n`;
            } else {
              errorMessage += `❌ **Error:** ${err.message}\n\n`;
            }
            
            errorMessage += `💡 **What you can try:**\n`;
            errorMessage += `- Wait a few seconds and try again\n`;
            errorMessage += `- Double-check the wallet address is correct\n`;
            errorMessage += `- Try checking a different wallet\n`;
            
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: errorMessage,
              timestamp: new Date().toISOString()
            }]);
            setThinkingStatus(null);
            setIsSending(false);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            return;
          }
        } else {
          // Just analyzing the address for VP Import or other purposes
          await handleImportToVPIframe(address);
          return;
        }
      }
      
      // Priority 2: Check for balance queries for user's linked wallets
      if ((lowerInput.includes('balance') || lowerInput.includes('wallet') || lowerInput.includes('my kas') || 
           lowerInput.includes('check') || lowerInput.includes('my') || lowerInput.includes('portfolio') ||
           lowerInput.includes('all') || lowerInput.includes('total')) &&
          (lowerInput.includes('balance') || lowerInput.includes('wallet') || lowerInput.includes('kas'))) {
        
        console.log('[ToolsModal] 🔍 Detected balance query for linked wallets');
        
        if (linkedWallets.length === 0) {
          const responseText = "⚠️ **No Wallets Linked**\n\nI don't have access to any wallets yet. Please link a wallet in the **API** tab first by entering your seed phrase.";
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: responseText,
            timestamp: new Date().toISOString()
          }]);
          setThinkingStatus(null);
          setIsSending(false);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          return;
        }

        await fetchWalletsBalance();
        return;
      }

      // Priority 3: Check for payment detection queries for linked wallets
      if ((lowerInput.includes('paid') || lowerInput.includes('payment') || lowerInput.includes('receive') || 
           lowerInput.includes('sent') || lowerInput.includes('transaction')) &&
          linkedWallets.length > 0 && !lowerInput.includes('kaspa:')) {
        
        console.log('[ToolsModal] 💰 Detected payment query for linked wallets');
        await checkPaymentHistory();
        return;
      }

      // Priority 4: SMART AI CONVERSATION - Detect if internet search is needed
      console.log('[ToolsModal] 🤖 Using conversational AI...');
      
      // Determine if we need internet search
      const needsInternetSearch = 
        lowerInput.includes('price') ||
        lowerInput.includes('current') ||
        lowerInput.includes('latest') ||
        lowerInput.includes('news') ||
        lowerInput.includes('today') ||
        lowerInput.includes('now') ||
        lowerInput.includes('weather') ||
        lowerInput.includes('events') ||
        lowerInput.includes('happening') ||
        lowerInput.includes('2025') ||
        lowerInput.includes('2024') ||
        lowerInput.includes('who is') ||
        lowerInput.includes('who are') ||
        lowerInput.includes('what is') ||
        lowerInput.includes('what are') ||
        lowerInput.includes('tell me about') ||
        lowerInput.includes('explain') ||
        (lowerInput.includes('what') && (lowerInput.includes('kas') || lowerInput.includes('kaspa')));

      // Simple greetings and casual phrases don't need search
      const simpleGreetings = [
        'hello', 'hi', 'hey', 'yo', 'sup', 'greetings',
        'thanks', 'thank you', 'ok', 'okay', 'cool', 'nice',
        'good', 'great', 'awesome', 'perfect',
        'how are you', 'whats up', "what's up",
        'who are you', 'what can you do', 'help'
      ];
      
      const isSimpleGreeting = simpleGreetings.some(greeting => 
        lowerInput === greeting || lowerInput.startsWith(greeting + ' ') || lowerInput.endsWith(' ' + greeting)
      );

      // Update thinking status based on search needs
      if (needsInternetSearch && !isSimpleGreeting) {
        setThinkingStatus('🌐 Searching the internet...');
      } else {
        setThinkingStatus('💭 Thinking...');
      }
      
      try {
        // Build conversation history for context
        const conversationHistory = messages
          .slice(-10)
          .map(msg => `${msg.role === 'user' ? 'User' : 'Agent ZK'}: ${msg.content}`)
          .join('\n\n');

        // Build context about user's wallets
        let walletContext = '';
        if (linkedWallets.length > 0) {
          walletContext = `\n\n**Your Linked Wallets:**\n`;
          linkedWallets.forEach((w, i) => {
            walletContext += `${i + 1}. ${w.address.substring(0, 20)}... (${w.wordCount} words)\n`;
          });
        } else {
          walletContext = '\n\nNo wallets are currently linked.';
        }

        const conversationalPrompt = `You are Agent ZK, an elite AI assistant with personality for the TTT crypto platform.

**WHO YOU ARE:**
🤖 **Personality:** Professional but friendly, helpful, conversational, and natural
💡 **Style:** Warm, engaging, remembers context, doesn't over-explain
🎯 **Role:** Personal AI assistant for crypto and Kaspa

**CURRENT DATE & TIME:** ${currentDateTime} UTC${locationContext}

**Current User Context:**${walletContext}

**Previous Conversation:**
${conversationHistory}

**Current User Message:** "${messageText}"

**YOUR APPROACH:**
1. **Be Natural:** Respond like a helpful friend, not a search engine or robot
2. **Stay Conversational:** Match the user's tone (casual for casual, detailed for detailed)
3. **Remember Context:** Build on what you've discussed before
4. **Be Concise:** 2-3 sentences for simple questions, more detail only when needed
5. **Use Personality:** Be warm and engaging, use emojis naturally but sparingly
6. **No Over-explaining:** Don't say "I'm searching" or "Let me check" unless actually doing it

**RESPONSE GUIDELINES:**
- For greetings: Respond warmly and naturally
- For simple questions: Answer directly without mentioning search
- For help requests: Explain your capabilities conversationally
- For thanks: Acknowledge kindly
- Use emojis naturally: 💰 📊 ✨ 💡 👋 😊
- Keep it human and conversational

Respond naturally to continue our conversation.`;

        // Call LLM with conditional internet search
        const aiResponse = await base44.integrations.Core.InvokeLLM({
          prompt: conversationalPrompt,
          add_context_from_internet: needsInternetSearch && !isSimpleGreeting
        });

        console.log('[ToolsModal] ✅ AI Response received');

        // NEW: Web search verification layer for factual accuracy
        let finalResponse = '';
        if (typeof aiResponse === 'string') {
          finalResponse = aiResponse;
        } else if (aiResponse.response) {
          finalResponse = aiResponse.response;
        } else if (aiResponse.content) {
          finalResponse = aiResponse.content;
        }

        // Check if response seems uncertain or potentially incorrect
        const uncertaintyIndicators = [
          'i don\'t know',
          'i\'m not sure',
          'i cannot',
          'i can\'t',
          'not real',
          'fake',
          'fictional',
          'made up',
          'doesn\'t exist'
        ];

        const seemsUncertain = uncertaintyIndicators.some(indicator => 
          finalResponse.toLowerCase().includes(indicator)
        );

        // If uncertain and we haven't already searched, do a verification search
        if (seemsUncertain && !needsInternetSearch && !isSimpleGreeting) {
          console.log('[ToolsModal] 🔍 Response seems uncertain, doing verification search...');
          setThinkingStatus('🌐 Double-checking with web search...');

          try {
            const verificationPrompt = `IMPORTANT: Verify this information using current web sources.

User asked: "${messageText}"

Initial response (may be incorrect): "${finalResponse}"

Your task: Search the web and provide ACCURATE, VERIFIED information about: ${messageText}

If the initial response said something is "fake" or "doesn't exist", verify whether it actually exists using web search. Many real people and things exist that you might not know about.

Provide a clear, accurate answer based on current web information. If you find the initial response was wrong, correct it.`;

            const verifiedResponse = await base44.integrations.Core.InvokeLLM({
              prompt: verificationPrompt,
              add_context_from_internet: true // Force web search
            });

            // Use the verified response instead
            if (typeof verifiedResponse === 'string') {
              finalResponse = verifiedResponse;
            } else if (verifiedResponse.response) {
              finalResponse = verifiedResponse.response;
            } else if (verifiedResponse.content) {
              finalResponse = verifiedResponse.content;
            }

            console.log('[ToolsModal] ✅ Verification complete, using verified response');
          } catch (verifyErr) {
            console.error('[ToolsModal] ⚠️ Verification failed:', verifyErr);
            // Keep original response if verification fails
          }
        }

        // Use the final (potentially verified) response
        let responseText = finalResponse;
        
        // Fallback if still empty
        if (!responseText) {
          // Enhanced fallback with personality
          const greeting = isSimpleGreeting ? `Hey there! 👋` : `Hi! 💫`;
          responseText = `${greeting} I'm **Agent ZK**, your crypto AI companion.\n\n`;
          
          if (linkedWallets.length > 0) {
            responseText += `I'm currently managing **${linkedWallets.length} wallet${linkedWallets.length > 1 ? 's' : ''}** for you. `;
          }
          
          responseText += `\n\n**I can help with:**\n`;
          responseText += `💰 Check your wallet balances\n`;
          responseText += `🔍 Analyze any Kaspa address\n`;
          responseText += `📊 Get KAS price and market info\n`;
          responseText += `💬 Chat about crypto\n\n`;
          responseText += `What would you like to know?`;
        }

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: responseText,
          timestamp: new Date().toISOString()
        }]);

        setThinkingStatus(null);
        setIsSending(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

      } catch (err) {
        console.error('[ToolsModal] ❌ AI conversation failed:', err);
        
        // Friendly error with personality
        let helpText = `Hey! I'm here to help. 😊\n\n`;
        
        if (linkedWallets.length > 0) {
          helpText += `I'm managing **${linkedWallets.length} wallet${linkedWallets.length > 1 ? 's' : ''}** for you.\n\n`;
        }
        
        helpText += `**Try asking:**\n`;
        helpText += `- "Check my balance"\n`;
        helpText += `- "What's the KAS price?"\n`;
        helpText += `- Paste any Kaspa address to analyze\n`;
        helpText += `- "Did I get paid?"\n`;
        helpText += `- Or just chat with me!\n\n`;
        helpText += `I'm here whenever you need me. 💬`;
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: helpText,
          timestamp: new Date().toISOString()
        }]);
        setThinkingStatus(null);
        setIsSending(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }

    } catch (err) {
      console.error('[ToolsModal] ❌ Message handler error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Oops, something went wrong! Try asking me something else. 😊`,
        timestamp: new Date().toISOString()
      }]);
      setThinkingStatus(null);
      setIsSending(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const toggleAnalysisCollapse = (analysisId) => {
    setCollapsedAnalysis(prev => ({
      ...prev,
      [analysisId]: !prev[analysisId]
    }));
  };

  const copyToClipboardWithFeedback = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'wallet') {
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    } else if (type === 'agentId') {
      setCopiedAgentId(true);
      setTimeout(() => setCopiedAgentId(false), 2000);
    } else if (type === 'apiKey') {
      setCopiedApiKey(true);
      setTimeout(() => setCopiedApiKey(false), 2000);
    }
  };

  // Truncate address for display in the Shills tab's Identity Card
  const getTruncatedAddressForDisplay = (address) => {
    if (!address) return 'Not Connected';
    return address.length > 20 ? `${address.substring(0, 10)}...${address.substring(address.length - 8)}` : address;
  };

  return (
    <>
      {/* UPDATED: Three hidden iframes matching test page */}
      <iframe 
        ref={zkCreateIframeRef} 
        src={`${REPLIT_BASE_URL}/zk-create.html`}
        style={{ display: 'none' }}
        title="ZK Create"
      />
      <iframe 
        ref={zkImportIframeRef} 
        src={`${REPLIT_BASE_URL}/zk-import.html`}
        style={{ display: 'none' }}
        title="ZK Import"
      />
      <iframe 
        ref={zkBalanceIframeRef} 
        src={`${REPLIT_BASE_URL}/zk-balance.html`}
        style={{ display: 'none' }}
        title="ZK Balance"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-6xl h-[95vh] sm:h-[90vh] flex flex-col bg-black border border-white/10 rounded-xl overflow-hidden"
        >
          {/* Header - Made more compact on mobile */}
          <div className="flex-shrink-0 p-3 sm:p-4 border-b border-white/10 bg-black">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <Brain className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-2xl font-bold text-white truncate max-w-[180px] sm:max-w-none">
                    {agentName}
                  </h2>
                  <p className="text-[10px] sm:text-sm text-gray-400 truncate max-w-[180px] sm:max-w-none">
                    {linkedWallets.length > 0 
                      ? `Managing ${linkedWallets.length} wallet${linkedWallets.length > 1 ? 's' : ''}`
                      : 'AI Development Agent'
                    }
                  </p>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white h-8 w-8 sm:h-10 sm:w-10"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </div>
          </div>

          {/* UPDATED: Tabs with Shills */}
          <div className="flex-shrink-0 flex border-b border-white/10 bg-black overflow-x-auto">
            {[
              { id: 'chat', icon: MessageSquare, label: 'Chat' },
              { id: 'secrets', icon: Key, label: 'Secrets' },
              { id: 'api', icon: Code, label: 'API' },
              { id: 'wallet', icon: Wallet, label: 'Wallet' },
              { id: 'vp_imports', icon: Search, label: 'VP IMPORTS' },
              { id: 'shills', icon: Zap, label: 'Shills' },
              { id: 'location', icon: Users, label: 'Location' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 py-2 sm:py-4 px-2 sm:px-6 text-sm font-medium transition-all relative ${
                  activeTab === tab.id
                    ? 'bg-purple-500/20 text-purple-400 border-b-2 border-purple-500'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <tab.icon className="w-4 h-4 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge > 0 && (
                    <Badge className="bg-cyan-500 text-white text-[10px] sm:text-xs px-1 sm:px-1.5 py-0 sm:py-0.5 min-w-[16px] sm:min-w-[20px] absolute -top-1 -right-1 sm:static">
                      {tab.badge}
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col bg-black"
              >
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-black">
                  {/* Status Message Banner */}
                  <AnimatePresence>
                    {statusMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`mb-4 px-4 py-3 rounded-lg border ${
                          statusMessage.type === 'success' 
                            ? 'bg-green-500/10 border-green-500/30 text-green-300'
                            : statusMessage.type === 'error'
                            ? 'bg-red-500/10 border-red-500/30 text-red-300'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                          {statusMessage.type === 'error' && <AlertCircle className="w-5 h-5" />}
                          {statusMessage.type === 'info' && <Loader2 className="w-5 h-5 animate-spin" />}
                          <span className="text-sm font-medium">{statusMessage.text}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-col h-[calc(90vh-280px)]"> {/* Adjusted height calculation for chat content */}
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 pb-6">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-400 py-12">
                          <Brain className="w-16 h-16 mx-auto mb-4 text-purple-400/50" />
                          <p>Start a conversation with Agent ZK</p>
                          <p className="text-sm mt-2">Type "TTTV" to watch videos • "shop" to browse items</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((msg, idx) => (
                            <div
                              key={idx}
                              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              {msg.isTTTVWidget ? ( // NEW: Condition for TTTVWidget
                                <div className="w-full">
                                  <TTTVWidget videos={msg.videos} /> {/* NEW: TTTVWidget component */}
                                </div>
                              ) : msg.isShopWidget ? ( // Existing ShopWidget condition
                                <div className="w-full">
                                  <ShopWidget
                                    shopItems={msg.shopItems}
                                    totalItems={msg.totalItems}
                                    userBalance={msg.userBalance}
                                  />
                                </div>
                              ) : msg.isAnalysis ? (
                                // Collapsible Analysis Card
                                <div className="max-w-[85%] w-full">
                                  <div className="bg-gradient-to-br from-cyan-900/30 to-purple-900/30 border border-cyan-500/40 rounded-xl overflow-hidden shadow-lg">
                                    <div 
                                      className="flex items-center justify-between px-5 py-3 bg-black/40 border-b border-cyan-500/30 cursor-pointer hover:bg-black/50 transition-colors"
                                      onClick={() => toggleAnalysisCollapse(msg.analysisId)}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                                        <span className="text-sm font-bold text-cyan-300">📊 Wallet Analysis</span>
                                        <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-xs font-semibold px-2">
                                          {msg.analysisData.balance.toFixed(4)} KAS
                                        </Badge>
                                      </div>
                                      <button className="text-cyan-400 hover:text-cyan-300 transition-colors p-1">
                                        {collapsedAnalysis[msg.analysisId] ? (
                                          <ChevronDown className="w-5 h-5" />
                                        ) : (
                                          <ChevronUp className="w-5 h-5" />
                                        )}
                                      </button>
                                    </div>
                                    
                                    <AnimatePresence>
                                      {!collapsedAnalysis[msg.analysisId] && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="px-5 py-4 bg-black/20">
                                            <ReactMarkdown 
                                              className="text-sm prose prose-invert max-w-none leading-relaxed
                                                [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                                                [&_p]:text-gray-200 [&_p]:my-2
                                                [&_strong]:text-white [&_strong]:font-bold
                                                [&_em]:text-cyan-300"
                                            >
                                              {msg.content}
                                            </ReactMarkdown>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                    
                                    <div className="px-5 py-2 bg-black/30 border-t border-cyan-500/20 text-xs text-gray-400 flex items-center justify-between">
                                      <span>💡 {msg.analysisData.recentPayments} recent payment(s)</span>
                                      <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                // Regular message bubble
                                <div
                                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                                    msg.role === 'user'
                                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                      : 'bg-slate-800 border border-purple-500/20 text-gray-200'
                                  }`}
                                >
                                  <ReactMarkdown className="text-sm prose prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                                    {msg.content}
                                  </ReactMarkdown>
                                  <div className="text-xs text-gray-400 mt-2">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {thinkingStatus && (
                            <div className="flex justify-start">
                              <div className="bg-slate-800 border border-purple-500/20 rounded-2xl px-4 py-3 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                                <span className="text-sm text-gray-300">{thinkingStatus}</span>
                              </div>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Input Area */}
                <div className="flex-shrink-0 p-4 pb-24 border-t border-white/10 bg-black">
                  <div className="flex gap-2">
                    <Textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type 'TTTV' for videos • 'shop' for items"
                      className="flex-1 bg-slate-800 border-purple-500/30 text-white placeholder:text-gray-500 min-h-[60px] max-h-[120px]"
                      disabled={isSending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isSending}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-[60px] px-6"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}



            {activeTab === 'secrets' && (
              <motion.div
                key="secrets"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto p-6 bg-black"
              >
                {/* Status Message Banner */}
                <AnimatePresence>
                  {statusMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`mb-4 px-4 py-3 rounded-lg border ${
                        statusMessage.type === 'success' 
                          ? 'bg-green-500/10 border-green-500/30 text-green-300'
                          : statusMessage.type === 'error'
                          ? 'bg-red-500/10 border-red-500/30 text-red-300'
                          : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                        {statusMessage.type === 'error' && <AlertCircle className="w-5 h-5" />}
                        {statusMessage.type === 'info' && <Loader2 className="w-5 h-5 animate-spin" />}
                        <span className="text-sm font-medium">{statusMessage.text}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Lock className="w-6 h-6 text-purple-400" />
                          <h3 className="text-lg font-semibold text-white">Secret Management</h3>
                        </div>
                        {!isAddingSecret && (
                          <Button
                            onClick={() => setIsAddingSecret(true)}
                            size="sm"
                            className="bg-purple-500 hover:bg-purple-600"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Secret
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isAddingSecret && (
                        <div className="bg-black/30 rounded-lg p-4 space-y-3">
                          <Input
                            placeholder="Secret Key (e.g., API_KEY)"
                            value={newSecret.key}
                            onChange={(e) => setNewSecret({ ...newSecret, key: e.target.value })}
                            className="bg-black/50 border-purple-500/30 text-white"
                          />
                          <Input
                            placeholder="Secret Value"
                            type="password"
                            value={newSecret.value}
                            onChange={(e) => setNewSecret({ ...newSecret, value: e.target.value })}
                            className="bg-black/50 border-purple-500/30 text-white"
                          />
                          <Input
                            placeholder="Description (optional)"
                            value={newSecret.description}
                            onChange={(e) => setNewSecret({ ...newSecret, description: e.target.value })}
                            className="bg-black/50 border-purple-500/30 text-white"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={handleAddSecret}
                              disabled={isSaving}
                              className="flex-1 bg-purple-500 hover:bg-purple-600"
                            >
                              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                              Save
                            </Button>
                            <Button
                              onClick={() => {
                                setIsAddingSecret(false);
                                setNewSecret({ key: "", value: "", description: "" });
                              }}
                              variant="outline"
                              className="border-purple-500/30"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        {secrets.length === 0 ? (
                          <div className="text-center text-gray-400 py-8">
                            <Lock className="w-12 h-12 mx-auto mb-3 text-purple-400/50" />
                            <p>No secrets configured</p>
                          </div>
                        ) : (
                          secrets.map((secret, idx) => (
                            <div
                              key={idx}
                              className="bg-black/30 rounded-lg p-4 flex items-center justify-between"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                                    {secret.key}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <code className="text-sm text-gray-300">
                                    {revealedSecrets.has(idx) ? secret.value : '•'.repeat(20)}
                                  </code>
                                  <Button
                                    onClick={() => toggleRevealSecret(idx)}
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                  >
                                    {revealedSecrets.has(idx) ? (
                                      <EyeOff className="w-3 h-3" />
                                    ) : (
                                      <Eye className="w-3 h-3" />
                                    )}
                                  </Button>
                                </div>
                                {secret.description && (
                                  <p className="text-xs text-gray-400 mt-1">{secret.description}</p>
                                )}
                              </div>
                              <Button
                                onClick={() => handleDeleteSecret(idx)}
                                variant="ghost"
                                size="icon"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === 'api' && (
              <motion.div
                key="api"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto p-6 bg-black"
              >
                {/* Status Message Banner */}
                <AnimatePresence>
                  {statusMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`mb-4 px-4 py-3 rounded-lg border ${
                        statusMessage.type === 'success' 
                          ? 'bg-green-500/10 border-green-500/30 text-green-300'
                          : statusMessage.type === 'error'
                          ? 'bg-red-500/10 border-red-500/30 text-red-300'
                          : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                        {statusMessage.type === 'error' && <AlertCircle className="w-5 h-5" />}
                        {statusMessage.type === 'info' && <Loader2 className="w-5 h-5 animate-spin" />}
                        <span className="text-sm font-medium">{statusMessage.text}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Code className="w-6 h-6 text-purple-400" />
                        <h3 className="text-lg font-semibold text-white">API Configuration</h3>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Agent Wallet Management Section */}
                      <div className="bg-black/30 rounded-lg p-6 border border-purple-500/20">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-400" />
                            <h4 className="text-white font-semibold">Agent ZK Wallets</h4>
                          </div>
                          <Button
                            onClick={() => setShowAddWallet(!showAddWallet)}
                            size="sm"
                            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30"
                          >
                            {showAddWallet ? 'Cancel' : '+ Add Wallet'}
                          </Button>
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-4">
                          Add multiple wallets for Agent ZK to manage. Agent can check balances and transactions across all linked wallets.
                        </p>

                        {/* Linked Wallets List */}
                        {linkedWallets.length > 0 && (
                          <div className="space-y-2 mb-4">
                            {linkedWallets.map((wallet, idx) => (
                              <div
                                key={wallet.address}
                                className="bg-black/50 border border-green-500/30 rounded-lg p-3"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                                      <span className="text-sm font-medium text-white">
                                        Wallet {idx + 1}
                                      </span>
                                      <Badge className="bg-green-500/20 text-green-400 text-xs">
                                        {wallet.wordCount} words
                                      </Badge>
                                    </div>
                                    <code className="text-xs text-green-400 break-all">
                                      {wallet.address}
                                    </code>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Added: {new Date(wallet.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <Button
                                    onClick={() => handleRemoveLinkedWallet(wallet.address)}
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            
                            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mt-3">
                              <div className="text-sm text-purple-300">
                                💡 <strong>{linkedWallets.length} wallet${linkedWallets.length > 1 ? 's' : ''}</strong> accessible to Agent ZK
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Add Wallet Form */}
                        <AnimatePresence>
                          {showAddWallet && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-3 overflow-hidden"
                            >
                              <label className="text-sm font-medium text-gray-300 block">
                                Seed Phrase (12 or 24 words)
                              </label>
                              <Textarea
                                placeholder="Enter seed phrase to add to Agent ZK..."
                                value={agentSeedPhrase}
                                onChange={(e) => setAgentSeedPhrase(e.target.value)}
                                className="bg-black/50 border-purple-500/30 text-white min-h-[100px] placeholder:text-gray-600"
                                disabled={isLinkingWallet}
                              />
                              
                              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                                <div className="flex items-start gap-2 text-yellow-200 text-xs">
                                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="font-medium mb-1">Security Notice</p>
                                    <p>This wallet will be accessible to Agent ZK for balance checks and operations. 
                                    Seed phrase is encrypted and stored securely.</p>
                                  </div>
                                </div>
                              </div>

                              <Button
                                onClick={handleLinkWalletForAgent}
                                disabled={isLinkingWallet || !agentSeedPhrase.trim() || !zkImportReady}
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                              >
                                {isLinkingWallet ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Adding Wallet...
                                  </>
                                ) : (
                                  <>
                                    <Brain className="w-4 h-4 mr-2" />
                                    Add to Agent ZK
                                  </>
                                )}
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Existing API Key Display */}
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">
                          API Key
                        </label>
                        {apiKey ? (
                          <div className="bg-black/30 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <code className="text-sm text-purple-400">{apiKey.substring(0, 20)}...</code>
                              <Button
                                onClick={() => copyToClipboardWithFeedback(apiKey, 'apiKey')}
                                variant="ghost"
                                size="sm"
                              >
                                {copiedApiKey ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            {linkedWallets.length > 0 && (
                              <div className="mt-2 text-xs text-gray-500">
                                Access to {linkedWallets.length} wallet{linkedWallets.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Button
                            onClick={handleGenerateApiKey}
                            disabled={isGeneratingKey}
                            className="w-full bg-purple-500 hover:bg-purple-600"
                          >
                            {isGeneratingKey ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Zap className="w-4 h-4 mr-2" />
                            )}
                            Generate API Key
                          </Button>
                        )}
                      </div>

                      {apiKey && (
                        <div>
                          <label className="text-sm font-medium text-gray-300 mb-2 block">
                            Test API Endpoint
                          </label>
                          <div className="space-y-3">
                            <Input
                              placeholder="Enter Kaspa wallet address to test"
                              value={testWalletAddress}
                              onChange={(e) => setTestWalletAddress(e.target.value)}
                              className="bg-black/30 border-purple-500/30 text-white"
                            />
                            <Button
                              onClick={handleTestApi}
                              disabled={isTesting || !testWalletAddress}
                              className="w-full bg-purple-500 hover:bg-purple-600"
                            >
                              {isTesting ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Zap className="w-4 h-4 mr-2" />
                              )}
                              Test API
                            </Button>

                            {testResult && (
                              <div className={`rounded-lg p-4 ${
                                testResult.success
                                  ? 'bg-green-500/10 border border-green-500/30'
                                  : 'bg-red-500/10 border border-red-500/30'
                              }`}>
                                <div className="flex items-center gap-2 mb-2">
                                  {testResult.success ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                  ) : (
                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                  )}
                                  <span className="font-medium text-white">
                                    {testResult.success ? 'Success' : 'Error'}
                                  </span>
                                </div>
                                <pre className="text-xs text-gray-300 overflow-x-auto">
                                  {JSON.stringify(testResult.data || testResult.error, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === 'wallet' && (
              <motion.div
                key="wallet"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto p-6 bg-black"
              >
                {/* Status Message Banner */}
                <AnimatePresence>
                  {statusMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`mb-4 px-4 py-3 rounded-lg border ${
                        statusMessage.type === 'success' 
                          ? 'bg-green-500/10 border-green-500/30 text-green-300'
                          : statusMessage.type === 'error'
                          ? 'bg-red-500/10 border-red-500/30 text-red-300'
                          : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                        {statusMessage.type === 'error' && <AlertCircle className="w-5 h-5" />}
                        {statusMessage.type === 'info' && <Loader2 className="w-5 h-5 animate-spin" />}
                        <span className="text-sm font-medium">{statusMessage.text}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  {walletMode === 'list' && (
                    <Card className="bg-slate-800 border-purple-500/30">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Wallet className="w-6 h-6 text-purple-400" />
                            <h3 className="text-lg font-semibold text-white">ZK Wallet</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`${
                              zkCreateReady && zkImportReady && zkBalanceReady
                                ? 'border-green-500/50 text-green-400 bg-green-500/10'
                                : 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'
                            }`}>
                              {zkCreateReady && zkImportReady && zkBalanceReady ? '✅ System Ready' : '⏳ Loading...'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {!currentZKWallet ? (
                          <div className="text-center py-8">
                            <Wallet className="w-16 h-16 mx-auto mb-4 text-purple-400/50" />
                            <p className="text-gray-300 mb-4">No ZK Wallet Connected</p>
                            <p className="text-sm text-gray-500 mb-6">Create or import a ZK wallet to get started</p>
                            <div className="flex gap-3 justify-center">
                              <Button
                                onClick={() => setWalletMode('create')}
                                disabled={!zkCreateReady}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Create ZK Wallet
                              </Button>
                              <Button
                                onClick={() => setWalletMode('import')}
                                disabled={!zkImportReady}
                                variant="outline"
                                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                              >
                                Import Wallet
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="bg-slate-950/50 rounded-lg p-6 mb-4 border border-purple-500/20">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                  <span className="text-sm text-gray-300">Connected</span>
                                </div>
                                <Badge variant="outline" className="border-purple-500/50 text-purple-400 bg-purple-500/10">
                                  {currentZKWallet.wordCount} words
                                </Badge>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="text-xs text-gray-400 mb-1 block">Balance</label>
                                  <div className="text-3xl font-bold text-white">
                                    {isLoadingWallet ? (
                                      <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                                    ) : zkBalance ? (
                                      `${zkBalance.balanceKAS.toFixed(8)} KAS`
                                    ) : (
                                      '0.00000000 KAS'
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <label className="text-xs text-gray-400 mb-1 block">Wallet Address</label>
                                  <div className="flex items-center gap-2">
                                    <code className="text-sm text-purple-400 break-all flex-1">
                                      {currentZKWallet.address}
                                    </code>
                                    <Button
                                      onClick={() => copyToClipboardWithFeedback(currentZKWallet.address, 'wallet')}
                                      variant="ghost"
                                      size="sm"
                                      className="text-gray-400 hover:text-white"
                                    >
                                      {copiedWallet ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  <span className="text-xs text-gray-400">
                                    Created {new Date(currentZKWallet.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {zkUtxos && zkUtxos.length > 0 && (
                              <div className="bg-slate-950/30 rounded-lg p-4 border border-purple-500/20">
                                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-purple-400" />
                                  Transaction History
                                </h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {zkUtxos.slice(0, 10).map((utxo, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-slate-900/50 rounded p-3 text-xs border border-slate-700/50"
                                    >
                                      <div className="flex justify-between items-center">
                                        <span className="text-purple-400 font-medium">
                                          {(utxo.amount / 100000000).toFixed(8)} KAS
                                        </span>
                                        {utxo.timestamp && (
                                          <span className="text-gray-500">
                                            {new Date(utxo.timestamp).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                      {utxo.txId && (
                                        <div className="text-gray-400 mt-1 truncate">
                                          {utxo.txId.substring(0, 20)}...
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2 mt-4">
                              <Button
                                onClick={() => loadZKWalletData(currentZKWallet.address)}
                                variant="outline"
                                size="sm"
                                className="flex-1 border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                                disabled={isLoadingWallet || !zkBalanceReady}
                              >
                                {isLoadingWallet ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                onClick={() => setWalletMode('create')}
                                variant="outline"
                                size="sm"
                                className="flex-1 border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                New Wallet
                              </Button>
                              <Button
                                onClick={handleLogoutWallet}
                                variant="outline"
                                size="sm"
                                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {walletMode === 'create' && (
                    <Card className="bg-slate-800 border-purple-500/30">
                      <CardHeader>
                        <h3 className="text-lg font-semibold text-white">Create ZK Wallet</h3>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-slate-950/50 rounded-lg p-4 border border-purple-500/20">
                          <div className="flex items-center gap-2 text-purple-400 mb-2">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-medium">24 words (256-bit entropy)</span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Highest security wallet with maximum entropy
                          </p>
                        </div>

                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-yellow-200">
                              <p className="font-medium mb-1">Important Security Notice</p>
                              <p>Your seed phrase will be encrypted and stored. Never share it with anyone.</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            onClick={handleCreateZKWallet}
                            disabled={isProcessingWallet || !zkCreateReady}
                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                          >
                            {isProcessingWallet ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Zap className="w-4 h-4 mr-2" />
                            )}
                            {isProcessingWallet ? 'Creating...' : 'Create Wallet'}
                          </Button>
                          <Button
                            onClick={() => setWalletMode('list')}
                            variant="outline"
                            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {walletMode === 'import' && (
                    <Card className="bg-slate-800 border-purple-500/30">
                      <CardHeader>
                        <h3 className="text-lg font-semibold text-white">Import ZK Wallet</h3>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-300 mb-2 block">
                            Seed Phrase (12 or 24 words)
                          </label>
                          <Textarea
                            placeholder="Enter your seed phrase..."
                            value={importMnemonic}
                            onChange={(e) => setImportMnemonic(e.target.value)}
                            className="bg-slate-950/50 border-purple-500/30 text-white min-h-[120px] placeholder:text-gray-600"
                          />
                        </div>

                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-red-200">
                              <p className="font-medium mb-1">Security Warning</p>
                              <p>Never share your seed phrase. Anyone with access can control your wallet.</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            onClick={handleImportZKWallet}
                            disabled={isProcessingWallet || !importMnemonic.trim() || !zkImportReady}
                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                          >
                            {isProcessingWallet ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Zap className="w-4 h-4 mr-2" />
                            )}
                            {isProcessingWallet ? 'Importing...' : 'Import Wallet'}
                          </Button>
                          <Button
                            onClick={() => {
                              setWalletMode('list');
                              setImportMnemonic('');
                            }}
                            variant="outline"
                            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'vp_imports' && (
              <motion.div
                key="vp_imports"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto p-6 bg-black"
              >
                {/* Status Message Banner */}
                <AnimatePresence>
                  {statusMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`mb-4 px-4 py-3 rounded-lg border ${
                        statusMessage.type === 'success' 
                          ? 'bg-green-500/10 border-green-500/30 text-green-300'
                          : statusMessage.type === 'error'
                          ? 'bg-red-500/10 border-red-500/30 text-red-300'
                          : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                        {statusMessage.type === 'error' && <AlertCircle className="w-5 h-5" />}
                        {statusMessage.type === 'info' && <Loader2 className="w-5 h-5 animate-spin" />}
                        <span className="text-sm font-medium">{statusMessage.text}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Search className="w-6 h-6 text-purple-400" />
                        <div>
                          <h3 className="text-lg font-semibold text-white">VP Imports</h3>
                          <p className="text-sm text-gray-400">View any Kaspa wallet balance & history</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-black/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-purple-400 mb-3">
                          <Badge variant="outline" className={`${
                            zkBalanceReady
                              ? 'border-green-500/50 text-green-400'
                              : 'border-yellow-500/50 text-yellow-400'
                          }`}>
                            {zkBalanceReady ? '✅ System Ready' : '⏳ Loading...'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400">
                          Go to the <strong>Chat</strong> tab and paste any Kaspa address to analyze it.
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Agent ZK will fetch live balance and transaction history for any wallet.
                        </p>
                      </div>

                      {vpBalance && (
                        <div className="bg-black/30 rounded-lg p-6">
                          <h4 className="text-sm font-medium text-white mb-4">Last Analyzed Wallet</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-gray-500">Address</label>
                              <code className="text-xs text-purple-400 block break-all">
                                {vpBalance.address}
                              </code>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Balance</label>
                              <div className="text-2xl font-bold text-white">
                                {vpBalance.balance.toFixed(8)} KAS
                              </div>
                            </div>
                            {vpBalance.utxos && vpBalance.utxos.length > 0 && (
                              <div>
                                <label className="text-xs text-gray-500 mb-2 block">
                                  Recent Transactions ({vpBalance.utxos.length})
                                </label>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                  {vpBalance.utxos.slice(0, 5).map((utxo, idx) => (
                                    <div key={idx} className="bg-black/30 rounded p-2 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-purple-400">
                                          {(utxo.amount / 100000000).toFixed(8)} KAS
                                        </span>
                                        {utxo.timestamp && (
                                          <span className="text-gray-500">
                                            {new Date(utxo.timestamp).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* NEW: Location Tab */}
            {activeTab === 'location' && (
              <motion.div
                key="location"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto p-6 bg-black"
              >
                <AnimatePresence>
                  {statusMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`mb-4 px-4 py-3 rounded-lg border ${
                        statusMessage.type === 'success' 
                          ? 'bg-green-500/10 border-green-500/30 text-green-300'
                          : statusMessage.type === 'error'
                          ? 'bg-red-500/10 border-red-500/30 text-red-300'
                          : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                        {statusMessage.type === 'error' && <AlertCircle className="w-5 h-5" />}
                        {statusMessage.type === 'info' && <Loader2 className="w-5 h-5 animate-spin" />}
                        <span className="text-sm font-medium">{statusMessage.text}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-purple-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">Location Tracker</h3>
                        <p className="text-sm text-gray-400">Encrypted location for Agent ZK</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20">
                      <div className="flex items-start gap-3">
                        <Lock className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-gray-300">
                          <p className="font-medium mb-1 text-white">Privacy First</p>
                          <p>Your location is encrypted and only accessible to Agent ZK by default. Toggle sharing to make it available to other app features.</p>
                        </div>
                      </div>
                    </div>

                    {userLocation ? (
                      <div className="space-y-4">
                        <div className="bg-black/50 border border-green-500/30 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            <span className="text-white font-semibold">Location Active</span>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">City:</span>
                              <span className="text-white font-medium">{userLocation.city}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Country:</span>
                              <span className="text-white font-medium">{userLocation.country}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Coordinates:</span>
                              <code className="text-purple-400 text-xs">
                                {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                              </code>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Accuracy:</span>
                              <span className="text-white">±{userLocation.accuracy?.toFixed(0)}m</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Last Updated:</span>
                              <span className="text-white text-xs">
                                {new Date(userLocation.last_updated).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-black/30 border border-purple-500/20 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-white font-medium text-sm mb-1">Share with App</div>
                              <p className="text-xs text-gray-400">
                                {locationSharing ? 'Location visible to app features' : 'Location encrypted for Agent ZK only'}
                              </p>
                            </div>
                            <button
                              onClick={handleToggleLocationSharing}
                              className={`relative w-14 h-7 rounded-full transition-colors ${
                                locationSharing ? 'bg-green-500' : 'bg-gray-600'
                              }`}
                            >
                              <div
                                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                                  locationSharing ? 'translate-x-7' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        <Button
                          onClick={handleGetLocation}
                          disabled={isLoadingLocation}
                          className="w-full bg-purple-500 hover:bg-purple-600"
                        >
                          {isLoadingLocation ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Update Location
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-16 h-16 mx-auto mb-4 text-purple-400/50" />
                        <p className="text-gray-300 mb-4">Location Not Set</p>
                        <p className="text-sm text-gray-500 mb-6">
                          Enable location to help Agent ZK provide location-aware assistance
                        </p>
                        <Button
                          onClick={handleGetLocation}
                          disabled={isLoadingLocation}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        >
                          {isLoadingLocation ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Getting Location...
                            </>
                          ) : (
                            <>
                              <Users className="w-4 h-4 mr-2" />
                              Enable Location
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ENHANCED: Shills Tab with Agent Identity */}
            {activeTab === 'shills' && (
              <motion.div
                key="shills"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto p-4 bg-black"
              >
                <AnimatePresence>
                  {statusMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`mb-4 px-3 py-2 rounded-lg border ${
                        statusMessage.type === 'success' 
                          ? 'bg-green-500/10 border-green-500/30 text-green-300'
                          : statusMessage.type === 'error'
                          ? 'bg-red-500/10 border-red-500/30 text-red-300'
                          : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                        {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4" />}
                        {statusMessage.type === 'info' && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span className="text-xs font-medium">{statusMessage.text}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  {/* NEW: Agent Identity Card - Black on Black */}
                  <Card className="bg-black border border-purple-500/30">
                    <CardContent className="p-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Agent ZK Name */}
                        <div className="bg-black border border-purple-500/20 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">Agent ZK Identity</div>
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-bold text-sm mb-0.5">
                                {agentProfile?.username || currentUser?.username || 'Agent'}
                              </div>
                              <code className="text-xs text-purple-400 font-mono">
                                {agentProfile?.agent_zk_id || 'Not set'}
                              </code>
                            </div>
                            {agentProfile?.agent_zk_id && (
                              <Button
                                onClick={() => copyToClipboardWithFeedback(agentProfile.agent_zk_id, 'agentId')}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                              >
                                {copiedAgentId ? (
                                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* TTT Wallet */}
                        <div className="bg-black border border-purple-500/20 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">TTT Wallet</div>
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <code className="text-xs text-cyan-400 font-mono block truncate">
                                {getTruncatedAddressForDisplay(
                                  agentProfile?.wallet_address || 
                                  currentUser?.created_wallet_address || 
                                  currentZKWallet?.address
                                )}
                              </code>
                              {(agentProfile?.wallet_address || currentUser?.created_wallet_address || currentZKWallet?.address) && (
                                <div className="text-[10px] text-gray-600 mt-0.5">Connected</div>
                              )}
                            </div>
                            {(agentProfile?.wallet_address || currentUser?.created_wallet_address || currentZKWallet?.address) && (
                              <Button
                                onClick={() => copyToClipboardWithFeedback(
                                  agentProfile?.wallet_address || 
                                  currentUser?.created_wallet_address || 
                                  currentZKWallet?.address, 
                                  'wallet'
                                )}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                              >
                                {copiedWallet ? (
                                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* KNS.KID Profile Section - Black on Black */}
                  <Card className="bg-black border border-purple-500/30">
                    <CardHeader className="border-b border-purple-500/20 pb-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-purple-400" />
                        <h3 className="text-base font-bold text-white">Shills Profile</h3>
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                          KNS.KID
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid md:grid-cols-[300px_1fr] gap-6">
                        {/* LEFT: Large KNS.KID Display */}
                        <div className="flex flex-col items-center">
                          {knsKidUrl ? (
                            <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border-2 border-purple-500/50 bg-black">
                              <img 
                                src={knsKidUrl} 
                                alt="KNS.KID"
                                className="w-full h-full object-contain"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />
                            </div>
                          ) : (
                            <div 
                              onClick={() => knsFileInputRef.current?.click()}
                              className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-purple-500/30 bg-black flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all"
                            >
                              <ImageIcon className="w-16 h-16 text-purple-400 mb-4" />
                              <span className="text-sm text-purple-400 font-semibold mb-1">Upload KNS.KID</span>
                              <span className="text-xs text-gray-500">Click to browse</span>
                            </div>
                          )}
                          <input
                            ref={knsFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleKnsUpload}
                            className="hidden"
                          />
                          
                          <Button
                            onClick={() => knsFileInputRef.current?.click()}
                            disabled={isUploadingKns}
                            size="sm"
                            className="w-full mt-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/40 h-9"
                          >
                            {isUploadingKns ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                {knsKidUrl ? 'Change Card' : 'Upload Card'}
                              </>
                            )}
                          </Button>

                          {knsKidUrl && (
                            <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Card Active
                            </div>
                          )}
                        </div>

                        {/* RIGHT: Tags, Links & Info - Black on Black */}
                        <div className="space-y-4">
                          {/* Social Links Section */}
                          <div className="bg-black border border-purple-500/20 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <Globe className="w-4 h-4 text-purple-400" />
                                Social Links
                              </h4>
                              {!isEditingSocials ? (
                                <Button
                                  onClick={() => setIsEditingSocials(true)}
                                  size="sm"
                                  className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/40 h-7 px-3 text-xs"
                                >
                                  Edit
                                </Button>
                              ) : (
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleSaveSocialLinks}
                                    disabled={isSavingSocials}
                                    size="sm"
                                    className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/40 h-7 px-3 text-xs"
                                  >
                                    {isSavingSocials ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                                  </Button>
                                  <Button
                                    onClick={() => setIsEditingSocials(false)}
                                    size="sm"
                                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 h-7 px-3 text-xs"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              )}
                            </div>

                            {isEditingSocials ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Twitter className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                                  <Input
                                    placeholder="@username"
                                    value={socialLinks.twitter}
                                    onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                                    className="bg-black border-purple-500/30 text-white h-8 text-xs"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                  <Input
                                    placeholder="https://yourwebsite.com"
                                    value={socialLinks.website}
                                    onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                                    className="bg-black border-purple-500/30 text-white h-8 text-xs"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Send className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                  <Input
                                    placeholder="@telegram"
                                    value={socialLinks.telegram}
                                    onChange={(e) => setSocialLinks({ ...socialLinks, telegram: e.target.value })}
                                    className="bg-black border-purple-500/30 text-white h-8 text-xs"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {socialLinks.twitter && (
                                  <a
                                    href={`https://twitter.com/${socialLinks.twitter.replace('@', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm group"
                                  >
                                    <Twitter className="w-4 h-4" />
                                    <span>{socialLinks.twitter}</span>
                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </a>
                                )}
                                {socialLinks.website && (
                                  <a
                                    href={socialLinks.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm group"
                                  >
                                    <Globe className="w-4 h-4" />
                                    <span className="truncate">{socialLinks.website}</span>
                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                  </a>
                                )}
                                {socialLinks.telegram && (
                                  <a
                                    href={`https://t.me/${socialLinks.telegram.replace('@', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-500 hover:text-blue-400 text-sm group"
                                  >
                                    <Send className="w-4 h-4" />
                                    <span>{socialLinks.telegram}</span>
                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </a>
                                )}
                                {!socialLinks.twitter && !socialLinks.website && !socialLinks.telegram && (
                                  <p className="text-xs text-gray-500 text-center py-2">
                                    No social links added yet
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Quick Stats - Black on Black */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-black border border-cyan-500/30 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-cyan-400">{shills.length}</div>
                              <div className="text-xs text-gray-400">Shills</div>
                            </div>
                            <div className="bg-black border border-purple-500/30 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-purple-400">
                                {Object.values(socialLinks).filter(Boolean).length}
                              </div>
                              <div className="text-xs text-gray-400">Links</div>
                            </div>
                          </div>

                          {/* Pro Tip - Black on Black */}
                          <div className="bg-black border border-cyan-500/30 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <Zap className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                              <div className="text-xs text-cyan-200">
                                <p className="font-semibold mb-1">Pro Tip</p>
                                <p className="text-[10px] leading-relaxed text-gray-400">
                                  Upload your KNS.KID card to showcase your identity. Add social links to make it easy for others to connect with you.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Shills Manager - Black on Black */}
                  <Card className="bg-black border border-purple-500/30">
                    <CardHeader className="pb-3 border-b border-purple-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-purple-400" />
                          <div>
                            <h3 className="text-base font-bold text-white">Shills Manager</h3>
                            <p className="text-xs text-gray-400">Quick promotional messages</p>
                          </div>
                        </div>
                        {!isAddingShill && (
                          <Button
                            onClick={() => setIsAddingShill(true)}
                            size="sm"
                            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/40 h-8 px-3 text-xs"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            New
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                      {/* Add Shill Form */}
                      {isAddingShill && (
                        <div className="bg-black border border-purple-500/20 rounded-lg p-3 space-y-2">
                          <Input
                            placeholder="Title"
                            value={newShill.title}
                            onChange={(e) => setNewShill({ ...newShill, title: e.target.value })}
                            className="bg-black border-purple-500/30 text-white h-8 text-xs placeholder:text-gray-600"
                          />
                          <Textarea
                            placeholder="Your shill message..."
                            value={newShill.message}
                            onChange={(e) => setNewShill({ ...newShill, message: e.target.value })}
                            className="bg-black border-purple-500/30 text-white h-20 text-xs placeholder:text-gray-600 resize-none"
                          />
                          <Input
                            placeholder="Link (optional)"
                            value={newShill.link}
                            onChange={(e) => setNewShill({ ...newShill, link: e.target.value })}
                            className="bg-black border-purple-500/30 text-white h-8 text-xs placeholder:text-gray-600"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={handleAddShill}
                              disabled={isSavingShill}
                              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-8 text-xs"
                            >
                              {isSavingShill ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="w-3 h-3 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => {
                                setIsAddingShill(false);
                                setNewShill({ title: "", message: "", link: "" });
                              }}
                              variant="outline"
                              className="border-purple-500/30 text-white hover:bg-white/5 h-8 px-3 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Shills List */}
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {shills.length === 0 ? (
                          <div className="text-center text-gray-400 py-8">
                            <Zap className="w-12 h-12 mx-auto mb-3 text-purple-400/50" />
                            <p className="text-xs mb-1">No shills created yet</p>
                            <p className="text-xs text-gray-500">
                              Create quick promotional messages
                            </p>
                          </div>
                        ) : (
                          shills.map((shill) => (
                            <motion.div
                              key={shill.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-black border border-purple-500/20 rounded-lg p-3 hover:border-purple-500/40 transition-all"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-white font-semibold text-xs mb-1 truncate">{shill.title}</h4>
                                  <p className="text-xs text-gray-400 mb-2 line-clamp-3 leading-relaxed">
                                    {shill.message}
                                  </p>
                                  {shill.link && (
                                    <a
                                      href={shill.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 truncate"
                                    >
                                      🔗 {shill.link.substring(0, 35)}...
                                    </a>
                                  )}
                                </div>
                                <Button
                                  onClick={() => handleDeleteShill(shill.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 w-6 p-0 flex-shrink-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => copyShillToClipboard(shill)}
                                  size="sm"
                                  className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 h-7 text-xs"
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copy
                                </Button>
                                <div className="text-[10px] text-gray-500">
                                  {new Date(shill.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Connect Modal */}
      <AnimatePresence>
        {showConnectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isConnecting && setShowConnectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-cyan-500/30 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Connect to Agent ZK</h2>
                  <p className="text-xs text-gray-400">Enter the Kaspa address</p>
                </div>
              </div>

              <div className="mb-6">
                <Input
                  value={connectAddress}
                  onChange={(e) => setConnectAddress(e.target.value)}
                  placeholder="kaspa:qqq..."
                  className="bg-zinc-900 border-cyan-500/30 text-white font-mono"
                  disabled={isConnecting}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleConnectToAgent}
                  disabled={isConnecting || !connectAddress.trim()}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowConnectModal(false);
                    setConnectAddress('');
                  }}
                  disabled={isConnecting}
                  variant="outline"
                  className="border-zinc-700 text-white hover:bg-zinc-800"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}