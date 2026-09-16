const transpMap = {
    "AMAZON TRANSPORTES LTDA": "AMAZON", "ATUAL CARGAS TRANSPORTES LTDA": "ATUAL", "CJP EXPRESS LOG TRANSPORTES LTDA": "CJP",
    "CW LOGISTICA EM TRANSPORTES LTDA": "CWLOG", "DMARI - LOCACAO, TRANSPORTES E LOGISTICA LTDA": "DMARI", "ELLLOG LOGISTICA E TRANSPORTES EIRELI": "ELLLOG",
    "FAST-X TRANSPORTES LTDA": "FASTX", "RAPIDO FIGUEIREDO LOGISTICA E TRANSPORTES LTDA": "FIGUEIREDO", "TJ4 TRANSPORTES EIRELI": "FRILOG",
    "V.M.RAMOS & CIA LTDA": "GENEROSO", "LG DE CAMPOS TRANSPORTES": "IDEIA/LG", "LEMA REZENDE TRANSPORTES LTDA": "LEMA",
    "MIR TRANSPORTES E LOGISTICA LTDA": "MIRIN", "RAPIDO PANAMERICANO LTDA": "PANAMERICANO", "PASSARO TRANSPORTES LTDA": "PASSARO",
    "RODOGARCIA TRANSPORTES RODOVIARIOS LTDA": "RODOGARCIA", "SOLIDEZ TRANSPORTES LTDA": "SOLIDEZ", "SPEED TRANSPORTE MULTIMODAL DE CARGAS LIMITADA": "SPEED",
    "TADEX TRANSPORTES LTDA.": "TADEX", "TRANS CJ TRANSPORTE E LOGISTICA LTDA": "TRANSCJ", "HB TRANSPORTES E LOGISTICA EIRELI": "TRANSITO",
    "HB TRANSPORTES E LOGISTICA LTDA": "TRANSITO", "VIPEX TRANSPORTES LTDA": "VIPEX", "MANDA LÁ TRANSPORTES LTDA": "MANDALA",
    "TRANSPORTADORA M.M.A LTDA": "MMA", "TRANSNORTEX CARGAS EIRELI": "NORTEX", "FORMATO TRANSPORTES LTDA": "FORMATO",
    "SILVANIO SILVA DE CAMPOS TRANSPORTES": "TRANSVANIO"
};
const coresMap = { PRETA: 'cor-preta', PRETO: 'cor-preta', AZUL: 'cor-azul', CINZA: 'cor-cinza', LARANJA: 'cor-laranja', BRANCO: 'cor-branco' };
let documentos = [], documentoAtual = -1, volumeOriginalXml = 1;
const $ = id => document.getElementById(id);

