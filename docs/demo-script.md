# Demo Script & Storyboard

Follow this path to record a polished, 3-minute video demonstration of Cortex MVP-2.

## Setup
1. Run `docker compose up` to start Cortex in Demo Mode.
2. Open `http://localhost:80` in your browser.
3. Resize your window to 1080p (1920x1080) for a clean recording aspect ratio.

## The Script

### Scene 1: The Landing & Login (0:00 - 0:20)
- **Action**: Start on the login screen. Click **"Login with Demo Admin"**.
- **Talking Point**: *"Welcome to Cortex. Cortex is an asset-centric security operations platform. I'm logging in via our Role-Based Access Control system as an Organization Admin."*

### Scene 2: The Dashboard & Metrics (0:20 - 0:50)
- **Action**: You land on the Dashboard. Hover over the Severity Breakdown charts. Scroll down to show the Recent Scans list.
- **Talking Point**: *"The dashboard gives us immediate visibility. Behind the scenes, our `/metrics` endpoint is aggregating these stats in real-time. You can see our Mean Time to Resolve (MTTR) and the history of our background scan jobs."*

### Scene 3: Asset Inventory (0:50 - 1:20)
- **Action**: Click **Assets** in the sidebar. Show the list of discovered AWS and GitHub assets. Click on one of the S3 buckets.
- **Talking Point**: *"Unlike legacy tools that just throw alerts at you, Cortex builds an inventory. When our AWS and GitHub connectors run, they upsert assets and calculate a unified risk score. I can see exactly what findings belong to this specific S3 bucket."*

### Scene 4: Finding Triage & AI Remediation (1:20 - 2:00)
- **Action**: Click **Findings** in the sidebar. Find a "Public S3 Bucket" finding. Click **Analyze with AI**. Wait a few seconds for the streaming response.
- **Talking Point**: *"Let's look at triage. I have a critical S3 exposure. Cortex integrates with Groq's ultra-fast LLMs to generate a contextual remediation plan based on the raw JSON of the finding. I don't need to google how to fix this; the exact Terraform or AWS CLI command is generated instantly."*

### Scene 5: SecOps Workflows (2:00 - 2:30)
- **Action**: Click the **Push to Jira** button. Then click the **Status** dropdown and change it to **In Progress**. Add a quick comment "Working on this now."
- **Talking Point**: *"Security doesn't happen in a vacuum. I can push this AI plan directly to Jira to create a ticket for engineering. As I change the status, Cortex logs every action in an immutable audit trail."*

### Scene 6: Compliance & Exporting (2:30 - 3:00)
- **Action**: Click **Compliance** in the sidebar. Show the CIS/SOC2 mappings. Then click **Reports** and click **Export CSV**.
- **Talking Point**: *"Finally, Cortex makes reporting painless. Findings are automatically mapped to compliance frameworks like SOC 2 and ISO 27001 by our compliance engine. And I can export this data instantly for auditor review. That's Cortex."*
