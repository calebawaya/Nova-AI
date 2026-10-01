# Nova AI

Nova AI is a chatbot project built with HTML, CSS, JavaScript, Python, SQLite and an AI API.

## Stack

- HTML — interface
- CSS — design and animations
- JavaScript — browser chat
- Python / Flask — backend API
- SQLite — conversation history
- OpenAI Python SDK — AI model connection

## Run locally

### 1. Install Python packages

```bash
pip install -r requirements.txt
```

### 2. Set your API key

Create a local `.env` file or set the environment variable:

```text
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5.6-luna
```

Never commit your real API key to GitHub.

### 3. Start the backend

```bash
python app.py
```

The API runs at:

```text
http://127.0.0.1:5000
```

### 4. Open the frontend

Open `index.html` in your browser.

The frontend currently uses:

```js
const API_URL = "http://127.0.0.1:5000";
```

When the backend is deployed online, replace that value with the deployed HTTPS backend URL.

## Important

GitHub Pages can host the HTML/CSS/JavaScript frontend, but it cannot run the Python Flask backend. The backend needs Python-capable hosting.

Do not put API keys inside `index.html`, `script.js`, or any other browser-side file.
