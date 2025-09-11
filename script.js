// Global variables
let playlist = [];
let currentSongIndex = 0;
let isPlaying = false;
let isShuffled = false;
let repeatMode = 0; // 0: no repeat, 1: repeat all, 2: repeat one
let currentVolume = 0.8;
let audioContext;
let analyser;
let dataArray;
let sourceNode;

// DOM elements
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');
const currentTime = document.getElementById('currentTime');
const totalTime = document.getElementById('totalTime');
const progress = document.getElementById('progress');
const progressHandle = document.getElementById('progressHandle');
const progressBar = document.getElementById('progressBar');
const volumeProgress = document.getElementById('volumeProgress');
const volumeHandle = document.getElementById('volumeHandle');
const volumeBar = document.getElementById('volumeBar');
const songUrl = document.getElementById('songUrl');
const addSongBtn = document.getElementById('addSongBtn');
const playlistItems = document.getElementById('playlistItems');
const visualizerCanvas = document.getElementById('visualizer');
const dotsCanvas = document.getElementById('dotsCanvas');

// Initialize Web Audio API for visualizer
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        if (!sourceNode) {
            sourceNode = audioContext.createMediaElementSource(audioPlayer);
            sourceNode.connect(analyser);
            analyser.connect(audioContext.destination);
        }
    }
}

// Dynamic Dots Background
let dots = [];
const numDots = 50;

function initCanvas() {
    const canvas = dotsCanvas;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Create dots
    for (let i = 0; i < numDots; i++) {
        dots.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 3 + 1,
            opacity: Math.random() * 0.5 + 0.2
        });
    }
}

function animateDots() {
    const canvas = dotsCanvas;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    dots.forEach(dot => {
        // Update position
        dot.x += dot.vx;
        dot.y += dot.vy;
        
        // Wrap around edges
        if (dot.x < 0) dot.x = canvas.width;
        if (dot.x > canvas.width) dot.x = 0;
        if (dot.y < 0) dot.y = canvas.height;
        if (dot.y > canvas.height) dot.y = 0;
        
        // Draw dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 65, ${dot.opacity})`;
        ctx.fill();
    });
    
    requestAnimationFrame(animateDots);
}

// Audio visualizer
function drawVisualizer() {
    if (!analyser || !dataArray) return;
    
    analyser.getByteFrequencyData(dataArray);
    
    const canvas = visualizerCanvas;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, 'rgba(0, 255, 65, 0.8)');
    gradient.addColorStop(0.5, 'rgba(0, 255, 65, 0.6)');
    gradient.addColorStop(1, 'rgba(0, 255, 65, 0.2)');
    
    const barWidth = width / dataArray.length * 2.5;
    let x = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        // Add glow effect
        ctx.shadowColor = '#00ff41';
        ctx.shadowBlur = 10;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        ctx.shadowBlur = 0;
        
        x += barWidth + 1;
    }
    
    if (isPlaying) {
        requestAnimationFrame(drawVisualizer);
    }
}

// Mouse and touch events for dots
window.addEventListener('resize', () => {
    dotsCanvas.width = window.innerWidth;
    dotsCanvas.height = window.innerHeight;
});

// Initialize dots animation
initCanvas();
animateDots();

// Audio Player Functions
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateProgress() {
    if (audioPlayer.duration) {
        const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progress.style.width = `${progressPercent}%`;
        progressHandle.style.left = `${progressPercent}%`;
        currentTime.textContent = formatTime(audioPlayer.currentTime);
    }
}

function updateVolume() {
    audioPlayer.volume = currentVolume;
    const volumePercent = currentVolume * 100;
    volumeProgress.style.width = `${volumePercent}%`;
    volumeHandle.style.left = `${volumePercent}%`;
}

function loadSong(index) {
    if (playlist.length === 0) return;
    
    currentSongIndex = index;
    const song = playlist[currentSongIndex];
    
    audioPlayer.src = song.url;
    songTitle.textContent = song.title;
    songArtist.textContent = song.artist;
    
    renderPlaylist();
    
    // Initialize audio context when loading a song
    initAudioContext();
}

function playPause() {
    if (playlist.length === 0) return;
    
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    if (isPlaying) {
        audioPlayer.pause();
        playPauseBtn.textContent = '▶';
        isPlaying = false;
    } else {
        audioPlayer.play();
        playPauseBtn.textContent = '⏸';
        isPlaying = true;
        drawVisualizer(); // Start visualizer when playing
    }
}

function nextSong() {
    if (playlist.length === 0) return;
    
    if (isShuffled) {
        currentSongIndex = Math.floor(Math.random() * playlist.length);
    } else {
        currentSongIndex = (currentSongIndex + 1) % playlist.length;
    }
    
    loadSong(currentSongIndex);
    if (isPlaying) {
        audioPlayer.play();
    }
}

