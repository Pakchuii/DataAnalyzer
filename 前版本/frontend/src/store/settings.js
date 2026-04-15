export function setupSettings(store, actions) {
    // 【客户端存储架构】：封装基于 Promise 的 IndexedDB 连接器
    // 突破 LocalStorage 的 5MB 容量限制，允许用户缓存超大尺寸的高清壁纸/视频。
    const openDB = () => new Promise((resolve, reject) => {
        const request = indexedDB.open('DataAnalyzerDB', 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    return {
        // 系统启动时的状态水化 (Hydration)
        async initSettings() {
            const savedTint = localStorage.getItem('customWindowTint');
            if (savedTint) store.windowTint = savedTint;

            const savedOpacity = localStorage.getItem('customGlassOpacity');
            if (savedOpacity) store.glassOpacity = parseFloat(savedOpacity);

            // 从微型数据库中提取 BLOB 文件流
            try {
                const db = await openDB();
                const req = db.transaction('settings', 'readonly').objectStore('settings').get('customBgBlob');
                req.onsuccess = () => {
                    if (req.result) {
                        store.bgUrl = URL.createObjectURL(req.result);
                        store.bgType = localStorage.getItem('customBgType') || 'image';
                        actions.addLog("💾 成功从本地缓存中加载自定义壁纸！", "success");
                    }
                };
            } catch (e) {}

            // 初始化色彩引擎
            actions.applyThemeColor();
        },

        // 响应式 BLOB 处理与入库
        async handleBgUpload(e) {
            const file = e.target.files[0];
            if (!file) return;

            actions.addLog(`正在解析背景文件: ${file.name}...`);
            store.bgType = file.type.startsWith('video') ? 'video' : 'image';
            store.bgUrl = URL.createObjectURL(file);

            try {
                const db = await openDB();
                const tx = db.transaction('settings', 'readwrite');
                tx.objectStore('settings').put(file, 'customBgBlob');
                localStorage.setItem('customBgType', store.bgType);
                actions.addLog(`✅ 自定义壁纸已永久保存至 IndexedDB！`, "success");
            } catch (err) {
                actions.addLog(`❌ 保存壁纸失败: ${err.message}`, "error");
            }
        },

        // 缓存重置
        async resetBackground() {
            store.bgType = 'default';
            store.bgUrl = '';
            try {
                const db = await openDB();
                db.transaction('settings', 'readwrite').objectStore('settings').delete('customBgBlob');
                localStorage.removeItem('customBgType');
                actions.addLog("已恢复系统默认动态背景", "info");
            } catch (e) {}
        },

        // 透明度节流控制
        handleOpacityChange(e) {
            store.glassOpacity = parseFloat(e.target.value);
            localStorage.setItem('customGlassOpacity', store.glassOpacity);
            actions.applyThemeColor();
        },

        // 主题色配置
        setWindowTint(colorStr) {
            store.windowTint = colorStr;
            localStorage.setItem('customWindowTint', colorStr);
            actions.applyThemeColor();
            actions.addLog(`🎨 界面风格已更新`, "info");
        },

        handleCustomTint(e) {
            const hex = e.target.value;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            // 存入的时候用 1 完全不透明来存，方便 CSS 变量动态合成
            store.windowTint = `rgba(${r}, ${g}, ${b}, 1)`;
            localStorage.setItem('customWindowTint', store.windowTint);
            actions.applyThemeColor();
            actions.addLog(`🎨 毛玻璃主题色已切换为 ${hex}`, "info");
        },

        // 【动态渲染核心】：将计算后的 RGBA 透明度值直接注入 CSS 根变量 (--glass-theme-color)，
        // 触发浏览器的 GPU 硬件加速重绘，实现全站数百个毛玻璃组件的瞬间变色。
        applyThemeColor() {
            let color = store.windowTint;
            let r, g, b;

            if (!color) {
                r = store.isDarkMode ? 30 : 255;
                g = store.isDarkMode ? 30 : 255;
                b = store.isDarkMode ? 40 : 255;
            } else {
                const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (match) {
                    r = match[1]; g = match[2]; b = match[3];
                } else {
                    r = 255; g = 255; b = 255;
                }
            }

            const finalColor = `rgba(${r}, ${g}, ${b}, ${store.glassOpacity})`;
            document.documentElement.style.setProperty('--glass-theme-color', finalColor);

            const rgbColor = `${r}, ${g}, ${b}`;
            document.documentElement.style.setProperty('--glass-theme-rgb', rgbColor);
        }
    };
}