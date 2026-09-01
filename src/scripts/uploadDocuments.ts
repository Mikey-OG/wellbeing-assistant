import { Pinecone } from '@pinecone-database/pinecone'
import { CohereClient } from 'cohere-ai'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'


dotenv.config({ path: '.env.local' })

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
})

// Cohere client so it can generate embeddings
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY!,
})

// Split text into smaller chunks for more accurate retrieval
function chunkText(text: string, chunkSize: number = 500): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/)
  const chunks: string[] = []
  let currentChunk = ''

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = sentence
    } else {
      currentChunk += ' ' + sentence
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

async function uploadPDF(filePath: string, category: string) {
  console.log(`Processing: ${filePath}`)

  // This is to reading and parsing the PDF
  const fileBuffer = fs.readFileSync(filePath)
  const uint8Array = new Uint8Array(fileBuffer)
  const pdfDoc = await getDocument({ data: uint8Array }).promise
  let text = ''

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')
    text += pageText + ' '
  }

  // This to split into chunks
  const chunks = chunkText(text)
  console.log(`Found ${chunks.length} chunks in ${category}`)

  const index = pinecone.index(process.env.PINECONE_INDEX_NAME!)

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    if (chunk.length < 50) continue

    
    const response = await cohere.embed({
      texts: [chunk],
      model: 'embed-english-v3.0',
      inputType: 'search_document',
    })

    const vector = (response.embeddings as number[][])[0]

    // Upload to Pinecone
    await index.upsert([
      {
        id: `${category.toLowerCase().replace(' ', '-')}-${i}`,
        values: vector,
        metadata: {
          category,
          text: chunk,
          source: path.basename(filePath),
        },
      },
    ])

    console.log(`Uploaded chunk ${i + 1}/${chunks.length} for ${category}`)

    // Added a small delay to avoid hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 200))
  }
}

async function main() {
  console.log('Starting document upload to Pinecone...')

  await uploadPDF(
    path.join(process.cwd(), 'src/documents/wellbeing-guide.pdf'),
    'General Wellbeing'
  )

  await uploadPDF(
    path.join(process.cwd(), 'src/documents/motivation-guide.pdf'),
    'Motivation'
  )

  console.log('All documents uploaded successfully.')
}

main().catch(console.error)