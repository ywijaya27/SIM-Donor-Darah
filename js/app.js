/** SIM Donor Darah — Frontend (SPA). Token hanya di memori JS, URL tidak pernah berubah. */
const S = { t: null, r: null, n: null, pg: 'info', nav: 0, h: [], m: [] }, $ = id => document.getElementById(id);
const G = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], ADM = ['Super Admin', 'Admin'];
const PUB = [['info', 'Beranda', 'house'], ['regPermintaan', 'Registrasi Permintaan', 'droplet'], ['regPendonor', 'Registrasi Pendonor', 'person-plus']];
const MN = [['dashboard', 'Dashboard', 'speedometer2'], ['siap', 'Siap Donor', 'heart-pulse'], ['permintaan', 'Permintaan Darah', 'droplet-half']];
const MA = [['pendonor', 'Pendonor', 'people'], ['kegiatan', 'Kegiatan', 'newspaper'], ['grafik', 'Grafik', 'bar-chart-line']];
const MS = [['pengguna', 'Pengaturan Pengguna', 'person-gear'], ['log', 'Activity Log', 'clock-history']];
const can = h => S.r === 'Super Admin' || (S.h || []).includes(h);
const canAdm = h => ADM.includes(S.r) && can(h); // tambah/ubah hanya untuk Super Admin & Admin
const BG = { 'Siap Donor': 'ok', Aktif: 'ok', Terpenuhi: 'ok', Menunggu: 'wa', Diproses: 'wa', 'Menunggu Persetujuan': 'wa', 'Belum Siap': 'no', 'Tidak Aktif': 'no', Dibatalkan: 'no' };
const SP = {
  pendonor: [['Nama', 'Nama lengkap', 'text', 1], ['Umur', 'Umur', 'number', 1], ['JK', 'Jenis kelamin', ['Laki-laki', 'Perempuan'], 1], ['Golda', 'Golongan darah', G, 1],
    ['NoHP', 'No HP', 'tel', 1], ['Kota', 'Kota', 'text', 1], ['Alamat', 'Alamat', 'text', 1], ['Email', 'Email (opsional)', 'email'], ['DonorTerakhir', 'Tanggal donor terakhir', 'date']],
  permintaan: [['Pasien', 'Nama pasien', 'text', 1], ['Umur', 'Umur', 'number', 1], ['Golda', 'Golongan darah', G, 1], ['Komponen', 'Komponen darah', ['WB', 'PRC', 'TC', 'FFP'], 1],
    ['Jumlah', 'Jumlah kantong', 'number', 1], ['RS', 'Dirawat di RS', 'text', 1], ['Ruangan', 'Ruangan', 'text', 1], ['AsalPasien', 'Asal pasien', 'text', 1], ['Kota', 'Kota', 'text', 1],
    ['Keluarga', 'Nama keluarga pasien', 'text', 1], ['NoHP', 'No HP', 'tel', 1], ['TglButuh', 'Tanggal dibutuhkan', 'date', 1]],
  kegiatan: [['Judul', 'Judul', 'text', 1], ['Isi', 'Isi berita', 'ta', 1], ['Gambar', 'Link gambar (opsional)', 'url'], ['Video', 'Link video (opsional)', 'url']]
};
let CH = {}, TB = {}, KG = [], LOG = [];
const LBL = { pendonor: 'Pendonor', permintaan: 'Permintaan Darah', kegiatan: 'Kegiatan' };

// ── Utilitas ──
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function toast(m, t) { const e = $('toast'); e.className = 'toast align-items-center border-0 text-bg-' + (t || 'dark'); $('toastMsg').textContent = m; bootstrap.Toast.getOrCreateInstance(e, { delay: 4000 }).show(); }
let LC = {};
const svS = () => { try { sessionStorage.setItem('sim', JSON.stringify({ t: S.t, r: S.r, n: S.n, h: S.h, m: S.m })); } catch (e) { } };
function call(fn, a, ok, fail) { // loading bar tipis + penanganan error; mutasi menghapus cache tampilan
  $('bar').hidden = false;
  kirim(fn, a).then(r => {
    $('bar').hidden = true;
    if (r.success) { if (!/^(list|dashboard|beranda)/.test(fn)) LC = {}; ok && ok(r.data, r.message); }
    else { toast(r.message, 'danger'); fail && fail(); if (/^Sesi/.test(r.message)) { S.t = null; try { sessionStorage.removeItem('sim'); } catch (e) { } go('login'); } }
  }).catch(e => { $('bar').hidden = true; toast('Gagal menghubungi server: ' + e.message, 'danger'); fail && fail(); });
}
function L(fn, a, ok) { // stale-while-revalidate: tampilkan data terakhir seketika, perbarui di latar belakang
  const n = S.nav, k = fn + JSON.stringify(a.slice(1)), lama = LC[k];
  if (lama) ok(lama);
  call(fn, a, (d, m) => { LC[k] = d; if (n === S.nav && JSON.stringify(d) !== JSON.stringify(lama)) ok(d, m); });
}
function ask(m, fn) { $('askMsg').textContent = m; const md = bootstrap.Modal.getOrCreateInstance($('askModal')); $('askOk').onclick = () => { md.hide(); fn(); }; md.show(); }
const shell = (t, id) => $('app').innerHTML = `<div class="container py-4"><h2 class="h4 mb-3">${t}</h2><div id="ef"></div><div id="${id}"><div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div></div></div></div>`;
function toggleTheme() {
  const n = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = n; document.documentElement.dataset.bsTheme = n;
  try { localStorage.setItem('theme', n); } catch (e) { }
  if (S.pg === 'grafik') go('grafik');
}

