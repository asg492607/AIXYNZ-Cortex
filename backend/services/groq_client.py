import groq
from core.config import settings

client = None
if settings.GROQ_API_KEY:
    client = groq.Groq(api_key=settings.GROQ_API_KEY)

def analyze_finding(finding_title: str, finding_source: str, raw_data: dict) -> dict:
    """
    Uses Llama-3 via Groq to explain a security finding and provide remediation steps.
    """
    if not client:
        return {
            "explanation": "[MOCK] AI explains that this is a critical risk because it exposes data.",
            "remediation_steps": "[MOCK] 1. Go to AWS Console. 2. Disable public access."
        }

    prompt = f"""
    You are an elite Cloud Security AI for AIXYNZ Cortex.
    Analyze this security finding:
    Title: {finding_title}
    Source: {finding_source}
    Raw Data: {raw_data}
    
    Provide a JSON response with exactly two keys:
    1. "explanation": A concise, founder-friendly explanation of why this matters and the business impact.
    2. "remediation_steps": Step-by-step instructions (CLI or console) on how a developer can fix this.
    """

    try:
        completion = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        import json
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"Groq AI error: {e}")
        return {
            "explanation": "Failed to generate explanation due to API error.",
            "remediation_steps": "Please review the raw finding."
        }
