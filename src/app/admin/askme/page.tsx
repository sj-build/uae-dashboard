'use client'

import { useState, useCallback, useRef } from 'react'

const RESPONSE_FORMATS = [
  { id: 'html', label: 'HTML (Styled)', description: 'Rich formatting with headings, lists, tables' },
  { id: 'markdown', label: 'Markdown', description: 'Plain text with Markdown syntax' },
  { id: 'plain', label: 'Plain Text', description: 'No formatting, plain text only' },
] as const

type ResponseFormat = typeof RESPONSE_FORMATS[number]['id']

interface AiConfig {
  readonly model: string
  readonly maxTokens: number
  readonly responseFormat: ResponseFormat
}

const INITIAL_CONFIG: AiConfig = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  responseFormat: 'html',
}

const QUICK_TAGS = [
  'UAE 경제 구조',
  'Abu Dhabi vs Dubai',
  'Sheikh Tahnoun',
  'Mubadala',
  'ADIA',
  'G42',
  'MGX',
  'UAE 크립토 규제',
  'K-Beauty UAE 기회',
  '에너지 전환',
  '에미라티화',
  '골든비자',
  'Wasta 문화',
  '라마단 비즈니스',
  'SWF 투자 현황',
] as const

const SYSTEM_PROMPT_PREVIEW = `You are the All About UAE AI assistant. You answer questions about the United Arab Emirates using the comprehensive reference data below.

Your role: Provide accurate, detailed answers about UAE — its politics, economy, society, culture, industry, people, and institutions. Answer in the SAME LANGUAGE as the user's question (Korean if asked in Korean, English if asked in English).

REFERENCE DATA:
[Context data from build-search-context is injected here]

FORMAT: Use HTML formatting for rich responses:
- <h2> for main headings
- <h3> for section headings
- <b> for important names/numbers
- <ul><li> for key facts
- <blockquote> for strategic insights or notable quotes
- <table> for comparative data
- Use line breaks for readability

SECTIONS TO COVER (adapt based on the question type):
For People: profile, power connections, assets/AUM, strategic significance, approach paths
For Organizations: overview, leadership, AUM/revenue, key projects, connections
For Industries: market size, key players, growth drivers, opportunities
For Concepts: definition, UAE context, practical implications
For General Questions: direct answer with supporting data from the reference material

IMPORTANT RULES:
1. Base your answers on the reference data provided above
2. If the question is about something not covered in the data, say so honestly
3. Do not fabricate information — use only what is in the reference data or widely known public information
4. Provide specific numbers (AUM, revenue, market cap) whenever available
5. Connect information across domains (e.g., how a person connects to industries, SWFs, and political structure)
6. For Korean questions, respond entirely in Korean. For English questions, respond in English.`

interface TestResult {
  readonly success: boolean
  readonly html?: string
  readonly error?: string
  readonly latencyMs?: number
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '...'
}

function ConfigCard({
  title,
  children,
}: {
  readonly title: string
  readonly children: React.ReactNode
}) {
  return (
    <div className="bg-bg2 border border-brd rounded-xl p-5">
      <h2 className="text-sm font-semibold text-t2 mb-4">{title}</h2>
      {children}
    </div>
  )
}

