import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, TrendingUp, Loader2, Plus, Trash2, CheckCircle2, 
  AlertCircle, Calendar, CreditCard, Wifi, FileText, Zap, 
  Sparkles, Settings, PieChart, Wand2, X
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function AgentFYEPage() {
  const queryClient = useQueryClient();
  const [kasPrice, setKasPrice] = useState(null);
  const [liveBalance, setLiveBalance] = useState(0);
  const [showAddBill, setShowAddBill] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [chatMode, setChatMode] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [hideLocation, setHideLocation] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const [selectedDate, setSelectedDate] = useState({
    month: new Date().getMonth(),
    day: new Date().getDate(),
    year: new Date().getFullYear()
  });
  const [newBill, setNewBill] = useState({
    bill_name: '',
    amount_usd: '',
    bill_type: 'subscription',
    frequency: 'monthly',
    category: '',
    notes: ''
  });

  const { data: bills = [], isLoading: billsLoading } = useQuery({
    queryKey: ['bills'],
    queryFn: () => base44.entities.Bill.list('-due_date'),
    initialData: []
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ['snapshots'],
    queryFn: () => base44.entities.FinancialSnapshot.list('-snapshot_date', 1),
    initialData: []
  });

  useEffect(() => {
    fetchKasPrice();
    const interval = setInterval(fetchKasPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (snapshots[0]) {
      setLiveBalance(snapshots[0].equivalent_kas);
    }
  }, [snapshots]);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, streamingMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const requestLocationPermission = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
            );
            const data = await response.json();
            setUserLocation({
              city: data.city || data.locality,
              state: data.principalSubdivision,
              country: data.countryName
            });
            setLocationPermission('granted');
          } catch (err) {
            console.error('Failed to get location details:', err);
          }
        },
        () => {
          setLocationPermission('denied');
        }
      );
    }
  };

  const fetchKasPrice = async () => {
    try {
      const response = await base44.functions.invoke('getKaspaPrice');
      if (response.data?.price) {
        setKasPrice(response.data.price);
      }
    } catch (err) {
      console.error('Failed to fetch KAS price:', err);
    }
  };

  const createBillMutation = useMutation({
    mutationFn: (bill) => base44.entities.Bill.create(bill),
    onSuccess: () => {
      queryClient.invalidateQueries(['bills']);
      setShowAddBill(false);
      resetNewBill();
    }
  });

  const updateBillMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Bill.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['bills'])
  });

  const deleteBillMutation = useMutation({
    mutationFn: (id) => base44.entities.Bill.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['bills'])
  });

  const createSnapshotMutation = useMutation({
    mutationFn: (snapshot) => base44.entities.FinancialSnapshot.create(snapshot),
    onSuccess: () => queryClient.invalidateQueries(['snapshots'])
  });

  const updateSnapshotMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FinancialSnapshot.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['snapshots'])
  });

  const resetNewBill = () => {
    setNewBill({
      bill_name: '',
      amount_usd: '',
      bill_type: 'subscription',
      frequency: 'monthly',
      category: '',
      notes: ''
    });
    setSelectedDate({
      month: new Date().getMonth(),
      day: new Date().getDate(),
      year: new Date().getFullYear()
    });
  };

  const handleAddBill = () => {
    if (!newBill.bill_name || !newBill.amount_usd) {
      alert('Please fill in required fields');
      return;
    }

    const dueDate = new Date(selectedDate.year, selectedDate.month, selectedDate.day);

    createBillMutation.mutate({
      ...newBill,
      amount_usd: parseFloat(newBill.amount_usd),
      due_date: dueDate.toISOString()
    });
  };

  const handleMarkAsPaid = async (bill) => {
    const kasAmount = bill.amount_usd / kasPrice;
    const newBalance = liveBalance - kasAmount;

    await updateBillMutation.mutateAsync({
      id: bill.id,
      data: {
        status: 'paid',
        paid_date: new Date().toISOString()
      }
    });

    if (snapshots[0]) {
      await updateSnapshotMutation.mutateAsync({
        id: snapshots[0].id,
        data: {
          equivalent_kas: newBalance,
          total_usd: newBalance * kasPrice
        }
      });
    }

    setLiveBalance(newBalance);
  };

  const handleQuickAdd = async () => {
    const billName = prompt('Bill name:');
    const amount = prompt('Amount (USD):');
    if (billName && amount) {
      await createBillMutation.mutateAsync({
        bill_name: billName,
        amount_usd: parseFloat(amount),
        bill_type: 'subscription',
        frequency: 'monthly',
        due_date: new Date().toISOString()
      });
    }
  };

  const handleAIAnalyze = async () => {
    if (bills.length === 0) {
      alert('Add some bills first to get AI insights');
      return;
    }

    setIsAnalyzing(true);
    setChatMode(true); // Go directly to chat mode
    setChatMessages([]);
    
    // Mobile: open modal, Desktop: inline
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setShowAIModal(true);
    }
    
    try {
      const billsSummary = bills.map(b => ({
        name: b.bill_name,
        amount: b.amount_usd,
        type: b.bill_type,
        category: b.category
      }));

      const locationContext = userLocation 
        ? `User location: ${userLocation.city}, ${userLocation.state}, ${userLocation.country}. Focus on providers available in this area.`
        : 'User location not available. Provide general recommendations.';

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${locationContext}

Analyze these bills: ${JSON.stringify(billsSummary)}
        
Provide a detailed financial analysis including:
1. Total volatility assessment based on current market conditions
2. Price comparison with local providers in the user's city/state
3. Specific nearby alternative providers with exact names and locations
4. Potential savings per bill with realistic estimates
5. Market trends affecting these expenses
6. Distance to nearest alternative providers

Write this as a natural conversational analysis, not as a JSON response. Be detailed and specific.`,
        add_context_from_internet: true
      });

      const analysisText = typeof result === 'string' ? result : result.response || result.content || JSON.stringify(result);
      
      setAiInsights(result);
      
      // Add AI analysis to chat
      setChatMessages([{
        role: 'assistant',
        content: analysisText
      }]);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        const chatContainer = document.querySelector('.chat-messages-container');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
      
    } catch (err) {
      console.error('AI analysis failed:', err);
      alert('Analysis failed. Try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedImages(prev => [...prev, file_url]);

      // Analyze the image
      const userMessage = { role: 'user', content: '📷 Analyzing uploaded document...' };
      setChatMessages(prev => [...prev, userMessage]);

      const billsSummary = bills.map(b => ({
        name: b.bill_name,
        amount: b.amount_usd,
        type: b.bill_type,
        category: b.category
      }));

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Agent FYE, a financial analyst AI. Analyze this uploaded document/image. Extract any financial information, bills, receipts, or expenses you can see.

Current user bills: ${JSON.stringify(billsSummary)}

Provide insights on:
1. What financial information is in the image
2. How it relates to their existing bills
3. Any recommendations or savings opportunities
4. Should they add this as a new bill?

Be specific and actionable.`,
        file_urls: [file_url],
        add_context_from_internet: false
      });

      const analysisText = typeof response === 'string' ? response : response.response || response.content || 'Analysis complete.';

      // Save to hive mind (knowledge base)
      await base44.entities.AgentMemory.create({
        agent_name: 'Agent FYE',
        memory_type: 'document_scan',
        memory_content: analysisText,
        memory_metadata: {
          file_url,
          bills_count: bills.length,
          timestamp: new Date().toISOString()
        }
      });

      // Stream the response with typewriter effect
      await streamResponse(analysisText);

    } catch (err) {
      console.error('Document analysis failed:', err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Failed to analyze document. Try again.' }]);
    } finally {
      setIsUploading(false);
      setUploadedImages([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const streamResponse = async (text) => {
    setIsStreaming(true);
    setStreamingMessage('');
    
    const words = text.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? ' ' : '') + words[i];
      setStreamingMessage(currentText);
      await new Promise(resolve => setTimeout(resolve, 30)); // Typewriter speed
    }
    
    setChatMessages(prev => [...prev, { role: 'assistant', content: text }]);
    setIsStreaming(false);
    setStreamingMessage('');
  };

  const handleChatWithAI = async () => {
    if (!chatInput.trim() || !aiInsights) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');
    
    setIsChatLoading(true);

    try {
      const billsSummary = bills.map(b => ({
        name: b.bill_name,
        amount: b.amount_usd,
        type: b.bill_type,
        category: b.category
      }));

      const locationContext = userLocation 
        ? `User is in ${userLocation.city}, ${userLocation.state}, ${userLocation.country}.`
        : 'User location not available.';

      const conversationHistory = chatMessages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Agent FYE, a financial advisor AI helping analyze bills and find savings.

${locationContext}

User's bills: ${JSON.stringify(billsSummary)}

Previous analysis: ${JSON.stringify(aiInsights)}

Conversation history:
${conversationHistory}

User question: ${currentInput}

Provide a helpful, specific answer. If they ask about locations or providers, search for real information in their area. Be conversational and practical.`,
        add_context_from_internet: true
      });

      const responseText = typeof response === 'string' ? response : response.response || response.content || 'I can help you understand your bills better.';
      
      // Save to hive mind
      await base44.entities.AgentMemory.create({
        agent_name: 'Agent FYE',
        memory_type: 'chat_interaction',
        memory_content: `User: ${currentInput}\nAgent: ${responseText}`,
        memory_metadata: {
          bills_count: bills.length,
          location: userLocation,
          timestamp: new Date().toISOString()
        }
      });

      // Stream the response
      await streamResponse(responseText);
      
    } catch (err) {
      console.error('Chat failed:', err);
      const errorMessage = { role: 'assistant', content: 'Sorry, I had trouble responding. Try again.' };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleUpdateBalance = async () => {
    const amount = prompt('Enter your current KAS balance:');
    if (amount && kasPrice) {
      const kasAmount = parseFloat(amount);
      await createSnapshotMutation.mutateAsync({
        total_usd: kasAmount * kasPrice,
        kas_price_at_time: kasPrice,
        equivalent_kas: kasAmount,
        snapshot_date: new Date().toISOString()
      });
      setLiveBalance(kasAmount);
    }
  };

  const totalUnpaid = bills.filter(b => b.status === 'unpaid').reduce((sum, b) => sum + b.amount_usd, 0);
  const currentUSDValue = liveBalance * kasPrice;

  const pieData = bills
    .filter(b => b.status === 'unpaid')
    .reduce((acc, bill) => {
      const category = bill.category || bill.bill_type;
      const existing = acc.find(item => item.name === category);
      if (existing) {
        existing.value += bill.amount_usd;
      } else {
        acc.push({ name: category, value: bill.amount_usd });
      }
      return acc;
    }, []);

  const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#d946ef'];

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = [2025, 2026, 2027];

  return (
    <div className="min-h-screen bg-black p-2 md:p-4">
      <div className="max-w-[1800px] mx-auto">
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Agent FYE</h1>
                <p className="text-xs text-gray-600">Fire Yields Portfolio</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleQuickAdd}
                size="sm"
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white h-8 px-3 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Quick
              </Button>
              <Button
                onClick={handleAIAnalyze}
                disabled={isAnalyzing}
                size="sm"
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white h-8 px-3 text-xs"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Location Banner */}
        {!hideLocation && locationPermission === 'granted' && userLocation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3"
          >
            <Card className="bg-white/5 border border-white/10">
              <CardContent className="p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                    <span className="text-xs">📍</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {userLocation.city}, {userLocation.state}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">AI will search nearby</span>
                  <Button
                    onClick={() => setHideLocation(true)}
                    size="sm"
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white h-6 px-2 text-xs"
                  >
                    Hide
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {locationPermission === 'denied' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3"
          >
            <Card className="bg-white/5 border border-white/10">
              <CardContent className="p-2 flex items-center justify-between">
                <span className="text-xs text-gray-500">Location disabled - Enable for local recommendations</span>
                <Button
                  onClick={requestLocationPermission}
                  size="sm"
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white h-6 px-2 text-xs"
                >
                  Enable
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid md:grid-cols-3 gap-3 mb-3">
          {/* Live Balance Card */}
          <Card className="bg-white/5 border border-white/10">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-xs">Live Balance</span>
                <Button
                  onClick={handleUpdateBalance}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-gray-500 hover:text-white"
                >
                  <Settings className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-2xl font-bold text-white">{liveBalance.toFixed(2)} KAS</p>
              {kasPrice && (
                <p className="text-xs text-gray-600 mt-1">≈ ${currentUSDValue.toFixed(2)}</p>
              )}
            </CardContent>
          </Card>

          {/* Unpaid Bills */}
          <Card className="bg-white/5 border border-white/10">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-xs">Unpaid</span>
                <AlertCircle className="w-3 h-3 text-white/30" />
              </div>
              <p className="text-2xl font-bold text-white">${totalUnpaid.toFixed(2)}</p>
              <p className="text-xs text-gray-600 mt-1">{bills.filter(b => b.status === 'unpaid').length} bills</p>
            </CardContent>
          </Card>

          {/* KAS Price */}
          <Card className="bg-white/5 border border-white/10">
            <CardContent className="p-3">
              <span className="text-gray-500 text-xs block mb-2">KAS Price</span>
              {kasPrice ? (
                <>
                  <p className="text-2xl font-bold text-white">${kasPrice.toFixed(4)}</p>
                  <p className="text-xs text-gray-600 mt-1">Live</p>
                </>
              ) : (
                <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {/* Bills Section - Left */}
          <div className="md:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">Bills</h2>
              <Button
                onClick={() => setShowAddBill(!showAddBill)}
                size="sm"
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white h-7 px-3 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>

            <AnimatePresence>
              {showAddBill && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className="bg-white/5 border border-white/10 mb-3">
                    <CardContent className="p-3 space-y-2">
                      <Input
                        placeholder="Bill name"
                        value={newBill.bill_name}
                        onChange={(e) => setNewBill({...newBill, bill_name: e.target.value})}
                        className="bg-black border-white/10 text-white h-8 text-sm"
                      />
                      <Input
                        type="number"
                        placeholder="Amount (USD)"
                        value={newBill.amount_usd}
                        onChange={(e) => setNewBill({...newBill, amount_usd: e.target.value})}
                        className="bg-black border-white/10 text-white h-8 text-sm"
                      />
                      <select
                        value={newBill.bill_type}
                        onChange={(e) => setNewBill({...newBill, bill_type: e.target.value})}
                        className="w-full bg-black border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm"
                      >
                        <option value="digital">Digital</option>
                        <option value="physical">Physical</option>
                        <option value="subscription">Subscription</option>
                      </select>

                      {/* Scrollable Date Picker */}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Month</label>
                          <select
                            value={selectedDate.month}
                            onChange={(e) => setSelectedDate({...selectedDate, month: parseInt(e.target.value)})}
                            className="w-full bg-black border border-white/10 text-white rounded-lg px-2 py-1.5 text-sm"
                          >
                            {months.map((month, idx) => (
                              <option key={idx} value={idx}>{month}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Day</label>
                          <select
                            value={selectedDate.day}
                            onChange={(e) => setSelectedDate({...selectedDate, day: parseInt(e.target.value)})}
                            className="w-full bg-black border border-white/10 text-white rounded-lg px-2 py-1.5 text-sm"
                          >
                            {days.map((day) => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Year</label>
                          <select
                            value={selectedDate.year}
                            onChange={(e) => setSelectedDate({...selectedDate, year: parseInt(e.target.value)})}
                            className="w-full bg-black border border-white/10 text-white rounded-lg px-2 py-1.5 text-sm"
                          >
                            {years.map((year) => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {showAdvanced && (
                        <>
                          <Input
                            placeholder="Category (optional)"
                            value={newBill.category}
                            onChange={(e) => setNewBill({...newBill, category: e.target.value})}
                            className="bg-black border-white/10 text-white h-8 text-sm"
                          />
                          <Input
                            placeholder="Notes (optional)"
                            value={newBill.notes}
                            onChange={(e) => setNewBill({...newBill, notes: e.target.value})}
                            className="bg-black border-white/10 text-white h-8 text-sm"
                          />
                        </>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={handleAddBill}
                          disabled={createBillMutation.isPending}
                          className="flex-1 bg-white/10 hover:bg-white/20 border border-white/10 text-white h-8 text-xs"
                        >
                          {createBillMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            'Add'
                          )}
                        </Button>
                        <Button
                          onClick={() => setShowAdvanced(!showAdvanced)}
                          className="bg-white/5 hover:bg-white/10 border border-white/10 text-white h-8 px-2"
                        >
                          <Settings className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => setShowAddBill(false)}
                          className="bg-white/5 hover:bg-white/10 border border-white/10 text-white h-8 px-2"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-black">
              {billsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 text-white/30 animate-spin mx-auto" />
                </div>
              ) : bills.length === 0 ? (
                <Card className="bg-white/5 border border-white/10">
                  <CardContent className="p-8 text-center">
                    <FileText className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">No bills</p>
                  </CardContent>
                </Card>
              ) : (
                bills.map((bill) => (
                  <Card key={bill.id} className={`bg-white/5 border border-white/10 hover:border-white/20 transition-all ${
                    bill.status === 'paid' ? 'opacity-50' : ''
                  }`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10">
                            {bill.bill_type === 'digital' ? <Wifi className="w-4 h-4 text-white/70" /> :
                             bill.bill_type === 'physical' ? <FileText className="w-4 h-4 text-white/70" /> :
                             <CreditCard className="w-4 h-4 text-white/70" />}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-sm">{bill.bill_name}</h3>
                            <p className="text-xs text-gray-600">{bill.category || bill.bill_type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {bill.status !== 'paid' && (
                            <Button
                              onClick={() => handleMarkAsPaid(bill)}
                              size="sm"
                              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white h-7 px-2"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            onClick={() => deleteBillMutation.mutate(bill.id)}
                            size="sm"
                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white h-7 px-2"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-white">${bill.amount_usd.toFixed(2)}</span>
                        <div className="flex items-center gap-2">
                          {bill.due_date && (
                            <Badge className="bg-white/5 border border-white/10 text-gray-400 text-xs px-2 py-0.5">
                              {new Date(bill.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </Badge>
                          )}
                          {bill.status === 'paid' && (
                            <Badge className="bg-white/10 text-white text-xs px-2 py-0.5">
                              paid
                            </Badge>
                          )}
                        </div>
                      </div>

                      {kasPrice && (
                        <div className="mt-2 pt-2 border-t border-white/10 text-xs text-gray-600">
                          {(bill.amount_usd / kasPrice).toFixed(2)} KAS
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Center Panel - AI Insights / Chat - Desktop Only */}
          <div className="md:col-span-1 hidden md:block">
            <div className="sticky top-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-white">AI Assistant</h2>
                {aiInsights && !chatMode && (
                  <Button
                    onClick={() => setChatMode(true)}
                    size="sm"
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white h-7 px-3 text-xs"
                  >
                    Chat
                  </Button>
                )}
                {chatMode && (
                  <Button
                    onClick={() => setChatMode(false)}
                    size="sm"
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white h-7 px-3 text-xs"
                  >
                    Back
                  </Button>
                )}
              </div>

              {!aiInsights && !chatMode && (
                <Card className="bg-white/5 border border-white/10">
                  <CardContent className="p-8 text-center">
                    <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm mb-2">No analysis yet</p>
                    <p className="text-xs text-gray-600">Click AI button to analyze bills</p>
                  </CardContent>
                </Card>
              )}

              {chatMode && aiInsights ? (
                <Card className="bg-black border border-white/10 max-h-[calc(100vh-250px)] flex flex-col">
                  <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 scrollbar-black chat-messages-container" style={{ minHeight: '400px', maxHeight: 'calc(100vh - 350px)' }}>
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-xl p-3 ${
                            msg.role === 'user' 
                              ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-white' 
                              : 'bg-black border border-white/20 text-white shadow-lg'
                          }`}>
                            <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                              {msg.content.replace(/\[en\.wikipedia\.org\]|\[att\.com\]|\(https?:\/\/[^\)]+\)|\*\*|__/g, '').replace(/\s+/g, ' ').trim()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-black border border-white/20 rounded-xl p-3 shadow-lg">
                            <Loader2 className="w-4 h-4 text-white/50 animate-spin" />
                          </div>
                        </div>
                      )}
                      {isStreaming && streamingMessage && (
                        <div className="flex justify-start">
                          <div className="max-w-[85%] rounded-xl p-3 bg-black border border-white/20 text-white shadow-lg">
                            <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                              {streamingMessage}
                              <span className="inline-block w-0.5 h-3 bg-white ml-1 animate-pulse">|</span>
                            </p>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} className="h-4"></div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-white/10">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white h-10 px-2 rounded-xl"
                      >
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </Button>
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleChatWithAI()}
                        placeholder="Ask about bills, providers, locations..."
                        className="bg-black border-white/20 text-white h-10 text-sm flex-1 rounded-xl px-3"
                      />
                      <Button
                        onClick={handleChatWithAI}
                        disabled={!chatInput.trim() || isChatLoading || isStreaming}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 border-0 text-white h-10 px-4 rounded-xl"
                      >
                        <Zap className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : aiInsights && !chatMode ? (
                <Card className="bg-black border border-white/10 max-h-[calc(100vh-250px)]">
                  <CardContent className="p-4 overflow-y-auto scrollbar-black" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                    <div className="space-y-3">
                      <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                        <p className="text-xs text-gray-400 mb-1">Market Analysis</p>
                        <p className="text-sm text-white">{aiInsights.summary}</p>
                      </div>

                      {aiInsights.location_specific_notes && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                          <p className="text-xs text-gray-400 mb-1">📍 Local Insights</p>
                          <p className="text-sm text-white">{aiInsights.location_specific_notes}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                          <p className="text-xs text-gray-500 mb-1">Volatility</p>
                          <p className="text-sm font-bold text-white">{aiInsights.volatility_score}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                          <p className="text-xs text-gray-500 mb-1">Savings</p>
                          <p className="text-sm font-bold text-white">{aiInsights.total_potential_savings}</p>
                        </div>
                      </div>

                      {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500">Recommendations</p>
                          {aiInsights.recommendations.map((rec, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-2">
                              <div className="flex items-start justify-between mb-1">
                                <p className="text-sm font-semibold text-white">{rec.bill_name}</p>
                                <Badge className="bg-white/10 text-white text-xs">
                                  {rec.potential_savings}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-400 mb-1">
                                {rec.current_provider} → {rec.alternative_provider}
                              </p>
                              {rec.provider_location && (
                                <p className="text-xs text-gray-500 mb-1">
                                  📍 {rec.provider_location}
                                </p>
                              )}
                              <p className="text-xs text-gray-500">{rec.reason}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>

          {/* Right Panel - Pie Chart & Snapshot */}
          <div className="md:col-span-1">
            <h2 className="text-sm font-bold text-white mb-3">Bills Breakdown</h2>
            <Card className="bg-white/5 border border-white/10 mb-3">
              <CardContent className="p-4">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPie>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        formatter={(value) => `$${value.toFixed(2)}`}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12">
                    <PieChart className="w-12 h-12 text-white/20 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">No unpaid bills</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Latest Snapshot */}
            {snapshots[0] && (
              <Card className="bg-white/5 border border-white/10">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Latest Snapshot</span>
                    <span className="text-xs text-gray-600">
                      {new Date(snapshots[0].snapshot_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">USD</p>
                      <p className="text-lg font-bold text-white">${snapshots[0].total_usd.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">KAS</p>
                      <p className="text-lg font-bold text-white">{snapshots[0].equivalent_kas.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/10 text-xs text-gray-600">
                    Rate: ${snapshots[0].kas_price_at_time.toFixed(4)}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Mobile AI Modal */}
        <AnimatePresence>
          {showAIModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setShowAIModal(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="absolute bg-black border border-white/20 rounded-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  top: 'calc(env(safe-area-inset-top, 0px) + 8rem)',
                  bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)',
                  left: '0.5rem',
                  right: '0.5rem'
                }}
              >
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">Agent FYE</h2>
                    <div className="flex items-center gap-2">
                      {aiInsights && !chatMode && (
                        <Button
                          onClick={() => setChatMode(true)}
                          size="sm"
                          className="bg-white/5 hover:bg-white/10 border border-white/10 text-white h-8 px-3 text-xs"
                        >
                          Chat
                        </Button>
                      )}
                      {chatMode && (
                        <Button
                          onClick={() => setChatMode(false)}
                          size="sm"
                          className="bg-white/5 hover:bg-white/10 border border-white/10 text-white h-8 px-3 text-xs"
                        >
                          Back
                        </Button>
                      )}
                      <Button
                        onClick={() => setShowAIModal(false)}
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-white h-8 w-8 p-0"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {isAnalyzing ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-12 h-12 text-white/30 animate-spin mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Analyzing your bills...</p>
                    </div>
                  ) : !aiInsights ? (
                    <div className="text-center py-12">
                      <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Click AI button to analyze</p>
                    </div>
                  ) : chatMode ? (
                    <div className="h-[calc(85vh-10rem)] flex flex-col p-1">
                      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 pb-4 scrollbar-black chat-messages-container">
                        {chatMessages.map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-xl p-4 ${
                              msg.role === 'user' 
                                ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-white' 
                                : 'bg-black border border-white/20 text-white shadow-lg'
                            }`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {msg.content.replace(/\[en\.wikipedia\.org\]|\[att\.com\]|\(https?:\/\/[^\)]+\)|\*\*|__/g, '').replace(/\s+/g, ' ').trim()}
                              </p>
                            </div>
                          </div>
                        ))}
                        {isChatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-black border border-white/20 rounded-xl p-4 shadow-lg">
                              <Loader2 className="w-5 h-5 text-white/50 animate-spin" />
                            </div>
                          </div>
                        )}
                        {isStreaming && streamingMessage && (
                          <div className="flex justify-start">
                            <div className="max-w-[85%] rounded-xl p-4 bg-black border border-white/20 text-white shadow-lg">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {streamingMessage}
                                <span className="inline-block w-1 h-4 bg-white ml-1 animate-pulse">|</span>
                              </p>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} className="h-8"></div>
                      </div>

                      <div className="flex gap-2 sticky bottom-0 bg-black pt-3 pb-2 border-t border-white/10">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="bg-white/5 hover:bg-white/10 border border-white/10 text-white h-12 px-3 rounded-xl"
                        >
                          {isUploading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Plus className="w-5 h-5" />
                          )}
                        </Button>
                        <Input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleChatWithAI()}
                          placeholder="Ask about bills, providers, locations..."
                          className="bg-black border-white/20 text-white h-12 text-sm flex-1 rounded-xl px-4"
                        />
                        <Button
                          onClick={handleChatWithAI}
                          disabled={!chatInput.trim() || isChatLoading || isStreaming}
                          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 border-0 text-white h-12 px-5 rounded-xl shadow-lg"
                        >
                          <Zap className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="max-h-[calc(85vh-8rem)] overflow-y-auto px-1 pb-4 scrollbar-black">
                      <div className="space-y-3 pb-4">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-2">Market Analysis</p>
                          <p className="text-sm text-white leading-relaxed">{aiInsights.summary}</p>
                        </div>

                        {aiInsights.location_specific_notes && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-2">📍 Local Insights</p>
                            <p className="text-sm text-white leading-relaxed">{aiInsights.location_specific_notes}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Volatility</p>
                            <p className="text-base font-bold text-white">{aiInsights.volatility_score}</p>
                          </div>
                          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Savings</p>
                            <p className="text-base font-bold text-white">{aiInsights.total_potential_savings}</p>
                          </div>
                        </div>

                        {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-sm text-gray-500 font-semibold">Recommendations</p>
                            {aiInsights.recommendations.map((rec, idx) => (
                              <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <p className="text-sm font-semibold text-white">{rec.bill_name}</p>
                                  <Badge className="bg-white/10 text-white text-xs">
                                    {rec.potential_savings}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-400 mb-2">
                                  {rec.current_provider} → {rec.alternative_provider}
                                </p>
                                {rec.provider_location && (
                                  <p className="text-xs text-gray-500 mb-2">
                                    📍 {rec.provider_location}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 leading-relaxed">{rec.reason}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .scrollbar-black::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .scrollbar-black::-webkit-scrollbar-track {
          background: black;
        }
        .scrollbar-black::-webkit-scrollbar-thumb {
          background: #1a1a1a;
          border-radius: 3px;
        }
        .scrollbar-black::-webkit-scrollbar-thumb:hover {
          background: #2a2a2a;
        }
        .scrollbar-black {
          scrollbar-width: thin;
          scrollbar-color: #1a1a1a black;
        }
      `}</style>
    </div>
  );
}