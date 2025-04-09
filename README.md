# AI Chat Interface

A modern, feature-rich AI chat application with a sleek UI, Firebase integration, and connection to the Claude AI API.

## Features

- 🎨 Modern UI with customizable light and dark themes
- 🔥 Firebase authentication and message storage
- 🧠 Claude AI API integration
- 📱 Responsive design for all devices
- ✨ Clean animations and transitions
- 💾 Message history and conversation management
- 👤 User profile and settings
- 💰 Pricing page for premium plans

## Project Structure

```
.
├── Backend/           # Python Flask backend
│   ├── main.py       # Main Flask application
│   └── requirements.txt
└── Frontend/         # Frontend web interface
    ├── index.html    # Main chat interface
    ├── demo.html     # Loading demo page
    ├── js/           # JavaScript files
    │   ├── app.js    # Main application logic
    │   └── firebase-config.js # Firebase configuration
    ├── styles/       # CSS stylesheets
    │   ├── main.css  # Main styles
    │   ├── chat.css  # Chat-specific styles
    │   ├── sidebar.css # Sidebar styles
    │   ├── animations.css # Animation styles
    │   ├── code.css  # Code block styling
    │   └── responsive.css # Responsive design
    └── assets/       # Images and icons
```

## Setup Instructions

### Backend Setup

1. Navigate to the Backend directory:
   ```bash
   cd Backend
   ```

2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set your Claude API key as an environment variable:
   ```bash
   # On Windows
   set CLAUDE_API_KEY=your_api_key_here
   
   # On Linux/Mac
   export CLAUDE_API_KEY=your_api_key_here
   ```

5. Start the backend server:
   ```bash
   python main.py
   ```

The backend will run on `http://127.0.0.1:5050`

### Firebase Setup

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Authentication (Email/Password) and Firestore Database
3. Update the Firebase configuration in `Frontend/js/firebase-config.js` with your credentials

### Frontend Access

The frontend is served by the backend at `http://127.0.0.1:5050`. You can access it directly in your browser after starting the backend server.

## Usage

1. Visit `http://127.0.0.1:5050` in your web browser
2. Sign up or log in with your email and password
3. Start chatting with the AI
4. Use the sidebar to access different conversations
5. Click your profile picture to access settings, upgrade options, or logout

## Key Features

### Theme Switching
Toggle between light and dark themes by clicking the theme switch button in the settings modal.

### Code Highlighting
Code blocks in messages are automatically formatted with syntax highlighting for better readability.

### Responsive Design
The interface adapts to different screen sizes, providing an optimal experience on both desktop and mobile devices.

### Message History
Previous conversations are saved and can be accessed from the sidebar.

## API Endpoints

- `POST /api/ask`: Send a message to the AI model
  - Request body: `{ "content": "your message here" }`
  - Returns the AI's response in JSON format

- `GET /pricing`: Access the pricing page for premium plans

## License

MIT 