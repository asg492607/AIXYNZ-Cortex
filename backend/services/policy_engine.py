import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

def evaluate_policy(policy_code: str, asset_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates a simple python-based boolean expression against an asset_data dictionary.
    This simulates an OPA/Rego engine for the MVP.
    Returns {"allow": bool, "violation": str/None}.
    """
    try:
        # Provide a very restricted environment for eval
        allowed_globals = {"__builtins__": None}
        # Provide the asset data as 'input' to mirror OPA conventions
        allowed_locals = {"input": asset_data}
        
        # Evaluate the policy_code which should be a boolean expression
        # e.g., "input.get('public_access', False) == False"
        
        # We need to compile and eval.
        # This is inherently risky in production without proper sandboxing,
        # but serves as a quick scaffolding for the MVP Policy Playground.
        
        result = eval(policy_code, allowed_globals, allowed_locals)
        
        if not isinstance(result, bool):
            return {
                "success": False,
                "error": "Policy expression must evaluate to a boolean."
            }
            
        if result is True:
            return {
                "success": True,
                "allow": True,
                "violation": None
            }
        else:
            return {
                "success": True,
                "allow": False,
                "violation": "Asset failed policy evaluation."
            }
            
    except Exception as e:
        logger.error(f"[PolicyEngine] Evaluation error: {e}")
        return {
            "success": False,
            "error": f"Evaluation error: {str(e)}"
        }
