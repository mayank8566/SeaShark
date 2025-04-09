// DOM elements
const chatInput = document.getElementById('chat-input');
const chatSubmit = document.getElementById('chat-submit');
const chatMessages = document.querySelector('.chat-messages');
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const settingsButton = document.getElementById('settings-button');
const settingsModal = document.getElementById('settings-modal');
const userSettings = document.getElementById('user-settings');
const closeModal = document.querySelector('.close-modal');
const themeOptions = document.querySelectorAll('.theme-option');
const logoutButton = document.getElementById('logout-button');
const emptyConversations = document.getElementById('empty-conversations');
const conversationsContainer = document.getElementById('conversations-container');
const userName = document.getElementById('user-name');
const userAvatar = document.getElementById('user-avatar');
const logoutMenuItem = document.getElementById('logout-menu-item');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const chatContainer = document.querySelector('.chat-container');
const chatInputContainer = document.querySelector('.chat-input-container');
const settingsMenuItem = document.querySelector('.dropdown-menu-item[data-action="settings"]');
const userProfilePicture = document.querySelector('.user-profile');
const userDropdownMenu = document.querySelector('.dropdown-menu');
const upgradeMenuItem = document.querySelector('.dropdown-menu-item[data-action="upgrade"]');

// Additional DOM elements
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebarToggleMobile = document.getElementById('sidebar-toggle-mobile');
const sidebarOpenButton = document.getElementById('sidebar-open-button');
const sidebar = document.querySelector('.sidebar');

// Store the current user
let currentUser = null;
let conversations = [];
let activeConversationId = null;

// Global variable to track current request
let currentAbortController = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  console.log("App initializing");
  
  // Create and show beta notification immediately - this is a direct approach
  createBetaNotification();
  
  // Check if user is already logged in
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      // User is signed in
      console.log("User signed in:", user.email);
      currentUser = user;
      showApp(user);
      
      // Immediate load of conversations with debugging
      console.log("Loading user conversations immediately");
      loadUserConversations().then(() => {
        console.log("Conversations loaded, found:", conversations.length);
        // If no conversations, create a new one
        if (conversations.length === 0) {
          console.log("No conversations found, creating a new one");
          startNewChat();
        } else {
          console.log("Loading first conversation:", conversations[0].id);
          // Load the first conversation
          loadConversation(conversations[0].id);
          
          // Make sure the first conversation is marked as active in the sidebar
          const firstConversationItem = document.querySelector(`.sidebar-item[data-id="${conversations[0].id}"]`);
          if (firstConversationItem) {
            firstConversationItem.classList.add('active');
          }
        }
      }).catch(error => {
        console.error("Error loading conversations:", error);
        // If error loading conversations, still create a new chat
        startNewChat();
      });
    } else {
      // No user is signed in
      console.log("No user signed in, showing auth screen");
      showAuth();
    }
  });

  // Initialize theme from localStorage
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);

  // Setup event listeners
  setupAuthListeners();
  setupChatListeners();
  setupSettingsListeners();
  setupSidebarToggle();
});

// Authentication Event Listeners
function setupAuthListeners() {
  // Tab switching
  loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  });

  registerTab.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
  });

  // Login form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      // Auth state listener will handle the redirect
    } catch (error) {
      alert(`Login failed: ${error.message}`);
    }
  });

  // Register form submission
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      // Create user
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      
      // Update profile
      await userCredential.user.updateProfile({
        displayName: name
      });

      // Store additional user data in Firestore
      await db.collection('users').doc(userCredential.user.uid).set({
        name: name,
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        plan: 'free'
      });

      // Auth state listener will handle the redirect
    } catch (error) {
      alert(`Registration failed: ${error.message}`);
    }
  });

  // Social login
  document.querySelector('.provider-button.google').addEventListener('click', async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await firebase.auth().signInWithPopup(provider);
      // Auth state listener will handle the redirect
    } catch (error) {
      alert(`Google login failed: ${error.message}`);
    }
  });

  document.querySelector('.provider-button.github').addEventListener('click', async () => {
    try {
      const provider = new firebase.auth.GithubAuthProvider();
      await firebase.auth().signInWithPopup(provider);
      // Auth state listener will handle the redirect
    } catch (error) {
      alert(`GitHub login failed: ${error.message}`);
    }
  });
}

// Chat Event Listeners
function setupChatListeners() {
  // Input field event listeners
  chatInput.addEventListener('input', () => {
    if (chatInput.value.trim()) {
      chatSubmit.removeAttribute('disabled');
    } else {
      chatSubmit.setAttribute('disabled', true);
    }
    
    // Auto-resize textarea
    chatInput.style.height = 'auto';
    chatInput.style.height = (chatInput.scrollHeight) + 'px';
  });

  // Submit button event listener
  chatSubmit.addEventListener('click', sendMessage);

  // Also allow submitting with Enter (but allow Shift+Enter for new lines)
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!chatSubmit.hasAttribute('disabled')) {
        sendMessage();
      }
    }
  });

  // Example card click events
  document.querySelectorAll('.example-card').forEach(card => {
    card.addEventListener('click', () => {
      const exampleText = card.querySelector('p').textContent;
      chatInput.value = exampleText;
      chatInput.dispatchEvent(new Event('input'));
      chatSubmit.removeAttribute('disabled');
    });
  });

  // New chat button
  document.querySelector('.new-chat-button').addEventListener('click', startNewChat);
}

