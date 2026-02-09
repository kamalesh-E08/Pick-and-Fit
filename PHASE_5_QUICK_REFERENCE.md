# Phase 5: Quick Reference Guide

## 🚀 Getting Started (5 minutes)

### Option A: Hugging Face (Cloud, Easiest)

```bash
# 1. Get token from https://huggingface.co/settings/tokens

# 2. Add to .env.local
HUGGING_FACE_TOKEN=hf_your_token_here

# 3. Run
npm run dev

# 4. Visit http://localhost:3000/ai-assistant
```

### Option B: Ollama (Local, Offline)

```bash
# 1. Download from https://ollama.ai
# 2. Run Ollama (starts at localhost:11434)
# 3. Download model: ollama pull mistral
# 4. Add to .env.local
NEXT_PUBLIC_USE_OLLAMA=true

# 5. Run
npm run dev

# 6. Visit http://localhost:3000/ai-assistant
```

---

## 📁 Project Structure

```
Phase 5 Files:
├── /lib/services/
│   ├── ai-assistant-service.ts    (AI with Ollama + HF)
│   └── speech-service.ts          (Voice-to-text)
├── /context/
│   └── ai-context.tsx             (State management)
├── /components/
│   ├── voice-input.tsx            (Voice capture UI)
│   └── ai-assistant.tsx           (Chat UI)
├── /app/
│   ├── api/ai-assistant/route.ts  (Main API)
│   ├── api/voice-search/route.ts  (Search API)
│   └── ai-assistant/page.tsx      (Main page)
└── Documentation/
    ├── PHASE_5_AI_ASSISTANT_SETUP.md
    ├── PHASE_5_SUMMARY.md
    └── PHASE_5_QUICK_REFERENCE.md (this file)
```

---

## 🎯 Key Features

| Feature            | Tech                  | Cost |
| ------------------ | --------------------- | ---- |
| Voice Input        | Web Speech API        | Free |
| AI Chat            | Ollama / Hugging Face | Free |
| Product Search     | Vector DB             | Free |
| Sizing Help        | AI Model              | Free |
| Styling Advice     | AI Model              | Free |
| Try-On Integration | Existing system       | Free |

---

## 🔗 Important URLs

| Page         | URL                      | Purpose             |
| ------------ | ------------------------ | ------------------- |
| AI Assistant | `/ai-assistant`          | Main chat interface |
| API          | `/api/ai-assistant`      | AI endpoint         |
| Search API   | `/api/voice-search`      | Voice search        |
| Voice Search | POST `/api/voice-search` | Product search      |

---

## 💬 Usage Examples

### Ask About Products

```
"What dresses do you have for weddings?"
"Show me professional attire options"
"I want casual summer wear"
```

### Ask About Sizing

```
"What's my correct jeans size?"
"How do you measure for shirts?"
"Are your sizes true to fit?"
```

### Ask About Styling

```
"What can I wear with blue jeans?"
"Suggest an outfit for a beach trip"
"What's trending this season?"
```

### Ask About Try-On

```
"Which dresses can I try virtually?"
"Suggest products for virtual try-on"
"Show me outfit combinations"
```

---

## 🔧 Environment Variables

```env
# REQUIRED for Hugging Face
HUGGING_FACE_TOKEN=hf_xxxx

# OPTIONAL - for Ollama (if running locally)
NEXT_PUBLIC_USE_OLLAMA=true
NEXT_PUBLIC_OLLAMA_URL=http://localhost:11434
NEXT_PUBLIC_OLLAMA_MODEL=mistral
```

---

## 🎤 Voice Commands Work Like This

```
User speaks:
  ↓
Browser captures audio (Web Speech API)
  ↓
Converts to text (e.g., "What dresses for weddings?")
  ↓
User sees transcript, can edit
  ↓
Clicks Send or presses Enter
  ↓
Text sent to /api/ai-assistant
  ↓
AI processes with context (user email, cart, etc.)
  ↓
Response appears in chat
  ↓
User can voice another question
```

---

## 🧠 AI Model Selection

### Ollama (Recommended for Most Users)

- ✅ Free
- ✅ Offline
- ✅ Fast on good hardware
- ✅ No API keys needed
- ❌ Requires decent computer
- ❌ Initial setup (download model)

**Install**: https://ollama.ai/download

### Hugging Face (Best for Web Apps)

- ✅ Free
- ✅ Easy setup
- ✅ Works everywhere
- ✅ No hardware needed
- ❌ Needs internet
- ❌ Rate limits
- ❌ Slower

**Get Token**: https://huggingface.co/settings/tokens

