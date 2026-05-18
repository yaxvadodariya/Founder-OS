import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import twilio from 'twilio';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Memory store for recent tasks to be picked up by the client
export const recentTasks: any[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON middleware, but we need to verify Slack requests if needed
  // For simplicity since the user just wants the flow, we'll parse JSON 
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Twilio client setup (lazy init)
  let twilioClient: twilio.Twilio | null = null;
  const getTwilio = () => {
    if (!twilioClient) {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      }
    }
    return twilioClient;
  };

  // Slack Events Webhook Endpoint
  app.post('/api/slack/events', async (req, res) => {
    // 1. Respond to Slack url_verification challenge
    if (req.body.type === 'url_verification') {
      return res.status(200).json({ challenge: req.body.challenge });
    }

    // 2. Handle incoming messages
    if (req.body.event && req.body.event.type === 'message' && !req.body.event.bot_id) {
      // Respond to Slack immediately to prevent retries
      res.status(200).end();

      const text = req.body.event.text;
      const user = req.body.event.user;

      console.log(`Received Slack message from ${user}: ${text}`);

      try {
        // Use Gemini to determine if this is a task and extract project/task details
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Analyze the following message from a client on Slack. 
Does it contain a request for a new task or a new project?
If it does, extract the project name (if applicable, or invent a concise one based on context), the task title, description, and status.
If it doesn't clearly request work, set isTask to false.

Message: "${text}"`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isTask: { type: Type.BOOLEAN, description: "Whether the message represents an actionable task/project" },
                projectName: { type: Type.STRING, description: "Name of the project. If not explicit, derive a short name. Or null if standard." },
                taskTitle: { type: Type.STRING, description: "Short title for the task" },
                taskDescription: { type: Type.STRING, description: "Detailed description of what needs to be done" },
                priority: { type: Type.STRING, enum: ["low", "medium", "high"], description: "Derived urgency" }
              },
              required: ["isTask"]
            }
          }
        });

        const parsed = JSON.parse(response.text || '{}');
        
        if (parsed.isTask) {
          console.log('Gemini detected a task:', parsed);
          
          // Add to our memory store for the UI to pick up
          const newTask = {
            id: 'evt_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            projectName: parsed.projectName || 'Uncategorized Slack Tasks',
            title: parsed.taskTitle,
            description: parsed.taskDescription,
            priority: parsed.priority || 'medium',
            source: 'slack',
            timestamp: new Date().toISOString()
          };
          
          recentTasks.push(newTask);

          // Trigger WhatsApp reminder
          const client = getTwilio();
          const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
          const toNumber = process.env.USER_WHATSAPP_NUMBER;
          
          if (client && fromNumber && toNumber) {
            await client.messages.create({
              body: `*New Task from Slack!*\n\n*Project:* ${newTask.projectName}\n*Task:* ${newTask.title}\n*Priority:* ${newTask.priority}\n\n"${newTask.description}"`,
              from: `whatsapp:${fromNumber}`,
              to: `whatsapp:${toNumber}`
            });
            console.log('WhatsApp notification sent successfully.');
          } else {
            console.log('Twilio credentials or numbers not fully configured; skipping WhatsApp notification.');
          }
        } else {
          console.log('Gemini determined message is not a task.');
        }

      } catch (err) {
        console.error('Error processing Slack message with Gemini/Twilio:', err);
      }
      return;
    }

    res.status(200).send('Event received');
  });

  // Polling endpoint for the React client to fetch new tasks that were captured
  app.get('/api/tasks/pending', (req, res) => {
    res.json({ tasks: recentTasks });
  });

  // Endpoint for the client to mark an event as processed so we can remove it from memory
  app.post('/api/tasks/processed', (req, res) => {
    const { id } = req.body;
    if (id) {
      const idx = recentTasks.findIndex(t => t.id === id);
      if (idx !== -1) {
        recentTasks.splice(idx, 1);
      }
    }
    res.json({ success: true });
  });

  app.post('/api/magic-parse', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following message (copied from Slack, Email, etc.). 
Extract the potential project name, task title, description, and status.

Message: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              projectName: { type: Type.STRING, description: "Name of the project. If not explicit, derive a short name. Or null if standard." },
              taskTitle: { type: Type.STRING, description: "Short title for the task" },
              taskDescription: { type: Type.STRING, description: "Detailed description of what needs to be done" },
              priority: { type: Type.STRING, enum: ["low", "medium", "high"], description: "Derived urgency" }
            },
            required: ["taskTitle"]
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      
      // We return the parsed data to the client so it can create the task in Firestore natively
      res.status(200).json(parsed);

      // Async: Send WhatsApp notification via Twilio
      const client = getTwilio();
      const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
      const toNumber = process.env.USER_WHATSAPP_NUMBER;
      
      if (client && fromNumber && toNumber && parsed.taskTitle) {
        client.messages.create({
          body: `*New Task (Magic Paste)!*\n\n*Project:* ${parsed.projectName || 'Uncategorized'}\n*Task:* ${parsed.taskTitle}\n*Priority:* ${parsed.priority || 'medium'}\n\n"${parsed.taskDescription || ''}"`,
          from: `whatsapp:${fromNumber}`,
          to: `whatsapp:${toNumber}`
        }).catch(err => console.error('WhatsApp Magic Parse send failed:', err));
      }

    } catch (err: any) {
      console.error('Error in Magic Parse:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Twilio WhatsApp Notification for Transactions
  app.post('/api/notify/transaction', async (req, res) => {
    try {
      const client = getTwilio();
      const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
      const toNumber = process.env.USER_WHATSAPP_NUMBER;
      
      console.log('Sending transaction alert to WhatsApp:', { fromNumber, toNumber, hasClient: !!client });

      if (!client || !fromNumber || !toNumber) {
        return res.status(500).json({ error: 'Twilio credentials not configured. Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER, and USER_WHATSAPP_NUMBER to Environment Variables.' });
      }

      const { type, amount, category, description } = req.body;
      const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
      const isIncome = type === 'income';

      await client.messages.create({
        body: `*New ${isIncome ? 'Income' : 'Expense'} Recorded!*\n\n*Amount:* ${formattedAmount}\n*Category:* ${category}\n*Description:* ${description}\n\nBalance updated on your dashboard.`,
        from: `whatsapp:${fromNumber}`,
        to: `whatsapp:${toNumber}`
      });

      res.status(200).json({ success: true });
    } catch (err: any) {
      console.error('Error sending WhatsApp notification:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
