import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import KaspaSearchBrowser from '@/components/agentinternet/KaspaSearchBrowser';
import BackToStore from '@/components/BackToStore';

export default function SearchKaspa() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  return <>
    <KaspaSearchBrowser open onClose={() => navigate('/')} initialQuery={params.get('q') || ''}/>
    <div className="relative z-[300] [&_button]:top-auto [&_button]:bottom-10"><BackToStore/></div>
  </>;
}