import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, MessageSquare, CheckCircle2, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await base44.integrations.Core.SendEmail({
        to: "support@tttventures.io",
        subject: `Contact Form: ${formData.subject}`,
        body: `
Name: ${formData.name}
Email: ${formData.email}

Message:
${formData.message}
        `
      });

      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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
              <Mail className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Contact Us</h1>
              <p className="text-gray-500 text-sm">Get in touch with the TTTz.xyz team</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-black border-white/10">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Send a Message</h2>
              
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center"
                >
                  <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <h3 className="text-white font-semibold mb-2">Message Sent!</h3>
                  <p className="text-sm text-gray-400">
                    Thank you for reaching out. We'll get back to you soon.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Name</label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      required
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Email</label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      required
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Subject</label>
                    <Input
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What's this about?"
                      required
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Message</label>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us more..."
                      required
                      rows={5}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                  >
                    {isSubmitting ? (
                      <>
                        <MessageSquare className="w-4 h-4 mr-2 animate-pulse" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="bg-black border-white/10">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Other Ways to Reach Us</h2>
              
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    Email Support
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">
                    For general inquiries and support
                  </p>
                  <a
                    href="mailto:support@tttventures.io"
                    className="text-cyan-400 hover:underline text-sm flex items-center gap-1"
                  >
                    support@tttventures.io
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    Community
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">
                    Join our community channels for discussions, updates, and support from other users.
                  </p>
                  <p className="text-xs text-gray-500">
                    Coming soon: Discord, Telegram, and Twitter links
                  </p>
                </div>

                <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">Response Time</h3>
                  <p className="text-xs text-gray-300">
                    We typically respond to inquiries within 24-48 hours during business days. For urgent technical issues, please include "URGENT" in your subject line.
                  </p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <h3 className="text-yellow-200 font-semibold mb-2 text-sm">Security Issues</h3>
                  <p className="text-xs text-yellow-300">
                    If you've discovered a security vulnerability, please report it responsibly to security@tttventures.io with details. Do not disclose publicly until we've addressed it.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-black border-white/10">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-white mb-3">Frequently Asked Questions</h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">How do I reset my wallet?</h3>
                <p className="text-xs text-gray-400">
                  TTTz.xyz does not custody your wallet. Use your seed phrase to restore access in any Kaspa-compatible wallet.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">Can I get my private keys back?</h3>
                <p className="text-xs text-gray-400">
                  We never store your private keys. You must keep your seed phrase safe - we cannot recover it for you.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">How do I report a bug?</h3>
                <p className="text-xs text-gray-400">
                  Use the contact form above with "Bug Report" in the subject line, including steps to reproduce the issue.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}