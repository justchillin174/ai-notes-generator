const topicInput = document.getElementById("topic");
const pdfFile = document.getElementById("pdfFile");
const fileName = document.getElementById("fileName");

const level = document.getElementById("level");
const length = document.getElementById("length");

const mcq = document.getElementById("mcq");
const flashcards = document.getElementById("flashcards");

const generateButton = document.getElementById("generateButton");
const loading = document.getElementById("loading");

const resultCard = document.getElementById("resultCard");
const notes = document.getElementById("notes");

const copyButton = document.getElementById("copyButton");
const downloadButton = document.getElementById("downloadButton");
const saveButton = document.getElementById("saveButton");

const generateTab = document.getElementById("generateTab");
const yourNotesTab = document.getElementById("yourNotesTab");

const generatorPage = document.getElementById("generatorPage");
const yourNotesPage = document.getElementById("yourNotesPage");

const savedNotesContainer = document.getElementById("savedNotes");
const startCreatingButton = document.getElementById("startCreatingButton");

const themeButton = document.getElementById("themeButton");


/* =========================
   MERMAID
========================= */

if (window.mermaid) {
    mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose"
    });
}


/* =========================
   PDF NAME
========================= */

pdfFile.addEventListener("change", () => {

    if (pdfFile.files.length > 0) {
        fileName.textContent = pdfFile.files[0].name;
    } else {
        fileName.textContent = "No file selected";
    }

});


/* =========================
   MARKDOWN → HTML
========================= */

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}


function markdownToHtml(markdown) {

    let text = markdown;

    /*
       Protect Mermaid blocks
    */

    const mermaidBlocks = [];

    text = text.replace(
        /```mermaid\s*([\s\S]*?)```/gi,
        function (_, code) {

            const index = mermaidBlocks.length;

            mermaidBlocks.push(code.trim());

            return `@@MERMAID_${index}@@`;
        }
    );


    /*
       Protect code blocks
    */

    const codeBlocks = [];

    text = text.replace(
        /```([\s\S]*?)```/g,
        function (_, code) {

            const index = codeBlocks.length;

            codeBlocks.push(code.trim());

            return `@@CODE_${index}@@`;
        }
    );


    text = escapeHtml(text);


    /*
       Headings
    */

    text = text.replace(
        /^### (.*)$/gm,
        "<h3>$1</h3>"
    );

    text = text.replace(
        /^## (.*)$/gm,
        "<h2>$1</h2>"
    );

    text = text.replace(
        /^# (.*)$/gm,
        "<h1>$1</h1>"
    );


    /*
       Bold
    */

    text = text.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );


    /*
       Bullet lists
    */

    text = text.replace(
        /^\s*[-*] (.*)$/gm,
        "<li>$1</li>"
    );

    text = text.replace(
        /(<li>.*<\/li>\n?)+/g,
        function (match) {
            return `<ul>${match}</ul>`;
        }
    );


    /*
       Numbered lists
    */

    text = text.replace(
        /^\s*\d+\.\s+(.*)$/gm,
        "<li>$1</li>"
    );


    /*
       Paragraphs
    */

    const lines = text.split("\n");

    let html = "";

    for (const line of lines) {

        const trimmed = line.trim();

        if (!trimmed) {
            continue;
        }

        if (
            trimmed.startsWith("<h1>") ||
            trimmed.startsWith("<h2>") ||
            trimmed.startsWith("<h3>") ||
            trimmed.startsWith("<ul>") ||
            trimmed.startsWith("<li>") ||
            trimmed.startsWith("@@")
        ) {
            html += trimmed;
        } else {
            html += `<p>${trimmed}</p>`;
        }
    }


    /*
       Code blocks
    */

    codeBlocks.forEach((code, index) => {

        html = html.replace(
            `@@CODE_${index}@@`,
            `<pre><code>${escapeHtml(code)}</code></pre>`
        );

    });


    /*
       Mermaid blocks
    */

    mermaidBlocks.forEach((code, index) => {

        html = html.replace(
            `@@MERMAID_${index}@@`,
            `<div class="mermaid">${code}</div>`
        );

    });


    return html;
}


/* =========================
   GENERATE NOTES
========================= */