function prevSong() {
    if (playlist.length === 0) return;
    
    if (isShuffled) {
        currentSongIndex = Math.floor(Math.random() * playlist.length);
    } else {
        currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
    }
    
    loadSong(currentSongIndex);
    if (isPlaying) {
        audioPlayer.play();
    }
}

function toggleShuffle() {
    isShuffled = !isShuffled;
    shuffleBtn.classList.toggle('active', isShuffled);
}

function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    repeatBtn.classList.toggle('active', repeatMode > 0);
    
    const repeatSymbols = ['🔁', '🔂', '🔂'];
    repeatBtn.textContent = repeatSymbols[repeatMode];
}

function addSong() {
    const url = songUrl.value.trim();
    if (!url) return;
    
    // Extract song info from URL (basic implementation)
    let title = 'Unknown Title';
    let artist = 'Unknown Artist';
    
    // Try to extract title from URL
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    if (filename.includes('.')) {
        const nameWithoutExt = filename.split('.')[0];
        const decoded = decodeURIComponent(nameWithoutExt);
        
        // Try to split artist and title
        if (decoded.includes(' - ')) {
            const parts = decoded.split(' - ');
            title = parts[1] || parts[0];
            artist = parts[0];
        } else {
            title = decoded.replace(/[_-]/g, ' ');
        }
    }
    
    const song = {
        title: title,
        artist: artist,
        url: url
    };
    
    playlist.push(song);
    songUrl.value = '';
    renderPlaylist();
    
    // If this is the first song, load it
    if (playlist.length === 1) {
        loadSong(0);
    }
}

function removeSong(index) {
    playlist.splice(index, 1);
    
    if (currentSongIndex >= index && currentSongIndex > 0) {
        currentSongIndex--;
    }
    
    renderPlaylist();
    
    if (playlist.length === 0) {
        audioPlayer.pause();
        songTitle.textContent = 'No track selected';
        songArtist.textContent = 'Unknown Artist';
        playPauseBtn.textContent = '▶';
        isPlaying = false;
    } else if (index === currentSongIndex) {
        loadSong(currentSongIndex);
    }
}

function renderPlaylist() {
    playlistItems.innerHTML = '';
    
    playlist.forEach((song, index) => {
        const item = document.createElement('div');
        item.className = `playlist-item ${index === currentSongIndex ? 'active' : ''}`;
        item.onclick = () => {
            loadSong(index);
            if (isPlaying) {
                audioPlayer.play();
            }
        };
        
        item.innerHTML = `
            <div class="play-icon">${index === currentSongIndex && isPlaying ? '♪' : '♫'}</div>
            <div class="song-details">
                <div class="song-name">${song.title}</div>
                <div class="artist-name">${song.artist}</div>
            </div>
            <button class="remove-btn" onclick="event.stopPropagation(); removeSong(${index})">✕</button>
        `;
        
        playlistItems.appendChild(item);
    });
}

// Event Listeners
playPauseBtn.addEventListener('click', playPause);
nextBtn.addEventListener('click', nextSong);
prevBtn.addEventListener('click', prevSong);
shuffleBtn.addEventListener('click', toggleShuffle);
repeatBtn.addEventListener('click', toggleRepeat);
addSongBtn.addEventListener('click', addSong);

// URL input enter key
songUrl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addSong();
    }
});

// Progress bar interaction
progressBar.addEventListener('click', (e) => {
    if (audioPlayer.duration) {
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioPlayer.currentTime = percent * audioPlayer.duration;
    }
});

// Volume bar interaction
volumeBar.addEventListener('click', (e) => {
    const rect = volumeBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    currentVolume = Math.max(0, Math.min(1, percent));
    updateVolume();
});

// Audio events
audioPlayer.addEventListener('timeupdate', updateProgress);

audioPlayer.addEventListener('loadedmetadata', () => {
    totalTime.textContent = formatTime(audioPlayer.duration);
    updateProgress();
});

audioPlayer.addEventListener('ended', () => {
    if (repeatMode === 2) {
        // Repeat one
        audioPlayer.currentTime = 0;
        audioPlayer.play();
    } else if (repeatMode === 1 || currentSongIndex < playlist.length - 1) {
        // Repeat all or not last song
        nextSong();
    } else {
        // End of playlist
        playPauseBtn.textContent = '▶';
        isPlaying = false;
    }
});

audioPlayer.addEventListener('play', () => {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    drawVisualizer();
});

audioPlayer.addEventListener('pause', () => {
    isPlaying = false;
});

// Initialize volume
updateVolume();

// Add default song
const defaultSong = {
    title: 'Jaatta Ka Chhora',
    artist: 'Mika Singh',
    url: 'https://p320.djpunjab.is/data/320/2408/25456/Jaatta%20Ka%20Chhora%20-%20Mika%20Singh.mp3'
};

playlist.push(defaultSong);
loadSong(0);
renderPlaylist();
 