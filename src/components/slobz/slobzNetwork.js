import { useState, useEffect } from "react";

// Slobz network mode: 'mainnet' (real KAS) or 'testnet' (Kaspa testnet-10, TKAS)
export const SLOBZ_NETWORK_KEY = "slobz_network";
export const TESTNET_FAUCET_URL = "https://faucet.kaspanet.io/";

export function getSlobzNetwork() {
  try {
    return localStorage.getItem(SLOBZ_NETWORK_KEY) === "testnet" ? "testnet" : "mainnet";
  } catch {
    return "mainnet";
  }
}

export function setSlobzNetwork(net) {
  try {
    localStorage.setItem(SLOBZ_NETWORK_KEY, net === "testnet" ? "testnet" : "mainnet");
  } catch { /* private mode */ }
  window.dispatchEvent(new Event("slobz-network-change"));
}

export function useSlobzNetwork() {
  const [network, setNetwork] = useState(getSlobzNetwork());
  useEffect(() => {
    const update = () => setNetwork(getSlobzNetwork());
    window.addEventListener("slobz-network-change", update);
    return () => window.removeEventListener("slobz-network-change", update);
  }, []);
  return network;
}