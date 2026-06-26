import json
from typing import List, Dict

from services.groq_client import client
from services.firebase_client import get_findings, get_chat_history, append_chat_message

def _build_context(org_id: str) -> str:
    """Builds the RAG context string for the AI from the organization's data."""
    findings = get_findings(org_id)
    
    total = len(findings)
    open_findings = [f for f in findings if f.get("status") == "open"]
    critical = len([f for f in open_findings if f.get("severity") == "Critical"])
    high = len([f for f in open_findings if f.get("severity") == "High"])
    
    # Get top 10 highest risk findings
    top_risks = sorted(open_findings, key=lambda x: x.get("risk_score", 0), reverse=True)[:10]
    
    context = f"""
    ORGANIZATION CONTEXT:
    Total Findings: {total}
    Open Findings: {len(open_findings)}
    Critical Findings: {critical}
    High Findings: {high}
    
    TOP 10 RISK FINDINGS:
    """
    for f in top_risks:
        context += f"- [{f.get('severity')}] {f.get('title')} (Risk: {f.get('risk_score')}) [Asset: {f.get('asset', {}).get('asset_name')}]\n"
        
    return context


def copilot_chat(org_id: str, thread_id: str, user_message: str, finding_id: str = None) -> str:
    # 1. Save user message to history
    append_chat_message(org_id, thread_id, "user", user_message)
    
    # 2. Retrieve history
    history = get_chat_history(org_id, thread_id)
    
    # 3. Build system prompt with context
    context = _build_context(org_id)
    
    system_prompt = f"""
    You are the AIXYNZ Cortex Security Copilot. You are an expert cloud security architect and SOC analyst.
    Your goal is to help the user understand their security posture, prioritize risks, and suggest remediations.
    
    Here is the current state of their organization's security findings:
    {context}
    
    Keep your answers concise, professional, and actionable. If the user asks about a specific finding, refer to the context provided.
    If you don't know the answer, say so. Do not invent findings that are not in the context.
    """
    
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add history (up to last 10 messages to save context window)
    for msg in history[-10:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
        
    # If no groq client (demo mode without key), return mock response
    if not client:
        mock_response = "I am the Cortex AI Copilot (Mock Mode). To get real AI responses, please configure GROQ_API_KEY in the environment."
        if "highest risk" in user_message.lower():
            mock_response = "Based on your mock data, your highest risk findings are Critical S3 bucket exposures and exposed GitHub secrets."
        append_chat_message(org_id, thread_id, "assistant", mock_response)
        return mock_response
        
    try:
        completion = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=messages,
            temperature=0.3,
        )
        ai_response = completion.choices[0].message.content
        
        # Save AI response
        append_chat_message(org_id, thread_id, "assistant", ai_response)
        return ai_response
        
    except Exception as e:
        print(f"Copilot Groq error: {e}")
        error_msg = "Sorry, I encountered an error communicating with the AI model."
        append_chat_message(org_id, thread_id, "assistant", error_msg)
        return error_msg
