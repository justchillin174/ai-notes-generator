/* =========================================
   NOVIQRA SETTINGS
   Color + Background Customization
   ========================================= */

const SETTINGS_KEY = "noviqraSettings";


/* =========================================
   1. COLOR THEMES
   ========================================= */

const colorThemes = {
    teal: {
        primary: "#0f766e",
        primaryLight: "#14b8a6",
        primaryDark: "#115e59",
        soft: "#ccfbf1"
    },

    blue: {
        primary: "#1d4ed8",
        primaryLight: "#3b82f6",
        primaryDark: "#1e3a8a",
        soft: "#dbeafe"
    },

    green: {
        primary: "#15803d",
        primaryLight: "#22c55e",
        primaryDark: "#166534",
        soft: "#dcfce7"
    },

    purple: {
        primary: "#6d28d9",
        primaryLight: "#8b5cf6",
        primaryDark: "#4c1d95",
        soft: "#ede9fe"
    },

    orange: {
        primary: "#ea580c",
        primaryLight: "#f97316",
        primaryDark: "#9a3412",
        soft: "#ffedd5"
    },

    pink: {
        primary: "#db2777",
        primaryLight: "#ec4899",
        primaryDark: "#9d174d",
        soft: "#fce7f3"
    },

    indigo: {
        primary: "#3730a3",
        primaryLight: "#6366f1",
        primaryDark: "#312e81",
        soft: "#e0e7ff"
    },

    cyan: {
        primary: "#0891b2",
        primaryLight: "#06b6d4",
        primaryDark: "#155e75",
        soft: "#cffafe"
    },

    red: {
        primary: "#b91c1c",
        primaryLight: "#ef4444",
        primaryDark: "#7f1d1d",
        soft: "#fee2e2"
    },

    gold: {
        primary: "#b45309",
        primaryLight: "#d97706",
        primaryDark: "#78350f",
        soft: "#fef3c7"
    }
};


/* =========================================
   2. BACKGROUND THEMES
   ========================================= */

const backgroundThemes = {
    white: {
        type: "color",
        value: "#f7faf9"
    },

    "soft-teal": {
        type: "color",
        value: "#ecfdf9"
    },

    gradient: {
        type: "gradient",
        value:
            "linear-gradient(135deg, #ecfeff 0%, #ccfbf1 50%, #f0fdfa 100%)"
    },

    mesh: {
        type: "gradient",
        value:
            "radial-gradient(circle at 20% 20%, #99f6e4, transparent 35%), radial-gradient(circle at 80% 80%, #a7f3d0, transparent 35%), #f0fdfa"
    },

    dark: {
        type: "gradient",
        value:
            "linear-gradient(135deg, #0f172a 0%, #134e4a 100%)"
    }
};


/* =========================================
   3. DEFAULT SETTINGS
   ========================================= */

const defaultSettings = {
    color: "teal",
    background: "white",
    customBackground: null
};


/* =========================================
   4. GET SAVED SETTINGS
   ========================================= */

function getSettings() {

    const savedSettings =
        localStorage.getItem(SETTINGS_KEY);

    if (!savedSettings) {
        return { ...defaultSettings };
    }

    try {

        const parsed =
            JSON.parse(savedSettings);

        return {
            ...defaultSettings,
            ...parsed
        };

    } catch (error) {

        console.warn(
            "Could not read Noviqra settings.",
            error
        );

        return { ...defaultSettings };
    }
}


/* =========================================
   5. SAVE SETTINGS
   ========================================= */

function saveSettings(settings) {

    localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
    );
}


/* =========================================
   6. APPLY COLOR THEME
   ========================================= */

function applyColorTheme(themeName) {

    const theme =
        colorThemes[themeName];

    if (!theme) {
        return;
    }

    const root =
        document.documentElement;

    root.style.setProperty(
        "--primary",
        theme.primary
    );

    root.style.setProperty(
        "--primary-light",
        theme.primaryLight
    );

    root.style.setProperty(
        "--primary-dark",
        theme.primaryDark
    );

    root.style.setProperty(
        "--soft",
        theme.soft
    );

    /*
       Also set --primary-soft in case
       the main website uses that variable.
    */

    root.style.setProperty(
        "--primary-soft",
        theme.soft
    );
}


/* =========================================
   7. SELECT COLOR BUTTON
   ========================================= */

function selectColorButton(themeName) {

    const buttons =
        document.querySelectorAll(
            ".color-option"
        );

    buttons.forEach(button => {

        const isSelected =
            button.dataset.theme === themeName;

        button.classList.toggle(
            "selected",
            isSelected
        );

        /*
           Accessibility support
        */

        button.setAttribute(
            "aria-pressed",
            isSelected ? "true" : "false"
        );
    });
}