// Settings Event Listeners
function setupSettingsListeners() {
  // Navigate to settings page when settings dropdown item is clicked
  settingsMenuItem.addEventListener('click', () => {
    window.location.href = '/settings';
    userDropdownMenu.classList.remove('show');
  });

  // Close settings modal
  closeModal.addEventListener('click', () => {
    settingsModal.classList.remove('active');
  });

  // Close modal when clicking outside
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.remove('active');
    }
  });

  // Theme switcher
  themeOptions.forEach(option => {
    option.addEventListener('click', () => {
      const theme = option.getAttribute('data-theme');
      setTheme(theme);
      themeOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      
      // Save theme preference to localStorage
      localStorage.setItem('theme', theme);
    });
  });

  // Logout button in menu
  logoutMenuItem.addEventListener('click', async () => {
    try {
      await firebase.auth().signOut();
      // Auth state listener will handle the redirect
    } catch (error) {
      alert(`Logout failed: ${error.message}`);
    }
  });
  
  // Dropdown menu items with data-action
  document.querySelectorAll('.dropdown-menu-item').forEach(item => {
    const action = item.getAttribute('data-action');
    if (action === 'upgrade') {
      item.addEventListener('click', () => {
        window.location.href = 'pricing.html';
        userDropdownMenu.classList.remove('show');
      });
    } else if (action === 'explore') {
      item.addEventListener('click', () => {
        window.location.href = 'explore-models.html';
        userDropdownMenu.classList.remove('show');
      });
    }
  });
}

// Add a loading message
function addLoadingMessageToUI() {
  const messageRow = document.createElement('div');
  messageRow.className = 'message-row assistant-message animate-slide-in';
  messageRow.id = 'loading-message';

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar assistant-avatar-icon';
  
  const avatarIcon = document.createElement('i');
  avatarIcon.className = 'fas fa-robot';
  avatar.appendChild(avatarIcon);

  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  
  const loadingDots = document.createElement('div');
  loadingDots.className = 'loading-dots';
  loadingDots.innerHTML = '<span></span><span></span><span></span>';
  
  // Add stop button
  const stopButton = document.createElement('button');
  stopButton.className = 'stop-button';
  stopButton.innerHTML = '<i class="fas fa-stop"></i> Stop generating';
  stopButton.id = 'stop-generation';
  
  stopButton.addEventListener('click', () => {
    // Handle stopping the AI response
    stopResponseGeneration();
  });
  
  messageContent.appendChild(loadingDots);
  messageContent.appendChild(stopButton);
  messageRow.appendChild(avatar);
  messageRow.appendChild(messageContent);

  chatMessages.appendChild(messageRow);
  scrollToBottom();
  
  return messageRow;
}

// Function to stop response generation
function stopResponseGeneration() {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
    
    // Remove loading message
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
      loadingMessage.remove();
    }
    
    // Add a message indicating the response was stopped
    addMessageToUI('assistant', 'Response generation stopped.');
    
    // Re-enable the chat input
    chatInput.removeAttribute('disabled');
    chatInput.style.opacity = '1';
    chatInput.placeholder = "You'r Message...";
  }
}

// Send message to the AI
async function sendMessage() {
  const messageText = chatInput.value.trim();
  if (!messageText) return;

  // Save the conversation if it's new
  if (!activeConversationId) {
    await startNewChat();
  }

  // Add user message to UI
  addMessageToUI('user', messageText);

  // Clear input field
  chatInput.value = '';
  chatInput.style.height = 'auto';
  chatSubmit.setAttribute('disabled', true);
  
  // Disable the chat input while waiting for response
  chatInput.setAttribute('disabled', true);
  chatInput.style.opacity = '0.7';
  chatInput.placeholder = 'Waiting for response...';

  // Show loading indicator
  const loadingMessage = addLoadingMessageToUI();

  try {
    // Create an AbortController for this request
    currentAbortController = new AbortController();
    
    // Send message to AI
    const response = await sendMessageToAI(messageText, currentAbortController.signal);
    
    // Clear the abort controller reference
    currentAbortController = null;
    
    // Remove loading indicator
    loadingMessage.remove();
    
    // Add AI response to UI
    addMessageToUI('assistant', response);

    // Store message in Firestore
    await storeMessageInFirestore(activeConversationId, 'user', messageText);
    await storeMessageInFirestore(activeConversationId, 'assistant', response);

    // Update conversation preview
    updateConversationPreview(activeConversationId, messageText);

    // Scroll to bottom
    scrollToBottom();
    
    // Re-enable the chat input
    chatInput.removeAttribute('disabled');
    chatInput.style.opacity = '1';
    chatInput.placeholder = "You'r Message...";
  } catch (error) {
    // Don't show error if it was aborted
    if (error.name === 'AbortError') {
      console.log('Request was aborted');
      return;
    }
    
    console.error('Error sending message:', error);
    
    // Remove loading indicator
    loadingMessage.remove();
    
    // Show error message
    addErrorMessageToUI('Failed to get a response. Please try again.');
    
    // Re-enable the chat input even if there was an error
    chatInput.removeAttribute('disabled');
    chatInput.style.opacity = '1';
    chatInput.placeholder = "You'r Message...";
  }
}

