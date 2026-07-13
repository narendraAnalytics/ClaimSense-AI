import asyncio
from functools import lru_cache
from typing import Any

from convex import ConvexClient

from app.core.config import settings


@lru_cache
def get_convex_client() -> ConvexClient:
    client = ConvexClient(settings.convex_url)
    # Admin auth is required to call internal* functions (checkpoints.ts) —
    # these aren't exposed to the public client SDK, only to a server holding
    # the deploy key.
    client.set_admin_auth(settings.convex_deploy_key)
    return client


# convex-py has no native asyncio support (confirmed via upstream repo/docs),
# so every call is offloaded to a thread — the backend is otherwise fully
# async (FastAPI, httpx-based Sarvam/Qdrant calls).
async def convex_mutation(name: str, args: dict[str, Any]) -> Any:
    return await asyncio.to_thread(get_convex_client().mutation, name, args)


async def convex_query(name: str, args: dict[str, Any]) -> Any:
    return await asyncio.to_thread(get_convex_client().query, name, args)
