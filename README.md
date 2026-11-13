# Local Voice Agent

A locally hosted, AI-powered Voice Agent that can communicate with customers in **Tamil and English** using speech-to-text (STT), a local LLM, product information, and text-to-speech (TTS).

This project is designed as a low-cost prototype that runs on a local Ubuntu machine without requiring paid AI APIs.

It supports simulated inbound and outbound calls through a browser interface.

---

## 1. Project Overview

The Voice Agent can:

- Receive simulated inbound customer calls.
- Initiate simulated outbound customer calls.
- Understand spoken Tamil and English.
- Convert customer speech into text.
- Generate AI responses using a local LLM.
- Retrieve product information from local data.
- Convert AI responses into speech.
- Play generated voice responses in the browser.
- Maintain basic call sessions.
- Display customer conversations and transcripts.

**Important:** This is a local browser-based calling prototype. Actual telephone calls over PSTN/mobile networks require a telephony provider or SIP/PBX integration.

---

## 2. Technology Stack

| Component            | Technology            |
| -------------------- | --------------------- |
| Operating System     | Ubuntu Linux          |
| Backend              | Node.js + Express     |
| Speech-to-Text       | Faster-Whisper        |
| AI / LLM             | Ollama                |
| LLM Model            | Qwen 2.5 3B           |
| Text-to-Speech       | eSpeak NG             |
| STT API              | Python + FastAPI      |
| Frontend             | HTML, CSS, JavaScript |
| Audio Processing     | FFmpeg                |
| Database (prototype) | Local JSON            |
| Python               | 3.12                  |
| Package Manager      | npm + pip             |

---

## 3. System Architecture

```text
                 CUSTOMER
                    |
                    |
             Browser Microphone
                    |
                    v
             Audio Recording
                    |
                    v
          Node.js / Express Backend
                    |
                    v
           Python FastAPI Service
                    |
                    v
              Faster-Whisper
                    |
                    v
             Recognized Text
                    |
                    v
               Ollama LLM
                    |
                    v
             Qwen 2.5 3B
                    |
                    v
            Product Lookup
                    |
                    v
             AI Generated Reply
                    |
                    v
                eSpeak NG
                    |
                    v
               Generated WAV
                    |
                    v
             Browser Audio Player
                    |
                    v
                 CUSTOMER
```

### Request Flow

1. Customer speaks through the browser microphone.
2. Browser records audio.
3. Audio is submitted to the Node.js backend.
4. Node.js forwards the audio to the Python STT service.
5. Faster-Whisper converts speech into text.
6. Node.js retrieves relevant product information.
7. Ollama generates a response using Qwen 2.5 3B.
8. eSpeak NG converts the response into speech.
9. The backend returns the response and audio URL.
10. The browser plays the generated audio.

---

## 4. Hardware Requirements

Recommended development environment:

| Resource | Requirement                                            |
| -------- | ------------------------------------------------------ |
| OS       | Ubuntu 22.04 or later                                  |
| RAM      | 16 GB recommended                                      |
| CPU      | Modern multi-core processor                            |
| Storage  | 10 GB or more free space                               |
| GPU      | Optional                                               |
| Internet | Required initially for downloading models and packages |

The prototype can run on CPU. However, STT and LLM inference may take longer without a GPU.

---

# 5. Project Structure

```text
crm-voice-agent/
│
├── server/
│   ├── src/
│   │   └── server.js
│   │
│   ├── data/
│   │   └── products.json
│   │
│   ├── uploads/
│   │
│   ├── package.json
│   └── .env
│
├── stt/
│   ├── app.py
│   ├── requirements.txt
│   └── venv/
│
├── public/
│   └── index.html
│
└── README.md
```

---

# 6. Installation and Setup

## Step 1: Install System Dependencies

Update Ubuntu:

```bash
sudo apt update
sudo apt upgrade -y
```

Install required packages:

```bash
sudo apt install -y \
  curl \
  git \
  ffmpeg \
  espeak-ng \
  python3 \
  python3-pip \
  python3-venv \
  build-essential \
  pkg-config \
  portaudio19-dev
```

Verify installations:

```bash
node --version
npm --version
python3 --version
ffmpeg -version
espeak-ng --version
```

## Step 2: Install Node.js 22

If Node.js is not installed:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

sudo apt install -y nodejs
```

Verify:

```bash
node --version
npm --version
```

## Step 3: Install Ollama

Install Ollama:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Start the service:

```bash
sudo systemctl enable ollama
sudo systemctl start ollama
```

Verify:

```bash
ollama --version
```

Download the language model:

```bash
ollama pull qwen2.5:3b
```

Test the model:

```bash
ollama run qwen2.5:3b
```

Example:

```text
User: வணக்கம், உங்களிடம் என்ன products இருக்கிறது?