// Send message to AI backend
async function sendMessageToAI(message, signal) {
  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: message }),
      signal // Add AbortSignal
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      // Clean AI response to remove model identifier
      let content = data.choices[0].message.content;
      content = removeModelIdentifier(content);
      return content;
    } else {
      console.error('Unexpected response format:', data);
      return "I couldn't process your request properly. Please try again.";
    }
  } catch (error) {
    console.error('Error calling AI backend:', error);
    throw error;
  }
}

// Remove model identifier from AI response
function removeModelIdentifier(content) {
  // Enhanced regex to catch more variations of model identifiers
  return content
    // Remove "Model: deepseek/deepseek-r1" and variations
    .replace(/Model:\s*deepseek\/deepseek-r1(?::\w+)?\s*/gi, '')
    // Remove [deepseek/deepseek-r1] and variations
    .replace(/\[?\s*deepseek\/deepseek-r1(?::\w+)?\s*\]?\s*/gi, '')
    // Remove any line starting with "Model:" 
    .replace(/^Model:.*$/gm, '')
    // Remove any lingering "deepseek" references
    .replace(/\bdeepseek(?:\/[^\/\s]+)*\b/gi, '')
    // Clean up any double line breaks created by removals
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

// Generate a unique ID for conversations
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Add message to the UI
function addMessageToUI(role, content) {
  // Hide the welcome screen if visible
  const welcomeScreen = document.querySelector('.welcome-screen');
  if (welcomeScreen) {
    welcomeScreen.style.display = 'none';
  }

  const messageRow = document.createElement('div');
  messageRow.className = `message-row ${role}-message animate-slide-in`;

  const avatar = document.createElement('div');
  avatar.className = `message-avatar ${role}-avatar-icon`;
  
  const avatarIcon = document.createElement('i');
  avatarIcon.className = role === 'user' ? 'fas fa-user' : 'fas fa-robot';
  avatar.appendChild(avatarIcon);

  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';

  // Process content for markdown (especially code blocks)
  const formattedContent = formatMessage(content);
  messageContent.innerHTML = formattedContent;

  // Add message actions for assistant messages
  if (role === 'assistant') {
    const messageActions = document.createElement('div');
    messageActions.className = 'message-actions';
    
    // Thumbs up button
    const thumbsUpButton = document.createElement('button');
    thumbsUpButton.className = 'message-action-button';
    thumbsUpButton.innerHTML = '<i class="far fa-thumbs-up"></i>';
    thumbsUpButton.addEventListener('click', () => {
      // Handle feedback
      thumbsUpButton.classList.add('active');
      thumbsDownButton.classList.remove('active');
    });
    
    // Thumbs down button
    const thumbsDownButton = document.createElement('button');
    thumbsDownButton.className = 'message-action-button';
    thumbsDownButton.innerHTML = '<i class="far fa-thumbs-down"></i>';
    thumbsDownButton.addEventListener('click', () => {
      // Handle feedback
      thumbsDownButton.classList.add('active');
      thumbsUpButton.classList.remove('active');
    });
    
    // Copy button
    const copyButton = document.createElement('button');
    copyButton.className = 'message-action-button';
    copyButton.innerHTML = '<i class="far fa-copy"></i> Copy';
    copyButton.addEventListener('click', () => {
      // Copy message content to clipboard
      navigator.clipboard.writeText(content).then(() => {
        // Show copied confirmation
        copyButton.innerHTML = '<i class="fas fa-check"></i> Copied';
        setTimeout(() => {
          copyButton.innerHTML = '<i class="far fa-copy"></i> Copy';
        }, 2000);
      });
    });
    
    messageActions.appendChild(thumbsUpButton);
    messageActions.appendChild(thumbsDownButton);
    messageActions.appendChild(copyButton);
    
    messageContent.appendChild(messageActions);
  }

  messageRow.appendChild(avatar);
  messageRow.appendChild(messageContent);

  chatMessages.appendChild(messageRow);
  scrollToBottom();
  
  return messageRow;
}

// Format message content with markdown and code highlighting
function formatMessage(content) {
  // Simple markdown-like formatting
  let formatted = content
    // Convert code blocks
    .replace(/```([a-z]*)\n([\s\S]*?)\n```/g, '<pre><code class="language-$1">$2</code></pre>')
    // Convert inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Convert bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Convert italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Convert headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Convert lists
    .replace(/^\- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)\n(?!<li>)/g, '$1</ul>\n')
    .replace(/^(?=<li>)/gm, '<ul>')
    // Convert numbered lists
    .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)\n(?!<li>)/g, '$1</ol>\n')
    .replace(/^(?=<li>)/gm, '<ol>')
    // Convert paragraphs
    .replace(/^(?!<[hou]).+/gm, '<p>$&</p>');

  // Handle line breaks that aren't part of lists or code blocks
  formatted = formatted.replace(/\n\n/g, '<br><br>');
  
  return formatted;
}

