/* =====================================================
   AI NOTES GENERATOR
   FRONTEND CONTROLLER
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =================================================
       ELEMENTS
    ================================================= */

    const generateTab =
        document.getElementById("generateTab");

    const learnTab =
        document.getElementById("learnTab");

    const booksTab =
        document.getElementById("booksTab");

    const yourNotesTab =
        document.getElementById("yourNotesTab");

    const themeButton =
        document.getElementById("themeButton");


    const generatePage =
        document.getElementById("generatePage");

    const learnPage =
        document.getElementById("learnPage");

    const booksPage =
        document.getElementById("booksPage");

    const yourNotesPage =
        document.getElementById("yourNotesPage");

    const readingPage =
        document.getElementById("readingPage");


    const generateButton =
        document.getElementById("generateButton");

    const topic =
        document.getElementById("topic");

    const level =
        document.getElementById("level");

    const length =
        document.getElementById("length");

    const mcq =
        document.getElementById("mcq");

    const flashcards =
        document.getElementById("flashcards");

    const pdfFile =
        document.getElementById("pdfFile");

    const fileName =
        document.getElementById("fileName");

    const loading =
        document.getElementById("loading");

    const resultCard =
        document.getElementById("resultCard");

    const notes =
        document.getElementById("notes");

    const resultTitle =
        document.getElementById("resultTitle");


    /* LEARN */

    const learnGrade =
        document.getElementById("learnGrade");

    const learnTopic =
        document.getElementById("learnTopic");

    const teachMode =
        document.getElementById("teachMode");

    const revisionMode =
        document.getElementById("revisionMode");

    const conceptMode =
        document.getElementById("conceptMode");

    const generateLearnButton =
        document.getElementById(
            "generateLearnButton"
        );

    const learnLoading =
        document.getElementById("learnLoading");

    const learnResult =
        document.getElementById("learnResult");

    const learnContent =
        document.getElementById("learnContent");

    const learnResultTitle =
        document.getElementById(
            "learnResultTitle"
        );


    /* NOTES */

    const savedNotes =
        document.getElementById("savedNotes");

    const emptyNotes =
        document.getElementById("emptyNotes");

    const notesSearch =
        document.getElementById("notesSearch");

    const notesSort =
        document.getElementById("notesSort");

    const startCreatingButton =
        document.getElementById(
            "startCreatingButton"
        );


    /* READING */

    const backToNotesButton =
        document.getElementById(
            "backToNotesButton"
        );

    const readingTitle =
        document.getElementById(
            "readingTitle"
        );

    const readingContent =
        document.getElementById(
            "readingContent"
        );


    /* =================================================
       PAGE NAVIGATION
    ================================================= */

    function showPage(page) {

        document
            .querySelectorAll(".page")
            .forEach(item => {
                item.classList.remove(
                    "active-page"
                );
            });

        page.classList.add("active-page");

        readingPage.classList.remove("active");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    function setActiveNav(button) {

        document
            .querySelectorAll(".nav-button")
            .forEach(item => {
                item.classList.remove("active");
            });

        button.classList.add("active");
    }


    generateTab.addEventListener(
        "click",
        () => {

            showPage(generatePage);

            setActiveNav(generateTab);

        }
    );


    learnTab.addEventListener(
        "click",
        () => {

            showPage(learnPage);

            setActiveNav(learnTab);

        }
    );


    booksTab.addEventListener(
        "click",
        () => {

            showPage(booksPage);

            setActiveNav(booksTab);

        }
    );


    yourNotesTab.addEventListener(
        "click",
        () => {

            showPage(yourNotesPage);

            setActiveNav(yourNotesTab);

            renderSavedNotes();

        }
    );


    /* =================================================
       THEME
    ================================================= */

    const savedTheme =
        localStorage.getItem("aiNotesTheme");

    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark-mode"
        );

        themeButton.textContent = "☀";

    }


    themeButton.addEventListener(
        "click",
        () => {

            const dark =
                document.body.classList.toggle(
                    "dark-mode"
                );

            themeButton.textContent =
                dark ? "☀" : "☾";

            localStorage.setItem(
                "aiNotesTheme",
                dark ? "dark" : "light"
            );

        }
    );


    /* =================================================
       PDF FILE
    ================================================= */

    pdfFile.addEventListener(
        "change",
        () => {

            if (!pdfFile.files.length) {

                fileName.textContent =
                    "Use a textbook, chapter or study material";

                return;
            }

            fileName.textContent =
                pdfFile.files[0].name;

        }
    );


    /* =================================================
       MARKDOWN RENDERER
    ================================================= */

    function escapeHtml(text) {

        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

    }


    function renderMarkdown(markdown) {

        if (!markdown) {
            return "";
        }

        let html =
            escapeHtml(markdown);


        /* CODE BLOCKS */

        html = html.replace(
            /```([\s\S]*?)```/g,
            "<pre><code>$1</code></pre>"
        );


        /* HEADINGS */

        html = html.replace(
            /^### (.*)$/gm,
            "<h3>$1</h3>"
        );

        html = html.replace(
            /^## (.*)$/gm,
            "<h2>$1</h2>"
        );

        html = html.replace(
            /^# (.*)$/gm,
            "<h1>$1</h1>"
        );


        /* BOLD */

        html = html.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


        /* ITALIC */

        html = html.replace(
            /\*(.*?)\*/g,
            "<em>$1</em>"
        );


        /* BULLET LIST */

        html = html.replace(
            /(?:^|\n)([-•]) (.*)/g,
            "<li>$2</li>"
        );

        html = html.replace(
            /(<li>.*<\/li>)/gs,
            "<ul>$1</ul>"
        );


        /* NUMBERED LIST */

        html = html.replace(
            /(?:^|\n)\d+\.\s+(.*)/g,
            "<li>$1</li>"
        );


        /* PARAGRAPHS */

        html = html
            .split(/\n{2,}/)
            .map(block => {

                block = block.trim();

                if (!block) {
                    return "";
                }

                if (
                    block.startsWith("<h1>") ||
                    block.startsWith("<h2>") ||
                    block.startsWith("<h3>") ||
                    block.startsWith("<ul>") ||
                    block.startsWith("<pre>")
                ) {
                    return block;
                }

                return `<p>${block.replace(
                    /\n/g,
                    "<br>"
                )}</p>`;

            })
            .join("");


        return html;

    }


    /* =================================================
       GENERATE NOTES
    ================================================= */

    generateButton.addEventListener(
        "click",
        async () => {

            const topicValue =
                topic.value.trim();


            if (
                !topicValue &&
                !pdfFile.files.length
            ) {

                alert(
                    "Please enter a topic or upload a PDF."
                );

                topic.focus();

                return;
            }


            const formData =
                new FormData();


            formData.append(
                "topic",
                topicValue
            );

            formData.append(
                "level",
                level.value
            );

            formData.append(
                "length",
                length.value
            );

            formData.append(
                "includeMCQ",
                mcq.checked
            );

            formData.append(
                "includeFlashcards",
                flashcards.checked
            );


            if (pdfFile.files.length) {

                formData.append(
                    "pdf",
                    pdfFile.files[0]
                );

            }


            loading.classList.add("show");

            resultCard.classList.remove("show");

            generateButton.disabled = true;

            generateButton.style.opacity =
                "0.65";


            try {

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
                        "Unable to generate notes."
                    );

                }


                notes.innerHTML =
                    renderMarkdown(
                        data.notes || ""
                    );


                resultTitle.textContent =
                    topicValue ||
                    "Your Study Notes";


                resultCard.classList.add(
                    "show"
                );


                resultCard.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });


                if (
                    window.MathJax &&
                    window.MathJax.typesetPromise
                ) {

                    await window.MathJax
                        .typesetPromise([
                            notes
                        ]);

                }

            } catch (error) {

                console.error(error);

                alert(
                    error.message ||
                    "Something went wrong."
                );

            } finally {

                loading.classList.remove(
                    "show"
                );

                generateButton.disabled =
                    false;

                generateButton.style.opacity =
                    "1";

            }

        }
    );


    /* =================================================
       LEARNING MODES
    ================================================= */

    let selectedLearningMode =
        "teach";


    function selectLearningMode(
        button,
        mode
    ) {

        document
            .querySelectorAll(
                ".learning-mode"
            )
            .forEach(item => {
                item.classList.remove(
                    "selected"
                );
            });


        button.classList.add(
            "selected"
        );


        selectedLearningMode =
            mode;

    }


    teachMode.addEventListener(
        "click",
        () => {

            selectLearningMode(
                teachMode,
                "teach"
            );

        }
    );


    revisionMode.addEventListener(
        "click",
        () => {

            selectLearningMode(
                revisionMode,
                "revision"
            );

        }
    );


    conceptMode.addEventListener(
        "click",
        () => {

            selectLearningMode(
                conceptMode,
                "concept"
            );

        }
    );


    /* =================================================
       TEACH ME / LEARN
    ================================================= */

    generateLearnButton.addEventListener(
        "click",
        async () => {

            const topicValue =
                learnTopic.value.trim();


            if (!topicValue) {

                alert(
                    "Please enter a topic or chapter first."
                );

                learnTopic.focus();

                return;
            }


            learnLoading.classList.add(
                "show"
            );

            learnResult.classList.remove(
                "show"
            );

            generateLearnButton.disabled =
                true;

            generateLearnButton.style.opacity =
                "0.65";


            try {

                /*
                 * The existing backend exposes
                 * /api/generate.
                 *
                 * We use it for the Learn feature
                 * and add the selected learning mode
                 * to the topic instructions.
                 */

                let instruction = "";


                if (
                    selectedLearningMode ===
                    "teach"
                ) {

                    instruction = `
Teach me "${topicValue}" like a friendly school teacher.

Explain the topic step by step in simple language suitable for ${learnGrade.value}.

Start with the basic idea, then explain the important concepts.

Use simple examples where helpful.

Use clear headings and bullet points.

Make difficult ideas easy to understand.

End with a short "Remember" section containing the most important points.

Do not assume the student already understands the topic.
`;

                    learnResultTitle.textContent =
                        `Teach Me: ${topicValue}`;

                }


                else if (
                    selectedLearningMode ===
                    "revision"
                ) {

                    instruction = `
Create a one-page quick revision sheet for "${topicValue}".

The student is studying at ${learnGrade.value} level.

Include the most important definitions, concepts, facts, formulas, examples and exam points.

Use short headings and bullet points.

Keep it concise and easy to revise quickly.
`;

                    learnResultTitle.textContent =
                        `Quick Revision: ${topicValue}`;

                }


                else {

                    instruction = `
Create a clear concept map style explanation for "${topicValue}".

The student is studying at ${learnGrade.value} level.

Show the main concept first and then connect it to its important sub-concepts.

Use headings, arrows, relationships and bullet points where useful.

Explain the connections in simple language.

Make the structure easy to understand and remember.
`;

                    learnResultTitle.textContent =
                        `Concept Map: ${topicValue}`;

                }


                const formData =
                    new FormData();


                formData.append(
                    "topic",
                    instruction
                );

                formData.append(
                    "level",
                    learnGrade.value
                );

                formData.append(
                    "length",
                    "medium"
                );

                formData.append(
                    "includeMCQ",
                    "false"
                );

                formData.append(
                    "includeFlashcards",
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
                        "Unable to create learning material."
                    );

                }


                learnContent.innerHTML =
                    renderMarkdown(
                        data.notes || ""
                    );


                learnResult.classList.add(
                    "show"
                );


                learnResult.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });


                if (
                    window.MathJax &&
                    window.MathJax.typesetPromise
                ) {

                    await window.MathJax
                        .typesetPromise([
                            learnContent
                        ]);

                }


            } catch (error) {

                console.error(error);

                alert(
                    error.message ||
                    "Something went wrong while creating the lesson."
                );

            } finally {

                learnLoading.classList.remove(
                    "show"
                );

                generateLearnButton.disabled =
                    false;

                generateLearnButton.style.opacity =
                    "1";

            }

        }
    );


    /* =================================================
       COPY NOTES
    ================================================= */

    const copyButton =
        document.getElementById(
            "copyButton"
        );


    copyButton.addEventListener(
        "click",
        async () => {

            const text =
                notes.innerText.trim();


            if (!text) {
                return;
            }


            try {

                await navigator.clipboard
                    .writeText(text);

                copyButton.textContent =
                    "✓ Copied";

                setTimeout(() => {

                    copyButton.textContent =
                        "📋 Copy";

                }, 1500);

            } catch {

                alert(
                    "Copy failed. Please select the text manually."
                );

            }

        }
    );


    /* =================================================
       SAVE NOTES
    ================================================= */

    const saveButton =
        document.getElementById(
            "saveButton"
        );


    function getSavedNotes() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    "aiNotesSaved"
                ) || "[]"
            );

        } catch {

            return [];

        }

    }


    function saveNote(
        title,
        content
    ) {

        const items =
            getSavedNotes();


        const note = {
            id: Date.now(),
            title: title,
            content: content,
            createdAt:
                new Date().toISOString()
        };


        items.unshift(note);


        localStorage.setItem(
            "aiNotesSaved",
            JSON.stringify(items)
        );

    }


    saveButton.addEventListener(
        "click",
        () => {

            const content =
                notes.innerText.trim();


            if (!content) {
                return;
            }


            saveNote(
                resultTitle.textContent ||
                "Study Notes",
                content
            );


            saveButton.textContent =
                "✓ Saved";


            setTimeout(() => {

                saveButton.textContent =
                    "💾 Save";

            }, 1500);

        }
    );


    /* =================================================
       SAVE LEARNING MATERIAL
    ================================================= */

    const saveLearnButton =
        document.getElementById(
            "saveLearnButton"
        );


    saveLearnButton.addEventListener(
        "click",
        () => {

            const content =
                learnContent.innerText.trim();


            if (!content) {
                return;
            }


            saveNote(
                learnResultTitle.textContent ||
                "Learning Material",
                content
            );


            saveLearnButton.textContent =
                "✓ Saved";


            setTimeout(() => {

                saveLearnButton.textContent =
                    "💾 Save";

            }, 1500);

        }
    );


    /* =================================================
       YOUR NOTES
    ================================================= */

    function renderSavedNotes() {

        const items =
            getSavedNotes();


        savedNotes.innerHTML = "";


        if (!items.length) {

            emptyNotes.style.display =
                "block";

            return;

        }


        emptyNotes.style.display =
            "none";


        const search =
            notesSearch.value
                .trim()
                .toLowerCase();


        let filtered =
            items.filter(item => {

                return (
                    item.title
                        .toLowerCase()
                        .includes(search) ||

                    item.content
                        .toLowerCase()
                        .includes(search)
                );

            });


        const sort =
            notesSort.value;


        if (sort === "oldest") {

            filtered.sort(
                (a, b) =>
                    a.createdAt.localeCompare(
                        b.createdAt
                    )
            );

        }


        if (sort === "az") {

            filtered.sort(
                (a, b) =>
                    a.title.localeCompare(
                        b.title
                    )
            );

        }


        filtered.forEach(item => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "book-card";


            card.style.alignItems =
                "flex-start";

            card.style.textAlign =
                "left";


            card.innerHTML = `
                <span class="book-symbol">📝</span>

                <strong>
                    ${escapeHtml(item.title)}
                </strong>

                <small>
                    Saved ${new Date(
                        item.createdAt
                    ).toLocaleDateString()}
                </small>
            `;


            card.addEventListener(
                "click",
                () => {

                    openReading(
                        item.title,
                        item.content
                    );

                }
            );


            savedNotes.appendChild(
                card
            );

        });

    }


    notesSearch.addEventListener(
        "input",
        renderSavedNotes
    );


    notesSort.addEventListener(
        "change",
        renderSavedNotes
    );


    startCreatingButton.addEventListener(
        "click",
        () => {

            showPage(generatePage);

            setActiveNav(
                generateTab
            );

        }
    );


    /* =================================================
       READING
    ================================================= */

    function openReading(
        title,
        content
    ) {

        document
            .querySelectorAll(".page")
            .forEach(item => {
                item.classList.remove(
                    "active-page"
                );
            });


        readingPage.classList.add(
            "active"
        );


        readingTitle.textContent =
            title;


        readingContent.innerHTML =
            renderMarkdown(
                content
            );


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    backToNotesButton.addEventListener(
        "click",
        () => {

            readingPage.classList.remove(
                "active"
            );

            showPage(
                yourNotesPage
            );

            setActiveNav(
                yourNotesTab
            );

            renderSavedNotes();

        }
    );


    /* =================================================
       BOOK TABS
    ================================================= */

    document
        .querySelectorAll(".grade-tab")
        .forEach(tab => {

            tab.addEventListener(
                "click",
                () => {

                    const grade =
                        tab.dataset.grade;


                    document
                        .querySelectorAll(
                            ".grade-tab"
                        )
                        .forEach(item => {
                            item.classList.remove(
                                "active"
                            );
                        });


                    tab.classList.add(
                        "active"
                    );


                    document
                        .querySelectorAll(
                            ".book-grade"
                        )
                        .forEach(book => {
                            book.classList.remove(
                                "active"
                            );
                        });


                    const selected =
                        document.getElementById(
                            `booksGrade${grade}`
                        );


                    if (selected) {

                        selected.classList.add(
                            "active"
                        );

                    }

                }
            );

        });


    /* =================================================
       BOOK PDF LABELS
    ================================================= */

    document
        .querySelectorAll(
            ".book-card input[type='file']"
        )
        .forEach(input => {

            input.addEventListener(
                "change",
                () => {

                    if (!input.files.length) {
                        return;
                    }


                    const card =
                        input.closest(
                            ".book-card"
                        );


                    const small =
                        card.querySelector(
                            "small"
                        );


                    if (small) {

                        small.textContent =
                            input.files[0].name;

                    }

                }
            );

        });


    /* =================================================
       DOWNLOAD AS TEXT FILE
       (SAFE CLIENT-SIDE FALLBACK)
    ================================================= */

    function downloadText(
        filename,
        content
    ) {

        const blob =
            new Blob(
                [content],
                {
                    type:
                        "text/plain;charset=utf-8"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href = url;

        link.download =
            filename;


        document.body.appendChild(
            link
        );


        link.click();

        link.remove();


        URL.revokeObjectURL(
            url
        );

    }


    const downloadButton =
        document.getElementById(
            "downloadButton"
        );


    downloadButton.addEventListener(
        "click",
        () => {

            const content =
                notes.innerText.trim();


            if (!content) {
                return;
            }


            downloadText(
                "ai-study-notes.txt",
                content
            );

        }
    );


    const downloadLearnButton =
        document.getElementById(
            "downloadLearnButton"
        );


    downloadLearnButton.addEventListener(
        "click",
        () => {

            const content =
                learnContent.innerText.trim();


            if (!content) {
                return;
            }


            downloadText(
                "ai-learning-material.txt",
                content
            );

        }
    );


    const readingDownloadButton =
        document.getElementById(
            "readingDownloadButton"
        );


    readingDownloadButton.addEventListener(
        "click",
        () => {

            const content =
                readingContent.innerText.trim();


            if (!content) {
                return;
            }


            downloadText(
                "saved-ai-notes.txt",
                content
            );

        }
    );


    const readingSaveButton =
        document.getElementById(
            "readingSaveButton"
        );


    readingSaveButton.addEventListener(
        "click",
        () => {

            const content =
                readingContent.innerText.trim();


            if (!content) {
                return;
            }


            saveNote(
                readingTitle.textContent,
                content
            );


            readingSaveButton.textContent =
                "✓ Saved";


            setTimeout(() => {

                readingSaveButton.textContent =
                    "💾 Save";

            }, 1500);

        }
    );
/* =========================================
   NOVIQRA APPEARANCE SETTINGS
   ========================================= */

(function loadNoviqraSettings() {

    const SETTINGS_KEY = "noviqraSettings";


    const colorThemes = {

        teal: {
            primary: "#0f766e",
            primaryLight: "#14b8a6",
            primaryDark: "#115e59",
            primarySoft: "#ccfbf1"
        },

        blue: {
            primary: "#1d4ed8",
            primaryLight: "#3b82f6",
            primaryDark: "#1e3a8a",
            primarySoft: "#dbeafe"
        },

        green: {
            primary: "#15803d",
            primaryLight: "#22c55e",
            primaryDark: "#166534",
            primarySoft: "#dcfce7"
        },

        purple: {
            primary: "#6d28d9",
            primaryLight: "#8b5cf6",
            primaryDark: "#4c1d95",
            primarySoft: "#ede9fe"
        },

        orange: {
            primary: "#ea580c",
            primaryLight: "#f97316",
            primaryDark: "#9a3412",
            primarySoft: "#ffedd5"
        },

        pink: {
            primary: "#db2777",
            primaryLight: "#ec4899",
            primaryDark: "#9d174d",
            primarySoft: "#fce7f3"
        },

        indigo: {
            primary: "#3730a3",
            primaryLight: "#6366f1",
            primaryDark: "#312e81",
            primarySoft: "#e0e7ff"
        },

        cyan: {
            primary: "#0891b2",
            primaryLight: "#06b6d4",
            primaryDark: "#155e75",
            primarySoft: "#cffafe"
        },

        red: {
            primary: "#b91c1c",
            primaryLight: "#ef4444",
            primaryDark: "#7f1d1d",
            primarySoft: "#fee2e2"
        },

        gold: {
            primary: "#b45309",
            primaryLight: "#d97706",
            primaryDark: "#78350f",
            primarySoft: "#fef3c7"
        }

    };


    const backgrounds = {

        white:
            "#f7faf9",

        "soft-teal":
            "#ecfdf9",

        gradient:
            "linear-gradient(135deg, #ecfeff 0%, #ccfbf1 50%, #f0fdfa 100%)",

        mesh:
            "radial-gradient(circle at 20% 20%, #99f6e4, transparent 35%), radial-gradient(circle at 80% 80%, #a7f3d0, transparent 35%), #f0fdfa",

        dark:
            "linear-gradient(135deg, #0f172a 0%, #134e4a 100%)"

    };


    const saved =
        localStorage.getItem(
            SETTINGS_KEY
        );


    if (!saved) return;


    try {

        const settings =
            JSON.parse(saved);


        /* COLOR */

        const theme =
            colorThemes[settings.color];


        if (theme) {

            document.documentElement.style.setProperty(
                "--primary",
                theme.primary
            );

            document.documentElement.style.setProperty(
                "--primary-light",
                theme.primaryLight
            );

            document.documentElement.style.setProperty(
                "--primary-dark",
                theme.primaryDark
            );

            document.documentElement.style.setProperty(
                "--primary-soft",
                theme.primarySoft
            );

            document.documentElement.style.setProperty(
                "--soft",
                theme.primarySoft
            );

        }



        /* CUSTOM BACKGROUND */

        if (settings.customBackground) {

            document.body.style.backgroundImage =
                `url("${settings.customBackground}")`;

            document.body.style.backgroundSize =
                "cover";

            document.body.style.backgroundAttachment =
                "fixed";

            document.body.style.backgroundPosition =
                "center";

            document.body.style.backgroundRepeat =
                "no-repeat";

            document.body.classList.add(
                "has-custom-background"
            );

        }

        /* DEFAULT BACKGROUND */

        else {

            const background =
                backgrounds[
                    settings.background
                ];


            if (background) {

                document.body.style.background =
                    background;

            }

            document.body.classList.remove(
                "has-custom-background"
            );

        }

    } catch (error) {

        console.warn(
            "Noviqra settings could not be loaded.",
            error
        );

    }

})();
});