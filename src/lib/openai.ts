import OpenAI from 'openai'

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? ''
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o'

export const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null
