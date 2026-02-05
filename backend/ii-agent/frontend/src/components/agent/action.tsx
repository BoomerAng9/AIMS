'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import isEmpty from 'lodash/isEmpty'
import last from 'lodash/last'
import { FileText, SearchCheck, Sparkle } from 'lucide-react'

import { ActionStep, TOOL } from '@/typings/agent'
import { Icon } from '../ui/icon'
import { identifyFilesNeeded, identifySlidesNeeded } from '@/lib/utils'

interface ActionProps {
    workspaceInfo: string
    type: TOOL
    value: ActionStep['data']
    onClick: () => void
}

const Action = ({ workspaceInfo, type, value, onClick }: ActionProps) => {
    // Use a ref to track if this component has already been animated
    const hasAnimated = useRef(false)
    const [isExpanded, setIsExpanded] = useState(false)

    // Set hasAnimated to true after first render
    useEffect(() => {
        hasAnimated.current = true
    }, [])

    const step_icon = useMemo(() => {
        const className = 'size-[18px]'

        // Handle specific agent tools first
        if (type === TOOL.SUB_AGENT_RESEARCHER) {
            return (
                <Icon
                    name="search-status"
                    className={`${className} fill-current`}
                />
            )
        }

        if (type === TOOL.DESIGN_DOCUMENT_AGENT) {
            return <Icon name="note-2" className={`${className} fill-white`} />
        }

        // Handle other sub_agent tools
        if (type && type.toString().startsWith(TOOL.SUB_AGENT.toString())) {
            // Default sub agent icon
            return <Icon name="bot" className={className} />
        }

        switch (type) {
            case TOOL.CLAUDE_CODE:
                return <Icon name="claude" className={className} />
            case TOOL.CODEX_AGENT:
            case TOOL.CODEX_EXECUTE:
            case TOOL.CODEX_REVIEW:
            case TOOL.MCP_CODEX_EXECUTE:
            case TOOL.MCP_CODEX_REVIEW:
            case TOOL.CODEX_MCP_CODEX_EXECUTE:
            case TOOL.CODEX_MCP_CODEX_REVIEW:
                return <Icon name="codex" className={className} />
            case TOOL.WEB_SEARCH:
            case TOOL.WEB_BATCH_SEARCH:
                return <Icon name="search-2" className={className} />
            case TOOL.IMAGE_SEARCH:
                return <Icon name="image-search" className={className} />
            case TOOL.VISIT:
            case TOOL.VISIT_COMPRESS:
            case TOOL.BROWSER_USE:
                return <Icon name="browsing" className={className} />
            case TOOL.BASH:
            case TOOL.BASH_INIT:
            case TOOL.BASH_VIEW:
            case TOOL.BASH_STOP:
            case TOOL.BASH_KILL:
            case TOOL.BASH_LIST:
            case TOOL.BASH_WRITE_TO_PROCESS:
                return <Icon name="terminal" className={className} />
            case TOOL.READ:
                return <Icon name="read-file" className={className} />
            case TOOL.WRITE:
                return <Icon name="create-file" className={className} />
            case TOOL.EDIT:
                return <Icon name="edit-file" className={className} />
            case TOOL.STATIC_DEPLOY:
                return <Icon name="deploy" className={className} />
            case TOOL.REGISTER_DEPLOYMENT:
                return <Icon name="deploy" className={className} />
            case TOOL.SAVE_CHECKPOINT:
                return <Icon name="save-all" className={className} />
            case TOOL.PDF_TEXT_EXTRACT:
                return <FileText className={className} />
            case TOOL.AUDIO_TRANSCRIBE:
                return <Icon name="gen-audio" className={className} />
            case TOOL.GENERATE_AUDIO_RESPONSE:
                return <Icon name="gen-audio" className={className} />
            case TOOL.VIDEO_GENERATE:
            case TOOL.LONG_VIDEO_GENERATE:
            case TOOL.LONG_VIDEO_GENERATE_FROM_IMAGE:
                return <Icon name="gen-video" className={className} />
            case TOOL.IMAGE_GENERATE:
            case TOOL.READ_REMOTE_IMAGE:
                return <Icon name="gen-image" className={className} />
            case TOOL.DEEP_RESEARCH:
                return <Sparkle className={className} />
            case TOOL.PRESENTATION:
                return <Icon name="slide" className={className} />
            case TOOL.FULLSTACK_PROJECT_INIT:
                return <Icon name="init-project" className={className} />
            case TOOL.REVIEWER_AGENT:
                return <SearchCheck className={className} />

            case TOOL.BROWSER_CLICK:
            case TOOL.BROWSER_CLOSE:
            case TOOL.BROWSER_CONSOLE_MESSAGES:
            case TOOL.BROWSER_DRAG:
            case TOOL.BROWSER_EVALUATE:
            case TOOL.BROWSER_HANDLE_DIALOG:
            case TOOL.BROWSER_HOVER:
            case TOOL.BROWSER_NAVIGATE:
            case TOOL.BROWSER_NETWORK_REQUESTS:
            case TOOL.BROWSER_PRESS_KEY:
            case TOOL.BROWSER_SELECT_OPTION:
            case TOOL.BROWSER_SNAPSHOT:
            case TOOL.BROWSER_TAKE_SCREENSHOT:
            case TOOL.BROWSER_TYPE:
            case TOOL.BROWSER_WAIT_FOR:
            case TOOL.BROWSER_TAB_CLOSE:
            case TOOL.BROWSER_TAB_LIST:
            case TOOL.BROWSER_TAB_NEW:
            case TOOL.BROWSER_TAB_SELECT:
            case TOOL.BROWSER_MOUSE_CLICK_XY:
            case TOOL.BROWSER_MOUSE_DRAG_XY:
            case TOOL.BROWSER_MOUSE_MOVE_XY:
            case TOOL.BROWSER_NAVIGATION:
            case TOOL.BROWSER_WAIT:
            case TOOL.BROWSER_VIEW_INTERACTIVE_ELEMENTS:
            case TOOL.BROWSER_SCROLL_DOWN:
            case TOOL.BROWSER_SCROLL_UP:
            case TOOL.BROWSER_SWITCH_TAB:
            case TOOL.BROWSER_OPEN_NEW_TAB:
            case TOOL.BROWSER_GET_SELECT_OPTIONS:
            case TOOL.BROWSER_SELECT_DROPDOWN_OPTION:
            case TOOL.BROWSER_RESTART:
            case TOOL.BROWSER_ENTER_TEXT:
            case TOOL.BROWSER_ENTER_MULTI_TEXTS:
                return <Icon name="browsing" className={className} />

            case TOOL.LS:
                return <Icon name="list-files" className={className} />
            case TOOL.GLOB:
                return <Icon name="glob" className={className} />
            case TOOL.GREP:
                return <Icon name="grep" className={className} />
            case TOOL.MULTI_EDIT:
                return <Icon name="edit-file" className={className} />
            case TOOL.REGISTER_PORT:
                return <Icon name="register-port" className={className} />
            case TOOL.MCP_TOOL: {
                // Check if this is a codex MCP tool
                const toolName = (
                    value.tool_input?.name ||
                    value.tool_input?.tool_name ||
                    value.tool_name ||
                    ''
                ).toLowerCase()
                if (
                    toolName.includes('codex_execute') ||
                    toolName.includes('codex_review') ||
                    toolName.includes('codex')
                ) {
                    return <Icon name="code" className={className} />
                }
                return <Icon name="mcp-tool" className={className} />
            }

            case TOOL.SLIDE_WRITE:
            case TOOL.SLIDE_EDIT:
            case TOOL.SLIDE_APPLY_PATCH:
                return <Icon name="slide" className={className} />
            case TOOL.APPLY_PATCH:
                return <Icon name="edit-file" className={className} />
            case TOOL.STR_REPLACE_BASED_EDIT:
                return <Icon name="edit-file" className={className} />

            default:
                return <></>
        }
    }, [type])

    const step_title = useMemo(() => {
        // Handle specific agent tools first
        if (type === TOOL.SUB_AGENT_RESEARCHER) {
            return 'Deep Researching'
        }
        if (type === TOOL.DESIGN_DOCUMENT_AGENT) {
            return 'Creating Design Document'
        }
        if (type === TOOL.CODEX_AGENT) {
            return 'Codex'
        }

        // Handle other sub_agent tools
        if (type && type.toString().startsWith(TOOL.SUB_AGENT.toString())) {
            return 'Delegating to ' + (value.tool_display_name || 'Sub Agent')
        }

        switch (type) {
            case TOOL.CLAUDE_CODE:
                return 'Claude Code'
            case TOOL.CODEX_EXECUTE:
                return 'Codex Executing'
            case TOOL.CODEX_REVIEW:
                return 'Codex Reviewing'
            case TOOL.MCP_CODEX_EXECUTE:
            case TOOL.CODEX_MCP_CODEX_EXECUTE:
                return 'Codex Executing'
            case TOOL.MCP_CODEX_REVIEW:
            case TOOL.CODEX_MCP_CODEX_REVIEW:
                return 'Codex Reviewing'
            case TOOL.SEQUENTIAL_THINKING:
            case TOOL.MESSAGE_USER:
                return 'Thinking'
            case TOOL.WEB_SEARCH:
            case TOOL.WEB_BATCH_SEARCH:
                return 'Searching'
            case TOOL.IMAGE_SEARCH:
                return 'Image Search'
            case TOOL.GET_DATABASE_CONNECTION:
                return 'Getting Database Connection'
            case TOOL.GET_OPENAI_KEY:
                return 'Getting OpenAI Key'
            case TOOL.VISIT:
            case TOOL.VISIT_COMPRESS:
            case TOOL.BROWSER_USE:
                return 'Browsing'
            case TOOL.BASH:
                return 'Bash'
            case TOOL.BASH_INIT:
                return 'Initializing Bash Session'
            case TOOL.BASH_VIEW:
                return 'Viewing Bash Session'
            case TOOL.BASH_STOP:
                return 'Stopping Bash Session'
            case TOOL.BASH_KILL:
                return 'Killing Bash Session'
            case TOOL.BASH_LIST:
                return 'Listing Bash Sessions'
            case TOOL.BASH_WRITE_TO_PROCESS:
                return 'Writing to Bash Process'

            case TOOL.SHELL_EXEC:
                return 'Executing Command'
            case TOOL.SHELL_WRITE_TO_PROCESS:
                return 'Writing to terminal'
            case TOOL.SHELL_KILL_PROCESS:
                return 'Killing Process'
            case TOOL.SHELL_VIEW:
                return 'Viewing Shell'
            case TOOL.SHELL_WAIT:
                return 'Waiting for Shell'
            case TOOL.READ:
                return 'Reading File'
            case TOOL.WRITE:
                return 'Creating File'
            case TOOL.EDIT:
                return 'Editing File'
            case TOOL.STATIC_DEPLOY:
                return 'Deploying'
            case TOOL.REGISTER_DEPLOYMENT:
                return 'Deployment'
            case TOOL.PDF_TEXT_EXTRACT:
                return 'Extracting Text'
            case TOOL.AUDIO_TRANSCRIBE:
                return 'Transcribing Audio'
            case TOOL.GENERATE_AUDIO_RESPONSE:
                return 'Generating Audio'
            case TOOL.VIDEO_GENERATE:
                return 'Generating Video'
            case TOOL.LONG_VIDEO_GENERATE:
                return 'Generating Long Video from Text'
            case TOOL.LONG_VIDEO_GENERATE_FROM_IMAGE:
                return 'Generating Long Video from Image'
            case TOOL.IMAGE_GENERATE:
                return 'Generating Image'
            case TOOL.READ_REMOTE_IMAGE:
                return 'Reading Remote Image'
            case TOOL.DEEP_RESEARCH:
                return 'Deep Researching'
            case TOOL.PRESENTATION:
                return 'Using presentation agent'
            case TOOL.FULLSTACK_PROJECT_INIT:
                return 'Starting up project'
            case TOOL.REVIEWER_AGENT:
                return 'Reviewer agent'
            case TOOL.BROWSER_CLICK:
                return 'Clicking Element'
            case TOOL.BROWSER_CLOSE:
                return 'Closing Browser'
            case TOOL.BROWSER_CONSOLE_MESSAGES:
                return 'Getting Console Messages'
            case TOOL.BROWSER_DRAG:
                return 'Dragging Element'
            case TOOL.BROWSER_EVALUATE:
                return 'Evaluating JavaScript'
            case TOOL.BROWSER_HANDLE_DIALOG:
                return 'Handling Dialog'
            case TOOL.BROWSER_HOVER:
                return 'Hovering Element'
            case TOOL.BROWSER_NAVIGATE:
                return 'Navigating to URL'
            case TOOL.BROWSER_NETWORK_REQUESTS:
                return 'Getting Network Requests'
            case TOOL.BROWSER_PRESS_KEY:
                return 'Pressing Key'
            case TOOL.BROWSER_SELECT_OPTION:
                return 'Selecting Option'
            case TOOL.BROWSER_SNAPSHOT:
                return 'Taking Snapshot'
            case TOOL.BROWSER_TAKE_SCREENSHOT:
                return 'Taking Screenshot'
            case TOOL.BROWSER_TYPE:
                return 'Typing Text'
            case TOOL.BROWSER_WAIT_FOR:
                return 'Waiting for Element'
            case TOOL.BROWSER_TAB_CLOSE:
                return 'Closing Tab'
            case TOOL.BROWSER_TAB_LIST:
                return 'Listing Tabs'
            case TOOL.BROWSER_TAB_NEW:
                return 'Opening New Tab'
            case TOOL.BROWSER_TAB_SELECT:
                return 'Selecting Tab'
            case TOOL.BROWSER_MOUSE_CLICK_XY:
                return 'Clicking at Coordinates'
            case TOOL.BROWSER_MOUSE_DRAG_XY:
                return 'Dragging at Coordinates'
            case TOOL.BROWSER_MOUSE_MOVE_XY:
                return 'Moving Mouse to Coordinates'
            case TOOL.BROWSER_NAVIGATION:
                return 'Browser Navigation'
            case TOOL.BROWSER_WAIT:
                return 'Waiting'
            case TOOL.BROWSER_VIEW_INTERACTIVE_ELEMENTS:
                return 'Viewing Interactive Elements'
            case TOOL.BROWSER_SCROLL_DOWN:
                return 'Scrolling Down'
            case TOOL.BROWSER_SCROLL_UP:
                return 'Scrolling Up'
            case TOOL.BROWSER_SWITCH_TAB:
                return 'Switching Tab'
            case TOOL.BROWSER_OPEN_NEW_TAB:
                return 'Opening New Tab'
            case TOOL.BROWSER_GET_SELECT_OPTIONS:
                return 'Getting Select Options'
            case TOOL.BROWSER_SELECT_DROPDOWN_OPTION:
                return 'Selecting Dropdown Option'
            case TOOL.BROWSER_RESTART:
                return 'Restarting Browser'
            case TOOL.BROWSER_ENTER_TEXT:
                return 'Entering Text'
            case TOOL.BROWSER_ENTER_MULTI_TEXTS:
                return 'Entering Multiple Texts'
            case TOOL.LS:
                return 'Listing Files'
            case TOOL.GLOB:
                return 'File Pattern Search'
            case TOOL.GREP:
                return 'Text Search'
            case TOOL.MULTI_EDIT:
                return 'Editing File'
            case TOOL.REGISTER_PORT:
                return 'Registering Port'
            case TOOL.MCP_TOOL: {
                // First check if there's a display name provided
                if (value.tool_display_name) {
                    return value.tool_display_name
                }
                // Otherwise check if this is a codex MCP tool
                const mcpToolName = (
                    value.tool_input?.name ||
                    value.tool_input?.tool_name ||
                    value.tool_name ||
                    ''
                ).toLowerCase()
                if (mcpToolName.includes('codex_execute')) {
                    return 'Codex Executing'
                } else if (mcpToolName.includes('codex_review')) {
                    return 'Codex Reviewing'
                } else if (mcpToolName.includes('codex')) {
                    return 'Codex'
                }
                return 'MCP Tool'
            }
            case TOOL.TASK:
                return 'Agent Task'
            case TOOL.SLIDE_WRITE:
                return 'Creating Slide'
            case TOOL.SLIDE_EDIT:
                return 'Editing Slide'
            case TOOL.APPLY_PATCH:
                return 'Editing'
            case TOOL.SLIDE_APPLY_PATCH:
                return 'Editing Slides'
            case TOOL.STR_REPLACE_BASED_EDIT: {
                const command = value.tool_input?.command || ''

                if (command.startsWith('view')) {
                    return 'Viewing File'
                } else if (command.startsWith('create')) {
                    return 'Creating File'
                } else if (command.startsWith('str_replace')) {
                    return 'Editing File'
                } else if (command.startsWith('insert')) {
                    return 'Editing File'
                } else if (command.startsWith('undo_edit')) {
                    return 'Undoing Edit'
                }

                return 'File Editor'
            }
            case TOOL.SAVE_CHECKPOINT:
                return 'Saving checkpoint'
            default:
                return type
        }
    }, [type, value?.tool_input?.command])

    const step_value = useMemo(() => {
        // Handle specific agent tools first
        if (type === TOOL.SUB_AGENT_RESEARCHER) {
            return value.tool_input?.instruction || value.tool_input?.query
        }
        if (type === TOOL.DESIGN_DOCUMENT_AGENT) {
            return value.tool_input?.prompt || value.tool_input?.instruction
        }

        // Handle other sub_agent tools
        if (type && type.toString().startsWith(TOOL.SUB_AGENT.toString())) {
            return value.tool_input?.instruction || value.tool_input?.prompt
        }

        // Handle Codex tools specifically
        if (
            type === TOOL.CODEX_AGENT ||
            type === TOOL.CODEX_EXECUTE ||
            type === TOOL.CODEX_REVIEW ||
            type === TOOL.MCP_CODEX_EXECUTE ||
            type === TOOL.CODEX_MCP_CODEX_EXECUTE ||
            type === TOOL.MCP_CODEX_REVIEW ||
            type === TOOL.CODEX_MCP_CODEX_REVIEW
        ) {
            return (
                value.tool_input?.prompt ||
                value.tool_input?.instruction ||
                value.tool_input?.query ||
                'Codex Operation'
            )
        }

        switch (type) {
            case TOOL.SEQUENTIAL_THINKING:
            case TOOL.MESSAGE_USER:
                return value.tool_input?.thought
            case TOOL.GET_DATABASE_CONNECTION:
                return value.tool_input?.database_type
            case TOOL.WEB_SEARCH:
                return value.tool_input?.query
            case TOOL.WEB_BATCH_SEARCH:
                return value.tool_input?.queries?.join(', ')
            case TOOL.IMAGE_SEARCH:
                return value.tool_input?.query
            case TOOL.VISIT:
                return value.tool_input?.url
            case TOOL.VISIT_COMPRESS:
                return value.tool_input?.urls?.[0]
            case TOOL.BROWSER_USE:
                return value.tool_input?.url
            case TOOL.BASH:
                return value.tool_input?.command
            case TOOL.BASH_INIT:
                return value.tool_input?.session_name
            case TOOL.BASH_VIEW:
                return value.tool_input?.session_names?.join(', ')
            case TOOL.BASH_STOP:
                return value.tool_input?.session_name
            case TOOL.BASH_KILL:
                return value.tool_input?.session_name
            case TOOL.BASH_WRITE_TO_PROCESS:
                return value.tool_input?.input
            case TOOL.SHELL_WRITE_TO_PROCESS:
                return value.tool_input?.input
            case TOOL.SHELL_KILL_PROCESS:
                return value.tool_input?.session_id
            case TOOL.SHELL_VIEW:
                return value.tool_input?.session_id
            case TOOL.SHELL_WAIT:
                return value.tool_input?.seconds + ' seconds'
            case TOOL.READ:
            case TOOL.WRITE:
            case TOOL.EDIT:
                return last(value.tool_input?.file_path?.split('/'))
            case TOOL.LS:
                return last(value.tool_input?.path?.split('/'))
            case TOOL.STATIC_DEPLOY:
                return value.tool_input?.file_path === workspaceInfo
                    ? workspaceInfo
                    : value.tool_input?.file_path?.replace(workspaceInfo, '')
            case TOOL.PDF_TEXT_EXTRACT:
                return value.tool_input?.file_path === workspaceInfo
                    ? workspaceInfo
                    : value.tool_input?.file_path?.replace(workspaceInfo, '')
            case TOOL.AUDIO_TRANSCRIBE:
                return value.tool_input?.file_path === workspaceInfo
                    ? workspaceInfo
                    : value.tool_input?.file_path?.replace(workspaceInfo, '')
            case TOOL.GENERATE_AUDIO_RESPONSE:
                return value.tool_input?.output_filename === workspaceInfo
                    ? workspaceInfo
                    : value.tool_input?.output_filename?.replace(
                          workspaceInfo,
                          ''
                      )
            case TOOL.VIDEO_GENERATE:
            case TOOL.LONG_VIDEO_GENERATE:
            case TOOL.LONG_VIDEO_GENERATE_FROM_IMAGE:
                return value.tool_input?.output_path
            case TOOL.IMAGE_GENERATE:
                return value.tool_input?.output_path
            case TOOL.READ_REMOTE_IMAGE:
                return value.tool_input?.url
            case TOOL.DEEP_RESEARCH:
                return value.tool_input?.query
            case TOOL.PRESENTATION:
                return (
                    value.tool_input?.action +
                    ': ' +
                    value.tool_input?.description
                )
            case TOOL.FULLSTACK_PROJECT_INIT:
                return value.tool_input?.project_name
            case TOOL.REVIEWER_AGENT:
                return value.content

            case TOOL.BROWSER_CLICK:
                return value.tool_input?.element
            case TOOL.BROWSER_TAKE_SCREENSHOT:
                return value.tool_input?.filename
            case TOOL.BROWSER_CLOSE:
            case TOOL.BROWSER_CONSOLE_MESSAGES:
            case TOOL.BROWSER_DRAG:
                return `(${value.tool_input?.coordinate_x_start}, ${value.tool_input?.coordinate_y_start}) → (${value.tool_input?.coordinate_x_end}, ${value.tool_input?.coordinate_y_end})`
            case TOOL.BROWSER_EVALUATE:
            case TOOL.BROWSER_HANDLE_DIALOG:
            case TOOL.BROWSER_HOVER:
            case TOOL.BROWSER_NAVIGATE:
            case TOOL.BROWSER_NETWORK_REQUESTS:
            case TOOL.BROWSER_SELECT_OPTION:
            case TOOL.BROWSER_SNAPSHOT:
            case TOOL.BROWSER_WAIT_FOR:
            case TOOL.BROWSER_TAB_CLOSE:
            case TOOL.BROWSER_TAB_LIST:
            case TOOL.BROWSER_TAB_NEW:
            case TOOL.BROWSER_TAB_SELECT:
                return value.tool_input?.url
            case TOOL.BROWSER_PRESS_KEY:
                return value.tool_input?.key
            case TOOL.BROWSER_TYPE:
                return value.tool_input?.text
            case TOOL.BROWSER_MOUSE_CLICK_XY:
            case TOOL.BROWSER_MOUSE_DRAG_XY:
            case TOOL.BROWSER_MOUSE_MOVE_XY:
                return `${value.tool_input?.x}, ${value.tool_input?.y}`
            case TOOL.BROWSER_NAVIGATION:
                return value.tool_input?.url
            case TOOL.BROWSER_WAIT:
                return ``
            case TOOL.BROWSER_VIEW_INTERACTIVE_ELEMENTS:
                return 'View elements'
            case TOOL.BROWSER_SCROLL_DOWN:
            case TOOL.BROWSER_SCROLL_UP:
                return value.tool_input?.element || 'Page'
            case TOOL.BROWSER_SWITCH_TAB:
            case TOOL.BROWSER_OPEN_NEW_TAB:
                return value.tool_input?.url
            case TOOL.BROWSER_GET_SELECT_OPTIONS:
            case TOOL.BROWSER_SELECT_DROPDOWN_OPTION:
                return value.tool_input?.element
            case TOOL.BROWSER_RESTART:
                return 'Restart'
            case TOOL.BROWSER_ENTER_TEXT:
                return value.tool_input?.text
            case TOOL.BROWSER_ENTER_MULTI_TEXTS: {
                const enterTexts = value.tool_input?.enter_texts as Array<{
                    text: string
                }>
                return enterTexts ? `${enterTexts.length} fields` : ''
            }
            case TOOL.GLOB:
                return value.tool_input?.pattern
            case TOOL.GREP:
                return value.tool_input?.pattern
            case TOOL.MULTI_EDIT:
                return last(value.tool_input?.file_path?.split('/'))
            case TOOL.REGISTER_PORT:
                return value.tool_input?.port
            case TOOL.MCP_TOOL:
                // Return the actual input content (prompt/instruction) like other tools
                // This could be prompt, instruction, query, or other fields depending on the MCP tool
                return (
                    value.tool_input?.prompt ||
                    value.tool_input?.instruction ||
                    value.tool_input?.query ||
                    value.tool_input?.description ||
                    value.tool_input?.name ||
                    value.tool_input?.tool_name ||
                    value.tool_name ||
                    'MCP Tool'
                )
            case TOOL.TASK:
                return value.tool_input?.prompt || value.tool_input?.description
            case TOOL.SLIDE_WRITE:
            case TOOL.SLIDE_EDIT:
                return `Slide ${value.tool_input?.slide_number}`

            case TOOL.SLIDE_APPLY_PATCH:
                return identifySlidesNeeded(value.tool_input?.input || '')
                    ?.map((slide) => `Slide ${last(slide.split('/'))}`)
                    .join(', ')

            case TOOL.APPLY_PATCH: {
                if (!isEmpty(value.tool_input?.changes)) {
                    return Object.keys(value.tool_input?.changes)
                        .map((file) => last(file.split('/')))
                        .join(', ')
                }

                return identifyFilesNeeded(value.tool_input?.input || '')
                    ?.map((file) => last(file.split('/')))
                    .join(', ')
            }

            case TOOL.STR_REPLACE_BASED_EDIT: {
                const command = value.tool_input?.command || ''
                const filePath =
                    value.tool_input?.file_path || value.tool_input?.path

                return filePath ? last(filePath.split('/')) : command
            }

            case TOOL.CLAUDE_CODE:
                return value.tool_input?.prompt
            default:
                break
        }
    }, [type, value, workspaceInfo])

    if (
        !type ||
        type === TOOL.COMPLETE ||
        type === TOOL.LIST_HTML_LINKS ||
        type === TOOL.RETURN_CONTROL_TO_USER ||
        type === TOOL.SLIDE_DECK_INIT ||
        type === TOOL.SLIDE_DECK_COMPLETE ||
        type === TOOL.DISPLAY_IMAGE ||
        type === TOOL.TODO_READ ||
        type === TOOL.TODO_WRITE
    )
        return null

    const handleDetailClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsExpanded(!isExpanded)
    }

    const shouldShowExpandButton = step_value && String(step_value).length > 50

    return (
        <div
            onClick={onClick}
            className={`group cursor-pointer flex flex-col gap-2 px-3 py-2 bg-firefly dark:bg-[#000000]/50 rounded-xl backdrop-blur-sm
      shadow-sm
      transition-all duration-200 ease-out
      hover:bg-neutral-800
      hover:border-neutral-700
      active:scale-[0.98] overflow-hidden
      ${hasAnimated.current ? 'animate-none' : 'animate-fadeIn'}`}
        >
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm">
                    {step_icon}
                    <span className="text-white">{step_title}</span>
                </div>
                <div className="flex items-center gap-2 flex-1 justify-end">
                    {!isExpanded && (
                        <span
                            className={`text-white text-right font-semibold text-sm truncate ${shouldShowExpandButton ? 'max-w-[100px] md:max-w-[200px]' : 'break-all whitespace-break-spaces'}`}
                            title={
                                typeof step_value === 'string'
                                    ? step_value
                                    : String(step_value)
                            }
                        >
                            {step_value}
                        </span>
                    )}
                    {shouldShowExpandButton && (
                        <button
                            onClick={handleDetailClick}
                            className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
                        >
                            {isExpanded ? 'Less' : 'More'}
                        </button>
                    )}
                </div>
            </div>
            {isExpanded && step_value && (
                <div className="text-white text-sm break-all bg-black/20 rounded p-2 mt-1">
                    {step_value}
                </div>
            )}
        </div>
    )
}

export default Action
