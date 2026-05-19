import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import twilio from 'twilio';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import cron from 'node-cron';

// Import config directly
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

// Initialize Gemini safely
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (err) {
  console.warn('Could not initialize GoogleGenAI', err);
}

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || '(default)');

// In-Memory store for reminders
let pendingTasks: any[] = [];
let pendingNotes: any[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

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

  // Schedule cron for morning (8:00 AM) and night (8:00 PM) everyday
  const sendReminders = async (timeOfDay: 'Morning' | 'Night') => {
    const client = getTwilio();
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    const toNumber = process.env.USER_WHATSAPP_NUMBER;
    
    if (!client || !fromNumber || !toNumber) return;

    if (pendingTasks.length === 0 && pendingNotes.length === 0) {
      return; 
    }

    let rawData = `Pending Tasks:\n`;
    pendingTasks.slice(0, 10).forEach(t => rawData += `- ${t.title} ${t.priority === 'high' ? '(🔥 High)' : ''}\n`);
    rawData += `\nRemember Notes:\n`;
    pendingNotes.slice(0, 5).forEach(n => rawData += `- ${n.title}\n`);

    let messageBody = '';

    if (ai && timeOfDay === 'Morning') {
      try {
        const response = await ai.models.generateContent({
           model: 'gemini-2.5-flash',
           contents: `Write a beautiful, inspiring, and concise morning message for Yaksh. Start with something like "Good morning Yaksh, I hope you have a great day ahead!"
Then weave in these pending tasks and things to remember, highlighting what needs action today:
${rawData}
Keep it structured, easy to read for WhatsApp, and encouraging.`
        });
        messageBody = response.text || '';
      } catch (e) {
        console.error('AI generation failed for morning reminder:', e);
      }
    }

    if (!messageBody) {
      messageBody = `*${timeOfDay} Reminder:*\n\n${rawData}`;
    }

    try {
      await client.messages.create({
        body: messageBody,
        from: `whatsapp:${fromNumber}`,
        to: `whatsapp:${toNumber}`
      });
    } catch (err) {
      console.error('Failed to send scheduled reminders:', err);
    }
  };

  // 8:00 AM
  cron.schedule('0 8 * * *', () => sendReminders('Morning'));
  // 8:00 PM
  cron.schedule('0 20 * * *', () => sendReminders('Night'));

  // Sync Reminders API
  app.post('/api/sync-reminders', (req, res) => {
    try {
      const { tasks = [], notes = [] } = req.body;
      pendingTasks = tasks;
      pendingNotes = notes;
      res.status(200).json({ success: true, tasksCount: pendingTasks.length, notesCount: pendingNotes.length });
    } catch (err: any) {
      console.error('Error syncing reminders:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Slack Events Webhook Endpoint
  app.post('/api/slack/events', async (req, res) => {
    if (req.body.type === 'url_verification') {
      return res.status(200).json({ challenge: req.body.challenge });
    }

    if (req.body.event && req.body.event.type === 'message' && !req.body.event.bot_id) {
      res.status(200).end();
      if (!ai || !db) return;

      const text = req.body.event.text;
      const user = req.body.event.user;

      try {
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
          const newTask = {
            id: 'evt_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            projectName: parsed.projectName || 'Uncategorized Slack Tasks',
            title: parsed.taskTitle,
            description: parsed.taskDescription,
            priority: parsed.priority || 'medium',
            source: 'slack',
            type: 'task',
            timestamp: new Date().toISOString()
          };
          
          await setDoc(doc(db, 'webhook_queue', newTask.id), newTask);

          const client = getTwilio();
          const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
          const toNumber = process.env.USER_WHATSAPP_NUMBER;
          
          if (client && fromNumber && toNumber) {
            await client.messages.create({
              body: `*New Task from Slack!*\n\n*Project:* ${newTask.projectName}\n*Task:* ${newTask.title}\n*Priority:* ${newTask.priority}\n\n"${newTask.description}"`,
              from: `whatsapp:${fromNumber}`,
              to: `whatsapp:${toNumber}`
            });
          }
        }
      } catch (err) {
        console.error('Error processing Slack message:', err);
      }
      return;
    }

    res.status(200).send('Event received');
  });

  app.post('/api/magic-parse', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      if (!ai) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not set.' });
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
      res.status(200).json(parsed);

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

  app.post('/api/notify/transaction', async (req, res) => {
    try {
      const client = getTwilio();
      const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
      const toNumber = process.env.USER_WHATSAPP_NUMBER;
      
      if (!client || !fromNumber || !toNumber) {
        return res.status(500).json({ error: 'Twilio credentials not configured. Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER, and USER_WHATSAPP_NUMBER to Environment Variables.' });
      }

      const { type, amount, category, description } = req.body;
      const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
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

  app.post('/api/twilio/webhook', async (req, res) => {
    try {
      const messageBody = req.body.Body;
      const fromNumber = req.body.From; 

      if (!messageBody) {
        return res.status(200).send('<Response></Response>');
      }

      if (!ai || !db) {
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message("Configuration error: Please set GEMINI_API_KEY and Firebase.");
        return res.type('text/xml').send(twiml.toString());
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze this message. The user might be trying to log an expense, log an income, create a task, or create a note (for Remember Book).
If they say "remember X" or the message starts with "remember", it's a note.
If they say "task X" or it starts with "task", it's a task.
Extract the relevant details based on the detected type.

Message: "${messageBody}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedType: { type: Type.STRING, enum: ["transaction", "task", "note", "unknown"], description: "Type of the message" },
              
              // For transaction
              transactionType: { type: Type.STRING, enum: ["income", "expense"] },
              amount: { type: Type.NUMBER },
              category: { type: Type.STRING, enum: ["personal", "business"] },
              categoryDetail: { type: Type.STRING, description: "single word like Food, Transport, Salary, Shopping, Other" },
              paymentMethod: { type: Type.STRING, description: "e.g. Cash, UPI, Bank Transfer or Unspecified" },
              description: { type: Type.STRING },

              // For task
              taskTitle: { type: Type.STRING },
              taskPriority: { type: Type.STRING, enum: ["low", "medium", "high"] },
              
              // For note
              noteTitle: { type: Type.STRING },
              noteContent: { type: Type.STRING }
            },
            required: ["detectedType"]
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');

      if (parsed.detectedType === 'transaction' && parsed.amount) {
        const newTransaction = {
          id: 'evt_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
          type: parsed.transactionType || 'expense',
          actionType: 'transaction',
          amount: Number(parsed.amount),
          category: (parsed.category || 'personal').toLowerCase(),
          categoryDetail: parsed.categoryDetail || 'Other',
          paymentMethod: parsed.paymentMethod || 'Unspecified',
          description: parsed.description || 'Added via WhatsApp',
          timestamp: new Date().toISOString()
        };

        await setDoc(doc(db, 'webhook_queue', newTransaction.id), newTransaction);

        const twiml = new twilio.twiml.MessagingResponse();
        const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(newTransaction.amount);
        twiml.message(`Got it! I queued an ${newTransaction.type} of ${formattedAmount} for "${newTransaction.description}". It will be added to your dashboard shortly.`);
        
        res.type('text/xml').send(twiml.toString());
      } else if (parsed.detectedType === 'task') {
        const newTask = {
          id: 'evt_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
          actionType: 'task',
          source: 'whatsapp',
          title: parsed.taskTitle || messageBody,
          priority: parsed.taskPriority || 'medium',
          description: 'Added via WhatsApp',
          timestamp: new Date().toISOString()
        };

        await setDoc(doc(db, 'webhook_queue', newTask.id), newTask);

        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message(`Got it! Task "${newTask.title}" added to your Tasks Tab.`);
        res.type('text/xml').send(twiml.toString());
      } else if (parsed.detectedType === 'note') {
        const newNote = {
          id: 'evt_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
          actionType: 'note',
          title: parsed.noteTitle || 'Quick Note',
          content: parsed.noteContent || messageBody,
          timestamp: new Date().toISOString()
        };

        await setDoc(doc(db, 'webhook_queue', newNote.id), newNote);

        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message(`Saved! Note "${newNote.title}" added to your Remember Book.`);
        res.type('text/xml').send(twiml.toString());
      } else {
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message(`I'm sorry, I couldn't understand that. Try starting your message with "task" or "remember".`);
        res.type('text/xml').send(twiml.toString());
      }
    } catch (err) {
      console.error('Error handling Twilio webhook:', err);
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message("Sorry, I encountered an error processing your message.");
      res.type('text/xml').send(twiml.toString());
    }
  });

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
