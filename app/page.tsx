'use client'
import { useState, useRef, useEffect } from 'react'
import { marked } from 'marked'

// 配置 marked 选项
marked.setOptions({
  breaks: true,  // 支持 GitHub 风格的换行符
  gfm: true      // 启用 GitHub 风格的 Markdown
});

// 明确定义 Message 类型
interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 添加一个 useEffect 来持续监听焦点
  useEffect(() => {
    // 组件加载时聚焦
    inputRef.current?.focus()

    // 创建一个定时器，每隔一小段时间检查并恢复焦点
    const focusInterval = setInterval(() => {
      if (document.activeElement !== inputRef.current) {
        inputRef.current?.focus()
      }
    }, 100)

    // 清理函数
    return () => clearInterval(focusInterval)
  }, [])

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return

    try {
      setIsLoading(true)
      // 确保新消息符合 Message 类型
      const newMessages: Message[] = [...messages, { role: 'user' as const, content: input.trim() }]
      setMessages(newMessages)
      setInput('')

      // 确保输入框保持焦点
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!response.ok) {
        throw new Error('API request failed')
      }

      const aiMessage: Message = await response.json()
      // 确保 AI 响应也符合 Message 类型
      setMessages([...newMessages, { ...aiMessage, role: 'assistant' as const }])
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => [...prev, {
        role: 'assistant' as const,
        content: '抱歉，我遇到了一些问题。请稍后再试。'
      }])
    } finally {
      setIsLoading(false)
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-screen bg-[#343541]">
      {/* 顶部导航栏 */}
      <nav className="border-b border-gray-700 bg-[#202123] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <span className="text-pink-400 text-2xl">🍒</span>
            <h1 className="text-xl font-bold text-white">Smart Cherry</h1>
          </div>
        </div>
      </nav>

      {/* 聊天内容区域 - 添加固定高度和滚动条样式 */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {messages.length === 0 ? (
            // 欢迎消息
            <div className="p-8 text-center">
              <h1 className="text-3xl font-bold text-pink-400 mb-6">
                你好呀！我是 Cherry~
              </h1>
              <div className="space-y-4 text-gray-200">
                <p className="text-lg">✨ 有什么我可以帮你的吗？</p>
              </div>
            </div>
          ) : (
            // 消息列表
            <div className="p-4 space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 ${message.role === 'user'
                      ? 'bg-pink-500 text-white'
                      : 'bg-[#40414f] text-gray-200'
                      }`}
                  >
                    {message.role === 'user' ? (
                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    ) : (
                      <div
                        className="markdown prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: marked(message.content, { breaks: true })
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
              {/* 思考中的动画 */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#40414f] rounded-lg px-4 py-3 text-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="text-pink-400">Cherry 正在思考</div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* 添加一个空的div作为滚动目标 */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* 底部输入区域 */}
      <div className="border-t border-gray-700 p-4 bg-[#343541]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              autoFocus
              onFocus={(e) => {
                // 确保光标在文本末尾
                const length = e.currentTarget.value.length
                e.currentTarget.setSelectionRange(length, length)
              }}
              className="w-full rounded-2xl
                bg-[#40414f] 
                border border-gray-700/50
                focus:outline-none focus:border-pink-400/50 focus:ring-2 focus:ring-pink-400/20
                resize-none text-white placeholder-gray-400
                transition-all duration-300
                overflow-hidden
                block"
              style={{
                height: '44px',
                fontSize: '14px',
                lineHeight: '44px',
                padding: '0 52px 0 16px',
                whiteSpace: 'nowrap',
                overflowY: 'hidden',
              }}
              placeholder="和 Cherry 说点什么吧... (按回车发送)"
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="absolute right-2 p-2 rounded-xl
                bg-gradient-to-r from-pink-500 to-purple-500
                hover:from-pink-400 hover:to-purple-400
                transition-all duration-300 ease-in-out
                transform hover:scale-105 hover:rotate-1
                shadow-lg hover:shadow-pink-500/25
                group
                disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                width: '40px',
                height: '40px',
                top: '50%',
                transform: 'translateY(-50%)'
              }}
            >
              {isLoading ? (
                <div className="animate-spin text-white">⌛</div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white group-hover:rotate-45 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2 12l7-7 9 2-9 9-7-4zm7-7l4 14"
                    />
                  </svg>
                </div>
              )}
            </button>
          </div>
          <div className="mt-2 text-xs text-center text-gray-500">
            温馨提示：按回车键发送消息，Shift + 回车换行 🌸
          </div>
        </div>
      </div>
    </div>
  )
}
