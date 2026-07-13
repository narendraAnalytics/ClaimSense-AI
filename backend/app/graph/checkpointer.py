import base64
import json
from collections.abc import AsyncIterator, Sequence
from functools import lru_cache
from typing import Any

from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.base import (
    WRITES_IDX_MAP,
    BaseCheckpointSaver,
    ChannelVersions,
    Checkpoint,
    CheckpointMetadata,
    CheckpointTuple,
    get_checkpoint_id,
    get_checkpoint_metadata,
)
from langgraph.checkpoint.serde.jsonplus import JsonPlusSerializer

from app.services.convex_client import convex_mutation, convex_query

# allowed_msgpack_modules=True: ClaimState is full of this app's own Pydantic
# models (PolicyResult, MedicalResult, ...) and enums — trusted internal
# data, not untrusted external input, so unrestricted deserialization is
# safe here. Note this is LangGraph's permissive *default* already (it just
# makes the choice explicit) — it still logs a one-time-per-type warning on
# every unregistered class ("will be blocked in a future version"), it just
# doesn't refuse to deserialize. Silencing the warning entirely would mean
# hand-maintaining an exact (module, classname) allowlist for every model/
# enum ClaimState ever holds — not worth the upkeep for a non-fatal log line.
_SERDE = JsonPlusSerializer(allowed_msgpack_modules=True)


def _encode(obj: Any) -> tuple[str, str]:
    type_, raw = _SERDE.dumps_typed(obj)
    return type_, base64.b64encode(raw).decode("ascii")


def _decode(type_: str, data: str) -> Any:
    return _SERDE.loads_typed((type_, base64.b64decode(data)))


def _args(**kwargs: Any) -> dict[str, Any]:
    # Convex's `v.optional(...)` validator expects the key to be absent, not
    # explicitly `null` — drop None values rather than sending them.
    return {k: v for k, v in kwargs.items() if v is not None}


class ConvexSaver(BaseCheckpointSaver[str]):
    """LangGraph checkpointer backed by Convex (frontend/convex/checkpoints.ts).

    Stores each checkpoint as a single serialized blob (whole `Checkpoint`
    dict, including `channel_values`) rather than InMemorySaver's/
    AsyncPostgresSaver's per-channel-versioned blobs — simpler, and the
    per-channel optimization isn't needed at this app's scale.
    """

    def __init__(self) -> None:
        super().__init__(serde=_SERDE)

    async def aget_tuple(self, config: RunnableConfig) -> CheckpointTuple | None:
        thread_id: str = config["configurable"]["thread_id"]
        checkpoint_ns: str = config["configurable"].get("checkpoint_ns", "")
        checkpoint_id = get_checkpoint_id(config)

        row = await convex_query(
            "checkpoints:getLatestCheckpoint",
            _args(threadId=thread_id, checkpointNs=checkpoint_ns, checkpointId=checkpoint_id),
        )
        if row is None:
            return None
        return await self._build_tuple(thread_id, checkpoint_ns, row)

    async def _build_tuple(
        self, thread_id: str, checkpoint_ns: str, row: dict[str, Any]
    ) -> CheckpointTuple:
        checkpoint: Checkpoint = _decode(row["type"], row["checkpoint"])
        meta_wrapper = json.loads(row["metadata"])
        metadata: CheckpointMetadata = _decode(meta_wrapper["type"], meta_wrapper["data"])

        writes_rows = await convex_query(
            "checkpoints:getWrites",
            _args(threadId=thread_id, checkpointNs=checkpoint_ns, checkpointId=row["checkpointId"]),
        )
        pending_writes = [
            (w["taskId"], w["channel"], _decode(w["type"], w["value"])) for w in writes_rows
        ]

        parent_checkpoint_id = row.get("parentCheckpointId")
        parent_config = (
            {
                "configurable": {
                    "thread_id": thread_id,
                    "checkpoint_ns": checkpoint_ns,
                    "checkpoint_id": parent_checkpoint_id,
                }
            }
            if parent_checkpoint_id
            else None
        )

        return CheckpointTuple(
            config={
                "configurable": {
                    "thread_id": thread_id,
                    "checkpoint_ns": checkpoint_ns,
                    "checkpoint_id": row["checkpointId"],
                }
            },
            checkpoint=checkpoint,
            metadata=metadata,
            parent_config=parent_config,
            pending_writes=pending_writes,
        )

    async def aput(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: ChannelVersions,
    ) -> RunnableConfig:
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        parent_checkpoint_id = config["configurable"].get("checkpoint_id")

        ckpt_type, ckpt_data = _encode(checkpoint)
        meta_type, meta_data = _encode(get_checkpoint_metadata(config, metadata))

        await convex_mutation(
            "checkpoints:putCheckpoint",
            _args(
                threadId=thread_id,
                checkpointNs=checkpoint_ns,
                checkpointId=checkpoint["id"],
                parentCheckpointId=parent_checkpoint_id,
                type=ckpt_type,
                checkpoint=ckpt_data,
                metadata=json.dumps({"type": meta_type, "data": meta_data}),
            ),
        )

        return {
            "configurable": {
                "thread_id": thread_id,
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": checkpoint["id"],
            }
        }

    async def aput_writes(
        self,
        config: RunnableConfig,
        writes: Sequence[tuple[str, Any]],
        task_id: str,
        task_path: str = "",
    ) -> None:
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        checkpoint_id = config["configurable"]["checkpoint_id"]

        encoded_writes = []
        for idx, (channel, value) in enumerate(writes):
            type_, data = _encode(value)
            encoded_writes.append(
                {
                    "taskId": task_id,
                    "idx": WRITES_IDX_MAP.get(channel, idx),
                    "channel": channel,
                    "type": type_,
                    "value": data,
                }
            )

        await convex_mutation(
            "checkpoints:putWrites",
            _args(
                threadId=thread_id,
                checkpointNs=checkpoint_ns,
                checkpointId=checkpoint_id,
                writes=encoded_writes,
            ),
        )

    async def alist(
        self,
        config: RunnableConfig | None,
        *,
        filter: dict[str, Any] | None = None,
        before: RunnableConfig | None = None,
        limit: int | None = None,
    ) -> AsyncIterator[CheckpointTuple]:
        if config is None:
            return
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        before_id = get_checkpoint_id(before) if before else None

        rows = await convex_query(
            "checkpoints:listCheckpoints",
            _args(threadId=thread_id, checkpointNs=checkpoint_ns, before=before_id, limit=limit),
        )
        for row in rows:
            tup = await self._build_tuple(thread_id, checkpoint_ns, row)
            if filter and not all(
                query_value == tup.metadata.get(query_key)
                for query_key, query_value in filter.items()
            ):
                continue
            yield tup

    async def adelete_thread(self, thread_id: str) -> None:
        await convex_mutation("checkpoints:deleteThread", {"threadId": thread_id})


@lru_cache
def get_checkpointer() -> ConvexSaver:
    return ConvexSaver()
