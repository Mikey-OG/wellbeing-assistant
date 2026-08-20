'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type CheckIn = {
  id: string
  mood: string
  mood_score: number
  notes: string | null
  created_at: string
}

type WellnessPlan = {
  id: string
  category: string
  plan: {
    title: string
    steps: { step: number; title: string; description: string; duration: string }[]
  }
  created_at: string
}

export default function DashboardPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [plan, setPlan] = useState<WellnessPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Load last 7 check ins
      const { data: checkInData } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(7)

      if (checkInData) {
        setCheckIns(checkInData)
        setStreak(calculateStreak(checkInData))
      }

      // Load most recent wellness plan
      const { data: planData } = await supabase
        .from('wellness_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (planData) {
        setPlan(planData)
      }

      setLoading(false)
    }

    loadDashboard()
  }, [])

  const calculateStreak = (checkins: CheckIn[]): number => {
    if (checkins.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < checkins.length; i++) {
      const checkinDate = new Date(checkins[i].created_at)
      checkinDate.setHours(0, 0, 0, 0)

      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - i)

      if (checkinDate.getTime() === expectedDate.getTime()) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  const getMoodScore = (mood: string): number => {
    const scores: Record<string, number> = {
      Low: 1, Okay: 2, Good: 3, Great: 4
    }
    return scores[mood] || 0
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading dashboard...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        <button
          onClick={() => router.push('/chat')}
          className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-4 py-2"
        >
          Back to chat
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Check-in streak</p>
            <p className="text-2xl font-semibold text-gray-900">{streak} days</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total check-ins</p>
            <p className="text-2xl font-semibold text-gray-900">{checkIns.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Active category</p>
            <p className="text-2xl font-semibold text-gray-900" style={{ fontSize: '16px', marginTop: '4px' }}>
              {plan ? plan.category : 'None'}
            </p>
          </div>
        </div>

        {/* Mood chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Mood over the past week</h2>
          {checkIns.length === 0 ? (
            <p className="text-sm text-gray-400">No check-ins yet. Complete your first check-in to see your mood chart.</p>
          ) : (
            <div className="space-y-2">
              {[...checkIns].reverse().map((checkin) => (
                <div key={checkin.id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-20 flex-shrink-0">
                    {new Date(checkin.created_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(getMoodScore(checkin.mood) / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-10 text-right">{checkin.mood}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent check-ins */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Recent check-ins</h2>
          {checkIns.length === 0 ? (
            <p className="text-sm text-gray-400">No check-ins yet.</p>
          ) : (
            <div className="space-y-3">
              {checkIns.map((checkin) => (
                <div key={checkin.id} className="flex items-start justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{checkin.mood}</p>
                    {checkin.notes && (
                      <p className="text-xs text-gray-500 mt-1">{checkin.notes}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-4">
                    {new Date(checkin.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current plan */}
        {plan && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-900">Current wellness plan</h2>
              <button
                onClick={() => router.push('/plan')}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                View full plan
              </button>
            </div>
            <p className="text-sm text-gray-700 font-medium mb-1">{plan.plan.title}</p>
            <p className="text-xs text-gray-400">{plan.plan.steps.length} steps · {plan.category}</p>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/checkin')}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700"
          >
            Daily check-in
          </button>
          <button
            onClick={() => router.push('/chat')}
            className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50"
          >
            Back to chat
          </button>
        </div>

      </div>
    </main>
  )
}