import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { ChatMessage, ToolStatus } from '../lib/agent/chatTypes'
import { WELCOME_MESSAGE } from '../lib/agent/chatTypes'
import {
  AgentChatError,
  continueAgentChat,
  streamAgentChat,
} from '../lib/agent/streamChat'
import { runAgentTool } from '../lib/agent/toolRegistry'
import type {
  AgentChatMessage,
  AgentStreamPauseInfo,
  AgentToolCall,
  AgentToolResult,
} from '../lib/agent/types'
import { usePersistedConversation } from './usePersistedConversation'

type ChatState = {
  messages: ChatMessage[]
  isStreaming: boolean
}

type ChatAction =
  | { type: 'ADD_USER'; content: string; id: string }
  | { type: 'START_ASSISTANT'; id: string }
  | { type: 'APPEND_DELTA'; messageId: string; delta: string }
  | { type: 'SET_TOOL_STATUS'; messageId: string; toolStatus: ToolStatus }
  | { type: 'FINISH_ASSISTANT'; messageId: string; content?: string }
  | { type: 'SET_ERROR'; messageId: string; error: string }
  | { type: 'RESET' }
  | { type: 'HYDRATE'; messages: ChatMessage[] }
  | { type: 'SET_STREAMING'; isStreaming: boolean }

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_USER':
      return {
        ...state,
        messages: [
          ...state.messages,
          { id: action.id, role: 'user', content: action.content },
        ],
      }
    case 'START_ASSISTANT':
      return {
        ...state,
        messages: [
          ...state.messages,
          { id: action.id, role: 'assistant', content: '', streaming: true },
        ],
      }
    case 'APPEND_DELTA':
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.messageId
            ? { ...message, content: message.content + action.delta }
            : message,
        ),
      }
    case 'SET_TOOL_STATUS':
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.messageId ? { ...message, toolStatus: action.toolStatus } : message,
        ),
      }
    case 'FINISH_ASSISTANT':
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.messageId
            ? {
                ...message,
                content: action.content ?? message.content,
                streaming: false,
              }
            : message,
        ),
      }
    case 'SET_ERROR':
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.messageId
            ? { ...message, content: action.error, streaming: false, error: true }
            : message,
        ),
      }
    case 'RESET':
      return { messages: [WELCOME_MESSAGE], isStreaming: false }
    case 'HYDRATE':
      return { ...state, messages: action.messages }
    case 'SET_STREAMING':
      return { ...state, isStreaming: action.isStreaming }
    default:
      return state
  }
}

function toAgentMessages(messages: ChatMessage[]): AgentChatMessage[] {
  return messages
    .filter((message) => message.id !== 'welcome' && !message.error)
    .map(({ role, content }) => ({ role, content }))
}

export interface UseAgentChatOptions {
  diagramId: string
  diagramTitle: string
  diagramCode: string
  noteMd: string
  onDiagramUpdate: (code: string) => void
  onNoteUpdate: (noteMd: string) => void
  onAgentDiagramSave?: (code: string, commitMessage?: string) => Promise<void>
  onAgentNoteSave?: (noteMd: string, commitMessage?: string) => Promise<void>
  validateDiagramCode?: (code: string) => Promise<import('../lib/mermaid/validateDiagram').MermaidValidationResult>
}

