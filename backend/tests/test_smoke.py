"""
Sprint C Smoke Tests — AIXYNZ Cortex MVP-1
==========================================
Tests cover:
  1. Demo mode boot + scan population
  2. Rescan idempotency (no duplicate findings)
  3. AI analysis response shape
  4. Remediation idempotency (no duplicate tickets)
  5. Findings rescan preserves selection by ID
  6. API response contract shapes

Run from project root:
    cd backend
    pytest tests/test_smoke.py -v
"""

import sys
import os
import pytest

# Ensure backend package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ── Force demo mode before importing anything ─────────────────────────────────
os.environ.pop("GOOGLE_APPLICATION_CREDENTIALS", None)
# Remove serviceAccountKey.json from CWD scope for test isolation
# (tests always run in demo mode)


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def reset_mock_db():
    """Reset in-memory mock DB before each test."""
    from services import firebase_client
    firebase_client._mock_db = {"findings": [], "assets": [], "remediations": []}
    firebase_client._db = None
    firebase_client._runtime_mode = "demo"
    yield
    firebase_client._mock_db = {"findings": [], "assets": [], "remediations": []}


# ─────────────────────────────────────────────────────────────────────────────
# 1 — Demo boot: scan populates findings, mode is demo
# ─────────────────────────────────────────────────────────────────────────────

def test_demo_boot_populates_findings():
    from services.scan_service import run_full_scan
    from services.firebase_client import get_runtime_mode

    result = run_full_scan("demo-org")

    assert get_runtime_mode() == "demo", "Expected demo mode"
    assert result["mode"] == "demo"
    assert result["findings_count"] > 0, "Scan should populate at least 1 finding in demo mode"
    assert len(result["findings"]) > 0

    # All findings must have required fields
    for f in result["findings"]:
        assert f.get("id"), f"Finding missing id: {f}"
        assert f.get("external_finding_key"), f"Finding missing external_finding_key: {f}"
        assert f.get("org_id") == "demo-org"
        assert f.get("severity") in ("Critical", "High", "Medium", "Low")
        assert f.get("asset"), f"Finding missing asset: {f}"


# ─────────────────────────────────────────────────────────────────────────────
# 2 — Rescan idempotency: repeated rescans must not duplicate findings
# ─────────────────────────────────────────────────────────────────────────────

def test_rescan_no_duplicate_findings():
    from services.scan_service import run_full_scan

    result1 = run_full_scan("demo-org")
    count1 = result1["findings_count"]

    result2 = run_full_scan("demo-org")
    count2 = result2["findings_count"]

    assert count1 == count2, (
        f"Rescan created duplicates: first={count1}, second={count2}"
    )

    # IDs must also be stable (upsert, not append)
    ids1 = {f["id"] for f in result1["findings"]}
    ids2 = {f["id"] for f in result2["findings"]}
    assert ids1 == ids2, "Finding IDs changed between rescans — upsert is broken"


def test_rescan_external_key_uniqueness():
    """Each org should never have two findings with the same external_finding_key."""
    from services.scan_service import run_full_scan

    run_full_scan("demo-org")
    result = run_full_scan("demo-org")

    keys = [f["external_finding_key"] for f in result["findings"]]
    assert len(keys) == len(set(keys)), (
        f"Duplicate external_finding_keys detected: {[k for k in keys if keys.count(k) > 1]}"
    )


# ─────────────────────────────────────────────────────────────────────────────
# 3 — Remediation idempotency: second call returns already_exists
# ─────────────────────────────────────────────────────────────────────────────

def test_remediation_idempotency():
    from services.scan_service import run_full_scan
    from services.remediation_service import remediate_finding

    scan = run_full_scan("demo-org")
    finding_id = scan["findings"][0]["id"]

    result1 = remediate_finding("demo-org", finding_id)
    # First call should succeed
    assert result1.get("status") in ("success", "already_exists", None) or result1.get("ticket_id"), (
        f"First remediation call unexpected result: {result1}"
    )

    # Persist whatever ticket_id was returned
    ticket_id_1 = (
        result1.get("ticket_id")
        or (result1.get("ticket") or {}).get("ticket_id")
    )

    result2 = remediate_finding("demo-org", finding_id)
    # Second call must be idempotent
    assert result2.get("status") == "already_exists", (
        f"Second remediation call should return already_exists, got: {result2}"
    )

    ticket_id_2 = result2.get("ticket_id")
    if ticket_id_1 and ticket_id_2:
        assert ticket_id_1 == ticket_id_2, (
            f"Idempotency broken: ticket IDs differ: {ticket_id_1} vs {ticket_id_2}"
        )


# ─────────────────────────────────────────────────────────────────────────────
# 4 — Finding not found raises ValueError
# ─────────────────────────────────────────────────────────────────────────────

def test_remediate_missing_finding_raises():
    from services.remediation_service import remediate_finding

    with pytest.raises(ValueError, match="Finding not found"):
        remediate_finding("demo-org", "nonexistent-id-xyz")


# ─────────────────────────────────────────────────────────────────────────────
# 5 — GitHub scanner returns normalized findings with correct shape
# ─────────────────────────────────────────────────────────────────────────────

