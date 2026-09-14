const topic = document.getElementById("topic");
const pdfFile = document.getElementById("pdfFile");
const fileName = document.getElementById("fileName");

const level = document.getElementById("level");
const length = document.getElementById("length");

const mcq = document.getElementById("mcq");
const flashcards = document.getElementById("flashcards");

const generateButton = document.getElementById("generateButton");
const loading = document.getElementById("loading");

const resultCard = document.getElementById("resultCard");
const viewNotesButton = document.getElementById("viewNotesButton");

const generateTab = document.getElementById("generateTab");
const yourNotesTab = document.getElementById("yourNotesTab");
const themeButton = document.getElementById("themeButton");

const generatePage = document.getElementById("generatePage");
const yourNotesPage = document.getElementById("yourNotesPage");

const savedNotes = document.getElementById("savedNotes");
const emptyNotes = document.getElementById("emptyNotes");

const startCreatingButton =
    document.getElementById("startCreatingButton");

const notesSearch =
    document.getElementById("notesSearch");

const notesSort =
    document.getElementById("notesSort");

const readingPage =
    document.getElementById("readingPage");

const readingContent =
    document.getElementById("readingContent");

const backToNotes =
    document.getElementById("backToNotes");

const readingSaveButton =
    document.getElementById("readingSaveButton");

const readingDownloadButton =
    document.getElementById("readingDownloadButton");


let currentNote = null;
let currentlyReadingNote = null;


/* ================= MERMAID ================= */

if (typeof mermaid !== "undefined") {
    mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose"
    });
}


/* ================= FILE NAME ================= */

pdfFile.addEventListener("change", () => {

    if (pdfFile.files.length > 0) {
        fileName.textContent =
            `Selected: ${pdfFile.files[0].name}`;
    } else {
        fileName.textContent = "";
    }

});


/* ================= MARKDOWN ================= */

function markdownToHtml(markdown) {

    if (!markdown) {
        return "";
    }

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
       Use marked if available
    */

    let html;

    if (typeof marked !== "undefined") {

        html = marked.parse(text, {
            breaks: true
        });

    } else {

        html = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, "<br>");

    }


    /*
       Restore Mermaid blocks
    */

    html = html.replace(
        /@@MERMAID_(\d+)@@/g,
        function (_, index) {

            return `
                <div class="mermaid">
                    ${escapeHtml(mermaidBlocks[index])}
                </div>
            `;

        }
    );


    return html;
}


/* ================= ESCAPE ================= */

function escapeHtml(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ================= GENERATE ================= */

generateButton.addEventListener("click", async () => {

    const topicValue = topic.value.trim();

    if (!topicValue && !pdfFile.files.length) {

        alert(
            "Please enter a topic or upload a PDF first."
        );

        return;
    }


    generateButton.disabled = true;

    loading.classList.add("show");

    resultCard.classList.remove("show");


    try {

        const formData = new FormData();

        formData.append("topic", topicValue);
        formData.append("level", level.value);
        formData.append("length", length.value);

        formData.append(
            "mcq",
            mcq.checked ? "true" : "false"
        );

        formData.append(
            "flashcards",
            flashcards.checked ? "true" : "false"
        );


        if (pdfFile.files.length > 0) {

            formData.append(
                "pdf",
                pdfFile.files[0]
            );

        }


        const response = await fetch(
            "/api/generate",
            {
                method: "POST",
                body: formData
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Failed to generate notes."
            );

        }


        /*
           Save the generated note temporarily.
        */

        currentNote = {

            id: Date.now(),

            title:
                topicValue ||
                pdfFile.files[0]?.name ||
                "Study Notes",

            content:
                data.notes ||
                data.text ||
                data.result ||
                "",

            date:
                new Date().toISOString(),

            favorite: false

        };


        resultCard.classList.add("show");


        /*
           Automatically store it in the library
           so the user can immediately open it.
        */

        saveCurrentNote();


        /*
           Scroll to success message
        */

        resultCard.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Something went wrong while generating notes."
        );

    } finally {

        generateButton.disabled = false;

        loading.classList.remove("show");

    }

});


