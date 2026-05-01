// Custom AI-generated logos for NODA node types.
// These replace the default lucide icons in the Node Library and Landing page
// for a more premium, branded look. Falls back to lucide if a logo is missing.

// Master NODA brand logo (used in nav, hero, favicon-like spots)
export const NODA_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/b5dbf0472_generated_image.png";

export const NODE_LOGOS = {
  ai_prompt: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/a15168d9d_generated_image.png",
  ai_image: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/61b92275e_generated_image.png",
  deep_research: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d2c114111_generated_image.png",
  read_ttt_feed: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/fbe8b6b4c_generated_image.png",
  send_email: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2cc9b4355_generated_image.png",
  send_to_x: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/de09b14e6_generated_image.png",
  post_to_ttt: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/405d480ca_generated_image.png",
  webhook: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/579b9b2d9_generated_image.png",
  delay: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/bac46fcb8_generated_image.png",
  filter: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3fb835cd8_generated_image.png",
  branch: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/253d95295_generated_image.png",
  save_data: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/54433c576_generated_image.png",
};

export const getNodeLogo = (type) => NODE_LOGOS[type] || null;