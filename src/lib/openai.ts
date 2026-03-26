import OpenAI from 'openai'

const requiredVars = ['OPENAI_API_KEY'] as const
for (const v of requiredVars) {
  if (!process.env[v]) {
    throw new Error(`Missing required environment variable: ${v}`)
  }
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o'