// ── Router SPA ──
function renderNav() {
  const m = S.t ? [...MN, ...MA].filter(x => S.m.includes(x[0])).concat(S.r === 'Super Admin' ? MS : []) : PUB;
  $('menu').innerHTML = m.map(x => `<a href="javascript:void(0)" class="nav-link ${S.pg === x[0] ? 'active' : ''}" onclick="go('${x[0]}')"><i class="bi bi-${x[2]}"></i> ${x[1]}</a>`).join('');
  $('auth').innerHTML = S.t
    ? `<div class="dropdown"><button class="btn btn-sm btn-light dropdown-toggle" data-bs-toggle="dropdown" aria-label="Profil"><i class="bi bi-person-circle"></i> ${esc(S.n)}</button><ul class="dropdown-menu dropdown-menu-end"><li><span class="dropdown-item-text small text-muted">${esc(S.r)}</span></li><li><button class="dropdown-item" onclick="logout()"><i class="bi bi-box-arrow-right"></i> Logout</button></li></ul></div>`
    : `<button class="btn btn-sm btn-danger" onclick="go('login')"><i class="bi bi-box-arrow-in-right"></i> Masuk</button>`;
}
function go(p) {
  if (!S.t && !['info', 'login', 'regPendonor', 'regPermintaan'].includes(p)) p = 'login';
  if (p === 'log' && S.r !== 'Super Admin') p = 'info';
  if (S.t && [...MN, ...MA].some(x => x[0] === p) && !S.m.includes(p)) p = S.m.includes('dashboard') ? 'dashboard' : (S.m[0] || 'info');
  S.pg = p; S.nav++; renderNav(); PG[p]();
  toggleSide(false); window.scrollTo(0, 0);
}
function toggleSide(v) { const o = v === undefined ? !$('side').classList.contains('open') : v; $('side').classList.toggle('open', o); $('ov').classList.toggle('open', o); }
function doLogin(e) { e.preventDefault(); call('login', [$('u').value, $('p').value], d => { S.t = d.token; S.r = d.role; S.n = d.nama; S.h = d.hak || []; S.m = d.menu || []; svS(); toast('Selamat datang, ' + d.nama, 'success'); go(S.m.includes('dashboard') ? 'dashboard' : (S.m[0] || 'info')); }); }
function logout() { const t = S.t; S.t = S.r = S.n = null; S.h = []; S.m = []; LC = {}; try { sessionStorage.removeItem('sim'); } catch (e) { } kirim('logout', [t]).catch(() => { }); go('info'); }

// ── Form generik ──
const F = spec => spec.map(([k, l, t, r]) => `<div class="col-md-6"><label class="form-label" for="f_${k}">${l}${r ? ' *' : ''}</label>${Array.isArray(t)
  ? `<select class="form-select" id="f_${k}" ${r ? 'required' : ''}><option value="">Pilih…</option>${t.map(o => `<option>${o}</option>`).join('')}</select>`
  : t === 'ta' ? `<textarea class="form-control" id="f_${k}" rows="2" ${r ? 'required' : ''}></textarea>`
  : `<input class="form-control" id="f_${k}" type="${t}" ${r ? 'required' : ''}>`}</div>`).join('');
const V = spec => Object.fromEntries(spec.map(s => [s[0], ($('f_' + s[0]).value || '').trim()]));
function formPg(t, k, fn, ex, side) {
  $('app').innerHTML = `<div class="container py-4" style="max-width:${side ? 1100 : 820}px"><div class="row g-3"><div class="${side ? 'col-lg-8' : 'col-12'}"><div class="cardx p-4"><h2 class="h4 mb-3">${t}</h2><form class="row g-3" onsubmit="${fn}(event)" ${side ? 'oninput="sim()" onchange="sim()"' : ''}>${F(SP[k])}${ex || ''}<div class="col-12"><button class="btn btn-danger" type="submit"><i class="bi bi-send"></i> Kirim</button></div></form></div></div>${side ? `<div class="col-lg-4"><div class="cardx p-3 sticky-top" style="top:72px">${side}</div></div>` : ''}</div></div>`;
  if (side) sim();
}
function sendPendonor(e) { e.preventDefault(); call('daftarPendonor', [V(SP.pendonor)], (d, m) => { toast(m, 'success'); go(S.t ? 'pendonor' : 'info'); }); }
function sendPermintaan(e) {
  e.preventDefault();
  const o = V(SP.permintaan), f = $('f_file').files[0];
  const kirim = file => call('daftarPermintaan', [o, file], (d, m) => { toast(m, 'success'); go(S.t ? 'permintaan' : 'info'); });
  if (!f) return kirim(null);
  if (f.size > 5 * 1048576) return toast('Surat maksimal 5 MB.', 'warning');
  const r = new FileReader(); r.onload = () => kirim({ b64: r.result.split(',')[1], name: f.name, type: f.type }); r.readAsDataURL(f);
}

