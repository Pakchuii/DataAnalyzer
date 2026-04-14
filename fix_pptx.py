import os
import zipfile
import shutil
import glob

def edit_pptx(input_path, output_path):
    temp_dir = "temp_pptx_extracted"
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
    os.makedirs(temp_dir)
    
    # 1. 解压PPTX
    with zipfile.ZipFile(input_path, 'r') as zip_ref:
        zip_ref.extractall(temp_dir)
        
    # 2. 全局替换函数
    def replace_in_file(filepath, replacements):
        if not os.path.exists(filepath): return
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        for old_t, new_t in replacements.items():
            content = content.replace(old_t, new_t)
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

    # 定义全局替换规则
    global_replacements = {
        "演示文稿是一种实用的工具，可以是演示，演讲，报告等。大部分时间，它们都是在为观众服务。它们有多种用途，是演讲和教学的有力工具。如果您想在演示文稿中展现内容，可以选择多种可以选择多种方式": "本系统通过对海量表单数据的多维分析与交互展现，打破了传统数据工具的学习壁垒。帮助非专业用户以极低的门槛完成从数据清洗、关联分析到机器学习模型预测的全周期数据挖掘工作。",
        "演示文稿是一种实用的工具，可以是演示，演讲，报告等。大部分时间，它们都是在为观众服务": "本系统深入结合了前沿的统计推断算法与现代化高并发软件架构，直观展现了现代数据赋能的极大价值。",
        "综上所述，本系统将旨在与实现一个低门槛，功能全，高性能的数据分析平台": "综上所述，本系统旨在实现一个低门槛、功能完善且高性能的数据分析平台",
        "所以我开发了截取数据前15行进行的轻量预览接口": "系统实现了截取数据前15行进行轻量预览的优化接口",
        "我在底层加入自动分箱生成直方分布的函数": "系统底层引入了自动分箱计算并生成分布图的函数",
        "如果盲目报错会极大损害用户体验，故我的代码写了一层极具容错性的拦截重载：": "为显著提升用户体验，系统在底层架构中设计了一层具备高容错性的拦截重载机制：",
        "如果在上传新文件或重命名时直接覆盖，会让一切工作毁于一旦。针对容易造成“车祸”的修改源文件请求，系统通过异步拦截器实现多次二次确认。": "针对容易引发关键数据丢失的源文件被动修盖等高危操作，系统通过动态异步拦截器实现了多维度的防呆和二次确认机制。",
        "我在预测返回值中，创造性地加入了判断拟合曲线散乱程度的": "系统在模型预测的返回值中，创造性地引入了判断拟合曲线散乱程度的"
    }
    
    xml_files = glob.glob(os.path.join(temp_dir, 'ppt', 'slides', '*.xml'))
    for xml_file in xml_files:
        replace_in_file(xml_file, global_replacements)

    # 3. 特定幻灯片修正
    # 最后一页
    slide33_path = os.path.join(temp_dir, 'ppt', 'slides', 'slide33.xml')
    replace_in_file(slide33_path, {
        "张小可": "毛旭锋",
        "2023": "2026",
        "述职报告/ 部门汇报/ 项目汇报": "毕业论文答辩"
    })
    
    # 第9页：02章节下的错误 PART FOUR -> PART TWO
    slide9_path = os.path.join(temp_dir, 'ppt', 'slides', 'slide9.xml')
    replace_in_file(slide9_path, {"PART FOUR": "PART TWO"})
    
    # 第13页：02章节下的错误 PART ONE -> PART TWO
    slide13_path = os.path.join(temp_dir, 'ppt', 'slides', 'slide13.xml')
    replace_in_file(slide13_path, {"PART ONE": "PART TWO"})
    
    # 第17~27页：功能设计应属 PART THREE
    for i in range(17, 28):
        s_path = os.path.join(temp_dir, 'ppt', 'slides', f'slide{i}.xml')
        replace_in_file(s_path, {"PART TWO": "PART THREE"})
        
    # 第31页：占位符文字修改
    slide31_path = os.path.join(temp_dir, 'ppt', 'slides', 'slide31.xml')
    replace_in_file(slide31_path, {
        "添加文本": "高定外观",
        "01": "自由延展",
        "02": "自适应适配"
    })
    
    # 第32页：将03.改成04.
    slide32_path = os.path.join(temp_dir, 'ppt', 'slides', 'slide32.xml')
    replace_in_file(slide32_path, {
        "03.": "04.",
        "近期目标": "项目部署与未来方案"
    })

    # 4. 重新打包为PPTX
    if os.path.exists(output_path):
        os.remove(output_path)
        
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(temp_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, temp_dir)
                # 兼容不同系统的路径分隔符
                arcname = arcname.replace(os.path.sep, '/')
                zipf.write(file_path, arcname)

    shutil.rmtree(temp_dir)
    print(f"PPTX edited successfully! Saved to {output_path}")

if __name__ == "__main__":
    input_file = "蓝色简约商务风个人年终工作汇报演示文稿 - 副本.pptx"
    output_file = "修改精调版_系统展示答辩汇报.pptx"
    edit_pptx(input_file, output_file)