Assistant: வணக்கம்! எங்களிடம் பல வகையான products உள்ளன.
உங்களுக்கு எந்த product தேவை?
```

Exit Ollama:

```text
/bye
```

## Step 4: Configure Python 3.12

Use Python 3.12 for compatibility with Faster-Whisper and PyAV.

Install `uv`:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Add it to PATH:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Verify:

```bash
uv --version
```

Install Python 3.12:

```bash
uv python install 3.12
```

Navigate to the STT directory:

```bash
cd ~/Desktop/voice-agent/stt
```

Create a virtual environment:

```bash
uv venv venv --python 3.12
```

Activate it:

```bash
source venv/bin/activate
```

Verify:

```bash
python --version
which python
python -m pip --version
```

Expected:

```text
Python 3.12.x
.../stt/venv/bin/python
```

## Step 5: Install Faster-Whisper

Upgrade pip:

```bash
python -m pip install --upgrade pip setuptools wheel
```

Install PyAV using a prebuilt wheel:

```bash
python -m pip install --only-binary=:all: av
```

Install the STT dependencies:

```bash
python -m pip install \
  faster-whisper \
  fastapi \
  "uvicorn[standard]" \
  python-multipart
```

Verify:

```bash
python -c "import av; print('PyAV:', av.__version__)"

python -c "from faster_whisper import WhisperModel; print('Faster Whisper installed successfully')"

python -c "import fastapi; print('FastAPI:', fastapi.__version__)"
```

---

# 7. Speech-to-Text Configuration

The STT service uses Faster-Whisper.

Recommended initial model:

```python
model = WhisperModel(
    "small",
    device="cpu",
    compute_type="int8"
)
```

Supported model sizes include:

| Model    | Resource Usage | Accuracy                 |
| -------- | -------------- | ------------------------ |
| tiny     | Very low       | Basic                    |
| base     | Low            | Moderate                 |
| small    | Moderate       | Good                     |
| medium   | High           | Better                   |
| large-v3 | Very high      | Best among these options |

For a 16 GB RAM machine, start with `small`.

The model supports multilingual speech recognition, including Tamil and English.

## Start STT Server

Navigate to the STT directory:

```bash
cd ~/Desktop/voice-agent/stt
```

Activate the virtual environment:

```bash
source venv/bin/activate
```

Start FastAPI:

```bash
uvicorn app:app --host 127.0.0.1 --port 8001
```

API documentation:

```text
http://127.0.0.1:8001/docs
```

Keep this terminal running.

---

# 8. Text-to-Speech Configuration

The prototype uses eSpeak NG.

Verify available voices:

```bash
espeak-ng --voices
```

Check Tamil:

```bash
espeak-ng --voices=ta
```

Check English:

```bash
espeak-ng --voices=en
```

Generate Tamil speech:

```bash
espeak-ng -v ta "வணக்கம்! எப்படி இருக்கிறீர்கள்?" -w tamil.wav
```

Generate English speech:

```bash
espeak-ng -v en "Hello! How can I help you today?" -w english.wav
```

Play the audio:

```bash
ffplay tamil.wav
```

**Note:** eSpeak NG provides basic, robotic speech. For more natural Tamil and English voices, a neural TTS engine can be integrated later.

---

# 9. Backend Setup

Navigate to the backend:

```bash
cd ~/Desktop/voice-agent/server
```

Install Node.js dependencies:

```bash
npm install
```

Typical dependencies:

```bash
npm install express cors multer dotenv axios uuid ollama
```

Development dependency:

```bash
npm install --save-dev nodemon
```

Create `.env`:

```env
PORT=5000

STT_URL=http://127.0.0.1:8001

OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b

UPLOAD_DIR=uploads

NODE_ENV=development
```

Start the backend:

```bash
npm run dev
```

Or:

```bash
npm start
```

Backend URL:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/voice/health
```

---

# 10. Product Data

The prototype stores product information in:

```text
server/data/products.json
```

Example:

```json
[
  {
    "id": 1,
    "name": "Premium Laptop",
    "price": 65000,
    "stock": 12,
    "description": "High-performance laptop"
  },
  {
    "id": 2,
    "name": "Wireless Headphones",
    "price": 2500,
    "stock": 30,
    "description": "Wireless Bluetooth headphones"
  },
  {
    "id": 3,
    "name": "Smart Watch",
    "price": 4500,
    "stock": 8,
    "description": "Smart watch with fitness tracking"
  }
]
```

The backend can retrieve matching products and provide their information to the LLM.

The AI should only answer product questions using the available data. It should not invent prices or stock availability.

---

# 11. Frontend Setup

The frontend is located at:

```text
public/index.html
```

The browser interface should support:

- Start inbound call simulation.
- Start outbound call simulation.
- End call.
- Microphone recording.
- Text input for testing.
- Customer transcript.
- AI response display.
- Audio playback.
- Call status.

For microphone access, use localhost:

```text
http://localhost:5000
```

Browser microphone access is generally restricted to secure contexts such as HTTPS and localhost.

---

# 12. API Endpoints

The prototype backend exposes these endpoints:

| Method | Endpoint                     | Description                    |
| ------ | ---------------------------- | ------------------------------ |
| GET    | `/api/voice/health`          | Backend health check           |
| POST   | `/api/voice/turn`            | Process customer text or audio |
| GET    | `/api/voice/audio/:filename` | Retrieve generated audio       |
| POST   | `/api/voice/end`             | End a call session             |

