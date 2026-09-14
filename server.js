const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ========================================
// GEMINI SETUP
// ========================================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// ========================================
// LOCAL OLLAMA SETUP
// ========================================
// Ollama runs the AI model locally on your computer.
// This keeps normal text generation independent of
// Gemini's request quota.
//
// Current local model:
// qwen2.5:0.5b
//
// If Ollama is unavailable, the app can fall back to Gemini.
// PDFs continue to use Gemini because this version sends
// the uploaded PDF directly to Gemini.

const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";
const OLLAMA_MODEL = "qwen2.5:0.5b";

// ========================================
// UPLOAD FOLDER
// ========================================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// ========================================
// PDF UPLOAD CONFIGURATION
// ========================================

const upload = multer({
    dest: uploadDir,

    limits: {
        fileSize: 50 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Only PDF files are allowed."
                )
            );
        }
    }
});

// ========================================
// MIDDLEWARE
// ========================================

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

// ========================================
// SLEEP FUNCTION
// ========================================

function sleep(ms) {

    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

// ========================================
// LOCAL OLLAMA GENERATION
// ========================================

async function generateWithOllama(prompt) {

    console.log("");
    console.log("=================================");
    console.log(`Trying local Ollama model: ${OLLAMA_MODEL}`);
    console.log("=================================");

    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, 180000);

    try {

        const response = await fetch(
            OLLAMA_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    model: OLLAMA_MODEL,
                    prompt: prompt,
                    stream: false
                }),

                signal: controller.signal
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                `Ollama returned HTTP ${response.status}.`
            );
        }

        const notes = data.response;

        if (!notes || !notes.trim()) {

            throw new Error(
                "Ollama returned an empty response."
            );
        }

        console.log("");
        console.log(
            `SUCCESS using local ${OLLAMA_MODEL}`
        );

        return {
            text: notes
        };

    } finally {

        clearTimeout(timeout);

    }
}

// ========================================
// GEMINI MODEL FALLBACK SYSTEM
// ========================================

async function generateWithRetry(contents) {

    const models = [
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.6-flash"
    ];

    let lastError = null;

    for (const model of models) {

        console.log("");
        console.log(
            "================================="
        );

        console.log(
            `Trying model: ${model}`
        );

        console.log(
            "================================="
        );

        for (
            let attempt = 0;
            attempt < 3;
            attempt++
        ) {

            try {

                console.log(
                    `${model} - attempt ${attempt + 1}`
                );

                const response =
                    await ai.models.generateContent({

                        model: model,

                        contents: contents

                    });

                console.log("");
                console.log(
                    `SUCCESS using ${model}`
                );

                return response;

            } catch (error) {

                lastError = error;

                console.error(
                    `${model} failed:`,
                    error.status,
                    error.message
                );

                // ====================================
                // 429 = QUOTA EXHAUSTED
                // ====================================

                if (error.status === 429) {

                    console.log("");
                    console.log(
                        `${model} quota exhausted.`
                    );

                    console.log(
                        "Moving to next model..."
                    );

                    break;
                }

                // ====================================
                // TEMPORARY ERRORS
                // ====================================

                const retryable =
                    error.status === 503 ||
                    error.status === 500 ||
                    error.status === 504;

                if (!retryable) {

                    throw error;
                }

                // ====================================
                // RETRY TEMPORARY ERROR
                // ====================================

                if (attempt < 2) {

                    const baseDelay =
                        2000 *
                        Math.pow(2, attempt);

                    const jitter =
                        Math.floor(
                            Math.random() * 1000
                        );

                    const delay =
                        baseDelay + jitter;

                    console.log(
                        `Waiting ${
                            Math.round(
                                delay / 1000
                            )
                        } seconds before retry...`
                    );

                    await sleep(delay);
                }
            }
        }

        console.log("");

        console.log(
            `${model} unavailable.`
        );

        console.log(
            "Trying next model..."
        );
    }

    // ====================================
    // ALL MODELS FAILED
    // ====================================

    throw lastError ||
        new Error(
            "All Gemini models are currently unavailable."
        );
}

// ========================================
// GENERATE NOTES API
// ========================================

