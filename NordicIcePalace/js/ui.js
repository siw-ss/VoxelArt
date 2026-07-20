// ---------------------------------------------------------------------------
//  UI — overlay/dock behavior independent of the 3D scene
//  Matches FloatingArchipelago / PagodaGarden pattern exactly.
// ---------------------------------------------------------------------------

if (typeof window !== 'undefined') window.__kiroReady = false;

export function showLoaderError(title, detail) {
    var ld = document.getElementById("loader");
    if (!ld) return;
    ld.style.flexDirection = "column";
    ld.style.padding = "24px";
    ld.style.textAlign = "center";
    ld.innerHTML =
        '<div style="font-size:17px;color:#7fdbff;margin-bottom:10px;">' + title + "</div>" +
        '<div style="font-size:13px;line-height:1.6;color:#cfd6e6;max-width:560px;">' + detail + "</div>";
}

export function initDiagnostics() {
    window.addEventListener("error", function (e) {
        if (window.__kiroReady) return;
        var msg = e.message || (e.error && e.error.message) || "Unknown error";
        showLoaderError("Scene failed to start", msg + "<br><br>Open DevTools (F12) → Console for the full stack trace.");
    });
    window.addEventListener("unhandledrejection", function (e) {
        if (window.__kiroReady) return;
        var r = e.reason || {};
        showLoaderError("Scene failed to start", (r.message || String(r)) + "<br><br>Open DevTools (F12) → Console for details.");
    });
    setTimeout(function () {
        if (window.__kiroReady) return;
        showLoaderError("Still loading…",
            "The 3D scene has not rendered yet. If you opened this file directly, serve it over a local web server — ES modules do not load from the file system.<br><br>" +
            "Also check the browser console (F12) for errors.");
    }, 9000);
}

// ---------------------------------------------------------------------------
//  Magnification — same formula as Archipelago/Pagoda:
//  scale = 1.0 + 0.55 * cos(distance / 95 * π/2) when distance < 95
// ---------------------------------------------------------------------------
export function getMagnification(cursorX, itemCenterX) {
    const RANGE = 95;
    const dist = Math.abs(cursorX - itemCenterX);
    if (dist >= RANGE) return 1.0;
    return 1.0 + 0.55 * Math.cos((dist / RANGE) * Math.PI / 2);
}

export function initDock() {
    const dock = document.getElementById("dock");
    if (!dock) return;
    const items = Array.from(dock.querySelectorAll(".dock-item"));
    let raf = null, mouseX = null;

    function apply() {
        raf = null;
        for (const el of items) {
            let scale = 1.0;
            if (mouseX !== null) {
                const r = el.getBoundingClientRect();
                const center = r.left + r.width / 2;
                scale = getMagnification(mouseX, center);
            }
            el.style.setProperty("--scale", scale.toFixed(3));
        }
    }
    function schedule() { if (raf === null) raf = requestAnimationFrame(apply); }
    dock.addEventListener("pointermove", (e) => { mouseX = e.clientX; schedule(); });
    dock.addEventListener("pointerleave", () => { mouseX = null; schedule(); });
}

// ---------------------------------------------------------------------------
//  Flyout panel management — open/close panels triggered by dock buttons
// ---------------------------------------------------------------------------
let openPanel = null;
let openPanelBtn = null;

function closeActivePanel() {
    if (openPanel) {
        openPanel.classList.remove("open");
        if (openPanelBtn) openPanelBtn.classList.remove("panel-open");
        openPanel = null;
        openPanelBtn = null;
    }
}

function togglePanel(panel, btn) {
    if (openPanel === panel) {
        closeActivePanel();
        return;
    }
    closeActivePanel();
    panel.classList.add("open");
    if (btn) btn.classList.add("panel-open");
    openPanel = panel;
    openPanelBtn = btn;
}

export function initPanels() {
    const auroraBtn = document.getElementById("aurora-btn");
    const auroraPanel = document.getElementById("aurora-panel");
    const snowBtn = document.getElementById("snow-btn");
    const snowPanel = document.getElementById("snow-panel");
    const timeBtn = document.getElementById("time-btn");
    const timePanel = document.getElementById("time-panel");

    if (auroraBtn && auroraPanel) {
        auroraBtn.addEventListener("click", () => togglePanel(auroraPanel, auroraBtn));
    }
    if (snowBtn && snowPanel) {
        snowBtn.addEventListener("click", () => togglePanel(snowPanel, snowBtn));
    }
    if (timeBtn && timePanel) {
        timeBtn.addEventListener("click", () => togglePanel(timePanel, timeBtn));
    }

    // Close on outside click
    document.addEventListener("pointerdown", (e) => {
        if (!openPanel) return;
        if (openPanel.contains(e.target)) return;
        if (openPanelBtn && openPanelBtn.contains(e.target)) return;
        closeActivePanel();
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeActivePanel();
    });
}

// ---------------------------------------------------------------------------
//  Typewriter — reveals description after 1800ms
// ---------------------------------------------------------------------------
export function initTypewriter() {
    const text = "A crystalline palace of eternal ice rises from a frozen lake, its glowing spires crowned by the dancing aurora borealis while ice dragons circle overhead.";
    const el = document.getElementById("typewriter");
    const card = document.getElementById("desc-card");
    const cursor = document.getElementById("tw-cursor");
    if (!el || !card) return;
    let i = 0;
    setTimeout(function () {
        card.classList.add("visible");
        type();
    }, 1800);
    function type() {
        if (i < text.length) {
            el.textContent += text[i];
            i++;
            setTimeout(type, 28 + Math.random() * 32);
        } else {
            setTimeout(function () { if (cursor) cursor.style.opacity = "0"; }, 2200);
        }
    }
}
