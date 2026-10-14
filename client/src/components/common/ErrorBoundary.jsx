import React from 'react';
import ErrorState from './ErrorState';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ padding: '3rem 0' }}>
          <ErrorState
            message={this.state.error?.message || "An unexpected UI error occurred. Please refresh the page."}
            onRetry={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          />
          {this.state.error?.stack && (
            <pre style={{ textAlign: 'left', background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '0.8rem', marginTop: '1rem', maxWidth: '800px', margin: '1rem auto' }}>
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