app.post(
    "/api/generate",
    upload.single("pdf"),

    async (req, res) => {

        try {

            // ====================================
            // GET USER INPUT
            // ====================================

            const topic =
                req.body.topic || "";

            const level =
                req.body.level ||
                "High School";

            const length =
                req.body.length ||
                "Medium";

            const includeMCQ =
                req.body.includeMCQ === "true";

            const includeFlashcards =
                req.body.includeFlashcards === "true";

            // ====================================
            // VALIDATE TOPIC
            // ====================================

            if (!topic.trim()) {

                return res.status(400).json({

                    error:
                        "Please enter a topic."

                });
            }

            // ====================================
            // BASE PROMPT
            // ====================================

            let prompt = `

You are an expert educational AI.

Your job is to create accurate, useful,
well-structured study notes for students.

========================================
TOPIC
========================================

${topic}

========================================
STUDENT LEVEL
========================================

${level}

========================================
NOTE LENGTH
========================================

${length}

========================================
ACCURACY RULES
========================================

Accuracy is extremely important.

NEVER invent facts.

NEVER change important numbers.

NEVER change dates.

NEVER change percentages.

NEVER change measurements.

NEVER change scientific values.

NEVER change formulas.

NEVER change units.

NEVER remove important numerical information
just to make the notes shorter.

Preserve exactly:

- decimals
- fractions
- percentages
- ratios
- units
- dates
- years
- measurements
- constants
- equations
- scientific notation
- numerical values

Examples:

0.05 is NOT 0.5

25% is NOT 2.5%

3.14 is NOT 3.41

9.8 m/s² is NOT 98 m/s²

If a source contains a value, preserve
that value exactly.

========================================
PDF RULE
========================================

If a PDF is uploaded:

THE PDF IS THE PRIMARY SOURCE.

Use the uploaded PDF as the main reference.

Extract relevant information from it.

Pay special attention to:

- headings
- definitions
- concepts
- important facts
- dates
- years
- numbers
- percentages
- formulas
- equations
- numerical examples
- solved problems
- tables
- examples
- processes
- diagrams
- scientific values
- units

Do not replace important information from
the PDF with generic information.

If the PDF contains a numerical example,
preserve its values.

If the PDF contains a formula,
preserve it accurately.

If the PDF contains a table,
present the important information clearly.

If the PDF contains an important diagram,
describe it clearly.

========================================
MATHEMATICS
========================================

For mathematical expressions,
use LaTeX.

Inline formulas:

$E = mc^2$

Display formulas:

$$
v = u + at
$$

Use proper notation for:

- fractions
- powers
- roots
- equations
- inequalities
- algebra
- geometry
- trigonometry
- calculus
- statistics
- scientific notation

Examples:

$$
\\frac{a}{b}
$$

$$
x^2 + 5x + 6 = 0
$$

$$
\\sqrt{x}
$$

========================================
NUMERICAL PROBLEMS
========================================

If the topic contains numerical problems,
worked examples or calculations:

DO NOT give only the final answer.

Show the complete solution.

Use this structure:

### Numerical Example

**Given:**

List all known values with units.

**Formula:**

Write the correct formula.

**Substitution:**

Put the numerical values into the formula.

**Calculation:**

Show the calculation step by step.

**Answer:**

Give the final answer with the correct unit.

Example:

**Given:**

u = 10 m/s

a = 2 m/s²

t = 5 s

**Formula:**

v = u + at

**Substitution:**

v = 10 + (2 × 5)

**Calculation:**

v = 10 + 10

**Answer:**

v = 20 m/s

Always check calculations carefully.

Do not skip useful intermediate steps.

========================================
DIAGRAMS
========================================

Create a diagram when it genuinely helps
explain:

- processes
- cycles
- sequences
- hierarchies
- relationships

Use Mermaid.

Use ONLY simple Mermaid syntax.

Example:

\`\`\`mermaid
flowchart TD
    A[Input] --> B[Process]
    B --> C[Output]
\`\`\`

Another example:

\`\`\`mermaid
flowchart TD
    A[Sunlight] --> B[Photosynthesis]
    B --> C[Glucose]
    B --> D[Oxygen]
\`\`\`

Important:

Keep node labels short.

Do NOT use:

- complicated HTML
- JavaScript
- extremely long labels
- nested Mermaid syntax
- unsupported special syntax

Only create a diagram when useful.

Do not force a diagram into every topic.

========================================
NOTE STRUCTURE
========================================

Use this structure:

# ${topic}

## 1. Quick Overview

Explain the topic clearly and simply.

## 2. Key Concepts

Explain the most important concepts.

## 3. Important Points

Use concise bullet points.

## 4. Important Numbers, Dates & Facts

Include all important:

- numbers
- dates
- percentages
- measurements
- facts

## 5. Formulas

Include important formulas when applicable.

Explain what each symbol means.

## 6. Solved Numericals

If numerical problems are relevant,
provide solved examples.

Use:

- Given
- Formula
- Substitution
- Calculation
- Final Answer with Unit

## 7. Examples

Give useful examples.

## 8. Important Keywords

List important terms with short meanings.

## 9. Diagram / Visual Explanation

Create a simple Mermaid diagram if useful.

## 10. Exam Revision

Give the most important points to remember.

`;

            // ====================================
            // PDF HANDLING
            // ====================================

            let uploadedFile = null;

            if (req.file) {

                console.log("");
                console.log(
                    "PDF received:",
                    req.file.originalname
                );

                // Upload PDF to Gemini

                uploadedFile =
                    await ai.files.upload({

                        file:
                            req.file.path,

                        config: {
                            mimeType:
                                "application/pdf"
                        }

                    });

                prompt += `

========================================
UPLOADED PDF
========================================

A PDF has been uploaded.

Use the PDF as the PRIMARY REFERENCE.

Base the notes primarily on the uploaded PDF.

Preserve important information from the PDF.

Pay special attention to:

- definitions
- headings
- concepts
- examples
- numbers
- dates
- formulas
- equations
- tables
- numerical problems
- diagrams
- processes
- units

Do not unnecessarily replace PDF content
with general knowledge.

If the PDF contains a solved numerical,
explain it step by step.

If the PDF contains a formula,
preserve it accurately.

If the PDF contains important numerical data,
do not round or alter it.

`;

            } else {

                prompt += `

========================================
NO PDF
========================================

No PDF was uploaded.

Use reliable general knowledge.

`;

            }

            // ====================================
            // OPTIONAL MCQS
            // ====================================

            if (includeMCQ) {

                prompt += `

========================================
MCQs
========================================

## 11. MCQs

Create 5 useful MCQs.

Each MCQ must contain:

A. Option

B. Option

C. Option

D. Option

Clearly identify the correct answer.

For numerical MCQs:

- calculate carefully
- check the answer
- preserve units
- avoid incorrect options

`;

            }

            // ====================================
            // OPTIONAL FLASHCARDS
            // ====================================

            if (includeFlashcards) {

                prompt += `

========================================
FLASHCARDS
========================================

## 12. Flashcards

Create 5 useful question-and-answer
flashcards for revision.

Keep the answers accurate and concise.

`;

            }

            // ====================================
            // FINAL INSTRUCTIONS
            // ====================================

            prompt += `

========================================
FINAL RULES
========================================

Return clean Markdown.

Preserve every important number.

Preserve every important formula.

Preserve every important date.

Preserve every percentage.

Preserve every decimal.

Preserve every fraction.

Preserve units.

Check calculations carefully.

Do not invent facts.

Do not change source values.

Use simple language appropriate for:

${level}

Make the notes useful for:

- studying
- understanding
- revision
- exams

`;

            // ====================================
            // CREATE GEMINI CONTENT
            // ====================================

            let contents;

            if (uploadedFile) {

                contents = [

                    {
                        text: prompt
                    },

                    {
                        fileData: {

                            mimeType:
                                uploadedFile.mimeType,

                            fileUri:
                                uploadedFile.uri

                        }
                    }

                ];

            } else {

                contents = prompt;

            }

            // ====================================
            // GENERATE AI RESPONSE
            // ====================================

            console.log("");
            console.log(
                "Starting AI generation..."
            );

            let response;

            // ====================================
            // CHOOSE AI ENGINE
            // ====================================
            //
            // No PDF:
            //   Use the local Ollama model first.
            //
            // PDF uploaded:
            //   Use Gemini because this version sends
            //   the PDF directly to Gemini.
            //
            // If local Ollama is unavailable for a normal
            // text request, automatically fall back to Gemini.

            if (!uploadedFile) {

                try {

                    response =
                        await generateWithOllama(
                            prompt
                        );

                } catch (ollamaError) {

                    console.error("");
                    console.error(
                        "Local Ollama failed:"
                    );

                    console.error(
                        ollamaError.message
                    );

                    console.log(
                        "Falling back to Gemini..."
                    );

                    response =
                        await generateWithRetry(
                            contents
                        );
                }

            } else {

                response =
                    await generateWithRetry(
                        contents
                    );
            }

            // ====================================
            // GET NOTES
            // ====================================

            const notes =
                response.text;

            if (!notes) {

                throw new Error(
                    "The AI returned an empty response."
                );
            }

            console.log("");
            console.log(
                "Notes generated successfully!"
            );

            // ====================================
            // SEND RESPONSE
            // ====================================

            return res.json({

                success: true,

                notes: notes

            });

        } catch (error) {

            console.error("");
            console.error(
                "================================="
            );

            console.error(
                "ERROR:"
            );

            console.error(error);

            console.error(
                "================================="
            );

            // ====================================
            // FRIENDLY QUOTA ERROR
            // ====================================

            if (error.status === 429) {

                return res.status(429).json({

                    error:
                        "Gemini free-tier quota is currently exhausted. The app automatically tried the available fallback models, but no model was available right now. Please try again after the quota resets."

                });

            }

            // ====================================
            // GENERAL ERROR
            // ====================================

            return res.status(500).json({

                error:
                    error.message ||
                    "Something went wrong while generating notes."

            });

        } finally {

            // ====================================
            // DELETE TEMPORARY PDF
            // ====================================

            if (req.file) {

                try {

                    fs.unlinkSync(
                        req.file.path
                    );

                    console.log(
                        "Temporary PDF deleted."
                    );

                } catch (deleteError) {

                    console.log(
                        "Could not delete temporary PDF."
                    );

                }
            }
        }
    }
);

// ========================================
// MULTER ERROR HANDLER
// ========================================

app.use(
    (error, req, res, next) => {

        if (
            error instanceof multer.MulterError
        ) {

            return res.status(400).json({

                error:
                    "PDF upload error: " +
                    error.message

            });
        }

        if (error) {

            return res.status(400).json({

                error:
                    error.message

            });
        }

        next();
    }
);

// ========================================
// START SERVER
// ========================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");
        console.log(
            "================================="
        );

        console.log(
            "AI Notes Generator is running!"
        );

        console.log(
            `http://localhost:${PORT}`
        );

        console.log(
            `Local AI: ${OLLAMA_MODEL}`
        );

        console.log(
            "PDF mode: Gemini"
        );

        console.log(
            "================================="
        );

    }
);