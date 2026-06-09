export class DocumentSocket {
  constructor(documentId, callbacks = {}) {
    this.documentId = documentId;
    this.callbacks = {
      onMessage: () => {},
      onConnect: () => {},
      onDisconnect: () => {},
      onError: () => {},
      ...callbacks
    };
    
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = 3000;
    this.isClosedIntentionally = false;
  }

  connect() {
    this.isClosedIntentionally = false;
    const token = localStorage.getItem('token');
    if (!token) {
      this.callbacks.onError(new Error('No authentication token found'));
      return;
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    // Convert HTTP URL to WS URL
    let wsUrl = apiBase.replace(/^http/, 'ws');
    wsUrl = `${wsUrl}/ws/document/${this.documentId}?token=${token}`;

    console.log(`Connecting to WebSocket: ${wsUrl}`);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected successfully');
      this.reconnectAttempts = 0;
      this.callbacks.onConnect();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.callbacks.onMessage(message);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    this.ws.onclose = (event) => {
      console.log(`WebSocket disconnected: code=${event.code}, reason=${event.reason}`);
      this.callbacks.onDisconnect(event);

      if (!this.isClosedIntentionally && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Reconnecting attempt ${this.reconnectAttempts} in ${this.reconnectTimeout}ms...`);
        setTimeout(() => this.connect(), this.reconnectTimeout);
      }
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket error encountered:', err);
      this.callbacks.onError(err);
    };
  }

  send(event, payload = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, ...payload }));
    } else {
      console.warn('Cannot send message. WebSocket is not open.');
    }
  }

  sendUpdate(title, content) {
    this.send('document_update', { title, content });
  }

  sendTyping(isTyping) {
    this.send('user_typing', { is_typing: isTyping });
  }

  sendCursor(cursor) {
    this.send('cursor_move', { cursor });
  }

  disconnect() {
    this.isClosedIntentionally = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
