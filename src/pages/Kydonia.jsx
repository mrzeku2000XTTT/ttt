import React, { useState } from "react";
import { useKcc20Wallet, shortKaspaAddress } from "@/lib/useKcc20Wallet";
import KydoniaLanding from "@/components/kydonia/KydoniaLanding";
import KydoniaStudio from "@/components/kydonia/KydoniaStudio";
import "@/components/kydonia/kydonia.css";

export default function KydoniaPage() {
  const { address, loading, error, connect } = useKcc20Wallet();
  const [entered, setEntered] = useState(() => sessionStorage.getItem("kydonia_entered") === "1");
  const [seed, setSeed] = useState(null);

  // One gate at the door: a URL pasted on the landing waits here until the
  // wallet is connected, then opens straight into the studio and indexes it.
  const enter = (url) => {
    if (url) setSeed(url);
    if (!address) {
      connect();
      return;
    }
    sessionStorage.setItem("kydonia_entered", "1");
    setEntered(true);
  };

  const home = () => {
    sessionStorage.removeItem("kydonia_entered");
    setEntered(false);
  };

  if (!entered) {
    return (
      <KydoniaLanding
        hasWallet={!!address}
        wallet={address ? shortKaspaAddress(address) : null}
        loading={loading}
        error={error}
        onConnect={connect}
        onEnter={() => enter()}
        onSeed={enter}
        onExit={() => {
          window.location.href = "/AppStoreV2";
        }}
      />
    );
  }

  return <KydoniaStudio onHome={home} initialUrl={seed} />;
}