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
                            "content": '[{"category": "Prediction", "finding": "Sample insights"}]'
                        }
                    }
                ]
            }

    with patch('backend.ai.insight_generator.requests.post', return_value=DummyResponse()):
        os.environ['GROQ_API_KEY'] = 'test'
        from backend.ai.insight_generator import generate_natural_language_insights
        out = generate_natural_language_insights({'a':1}, 'context')
        assert isinstance(out, list)
        assert out[0]['finding'] == 'Sample insights'