// ── Tabel generik: cari di semua kolom + ekspor CSV ──
function cell(k, v) {
  v = v == null ? '' : v;
  if (k === 'Golda') return `<span class="gd">${esc(v)}</span>`;
  if (k === 'SuratUrl') return v ? `<a href="${esc(v)}" target="_blank" rel="noopener">Lihat</a>` : '-';
  if (k === 'Aksi') return `<span class="bd ${/gagal/i.test(v) ? 'no' : /hapus/i.test(v) ? 'wa' : 'ok'}">${esc(v)}</span>`;
  if (['Status', 'Kepesertaan'].includes(k) && BG[v]) return `<span class="bd ${BG[v]}">${esc(v)}</span>`;
  return esc(v);
}
const WT = { Nama: 150, Alamat: 200, Pasien: 150, Keluarga: 140, RS: 170, Data: 260, Waktu: 130, Email: 160, Hak: 150, Menu: 180, _a: 190, Umur: 60, JK: 80, Golda: 70, Jumlah: 70, Kota: 110, Status: 110, Kepesertaan: 140, DonorTerakhir: 120, TglButuh: 120, Komponen: 100, Ruangan: 100, User: 110, Aksi: 160 };
// Lebar kolom otomatis: mengisi lebar wadah (melebar/menyempit mengikuti layar); kolom yang sudah diatur pengguna dipertahankan
function fitW(id) {
  const t = TB[id], cl = t.cols.concat(t.act ? [['_a', 'Aksi']] : []), w = c => WT[c] || 100;
  const mn = c => Math.max(56, Math.min(96, Math.max(...String(c[1]).split(/\s+/).map(s => s.length)) * 8 + 22)); // minimal kolom (judul panjang boleh terpotong baris)
  const sc = $(id).querySelector('.tscroll'), lebar = (sc ? sc.clientWidth : ($(id).clientWidth || 1000) - 17) - 4 - (t.pr ? 44 : 0);
  const hasil = cl.map(c => CW[S.pg + '.' + c[0]] || 0); let sisa = lebar - hasil.reduce((a, v) => a + v, 0), bebas = cl.map((c, i) => i).filter(i => !hasil[i]);
  while (bebas.length) { // bagi sisa lebar sesuai bobot; kolom yang lebih sempit dari minimalnya dikunci di minimal, sisanya dibagi ulang
    const tot = bebas.reduce((a, i) => a + w(cl[i][0]), 0), kecil = bebas.filter(i => sisa * w(cl[i][0]) / tot < mn(cl[i]));
    if (!kecil.length) { bebas.forEach(i => hasil[i] = Math.floor(sisa * w(cl[i][0]) / tot)); break; }
    kecil.forEach(i => { hasil[i] = mn(cl[i]); sisa -= hasil[i]; }); bebas = bebas.filter(i => !kecil.includes(i));
  }
  return hasil;
}
function refit() { // sesuaikan ulang semua tabel yang tampil (saat jendela diubah ukurannya / tombol Sesuaikan lebar)
  Object.keys(TB).forEach(id => {
    const el = $(id), tb = el && el.querySelector('table'); if (!tb) return;
    const wd = fitW(id); tb.querySelectorAll('col[data-k]').forEach((c, i) => c.style.width = wd[i] + 'px');
    tb.style.width = ((TB[id].pr ? 44 : 0) + wd.reduce((a, b) => a + b, 0)) + 'px';
  });
}
function cwReset() { Object.keys(CW).filter(k => k.startsWith(S.pg + '.')).forEach(k => delete CW[k]); cwSave(); refit(); }
let rzT; window.addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(refit, 250); });
let CW = {}; try { CW = JSON.parse(localStorage.getItem('cw') || '{}'); } catch (e) { }
const cwSave = () => { try { localStorage.setItem('cw', JSON.stringify(CW)); } catch (e) { } };
document.addEventListener('pointerdown', e => { // seret batas judul kolom untuk mengubah lebar
  const h = e.target.closest && e.target.closest('.rz'); if (!h) return;
  e.preventDefault(); const tb = h.closest('table'), col = tb.querySelector('col[data-k="' + h.dataset.k + '"]'), x0 = e.clientX, w0 = col.offsetWidth, t0 = tb.offsetWidth;
  h.setPointerCapture(e.pointerId); document.body.classList.add('rzing');
  const mv = ev => { const w = Math.max(60, w0 + ev.clientX - x0); col.style.width = w + 'px'; tb.style.width = (t0 - w0 + w) + 'px'; };
  const up = () => { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); document.body.classList.remove('rzing'); CW[S.pg + '.' + h.dataset.k] = col.offsetWidth; cwSave(); };
  h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up);
});
document.addEventListener('dblclick', e => { const h = e.target.closest && e.target.closest('.rz'); if (!h) return; delete CW[S.pg + '.' + h.dataset.k]; cwSave(); go(S.pg); }); // reset lebar kolom
const dq = (() => { let t; return (id, v) => { clearTimeout(t); t = setTimeout(() => drawTbl(id, v), 150); }; })();
function tbl(id, cols, data, act, opt) {
  if (!$(id)) return; opt = opt || {};
  const pr = can('print') && !opt.nopr; TB[id] = { cols, data, act, pr };
  const cl = cols.concat(act ? [['_a', 'Aksi']] : []), wd = fitW(id);
  const tw = (pr ? 44 : 0) + wd.reduce((a, b) => a + b, 0), cg = `<colgroup>${pr ? '<col style="width:44px">' : ''}${cl.map((c, i) => `<col data-k="${c[0]}" style="width:${wd[i]}px">`).join('')}</colgroup>`;
  $(id).innerHTML = `<div class="d-flex gap-2 mb-2 flex-wrap"><input class="form-control" style="max-width:320px" placeholder="Cari di semua kolom…" aria-label="Cari" oninput="dq('${id}',this.value)"><button class="btn btn-outline-secondary" onclick="cwReset()" title="Lebar kolom otomatis mengisi layar"><i class="bi bi-arrows-angle-contract"></i> Sesuaikan lebar</button>${ADM.includes(S.r) && !opt.nocsv ? `<button class="btn btn-outline-secondary" onclick="csv('${id}')"><i class="bi bi-download"></i> Ekspor CSV</button>` : ''}${pr ? `<button class="btn btn-outline-secondary" onclick="cetak('${id}')"><i class="bi bi-printer"></i> Cetak terpilih</button>` : ''}${opt.extra || ''}</div><div class="table-responsive tscroll"><table class="table table-hover tfix" style="width:${tw}px">${cg}<thead><tr>${pr ? `<th><input type="checkbox" aria-label="Pilih semua" onchange="document.querySelectorAll('#${id} .rc').forEach(c=>c.checked=this.checked)"></th>` : ''}${cl.map(c => `<th style="overflow-wrap:anywhere">${c[1]}<i class="rz" data-k="${c[0]}" role="separator" aria-label="Ubah lebar kolom ${c[1]}" title="Seret untuk mengubah lebar · klik dua kali untuk reset"></i></th>`).join('')}</tr></thead><tbody id="${id}b"></tbody></table></div>`;
  drawTbl(id, ''); refit(); // ukur ulang setelah tabel tampil (memperhitungkan scrollbar)
}
function drawTbl(id, q) {
  const t = TB[id], s = q.toLowerCase(); if (!t || !$(id + 'b')) return;
  $(id + 'b').innerHTML = t.data.map((r, i) => [r, i]).filter(([r]) => t.cols.some(c => String(r[c[0]]).toLowerCase().includes(s)))
    .map(([r, i]) => `<tr>${t.pr ? `<td><input type="checkbox" class="rc" data-i="${i}" aria-label="Pilih baris"></td>` : ''}${t.cols.map(c => `<td>${cell(c[0], r[c[0]])}</td>`).join('')}${t.act ? `<td>${t.act(r, i)}</td>` : ''}</tr>`).join('')
    || '<tr><td colspan="99" class="text-center text-muted py-4">Belum ada data.</td></tr>';
}
function cetak(id) { // print selection: hanya baris tercentang, lewat area cetak (tanpa membuka tab baru)
  const t = TB[id], sel = [...document.querySelectorAll('#' + id + ' .rc:checked')].map(c => t.data[+c.dataset.i]);
  if (!sel.length) return toast('Centang baris yang akan dicetak.', 'warning');
  $('pa').innerHTML = `<h3>${esc(document.querySelector('h2').textContent)}</h3><p>Dicetak ${new Date().toLocaleString('id-ID')} oleh ${esc(S.n)}</p><table border="1" cellpadding="6" style="border-collapse:collapse;width:100%"><thead><tr>${t.cols.map(c => `<th>${c[1]}</th>`).join('')}</tr></thead><tbody>${sel.map(r => `<tr>${t.cols.map(c => `<td>${esc(r[c[0]])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  window.print();
}
function csv(id) {
  const t = TB[id], q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const txt = [t.cols.map(c => q(c[1])).join(',')].concat(t.data.map(r => t.cols.map(c => q(r[c[0]])).join(','))).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + txt], { type: 'text/csv' })); a.download = id + '.csv'; a.click();
}
const del = (n, id, pg) => ask('Hapus data ini? Tindakan tidak bisa dibatalkan.', () => {
  const t = TB.tb, lokal = n !== 'Kegiatan' && t && t.data.some(x => x.ID === id);
  if (lokal) { t.data = t.data.filter(x => x.ID !== id); drawTbl('tb', ''); } // optimistis: baris hilang seketika
  call('hapus', [S.t, n, id], (d, m) => { toast(m, 'success'); if (!lokal) go(pg); }, () => go(pg));
});
const kep = (id, v) => {
  const r = TB.tb && TB.tb.data.find(x => x.ID === id); if (r) { r.Kepesertaan = v; drawTbl('tb', ''); } // optimistis
  call('setKepesertaan', [S.t, id, v], (d, m) => toast(m, 'success'), () => go(S.pg));
};
const stat = (id, v) => call('setStatusPermintaan', [S.t, id, v], (d, m) => toast(m, 'success'));

// ── Halaman ──
const PG = {
  info() {
    $('app').innerHTML = `<section class="hero"><div class="container"><span class="tag"><i class="bi bi-droplet-fill"></i> Repositori donor darah real-time</span><h1>Manajemen Donor Darah<br>Terpusat &amp; Transparan</h1><p class="mb-4">Pantau kesiapan pendonor, ajukan permintaan darah, dan ikuti kegiatan donor dalam satu aplikasi.</p><div class="d-flex gap-2 flex-wrap"><button class="btn btn-danger btn-lg" onclick="go('regPendonor')"><i class="bi bi-person-plus"></i> Registrasi sebagai Pendonor</button><button class="btn btn-light btn-lg" onclick="go('regPermintaan')"><i class="bi bi-droplet"></i> Ajukan Permintaan Darah</button></div></div></section>
    <div class="container pb-4"><div id="bs" class="row g-3 stats">${'<div class="col-md-4"><div class="cardx stat sk"></div></div>'.repeat(3)}</div>
    <h2 class="h5 mt-4">Ketersediaan Donor per Golongan Darah</h2><div id="bg" class="row g-3">${'<div class="col-6 col-md-3"><div class="cardx stat sk"></div></div>'.repeat(8)}</div>
    <div class="row g-3 mt-2">${[['heart-pulse', 'Jarak donor', 'Pria minimal 3 bulan, wanita minimal 4 bulan dari donor terakhir.'], ['patch-check', 'Persetujuan admin', 'Pendaftaran diverifikasi admin; Anda menerima email bila disetujui.'], ['droplet-half', 'Permintaan darah', 'Isi formulir; petugas memproses dan memperbarui statusnya.']].map(x => `<div class="col-md-4"><div class="cardx p-3 h-100"><i class="bi bi-${x[0]} fs-3 text-danger"></i><h3 class="h6 mt-2">${x[1]}</h3><p class="small text-muted mb-0">${x[2]}</p></div></div>`).join('')}</div>
    <h2 class="h5 mt-4">Kegiatan Donor</h2><div id="kgp" class="row g-3 kg"></div></div>`;
    L('beranda', [], d => {
      const top = G.reduce((a, g) => d.req[g] > d.req[a] ? g : a, G[0]);
      $('bs').innerHTML = [['Pendonor siap donor', sum(d.siap), 'ok-t', 'Terverifikasi admin'], ['Permintaan aktif', sum(d.req), 'cr', 'Menunggu & diproses'], ['Paling dibutuhkan', d.req[top] ? top : '-', '', d.req[top] ? d.req[top] + ' permintaan aktif' : 'Belum ada permintaan']]
        .map(x => `<div class="col-md-4"><div class="cardx stat"><div class="lbl">${x[0]}</div><div class="num ${x[2]}">${x[1]}</div><small>${x[3]}</small></div></div>`).join('');
      $('bg').innerHTML = golCards(d); $('kgp').innerHTML = kgCards(d.kegiatan);
    });
  },
  login() {
    $('app').innerHTML = `<div class="container py-5" style="max-width:420px"><div class="cardx p-4"><h2 class="h4 mb-3"><i class="bi bi-shield-lock"></i> Masuk</h2><form onsubmit="doLogin(event)"><label class="form-label" for="u">Username</label><input id="u" class="form-control mb-3" required autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false"><label class="form-label" for="p">Password</label><input id="p" type="password" class="form-control mb-3" required autocomplete="current-password"><button class="btn btn-danger w-100">Masuk</button></form></div></div>`;
  },
  regPendonor() { formPg('Registrasi sebagai Pendonor', 'pendonor', 'sendPendonor', '', '<div id="sim"></div><hr><div class="lbl">Standar kualifikasi</div><ul class="small mb-0 ps-3 mt-1"><li>Usia 17–65 tahun, sehat</li><li>Berat badan minimal 45 kg</li><li>Jeda donor: pria 3 bulan, wanita 4 bulan</li></ul>'); },
  regPermintaan() { formPg('Registrasi Permintaan Darah', 'permintaan', 'sendPermintaan', '<div class="col-md-6"><label class="form-label" for="f_file">Surat permintaan RS (opsional, PDF/JPG/PNG maks 5 MB)</label><input class="form-control" id="f_file" type="file" accept=".pdf,.jpg,.jpeg,.png"></div>'); },
  dashboard() {
    shell('Dashboard', 'dv');
    L('dashboard', [S.t], d => {
      const lm = S.m.includes('permintaan'); // tabel permintaan hanya untuk pengguna yang memang punya akses menu Permintaan Darah
      $('dv').innerHTML = `<div class="row g-3">${golCards(d)}</div>${lm ? '<h2 class="h5 mt-4">Permintaan Darah</h2><div id="dvm"></div>' : ''}<h2 class="h5 mt-4">Kegiatan Donor</h2><div class="row g-3 kg">${kgCards(d.kegiatan)}</div>`;
      if (lm) L('listPermintaan', [S.t], m => tbl('dvm', [['Pasien', 'Pasien'], ['Umur', 'Umur'], ['Golda', 'Golda'], ['Komponen', 'Komponen'], ['Jumlah', 'Kantong'], ['RS', 'Rumah Sakit'], ['TglButuh', 'Tgl Dibutuhkan']], m, null, { nopr: 1, nocsv: 1 }));
    });
  },
  pendonor() {
    shell('Data Pendonor', 'tb');
    const ex = tmbl('pendonor') + (can('upload') ? `<button class="btn btn-outline-secondary" onclick="templateCsv()"><i class="bi bi-file-earmark-arrow-down"></i> Template</button><label class="btn btn-outline-secondary mb-0"><i class="bi bi-file-earmark-excel"></i> Upload Excel<input type="file" hidden accept=".xlsx,.xls,.csv" onchange="pilihExcel(event)"></label>` : '');
    L('listPendonor', [S.t, 'semua'], d => tbl('tb', [['Nama', 'Nama'], ['Umur', 'Umur'], ['JK', 'JK'], ['Golda', 'Golda'], ['NoHP', 'No HP'], ['Kota', 'Kota'], ['DonorTerakhir', 'Donor Terakhir'], ['Kepesertaan', 'Kepesertaan'], ['Status', 'Kesiapan']], d, adaAksi() ? aksiP : null, { extra: ex }));
  },
  log() { // Activity Log (Audit Log) — hanya Super Admin; server juga menolak peran lain
    $('app').innerHTML = `<div class="container py-4"><div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2"><h2 class="h4 mb-0">Activity Log (Audit Log)</h2><div class="d-flex gap-2"><select id="lgf" class="form-select" aria-label="Filter aksi" onchange="lgFilter()"><option value="">Semua aktivitas</option><option value="login">Login (termasuk gagal)</option><option value="logout">Logout</option><option value="pengguna">Pengguna</option><option value="password">Password</option><option value="pendonor">Pendonor</option><option value="permintaan">Permintaan</option><option value="kegiatan">Kegiatan</option><option value="import">Import</option><option value="hapus">Penghapusan</option></select><button class="btn btn-outline-secondary" onclick="LC={};go('log')"><i class="bi bi-arrow-clockwise"></i> Muat ulang</button></div></div><p class="small text-muted">Menampilkan hingga 500 aktivitas terbaru, paling baru di atas. Log bersifat hanya-baca.</p><div id="tb"><div class="text-center py-5"><div class="spinner-border text-danger"></div></div></div></div>`;
    L('listLog', [S.t], d => { LOG = d; lgFilter(); });
  },
  pengguna() {
    $('app').innerHTML = `<div class="container py-4"><div class="d-flex justify-content-between align-items-center mb-3"><h2 class="h4 mb-0">Pengaturan Pengguna & Hak Akses</h2><button class="btn btn-danger" onclick="fUser()"><i class="bi bi-person-plus"></i> Tambah Pengguna</button></div><div id="uf"></div><div id="tb"><div class="text-center py-5"><div class="spinner-border text-danger"></div></div></div></div>`;
    L('listPengguna', [S.t], d => tbl('tb', [['Username', 'User ID'], ['Nama', 'Nama'], ['Peran', 'Peran'], ['Hak', 'Hak akses'], ['Menu', 'Menu dilihat']], d,
      (r, i) => `<button class="btn btn-sm btn-outline-secondary" onclick="fUser(TB.tb.data[${i}])"><i class="bi bi-pencil"></i> Ubah</button> <button class="btn btn-sm btn-outline-danger" aria-label="Hapus" onclick="delUser('${esc(r.Username)}')"><i class="bi bi-trash"></i></button>`, { nopr: 1, nocsv: 1 }));
  },
  siap() {
    shell('Daftar Siap Donor', 'tb');
    L('listPendonor', [S.t, 'siap'], d => tbl('tb', [['Nama', 'Nama'], ['Golda', 'Golda'], ['JK', 'JK'], ['Umur', 'Umur'], ['Kota', 'Kota'], ['NoHP', 'No HP'], ['Alamat', 'Alamat'], ['Email', 'Email'], ['DonorTerakhir', 'Donor Terakhir'], ['Status', 'Kesiapan']].filter(c => !d[0] || c[0] in d[0]), d, adaAksi() ? aksiP : null, { extra: tmbl('pendonor') }));
  },
  permintaan() {
    shell('Daftar Permintaan Darah', 'tb');
    L('listPermintaan', [S.t], d => tbl('tb', [['Pasien', 'Pasien'], ['Umur', 'Umur'], ['Golda', 'Golda'], ['Komponen', 'Komponen'], ['Jumlah', 'Kantong'], ['RS', 'Rumah Sakit'], ['Ruangan', 'Ruangan'], ['AsalPasien', 'Asal'], ['Kota', 'Kota'], ['Keluarga', 'Keluarga'], ['NoHP', 'No HP'], ['TglButuh', 'Dibutuhkan'], ['SuratUrl', 'Surat'], ['Status', 'Status']], d, adaAksi() ? aksiM : null, { extra: tmbl('permintaan') }));
  },
  kegiatan() {
    $('app').innerHTML = `<div class="container py-4"><div class="d-flex justify-content-between align-items-center mb-3"><h2 class="h4 mb-0">Kegiatan Donor</h2>${tmbl('kegiatan')}</div><div id="ef"></div><div id="kg" class="row g-3 kg"><div class="text-center py-4"><div class="spinner-border text-danger"></div></div></div></div>`;
    L('listKegiatan', [S.t], d => {
      KG = d;
      $('kg').innerHTML = d.map((k, i) => `<div class="col-md-4"><div class="cardx h-100">${kgImg(k)}<div class="p-3"><small>${esc(k.Tanggal)} · ${esc(k.Oleh)}</small><h3 class="h6 mt-1">${esc(k.Judul)}</h3><p class="small">${esc(k.Isi)}</p>${k.Video ? `<a class="small d-block mb-2" href="${esc(k.Video)}" target="_blank" rel="noopener"><i class="bi bi-play-circle"></i> Video</a>` : ''}<div class="d-flex gap-1 flex-wrap">${canAdm('ubah') ? `<button class="btn btn-sm ${k.Publish === 'Ya' ? 'btn-success' : 'btn-outline-success'}" onclick="pub('${k.ID}',${k.Publish === 'Ya' ? 0 : 1})"><i class="bi bi-megaphone"></i> ${k.Publish === 'Ya' ? 'Terpublikasi · Batalkan' : 'Publish'}</button><button class="btn btn-sm btn-outline-primary" onclick="fEdit('kegiatan',KG[${i}])"><i class="bi bi-pencil"></i> Ubah</button>` : ''}${can('hapus') ? `<button class="btn btn-sm btn-outline-danger" aria-label="Hapus" onclick="del('Kegiatan','${k.ID}','kegiatan')"><i class="bi bi-trash"></i></button>` : ''}</div></div></div></div>`).join('') || '<p class="text-muted">Belum ada kegiatan.</p>';
    });
  },
  grafik() {
    $('app').innerHTML = `<div class="container py-4"><h2 class="h4 mb-3">Laporan Grafik</h2><div class="row g-3"><div class="col-lg-5"><div class="cardx p-3"><h3 class="h6">Pendonor aktif per golongan darah</h3><canvas id="c1" aria-label="Grafik pendonor"></canvas></div></div><div class="col-lg-7"><div class="cardx p-3"><h3 class="h6">Permintaan per golongan darah per bulan</h3><canvas id="c2" aria-label="Grafik permintaan"></canvas></div></div></div></div>`;
    L('dashboard', [S.t], d => {
      Object.values(CH).forEach(c => c.destroy());
      const col = ['#D90429', '#EF233C', '#1C7293', '#38A3A5', '#57CC99', '#0B2E4F', '#8A5800', '#74777e'];
      Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--mu');
      CH.a = new Chart($('c1'), { type: 'bar', data: { labels: G, datasets: [{ label: 'Pendonor aktif', data: G.map(g => d.pend[g]), backgroundColor: '#1C7293' }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } } });
      const ms = Object.keys(d.bln).sort();
      CH.b = new Chart($('c2'), { type: 'bar', data: { labels: ms, datasets: G.map((g, i) => ({ label: g, data: ms.map(m => d.bln[m][g]), backgroundColor: col[i] })) }, options: { scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } } });
    });
  }
};
// ── Form tambah / ubah (Pendonor, Permintaan, Kegiatan) ──
function fEdit(kind, row) {
  row = row || {}; const sp = SP[kind];
  $('ef').innerHTML = `<div class="cardx p-3 mb-3"><h3 class="h6">${row.ID ? 'Ubah' : 'Tambah'} ${LBL[kind]}</h3><form class="row g-2" onsubmit="simpanEdit(event,'${kind}')"><input type="hidden" id="f_ID" value="${esc(row.ID || '')}">${F(sp)}${kind === 'kegiatan' ? HINT_IMG : ''}<div class="col-12"><button class="btn btn-danger">Simpan</button> <button type="button" class="btn btn-outline-secondary" onclick="$('ef').innerHTML=''">Batal</button></div></form></div>`;
  sp.forEach(([c]) => { const e = $('f_' + c); if (e && row[c] != null) e.value = String(row[c]); });
  if (kind === 'kegiatan') { $('f_Gambar').addEventListener('input', prevImg); prevImg(); }
  window.scrollTo(0, 0);
}
function simpanEdit(e, kind) {
  e.preventDefault(); const o = V(SP[kind]); o.ID = $('f_ID').value;
  call({ pendonor: 'simpanPendonor', permintaan: 'simpanPermintaan', kegiatan: 'simpanKegiatan' }[kind], [S.t, o], (d, m) => { toast(m, 'success'); go(S.pg); });
}
const tmbl = k => canAdm('tambah') ? `<button class="btn btn-danger" onclick="fEdit('${k}')"><i class="bi bi-plus-lg"></i> Tambah</button>` : '';
const aksiP = (r, i) => (canAdm('ubah') ? (r.Kepesertaan === 'Menunggu Persetujuan'
  ? `<button class="btn btn-sm btn-success" onclick="kep('${r.ID}','Aktif')">Setujui</button> <button class="btn btn-sm btn-outline-secondary" onclick="kep('${r.ID}','Tidak Aktif')">Tolak</button>`
  : `<button class="btn btn-sm btn-outline-secondary" onclick="kep('${r.ID}','${r.Kepesertaan === 'Aktif' ? 'Tidak Aktif' : 'Aktif'}')">${r.Kepesertaan === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}</button>`)
  + ` <button class="btn btn-sm btn-outline-primary" onclick="fEdit('pendonor',TB.tb.data[${i}])"><i class="bi bi-pencil"></i> Ubah</button>` : '')
  + (can('hapus') ? ` <button class="btn btn-sm btn-outline-danger" aria-label="Hapus" onclick="del('Pendonor','${r.ID}','${S.pg}')"><i class="bi bi-trash"></i></button>` : '');
