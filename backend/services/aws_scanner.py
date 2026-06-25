import boto3
from botocore.exceptions import NoCredentialsError, ClientError
from services.finding_factory import build_finding

SENSITIVE_PORTS = {22, 3389, 5432, 3306, 6379, 27017}

def get_mock_findings(org_id: str = "demo-org"):
    return [
        build_finding(
            org_id=org_id,
            source="aws",
            source_type="cloud",
            category="storage_exposure",
            finding_type="public_s3_bucket",
            title="S3 bucket customer-data-prod is publicly accessible",
            description="Bucket exposure detected via ACL or policy.",
            severity="Critical",
            risk_score=95,
            external_finding_key="aws:s3-public:customer-data-prod",
            asset={
                "external_asset_id": "aws:s3:::customer-data-prod",
                "asset_type": "s3_bucket",
                "asset_name": "customer-data-prod",
                "provider": "aws",
                "account_id": "123456789012",
                "region": "us-east-1",
            },
            raw_data={"bucket": "customer-data-prod", "acl_public": True}
        ),
        build_finding(
            org_id=org_id,
            source="aws",
            source_type="cloud",
            category="network_exposure",
            finding_type="open_security_group",
            title="Security Group allows 0.0.0.0/0 on sensitive port 22",
            description="Inbound rule allows unrestricted access to a sensitive port.",
            severity="Critical",
            risk_score=90,
            external_finding_key="aws:sg-open:sg-0abcd1234:22:0.0.0.0/0",
            asset={
                "external_asset_id": "aws:ec2:sg-0abcd1234",
                "asset_type": "security_group",
                "asset_name": "sg-0abcd1234",
                "provider": "aws",
                "account_id": "123456789012",
                "region": "us-east-1",
            },
            raw_data={"sg_id": "sg-0abcd1234", "port": 22}
        ),
        build_finding(
            org_id=org_id,
            source="aws",
            source_type="cloud",
            category="iam_risk",
            finding_type="admin_role",
            title="IAM Role developer-test-role has AdministratorAccess",
            description="Role has an attached managed policy granting full administrative privileges.",
            severity="High",
            risk_score=85,
            external_finding_key="aws:iam-admin:developer-test-role",
            asset={
                "external_asset_id": "aws:iam:role/developer-test-role",
                "asset_type": "iam_role",
                "asset_name": "developer-test-role",
                "provider": "aws",
                "account_id": "123456789012",
                "region": "global",
            },
            raw_data={"role_name": "developer-test-role", "policy": "AdministratorAccess"}
        )
    ]

def scan_s3_exposure(session, org_id: str, account_id: str) -> list[dict]:
    findings = []
    try:
        s3 = session.client('s3')
        response = s3.list_buckets()
        
        for bucket in response.get('Buckets', []):
            bucket_name = bucket['Name']
            is_public = False
            exposure_reason = []
            
            try:
                acl = s3.get_bucket_acl(Bucket=bucket_name)
                for grant in acl.get('Grants', []):
                    grantee = grant.get('Grantee', {})
                    if grantee.get('URI') == 'http://acs.amazonaws.com/groups/global/AllUsers':
                        is_public = True
                        exposure_reason.append("public ACL grant")
                        break
            except ClientError as e:
                print(f"Warning: Could not get ACL for bucket {bucket_name}: {e}")

            try:
                pab = s3.get_public_access_block(Bucket=bucket_name)
                conf = pab.get('PublicAccessBlockConfiguration', {})
                if not conf.get('IgnorePublicAcls') or not conf.get('BlockPublicPolicy'):
                    is_public = True
                    exposure_reason.append("Public Access Block missing or disabled")
            except ClientError as e:
                if 'NoSuchPublicAccessBlockConfiguration' in str(e):
                    is_public = True
                    exposure_reason.append("No Public Access Block configured")
                else:
                    print(f"Warning: Could not get PublicAccessBlock for bucket {bucket_name}: {e}")
                    
            try:
                pol = s3.get_bucket_policy_status(Bucket=bucket_name)
                if pol.get('PolicyStatus', {}).get('IsPublic'):
                    is_public = True
                    exposure_reason.append("bucket policy is public")
            except ClientError as e:
                pass # Often no policy exists

            if is_public:
                try:
                    loc = s3.get_bucket_location(Bucket=bucket_name)
                    region = loc.get('LocationConstraint') or 'us-east-1'
                except:
                    region = 'unknown'

                findings.append(build_finding(
                    org_id=org_id,
                    source="aws",
                    source_type="cloud",
                    category="storage_exposure",
                    finding_type="public_s3_bucket",
                    title=f"S3 bucket {bucket_name} is publicly accessible",
                    description=f"Bucket exposure detected via: {', '.join(exposure_reason)}.",
                    severity="Critical",
                    risk_score=95,
                    external_finding_key=f"aws:s3-public:{bucket_name}",
                    asset={
                        "external_asset_id": f"aws:s3:::{bucket_name}",
                        "asset_type": "s3_bucket",
                        "asset_name": bucket_name,
                        "provider": "aws",
                        "account_id": account_id,
                        "region": region,
                    },
                    raw_data={"bucket": bucket_name, "reasons": exposure_reason},
                ))
    except Exception as e:
        print(f"Error scanning S3: {e}")
    return findings

