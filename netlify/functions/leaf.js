const json = (s, o) => ({ statusCode: s, headers: { 'content-type': 'application/json' }, body: JSON.stringify(o) });
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return json(500, { error: 'GEMINI_API_KEY सेट नहीं है' });
  let b; try { b = JSON.parse(event.body); } catch { return json(400, { error: 'गलत अनुरोध' }); }
  if (!b.image || b.image.length > 5e6) return json(400, { error: 'फोटो नहीं मिली या बहुत बड़ी है' });
  const prompt = `You are an expert plant pathologist advising Indian farmers in Rajasthan. Examine the photo. Crop hint: ${b.crop || 'unknown'}.
Reply ONLY with JSON, text values in simple Hindi:
{"is_plant_leaf":true,"crop":"","problem":"disease/pest/deficiency name, or स्वस्थ","confidence":"कम|मध्यम|अधिक","symptoms":"what you see","treatment":"standard chemical (name + dose per litre) and one organic option","prevention":"","need_expert":false}
If not a clear plant leaf set is_plant_leaf false. Never guess: if unsure use confidence कम and need_expert true.`;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: b.image } }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });
    const d = await r.json();
    if (!r.ok) return json(502, { error: (d.error && d.error.message) || 'AI त्रुटि' });
    const t = d.candidates[0].content.parts.map(p => p.text || '').join('');
    return json(200, JSON.parse(t.match(/\{[\s\S]*\}/)[0]));
  } catch (e) { return json(502, { error: 'AI का जवाब नहीं मिला, दोबारा कोशिश करें' }); }
};
