let mic, fft;
let smoothVol = 0;
let currentFreq = 0;
let detune = 0;

let iniciado = false;
let usarMic = false;

let botaoSim, botaoNao, botaoAtivarMic;

let micAtivadoVisual = 0;
let fade = 255;

let osc;

function setup() {
  createCanvas(windowWidth, windowHeight);

  mic = new p5.AudioIn();
  fft = new p5.FFT();

  osc = new p5.Oscillator('sine');
  osc.start();
  osc.amp(0);

  atualizarBotoes();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  atualizarBotoes();
}

function atualizarBotoes() {
  let base = min(width, height);

  botaoSim = {
    x: width / 2 - base * 0.15,
    y: height * 0.6,
    w: base * 0.12,
    h: base * 0.06
  };

  botaoNao = {
    x: width / 2 + base * 0.03,
    y: height * 0.6,
    w: base * 0.12,
    h: base * 0.06
  };

  botaoAtivarMic = {
    x: width / 2 - base * 0.1,
    y: height * 0.85,
    w: base * 0.2,
    h: base * 0.06
  };
}

function playClick() {
  osc.freq(800);
  osc.amp(0.3, 0.05);
  osc.amp(0, 0.2);
}

function mousePressed() {
  if (!iniciado) {
    if (clicou(botaoSim)) {
      playClick();
      ativarMicrofone();
      iniciado = true;
    } else if (clicou(botaoNao)) {
      playClick();
      usarMic = false;
      iniciado = true;
    }
    return;
  }

  if (!usarMic && clicou(botaoAtivarMic)) {
    playClick();
    ativarMicrofone();
  }
}

function ativarMicrofone() {
  usarMic = true;
  userStartAudio();
  mic.start();
  fft.setInput(mic);

  micAtivadoVisual = 255;
}

function clicou(b) {
  return mouseX > b.x && mouseX < b.x + b.w && mouseY > b.y && mouseY < b.y + b.h;
}

function hover(b) {
  return mouseX > b.x && mouseX < b.x + b.w && mouseY > b.y && mouseY < b.y + b.h;
}

function drawBotao(b, label, corBase) {
  let h = hover(b);

  let cor = h
    ? color(red(corBase) + 30, green(corBase) + 30, blue(corBase) + 30)
    : corBase;

  fill(cor);
  rect(b.x, b.y, b.w, b.h, 12);

  fill(255);
  textAlign(CENTER, CENTER);
  text(label, b.x + b.w / 2, b.y + b.h / 2);
}

function draw() {
  background(20, 30, 50);

  let base = min(width, height);

  // ===== TELA INICIAL =====
  if (!iniciado) {
    textAlign(CENTER);

    fill(255);
    textSize(base * 0.05);
    text("Use a voz para controlar o círculo", width / 2, height * 0.4);

    textSize(base * 0.025);
    text("Permitir uso do microfone?", width / 2, height * 0.5);

    drawBotao(botaoSim, "Sim", color(0, 180, 100));
    drawBotao(botaoNao, "Não", color(180, 80, 80));

    return;
  }

  // ===== ANIMAÇÕES =====
  if (fade > 0) {
    fill(0, fade);
    rect(0, 0, width, height);
    fade -= 5;
  }

  if (micAtivadoVisual > 0) {
    fill(0, 255, 150, micAtivadoVisual);
    rect(0, 0, width, height);
    micAtivadoVisual -= 5;
  }

  // ===== VOLUME =====
  let vol = usarMic ? mic.getLevel() : abs(sin(frameCount * 0.05)) * 0.05;
  smoothVol = lerp(smoothVol, vol, 0.1);

  let maxSize = base * 0.35;
  let size = map(smoothVol, 0, 0.08, 50, maxSize);

  // ===== FREQUÊNCIA (COM FILTRO) =====
  if (usarMic) {
    let spectrum = fft.analyze();
    let maxIndex = 0;

    for (let i = 0; i < spectrum.length; i++) {
      if (spectrum[i] > spectrum[maxIndex]) {
        maxIndex = i;
      }
    }

    let nyquist = sampleRate() / 2;
    currentFreq = (maxIndex * nyquist) / spectrum.length;

    // FILTRO IMPORTANTE
    if (currentFreq > 80 && smoothVol > 0.01) {
      let result = freqToNote(currentFreq);
      detune = result.detune;
    } else {
      detune = 999;
    }
  }

  // ===== COR (AJUSTADA) =====
  if (Math.abs(detune) < 20 && usarMic) {
    fill(0, 255, 100); // verde afinado
  } else {
    fill(200, 220, 255);
  }

  ellipse(width / 2, height / 2, size, size);

  // ===== BARRA DE VOLUME =====
  let barraLargura = base * 0.4;
  let barraAltura = base * 0.02;

  fill(80);
  rect(width / 2 - barraLargura / 2, height * 0.8, barraLargura, barraAltura, 10);

  fill(0, 200, 255);
  rect(
    width / 2 - barraLargura / 2,
    height * 0.8,
    barraLargura * constrain(smoothVol * 20, 0, 1),
    barraAltura,
    10
  );

  // ===== BOTÃO =====
  if (!usarMic) {
    textSize(base * 0.018);
    drawBotao(botaoAtivarMic, "Ativar microfone", color(50, 150, 255));
  }

  // ===== TEXTOS =====
  fill(255);
  textAlign(CENTER);

  textSize(base * 0.05);
  text("Use a voz para controlar o círculo", width / 2, base * 0.08);

  textSize(base * 0.06);
  text("🎙️", width / 2, height * 0.7);

  fill(220);
  textSize(base * 0.02);
  text(
    usarMic
      ? "Afine sua voz (círculo verde) e controle com o volume.\nFreq: " + nf(currentFreq, 0, 1) + " Hz"
      : "Modo demonstração ativo.",
    width / 2,
    height - base * 0.05
  );
}

// ===== AFINAÇÃO =====
function freqToNote(freq) {
  let A4 = 442;

  let noteNumber = 12 * (Math.log2(freq / A4)) + 69;
  let rounded = Math.round(noteNumber);

  let idealFreq = A4 * Math.pow(2, (rounded - 69) / 12);

  let detune = 1200 * Math.log2(freq / idealFreq);

  return {
    detune: detune
  };
}