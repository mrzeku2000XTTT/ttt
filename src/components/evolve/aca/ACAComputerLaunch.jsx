import React from 'react';
import ACAComputer from '@/components/evolve/aca/ACAComputer';
import ACAErrorBoundary from '@/components/evolve/aca/ACAErrorBoundary';
export default function ACAComputerLaunch(props){return <ACAErrorBoundary onClose={props.onClose}><ACAComputer {...props}/></ACAErrorBoundary>;}