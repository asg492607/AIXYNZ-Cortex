from services.firebase_client import (
    get_finding_by_id,
    get_remediation_by_finding_id,
    save_remediation,
    update_finding_jira_key
)
from services.groq_client import analyze_finding
from services.jira_client import create_remediation_ticket

def remediate_finding(org_id: str, finding_id: str) -> dict:
    finding = get_finding_by_id(finding_id, org_id)
    if not finding:
        raise ValueError("Finding not found")

    existing = get_remediation_by_finding_id(finding_id, org_id)
    if existing:
        return {
            "status": "already_exists",
            "ticket_id": existing["ticket_id"],
            "ticket_url": existing["ticket_url"],
        }

    analysis = analyze_finding(
        finding_title=finding.get("title", ""),
        finding_source=finding.get("source", ""),
        raw_data={
            "category": finding.get("category"),
            "severity": finding.get("severity"),
            "asset": finding.get("asset"),
            "raw_data": finding.get("raw_data", {}),
        }
    )
    ticket = create_remediation_ticket(org_id, finding, analysis)

    remediation = {
        "finding_id": finding_id,
        "ticket_id": ticket["ticket_id"],
        "ticket_url": ticket["ticket_url"],
        "status": "open",
        "source": finding.get("source"),
        "severity": finding.get("severity"),
        "title": finding.get("title"),
        "creation_mode": "auto",
        "workflow_state": "open",
    }
    save_remediation(remediation, org_id)
    update_finding_jira_key(finding_id, ticket["ticket_id"], org_id)

    return {
        "status": "success",
        "ticket": ticket,
        "analysis": analysis
    }
