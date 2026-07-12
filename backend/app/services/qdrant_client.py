import uuid
from functools import lru_cache

from qdrant_client import QdrantClient, models

from app.core.config import settings

# Only completed-claim summaries are embedded here (diagnosis, claim type,
# payable amount, fraud score, settlement decision) — never raw documents,
# per workflow.txt's guidance to keep Qdrant usage narrow.
CLAIM_HISTORY_COLLECTION = "claim_history"

# QdrantClient.DEFAULT_EMBEDDING_MODEL — named explicitly (rather than left
# implicit like the deprecated add()/query() helpers used to) since upsert()/
# query_points() require the model name on every models.Document.
EMBEDDING_MODEL = "BAAI/bge-small-en"


@lru_cache
def get_qdrant_client() -> QdrantClient:
    return QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key)


def claim_point_id(claim_id: str) -> str:
    # Qdrant point IDs must be an unsigned int or UUID; claim_id is
    # "CLM-<hex>" (app/utils/ids.py), so derive a deterministic UUID from it
    # instead. The real claim_id is kept in the point's payload.
    return str(uuid.uuid5(uuid.NAMESPACE_URL, claim_id))


def ensure_collection(client: QdrantClient, collection_name: str) -> None:
    if not client.collection_exists(collection_name):
        client.create_collection(
            collection_name=collection_name,
            vectors_config=client.get_fastembed_vector_params(),
        )
        # find_similar_claims() filters on claim_id (must_not, to exclude a
        # claim matching itself) - Qdrant requires a payload index to filter
        # on a field.
        client.create_payload_index(
            collection_name=collection_name,
            field_name="claim_id",
            field_schema=models.PayloadSchemaType.KEYWORD,
        )


def vector_name(client: QdrantClient) -> str:
    # get_fastembed_vector_params() names the vector after the embedding
    # model (e.g. "fast-bge-small-en", not the raw "BAAI/bge-small-en"
    # EMBEDDING_MODEL string) - both upsert and query_points need this exact
    # named-vector key.
    return next(iter(client.get_fastembed_vector_params().keys()))
