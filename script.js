const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const canvas = $('#celebrationCanvas');
const ctx = canvas.getContext('2d');
let width = 0, height = 0, particles = [], animationFrame = 0, soundEnabled = false, audioContext = null, toastTimer;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth; height = window.innerHeight;
  canvas.width = width * ratio; canvas.height = height * ratio;
  canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function burst(x = width / 2, y = height / 2, amount = 100) {
  const colors = ['#f8e5b3', '#e8c783', '#ffffff', '#a9baff', '#e8a6bb'];
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 5.4;
    particles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      gravity: .045 + Math.random() * .055, life: 65 + Math.random() * 55,
      maxLife: 120, size: 1.2 + Math.random() * 2.7,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > .45 ? 'circle' : 'square',
      rotation: Math.random() * 6, spin: (Math.random() - .5) * .16
    });
  }
  if (!animationFrame) animateParticles();
}
function animateParticles() {
  ctx.clearRect(0, 0, width, height);
  particles = particles.filter(p => p.life > 0 && p.y < height + 50);
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.vx *= .992;
    p.life--; p.rotation += p.spin;
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 30));
    ctx.fillStyle = p.color;
    if (p.shape === 'square') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
      ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2); ctx.restore();
    } else {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
  });
  ctx.globalAlpha = 1;
  if (particles.length) animationFrame = requestAnimationFrame(animateParticles);
  else { cancelAnimationFrame(animationFrame); animationFrame = 0; ctx.clearRect(0, 0, width, height); }
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function playChime() {
  if (!soundEnabled) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, audioContext.currentTime + index * .12);
      gain.gain.exponentialRampToValueAtTime(.11, audioContext.currentTime + index * .12 + .035);
      gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + index * .12 + .45);
      oscillator.connect(gain); gain.connect(audioContext.destination);
      oscillator.start(audioContext.currentTime + index * .12);
      oscillator.stop(audioContext.currentTime + index * .12 + .5);
    });
  } catch (error) { console.warn('Audio is unavailable in this browser.', error); }
}

const sparkleField = $('#sparkleField');
for (let i = 0; i < 34; i++) {
  const star = document.createElement('span');
  star.className = 'tiny-star';
  star.textContent = Math.random() > .5 ? '✧' : '·';
  star.style.left = `${Math.random() * 100}%`;
  star.style.top = `${Math.random() * 100}%`;
  star.style.fontSize = `${8 + Math.random() * 13}px`;
  star.style.animationDelay = `${Math.random() * 4}s`;
  sparkleField.appendChild(star);
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: .12 });
$$('.reveal').forEach(el => observer.observe(el));

const modal = $('#welcomeModal');
function openModal() { modal.hidden = false; document.body.classList.add('modal-open'); $('#closeModal').focus(); }
function closeModal() { modal.hidden = true; document.body.classList.remove('modal-open'); $('#openMessage').focus(); }
$('#openMessage').addEventListener('click', openModal);
$('#closeModal').addEventListener('click', closeModal);
$$('[data-close="true"]').forEach(el => el.addEventListener('click', closeModal));
$('#modalCelebrate').addEventListener('click', () => { closeModal(); celebrate(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (!modal.hidden) closeModal();
    if (!$('#lightbox').hidden) closeLightbox();
  }
});

function celebrate() {
  burst(width * (.25 + Math.random() * .5), height * (.2 + Math.random() * .4), 150);
  setTimeout(() => burst(width * (.2 + Math.random() * .6), height * (.18 + Math.random() * .35), 115), 240);
  setTimeout(() => burst(width * (.15 + Math.random() * .7), height * (.2 + Math.random() * .35), 95), 480);
  playChime();
  showToast('A shower of blessings for Pastor David! ✨');
}
$('#celebrateButton').addEventListener('click', celebrate);

// Try background playback immediately, then retry from the first real user gesture.
// Browsers often block audible autoplay until the visitor taps/clicks the page.
const musicEmbed = $('#backgroundMusic');
let musicStarted = false;
function startWorshipMusic(fromGesture = false) {
  if (musicStarted && !fromGesture) return;
  const frame = document.createElement('iframe');
  frame.title = 'Background worship music: Fragrance To Fire by Dunsin Oyekan';
  frame.allow = 'autoplay; encrypted-media; picture-in-picture';
  frame.tabIndex = -1;
  frame.setAttribute('aria-hidden', 'true');
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.src = 'https://www.youtube.com/embed/gqIwEbCyxBo?autoplay=1&mute=0&controls=0&rel=0&playsinline=1&enablejsapi=1';
  musicEmbed.replaceChildren(frame);
  musicStarted = true;
}
startWorshipMusic();
function retryMusicOnFirstInteraction() {
  startWorshipMusic(true);
  window.removeEventListener('pointerdown', retryMusicOnFirstInteraction);
  window.removeEventListener('keydown', retryMusicOnFirstInteraction);
  window.removeEventListener('touchstart', retryMusicOnFirstInteraction);
}
window.addEventListener('pointerdown', retryMusicOnFirstInteraction, { once: true });
window.addEventListener('keydown', retryMusicOnFirstInteraction, { once: true });
window.addEventListener('touchstart', retryMusicOnFirstInteraction, { once: true, passive: true });

$('#copyMessage').addEventListener('click', async () => {
  const text = $$('.message-body p').map(p => p.textContent.trim()).join('\n\n');
  try {
    await navigator.clipboard.writeText(text);
    showToast('Birthday message copied — ready to share!');
  } catch {
    const area = document.createElement('textarea');
    area.value = text; area.style.position = 'fixed'; area.style.opacity = '0';
    document.body.appendChild(area); area.select();
    const copied = document.execCommand('copy'); area.remove();
    showToast(copied ? 'Birthday message copied — ready to share!' : 'Please select and copy the message manually.');
  }
});

const lightbox = $('#lightbox');
function closeLightbox() { lightbox.hidden = true; document.body.classList.remove('modal-open'); }
$$('.memory-card').forEach(card => card.addEventListener('click', () => {
  const image = $('img', card);
  $('#lightboxImage').src = card.dataset.image;
  $('#lightboxImage').alt = image.alt;
  $('#lightboxCaption').textContent = card.dataset.caption;
  lightbox.hidden = false;
  document.body.classList.add('modal-open');
}));
$('#lightboxClose').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });

// A gentle opening celebration that does not interrupt the visitor.
window.addEventListener('load', () => {
  setTimeout(() => burst(width * .82, height * .18, 45), 700);
});
