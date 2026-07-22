import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Eye, FileText } from "lucide-react";

export default function PrivacyPage() {
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
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Privacy Policy</h1>
              <p className="text-gray-500 text-sm">Last Updated: January 17, 2025</p>
            </div>
          </div>
        </motion.div>

        <Card className="bg-black border-white/10 mb-6">
          <CardContent className="p-6 md:p-8">
            <div className="prose prose-invert max-w-none">
              <h2 className="text-xl font-bold text-white mt-6 mb-3">1. Introduction</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                TTTz.xyz (taptotip/trustless task transact Zero entropy knowledge unified) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our application.
              </p>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">2. Information We Collect</h2>
              <p className="text-gray-300 mb-2 leading-relaxed">We may collect the following types of information:</p>
              <ul className="list-disc ml-6 text-gray-300 mb-4 space-y-2">
                <li><strong>Wallet Addresses:</strong> Public blockchain addresses you connect to the application</li>
                <li><strong>Transaction Data:</strong> On-chain transaction information that is publicly visible</li>
                <li><strong>Profile Information:</strong> Optional data you provide such as usernames, display names, and profile pictures</li>
                <li><strong>Usage Data:</strong> Information about how you interact with the application</li>
                <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers</li>
              </ul>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">3. What We Don't Collect</h2>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-200 font-semibold mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Zero-Knowledge Architecture
                </p>
                <p className="text-xs text-green-300 leading-relaxed">
                  We DO NOT collect, store, or have access to:
                </p>
              </div>
              <ul className="list-disc ml-6 text-gray-300 mb-4 space-y-2">
                <li>Your private keys or seed phrases</li>
                <li>Your wallet passwords or credentials</li>
                <li>The actual content of your encrypted data</li>
                <li>Your financial account information</li>
                <li>Personally identifiable information unless voluntarily provided</li>
              </ul>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">4. How We Use Your Information</h2>
              <p className="text-gray-300 mb-2 leading-relaxed">We use collected information to:</p>
              <ul className="list-disc ml-6 text-gray-300 mb-4 space-y-2">
                <li>Provide and maintain the application's functionality</li>
                <li>Improve user experience and platform features</li>
                <li>Verify blockchain transactions and wallet connections</li>
                <li>Display relevant information in your profile and dashboard</li>
                <li>Analyze usage patterns to enhance the platform</li>
                <li>Comply with legal obligations when required</li>
              </ul>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">5. Data Storage and Security</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                Your data is stored securely using industry-standard encryption. Sensitive information is encrypted at rest and in transit. However, given the decentralized nature of blockchain technology, certain information (such as wallet addresses and transaction hashes) is publicly visible on the blockchain and cannot be made private.
              </p>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">6. Third-Party Services</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                TTTz.xyz integrates with third-party services including but not limited to:
              </p>
              <ul className="list-disc ml-6 text-gray-300 mb-4 space-y-2">
                <li><strong>Wallet Providers:</strong> Kasware, MetaMask, and other cryptocurrency wallets</li>
                <li><strong>Blockchain Networks:</strong> Kaspa, Ethereum, and other blockchain protocols</li>
                <li><strong>APIs:</strong> Various external APIs for enhanced functionality</li>
              </ul>
              <p className="text-gray-300 mb-4 leading-relaxed">
                These third-party services have their own privacy policies. We are not responsible for their data collection or usage practices.
              </p>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">7. Cookies and Tracking</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                We may use cookies and similar tracking technologies to enhance your experience. You can control cookies through your browser settings, though this may affect application functionality.
              </p>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">8. Data Sharing</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                We do NOT sell your personal information to third parties. We may share data only in the following circumstances:
              </p>
              <ul className="list-disc ml-6 text-gray-300 mb-4 space-y-2">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations or valid legal processes</li>
                <li>To protect the rights, property, or safety of TTTz.xyz, our users, or the public</li>
                <li>In connection with a merger, acquisition, or sale of assets (with notice to affected users)</li>
              </ul>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">9. Your Rights</h2>
              <p className="text-gray-300 mb-2 leading-relaxed">You have the right to:</p>
              <ul className="list-disc ml-6 text-gray-300 mb-4 space-y-2">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your data (subject to legal obligations)</li>
                <li>Opt out of certain data collection practices</li>
                <li>Export your data in a portable format</li>
              </ul>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">10. Children's Privacy</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                TTTz.xyz is not intended for individuals under the age of 18. We do not knowingly collect personal information from minors. If we become aware that we have collected data from a minor, we will take steps to delete it promptly.
              </p>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">11. International Users</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                If you are accessing TTTz.xyz from outside your jurisdiction, please be aware that your information may be transferred to, stored, and processed in different countries. By using the application, you consent to such transfers.
              </p>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">12. Changes to This Privacy Policy</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify users of significant changes by posting the updated policy with a new "Last Updated" date. Continued use of the application after changes constitutes acceptance of the updated policy.
              </p>

              <h2 className="text-xl font-bold text-white mt-6 mb-3">13. Contact Us</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us through official TTTz.xyz channels.
              </p>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4 mt-8">
                <p className="text-xs text-gray-400 text-center">
                  By using TTTz.xyz (taptotip/trustless task transact Zero entropy knowledge unified), you acknowledge that you have read and understood this Privacy Policy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}