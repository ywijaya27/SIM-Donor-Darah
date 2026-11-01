// Komunikasi ke backend Google Apps Script (REST/JSON).
// POST wajib 'text/plain' agar browser tidak mengirim preflight CORS yang ditolak GAS.
async function kirim(fn, a) {
  if (!GAS_URL || /GANTI/.test(GAS_URL)) {
    throw new Error('GAS_URL belum diisi di js/config.js');
  }

  const publik = fn === 'beranda' || fn === 'kegiatanPublik'; // Data publik via GET
  const url = publik 
    ? (GAS_URL + (GAS_URL.includes('?') ? '&' : '?') + 'action=' + encodeURIComponent(fn)) 
    : GAS_URL;

  try {
    const r = publik
      ? await fetch(url, { 
          method: 'GET',
          redirect: 'follow' 
        })
      : await fetch(url, { 
          method: 'POST', 
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
          body: JSON.stringify({ action: fn, data: a }),
          redirect: 'follow'
        });

    if (!r.ok) throw new Error('Server merespons status HTTP ' + r.status);
    
    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      if (text.includes('<!doctype') || text.includes('<html') || text.includes('userCodeAppPanel')) {
        throw new Error('Backend Apps Script masih mengembalikan halaman HTML. Pastikan Kode.gs sudah versi REST API (ContentService) dan di-deploy ulang sebagai New version dengan akses "Anyone".');
      }
      throw new Error('Respons backend bukan format JSON yang valid: ' + text.slice(0, 120));
    }
    return data;
  } catch (err) {
    console.error('API Error (' + fn + '):', err);
    throw err;
  }
}
