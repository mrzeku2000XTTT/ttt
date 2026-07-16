import React from "react";

/**
 * Error boundary that catches errors from the R3F Canvas (which can throw
 * during createInstance/applyProps in the React reconciler). Shows a fallback
 * message instead of a white screen.
 */
export default class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Canvas error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-white">
          <div className="text-center p-8">
            <div className="text-2xl font-bold text-gray-800 mb-2">3D Scene Error</div>
            <div className="text-sm text-gray-500 mb-4">
              {this.state.error?.message || "An error occurred while rendering the 3D scene."}
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onReset) this.props.onReset();
              }}
              className="px-4 py-2 rounded-lg bg-black text-white text-sm font-bold hover:bg-gray-800"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}