// Add an error message
function addErrorMessageToUI(errorText) {
  const messageRow = document.createElement('div');
  messageRow.className = 'message-row error-message animate-slide-in';

  const icon = document.createElement('div');
  icon.className = 'message-avatar error-icon';
  
  const errorIcon = document.createElement('i');
  errorIcon.className = 'fas fa-exclamation-triangle';
  icon.appendChild(errorIcon);

  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  messageContent.innerHTML = `<p>${errorText}</p>`;

  messageRow.appendChild(icon);
  messageRow.appendChild(messageContent);

  chatMessages.appendChild(messageRow);
  scrollToBottom();
  
  return messageRow;
}

// Scroll to the bottom of the chat messages
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show auth screen
function showAuth() {
  authContainer.style.display = 'flex';
  appContainer.style.display = 'none';
}

// Show app screen
function showApp(user) {
  console.log("showApp called - showing beta notification soon");
  authContainer.style.display = 'none';
  appContainer.style.display = 'flex';
  
  // Update user info
  if (user.displayName) {
    userName.textContent = user.displayName;
    userAvatar.textContent = user.displayName.charAt(0);
  } else if (user.email) {
    userName.textContent = user.email.split('@')[0];
    userAvatar.textContent = user.email.charAt(0).toUpperCase();
  }

  // Show beta notification with a slight delay to ensure DOM is ready
  setTimeout(() => {
    console.log("Showing beta notification now");
    showBetaNotification();
  }, 500);
}

// Show beta notification
function showBetaNotification() {
  console.log("showBetaNotification function called");
  
  // Check if notification element already exists
  if (document.querySelector('.beta-notification')) {
    console.log("Beta notification already exists, not showing again");
    return;
  }

  console.log("Creating beta notification element");
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'betaNotification'; // Add an ID for easier debugging
  notification.className = 'beta-notification';
  notification.style.zIndex = '9999'; // Ensure it's on top of everything
  notification.style.display = 'flex'; // Ensure it's visible
  notification.innerHTML = `
    <div class="beta-notification-icon">
      <i class="fas fa-exclamation-triangle"></i>
    </div>
    <div class="beta-notification-content">
      <div class="beta-notification-title">AI Beta Version Notice</div>
      <div class="beta-notification-message">
        Our AI is currently in beta testing. The responses might be inaccurate, especially for complex code writing tasks. For more accurate and advanced AI capabilities, please consider upgrading to our premium plan.
      </div>
      <div class="beta-notification-action">
        <button id="upgrade-beta-btn">Upgrade Now</button>
      </div>
    </div>
    <button class="beta-notification-close">
      <i class="fas fa-times"></i>
    </button>
  `;

  // Add to body
  document.body.appendChild(notification);
  console.log("Beta notification added to DOM");

  // Add event listeners
  notification.querySelector('.beta-notification-close').addEventListener('click', () => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      notification.remove();
    }, 300);
  });

  notification.querySelector('#upgrade-beta-btn').addEventListener('click', () => {
    // Redirect to pricing page or show pricing modal
    window.location.href = 'pricing.html'; // Changed from "/pricing.html" to "pricing.html"
  });

  // Auto-hide after 15 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.remove();
        }
      }, 300);
    }
  }, 15000);
}

// Show notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'exclamation-circle';
  if (type === 'warning') icon = 'exclamation-triangle';
  
  notification.innerHTML = `
    <div class="notification-icon">
      <i class="fas fa-${icon}"></i>
    </div>
    <div class="notification-message">${message}</div>
  `;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Set theme
function setTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
    document.querySelector('.theme-option.dark').classList.add('active');
    document.querySelector('.theme-option.light').classList.remove('active');
  } else {
    document.body.classList.remove('dark-theme');
    document.querySelector('.theme-option.light').classList.add('active');
    document.querySelector('.theme-option.dark').classList.remove('active');
  }
  localStorage.setItem('theme', theme);
}

