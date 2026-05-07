import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    if (typeof console !== 'undefined') {
      console.error('[ErrorBoundary] Render error:', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ error: null, errorInfo: null })
  }

  render() {
    if (this.state.error) {
      const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV
      return (
        <div style={{
          padding: '32px',
          maxWidth: '720px',
          margin: '40px auto',
          fontFamily: 'system-ui, sans-serif',
          color: '#222'
        }}>
          <h2 style={{ color: '#c62828' }}>Something went wrong</h2>
          <p>The app hit an unexpected error. Your progress is safe — try going back, or refresh the page.</p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '10px 18px',
              borderRadius: '6px',
              border: 'none',
              background: '#0D9488',
              color: 'white',
              cursor: 'pointer',
              marginRight: '8px'
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 18px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
          {isDev && (
            <details style={{ marginTop: '24px', whiteSpace: 'pre-wrap' }}>
              <summary style={{ cursor: 'pointer', color: '#666' }}>Developer details</summary>
              <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', overflow: 'auto', fontSize: '12px' }}>
                {String(this.state.error?.stack || this.state.error)}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
