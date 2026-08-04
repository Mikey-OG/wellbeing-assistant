import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { classifyMessage, categoryPrompts } from '@/lib/classifier'
import { searchKnowledgeBase } from '@/lib/pinecone'

// Anthropic client for generating chat responses
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    // Get the most recent user message to classify and search with
    const latestUserMessage = [...messages]
      .reverse()
      .find((m: { role: string; content: string }) => m.role === 'user')

    let systemPrompt = categoryPrompts['Others']
    let retrievedContext = ''

    if (latestUserMessage) {
      // Classify the message to get the right specialist prompt
      const category = await classifyMessage(latestUserMessage.content)
      systemPrompt = categoryPrompts[category]
      console.log(`Category detected: ${category}`)

      // Search Pinecone for relevant wellbeing content
      const relevantChunks = await searchKnowledgeBase(latestUserMessage.content)

      if (relevantChunks.length > 0) {
        retrievedContext = `\n\nRelevant wellbeing information from our knowledge base:\n${relevantChunks.join('\n\n')}`
        console.log(`Retrieved ${relevantChunks.length} relevant chunks from knowledge base`)
      }
    }

    // Added retrieved context to the system prompt
    const fullSystemPrompt = systemPrompt + retrievedContext

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: fullSystemPrompt,
      messages: messages,
    })

    return NextResponse.json({
      message: response.content[0].type === 'text' ? response.content[0].text : ''
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}







