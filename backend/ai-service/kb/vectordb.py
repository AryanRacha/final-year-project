"""
Backward compatibility layer for VectorDBClient.
Forwards imports to ai_service.vector.client.
"""
from ai_service.vector.client import VectorKBClient as VectorDBClient, ContentType

__all__ = ["VectorDBClient", "ContentType"]
