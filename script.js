// Enhanced script with audio analysis and fixed volume
let audioContext;
let analyser;
let dataArray;
let source;

// Initialize audio context for visualizer
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        source = audioContext.createMediaElementSource(audioPlayer);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
    }
}

// Rhythm-responsive visualizer
function drawVisualizer() {
    if (!analyser) return;
    
    analyser.getByteFrequencyData(dataArray);
    
    const canvas = document.getElementById('visualizerCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 200;
    canvas.height = 80;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = canvas.width / dataArray.length * 2;
    let barHeight;
    let x = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;
        
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, '#00ff7f');
        gradient.addColorStop(1, '#66ff99');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        // Add glow effect
        ctx.shadowColor = '#00ff7f';
        ctx.shadowBlur = 3;
        
        x += barWidth + 1;
    }
    
    if (isPlaying) {
        requestAnimationFrame(drawVisualizer);
    }
}

// Fixed volume control
function updateVolume() {
    const volumePercent = volume * 100;
    volumeProgress.style.width = `${volumePercent}%`;
    volumeHandle.style.left = `${volumePercent}%`;
    audioPlayer.volume = volume;
}

// Music search functionality (demo - replace with actual API)
function searchMusic(query) {
    // This is a demo function. In reality, you'd need:
    // 1. A backend server to handle music search APIs
    // 2. Legal music streaming service integration
    // 3. Proper licensing for music content
    
    const demoResults = [
        {
            title: "Demo Song 1",
            artist: "Demo Artist 1",
            url: "https://www.soundjay.com/misc/sounds-723.mp3"
        },
        {
            title: "Demo Song 2", 
            artist: "Demo Artist 2",
            url: "https://www.soundjay.com/misc/sounds-724.mp3"
        }
    ];
    
    displaySearchResults(demoResults);
}

function displaySearchResults(results) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
        searchResults.style.display = 'none';
        return;
    }
    
    results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
            <div class="result-title">${result.title}</div>
            <div class="result-artist">${result.artist}</div>
        `;
        
        item.addEventListener('click', () => {
            const song = {
                title: result.title,
                artist: result.artist,
                url: result.url
            };
            playlist.push(song);
            renderPlaylist();
            searchResults.style.display = 'none';
            
            if (playlist.length === 1) {
                loadSong(0);
            }
        });
        
        searchResults.appendChild(item);
    });
    
    searchResults.style.display = 'block';
}

// Enhanced play function with visualizer
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
        // Initialize audio context on first play (required by browsers)
        if (!audioContext) {
            initAudioContext();
        }
        
        audioPlayer.play();
        playPauseBtn.textContent = '⏸';
        isPlaying = true;
        drawVisualizer(); // Start visualizer animation
    }
}

// Event listeners for search
document.getElementById('searchBtn').addEventListener('click', () => {
    const query = document.getElementById('searchInput').value.trim();
    if (query) {
        searchMusic(query);
    }
});

document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) {
            searchMusic(query);
        }
    }
});

// Hide search results when clicking outside
document.addEventListener('click', (e) => {
    const searchSection = document.querySelector('.search-section');
    if (!searchSection.contains(e.target)) {
        document.getElementById('searchResults').style.display = 'none';
    }
});
