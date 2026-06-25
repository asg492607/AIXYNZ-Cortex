def scan_github_repos():
    """
    Mock implementation of a GitHub scanner.
    In reality, this would use PyGithub or the GitHub GraphQL API
    to fetch Dependabot alerts and Secret Scanning alerts.
    """
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
        }
    ]
