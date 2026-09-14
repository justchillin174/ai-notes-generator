/* =========================================================
   AI NOTES GENERATOR
   Frontend Controller
   ========================================================= */


/* =========================
   DOM ELEMENTS
   ========================= */

const generateTab = document.getElementById("generateTab");
const learnTab = document.getElementById("learnTab");
const booksTab = document.getElementById("booksTab");
const yourNotesTab = document.getElementById("yourNotesTab");

const generatePage = document.getElementById("generatePage");
const learnPage = document.getElementById("learnPage");
const booksPage = document.getElementById("booksPage");
const yourNotesPage = document.getElementById("yourNotesPage");

const readingPage = document.getElementById("readingPage");

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
   PAGE SWITCHING
   ========================= */

function hideAllPages() {

    generatePage.classList.remove("active-page");
    learnPage.classList.remove("active-page");
    booksPage.classList.remove("active-page");
    yourNotesPage.classList.remove("active-page");

    readingPage.classList.remove("active");

    generateTab.classList.remove("active");
    learnTab.classList.remove("active");
    booksTab.classList.remove("active");
    yourNotesTab.classList.remove("active");
}


function showPage(page) {

    hideAllPages();

    page.classList.add("active-page");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


generateTab.addEventListener("click", () => {
    showPage(generatePage);
    generateTab.classList.add("active");
});


learnTab.addEventListener("click", () => {
    showPage(learnPage);
    learnTab.classList.add("active");
});


booksTab.addEventListener("click", () => {
    showPage(booksPage);
    booksTab.classList.add("active");
});


yourNotesTab.addEventListener("click", () => {
    showPage(yourNotesPage);
    yourNotesTab.classList.add("active");

    renderSavedNotes();
});


/* =========================
   PDF FILE NAME
   ========================= */

const pdfFile = document.getElementById("pdfFile");
const fileName = document.getElementById("fileName");

pdfFile.addEventListener("change", () => {

    if (pdfFile.files.length > 0) {
        fileName.textContent = pdfFile.files[0].name;
    } else {
        fileName.textContent =
            "Use a textbook, chapter or study material";
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

    if (!markdown) return "";

    let text = markdown.replace(/\r/g, "");

    const mermaidBlocks = [];

    text = text.replace(
        /```mermaid\s*([\s\S]*?)```/gi,
        function (_, diagram) {

            const id =
                "mermaid-" +
                Date.now() +
                "-" +
                mermaidBlocks.length;

            mermaidBlocks.push({
                id: id,
                code: diagram.trim()
            });

            return `<div class="mermaid-placeholder" id="${id}"></div>`;
        }
    );


    const codeBlocks = [];

    text = text.replace(
        /```([\s\S]*?)```/g,
        function (_, code) {

            const id =
                "code-" +
                Date.now() +
                "-" +
                codeBlocks.length;

            codeBlocks.push({
                id: id,
                code: code.trim()
            });

            return `<pre id="${id}"></pre>`;
        }
    );


    text = escapeHtml(text);


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


    text = text.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    text = text.replace(
        /\*(.*?)\*/g,
        "<em>$1</em>"
    );


    text = text.replace(
        /^\s*[-•] (.*)$/gm,
        "<li>$1</li>"
    );

    text = text.replace(
        /(<li>.*<\/li>\n?)+/g,
        "<ul>$&</ul>"
    );


    text = text.replace(
        /^\s*\d+\.\s+(.*)$/gm,
        "<li>$1</li>"
    );


    text = text.replace(
        /\n{2,}/g,
        "</p><p>"
    );


    text = text.replace(
        /\n/g,
        "<br>"
    );


    text = "<p>" + text + "</p>";


    mermaidBlocks.forEach(block => {

        text = text.replace(
            `&lt;div class="mermaid-placeholder" id="${block.id}"&gt;&lt;/div&gt;`,
            `<div class="mermaid" data-mermaid-id="${block.id}">${escapeHtml(block.code)}</div>`
        );

    });


    codeBlocks.forEach(block => {

        text = text.replace(
            `<pre id="${block.id}"></pre>`,
            `<pre>${escapeHtml(block.code)}</pre>`
        );

    });


    return text;
}


/* =========================
   RENDER MERMAID
   ========================= */

async function renderMermaid(container) {

    if (!window.mermaid) return;

    const diagrams = container.querySelectorAll(".mermaid");

    for (const diagram of diagrams) {

        try {

            const code = diagram.textContent;

            const id =
                "diagram-" +
                Math.random().toString(36).substring(2);

            const result =
                await mermaid.render(id, code);

            diagram.innerHTML = result.svg;

        } catch (error) {

            console.warn(
                "Mermaid diagram could not be rendered:",
                error
            );

            diagram.innerHTML =
                "<p>Concept diagram could not be displayed.</p>";
        }
    }
}


/* =========================
   MATHJAX
   ========================= */

async function renderMath(container) {

    if (
        window.MathJax &&
        window.MathJax.typesetPromise
    ) {

        try {

            await MathJax.typesetPromise([container]);

        } catch (error) {

            console.warn(
                "Math rendering failed:",
                error
            );
        }
    }
}


/* =========================
   FINAL CONTENT RENDER
   ========================= */

async function renderContent(container, text) {

    container.innerHTML = markdownToHtml(text);

    await renderMermaid(container);

    await renderMath(container);
}


/* =========================================================
   GENERATE NOTES
   ========================================================= */

const generateButton =
    document.getElementById("generateButton");

const loading =
    document.getElementById("loading");

const resultCard =
    document.getElementById("resultCard");

const notes =
    document.getElementById("notes");

const resultTitle =
    document.getElementById("resultTitle");


let currentNote = null;


generateButton.addEventListener("click", async () => {

    const topic =
        document.getElementById("topic").value.trim();

    const level =
        document.getElementById("level").value;

    const length =
        document.getElementById("length").value;

    const mcq =
        document.getElementById("mcq").checked;

    const flashcards =
        document.getElementById("flashcards").checked;


    if (!topic && !pdfFile.files.length) {

        alert(
            "Please enter a topic or upload a PDF."
        );

        return;
    }


    const formData = new FormData();

    formData.append("topic", topic);
    formData.append("level", level);
    formData.append("length", length);
    formData.append("mcq", mcq);
    formData.append("flashcards", flashcards);


    if (pdfFile.files.length) {
        formData.append("pdf", pdfFile.files[0]);
    }


    generateButton.disabled = true;

    loading.classList.add("active");

    resultCard.classList.remove("active");


    try {

        const response =
            await fetch("/api/generate", {
                method: "POST",
                body: formData
            });


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.message ||
                "Failed to generate notes."
            );
        }


        const generatedText =
            data.notes ||
            data.text ||
            data.result;


        if (!generatedText) {

            throw new Error(
                "The server returned no notes."
            );
        }


        currentNote = {

            id: Date.now(),

            title:
                topic ||
                (pdfFile.files.length
                    ? pdfFile.files[0].name
                    : "Study Notes"),

            content: generatedText,

            createdAt:
                new Date().toISOString()

        };


        resultTitle.textContent =
            currentNote.title;


        await renderContent(
            notes,
            generatedText
        );


        resultCard.classList.add("active");

        resultCard.scrollIntoView({
            behavior: "smooth"
        });


    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Something went wrong while creating notes."
        );

    } finally {

        generateButton.disabled = false;

        loading.classList.remove("active");
    }

});


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function getSavedNotes() {

    try {

        return JSON.parse(
            localStorage.getItem("studyNotes") || "[]"
        );

    } catch {

        return [];
    }
}


