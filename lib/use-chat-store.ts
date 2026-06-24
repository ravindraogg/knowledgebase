'use client'

// Local chat-session store for the demo shell. Persists sessions to
// localStorage so history survives reloads. A real build would persist
// chat_sessions / chat_messages to Postgres via the API.

import { useCallback, useEffect, useState } from 'react'
import type { ChatMessage, ChatSession } from '@/lib/types'

const STORE_KEY = 'emos.chat.sessions'

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function load(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return []
}

export function useChatStore(orgId: string, userId: string) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const loaded = load()
    setSessions(loaded)
    setActiveId(loaded[0]?.id ?? null)
    setHydrated(true)
  }, [])

  const persist = useCallback((next: ChatSession[]) => {
    setSessions(next)
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }, [])

  const newSession = useCallback(() => {
    const session: ChatSession = {
      id: uid(),
      orgId,
      userId,
      title: 'New conversation',
      createdAt: new Date().toISOString(),
      messages: [],
    }
    setSessions((prev) => {
      const next = [session, ...prev]
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
    setActiveId(session.id)
    return session.id
  }, [orgId, userId])

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id)
        try {
          localStorage.setItem(STORE_KEY, JSON.stringify(next))
        } catch {
          // ignore
        }
        setActiveId((curr) => (curr === id ? next[0]?.id ?? null : curr))
        return next
      })
    },
    [],
  )

  const appendMessage = useCallback(
    (sessionId: string, message: ChatMessage) => {
      setSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id !== sessionId) return s
          const isFirstUser =
            s.messages.length === 0 && message.role === 'user'
          return {
            ...s,
            title: isFirstUser
              ? message.content.slice(0, 48)
              : s.title,
            messages: [...s.messages, message],
          }
        })
        try {
          localStorage.setItem(STORE_KEY, JSON.stringify(next))
        } catch {
          // ignore
        }
        return next
      })
    },
    [],
  )

  const activeSession = sessions.find((s) => s.id === activeId) ?? null

  return {
    sessions,
    activeSession,
    activeId,
    hydrated,
    setActiveId,
    newSession,
    deleteSession,
    appendMessage,
  }
}
