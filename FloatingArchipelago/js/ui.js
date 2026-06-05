// ---------------------------------------------------------------------------
//  UI — overlay/dock behavior independent of the 3D scene
// ---------------------------------------------------------------------------

window.__kiroReady = false;

export function showLoaderError(title, detail) {
    var ld = document.getElementById("loader");
    if (!ld) return;
    ld.style.flexDirection = "column";
    ld.style.padding = "24px";
    ld.style.textAlign = "center";
    ld.innerHTML =
        '<div style="font-size:17px;color:#00E5FF;margin-bottom:10px;">' + title + "</div>" +
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

export function initDock() {
    const dock = document.getElementById("dock");
    if (!dock) return;
    const items = Array.from(dock.querySelectorAll(".dock-item"));
    const MAX = 1.55, MIN = 1.0, RANGE = 95;
    let raf = null, mouseX = null;

    function apply() {
        raf = null;
        for (const el of items) {
            let scale = MIN;
            if (mouseX !== null) {
                const r = el.getBoundingClientRect();
                const center = r.left + r.width / 2;
                const dist = Math.abs(mouseX - center);
                if (dist < RANGE) {
                    const t = 0.5 + 0.5 * Math.cos((dist / RANGE) * Math.PI);
                    scale = MIN + (MAX - MIN) * t;
                }
            }
            el.style.setProperty("--scale", scale.toFixed(3));
        }
    }
    function schedule() { if (raf === null) raf = requestAnimationFrame(apply); }
    dock.addEventListener("pointermove", (e) => { mouseX = e.clientX; schedule(); });
    dock.addEventListener("pointerleave", () => { mouseX = null; schedule(); });
}

export function initSunPanel() {
    var btn = document.getElementById("sun-btn");
    var panel = document.getElementById("sun-panel");
    var slider = document.getElementById("sun");
    var dot = document.getElementById("sun-dot");
    if (!btn || !panel || !slider) return;

    function openPanel() { panel.classList.add("open"); btn.classList.add("panel-open"); }
    function closePanel() { panel.classList.remove("open"); btn.classList.remove("panel-open"); }

    btn.addEventListener("click", function () {
        if (panel.classList.contains("open")) closePanel(); else openPanel();
    });
    panel.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    document.addEventListener("pointerdown", function (e) {
        if (!panel.classList.contains("open")) return;
        if (btn.contains(e.target) || panel.contains(e.target)) return;
        closePanel();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePanel(); });

    function syncDot() {
        var v = slider.value / 100;
        var t = v;
        var x = (1 - t) * (1 - t) * 10 + 2 * (1 - t) * t * 100 + t * t * 190;
        var y = (1 - t) * (1 - t) * 55 + 2 * (1 - t) * t * -15 + t * t * 55;
        if (dot) { dot.setAttribute("cx", x.toFixed(1)); dot.setAttribute("cy", y.toFixed(1)); }
    }
    slider.addEventListener("input", syncDot);
    syncDot();
}

export function initTypewriter() {
    var text = "Multiple voxel islands float at different altitudes in an endless sky, connected by luminescent crystal bridges with cascading waterfalls, ancient temple ruins, and a watchtower overlooking the archipelago.";
    var el = document.getElementById("typewriter");
    var card = document.getElementById("desc-card");
    var cursor = document.getElementById("tw-cursor");
    if (!el || !card) return;
    var i = 0;
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