def scan_security_groups(session, org_id: str, account_id: str) -> list[dict]:
    findings = []
    try:
        ec2 = session.client('ec2', region_name='us-east-1') # Assuming us-east-1 for MVP
        paginator = ec2.get_paginator('describe_security_groups')
        for page in paginator.paginate():
            for sg in page.get('SecurityGroups', []):
                sg_id = sg['GroupId']
                for rule in sg.get('IpPermissions', []):
                    from_port = rule.get('FromPort')
                    to_port = rule.get('ToPort')
                    if from_port and from_port == to_port and from_port in SENSITIVE_PORTS:
                        for ip_range in rule.get('IpRanges', []):
                            cidr = ip_range.get('CidrIp')
                            if cidr in ('0.0.0.0/0', '::/0'):
                                findings.append(build_finding(
                                    org_id=org_id,
                                    source="aws",
                                    source_type="cloud",
                                    category="network_exposure",
                                    finding_type="open_security_group",
                                    title=f"Security Group {sg_id} allows {cidr} on sensitive port {from_port}",
                                    description="Inbound rule allows unrestricted access to a sensitive port.",
                                    severity="Critical" if from_port in (22, 3389) else "High",
                                    risk_score=90,
                                    external_finding_key=f"aws:sg-open:{sg_id}:{from_port}:{cidr}",
                                    asset={
                                        "external_asset_id": f"aws:ec2:sg:{sg_id}",
                                        "asset_type": "security_group",
                                        "asset_name": sg_id,
                                        "provider": "aws",
                                        "account_id": account_id,
                                        "region": "us-east-1", # assuming us-east-1
                                    },
                                    raw_data={"sg_id": sg_id, "port": from_port, "cidr": cidr},
                                ))
    except Exception as e:
        print(f"Error scanning Security Groups: {e}")
    return findings

def scan_iam_roles(session, org_id: str, account_id: str) -> list[dict]:
    findings = []
    try:
        iam = session.client('iam')
        paginator = iam.get_paginator('list_roles')
        for page in paginator.paginate():
            for role in page.get('Roles', []):
                role_name = role['RoleName']
                try:
                    attached = iam.list_attached_role_policies(RoleName=role_name)
                    for pol in attached.get('AttachedPolicies', []):
                        if pol['PolicyName'] == 'AdministratorAccess':
                            findings.append(build_finding(
                                org_id=org_id,
                                source="aws",
                                source_type="cloud",
                                category="iam_risk",
                                finding_type="admin_role",
                                title=f"IAM Role {role_name} has AdministratorAccess",
                                description="Role has an attached managed policy granting full administrative privileges.",
                                severity="High",
                                risk_score=85,
                                external_finding_key=f"aws:iam-admin:{role_name}",
                                asset={
                                    "external_asset_id": f"aws:iam:role/{role_name}",
                                    "asset_type": "iam_role",
                                    "asset_name": role_name,
                                    "provider": "aws",
                                    "account_id": account_id,
                                    "region": "global",
                                },
                                raw_data={"role_name": role_name, "policy": "AdministratorAccess"},
                            ))
                except ClientError as e:
                    print(f"Warning: Could not list policies for role {role_name}: {e}")
    except Exception as e:
        print(f"Error scanning IAM Roles: {e}")
    return findings

def scan_aws_environment(org_id: str = "demo-org") -> list[dict]:
    try:
        session = boto3.session.Session()
        sts = session.client("sts")
        account_id = sts.get_caller_identity()["Account"]

        findings = []
        findings.extend(scan_s3_exposure(session, org_id, account_id))
        findings.extend(scan_security_groups(session, org_id, account_id))
        findings.extend(scan_iam_roles(session, org_id, account_id))
        return findings

    except NoCredentialsError:
        return get_mock_findings(org_id)
    except Exception as e:
        print(f"AWS scan failed: {e}")
        return get_mock_findings(org_id)