// Load user conversations
async function loadUserConversations() {
  if (!currentUser) return;
  
  try {
    console.log("Loading conversations for user:", currentUser.uid);
    const snapshot = await db.collection('users')
      .doc(currentUser.uid)
      .collection('conversations')
      .orderBy('updatedAt', 'desc')
      .get();
    
    // Clear existing conversations
    conversations = [];
    
    if (snapshot.empty) {
      console.log("No conversations found");
      // Show empty state
      emptyConversations.style.display = 'flex';
      return;
    }
    
    console.log(`Found ${snapshot.size} conversations`);
    // Hide empty state
    emptyConversations.style.display = 'none';
    
    // Group conversations by date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const todayConversations = [];
    const yesterdayConversations = [];
    const lastWeekConversations = [];
    const olderConversations = [];
    
    snapshot.forEach(doc => {
      const conversation = { id: doc.id, ...doc.data() };
      conversations.push(conversation);
      
      const date = conversation.updatedAt ? conversation.updatedAt.toDate() : new Date();
      
      if (date >= today) {
        todayConversations.push(conversation);
      } else if (date >= yesterday) {
        yesterdayConversations.push(conversation);
      } else if (date >= lastWeek) {
        lastWeekConversations.push(conversation);
      } else {
        olderConversations.push(conversation);
      }
    });
    
    // Clear existing sections
    const sections = conversationsContainer.querySelectorAll('.sidebar-section');
    sections.forEach(section => {
      if (section !== emptyConversations) {
        section.remove();
      }
    });
    
    // Create sections
    if (todayConversations.length > 0) {
      createConversationSection('Today', todayConversations);
    }
    
    if (yesterdayConversations.length > 0) {
      createConversationSection('Yesterday', yesterdayConversations);
    }
    
    if (lastWeekConversations.length > 0) {
      createConversationSection('Previous 7 Days', lastWeekConversations);
    }
    
    if (olderConversations.length > 0) {
      createConversationSection('Older', olderConversations);
    }
    
  } catch (error) {
    console.error('Error loading conversations:', error);
  }
}

// Create a conversation section
function createConversationSection(title, conversations) {
  const section = document.createElement('div');
  section.className = 'sidebar-section';
  
  const header = document.createElement('div');
  header.className = 'sidebar-section-header';
  header.textContent = title;
  
  section.appendChild(header);
  
  conversations.forEach(conversation => {
    const item = document.createElement('div');
    item.className = 'sidebar-item';
    item.dataset.id = conversation.id;
    
    if (conversation.id === activeConversationId) {
      item.classList.add('active');
    }
    
    const icon = document.createElement('div');
    icon.className = 'sidebar-item-icon';
    
    const iconElement = document.createElement('i');
    iconElement.className = 'far fa-comment';
    icon.appendChild(iconElement);
    
    const text = document.createElement('div');
    text.className = 'sidebar-item-text';
    text.textContent = conversation.title || 'New conversation';
    
    // Add three dots menu
    const menuContainer = document.createElement('div');
    menuContainer.className = 'sidebar-item-menu';
    
    const menuButton = document.createElement('button');
    menuButton.className = 'menu-button';
    menuButton.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
    
    const menuDropdown = document.createElement('div');
    menuDropdown.className = 'menu-dropdown';
    
    const deleteOption = document.createElement('div');
    deleteOption.className = 'menu-item delete-item';
    deleteOption.innerHTML = '<i class="fas fa-trash"></i> Delete';
    
    deleteOption.addEventListener('click', async (e) => {
      e.stopPropagation(); // Prevent conversation loading
      if (confirm('Are you sure you want to delete this conversation?')) {
        await deleteConversation(conversation.id);
      }
      menuDropdown.classList.remove('show');
    });
    
    menuDropdown.appendChild(deleteOption);
    menuContainer.appendChild(menuButton);
    menuContainer.appendChild(menuDropdown);
    
    menuButton.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent conversation loading
      menuDropdown.classList.toggle('show');
      
      // Close other open menus
      document.querySelectorAll('.menu-dropdown.show').forEach(dropdown => {
        if (dropdown !== menuDropdown) {
          dropdown.classList.remove('show');
        }
      });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', () => {
      menuDropdown.classList.remove('show');
    });
    
    item.appendChild(icon);
    item.appendChild(text);
    item.appendChild(menuContainer);
    
    item.addEventListener('click', () => {
      loadConversation(conversation.id);
    });
    
    section.appendChild(item);
  });
  
  // Insert before empty state
  conversationsContainer.insertBefore(section, emptyConversations);
}

