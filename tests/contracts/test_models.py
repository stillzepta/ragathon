from app.models import ClaimSupport, RetrievedChunk, RetrievalContext


def test_retrieval_context_preserves_claim_to_chunk_contract():
    context = RetrievalContext(
        query="compare options",
        retrieved_chunks=[
            RetrievedChunk(
                chunk_id="chunk-1",
                document_id="doc-1",
                text="Evidence",
                source_url="https://example.com",
                score=0.9,
            )
        ],
        claims=[ClaimSupport(claim="Evidence exists", supported_by=["chunk-1"], support_type="direct")],
    )

    assert context.claims[0].supported_by == ["chunk-1"]

