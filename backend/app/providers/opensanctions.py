import httpx
from typing import Dict, Any, List, Optional
from app.providers.base import SanctionsProvider
from app.config import get_settings
import asyncio
from unidecode import unidecode
# In a real scenario, we would import the analytics client to log audits
# from app.lib.analytics import log_audit 

settings = get_settings()

class OpenSanctionsProvider(SanctionsProvider):
    def __init__(self):
        self.api_key = settings.OPENSANCTIONS_API_KEY
        self.base_url = "https://api.opensanctions.org"
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={"Authorization": f"ApiKey {self.api_key}"},
            timeout=5.0
        )

    def _normalize_name(self, name: str) -> List[str]:
        """
        Returns multiple variants: original, unidecoded, lowercase.
        """
        variants = {name, name.lower(), unidecode(name), unidecode(name).lower()}
        return list(variants)

    async def screen_entity(self, name: str, dob: Optional[str] = None, nationality: Optional[str] = None) -> Dict[str, Any]:
        normalized_names = self._normalize_name(name)
        # We use the primary name for the initial query
        primary_name = normalized_names[-1] 

        payload = {
            "queries": {
                "q1": {
                    "schema": "Person",
                    "properties": {
                        "name": [primary_name]
                    }
                }
            }
        }

        if dob:
            payload["queries"]["q1"]["properties"]["birthDate"] = [dob]
        if nationality:
            payload["queries"]["q1"]["properties"]["nationality"] = [nationality]

        retries = 3
        for attempt in range(retries):
            try:
                response = await self.client.post("/match/default", json=payload)
                response.raise_for_status()
                data = response.json()
                
                results = data.get("responses", {}).get("q1", {}).get("results", [])
                
                matches = []
                highest_score = 0.0
                
                for res in results:
                    score = res.get("score", 0.0)
                    if score > highest_score:
                        highest_score = score
                    
                    matches.append({
                        "name": res.get("caption"),
                        "score": score,
                        "list": "OpenSanctions", # The API aggregates many lists, we could parse 'datasets'
                        "reason": res.get("properties", {}).get("notes", ["Match found"])[0] 
                    })

                return {
                    "hit": len(matches) > 0 and highest_score > 0.7, # Threshold can be adjustable
                    "matches": matches,
                    "highest_score": highest_score
                }

            except httpx.HTTPError:
                if attempt == retries - 1:
                    # TODO: Fallback to local cache in Supabase would go here
                    # For now, return UNKNOWN as per strict directive
                    return {"hit": "UNKNOWN", "error": "OpenSanctions API unreachable and no local cache"}
                await asyncio.sleep(2 ** attempt) # Exponential backoff

        return {"hit": "UNKNOWN", "error": "Unexpected execution path"}
