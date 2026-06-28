import subprocess
import sys
import json

def run_safety_check():
    print("Running OWASP Supply Chain Defense (Dependency Scan)...")
    try:
        # Run safety check and output JSON
        result = subprocess.run(
            ["safety", "check", "-r", "requirements.txt", "--json"],
            capture_output=True,
            text=True
        )
        
        # Safety might return non-zero exit code if vulnerabilities are found
        if result.stdout:
            try:
                report = json.loads(result.stdout)
                vulnerabilities = report.get("vulnerabilities", [])
                
                if vulnerabilities:
                    print(f"❌ WARNING: {len(vulnerabilities)} vulnerabilities found in dependencies!")
                    for vuln in vulnerabilities:
                        print(f" - Package: {vuln.get('package_name')} (v{vuln.get('analyzed_version')})")
                        print(f"   CVE: {vuln.get('cve', 'N/A')}")
                        print(f"   Advisory: {vuln.get('advisory')}")
                        print("-" * 40)
                    sys.exit(1)
                else:
                    print("✅ No known vulnerabilities found in dependencies.")
                    sys.exit(0)
            except json.JSONDecodeError:
                print("Failed to parse safety output.")
                print(result.stdout)
                sys.exit(1)
        else:
            print("Safety command executed but returned no output.")
            print(result.stderr)
            sys.exit(1)
            
    except FileNotFoundError:
        print("❌ Error: 'safety' package is not installed. Run 'pip install safety' first.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error during scan: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_safety_check()
