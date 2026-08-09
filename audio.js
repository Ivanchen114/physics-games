(() => {
  "use strict";

  const STORAGE_KEY = "law-temple-audio-enabled";
  const THEMES = {
    home: [110, 146.83, 164.81], titans: [98, 146.83, 196], chrono: [123.47, 155.56, 185],
    photo: [138.59, 174.61, 207.65], ripple: [110, 146.83, 220], uncertainty: [116.54, 155.56, 233.08],
    momentum: [98, 130.81, 196], energy: [110, 138.59, 220], electric: [123.47, 164.81, 246.94],
    magnetic: [103.83, 155.56, 207.65], optics: [130.81, 164.81, 261.63], thermal: [92.5, 138.59, 185],
    celestial: [82.41, 123.47, 164.81], newton: [98, 146.83, 220], resonance: [110, 164.81, 246.94],
    emwave: [92.5, 138.59, 277.18], quantum: [103.83, 155.56, 233.08], nuclear: [77.78, 116.54, 174.61]
  };
  let enabled = false;
  try { enabled = localStorage.getItem(STORAGE_KEY) === "true"; } catch { enabled = false; }
  let context = null;
  let master = null;
  let ambienceTimer = null;
  let theme = "home";

  function ensureContext() {
    if (context) return true;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = .16;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 18;
    compressor.ratio.value = 5;
    master.connect(compressor).connect(context.destination);
    return true;
  }

  function voice(startFrequency, endFrequency, duration, volume = .025, type = "sine", delay = 0) {
    if (!enabled || !ensureContext()) return;
    const now = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, startFrequency), now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency || startFrequency), now + duration);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + Math.min(.08, duration / 3));
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain).connect(master);
    oscillator.start(now);
    oscillator.stop(now + duration + .03);
  }

  function ambientChord() {
    if (!enabled || !ensureContext() || context.state !== "running") return;
    const notes = THEMES[theme] || THEMES.home;
    notes.forEach((frequency, index) => {
      voice(frequency, frequency * (index === 2 ? 1.002 : .998), 7.6, .0105, index === 1 ? "triangle" : "sine", index * .35);
      voice(frequency / 2, frequency / 2, 7.8, .006, "sine", index * .35);
    });
    voice(notes[2] * 2, notes[2] * 1.98, 2.4, .0045, "sine", 1.2);
  }

  async function startAmbience() {
    if (!enabled || !ensureContext()) return;
    if (context.state !== "running") {
      try { await context.resume(); } catch { return; }
    }
    clearInterval(ambienceTimer);
    ambientChord();
    ambienceTimer = setInterval(ambientChord, 8200);
  }

  function stopAmbience() {
    clearInterval(ambienceTimer);
    ambienceTimer = null;
    if (context && context.state === "running") context.suspend();
  }

  function play(kind) {
    if (!enabled) return;
    if (!ensureContext()) return;
    if (context.state !== "running") context.resume();
    const sounds = {
      select: () => voice(420, 510, .07, .022, "sine"),
      lock: () => { voice(240, 240, .11, .025, "triangle"); voice(360, 360, .13, .018, "sine", .05); },
      hint: () => { voice(330, 440, .22, .022, "sine"); voice(494, 587, .24, .014, "sine", .12); },
      evidence: () => { voice(180, 360, .42, .026, "triangle"); voice(360, 720, .32, .014, "sine", .12); },
      damage: () => { voice(150, 72, .38, .045, "sawtooth"); },
      rewind: () => { voice(185, 277, .26, .03, "triangle"); voice(277, 415, .3, .027, "triangle", .22); voice(415, 622, .38, .022, "sine", .46); },
      success: () => { [392, 493.88, 587.33, 783.99].forEach((frequency, index) => voice(frequency, frequency, .72, .026 - index * .003, index % 2 ? "triangle" : "sine", index * .11)); },
      enter: () => { voice(110, 220, .55, .022, "triangle"); voice(164.81, 329.63, .6, .016, "sine", .12); }
    };
    (sounds[kind] || sounds.select)();
  }

  function setTheme(nextTheme) {
    theme = THEMES[nextTheme] ? nextTheme : "home";
    if (enabled && context?.state === "running") {
      clearInterval(ambienceTimer);
      ambientChord();
      ambienceTimer = setInterval(ambientChord, 8200);
    }
  }

  function renderToggle() {
    const button = document.querySelector("[data-audio-toggle]");
    if (!button) return;
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("aria-label", enabled ? "關閉神殿音景" : "開啟神殿音景");
    button.classList.toggle("is-on", enabled);
    button.querySelector("[data-audio-label]").textContent = enabled ? "音景：開" : "音景：關";
    button.title = enabled ? "關閉神殿音景" : "開啟神殿音景";
  }

  async function toggle() {
    enabled = !enabled;
    try { localStorage.setItem(STORAGE_KEY, String(enabled)); } catch { /* Audio still works for this visit. */ }
    renderToggle();
    if (enabled) {
      await startAmbience();
      play("enter");
      announce("神殿音景已開啟");
    } else {
      stopAmbience();
      announce("神殿音景已關閉");
    }
  }

  function announce(message) {
    const live = document.querySelector("[data-audio-status]");
    if (live) live.textContent = message;
  }

  const control = document.createElement("div");
  control.className = "audio-control";
  control.innerHTML = `<button type="button" class="audio-toggle" data-audio-toggle aria-pressed="false"><span aria-hidden="true">♪</span><span data-audio-label>音景：關</span></button><span class="sr-only" data-audio-status aria-live="polite"></span>`;
  document.body.append(control);
  control.querySelector("[data-audio-toggle]").addEventListener("click", toggle);
  renderToggle();

  if (enabled) {
    const wake = () => startAmbience();
    document.addEventListener("pointerdown", wake, { once: true, passive: true });
    document.addEventListener("keydown", wake, { once: true });
  }

  window.TempleAudio = { play, setTheme, toggle, isEnabled: () => enabled };
})();