/* ================= SAVE NOTE ================= */

function getStoredNotes() {

    try {

        return JSON.parse(
            localStorage.getItem("studyNotes")
        ) || [];

    } catch {

        return [];

    }

}


function setStoredNotes(notes) {

    localStorage.setItem(
        "studyNotes",
        JSON.stringify(notes)
    );

}


function saveCurrentNote() {

    if (!currentNote) {
        return;
    }

    const notes = getStoredNotes();

    const existingIndex =
        notes.findIndex(
            note => note.id === currentNote.id
        );


    if (existingIndex >= 0) {

        notes[existingIndex] =
            currentNote;

    } else {

        notes.unshift(
            currentNote
        );

    }


    setStoredNotes(notes);

    renderSavedNotes();

}


/* ================= RENDER NOTES ================= */

function renderSavedNotes() {

    let notes = getStoredNotes();


    /*
       Search
    */

    const search =
        notesSearch.value
            .trim()
            .toLowerCase();


    if (search) {

        notes = notes.filter(note =>
            note.title
                .toLowerCase()
                .includes(search)
        );

    }


    /*
       Sorting
    */

    const sort =
        notesSort.value;


    if (sort === "newest") {

        notes.sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );

    }


    if (sort === "oldest") {

        notes.sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );

    }


    if (sort === "az") {

        notes.sort(
            (a, b) =>
                a.title.localeCompare(b.title)
        );

    }


    savedNotes.innerHTML = "";


    if (notes.length === 0) {

        emptyNotes.style.display =
            "block";

        return;

    }


    emptyNotes.style.display =
        "none";


    notes.forEach(note => {

        const card =
            document.createElement("div");

        card.className =
            "saved-note";


        const date =
            new Date(note.date)
                .toLocaleDateString(
                    undefined,
                    {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                    }
                );


        card.innerHTML = `

            <div class="note-book-icon">
                ${note.favorite ? "⭐" : "📘"}
            </div>

            <div class="saved-note-info">

                <h3 class="saved-note-title">
                    ${escapeHtml(note.title)}
                </h3>

                <div class="saved-note-date">
                    Saved ${date}
                </div>

            </div>

            <div class="note-menu-wrapper">

                <button
                    class="note-menu-button"
                    data-menu-id="${note.id}"
                    title="Options"
                >
                    ▼
                </button>

                <div
                    class="note-menu"
                    id="menu-${note.id}"
                >

                    <button
                        data-action="open"
                        data-id="${note.id}"
                    >
                        📖 Open
                    </button>

                    <button
                        data-action="save"
                        data-id="${note.id}"
                    >
                        💾 Save
                    </button>

                    <button
                        data-action="download"
                        data-id="${note.id}"
                    >
                        📄 Download as PDF
                    </button>

                    <button
                        data-action="favorite"
                        data-id="${note.id}"
                    >
                        ⭐ ${note.favorite ? "Remove Favorite" : "Favorite"}
                    </button>

                    <button
                        data-action="delete"
                        data-id="${note.id}"
                    >
                        🗑️ Delete
                    </button>

                </div>

            </div>
        `;


        savedNotes.appendChild(card);

    });

}


/* ================= MENU BUTTON ================= */

