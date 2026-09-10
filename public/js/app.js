// Tableau Server JWT Embed Portal Controller
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const serverHostEl = document.getElementById('serverHost');
  const tokenStatusTextEl = document.getElementById('tokenStatusText');
  const jwtStatusChip = document.getElementById('jwtStatusChip');
  const viewUrlInput = document.getElementById('viewUrlInput');
  const usernameInput = document.getElementById('usernameInput');
  const btnEmbed = document.getElementById('btnEmbed');
  const btnRefreshToken = document.getElementById('btnRefreshToken');
  const btnToggleDetails = document.getElementById('btnToggleDetails');
  const btnCloseDetails = document.getElementById('btnCloseDetails');
  const detailsDrawer = document.getElementById('tokenDetailsDrawer');
  const tokenHeaderDisplay = document.getElementById('tokenHeaderDisplay');
  const tokenPayloadDisplay = document.getElementById('tokenPayloadDisplay');
  const rawTokenDisplay = document.getElementById('rawTokenDisplay');
  const btnCopyToken = document.getElementById('btnCopyToken');
  const emptyState = document.getElementById('emptyState');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const overlaySubText = document.getElementById('overlaySubText');
  const errorOverlay = document.getElementById('errorOverlay');
  const errorMessage = document.getElementById('errorMessage');
  const btnRetry = document.getElementById('btnRetry');
  const vizMount = document.getElementById('tableauVizMount');
  const countdownText = document.getElementById('countdownText');
  const presetChips = document.querySelectorAll('.chip-btn');

  let currentTokenData = null;
  let countdownInterval = null;
  let activeViz = null;

  // 1. Load Server Config
  async function loadConfig() {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.serverUrl) {
        serverHostEl.textContent = new URL(data.serverUrl).hostname;
      }
      if (data.defaultViewUrl && !viewUrlInput.value) {
        viewUrlInput.value = data.defaultViewUrl;
      }
      if (data.defaultUsername && !usernameInput.value) {
        usernameInput.value = data.defaultUsername;
      }
    } catch (err) {
      console.warn('Failed to load /api/config:', err);
      serverHostEl.textContent = 'Offline';
    }
  }

  // 2. Fetch JWT Token from Backend
  async function fetchToken(username) {
    updateStatus('generating', 'Generating Token...');
    try {
      const res = await fetch('/api/tableau-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() })
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate token');
      }

      currentTokenData = data;
      displayTokenDetails(data.token);
      startCountdown(data.expiresAt);
      updateStatus('valid', 'Valid Token');
      return data.token;
    } catch (err) {
      console.error('Token fetch error:', err);
      updateStatus('error', 'Token Error');
      showError(`Gagal men-generate JWT Token: ${err.message}`);
      throw err;
    }
  }

  // 3. Decode & Display Token Details
  function displayTokenDetails(token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));

        tokenHeaderDisplay.textContent = JSON.stringify(header, null, 2);
        tokenPayloadDisplay.textContent = JSON.stringify(payload, null, 2);
        rawTokenDisplay.textContent = token;
      }
    } catch (e) {
      console.warn('Failed to decode token preview:', e);
    }
  }

  // 4. Mount Tableau Viz using Tableau Embedding API v3
  async function mountViz(viewUrl, username) {
    hideError();
    emptyState.classList.add('hidden');
    showLoading('Membuat sesi autentikasi JWT Connected Apps...');

    try {
      // Step A: Dapatkan token baru
      const token = await fetchToken(username);

      showLoading('Menginisialisasi Tableau Embedding API v3...');

      // Step B: Bersihkan viz lama jika ada
      vizMount.innerHTML = '';

      // Step C: Buat elemen <tableau-viz>
      const viz = document.createElement('tableau-viz');
      viz.id = 'activeTableauViz';
      viz.src = viewUrl.trim();
      viz.token = token;
      viz.setAttribute('toolbar', 'bottom');
      viz.setAttribute('hide-tabs', 'false');
      viz.setAttribute('device', 'default');
      viz.style.width = '100%';
      viz.style.height = '100%';

      // Event Listeners dari Tableau Embedding API v3
      viz.addEventListener('firstinteractive', (event) => {
        console.log('✅ Tableau Viz is interactive:', event);
        hideLoading();
        updateStatus('valid', 'Connected & Active');
      });

      viz.addEventListener('vizerror', (event) => {
        console.error('❌ Tableau Viz Error:', event);
        hideLoading();
        updateStatus('error', 'Embedding Error');
        const detail = event.detail ? JSON.stringify(event.detail) : 'Viz Error';
        showError(`Tableau Server mengembalikan error: ${detail}`);
      });

      // Safety timeout: jika 15 detik belum interactive, sembunyikan loading agar user bisa lihat pesan dari Tableau
      setTimeout(() => {
        hideLoading();
      }, 15000);

      activeViz = viz;
      vizMount.appendChild(viz);

    } catch (err) {
      hideLoading();
      showError(err.message);
    }
  }

  // 5. Status & UI Helper Functions
  function updateStatus(state, text) {
    tokenStatusTextEl.textContent = text;
    jwtStatusChip.className = 'status-chip';
    if (state === 'valid') jwtStatusChip.classList.add('active');
    else if (state === 'generating') jwtStatusChip.classList.add('warning');
    else if (state === 'error') jwtStatusChip.classList.add('error');
  }

  function showLoading(subtext) {
    overlaySubText.textContent = subtext || 'Sedang menghubungkan ke Tableau Server';
    loadingOverlay.classList.remove('hidden');
  }

  function hideLoading() {
    loadingOverlay.classList.add('hidden');
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorOverlay.classList.remove('hidden');
  }

  function hideError() {
    errorOverlay.classList.add('hidden');
  }

  function startCountdown(expiresAtIso) {
    if (countdownInterval) clearInterval(countdownInterval);

    const targetTime = new Date(expiresAtIso).getTime();

    function updateTimer() {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((targetTime - now) / 1000));

      const mins = Math.floor(diffSec / 60);
      const secs = diffSec % 60;
      const formatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

      countdownText.textContent = `Token Expiry: ${formatted}`;

      if (diffSec === 0) {
        clearInterval(countdownInterval);
        countdownText.textContent = 'Token Expired';
        updateStatus('error', 'Token Expired');
      } else if (diffSec < 60) {
        updateStatus('warning', 'Token Expiring');
      }
    }

    updateTimer();
    countdownInterval = setInterval(updateTimer, 1000);
  }

  // Event Handlers
  btnEmbed.addEventListener('click', () => {
    const url = viewUrlInput.value;
    const user = usernameInput.value;
    if (!url) {
      alert('Silakan masukkan link Tableau View URL');
      return;
    }
    mountViz(url, user);
  });

  btnRefreshToken.addEventListener('click', async () => {
    const user = usernameInput.value;
    try {
      showLoading('Memperbarui token JWT...');
      const token = await fetchToken(user);
      if (activeViz) {
        // Update token property on active tableau-viz
        activeViz.token = token;
      }
      hideLoading();
      alert('✅ Token JWT berhasil diperbarui!');
    } catch (e) {
      hideLoading();
    }
  });

  btnRetry.addEventListener('click', () => {
    btnEmbed.click();
  });

  btnToggleDetails.addEventListener('click', () => {
    detailsDrawer.classList.toggle('hidden');
  });

  btnCloseDetails.addEventListener('click', () => {
    detailsDrawer.classList.add('hidden');
  });

  btnCopyToken.addEventListener('click', () => {
    if (currentTokenData && currentTokenData.token) {
      navigator.clipboard.writeText(currentTokenData.token);
      btnCopyToken.textContent = 'Tersalin! ✓';
      setTimeout(() => { btnCopyToken.textContent = 'Salin Token'; }, 2000);
    }
  });

  // Preset Chips
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      presetChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      viewUrlInput.value = chip.getAttribute('data-url');
      btnEmbed.click();
    });
  });

  // Enter key support in inputs
  viewUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnEmbed.click();
  });
  usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnEmbed.click();
  });

  // Initial Boot
  loadConfig();
});
