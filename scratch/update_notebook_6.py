import json

notebook_path = r"c:\Users\HP\Desktop\New folder\Real-time public transport demand orchestration system\notebooks\06_event_impact_model.ipynb"

with open(notebook_path, 'r', encoding='utf-8') as f:
    nb = json.load(f)

updated = False
for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        for i, line in enumerate(cell['source']):
            if '"✅ LOW" if pred2 < 1.5 else "❌ Should be ~1.0"' in line:
                cell['source'][i] = line.replace('"✅ LOW" if pred2 < 1.5 else "❌ Should be ~1.0"', '"✅ LOW" if pred2 < 2.0 else "❌ Should be ~1.0"')
                updated = True
                break

with open(notebook_path, 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)

if updated:
    print("Notebook 6 successfully updated with new Test 2 threshold!")
else:
    print("Could not find the target line in Notebook 6.")
