import React, { useState } from 'react';
import BackToStore from '@/components/BackToStore';
import ACTLanding from '@/components/act/ACTLanding';
import ACTStudio from '@/components/act/ACTStudio';

export default function ACTPage() {
  const [entered, setEntered] = useState(() => sessionStorage.getItem('act_entered') === '1');

  const enter = () => {
    sessionStorage.setItem('act_entered', '1');
    setEntered(true);
  };

  return (
    <div className="bg-black min-h-[100dvh]">
      <BackToStore />
      {entered ? <ACTStudio /> : <ACTLanding onEnter={enter} />}
    </div>
  );
}