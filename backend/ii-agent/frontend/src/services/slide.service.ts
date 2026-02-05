import axiosInstance from '@/lib/axios'
import { ACCESS_TOKEN } from '@/constants/auth'

export interface SlideTemplate {
    id: string
    slide_template_name: string
    slide_template_images?: string[]
}

export interface SlideTemplatesResponse {
    templates: SlideTemplate[]
    total: number
    page: number
    page_size: number
    total_pages: number
}

export interface SlideDownloadProgress {
    type: 'progress' | 'complete' | 'error'
    current?: number
    total?: number
    message?: string
    percent?: number
    pdf_base64?: string
    filename?: string
    total_pages?: number
}

class SlideService {
    private baseURL: string

    constructor() {
        this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    }
    async getSlideTemplates(
        page: number = 1,
        pageSize: number = 20,
        search?: string
    ): Promise<SlideTemplatesResponse> {
        const params = new URLSearchParams({
            page: page.toString(),
            page_size: pageSize.toString()
        })

        if (search) {
            params.append('search', search)
        }

        const response = await axiosInstance.get<SlideTemplatesResponse>(
            `/slide-templates?${params.toString()}`
        )
        return response.data
    }

    async getSlideTemplate(templateId: string): Promise<SlideTemplate> {
        const response = await axiosInstance.get<SlideTemplate>(
            `/slide-templates/${templateId}`
        )
        return response.data
    }

    /**
     * Download slides as PDF with real-time progress updates
     */
    async downloadSlidesWithProgress(
        sessionId: string,
        presentationName?: string,
        isPublic: boolean = false
    ): Promise<AsyncGenerator<SlideDownloadProgress, void, unknown>> {
        const endpoint = isPublic
            ? `/slides/public/download/stream?session_id=${sessionId}${presentationName ? `&presentation_name=${encodeURIComponent(presentationName)}` : ''}`
            : `/slides/download/stream?session_id=${sessionId}${presentationName ? `&presentation_name=${encodeURIComponent(presentationName)}` : ''}`

        const token = localStorage.getItem(ACCESS_TOKEN)

        // Use fetch with Authorization header for streaming (axios doesn't support streaming in browser)
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'text/event-stream',
            },
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        return this.parseSSEStream(response)
    }

    /**
     * Parse Server-Sent Events stream and yield progress updates
     */
    private async *parseSSEStream(response: Response): AsyncGenerator<SlideDownloadProgress, void, unknown> {
        const reader = response.body?.getReader()
        if (!reader) {
            throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let buffer = ''

        try {
            while (true) {
                const { done, value } = await reader.read()

                if (done) break

                buffer += decoder.decode(value, { stream: true })

                // Process complete SSE messages
                const lines = buffer.split('\n\n')
                buffer = lines.pop() || '' // Keep incomplete message in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data: SlideDownloadProgress = JSON.parse(line.slice(6))
                        yield data

                        // If this is a completion or error, we're done
                        if (data.type === 'complete' || data.type === 'error') {
                            return
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock()
        }
    }

    /**
     * Create a download link and trigger file download
     */
    downloadPDFFile(base64Data: string, filename: string): void {
        // Convert base64 to blob
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: 'application/pdf' })

        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
    }
}

export const slideService = new SlideService()