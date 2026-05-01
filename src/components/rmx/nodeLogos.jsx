// Silver-glass NODA brand logo (transparent PNG, no surrounding circle).
// Used in nav, hero, and any place we need the master mark.
export const NODA_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/386944779_generated_image.png";

// Silver-glass node icons (transparent PNG, monochrome).
// These replace the default lucide icons across NODA surfaces for a unified
// premium glass aesthetic.
export const NODE_LOGOS = {
  ai_prompt:     "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/055b7ed66_generated_image.png",
  ai_image:      "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/38639af33_generated_image.png",
  deep_research: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/13d4f05b3_generated_image.png",
  read_ttt_feed: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/56ef1bcfd_generated_image.png",
  send_email:    "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/9013f2d29_generated_image.png",
  send_to_x:     "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/de481ecb1_generated_image.png",
  post_to_ttt:   "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/37f864869_generated_image.png",
  webhook:       "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/673f9b907_generated_image.png",
  delay:         "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/6259a74fd_generated_image.png",
  filter:        "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/c90c0885d_generated_image.png",
  branch:        "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/41f52518c_generated_image.png",
  save_data:     "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/17f520b0f_generated_image.png",
};

export const getNodeLogo = (type) => NODE_LOGOS[type] || null;