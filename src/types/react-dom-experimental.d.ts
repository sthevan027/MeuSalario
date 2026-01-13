import type { Key, ReactNode, ReactPortal } from 'react'
import 'react-dom'

declare module 'react-dom' {
  // Mantém typings padrões (ex.: createPortal) mesmo com moduleResolution=bundler.
  export function createPortal(
    children: ReactNode,
    container: Element | DocumentFragment,
    key?: Key | null
  ): ReactPortal

  // Tipagens mínimas para Server Actions no React 18 (API experimental).
  // No React 19 essas APIs viram useFormState/useFormStatus.
  export function experimental_useFormState<State, Payload>(
    action: (prevState: State, payload: Payload) => State | Promise<State>,
    initialState: State,
    permalink?: string
  ): [State, (payload: Payload) => void]

  export function experimental_useFormStatus(): {
    pending: boolean
  }
}

