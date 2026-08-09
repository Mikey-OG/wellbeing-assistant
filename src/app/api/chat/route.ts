import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { classifyMessage, categoryPrompts } from '@/lib/classifier'
import { searchKnowledgeBase } from '@/lib/pinecone'
import { createClient } from '@/lib/supabase/server'

// Anthropic client for generating chat responses
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Extract plan JSON from AI response if present
function extractPlan(response: string): { message: string; plan: object | null } {
  const planStart = response.indexOf('PLAN_START')
  const planEnd = response.indexOf('PLAN_END')

  if (planStart === -1 || planEnd === -1) {
    return { message: response, plan: null }
  }

  // Separate the normal message from the plan
  const message = response.substring(0, planStart).trim()
  const planJson = response.substring(planStart + 10, planEnd).trim()

  try {
    const plan = JSON.parse(planJson)
    return { message, plan }
  } catch {
    // If JSON parsing fails just return the full response without a plan
    console.error('Failed to parse plan JSON from response')
    return { message: response, plan: null }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    // Get the most recent user message to classify and search with
    const latestUserMessage = [...messages]
      .reverse()
      .find((m: { role: string; content: string }) => m.role === 'user')

    let systemPrompt = categoryPrompts['Others']
    let retrievedContext = ''
    let detectedCategory = 'Others'

    if (latestUserMessage) {
      // Classify the message to get the right specialist prompt
      detectedCategory = await classifyMessage(latestUserMessage.content)
      systemPrompt = categoryPrompts[detectedCategory as keyof typeof categoryPrompts]
      console.log(`Category detected: ${detectedCategory}`)

            // Search Pinecone for relevant wellbeing content
      let relevantChunks: string[] = []
      try {
        relevantChunks = await searchKnowledgeBase(latestUserMessage.content)
      } catch (err) {
        // If Pinecone is unavailable, continue without retrieved context
        console.error('Pinecone search failed, continuing without context:', err)
      }

      if (relevantChunks.length > 0) {
        retrievedContext = `\n\nRelevant wellbeing information from our knowledge base:\n${relevantChunks.join('\n\n')}`
        console.log(`Retrieved ${relevantChunks.length} relevant chunks from knowledge base`)
      }
    }

    // Plan generation instruction added to every response after enough context
    const planInstruction = `

    After 5 exchanges generate a wellness plan based on what you know so far. Keep each response focused and concise. Do not ask more than 2 questions at a time. Add it at the very end in this exact format, after your normal response text:

PLAN_START
{
  "title": "A specific plan title",
  "category": "${detectedCategory}",
  "steps": [
    {
      "step": 1,
      "title": "Step title",
      "description": "What to do",
      "duration": "Days 1-3"
    },
    {
      "step": 2,
      "title": "Step title",
      "description": "What to do",
      "duration": "Days 4-7"
    },
    {
      "step": 3,
      "title": "Step title",
      "description": "What to do",
      "duration": "Days 8-14"
    }
  ]
}
PLAN_END

Only include this once when you feel ready. Do not mention you are generating JSON. Just include it naturally at the end.`

    const fullSystemPrompt = systemPrompt + retrievedContext + planInstruction

    // Had issues with empty messages breaking the API so filtering them out here
    const validMessages = messages.filter(
      (m: { role: string; content: string }) => m.content && m.content.trim().length > 0
    )

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: fullSystemPrompt,
      messages: validMessages,
    })

    const rawResponse = response.content[0].type === 'text' ? response.content[0].text : ''

    // Extract plan from response if present
    const { message, plan } = extractPlan(rawResponse)

    // If a plan was generated, save it to Supabase automatically
    if (plan) {
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          await supabase.from('wellness_plans').insert({
            user_id: user.id,
            category: detectedCategory,
            plan,
          })
          console.log('Wellness plan saved to Supabase automatically')
        }
      } catch (err) {
        // Don't fail the whole request if plan saving fails
        console.error('Failed to save plan:', err)
      }
    }

    return NextResponse.json({
      message,
      planGenerated: plan !== null,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
// import Anthropic from '@anthropic-ai/sdk'
// import { NextRequest, NextResponse } from 'next/server'
// import { classifyMessage, categoryPrompts } from '@/lib/classifier'
// import { searchKnowledgeBase } from '@/lib/pinecone'

// // Anthropic client for generating chat responses
// const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// export async function POST(request: NextRequest) {
//   try {
//     const { messages } = await request.json()

//     // Get the most recent user message to classify and search with
//     const latestUserMessage = [...messages]
//       .reverse()
//       .find((m: { role: string; content: string }) => m.role === 'user')

//     let systemPrompt = categoryPrompts['Others']
//     let retrievedContext = ''

//     if (latestUserMessage) {
//       // Classify the message to get the right specialist prompt
//       const category = await classifyMessage(latestUserMessage.content)
//       systemPrompt = categoryPrompts[category]
//       console.log(`Category detected: ${category}`)

//       // Search Pinecone for relevant wellbeing content
//       const relevantChunks = await searchKnowledgeBase(latestUserMessage.content)

//       if (relevantChunks.length > 0) {
//         retrievedContext = `\n\nRelevant wellbeing information from our knowledge base:\n${relevantChunks.join('\n\n')}`
//         console.log(`Retrieved ${relevantChunks.length} relevant chunks from knowledge base`)
//       }
//     }

//     // Added retrieved context to the system prompt
//     // const fullSystemPrompt = systemPrompt + retrievedContext
//     const planInstruction = `

// After 4 or more exchanges when you have enough information, include a wellness plan in your response. Add it at the very end in this exact format, after your normal response text:

// PLAN_START
// {
//   "title": "A specific plan title",
//   "category": "the category name",
//   "steps": [
//     {
//       "step": 1,
//       "title": "Step title",
//       "description": "What to do",
//       "duration": "Days 1-3"
//     },
//     {
//       "step": 2,
//       "title": "Step title",
//       "description": "What to do",
//       "duration": "Days 4-7"
//     },
//     {
//       "step": 3,
//       "title": "Step title",
//       "description": "What to do",
//       "duration": "Days 8-14"
//     }
//   ]
// }
// PLAN_END

// Only include this once when you feel ready. Do not mention you are generating JSON. Just include it naturally at the end.`

// const fullSystemPrompt = systemPrompt + retrievedContext + planInstruction

//     const response = await client.messages.create({
//       model: 'claude-haiku-4-5-20251001',
//       max_tokens: 1024,
//       system: fullSystemPrompt,
//       messages: messages,
//     })

//     return NextResponse.json({
//       message: response.content[0].type === 'text' ? response.content[0].text : ''
//     })
//   } catch (error) {
//     console.error('Chat API error:', error)
//     return NextResponse.json(
//       { error: 'Something went wrong. Please try again.' },
//       { status: 500 }
//     )
//   }
// }







