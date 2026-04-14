import zipfile
import re
import sys

def extract_text_from_pptx(pptx_path):
    text_content = []
    
    try:
        with zipfile.ZipFile(pptx_path, 'r') as z:
            # Get slide files
            slide_files = [f for f in z.namelist() if f.startswith('ppt/slides/slide') and f.endswith('.xml')]
            
            # Sort slides based on number
            def get_slide_num(filename):
                match = re.search(r'slide(\d+)', filename)
                return int(match.group(1)) if match else 0
                
            slide_files.sort(key=get_slide_num)
            
            for slide_file in slide_files:
                slide_num = get_slide_num(slide_file)
                xml_content = z.read(slide_file).decode('utf-8')
                
                # Extract text using basic regex for <a:t>...</a:t> tags
                # Some text might not be within <a:t> but mostly it is for PowerPoint
                texts = re.findall(r'<a:t([^>]*)>(.*?)</a:t>', xml_content)
                real_texts = [t[1] for t in texts]
                
                text_content.append(f"--- Slide {slide_num} ---")
                if real_texts:
                    # Filter out purely layout or empty tags
                    filtered_texts = [t for t in real_texts if t.strip()]
                    text_content.append("\n".join(filtered_texts))
                
                # Try finding notes
                notes_file = f'ppt/notesSlides/notesSlide{slide_num}.xml'
                if notes_file in z.namelist():
                    notes_xml = z.read(notes_file).decode('utf-8')
                    notes_texts = re.findall(r'<a:t([^>]*)>(.*?)</a:t>', notes_xml)
                    real_notes_texts = [t[1] for t in notes_texts]
                    if real_notes_texts:
                        filtered_notes_texts = [t for t in real_notes_texts if t.strip()]
                        if filtered_notes_texts:
                            text_content.append(f"备注: " + " ".join(filtered_notes_texts))
                text_content.append("")
                
        return "\n".join(text_content)
    except Exception as e:
        return f"Error reading PPTX: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        text = extract_text_from_pptx(sys.argv[1])
        with open("ppt_content.txt", "w", encoding="utf-8") as f:
            f.write(text)
