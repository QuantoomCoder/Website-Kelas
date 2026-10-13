'use strict';

const STORAGE_KEY = 'kelasXRPLSiteDataV1';
const MAX_PHOTOS_PER_GALLERY = 12;
const MAX_IMAGE_DIMENSION = 1200;
const IMAGE_QUALITY = 0.76;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const defaultState = () => ({
  teacher: { name: 'Nama Wali Kelas', role: 'Wali Kelas · X RPL', photo: '' },
  classPhoto: '',
  students: [
    { id: makeId(), name: 'Ahmad Rizki Pratama' },
    { id: makeId(), name: 'Aisyah Putri Lestari' },
    { id: makeId(), name: 'Bagas Dwi Ananda' },
    { id: makeId(), name: 'Citra Dewi Ramadhani' },
    { id: makeId(), name: 'Dimas Aditya Saputra' }
  ],
  events: [
    { id: makeId(), day: 18, month: 'Okt', title: 'Diskusi Project', description: 'Diskusi ide project kelas.' },
    { id: makeId(), day: 25, month: 'Okt', title: 'Class Meeting', description: 'Lomba dan kegiatan antar kelas.' },
    { id: makeId(), day: 2, month: 'Nov', title: 'Presentasi Project', description: 'Jadwal presentasi hasil project.' }
  ],
  photos: createPhotoSlots(['Foto kegiatan', 'Belajar bersama', 'Class meeting', 'Momen seru']),
  widePhotos: createPhotoSlots(['Foto kelas', 'Kegiatan lomba', 'Study tour', 'Momen bersama']),
  notice: 'Belum ada pengumuman. Tambahkan informasi penting untuk teman-teman sekelas.'
});

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function createPhotoSlots(captions) {
  return captions.map((caption) => ({ id: makeId(), caption, src: '' }));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const stored = JSON.parse(raw);
    const fallback = defaultState();
    return {
      ...fallback,
      ...stored,
      teacher: { ...fallback.teacher, ...(stored.teacher || {}) },
      students: Array.isArray(stored.students) ? stored.students : fallback.students,
      events: Array.isArray(stored.events) ? stored.events : fallback.events,
      photos: Array.isArray(stored.photos) ? stored.photos : fallback.photos,
      widePhotos: Array.isArray(stored.widePhotos) ? stored.widePhotos : fallback.widePhotos,
      notice: typeof stored.notice === 'string' ? stored.notice : fallback.notice,
      classPhoto: typeof stored.classPhoto === 'string' ? stored.classPhoto : ''
    };
  } catch (error) {
    console.warn('Data website tidak bisa dibaca; menggunakan data awal.', error);
    return defaultState();
  }
}

let state = loadState();
let editingStudentId = null;
let toastTimeout = null;

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.warn('Penyimpanan browser penuh atau tidak tersedia.', error);
    showToast('Perubahan terlihat, tetapi tidak bisa disimpan. Hapus beberapa foto atau cek penyimpanan browser.');
    return false;
  }
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => { toast.hidden = true; }, 3000);
}

function openDialog(id) {
  const dialog = document.getElementById(id);
  if (!dialog) return;
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else showToast('Browser tidak mendukung dialog. Coba gunakan browser yang lebih baru.');
}

function closeDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog?.open) dialog.close();
}

