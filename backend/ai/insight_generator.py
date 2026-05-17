import json
import os

import requests


def generate_natural_language_insights(analysis_data, context):
    """
    Calls Groq API using the analysis data and a user question to generate insights.
    Uses proper system/user message roles to prevent context loops.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return "Warning: GROQ_API_KEY is not set in the environment."

    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        # Truncate user-controlled analysis data to keep requests bounded.
        data_str = json.dumps(analysis_data, default=str)[:3000]
        user_question = context if context else "Generate 3-5 specific business insights based on this dataset."

        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are an expert AI data analyst. "
                        "Answer the user's question about the dataset concisely and conversationally. "
                        "Use plain text only - no markdown, no bullet asterisks, no headers. "
                        "Keep responses under 150 words unless a longer answer is clearly needed."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Dataset summary:\n{data_str}\n\nQuestion: {user_question}",
                },
            ],
            "temperature": 0.4,
            "max_tokens": 400,
        }

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30,
        )

        if response.status_code != 200:
            return f"API Error {response.status_code}: Insight generation request failed."

        result = response.json()
        content = result.get("choices", [{}])[0].get("message", {}).get("content")

        return content.strip() if content else "No insights generated."

    except requests.exceptions.RequestException:
        return "Error: Insight generation service is unavailable."
    except Exception as e:
        return f"Error: {str(e)}"
