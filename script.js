const transpMap = {
    "AMAZON TRANSPORTES LTDA": "AMAZON",
    "ATUAL CARGAS TRANSPORTES LTDA": "ATUAL",
    "CJP EXPRESS LOG TRANSPORTES LTDA": "CJP",
    "CW LOGISTICA EM TRANSPORTES LTDA": "CWLOG",
    "DMARI - LOCACAO, TRANSPORTES E LOGISTICA LTDA": "DMARI",
    "ELLLOG LOGISTICA E TRANSPORTES EIRELI": "ELLLOG",
    "FAST-X TRANSPORTES LTDA": "FASTX",
    "RAPIDO FIGUEIREDO LOGISTICA E TRANSPORTES LTDA": "FIGUEIREDO",
    "TJ4 TRANSPORTES EIRELI": "FRILOG",
    "V.M.RAMOS & CIA LTDA": "GENEROSO",
    "LG DE CAMPOS TRANSPORTES": "IDEIA/LG",
    "LEMA REZENDE TRANSPORTES LTDA": "LEMA",
    "MIR TRANSPORTES E LOGISTICA LTDA": "MIRIN",
    "RAPIDO PANAMERICANO LTDA": "PANAMERICANO",
    "PASSARO TRANSPORTES LTDA": "PASSARO",
    "RODOGARCIA TRANSPORTES RODOVIARIOS LTDA": "RODOGARCIA",
    "SOLIDEZ TRANSPORTES LTDA": "SOLIDEZ",
    "SPEED TRANSPORTE MULTIMODAL DE CARGAS LIMITADA": "SPEED",
    "TADEX TRANSPORTES LTDA.": "TADEX",
    "TRANS CJ TRANSPORTE E LOGISTICA LTDA": "TRANSCJ",
    "HB TRANSPORTES E LOGISTICA EIRELI": "TRANSITO",
    "HB TRANSPORTES E LOGISTICA LTDA": "TRANSITO",
    "VIPEX TRANSPORTES LTDA": "VIPEX",
    "MANDA LÁ TRANSPORTES DE CARGAS LTDA": "MANDALA",
    "TRANSPORTADORA M.M.A LTDA": "MMA",
    "TRANSNORTEX CARGAS EIRELI": "NORTEX",
    "FORMATO TRANSPORTES LTDA": "FORMATO",
    "SILVANIO SILVA DE CAMPOS TRANSPORTES": "TRANSVANIO",
    "RAPIDO PANAMERICANO EIRELI": "PANAMERICANO",
    "TRANSPORTADORA M.M.A. LTDA": "MMA",
    "TRANSVANIO TRANSPORTADORA LTDA": "TRANSVANIO",
    "VOO TRANSPORTES LOGISTICA LTDA": "VOO",
    "HENCA TRANSPORTES LTDA": "HENCA",
    "CPP LOG LOGISTICA E TRANSPORTES LTDA": "CPP LOG",
    "AMAZON TRANSPORTES LT": "AMAZON",
    "ABT-LOG TRANSPORTES LTDA": "ABT-LOG",
    "RAPIDO FIGUEIREDO LOGISTICA E TRANSPORTES EIRELI": "FIGUEIREDO",
    "TJ4 TRANSPORTES LTDA": "FRILOG"
};

const coresMap = { 
    'PRETA': 'cor-preta', 'PRETO': 'cor-preta', 'AZUL': 'cor-azul', 
    'CINZA': 'cor-cinza', 'LARANJA': 'cor-laranja', 'BRANCO': 'cor-branco' 
};

// Variável global para armazenar o volume original da NF
let volumeOriginalXml = 1;