function aplicarDestaques(texto, forcar = false) {
    let nome = texto.replace(/</g, '&lt;').replace(/>/g, '&gt;').toUpperCase();
    if (forcar && nome.includes('MDF') && !nome.includes('CRU') && !Object.keys(coresMap).some(c => nome.includes(c))) nome = nome.replace(/\bMDF\b/g, 'MDF BRANCO');
    if (forcar && !nome.includes('#')) nome = nome.replace(/\bESTANTE\s+LEVE\b/g, 'ESTANTE LEVE #26').replace(/\bESTANTE\s+INDUSTRIAL\b/g, 'ESTANTE INDUSTRIAL #22').replace(/\b(AÇO|ACO)\s+LEVE\b/g, 'ACO LEVE #26').replace(/\b(AÇO|ACO)\s+INDUSTRIAL\b/g, 'ACO INDUSTRIAL #22');
    nome = nome.replace(/(#\d+)/g, '<span class="chapa-destaque">$1</span>');
    if (!nome.includes('ESTANTE')) nome = nome.replace(/\bCOLUNAS?\b/g, 'MONTANTE');
    nome = nome.replace(/\bPRATELEIRAS?\b/g, 'PAR DE LONGARINA');
    if (nome.includes('MONTANTE') || nome.includes('LONGARINA')) {
        if (/\bSL\b/.test(nome)) nome = nome.replace(/\bSL\b/g, '<span class="modelo-destaque">SLIM</span>');
        else if (nome.includes('SLIM')) nome = nome.replace(/\bSLIM\b/g, '<span class="modelo-destaque">SLIM</span>');
        else if (forcar && !nome.includes('MINI')) nome += ' <span class="modelo-destaque">MINI</span>';
        else if (nome.includes('MINI')) nome = nome.replace(/\bMINI\b/g, '<span class="modelo-destaque">MINI</span>');
    }
    Object.keys(coresMap).forEach(cor => { const r = new RegExp(`\\b${cor}\\b`, 'g'); nome = nome.replace(r, `<span class="cor-grifada ${coresMap[cor]}">${cor}</span>`); });
    return nome;
}
function calcularVolumeSugerido() {
    let total = 0;
    document.querySelectorAll('#tabelaItens tbody tr').forEach(row => {
        const qtd = parseInt(row.querySelector('.editavel-qtd')?.innerText) || 0, d = row.querySelector('.editavel-nome')?.innerText.toUpperCase() || '';
        if (!qtd) return;
        if (d.includes('ESTANTE') && d.includes('LEVE')) total += Math.ceil(qtd * 4 / 20) + qtd;
        else if (d.includes('ESTANTE') && (d.includes('INDUSTRIAL') || d.includes('PESADA'))) total += Math.ceil(qtd * 4 / 10) + qtd;
        else if (d.includes('MONTANTE') || (d.includes('COLUNA') && !d.includes('ESTANTE'))) total += qtd * 2;
        else if (d.includes('LONGARINA') || d.includes('PRATELEIRA')) total += qtd;
        else if (d.includes('BANDEJA')) total += Math.ceil(qtd / 6);
        else total += qtd;
    });
    return total || 1;
}
function validarAjustarVolume() {
    if (documentoAtual < 0) return;
    const calculado = calcularVolumeSugerido(), input = $('outVolumes');
    if (volumeOriginalXml !== calculado) { input.value = calculado; input.classList.add('vol-alerta'); $('volOriginalXml').textContent = volumeOriginalXml; $('volCalculadoSugerido').textContent = calculado; $('alertaVolume').style.display = 'block'; }
    else { input.value = volumeOriginalXml; input.classList.remove('vol-alerta'); $('alertaVolume').style.display = 'none'; }
    salvarDocumentoAtual();
}
function salvarDocumentoAtual() {
    if (documentoAtual < 0) return;
    const d = documentos[documentoAtual];
    d.transportadora = $('outTransportadora').innerText; d.volumes = $('outVolumes').value; d.responsavel = $('responsavelSelect').value;
    d.itens = [...document.querySelectorAll('#tabelaItens tbody tr')].map(r => ({ qtd: r.querySelector('.editavel-qtd').innerText, nome: r.querySelector('.editavel-nome').innerText }));
}
function renderizarDocumento(index) {
    if (documentoAtual >= 0) salvarDocumentoAtual();
    documentoAtual = index; const d = documentos[index]; volumeOriginalXml = d.volumeOriginal;
    $('emptyState').hidden = true; $('printArea').hidden = false; $('btnAbrirChecklist').disabled = false;
    $('outNF').textContent = d.nf; $('outData').textContent = d.data; $('outDestinatario').textContent = d.destinatario; $('outTransportadora').textContent = d.transportadora; $('responsavelSelect').value = d.responsavel || ''; $('outResponsavel').textContent = d.responsavel || '';
    $('tabelaItens').querySelector('tbody').innerHTML = d.itens.map(i => `<tr><td class="editavel-qtd" contenteditable="true" style="text-align:center">${i.qtd}</td><td class="editavel-nome" contenteditable="true">${aplicarDestaques(i.nome)}</td><td style="text-align:center;font-size:25px">☐</td><td class="no-print" style="text-align:center"><button class="btn-del">X</button></td></tr>`).join('');
    renderizarAbas(); validarAjustarVolume();
}
function renderizarAbas() {
    $('documentNav').hidden = !documentos.length; $('documentCount').textContent = `${documentos.length} ${documentos.length === 1 ? 'capa' : 'capas'}`;
    $('fileSummary').textContent = documentos.length ? `${documentos.length} XML${documentos.length === 1 ? '' : 's'} carregado${documentos.length === 1 ? '' : 's'}` : 'Nenhum XML carregado';
    $('documentTabs').innerHTML = documentos.map((d, i) => `<button class="document-tab ${i === documentoAtual ? 'active' : ''}" data-index="${i}"><span>NF ${d.nf}</span><small>${d.destinatario}</small></button>`).join('');
}
function lerXml(file) { return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = e => { try { const x = new DOMParser().parseFromString(e.target.result, 'text/xml'), tag = n => x.getElementsByTagName(n)[0]?.textContent || '---', raw = tag('dhEmi'); const trans = (x.querySelector('transporta xNome')?.textContent || 'NÃO INFORMADO').toUpperCase().trim(); resolve({ nf: tag('nNF'), data: raw && raw.includes('T') ? raw.split('T')[0].split('-').reverse().join('/') : '---', destinatario: x.querySelector('dest xNome')?.textContent || '---', transportadora: transpMap[trans] || trans, volumeOriginal: parseInt(tag('qVol')) || 1, responsavel: '', itens: [...x.getElementsByTagName('det')].map(det => ({ qtd: parseFloat(det.querySelector('qCom')?.textContent || '0').toFixed(0), nome: det.querySelector('xProd')?.textContent || '' })) }); } catch (err) { reject(err); } }; r.onerror = reject; r.readAsText(file); }); }
$('xmlInput').addEventListener('change', async e => { const files = [...e.target.files]; if (!files.length) return; try { const novos = await Promise.all(files.map(lerXml)); documentos.push(...novos); renderizarDocumento(documentos.length - novos.length); } catch { alert('Um dos XMLs não pôde ser lido.'); } e.target.value = ''; });
$('documentTabs').addEventListener('click', e => { const tab = e.target.closest('.document-tab'); if (tab) renderizarDocumento(Number(tab.dataset.index)); });
$('addItemBtn').addEventListener('click', () => { if (documentoAtual < 0) return; $('tabelaItens tbody').insertAdjacentHTML('beforeend', '<tr><td class="editavel-qtd" contenteditable="true" style="text-align:center">1</td><td class="editavel-nome" contenteditable="true">NOVO PRODUTO</td><td style="text-align:center;font-size:25px">☐</td><td class="no-print" style="text-align:center"><button class="btn-del">X</button></td></tr>'); validarAjustarVolume(); });
$('tabelaItens').addEventListener('click', e => { if (e.target.classList.contains('btn-del')) { e.target.closest('tr').remove(); validarAjustarVolume(); } });
$('tabelaItens').addEventListener('blur', e => { if (e.target.matches('.editavel-nome,.editavel-qtd')) { if (e.target.classList.contains('editavel-nome')) e.target.innerHTML = aplicarDestaques(e.target.innerText); validarAjustarVolume(); } }, true);
$('outVolumes').addEventListener('input', () => { $('outVolumes').classList.remove('vol-alerta'); $('alertaVolume').style.display = 'none'; salvarDocumentoAtual(); });
$('outTransportadora').addEventListener('blur', salvarDocumentoAtual);
$('responsavelSelect').addEventListener('change', e => { $('outResponsavel').textContent = e.target.value; salvarDocumentoAtual(); });
const modal = $('modalChecklist'), checks = document.querySelectorAll('.chk-conferencia');
function acionarChecklist() { if (documentoAtual < 0) return; checks.forEach(c => c.checked = false); $('btnConfirmarImpressao').disabled = true; modal.style.display = 'flex'; }
$('btnAbrirChecklist').addEventListener('click', acionarChecklist); $('btnCancelarModal').addEventListener('click', () => modal.style.display = 'none');
checks.forEach(c => c.addEventListener('change', () => $('btnConfirmarImpressao').disabled = ![...checks].every(x => x.checked)));
$('btnConfirmarImpressao').addEventListener('click', () => { modal.style.display = 'none'; salvarDocumentoAtual(); window.print(); });
window.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') { e.preventDefault(); acionarChecklist(); } });
