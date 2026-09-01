'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const moodOptions = [
  { label: 'Low', score: 1 },
  { label: 'Okay', score: 2 },
  { label: 'Good', score: 3 },
  { label: 'Great', score: 4 },
]

export default function CheckinPage() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedScore, setSelectedScore] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!selectedMood) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    // Saving the check-in data to Supabase
    await supabase.from('check_ins').insert({
      user_id: user.id,
      mood: selectedMood,
      mood_score: selectedScore,
      notes: notes.trim() || null,
    })

    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Check-in saved</h2>
          <p className="text-gray-500 text-sm mb-6">Your mood has been recorded for today.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              View dashboard
            </button>
            <button
              onClick={() => router.push('/chat')}
              className="border border-gray-200 text-gray-600 px-6 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Back to chat
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-gray-900">Daily Check-in</h1>
        <button
          onClick={() => router.push('/chat')}
          className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-4 py-2"
        >
          Back to chat
        </button>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">How are you feeling today?</h2>
        <p className="text-gray-500 text-sm mb-8">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </p>

        {/* Button to select moods*/}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {moodOptions.map((mood) => (
            <button
              key={mood.label}
              onClick={() => {
                setSelectedMood(mood.label)
                setSelectedScore(mood.score)
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                selectedMood === mood.label
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-sm font-medium">{mood.label}</span>
            </button>
          ))}
        </div>


        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Anything you want to note? (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did you sleep? How is your plan going?"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={4}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedMood || loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Submit check-in'}
        </button>
      </div>
    </main>
  )
}