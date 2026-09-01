import { Pinecone } from '@pinecone-database/pinecone'
import { CohereClient } from 'cohere-ai'

// Initialise Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
})

// Cohere client for generating search embeddings
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY!,
})

// Getting the Pinecone index
export const getIndex = () => {
  return pinecone.index(process.env.PINECONE_INDEX_NAME!)
}

// Searching the knowledge base for content relevant to the user's message
export async function searchKnowledgeBase(query: string, topK: number = 3): Promise<string[]> {
  const index = getIndex()

  // Convert the user's message into a vector using Cohere model
  const response = await cohere.embed({
    texts: [query],
    model: 'embed-english-v3.0',
    inputType: 'search_query',
  })

  const queryVector = (response.embeddings as number[][])[0]

  // This searches  Pinecone for the most similar chunks
  const results = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  })

  // It returns only chunks with a similarity that is high enough
  const relevantContent = results.matches
    .filter((match) => match.score && match.score > 0.5)
    .map((match) => match.metadata?.text as string)
    .filter(Boolean)

  return relevantContent
}

