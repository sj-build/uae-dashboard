/**
 * Telegram Message Handler
 *
 * Uses direct Anthropic API call (avoids HTTP self-call timeout on Vercel)
 */

import { sendMessage, sendTypingAction } from './client'
import {
  getOrCreateSession,
  updateSessionHistory,
  clearSessionHistory,
  setSessionLanguage,
  checkRateLimit,
  isChatAllowed,
} from './session'
import { getAnthropicClient } from '@/lib/anthropic'
import type { TelegramMessage, TelegramSession } from './types'

const TELEGRAM_SYSTEM_PROMPT = `You are the All About UAE AI assistant on Telegram.

RULES:
1. Answer in the SAME LANGUAGE as the user's question.
2. Keep answers concise (under 1500 characters). Telegram messages should be scannable.
3. Formatting: Use ONLY Telegram-safe HTML tags:
   - <b>bold text</b> for emphasis and section headers
   - <i>italic text</i> for supplementary info
   - <code>code</code> for numbers, percentages, or technical terms
   - Line breaks for structure
   - "•" bullets for lists
   - Numbers (1. 2. 3.) for ordered steps
4. NEVER use these HTML tags: <div>, <h1>-<h6>, <table>, <tr>, <td>, <p>, <span>, <ul>, <ol>, <li>, <strong>, <em>, <br>, <a>
5. Use relevant emojis to make the message visually engaging (💡📌🔎✅📊🏢💰🌍🇦🇪 etc.)
6. Structure every answer as:

💡 <b>TL;DR</b>
One sentence summary.

📌 <b>Key Points</b>
• Point 1
• Point 2
• Point 3

🔎 <b>Details</b>
Brief explanation with data/facts.

7. If data has a date, note "as of YYYY" next to it.
8. End with a relevant follow-up suggestion if helpful.`

// Commands
const COMMANDS = {
  START: '/start',
  HELP: '/help',
  CLEAR: '/clear',
  LANG_KO: '/ko',
  LANG_EN: '/en',
} as const

// Response templates
const RESPONSES = {
  ko: {
    welcome: `안녕하세요! UAE 101 봇입니다. 🇦🇪

UAE에 대해 무엇이든 물어보세요!

<b>명령어:</b>
/clear - 대화 초기화
/ko - 한국어 응답
/en - English response
/help - 도움말

<i>예: "UAE 법인세율은?", "두바이와 아부다비 차이점"</i>`,
    help: `<b>UAE 101 봇 사용법</b>

질문을 입력하면 UAE 관련 정보를 답변해드립니다.

<b>가능한 질문:</b>
• 경제: 법인세, 은행, 국부펀드
• 사회: 문화, 종교, 비즈니스 에티켓
• 법률: 비자, 회사 설립, 규제
• 정치: 정부 구조, 외교 관계

<b>명령어:</b>
/clear - 대화 기록 삭제
/ko - 한국어로 답변
/en - 영어로 답변`,
    cleared: '대화 기록이 초기화되었습니다. 새로운 질문을 해주세요!',
    langSet: '언어가 한국어로 설정되었습니다.',
    rateLimit: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    notAllowed: '죄송합니다. 이 봇을 사용할 권한이 없습니다.',
    error: '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    thinking: '🤔 답변을 생성하고 있습니다...',
  },
  en: {
    welcome: `Hello! I'm UAE 101 Bot. 🇦🇪

Ask me anything about the UAE!

<b>Commands:</b>
/clear - Reset conversation
/ko - Korean response
/en - English response
/help - Help

<i>Examples: "What's the corporate tax rate?", "Difference between Dubai and Abu Dhabi"</i>`,
    help: `<b>UAE 101 Bot Help</b>

Ask any question about UAE and I'll provide information.

<b>Topics:</b>
• Economy: Tax, banking, sovereign wealth
• Society: Culture, religion, business etiquette
• Legal: Visas, company setup, regulations
• Politics: Government, foreign relations

<b>Commands:</b>
/clear - Clear conversation history
/ko - Respond in Korean
/en - Respond in English`,
    cleared: 'Conversation cleared. Feel free to ask a new question!',
    langSet: 'Language set to English.',
    rateLimit: 'Too many requests. Please try again later.',
    notAllowed: 'Sorry, you are not authorized to use this bot.',
    error: 'Sorry, an error occurred. Please try again later.',
    thinking: '🤔 Generating response...',
  },
}

function getResponses(session: TelegramSession): (typeof RESPONSES)['ko'] {
  if (session.language === 'en') return RESPONSES.en
  if (session.language === 'ko') return RESPONSES.ko
  // Auto: default to Korean
  return RESPONSES.ko
}

