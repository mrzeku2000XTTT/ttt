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
      image: "https://images.unsplash.com/photo-1505069190533-3a7a0c5f0f03?w=800&auto=format&fit=crop"
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
    </div>
  );
}