const aksiM = (r, i) => (canAdm('ubah') ? `<select class="form-select form-select-sm d-inline-block w-auto" aria-label="Ubah status" onchange="stat('${r.ID}',this.value)">${['Menunggu', 'Diproses', 'Terpenuhi', 'Dibatalkan'].map(o => `<option ${o === r.Status ? 'selected' : ''}>${o}</option>`).join('')}</select> <button class="btn btn-sm btn-outline-primary" onclick="fEdit('permintaan',TB.tb.data[${i}])"><i class="bi bi-pencil"></i> Ubah</button>` : '')
  + (can('hapus') ? ` <button class="btn btn-sm btn-outline-danger" aria-label="Hapus" onclick="del('Permintaan','${r.ID}','permintaan')"><i class="bi bi-trash"></i></button>` : '');
const adaAksi = () => canAdm('ubah') || can('hapus');

const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
const golCards = d => { const mx = Math.max(1, ...G.map(g => d.siap[g])); return G.map(g => { const kurang = d.req[g] > d.siap[g];
  return `<div class="col-6 col-md-3"><div class="cardx stat"><div class="d-flex justify-content-between"><span class="gd">${g}</span>${kurang ? '<span class="bd no">Butuh segera</span>' : ''}</div><div class="row text-center mt-2"><div class="col"><div class="num ok-t">${d.siap[g]}</div><small>Siap donor</small></div><div class="col"><div class="num cr">${d.req[g]}</div><small>Permintaan</small></div></div><div class="gauge mt-2 ${kurang ? 'low' : ''}"><i style="width:${Math.round(d.siap[g] / mx * 100)}%"></i></div></div></div>`; }).join(''); };