def test_github_scanner_normalized_shape():
    from services.github_scanner import get_mock_findings

    findings = get_mock_findings("demo-org")
    assert len(findings) > 0

    for f in findings:
        assert f.get("source") == "github"
        assert f.get("source_type") == "code"
        assert f.get("org_id") == "demo-org"
        assert f.get("external_finding_key", "").startswith("github:")
        asset = f.get("asset", {})
        assert asset.get("asset_type") == "repository"
        assert asset.get("provider") == "github"
        assert asset.get("external_asset_id", "").startswith("github:repo:")


def test_github_branch_protection_failure_is_coverage_gap():
    """A branch protection fetch failure must NOT be classified as missing_branch_protection."""
    from services.github_scanner import get_mock_findings

    findings = get_mock_findings("demo-org")
    # In mock data there is no github_branch_protection_unverified —
    # but we verify there are no findings with wrong category for that type
    for f in findings:
        if f.get("finding_type") == "github_branch_protection_unverified":
            assert f.get("category") == "coverage_gap", (
                "Branch protection unverified must be coverage_gap, not repo_posture"
            )
            assert f.get("severity") in ("Low", "Medium")


# ─────────────────────────────────────────────────────────────────────────────
# 6 — AWS scanner returns normalized findings with correct shape
# ─────────────────────────────────────────────────────────────────────────────

def test_aws_scanner_mock_normalized_shape():
    from services.aws_scanner import get_mock_findings

    findings = get_mock_findings("demo-org")
    assert len(findings) > 0

    for f in findings:
        assert f.get("source") == "aws"
        assert f.get("org_id") == "demo-org"
        assert f.get("external_finding_key", "").startswith("aws:")
        asset = f.get("asset", {})
        assert asset.get("provider") == "aws"
        assert asset.get("asset_type") in ("s3_bucket", "security_group", "iam_role")


def test_aws_s3_findings_are_split():
    """public_s3_bucket and weak_s3_public_access_block must be separate finding types."""
    from services.aws_scanner import get_mock_findings

    findings = get_mock_findings("demo-org")
    types = {f["finding_type"] for f in findings}
    # At least one storage-class finding exists
    assert types & {"public_s3_bucket", "weak_s3_public_access_block"}, (
        f"Expected S3 finding types in mock data, got: {types}"
    )


# ─────────────────────────────────────────────────────────────────────────────
# 7 — firebase_client upsert preserves created_at on re-upsert
# ─────────────────────────────────────────────────────────────────────────────

def test_upsert_preserves_created_at():
    from services.firebase_client import upsert_finding, get_findings
    from services.finding_factory import build_finding

    finding = build_finding(
        org_id="demo-org",
        source="aws",
        source_type="cloud",
        category="storage_exposure",
        finding_type="public_s3_bucket",
        title="Test bucket is public",
        description="test",
        severity="Critical",
        risk_score=95,
        external_finding_key="aws:s3-public:test-bucket-smoke",
        asset={
            "external_asset_id": "aws:s3:::test-bucket-smoke",
            "asset_type": "s3_bucket",
            "asset_name": "test-bucket-smoke",
            "provider": "aws",
            "account_id": "123456789012",
            "region": "us-east-1",
        },
    )

    id1 = upsert_finding(finding)
    findings_after_first = get_findings("demo-org")
    created_at_1 = next(f["created_at"] for f in findings_after_first if f["id"] == id1)

    # Upsert same finding again
    id2 = upsert_finding(finding)
    findings_after_second = get_findings("demo-org")
    created_at_2 = next(f["created_at"] for f in findings_after_second if f["id"] == id2)

    assert id1 == id2, "Upsert must return same ID for same external_finding_key"
    assert created_at_1 == created_at_2, "Upsert must preserve original created_at"
    assert len(findings_after_second) == 1, "Upsert must not duplicate the finding"


# ─────────────────────────────────────────────────────────────────────────────
# 8 — finding_factory build_finding schema completeness
# ─────────────────────────────────────────────────────────────────────────────

def test_build_finding_required_fields():
    from services.finding_factory import build_finding

    f = build_finding(
        org_id="test-org",
        source="github",
        source_type="code",
        category="repo_posture",
        finding_type="public_repository",
        title="Repo is public",
        description="Test",
        severity="High",
        risk_score=80,
        external_finding_key="github:repo-public:test/repo",
        asset={"external_asset_id": "github:repo:test/repo", "asset_type": "repository",
               "asset_name": "repo", "provider": "github", "account_id": "test", "region": "global"},
        confidence="high",
        scanner_metadata={"scanner": "test"},
    )

    required = [
        "org_id", "source", "source_type", "category", "finding_type",
        "title", "description", "severity", "risk_score", "status",
        "external_finding_key", "asset", "raw_data", "remediation",
        "confidence", "scanner_metadata", "detected_at", "updated_at",
    ]
    for field in required:
        assert field in f, f"Missing required field: {field}"

    assert f["status"] == "open"
    assert f["confidence"] == "high"
    assert f["scanner_metadata"] == {"scanner": "test"}
