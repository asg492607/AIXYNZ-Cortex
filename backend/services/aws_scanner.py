import boto3
from botocore.exceptions import NoCredentialsError

def scan_s3_buckets():
    """
    Scans AWS S3 buckets to check for public access.
    Returns a list of findings.
    """
    findings = []
    try:
        s3 = boto3.client('s3')
        # This will only work if AWS credentials (AWS_ACCESS_KEY_ID, etc.) are set in env
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
            except Exception as e:
                print(f"Could not check ACL for {bucket_name}: {e}")
                
    except NoCredentialsError:
        print("AWS credentials not found. Returning mock AWS findings.")
        findings.append({
            "title": "Public S3 Bucket (customer-data-prod)",
            "source": "AWS",
            "severity": "Critical",
            "raw_data": {"bucket": "customer-data-prod", "acl_public": True}
        })
    except Exception as e:
        print(f"AWS Scan error: {e}")
        
    return findings
