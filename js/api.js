// Komunikasi ke backend Google Apps Script (REST/JSON).
// POST wajib 'text/plain' agar browser tidak mengirim preflight CORS yang ditolak GAS.
async function kirim(fn, a) {
  if (!GAS_URL || /GANTI/.test(GAS_URL)) {
    throw new Error('GAS_URL belum diisi di js/config.js');
  }

  const publik = fn === 'beranda' || fn === 'kegiatanPublik'; // Data publik via GET
  
  try {
    const r = publik
      ? await fetch(GAS_URL + '?action=' + fn, { 
          method: 'GET',
          redirect: 'follow' 
        })
      : await fetch(GAS_URL, { 
          method: 'POST', 
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
          body: JSON.stringify({ action: fn, data: a }),
          redirect: 'follow'
        });

    if (!r.ok) throw new Error('Server merespons status ' + r.status);
    return await r.json();
  } catch (err) {
    console.error('API Error:', err);
    throw new Error('Koneksi ke server terblokir atau URL GAS tidak valid.');
  }
}
