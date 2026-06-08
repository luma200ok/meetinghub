from openai import OpenAI
from flask import current_app


def get_openai() -> OpenAI:
    return OpenAI(api_key=current_app.config['OPENAI_API_KEY'])
