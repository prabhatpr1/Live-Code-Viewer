document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const runBtn = document.getElementById('run-btn');
    const formatBtn = document.getElementById('format-btn');
    const layoutBtn = document.getElementById('layout-btn');
    const previewFrame = document.getElementById('preview-frame');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const themeBtn = document.getElementById('theme-btn');
    const previewWrapper = document.querySelector('.preview-wrapper');
    const appContainer = document.querySelector('.app-container');
    const previewSection = document.querySelector('.preview-section');
    const resizer = document.getElementById('drag-handle');

    // Initialize CodeMirror Editors
    const commonOptions = {
        theme: 'dracula',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        tabSize: 2,
        indentUnit: 2,
        lineWrapping: true
    };

    const htmlEditor = CodeMirror(document.getElementById('html-editor-container'), {
        ...commonOptions,
        mode: 'xml',
        htmlMode: true
    });

    const cssEditor = CodeMirror(document.getElementById('css-editor-container'), {
        ...commonOptions,
        mode: 'css'
    });

    const jsEditor = CodeMirror(document.getElementById('js-editor-container'), {
        ...commonOptions,
        mode: 'javascript'
    });

    const editors = {
        'html': htmlEditor,
        'css': cssEditor,
        'js': jsEditor
    };

    // --- Feature 1: Formatting ---
    formatBtn.addEventListener('click', () => {
        const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-lang');
        const editor = editors[activeTab];
        const unformatted = editor.getValue();
        let formatted = '';

        // Ensure Prettier is loaded
        if (!window.prettier || !window.prettierPlugins) {
            alert('Formatting tools are still loading or failed to load. Please check your internet connection.');
            return;
        }

        try {
            if (activeTab === 'html') {
                formatted = window.prettier.format(unformatted, {
                    parser: 'html',
                    plugins: window.prettierPlugins
                });
            } else if (activeTab === 'css') {
                formatted = window.prettier.format(unformatted, {
                    parser: 'css',
                    plugins: window.prettierPlugins
                });
            } else if (activeTab === 'js') {
                formatted = window.prettier.format(unformatted, {
                    parser: 'babel',
                    plugins: window.prettierPlugins
                });
            }
            editor.setValue(formatted);
        } catch (err) {
            console.error('Formatting Failed:', err);
            alert('Could not format code. Check console (F12) for details.');
        }
    });

    // --- Feature 2: Layout Switcher ---
    let isSideView = false;

    layoutBtn.addEventListener('click', () => {
        isSideView = !isSideView;
        appContainer.classList.toggle('side-view', isSideView);

        // Reset styles when switching to avoid weird stuck states
        previewSection.style.height = '';
        previewSection.style.width = '';

        // Update Icon (Simple rotation for now)
        layoutBtn.querySelector('svg').style.transform = isSideView ? 'rotate(90deg)' : 'rotate(0deg)';

        // Force refresh all editors to adapt to new dimensions
        setTimeout(() => {
            Object.values(editors).forEach(e => e.refresh());
        }, 50);
    });

    // --- Resizing Logic (Unified) ---
    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        resizer.classList.add('dragging');
        document.body.style.cursor = isSideView ? 'col-resize' : 'row-resize';
        e.preventDefault();

        // Add overlay to iframe to prevent mouse capture during drag
        previewFrame.style.pointerEvents = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        if (isSideView) {
            // Horizontal Resizing (Preview Width)
            const containerWidth = appContainer.offsetWidth;
            // Calculate percentage based on mouse X
            let newWidthPercentage = (e.clientX / containerWidth) * 100;

            // Constrain
            if (newWidthPercentage < 20) newWidthPercentage = 20;
            if (newWidthPercentage > 80) newWidthPercentage = 80;

            previewSection.style.width = `${newWidthPercentage}%`;

        } else {
            // Vertical Resizing (Preview Height)
            const containerHeight = appContainer.offsetHeight;
            let newHeightPercentage = ((e.clientY - appContainer.offsetTop) / containerHeight) * 100;

            if (newHeightPercentage < 20) newHeightPercentage = 20;
            if (newHeightPercentage > 80) newHeightPercentage = 80;

            previewSection.style.height = `${newHeightPercentage}%`;
        }

        // Optional: throttled refresh for smoother resizing
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            resizer.classList.remove('dragging');
            document.body.style.cursor = 'default';
            previewFrame.style.pointerEvents = 'auto'; // Re-enable iframe events

            // Refresh active editor
            const activeLang = document.querySelector('.tab-btn.active').getAttribute('data-lang');
            if (editors[activeLang]) editors[activeLang].refresh();
        }
    });

    // --- Standard Features ---

    // Theme Toggle
    themeBtn.addEventListener('click', () => {
        previewWrapper.classList.toggle('light-theme');
    });

    // Fullscreen Toggle
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    });

    // Tab Switching Logic
    const tabs = document.querySelectorAll('.tab-btn');
    const containers = {
        'html': document.getElementById('html-editor-container'),
        'css': document.getElementById('css-editor-container'),
        'js': document.getElementById('js-editor-container')
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            Object.values(containers).forEach(c => c.classList.remove('active'));

            const lang = tab.getAttribute('data-lang');
            if (containers[lang]) {
                containers[lang].classList.add('active');
                editors[lang].refresh();
                editors[lang].focus();
            }
        });
    });

    // Horizontal Resizing (Editor Width) - Only for default view
    // Note: We can keep this for default view if users want to narrow the editor
    const editorSection = document.getElementById('editor-section');
    const resizeLeft = document.getElementById('resize-left');
    const resizeRight = document.getElementById('resize-right');
    let isResizingH = false;

    function initResizeH(e) {
        if (isSideView) return; // Disable in side view
        isResizingH = true;
        e.target.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        e.preventDefault();
    }

    if (resizeLeft && resizeRight) {
        resizeLeft.addEventListener('mousedown', initResizeH);
        resizeRight.addEventListener('mousedown', initResizeH);

        document.addEventListener('mousemove', (e) => {
            if (!isResizingH) return;
            let newWidth = Math.abs(e.clientX - (window.innerWidth / 2)) * 2;
            if (newWidth < 300) newWidth = 300;
            if (newWidth > window.innerWidth - 20) newWidth = window.innerWidth - 20;
            editorSection.style.width = `${newWidth}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isResizingH) {
                isResizingH = false;
                resizeLeft.classList.remove('dragging');
                resizeRight.classList.remove('dragging');
                document.body.style.cursor = 'default';
                const activeLang = document.querySelector('.tab-btn.active').getAttribute('data-lang');
                if (editors[activeLang]) editors[activeLang].refresh();
            }
        });
    }

    // Preview Logic
    function updatePreview() {
        const html = htmlEditor.getValue();
        const userCss = cssEditor.getValue();
        const js = `<script>${jsEditor.getValue()}<\/script>`;

        const defaultCss = `
            body {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                overflow: auto;
            }
        `;

        const source = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    ${defaultCss}
                    ${userCss}
                </style>
            </head>
            <body>
                ${html}
                ${js}
            </body>
            </html>
        `;

        previewFrame.srcdoc = source;
    }

    // Auto-Save Logic
    const SAVE_KEY_HTML = 'lcb_html';
    const SAVE_KEY_CSS = 'lcb_css';
    const SAVE_KEY_JS = 'lcb_js';

    function saveCode() {
        localStorage.setItem(SAVE_KEY_HTML, htmlEditor.getValue());
        localStorage.setItem(SAVE_KEY_CSS, cssEditor.getValue());
        localStorage.setItem(SAVE_KEY_JS, jsEditor.getValue());
    }

    function loadCode() {
        const savedHtml = localStorage.getItem(SAVE_KEY_HTML);
        const savedCss = localStorage.getItem(SAVE_KEY_CSS);
        const savedJs = localStorage.getItem(SAVE_KEY_JS);

        if (savedHtml !== null && savedCss !== null && savedJs !== null) {
            htmlEditor.setValue(savedHtml);
            cssEditor.setValue(savedCss);
            jsEditor.setValue(savedJs);
        } else {
            const initialHTML = '<div class="center">\n  <h1>Hello World</h1>\n  <p>Preview on top, code below.</p>\n  <button id="demo-btn">Click Me</button>\n</div>';
            const initialCSS = 'body {\n  font-family: system-ui, sans-serif;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  margin: 0;\n  background: #f0f9ff;\n}\n.center {\n  text-align: center;\n  color: #334155;\n  padding: 20px;\n}\nbutton {\n  margin-top: 20px;\n  padding: 10px 20px;\n  background: #3b82f6;\n  color: white;\n  border: none;\n  border-radius: 6px;\n  font-size: 1rem;\n}';
            const initialJS = 'document.getElementById("demo-btn").addEventListener("click", () => {\n  alert("Button clicked in the preview!");\n});';

            htmlEditor.setValue(initialHTML);
            cssEditor.setValue(initialCSS);
            jsEditor.setValue(initialJS);
        }
    }

    // Load saved code on startup
    loadCode();
    updatePreview();

    [htmlEditor, cssEditor, jsEditor].forEach(editor => {
        editor.on('change', () => {
            updatePreview();
            saveCode();
        });
    });

    runBtn.addEventListener('click', () => {
        updatePreview();
        saveCode();
    });
});