function bindDialogCloseButtons() {
  $$('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => closeDialog(button.dataset.closeDialog));
  });
  $$('.modal').forEach((dialog) => {
    // Klik backdrop menutup dialog; klik isi dialog tidak menutupnya.
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
}

function renderHero() {
  const classImage = $('#classPhoto');
  const classPlaceholder = $('#classPhotoPlaceholder');
  classImage.hidden = !state.classPhoto;
  classPlaceholder.hidden = Boolean(state.classPhoto);
  if (state.classPhoto) classImage.src = state.classPhoto;

  const teacherImage = $('#teacherPhoto');
  const teacherPlaceholder = $('#teacherPhotoPlaceholder');
  teacherImage.hidden = !state.teacher.photo;
  teacherPlaceholder.hidden = Boolean(state.teacher.photo);
  if (state.teacher.photo) teacherImage.src = state.teacher.photo;

  $('#teacherName').textContent = state.teacher.name;
  $('#teacherRole').textContent = state.teacher.role;
}

function renderStudents() {
  const list = $('#studentList');
  list.replaceChildren();
  $('#studentCount').textContent = `${state.students.length} siswa`;

  if (state.students.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'Belum ada nama siswa. Tekan “Tambah” untuk memulai.';
    list.append(empty);
    return;
  }

  state.students.forEach((student, index) => {
    const item = document.createElement('li');
    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    avatar.textContent = String(index + 1).padStart(2, '0');
    avatar.setAttribute('aria-hidden', 'true');

    const name = document.createElement('span');
    name.className = 'student-name';
    name.textContent = student.name;

    const actions = document.createElement('div');
    actions.className = 'row-actions';
    const editButton = makeIconButton('✎', `Edit ${student.name}`, () => beginEditStudent(student.id));
    const deleteButton = makeIconButton('×', `Hapus ${student.name}`, () => deleteStudent(student.id), true);
    actions.append(editButton, deleteButton);
    item.append(avatar, name, actions);
    list.append(item);
  });
}

function makeIconButton(text, label, onClick, danger = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `icon-button${danger ? ' delete' : ''}`;
  button.textContent = text;
  button.setAttribute('aria-label', label);
  button.title = label;
  button.addEventListener('click', onClick);
  return button;
}

function beginAddStudent() {
  editingStudentId = null;
  $('#studentDialogTitle').textContent = 'Tambah Siswa';
  $('#studentNameInput').value = '';
  openDialog('studentDialog');
  $('#studentNameInput').focus();
}

function beginEditStudent(id) {
  const student = state.students.find((item) => item.id === id);
  if (!student) return;
  editingStudentId = id;
  $('#studentDialogTitle').textContent = 'Edit Nama Siswa';
  $('#studentNameInput').value = student.name;
  openDialog('studentDialog');
  $('#studentNameInput').focus();
}

function deleteStudent(id) {
  const student = state.students.find((item) => item.id === id);
  if (!student) return;
  if (!window.confirm(`Hapus nama “${student.name}” dari daftar?`)) return;
  state.students = state.students.filter((item) => item.id !== id);
  saveState();
  renderStudents();
  showToast('Nama siswa dihapus.');
}

function saveStudent(event) {
  event.preventDefault();
  const name = $('#studentNameInput').value.trim();
  if (!name) {
    $('#studentNameInput').focus();
    showToast('Nama siswa tidak boleh kosong.');
    return;
  }
  if (editingStudentId) {
    const student = state.students.find((item) => item.id === editingStudentId);
    if (student) student.name = name;
    showToast('Nama siswa diperbarui.');
  } else {
    state.students.push({ id: makeId(), name });
    showToast('Siswa berhasil ditambahkan.');
  }
  saveState();
  renderStudents();
  closeDialog('studentDialog');
}

function renderEvents() {
  const list = $('#eventList');
  list.replaceChildren();
  if (state.events.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Belum ada event. Tambahkan agenda kelas.';
    list.append(empty);
    return;
  }

  state.events.forEach((item, index) => {
    const row = document.createElement('article');
    row.className = 'event-item';

    const dateBox = document.createElement('div');
    dateBox.className = `date-box${index % 2 ? ' yellow' : ''}`;
    const day = document.createElement('strong');
    day.textContent = String(item.day);
    const month = document.createElement('small');
    month.textContent = item.month;
    dateBox.append(day, month);

    const copy = document.createElement('div');
    copy.className = 'event-copy';
    const title = document.createElement('strong');
    title.textContent = item.title;
    const description = document.createElement('small');
    description.textContent = item.description || 'Belum ada keterangan';
    copy.append(title, description);

    const actions = document.createElement('div');
    actions.className = 'event-actions';
    actions.append(
      makeIconButton('✎', `Edit event ${item.title}`, () => beginEditEvent(item.id)),
      makeIconButton('×', `Hapus event ${item.title}`, () => deleteEvent(item.id), true)
    );
    row.append(dateBox, copy, actions);
    list.append(row);
  });
}

function beginAddEvent() {
  $('#eventDialogTitle').textContent = 'Tambah Event';
  $('#eventIdInput').value = '';
  $('#eventTitleInput').value = '';
  $('#eventDayInput').value = '1';
  $('#eventMonthInput').value = 'Okt';
  $('#eventDescriptionInput').value = '';
  openDialog('eventDialog');
  $('#eventTitleInput').focus();
}

function beginEditEvent(id) {
  const item = state.events.find((event) => event.id === id);
  if (!item) return;
  $('#eventDialogTitle').textContent = 'Edit Event';
  $('#eventIdInput').value = item.id;
  $('#eventTitleInput').value = item.title;
  $('#eventDayInput').value = String(item.day);
  $('#eventMonthInput').value = item.month;
  $('#eventDescriptionInput').value = item.description;
  openDialog('eventDialog');
  $('#eventTitleInput').focus();
}

function saveEvent(event) {
  event.preventDefault();
  const id = $('#eventIdInput').value;
  const title = $('#eventTitleInput').value.trim();
  const day = Number($('#eventDayInput').value);
  const month = $('#eventMonthInput').value;
  const description = $('#eventDescriptionInput').value.trim();
  if (!title || !Number.isInteger(day) || day < 1 || day > 31) {
    showToast('Periksa kembali nama acara dan tanggal.');
    return;
  }
  if (id) {
    const item = state.events.find((eventItem) => eventItem.id === id);
    if (item) Object.assign(item, { title, day, month, description });
    showToast('Event diperbarui.');
  } else {
    state.events.push({ id: makeId(), title, day, month, description });
    showToast('Event ditambahkan.');
  }
  saveState();
  renderEvents();
  closeDialog('eventDialog');
}

function deleteEvent(id) {
  const item = state.events.find((event) => event.id === id);
  if (!item || !window.confirm(`Hapus event “${item.title}”?`)) return;
  state.events = state.events.filter((event) => event.id !== id);
  saveState();
  renderEvents();
  showToast('Event dihapus.');
}

function renderGallery(containerId, stateKey) {
  const container = document.getElementById(containerId);
  container.replaceChildren();
  state[stateKey].forEach((photo) => {
    const card = document.createElement('article');
    card.className = 'photo-card';
    const visual = document.createElement('div');
    visual.className = 'photo-visual';

    if (photo.src) {
      const image = document.createElement('img');
      image.src = photo.src;
      image.alt = photo.caption || 'Foto kegiatan kelas';
      image.loading = 'lazy';
      visual.append(image);
    } else {
      const empty = document.createElement('div');
      empty.className = 'photo-empty';
      const icon = document.createElement('span');
      icon.textContent = '＋';
      const caption = document.createElement('span');
      caption.textContent = photo.caption || 'Slot foto';
      const chooseLabel = document.createElement('label');
      chooseLabel.className = 'button button-yellow';
      chooseLabel.textContent = 'Pilih Foto';
      const input = document.createElement('input');
      input.className = 'visually-hidden';
      input.type = 'file';
      input.accept = 'image/*';
      input.setAttribute('aria-label', `Pilih foto untuk ${photo.caption}`);
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          photo.src = await imageFileToDataUrl(file);
          saveState();
          renderGallery(containerId, stateKey);
          showToast('Foto ditambahkan.');
        } catch (error) {
          console.error(error);
          showToast('Foto tidak bisa dibuka. Pilih file gambar lain.');
        }
      });
      chooseLabel.append(input);
      empty.append(icon, caption, chooseLabel);
      visual.append(empty);
    }

    const details = document.createElement('div');
    details.className = 'photo-details';
    const caption = document.createElement('span');
    caption.className = 'photo-caption';
    caption.textContent = photo.caption || 'Foto kelas';
    caption.title = photo.caption || 'Foto kelas';
    details.append(caption);
    details.append(makeIconButton('✎', 'Edit keterangan foto', () => editPhotoCaption(photo, containerId, stateKey)));
    details.append(makeIconButton('×', 'Hapus foto atau slot', () => deletePhoto(photo.id, containerId, stateKey), true));
    card.append(visual, details);
    container.append(card);
  });

  if (state[stateKey].length < MAX_PHOTOS_PER_GALLERY) {
    const addCard = document.createElement('button');
    addCard.type = 'button';
    addCard.className = 'photo-card photo-empty add-photo-card';
    addCard.innerHTML = '<span aria-hidden="true">＋</span><span>Tambah slot foto</span>';
    addCard.addEventListener('click', () => {
      const caption = window.prompt('Keterangan foto:', 'Momen kelas');
      if (caption === null) return;
      state[stateKey].push({ id: makeId(), caption: caption.trim() || 'Momen kelas', src: '' });
      saveState();
      renderGallery(containerId, stateKey);
      showToast('Slot foto ditambahkan.');
    });
    container.append(addCard);
  }
}

