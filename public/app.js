// =====================================
// GENERATE NOTES
// =====================================

async function generateNotes() {

    const topic =
        document.getElementById("topic").value.trim();

    const level =
        document.getElementById("level").value;

    const length =
        document.getElementById("length").value;

    const includeMCQ =
        document.getElementById("mcq").checked;

    const includeFlashcards =
        document.getElementById("flashcards").checked;

    const pdfFile =
        document.getElementById("pdfFile").files[0];


    if (!topic) {

        alert("Please enter a topic first.");

        return;

    }


    const button =
        document.getElementById("generateButton");

    const loading =
        document.getElementById("loading");

    const result =
        document.getElementById("resultCard");

    const notes =
        document.getElementById("notes");


    button.disabled = true;

    button.style.opacity = "0.6";

    loading.style.display = "flex";

    result.style.display = "none";


    try {

        const formData =
            new FormData();

        formData.append(
            "topic",
            topic
        );

        formData.append(
            "level",
            level
        );

        formData.append(
            "length",
            length
        );

        formData.append(
            "includeMCQ",
            includeMCQ
        );

        formData.append(
            "includeFlashcards",
            includeFlashcards
        );


        if (pdfFile) {

            formData.append(
                "pdf",
                pdfFile
            );

        }


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
                "Failed to generate notes."
            );

        }


        // =================================
        // DISPLAY NOTES
        // =================================

        notes.innerHTML =
            markdownToHTML(
                data.notes
            );


        result.style.display =
            "block";


        result.scrollIntoView({
            behavior: "smooth"
        });


        // =================================
        // RENDER DIAGRAMS SAFELY
        // =================================

        await renderMermaidSafely();


        // =================================
        // RENDER MATHEMATICS SAFELY
        // =================================

        if (window.MathJax) {

            try {

                await MathJax.typesetPromise(
                    [notes]
                );

            } catch (mathError) {

                console.warn(
                    "Math formatting warning:",
                    mathError
                );

            }

        }


    } catch (error) {

        console.error(
            error
        );

        alert(
            "Error: " +
            error.message
        );

    } finally {

        button.disabled = false;

        button.style.opacity = "1";

        loading.style.display = "none";

    }

}


// =====================================
// SAFE MERMAID RENDERING
// =====================================

async function renderMermaidSafely() {

    if (!window.mermaid) {

        return;

    }


    const diagrams =
        document.querySelectorAll(
            ".mermaid"
        );


    if (diagrams.length === 0) {

        return;

    }


    for (const diagram of diagrams) {

        try {

            // Clean whitespace
            const source =
                diagram.textContent
                    .trim();


            if (!source) {

                diagram.innerHTML =
                    "📊 No diagram data.";

                continue;

            }


            // Give Mermaid a unique ID
            const id =
                "diagram-" +
                Math.random()
                    .toString(36)
                    .substring(2, 10);


            const result =
                await mermaid.render(
                    id,
                    source
                );


            diagram.innerHTML =
                result.svg;


        } catch (error) {

            console.warn(
                "Mermaid diagram skipped:",
                error
            );


            // IMPORTANT:
            // Do not destroy the notes.
            // Show a simple fallback instead.

            diagram.innerHTML = `
                <div class="diagram-fallback">
                    📊 <strong>Visual diagram</strong>
                    <br>
                    <small>
                        This diagram could not be rendered,
                        but the notes are still available.
                    </small>
                </div>
            `;

        }

    }

}


// =====================================
// MARKDOWN → HTML
// =====================================

