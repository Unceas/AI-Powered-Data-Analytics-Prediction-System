from unittest.mock import patch
import os
import json

def test_insight_generator_with_mock(monkeypatch):
    class DummyResponse:
        class Choice:
            content = "Sample insights:\n- Insight 1\n- Insight 2\n- Insight 3"
        choices = [Choice()]

    class DummyGroq:
        def __init__(self, api_key=None):
            pass
        def chat(self):
            return self
        def completions(self):
            return self
        def create(self, *args, **kwargs):
            return DummyResponse()

    with patch('backend.ai.insight_generator.Groq', DummyGroq):
        os.environ['GROQ_API_KEY'] = 'test'
        from backend.ai.insight_generator import generate_natural_language_insights
        out = generate_natural_language_insights({'a':1}, 'context')
        assert 'Sample insights' in out
        