function editPhotoCaption(photo, containerId, stateKey) {
  const nextCaption = window.prompt('Ubah keterangan foto:', photo.caption || 'Foto kelas');
  if (nextCaption === null) return;
  photo.caption = nextCaption.trim() || 'Foto kelas';
  saveState();
  renderGallery(containerId, stateKey);
  showToast('Keterangan foto diperbarui.');
}

function deletePhoto(id, containerId, stateKey) {
  const photo = state[stateKey].find((item) => item.id === id);
  if (!photo) return;
  if (!window.confirm(`Hapus slot “${photo.caption || 'Foto kelas'}”?`)) return;
  state[stateKey] = state[stateKey].filter((item) => item.id !== id);
  saveState();
  renderGallery(containerId, stateKey);
  showToast('Slot foto dihapus.');
}

async function imageFileToDataUrl(file) {
  if (!file.type.startsWith('image/')) throw new Error('File bukan gambar.');
  const imageUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = imageUrl;
    await image.decode();
    const ratio = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas tidak tersedia.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

async function uploadHeroImage(input, property) {
  const file = input.files?.[0];
  if (!file) return;
  try {
    const dataUrl = await imageFileToDataUrl(file);
    if (property === 'classPhoto') state.classPhoto = dataUrl;
    else state.teacher.photo = dataUrl;
    saveState();
    renderHero();
    showToast(property === 'classPhoto' ? 'Foto kelas diperbarui.' : 'Foto guru diperbarui.');
  } catch (error) {
    console.error(error);
    showToast('Foto tidak bisa dibuka. Coba pilih gambar lain.');
  } finally {
    input.value = '';
  }
}

async function uploadGalleryFiles(input, stateKey, containerId) {
  const files = [...(input.files || [])].filter((file) => file.type.startsWith('image/'));
  input.value = '';
  if (files.length === 0) return;
  const available = MAX_PHOTOS_PER_GALLERY - state[stateKey].length;
  if (available <= 0) {
    showToast(`Maksimal ${MAX_PHOTOS_PER_GALLERY} slot foto per galeri.`);
    return;
  }
  const selected = files.slice(0, available);
  let added = 0;
  for (const file of selected) {
    try {
      const src = await imageFileToDataUrl(file);
      state[stateKey].push({ id: makeId(), caption: file.name.replace(/\.[^.]+$/, '').slice(0, 60) || 'Momen kelas', src });
      added += 1;
    } catch (error) {
      console.warn('Lewati gambar yang gagal diproses.', error);
    }
  }
  if (added > 0) {
    saveState();
    renderGallery(containerId, stateKey);
    showToast(`${added} foto ditambahkan${files.length > available ? `. Maksimal ${MAX_PHOTOS_PER_GALLERY} foto per galeri.` : '.'}`);
  } else {
    showToast('Tidak ada foto yang berhasil diproses.');
  }
}

function openTeacherEditor() {
  $('#teacherNameInput').value = state.teacher.name;
  $('#teacherRoleInput').value = state.teacher.role;
  openDialog('teacherDialog');
  $('#teacherNameInput').focus();
}

function saveTeacher(event) {
  event.preventDefault();
  const name = $('#teacherNameInput').value.trim();
  const role = $('#teacherRoleInput').value.trim();
  if (!name || !role) {
    showToast('Nama dan jabatan guru harus diisi.');
    return;
  }
  state.teacher.name = name;
  state.teacher.role = role;
  saveState();
  renderHero();
  closeDialog('teacherDialog');
  showToast('Profil guru diperbarui.');
}

function openNoticeEditor() {
  $('#noticeInput').value = state.notice;
  openDialog('noticeDialog');
  $('#noticeInput').focus();
}

function saveNotice(event) {
  event.preventDefault();
  state.notice = $('#noticeInput').value.trim() || 'Belum ada pengumuman. Tambahkan informasi penting untuk teman-teman sekelas.';
  $('#noticeText').textContent = state.notice;
  saveState();
  closeDialog('noticeDialog');
  showToast('Pengumuman diperbarui.');
}

function setupMobileMenu() {
  const toggle = $('#menuToggle');
  const links = $('#navLinks');
  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Tutup menu' : 'Buka menu');
    toggle.textContent = isOpen ? '×' : '☰';
  });
  $$('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      $$('.nav-link').forEach((item) => item.classList.toggle('active', item === link));
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Buka menu');
      toggle.textContent = '☰';
    });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = '☰';
    }
  });
}

