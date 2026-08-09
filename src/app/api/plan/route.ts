import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Get the user's most recent wellness plan
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { data: plan } = await supabase
      .from('wellness_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Get plan error:', error)
    return NextResponse.json({ plan: null })
  }
}

// import Anthropic from '@anthropic-ai/sdk'
// import { NextRequest, NextResponse } from 'next/server'
// import { createClient } from '@/lib/supabase/server'

// // Anthropic client for generating the wellness plan
// const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// export async function POST(request: NextRequest) {
//   try {
//     const supabase = await createClient()
//     const { data: { user } } = await supabase.auth.getUser()

//     if (!user) {
//       return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
//     }

//     const { conversationHistory, category } = await request.json()

//     // Build a summary of the conversation to give the AI context
//     const conversationSummary = conversationHistory
//       .map((m: { role: string; content: string }) =>
//         `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
//       )
//       .join('\n')

//     // Ask the AI to generate a structured JSON wellness plan
//     const response = await client.messages.create({
//       model: 'claude-haiku-4-5-20251001',
//       max_tokens: 1500,
//       system: `You are a wellbeing plan generator. Based on the conversation provided, generate a personalised wellness plan in valid JSON format only.

// The JSON must follow this exact structure:
// {
//   "title": "A personalised plan title",
//   "category": "${category}",
//   "steps": [
//     {
//       "step": 1,
//       "title": "Step title",
//       "description": "Detailed description of what to do",
//       "duration": "Days 1-3"
//     }
//   ]
// }

// Generate exactly 3 steps. Each step should be specific, actionable, and based on the conversation. Return ONLY valid JSON, no other text, no markdown, no explanation.`,
//       messages: [
//         {
//           role: 'user',
//           content: `Based on this conversation, generate a personalised wellness plan:\n\n${conversationSummary}`
//         }
//       ]
//     })

//     const rawResponse = response.content[0].type === 'text' ? response.content[0].text : ''

//     // Parse the JSON plan from the AI response
//     let plan
//     try {
//       plan = JSON.parse(rawResponse)
//     } catch {
//       // If parsing fails, return an error
//       console.error('Failed to parse plan JSON:', rawResponse)
//       return NextResponse.json(
//         { error: 'Failed to generate plan. Please try again.' },
//         { status: 500 }
//       )
//     }

//     // Save the plan to Supabase
//     const { data: savedPlan, error } = await supabase
//       .from('wellness_plans')
//       .insert({
//         user_id: user.id,
//         category,
//         plan,
//       })
//       .select()
//       .single()

//     if (error) {
//       console.error('Error saving plan:', error)
//       return NextResponse.json(
//         { error: 'Failed to save plan.' },
//         { status: 500 }
//       )
//     }

//     return NextResponse.json({ plan: savedPlan })
//   } catch (error) {
//     console.error('Plan generation error:', error)
//     return NextResponse.json(
//       { error: 'Something went wrong. Please try again.' },
//       { status: 500 }
//     )
//   }
// }

// // Get the user's most recent wellness plan
// export async function GET() {
//   try {
//     const supabase = await createClient()
//     const { data: { user } } = await supabase.auth.getUser()

//     if (!user) {
//       return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
//     }

//     const { data: plan } = await supabase
//       .from('wellness_plans')
//       .select('*')
//       .eq('user_id', user.id)
//       .order('created_at', { ascending: false })
//       .limit(1)
//       .single()

//     return NextResponse.json({ plan })
//   } catch (error) {
//     console.error('Get plan error:', error)
//     return NextResponse.json({ plan: null })
//   }
// }