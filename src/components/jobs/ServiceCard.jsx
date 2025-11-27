import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Star, Heart, User, TrendingUp } from "lucide-react";

export default function ServiceCard({ service }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 group-hover:border-white/30 rounded-2xl overflow-hidden transition-all">
        {/* Cover Image */}
        <Link to={createPageUrl(`ServiceDetail?id=${service.id}`)}>
          <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
            {service.cover_image ? (
              <img
                src={service.cover_image}
                alt={service.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <TrendingUp className="w-12 h-12 text-white/20" />
              </div>
            )}
            
            {/* Featured Badge */}
            {service.is_featured && (
              <div className="absolute top-3 left-3">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Featured
                </div>
              </div>
            )}

            {/* Like Button */}
            <button className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center hover:bg-black/60 transition-all">
              <Heart className="w-4 h-4 text-white/60 hover:text-red-400" />
            </button>
          </div>
        </Link>

        {/* Content */}
        <div className="p-4">
          {/* User Info */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-white/60 font-medium">
              {service.user_email?.split('@')[0] || 'Anonymous'}
            </span>
          </div>

          {/* Title */}
          <Link to={createPageUrl(`ServiceDetail?id=${service.id}`)}>
            <h3 className="text-white font-semibold line-clamp-2 mb-2 group-hover:text-cyan-400 transition-colors">
              {service.title}
            </h3>
          </Link>

          {/* Rating & Reviews */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-bold text-white">
                {service.rating || 5.0}
              </span>
            </div>
            <span className="text-xs text-white/40">
              ({service.reviews_count || 0})
            </span>
            {service.orders_completed > 0 && (
              <>
                <span className="text-white/20">•</span>
                <span className="text-xs text-white/40">
                  {service.orders_completed} orders
                </span>
              </>
            )}
          </div>

          {/* Skills */}
          {service.skills && service.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {service.skills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded-md text-white/60"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Price & CTA */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div>
              <div className="text-xs text-white/40">Starting at</div>
              <div className="text-lg font-bold text-white">
                ${service.price_from}
              </div>
            </div>
            <Link to={createPageUrl(`ServiceDetail?id=${service.id}`)}>
              <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium rounded-lg transition-all">
                View Details
              </button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}