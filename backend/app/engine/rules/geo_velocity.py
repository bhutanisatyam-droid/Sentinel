import math
from datetime import datetime
from app.engine.rules.base import AMLRule, RuleContext, RuleResult, Severity

class GeoVelocityRule(AMLRule):
    """
    Contextual Rule: Detects 'Impossible Travel' based on speed between locations.
    """

    MAX_SPEED_MPH = 650.0
    MIN_DISTANCE_MILES = 50.0
    MIN_TIME_GAP_MINUTES = 5.0

    @property
    def rule_id(self) -> str:
        return "R-404"

    @property
    def rule_name(self) -> str:
        return "Geo-Velocity (Impossible Travel)"

    @property
    def default_severity(self) -> Severity:
        return Severity.HIGH

    def _haversine_miles(self, lat1, lon1, lat2, lon2):
        R = 3958.8 # Earth radius in miles
        
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) * math.sin(dlon / 2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def evaluate(self, context: RuleContext) -> RuleResult:
        triggered = False
        confidence = 0.0
        explanation = ""
        evidence = {}

        if not context.location or not context.previous_locations:
            return RuleResult(self.rule_id, self.rule_name, False, self.default_severity, 0.0, "")

        curr_lat, curr_lon = context.location
        curr_time = context.transaction_time

        # Compare with the most recent location that has a valid timestamp
        # Sorting previous locations by time descending
        sorted_locs = sorted(
            [loc for loc in context.previous_locations if loc.get('timestamp') and loc.get('lat')],
            key=lambda x: x['timestamp'],
            reverse=True
        )

        if not sorted_locs:
             return RuleResult(self.rule_id, self.rule_name, False, self.default_severity, 0.0, "")

        prev = sorted_locs[0]
        prev_lat, prev_lon = prev['lat'], prev['lon']
        prev_time = prev['timestamp']

        # Time difference in hours
        time_diff_hours = (curr_time - prev_time).total_seconds() / 3600.0
        
        # Ignore if time gap is too small (avoid simultaneous VPN/artifact issues)
        if time_diff_hours * 60 < self.MIN_TIME_GAP_MINUTES:
             return RuleResult(self.rule_id, self.rule_name, False, self.default_severity, 0.0, "")

        distance = self._haversine_miles(prev_lat, prev_lon, curr_lat, curr_lon)

        # Ignore short distances (same city)
        if distance < self.MIN_DISTANCE_MILES:
             return RuleResult(self.rule_id, self.rule_name, False, self.default_severity, 0.0, "")

        # Calculate Speed
        speed = distance / time_diff_hours if time_diff_hours > 0 else float('inf')

        if speed > self.MAX_SPEED_MPH:
            triggered = True
            
            # Confidence scales with how much we exceeded the speed limit
            ratio = speed / self.MAX_SPEED_MPH
            # 1.0x -> 0.6, 2.0x -> 0.9, >3.0x -> 0.99
            confidence = 0.6 + (min(ratio, 3.0) - 1.0) * 0.2
            confidence = min(confidence, 0.99)

            explanation = (f"Implied travel speed of {speed:.0f} mph exceeds plausible limit "
                           f"({self.MAX_SPEED_MPH} mph) between locations.")
            
            evidence = {
                'from_coords': (prev_lat, prev_lon),
                'to_coords': (curr_lat, curr_lon),
                'distance_miles': round(distance, 2),
                'time_gap_hours': round(time_diff_hours, 2),
                'implied_speed': round(speed, 2)
            }

        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            triggered=triggered,
            severity=self.default_severity,
            confidence=confidence,
            explanation=explanation,
            evidence=evidence
        )
