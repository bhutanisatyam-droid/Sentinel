from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod
from datetime import datetime
from enum import Enum

class Severity(Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

@dataclass
class RuleContext:
    """
    Data context required for evaluating AML rules.
    """
    user_id: str
    transaction_amount: float
    transaction_type: str  # e.g., "CASH_DEPOSIT", "WIRE_TRANSFER", "ATM_WITHDRAWAL"
    transaction_time: datetime
    counterparty_id: Optional[str] = None
    location: Optional[tuple[float, float]] = None  # (lat, lon)
    
    # User Profile Data
    user_age_days: int = 0
    user_occupation: str = "Unemployed"
    user_risk_tier: str = "LOW"
    user_avg_transaction: float = 0.0
    user_last_activity_days: int = 0
    account_balance: float = 0.0
    
    # Historical Data
    # list of dicts: {'amount': float, 'timestamp': datetime, 'type': str, 'location': (lat, lon)}
    recent_transactions: List[Dict[str, Any]] = field(default_factory=list)
    previous_locations: List[Dict[str, Any]] = field(default_factory=list) # {'lat': float, 'lon': float, 'timestamp': datetime}
    
    # Contextual Flags
    is_whitelisted_beneficiary: bool = False
    is_festival_period: bool = False

@dataclass
class RuleResult:
    """
    The outcome of a single rule evaluation.
    """
    rule_id: str
    rule_name: str
    triggered: bool
    severity: Severity
    confidence: float  # 0.0 to 1.0
    explanation: str
    evidence: Dict[str, Any] = field(default_factory=dict)

class AMLRule(ABC):
    """
    Abstract Base Class for all Sentinel AML Rules.
    """
    
    @property
    @abstractmethod
    def rule_id(self) -> str:
        pass

    @property
    @abstractmethod
    def rule_name(self) -> str:
        pass

    @property
    @abstractmethod
    def default_severity(self) -> Severity:
        pass

    @abstractmethod
    def evaluate(self, context: RuleContext) -> RuleResult:
        """
        Evaluate the rule against the provided context.
        Returns a RuleResult.
        """
        pass