// Load a conversation
async function loadConversation(conversationId) {
  if (!currentUser) return;
  
  try {
    // Update active conversation
    activeConversationId = conversationId;
    
    // Update sidebar
    const items = document.querySelectorAll('.sidebar-item');
    items.forEach(item => {
      if (item.dataset.id === conversationId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    // Clear chat messages
    chatMessages.innerHTML = '';
    
    // Load messages
    const snapshot = await db.collection('users')
      .doc(currentUser.uid)
      .collection('conversations')
      .doc(conversationId)
      .collection('messages')
      .orderBy('timestamp')
      .get();
    
    snapshot.forEach(doc => {
      const message = doc.data();
      addMessageToUI(message.role, message.content);
    });
    
  } catch (error) {
    console.error('Error loading conversation:', error);
  }
}

// Start a new chat
async function startNewChat() {
  if (!currentUser) return;
  
  try {
    // Create a new conversation
    const conversationId = generateId();
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();
    
    await db.collection('users')
      .doc(currentUser.uid)
      .collection('conversations')
      .doc(conversationId)
      .set({
        title: 'New conversation',
        createdAt: timestamp,
        updatedAt: timestamp
      });
    
    // Set as active conversation
    activeConversationId = conversationId;
    
    // Clear chat messages
    chatMessages.innerHTML = '';
    
    // Show welcome screen
    const welcomeScreen = document.createElement('div');
    welcomeScreen.className = 'welcome-screen animate-fade-in';
    welcomeScreen.innerHTML = `
      <h1 class="welcome-title">How can I help you today?</h1>
      <p class="welcome-subtitle">Ask me anything or try one of these examples:</p>
      
      <div class="examples-container">
        <div class="example-card stagger-item hover-lift">
          <h3 class="example-card-title">Plan a trip</h3>
          <p>Help me plan a 7-day trip to Japan with a detailed itinerary.</p>
        </div>
        <div class="example-card stagger-item hover-lift">
          <h3 class="example-card-title">Write code</h3>
          <p>Create a JavaScript function to fetch and display weather data from an API.</p>
        </div>
        <div class="example-card stagger-item hover-lift">
          <h3 class="example-card-title">Learn something</h3>
          <p>Explain quantum computing to me in simple terms.</p>
        </div>
        <div class="example-card stagger-item hover-lift">
          <h3 class="example-card-title">Get creative</h3>
          <p>Write a short poem about artificial intelligence and humanity.</p>
        </div>
      </div>
    `;
    
    chatMessages.appendChild(welcomeScreen);
    
    // Setup example card click events
    setupChatListeners();
    
    // Reload conversations
    loadUserConversations();
    
    return conversationId;
  } catch (error) {
    console.error('Error starting new chat:', error);
  }
}

// Store message in Firestore
async function storeMessageInFirestore(conversationId, role, content) {
  if (!currentUser || !conversationId) return;
  
  try {
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();
    
    // Save message
    await db.collection('users')
      .doc(currentUser.uid)
      .collection('conversations')
      .doc(conversationId)
      .collection('messages')
      .add({
        role: role,
        content: content,
        timestamp: timestamp
      });
    
    // Update conversation timestamp
    await db.collection('users')
      .doc(currentUser.uid)
      .collection('conversations')
      .doc(conversationId)
      .update({
        updatedAt: timestamp
      });
    
  } catch (error) {
    console.error('Error storing message:', error);
  }
}

// Update conversation preview
async function updateConversationPreview(conversationId, message) {
  if (!currentUser || !conversationId) return;
  
  try {
    // Generate a title from the first message if it's a new conversation
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (!conversation || conversation.title === 'New conversation') {
      // Generate a title from the user's first message
      let title = message.substring(0, 30);
      if (message.length > 30) {
        title += '...';
      }
      
      // Update conversation title
      await db.collection('users')
        .doc(currentUser.uid)
        .collection('conversations')
        .doc(conversationId)
        .update({
          title: title
        });
      
      // Update sidebar
      const sidebarItem = document.querySelector(`.sidebar-item[data-id="${conversationId}"] .sidebar-item-text`);
      if (sidebarItem) {
        sidebarItem.textContent = title;
      }
    }
  } catch (error) {
    console.error('Error updating conversation preview:', error);
  }
}

// Toggle user dropdown menu
userProfilePicture.addEventListener('click', function(event) {
  event.stopPropagation();
  userDropdownMenu.classList.toggle('show');
});

// Close dropdown when clicking elsewhere
document.addEventListener('click', function(event) {
  if (!userProfilePicture.contains(event.target) && !userDropdownMenu.contains(event.target)) {
    userDropdownMenu.classList.remove('show');
  }
});

// Settings modal - override the addEventListener from the duplicate code at the bottom
settingsMenuItem.addEventListener('click', function() {
  window.location.href = '/settings';
  userDropdownMenu.classList.remove('show');
});

// Handle upgrade plan option
upgradeMenuItem.addEventListener('click', function() {
  window.location.href = '/pricing';
  userDropdownMenu.classList.remove('show');
});

// Sidebar toggle functionality
function setupSidebarToggle() {
  console.log("Setting up sidebar toggle");
  
  // Desktop sidebar toggle - close sidebar
  sidebarToggle.addEventListener('click', () => {
    console.log("Closing sidebar");
    sidebar.classList.add('sidebar-collapsed');
  });
  
  // Open sidebar button (appears when sidebar is collapsed)
  sidebarOpenButton.addEventListener('click', () => {
    console.log("Opening sidebar from button");
    sidebar.classList.remove('sidebar-collapsed');
  });
  
  // Mobile sidebar toggle - toggle sidebar visibility
  sidebarToggleMobile.addEventListener('click', () => {
    console.log("Toggling mobile sidebar");
    sidebar.classList.toggle('sidebar-visible');
  });
  
  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        !sidebar.contains(e.target) && 
        e.target !== sidebarToggleMobile && 
        e.target !== sidebarOpenButton &&
        sidebar.classList.contains('sidebar-visible')) {
      console.log("Closing mobile sidebar from outside click");
      sidebar.classList.remove('sidebar-visible');
    }
  });
}

// Add a new chat button
document.querySelector('.sidebar-header').insertAdjacentHTML('afterend', `
  <div class="new-chat-button-container">
    <button class="new-chat-button">
      <span>New chat</span>
      <i class="fas fa-plus"></i>
    </button>
  </div>
`);
document.querySelector('.new-chat-button').addEventListener('click', startNewChat);