### STT API

| Method | Endpoint      | Description                      |
| ------ | ------------- | -------------------------------- |
| POST   | `/transcribe` | Convert uploaded audio into text |

FastAPI documentation:

```text
http://127.0.0.1:8001/docs
```

---

# 13. Running the Complete Project

Open three separate terminals.

### Terminal 1: Ollama

```bash
ollama serve
```

If the Ollama system service is already running, you do not need to run this command again.

### Terminal 2: Faster-Whisper

```bash
cd ~/Desktop/voice-agent/stt

source venv/bin/activate

uvicorn app:app --host 127.0.0.1 --port 8001
```

### Terminal 3: Node.js Backend

```bash
cd ~/Desktop/voice-agent/server

npm run dev
```

Open the frontend:

```text
http://localhost:5000
```

You can now test simulated inbound and outbound calls.

---

# 14. Tamil and English Conversation Examples

### Tamil

Customer:

```text
வணக்கம், எனக்கு ஒரு லேப்டாப் வாங்க வேண்டும்.
```

AI:

```text
வணக்கம்! நிச்சயமாக உதவுகிறேன்.
எங்களிடம் Premium Laptop உள்ளது.
அதன் விலை ரூபாய் 65,000.
```

### English

Customer:

```text
What is the price of your wireless headphones?
```

AI:

```text
Our wireless headphones cost ₹2,500.
We currently have 30 units in stock.
```

### Mixed Tamil and English

Customer:

```text
Smart Watch price என்ன?
```

AI:

```text
Smart Watch price ₹4,500.
Currently, 8 units are available.
```

---

# 15. Troubleshooting

## Python: externally-managed-environment

Use a virtual environment:

```bash
source venv/bin/activate

python -m pip install package-name
```

Avoid installing packages into Ubuntu's system Python.

## Python: No module named pip

Inside the virtual environment:

```bash
python -m ensurepip --upgrade
```

If unavailable, recreate the environment using:

```bash
sudo apt install python3.12-full

rm -rf venv

python3.12 -m venv venv

source venv/bin/activate
```

## PyAV compilation error

Use Python 3.12 and a prebuilt wheel:

```bash
python -m pip install --upgrade pip setuptools wheel

python -m pip install --only-binary=:all: av
```

## Hugging Face authentication warning

Faster-Whisper can download public models without a Hugging Face token.

The warning about unauthenticated requests is informational. A token is optional for this public-model setup.

## Ollama connection error

Check the service:

```bash
sudo systemctl status ollama
```

Check the model:

```bash
ollama list
```

Test the API:

```bash
curl http://127.0.0.1:11434/api/tags
```

## STT service not responding

Check:

```bash
curl http://127.0.0.1:8001/docs
```

Make sure the Python virtual environment is activated and the FastAPI server is running.

## eSpeak Tamil voice unavailable

Check:

```bash
espeak-ng --voices=ta
```

If the voice is unavailable, install or configure the appropriate eSpeak NG voice data for your Ubuntu distribution.

---

# 16. Performance Recommendations

For a machine with 16 GB RAM:

- Use Qwen 2.5 3B initially.
- Use Faster-Whisper `small` with CPU INT8.
- Avoid loading multiple large language models simultaneously.
- Keep audio recordings short during development.
- Use WAV or supported compressed formats for STT.
- Monitor CPU and RAM consumption.

Monitor resources:

```bash
htop
```

If unavailable:

```bash
sudo apt install htop
```

---

# 17. Future Improvements

Potential next steps:

1. Integrate a real database such as PostgreSQL.
2. Add customer authentication and profiles.
3. Add customer history and interaction records.
4. Implement product search and order management tools.
5. Add appointment scheduling.
6. Add call recording and call history.
7. Improve Tamil neural TTS quality.
8. Add natural interruption handling.
9. Implement streaming STT and LLM responses.
10. Integrate SIP or a telephony provider for real inbound and outbound calls.
11. Add call analytics and reporting.
12. Add multilingual conversation switching.

---

# 18. Production Considerations

This repository is a local proof of concept, not a production-ready telephone system.

Before production deployment, implement:

- Authentication and authorization.
- Secure handling of customer information.
- Input validation and file upload restrictions.
- Rate limiting.
- Audio retention and deletion policies.
- Session persistence.
- Logging and monitoring.
- database integration.
- Call consent and applicable recording disclosures.
- Telephony provider or SIP/PBX integration.
- Production-grade TTS and low-latency streaming.

---

## 19. License

This project is intended for learning, experimentation, and local development.

Review the individual licenses of Ollama models, Faster-Whisper, eSpeak NG, and other dependencies before commercial deployment.

---

## 20. Author

**Karthikeyan Manikandan**

Built with Node.js, Python, Faster-Whisper, Ollama, and eSpeak NG.

**Primary languages:** Tamil and English.

**Deployment:** Local Ubuntu environment.