savedNotes.addEventListener("click", (event) => {

    const menuButton =
        event.target.closest(
            ".note-menu-button"
        );


    if (menuButton) {

        const id =
            menuButton.dataset.menuId;

        document
            .querySelectorAll(".note-menu")
            .forEach(menu => {

                if (
                    menu.id !==
                    `menu-${id}`
                ) {

                    menu.classList.remove(
                        "show"
                    );

                }

            });


        const menu =
            document.getElementById(
                `menu-${id}`
            );


        menu.classList.toggle("show");

        return;

    }


    const actionButton =
        event.target.closest(
            "[data-action]"
        );


    if (!actionButton) {
        return;
    }


    const action =
        actionButton.dataset.action;

    const id =
        Number(actionButton.dataset.id);


    const notes =
        getStoredNotes();

    const note =
        notes.find(
            item => item.id === id
        );


    if (!note) {
        return;
    }


    if (action === "open") {

        openNote(note);

    }


    if (action === "save") {

        saveNoteAgain(note);

    }


    if (action === "download") {

        downloadPDF(note);

    }


    if (action === "favorite") {

        toggleFavorite(id);

    }


    if (action === "delete") {

        deleteNote(id);

    }


    document
        .querySelectorAll(".note-menu")
        .forEach(menu =>
            menu.classList.remove("show")
        );

});


/* ================= OPEN NOTE ================= */

function openNote(note) {

    currentlyReadingNote =
        note;


    readingContent.innerHTML =
        markdownToHtml(
            note.content
        );


    generatePage.style.display =
        "none";

    yourNotesPage.style.display =
        "none";


    readingPage.classList.add(
        "active"
    );


    window.scrollTo({
        top: 0,
        behavior: "instant"
    });


    /*
       Render Mermaid diagrams
    */

    if (
        typeof mermaid !== "undefined"
    ) {

        const diagrams =
            readingContent
                .querySelectorAll(
                    ".mermaid"
                );


        if (diagrams.length) {

            mermaid.run({
                nodes: diagrams
            }).catch(error => {

                console.error(
                    "Mermaid error:",
                    error
                );

            });

        }

    }


    /*
       Render maths
    */

    if (
        window.MathJax &&
        window.MathJax.typesetPromise
    ) {

        window.MathJax
            .typesetPromise([
                readingContent
            ])
            .catch(error => {

                console.error(
                    "MathJax error:",
                    error
                );

            });

    }

}


/* ================= SAVE AGAIN ================= */

function saveNoteAgain(note) {

    const notes =
        getStoredNotes();


    const index =
        notes.findIndex(
            item => item.id === note.id
        );


    if (index >= 0) {

        notes[index] =
            note;

        setStoredNotes(notes);

        currentNote =
            note;

        alert(
            "Note saved successfully."
        );

    }

}


/* ================= READING SAVE ================= */

readingSaveButton.addEventListener(
    "click",
    () => {

        if (!currentlyReadingNote) {
            return;
        }

        saveNoteAgain(
            currentlyReadingNote
        );

    }
);


/* ================= DELETE ================= */

function deleteNote(id) {

    const confirmed =
        confirm(
            "Delete this note?"
        );


    if (!confirmed) {
        return;
    }


    const notes =
        getStoredNotes()
            .filter(
                note =>
                    note.id !== id
            );


    setStoredNotes(notes);

    renderSavedNotes();

}


/* ================= FAVORITE ================= */

function toggleFavorite(id) {

    const notes =
        getStoredNotes();


    const note =
        notes.find(
            item => item.id === id
        );


    if (!note) {
        return;
    }


    note.favorite =
        !note.favorite;


    setStoredNotes(notes);

    renderSavedNotes();

}


/* ================= PDF DOWNLOAD ================= */