---

## 🚀 Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Check build output
npm run build 2>&1 | grep "✓"

# View logs (if using Ollama)
ollama ps

# Download a model
ollama pull llama2

# Stop Ollama
brew services stop ollama  # macOS
# Or just close the Ollama app

# Check if Ollama is running
curl http://localhost:11434/api/tags
```

---

## 🐛 Quick Troubleshooting

| Problem                    | Solution                                |
| -------------------------- | --------------------------------------- |
| "No AI service configured" | Set HUGGING_FACE_TOKEN or start Ollama  |
| "Voice not working"        | Grant microphone permission, use Chrome |
| "Ollama is slow"           | Close other apps, use smaller model     |
| "Hugging Face error 503"   | Service overloaded, try Ollama          |
| "No response from AI"      | Check internet, check API tokens        |
| "Build fails"              | Run `npm install`, clear `.next`        |

---

## 📊 Understanding the Flow

```
Frontend (Browser)
├─ VoiceInput (audio → text)
├─ AIAssistant (chat UI)
└─ AIContext (state)
    │
    API Layer (/app/api/)
    ├─ /api/ai-assistant (main chat)
    └─ /api/voice-search (product search)
        │
        Backend
        ├─ Ollama (local)
        │  └─ http://localhost:11434
        ├─ Hugging Face (cloud)
        │  └─ api-inference.huggingface.co
        └─ MongoDB (logs)
```

---

## ✅ Testing Checklist

### Quick Test (5 min)

- [ ] Start dev server: `npm run dev`
- [ ] Visit `/ai-assistant`
- [ ] Click "Start Voice Input"
- [ ] Say: "What products do you have?"
- [ ] See transcript appear
- [ ] Click Send
- [ ] See AI response

### Full Test (15 min)

- [ ] Test text input
- [ ] Test voice input (different questions)
- [ ] Check console for errors
- [ ] Test fallback (stop Ollama, should use HF)
- [ ] Test on mobile browser
- [ ] Test with different browsers

---

## 📈 Monitoring

### Check Service Status

```bash
# Ollama running?
curl http://localhost:11434/api/tags

# Hugging Face token valid?
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1 \
  -X POST -d "test"

# App API working?
curl http://localhost:3000/api/ai-assistant
```

### View Logs

```bash
# Browser console (F12)
- "Trying Ollama..."
- "Falling back to Hugging Face..."
- "Chat error: ..."

# Server logs (terminal)
- API call logs
- Error traces
- Performance metrics
```

---

## 🎯 Common Questions

**Q: Can I use both Ollama and Hugging Face?**
A: Yes! Set both configs, Ollama is primary, HF is fallback.

**Q: Will voice work without internet?**
A: Voice-to-text works offline (Web Speech API), but AI needs internet (unless using local Ollama).

**Q: Can I customize the AI personality?**
A: Yes, edit the system prompt in `ai-assistant-service.ts`.

**Q: How do I improve AI response quality?**
A: Use better models, provide more context, fine-tune on your data.

**Q: Can I use a different AI model?**
A: Yes, download any Ollama model or use different HF model.

**Q: Is my data private?**
A: Conversation logs are saved to your database. For Ollama, everything stays local.

**Q: Can I deploy to Vercel?**
A: Yes, but only with Hugging Face (Ollama needs always-on server).

---

## 🚀 Next Steps

1. **Choose your AI backend** (Ollama or Hugging Face)
2. **Configure environment variables**
3. **Test voice input and AI responses**
4. **Deploy to production**
5. **Monitor quality and user feedback**
6. **Iterate and improve**

---

## 📚 Documentation

| Document                     | Purpose               |
| ---------------------------- | --------------------- |
| `PHASE_5_SETUP.md`           | Detailed setup guide  |
| `PHASE_5_SUMMARY.md`         | Complete feature list |
| `PHASE_5_QUICK_REFERENCE.md` | This file             |

---

## 🎉 You're Ready!

Everything is set up and ready to use. Just:

1. Configure your AI backend (Hugging Face or Ollama)
2. Run `npm run dev`
3. Visit `http://localhost:3000/ai-assistant`
4. Start chatting!

---

**Questions?** Check the detailed setup guide: `PHASE_5_AI_ASSISTANT_SETUP.md`

**Issues?** See troubleshooting section above.

**Ready to deploy?** See deployment section in setup guide.

---

**Phase 5 Status: ✅ COMPLETE**  
**Build Status: ✅ PASSING**  
**Ready for Production: ✅ YES**

🎤🤖 Enjoy your new AI Shopping Assistant!
