import React, { createContext, useContext, useState, useEffect } from "react";

const StarGateContext = createContext();

export const useStarGate = () => {
  const context = useContext(StarGateContext);
  if (!context) {
    throw new Error("useStarGate must be used within StarGateProvider");
  }
  return context;
};

export const StarGateProvider = ({ children }) => {
  const [sharedData, setSharedData] = useState({});
  const [appHistory, setAppHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("stargate_shared_data");
    if (saved) {
      try {
        setSharedData(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to load shared data:", err);
      }
    }
  }, []);

  const shareData = (sourceApp, data) => {
    const timestamp = Date.now();
    const newData = {
      ...sharedData,
      [sourceApp]: {
        data,
        timestamp,
        sourceApp,
      },
    };
    setSharedData(newData);
    localStorage.setItem("stargate_shared_data", JSON.stringify(newData));
    
    setAppHistory(prev => [
      { app: sourceApp, action: "shared", timestamp },
      ...prev.slice(0, 49)
    ]);
  };

  const getSharedData = (sourceApp) => {
    return sharedData[sourceApp]?.data || null;
  };

  const getAllSharedData = () => {
    return sharedData;
  };

  const clearSharedData = (sourceApp) => {
    const newData = { ...sharedData };
    delete newData[sourceApp];
    setSharedData(newData);
    localStorage.setItem("stargate_shared_data", JSON.stringify(newData));
  };

  const clearAllSharedData = () => {
    setSharedData({});
    localStorage.removeItem("stargate_shared_data");
  };

  const value = {
    sharedData,
    shareData,
    getSharedData,
    getAllSharedData,
    clearSharedData,
    clearAllSharedData,
    appHistory,
  };

  return (
    <StarGateContext.Provider value={value}>
      {children}
    </StarGateContext.Provider>
  );
};