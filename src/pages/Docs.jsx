import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DOCS_SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: '🚀',
    subsections: [
      { id: 'intro', title: 'Introduction to TTT' },
      { id: 'setup', title: 'Setup Guide' },
      { id: 'first-steps', title: 'Your First Steps' },
    ]
  },
  {
    id: 'ai-creation',
    title: 'AI Creation Tools',
    icon: '🎨',
    subsections: [
      { id: 'noda', title: 'NODA - Workflow Builder' },
      { id: 'motion', title: 'Motion - Video Generation' },
      { id: 'hikaru', title: 'Hikaru - Image Generation' },
      { id: 'rmx', title: 'RMX - Advanced Workflows' },
    ]
  },
  {
    id: 'web3-finance',
    title: 'Web3 & Finance',
    icon: '💰',
    subsections: [
      { id: 'wallet', title: 'Kaspa Wallet Integration' },
      { id: 'bridge', title: 'Cross-Chain Bridge' },
      { id: 'agent-zk', title: 'Agent ZK Identity' },
      { id: 'transactions', title: 'Managing Transactions' },
    ]
  },
  {
    id: 'agents',
    title: 'AI Agents',
    icon: '🤖',
    subsections: [
      { id: 'agent-zk-guide', title: 'Agent ZK Guide' },
      { id: 'agent-features', title: 'Agent Features' },
      { id: 'agent-commands', title: 'Agent Commands' },
    ]
  },
  {
    id: 'advanced',
    title: 'Advanced Topics',
    icon: '⚙️',
    subsections: [
      { id: 'api-integration', title: 'API Integration' },
      { id: 'custom-workflows', title: 'Custom Workflows' },
      { id: 'backend-functions', title: 'Backend Functions' },
    ]
  },
  {
    id: 'faq',
    title: 'FAQ & Support',
    icon: '❓',
    subsections: [
      { id: 'faq-general', title: 'General Questions' },
      { id: 'troubleshooting', title: 'Troubleshooting' },
      { id: 'contact-support', title: 'Contact Support' },
    ]
  }
];

