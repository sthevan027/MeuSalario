'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

type State = {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Erro inesperado'
    return { hasError: true, message }
  }

  reset = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-rose-400" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-100">Algo deu errado</p>
            <p className="text-sm text-slate-400">{this.state.message}</p>
          </div>
          <Button variant="secondary" onClick={this.reset}>
            Tentar novamente
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
