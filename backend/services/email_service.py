import logging

logger = logging.getLogger(__name__)

def send_invitation_email(email: str, invite_token: str, org_name: str, inviter_name: str) -> bool:
    """
    Mock email service for MVP-4.
    Logs the invitation link to the console for easy testing.
    """
    # Assuming frontend runs on localhost:5173 for local dev
    invite_link = f"http://localhost:5173/invite/{invite_token}"
    
    email_body = f"""
    ==================================================
    📧 NEW INVITATION EMAIL
    ==================================================
    To: {email}
    Subject: You have been invited to join {org_name} on AIXYNZ Cortex
    
    Hi there,
    
    {inviter_name} has invited you to join the {org_name} organization on AIXYNZ Cortex.
    
    Click the link below to accept the invitation and set up your account:
    {invite_link}
    
    If you did not expect this invitation, you can safely ignore this email.
    ==================================================
    """
    
    logger.info(email_body)
    print(email_body)
    
    return True
