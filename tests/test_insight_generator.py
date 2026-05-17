from unittest.mock import patch
import os
import json

def test_insight_generator_with_mock():
    class DummyResponse:
        status_code = 200
        def json(self):
            return {
                "choices": [
                    {
                        "message": {
                            "content": "Sample insights:\n- Insight 1\n- Insight 2\n- Insight 3"
                        }
                    }
                ]
            }

    with patch('backend.ai.insight_generator.requests.post', return_value=DummyResponse()):
        os.environ['GROQ_API_KEY'] = 'test'
        from backend.ai.insight_generator import generate_natural_language_insights
        out = generate_natural_language_insights({'a':1}, 'context')
        assert 'Sample insights' in out
