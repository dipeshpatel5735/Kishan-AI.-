const json = (s, o) => ({ statusCode: s, headers: { 'content-type': 'application/json' }, body: JSON.stringify(o) });
exports.handler = async (event) => {
  const key = process.env.DATA_GOV_API_KEY;
  if (!key) return json(500, { error: 'DATA_GOV_API_KEY सेट नहीं है' });
  const q = event.queryStringParameters || {};
  const p = new URLSearchParams({ 'api-key': key, format: 'json', limit: '100', 'filters[state.keyword]': 'Rajasthan' });
  if (q.commodity) p.set('filters[commodity]', q.commodity);
  if (q.district) p.set('filters[district]', q.district);
  try {
    const r = await fetch('https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?' + p);
    const d = await r.json();
    const g = (x, a, b) => x[a] !== undefined ? x[a] : x[b];
    const records = (d.records || []).map(x => ({
      market: x.market, district: x.district, commodity: x.commodity, variety: x.variety,
      date: g(x, 'arrival_date', 'Arrival_Date'), min: g(x, 'min_price', 'Min_Price'),
      max: g(x, 'max_price', 'Max_Price'), modal: g(x, 'modal_price', 'Modal_Price')
    }));
    return json(200, { records });
  } catch (e) { return json(502, { error: 'मंडी डेटा नहीं मिला' }); }
};