const CONTENT = {
  'intro': {
    title: 'Introduction to TTT',
    content: `# Welcome to TTT

TTT is the **Kaspa Super App**—a unified, real-time Web3 platform built on the Kaspa blockchain. It combines AI-powered creation tools, secure financial management, and community-driven development.

## What is TTT?

TTT (The Tip Treasury) is an evolving ecosystem that brings together:

- **AI Creation**: Generate images, videos, and websites instantly
- **Web3 Integration**: Manage Kaspa wallets, cross-chain transactions, and digital identity
- **Community**: Participate in a real-time, user-driven development platform
- **Decentralization**: Built on Kaspa's DAG technology
- **TapToTip**: Quick and easy KAS tipping for creators and supporters

## Key Features

### 🎨 Creative Tools
Use AI-powered agents to generate stunning visuals and functional websites without coding.

### 💼 Financial Control
Securely manage your Kaspa assets with integrated wallet and bridge features.

### 🔐 Digital Identity
Establish your Agent ZK identity for secure transactions and community participation.

### 🚀 Real-Time Evolution
TTT is built in real-time. New features roll out continuously based on community feedback.

## Getting Started

Visit the [Setup Guide](#setup) to get your profile configured and start exploring.
`
  },
  'setup': {
    title: 'Setup Guide',
    content: `# Setup Guide

Get started with TTT in just a few minutes.

## Step 1: Create Your Profile

1. Click your profile icon in the top navigation
2. Fill in your basic information
3. Set your username (this will be your identity across TTT)

## Step 2: Connect Your Wallet

Navigate to **Wallet** in the menu to:
- View your Kaspa balance
- Receive KAS from others
- Send transactions securely

## Step 3: Explore AI Tools

Visit **App Store** to discover:
- Image generation (Hikaru)
- Video creation (Motion)
- Workflow automation (NODA, RMX)

## Step 4: Join the Community

- Check out **TTT Feed** for community updates
- Connect with other users via **Agent ZK**
- Participate in discussions and collaborations

You're all set! Start creating and building with TTT.
`
  },
  'first-steps': {
    title: 'Your First Steps',
    content: `# Your First Steps with TTT

Ready to dive in? Here's a practical guide to your first actions.

## Action 1: Generate Your First Image

1. Go to **Hikaru** (Image Generation)
2. Enter a prompt: "A cyberpunk city at night, neon lights, digital art"
3. Click "Generate"
4. Download or share your creation

## Action 2: Send Your First Transaction

1. Navigate to **Bridge** or **Wallet**
2. Click "Send KAS"
3. Enter recipient address
4. Confirm and sign with your wallet
5. Done! You've completed your first blockchain transaction

## Action 3: Create a Workflow

1. Open **NODA** or **RMX**
2. Add AI nodes (Image Gen, Text Processing, etc.)
3. Connect them to create a workflow
4. Run and see the magic happen

## Next Steps

Explore more tools, join the community, and keep building!
`
  },
  'noda': {
    title: 'NODA - Workflow Builder',
    content: `# NODA - Workflow Builder

NODA is TTT's visual workflow automation platform. Chain together AI tools and create powerful automations without code.

## Overview

NODA allows you to:
- Create multi-step workflows
- Combine AI tools (image gen, text processing, etc.)
- Automate repetitive tasks
- Build complex pipelines

## Getting Started with NODA

### 1. Create a New Workflow

1. Open NODA from the App Store
2. Click "New Workflow"
3. Give your workflow a name

### 2. Add Nodes

Click the **+** button to add processing nodes:
- **Image Generation**: Create images from text
- **Text Processing**: Transform and analyze text
- **Data Fetch**: Pull data from external sources
- **Conditional Logic**: Add if/then branches

### 3. Connect Nodes

Drag connectors between nodes to pass data:
- Output from one node → Input to next node
- Create complex data flows

### 4. Configure & Run

1. Click on each node to configure parameters
2. Click "Run Workflow"
3. Watch the magic happen in real-time

## Example Workflow

**Prompt → Image Gen → Upscale → Export**

This simple workflow takes a text prompt, generates an image, upscales it, and exports the result.

## Advanced Features

- Save workflow templates
- Schedule automatic runs
- Monitor execution logs
- Share workflows with community
`
  },
  'wallet': {
    title: 'Kaspa Wallet Integration',
    content: `# Kaspa Wallet Integration

Securely manage your Kaspa assets directly within TTT.

## Your Wallet

Your TTT wallet is built on Kaspa's ultra-fast DAG blockchain.

### Features

- **Instant Transactions**: Send and receive KAS in seconds
- **Zero Fees**: Kaspa's efficient network = no transaction costs
- **Hardware Support**: Connect Kasware or other Kaspa wallets
- **Real-Time Balance**: Always see current holdings

## Sending KAS

1. Navigate to **Wallet** or **Bridge**
2. Click **Send**
3. Enter:
   - Recipient address
   - Amount in KAS
4. Review and confirm
5. Sign with your wallet
6. Transaction complete!

## Receiving KAS

1. Go to **Wallet** → **Receive**
2. Copy your address or share QR code
3. Share with others to receive funds

## Security

- Your private keys stay in your wallet
- TTT never has access to your funds
- All transactions are signed by you
- Verify addresses carefully before sending

## Best Practices

✓ Always double-check recipient addresses
✓ Use QR codes when possible
✓ Keep your wallet seed safe
✓ Enable all available security features
`
  },
  'agent-zk-guide': {
    title: 'Agent ZK Guide',
    content: `# Agent ZK - Your Digital Identity

Agent ZK is your verified, decentralized identity within TTT and the Kaspa ecosystem.

## What is Agent ZK?

Agent ZK is:
- Your unique identifier in the TTT ecosystem
- A verified digital identity backed by zero-knowledge proofs
- A gateway to decentralized finance and services
- Your reputation score and contribution history

## Setting Up Your Agent ZK

### Step 1: Create Profile

1. Go to **Agent ZK** in the App Store
2. Click **Create Profile**
3. Add:
   - Username
   - Bio
   - Profile picture
   - Social links (optional)

### Step 2: Verify Identity

1. Complete verification steps (varies by level)
2. Link your wallet
3. Prove your identity through our verification system

### Step 3: Start Building

- Connect with other agents
- Build your reputation
- Access premium features
- Participate in ecosystem rewards

## Reputation & Verification Levels

### Level 1: Verified User
- Profile created
- Email verified
- Wallet linked

### Level 2: Active Builder
- 5+ contributions
- Community feedback positive
- Completed verification tasks

### Level 3: Trusted Agent
- 20+ contributions
- High reputation score
- Approved for advanced features

## Your Agent Dashboard

Monitor:
- Reputation score
- Contributions count
- Connected agents
- Verification status
- Earnings and rewards

## Privacy & Security

- Your identity is cryptographically verified
- Zero-knowledge proofs protect privacy
- No centralized authority controls your identity
- You own your data
`
  },
  'faq-general': {
    title: 'Frequently Asked Questions',
    content: `# Frequently Asked Questions

## General Questions

### What is TTT built on?

TTT is built on the Kaspa blockchain, leveraging its ultra-fast DAG technology for instant, low-fee transactions.

### Is TTT decentralized?

Yes! TTT is built in real-time with community input. While it's hosted on Base44's infrastructure, the vision is full decentralization.

### How much does it cost?

Most core TTT features are **free**. Some premium tools may require a subscription. Transactions on Kaspa have zero fees.

### Do I need crypto to use TTT?

No! You can explore and create without any crypto. Wallet features are optional.

### How do I report a bug?

Contact us via the **Support** section or email [support@tttz.xyz](mailto:support@tttz.xyz).

## Account & Security

### How do I secure my wallet?

- Never share your seed phrase
- Use hardware wallets for large amounts
- Enable all security features
- Verify addresses before sending

### Can I change my username?

Currently, usernames are permanent. Choose wisely!

### How do I delete my account?

Visit **Settings** → **Account** → **Delete Account**. This action is irreversible.

## Technical Questions

### What browsers are supported?

TTT works on all modern browsers: Chrome, Firefox, Safari, Edge.

### Is TTT mobile-friendly?

Yes! TTT is fully responsive and works great on mobile devices.

### Can I use TTT offline?

Some features require internet. Most AI generation requires an active connection.

## Still have questions?

Contact our support team or visit the community forum!
`
  },
  'troubleshooting': {
    title: 'Troubleshooting',
    content: `# Troubleshooting Guide

## Common Issues & Solutions

### Image Generation Not Working

**Problem**: Hikaru returns an error or blank image.

**Solutions**:
1. Check your internet connection
2. Try a simpler prompt
3. Clear browser cache
4. Check if you're rate-limited (wait a few minutes)
5. Verify your subscription is active

### Wallet Balance Not Updating

**Problem**: Your balance shows incorrect amount.

**Solutions**:
1. Refresh the page (F5)
2. Disconnect and reconnect wallet
3. Check if transaction is pending
4. Visit explorer to verify on-chain balance
5. Restart your browser

### Can't Connect Wallet

**Problem**: Wallet connection fails.

**Solutions**:
1. Ensure wallet extension is installed
2. Check wallet is unlocked
3. Try connecting to a different app first
4. Clear wallet cache
5. Update to latest wallet version

### Slow Performance

**Problem**: Pages load slowly or lag.

**Solutions**:
1. Close unused browser tabs
2. Clear browser cache
3. Disable browser extensions
4. Try a different browser
5. Check your internet speed

### Transaction Failed

**Problem**: Transaction shows as failed.

**Solutions**:
1. Check your account balance
2. Verify recipient address is correct
3. Try again with adjusted gas (if applicable)
4. Check Kaspa network status
5. Contact support with transaction hash

## Getting Help

If you can't find a solution:

1. **Check Documentation**: Search our docs
2. **Community Forum**: Ask other users
3. **Contact Support**: Email us with details
4. **Twitter**: @TTTZK for updates and support

Include:
- Error message (if any)
- Screenshots
- Steps you took
- Device/browser info
`
  }
};

