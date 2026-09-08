from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app


def test_chat_rejects_empty_message():
    client = TestClient(app)
    response = client.post(
        "/api/v1/chat/",
        json={"message": "", "session_id": "visitor-1", "language": "fr"},
    )
    assert response.status_code == 422


def test_chat_requires_api_key(monkeypatch):
    monkeypatch.setattr(settings, "CRAFTI_API_KEY", "")
    client = TestClient(app)
    response = client.post(
        "/api/v1/chat/",
        json={
            "message": "Quels services propose Crafti ?",
            "session_id": "visitor-1",
            "language": "fr",
        },
    )
    assert response.status_code == 503
    assert "configured" in response.json()["detail"].lower()


def test_chat_proxies_json_response(monkeypatch):
    monkeypatch.setattr(settings, "CRAFTI_API_KEY", "pk_test_not_a_real_key")

    class FakeResponse:
        status_code = 200
        content = b'{"success": true, "answer": "Crafti propose des services."}'

        def json(self):
            return {"success": True, "answer": "Crafti propose des services."}

    class FakeClient:
        def __init__(self, **_kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return False

        async def post(self, url, headers, json):
            assert url.endswith("/api/v1/chat/")
            assert headers["X-API-Key"] == "pk_test_not_a_real_key"
            assert "tenant_id" not in json
            assert json["message"] == "Quels services propose Crafti ?"
            return FakeResponse()

    monkeypatch.setattr("app.api.chat.httpx.AsyncClient", FakeClient)
    client = TestClient(app)
    response = client.post(
        "/api/v1/chat/",
        json={
            "message": "Quels services propose Crafti ?",
            "session_id": "visitor-1",
            "language": "fr",
        },
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert "Crafti" in response.json()["answer"]
