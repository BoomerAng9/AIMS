import { DiffEditor, Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'

interface DiffCodeEditorProps {
    oldContent: string
    newContent: string
    showEditorOnly?: boolean
    activeFile?: string
    className?: string
}

// Map file extensions to Monaco editor language IDs
const languageMap: { [key: string]: string } = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    md: 'markdown',
    css: 'css',
    scss: 'scss',
    less: 'less',
    html: 'html',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    py: 'python',
    rb: 'ruby',
    php: 'php',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    swift: 'swift',
    kt: 'kotlin',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    dockerfile: 'dockerfile',
    vue: 'vue',
    svelte: 'svelte',
    graphql: 'graphql',
    env: 'plaintext'
}

const DiffCodeEditor = ({
    oldContent,
    newContent,
    showEditorOnly,
    activeFile,
    className
}: DiffCodeEditorProps) => {
    const { theme } = useTheme()
    const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null)
    const monacoRef = useRef<Monaco | null>(null)
    const [activeLanguage, setActiveLanguage] = useState<string>('plaintext')

    const getFileLanguage = (fileName: string): string => {
        const extension = fileName.split('.').pop()?.toLowerCase() || ''
        // Handle special case for files like "Dockerfile"
        if (fileName.toLowerCase() === 'dockerfile') {
            return languageMap['dockerfile']
        }
        return languageMap[extension] || 'plaintext'
    }

    useEffect(() => {
        ;(async () => {
            if (activeFile) {
                setActiveLanguage(getFileLanguage(activeFile))
            }
        })()
    }, [activeFile])

    return (
        <div
            className={`flex flex-col h-[calc(100vh-114px)] overflow-hidden ${className}`}
        >
            <div className="flex-1 flex flex-col overflow-y-auto">
                <DiffEditor
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    language={activeLanguage}
                    height="100%"
                    original={oldContent}
                    modified={newContent}
                    options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        readOnly: true,
                        scrollbar: {
                            vertical: showEditorOnly ? 'hidden' : 'auto',
                            horizontal: showEditorOnly ? 'hidden' : 'auto'
                        },
                        renderGutterMenu: false,
                        lineNumbers: 'on',
                        renderIndicators: false,
                        renderOverviewRuler: false,
                        hideCursorInOverviewRuler: true
                    }}
                    beforeMount={(monaco) => {
                        monacoRef.current = monaco
                    }}
                    onMount={(editor) => {
                        editorRef.current = editor
                    }}
                    keepCurrentOriginalModel={true}
                    keepCurrentModifiedModel={true}
                />
            </div>
        </div>
    )
}

export default DiffCodeEditor