export default function DocsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('intro');
  const [expandedCategories, setExpandedCategories] = useState(new Set(['getting-started']));

  const currentContent = CONTENT[selectedSection] || CONTENT['intro'];

  const filteredSections = useMemo(() => {
    if (!searchTerm) return DOCS_SECTIONS;
    
    const term = searchTerm.toLowerCase();
    return DOCS_SECTIONS.map(section => ({
      ...section,
      subsections: section.subsections.filter(sub => 
        sub.title.toLowerCase().includes(term)
      )
    })).filter(section => section.subsections.length > 0 || section.title.toLowerCase().includes(term));
  }, [searchTerm]);

  const toggleCategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-cyan-400">TTT Documentation</h1>
          <p className="text-gray-400">The Kaspa Super App—Everything you need to know about TTT</p>
        </div>

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4 flex-shrink-0">
            <div className="sticky top-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search docs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                />
              </div>

              {/* Navigation */}
              <ScrollArea className="h-[calc(100vh-250px)] rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                <nav className="space-y-2">
                  {filteredSections.map(section => (
                    <div key={section.id}>
                      <button
                        onClick={() => toggleCategory(section.id)}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-800 transition-colors text-left"
                      >
                        <span className="font-semibold text-sm flex items-center gap-2">
                          <span>{section.icon}</span>
                          {section.title}
                        </span>
                        <ChevronRight 
                          className={`w-4 h-4 transition-transform ${expandedCategories.has(section.id) ? 'rotate-90' : ''}`}
                        />
                      </button>

                      {expandedCategories.has(section.id) && (
                        <div className="pl-4 space-y-1 mt-1">
                          {section.subsections.map(subsection => (
                            <button
                              key={subsection.id}
                              onClick={() => setSelectedSection(subsection.id)}
                              className={`w-full text-left text-xs p-2 rounded transition-colors ${
                                selectedSection === subsection.id
                                  ? 'bg-cyan-500/20 text-cyan-400'
                                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                              }`}
                            >
                              {subsection.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </nav>
              </ScrollArea>
            </div>
          </div>

          {/* Content */}
          <div className="lg:w-3/4">
            <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-8">
              <div className="prose prose-invert max-w-none">
                <h1 className="text-3xl font-bold text-cyan-400 mb-4">{currentContent.title}</h1>
                <div className="text-gray-300 leading-relaxed space-y-4">
                  {currentContent.content.split('\n\n').map((paragraph, idx) => {
                    if (paragraph.startsWith('#')) {
                      const level = paragraph.match(/^#+/)[0].length;
                      const text = paragraph.replace(/^#+\s/, '');
                      const className = {
                        1: 'text-2xl font-bold text-cyan-400 mt-6 mb-4',
                        2: 'text-xl font-bold text-cyan-300 mt-4 mb-3',
                        3: 'text-lg font-semibold text-white mt-3 mb-2'
                      }[level] || 'text-base';
                      return <div key={idx} className={className}>{text}</div>;
                    }
                    
                    if (paragraph.startsWith('-') || paragraph.startsWith('✓') || paragraph.match(/^\d+\./)) {
                      const items = paragraph.split('\n');
                      return (
                        <ul key={idx} className="list-disc list-inside space-y-1 text-gray-300">
                          {items.map((item, i) => (
                            <li key={i}>{item.replace(/^[-✓\d+\.\s]+/, '')}</li>
                          ))}
                        </ul>
                      );
                    }
                    
                    const cleanParagraph = paragraph.replace(/\*\*/g, '');
                    return <p key={idx} className="text-gray-300">{cleanParagraph}</p>;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}