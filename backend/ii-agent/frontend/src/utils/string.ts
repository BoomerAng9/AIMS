// utils/parseFirstJSON.ts

export type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | JSONObject | JSONArray
export interface JSONObject {
    [key: string]: JSONValue
}
export type JSONArray = JSONValue[]

/**
 * Parses the first complete JSON object or array from a possibly incomplete stream string.
 * Returns `null` if the JSON is incomplete or invalid.
 */
export function parseJSON(input: string) {
    const str = input.trim()
    if (!str) return null

    let depth = 0
    let inString = false
    let escape = false

    const startChar = str[0]
    if (startChar !== '{' && startChar !== '[') return null

    for (let i = 0; i < str.length; i++) {
        const ch = str[i]

        if (inString) {
            if (escape) {
                escape = false
            } else if (ch === '\\') {
                escape = true
            } else if (ch === '"') {
                inString = false
            }
        } else {
            if (ch === '"') {
                inString = true
            } else if (ch === '{' || ch === '[') {
                depth++
            } else if (ch === '}' || ch === ']') {
                depth--
            }

            // ✅ found complete JSON structure
            if (depth === 0) {
                const jsonStr = str.slice(0, i + 1)
                try {
                    return JSON.parse(jsonStr)
                } catch {
                    return null // incomplete or invalid JSON
                }
            }
        }
    }

    // ❌ still incomplete JSON
    return null
}
