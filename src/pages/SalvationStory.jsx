import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SalvationStoryPage() {
  const sections = [
    {
      title: "The Beginning",
      text: "In the beginning, God created humanity in His image, perfect and without sin. But through disobedience, sin entered the world, separating mankind from God.",
      image: "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800&auto=format&fit=crop&q=80"
    },
    {
      title: "The Promise",
      text: "God promised a Savior who would redeem humanity. For God so loved the world that He gave His one and only Son, that whoever believes in Him shall not perish but have eternal life.",
      image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&auto=format&fit=crop"
    },
    {
      title: "The Birth",
      text: "Jesus Christ was born in Bethlehem, fulfilling ancient prophecies. The Word became flesh and made His dwelling among us. Light came into the darkness.",
      image: "https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=800&auto=format&fit=crop"
    },
    {
      title: "The Ministry",
      text: "Jesus walked among the people, healing the sick, giving sight to the blind, and proclaiming the Kingdom of God. He showed us the Father's love through miracles and teachings.",
      image: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&auto=format&fit=crop"
    },
    {
      title: "The Sacrifice",
      text: "On the cross at Calvary, Jesus bore the sins of all mankind. In His death, He paid the price for our redemption. It is finished - the debt was paid in full.",
      image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/717b9d2dc_image.png"
    },
    {
      title: "The Resurrection",
      text: "On the third day, Jesus rose from the dead, conquering sin and death forever. He appeared to His disciples, proving that He is the Son of God with power.",
      image: "https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800&auto=format&fit=crop"
    },
    {
      title: "The Victory",
      text: "Through His resurrection, Jesus defeated death and offers eternal life to all who believe. He ascended to heaven and sits at the right hand of God, interceding for us.",
      image: "https://images.unsplash.com/photo-1484600899469-230e8d1d59c0?w=800&auto=format&fit=crop"
    },
    {
      title: "The Promise of Return",
      text: "Jesus will return in glory to judge the living and the dead. His kingdom will have no end. Every knee will bow, and every tongue confess that Jesus Christ is Lord.",
      image: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&auto=format&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10 p-4">
        <Link to={createPageUrl("Home")}>
          <button className="flex items-center gap-2 text-white/70 hover:text-white transition-all">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="pt-20 pb-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent">
            How Jesus Saved Humanity
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            The greatest story ever told - the redemption of mankind through the sacrifice of Christ
          </p>
        </motion.div>
      </div>

      {/* Story Sections */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        {sections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
            className="mb-20"
          >
            <div className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}>
              {/* Image */}
              <div className="w-full md:w-1/2">
                <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                  <img
                    src={section.image}
                    alt={section.title}
                    className="w-full h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              </div>

              {/* Text */}
              <div className="w-full md:w-1/2">
                <motion.div
                  initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {section.title}
                  </h2>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    {section.text}
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 px-4 bg-gradient-to-b from-black to-zinc-900"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            The Choice is Yours
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            "For whoever calls on the name of the Lord shall be saved." - Romans 10:13
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <p className="text-lg text-gray-300 leading-relaxed">
              Jesus Christ offers freedom from sin and eternal life to all who believe. 
              His sacrifice on the cross paid the price for our redemption. 
              Through faith in Him, we are unchained from the bondage of sin and death.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Kaspa Storyboard - Freedom Through Decentralization */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 px-4 bg-black border-t border-cyan-500/20"
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black text-center mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
          >
            The Digital Battleground
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl text-gray-400 text-center mb-16 max-w-3xl mx-auto"
          >
            Where Kaspa Fights for Financial Freedom
          </motion.p>

          {/* Storyboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* The Threat - CBDCs */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-red-500/10 to-red-900/10 border border-red-500/30 rounded-2xl p-8"
            >
              <div className="text-red-400 text-5xl mb-4">⛓️</div>
              <h3 className="text-2xl font-black text-red-400 mb-4">The Chains</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                CBDCs (Central Bank Digital Currencies) threaten individual sovereignty. 
                Programmable money that can be controlled, monitored, and restricted by authorities.
              </p>
              <p className="text-gray-400 text-sm">
                Digital identity systems tracking every transaction, every purchase, every move.
              </p>
            </motion.div>

            {/* The Solution - Kaspa */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-cyan-500/10 to-blue-900/10 border border-cyan-500/30 rounded-2xl p-8"
            >
              <div className="text-cyan-400 text-5xl mb-4">🔓</div>
              <h3 className="text-2xl font-black text-cyan-400 mb-4">The Freedom</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Kaspa blockchain: truly decentralized, censorship-resistant, and permission-less. 
                No single authority can control, freeze, or reverse your transactions.
              </p>
              <p className="text-gray-400 text-sm">
                BlockDAG technology ensuring speed, security, and true decentralization.
              </p>
            </motion.div>
          </div>

          {/* DAGKnight Network Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-purple-500/10 via-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-10"
          >
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🛡️</div>
              <h3 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">
                DAGKnight Network
              </h3>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                The Quantum-Secured Multi-Wallet Verification System
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
                <div className="text-3xl mb-3">🪪</div>
                <h4 className="text-lg font-bold text-white mb-2">Decentralized ID</h4>
                <p className="text-sm text-gray-400">
                  No central authority controls your identity. You own your data.
                </p>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
                <div className="text-3xl mb-3">🔗</div>
                <h4 className="text-lg font-bold text-white mb-2">DAG Verification</h4>
                <p className="text-sm text-gray-400">
                  Quantum-secured cross-wallet verification through DAGKnight consensus.
                </p>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
                <div className="text-3xl mb-3">⚡</div>
                <h4 className="text-lg font-bold text-white mb-2">True Freedom</h4>
                <p className="text-sm text-gray-400">
                  Fast, secure, and completely decentralized financial sovereignty.
                </p>
              </div>
            </div>

            <div className="text-center">
              <Link to={createPageUrl("DAGKnightWallet")}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-cyan-500/50 transition-all"
                >
                  Explore DAGKnight Wallet
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Final Message */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <p className="text-2xl md:text-3xl font-black text-white mb-4">
              UNCHAIN HUMANITY
            </p>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              From spiritual bondage through Christ. From financial tyranny through Kaspa. 
              True freedom in both the eternal and the temporal.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}