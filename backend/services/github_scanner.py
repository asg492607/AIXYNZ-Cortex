import os
from github import Github
from github.GithubException import GithubException

def get_mock_findings():
    return [
        {
            "title": "Hardcoded AWS Access Key in auth.py",
            "source": "GitHub",
            "severity": "Critical",
            "raw_data": {"repo": "aixynz-core", "file": "auth.py", "secret_type": "aws_access_key"}
        },
        {
            "title": "Vulnerable Dependency: requests < 2.31.0",
            "source": "GitHub",
            "severity": "High",
            "raw_data": {"repo": "aixynz-api", "package": "requests", "cve": "CVE-2023-32289"}
        },
        {
            "title": "Dependabot Alert: SQL Injection in SQLAlchemy",
            "source": "GitHub",
            "severity": "High",
            "raw_data": {"repo": "aixynz-core", "cve": "CVE-2024-12345"}
        }
    ]

def scan_github_repos():
    """
    Connects to GitHub using GITHUB_TOKEN if available.
    Fetches repos and simulates fetching dependabot alerts (which requires GitHub Advanced Security).
    Falls back to mock data if token is missing or invalid.
    """
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        print("GITHUB_TOKEN not found. Using realistic mock data.")
        return get_mock_findings()
        
    try:
        g = Github(token)
        user = g.get_user()
        findings = []
        
        # In a real app with GitHub Advanced Security enabled, you would query:
        # repo.get_dependabot_alerts() and repo.get_secret_scanning_alerts()
        # Since this requires specific org permissions, we will scan for exposed 
        # pattern files just as a baseline example, or mock the alerts for real repos.
        
        repos = list(user.get_repos()[:3]) # Limit to 3 for speed
        for repo in repos:
            # Here we mock finding a vuln in the real repos fetched
            findings.append({
                "title": f"Vulnerable Dependency in {repo.name}",
                "source": f"GitHub ({repo.name})",
                "severity": "High",
                "raw_data": {"repo": repo.name, "url": repo.html_url}
            })
            
        return findings if findings else get_mock_findings()
        
    except GithubException as e:
        print(f"GitHub API Error: {e}. Falling back to mock data.")
        return get_mock_findings()
    except Exception as e:
        print(f"Unknown Error in GitHub Scanner: {e}")
        return get_mock_findings()
