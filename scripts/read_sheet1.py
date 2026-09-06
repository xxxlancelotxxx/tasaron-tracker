import openpyxl

path = r"C:\Users\berkant.senturk\Desktop\teknikofis\GES_Nagatino-2_Hotel_Building_Follow-up_Report_20260705.xlsm"
wb = openpyxl.load_workbook(path, read_only=True, data_only=True)

def dump_sheet(name, max_rows=30, max_cols=35):
    ws = wb[name]
    print(f"\n{'='*80}")
    print(f"SHEET: {name}  ({ws.max_row} x {ws.max_column})")
    print(f"{'='*80}")
    for i, row in enumerate(ws.iter_rows(min_row=1, max_row=max_rows, max_col=max_cols, values_only=True)):
        # Boş satırı atla ama ilk 40 satırı göster
        vals = [str(c) if c is not None else '' for c in row]
        line = ' | '.join(vals).rstrip(' |')
        if line.strip():
            print(f"R{i+1}: {line}")

dump_sheet("3.Progress Summary")