/* =========================================
   8. SELECT BACKGROUND BUTTON
   ========================================= */

function selectBackgroundButton(backgroundName) {

    const buttons =
        document.querySelectorAll(
            ".background-option"
        );

    buttons.forEach(button => {

        const isSelected =
            button.dataset.background === backgroundName;

        button.classList.toggle(
            "selected",
            isSelected
        );

        button.setAttribute(
            "aria-pressed",
            isSelected ? "true" : "false"
        );
    });
}


/* =========================================
   9. APPLY BACKGROUND
   ========================================= */

function applyBackground(settings) {

    const body =
        document.body;


    /*
       CUSTOM BACKGROUND
    */

    if (settings.customBackground) {

        body.style.background =
            `url("${settings.customBackground}") center / cover fixed no-repeat`;

        body.dataset.background =
            "custom";

        return;
    }


    /*
       DEFAULT BACKGROUND
    */

    const background =
        backgroundThemes[
            settings.background
        ];


    if (!background) {
        return;
    }


    if (background.type === "color") {

        body.style.background =
            background.value;

    } else {

        body.style.background =
            background.value;
    }


    body.dataset.background =
        settings.background;
}


/* =========================================
   10. SHOW CUSTOM IMAGE PREVIEW
   ========================================= */

function showCustomPreview(imageData) {

    const previewBox =
        document.getElementById(
            "customPreview"
        );

    const previewImage =
        document.getElementById(
            "previewImage"
        );


    if (!previewBox || !previewImage) {
        return;
    }


    if (!imageData) {

        previewBox.classList.add(
            "hidden"
        );

        previewImage.removeAttribute(
            "src"
        );

        return;
    }


    previewImage.src =
        imageData;

    previewBox.classList.remove(
        "hidden"
    );
}


/* =========================================
   11. COMPRESS UPLOADED IMAGE
   ========================================= */

function compressImage(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                function(event) {

                    const image =
                        new Image();


                    image.onload =
                        function() {

                            /*
                               Keep the image reasonably
                               small so localStorage
                               does not fill up quickly.
                            */

                            const maxWidth = 1600;

                            const scale =
                                Math.min(
                                    1,
                                    maxWidth /
                                    image.width
                                );


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            canvas.width =
                                Math.round(
                                    image.width *
                                    scale
                                );


                            canvas.height =
                                Math.round(
                                    image.height *
                                    scale
                                );


                            const context =
                                canvas.getContext(
                                    "2d"
                                );


                            context.drawImage(
                                image,
                                0,
                                0,
                                canvas.width,
                                canvas.height
                            );


                            const compressedImage =
                                canvas.toDataURL(
                                    "image/jpeg",
                                    0.80
                                );


                            resolve(
                                compressedImage
                            );
                        };


                    image.onerror =
                        function() {

                            reject(
                                new Error(
                                    "Image could not be loaded."
                                )
                            );
                        };


                    image.src =
                        event.target.result;
                };


            reader.onerror =
                function() {

                    reject(
                        new Error(
                            "File could not be read."
                        )
                    );
                };


            reader.readAsDataURL(file);
        }
    );
}


/* =========================================
   12. HANDLE COLOR SELECTION
   ========================================= */

function setupColorButtons() {

    const buttons =
        document.querySelectorAll(
            ".color-option"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            function() {

                const themeName =
                    button.dataset.theme;


                if (!colorThemes[themeName]) {
                    return;
                }


                const settings =
                    getSettings();


                settings.color =
                    themeName;


                saveSettings(
                    settings
                );


                applyColorTheme(
                    themeName
                );


                selectColorButton(
                    themeName
                );
            }
        );
    });
}


/* =========================================
   13. HANDLE BACKGROUND SELECTION
   ========================================= */

function setupBackgroundButtons() {

    const buttons =
        document.querySelectorAll(
            ".background-option"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            function() {

                const backgroundName =
                    button.dataset.background;


                if (
                    !backgroundThemes[
                        backgroundName
                    ]
                ) {
                    return;
                }


                const settings =
                    getSettings();


                /*
                   Selecting a built-in
                   background removes
                   the custom background.
                */

                settings.background =
                    backgroundName;

                settings.customBackground =
                    null;


                saveSettings(
                    settings
                );


                applyBackground(
                    settings
                );


                selectBackgroundButton(
                    backgroundName
                );


                showCustomPreview(
                    null
                );


                const upload =
                    document.getElementById(
                        "backgroundUpload"
                    );


                if (upload) {
                    upload.value = "";
                }
            }
        );
    });
}