/**
 * Call Anthropic API directly (avoids serverless self-call timeout)
 */
async function callAnthropicDirect(
  query: string,
  history: TelegramSession['message_history']
): Promise<string> {
  const client = getAnthropicClient()

  const claudeMessages = [
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: query },
  ]

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: TELEGRAM_SYSTEM_PROMPT,
    messages: claudeMessages,
  })

  const text = message.content.reduce<string>((acc, block) => {
    if (block.type === 'text') {
      return acc + block.text
    }
    return acc
  }, '')

  return stripHtmlForTelegram(text)
}

/**
 * Sanitize output to keep only Telegram-safe HTML tags
 */
function stripHtmlForTelegram(text: string): string {
  return text
    // Convert headers to bold
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '<b>$1</b>\n')
    // Convert <strong>/<em> to Telegram equivalents
    .replace(/<strong>(.*?)<\/strong>/gi, '<b>$1</b>')
    .replace(/<em>(.*?)<\/em>/gi, '<i>$1</i>')
    // Convert list items to bullets
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
    // Convert <br> to newline
    .replace(/<br\s*\/?>/gi, '\n')
    // Convert <p> to double newline
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    // Remove <a> tags but keep text
    .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')
    // Remove list wrappers, divs, tables, spans, etc.
    .replace(/<\/?(ul|ol|div|table|tr|td|th|thead|tbody|span|section|article|header|footer|nav|main)[^>]*>/gi, '')
    // Preserve Telegram-safe tags: <b>, <i>, <code>, <pre>, <u>, <s>
    // Remove any remaining unsupported HTML tags
    .replace(/<(?!\/?(?:b|i|code|pre|u|s)(?:\s|>))[^>]+>/g, '')
    // Clean up excessive whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    // Telegram message limit
    .slice(0, 4000)
}

/**
 * Handle incoming message
 */
export async function handleMessage(message: TelegramMessage): Promise<void> {
  const chatId = String(message.chat.id)
  const text = message.text?.trim()
  const userName = message.from?.username || message.from?.first_name

  // Check if chat is allowed
  if (!isChatAllowed(chatId)) {
    await sendMessage(chatId, RESPONSES.ko.notAllowed)
    return
  }

  // Get or create session
  const session = await getOrCreateSession(chatId, userName)
  const responses = getResponses(session)

  // Handle empty message
  if (!text) {
    return
  }

  // Handle commands
  if (text.startsWith('/')) {
    await handleCommand(chatId, text, session)
    return
  }

  // Check rate limit
  const { allowed, remaining } = await checkRateLimit(chatId)
  if (!allowed) {
    await sendMessage(chatId, responses.rateLimit)
    return
  }

  try {
    // Send typing indicator
    await sendTypingAction(chatId)

    // Save user message to history
    await updateSessionHistory(chatId, 'user', text)

    // Get updated session with history
    const updatedSession = await getOrCreateSession(chatId)

    // Call Anthropic directly
    const response = await callAnthropicDirect(text, updatedSession.message_history)

    // Save assistant response to history
    await updateSessionHistory(chatId, 'assistant', response)

    // Send response
    await sendMessage(chatId, response, {
      reply_to_message_id: message.message_id,
    })
  } catch (error) {
    console.error('Telegram handler error:', error)
    await sendMessage(chatId, responses.error)
  }
}

/**
 * Handle bot commands
 */
async function handleCommand(
  chatId: string,
  command: string,
  session: TelegramSession
): Promise<void> {
  const responses = getResponses(session)
  const cmd = command.split(' ')[0].toLowerCase()

  switch (cmd) {
    case COMMANDS.START:
      await sendMessage(chatId, responses.welcome)
      break

    case COMMANDS.HELP:
      await sendMessage(chatId, responses.help)
      break

    case COMMANDS.CLEAR:
      await clearSessionHistory(chatId)
      await sendMessage(chatId, responses.cleared)
      break

    case COMMANDS.LANG_KO:
      await setSessionLanguage(chatId, 'ko')
      await sendMessage(chatId, RESPONSES.ko.langSet)
      break

    case COMMANDS.LANG_EN:
      await setSessionLanguage(chatId, 'en')
      await sendMessage(chatId, RESPONSES.en.langSet)
      break

    default:
      // Unknown command - treat as question
      await handleMessage({
        ...({} as TelegramMessage),
        message_id: 0,
        chat: { id: parseInt(chatId, 10), type: 'private' },
        date: Date.now() / 1000,
        text: command,
      })
  }
}
