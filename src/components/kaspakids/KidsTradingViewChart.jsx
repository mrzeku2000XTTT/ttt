import React, { useEffect, useRef } from "react";

// Real TradingView Advanced Chart embed (free widget).
// Full-screen premium chart for the Slobz kids DEX.
export default function KidsTradingViewChart({ symbol = "KASPAUSD", theme = "dark" }) {
  const ref = useRef(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.type = "text";
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "60",
      timezone: "Etc/UTC",
      theme,
      style: "1",
      locale: "en",
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      withdateranges: true,
      studies: ["STD;EMA", "STD;RSI", "STD;MACD"],
      support_host: "tradingview.com",
      backgroundColor: theme === "dark" ? "#14101f" : "#FFFFFF",
      gridColor: theme === "dark" ? "rgba(124,92,252,0.08)" : "rgba(0,0,0,0.06)",
    });
    container.appendChild(script);
  }, [symbol, theme]);

  return (
    <div className="w-full h-full">
      <div ref={ref} className="tradingview-widget-container w-full h-full" />
    </div>
  );
}