function downloadPDF(note) {

    const html =
        markdownToHtml(
            note.content
        );


    const printWindow =
        window.open(
            "",
            "_blank"
        );


    if (!printWindow) {

        alert(
            "Please allow pop-ups to download the PDF."
        );

        return;

    }


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                ${escapeHtml(note.title)}
            </title>

            <style>

                body {
                    margin: 0;
                    padding: 50px;
                    color: #29352d;
                    background: #fffdf7;
                    font-family: Georgia, serif;
                    line-height: 1.8;
                }

                .page {
                    max-width: 800px;
                    margin: auto;
                }

                h1 {
                    color: #14532d;
                    font-size: 32px;
                    border-bottom: 3px double #4f8b68;
                    padding-bottom: 15px;
                }

                h2 {
                    color: #166534;
                    margin-top: 35px;
                    border-bottom: 1px solid #b9cdbf;
                    padding-bottom: 6px;
                }

                h3 {
                    color: #0f766e;
                }

                strong {
                    color: #14532d;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }

                th {
                    background: #dff3e8;
                    color: #14532d;
                    text-align: left;
                }

                th, td {
                    padding: 9px;
                    border: 1px solid #bfd5c7;
                }

                blockquote {
                    background: #eaf7f0;
                    border-left: 5px solid #16856f;
                    padding: 14px;
                }

                pre {
                    background: #18352a;
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

            <div class="page">

                <h1>
                    ${escapeHtml(note.title)}
                </h1>

                ${html}

            </div>

            <script>

                window.onload = function() {
                    window.print();
                };

            <\/script>

        </body>

        </html>

    `);


    printWindow.document.close();

}


/* ================= READING PDF ================= */

readingDownloadButton.addEventListener(
    "click",
    () => {

        if (!currentlyReadingNote) {
            return;
        }

        downloadPDF(
            currentlyReadingNote
        );

    }
);


/* ================= BACK ================= */

backToNotes.addEventListener(
    "click",
    () => {

        readingPage.classList.remove(
            "active"
        );

        yourNotesPage.style.display =
            "block";

        generatePage.style.display =
            "none";

        generateTab.classList.remove(
            "active"
        );

        yourNotesTab.classList.add(
            "active"
        );

        renderSavedNotes();

        window.scrollTo({
            top: 0,
            behavior: "instant"
        });

    }
);


/* ================= PAGE SWITCHING ================= */

function showPage(pageName) {

    readingPage.classList.remove(
        "active"
    );


    generatePage.style.display =
        "none";

    yourNotesPage.style.display =
        "none";


    if (pageName === "generatePage") {

        generatePage.style.display =
            "block";

        generateTab.classList.add(
            "active"
        );

        yourNotesTab.classList.remove(
            "active"
        );

    }


    if (pageName === "yourNotesPage") {

        yourNotesPage.style.display =
            "block";

        generateTab.classList.remove(
            "active"
        );

        yourNotesTab.classList.add(
            "active"
        );

        renderSavedNotes();

    }


    window.scrollTo({
        top: 0,
        behavior: "instant"
    });

}


generateTab.addEventListener(
    "click",
    () => showPage("generatePage")
);


yourNotesTab.addEventListener(
    "click",
    () => showPage("yourNotesPage")
);


viewNotesButton.addEventListener(
    "click",
    () => showPage("yourNotesPage")
);


startCreatingButton.addEventListener(
    "click",
    () => showPage("generatePage")
);


/* ================= SEARCH & SORT ================= */

notesSearch.addEventListener(
    "input",
    renderSavedNotes
);

notesSort.addEventListener(
    "change",
    renderSavedNotes
);


/* ================= CLOSE MENUS ================= */

document.addEventListener(
    "click",
    (event) => {

        if (
            !event.target.closest(
                ".note-menu-wrapper"
            )
        ) {

            document
                .querySelectorAll(
                    ".note-menu"
                )
                .forEach(menu =>
                    menu.classList.remove(
                        "show"
                    )
                );

        }

    }
);


/* ================= THEME ================= */

function applyTheme() {

    const dark =
        localStorage.getItem(
            "darkMode"
        ) === "true";


    document.body.classList.toggle(
        "dark",
        dark
    );


    themeButton.textContent =
        dark ? "☀️" : "🌙";

}


themeButton.addEventListener(
    "click",
    () => {

        const dark =
            !document.body.classList.contains(
                "dark"
            );


        document.body.classList.toggle(
            "dark",
            dark
        );


        localStorage.setItem(
            "darkMode",
            dark
        );


        themeButton.textContent =
            dark ? "☀️" : "🌙";

    }
);


/* ================= INITIALIZE ================= */

applyTheme();

renderSavedNotes();