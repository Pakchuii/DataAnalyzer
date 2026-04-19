/**
 * 🎯 Blue Archive Click Effect + Custom Cursor Controller
 *
 * 📐 TUNING GUIDE (in cursor.css):
 *   --cursor-scale: 光标大小 (默认 0.6, 改小=光标更小)
 *   --click-scale:  点击特效大小 (默认 1.5, 改大=特效更大)
 *
 * 光标图片路径: /cursors/millennium_base.cur (默认) 和 millennium_link.cur (链接)
 */

const CURSOR_DEFAULT = '/cursors/millennium_base.cur';
const CURSOR_POINTER = '/cursors/millennium_link.cur';

// Selectors that trigger the "pointer" cursor
const POINTER_SELECTORS = 'a, button, [role="button"], .clickable, input[type="submit"], input[type="button"], input[type="checkbox"], input[type="radio"], select, label, summary';

let cursorEl = null;

export function initClickEffect() {
    // --- Cursor Setup ---
    cursorEl = document.createElement('img');
    cursorEl.id = 'ba-cursor';
    cursorEl.src = CURSOR_DEFAULT;
    cursorEl.draggable = false;
    document.body.appendChild(cursorEl);

    // Follow mouse
    document.addEventListener('mousemove', (e) => {
        cursorEl.style.left = e.clientX + 'px';
        cursorEl.style.top = e.clientY + 'px';
    });

    // Swap cursor image on hover
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(POINTER_SELECTORS)) {
            cursorEl.src = CURSOR_POINTER;
            cursorEl.classList.add('pointer-mode');
        } else {
            cursorEl.src = CURSOR_DEFAULT;
            cursorEl.classList.remove('pointer-mode');
        }
    });

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
        cursorEl.style.display = 'none';
    });
    document.addEventListener('mouseenter', () => {
        cursorEl.style.display = 'block';
    });

    // --- Click Effect ---
    document.addEventListener('click', (e) => {
        createClickEffect(e.clientX, e.clientY);
    });
}

function createClickEffect(x, y) {
    const container = document.createElement('div');
    container.className = 'ba-click-effect';
    container.style.left = x + 'px';
    container.style.top = y + 'px';

    // Ring
    const ring = document.createElement('div');
    ring.className = 'ba-click-ring';
    container.appendChild(ring);

    // Cross
    const cross = document.createElement('div');
    cross.className = 'ba-click-cross';
    container.appendChild(cross);

    // 4 diamond particles flying outward (larger distances)
    const angles = [
        { tx: '-20px', ty: '-20px', tx2: '-30px', ty2: '-30px' },
        { tx: '20px',  ty: '-20px', tx2: '30px',  ty2: '-30px' },
        { tx: '-20px', ty: '20px',  tx2: '-30px', ty2: '30px' },
        { tx: '20px',  ty: '20px',  tx2: '30px',  ty2: '30px' },
    ];

    angles.forEach((dir, i) => {
        const particle = document.createElement('div');
        particle.className = 'ba-click-particle';
        particle.style.setProperty('--tx', dir.tx);
        particle.style.setProperty('--ty', dir.ty);
        particle.style.setProperty('--tx2', dir.tx2);
        particle.style.setProperty('--ty2', dir.ty2);
        particle.style.animationDelay = (i * 0.03) + 's';
        container.appendChild(particle);
    });

    document.body.appendChild(container);

    setTimeout(() => {
        container.remove();
    }, 700);
}
