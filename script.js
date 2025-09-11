// Global variables
let currentSongIndex = 0;
let isPlaying = false;
let isShuffling = false;
let isRepeating = false;
let currentTime = 0;
let duration = 0;
let volume = 0.7;
let playlist = [];

// DOM elements
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const progressBar = document.getElementById('progress');
const progressHandle = document.getElementById('progressHandle');
const progressContainer = document.querySelector('.progress-bar');
const currentTimeSpan = document.getElementById('currentTime');
const totalTimeSpan = document.getElementById('totalTime');
const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');
const songUrl = document.getElementById('songUrl');
const addSongBtn = document.getElementById('addSongBtn');
const playlistItems = document.getElementById('playlistItems');
const volumeProgress = document.getElementById('volumeProgress');
const volumeHandle = document.getElementById('volumeHandle');
const volumeBar = document.querySelector('.volume-bar');

// Dynamic Dots Background
const canvas = document.getElementById('dotsCanvas');
const ctx = canvas.getContext('2d');
let dots = [];
let mouse = { x: 0, y: 0 };

// Initialize canvas
function initCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Create dots
    dots = [];
    const numDots = 150;
    for (let i = 0; i < numDots; i++) {
        dots.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            opacity: Math.random() * 0.5 + 0.2
        });
    }
}

