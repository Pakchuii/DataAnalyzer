import * as echarts from 'echarts'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export function setupExporter(store, actions) {
    return {
        exportToCSV(headers, rows, exportFilename) {
            actions.addLog(`导出: ${exportFilename}.csv`, "success");
            let csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\r\n";
            rows.forEach(row => { csvContent += headers.map(h => row[h] !== undefined ? row[h] : "").join(",") + "\r\n"; });
            const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", exportFilename + ".csv"); document.body.appendChild(link); link.click();
        },
        async exportPDF() {
            actions.addLog("启动高清 PDF 生成...");
            const element = document.getElementById('pdf-report-area'); if (!element) return;
            actions.showDialog({ title: '📸 正在生成', message: '系统正在剥离特效...' });
            try {
                await new Promise(resolve => setTimeout(resolve, 800));
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
                const printStyle = document.createElement('style'); printStyle.id = 'pdf-print-style';
                printStyle.innerHTML = `#pdf-report-area { background: ${store.isDarkMode ? '#14141f' : '#f0f2f5'} !important; } .glass-card { backdrop-filter: none !important; box-shadow: none !important; }`;
                document.head.appendChild(printStyle);
                const originalScrollY = window.scrollY; window.scrollTo(0, 0);
                const canvas = await html2canvas(element, { scale: 2, useCORS: true, windowHeight: element.scrollHeight });
                document.head.removeChild(printStyle); window.scrollTo(0, originalScrollY);
                tempImages.forEach(({ box, canvasDiv, img }) => { if (canvasDiv) canvasDiv.style.display = 'block'; box.removeChild(img); });
                const pdfWidth = 210, pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]); pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`PDF数据报_${new Date().toLocaleTimeString().replace(/:/g, '')}.pdf`);
                store.dialog.show = false; actions.addLog("🎉 PDF 生成完毕！", "success");
            } catch (error) { store.dialog.show = false; actions.addLog(`失败: ${error.message}`, "error"); }
        }
    };
}