function saveNotes(notesArray) {

    localStorage.setItem(
        "studyNotes",
        JSON.stringify(notesArray)
    );
}


/* =========================
   SAVE CURRENT NOTE
   ========================= */

document
    .getElementById("saveButton")
    .addEventListener("click", () => {

        if (!currentNote) return;

        const saved =
            getSavedNotes();

        const existing =
            saved.find(
                note => note.id === currentNote.id
            );


        if (!existing) {

            saved.unshift(currentNote);

            saveNotes(saved);

            alert("Note saved to Your Notes.");

        } else {

            alert("This note is already saved.");

        }

        renderSavedNotes();
    });


/* =========================================================
   COPY
   ========================================================= */

document
    .getElementById("copyButton")
    .addEventListener("click", async () => {

        if (!currentNote) return;

        try {

            await navigator.clipboard.writeText(
                currentNote.content
            );

            alert("Notes copied.");

        } catch {

            alert("Could not copy the notes.");
        }

    });


/* =========================================================
   PRINT / PDF
   ========================================================= */

function downloadAsPdf(title, content) {

    const popup =
        window.open("", "_blank");

    if (!popup) {

        alert(
            "Please allow pop-ups to download the PDF."
        );

        return;
    }


    popup.document.write(`
        <!DOCTYPE html>

        <html>

        <head>

            <title>${escapeHtml(title)}</title>

            <style>

                body {
                    margin: 0;
                    padding: 40px;
                    background: #fffdf7;
                    color: #29352f;
                    font-family: Georgia, serif;
                    line-height: 1.8;
                }

                h1 {
                    color: #075c43;
                }

                h2 {
                    color: #007c78;
                    border-bottom: 2px solid #cfe9df;
                    padding-bottom: 7px;
                }

                h3 {
                    color: #16735e;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                th,
                td {
                    border: 1px solid #ccc;
                    padding: 8px;
                }

                th {
                    background: #e4f4ef;
                }

                blockquote {
                    border-left: 4px solid #008c95;
                    padding-left: 15px;
                    background: #eef9f5;
                }

            </style>

        </head>

        <body>

            <h1>${escapeHtml(title)}</h1>

            ${markdownToHtml(content)}

            <script>

                window.onload = function() {

                    setTimeout(function() {
                        window.print();
                    }, 500);

                };

            <\/script>

        </body>

        </html>
    `);

    popup.document.close();
}


