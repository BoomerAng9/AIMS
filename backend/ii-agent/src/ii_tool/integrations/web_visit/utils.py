PROMPT = """You are analyzing webpage content. Your task is to extract and process information based on the given instructions.

<webpage_content>
{content}
</webpage_content>

<user_request>
{prompt}
</user_request>

Instructions:
- Extract, organize, and process information from the webpage content based on the user's request
- Provide the response in clear, structured markdown (e.g., with headings, bullet points, tables, or code blocks where relevant)
- Deliver the response in a comprehensive and detailed manner by default
- The output must rely strictly on the webpage content. Do not fabricate, assume, or hallucinate information
- If requested information is not present in the webpage content, explicitly state it as "Not found"
- Do not include any commentary about the process itself—only provide the final result
""" 

def get_visit_webpage_prompt(url: str, prompt: str) -> str:
    return PROMPT.format(content=url, prompt=prompt)