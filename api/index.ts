import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import twilio from 'twilio';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Import config directly so Vercel includes it in the build
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

let firebaseApp: any = null;
let db: any = null;
try {
  firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || '(default)');
} catch (e) {
  console.error("Firebase init failed", e);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (e) {
  console.error("Gemini init failed", e);
}

const getTwilio = () => {
  let twilioClient = null;
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
};

// Scheduled Reminders Builder function
const sendReminders = async (timeOfDay: 'Morning' | 'Night') => {
  const client = getTwilio();
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  const toNumber = process.env.USER_WHATSAPP_NUMBER;
  
  if (!client || !fromNumber || !toNumber) {
    console.warn('Twilio credentials or user number missing for reminders');
    return;
  }

  let syncedTasks: any[] = [];
  let syncedNotes: any[] = [];

  try {
    const snap = await getDoc(doc(db, 'webhook_queue', 'reminders'));
    if (snap.exists()) {
      const data = snap.data();
      syncedTasks = data.tasks || [];
      syncedNotes = data.notes || [];
    }
  } catch (err) {
    console.error('Failed to get synced reminders from Firestore:', err);
  }

  if (syncedTasks.length === 0 && syncedNotes.length === 0) {
    console.log('No pending tasks or remember notes to remind.');
    return; 
  }

  let rawData = `Pending Tasks:\n`;
  syncedTasks.slice(0, 10).forEach(t => rawData += `- ${t.title} ${t.priority === 'high' ? '(🔥 High)' : ''}\n`);
  rawData += `\nRemember Notes:\n`;
  syncedNotes.slice(0, 5).forEach(n => rawData += `- ${n.title || n.content}\n`);

  let messageBody = '';

  if (ai) {
    try {
      if (timeOfDay === 'Morning') {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Write a beautiful, inspiring, and concise morning message for Yaksh. Start with something lovely like "Good morning Yaksh, I hope you have a wonderful day ahead!" or "Hello Yaksh, have a fantastic morning!".
Based on the current projects and tasks, specify what needs action today or what is scheduled.
Weave in these pending tasks and things to remember in a natural, positive, and motivating way:
${rawData}
Keep it structured, visual with emojis, easy to read for WhatsApp, and encouraging.`
        });
        messageBody = response.text || '';
      } else {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Write a structured and concise evening reminder message for Yaksh. Review these remaining tasks and notes:
${rawData}
Kindly remind him of any pending tasks that need attention tomorrow, end on an encouraging note, and keep it formatted beautifully for WhatsApp.`
        });
        messageBody = response.text || '';
      }
    } catch (e) {
      console.error('AI generation failed for scheduled reminder:', e);
    }
  }

  if (!messageBody) {
    messageBody = `*${timeOfDay} Reminder for Yaksh:*\n\n${rawData}`;
  }

  try {
    await client.messages.create({
      body: messageBody,
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${toNumber}`
    });
    console.log(`WhatsApp digest sent successfully for ${timeOfDay}`);
  } catch (err) {
    console.error('Failed to send scheduled reminders:', err);
  }
};

// Slack Events Webhook Endpoint
app.post('/api/slack/events', async (req, res) => {
  if (req.body.type === 'url_verification') {
    return res.status(200).json({ challenge: req.body.challenge });
  }
  if (req.body.event && req.body.event.type === 'message' && !req.body.event.bot_id) {
    res.status(200).end();
    if (!ai || !db) return;
    const { text, user } = req.body.event;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following message from a client on Slack. Does it contain a request for a new task or a new project?
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
    } catch (err) {}
    return;
  }
  res.status(200).send('Event received');
});

// Magic Parse API
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

// Sync Reminders to Firestore so background daemons and serverless routes access it accurately
app.post('/api/sync-reminders', async (req, res) => {
  try {
    const { tasks = [], notes = [] } = req.body;
    if (db) {
      await setDoc(doc(db, 'webhook_queue', 'reminders'), {
        tasks,
        notes,
        updatedAt: new Date().toISOString()
      });
    }
    res.status(200).json({ success: true, tasksCount: tasks.length, notesCount: notes.length });
  } catch (err: any) {
    console.error('Error syncing reminders:', err);
    res.status(500).json({ error: err.message });
  }
});

// Test Reminder routing trigger
app.post('/api/test-reminder', async (req, res) => {
  try {
    const { timeOfDay = 'Morning' } = req.body;
    await sendReminders(timeOfDay === 'Night' ? 'Night' : 'Morning');
    res.status(200).json({ success: true, message: `Test WhatsApp reminder sent for ${timeOfDay}` });
  } catch (err: any) {
    console.error('Error in test-reminder route:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notify/transaction', async (req, res) => {
  try {
    const client = getTwilio();
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    const toNumber = process.env.USER_WHATSAPP_NUMBER;
    if (!client || !fromNumber || !toNumber) return res.status(500).json({ error: 'Twilio setup missing.' });

    const { type, amount, category, description } = req.body;
    const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    
    await client.messages.create({
      body: `*New ${type === 'income' ? 'Income' : 'Expense'} Recorded!*\n\n*Amount:* ${formattedAmount}\n*Category:* ${category}\n*Description:* ${description}\n\nBalance updated on your dashboard.`,
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${toNumber}`
    });
    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/twilio/webhook', async (req, res) => {
  try {
    const messageBody = req.body.Body;

    if (!messageBody) return res.status(200).send('<Response></Response>');

    if (!ai || !db) {
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message("Configuration error: Please set GEMINI_API_KEY and Firebase.");
      return res.type('text/xml').send(twiml.toString());
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this message. The user wants to:
1. Log a financial transaction (if they describe spent/received money, cash, expense, income, e.g., "500 for groceries", "1000 received").
2. Create a task (if the message starts with "task", "new task", or includes "task", e.g., "task get up early", "new task study", etc.).
3. Create a note in the Remember Book (if the message starts with "remember", "remeber", or contains "remember info", "remember X", e.g. "Remember ipdc needs to study", "remember buy milk").

Rules for matching:
- If the message has word "remember", "remeber", "rember" as a command or prefix, detectedType MUST be "note".
- If the message has word "task" or starts with "task", detectedType MUST be "task".
- Otherwise, if it has financial context (spent, earned, etc.), detectedType is "transaction".

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
      twiml.message(`Saved! Note "${newNote.content}" added to your Remember Book.`);
      res.type('text/xml').send(twiml.toString());
    } else {
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(`I'm sorry, I couldn't understand that. Try starting your message with "task" or "remember".`);
      res.type('text/xml').send(twiml.toString());
    }
  } catch (err) {
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("Sorry, I encountered an error helper.");
    res.type('text/xml').send(twiml.toString());
  }
});

export default app;
