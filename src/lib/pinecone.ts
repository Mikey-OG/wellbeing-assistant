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

// Get the Pinecone index
export const getIndex = () => {
  return pinecone.index(process.env.PINECONE_INDEX_NAME!)
}

// Search the knowledge base for content relevant to the user's message
export async function searchKnowledgeBase(query: string, topK: number = 3): Promise<string[]> {
  const index = getIndex()

  // Convert the user's message into a vector using Cohere
  const response = await cohere.embed({
    texts: [query],
    model: 'embed-english-v3.0',
    inputType: 'search_query',
  })

  const queryVector = (response.embeddings as number[][])[0]

  // Search Pinecone for the most similar chunks
  const results = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  })

  // Return only chunks with high enough similarity
  const relevantContent = results.matches
    .filter((match) => match.score && match.score > 0.5)
    .map((match) => match.metadata?.text as string)
    .filter(Boolean)

  return relevantContent
}

// import { Pinecone } from '@pinecone-database/pinecone'
// import { OpenAI } from 'openai'

// // Initialised  Pinecone client  and OpenAI (I needed it for the embedding model) using the API key from environment variables
// const pinecone = new Pinecone({
//   apiKey: process.env.PINECONE_API_KEY!,
// })

// //For the embedding model
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// })

// // Get the Pinecone index created
// export const getIndex = () => {
//   return pinecone.index(process.env.PINECONE_INDEX_NAME!)
// }

// // Convert a piece of text into a vector embedding using OpenAI embedding miodel
// export async function embedText(text: string): Promise<number[]> {
//   const response = await openai.embeddings.create({
//     model: 'text-embedding-ada-002',
//     input: text,
//   })
//   return response.data[0].embedding
// }

// // Search Pinecone for content relevant to the user's message
// export async function searchKnowledgeBase(query: string, topK: number = 3): Promise<string[]> {
//   const index = getIndex()

//   // Convert the user's message into a vector so we can search with it
//   const queryEmbedding = await embedText(query)

//   // Here, we're search Pinecone for the most similar content
//   const results = await index.query({
//     vector: queryEmbedding,
//     topK,
//     includeMetadata: true,
//   })

//   // Extract the actual text content from the results
//   const relevantContent = results.matches
//     .filter((match) => match.score && match.score > 0.7)
//     .map((match) => match.metadata?.text as string)
//     .filter(Boolean)

//   return relevantContent
// }