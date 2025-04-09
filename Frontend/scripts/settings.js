function deleteAllChats() {
    if (confirm('Are you sure you want to delete all chats? This action cannot be undone.')) {
        // Remove chats from localStorage
        localStorage.removeItem('chats');
        
        // Clear the chat list UI
        const chatList = document.getElementById('chatList');
        if (chatList) {
            chatList.innerHTML = '';
        }
        
        // Reset the current chat
        currentChatId = null;
        messages = [];
        
        // Update the chat display
        if (typeof updateChatDisplay === 'function') {
            updateChatDisplay();
        } else {
            // Fallback if function not available
            const chatMessages = document.getElementById('chatMessages');
            if (chatMessages) {
                chatMessages.innerHTML = '<div class="empty-chat-message">No conversation selected</div>';
            }
        }
        
        // Clear any input
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.value = '';
        }
        
        // Show success message
        showNotification('All chats have been deleted successfully', 'success');
        
        // Close settings modal if it's open
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal && settingsModal.classList.contains('active')) {
            settingsModal.classList.remove('active');
        }
    }
} 