// Delete a conversation
async function deleteConversation(conversationId) {
  if (!currentUser || !conversationId) return;
  
  try {
    // Delete from Firestore
    await db.collection('users')
      .doc(currentUser.uid)
      .collection('conversations')
      .doc(conversationId)
      .delete();
    
    // Remove from local array
    conversations = conversations.filter(c => c.id !== conversationId);
    
    // Remove from UI
    const conversationItem = document.querySelector(`.sidebar-item[data-id="${conversationId}"]`);
    if (conversationItem) {
      const section = conversationItem.closest('.sidebar-section');
      conversationItem.remove();
      
      // If section is empty, remove it
      if (section && section.querySelectorAll('.sidebar-item').length === 0) {
        section.remove();
      }
    }
    
    // If deleted the active conversation, load another one or start a new chat
    if (conversationId === activeConversationId) {
      if (conversations.length > 0) {
        loadConversation(conversations[0].id);
      } else {
        // Clear chat and show welcome screen
        chatMessages.innerHTML = '';
        const welcomeScreen = document.createElement('div');
        welcomeScreen.className = 'welcome-screen animate-fade-in';
        welcomeScreen.innerHTML = `
          <h1 class="welcome-title">How can I help you today?</h1>
          <p class="welcome-subtitle">Ask me anything or try one of these examples:</p>
          
          <div class="examples-container">
            <div class="example-card stagger-item hover-lift">
              <h3 class="example-card-title">Plan a trip</h3>
              <p>Help me plan a 7-day trip to Japan with a detailed itinerary.</p>
            </div>
            <div class="example-card stagger-item hover-lift">
              <h3 class="example-card-title">Write code</h3>
              <p>Create a JavaScript function to fetch and display weather data from an API.</p>
            </div>
            <div class="example-card stagger-item hover-lift">
              <h3 class="example-card-title">Learn something</h3>
              <p>Explain quantum computing to me in simple terms.</p>
            </div>
            <div class="example-card stagger-item hover-lift">
              <h3 class="example-card-title">Get creative</h3>
              <p>Write a short poem about artificial intelligence and humanity.</p>
            </div>
          </div>
        `;
        chatMessages.appendChild(welcomeScreen);
        
        // Reset active conversation
        activeConversationId = null;
        
        // Show empty conversations message if no conversations left
        if (conversations.length === 0) {
          emptyConversations.style.display = 'flex';
        }
      }
    }
    
    console.log(`Conversation ${conversationId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting conversation:', error);
    alert('Failed to delete conversation. Please try again.');
  }
}

// Add message to chat with typing animation
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    if (!isUser) {
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-animation">
                    <span class="typing-cursor">${content}</span>
                </div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">
                ${content}
            </div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle sidebar toggle
document.getElementById('sidebar-toggle').addEventListener('click', function() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.add('collapsed');
});

// Handle sidebar open button
document.getElementById('sidebar-open-button').addEventListener('click', function() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.remove('collapsed');
});

// Mobile menu functionality
const mobileMenuButton = document.createElement('button');
mobileMenuButton.className = 'mobile-menu-button';
mobileMenuButton.innerHTML = '<i class="fas fa-bars"></i>';
document.querySelector('.chat-header').prepend(mobileMenuButton);

mobileMenuButton.addEventListener('click', () => {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('visible');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.sidebar');
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    
    if (window.innerWidth <= 768 && 
        !sidebar.contains(e.target) && 
        !mobileMenuButton.contains(e.target) && 
        sidebar.classList.contains('visible')) {
        sidebar.classList.remove('visible');
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    const sidebar = document.querySelector('.sidebar');
    if (window.innerWidth > 768) {
        sidebar.classList.remove('visible');
    }
});

// Prevent body scroll when sidebar is open on mobile
const body = document.body;

document.querySelector('.sidebar').addEventListener('transitionstart', () => {
    if (window.innerWidth <= 768) {
        if (document.querySelector('.sidebar').classList.contains('visible')) {
            body.style.overflow = 'hidden';
        } else {
            body.style.overflow = '';
        }
    }
});

// Direct function to create beta notification
function createBetaNotification() {
  console.log("createBetaNotification: Creating beta notification directly");
  
  // First check if it already exists and remove it if it does
  const existingNotification = document.getElementById('betaNotification');
  if (existingNotification) {
    console.log("Removing existing notification");
    existingNotification.remove();
  }
  
  // Create all elements explicitly
  const notification = document.createElement('div');
  notification.id = 'betaNotification';
  notification.style.position = 'fixed';
  notification.style.top = '50%';
  notification.style.left = '50%';
  notification.style.transform = 'translate(-50%, -50%)';
  notification.style.backgroundColor = '#111827';
  notification.style.color = '#ffffff';
  notification.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.35)';
  notification.style.borderRadius = '12px';
  notification.style.padding = '20px 25px';
  notification.style.width = '90%';
  notification.style.maxWidth = '500px';
  notification.style.zIndex = '9999';
  notification.style.display = 'flex';
  notification.style.alignItems = 'flex-start';
  notification.style.gap = '18px';
  notification.style.borderLeft = '5px solid #3b82f6';
  notification.style.backdropFilter = 'blur(10px)';
  
  // Icon container
  const iconContainer = document.createElement('div');
  iconContainer.style.fontSize = '1.7rem';
  iconContainer.style.color = '#3b82f6';
  iconContainer.style.flexShrink = '0';
  iconContainer.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
  iconContainer.style.width = '45px';
  iconContainer.style.height = '45px';
  iconContainer.style.borderRadius = '50%';
  iconContainer.style.display = 'flex';
  iconContainer.style.alignItems = 'center';
  iconContainer.style.justifyContent = 'center';
  
  const icon = document.createElement('i');
  icon.className = 'fas fa-info-circle';
  iconContainer.appendChild(icon);
  
  // Content container
  const contentContainer = document.createElement('div');
  contentContainer.style.flexGrow = '1';
  
  // Title
  const title = document.createElement('div');
  title.style.fontWeight = '700';
  title.style.fontSize = '1.15rem';
  title.style.marginBottom = '8px';
  title.style.color = '#fff';
  title.textContent = 'AI Beta Version Notice';
  
  // Message
  const message = document.createElement('div');
  message.style.fontSize = '0.95rem';
  message.style.color = 'rgba(255, 255, 255, 0.8)';
  message.style.marginBottom = '15px';
  message.style.lineHeight = '1.5';
  message.textContent = 'Our AI is currently in beta testing. The responses might be inaccurate, especially for complex code writing tasks. For more accurate and advanced AI capabilities, please consider upgrading to our premium plan.';
  
  // Action container
  const actionContainer = document.createElement('div');
  actionContainer.style.marginTop = '10px';
  
  // Button
  const button = document.createElement('button');
  button.id = 'upgrade-beta-btn';
  button.style.backgroundColor = '#3b82f6';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.padding = '8px 18px';
  button.style.borderRadius = '6px';
  button.style.fontSize = '0.9rem';
  button.style.fontWeight = '600';
  button.style.cursor = 'pointer';
  button.style.transition = 'all 0.2s';
  button.style.display = 'inline-flex';
  button.style.alignItems = 'center';
  button.style.gap = '8px';
  button.style.boxShadow = '0 2px 10px rgba(59, 130, 246, 0.3)';
  
  // Add icon to button
  const buttonIcon = document.createElement('i');
  buttonIcon.className = 'fas fa-crown';
  buttonIcon.style.fontSize = '0.85rem';
  
  const buttonText = document.createTextNode('Upgrade Plan');
  
  button.appendChild(buttonIcon);
  button.appendChild(buttonText);
  
  // Close button
  const closeButton = document.createElement('button');
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.color = 'rgba(255, 255, 255, 0.7)';
  closeButton.style.cursor = 'pointer';
  closeButton.style.fontSize = '1.1rem';
  closeButton.style.padding = '0';
  closeButton.style.marginLeft = 'auto';
  closeButton.style.flexShrink = '0';
  closeButton.style.width = '30px';
  closeButton.style.height = '30px';
  closeButton.style.display = 'flex';
  closeButton.style.alignItems = 'center';
  closeButton.style.justifyContent = 'center';
  closeButton.style.borderRadius = '50%';
  closeButton.style.transition = 'all 0.2s';
  
  const closeIcon = document.createElement('i');
  closeIcon.className = 'fas fa-times';
  closeButton.appendChild(closeIcon);
  
  // Assemble the notification
  actionContainer.appendChild(button);
  contentContainer.appendChild(title);
  contentContainer.appendChild(message);
  contentContainer.appendChild(actionContainer);
  
  notification.appendChild(iconContainer);
  notification.appendChild(contentContainer);
  notification.appendChild(closeButton);
  
  // Add to body
  document.body.appendChild(notification);
  console.log("Beta notification added to DOM");
  
  // Event listeners with hover effects
  closeButton.addEventListener('mouseover', () => {
    closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    closeButton.style.color = '#ffffff';
  });
  
  closeButton.addEventListener('mouseout', () => {
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.color = 'rgba(255, 255, 255, 0.7)';
  });
  
  button.addEventListener('mouseover', () => {
    button.style.backgroundColor = '#2563eb';
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
  });
  
  button.addEventListener('mouseout', () => {
    button.style.backgroundColor = '#3b82f6';
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 2px 10px rgba(59, 130, 246, 0.3)';
  });
  
  closeButton.addEventListener('click', () => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.remove();
      }
    }, 300);
  });
  
  button.addEventListener('click', () => {
    window.location.href = 'pricing.html';
  });
  
  // Show with animation
  notification.style.opacity = '0';
  notification.style.transform = 'translate(-50%, -40%)';
  notification.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translate(-50%, -50%)';
  }, 10);
  
  // Auto-hide after 20 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s, transform 0.3s';
      notification.style.transform = 'translate(-50%, -40%)';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.remove();
        }
      }, 300);
    }
  }, 20000);
} 