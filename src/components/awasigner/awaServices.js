export const KAS_USD = 0.085; // placeholder oracle price

export const AWA_SERVICES = [
  { id: "stable_fast_3d", name: "Stable Fast 3D", priceKas: 0.035 },
  { id: "image_generation", name: "Image Generation", priceKas: 0.12 },
  { id: "video_generation", name: "Video Generation", priceKas: 2.5 },
  { id: "code_analysis", name: "Code Analysis", priceKas: 0.08 },
];

export const kasToUsd = (kas) => (kas * KAS_USD).toFixed(4);