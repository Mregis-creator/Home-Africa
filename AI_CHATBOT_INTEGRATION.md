# 🤖 AI Chatbot Integration Guide

## Overview

The HOME AFRICA AI chatbot is designed to:
- Answer common questions about listings, bookings, and services
- Help users search for apartments, cars, and land plots
- Guide users through the booking process
- Provide 24/7 customer support

---

## 🗄️ Database Architecture for AI Chatbot

### **Core Tables:**

1. **`chat_conversations`** - Stores conversation sessions
   - Tracks user sessions (logged in or anonymous)
   - Stores conversation context and user intent
   - Links to interested listings

2. **`chat_messages`** - Individual messages
   - User messages and AI responses
   - Stores intent, entities, and confidence scores
   - Links to conversations

3. **`ai_knowledge_base`** - FAQ and knowledge base
   - Pre-defined Q&A pairs
   - Searchable with full-text search
   - Tracks usage and helpfulness

4. **`ai_training_data`** - Training data for improvement
   - Stores user queries and correct responses
   - Used to improve AI accuracy over time

5. **`ai_analytics`** - Performance metrics
   - Tracks conversation stats
   - Measures user satisfaction
   - Monitors response times

---

## 🚀 Quick Setup

### **Step 1: Add Supabase Scripts**

Add to your HTML files (before closing `</body>`):

```html
<!-- Supabase Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-config.js"></script>

<!-- AI Chatbot -->
<script src="js/ai-chatbot.js"></script>
```

### **Step 2: Configure Supabase**

1. Update `js/supabase-config.js` with your credentials:
```javascript
const SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key'
};
```

2. Run the SQL schema (`DATABASE_SCHEMA_WITH_AI.sql`) in Supabase SQL Editor

### **Step 3: Initialize Chatbot**

The chatbot will automatically initialize when the page loads. No additional code needed!

---

## 🎨 Customization

### **Styling**

The chatbot styles are injected via JavaScript. To customize:

1. Edit `injectChatbotStyles()` in `js/ai-chatbot.js`
2. Modify CSS variables or classes
3. Match your brand colors (currently uses #0ff and #8fff00)

### **Welcome Messages**

Edit `sendWelcomeMessage()` in `js/ai-chatbot.js`:

```javascript
const welcomeMessages = [
  "Your custom welcome message",
  "Another message",
  "And another..."
];
```

### **Knowledge Base**

Add FAQs via Supabase dashboard or SQL:

```sql
INSERT INTO ai_knowledge_base (category, question, answer, keywords, priority) VALUES
('general', 'Your question?', 'Your answer', ARRAY['keyword1', 'keyword2'], 10);
```

---

## 🔧 Advanced Features

### **1. Intent Detection**

The chatbot detects intents:
- `search_listing` - User wants to find properties
- `ask_question` - User has a question
- `book_viewing` - User wants to schedule a viewing
- `greeting` - User is greeting the bot

**Customize in `detectIntent()` method**

### **2. Entity Extraction**

Extracts from user messages:
- Property type (apartment, car, land)
- Location (Kigali, districts)
- Price range
- Other relevant info

**Customize in `extractEntities()` method**

### **3. Listing Search**

When user asks to search:
1. Extracts entities (type, location, price)
2. Queries Supabase `listings` table
3. Returns matching listings
4. Displays as clickable cards

### **4. Knowledge Base Search**

Uses PostgreSQL full-text search:
- Searches question, answer, and keywords
- Returns most relevant FAQ
- Tracks usage for analytics

---

## 📊 Analytics & Monitoring

### **View Conversation Stats**

```sql
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_conversations,
    AVG(message_count) as avg_messages_per_conversation
FROM conversation_summaries
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### **Most Common Intents**

```sql
SELECT 
    intent,
    COUNT(*) as count
FROM chat_messages
WHERE role = 'user'
GROUP BY intent
ORDER BY count DESC;
```

### **User Satisfaction**

```sql
SELECT 
    AVG(user_satisfaction) as avg_satisfaction,
    COUNT(*) as total_ratings
FROM chat_conversations
WHERE user_satisfaction IS NOT NULL;
```

---

## 🔌 Integration with External AI Services

### **Option 1: OpenAI GPT Integration**

Enhance responses with GPT:

```javascript
async function getGPTResponse(message, context) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer YOUR_OPENAI_API_KEY`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are HOME AFRICA assistant. Help users find properties and answer questions.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 150
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
```

### **Option 2: Google Dialogflow**

Integrate Dialogflow for advanced NLP:

1. Create Dialogflow agent
2. Set up webhook to Supabase
3. Update `processMessage()` to call Dialogflow API

### **Option 3: Custom ML Model**

Train your own model:
1. Collect training data in `ai_training_data` table
2. Export data for training
3. Deploy model (TensorFlow.js, ONNX, etc.)
4. Integrate predictions in `processMessage()`

---

## 🛡️ Security & Privacy

### **Row Level Security (RLS)**

Already configured in schema:
- Users can only see their own conversations
- Anonymous users use session IDs
- Knowledge base is public read-only

### **Data Privacy**

- Conversations stored securely in PostgreSQL
- User data encrypted at rest
- No sensitive data in messages
- GDPR compliant structure

---

## 🧪 Testing

### **Test Intent Detection**

```javascript
// In browser console
window.homeAfricaChatbot.detectIntent("Show me apartments in Kigali");
// Should return: 'search_listing'
```

### **Test Entity Extraction**

```javascript
window.homeAfricaChatbot.extractEntities("I want a car under 10 million in Kigali");
// Should return: { type: 'car', location: 'kigali', price_max: 10000000 }
```

### **Test Knowledge Base**

```javascript
window.homeAfricaChatbot.handleAskQuestion("What is HOME AFRICA?");
// Should return answer from knowledge base
```

---

## 📈 Performance Optimization

### **1. Caching**

Cache frequently asked questions:
```javascript
const cache = new Map();
// Cache knowledge base results for 5 minutes
```

### **2. Debouncing**

Debounce rapid user messages:
```javascript
let debounceTimer;
function debounceSearch(query, delay = 300) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => search(query), delay);
}
```

### **3. Lazy Loading**

Load conversation history on demand:
```javascript
async function loadMoreMessages(conversationId, offset = 0) {
  // Load messages in batches
}
```

---

## 🐛 Troubleshooting

### **Chatbot not appearing**
- Check if Supabase is configured
- Verify scripts are loaded in correct order
- Check browser console for errors

### **Messages not saving**
- Verify RLS policies are set correctly
- Check Supabase connection
- Ensure conversation_id exists

### **Search not working**
- Verify listings table exists
- Check RLS policies allow SELECT
- Test Supabase query directly

### **Knowledge base not responding**
- Check if FAQs are inserted
- Verify `is_active = true`
- Test full-text search manually

---

## 🚀 Next Steps

1. **Add More Intents**
   - Payment questions
   - Account management
   - Merchant inquiries

2. **Enhance Entity Extraction**
   - Use NLP libraries (compromise.js, natural)
   - Add more location recognition
   - Extract dates/times for bookings

3. **Add Voice Support**
   - Web Speech API
   - Text-to-speech for responses

4. **Multi-language Support**
   - Kinyarwanda translations
   - French support
   - Language detection

5. **Analytics Dashboard**
   - Visualize conversation stats
   - Track popular questions
   - Monitor satisfaction trends

---

## 📚 Resources

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Full-Text Search:** https://www.postgresql.org/docs/current/textsearch.html
- **Web Speech API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- **OpenAI API:** https://platform.openai.com/docs

---

**Last Updated:** January 2025

