import pg8000, sys

# Bağlantı bilgileri
HOST = "aws-0-eu-west-1.pooler.supabase.com"
PORT = 6543  # transaction pooler
DB = "postgres"
USER = "postgres.kslvysrsewzwxorfdwkx"
SQL_PATH = r"C:\Users\berkant.senturk\Documents\Default Project\supabase\migrations\20260904000000_tasaron_takip_schema.sql"

# Denenecek şifreler (proje oluşturulurken verdiğimiz değer)
PASSWORDS = ["T4s4r0n?2026Guvnl1", "T4s4r0n!2026Guvnl1", "postgres"]

conn = None
for pw in PASSWORDS:
    try:
        conn = pg8000.connect(user=USER, password=pw, host=HOST, port=PORT, database=DB, timeout=10)
        print(f"BASARILI: sifre calisiyor: {pw[:8]}...")
        break
    except Exception as e:
        print(f"Sifre denemesi basarisiz ({pw[:8]}...): {str(e)[:120]}")

if conn is None:
    print("HATA: hicbir sifre calismadi. DB sifresi bilinmiyor.")
    sys.exit(1)

# SQL'i oku ve calistir
with open(SQL_PATH, "r", encoding="utf-8") as f:
    sql = f.read()

cur = conn.cursor()
try:
    cur.execute(sql)
    # psycopg2'de otomatik commit yok, pg8000'de commit gerekli
    conn.commit()
    print("MIGRASYON BASARIYLA UYGULANDI")
except Exception as e:
    conn.rollback()
    print(f"MIGRASYON HATASI: {str(e)[:2000]}")
finally:
    cur.close()
    conn.close()