export default function AskMeAISettingsPage() {
  const [config, setConfig] = useState<AiConfig>(INITIAL_CONFIG)
  const [tags, setTags] = useState<readonly string[]>(QUICK_TAGS)
  const [newTag, setNewTag] = useState('')
  const [showFullPrompt, setShowFullPrompt] = useState(false)
  const [testQuery, setTestQuery] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const handleMaxTokensChange = useCallback((value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 256 && num <= 8192) {
      setConfig((prev) => ({ ...prev, maxTokens: num }))
    }
  }, [])

  const handleFormatChange = useCallback((format: ResponseFormat) => {
    setConfig((prev) => ({ ...prev, responseFormat: format }))
  }, [])

  const handleAddTag = useCallback(() => {
    const trimmed = newTag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
      setNewTag('')
    }
  }, [newTag, tags])

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove))
  }, [])

  const handleTestQuery = useCallback(async () => {
    if (!testQuery.trim()) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setTestLoading(true)
    setTestResult(null)

    const startTime = Date.now()

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery }),
        signal: controller.signal,
      })

      const data = await response.json()
      const latencyMs = Date.now() - startTime

      setTestResult({
        success: data.success,
        html: data.html,
        error: data.error,
        latencyMs,
      })
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setTestResult({
          success: false,
          error: error.message,
          latencyMs: Date.now() - startTime,
        })
      }
    } finally {
      setTestLoading(false)
    }
  }, [testQuery])

  const handleSaveChanges = useCallback(() => {
    alert(
      `Configuration saved (demonstration only):\n\n` +
      `Model: ${config.model}\n` +
      `Max Tokens: ${config.maxTokens}\n` +
      `Response Format: ${config.responseFormat}\n` +
      `Quick Tags: ${tags.length} tags\n\n` +
      `Note: In production, this would persist to the database.`
    )
  }, [config, tags])

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-xl font-bold text-t1 tracking-wide">
          Ask Me AI Settings
        </h1>
        <p className="text-t3 text-sm mt-1">
          Configure the AI-powered search assistant settings
        </p>
      </div>

      <div className="space-y-6">
        {/* AI Configuration Section */}
        <ConfigCard title="AI Configuration">
          <div className="space-y-4">
            {/* Model Display */}
            <div>
              <label className="block text-xs font-medium text-t3 mb-1.5">
                Model
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={config.model}
                  readOnly
                  className="flex-1 px-3 py-2.5 bg-bg3 border border-brd rounded-lg text-sm text-t2 cursor-not-allowed"
                />
                <span className="px-2 py-1 bg-accent-purple/10 text-accent-purple text-[10px] font-semibold rounded">
                  READONLY
                </span>
              </div>
              <p className="text-[10px] text-t4 mt-1">
                Model is configured in the API route. Change requires code update.
              </p>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-xs font-medium text-t3 mb-1.5">
                Max Tokens
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={config.maxTokens}
                  onChange={(e) => handleMaxTokensChange(e.target.value)}
                  min={256}
                  max={8192}
                  step={256}
                  className="w-32 px-3 py-2.5 bg-bg3 border border-brd rounded-lg text-sm text-t1 focus:outline-none focus:border-gold/30 transition-colors"
                />
                <input
                  type="range"
                  value={config.maxTokens}
                  onChange={(e) => handleMaxTokensChange(e.target.value)}
                  min={256}
                  max={8192}
                  step={256}
                  className="flex-1 accent-gold"
                />
                <span className="text-xs text-t3 w-16 text-right">{config.maxTokens}</span>
              </div>
              <p className="text-[10px] text-t4 mt-1">
                Maximum response length. Current API uses 4096. Range: 256-8192.
              </p>
            </div>

            {/* Response Format */}
            <div>
              <label className="block text-xs font-medium text-t3 mb-2">
                Response Format
              </label>
              <div className="flex flex-wrap gap-2">
                {RESPONSE_FORMATS.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => handleFormatChange(format.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all duration-200 ${
                      config.responseFormat === format.id
                        ? 'bg-gold/15 text-gold border-gold/25'
                        : 'bg-bg3 text-t3 border-brd hover:border-brd2 hover:text-t2'
                    }`}
                  >
                    {format.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-t4 mt-2">
                {RESPONSE_FORMATS.find((f) => f.id === config.responseFormat)?.description}
              </p>
            </div>
          </div>
        </ConfigCard>

        {/* System Prompt Preview */}
        <ConfigCard title="System Prompt Preview">
          <div className="bg-bg3 border border-brd rounded-lg p-4">
            <pre className="text-xs text-t2 font-mono whitespace-pre-wrap leading-relaxed">
              {showFullPrompt
                ? SYSTEM_PROMPT_PREVIEW
                : truncateText(SYSTEM_PROMPT_PREVIEW, 500)}
            </pre>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => setShowFullPrompt(!showFullPrompt)}
              className="text-xs text-gold hover:text-gold3 font-medium transition-colors"
            >
              {showFullPrompt ? 'Show Less' : 'Show Full Prompt'}
            </button>
            <span className="text-[10px] text-t4">
              Source: /lib/search-prompt.ts
            </span>
          </div>
        </ConfigCard>

        {/* Quick Tags Editor */}
        <ConfigCard title="Quick Search Tags">
          <p className="text-xs text-t3 mb-3">
            These tags appear in the search modal for quick topic selection.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <div
                key={tag}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brd bg-bg3 text-t2 text-xs"
              >
                <span>{tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="text-t4 hover:text-accent-red transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove tag"
                >
                  x
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="Add new tag..."
              className="flex-1 px-3 py-2 bg-bg3 border border-brd rounded-lg text-sm text-t1 placeholder:text-t4 focus:outline-none focus:border-gold/30 transition-colors"
            />
            <button
              onClick={handleAddTag}
              disabled={!newTag.trim()}
              className="px-4 py-2 text-xs font-semibold bg-accent-green/10 text-accent-green border border-accent-green/20 rounded-lg hover:bg-accent-green/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              Add Tag
            </button>
          </div>
        </ConfigCard>

        {/* Test Section */}
        <ConfigCard title="Test AI Response">
          <p className="text-xs text-t3 mb-3">
            Test the AI search functionality with a sample query.
          </p>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTestQuery()}
              placeholder="Enter test query..."
              className="flex-1 px-3 py-2.5 bg-bg3 border border-brd rounded-lg text-sm text-t1 placeholder:text-t4 focus:outline-none focus:border-gold/30 transition-colors"
            />
            <button
              onClick={handleTestQuery}
              disabled={testLoading || !testQuery.trim()}
              className="px-5 py-2.5 text-xs font-semibold bg-accent-blue/10 text-accent-blue border border-accent-blue/20 rounded-lg hover:bg-accent-blue/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              {testLoading ? 'Testing...' : 'Test Query'}
            </button>
          </div>

          {/* Quick Test Buttons */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="text-[10px] text-t4 py-1">Quick tests:</span>
            {['Who is Sheikh Tahnoun?', 'Mubadala AUM', 'UAE economy overview'].map(
              (q) => (
                <button
                  key={q}
                  onClick={() => setTestQuery(q)}
                  className="px-2 py-1 rounded border border-brd bg-bg3 text-t3 text-[10px] hover:border-brd2 hover:text-gold transition-colors"
                >
                  {q}
                </button>
              )
            )}
          </div>

          {/* Test Results */}
          {testLoading && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              <span className="text-sm text-t3">Running test query...</span>
            </div>
          )}

          {testResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-1 text-[10px] font-semibold rounded ${
                    testResult.success
                      ? 'bg-accent-green/10 text-accent-green'
                      : 'bg-accent-red/10 text-accent-red'
                  }`}
                >
                  {testResult.success ? 'SUCCESS' : 'FAILED'}
                </span>
                {testResult.latencyMs && (
                  <span className="text-[10px] text-t4">
                    Response time: {testResult.latencyMs}ms
                  </span>
                )}
              </div>

              {testResult.error && (
                <div className="p-3 bg-accent-red/5 border border-accent-red/20 rounded-lg">
                  <p className="text-xs text-accent-red">{testResult.error}</p>
                </div>
              )}

              {testResult.html && (
                <div className="bg-bg3 border border-brd rounded-lg p-4 max-h-80 overflow-y-auto">
                  <div
                    className="text-xs text-t2 leading-relaxed [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-gold [&_h2]:mb-2 [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-gold3 [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:pl-4 [&_ul]:my-1 [&_li]:my-0.5 [&_b]:text-t1 [&_table]:w-full [&_table]:text-[10px] [&_table]:my-2 [&_th]:p-1 [&_th]:text-left [&_th]:bg-bg2 [&_td]:p-1 [&_td]:border-b [&_td]:border-brd/30"
                    dangerouslySetInnerHTML={{ __html: testResult.html }}
                  />
                </div>
              )}
            </div>
          )}
        </ConfigCard>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setConfig(INITIAL_CONFIG)
              setTags(QUICK_TAGS)
              setTestResult(null)
            }}
            className="px-5 py-2.5 text-xs font-semibold text-t3 bg-bg3 border border-brd rounded-lg hover:bg-bg4 hover:text-t2 transition-all duration-200"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSaveChanges}
            className="px-6 py-2.5 text-xs font-semibold bg-gold/15 text-gold border border-gold/25 rounded-lg hover:bg-gold/25 hover:border-gold/40 transition-all duration-200"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
