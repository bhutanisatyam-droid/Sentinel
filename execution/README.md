# Execution (Layer 3)

This directory contains deterministic Python scripts that perform the actual work.

- Use `.env` in the parent directory for API keys and configuration.
- Scripts should be reliable, testable, and fast.
- Do not put hardcoded credentials here.

**Usage:**
These scripts are called by the agent (Layer 2) based on the instructions in `../directives/`.

See `../AGENTS.md` for more details on the 3-Layer Architecture.
