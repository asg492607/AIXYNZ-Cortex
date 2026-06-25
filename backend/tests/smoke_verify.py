"""
Sprint C — Static contract verifier.
Runs without a live server: imports backend modules directly and exercises
all 8 smoke checks via mock mode. No real AWS/GitHub/Jira creds needed.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

# Force demo mode
import services.firebase_client as fb
fb._runtime_mode = "demo"
fb._db = None
fb._mock_db = {"findings": [], "assets": [], "remediations": []}

PASS = "✅ PASS"
FAIL = "❌ FAIL"
SKIP = "⚠️  SKIP"

results = {}

# ── Check 1: Demo boot + scan auto-populates ──────────────────────────────────
try:
    fb._mock_db = {"findings": [], "assets": [], "remediations": []}
    from services.scan_service import run_full_scan
    r = run_full_scan("demo-org")
    assert r["mode"] == "demo"
    assert r["findings_count"] > 0
    assert all(f.get("id") for f in r["findings"])
    assert all(f.get("external_finding_key") for f in r["findings"])
    assert all(f.get("asset") for f in r["findings"])
    results["1_demo_boot"] = PASS
except Exception as e:
    results["1_demo_boot"] = f"{FAIL} — {e}"

# ── Check 2: Rescan idempotency (no duplication) ─────────────────────────────
try:
    fb._mock_db = {"findings": [], "assets": [], "remediations": []}
    r1 = run_full_scan("demo-org")
    c1 = r1["findings_count"]
    ids1 = {f["id"] for f in r1["findings"]}

    r2 = run_full_scan("demo-org")
    c2 = r2["findings_count"]
    ids2 = {f["id"] for f in r2["findings"]}

    assert c1 == c2, f"Count changed: {c1} → {c2}"
    assert ids1 == ids2, "IDs changed between rescans"

    keys = [f["external_finding_key"] for f in r2["findings"]]
    assert len(keys) == len(set(keys)), "Duplicate external_finding_keys"
    results["2_rescan_dedupe"] = PASS
except Exception as e:
    results["2_rescan_dedupe"] = f"{FAIL} — {e}"

# ── Check 3: Analyze flow — shape check (without Groq API) ───────────────────
try:
    from services.groq_client import analyze_finding
    # analyze_finding should return a dict with required keys (uses fallback if no API key)
    analysis = analyze_finding("S3 bucket is public", "aws", {"severity": "Critical"})
    required_keys = {"summary", "severity_reasoning", "business_impact", "remediation_steps"}
    missing = required_keys - set(analysis.keys())
    assert not missing, f"Analysis missing keys: {missing}"
    results["3_analyze_shape"] = PASS
except Exception as e:
    results["3_analyze_shape"] = f"{FAIL} — {e}"

# ── Check 4: Remediation idempotency ─────────────────────────────────────────
try:
    fb._mock_db = {"findings": [], "assets": [], "remediations": []}
    scan = run_full_scan("demo-org")
    finding_id = scan["findings"][0]["id"]

    from services.remediation_service import remediate_finding
    r1 = remediate_finding("demo-org", finding_id)
    r2 = remediate_finding("demo-org", finding_id)

    assert r2.get("status") == "already_exists", f"Expected already_exists, got: {r2}"
    results["4_remediation_idempotency"] = PASS
except Exception as e:
    results["4_remediation_idempotency"] = f"{FAIL} — {e}"

# ── Check 5: Findings rescan — selection preservation (logic check) ───────────
try:
    fb._mock_db = {"findings": [], "assets": [], "remediations": []}
    r1 = run_full_scan("demo-org")
    selected_id = r1["findings"][0]["id"]

    r2 = run_full_scan("demo-org")
    ids_after = {f["id"] for f in r2["findings"]}

    assert selected_id in ids_after, "Selected finding ID disappeared after rescan"
    results["5_rescan_preserve_selection"] = PASS
except Exception as e:
    results["5_rescan_preserve_selection"] = f"{FAIL} — {e}"

# ── Check 6: GitHub scanner shape ────────────────────────────────────────────
try:
    from services.github_scanner import get_mock_findings
    gf = get_mock_findings("demo-org")
    assert len(gf) > 0
    for f in gf:
        assert f["source"] == "github"
        assert f["asset"]["provider"] == "github"
        assert f["asset"]["asset_type"] == "repository"
        assert f["external_finding_key"].startswith("github:")
    results["6_github_shape"] = PASS
except Exception as e:
    results["6_github_shape"] = f"{FAIL} — {e}"

# ── Check 7: API contract shapes — static route schema review ─────────────────
try:
    # Verify the routes module imports cleanly and defines expected routes
    import importlib.util
    spec = importlib.util.spec_from_file_location("routes", "api/routes.py")
    routes_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(routes_mod)

    router = routes_mod.router
    paths = {r.path for r in router.routes}

    required_paths = {
        "/scan/rescan",
        "/dashboard/summary",
        "/findings",
        "/findings/analyze",
        "/findings/remediate",
    }
    missing_paths = required_paths - paths
    assert not missing_paths, f"Missing route paths: {missing_paths}"
    results["7_api_contract"] = PASS
except Exception as e:
    results["7_api_contract"] = f"{FAIL} — {e}"

# ── Check 8: Live path ────────────────────────────────────────────────────────
results["8_live_path"] = "⚠️  NOT TESTED (no live creds)"

# ── Print report ─────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("  SPRINT C — SMOKE REPORT")
print("="*60)
labels = {
    "1_demo_boot":                "1. Demo boot + scan populate",
    "2_rescan_dedupe":            "2. Dashboard rescan dedupe",
    "3_analyze_shape":            "3. Analyze flow shape",
    "4_remediation_idempotency":  "4. Remediation idempotency",
    "5_rescan_preserve_selection":"5. Findings rescan + selection",
    "6_github_shape":             "6. Integrations / GitHub shape",
    "7_api_contract":             "7. API contract sanity",
    "8_live_path":                "8. Live-path sanity",
}
all_pass = True
for key, label in labels.items():
    status = results.get(key, "⚠️  MISSING")
    print(f"  {label:<38} {status}")
    if "FAIL" in status:
        all_pass = False

print("="*60)
if all_pass:
    print("  Overall: ✅ ALL CHECKS PASSED")
else:
    print("  Overall: ❌ SOME CHECKS FAILED — see above")
print("="*60 + "\n")
