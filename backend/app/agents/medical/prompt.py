from functools import lru_cache
from pathlib import Path

PROMPT_PATH = Path(__file__).resolve().parents[2] / "prompts" / "medical.md"


@lru_cache
def _load_raw() -> tuple[str, str]:
    raw = PROMPT_PATH.read_text(encoding="utf-8")
    _, _, rest = raw.partition("## SYSTEM")
    system_part, _, user_part = rest.partition("## USER")
    return system_part.strip(), user_part.strip()


def build_messages(document_sections: str, policy_context: str) -> list[dict]:
    system_template, user_template = _load_raw()
    user_content = user_template.format(
        policy_context=policy_context,
        document_sections=document_sections,
    )
    return [
        {"role": "system", "content": system_template},
        {"role": "user", "content": user_content},
    ]
