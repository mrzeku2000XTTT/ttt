import React from 'react';
import ACAEditor from '@/components/evolve/aca/ACAEditor';
export default function ACACode({aca}) {return <div className="aca-stack"><p className="aca-notice">CODE EXECUTION UNAVAILABLE — edit and inspect source files only. No E2B connection, host execution, packages, secrets or network access.</p><ACAEditor aca={aca} code/></div>;}