export function useAgentChat({
  diagramId,
  diagramTitle,
  diagramCode,
  noteMd,
  onDiagramUpdate,
  onNoteUpdate,
  onAgentDiagramSave,
  onAgentNoteSave,
  validateDiagramCode,
}: UseAgentChatOptions) {
  const [input, setInput] = useState('')
  const [state, dispatch] = useReducer(chatReducer, {
    messages: [WELCOME_MESSAGE],
    isStreaming: false,
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const diagramCodeRef = useRef(diagramCode)
  const noteMdRef = useRef(noteMd)
  const diagramTitleRef = useRef(diagramTitle)
  const messageIdRef = useRef(0)

  useEffect(() => {
    diagramCodeRef.current = diagramCode
  }, [diagramCode])

  useEffect(() => {
    noteMdRef.current = noteMd
  }, [noteMd])

  useEffect(() => {
    diagramTitleRef.current = diagramTitle
  }, [diagramTitle])

  const handleHydrate = useCallback((messages: ChatMessage[]) => {
    dispatch({ type: 'HYDRATE', messages })
  }, [])

  const { resetPersistence } = usePersistedConversation({
    diagramId,
    messages: state.messages,
    isStreaming: state.isStreaming,
    onHydrate: handleHydrate,
    messageIdRef,
  })

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages, state.isStreaming])

  const buildAgentContext = () => ({
    diagramCode: diagramCodeRef.current.trim() || undefined,
    noteMd: noteMdRef.current.trim() || undefined,
    diagramTitle: diagramTitleRef.current.trim() || undefined,
  })

  const createMessageId = (prefix: string) => {
    messageIdRef.current += 1
    return `${prefix}-${messageIdRef.current}`
  }

  const runAgentStream = async (
    endpoint: 'chat' | 'continue',
    request:
      | ({ messages: AgentChatMessage[] } & ReturnType<typeof buildAgentContext>)
      | ({
          conversationState: unknown
          toolCallId: string
          toolCallName: AgentToolCall['name']
          toolResult: AgentToolResult
        } & ReturnType<typeof buildAgentContext>),
    assistantId: string,
    controller: AbortController,
  ) => {
    const handlers = {
      onDelta: (delta: string) => {
        dispatch({ type: 'APPEND_DELTA', messageId: assistantId, delta })
      },
      onToolCall: () => {
        // Tool status is shown after client-side validation completes.
      },
      onDone: (content: string) => {
        dispatch({ type: 'FINISH_ASSISTANT', messageId: assistantId, content })
      },
      onError: (error: string) => {
        dispatch({ type: 'SET_ERROR', messageId: assistantId, error })
      },
    }

    const streamFn = endpoint === 'chat' ? streamAgentChat : continueAgentChat
    return streamFn(request as never, handlers, controller.signal)
  }

  const handleToolPause = async (
    pause: AgentStreamPauseInfo,
    assistantId: string,
    controller: AbortController,
  ) => {
    const { toolResult, toolStatus } = await runAgentTool(pause.toolCall, {
      diagramCodeRef,
      noteMdRef,
      onDiagramUpdate,
      onNoteUpdate,
      onAgentDiagramSave,
      onAgentNoteSave,
      validateDiagramCode,
    })

    dispatch({ type: 'SET_TOOL_STATUS', messageId: assistantId, toolStatus })

    return runAgentStream(
      'continue',
      {
        conversationState: pause.conversationState,
        toolCallId: pause.toolCallId,
        toolCallName: pause.toolCall.name,
        toolResult,
        ...buildAgentContext(),
      },
      assistantId,
      controller,
    )
  }

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || state.isStreaming) return

    const userId = createMessageId('user')
    const assistantId = createMessageId('assistant')
    const userMessage: ChatMessage = { id: userId, role: 'user', content: trimmed }
    const messagesForAgent = toAgentMessages([...state.messages, userMessage])

    dispatch({ type: 'ADD_USER', content: trimmed, id: userId })
    dispatch({ type: 'START_ASSISTANT', id: assistantId })
    setInput('')
    dispatch({ type: 'SET_STREAMING', isStreaming: true })

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      let pause = await runAgentStream(
        'chat',
        {
          messages: messagesForAgent,
          ...buildAgentContext(),
        },
        assistantId,
        controller,
      )

      while (pause) {
        pause = await handleToolPause(pause, assistantId, controller)
      }

      dispatch({ type: 'FINISH_ASSISTANT', messageId: assistantId })
    } catch (error) {
      if (error instanceof AgentChatError && error.message === 'Request cancelled') {
        return
      }

      const message =
        error instanceof AgentChatError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Agent request failed'

      dispatch({ type: 'SET_ERROR', messageId: assistantId, error: message })
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        dispatch({ type: 'SET_STREAMING', isStreaming: false })
      }
    }
  }

  const reset = async () => {
    if (state.isStreaming) return

    abortRef.current?.abort()
    abortRef.current = null
    dispatch({ type: 'RESET' })
    messageIdRef.current = 0
    setInput('')
    await resetPersistence()
  }

  const showSuggestions =
    state.messages.length === 1 && state.messages[0]?.id === 'welcome' && !state.isStreaming

  return {
    input,
    setInput,
    messages: state.messages,
    isStreaming: state.isStreaming,
    sendMessage,
    reset,
    messagesEndRef,
    showSuggestions,
  }
}
