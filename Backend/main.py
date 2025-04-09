from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenRouter API configuration (for accessing Deepseek models)
OPENROUTER_API_KEY = os.getenv("DEEPSEEK_API_KEY", "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")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

class Message(BaseModel):
    content: str

# Get the path to the Frontend directory
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
frontend_dir = os.path.join(parent_dir, "Frontend")

logger.info(f"Frontend directory path: {frontend_dir}")

# Check if the directory exists
if not os.path.exists(frontend_dir):
    logger.error(f"Frontend directory does not exist: {frontend_dir}")
    # Create a temporary directory for static files
    os.makedirs(frontend_dir, exist_ok=True)

# Root path handler for index.html
@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the frontend HTML file"""
    try:
        index_path = os.path.join(frontend_dir, "index.html")
        logger.info(f"Looking for index.html at: {index_path}")
        
        if os.path.exists(index_path):
            logger.info("Found index.html, returning file")
            return FileResponse(index_path)
        else:
            logger.error(f"Index file not found at {index_path}")
            # Return a basic HTML page as fallback
            return """
            <html>
                <head><title>AI Chat Interface</title></head>
                <body>
                    <h1>Frontend file not found</h1>
                    <p>The frontend file could not be located. Please check the file path.</p>
                    <p>Expected path: {}</p>
                </body>
            </html>
            """.format(index_path)
    except Exception as e:
        logger.error(f"Error serving frontend: {str(e)}")
        return HTMLResponse(content=f"<html><body><h1>Error</h1><p>{str(e)}</p></body></html>")

# Pricing page route - handle both /pricing and /pricing.html
@app.get("/pricing", response_class=HTMLResponse)
@app.get("/pricing.html", response_class=HTMLResponse)
async def pricing():
    """Serve the pricing page"""
    try:
        pricing_path = os.path.join(frontend_dir, "pricing.html")
        logger.info(f"Looking for pricing.html at: {pricing_path}")
        
        if os.path.exists(pricing_path):
            logger.info("Found pricing.html, returning file")
            return FileResponse(pricing_path)
        else:
            logger.error(f"Pricing file not found at {pricing_path}")
            # Redirect to home page if pricing page doesn't exist
            return RedirectResponse(url="/")
    except Exception as e:
        logger.error(f"Error serving pricing page: {str(e)}")
        return HTMLResponse(content=f"<html><body><h1>Error</h1><p>{str(e)}</p></body></html>")

# Mount the frontend static files
try:
    # Must mount static files AFTER defining the root handler
    app.mount("/styles", StaticFiles(directory=os.path.join(frontend_dir, "styles")), name="styles")
    app.mount("/js", StaticFiles(directory=os.path.join(frontend_dir, "js")), name="js")
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dir, "assets")), name="assets")
    logger.info("Static files mounted successfully")
except Exception as e:
    logger.error(f"Failed to mount static files: {str(e)}")

@app.get("/test")
async def test():
    return {"message": "Test endpoint working"}

@app.post("/api/ask")
async def ask_question(message: Message):
    logger.info(f"Received message: {message.content}")
    try:
        # Format the headers according to OpenRouter API requirements
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://aichatinterface.com",  # Replace with your actual site
            "X-Title": "AI Chat Interface"
        }
        
        # Log the API key (first 10 chars for debugging)
        logger.info(f"Using API key (first 10 chars): {OPENROUTER_API_KEY[:10]}...")
        
        # Make sure the prompt is conversational
        user_message = message.content
        if user_message.lower() in ["hi", "hello", "hey"]:
            user_message = "Hi there! How are you doing today?"
        
        payload = {
            "model": "deepseek/deepseek-r1:free",  # Changed to R1 model as suggested
            "messages": [
                {"role": "user", "content": user_message}
            ],
            "temperature": 0.7,
            "max_tokens": 1000
        }
        
        logger.info(f"Sending request to OpenRouter API: {OPENROUTER_API_URL}")
        response = requests.post(OPENROUTER_API_URL, headers=headers, json=payload)
        
        # Log the response status code
        logger.info(f"Response status code: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"API Error: {response.text}")
            
        response.raise_for_status()
        logger.info("Received response from OpenRouter API")
        
        return response.json()
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/settings')
@app.get('/settings.html')
async def settings():
    """Handle the settings page request."""
    try:
        settings_path = os.path.join(frontend_dir, 'settings.html')
        if os.path.exists(settings_path):
            return FileResponse(settings_path)
        else:
            logger.error(f"Settings page not found at {settings_path}")
            return RedirectResponse(url='/')
    except Exception as e:
        logger.error(f"Error serving settings page: {str(e)}")
        return HTMLResponse(content="<html><body><h1>Error</h1><p>Could not load settings page.</p></body></html>")

@app.get('/explore-models')
@app.get('/explore-models.html')
async def explore_models():
    """Handle the explore-models page request."""
    try:
        explore_models_path = os.path.join(frontend_dir, 'explore-models.html')
        logger.info(f"Looking for explore-models.html at: {explore_models_path}")
        
        if os.path.exists(explore_models_path):
            logger.info("Found explore-models.html, returning file")
            return FileResponse(explore_models_path)
        else:
            logger.error(f"Explore models page not found at {explore_models_path}")
            # Try the explore.html file as fallback
            explore_path = os.path.join(frontend_dir, 'explore.html')
            if os.path.exists(explore_path):
                logger.info("Using explore.html as fallback")
                return FileResponse(explore_path)
            return RedirectResponse(url='/')
    except Exception as e:
        logger.error(f"Error serving explore-models page: {str(e)}")
        return HTMLResponse(content=f"<html><body><h1>Error</h1><p>Could not load explore-models page: {str(e)}</p></body></html>")

@app.get('/explore')
@app.get('/explore.html')
async def explore():
    """Handle the explore page request."""
    try:
        explore_path = os.path.join(frontend_dir, 'explore.html')
        logger.info(f"Looking for explore.html at: {explore_path}")
        
        if os.path.exists(explore_path):
            logger.info("Found explore.html, returning file")
            return FileResponse(explore_path)
        else:
            logger.error(f"Explore page not found at {explore_path}")
            # Try the explore-models.html file as fallback
            explore_models_path = os.path.join(frontend_dir, 'explore-models.html')
            if os.path.exists(explore_models_path):
                logger.info("Using explore-models.html as fallback")
                return FileResponse(explore_models_path)
            return RedirectResponse(url='/')
    except Exception as e:
        logger.error(f"Error serving explore page: {str(e)}")
        return HTMLResponse(content=f"<html><body><h1>Error</h1><p>Could not load explore page: {str(e)}</p></body></html>")

# Catch-all route for any HTML file in the Frontend directory
@app.get("/{html_file}")
async def serve_html(html_file: str):
    """Dynamically serve any HTML file from the Frontend directory."""
    if not html_file.endswith('.html'):
        html_file = f"{html_file}.html"
    
    logger.info(f"Catch-all route: Trying to serve {html_file}")
    file_path = os.path.join(frontend_dir, html_file)
    
    if os.path.exists(file_path) and os.path.isfile(file_path):
        logger.info(f"File found: {file_path}")
        return FileResponse(file_path)
    else:
        logger.error(f"File not found: {file_path}")
        return RedirectResponse(url='/')

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server... Frontend directory: {frontend_dir}")
    # Let's list all HTML files in the Frontend directory for reference
    html_files = [f for f in os.listdir(frontend_dir) if f.endswith('.html')]
    logger.info(f"Available HTML files: {html_files}")
    uvicorn.run(app, host="127.0.0.1", port=5050) 