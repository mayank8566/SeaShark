function saveChat(chatId, title) {
    const chat = {
        id: chatId,
        title: title,
        messages: messages,
        timestamp: new Date().toISOString()
    };

    // Only save if there are actual messages
    if (messages.length > 0) {
        let chats = JSON.parse(localStorage.getItem('chats') || '[]');
        const existingIndex = chats.findIndex(c => c.id === chatId);
        
        if (existingIndex !== -1) {
            chats[existingIndex] = chat;
        } else {
            chats.push(chat);
        }
        
        localStorage.setItem('chats', JSON.stringify(chats));
        updateChatList();
    }
}

function formatMessage(message) {
    // Replace code blocks with formatted versions
    message = message.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const formattedCode = code.trim();
        const copyButton = `<button class="copy-button" onclick="copyCode(this)">Copy</button>`;
        return `<pre><code class="language-${lang || 'plaintext'}">${escapeHtml(formattedCode)}${copyButton}</code></pre>`;
    });
    
    // Handle incomplete code blocks that might just have opening ```
    message = message.replace(/```(\w*)(?!\n[\s\S]*?```)/g, (match, lang) => {
        return `<pre><code class="language-${lang || 'plaintext'}">Code block was empty</code></pre>`;
    });
    
    // Replace inline code
    message = message.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    return message;
}

// Helper function to escape HTML characters in code blocks
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function copyCode(button) {
    const codeBlock = button.parentElement;
    const code = codeBlock.textContent.replace('Copy', '').trim();
    
    navigator.clipboard.writeText(code).then(() => {
        button.textContent = 'Copied!';
        button.classList.add('copied');
        setTimeout(() => {
            button.textContent = 'Copy';
            button.classList.remove('copied');
        }, 2000);
    });
}

// Update the appendMessage function to use formatMessage
function appendMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
    
    const formattedContent = formatMessage(content);
    messageDiv.innerHTML = formattedContent;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to create a new chat
function startNewChat() {
    // Generate a unique ID
    const chatId = 'chat_' + Date.now();
    
    // Clear current messages
    messages = [];
    currentChatId = chatId;
    
    // Clear chat display
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    // Update chat display with empty state
    updateChatDisplay();
    
    // Focus on input
    if (chatInput) {
        chatInput.focus();
    }
    
    return chatId;
}

// Function to handle sending messages
function sendMessage() {
    if (!chatInput || !chatInput.value.trim()) return;
    
    const userMessage = chatInput.value.trim();
    
    // Create a new chat if this is the first message
    if (!currentChatId) {
        currentChatId = startNewChat();
    }
    
    // Add user message to display
    appendMessage(userMessage, true);
    
    // Add to messages array
    messages.push({
        role: 'user',
        content: userMessage
    });
    
    // Save the chat with current messages
    saveChat(currentChatId, generateChatTitle());
    
    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    chatSubmit.setAttribute('disabled', true);
    
    // TODO: Add AI response handling logic here
}

// Helper to generate a title based on the first user message
function generateChatTitle() {
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage) {
        const title = firstUserMessage.content.substring(0, 30);
        return title + (title.length >= 30 ? '...' : '');
    }
    return 'New Chat';
} 