// Animate dots
function animateDots() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    dots.forEach(dot => {
        // Move dots
        dot.x += dot.speedX;
        dot.y += dot.speedY;
        
        // Bounce off edges
        if (dot.x < 0 || dot.x > canvas.width) dot.speedX *= -1;
        if (dot.y < 0 || dot.y > canvas.height) dot.speedY *= -1;
        
        // Mouse interaction
        const dist = Math.sqrt((mouse.x - dot.x) ** 2 + (mouse.y - dot.y) ** 2);
        if (dist < 100) {
            const force = (100 - dist) / 100;
            dot.x += (dot.x - mouse.x) * force * 0.02;
            dot.y += (dot.y - mouse.y) * force * 0.02;
            dot.opacity = Math.min(1, dot.opacity + force * 0.02);
        } else {
            dot.opacity = Math.max(0.2, dot.opacity - 0.01);
        }
        
        // Draw dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 127, ${dot.opacity})`;
        ctx.fill();
        
        // Draw connections
        dots.forEach(otherDot => {
            const distance = Math.sqrt((dot.x - otherDot.x) ** 2 + (dot.y - otherDot.y) ** 2);
            if (distance < 80) {
                ctx.beginPath();
                ctx.moveTo(dot.x, dot.y);
                ctx.lineTo(otherDot.x, otherDot.y);
                ctx.strokeStyle = `rgba(0, 255, 127, ${0.1 * (80 - distance) / 80})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        });
    });
    
    requestAnimationFrame(animateDots);
}

// Mouse and touch events for dots
document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

document.addEventListener('touchmove', (e) => {
    if (e.touches[0]) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    }
});

// Initialize dots animation
window.addEventListener('resize', initCanvas);
initCanvas();
animateDots();

// Audio Player Functions
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function updateProgress() {
    if (duration) {
        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
        progressHandle.style.left = `${progressPercent}%`;
        currentTimeSpan.textContent = formatTime(currentTime);
    }
}

function updateVolume() {
    const volumePercent = volume * 100;
    volumeProgress.style.width = `${volumePercent}%`;
    volumeHandle.style.left = `${volumePercent}%`;
    audioPlayer.volume = volume;
}

function loadSong(index) {
    if (playlist.length === 0) return;
    
    currentSongIndex = index;
    const song = playlist[currentSongIndex];
    audioPlayer.src = song.url;
    songTitle.textContent = song.title;
    songArtist.textContent = song.artist;
    
    // Update playlist visual
    document.querySelectorAll('.playlist-item').forEach((item, i) => {
        item.classList.toggle('active', i === currentSongIndex);
    });
}

function playPause() {
    if (playlist.length === 0) {
        alert('Please add songs to your playlist first!');
        return;
    }
    
    if (isPlaying) {
        audioPlayer.pause();
        playPauseBtn.textContent = '▶';
        isPlaying = false;
    } else {
        audioPlayer.play();
        playPauseBtn.textContent = '⏸';
        isPlaying = true;
    }
}

function nextSong() {
    if (playlist.length === 0) return;
    
    if (isShuffling) {
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
    
    if (currentTime > 3) {
        audioPlayer.currentTime = 0;
    } else {
        currentSongIndex = currentSongIndex === 0 ? playlist.length - 1 : currentSongIndex - 1;
        loadSong(currentSongIndex);
        if (isPlaying) {
            audioPlayer.play();
        }
    }
}

function toggleShuffle() {
    isShuffling = !isShuffling;
    shuffleBtn.classList.toggle('active', isShuffling);
}

function toggleRepeat() {
    isRepeating = !isRepeating;
    repeatBtn.classList.toggle('active', isRepeating);
}

function addSong() {
    const url = songUrl.value.trim();
    if (!url) return;
    
    // Extract song info from URL or use defaults
    let title = 'Unknown Song';
    let artist = 'Unknown Artist';
    
    // Try to extract info from URL
    if (url.includes('spotify.com')) {
        const match = url.match(/track\/([a-zA-Z0-9]+)/);
        if (match) {
            title = `Spotify Track ${match[1].substr(0, 8)}`;
            artist = 'Spotify';
        }
    } else if (url.includes('.mp3')) {
        const filename = url.split('/').pop().split('?')[0];
        title = filename.replace('.mp3', '').replace(/_/g, ' ');
    }
    
    const song = { title, artist, url };
    playlist.push(song);
    
    renderPlaylist();
    songUrl.value = '';
    
    // If this is the first song, load it
    if (playlist.length === 1) {
        loadSong(0);
    }
}

function removeSong(index) {
    playlist.splice(index, 1);
    if (currentSongIndex >= index) {
        currentSongIndex = Math.max(0, currentSongIndex - 1);
    }
    renderPlaylist();
    
    if (playlist.length === 0) {
        songTitle.textContent = 'No track selected';
        songArtist.textContent = 'Unknown Artist';
        audioPlayer.src = '';
    } else {
        loadSong(currentSongIndex);
    }
}

function renderPlaylist() {
    playlistItems.innerHTML = '';
    
    playlist.forEach((song, index) => {
        const item = document.createElement('div');
        item.className = 'playlist-item';
        item.innerHTML = `
            <div class="song-details">
                <div class="song-name">${song.title}</div>
                <div class="artist-name">${song.artist}</div>
            </div>
            <button class="remove-btn" onclick="removeSong(${index})">✕</button>
        `;
        
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('remove-btn')) {
                loadSong(index);
                if (isPlaying) {
                    audioPlayer.play();
                }
            }
        });
        
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
progressContainer.addEventListener('click', (e) => {
    if (duration) {
        const rect = progressContainer.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioPlayer.currentTime = percent * duration;
    }
});

// Volume bar interaction
volumeBar.addEventListener('click', (e) => {
    const rect = volumeBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    volume = Math.max(0, Math.min(1, percent));
    updateVolume();
});

// Audio events
audioPlayer.addEventListener('loadedmetadata', () => {
    duration = audioPlayer.duration;
    totalTimeSpan.textContent = formatTime(duration);
});

audioPlayer.addEventListener('timeupdate', () => {
    currentTime = audioPlayer.currentTime;
    updateProgress();
});

audioPlayer.addEventListener('ended', () => {
    if (isRepeating) {
        audioPlayer.currentTime = 0;
        audioPlayer.play();
    } else {
        nextSong();
    }
});

audioPlayer.addEventListener('play', () => {
    isPlaying = true;
    playPauseBtn.textContent = '⏸';
});

audioPlayer.addEventListener('pause', () => {
    isPlaying = false;
    playPauseBtn.textContent = '▶';
});

// Initialize volume
updateVolume();

// Add some demo songs (optional)
const demoSongs = [
    {
        title: "Demo Song 1",
        artist: "Demo Artist",
        url: "https://www.soundjay.com/misc/sounds-723.mp3"
    }
];

// Uncomment to add demo songs
// playlist = [...demoSongs];
// renderPlaylist();
// loadSong(0);