function aplicarDestaques(texto, forcarInsercaoInicial = false) {
    let divTemp = document.createElement("div");
    divTemp.innerHTML = texto;
    let nome = divTemp.innerText.toUpperCase();

    // 1. Regra do MDF
    if (forcarInsercaoInicial && nome.includes("MDF") && !nome.includes("CRU")) {
        const temOutraCor = Object.keys(coresMap).some(c => nome.includes(c));
        if (!temOutraCor) {
            nome = nome.replace(/\bMDF\b/g, "MDF BRANCO");
        }
    }

    // 2. Regra das Chapas (#26 e #22)
    if (forcarInsercaoInicial && !nome.includes("#")) {
        nome = nome.replace(/\bESTANTE\s+LEVE\b/g, 'ESTANTE LEVE #26');
        nome = nome.replace(/\bESTANTE\s+INDUSTRIAL\b/g, 'ESTANTE INDUSTRIAL #22');
        nome = nome.replace(/\b(AÇO|ACO)\s+LEVE\b/g, 'ACO LEVE #26');
        nome = nome.replace(/\b(AÇO|ACO)\s+INDUSTRIAL\b/g, 'ACO INDUSTRIAL #22');
    }
    nome = nome.replace(/(#\d+)/g, '<span class="chapa-destaque">$1</span>');

    // 3. Substituições Técnicas (Apenas se NÃO for estante)
    if (!nome.includes("ESTANTE")) {
        nome = nome.replace(/\bCOLUNAS?\b/g, "MONTANTE");
    }
    nome = nome.replace(/\bPRATELEIRAS?\b/g, "PAR DE LONGARINA");

    // Montante de expedição é sempre SLIM, nunca MINI
    if (nome.includes("MONTANTE") && (nome.includes("EXPEDIÇÃO") || nome.includes("EXPEDICAO"))) {
        nome = nome.replace(/\bMINI\b/g, "").replace(/\bSLIM\b/g, "");
        nome += " SLIM";
    }

    // 4. Lógica de Modelo (SLIM / MINI)
    if (nome.includes("MONTANTE") || nome.includes("LONGARINA")) {
        if (/\bSL\b/.test(nome)) {
            nome = nome.replace(/\bSL\b/g, '<span class="modelo-destaque">SLIM</span>');
        } else if (nome.includes("SLIM")) {
            nome = nome.replace(/\bSLIM\b/g, '<span class="modelo-destaque">SLIM</span>');
        } else if (forcarInsercaoInicial && !nome.includes("MINI")) {
            nome += ' <span class="modelo-destaque">MINI</span>';
        } else if (nome.includes("MINI")) {
            nome = nome.replace(/\bMINI\b/g, '<span class="modelo-destaque">MINI</span>');
        }
    }

    // 5. Cores
    Object.keys(coresMap).forEach(cor => {
        const regexCor = new RegExp(`\\b${cor}\\b`, 'g');
        if (regexCor.test(nome)) {
            nome = nome.replace(regexCor, `<span class="cor-grifada ${coresMap[cor]}">${cor}</span>`);
        }
    });

    return nome;
}

// ==========================================
// CALCULADORA DE VOLUMES
// ==========================================
function calcularVolumeSugerido() {
    const linhas = document.querySelectorAll("#tabelaItens tbody tr");
    let totalVols = 0;

    linhas.forEach(row => {
        const qtdElem = row.querySelector(".editavel-qtd");
        const nomeElem = row.querySelector(".editavel-nome");

        if (!qtdElem || !nomeElem) return;

        const qtd = parseInt(qtdElem.innerText) || 0;
        const descricao = nomeElem.innerText.toUpperCase();

        if (qtd <= 0) return;

        // Estante Leve (até 20 colunas por volume + pacotes de bandeja)
        if (descricao.includes("ESTANTE") && descricao.includes("LEVE")) {
            let volsCol = Math.ceil((qtd * 4) / 20);
            totalVols += (volsCol + qtd);
        } 
        // Estante Pesada/Industrial (até 10 colunas por volume + pacotes de bandeja)
        else if (descricao.includes("ESTANTE") && (descricao.includes("INDUSTRIAL") || descricao.includes("PESADA"))) {
            let volsCol = Math.ceil((qtd * 4) / 10);
            totalVols += (volsCol + qtd);
        } 
        // Montante de expedição: 2 montantes equivalem a 5 volumes
        else if (descricao.includes("MONTANTE") && (descricao.includes("EXPEDIÇÃO") || descricao.includes("EXPEDICAO"))) {
            totalVols += Math.ceil(qtd / 2) * 5;
        }
        // Transversina: 1 volume a cada 10 unidades
        else if (descricao.includes("TRANSVERSINA")) {
            totalVols += Math.ceil(qtd / 10);
        }
        // Coluna Avulsa (Montante) = 2 volumes por qtd (1 montante + 1 travessa)
        else if (descricao.includes("MONTANTE") || (descricao.includes("COLUNA") && !descricao.includes("ESTANTE"))) {
            totalVols += (qtd * 2);
        } 
        // Prateleira (Par de Longarina) = 1 volume por qtd
        else if (descricao.includes("LONGARINA") || descricao.includes("PRATELEIRA")) {
            totalVols += qtd;
        } 
        // Bandeja Avulsa = 1 volume a cada 6 bandejas
        else if (descricao.includes("BANDEJA")) {
            totalVols += Math.ceil(qtd / 6);
        } 
        // MDF e outros
        else {
            totalVols += qtd;
        }
    });

    return totalVols > 0 ? totalVols : 1;
}

// Mesma calculadora da versão original, aplicada à tabela de cada capa.
function calcularVolumeDaCapa(capa) {
    let totalVols = 0;
    capa.querySelectorAll("tbody tr").forEach(row => {
        const qtdElem = row.querySelector(".editavel-qtd");
        const nomeElem = row.querySelector(".editavel-nome");
        if (!qtdElem || !nomeElem) return;
        const qtd = parseInt(qtdElem.innerText) || 0;
        const descricao = nomeElem.innerText.toUpperCase();
        if (qtd <= 0) return;
        if (descricao.includes("ESTANTE") && descricao.includes("LEVE")) totalVols += Math.ceil((qtd * 4) / 20) + qtd;
        else if (descricao.includes("ESTANTE") && (descricao.includes("INDUSTRIAL") || descricao.includes("PESADA"))) totalVols += Math.ceil((qtd * 4) / 10) + qtd;
        else if (descricao.includes("MONTANTE") && (descricao.includes("EXPEDIÇÃO") || descricao.includes("EXPEDICAO"))) totalVols += Math.ceil(qtd / 2) * 5;
        else if (descricao.includes("TRANSVERSINA")) totalVols += Math.ceil(qtd / 10);
        else if (descricao.includes("MONTANTE") || (descricao.includes("COLUNA") && !descricao.includes("ESTANTE"))) totalVols += qtd * 2;
        else if (descricao.includes("LONGARINA") || descricao.includes("PRATELEIRA")) totalVols += qtd;
        else if (descricao.includes("BANDEJA")) totalVols += Math.ceil(qtd / 6);
        else totalVols += qtd;
    });
    return totalVols > 0 ? totalVols : 1;
}

function validarCapa(capa) {
    if (!capa) return;
    const original = parseInt(capa.dataset.volumeOriginal) || 1;
    const calculado = calcularVolumeDaCapa(capa);
    const input = capa.querySelector('.vol-gigante');
    const alerta = capa.querySelector('.alerta-volume-capa');
    if (!input || !alerta) return;
    if (original !== calculado) {
        input.value = calculado;
        input.classList.add('vol-alerta');
        alerta.textContent = `⚠️ Possível divergência no volume! O XML informa ${original} volume(s), mas a calculadora indica ${calculado} volume(s). O valor da capa foi ajustado.`;
        alerta.style.display = 'block';
    } else {
        input.value = original;
        input.classList.remove('vol-alerta');
        alerta.style.display = 'none';
    }
}

function validarAjustarVolume() {
    const volCalculado = calcularVolumeSugerido();
    const inputVolumes = document.getElementById("outVolumes");
    const divAlerta = document.getElementById("alertaVolume");
    const volOriginalSpan = document.getElementById("volOriginalXml");
    const volSugeridoSpan = document.getElementById("volCalculadoSugerido");

    // Se houver divergência
    if (volumeOriginalXml !== volCalculado) {
        inputVolumes.value = volCalculado;
        inputVolumes.classList.add("vol-alerta");
        
        volOriginalSpan.textContent = volumeOriginalXml;
        volSugeridoSpan.textContent = volCalculado;
        divAlerta.style.display = "block";
    } else {
        inputVolumes.value = volumeOriginalXml;
        inputVolumes.classList.remove("vol-alerta");
        divAlerta.style.display = "none";
    }
}

// Remover alerta quando o usuário edita o volume manualmente
document.getElementById("outVolumes").addEventListener("input", function() {
    this.classList.remove("vol-alerta");
    document.getElementById("alertaVolume").style.display = "none";
});

// Eventos da Tabela (Recalcula sempre que editar/apagar)
document.querySelector("#tabelaItens").addEventListener('click', function(event) {
    if (event.target.classList.contains('btn-del')) {
        event.target.closest('tr').remove();
        validarAjustarVolume();
    }
});

document.querySelector("#tabelaItens").addEventListener('blur', function(event) {
    if (event.target.classList.contains('editavel-nome') || event.target.classList.contains('editavel-qtd')) {
        if (event.target.classList.contains('editavel-nome')) {
            event.target.innerHTML = aplicarDestaques(event.target.innerText, false);
        }
        validarAjustarVolume();
    }
}, true);

document.getElementById('addItemBtn').addEventListener('click', function() {
    const tbody = document.querySelector("#tabelaItens tbody") || document.querySelector(".capa-impressao:not(.somente-impressao) table tbody");
    if (!tbody) return;
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td class="editavel-qtd" contenteditable="true" style="text-align: center;">1</td>
        <td class="editavel-nome" contenteditable="true">NOVO PRODUTO</td>
        <td style="text-align: center; font-size: 25px;">☐</td>
        <td class="no-print" style="text-align: center;"><button class="btn-del">X</button></td>
    `;
    tbody.appendChild(tr);
    validarAjustarVolume();
    validarCapa(tbody.closest('.capa-impressao'));
});

document.getElementById('responsavelSelect').addEventListener('change', function() {
    document.getElementById('outResponsavel').textContent = this.value;
});

// Leitura de um ou vários XMLs
function extrairDadosXml(texto) {
    const xmlDoc = new DOMParser().parseFromString(texto, "text/xml");
    if (xmlDoc.querySelector("parsererror")) throw new Error("XML inválido");
    const getTag = (name) => xmlDoc.getElementsByTagName(name)[0]?.textContent || "---";
    const rawData = getTag("dhEmi");
    const itens = Array.from(xmlDoc.getElementsByTagName("det")).map(item => ({
        qtd: parseFloat(item.querySelector("qCom")?.textContent || "0").toFixed(0),
        nome: item.querySelector("xProd")?.textContent || ""
    }));
    const transpNF = (xmlDoc.querySelector("transporta xNome")?.textContent || "NÃO INFORMADO").toUpperCase().trim();
    return {
        nf: getTag("nNF"),
        data: rawData ? rawData.split('T')[0].split('-').reverse().join('/') : "---",
        destinatario: xmlDoc.querySelector("dest xNome")?.textContent || "---",
        transportadora: transpMap[transpNF] || transpNF,
        volumes: parseInt(getTag("qVol")) || 1,
        itens
    };
}

function gerarCapa(data, indice) {
    const itensHtml = data.itens.map(item => `<tr>
        <td class="editavel-qtd" contenteditable="true" style="text-align: center;">${item.qtd}</td>
        <td class="editavel-nome" contenteditable="true">${aplicarDestaques(item.nome, true)}</td>
        <td style="text-align: center; font-size: 25px;">☐</td>
        <td class="no-print" style="text-align: center;"><button class="btn-del">X</button></td>
    </tr>`).join('');
    const responsavelAtual = document.getElementById('responsavelSelect')?.value || '';
    return `<div class="capa-impressao" data-capa-index="${indice}" data-volume-original="${data.volumes}" data-transportadora="${data.transportadora}" data-nf="${data.nf}">
        <div class="responsavel-capa no-print"><label><strong>Responsável desta capa:</strong></label><select class="responsavel-select-capa"><option value="">-- Selecione --</option><option value=" / PF-CAROLINE" ${responsavelAtual === ' / PF-CAROLINE' ? 'selected' : ''}>1: / PF-CAROLINE</option><option value=" / PF-SARA" ${responsavelAtual === ' / PF-SARA' ? 'selected' : ''}>2: / PF-SARA</option><option value=" / PF-NICOLY" ${responsavelAtual === ' / PF-NICOLY' ? 'selected' : ''}>3: / PF-NICOLY</option><option value=" / MERCADO LIVRE" ${responsavelAtual === ' / MERCADO LIVRE' ? 'selected' : ''}>4: / MERCADO LIVRE</option></select></div>
        <div class="conteudo-flexivel">
            <div class="header-nota"><div class="titulo-container"><span class="tag-topo">NOTA FISCAL</span><div class="nf-gigante">${data.nf}</div></div><div class="dados-data"><strong>DATA:</strong> <span>${data.data}</span></div></div>
            <section class="dados-secao"><div class="tag-secao">DESTINATÁRIO</div><p class="texto-destaque"><span>${data.destinatario}</span><span class="out-responsavel" style="color: #d32f2f;"></span></p></section>
            <section class="dados-secao"><div class="tag-secao">LOGÍSTICA</div><div class="grid-logistica"><div class="transp-info"><strong>TRANSP:</strong> <span class="transp-destaque" contenteditable="true">${data.transportadora}</span></div><div class="vol-container"><strong>VOLUMES:</strong> <input type="text" class="vol-gigante" value="${data.volumes}"></div></div></section>
            <div class="alerta-volume alerta-volume-capa" style="display: none;"></div>
            <section class="dados-secao tabela-container"><div class="tag-secao">ITENS PARA CONFERÊNCIA</div><table><thead><tr><th style="width: 10%;">QTD</th><th style="width: 75%;">DESCRIÇÃO DO PRODUTO</th><th style="width: 10%;">CONF.</th><th class="no-print" style="width: 5%;"></th></tr></thead><tbody>${itensHtml}</tbody></table></section>
        </div><div class="acoes-capa no-print"><button class="btn-print-capa">Imprimir esta capa</button></div>
    </div>`;
}

function atualizarResponsaveis() {
    document.querySelectorAll('.capa-impressao').forEach(capa => {
        const seletor = capa.querySelector('.responsavel-select-capa');
        const saida = capa.querySelector('.out-responsavel');
        if (seletor && saida) saida.textContent = seletor.value;
    });
}

document.getElementById('xmlInput').addEventListener('change', async function(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;
    try {
        const dados = await Promise.all(files.map(file => file.text().then(extrairDadosXml)));
        dados.sort((a, b) => {
            const transportadora = a.transportadora.localeCompare(b.transportadora, 'pt-BR', { sensitivity: 'base' });
            return transportadora !== 0 ? transportadora : (parseInt(a.nf) || 0) - (parseInt(b.nf) || 0);
        });
        let html = '';
        let ultimaTransportadora = null;
        dados.forEach((data, indice) => {
            if (data.transportadora !== ultimaTransportadora) {
                html += `<div class="grupo-transportadora"><strong>TRANSPORTADORA:</strong> ${data.transportadora}</div>`;
                ultimaTransportadora = data.transportadora;
            }
            html += gerarCapa(data, indice);
        });
        document.getElementById('printArea').innerHTML = html;
        document.getElementById('xmlSelectionInfo').textContent = `${dados.length} capa(s) carregada(s).`;
        document.getElementById('acoesCapas').style.display = dados.length ? 'flex' : 'none';
        atualizarResponsaveis();
        document.querySelectorAll('.capa-impressao').forEach(validarCapa);
    } catch (err) { alert("Erro ao ler um dos XMLs. Verifique os arquivos e tente novamente."); }
});

document.getElementById('printArea').addEventListener('click', function(event) {
    if (event.target.classList.contains('btn-del')) {
        const capa = event.target.closest('.capa-impressao');
        event.target.closest('tr').remove();
        validarCapa(capa);
    }
    if (event.target.classList.contains('btn-print-capa')) imprimirCapas([event.target.closest('.capa-impressao')]);
});

document.getElementById('printArea').addEventListener('input', function(event) {
    const capa = event.target.closest('.capa-impressao');
    if (!capa) return;
    if (event.target.classList.contains('vol-gigante')) {
        event.target.classList.remove('vol-alerta');
        capa.querySelector('.alerta-volume-capa').style.display = 'none';
    }
});

document.getElementById('printArea').addEventListener('blur', function(event) {
    const capa = event.target.closest('.capa-impressao');
    if (!capa) return;
    if (event.target.classList.contains('editavel-nome')) event.target.innerHTML = aplicarDestaques(event.target.innerText, false);
    if (event.target.classList.contains('editavel-nome') || event.target.classList.contains('editavel-qtd')) validarCapa(capa);
}, true);

document.getElementById('printArea').addEventListener('change', function(event) {
    if (!event.target.classList.contains('responsavel-select-capa')) return;
    const capa = event.target.closest('.capa-impressao');
    const responsavel = capa?.querySelector('.out-responsavel');
    if (responsavel) responsavel.textContent = event.target.value;
});

function ordenarCapasParaImpressao(direcao) {
    const area = document.getElementById('printArea');
    const capas = Array.from(area.querySelectorAll('.capa-impressao'));
    const grupos = new Map();
    capas.forEach(capa => {
        const nome = capa.dataset.transportadora || 'NÃO INFORMADO';
        if (!grupos.has(nome)) grupos.set(nome, []);
        grupos.get(nome).push(capa);
    });

    const fragmento = document.createDocumentFragment();
    const fator = direcao === 'desc' ? -1 : 1;
    grupos.forEach(lista => lista.sort((a, b) => fator * ((parseInt(a.dataset.nf) || 0) - (parseInt(b.dataset.nf) || 0))));
    const gruposOrdenados = Array.from(grupos.entries()).sort((a, b) => fator * a[0].localeCompare(b[0], 'pt-BR', { sensitivity: 'base' }));
    gruposOrdenados.forEach(([nome, lista]) => {
        const titulo = document.createElement('div');
        titulo.className = 'grupo-transportadora';
        titulo.innerHTML = `<strong>TRANSPORTADORA:</strong> ${nome}`;
        fragmento.appendChild(titulo);
        lista.forEach(capa => fragmento.appendChild(capa));
    });
    area.innerHTML = '';
    area.appendChild(fragmento);
}

function imprimirCapas(capas) {
    const direcao = document.querySelector('input[name="ordemImpressao"]:checked')?.value || 'asc';
    ordenarCapasParaImpressao(direcao);
    const capasOrdenadas = Array.from(document.querySelectorAll('.capa-impressao'));
    const todas = Array.from(document.querySelectorAll('.capa-impressao'));
    const nfSelecionadas = new Set(capas.map(capa => `${capa.dataset.transportadora}|${capa.dataset.nf}`));
    todas.forEach(capa => capa.classList.toggle('somente-impressao', !nfSelecionadas.has(`${capa.dataset.transportadora}|${capa.dataset.nf}`)));
    acionarChecklist();
    window._capasParaImprimir = capasOrdenadas;
}

function prepararImpressaoConfirmada() {
    const direcao = document.querySelector('input[name="ordemImpressao"]:checked')?.value || 'asc';
    const selecionadas = new Set((window._capasParaImprimir || []).map(capa => `${capa.dataset.transportadora}|${capa.dataset.nf}`));
    ordenarCapasParaImpressao(direcao);
    document.querySelectorAll('.capa-impressao').forEach(capa => {
        capa.classList.toggle('somente-impressao', !selecionadas.has(`${capa.dataset.transportadora}|${capa.dataset.nf}`));
    });
}

document.getElementById('btnImprimirTodas').addEventListener('click', () => imprimirCapas(Array.from(document.querySelectorAll('.capa-impressao'))));

async function baixarCapasEmZip() {
    const capas = Array.from(document.querySelectorAll('.capa-impressao'));
    if (!capas.length) return;
    if (!window.JSZip || !window.html2canvas || !window.jspdf) {
        alert('Não foi possível carregar os componentes para gerar os PDFs. Verifique sua conexão e tente novamente.');
        return;
    }

    const zip = new JSZip();
    const botao = document.getElementById('btnBaixarCapas');
    const textoOriginal = botao.textContent;
    botao.disabled = true;

    try {
        for (let i = 0; i < capas.length; i++) {
            const capa = capas[i];
            botao.textContent = `Gerando PDF ${i + 1}/${capas.length}...`;
            const copia = capa.cloneNode(true);
            copia.classList.remove('somente-impressao');
            copia.classList.add('pdf-print-mode');
            copia.style.width = '1123px';
            copia.style.minHeight = '794px';
            copia.style.height = 'auto';
            copia.style.boxSizing = 'border-box';
            copia.style.position = 'fixed';
            copia.style.left = '-10000px';
            copia.style.top = '0';
            copia.style.zIndex = '-1';
            copia.style.overflow = 'visible';
            copia.querySelectorAll('.no-print').forEach(el => el.style.display = 'none');
            copia.querySelectorAll('.vol-gigante').forEach(input => {
                const quadro = document.createElement('div');
                quadro.className = 'vol-gigante volume-pdf-value';
                quadro.textContent = input.value || input.getAttribute('value') || '1';
                input.replaceWith(quadro);
            });
            document.body.appendChild(copia);
            const alturaCaptura = Math.max(794, copia.scrollHeight);

            const canvas = await html2canvas(copia, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                width: 1123,
                height: alturaCaptura,
                windowWidth: 1123,
                windowHeight: alturaCaptura,
                scrollX: 0,
                scrollY: 0
            });
            const pdf = new window.jspdf.jsPDF('l', 'mm', 'a4');
            const paginaLargura = 297;
            const paginaAltura = 210;
            const margem = 5;
            const escala = Math.min((paginaLargura - margem * 2) / canvas.width, (paginaAltura - margem * 2) / canvas.height);
            const largura = canvas.width * escala;
            const altura = canvas.height * escala;
            const margemX = (paginaLargura - largura) / 2;
            const margemY = (paginaAltura - altura) / 2;
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margemX, margemY, largura, altura);
            const nf = capa.dataset.nf || 'SEM_NUMERO';
            zip.file(`NF ${nf}.pdf`, pdf.output('blob'));
            copia.remove();
        }

        botao.textContent = 'Compactando ZIP...';
        const arquivoZip = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(arquivoZip);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'capas-notas-fiscais.zip';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (erro) {
        alert('Não foi possível gerar o ZIP das capas. Tente novamente.');
        console.error(erro);
    } finally {
        document.querySelectorAll('.pdf-print-mode').forEach(el => el.remove());
        botao.disabled = false;
        botao.textContent = textoOriginal;
    }
}

document.getElementById('btnBaixarCapas').addEventListener('click', baixarCapasEmZip);

// ==========================================
// MODAL DE CHECKLIST E ATALHOS DE IMPRESSÃO
// ==========================================
const modal = document.getElementById('modalChecklist');
const btnAbrirChecklist = document.getElementById('btnAbrirChecklist');
const btnCancelarModal = document.getElementById('btnCancelarModal');
const btnConfirmarImpressao = document.getElementById('btnConfirmarImpressao');
const checkboxes = document.querySelectorAll('.chk-conferencia');

// Função para abrir o modal de checklist
function acionarChecklist() {
    checkboxes.forEach(chk => chk.checked = false);
    btnConfirmarImpressao.disabled = true;
    modal.style.display = 'flex';
}

document.querySelectorAll('input[name="ordemImpressao"]').forEach(opcao => {
    opcao.addEventListener('change', function() {
        ordenarCapasParaImpressao(this.value);
    });
});

// Clicar no botão chama o modal para imprimir todas as capas
btnAbrirChecklist.addEventListener('click', () => {
    const capas = Array.from(document.querySelectorAll('.capa-impressao'));
    if (capas.length) imprimirCapas(capas);
    else acionarChecklist();
});

btnCancelarModal.addEventListener('click', () => {
    modal.style.display = 'none';
    document.querySelectorAll('.somente-impressao').forEach(capa => capa.classList.remove('somente-impressao'));
});

checkboxes.forEach(chk => {
    chk.addEventListener('change', () => {
        const todosMarcados = Array.from(checkboxes).every(c => c.checked);
        btnConfirmarImpressao.disabled = !todosMarcados;
    });
});

btnConfirmarImpressao.addEventListener('click', () => {
    prepararImpressaoConfirmada();
    modal.style.display = 'none';
    window.print();
    document.querySelectorAll('.somente-impressao').forEach(capa => capa.classList.remove('somente-impressao'));
});

// Interceptar o atalho Ctrl + P (ou Cmd + P no Mac)
window.addEventListener('keydown', function(event) {
    if ((event.ctrlKey || event.metaKey) && (event.key === 'p' || event.key === 'P')) {
        event.preventDefault(); // Impede o navegador de abrir a tela de impressão direto
        const capas = Array.from(document.querySelectorAll('.capa-impressao'));
        if (capas.length) imprimirCapas(capas);
        else acionarChecklist(); // Força a abertura do modal de checklist
    }
});