/* =========================================
   14. HANDLE CUSTOM BACKGROUND UPLOAD
   ========================================= */

function setupBackgroundUpload() {

    const upload =
        document.getElementById(
            "backgroundUpload"
        );


    if (!upload) {
        return;
    }


    upload.addEventListener(
        "change",
        async function(event) {

            const file =
                event.target.files[0];


            if (!file) {
                return;
            }


            /*
               Check file type
            */

            if (
                ![
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                ].includes(file.type)
            ) {

                alert(
                    "Please select a JPG, PNG, or WebP image."
                );

                upload.value = "";

                return;
            }


            /*
               Check file size.
               Original upload limit:
               10 MB
            */

            const maxFileSize =
                10 * 1024 * 1024;


            if (
                file.size >
                maxFileSize
            ) {

                alert(
                    "Please choose an image smaller than 10 MB."
                );

                upload.value = "";

                return;
            }


            try {

                const imageData =
                    await compressImage(
                        file
                    );


                const settings =
                    getSettings();


                settings.customBackground =
                    imageData;


                saveSettings(
                    settings
                );


                applyBackground(
                    settings
                );


                showCustomPreview(
                    imageData
                );


                /*
                   Remove selected state
                   from built-in backgrounds
                   because custom background
                   is now active.
                */

                document
                    .querySelectorAll(
                        ".background-option"
                    )
                    .forEach(button => {

                        button.classList.remove(
                            "selected"
                        );

                        button.setAttribute(
                            "aria-pressed",
                            "false"
                        );
                    });


            } catch (error) {

                console.error(
                    "Background upload error:",
                    error
                );

                alert(
                    "The image could not be loaded. Please try another image."
                );

                upload.value = "";
            }
        }
    );
}


/* =========================================
   15. REMOVE CUSTOM BACKGROUND
   ========================================= */

function setupRemoveBackground() {

    const removeButton =
        document.getElementById(
            "removeBackground"
        );


    if (!removeButton) {
        return;
    }


    removeButton.addEventListener(
        "click",
        function() {

            const settings =
                getSettings();


            settings.customBackground =
                null;

            settings.background =
                "white";


            saveSettings(
                settings
            );


            applyBackground(
                settings
            );


            selectBackgroundButton(
                "white"
            );


            showCustomPreview(
                null
            );


            const upload =
                document.getElementById(
                    "backgroundUpload"
                );


            if (upload) {
                upload.value = "";
            }
        }
    );
}


/* =========================================
   16. RESET ALL SETTINGS
   ========================================= */

function setupResetButton() {

    const resetButton =
        document.getElementById(
            "resetSettings"
        );


    if (!resetButton) {
        return;
    }


    resetButton.addEventListener(
        "click",
        function() {

            const confirmed =
                confirm(
                    "Reset your Noviqra appearance settings?"
                );


            if (!confirmed) {
                return;
            }


            const settings = {
                ...defaultSettings
            };


            saveSettings(
                settings
            );


            applyColorTheme(
                settings.color
            );


            applyBackground(
                settings
            );


            selectColorButton(
                settings.color
            );


            selectBackgroundButton(
                settings.background
            );


            showCustomPreview(
                null
            );


            const upload =
                document.getElementById(
                    "backgroundUpload"
                );


            if (upload) {
                upload.value = "";
            }

        }
    );
}


/* =========================================
   17. INITIALIZE SETTINGS PAGE
   ========================================= */

function initializeSettings() {

    const settings =
        getSettings();


    /*
       Apply saved settings
    */

    applyColorTheme(
        settings.color
    );


    applyBackground(
        settings
    );


    selectColorButton(
        settings.color
    );


    /*
       If custom background exists,
       don't highlight a built-in
       background.
    */

    if (
        settings.customBackground
    ) {

        document
            .querySelectorAll(
                ".background-option"
            )
            .forEach(button => {

                button.classList.remove(
                    "selected"
                );

                button.setAttribute(
                    "aria-pressed",
                    "false"
                );
            });

    } else {

        selectBackgroundButton(
            settings.background
        );
    }


    /*
       Show saved custom image
    */

    showCustomPreview(
        settings.customBackground
    );


    /*
       Activate controls
    */

    setupColorButtons();

    setupBackgroundButtons();

    setupBackgroundUpload();

    setupRemoveBackground();

    setupResetButton();
}


/* =========================================
   18. START
   ========================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeSettings
);