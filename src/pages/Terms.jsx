import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, AlertTriangle, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Terms of Service</h1>
              <p className="text-gray-500 text-sm">Last Updated: January 17, 2025</p>
            </div>
          </div>
        </motion.div>

        <Card className="bg-black border-white/10 mb-6">
          <CardContent className="p-6 md:p-8">
            <div className="prose prose-invert max-w-none">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-200 font-semibold mb-1">Alpha Software Notice</p>
                  <p className="text-xs text-yellow-300">
                    This application is currently in ALPHA testing phase. Features may be unstable, incomplete, or subject to change. Developers are actively working on improvements and bug fixes.
                  </p>
                </div>
              </div>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                By accessing and using TTT (The Trifecta Technologies) application, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use this application.
              </p>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">2. Alpha Software Disclaimer</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                TTT is currently in ALPHA stage of development. This means:
              </p>
              <ul className="list-disc ml-6 text-gray-300 mb-4 space-y-2">
                <li>The software may contain bugs, errors, or incomplete features</li>
                <li>Functions and features may be added, modified, or removed without notice</li>
                <li>Data loss, corruption, or unexpected behavior may occur</li>
                <li>Developers are actively working on the platform and may implement breaking changes</li>
                <li>The application is provided "AS IS" without warranties of any kind</li>
              </ul>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">3. Financial Responsibility Disclaimer</h2>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-200 font-semibold mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  IMPORTANT: Read Carefully
                </p>
                <p className="text-xs text-red-300 leading-relaxed">
                  TTT and its developers DO NOT hold, custody, or control your funds, private keys, or cryptocurrency assets. You are solely responsible for:
                </p>
              </div>
              <ul className="list-disc ml-6 text-gray-300 mb-4 space-y-2">
                <li>Securing your private keys, seed phrases, and wallet credentials</li>
                <li>All transactions you make using the application</li>
                <li>Any financial losses resulting from your use of the application</li>
                <li>Verifying all transaction details before confirmation</li>
                <li>Understanding blockchain technology and cryptocurrency risks</li>
                <li>Compliance with local laws and regulations regarding cryptocurrency</li>
              </ul>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">4. No Liability for Funds</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                TTT, its developers, operators, and affiliates shall NOT be held liable for:
              </p>
              <ul className="list-disc ml-6 text-gray-300 mb-4 space-y-2">
                <li>Loss of funds due to software bugs, errors, or malfunctions</li>
                <li>Unauthorized access to your accounts or wallets</li>
                <li>Failed or incorrect transactions</li>
                <li>Network congestion, gas fees, or blockchain issues</li>
                <li>Third-party integrations or services failures</li>
                <li>Hacks, exploits, or security breaches</li>
                <li>Display of 0 balance in TTT Wallet (security feature)</li>
                <li>Any direct, indirect, incidental, or consequential damages</li>
              </ul>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-200 font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  TTT Wallet Security Feature
                </p>
                <p className="text-xs text-yellow-300 leading-relaxed mb-2">
                  The TTT Wallet is designed as a "burner wallet" with enhanced security measures. As a security feature to protect against potential hackers, the wallet may display a balance of 0 KAS even when funds are present.
                </p>
                <p className="text-xs text-yellow-300 leading-relaxed">
                  <strong>Important:</strong> Your funds are safe and secure. You can verify your actual balance at any time by importing your seed phrase into any other Kaspa-compatible wallet application (such as Kasware, KDX, or other Kaspa wallets). This display behavior is intentional and designed to protect your assets.
                </p>
              </div>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">5. User Responsibilities</h2>
              <p className="text-gray-300 mb-2 leading-relaxed">You agree to:</p>
              <ul className="list-disc ml-6 text-gray-300 mb-4 space-y-2">
                <li>Use the application at your own risk</li>
                <li>Maintain the security and confidentiality of your credentials</li>
                <li>Not use the application for illegal activities</li>
                <li>Not attempt to exploit, hack, or abuse the platform</li>
                <li>Verify all information and transactions independently</li>
                <li>Keep backups of critical information and credentials</li>
              </ul>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">6. Identity and Verification</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                When creating an Agent ZK identity or connecting wallets, you confirm that:
              </p>
              <ul className="list-disc ml-6 text-gray-300 mb-4 space-y-2">
                <li>You are legally authorized to create and manage digital identities</li>
                <li>Information provided is accurate to the best of your knowledge</li>
                <li>You understand the cryptographic nature of identity verification</li>
                <li>You accept full responsibility for identity management and security</li>
              </ul>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">7. Data and Privacy</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                Your use of TTT involves processing of data including wallet addresses, transactions, and profile information. By using the application, you consent to this data processing. We do not sell your data to third parties, but the decentralized nature of blockchain means certain information is publicly visible.
              </p>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">8. Changes to Service</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                Given the ALPHA status, we reserve the right to modify, suspend, or discontinue any part of the service at any time without prior notice. New features, changes, or limitations may be introduced as development progresses.
              </p>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">9. Third-Party Services</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                TTT integrates with third-party services including but not limited to: Kasware, MetaMask, Kaspa blockchain, and various APIs. We are not responsible for the functionality, security, or reliability of these external services.
              </p>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">10. Intellectual Property</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                All content, features, and functionality are owned by TTT and its licensors. You may not copy, modify, distribute, or reverse engineer any part of the application without explicit permission.
              </p>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">11. Limitation of Liability</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, TTT AND ITS DEVELOPERS SHALL NOT BE LIABLE FOR ANY DAMAGES WHATSOEVER, INCLUDING BUT NOT LIMITED TO DIRECT, INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE APPLICATION.
              </p>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">12. Indemnification</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                You agree to indemnify and hold harmless TTT, its developers, and affiliates from any claims, damages, losses, liabilities, and expenses arising from your use of the application or violation of these terms.
              </p>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">13. Governing Law</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                These terms shall be governed by and construed in accordance with applicable laws. Any disputes shall be resolved through binding arbitration.
              </p>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">14. Contact</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                For questions about these Terms of Service, please contact the development team through official channels.
              </p>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4 mt-8">
                <p className="text-xs text-gray-400 text-center">
                  By using TTT, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}