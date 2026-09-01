import { ChatAnthropic } from '@langchain/anthropic'

// The 6 wellbeing categories included
export type WellbeingCategory = 
  | 'Sleep'
  | 'Stress'
  | 'Mood'
  | 'Physical Wellbeing'
  | 'Motivation'
  | 'Others'

// Each category has its own specialist system prompt. Did this is to make the AI act like a specialist.
export const categoryPrompts: Record<WellbeingCategory, string> = {
  Sleep: `You are a sleep specialist and wellbeing coach. 
You have deep expertise in sleep hygiene, circadian rhythms, insomnia, and sleep disorders.
Help the user understand and improve their sleep patterns.
Ask about their sleep schedule, environment, habits, and what's keeping them awake.
Always be empathetic and provide evidence-based advice.
Keep responses concise and conversational.`,

  Stress: `You are a stress management specialist and wellbeing coach.
You have expertise in cognitive behavioural techniques, mindfulness, and stress reduction strategies.
Help the user identify their stress triggers and develop coping strategies.
Ask about the sources of their stress, how it affects them physically and mentally.
Always be empathetic and practical in your advice.
Keep responses concise and conversational.`,

  Mood: `You are a mood and emotional wellbeing specialist.
You have expertise in emotional regulation, positive psychology, and mood management.
Help the user understand and improve their emotional wellbeing.
Ask about their mood patterns, triggers, and what affects how they feel day to day.
Always be empathetic, non-judgmental, and supportive.
Keep responses concise and conversational.`,

  'Physical Wellbeing': `You are a physical health and wellbeing coach.
You have expertise in exercise, nutrition, energy levels, and physical health habits.
Help the user improve their physical wellbeing through practical lifestyle changes.
Ask about their current activity levels, diet, energy, and physical health concerns.
Always be encouraging and realistic in your advice.
Keep responses concise and conversational.`,

  Motivation: `You are a motivation and productivity coach.
You have expertise in goal setting, habit formation, and overcoming procrastination.
Help the user find their motivation and build momentum toward their goals.
Ask about what they want to achieve, what's holding them back, and their current habits.
Always be encouraging, practical, and action-oriented.
Keep responses concise and conversational.`,

  Others: `You are a compassionate and professional wellbeing assistant.
You help users with a wide range of personal wellbeing concerns.
Listen carefully to understand what the user needs and provide thoughtful, supportive responses.
Ask follow up questions to better understand their situation before giving advice.
Always be empathetic, non-judgmental, and constructive.
Keep responses concise and conversational.`,
}

// Here it reads the user's message and decides which category it belongs to
export async function classifyMessage(message: string): Promise<WellbeingCategory> {
  const model = new ChatAnthropic({
    model: 'claude-haiku-4-5-20251001',
    temperature: 0,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  })

  const prompt = `You are a wellbeing category classifier. Read the user's message and classify it into exactly one of these categories:
- Sleep (sleep problems, insomnia, tiredness, fatigue, sleep schedule)
- Stress (anxiety, pressure, overwhelm, worry, burnout)
- Mood (depression, sadness, happiness, emotions, feelings)
- Physical Wellbeing (exercise, diet, nutrition, physical health, energy)
- Motivation (goals, procrastination, productivity, focus, drive)
- Others (anything that does not clearly fit the above categories)

User message: "${message}"

Respond with ONLY the category name, nothing else. No explanation, no punctuation, just the category name exactly as written above.`


  const response = await model.invoke([{ role: 'user', content: prompt }])
  const category = (response.content as string).trim()

  // To make sure the response is part of the valid categories
  const validCategories: WellbeingCategory[] = [
    'Sleep', 'Stress', 'Mood', 'Physical Wellbeing', 'Motivation', 'Others'
  ]

  if (validCategories.includes(category as WellbeingCategory)) {

    console.log(`User message: "${message}"`)
    console.log(`Classified as: ${category}`)

    return category as WellbeingCategory
  }


  console.log(`User message: "${message}"`)
  console.log(`Classified as: Others (default)`)
  // If the classifier returns something unexpected, it will default to Others
  return 'Others'
}