
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const ollama = require("ollama").default;

const app = express();
const execFileAsync = promisify(execFile);

const upload = multer({
  dest: path.join(__dirname, "../uploads"),
  limits: { fileSize: 15 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../../public")));

const products = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../data/products.json"),
    "utf8"
  )
);

const sessions = new Map();

function searchProducts(query) {
  const terms = query.toLowerCase().split(/\s+/);

  return products.filter((product) => {
    const searchable = [
      product.name,
      product.category,
      product.description,
      product.id
    ].join(" ").toLowerCase();

    return terms.some((term) =>
      term.length > 2 && searchable.includes(term)
    );
  });
}

function getProductContext(query) {
  const matches = searchProducts(query);

  if (!matches.length) {
    return "No matching products were found in the CRM.";
  }

  return JSON.stringify(matches);
}

async function transcribeAudio(filePath) {
  const buffer = fs.readFileSync(filePath);

  const form = new FormData();
  form.append(
    "file",
    new Blob([buffer]),
    path.basename(filePath)
  );

  const response = await fetch(
    `${process.env.STT_URL}/transcribe`,
    {
      method: "POST",
      body: form
    }
  );

  if (!response.ok) {
    throw new Error(`STT failed: ${await response.text()}`);
  }

  return response.json();
}

async function generateReply(userText, sessionId, mode, customerName) {
  const productContext = getProductContext(userText);

  const systemPrompt = `
You are a professional CRM voice assistant.

You work for a company selling products.

Rules:
1. Understand Tamil, English and Tanglish.
2. Reply in the same language as the customer.
3. If the customer speaks Tamil, use natural Tamil script.
4. If the customer speaks English, use English.
5. Be conversational and concise because you are speaking over a call.
6. Only provide product prices and stock values from CRM data.
7. Never invent product details, prices or availability.
8. If a product is not found, politely ask for its name.
9. Do not claim that an order or payment was completed.
10. Do not disclose customer information without verification.

Call mode: ${mode}
Customer: ${customerName || "Demo customer"}

CRM product search results:
${productContext}
`;

  const previousMessages = sessions.get(sessionId) || [];

  const messages = [
    { role: "system", content: systemPrompt },
    ...previousMessages,
    { role: "user", content: userText }
  ];

  const result = await ollama.chat({
    model: process.env.OLLAMA_MODEL,
    messages,
    stream: false,
    options: {
      temperature: 0.3,
      num_predict: 160
    }
  });

  const reply = result.message.content;

  sessions.set(sessionId, [
    ...previousMessages,
    { role: "user", content: userText },
    { role: "assistant", content: reply }
  ].slice(-10));

  return reply;
}

async function generateSpeech(text, outputPath) {
  const containsTamil = /[\u0B80-\u0BFF]/.test(text);
  const voice = containsTamil ? "ta" : "en";

  await execFileAsync("espeak-ng", [
    "-v", voice,
    "-s", "145",
    "-w", outputPath,
    text
  ]);
}

app.post(
  "/api/voice/turn",
  upload.single("audio"),
  async (req, res) => {
    let uploadedPath;
    let audioPath;

    try {
      const {
        sessionId = "demo-session",
        mode = "inbound",
        customerName = "Demo customer",
        text
      } = req.body;

      let userText = text;

      if (req.file) {
        uploadedPath = req.file.path;

        const transcription = await transcribeAudio(uploadedPath);
        userText = transcription.text;
      }

      if (!userText || !userText.trim()) {
        return res.status(400).json({
          error: "No speech or text was received."
        });
      }

      const reply = await generateReply(
        userText,
        sessionId,
        mode,
        customerName
      );

      audioPath = path.join(
        __dirname,
        "../uploads",
        `${Date.now()}-${Math.random().toString(36).slice(2)}.wav`
      );

      await generateSpeech(reply, audioPath);

      const audioUrl = `/api/voice/audio/${path.basename(audioPath)}`;

      res.json({
        sessionId,
        mode,
        userText,
        reply,
        audioUrl
      });

    } catch (error) {
      console.error("Voice API error:", error);

      res.status(500).json({
        error: "Voice processing failed.",
        details: error.message
      });

    } finally {
      if (uploadedPath && fs.existsSync(uploadedPath)) {
        fs.unlinkSync(uploadedPath);
      }
    }
  }
);

app.get("/api/voice/audio/:filename", (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(__dirname, "../uploads", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Audio not found" });
  }

  res.sendFile(filePath);
});

app.post("/api/voice/end", (req, res) => {
  const { sessionId } = req.body;

  sessions.delete(sessionId);

  res.json({ success: true });
});

app.get("/api/voice/health", (req, res) => {
  res.json({
    status: "ok",
    services: ["node", "ollama", "whisper", "espeak-ng"]
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "127.0.0.1", () => {
  console.log(`CRM Voice Agent running at http://localhost:${PORT}`);
});
