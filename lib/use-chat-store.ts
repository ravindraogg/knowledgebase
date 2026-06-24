'use client'

// Chat-session store backed by the API (Postgres). Sessions and messages are
// persisted server-side; SWR keeps the client cache in sync.

import { useCallback, useState } from 'react'
import useSWR from 'swr'
import type { ChatMessage, ChatSession } from '@/lib/types'
import { apiFetch } from '@/lib/api'
import { fetcher } from '@/lib/fetcher'

const KEY = '/api/chat/sessions'

export function useChatStore() {
  const { data, isLoading, mutate } = useSWR<ChatSession[]>(KEY, fetcher)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const sessions = data ?? []
  const resolvedActiveId = activeId ?? sessions[0]?.id ?? null
  const activeSession = sessions.find((s) => s.id === resolvedActiveId) ?? null

  const createSession = useCallback(async (): Promise<string> => {
    const session = await apiFetch<ChatSession>(KEY, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    await mutate((prev) => [session, ...(prev ?? [])], { revalidate: false })
    setActiveId(session.id)
    return session.id
  }, [mutate])

  const deleteSession = useCallback(
    async (id: string) => {
      await mutate((prev) => (prev ?? []).filter((s) => s.id !== id), { revalidate: false })
      setActiveId((curr) => (curr === id ? null : curr))
      await apiFetch(`${KEY}/${id}`, { method: 'DELETE' }).catch(() => {})
    },
    [mutate],
  )

  const sendMessage = useCallback(
    async (content: string) => {
      let sessionId = resolvedActiveId
      if (!sessionId) sessionId = await createSession()

      const optimisticUser: ChatMessage = {
        id: `tmp-${Date.now()}`,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      }

      // Optimistically render the user's message.
      await mutate(
        (prev) =>
          (prev ?? []).map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  title: s.title === 'New conversation' ? content.slice(0, 60) : s.title,
                  messages: [...s.messages, optimisticUser],
                }
              : s,
          ),
        { revalidate: false },
      )

      setSending(true)
      try {
        await apiFetch(`${KEY}/${sessionId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ content }),
        })
      } finally {
        // Revalidate either way — the user message is persisted server-side
        // even when answer generation fails.
        await mutate()
        setSending(false)
      }
    },
    [resolvedActiveId, createSession, mutate],
  )

  return {
    sessions,
    activeSession,
    activeId: resolvedActiveId,
    loading: isLoading,
    sending,
    setActiveId,
    createSession,
    deleteSession,
    sendMessage,
  }
}
