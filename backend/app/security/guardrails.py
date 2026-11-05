import re
import time
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field

@dataclass
class GuardrailResult:
    is_safe: bool
    action: str  # "allow" | "block" | "redact"
    threat_level: str  # "none" | "low" | "medium" | "critical"
    flagged_categories: List[str] = field(default_factory=list)
    sanitized_text: str = ""
    refusal_message: Optional[str] = None
    rule_matches: List[str] = field(default_factory=list)
    latency_ms: float = 0.0

class GuardrailEngine:
    """
    Enterprise LLM Security & Guardrails Engine (2026 Edition):
    - Jailbreak / Prompt Injection Detection (DAN, Roleplay Override, Token Delimiter Smuggling)
    - System Prompt Exfiltration Prevention
    - PII & Secret Credential Redaction (API Keys, Passwords, Private Keys, SSN)
    - Malicious Payload & Command Injection Shield
    - Topical & Ethical Operational Bounding
    """

    JAILBREAK_PATTERNS = [
        (r"(?i)\bignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|prompts)\b", "ignore_instructions"),
        (r"(?i)\byou\s+are\s+now\s+(DAN|unrestricted|developer\s+mode|jailbroken|godmode)\b", "dan_jailbreak"),
        (r"(?i)\bpretend\s+(you\s+have\s+no\s+(restrictions|rules|ethics)|to\s+be\s+an\s+evil)\b", "roleplay_bypass"),
        (r"(?i)\b(forget|disregard|override)\s+(your\s+)?(system\s+prompt|safety\s+filters|rules|guidelines)\b", "override_filters"),
        (r"(?i)\b(act\s+as\s+if\s+you\s+were\s+trained\s+differently|bypass\s+all\s+security)\b", "bypass_training"),
        (r"(?i)\b(reveal|print|display|dump|leak)\s+(your\s+)?(system\s+prompt|hidden\s+instructions|pre-prompt)\b", "system_prompt_exfiltration"),
        (r"(?i)(<\|im_start\|>|<\|im_end\|>|\[INST\]|\[/INST\]|<<SYS>>|<system>|\[SYSTEM\])", "delimiter_smuggling"),
        (r"(?i)\b(generate\s+(a\s+)?(malware|ransomware|keylogger|ddos\s+script|reverse\s+shell))\b", "exploit_generation"),
    ]

    PII_SECRET_PATTERNS = [
        (r"\b(sk-[a-zA-Z0-9]{32,50})\b", "OpenAI API Key", "[REDACTED_OPENAI_KEY]"),
        (r"\b(gsk_[a-zA-Z0-9]{32,60})\b", "Groq API Key", "[REDACTED_GROQ_KEY]"),
        (r"\b(AKIA[0-9A-Z]{16})\b", "AWS Access Key", "[REDACTED_AWS_KEY]"),
        (r"-----BEGIN\s+(RSA\s+|EC\s+)?PRIVATE\s+KEY-----", "Private Key Header", "[REDACTED_PRIVATE_KEY]"),
        (r"\b(\d{3}-\d{2}-\d{4})\b", "US Social Security Number", "[REDACTED_SSN]"),
        (r"\b([45]\d{3}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4})\b", "Credit Card Number", "[REDACTED_CARD]"),
        (r"(?i)\bpassword\s*[:=]\s*['\"]?([A-Za-z0-9@#$%^&+=]{6,30})['\"]?", "Cleartext Password", "password: [REDACTED_PASSWORD]")
    ]

    SQL_SHELL_PATTERNS = [
        (r"(?i)\b(UNION\s+SELECT|DROP\s+TABLE|DELETE\s+FROM\s+\w+\s*;|TRUNCATE\s+TABLE)\b", "sql_injection"),
        (r"(?i)(;\s*rm\s+-rf\s+/|format\s+c:|powershell\s+-enc\s+[A-Za-z0-9+/=]{10,})", "destructive_shell_command"),
    ]

    def __init__(self):
        self.total_checks: int = 0
        self.blocked_count: int = 0
        self.redacted_count: int = 0
        self.allowed_count: int = 0

    def evaluate(self, user_input: str) -> GuardrailResult:
        """
        Sub-millisecond high-precision security check on incoming user query.
        """
        t0 = time.perf_counter()
        self.total_checks += 1
        
        flagged_categories: List[str] = []
        rule_matches: List[str] = []
        sanitized = user_input
        action = "allow"
        threat_level = "none"
        refusal_message = None

        # 1. Jailbreak & Prompt Injection Scan
        for pattern, rule_id in self.JAILBREAK_PATTERNS:
            if re.search(pattern, user_input):
                flagged_categories.append("jailbreak_injection")
                rule_matches.append(rule_id)
                threat_level = "critical"
                action = "block"
                refusal_message = (
                    "I maintain consistent operational integrity and strict security boundaries. "
                    "I cannot fulfill instructions designed to bypass guidelines, leak system prompts, "
                    "or generate harmful code. How can I assist with your authorized technical inquiry?"
                )
                break

        # 2. SQL / Shell Injection Scan
        if action != "block":
            for pattern, rule_id in self.SQL_SHELL_PATTERNS:
                if re.search(pattern, user_input):
                    flagged_categories.append("malicious_code_injection")
                    rule_matches.append(rule_id)
                    threat_level = "critical"
                    action = "block"
                    refusal_message = (
                        "Security Warning: Destructive command patterns or unauthorized SQL execution "
                        "delimiters were detected. This transaction has been quarantined for security."
                    )
                    break

        # 3. PII & Secrets Redaction (even if not blocked)
        redacted_any = False
        for pattern, pii_type, replacement in self.PII_SECRET_PATTERNS:
            if re.search(pattern, sanitized):
                sanitized = re.sub(pattern, replacement, sanitized)
                flagged_categories.append(f"pii_{pii_type.lower().replace(' ', '_')}")
                rule_matches.append(f"redacted_{pii_type}")
                redacted_any = True

        if redacted_any and action != "block":
            action = "redact"
            threat_level = "medium"
            self.redacted_count += 1
        elif action == "block":
            self.blocked_count += 1
        else:
            self.allowed_count += 1

        latency = round((time.perf_counter() - t0) * 1000, 3)

        return GuardrailResult(
            is_safe=(action != "block"),
            action=action,
            threat_level=threat_level,
            flagged_categories=list(dict.fromkeys(flagged_categories)),
            sanitized_text=sanitized,
            refusal_message=refusal_message,
            rule_matches=rule_matches,
            latency_ms=latency
        )

    def get_stats(self) -> Dict[str, Any]:
        return {
            "totalChecks": self.total_checks,
            "blockedCount": self.blocked_count,
            "redactedCount": self.redacted_count,
            "allowedCount": self.allowed_count,
            "tripRatePercent": round((self.blocked_count / max(1, self.total_checks)) * 100, 2)
        }

guardrail_engine = GuardrailEngine()
