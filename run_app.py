import os
import sys
import subprocess
import webbrowser
import time

def main():
    print("Starting AI Chat Interface...")
    
    # Add Backend directory to Python path
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Backend")
    sys.path.append(backend_dir)
    
    # Change to the Backend directory
    os.chdir(backend_dir)
    print(f"Changed directory to: {os.getcwd()}")
    
    # Start the backend server
    try:
        print("Starting the server...")
        
        # Start the server as a separate process
        cmd = [sys.executable, "main.py"]
        server_process = subprocess.Popen(cmd)
        
        # Wait a bit for the server to start
        print("Waiting for server to start...")
        time.sleep(2)
        
        # Open the web browser
        webbrowser.open("http://127.0.0.1:5050")
        print("Browser opened. Navigate to http://127.0.0.1:5050 if it doesn't open automatically.")
        
        # Keep the server running until user presses Ctrl+C
        print("Server is running. Press Ctrl+C to stop.")
        server_process.wait()
        
    except KeyboardInterrupt:
        print("\nStopping server...")
        server_process.terminate()
        print("Server stopped.")
    except Exception as e:
        print(f"An error occurred: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 