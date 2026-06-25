import os
import requests
import uuid

def create_remediation_ticket(org_id: str, finding: dict, ai_analysis: dict) -> dict:
    base_url = os.getenv("JIRA_BASE_URL")
    email = os.getenv("JIRA_EMAIL")
    token = os.getenv("JIRA_API_TOKEN")
    project_key = os.getenv("JIRA_PROJECT_KEY", "SEC")

    if not all([base_url, email, token]):
        ticket_id = f"DEMO-{str(uuid.uuid4())[:8].upper()}"
        return {
            "status": "demo_ticket_created",
            "ticket_id": ticket_id,
            "ticket_url": f"https://example.atlassian.net/browse/{ticket_id}"
        }

    summary = f"[AIXYNZ Cortex][{finding.get('severity', 'High')}] {finding.get('title', 'Security Finding')}"
    
    asset_info = finding.get('asset', {})
    asset_str = asset_info.get('external_asset_id', finding.get('asset_id', 'unknown'))
    
    description = f"""AIXYNZ Cortex Security Remediation Ticket

Finding ID: {finding.get('id', 'unknown')}
Severity: {finding.get('severity', 'unknown')}
Risk Score: {finding.get('risk_score', 'unknown')}
Source: {finding.get('source', 'unknown')}
Asset: {asset_str}

Summary
{ai_analysis.get('summary', 'No summary provided.')}

Business Impact
{ai_analysis.get('business_impact', 'Unknown impact.')}

Recommended Remediation
"""
    steps = ai_analysis.get('remediation_steps', [])
    if isinstance(steps, list):
        for i, step in enumerate(steps, 1):
            description += f"{i}. {step}\n"
    else:
        description += f"{steps}\n"
        
    description += f"""
Raw Context
{str(finding.get('raw_data', ''))}
"""

    payload = {
        "fields": {
            "project": {"key": project_key},
            "summary": summary,
            "description": description,
            "issuetype": {"name": "Task"},
            "labels": [
                "aixynz-cortex",
                "security",
                finding.get("source", "unknown").lower()
            ]
        }
    }

    try:
        resp = requests.post(
            f"{base_url}/rest/api/3/issue",
            json=payload,
            auth=(email, token),
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            timeout=20,
        )
        resp.raise_for_status()
        issue = resp.json()
        key = issue["key"]

        return {
            "status": "ticket_created",
            "ticket_id": key,
            "ticket_url": f"{base_url}/browse/{key}",
        }
    except Exception as e:
        print(f"Jira API error: {e}")
        ticket_id = f"ERR-{str(uuid.uuid4())[:8].upper()}"
        return {
            "status": "error_fallback_ticket_created",
            "ticket_id": ticket_id,
            "ticket_url": f"https://example.atlassian.net/browse/{ticket_id}"
        }
