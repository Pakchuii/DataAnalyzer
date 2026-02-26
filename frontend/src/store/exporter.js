import * as echarts from 'echarts'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * 【前端 I/O 服务层：基于 DOM 快照的矢量级 PDF 渲染引擎】
 * 彻底脱离后端依赖，提供浏览器本地算力承载的数据报物理离线功能。
 */
export function setupExporter(store, actions) {
    return {
        // 【流式数据下载器】：纯前端装配 UTF-8 CSV，并挂载 BOM 标头解决 Excel 读取产生的中文乱码灾难
        exportToCSV(headers, rows, exportFilename) {
            actions.addLog(`开始执行底层导出挂载: ${exportFilename}.csv`, "success");
            let csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\r\n";
            rows.forEach(row => { csvContent += headers.map(h => row[h] !== undefined ? row[h] : "").join(",") + "\r\n"; });

            // 劫持浏览器 Anchor 特性触发下载链路
            const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", exportFilename + ".csv"); document.body.appendChild(link); link.click();
        },

        // 【高深黑科技：Canvas 跨域防白屏 PDF 生成引擎】
        async exportPDF() {
            actions.addLog("激活高清矢量 PDF 生成引擎指令集...");
            const element = document.getElementById('pdf-report-area'); if (!element) return;
            actions.showDialog({ title: '📸 系统级快门启动中', message: '内部算法正在剥离前端复杂交互特效并压缩 DOM 树，请勿关闭页面...' });

            try {
                // 事件防抖：强制挂起 800ms 等待 Vue 过渡动画与 ECharts 绘制事件彻底落停
                await new Promise(resolve => setTimeout(resolve, 800));

                // 🚀 核心降维渲染机制：因为 Canvas 直接截图时常因跨域导致全黑矩阵，
                // 在此提前将活动的 ECharts 实例提取为静态 Base64 <img> 标签进行临时伪装。
                const chartBoxes = element.querySelectorAll('.chart-box'); const tempImages = [];
                chartBoxes.forEach((box) => {
                    const chartInstance = echarts.getInstanceByDom(box);
                    if (chartInstance) {
                        const img = document.createElement('img'); img.src = chartInstance.getDataURL({ pixelRatio: 2, backgroundColor: store.isDarkMode ? '#1f1f2e' : '#ffffff' });
                        img.style.cssText = 'width: 100%; height: 100%; object-fit: contain;';
                        const canvasDiv = box.querySelector('div'); if (canvasDiv) canvasDiv.style.display = 'none';
                        box.appendChild(img); tempImages.push({ box, canvasDiv, img });
                    }
                });

                // 【样式剥夺术】：植入一次性打印图层，剥离所有毛玻璃滤镜，以保障生成文件的极速响应与墨水友好度。
                const printStyle = document.createElement('style'); printStyle.id = 'pdf-print-style';
                printStyle.innerHTML = `#pdf-report-area { background: ${store.isDarkMode ? '#14141f' : '#f0f2f5'} !important; } .glass-card { backdrop-filter: none !important; box-shadow: none !important; }`;
                document.head.appendChild(printStyle);

                // 坐标原点复位器，防止下沉截断问题
                const originalScrollY = window.scrollY; window.scrollTo(0, 0);

                // 激活 html2canvas 底层映射探测
                const canvas = await html2canvas(element, { scale: 2, useCORS: true, windowHeight: element.scrollHeight });

                // 现场重构：销毁临时打印层，解禁原本的高级毛玻璃动效
                document.head.removeChild(printStyle); window.scrollTo(0, originalScrollY);
                tempImages.forEach(({ box, canvasDiv, img }) => { if (canvasDiv) canvasDiv.style.display = 'block'; box.removeChild(img); });

                // 纸张矩阵换算 (A4)
                const pdfWidth = 210, pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]); pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`PDF系统综合数据战报_${new Date().toLocaleTimeString().replace(/:/g, '')}.pdf`);

                store.dialog.show = false; actions.addLog("🎉 PDF 级底层物理导出组装完毕并下发！", "success");
            } catch (error) { store.dialog.show = false; actions.addLog(`底层生成线程中断: ${error.message}`, "error"); }
        }
    };
}