export function printReport(report) {
  const popup = window.open('', '_blank', 'width=800,height=700');
  if (!popup) { window.alert('Allow pop-ups to open the printable report.'); return; }
  popup.document.title = 'MedAI sample report';
  const icon = popup.document.createElement('link'); icon.rel = 'icon'; icon.href = `${window.location.origin}/favicon.svg`; popup.document.head.append(icon);
  const style = popup.document.createElement('style');
  style.textContent = 'body{font:16px/1.6 system-ui,sans-serif;max-width:720px;margin:48px auto;padding:24px;color:#202827}h1{font-size:26px}dt{font-weight:600}dd{margin:0 0 16px}';
  popup.document.head.append(style);
  const title = popup.document.createElement('h1'); title.textContent = 'MedAI sample report'; popup.document.body.append(title);
  const disclaimer = popup.document.createElement('p'); disclaimer.textContent = 'Demonstration only. This report contains sample outputs, not clinical analysis.'; popup.document.body.append(disclaimer);
  const list = popup.document.createElement('dl');
  Object.entries(report).forEach(([key, value]) => { const label = popup.document.createElement('dt'); label.textContent = key; const detail = popup.document.createElement('dd'); detail.textContent = String(value); list.append(label, detail); });
  popup.document.body.append(list);
  popup.focus(); popup.print();
}
