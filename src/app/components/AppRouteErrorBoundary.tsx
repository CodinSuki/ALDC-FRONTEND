import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

type RouteErrorBoundaryProps = {
  children: ReactNode;
  resetKey: string;
};

type RouteErrorBoundaryState = {
  hasError: boolean;
  errorId: string | null;
};

class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = {
    hasError: false,
    errorId: null,
  };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return {
      hasError: true,
      errorId: `err-${Date.now().toString(36)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const payload = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      path: this.props.resetKey,
    };

    if (import.meta.env.DEV) {
      console.error('Route boundary caught an error', payload);
    } else {
      // In production, emit a compact log to avoid leaking stack traces in the UI.
      console.error('[route-error]', {
        errorId: payload.errorId,
        message: payload.message,
        path: payload.path,
      });
    }
  }

  componentDidUpdate(prevProps: RouteErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, errorId: null });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorId: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-600">
            We hit an unexpected error while loading this page. Try again, or go back to the
            dashboard.
          </p>
          {this.state.errorId && (
            <p className="mt-3 text-xs text-slate-500">Reference: {this.state.errorId}</p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Try again
            </button>
            <Link
              to="/"
              className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Go to home
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export default function AppRouteErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();

  return <RouteErrorBoundary resetKey={location.pathname}>{children}</RouteErrorBoundary>;
}
