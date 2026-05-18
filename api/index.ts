import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import twilio from 'twilio';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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
    const fromNumber = req.body.From;

    if (!messageBody) return res.status(200).send('<Response></Response>');

    if (!ai || !db) {
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message("Configuration error: Please set GEMINI_API_KEY and Firebase.");
        return res.type('text/xml').send(twiml.toString());
    }

    const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Analyze this message. The user might be trying to log an expense, log an income, or create a task.
Extract the relevant details if it's a financial transaction (expense/income).
If it's an expense or income, provide amount, category, description, and type.
Message: "${messageBody}"`,
    config: {
        responseMimeType: "application/json",
        responseSchema: {
        type: Type.OBJECT,
        properties: {
            isTransaction: { type: Type.BOOLEAN, description: "True if this is an expense or income" },
            type: { type: Type.STRING, enum: ["income", "expense"] },
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING },
            description: { type: Type.STRING }
        },
        required: ["isTransaction"]
        }
    }
    });

    const parsed = JSON.parse(response.text || '{}');

    if (parsed.isTransaction && parsed.amount) {
    const newTransaction = {
        id: 'evt_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        type: parsed.type || 'expense',
        actionType: 'transaction',
        amount: Number(parsed.amount),
        category: (parsed.category || 'personal').toLowerCase(),
        description: parsed.description || 'Added via WhatsApp',
        timestamp: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'webhook_queue', newTransaction.id), newTransaction);

    const twiml = new twilio.twiml.MessagingResponse();
    const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(newTransaction.amount);
    twiml.message(`Got it! I queued an ${newTransaction.type} of ${formattedAmount} for "${newTransaction.description}". It will be added to your dashboard shortly.`);
    res.type('text/xml').send(twiml.toString());
    } else {
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(`I'm sorry, I couldn't understand that as an expense or income. Try saying "Spent 500 on groceries".`);
    res.type('text/xml').send(twiml.toString());
    }
} catch (err) {
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("Sorry, I encountered an error.");
    res.type('text/xml').send(twiml.toString());
}
});

export default app;
