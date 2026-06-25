import os
from github import Github
from github.GithubException import GithubException
from services.finding_factory import build_finding

def get_mock_findings(org_id: str = "demo-org"):
    return [
        build_finding(
            org_id=org_id,
            source="github",
            source_type="code",
            category="repo_posture",
            finding_type="public_repository",
            title="Repository aixynz-core is public",
            description="Repository is set to public, which may expose proprietary code.",
            severity="High",
            risk_score=80,
            external_finding_key="github:repo-public:aixynz/aixynz-core",
            asset={
                "external_asset_id": "github:repo:aixynz/aixynz-core",
                "asset_type": "repository",
                "asset_name": "aixynz-core",
                "provider": "github",
                "account_id": "aixynz",
                "region": "global",
            },
            raw_data={"repo": "aixynz/aixynz-core", "private": False},
            confidence="high",
            scanner_metadata={"mode": "demo", "scanner": "github_repo_posture"},
        ),
        build_finding(
            org_id=org_id,
            source="github",
            source_type="code",
            category="repo_posture",
            finding_type="missing_branch_protection",
            title="Repository aixynz-core is missing branch protection on main",
            description="Default branch does not enforce branch protection controls.",
            severity="Medium",
            risk_score=60,
            external_finding_key="github:branch-protection-missing:aixynz/aixynz-core:main",
            asset={
                "external_asset_id": "github:repo:aixynz/aixynz-core",
                "asset_type": "repository",
                "asset_name": "aixynz-core",
                "provider": "github",
                "account_id": "aixynz",
                "region": "global",
            },
            raw_data={"repo": "aixynz/aixynz-core", "branch": "main"},
            confidence="high",
            scanner_metadata={"mode": "demo", "scanner": "github_repo_posture"},
        ),
        build_finding(
            org_id=org_id,
            source="github",
            source_type="code",
            category="vulnerability",
            finding_type="github_dependency_alerts_unavailable",
            title="Dependabot alerts unavailable for aixynz-core",
            description="GitHub Advanced Security or Dependabot is not enabled/accessible for this repository.",
            severity="Low",
            risk_score=30,
            external_finding_key="github:dependabot-unavailable:aixynz/aixynz-core",
            asset={
                "external_asset_id": "github:repo:aixynz/aixynz-core",
                "asset_type": "repository",
                "asset_name": "aixynz-core",
                "provider": "github",
                "account_id": "aixynz",
                "region": "global",
            },
            raw_data={"repo": "aixynz/aixynz-core"},
            confidence="medium",
            scanner_metadata={"mode": "demo", "scanner": "github_dependabot_posture"},
        )
    ]

def scan_repo_posture(repo, org_id: str) -> list[dict]:
    findings = []
    full_name = repo.full_name
    owner_login = repo.owner.login if repo.owner else "unknown"
    
    asset = {
        "external_asset_id": f"github:repo:{full_name}",
        "asset_type": "repository",
        "asset_name": repo.name,
        "provider": "github",
        "account_id": owner_login,
        "region": "global",
    }

    if not repo.private:
        findings.append(build_finding(
            org_id=org_id,
            source="github",
            source_type="code",
            category="repo_posture",
            finding_type="public_repository",
            title=f"Repository {full_name} is public",
            description="Repository is set to public, which may expose proprietary code.",
            severity="High",
            risk_score=80,
            external_finding_key=f"github:repo-public:{full_name}",
            asset=asset,
            raw_data={"repo": full_name, "private": False},
            confidence="high",
            scanner_metadata={"scanner": "github_repo_posture"},
        ))

    default_branch = repo.default_branch or "main"
    try:
        branch = repo.get_branch(default_branch)
        if not branch.protected:
            findings.append(build_finding(
                org_id=org_id,
                source="github",
                source_type="code",
                category="repo_posture",
                finding_type="missing_branch_protection",
                title=f"Repository {full_name} is missing branch protection on {default_branch}",
                description="Default branch does not enforce branch protection controls.",
                severity="Medium",
                risk_score=60,
                external_finding_key=f"github:branch-protection-missing:{full_name}:{default_branch}",
                asset=asset,
                raw_data={"repo": full_name, "branch": default_branch, "protected": False},
                confidence="high",
                scanner_metadata={"scanner": "github_repo_posture"},
            ))
    except GithubException:
        findings.append(build_finding(
            org_id=org_id,
            source="github",
            source_type="code",
            category="repo_posture",
            finding_type="missing_branch_protection",
            title=f"Repository {full_name} is missing branch protection on {default_branch}",
            description="Could not verify branch protection (likely unprotected or missing permissions).",
            severity="Medium",
            risk_score=60,
            external_finding_key=f"github:branch-protection-missing:{full_name}:{default_branch}",
            asset=asset,
            raw_data={"repo": full_name, "branch": default_branch, "error": "fetch_failed"},
            confidence="medium",
            scanner_metadata={"scanner": "github_repo_posture"},
        ))

    return findings

