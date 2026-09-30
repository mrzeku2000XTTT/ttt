import React from 'react';
export default class ACAErrorBoundary extends React.Component {
  state={error:null};
  static getDerivedStateFromError(error){return {error};}
  render(){return this.state.error ? <div className="aca-computer"><div className="aca-content"><h2>ACA VIEW FAILED</h2><p>{this.state.error.message}</p><button className="aca-btn" onClick={this.props.onClose}>Return to EVOLVE</button></div></div> : this.props.children;}
}