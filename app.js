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

  if (k) {
    localStorage.setItem(KEY_NAME, k);
  } else {
    localStorage.removeItem(KEY_NAME);
  }

  $('configModal').hidden = true;
  setStatus('Voz Amiga está lista. Puedes hablar conmigo.');
};

$('btnCloseConfig').onclick = () => {
  $('configModal').hidden = true;
};

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

// ===== Cerebro: Gemini (opcional) + respaldo gratuito sin clave =====
const SYSTEM_PROMPT = `Eres "Voz Amiga", asistente de voz para adultos mayores y personas con discapacidad de Villa El Salvador, Lima, Perú.
Reglas:
1. Responde SIEMPRE en español, máximo 3 frases cortas y simples.
2. Tono cálido y respetuoso, como un familiar amable.
3. Ayuda con trámites, salud básica, derechos y servicios del distrito.
4. Para emergencias indica: llamar al 105 (policía), 106 (ambulancia), 100 (violencia familiar).
5. No inventes teléfonos ni direcciones locales. Si no sabes un dato exacto, indica consultar en la municipalidad o la posta más cercana.
6. No des diagnósticos médicos. Si es urgente, recomienda el 106 o la posta más cercana.
7. Nunca inventes teléfonos, direcciones, horarios,
   requisitos ni nombres de funcionarios.
8. Si no conoces una respuesta, dilo claramente.
9. Distingue entre información confirmada y sugerencias.
10. No diagnostiques enfermedades ni recomiendes
    medicamentos.
11. Utiliza respuestas breves y comprensibles.`;

function fetchTO(url, opts, ms = 20000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return fetch(url, { ...opts, signal: c.signal }).finally(() => clearTimeout(t));
}

// Capa 1: Gemini (solo si hay clave)
async function askGemini(question) {
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: chatHistory,
    generationConfig: { temperature: 0.6, maxOutputTokens: 400, thinkingConfig: { thinkingBudget: 0 } }
  };
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(getKey());
  const res = await fetchTO(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    let apiMsg = '';
    try { const ed = await res.json(); apiMsg = ed?.error?.message || ''; } catch (_) {}
    console.error('Gemini error:', res.status, apiMsg);
    throw new Error('gemini-fallo-' + res.status);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join(' ').trim();
  if (!text) throw new Error('gemini-vacio');
  return text;
}

// Capa 2: cerebro gratuito sin clave y sin registro (Pollinations)
async function askFreeBrain(question) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
  for (const h of chatHistory) {
    messages.push({ role: h.role === 'model' ? 'assistant' : 'user', content: h.parts[0].text });
  }
  const res = await fetchTO('https://text.pollinations.ai/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openai', messages: messages })
  });
  if (!res.ok) { console.error('Respaldo error:', res.status); throw new Error('respaldo-fallo-' + res.status); }
  const data = await res.json();
  const text = (data?.choices?.[0]?.message?.content || '').trim();
  if (!text) throw new Error('respaldo-vacio');
  return text;
}
// ===== CEREBRO LOCAL VERIFICADO =====

function cerebroLocal(pregunta) {
  const t = pregunta.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const respuestas = [
    {
      claves: ['emergencia', 'auxilio', 'socorro'],
      respuesta: 'Si necesitas ayuda urgente, toca el botón EMERGENCIA. Allí encontrarás los números de atención.'
    },
    {
      claves: ['serenazgo', 'sereno'],
      respuesta: 'Para comunicarte con la Municipalidad de Villa El Salvador, llama al 01 319 2530 y solicita Serenazgo.'
    },
    {
      claves: ['policia', 'robo', 'asalt'],
      respuesta: 'Si necesitas a la Policía, llama al 105. Busca un lugar seguro y solicita ayuda.'
    },
    {
      claves: ['ambulancia', 'urgencia medica'],
      respuesta: 'Para solicitar asistencia médica de emergencia, llama al 106.'
    },
    {
      claves: ['violencia familiar', 'maltrato'],
      respuesta: 'Puedes comunicarte con la Línea 100 para recibir orientación y apoyo.'
    },
    {
      claves: ['dni', 'reniec'],
      respuesta: 'Para consultas sobre tu DNI, visita la página oficial reniec.gob.pe o acude a una oficina de RENIEC.'
    },
    {
      claves: ['quien eres', 'como te llamas'],
      respuesta: 'Soy Voz Amiga, tu asistente de voz. Estoy aquí para ayudarte con información y orientación.'
    }
  ];

  for (const item of respuestas) {
    if (item.claves.some(k => t.includes(k))) {
      return item.respuesta;
    }
  }

  return null;
}
// ===== ORQUESTADOR DE TRES NIVELES =====

async function askBrain(question) {

  chatHistory.push({
    role: 'user',
    parts: [{ text: question }]
  });

  if (chatHistory.length > 8) {
    chatHistory = chatHistory.slice(-8);
  }

  // NIVEL 1: respuestas locales verificadas
  let answer = cerebroLocal(question);

  // NIVEL 2: IA alternativa gratuita
  if (!answer) {
    try {
      answer = await askFreeBrain(question);
    } catch (e) {
      console.warn('Pollinations no respondió:', e.message);
    }
  }

  // NIVEL 3: Gemini opcional
  if (!answer && getKey()) {
    try {
      answer = await askGemini(question);
    } catch (e) {
      console.warn('Gemini no respondió:', e.message);
    }
  }

  // RESPUESTA DE SEGURIDAD
  if (!answer) {
    chatHistory.pop();

    throw new Error(
      'No puedo consultar esa información ahora. Inténtalo nuevamente o solicita ayuda en tu municipalidad.'
    );
  }

  chatHistory.push({
    role: 'model',
    parts: [{ text: answer }]
  });

  return answer;
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
  if (listening) { recog.stop(); return; }
  speechSynthesis.cancel();
  userTextEl.textContent = '';
  setStatus('Conectando...');
  try { recog.start(); } catch (_) {}
};

async function handleQuestion(q) {
  setStatus('Pensando...');
  try {
    const answer = await askBrain(q);
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
 // ================================================================
// CEREBRO GRATUITO: respaldo local para que Voz Amiga NUNCA falle.
// Si Gemini falla o no hay clave, responde este cerebro guardado.
// ================================================================
