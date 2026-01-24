import streamlit as st
import streamlit.components.v1 as cp

st.set_page_config(page_title="Island.io: Roket Launcher", layout="centered")

def load_file(file_name):
    with open(file_name, 'r', encoding='utf-8') as f:
        return f.read()

if "char" not in st.session_state:
    st.session_state.char = None

# --- BAGIAN MENU PILIH HERO (Sesuai kode awal kamu) ---
# --- BAGIAN MENU PILIH HERO (Ganti bagian ini di file .py kamu) ---
if not st.session_state.char:
    st.title("⚔️ Island.io: Roket Autolock Launcher")
    st.write("### Pilih Hero Anda:")
    
    # Membuat grid 3 kolom
    c1, c2, c3 = st.columns(3)
    c4, c5, c6 = st.columns(3)
    
    # Data lengkap dengan keterangan stat (HP & SPD)
    classes_data = [
        {"n": "🔴 Assault", "col": "#ff0000", "hp": 3, "spd": 6.5, "t": "assault", "slot": c1, "stat": "**HP:** ❤️❤️❤️\n\n**SPD:** ⚡⚡"},
        {"n": "🔵 Tank", "col": "#0000ff", "hp": 6, "spd": 4.5, "t": "tank", "slot": c2, "stat": "**HP:** ❤️❤️❤️❤️❤️❤️\n\n**SPD:** ⚡"},
        {"n": "🟢 Scout", "col": "#00ff00", "hp": 2, "spd": 8.5, "t": "scout", "slot": c3, "stat": "**HP:** ❤️❤️\n\n**SPD:** ⚡⚡⚡"},
        {"n": "🟣 Joker", "col": "#800080", "hp": 4, "spd": 6.5, "t": "joker", "slot": c4, "stat": "**HP:** ❤️❤️❤️❤️\n\n**SPD:** ⚡⚡"},
        {"n": "🟡 Bomber", "col": "#ffff00", "hp": 3, "spd": 6.0, "t": "bomber", "slot": c5, "stat": "**HP:** ❤️❤️❤️\n\n**SPD:** ⚡⚡"},
        {"n": "🟠 Roket", "col": "#ffa500", "hp": 3, "spd": 6.5, "t": "roket", "slot": c6, "stat": "**HP:** ❤️❤️❤️\n\n**SPD:** ⚡⚡"}
    ]

    for cls in classes_data:
        with cls["slot"]:
            # Tampilkan judul hero
            st.markdown(f"<div style='text-align: center; color: {cls['col']}; font-weight: bold;'>{cls['n']}</div>", unsafe_allow_html=True)
            
            # Tombol pilih
            if st.button("Pilih " + cls['n'].split()[1], key=cls['t']):
                st.session_state.char = {"hp": cls["hp"], "spd": cls["spd"], "col": cls["col"], "type": cls["t"]}
                st.rerun()
            
            # BAGIAN PENTING: Menampilkan Stat di bawah tombol
            st.caption(cls["stat"])

# --- JALANKAN GAME ---
else:
    p = st.session_state.char
    html_content = load_file("game.html")
    js_content = load_file("script.js")
    
    # Suntikkan variabel playerStats ke JavaScript
    full_code = f"""
    {html_content}
    <script>
        const heroStats = {{
            hp: {p['hp']},
            spd: {p['spd']},
            col: '{p['col']}',
            type: '{p['type']}'
        }};
        {js_content}
    </script>
    """
    cp.html(full_code, height=600)
