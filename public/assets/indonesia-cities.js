/**
 * ~100 kota/kabupaten utama di Indonesia.
 * Digunakan oleh submit-event, admin, dan around-you untuk pilihan lokasi.
 */
window.INDONESIA_CITIES = [
  // Aceh
  "Banda Aceh", "Lhokseumawe", "Langsa", "Sabang", "Meulaboh",
  // Sumatera Utara
  "Medan", "Binjai", "Pematang Siantar", "Tanjung Balai", "Tebing Tinggi", "Padang Sidempuan",
  "Sibolga", "Parapat", "Danau Toba", "Samosir", "Berastagi",
  // Sumatera Barat
  "Padang", "Bukittinggi", "Payakumbuh", "Solok", "Sawahlunto",
  // Riau
  "Pekanbaru", "Dumai",
  // Kepulauan Riau
  "Batam", "Tanjung Pinang", "Bintan", "Karimun",
  // Jambi
  "Jambi", "Sungai Penuh",
  // Sumatera Selatan
  "Palembang", "Prabumulih", "Lubuklinggau", "Pagar Alam",
  // Bengkulu
  "Bengkulu",
  // Lampung
  "Bandar Lampung", "Metro", "Krui",
  // Bangka Belitung
  "Pangkal Pinang", "Belitung", "Tanjung Pandan",
  // DKI Jakarta
  "Jakarta", "Jakarta Selatan", "Jakarta Pusat", "Jakarta Barat", "Jakarta Timur", "Jakarta Utara",
  // Banten
  "Tangerang", "Tangerang Selatan", "Serang", "Cilegon", "Anyer", "Pandeglang",
  // Jawa Barat
  "Bandung", "Bekasi", "Bogor", "Depok", "Cimahi", "Cirebon", "Sukabumi", "Tasikmalaya",
  "Banjar", "Garut", "Karawang", "Subang", "Purwakarta", "Cianjur", "Lembang", "Pangandaran",
  // Jawa Tengah
  "Semarang", "Solo", "Surakarta", "Salatiga", "Magelang", "Pekalongan", "Tegal",
  "Purwokerto", "Kudus", "Klaten", "Demak", "Cilacap", "Jepara", "Kendal",
  "Wonosobo", "Dieng", "Karanganyar", "Sragen", "Boyolali", "Rembang",
  // DI Yogyakarta
  "Yogyakarta", "Sleman", "Bantul", "Gunung Kidul", "Kulon Progo",
  // Jawa Timur
  "Surabaya", "Malang", "Batu", "Kediri", "Blitar", "Madiun", "Mojokerto",
  "Pasuruan", "Probolinggo", "Jember", "Sidoarjo", "Gresik", "Lamongan",
  "Tuban", "Lumajang", "Bangkalan", "Situbondo", "Banyuwangi", "Pacitan", "Tulungagung",
  // Bali
  "Bali", "Denpasar", "Badung", "Gianyar", "Tabanan", "Ubud", "Singaraja",
  "Kuta", "Seminyak", "Canggu", "Sanur", "Nusa Dua", "Jimbaran",
  "Nusa Penida", "Nusa Lembongan", "Lovina", "Candidasa", "Amed", "Karangasem", "Klungkung",
  // NTB
  "Mataram", "Bima", "Lombok", "Senggigi", "Gili Trawangan", "Sumbawa",
  // NTT
  "Kupang", "Ende", "Labuan Bajo", "Flores", "Komodo", "Sumba", "Ruteng", "Maumere",
  // Kalimantan Barat
  "Pontianak", "Singkawang", "Ketapang",
  // Kalimantan Tengah
  "Palangka Raya",
  // Kalimantan Selatan
  "Banjarmasin", "Banjarbaru",
  // Kalimantan Timur
  "Samarinda", "Balikpapan", "Bontang", "Berau", "Derawan",
  // Kalimantan Utara
  "Tarakan", "Malinau",
  // Sulawesi Utara
  "Manado", "Bitung", "Tomohon", "Bunaken",
  // Sulawesi Tengah
  "Palu", "Togian",
  // Sulawesi Selatan
  "Makassar", "Palopo", "Parepare", "Tana Toraja", "Bulukumba", "Maros",
  // Sulawesi Tenggara
  "Kendari", "Baubau", "Wakatobi",
  // Gorontalo
  "Gorontalo",
  // Sulawesi Barat
  "Mamuju",
  // Maluku
  "Ambon", "Tual", "Banda Neira",
  // Maluku Utara
  "Ternate", "Tidore", "Morotai",
  // Papua
  "Jayapura", "Merauke", "Sorong", "Manokwari", "Timika", "Raja Ampat", "Wamena", "Biak",
  // IKN
  "Nusantara (IKN)"
];

/**
 * Setup Custom Autocomplete untuk Input Kota
 * Menggantikan default `<datalist>` browser yang seringkali jelek secara UI.
 */
window.setupCityAutocomplete = function(inputId, onChangeCallback) {
    const input = document.getElementById(inputId);
    if (!input) return;

    // Cegah double initialization
    if (input.parentNode && input.parentNode.classList.contains('autocomplete-wrapper')) return;

    // Matikan native autocomplete browser & datalist
    input.setAttribute('autocomplete', 'off');
    input.removeAttribute('list');

    // Buat wrapper container relative
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.className = 'w-full autocomplete-wrapper';
    
    // Insert wrapper sebelum input, lalu pindahkan input ke dalam wrapper
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    // Buat element dropdown list (awalnya hidden)
    const list = document.createElement('ul');
    list.className = 'city-autocomplete-list hidden absolute left-0 top-full w-full bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-2xl mt-1 max-h-48 overflow-y-auto z-50 shadow-2xl transition-all';
    
    // Sembunyikan scrollbar agar rapi
    list.style.cssText = '-ms-overflow-style: none; scrollbar-width: none;';
    
    wrapper.appendChild(list);

    // Tangani input saat diketik
    input.addEventListener('input', function() {
        // Jika input dipakai untuk hal lain (misal di admin panel), bisa dinonaktifkan via attribute
        if (this.hasAttribute('data-autocomplete-disabled') && this.getAttribute('data-autocomplete-disabled') === 'true') {
            list.classList.add('hidden');
            return;
        }

        const val = this.value.toLowerCase().trim();
        list.innerHTML = '';
        
        if (!val) {
            list.classList.add('hidden');
            if (onChangeCallback) onChangeCallback(this.value);
            return;
        }

        const matches = window.INDONESIA_CITIES.filter(c => c.toLowerCase().includes(val));

        if (matches.length === 0) {
            list.classList.add('hidden');
            if (onChangeCallback) onChangeCallback(this.value);
            return;
        }

        matches.forEach(c => {
            const li = document.createElement('li');
            li.className = 'px-4 py-3 text-[11px] font-bold uppercase tracking-widest cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white transition';
            li.textContent = c;
            
            li.addEventListener('click', function(e) {
                // Cegah list langsung tertutup sebelum event selesai
                e.stopPropagation();
                
                input.value = c;
                list.classList.add('hidden');
                
                // Panggil callback onchange jika ada
                if (onChangeCallback) {
                    onChangeCallback(input.value);
                } else {
                    // Trigger "change" event standard
                    input.dispatchEvent(new Event('change'));
                }
            });
            list.appendChild(li);
        });

        list.classList.remove('hidden');
        if (onChangeCallback) onChangeCallback(this.value);
    });

    // Sembunyikan dropdown jika user mengklik di luar area input
    document.addEventListener('click', function(e) {
        if (e.target !== input) {
            list.classList.add('hidden');
        }
    });
};