function markdownToHTML(text) {

    // ---------------------------------
    // STEP 1
    // Protect Mermaid blocks FIRST
    // ---------------------------------

    const mermaidBlocks = [];

    text =
        text.replace(
            /```mermaid\s*([\s\S]*?)```/gi,
            function (_, diagram) {

                const index =
                    mermaidBlocks.length;

                mermaidBlocks.push(
                    diagram.trim()
                );

                return `___MERMAID_${index}___`;

            }
        );


    // ---------------------------------
    // STEP 2
    // Escape normal HTML
    // ---------------------------------

    let html =
        escapeHTML(text);


    // ---------------------------------
    // STEP 3
    // Restore Mermaid blocks
    // ---------------------------------

    mermaidBlocks.forEach(
        function (diagram, index) {

            const safeDiagram =
                escapeHTML(diagram);

            html =
                html.replace(
                    `___MERMAID_${index}___`,
                    `
                    <div class="mermaid">
                        ${safeDiagram}
                    </div>
                    `
                );

        }
    );


    // ---------------------------------
    // CODE BLOCKS
    // ---------------------------------

    html =
        html.replace(
            /```([\s\S]*?)```/g,
            "<pre><code>$1</code></pre>"
        );


    // ---------------------------------
    // HEADINGS
    // ---------------------------------

    html =
        html.replace(
            /^### (.*)$/gm,
            "<h3>$1</h3>"
        );


    html =
        html.replace(
            /^## (.*)$/gm,
            "<h2>$1</h2>"
        );


    html =
        html.replace(
            /^# (.*)$/gm,
            "<h1>$1</h1>"
        );


    // ---------------------------------
    // BOLD
    // ---------------------------------

    html =
        html.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    // ---------------------------------
    // BULLETS
    // ---------------------------------

    html =
        html.replace(
            /^[-*]\s+(.*)$/gm,
            `
            <div class="bullet-point">
                • $1
            </div>
            `
        );


    // ---------------------------------
    // NUMBERED LISTS
    // ---------------------------------

    html =
        html.replace(
            /^(\d+)\.\s+(.*)$/gm,
            `
            <div class="numbered-point">
                <strong>$1.</strong> $2
            </div>
            `
        );


    // ---------------------------------
    // HORIZONTAL LINE
    // ---------------------------------

    html =
        html.replace(
            /^---$/gm,
            "<hr>"
        );


    // ---------------------------------
    // PARAGRAPHS
    // ---------------------------------

    const parts =
        html.split(/\n{2,}/);


    html =
        parts
            .map(
                part => {

                    const trimmed =
                        part.trim();


                    if (
                        trimmed.startsWith("<h1") ||
                        trimmed.startsWith("<h2") ||
                        trimmed.startsWith("<h3") ||
                        trimmed.startsWith("<div") ||
                        trimmed.startsWith("<pre") ||
                        trimmed.startsWith("<hr")
                    ) {

                        return part;

                    }


                    return (
                        "<p>" +
                        part.replace(
                            /\n/g,
                            "<br>"
                        ) +
                        "</p>"
                    );

                }
            )
            .join("");


    return html;

}


// =====================================
// ESCAPE HTML
// =====================================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text;

    return div.innerHTML;

}


// =====================================
// COPY NOTES
// =====================================

async function copyNotes() {

    const notes =
        document.getElementById(
            "notes"
        );


    try {

        await navigator.clipboard.writeText(
            notes.innerText
        );

        alert(
            "Notes copied! 📋"
        );

    } catch (error) {

        alert(
            "Unable to copy notes."
        );

    }

}


// =====================================
// DOWNLOAD NOTES
// =====================================

function downloadNotes() {

    const topic =
        document.getElementById(
            "topic"
        ).value ||
        "AI-Notes";


    const notes =
        document.getElementById(
            "notes"
        ).innerText;


    const blob =
        new Blob(
            [notes],
            {
                type: "text/plain"
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


    link.href =
        url;


    link.download =
        topic.replace(
            /[^a-z0-9]/gi,
            "_"
        ) +
        "_notes.txt";


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );

}


// =====================================
// DARK MODE
// =====================================

function toggleTheme() {

    document.body.classList.toggle(
        "dark"
    );


    const button =
        document.getElementById(
            "themeButton"
        );


    if (
        document.body.classList.contains(
            "dark"
        )
    ) {

        button.textContent =
            "☀️";

    } else {

        button.textContent =
            "🌙";

    }

}