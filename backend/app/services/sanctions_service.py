import asyncio
import logging
import re
import uuid
import httpx
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Union
from unidecode import unidecode

logger = logging.getLogger(__name__)

class SanctionsScreeningService:
    """
    Sanctions screening service for VigilanceOS.
    Ensures strict PMLA compliance, homoglyph attack prevention, and fail-close screening.
    """
    
    # Common transliteration sets to generate name variants
    TRANSLITERATIONS = [
        {"muhammad", "mohammed", "mohammad", "mohamed", "muhammed"},
        {"osama", "usama"},
        {"omar", "umar"}
    ]
    
    # Honorifics to strip during normalization
    HONORIFICS_REGEX = re.compile(r'\b(mr|mrs|ms|dr|shri|smt|prof|sir|madam)\b', re.IGNORECASE)

    def __init__(self, sanctions_provider, supabase_client):
        """
        Initializes the screening service.
        :param sanctions_provider: Interface to the OpenSanctions API layer.
        :param supabase_client: Supabase client for cache and audit log access.
        """
        self.provider = sanctions_provider
        self.supabase = supabase_client

    def _normalize_and_generate_variants(self, raw_name: str) -> List[str]:
        """
        Step 1: Normalize the name and generate variants.
        Defeats Unicode homoglyph attacks (e.g., Cyrillic 'О' to Latin 'O') via unidecode.
        """
        if not raw_name:
            return []

        variants = set()
        
        # Original (just trimmed)
        original = raw_name.strip()
        if original:
            variants.add(original)
            
        # Unidecoded and lowercase (Defeats homoglyphs)
        safe_name = unidecode(original).lower()
        
        # Strip honorifics and extra whitespace
        safe_name = self.HONORIFICS_REGEX.sub('', safe_name)
        safe_name = re.sub(r'\s+', ' ', safe_name).strip()
        
        if safe_name:
            variants.add(safe_name)
            
            # Generate common transliteration variants
            name_parts = safe_name.split()
            for part in name_parts:
                for trans_set in self.TRANSLITERATIONS:
                    if part in trans_set:
                        for variant_part in trans_set:
                            if variant_part != part:
                                new_name = safe_name.replace(part, variant_part)
                                variants.add(new_name)

        return list(variants)

    async def screen_user(self, name: str, dob: Optional[str] = None, nationality: Optional[str] = None) -> Dict[str, Any]:
        """
        Screens a user against sanctions lists using local pg_trgm cache and fallback API.
        CRITICAL: Never returns hit=False if verification is incomplete.
        """
        screening_id = str(uuid.uuid4())
        variants = self._normalize_and_generate_variants(name)
        
        if not variants:
            raise ValueError("Invalid name provided for screening.")

        highest_score = 0.0
        all_matches = {}
        source = "none"
        api_unreachable = False
        cache_hit_found = False

        # Step 2: Check local cache FIRST
        try:
            for variant in variants:
                # Assuming a Supabase RPC exists that utilizes pg_trgm: 
                # CREATE FUNCTION match_sanctions(search_name text, threshold float) ...
                cache_response = self.supabase.rpc(
                    'match_sanctions', 
                    {'search_name': variant, 'threshold': 0.7}
                ).execute()
                
                cache_results = cache_response.data or []
                
                for match in cache_results:
                    score = float(match.get("similarity_score", 0.0))
                    match_id = match.get("id", variant)
                    
                    if match_id not in all_matches or score > all_matches[match_id]["score"]:
                        all_matches[match_id] = {
                            "name": match.get("name"),
                            "score": score,
                            "list": match.get("sanctions_list", "Cache"),
                            "reason": match.get("reason", "Local DB Match")
                        }
                    
                    if score > highest_score:
                        highest_score = score

            if highest_score > 0.0:
                source = "cache"

            # Immediate exit if cache confidence is very high
            if highest_score > 0.85:
                cache_hit_found = True

        except Exception as e:
            logger.error(f"[{screening_id}] Cache lookup failed: {str(e)}")
            # Continue to API if cache fails completely

        # Step 3: Call OpenSanctions API if cache is inconclusive (< 0.85)
        if not cache_hit_found:
            api_highest_score = 0.0
            api_matches = []
            
            try:
                # Concurrent calls for all variants to the provider
                tasks = [
                    self.provider.screen_async(name=v, dob=dob, nationality=nationality) 
                    for v in variants
                ]
                api_results = await asyncio.gather(*tasks, return_exceptions=True)
                
                for res in api_results:
                    if isinstance(res, Exception):
                        raise res
                    
                    for match in res.get("matches", []):
                        score = float(match.get("score", 0.0))
                        api_matches.append(match)
                        if score > api_highest_score:
                            api_highest_score = score
                            
                # Merge and deduplicate API results with Cache results
                for match in api_matches:
                    match_id = match.get("id", match.get("name"))
                    score = float(match.get("score", 0.0))
                    
                    if match_id not in all_matches or score > all_matches[match_id]["score"]:
                        all_matches[match_id] = {
                            "name": match.get("name"),
                            "score": score,
                            "list": match.get("list", "OpenSanctions API"),
                            "reason": match.get("reason", "API Match")
                        }
                    
                    if score > highest_score:
                        highest_score = score
                        
                source = "both" if source == "cache" else "api"
                
            except Exception as e:
                logger.error(f"[{screening_id}] API unreachable/failed: {str(e)}")
                api_unreachable = True

        # Step 4: Combine results and determine hit status
        final_matches = list(all_matches.values())
        final_matches.sort(key=lambda x: x["score"], reverse=True)

        hit: Union[bool, str] = False

        if highest_score > 0.80:
            hit = True
        elif api_unreachable and source == "none":
            # Requirement 1: MUST NEVER return hit=False when it can't actually verify.
            hit = "UNKNOWN"
        elif api_unreachable and highest_score < 0.80:
            # If API is down and cache doesn't give a definitive hit, we cannot safely say "CLEAN"
            hit = "UNKNOWN"

        result_payload = {
            "hit": hit,
            "matches": final_matches,
            "highest_score": highest_score,
            "source": source,
            "screened_variants": variants,
            "screening_id": screening_id
        }

        # Step 5: Log the screening event (PMLA Compliance - 5-year retention)
        try:
            audit_record = {
                "screening_id": screening_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "user_name_raw": name,
                "user_dob": dob,
                "user_nationality": nationality,
                "hit_status": str(hit),
                "highest_score": highest_score,
                "source": source,
                "payload": result_payload
            }
            self.supabase.table('screening_audit_log').insert(audit_record).execute()
        except Exception as e:
            logger.critical(f"[{screening_id}] CRITICAL: Failed to write to audit log: {str(e)}")
            # Depending on strictness, you might want to raise here to prevent un-logged screenings from proceeding.

        return result_payload

    async def sync_sanctions_cache(self):
        """
        Nightly batch job to download, parse, and upsert latest sanctions data.
        """
        url = "https://data.opensanctions.org/datasets/latest/default/entities.ftm.json"
        logger.info("Starting OpenSanctions cache synchronization...")
        
        try:
            async with httpx.AsyncClient() as client:
                # Streaming the bulk download to handle large JSON lines files
                async with client.stream('GET', url) as response:
                    response.raise_for_status()
                    
                    batch = []
                    batch_size = 500
                    
                    async for line in response.aiter_lines():
                        if not line.strip():
                            continue
                            
                        entity = json.loads(line)
                        schema = entity.get("schema")
                        
                        # Only care about people or legal entities
                        if schema not in ("Person", "LegalEntity", "Company", "Organization"):
                            continue
                            
                        name = entity.get("caption")
                        if not name:
                            continue
                            
                        normalized_name = unidecode(name).lower()
                        normalized_name = self.HONORIFICS_REGEX.sub('', normalized_name).strip()
                        
                        # Prepare for upsert
                        record = {
                            "id": entity.get("id"),
                            "name": name,
                            "normalized_name": normalized_name,
                            "sanctions_list": "OpenSanctions Default",
                            "last_synced": datetime.now(timezone.utc).isoformat()
                        }
                        batch.append(record)
                        
                        if len(batch) >= batch_size:
                            self.supabase.table('sanctions_cache').upsert(batch).execute()
                            batch = []
                            
                    # Flush remaining
                    if batch:
                        self.supabase.table('sanctions_cache').upsert(batch).execute()
                        
            logger.info("Sanctions cache synchronization complete.")
            
        except Exception as e:
            logger.error(f"Failed to sync sanctions cache: {str(e)}")
            raise

    async def batch_screen(self, users: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Screens multiple users concurrently.
        Limits concurrency to 10 requests to avoid API throttling.
        """
        semaphore = asyncio.Semaphore(10)
        
        async def bounded_screen(user: Dict[str, Any]):
            async with semaphore:
                return await self.screen_user(
                    name=user.get("name", ""),
                    dob=user.get("dob"),
                    nationality=user.get("nationality")
                )

        tasks = [bounded_screen(user) for user in users]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Format results, handling any individual user exceptions securely
        formatted_results = []
        for i, res in enumerate(results):
            if isinstance(res, Exception):
                logger.error(f"Batch screening failed for user index {i}: {str(res)}")
                formatted_results.append({
                    "hit": "UNKNOWN",
                    "error": str(res),
                    "screening_id": str(uuid.uuid4())
                })
            else:
                formatted_results.append(res)
                
        return formatted_results
