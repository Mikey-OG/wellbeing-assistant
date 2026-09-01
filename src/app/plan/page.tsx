'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type PlanStep = {
  step: number
  title: string
  description: string
  duration: string
}

type WellnessPlan = {
  title: string
  category: string
  steps: PlanStep[]
}

type SavedPlan = {
  id: string
  category: string
  plan: WellnessPlan
  created_at: string
}

export default function PlanPage() {
  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get the most recent wellness plan for this user
      const { data } = await supabase
        .from('wellness_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setSavedPlan(data)
      setLoading(false)
    }

    loadPlan()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading your plan...</p>
      </main>
    )
  }

  if (!savedPlan) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No wellness plan yet.</p>
          <button
            onClick={() => router.push('/chat')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Start a conversation
          </button>
        </div>
      </main>
    )
  }

  const plan = savedPlan.plan

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Wellbeing Assistant</h1>
        <button
          onClick={() => router.push('/chat')}
          className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-4 py-2"
        >
          Back to chat
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">

        <div className="mb-8">
          <span className="text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
            {plan.category}
          </span>
          <h2 className="text-2xl font-semibold text-gray-900 mt-3">{plan.title}</h2>
          <p className="text-gray-500 text-sm mt-1">
            Generated on {new Date(savedPlan.created_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
        </div>

        {/* This is the progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Progress</span>
            <span>0 of {plan.steps.length} steps</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-blue-600 rounded-full" style={{ width: '0%' }} />
          </div>
        </div>

        {/* This is the plan steps */}
        <div className="space-y-4">
          {plan.steps.map((step) => (
            <div
              key={step.step}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                  {step.step}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                  <p className="text-xs text-gray-400 mt-2">{step.duration}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <button
            onClick={() => router.push('/chat')}
            className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700"
          >
            Continue conversation
          </button>
        </div>

      </div>
    </main>
  )
}