generateButton.addEventListener("click", async () => {

    const topic = topicInput.value.trim();

    if (!topic && !pdfFile.files.length) {

        alert("Please enter a topic or upload a PDF.");

        return;
    }


    const formData = new FormData();

    formData.append("topic", topic);
    formData.append("level", level.value);
    formData.append("length", length.value);
    formData.append("mcq", mcq.checked);
    formData.append("flashcards", flashcards.checked);


    if (pdfFile.files.length > 0) {
        formData.append("pdf", pdfFile.files[0]);
    }


    generateButton.disabled = true;
    loading.style.display = "flex";

    resultCard.style.display = "none";


    try {

        const response = await fetch("/api/generate", {
            method: "POST",
            body: formData
        });


        const data = await response.json();


        if (!response.ok) {
            throw new Error(data.error || "Failed to generate notes.");
        }


        const generatedText =
            data.notes ||
            data.content ||
            data.text ||
            "";


        if (!generatedText) {
            throw new Error("No notes were returned.");
        }


        notes.innerHTML = markdownToHtml(generatedText);

        resultCard.style.display = "block";


        /*
           Render Mermaid diagrams
        */

        if (window.mermaid) {

            try {

                await mermaid.run({
                    querySelector: ".mermaid"
                });

            } catch (error) {

                console.error(
                    "Mermaid rendering error:",
                    error
                );

            }

        }


        /*
           Render MathJax
        */

        if (window.MathJax) {

            await MathJax.typesetPromise([
                notes
            ]);

        }


        resultCard.scrollIntoView({
            behavior: "smooth"
        });


        /*
           Store current generated note temporarily
        */

        window.currentNote = {
            title: topic || "PDF Notes",
            content: generatedText,
            html: notes.innerHTML,
            date: new Date().toISOString()
        };


    } catch (error) {

        console.error(error);

        alert(
            "Something went wrong:\n\n" +
            error.message
        );

    } finally {

        generateButton.disabled = false;
        loading.style.display = "none";

    }

});


/* =========================
   SAVE NOTES
========================= */

saveButton.addEventListener("click", () => {

    if (!window.currentNote) {

        alert("Generate some notes first.");

        return;
    }


    const savedNotes =
        JSON.parse(
            localStorage.getItem("studyNotes") || "[]"
        );


    const note = {
        id: Date.now(),
        title: window.currentNote.title,
        content: window.currentNote.content,
        html: window.currentNote.html,
        date: window.currentNote.date
    };


    savedNotes.unshift(note);


    localStorage.setItem(
        "studyNotes",
        JSON.stringify(savedNotes)
    );


    saveButton.textContent = "✅ Saved";

    setTimeout(() => {
        saveButton.textContent = "💾 Save";
    }, 1500);


    loadSavedNotes();

});


/* =========================
   LOAD SAVED NOTES
========================= */

function loadSavedNotes() {

    const savedNotes =
        JSON.parse(
            localStorage.getItem("studyNotes") || "[]"
        );


    if (savedNotes.length === 0) {

        savedNotesContainer.innerHTML = `
            <div class="empty-notes">

                <div class="empty-icon">📚</div>

                <h2>No saved notes yet</h2>

                <p>
                    Generate and save your first set of notes.
                </p>

                <button
                    id="startCreatingButton"
                    class="generate-button"
                >
                    ✨ Create Notes
                </button>

            </div>
        `;


        document
            .getElementById("startCreatingButton")
            .addEventListener(
                "click",
                showGenerator
            );


        return;
    }


    savedNotesContainer.innerHTML = "";


    savedNotes.forEach(note => {

        const card =
            document.createElement("div");

        card.className = "saved-note-card";


        const date =
            new Date(note.date)
                .toLocaleDateString();


        card.innerHTML = `

            <h3>${escapeHtml(note.title)}</h3>

            <div class="saved-note-date">
                Saved ${date}
            </div>

            <div class="saved-note-actions">

                <button
                    class="open-note"
                    data-id="${note.id}"
                >
                    📖 Open
                </button>

                <button
                    class="download-saved"
                    data-id="${note.id}"
                >
                    📥 Download
                </button>

                <button
                    class="delete-note"
                    data-id="${note.id}"
                >
                    🗑️
                </button>

            </div>
        `;


        savedNotesContainer.appendChild(card);

    });


    /*
       Open buttons
    */

    document
        .querySelectorAll(".open-note")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(button.dataset.id);

                    openSavedNote(id);

                }
            );

        });


    /*
       Download buttons
    */

    document
        .querySelectorAll(".download-saved")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(button.dataset.id);

                    downloadNoteById(id);

                }
            );

        });


    /*
       Delete buttons
    */

    document
        .querySelectorAll(".delete-note")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(button.dataset.id);

                    deleteNote(id);

                }
            );

        });

}


/* =========================
   OPEN SAVED NOTE
========================= */

function openSavedNote(id) {

    const savedNotes =
        JSON.parse(
            localStorage.getItem("studyNotes") || "[]"
        );


    const note =
        savedNotes.find(
            item => item.id === id
        );


    if (!note) return;


    showGenerator();


    notes.innerHTML = note.html;

    resultCard.style.display = "block";


    window.currentNote = note;


    resultCard.scrollIntoView({
        behavior: "smooth"
    });


    /*
       Re-render maths
    */

    if (window.MathJax) {

        MathJax.typesetPromise([
            notes
        ]);

    }

}