document
    .getElementById("downloadButton")
    .addEventListener("click", () => {

        if (!currentNote) return;

        downloadAsPdf(
            currentNote.title,
            currentNote.content
        );

    });


/* =========================================================
   LEARN MODE
   ========================================================= */

let selectedLearnMode = "teach";


const learningModes =
    document.querySelectorAll(".learning-mode");


learningModes.forEach(button => {

    button.addEventListener("click", () => {

        learningModes.forEach(
            item => item.classList.remove("selected")
        );

        button.classList.add("selected");

        selectedLearnMode =
            button.dataset.mode;

    });

});


/* =========================================================
   LEARN GENERATOR
   ========================================================= */

const generateLearnButton =
    document.getElementById(
        "generateLearnButton"
    );

const learnLoading =
    document.getElementById(
        "learnLoading"
    );

const learnResult =
    document.getElementById(
        "learnResult"
    );

const learnContent =
    document.getElementById(
        "learnContent"
    );

const learnResultTitle =
    document.getElementById(
        "learnResultTitle"
    );


let currentLearnMaterial = null;


function buildLearnPrompt(
    grade,
    topic,
    mode
) {

    if (mode === "teach") {

        return `
You are an excellent school teacher.

Grade: ${grade}
Topic: ${topic}

Create a ONE-PAGE "Teach Me" lesson.

Explain the topic in a simple, student-friendly way.

Requirements:
- Start with a clear title.
- Explain the core idea simply.
- Use important definitions.
- Explain the main concepts.
- Give a simple example where useful.
- Include important formulas if relevant.
- Use bullet points where helpful.
- Highlight important keywords.
- Keep the complete response suitable for ONE PAGE.
- Do not add unnecessary information.
- Do not mention that AI created the material.
`;

    }


    if (mode === "revision") {

        return `
You are creating an exam-focused QUICK REVISION SHEET.

Grade: ${grade}
Topic: ${topic}

Create a ONE-PAGE revision sheet.

Include only the highest-value information:
- Key definitions
- Important facts
- Main concepts
- Formulas
- Keywords
- Important dates/names if relevant
- Important differences
- Exam tips
- One or two examples if essential

Use compact headings and bullet points.

The entire response MUST fit on ONE PAGE.

Do not add unnecessary explanation.
Do not mention that AI created the material.
`;

    }


    return `
You are creating a ONE-PAGE CONCEPT MAP.

Grade: ${grade}
Topic: ${topic}

Create a clear visual concept map using Mermaid flowchart syntax.

Requirements:
- Start with the main topic.
- Connect the major concepts.
- Show relationships between ideas.
- Include important sub-concepts.
- Keep it simple enough for a school student.
- The complete map must fit on ONE PAGE.
- Also provide a very short "Key Takeaways" section.

IMPORTANT:
Return the Mermaid diagram inside:

\`\`\`mermaid

flowchart TD
    ...

\`\`\`

Do not use unsupported Mermaid syntax.
Do not mention that AI created the material.
`;

}


/* =========================
   GENERATE LEARN
   ========================= */

