import React from 'react';
import BackToStore from '@/components/BackToStore';
import ProductWorkspace from '@/components/productstudio/ProductWorkspace';
import '@/components/productstudio/productStudio.css';

export default function ProductStudio() {
  return <main className="product-studio min-h-screen bg-background text-foreground"><BackToStore /><ProductWorkspace /></main>;
}