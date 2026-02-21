from io import BytesIO
from elevenlabs.client import ElevenLabs
from app.config import settings


elevenlabs_api_key = settings.ELEVENLABS_API_KEY
client = ElevenLabs(api_key=elevenlabs_api_key)

def convert_speech_to_text(audio_file: str) -> str:
    
    audio_data = BytesIO(audio_file.read())
    transcription = client.speech_to_text.convert(
        file=audio_data,
        model_id="scribe_v2",
        tag_audio_events=True,
        language_code="en",
        # diarize=True,
    )
    
    return transcription