generateLearnButton.addEventListener(
    "click",
    async () => {

        const grade =
            document.getElementById(
                "learnGrade"
            ).value;

        const topic =
            document.getElementById(
                "learnTopic"
            ).value.trim();


        if (!topic) {

            alert(
                "Please enter a topic or chapter."
            );

            return;
        }


        const prompt =
            buildLearnPrompt(
                grade,
                topic,
                selectedLearnMode
            );


        generateLearnButton.disabled = true;

        learnLoading.classList.add("active");

        learnResult.classList.remove("active");


        try {

            const formData =
                new FormData();

            formData.append(
                "topic",
                prompt
            );

            formData.append(
                "level",
                grade
            );

            formData.append(
                "length",
                "short"
            );

            formData.append(
                "mcq",
                "false"
            );

            formData.append(
                "flashcards",
                "false"
            );


            const response =
                await fetch(
                    "/api/generate",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    data.message ||
                    "Could not create learning material."
                );

            }


            const generatedText =
                data.notes ||
                data.text ||
                data.result;


            if (!generatedText) {

                throw new Error(
                    "The server returned no learning material."
                );

            }


            const modeName =
                selectedLearnMode === "teach"
                    ? "Teach Me"
                    : selectedLearnMode === "revision"
                        ? "Quick Revision Sheet"
                        : "Concept Map";


            currentLearnMaterial = {

                id: Date.now(),

                title:
                    `${topic} — ${modeName}`,

                content:
                    generatedText,

                createdAt:
                    new Date().toISOString()

            };


            learnResultTitle.textContent =
                currentLearnMaterial.title;


            await renderContent(
                learnContent,
                generatedText
            );


            learnResult.classList.add(
                "active"
            );


            learnResult.scrollIntoView({
                behavior: "smooth"
            });


        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Could not create learning material."
            );

        } finally {

            generateLearnButton.disabled = false;

            learnLoading.classList.remove("active");

        }

    }
);


/* =========================================================
   SAVE LEARN MATERIAL
   ========================================================= */

document
    .getElementById("saveLearnButton")
    .addEventListener("click", () => {

        if (!currentLearnMaterial) return;


        const saved =
            getSavedNotes();


        const existing =
            saved.find(
                note =>
                    note.id === currentLearnMaterial.id
            );


        if (!existing) {

            saved.unshift(
                currentLearnMaterial
            );

            saveNotes(saved);

            alert(
                "Learning material saved to Your Notes."
            );

        } else {

            alert(
                "This material is already saved."
            );

        }

    });


/* =========================================================
   DOWNLOAD LEARN MATERIAL
   ========================================================= */

document
    .getElementById("downloadLearnButton")
    .addEventListener("click", () => {

        if (!currentLearnMaterial) return;

        downloadAsPdf(
            currentLearnMaterial.title,
            currentLearnMaterial.content
        );

    });


/* =========================================================
   YOUR NOTES
   ========================================================= */

const savedNotesContainer =
    document.getElementById(
        "savedNotes"
    );

const emptyNotes =
    document.getElementById(
        "emptyNotes"
    );


function renderSavedNotes() {

    const search =
        document
            .getElementById("notesSearch")
            .value
            .toLowerCase()
            .trim();

    const sort =
        document
            .getElementById("notesSort")
            .value;


    let saved =
        getSavedNotes();


    if (search) {

        saved =
            saved.filter(note =>
                note.title
                    .toLowerCase()
                    .includes(search)
            );

    }


    if (sort === "newest") {

        saved.sort(
            (a,b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
        );

    }


    if (sort === "oldest") {

        saved.sort(
            (a,b) =>
                new Date(a.createdAt) -
                new Date(b.createdAt)
        );

    }


    if (sort === "az") {

        saved.sort(
            (a,b) =>
                a.title.localeCompare(
                    b.title
                )
        );

    }


    savedNotesContainer.innerHTML = "";


    if (!saved.length) {

        emptyNotes.style.display =
            "block";

        return;

    }


    emptyNotes.style.display =
        "none";


    saved.forEach(note => {

        const card =
            document.createElement("div");

        card.className =
            "note-card";


        card.innerHTML = `

            <div class="note-card-title">
                ${escapeHtml(note.title)}
            </div>

            <div class="note-card-meta">
                ${new Date(note.createdAt).toLocaleDateString()}
            </div>

            <button
                class="note-card-arrow"
                data-note-id="${note.id}"
            >
                →
            </button>

            <div
                class="note-menu"
                id="menu-${note.id}"
            >

                <button
                    data-action="open"
                    data-note-id="${note.id}"
                >
                    📖 Open
                </button>

                <button
                    data-action="save"
                    data-note-id="${note.id}"
                >
                    💾 Save
                </button>

                <button
                    data-action="download"
                    data-note-id="${note.id}"
                >
                    ↓ Download as PDF
                </button>

            </div>

        `;


        savedNotesContainer.appendChild(
            card
        );

    });


    /* Arrow menus */

    document
        .querySelectorAll(".note-card-arrow")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    const id =
                        button.dataset.noteId;

                    const menu =
                        document.getElementById(
                            `menu-${id}`
                        );


                    document
                        .querySelectorAll(".note-menu")
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "open"
                                )
                        );


                    menu.classList.toggle(
                        "open"
                    );

                }
            );

        });


    /* Menu actions */

    document
        .querySelectorAll(".note-menu button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(
                            button.dataset.noteId
                        );

                    const action =
                        button.dataset.action;

                    const note =
                        getSavedNotes().find(
                            item =>
                                item.id === id
                        );


                    if (!note) return;


                    if (action === "open") {

                        openReadingPage(note);

                    }


                    if (action === "save") {

                        saveNotes(
                            getSavedNotes().filter(
                                item =>
                                    item.id !== id
                            ).concat(note)
                        );

                        alert(
                            "Note saved."
                        );

                    }


                    if (action === "download") {

                        downloadAsPdf(
                            note.title,
                            note.content
                        );

                    }

                }
            );

        });

}