function sim() { // simulator kesiapan real-time pada form pendonor
  const jk = $('f_JK').value, dt = $('f_DonorTerakhir').value, el = $('sim'); if (!el) return;
  if (!jk) { el.innerHTML = '<div class="lbl">Simulator kesiapan</div><p class="small text-muted mb-0 mt-1">Pilih jenis kelamin dan isi tanggal donor terakhir untuk melihat kesiapan Anda.</p>'; return; }
  const bln = jk === 'Perempuan' ? 4 : 3; let cls = 'ok', tx = 'Siap donor sekarang', sub = 'Belum pernah donor atau jeda sudah terpenuhi.';
  if (dt) { const d = new Date(dt); d.setMonth(d.getMonth() + bln); const sisa = Math.ceil((d - new Date()) / 864e5);
    if (sisa > 0) { cls = sisa <= 14 ? 'wa' : 'no'; tx = (sisa <= 14 ? 'Menunggu — ' : 'Belum siap — ') + sisa + ' hari lagi'; sub = 'Siap pada ' + d.toLocaleDateString('id-ID', { dateStyle: 'long' }) + '.'; } }
  el.innerHTML = `<div class="lbl">Simulator kesiapan</div><div class="bd ${cls} mt-1">${tx}</div><p class="small text-muted mt-2 mb-0">Jeda wajib ${bln} bulan (${jk === 'Perempuan' ? 'wanita' : 'pria'}). ${sub}</p>`;
}