/* =========================
   DELETE NOTE
========================= */

function deleteNote(id) {

    const savedNotes =
        JSON.parse(
            localStorage.getItem("studyNotes") || "[]"
        );


    const updated =
        savedNotes.filter(
            note => note.id !== id
        );


    localStorage.setItem(
        "studyNotes",
        JSON.stringify(updated)
    );


    loadSavedNotes();

}


/* =========================
   DOWNLOAD PDF
========================= */

async function downloadPDF(
    title,
    htmlContent
) {

    /*
       Uses browser print system.

       On desktop:
       choose "Save as PDF".

       On phones:
       the browser can use its
       share/save/print options.
    */

    const printWindow =
        window.open(
            "",
            "_blank"
        );


    if (!printWindow) {

        alert(
            "Please allow pop-ups to download your notes."
        );

        return;
    }


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>${escapeHtml(title)}</title>

            <style>

                body {
                    font-family: Arial, sans-serif;
                    padding: 35px;
                    color: #1e293b;
                    line-height: 1.6;
                }

                h1 {
                    color: #312e81;
                }

                h2 {
                    color: #4338ca;
                    background: #eef2ff;
                    padding: 12px;
                    border-left: 5px solid #6366f1;
                    border-radius: 6px;
                    margin-top: 25px;
                }

                h3 {
                    color: #4338ca;
                }

                strong {
                    color: #4338ca;
                }

                p {
                    margin: 10px 0;
                }

                li {
                    margin: 6px 0;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }

                th,
                td {
                    border: 1px solid #ddd;
                    padding: 9px;
                }

                th {
                    background: #eef2ff;
                }

                pre {
                    background: #111827;
                    color: white;
                    padding: 15px;
                    border-radius: 8px;
                    overflow-x: auto;
                }

                @media print {

                    body {
                        padding: 0;
                    }

                }

            </style>

        </head>

        <body>

            <h1>${escapeHtml(title)}</h1>

            ${htmlContent}

        </body>

        </html>
    `);


    printWindow.document.close();


    setTimeout(() => {

        printWindow.focus();

        printWindow.print();

    }, 700);

}


/* =========================
   CURRENT NOTE DOWNLOAD
========================= */

downloadButton.addEventListener(
    "click",
    () => {

        if (!window.currentNote) {

            alert("Generate notes first.");

            return;
        }


        downloadPDF(
            window.currentNote.title,
            window.currentNote.html
        );

    }
);


/* =========================
   SAVED NOTE DOWNLOAD
========================= */

function downloadNoteById(id) {

    const savedNotes =
        JSON.parse(
            localStorage.getItem("studyNotes") || "[]"
        );


    const note =
        savedNotes.find(
            item => item.id === id
        );


    if (!note) return;


    downloadPDF(
        note.title,
        note.html
    );

}


/* =========================
   COPY
========================= */

copyButton.addEventListener(
    "click",
    async () => {

        if (!window.currentNote) return;


        try {

            await navigator.clipboard.writeText(
                window.currentNote.content
            );


            copyButton.textContent =
                "✅ Copied";


            setTimeout(() => {

                copyButton.textContent =
                    "📋 Copy";

            }, 1500);


        } catch (error) {

            alert(
                "Could not copy the notes."
            );

        }

    }
);


/* =========================
   TABS
========================= */

function showGenerator() {

    generatorPage.style.display = "block";
    yourNotesPage.style.display = "none";

    generateTab.classList.add("active");
    yourNotesTab.classList.remove("active");

}


function showYourNotes() {

    generatorPage.style.display = "none";
    yourNotesPage.style.display = "block";

    generateTab.classList.remove("active");
    yourNotesTab.classList.add("active");

    loadSavedNotes();

}


generateTab.addEventListener(
    "click",
    showGenerator
);


yourNotesTab.addEventListener(
    "click",
    showYourNotes
);


if (startCreatingButton) {

    startCreatingButton.addEventListener(
        "click",
        showGenerator
    );

}


/* =========================
   THEME
========================= */

themeButton.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark"
        );


        if (
            document.body.classList.contains("dark")
        ) {

            themeButton.textContent = "☀️";

            localStorage.setItem(
                "theme",
                "dark"
            );

        } else {

            themeButton.textContent = "🌙";

            localStorage.setItem(
                "theme",
                "light"
            );

        }

    }
);


/* Restore theme */

if (
    localStorage.getItem("theme") === "dark"
) {

    document.body.classList.add("dark");

    themeButton.textContent = "☀️";

}


/* Initial library */

loadSavedNotes();