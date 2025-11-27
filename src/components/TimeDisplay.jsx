import React, { useState, useEffect } from "react";

export function formatPostTime(dateString) {
  if (!dateString) return '';
  
  const postDate = new Date(dateString);
  const now = new Date();
  const diffMs = now - postDate;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Just posted (less than 10 seconds)
  if (diffSecs < 10) {
    return 'Just now';
  }
  
  // Less than 1 minute (show seconds)
  if (diffSecs < 60) {
    return `${diffSecs}s`;
  }
  
  // Less than 1 hour
  if (diffMins < 60) {
    return `${diffMins}m`;
  }
  
  // Less than 24 hours
  if (diffHours < 24) {
    return `${diffHours}h`;
  }
  
  // Less than 7 days
  if (diffDays < 7) {
    return `${diffDays}d`;
  }
  
  // More than 7 days - show actual date
  const month = postDate.toLocaleDateString('en-US', { month: 'short' });
  const day = postDate.getDate();
  const year = postDate.getFullYear();
  const currentYear = now.getFullYear();
  
  if (year === currentYear) {
    return `${month} ${day}`;
  }
  
  return `${month} ${day}, ${year}`;
}

export default function TimeDisplay({ date, className = "" }) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    // Always update every 10 seconds for simplicity and reliability
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className={className}>
      {formatPostTime(date)}
    </span>
  );
}