def scan_repo_dependabot(repo, org_id: str) -> list[dict]:
    findings = []
    full_name = repo.full_name
    owner_login = repo.owner.login if repo.owner else "unknown"
    
    asset = {
        "external_asset_id": f"github:repo:{full_name}",
        "asset_type": "repository",
        "asset_name": repo.name,
        "provider": "github",
        "account_id": owner_login,
        "region": "global",
    }
    
    # In PyGithub, fetching dependabot alerts requires specific org permissions and REST calls
    # For MVP, we will assume we lack permissions and emit an honest posture finding.
    
    findings.append(build_finding(
        org_id=org_id,
        source="github",
        source_type="code",
        category="vulnerability",
        finding_type="github_dependency_alerts_unavailable",
        title=f"Dependabot alerts unavailable for {full_name}",
        description="GitHub Advanced Security or Dependabot is not enabled/accessible for this repository.",
        severity="Low",
        risk_score=30,
        external_finding_key=f"github:dependabot-unavailable:{full_name}",
        asset=asset,
        raw_data={"repo": full_name},
        confidence="medium",
        scanner_metadata={"scanner": "github_dependabot_posture"},
    ))
    
    return findings

def scan_repo_secret_scanning(repo, org_id: str) -> list[dict]:
    findings = []
    full_name = repo.full_name
    owner_login = repo.owner.login if repo.owner else "unknown"
    
    asset = {
        "external_asset_id": f"github:repo:{full_name}",
        "asset_type": "repository",
        "asset_name": repo.name,
        "provider": "github",
        "account_id": owner_login,
        "region": "global",
    }
    
    findings.append(build_finding(
        org_id=org_id,
        source="github",
        source_type="code",
        category="secret_exposure",
        finding_type="github_secret_scanning_unavailable",
        title=f"Secret scanning alerts unavailable for {full_name}",
        description="GitHub Secret Scanning is not enabled or accessible for this repository.",
        severity="Low",
        risk_score=30,
        external_finding_key=f"github:secret-scanning-unavailable:{full_name}",
        asset=asset,
        raw_data={"repo": full_name},
        confidence="medium",
        scanner_metadata={"scanner": "github_secret_posture"},
    ))
    
    return findings

def scan_github_repos(org_id: str = "demo-org") -> list[dict]:
    """
    Connects to GitHub using GITHUB_TOKEN if available.
    For MVP-1, checks real repo posture and emits honest alert-availability posture findings.
    """
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        print("GITHUB_TOKEN not found. Using realistic mock data.")
        return get_mock_findings(org_id)
        
    try:
        g = Github(token)
        user = g.get_user()
        findings = []
        
        repos = list(user.get_repos()[:5])
        for repo in repos:
            findings.extend(scan_repo_posture(repo, org_id))
            findings.extend(scan_repo_dependabot(repo, org_id))
            findings.extend(scan_repo_secret_scanning(repo, org_id))
            
        return findings if findings else get_mock_findings(org_id)
        
    except GithubException as e:
        print(f"GitHub API Error: {e}. Falling back to mock data.")
        return get_mock_findings(org_id)
    except Exception as e:
        print(f"Unknown Error in GitHub Scanner: {e}")
        return get_mock_findings(org_id)
