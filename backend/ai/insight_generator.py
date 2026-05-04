import os
import requests

def generate_natural_language_insights(analysis_data, context):
    """
    Calls Groq API with a simple prompt (no data sent to avoid any parsing issues).
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return "Warning: GROQ_API_KEY is not set in the environment."
    
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Simple prompt without any data that could be misinterpreted
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "user", "content": "Give me 3 business insights about data analysis. Use plain text only, no images, no markdown."}
            ],
            "temperature": 0.3,
            "max_tokens": 200
        }
        
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code != 200:
            return f"API Error {response.status_code}: {response.text}"
        
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        
        return content.strip() if content else "No insights generated."
        
    except Exception as e:
        return f"Error: {str(e)}"
