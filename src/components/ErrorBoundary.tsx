import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="page" style={{ paddingTop: 32, textAlign: 'center' }}>
            <p className="error" style={{ marginBottom: 12 }}>此分頁發生錯誤，其他功能仍可正常使用。</p>
            <p className="muted" style={{ fontSize: '0.8rem' }}>{this.state.message}</p>
            <button
              className="btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => this.setState({ hasError: false, message: '' })}
            >
              重試
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
