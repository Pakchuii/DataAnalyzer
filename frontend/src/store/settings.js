export function setupSettings(store, actions) {
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
        async initSettings() {
            const savedTint = localStorage.getItem('customWindowTint');
            if (savedTint) store.windowTint = savedTint;

            const savedOpacity = localStorage.getItem('customGlassOpacity');
            if (savedOpacity) store.glassOpacity = parseFloat(savedOpacity);

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

            // 启动时应用颜色
            actions.applyThemeColor();
        },

        async handleBgUpload(e) {
            const file = e.target.files[0]; if (!file) return;
            if (store.bgUrl) URL.revokeObjectURL(store.bgUrl);
            store.bgUrl = URL.createObjectURL(file);
            store.bgType = file.type.startsWith('video/') ? 'video' : 'image';
            actions.addLog(`🎨 正在应用壁纸并写入本地硬盘：${file.name}...`, "info");
            try {
                const db = await openDB();
                db.transaction('settings', 'readwrite').objectStore('settings').put(file, 'customBgBlob');
                localStorage.setItem('customBgType', store.bgType);
                actions.addLog("💾 壁纸已持久化保存，下次打开自动加载！", "success");
            } catch(err) { actions.addLog("壁纸缓存失败，可能是文件超出限制", "error"); }
        },

        async resetBackground() {
            if (store.bgUrl) URL.revokeObjectURL(store.bgUrl);
            store.bgType = 'default'; store.bgUrl = '';
            try {
                const db = await openDB();
                db.transaction('settings', 'readwrite').objectStore('settings').delete('customBgBlob');
                localStorage.removeItem('customBgType');
                actions.addLog("🔄 已恢复系统默认壁纸，并彻底清理本地壁纸缓存！", "success");
            } catch(err) {}
        },

        setWindowTint(colorRgba) {
            store.windowTint = colorRgba;
            localStorage.setItem('customWindowTint', colorRgba);
            actions.applyThemeColor();
            actions.addLog("🌈 系统主题滤镜已切换并保存", "success");
        },

        handleCustomTint(e) {
            const hex = e.target.value;
            const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
            // 存入的时候用 1 完全不透明来存，方便后面提取
            store.windowTint = `rgba(${r}, ${g}, ${b}, 1)`;
            localStorage.setItem('customWindowTint', store.windowTint);
            actions.applyThemeColor();
            actions.addLog(`🎨 毛玻璃主题色已切换为 ${hex}`, "info");
        },

        applyThemeColor() {
            let color = store.windowTint;
            let r, g, b;

            // 1. 如果为空，走【系统默认】的日夜模式颜色
            if (!color) {
                r = store.isDarkMode ? 30 : 255;
                g = store.isDarkMode ? 30 : 255;
                b = store.isDarkMode ? 40 : 255;
            }
            // 2. 如果不为空，走【自定义】颜色
            else {
                const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (match) {
                    r = match[1]; g = match[2]; b = match[3];
                } else {
                    r = 255; g = 255; b = 255;
                }
            }

            // 核心拼接：RGB 加上目前的滑动条透明度
            const finalColor = `rgba(${r}, ${g}, ${b}, ${store.glassOpacity})`;

            // 【极其关键】直接注入 CSS，绝对不去修改 store.windowTint！
            document.documentElement.style.setProperty('--glass-theme-color', finalColor);
        },

        handleOpacityChange(e) {
            store.glassOpacity = parseFloat(e.target.value);
            localStorage.setItem('customGlassOpacity', store.glassOpacity);
            actions.applyThemeColor();
        }
    };
}