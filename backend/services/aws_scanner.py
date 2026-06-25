import boto3
from botocore.exceptions import NoCredentialsError, ClientError

def get_mock_findings():
    return [
        {
            "title": "Public S3 Bucket (customer-data-prod)",
            "source": "AWS",
            "severity": "Critical",
            "raw_data": {"bucket": "customer-data-prod", "acl_public": True}
        },
        {
            "title": "Security Group allowing 0.0.0.0/0 on Port 22 (SSH)",
            "source": "AWS",
            "severity": "Critical",
            "raw_data": {"sg_id": "sg-0abcd1234", "port": 22}
        },
        {
            "title": "IAM Role with Overly Permissive Admin Access",
            "source": "AWS",
            "severity": "High",
            "raw_data": {"role_name": "developer-test-role", "policy": "AdministratorAccess"}
        }
    ]

def scan_s3_buckets():
    findings = []
    try:
        s3 = boto3.client('s3')
        response = s3.list_buckets()
        
        for bucket in response.get('Buckets', []):
            bucket_name = bucket['Name']
            try:
                acl = s3.get_bucket_acl(Bucket=bucket_name)
                is_public = False
                for grant in acl.get('Grants', []):
                    grantee = grant.get('Grantee', {})
                    if grantee.get('URI') == 'http://acs.amazonaws.com/groups/global/AllUsers':
                        is_public = True
                        break
                
                if is_public:
                    findings.append({
                        "title": f"Public S3 Bucket: {bucket_name}",
                        "source": "AWS",
                        "severity": "Critical",
                        "raw_data": {"bucket": bucket_name, "acl_public": True}
                    })
            except ClientError:
                pass # Ignore buckets we can't access
                
    except NoCredentialsError:
        print("AWS credentials not found. Using realistic mock data.")
        return get_mock_findings()
    except Exception as e:
        print(f"AWS Scan error: {e}")
        return get_mock_findings()
        
    return findings
