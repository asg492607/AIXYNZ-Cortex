import json
from typing import Optional, Dict

def parse_aws_eventbridge(payload: Dict, org_id: str) -> Optional[Dict]:
    """
    Parses AWS EventBridge or SNS JSON payloads and converts them 
    into a standardized Cortex Finding dictionary.
    """
    # Sometimes SNS wraps the actual event in "Message"
    if "Message" in payload:
        try:
            payload = json.loads(payload["Message"])
        except Exception:
            pass

    source = payload.get("source")
    detail_type = payload.get("detail-type")
    detail = payload.get("detail", {})

    # GuardDuty Finding
    if source == "aws.guardduty" and detail_type == "GuardDuty Finding":
        severity_score = detail.get("severity", 0)
        severity = "Low"
        if severity_score >= 7.0: severity = "High"
        elif severity_score >= 4.0: severity = "Medium"
        elif severity_score >= 9.0: severity = "Critical"

        title = detail.get("title", "GuardDuty Alert")
        desc = detail.get("description", "")
        finding_id = detail.get("id", "")
        
        # Try to infer asset
        resource = detail.get("resource", {})
        resource_type = resource.get("resourceType", "unknown")
        
        asset_name = "unknown"
        asset_id = "unknown"
        
        if resource_type == "Instance":
            asset_name = resource.get("instanceDetails", {}).get("instanceId", "unknown")
            asset_id = asset_name
        elif resource_type == "S3Bucket":
            asset_name = resource.get("s3BucketDetails", [{}])[0].get("name", "unknown")
            asset_id = resource.get("s3BucketDetails", [{}])[0].get("arn", "unknown")

        return {
            "org_id": org_id,
            "source": "aws",
            "source_type": "eventbridge",
            "finding_type": "guardduty_alert",
            "title": title,
            "description": desc,
            "severity": severity,
            "risk_score": int(severity_score * 10),
            "status": "open",
            "external_finding_key": f"aws-gd-{finding_id}",
            "asset": {
                "external_asset_id": asset_id,
                "asset_type": resource_type,
                "asset_name": asset_name,
                "provider": "aws"
            },
            "raw_data": payload
        }

    # CloudTrail AWS API Call (e.g., PutBucketPublicAccessBlock)
    if source == "aws.s3" and detail_type == "AWS API Call via CloudTrail":
        event_name = detail.get("eventName")
        
        if event_name == "PutBucketAcl" or event_name == "DeleteBucketPublicAccessBlock":
            req_params = detail.get("requestParameters", {})
            bucket_name = req_params.get("bucketName", "unknown")
            
            return {
                "org_id": org_id,
                "source": "aws",
                "source_type": "cloudtrail",
                "finding_type": "public_s3_bucket",
                "title": f"S3 Bucket {bucket_name} modified: Potential Public Access",
                "description": f"Action {event_name} was performed on bucket {bucket_name}",
                "severity": "High",
                "risk_score": 85,
                "status": "open",
                "external_finding_key": f"aws-ct-{detail.get('eventID')}",
                "asset": {
                    "external_asset_id": f"arn:aws:s3:::{bucket_name}",
                    "asset_type": "S3Bucket",
                    "asset_name": bucket_name,
                    "provider": "aws"
                },
                "raw_data": payload
            }

    return None
