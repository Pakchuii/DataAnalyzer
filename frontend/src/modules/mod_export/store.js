export function setupExporter(store, actions) {
    return {
        exportToCSV(headers, data, name) {
            if (!data || data.length === 0) return;
            const BOM = '\uFEFF';
            let csv = BOM + headers.join(',') + '\n';
            data.forEach(row => { csv += headers.map(h => row[h] ?? '').join(',') + '\n'; });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${name}.csv`;
            link.click();
            actions.addLog(`✅ 已导出: ${name}.csv`, "success");
        },

        async exportPDF() {
            actions.addLog("正在渲染高清 PDF 快照...", "info");
            try {
                const { default: html2canvas } = await import('html2canvas');
                const { jsPDF } = await import('jspdf');
                const el = document.getElementById('pdf-report-area');
                if (!el) { actions.addLog("❌ 未找到可导出的面板区域", "error"); return; }

                const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                let position = 0;
                const pageHeight = pdf.internal.pageSize.getHeight();
                while (position < pdfHeight) {
                    pdf.addImage(imgData, 'PNG', 0, -position, pdfWidth, pdfHeight);
                    position += pageHeight;
                    if (position < pdfHeight) pdf.addPage();
                }
                pdf.save('数据分析报告.pdf');
                actions.addLog("✅ PDF 已成功导出", "success");
            } catch (err) { actions.addLog(`❌ PDF 导出失败: ${err.message}`, "error"); }
        }
    };
}
