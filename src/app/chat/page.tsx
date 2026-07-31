'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

export default function ChatPage() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Auto scroll to the latest message every time messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // On page load, check for existing conversation or create a new one
  useEffect(() => {
    const initConversation = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('User:', user)

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: existingConversations, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      console.log('Existing conversations:', existingConversations)
      console.log('Error:', error)

      if (existingConversations && existingConversations.length > 0) {
        const currentConversationId = existingConversations[0].id
        setConversationId(currentConversationId)
        console.log('Using existing conversation:', currentConversationId)

        const { data: existingMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', currentConversationId)
          .order('created_at', { ascending: true })

        if (existingMessages && existingMessages.length > 0) {
          setMessages(
            existingMessages.map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            }))
          )
        }
      } else {
        console.log('No existing conversation — creating new one')

        const { data: newConversation, error: insertError } = await supabase
          .from('conversations')
          .insert({ user_id: user.id, category: 'Others' })
          .select()
          .single()

        console.log('New conversation:', newConversation)
        console.log('Insert error:', insertError)

        if (newConversation) {
          setConversationId(newConversation.id)
        }
      }
    }

    initConversation()
  }, [])

  const handleLogout = async () => {
    // Sign out and go back to login page
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const handleSend = async () => {
    if (!input.trim() || !conversationId) return

    const userMessage = { role: 'user' as const, content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Save user message to Supabase straight away
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: input,
    })

    // Send the conversation to the AI
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...messages, userMessage] }),
    })

    const data = await response.json()
    const assistantMessage = { role: 'assistant' as const, content: data.message }

    setMessages((prev) => [...prev, assistantMessage])
    setLoading(false)

    // Save the AI response to Supabase
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: data.message,
    })
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">

      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Wellbeing Assistant</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-4 py-2"
        >
          Sign out
        </button>
      </nav>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 max-w-3xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-xl font-medium mb-2">Hello, how are you feeling today?</p>
            <p className="text-sm">
              Tell me what is on your mind and I will help you create a personalised wellbeing plan.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl text-sm text-gray-400">
              Thinking...
            </div>
          </div>
        )}

        {/* Scroll anchor — keeps the view at the latest message */}
        <div ref={bottomRef} />
      </div>

      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tell me how you are feeling..."
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>

    </main>
  )
}