/* Search */

document
    .getElementById("notesSearch")
    .addEventListener(
        "input",
        renderSavedNotes
    );


/* Sort */

document
    .getElementById("notesSort")
    .addEventListener(
        "change",
        renderSavedNotes
    );


/* =========================================================
   READING PAGE
   ========================================================= */

let readingNote = null;


async function openReadingPage(note) {

    readingNote = note;


    hideAllPages();


    readingPage.classList.add(
        "active"
    );


    document.getElementById(
        "readingTitle"
    ).textContent = note.title;


    await renderContent(
        document.getElementById(
            "readingContent"
        ),
        note.content
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* Back */

document
    .getElementById(
        "backToNotesButton"
    )
    .addEventListener(
        "click",
        () => {

            readingPage.classList.remove(
                "active"
            );

            showPage(
                yourNotesPage
            );

            yourNotesTab.classList.add(
                "active"
            );

            renderSavedNotes();

        }
    );


/* Reading Save */

document
    .getElementById(
        "readingSaveButton"
    )
    .addEventListener(
        "click",
        () => {

            if (!readingNote) return;

            const saved =
                getSavedNotes();


            if (
                !saved.some(
                    note =>
                        note.id === readingNote.id
                )
            ) {

                saved.unshift(
                    readingNote
                );

                saveNotes(saved);

            }

            alert("Note saved.");

        }
    );


/* Reading Download */

document
    .getElementById(
        "readingDownloadButton"
    )
    .addEventListener(
        "click",
        () => {

            if (!readingNote) return;

            downloadAsPdf(
                readingNote.title,
                readingNote.content
            );

        }
    );


/* =========================================================
   CREATE NOTES BUTTON
   ========================================================= */

document
    .getElementById(
        "startCreatingButton"
    )
    .addEventListener(
        "click",
        () => {

            showPage(
                generatePage
            );

            generateTab.classList.add(
                "active"
            );

        }
    );


/* =========================================================
   BOOK GRADE TABS
   ========================================================= */

const gradeTabs =
    document.querySelectorAll(
        ".grade-tab"
    );


const bookGrades =
    document.querySelectorAll(
        ".book-grade"
    );


gradeTabs.forEach(tab => {

    tab.addEventListener(
        "click",
        () => {

            const grade =
                tab.dataset.grade;


            gradeTabs.forEach(
                item =>
                    item.classList.remove(
                        "active"
                    )
            );


            bookGrades.forEach(
                item =>
                    item.classList.remove(
                        "active"
                    )
            );


            tab.classList.add(
                "active"
            );


            document
                .getElementById(
                    `booksGrade${grade}`
                )
                .classList.add(
                    "active"
                );

        }
    );

});


/* =========================================================
   BOOK PDF SELECTION
   ========================================================= */

document
    .querySelectorAll(
        ".book-card input[type='file']"
    )
    .forEach(input => {

        input.addEventListener(
            "change",
            () => {

                if (!input.files.length)
                    return;


                const card =
                    input.closest(
                        ".book-card"
                    );


                const small =
                    card.querySelector(
                        "small"
                    );


                small.textContent =
                    "✓ " +
                    input.files[0].name;


                card.style.borderColor =
                    "#087f5b";


                /*
                 IMPORTANT:

                 At this stage the PDF is selected
                 only in the browser.

                 The next backend upgrade will upload
                 this PDF to your server/storage and
                 connect it to the AI.
                */

            }
        );

    });


/* =========================================================
   THEME
   ========================================================= */

themeButton.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark"
        );


        localStorage.setItem(
            "darkMode",
            document.body.classList.contains(
                "dark"
            )
        );

    }
);


if (
    localStorage.getItem(
        "darkMode"
    ) === "true"
) {

    document.body.classList.add(
        "dark"
    );

}


/* =========================================================
   INITIALIZE
   ========================================================= */

renderSavedNotes();
