import { useEffect, useRef, useState } from 'react'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

interface VditorEditorProps {
  value: string
  onChange?: (markdown: string) => void
}

const REPLACE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  <path d="M8 8h6M8 11h6M8 14h4"/>
</svg>`

export default function VditorEditor({ value, onChange }: VditorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const vditorRef = useRef<Vditor | null>(null)
  const [initFailed, setInitFailed] = useState(false)
  const [showReplace, setShowReplace] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')

  useEffect(() => {
    if (!containerRef.current || vditorRef.current) return

    let vditor: Vditor | null = null

    try {
      vditor = new Vditor(containerRef.current, {
        mode: 'sv',
        height: '100%',
        placeholder: '在此编辑 Markdown 内容...',
        value,
        cache: { enable: false },
        preview: { markdown: { autoSpace: true } },
        toolbar: [
          'headings', 'bold', 'italic', 'strike', '|',
          'line', 'quote', 'list', 'ordered-list', 'check',
          'code', 'inline-code', '|',
          'upload', 'link', 'table', '|',
          'undo', 'redo', '|',
          {
            hotkey: '⌘-⇧-F',
            name: 'replace',
            tipPosition: 's',
            tip: '查找替换',
            className: 'right',
            icon: REPLACE_ICON,
            click: () => setShowReplace(true),
          },
          '|',
          'fullscreen', 'edit-mode', 'both', '|',
          'outline', 'preview',
        ],
        input: (val: string) => {
          onChange?.(val)
        },
      })
      vditorRef.current = vditor
      setInitFailed(false)
    } catch (e) {
      console.error('Vditor 初始化失败:', e)
      setInitFailed(true)
    }

    return () => {
      try { vditor?.destroy() } catch { /* 忽略 */ }
      vditorRef.current = null
    }
  }, [])

  const handleReplaceAll = () => {
    if (!findText || !vditorRef.current) return
    try {
      const current = vditorRef.current.getValue()
      const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escaped, 'g')
      const newContent = current.replace(regex, replaceText)
      vditorRef.current.setValue(newContent)
      onChange?.(newContent)
      setShowReplace(false)
      setFindText('')
      setReplaceText('')
    } catch { /* 忽略 */ }
  }

  if (initFailed) {
    return (
      <div className="flex h-full flex-col px-4">
        <p className="text-amber-600 text-sm py-2">
          ⚠️ Vditor 编辑器加载失败，已切换到普通编辑模式
        </p>
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="min-h-[calc(100vh-200px)] w-full flex-1 resize-y rounded-md border border-gray-300 p-4 font-mono text-sm"
          placeholder="在此编辑 Markdown 内容..."
          spellCheck={false}
        />
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} style={{ height: '100%', minHeight: '300px' }} />

      {showReplace && (
        <div className="fixed inset-0 z-[999] flex items-start justify-center pt-32"
             onClick={() => setShowReplace(false)}>
          <div className="w-[420px] rounded-lg border border-gray-200 bg-white shadow-2xl"
               onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-semibold text-gray-800">查找替换</span>
              <span className="cursor-pointer text-gray-400 hover:text-gray-600 text-lg leading-none"
                    onClick={() => setShowReplace(false)}>✕</span>
            </div>
            <div className="px-4 pt-4 pb-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">查找</label>
              <input
                type="text" value={findText}
                onChange={e => setFindText(e.target.value)}
                placeholder="输入查找内容..."
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                autoFocus
              />
            </div>
            <div className="px-4 pb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">替换为</label>
              <input
                type="text" value={replaceText}
                onChange={e => setReplaceText(e.target.value)}
                placeholder="输入替换内容..."
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div className="flex justify-end gap-2 border-t px-4 py-3">
              <button onClick={() => setShowReplace(false)}
                className="rounded border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={handleReplaceAll} disabled={!findText}
                className="rounded bg-blue-500 px-4 py-1.5 text-sm text-white hover:bg-blue-600 disabled:opacity-40">全部替换</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
