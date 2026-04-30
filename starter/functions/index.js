// functions/index.js — suppa-agent v0.001
// ───────────────────────────────────────────────────────
// Backend Cloud Functions. All AI logic and persistence
// requiring privileges lives here.
// ───────────────────────────────────────────────────────
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
const GEMINI_KEY = defineSecret('GEMINI_API_KEY');

// VERSION sync point 6 of 7. Keep aligned with constants.js, html metas, package.jsons.
const VERSION = '0.001.0';

// ───────────────────────────────────────────────────────
// Helper: log to Code Tester
// Call this whenever something important happens, so it
// shows up in the green floating console at bottom-right.
// ───────────────────────────────────────────────────────
async function logTester(type, message, meta = {}, uid = null, severity = 'info') {
  try {
    await db.collection('testerLogs').add({
      type, message, meta, uid, severity,
      version: VERSION,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error('Error writing testerLog:', err);
  }
}

// ───────────────────────────────────────────────────────
// Helper: check whether email is in the whitelist
// ───────────────────────────────────────────────────────
async function checkAuthorized(email) {
  const doc = await db.collection('authorizedUsers').doc(email).get();
  return doc.exists;
}

// ═════════════════════════════════════════════════════
// chatWithGemini — main chat entry point
// ═════════════════════════════════════════════════════
exports.chatWithGemini = onCall(
  {
    secrets: [GEMINI_KEY],
    region: 'europe-west1',
    timeoutSeconds: 540,
    memory: '512MiB',
    maxInstances: 10
  },
  async (request) => {
    const startTime = Date.now();

    // 1. Validations
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }
    const uid = request.auth.uid;
    const email = request.auth.token.email;

    if (!await checkAuthorized(email)) {
      await logTester('error', 'Unauthorized email', { email }, uid, 'error');
      throw new HttpsError('permission-denied', 'Email not authorized');
    }

    const { chatId, userMessage } = request.data || {};
    if (!chatId || !userMessage || typeof userMessage !== 'string') {
      throw new HttpsError('invalid-argument', 'chatId and userMessage required');
    }
    if (userMessage.length > 100000) {
      throw new HttpsError('invalid-argument', 'Message too long');
    }

    try {
      // 2. Verify or create chat
      const chatRef = db.collection('chats').doc(chatId);
      const chatDoc = await chatRef.get();

      if (!chatDoc.exists) {
        await chatRef.set({
          ownerId: uid,
          title: userMessage.slice(0, 60),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          messageCount: 0
        });
      } else if (chatDoc.data().ownerId !== uid) {
        throw new HttpsError('permission-denied', 'Not chat owner');
      }

      // 3. Load FULL history to maximize Gemini's context (1M tokens)
      const messagesSnap = await chatRef
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .get();

      const history = messagesSnap.docs.map(d => ({
        role: d.data().role === 'assistant' ? 'model' : 'user',
        parts: [{ text: d.data().content }]
      }));

      // 4. Call Gemini
      const genAI = new GoogleGenerativeAI(GEMINI_KEY.value());
      const model = genAI.getGenerativeModel({
        // Default model: gemini-2.5-pro (1M tokens context, multimodal)
        // Alternatives: 'gemini-2.5-flash', 'gemini-3-pro', 'gemini-3-flash'
        model: 'gemini-2.5-pro',
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.7
        }
        // To specialize this app, add a systemInstruction here:
        // systemInstruction: 'You are a helpful assistant...'
      });

      const chat = model.startChat({ history });

      // For image support, replace the next line with the multimodal version
      // documented in MANUAL.pdf Phase 10.6 (parts array with inlineData)
      const result = await chat.sendMessage(userMessage);
      const responseText = result.response.text();
      const usage = result.response.usageMetadata || {};

      // 5. Persist messages atomically
      const batch = db.batch();

      const userMsgRef = chatRef.collection('messages').doc();
      batch.set(userMsgRef, {
        role: 'user',
        content: userMessage,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      const assistantMsgRef = chatRef.collection('messages').doc();
      batch.set(assistantMsgRef, {
        role: 'assistant',
        content: responseText,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        tokensIn: usage.promptTokenCount || 0,
        tokensOut: usage.candidatesTokenCount || 0
      });

      batch.update(chatRef, {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        messageCount: admin.firestore.FieldValue.increment(2)
      });

      await batch.commit();

      // 6. Log to Code Tester
      await logTester('gemini-call', `Chat ${chatId.slice(0, 8)} (${history.length} msgs)`, {
        chatId,
        historyLen: history.length,
        tokensIn: usage.promptTokenCount,
        tokensOut: usage.candidatesTokenCount,
        ms: Date.now() - startTime
      }, uid, 'info');

      return {
        response: responseText,
        usage: {
          tokensIn: usage.promptTokenCount,
          tokensOut: usage.candidatesTokenCount
        }
      };

    } catch (err) {
      await logTester('error', err.message || 'unknown', { chatId, stack: err.stack?.slice(0, 500) }, uid, 'error');
      if (err instanceof HttpsError) throw err;
      throw new HttpsError('internal', err.message || 'Internal error');
    }
  }
);

// ═════════════════════════════════════════════════════
// healthCheck — liveness probe
// ═════════════════════════════════════════════════════
exports.healthCheck = onCall(
  { region: 'europe-west1' },
  async () => ({ ok: true, version: VERSION, timestamp: Date.now() })
);