function initialize() {
  $('#currentYear').textContent = String(new Date().getFullYear());
  bindDialogCloseButtons();
  setupMobileMenu();
  renderHero();
  renderStudents();
  renderEvents();
  renderGallery('photoGrid', 'photos');
  renderGallery('wideGallery', 'widePhotos');
  $('#noticeText').textContent = state.notice;

  $('#addStudentButton').addEventListener('click', beginAddStudent);
  $('#studentForm').addEventListener('submit', saveStudent);
  $('#addEventButton').addEventListener('click', beginAddEvent);
  $('#eventForm').addEventListener('submit', saveEvent);
  $('#editTeacherButton').addEventListener('click', openTeacherEditor);
  $('#teacherForm').addEventListener('submit', saveTeacher);
  $('#editNoticeButton').addEventListener('click', openNoticeEditor);
  $('#noticeForm').addEventListener('submit', saveNotice);

  $('#classPhotoInput').addEventListener('change', (event) => uploadHeroImage(event.currentTarget, 'classPhoto'));
  $('#teacherPhotoInput').addEventListener('change', (event) => uploadHeroImage(event.currentTarget, 'teacherPhoto'));
  $('#galleryUpload').addEventListener('change', (event) => uploadGalleryFiles(event.currentTarget, 'photos', 'photoGrid'));
  $('#wideGalleryUpload').addEventListener('change', (event) => uploadGalleryFiles(event.currentTarget, 'widePhotos', 'wideGallery'));
}

document.addEventListener('DOMContentLoaded', initialize);
