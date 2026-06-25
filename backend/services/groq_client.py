import groq
import json
from core.config import settings

client = None
if settings.GROQ_API_KEY:
    try:
        client = groq.Groq(api_key=settings.GROQ_API_KEY)
    except Exception:
        pass

def analyze_finding(finding_title: str, finding_source: str, raw_data: dict) -> dict:
    """
    Uses Llama-3 via Groq to explain a security finding and provide remediation steps.
    Enforces a strict JSON schema for the UI.
    """
    fallback_response = {
        "summary": f"Security Analysis for {finding_title}",
        "severity_reasoning": "This issue violates zero-trust policies and allows unauthorized access.",
        "business_impact": "Could lead to data exfiltration and compliance violations.",
        "remediation_steps": [
            "Log into the affected system.",
            "Locate the specific resource.",
            "Re-configure the settings to deny public or broad access.",
            "Verify the changes."
        ],
        "jira_title": f"Security Fix: {finding_title}",
        "jira_description": "Please remediate the exposed asset immediately to prevent data leaks."
    }

    if not client:
        return fallback_response

    prompt = f"""
    You are an elite Cloud Security AI for AIXYNZ Cortex.
    Analyze this security finding:
    Title: {finding_title}
    Source: {finding_source}
    Raw Data: {raw_data}
    
    You MUST provide a JSON response exactly matching this schema:
    {{
      "summary": "A 1-sentence summary",
      "severity_reasoning": "Why is this severity justified?",
      "business_impact": "What is the risk to the business?",
      "remediation_steps": ["step 1", "step 2"],
      "jira_title": "A short, action-oriented ticket title",
      "jira_description": "A description for the ticket"
    }}
    """

    try:
        completion = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        result = json.loads(completion.choices[0].message.content)
        
        # Validation
        required_keys = ["summary", "severity_reasoning", "business_impact", "remediation_steps", "jira_title", "jira_description"]
        if all(k in result for k in required_keys):
            return result
        else:
            print("Groq response missing keys, using fallback.")
            return fallback_response
            
    except Exception as e:
        print(f"Groq AI error: {e}")
        return fallback_response
