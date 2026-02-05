'use client'

import { ActionStep, TAB } from '@/typings/agent'
import { DiffEditor, Editor, Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from './ui/icon'
import { useTheme } from 'next-themes'

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

const parseUnifiedDiff = (
    diffContent: string
): { original: string; modified: string } | null => {
    if (!diffContent?.trim()) return null

    const normalized = diffContent.replace(/\r\n/g, '\n')
    const hasHunkHeader = /^@@/m.test(normalized)

    if (!hasHunkHeader) return null

    const originalLines: string[] = []
    const modifiedLines: string[] = []
    let inHunk = false
    let hasChanges = false

    for (const line of normalized.split('\n')) {
        if (line.startsWith('diff ') || line.startsWith('index ')) {
            continue
        }

        if (line.startsWith('--- ') || line.startsWith('+++ ')) {
            continue
        }

        if (line.startsWith('@@')) {
            if (originalLines.length > 0) {
                originalLines.push('')
                modifiedLines.push('')
            }
            inHunk = true
            continue
        }

        if (!inHunk) continue

        if (line.startsWith('+')) {
            modifiedLines.push(line.slice(1))
            originalLines.push('')
            hasChanges = true
            continue
        }

        if (line.startsWith('-')) {
            originalLines.push(line.slice(1))
            modifiedLines.push('')
            hasChanges = true
            continue
        }

        if (line.startsWith(' ')) {
            const value = line.slice(1)
            originalLines.push(value)
            modifiedLines.push(value)
            continue
        }

        if (line === '\\ No newline at end of file') {
            continue
        }

        originalLines.push(line)
        modifiedLines.push(line)
    }

    if (!hasChanges) return null

    return {
        original: originalLines.join('\n'),
        modified: modifiedLines.join('\n')
    }
}

interface CodeEditorProps {
    className?: string
    currentActionData?: ActionStep
    activeFile?: string
    setActiveFile?: (file: string) => void
    filesContent?: { [filename: string]: string }
    isReplayMode?: boolean
    activeTab?: TAB
    showEditorOnly?: boolean
}

const CodeEditor = ({
    className,
    currentActionData,
    activeFile,
    filesContent,
    showEditorOnly
}: CodeEditorProps) => {
    const { theme } = useTheme()
    const [activeLanguage, setActiveLanguage] = useState<string>('plaintext')
    // const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    //     new Set()
    // )
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
    const monacoRef = useRef<Monaco | null>(null)
    const [fileContent, setFileContent] = useState<string>('')
    const scrollIntervalRef = useRef<number | null>(null)
    const parsedDiff = useMemo(
        () => (fileContent ? parseUnifiedDiff(fileContent) : null),
        [fileContent]
    )
    const isDiffView = Boolean(parsedDiff)
    const handleBeforeMount = (monaco: Monaco) => {
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: true
        })
        monacoRef.current = monaco
    }

    const getFileLanguage = (fileName: string): string => {
        const extension = fileName.split('.').pop()?.toLowerCase() || ''
        // Handle special case for files like "Dockerfile"
        if (fileName.toLowerCase() === 'dockerfile') {
            return languageMap['dockerfile']
        }
        return languageMap[extension] || 'plaintext'
    }

    // const toggleFolder = (folderPath: string) => {
    //     setExpandedFolders((prev) => {
    //         const next = new Set(prev)
    //         if (next.has(folderPath)) {
    //             next.delete(folderPath)
    //         } else {
    //             next.add(folderPath)
    //         }
    //         return next
    //     })
    // }

    const renderBreadcrumb = () => {
        if (!activeFile) return null

        const relativePath = activeFile
        const parts = relativePath.split('/').filter(Boolean)

        return (
            <div className="flex items-center gap-[10px] px-4 py-[10px] text-sm font-semibold dark:text-white border-b border-grey-2/30 dark:border-white/30">
                {parts.map((part, index) => (
                    <div
                        key={part}
                        className="flex items-center gap-x-2 opacity-30"
                    >
                        {index > 0 && (
                            <Icon
                                name="arrow-down"
                                className="size-[18px] -rotate-90  fill-black dark:fill-white"
                            />
                        )}
                        <span className="dark:text-white">{part}</span>
                    </div>
                ))}
            </div>
        )
    }

    useEffect(() => {
        ;(async () => {
            if (activeFile) {
                const filePath = activeFile
                const content = filesContent?.[filePath] || ''
                setActiveLanguage(getFileLanguage(filePath))
                setFileContent(content)
                if (content) return

                // setActiveLanguage(getFileLanguage(filePath))
                // content = await loadFileContent(filePath)
                // setFileContent(content)
            }
        })()
    }, [activeFile, filesContent, currentActionData])

    // Auto-scroll effect for showEditorOnly mode
    useEffect(() => {
        if (isDiffView) {
            editorRef.current = null
        }
    }, [isDiffView])

    useEffect(() => {
        if (isDiffView) return

        if (showEditorOnly && editorRef.current && fileContent) {
            const editor = editorRef.current
            const totalLines = editor.getModel()?.getLineCount() || 0

            if (totalLines <= 10) return // Don't scroll if content is too short

            let scrollPosition = 0
            const maxScrollTop =
                editor.getScrollHeight() - editor.getLayoutInfo().height
            const scrollSpeed = 3 // pixels per frame (adjust for speed)

            const startScrolling = () => {
                const scroll = () => {
                    if (!editorRef.current) return

                    scrollPosition += scrollSpeed

                    if (scrollPosition >= maxScrollTop) {
                        // Stop scrolling when reaching the bottom
                        editor.setScrollTop(maxScrollTop)
                        if (scrollIntervalRef.current) {
                            cancelAnimationFrame(scrollIntervalRef.current)
                            scrollIntervalRef.current = null
                        }
                        return
                    }

                    editor.setScrollTop(scrollPosition)
                    scrollIntervalRef.current = requestAnimationFrame(scroll)
                }

                scrollIntervalRef.current = requestAnimationFrame(scroll)
            }

            // Start scrolling after a short delay
            const timeoutId = setTimeout(startScrolling, 500)

            return () => {
                clearTimeout(timeoutId)
                if (scrollIntervalRef.current) {
                    cancelAnimationFrame(scrollIntervalRef.current)
                    scrollIntervalRef.current = null
                }
            }
        }
    }, [showEditorOnly, fileContent, editorRef.current, isDiffView])

    // Cleanup scroll animation on unmount
    useEffect(() => {
        return () => {
            if (scrollIntervalRef.current) {
                cancelAnimationFrame(scrollIntervalRef.current)
            }
        }
    }, [])

    // const renderFileTree = (items: FileStructure[]) => {
    //     // Sort items: folders first, then files, both in alphabetical order
    //     const sortedItems = [...items].sort((a, b) => {
    //         if (a.type === b.type) {
    //             // If both are folders or both are files, sort alphabetically
    //             return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    //         }
    //         // Folders come before files
    //         return a.type === 'folder' ? -1 : 1
    //     })

    //     return sortedItems.map((item) => {
    //         const fullPath = item.path

    //         if (item.type === 'folder') {
    //             const isExpanded = expandedFolders.has(fullPath)
    //             return (
    //                 <div key={fullPath}>
    //                     <button
    //                         className="flex items-center gap-2 w-full px-2 py-1 text-left text-sm font-semibold dark:text-white cursor-pointer opacity-30"
    //                         onClick={() => toggleFolder(fullPath)}
    //                     >
    //                         {isExpanded ? (
    //                             <Icon
    //                                 name="arrow-down"
    //                                 className="size-5 fill-black dark:fill-white"
    //                             />
    //                         ) : (
    //                             <Icon
    //                                 name="arrow-down"
    //                                 className="size-5 fill-black dark:fill-white -rotate-90"
    //                             />
    //                         )}
    //                         {item.name}
    //                     </button>
    //                     {isExpanded && item.children && (
    //                         <div className="pl-4">
    //                             {renderFileTree(item.children)}
    //                         </div>
    //                     )}
    //                 </div>
    //             )
    //         }

    //         return (
    //             <button
    //                 key={fullPath}
    //                 className={`relative flex items-center gap-2 w-full px-2 py-1 text-left text-sm dark:text-white font-semibold cursor-pointer ${
    //                     activeFile === fullPath
    //                         ? 'before:absolute before:-left-[100px] before:top-0 before:-bottom-0 before:block before:bg-grey-2/30 before:dark:bg-sky-blue/30 before:w-[500px]'
    //                         : 'opacity-30'
    //                 }`}
    //                 onClick={() => {
    //                     setActiveFile?.(fullPath)
    //                 }}
    //             >
    //                 <Icon
    //                     name="document-text"
    //                     className="size-5 fill-black dark:fill-white"
    //                 />
    //                 {item.name}
    //             </button>
    //         )
    //     })
    // }

    return (
        <div
            className={`flex flex-col h-[calc(100vh-114px)] overflow-hidden ${className}`}
        >
            <div className="flex flex-1 h-full">
                {!showEditorOnly && (
                    <div className="w-64 bg-white dark:bg-charcoal border-r border-grey-2/30 dark:border-white/30 flex flex-col">
                        <div className="px-6 py-[10px] text-sm dark:text-white border-b border-grey-2/30 dark:border-white/30 flex items-center gap-x-2">
                            <Icon
                                name="folder-open"
                                className="size-5 fill-black dark:fill-white"
                            />
                            <span className="font-semibold">File</span>
                        </div>
                        {/* <div className="overflow-y-auto flex-1 p-4">
                            {renderFileTree(fileStructure)}
                        </div> */}
                    </div>
                )}

                <div className="flex-1 flex flex-col overflow-y-auto">
                    {!showEditorOnly && renderBreadcrumb()}
                    {isDiffView && parsedDiff ? (
                        <DiffEditor
                            theme={theme === 'dark' ? 'vs-dark' : 'light'}
                            language={activeLanguage}
                            height="100%"
                            original={parsedDiff.original}
                            modified={parsedDiff.modified}
                            options={{
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                readOnly: true,
                                renderGutterMenu: false,
                                renderIndicators: false,
                                renderOverviewRuler: false,
                                hideCursorInOverviewRuler: true,
                                lineNumbers: 'on',
                                scrollbar: {
                                    vertical: showEditorOnly ? 'hidden' : 'auto',
                                    horizontal: showEditorOnly ? 'hidden' : 'auto'
                                }
                            }}
                            beforeMount={handleBeforeMount}
                        />
                    ) : (
                        <Editor
                            theme={theme === 'dark' ? 'vs-dark' : 'light'}
                            language={activeLanguage}
                            height="100%"
                            value={fileContent}
                            options={{
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                readOnly: false,
                                scrollbar: {
                                    vertical: showEditorOnly ? 'hidden' : 'auto',
                                    horizontal: showEditorOnly ? 'hidden' : 'auto'
                                }
                            }}
                            beforeMount={handleBeforeMount}
                            onMount={(editor) => {
                                editorRef.current = editor
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default CodeEditor
