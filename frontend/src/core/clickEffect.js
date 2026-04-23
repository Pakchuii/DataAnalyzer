/**
 * 🎯 Blue Archive Click Effect + Custom Cursor Controller
 * 
 * 性能优化版：
 * - 使用 requestAnimationFrame 驱动光标追踪，减少 mousemove 开销
 * - 使用事件委托代替 mouseover 检查
 * - 点击特效使用纯 CSS animation，无 JS 逐帧计算
 *
 * 📐 TUNING GUIDE (in cursor.css):
 *   --cursor-scale: 光标大小 (默认 0.6)
 *   --click-scale:  点击特效大小 (默认 1.5)
 */

const CURSOR_DEFAULT = '/cursors/millennium_base.cur';
const CURSOR_POINTER = '/cursors/millennium_link.cur';

const POINTER_SELECTORS = 'a, button, [role="button"], .clickable, input[type="submit"], input[type="button"], input[type="checkbox"], input[type="radio"], select, label, summary';

let cursorEl = null;
let mouseX = 0, mouseY = 0;
let rafId = null;
let isPointer = false;

export function initClickEffect() {
    cursorEl = document.createElement('img');
    cursorEl.id = 'ba-cursor';
    cursorEl.src = CURSOR_DEFAULT;
    cursorEl.draggable = false;
    document.body.appendChild(cursorEl);

    // 性能优化：用 RAF 批量更新位置，而不是每次 mousemove 都触发重绘
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }, { passive: true });

    function updateCursor() {
        cursorEl.style.left = mouseX + 'px';
        cursorEl.style.top = mouseY + 'px';
        rafId = requestAnimationFrame(updateCursor);
    }
    rafId = requestAnimationFrame(updateCursor);

    // 性能优化：降低 mouseover 频率，使用节流
    let hoverThrottled = false;
    document.addEventListener('mouseover', (e) => {
        if (hoverThrottled) return;
        hoverThrottled = true;
        
        const nowPointer = !!e.target.closest(POINTER_SELECTORS);
        if (nowPointer !== isPointer) {
            isPointer = nowPointer;
            cursorEl.src = isPointer ? CURSOR_POINTER : CURSOR_DEFAULT;
            if (isPointer) {
                cursorEl.classList.add('pointer-mode');
            } else {
                cursorEl.classList.remove('pointer-mode');
            }
        }
        
        requestAnimationFrame(() => { hoverThrottled = false; });
    }, { passive: true });

    document.addEventListener('mouseleave', () => { cursorEl.style.display = 'none'; });
    document.addEventListener('mouseenter', () => { cursorEl.style.display = 'block'; });

    // 点击特效
    document.addEventListener('click', (e) => {
        createClickEffect(e.clientX, e.clientY);
    });
}

function createClickEffect(x, y) {
    const container = document.createElement('div');
    container.className = 'ba-click-effect';
    container.style.left = x + 'px';
    container.style.top = y + 'px';

    // 外圈旋转环
    const ring = document.createElement('div');
    ring.className = 'ba-click-ring';
    container.appendChild(ring);

    // 内圈脉冲
    const pulse = document.createElement('div');
    pulse.className = 'ba-click-pulse';
    container.appendChild(pulse);

    // 6 个三角碎片 — 蔚蓝档案风格的星爆碎片
    for (let i = 0; i < 6; i++) {
        const shard = document.createElement('div');
        shard.className = 'ba-click-shard';
        const angle = (i * 60) + (Math.random() * 20 - 10);
        const dist = 25 + Math.random() * 15;
        const rad = angle * Math.PI / 180;
        shard.style.setProperty('--shard-x', `${Math.cos(rad) * dist}px`);
        shard.style.setProperty('--shard-y', `${Math.sin(rad) * dist}px`);
        shard.style.setProperty('--shard-rot', `${angle}deg`);
        shard.style.animationDelay = `${i * 0.02}s`;
        container.appendChild(shard);
    }

    // 3 个小光点
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'ba-click-dot';
        const angle = (i * 120) + 30;
        const dist = 18 + Math.random() * 10;
        const rad = angle * Math.PI / 180;
        dot.style.setProperty('--dot-x', `${Math.cos(rad) * dist}px`);
        dot.style.setProperty('--dot-y', `${Math.sin(rad) * dist}px`);
        dot.style.animationDelay = `${i * 0.04}s`;
        container.appendChild(dot);
    }

    document.body.appendChild(container);
    setTimeout(() => container.remove(), 600);
}
