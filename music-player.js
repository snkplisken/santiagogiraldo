(function() {
  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) {
      return '0:00';
    }
    const floored = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(floored / 60);
    const secs = floored % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const clampIndex = (index, length) => {
    if (length === 0) {
      return 0;
    }
    return (index + length) % length;
  };

  document.addEventListener('DOMContentLoaded', () => {
    const playerElement = document.getElementById('musicPlayer');
    if (!playerElement) {
      return;
    }

    const audioElement = document.getElementById('audioElement');
    const titleElement = document.getElementById('musicTitle');
    const artistElement = document.getElementById('musicArtist');
    const currentTimeElement = document.getElementById('musicCurrentTime');
    const durationElement = document.getElementById('musicDuration');
    const progressElement = document.getElementById('musicProgress');
    const playlistElement = document.getElementById('music-playlist');

    let playlist = [];
    if (playlistElement) {
      try {
        const parsed = JSON.parse(playlistElement.textContent.trim());
        if (Array.isArray(parsed)) {
          playlist = parsed.filter((track) => track && track.src);
        }
      } catch (error) {
        console.warn('Unable to parse music playlist configuration.', error);
      }
    }

    if (playlist.length === 0) {
      console.warn('Music playlist is empty.');
      playerElement.classList.add('music-player--disabled');
      return;
    }

    let currentIndex = 0;

    const loadTrack = (index) => {
      currentIndex = clampIndex(index, playlist.length);
      const track = playlist[currentIndex];
      titleElement.textContent = track.title || 'Untitled';
      artistElement.textContent = track.artist || '';
      audioElement.src = track.src;
      audioElement.load();
    };

    const updateProgress = () => {
      const { currentTime, duration } = audioElement;
      currentTimeElement.textContent = formatTime(currentTime);
      durationElement.textContent = formatTime(duration);
      const percent = duration ? Math.min(100, (currentTime / duration) * 100) : 0;
      progressElement.style.setProperty('--progress', `${percent}%`);
    };

    const playAudio = () => {
      audioElement.play().catch((error) => {
        console.warn('Playback prevented:', error);
      });
    };

    const pauseAudio = () => {
      audioElement.pause();
    };

    const stopAudio = () => {
      audioElement.pause();
      audioElement.currentTime = 0;
      updateProgress();
    };

    const playPrevious = () => {
      loadTrack(currentIndex - 1);
      playAudio();
    };

    const playNext = () => {
      loadTrack(currentIndex + 1);
      playAudio();
    };

    playerElement.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', (event) => {
        const action = event.currentTarget.getAttribute('data-action');
        switch (action) {
          case 'play':
            playAudio();
            break;
          case 'pause':
            pauseAudio();
            break;
          case 'stop':
            stopAudio();
            break;
          case 'back':
            playPrevious();
            break;
          case 'next':
            playNext();
            break;
          default:
            break;
        }
      });
    });

    audioElement.addEventListener('loadedmetadata', updateProgress);
    audioElement.addEventListener('timeupdate', updateProgress);
    audioElement.addEventListener('ended', playNext);

    loadTrack(currentIndex);
  });
})();
