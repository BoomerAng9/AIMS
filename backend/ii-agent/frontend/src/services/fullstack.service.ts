type PublishProjectParams = {
    vercelApiKey: string
    sendMessage: (payload: {
        type: string
        content: Record<string, unknown>
    }) => boolean
    projectName?: string
    projectPath?: string
    revision?: string
    envVars?: Array<{ name: string; value: string }>
}

class FullstackService {
    async publishProject({
        vercelApiKey,
        sendMessage,
        projectName,
        projectPath,
        revision,
        envVars
    }: PublishProjectParams): Promise<void> {
        const payload: Record<string, unknown> = {
            vercel_api_key: vercelApiKey
        }

        if (projectName) {
            payload.project_name = projectName
        }

        if (projectPath) {
            payload.project_path = projectPath
        }

        if (revision) {
            payload.revision = revision
        }

        if (Array.isArray(envVars) && envVars.length > 0) {
            payload.env_vars = envVars
        }

        const success = sendMessage({
            type: 'publish',
            content: payload
        })

        if (!success) {
            throw new Error('Socket.IO connection is not open. Please try again.')
        }
    }
}

export const fullstackService = new FullstackService()
