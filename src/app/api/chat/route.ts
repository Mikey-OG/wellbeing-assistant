import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { classifyMessage, categoryPrompts } from '@/lib/classifier'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    // Get the most recent user message to classify
    const latestUserMessage = [...messages]
      .reverse()
      .find((m: { role: string; content: string }) => m.role === 'user')

    // Default to Others if somehow no user message exists
    let systemPrompt = categoryPrompts['Others']

    if (latestUserMessage) {
      // Reclassify on every message so users can switch topics naturally
      const category = await classifyMessage(latestUserMessage.content)
      systemPrompt = categoryPrompts[category]
      console.log(`Category detected: ${category}`)
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    })

    return NextResponse.json({
      message: response.content[0].type === 'text' ? response.content[0].text : '',
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}


//This is for OPENAI API, it doesnt seem to work even though i have credits
// import OpenAI from 'openai'
// import { NextRequest, NextResponse } from 'next/server'
// import { classifyMessage, categoryPrompts } from '@/lib/classifier'

// // OpenAI client for generating chat responses
// const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// export async function POST(request: NextRequest) {
//   try {
//     const { messages } = await request.json()

//     // Get the most recent user message to classify
//     const latestUserMessage = [...messages]
//       .reverse()
//       .find((m: { role: string; content: string }) => m.role === 'user')

//     // Default to Others if somehow no user message exists
//     let systemPrompt = categoryPrompts['Others']

//     if (latestUserMessage) {
//       // Reclassify on every message so users can switch topics naturally
//       const category = await classifyMessage(latestUserMessage.content)
//       systemPrompt = categoryPrompts[category]
//       console.log(`Category detected: ${category}`)
//     }

//     const response = await client.chat.completions.create({
//       model: 'gpt-4o-mini',
//       max_tokens: 1024,
//       messages: [
//         { role: 'system', content: systemPrompt },
//         ...messages
//       ],
//     })

//     return NextResponse.json({
//       message: response.choices[0].message.content
//     })
//   } catch (error) {
//     console.error('Chat API error:', error)
//     return NextResponse.json(
//       { error: 'Something went wrong. Please try again.' },
//       { status: 500 }
//     )
//   }
// }




