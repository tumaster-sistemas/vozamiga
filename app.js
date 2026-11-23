const $ = (id) => document.getElementById(id);
const statusEl = $('status'), userTextEl = $('userText');
const answerBox = $('answerBox'), answerText = $('answerText');

let chatHistory = [];
const KEY_NAME = 'vozamiga_gemini_key';
const getKey = () => localStorage.getItem(KEY_NAME) || '';

function setStatus(t) { statusEl.textContent = t; }
function showAnswer(t) { answerText.textContent = t; answerBox.hidden = false; }

// ===== Configuración =====
function openConfig() { $('configModal').hidden = false; $('apiKeyInput').value = getKey(); }
 $('btnConfig').onclick = openConfig;
 $('btnSaveKey').onclick = () => {
  const k = $('apiKeyInput').value.trim();
  if (!k) { alert('Pega tu clave de Gemini para continuar.'); return; }
  localStorage.setItem(KEY_NAME, k);
  $('configModal').hidden = true;
  setStatus('Listo. Toca el botón verde y háblame.');
};
 $('btnCloseConfig').onclick = () => { $('configModal').hidden = true; };
if (!getKey()) openConfig();

// ===== Voz: síntesis (hablar) =====
let spanishVoice = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices();
  spanishVoice = vs.find(v => v.lang === 'es-PE') || vs.find(v => v.lang && v.lang.startsWith('es')) || null;
}
speechSynthesis.onvoiceschanged = pickVoice;
pickVoice();

function speak(text) {
  if (!spanishVoice) pickVoice();
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'es-PE';
  if (spanishVoice) u.voice = spanishVoice;
  u.rate = 0.95;
  speechSynthesis.speak(u);
}

// ===== Gemini =====
const SYSTEM_PROMPT = `Eres "Voz Amiga", asistente de voz para adultos mayores y personas con discapacidad de Villa El Salvador, Lima, Perú.
Reglas:
1. Responde SIEMPRE en español, máximo 3 frases cortas y simples.
2. Tono cálido y respetuoso, como un familiar amable.
3. Ayuda con trámites, salud básica, derechos y servicios del distrito.
4. Para emergencias indica: llamar al 105 (policía), 106 (ambulancia), 100 (violencia familiar).
5. No inventes teléfonos ni direcciones locales. Si no sabes un dato exacto, indica consultar en la municipalidad o la posta más cercana.
6. No des diagnósticos médicos. Si es urgente, recomienda el 106 o la posta más cercana.`;

async function askGemini(question) {
  chatHistory.push({ role: 'user', parts: [{ text: question }] });
  if (chatHistory.length > 8) chatHistory = chatHistory.slice(-8);
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: chatHistory,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 400,
      thinkingConfig: { thinkingBudget: 0 }
    }
  };
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(getKey());
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    chatHistory.pop();
    if ([400, 401, 403].includes(res.status)) throw new Error('La clave de Gemini no es válida. Toca Ajustes y revísala.');
    throw new Error('No pude conectar. Revisa el internet e inténtalo otra vez.');
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join(' ').trim();
  if (!text) throw new Error('No recibí respuesta. Inténtalo otra vez.');
  chatHistory.push({ role: 'model', parts: [{ text }] });
  return text;
}

// ===== Voz: reconocimiento =====
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recog = null, listening = false;

if (SR) {
  recog = new SR();
  recog.lang = 'es-PE';
  recog.interimResults = true;
  recog.maxAlternatives = 1;

  recog.onstart = () => {
    listening = true;
    document.body.classList.add('listening');
    $('micLabel').textContent = 'ESCUCHANDO';
    setStatus('Te escucho... habla ahora');
  };
  recog.onresult = (e) => {
    let final = '', interim = '';
    for (const r of e.results) {
      if (r.isFinal) final += r[0].transcript; else interim += r[0].transcript;
    }
    userTextEl.textContent = final || interim;
    if (final.trim()) handleQuestion(final.trim());
  };
  recog.onerror = (e) => {
    listening = false;
    document.body.classList.remove('listening');
    $('micLabel').textContent = 'HABLAR';
    if (e.error === 'not-allowed') setStatus('Necesito permiso del micrófono. Permite el acceso y vuelve a tocar.');
    else if (e.error === 'no-speech') setStatus('No te escuché. Habla más fuerte, más cerca.');
    else if (e.error === 'network') setStatus('Problema de internet. Revisa la conexión.');
    else setStatus('Algo falló. Inténtalo otra vez.');
  };
  recog.onend = () => {
    listening = false;
    document.body.classList.remove('listening');
    $('micLabel').textContent = 'HABLAR';
    if (statusEl.textContent.startsWith('Te escucho')) setStatus('Toca el botón verde y háblame');
  };
} else {
  setStatus('Tu navegador no soporta voz. Usa Chrome.');
}

 $('btnMic').onclick = () => {
  if (!getKey()) { openConfig(); return; }
  if (listening) { recog.stop(); return; }
  speechSynthesis.cancel();
  userTextEl.textContent = '';
  setStatus('Conectando...');
  try { recog.start(); } catch (_) {}
};

async function handleQuestion(q) {
  setStatus('Pensando...');
  try {
    const answer = await askGemini(q);
    showAnswer(answer);
    speak(answer);
    setStatus('Toca el botón verde para seguir hablando');
  } catch (err) {
    setStatus(err.message);
  }
}

// ===== Vistas =====
function showView(name) {
  $('viewMain').hidden = name !== 'main';
  $('viewEmergency').hidden = name !== 'emergency';
  $('viewRead').hidden = name !== 'read';
}
 $('btnEmergency').onclick = () => showView('emergency');
 $('btnBackEmergency').onclick = () => showView('main');
 $('btnRead').onclick = () => showView('read');
 $('btnBackRead').onclick = () => showView('main');

// ===== Léeme esto =====
 $('btnSpeak').onclick = () => {
  const t = $('readText').value.trim();
  if (!t) { alert('Escribe o pega un texto primero.'); return; }
  speak(t);
};
 $('btnStopRead').onclick = () => speechSynthesis.cancel();