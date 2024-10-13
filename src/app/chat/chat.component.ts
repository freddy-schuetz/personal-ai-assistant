import { Component, OnInit, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ObservableArray, ApplicationSettings, alert, Utils } from '@nativescript/core';
import { request, HttpResponse } from '@nativescript/core/http';
import { RouterExtensions } from '@nativescript/angular';

interface Message {
  role: string;
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'ns-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  messages: ObservableArray<Message> = new ObservableArray<Message>();
  userInput: string = '';
  isProcessing: boolean = false;
  baseUrl: string = '';

  constructor(
    private http: HttpClient,
    private ngZone: NgZone,
    private routerExtensions: RouterExtensions
  ) {}

  ngOnInit() {
    this.loadChatHistory();
    this.loadSettings();
  }

  loadChatHistory() {
    const savedMessages = ApplicationSettings.getString('chatHistory');
    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages);
      this.messages = new ObservableArray<Message>(parsedMessages);
    } else {
      this.messages.push({
        role: 'assistant',
        content: 'Hallo Freddy. Wie kann ich dir helfen?',
        timestamp: new Date()
      });
    }
  }

  loadSettings() {
    const savedApiUrl = ApplicationSettings.getString('apiUrl');
    if (savedApiUrl) {
      this.baseUrl = savedApiUrl;
    } else {
      this.baseUrl = 'http://static.108.101.245.188.clients.your-server.de:11434';
    }
  }

  sendMessage() {
    if (this.userInput.trim() === '' || this.isProcessing) return;

    const userMessage: Message = {
      role: 'user',
      content: this.userInput.trim(),
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    this.isProcessing = true;

    this.callOllamaAPI(userMessage.content);

    this.userInput = '';
  }

  async callOllamaAPI(userMessage: string) {
    const apiUrl = `${this.baseUrl}/api/chat`;
    const body = {
      model: 'llama3.2',
      messages: this.messages.map(m => ({ role: m.role, content: m.content }))
    };

    try {
      const response: HttpResponse = await request({
        url: apiUrl,
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        content: JSON.stringify(body)
      });

      if (response.statusCode === 200) {
        const responseText = response.content.toString();
        console.log('API Response:', responseText);
        const responseLines = responseText.split('\n').filter(line => line.trim() !== '');
        let assistantContent = '';

        for (const line of responseLines) {
          try {
            const lineData = JSON.parse(line);
            if (lineData.message && lineData.message.content) {
              assistantContent += lineData.message.content;
            }
          } catch (error) {
            console.error('Error parsing line:', line, error);
          }
        }

        if (assistantContent) {
          const assistantMessage: Message = {
            role: 'assistant',
            content: assistantContent,
            timestamp: new Date()
          };

          this.ngZone.run(() => {
            this.messages.push(assistantMessage);
            this.isProcessing = false;
            this.saveChatHistory();
          });
        } else {
          throw new Error('No valid content in response');
        }
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      console.error('API Error:', error);
      this.ngZone.run(() => {
        this.isProcessing = false;
        alert('Es gab einen Fehler bei der Verarbeitung Ihrer Anfrage.');
      });
    }
  }

  saveChatHistory() {
    ApplicationSettings.setString('chatHistory', JSON.stringify(this.messages));
  }

  clearChatHistory() {
    this.messages.splice(0);
    this.saveChatHistory();
    this.messages.push({
      role: 'assistant',
      content: 'Hallo Freddy. Wie kann ich dir helfen?',
      timestamp: new Date()
    });
  }

  goToSettings() {
    this.routerExtensions.navigate(['/settings']);
  }

  formatTimestamp(timestamp: Date): string {
    const date = new Date(timestamp);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  copyMessage(message: Message) {
    Utils.copyToClipboard(message.content);
    alert('Nachricht in die Zwischenablage kopiert');
  }
}