// ── Kegiatan terpublikasi (Home & Dashboard) ──
// Link gambar: ubah tautan "bagikan" Google Drive / Dropbox / Imgur menjadi alamat gambar langsung agar bisa tampil di <img>
const imgUrl = u => {
  u = String(u || '').trim(); let m;
  m = u.match(/drive\.google\.com\/file\/d\/([\w-]{10,})/) || u.match(/(?:drive|docs)\.google\.com\/(?:open|uc|thumbnail)\?[^#]*\bid=([\w-]{10,})/) || u.match(/lh3\.googleusercontent\.com\/d\/([\w-]{10,})/);
  if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1200';
  if (/^https?:\/\/(www\.)?dropbox\.com\//i.test(u)) { try { const x = new URL(u); x.searchParams.delete('dl'); x.searchParams.set('raw', '1'); return x.toString(); } catch (e) { } }
  m = u.match(/^https?:\/\/(?:www\.)?imgur\.com\/(\w+)$/i); if (m) return 'https://i.imgur.com/' + m[1] + '.jpg';
  return u.replace(/^http:\/\//i, 'https://');
};
const kgImg = k => {
  if (!k.Gambar) return ''; const u = imgUrl(k.Gambar), m = u.match(/thumbnail\?id=([\w-]+)/);
  return `<img src="${esc(u)}" ${m ? `data-alt="https://lh3.googleusercontent.com/d/${m[1]}"` : ''} alt="${esc(k.Judul)}" loading="lazy" referrerpolicy="no-referrer" onerror="imgErr(this)">`;
};
function imgErr(i) { // coba alamat cadangan sekali, lalu tampilkan penanda jelas (bukan gambar rusak)
  if (i.dataset.alt && !i.dataset.t) { i.dataset.t = 1; i.src = i.dataset.alt; return; }
  i.outerHTML = '<div class="kgph"><i class="bi bi-image fs-4"></i><span>Gambar tidak dapat dimuat.<br>Pastikan link dapat dibuka publik.</span></div>';
}
const HINT_IMG = '<div class="col-12"><div id="gpv" class="kg mb-2" style="max-width:320px"></div><small>Gambar: JPG/PNG/WebP, landscape 16:9 (mis. 1200×675 px), maks 1 MB. Link Google Drive harus diatur &quot;Siapa saja yang memiliki link&quot;. Link album atau folder tidak didukung.</small></div>';
const prevImg = () => { const u = ($('f_Gambar') || {}).value, el = $('gpv'); if (el) el.innerHTML = u ? kgImg({ Gambar: u, Judul: 'Pratinjau' }) : ''; };
const kgCards = l => l.map(k => `<div class="col-md-4"><div class="cardx h-100">${kgImg(k)}<div class="p-3"><small>${esc(k.Tanggal)}</small><h3 class="h6 mt-1">${esc(k.Judul)}</h3><p class="small">${esc(k.Isi)}</p>${k.Video ? `<a class="small" href="${esc(k.Video)}" target="_blank" rel="noopener"><i class="bi bi-play-circle"></i> Video</a>` : ''}</div></div></div>`).join('') || '<p class="text-muted">Belum ada kegiatan yang dipublikasikan.</p>';
const pub = (id, v) => call('publishKegiatan', [S.t, id, !!v], (d, m) => { toast(m, 'success'); go('kegiatan'); });

function lgFilter() {
  const f = $('lgf') ? $('lgf').value : '';
  tbl('tb', [['Waktu', 'Waktu'], ['User', 'Pengguna'], ['Aksi', 'Aksi'], ['Data', 'Keterangan']], f ? LOG.filter(r => (r.Aksi + ' ' + r.Data).toLowerCase().includes(f)) : LOG, null);
}

// ── Kelola pengguna (Super Admin) ──
function fUser(u) {
  u = u || {}; const hk = u.HakList || ['tambah', 'ubah', 'hapus', 'print'], mn = u.MenuList || ['dashboard', 'siap', 'permintaan'];
  $('uf').innerHTML = `<div class="cardx p-3 mb-3"><form class="row g-2" onsubmit="saveUser(event)"><input type="hidden" id="f_orig" value="${esc(u.Username || '')}">
  <div class="col-md-3"><label class="form-label" for="f_Username">User ID *</label><input class="form-control" id="f_Username" required value="${esc(u.Username || '')}" autocapitalize="none" autocomplete="off"></div>
  <div class="col-md-3"><label class="form-label" for="f_Nama">Nama</label><input class="form-control" id="f_Nama" value="${esc(u.Nama || '')}"></div>
  <div class="col-md-3"><label class="form-label" for="f_Peran">Peran *</label><select class="form-select" id="f_Peran" onchange="togMenu()">${['Super Admin', 'Admin', 'Tamu'].map(o => `<option ${o === (u.Peran || 'Admin') ? 'selected' : ''}>${o}</option>`).join('')}</select></div>
  <div class="col-md-3"><label class="form-label" for="f_Password">Password ${u.Username ? '(kosong = tidak diganti)' : '*'}</label><input class="form-control" id="f_Password" type="password" autocomplete="new-password" minlength="6" ${u.Username ? '' : 'required'}></div>
  <div class="col-12"><span class="form-label d-block">Hak akses (Super Admin otomatis penuh; Tambah &amp; Ubah hanya berfungsi untuk peran Admin dan Super Admin)</span>${[['tambah', 'Tambah'], ['ubah', 'Ubah'], ['hapus', 'Hapus'], ['upload', 'Upload template Excel'], ['print', 'Print selection']].map(([k, l]) => `<label class="me-3"><input type="checkbox" class="hk" value="${k}" ${hk.includes(k) ? 'checked' : ''}> ${l}</label>`).join('')}</div>
  <div class="col-12"><span class="form-label d-block">Menu yang boleh dilihat (hanya untuk peran selain Super Admin &amp; Admin)</span>${[['dashboard', 'Dashboard'], ['siap', 'Siap Donor'], ['permintaan', 'Permintaan Darah'], ['pendonor', 'Pendonor'], ['kegiatan', 'Kegiatan'], ['grafik', 'Grafik']].map(([k, l]) => `<label class="me-3"><input type="checkbox" class="mn" value="${k}" ${mn.includes(k) ? 'checked' : ''}> ${l}</label>`).join('')}</div>
  <div class="col-12"><button class="btn btn-danger">Simpan</button> <button type="button" class="btn btn-outline-secondary" onclick="$('uf').innerHTML=''">Batal</button></div></form></div>`;
  togMenu(); window.scrollTo(0, 0);
}
const togMenu = () => { const off = ['Super Admin', 'Admin'].includes($('f_Peran').value); document.querySelectorAll('.mn').forEach(c => c.disabled = off); };
function saveUser(e) {
  e.preventDefault();
  const d = { orig: $('f_orig').value, Username: $('f_Username').value.trim(), Nama: $('f_Nama').value.trim(), Peran: $('f_Peran').value, Password: $('f_Password').value, Hak: [...document.querySelectorAll('.hk:checked')].map(c => c.value), Menu: [...document.querySelectorAll('.mn:checked')].map(c => c.value) };
  call('simpanPengguna', [S.t, d], (x, m) => { toast(m, 'success'); go('pengguna'); });
}
const delUser = u => ask('Hapus pengguna "' + u + '"?', () => call('hapusPengguna', [S.t, u], (d, m) => { toast(m, 'success'); go('pengguna'); }));

// ── Upload template Excel/CSV (hak: upload) ──
function templateCsv() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeffNama,Umur,JK,Golda,NoHP,Kota,Alamat,Email,DonorTerakhir\nContoh Nama,30,Laki-laki,O+,081234567890,Palembang,Jl. Contoh 1,,2026-05-01'], { type: 'text/csv' }));
  a.download = 'template_pendonor.csv'; a.click();
}
function pilihExcel(e) {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    const ws = XLSX.read(r.result, { type: 'array', cellDates: true }), sh = ws.Sheets[ws.SheetNames[0]];
    const list = XLSX.utils.sheet_to_json(sh, { raw: false, dateNF: 'yyyy-mm-dd', defval: '' });
    ask('Impor ' + list.length + ' baris pendonor dari "' + f.name + '"?', () => call('importPendonor', [S.t, list], (d, m) => { toast(m + (d.nErr ? ' ' + d.err.join('; ') : ''), d.nErr ? 'warning' : 'success'); go('pendonor'); }));
  };
  r.readAsArrayBuffer(f);
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  let th = 'light'; try { th = localStorage.getItem('theme') || 'light'; } catch (e) { }
  document.documentElement.dataset.theme = th; document.documentElement.dataset.bsTheme = th;
  try { const x = JSON.parse(sessionStorage.getItem('sim') || 'null'); if (x && x.t) Object.assign(S, x); } catch (e) { }
  go(S.t ? (S.m.includes('dashboard') ? 'dashboard' : (S.m[0] || 'info')) : 'info');
});
