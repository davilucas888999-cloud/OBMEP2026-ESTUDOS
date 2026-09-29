/**
 * PORTAL DO PROFESSOR 2026 - ARQUITETURA DE CÓDIGO FONTE EXPANDIDA
 * SISTEMA OPERACIONAL MÓVEL PARA LANÇAMENTO DE AVALIAÇÕES E NOTAS
 */

const CONFIG = {
    schoolName: "EM DR CUSTÓDIO DE PAULA RODRIGUES",
    schoolNameFull: "ESCOLA MUNICIPAL DR. CUSTÓDIO DE PAULA RODRIGUES",
    turmaName: "8º ANO 800",
    ano: 2026,
    limitPoints: 25.00,
    passingScorePct: 0.60 // Média institucional de 60% para definição das cores
};

const ALUNOS_INICIAIS = [
    "ADRIELE APARECIDA MENDES ARAUJO", "ANA JULIA SILVA DE LAIA", "DAVI LUCAS PAULINO DA COSTA",
    "EMANUELLY CRISTINA DA COSTA LEVINO", "FABIELLY HIGINO DIAS", "GABRIEL COTTA QUEIROZ",
    "GLENO HENRIQUE MARTINS GOMES DE MIRANDA", "HANIELE PEREIRA ALVES", "IKARO EMANUEL DE LIMA MIRANDA",
    "JONATAS PASSOS BRAGA", "JÚLIA DA SILVA LOBATO", "LAYANE APARECIDA MENDES FERNANDES",
    "LUAN FERNANDO SILVA FIALHO", "LUIS OTAVIO DA COSTA VITOR", "MARIA EDUARDA CHAVES LIMA",
    "MARIA EDUARDA PEREIRA DE LIMA", "MARIA LUISA MENDES OLIVEIRA", "MARIA OLIVIA SILVA CHAVES",
    "MARIA SOPHIA FERNANDES DE SOUZA", "NATHAN MIRANDA ALVES", "NICOLE DE OLIVEIRA LIMA",
    "WESLEY COTA BERNARDES", "YASMIN DOS SANTOS FERREIRA"
];

// Cadastro oficial da turma: a ordem do array é a ordem de chamada/matrícula.
let ALUNOS = [];
const DATAS_MATRICULA_INICIAIS = {
    "ADRIELE APARECIDA MENDES ARAUJO": "09/02/2022",
    "LUIS OTAVIO DA COSTA VITOR": "07/02/2023",
    "HANIELE PEREIRA ALVES": "07/02/2023",
    "JONATAS PASSOS BRAGA": "07/02/2023",
    "JÚLIA DA SILVA LOBATO": "04/02/2026"
};

// Ordem Reorganizada das Disciplinas
const DISCIPLINAS = [
    "Língua Portuguesa", "Educação Física", "Arte", "Língua Inglesa", 
    "Matemática", "Ciências", "História", "Geografia", "Ensino Religioso"
];

const ICONS_DISC = { 
    "Arte": "fa-palette", "Ensino Religioso": "fa-hands-asl-interpreting", 
    "Língua Portuguesa": "fa-language", "Matemática": "fa-calculator", 
    "História": "fa-landmark", "Ciências": "fa-flask", 
    "Língua Inglesa": "fa-atlas", "Geografia": "fa-globe-americas", 
    "Educação Física": "fa-running" 
};

const DB_KEY = "sigenotas_v4_mobile2026";
let db = {};

// Variáveis voláteis de navegação interna
let selectedMateria = "";
let selectedBimestre = "1";
let selectedAtividadeId = "";
let myChartInstance = null;

// Inicialização Primária do Sistema
document.addEventListener("DOMContentLoaded", () => {
    initDatabaseEngine();
    renderMateriaBlocks();
    renderLancamentoSeletorHome();
    updateGlobalBimestreUI();
    applyThemeLoad();
});

function gerarNumeroMatricula(ano, ordem) {
    return `${ano}${CONFIG.turmaName.match(/\d{3}/)?.[0] || '800'}${String(ordem).padStart(2, '0')}`;
}

function obterDataMatriculaInicial(aluno) {
    return DATAS_MATRICULA_INICIAIS[aluno] || "05/02/2024";
}

function inicializarCadastroAlunos() {
    if (!Array.isArray(db.alunosCadastro)) {
        db.alunosCadastro = ALUNOS_INICIAIS.map((nome, index) => {
            const data = obterDataMatriculaInicial(nome);
            const ano = Number(data.split('/')[2]);
            return { nome, dataMatricula: data, dataNascimento: "", matricula: gerarNumeroMatricula(ano, index + 1) };
        });
    } else {
        // Migração segura: garante cadastro completo dos alunos antigos sem alterar notas.
        const nomesExistentes = new Set(db.alunosCadastro.map(a => a.nome));
        ALUNOS_INICIAIS.forEach(nome => {
            if (!nomesExistentes.has(nome)) {
                const ordem = db.alunosCadastro.length + 1;
                const data = obterDataMatriculaInicial(nome);
                const ano = Number(data.split('/')[2]);
                db.alunosCadastro.push({ nome, dataMatricula: data, dataNascimento: "", matricula: gerarNumeroMatricula(ano, ordem) });
            }
        });
        db.alunosCadastro.forEach((a, index) => {
            if (!a.dataMatricula) a.dataMatricula = obterDataMatriculaInicial(a.nome);
            if (a.dataNascimento === undefined) a.dataNascimento = "";
            const ano = Number(String(a.dataMatricula).split('/')[2]) || CONFIG.ano;
            a.matricula = gerarNumeroMatricula(ano, index + 1);
        });
    }
    ALUNOS = db.alunosCadastro.map(a => a.nome);
    saveStorage();
}

function getCadastroAluno(nome) {
    return (db.alunosCadastro || []).find(a => a.nome === nome) || { nome, dataMatricula: "", dataNascimento: "", matricula: "" };
}

function formatarDataMatricula(data) {
    if (!data) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) return data;
    const d = new Date(data + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return data;
    return d.toLocaleDateString('pt-BR');
}

function formatarDataNascimento(data) {
    return formatarDataMatricula(data);
}

function dataBRParaISO(data) {
    if (!data) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
    const m = String(data).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

function renderCadastroAlunos() {
    const corpo = document.getElementById('table-cadastro-alunos-corpo');
    if (!corpo) return;
    corpo.innerHTML = ALUNOS.map((aluno, index) => {
        const c = getCadastroAluno(aluno);
        return `<tr>
            <td>${String(index + 1).padStart(2, '0')}</td>
            <td><strong>${escapeHtml(c.matricula)}</strong></td>
            <td><strong>${escapeHtml(aluno)}</strong></td>
            <td>${formatarDataMatricula(c.dataMatricula)}</td>
            <td>${formatarDataNascimento(c.dataNascimento)}</td>
            <td class="student-actions-cell">
                <button class="btn-table-edit" onclick="editarAluno('${escapeAttr(aluno)}')"><i class="fas fa-pen"></i> Alterar</button>
                <button class="btn-table-delete" onclick="excluirAluno('${escapeAttr(aluno)}')"><i class="fas fa-trash"></i> Excluir</button>
            </td>
        </tr>`;
    }).join('');
}

function abrirCadastroAlunos() {
    navigate('cadastro-alunos');
    renderCadastroAlunos();
}

function cadastrarNovoAluno(event) {
    event.preventDefault();
    const nomeInput = document.getElementById('novo-aluno-nome');
    const dataInput = document.getElementById('novo-aluno-data');
    const nascimentoInput = document.getElementById('novo-aluno-nascimento');
    const nome = (nomeInput.value || '').trim().replace(/\s+/g, ' ').toUpperCase();
    if (!nome) return alert('Informe o nome completo do aluno.');
    if (ALUNOS.some(a => a.toUpperCase() === nome)) return alert('Este aluno já está cadastrado.');

    const data = dataInput.value ? formatarDataMatricula(dataInput.value) : new Date().toLocaleDateString('pt-BR');
    const nascimento = nascimentoInput?.value ? formatarDataMatricula(nascimentoInput.value) : '';
    const ordem = (db.alunosCadastro || []).length + 1;
    const ano = Number(data.split('/')[2]) || CONFIG.ano;
    const cadastro = { nome, dataMatricula: data, dataNascimento: nascimento, matricula: gerarNumeroMatricula(ano, ordem) };
    db.alunosCadastro.push(cadastro);
    ALUNOS.push(nome);

    if (typeof renderLancamentoSeletorHome === 'function') renderLancamentoSeletorHome('');
    DISCIPLINAS.forEach(m => {
        for (let b = 1; b <= 4; b++) {
            (db.disciplinas[m][b].atividades || []).forEach(atv => {
                if (!atv.notas) atv.notas = {};
                if (!atv.notas[nome]) atv.notas[nome] = { notaOrig: '', notaRec: '', notaFinal: 0.0 };
            });
            if (!db.disciplinas[m][b].recuperacaoBimestral) db.disciplinas[m][b].recuperacaoBimestral = {};
        }
    });
    saveStorage();
    renderCadastroAlunos();
    renderMateriaBlocks();
    if (typeof renderBoletimIndividualList === 'function') renderBoletimIndividualList();
    event.target.reset();
    alert(`Aluno cadastrado com sucesso.\nMatrícula: ${cadastro.matricula}\nOrdem de chamada: ${String(ordem).padStart(2, '0')}`);
}

function editarAluno(nomeAtual) {
    const c = getCadastroAluno(nomeAtual);
    const modal = document.getElementById('edit-aluno-modal');
    if (!modal) return;
    document.getElementById('edit-aluno-original').value = nomeAtual;
    document.getElementById('edit-aluno-nome').value = c.nome || '';
    document.getElementById('edit-aluno-data').value = dataBRParaISO(c.dataMatricula);
    document.getElementById('edit-aluno-nascimento').value = dataBRParaISO(c.dataNascimento);
    modal.style.display = 'flex';
    setTimeout(() => document.getElementById('edit-aluno-nome')?.focus(), 50);
}

function fecharModalEditarAluno() {
    const modal = document.getElementById('edit-aluno-modal');
    if (modal) modal.style.display = 'none';
}

function salvarEdicaoAluno(event) {
    event.preventDefault();
    const nomeAtual = document.getElementById('edit-aluno-original').value;
    const c = getCadastroAluno(nomeAtual);
    const nome = (document.getElementById('edit-aluno-nome').value || '').trim().replace(/\s+/g, ' ').toUpperCase();
    const dataMatriculaISO = document.getElementById('edit-aluno-data').value;
    const dataNascimentoISO = document.getElementById('edit-aluno-nascimento').value;

    if (!nome) return alert('Informe o nome completo do aluno.');
    if (nome !== nomeAtual && ALUNOS.some(a => a.toUpperCase() === nome)) {
        return alert('Já existe outro aluno com esse nome.');
    }

    const dataMatricula = dataMatriculaISO ? formatarDataMatricula(dataMatriculaISO) : c.dataMatricula;
    const dataNascimento = dataNascimentoISO ? formatarDataMatricula(dataNascimentoISO) : '';

    c.nome = nome;
    c.dataMatricula = dataMatricula;
    c.dataNascimento = dataNascimento;

    if (nome !== nomeAtual) {
        DISCIPLINAS.forEach(m => {
            for (let b = 1; b <= 4; b++) {
                const bData = db.disciplinas[m][b];
                (bData.atividades || []).forEach(atv => {
                    if (atv.notas && Object.prototype.hasOwnProperty.call(atv.notas, nomeAtual)) {
                        atv.notas[nome] = atv.notas[nomeAtual];
                        delete atv.notas[nomeAtual];
                    }
                });
                if (bData.recuperacaoBimestral && Object.prototype.hasOwnProperty.call(bData.recuperacaoBimestral, nomeAtual)) {
                    bData.recuperacaoBimestral[nome] = bData.recuperacaoBimestral[nomeAtual];
                    delete bData.recuperacaoBimestral[nomeAtual];
                }
                if (bData.faltas && Object.prototype.hasOwnProperty.call(bData.faltas, nomeAtual)) {
                    bData.faltas[nome] = bData.faltas[nomeAtual];
                    delete bData.faltas[nomeAtual];
                }
                for (const dia of DIAS_SEMANA.map(x=>x[0])) {
                    if (db.faltasDiarias?.[b]?.[dia] && Object.prototype.hasOwnProperty.call(db.faltasDiarias[b][dia], nomeAtual)) {
                        db.faltasDiarias[b][dia][nome] = db.faltasDiarias[b][dia][nomeAtual];
                        delete db.faltasDiarias[b][dia][nomeAtual];
                    }
                }
            }
        });
        const idx = ALUNOS.indexOf(nomeAtual);
        if (idx >= 0) ALUNOS[idx] = nome;
    }

    const idx = db.alunosCadastro.findIndex(a => a.nome === nome);
    if (idx >= 0) {
        const ordem = idx + 1;
        const ano = Number(c.dataMatricula.split('/')[2]) || CONFIG.ano;
        c.matricula = gerarNumeroMatricula(ano, ordem);
    }

    saveStorage();
    fecharModalEditarAluno();
    renderCadastroAlunos();
    renderMateriaBlocks();
    if (typeof renderBoletimIndividualList === 'function') renderBoletimIndividualList();
    if (selectedAtividadeId) {
        const atv = db.disciplinas[selectedMateria]?.[selectedBimestre]?.atividades?.find(a => a.id === selectedAtividadeId);
        if (atv) renderNotasTable(atv);
    }
}


function excluirAluno(nome) {
    const aluno = getCadastroAluno(nome);
    const confirma = confirm(`Excluir o aluno "${nome}" do sistema?\n\nAs notas e faltas desse aluno também serão removidas da base local.`);
    if (!confirma) return;

    db.alunosCadastro = (db.alunosCadastro || []).filter(a => a.nome !== nome);
    ALUNOS = ALUNOS.filter(a => a !== nome);

    DISCIPLINAS.forEach(m => {
        for (let b = 1; b <= 4; b++) {
            const bData = db.disciplinas[m][b];
            (bData.atividades || []).forEach(atv => {
                if (atv.notas) delete atv.notas[nome];
            });
            if (bData.recuperacaoBimestral) delete bData.recuperacaoBimestral[nome];
            if (bData.faltas) delete bData.faltas[nome];
            for (const dia of DIAS_SEMANA.map(x=>x[0])) {
                if (db.faltasDiarias?.[b]?.[dia]) delete db.faltasDiarias[b][dia][nome];
            }
        }
        if (db.disciplinas[m].recuperacaoAnual) delete db.disciplinas[m].recuperacaoAnual[nome];
    });

    saveStorage();
    renderCadastroAlunos();
    renderMateriaBlocks();
    if (typeof renderBoletimIndividualList === 'function') renderBoletimIndividualList();
    alert('Aluno excluído com sucesso.');
}


const DIAS_SEMANA=[['segunda','SEGUNDA-FEIRA'],['terca','TERÇA-FEIRA'],['quarta','QUARTA-FEIRA'],['quinta','QUINTA-FEIRA'],['sexta','SEXTA-FEIRA']];
const GRADE_PADRAO={
 segunda:['Língua Portuguesa','Ensino Religioso','Geografia','Língua Portuguesa','História'],
 terca:['Educação Física','Língua Portuguesa','Ciências','Matemática','Língua Portuguesa'],
 quarta:['Geografia','Língua Portuguesa','Matemática','Língua Inglesa','Ciências'],
 quinta:['Matemática','Geografia','Língua Inglesa','Ciências','Matemática'],
 sexta:['História','Educação Física','Arte','Matemática','Língua Portuguesa']
};
function garantirEstruturaFaltas(){
 if(!db.gradeAulas||typeof db.gradeAulas!=='object')db.gradeAulas={};
 // A grade da turma é fixa e já definida pelo professor.
 // Ela é gravada para os quatro bimestres exatamente como informada.
 [1,2,3,4].forEach(b=>{
  if(!db.gradeAulas[b])db.gradeAulas[b]={};
  DIAS_SEMANA.forEach(([dia])=>{if(!Array.isArray(db.gradeAulas[b][dia])||db.gradeAulas[b][dia].length!==5)db.gradeAulas[b][dia]=GRADE_PADRAO[dia].slice();});
 });
 if(!db.faltasDiarias||typeof db.faltasDiarias!=='object')db.faltasDiarias={};
 if(!db.faltasPorDisciplina||typeof db.faltasPorDisciplina!=='object')db.faltasPorDisciplina={};
 [1,2,3,4].forEach(b=>{
  if(!db.gradeAulas[b])db.gradeAulas[b]={};
  if(!db.faltasDiarias[b])db.faltasDiarias[b]={};
  if(!db.faltasPorDisciplina[b])db.faltasPorDisciplina[b]={};
  DIAS_SEMANA.forEach(([dia])=>{
   if(!Array.isArray(db.gradeAulas[b][dia])||db.gradeAulas[b][dia].length!==5)db.gradeAulas[b][dia]=GRADE_PADRAO[dia].slice();
   else db.gradeAulas[b][dia]=db.gradeAulas[b][dia].map((v,i)=>v||GRADE_PADRAO[dia][i]);
   if(!db.faltasDiarias[b][dia])db.faltasDiarias[b][dia]={};
  });
  DISCIPLINAS.forEach(d=>{
   if(!db.faltasPorDisciplina[b][d])db.faltasPorDisciplina[b][d]={};
   DIAS_SEMANA.forEach(([dia])=>{if(!db.faltasPorDisciplina[b][d][dia])db.faltasPorDisciplina[b][d][dia]={};});
  });
 });
}
function listaDisciplinasOptions(selected=''){return DISCIPLINAS.map(d=>`<option value="${escapeAttr(d)}" ${d===selected?'selected':''}>${escapeHtml(d.toUpperCase())}</option>`).join('');}
function limparSelectLancamento(id){const el=document.getElementById(id);if(el)el.value='';}
function renderLancamentoSeletorHome(tipoInicial=''){
    const box=document.getElementById('lancamento-seletor-home');
    if(!box)return;
    const incluirRec=todosOsBimestresFechados();
    box.innerHTML=`<div class="lancamento-filtros lancamento-filtros-unificados lancamento-home-filtros">
        <div class="lancamento-field tipo-field"><label for="home-tipo-lancamento">TIPO DE LANÇAMENTO</label><select id="home-tipo-lancamento" onchange="atualizarTipoLancamentoInline()">
            <option value="" ${tipoInicial?'':'selected'} disabled>SELECIONE</option>
            <option value="faltas" ${tipoInicial==='faltas'?'selected':''}>LANÇAMENTO DE FALTAS</option>
            <option value="notas" ${tipoInicial==='notas'?'selected':''}>LANÇAMENTO DE NOTAS</option>
            ${incluirRec?`<option value="rec-anual" ${tipoInicial==='rec-anual'?'selected':''}>LANÇAR RECUPERAÇÃO ANUAL</option>`:''}
        </select></div>
        <div id="home-filtros-dinamicos" class="lancamento-filtros-dinamicos"></div>
        <div id="home-buscar-wrap" class="lancamento-buscar-wrap"></div>
    </div>`;
    atualizarTipoLancamentoInline();
}

/*
 * CENTRAL DA TELA INICIAL
 * Estes são os únicos selects usados pelo fluxo principal de lançamentos.
 * A área de resultado é SEMPRE #lancamento-inline-resultado, existente no HTML.
 */
function atualizarTipoLancamentoInline(){
    const tipo=document.getElementById('home-tipo-lancamento')?.value||'';
    const filtros=document.getElementById('home-filtros-dinamicos');
    const buscar=document.getElementById('home-buscar-wrap');
    const resultado=document.getElementById('lancamento-inline-resultado');
    if(!filtros||!buscar)return;
    filtros.innerHTML='';
    buscar.innerHTML='';
    if(resultado)resultado.innerHTML='';
    if(!tipo)return;

    if(tipo==='faltas'){
        filtros.innerHTML=`<div class="lancamento-field"><label for="home-bimestre-lancamento">BIMESTRE</label><select id="home-bimestre-lancamento"><option value="" selected disabled>SELECIONE</option><option value="1">1º BIMESTRE</option><option value="2">2º BIMESTRE</option><option value="3">3º BIMESTRE</option><option value="4">4º BIMESTRE</option></select></div>`;
        buscar.innerHTML='<button class="btn-submit-action btn-buscar-lancamento" type="button" onclick="buscarLancamentoFaltasHome()"><i class="fas fa-search"></i> BUSCAR</button>';
    }else if(tipo==='notas'){
        filtros.innerHTML=`<div class="lancamento-field"><label for="home-bimestre-lancamento">BIMESTRE</label><select id="home-bimestre-lancamento"><option value="" selected disabled>SELECIONE</option><option value="1">1º BIMESTRE</option><option value="2">2º BIMESTRE</option><option value="3">3º BIMESTRE</option><option value="4">4º BIMESTRE</option></select></div><div class="lancamento-field"><label for="home-notas-disciplina">DISCIPLINA</label><select id="home-notas-disciplina"><option value="" selected disabled>SELECIONE</option>${listaDisciplinasOptions()}</select></div>`;
        buscar.innerHTML='<button class="btn-submit-action btn-buscar-lancamento" type="button" onclick="buscarLancamentoNotasHome()"><i class="fas fa-search"></i> BUSCAR</button>';
    }else if(tipo==='rec-anual'){
        if(!todosOsBimestresFechados()){
            filtros.innerHTML='<div class="lancamento-placeholder">A RECUPERAÇÃO ANUAL SERÁ LIBERADA APÓS O FECHAMENTO DOS 4 BIMESTRES.</div>';
            return;
        }
        filtros.innerHTML=`<div class="lancamento-field"><label for="home-rec-anual-disciplina">DISCIPLINA</label><select id="home-rec-anual-disciplina"><option value="" selected disabled>SELECIONE</option>${listaDisciplinasOptions()}</select></div>`;
        buscar.innerHTML='<button class="btn-submit-action btn-buscar-lancamento" type="button" onclick="buscarRecuperacaoAnualHome()"><i class="fas fa-search"></i> BUSCAR</button>';
    }
}

function obterAreaLancamentoHome(){
    return document.getElementById('lancamento-inline-resultado');
}

function buscarLancamentoFaltasHome(){
    garantirEstruturaFaltas();
    const b=Number(document.getElementById('home-bimestre-lancamento')?.value||0);
    const area=obterAreaLancamentoHome();
    if(!area)return;
    if(!b){alert('Selecione o BIMESTRE antes de buscar.');return;}

    const aulasPorDia=DIAS_SEMANA.map(([dia,nome])=>({dia,nome,qtd:(db.gradeAulas[b][dia]||[]).filter(Boolean).length}));
    area.innerHTML=`
      <div class="planilha-resumo frequencia-resumo"><div><strong>${b}º BIMESTRE</strong> · 5 AULAS POR DIA</div><div class="frequencia-dia-resumo">${aulasPorDia.map(x=>`<span>${x.nome.replace('-FEIRA','')}: ${x.qtd}</span>`).join('')}</div></div>
      <div class="frequencia-instruction"><i class="fas fa-circle-info"></i><div><strong>REGRA:</strong> lance de 0 a 5 faltas por aluno em cada dia. A falta por disciplina é calculada automaticamente pela quantidade de aulas daquela disciplina no dia.</div></div>
      <div class="table-responsive-container"><table class="table-custom-format faltas-diarias-table"><thead><tr><th>ALUNO</th>${DIAS_SEMANA.map(([d,n])=>`<th>${n}</th>`).join('')}<th>TOTAL NO BIMESTRE</th></tr></thead><tbody>
      ${ALUNOS.map(aluno=>{let total=0;const cells=DIAS_SEMANA.map(([dia])=>{const v=obterFaltaDia(b,dia,aluno);total+=v;return `<td><input class="falta-diaria-input" data-aluno="${escapeAttr(aluno)}" data-dia="${dia}" type="number" min="0" max="5" step="1" value="${v}" oninput="atualizarTotaisFaltasHome()" onkeydown="avancarCampoComEnter(event)"></td>`}).join('');return `<tr><td><strong>${escapeHtml(aluno)}</strong></td>${cells}<td class="faltas-dia-total" data-aluno="${escapeAttr(aluno)}">${total}</td></tr>`}).join('')}
      </tbody></table></div>
      <div class="save-launch-bar"><span>As faltas por disciplina são calculadas automaticamente pela grade cadastrada.</span><button class="btn-submit-action" type="button" onclick="salvarFaltasHome()"><i class="fas fa-save"></i> SALVAR LANÇAMENTO</button></div>`;
}

function atualizarTotaisFaltasHome(){
    document.querySelectorAll('#lancamento-inline-resultado .faltas-diarias-table tbody tr').forEach(row=>{
        let total=0;
        row.querySelectorAll('.falta-diaria-input').forEach(input=>{
            total+=Math.max(0,Math.min(5,Number(input.value)||0));
        });
        const out=row.querySelector('.faltas-dia-total');
        if(out)out.textContent=total;
    });
}

function salvarFaltasHome(){
    const b=Number(document.getElementById('home-bimestre-lancamento')?.value||0);
    if(!b){alert('Selecione o BIMESTRE antes de salvar o lançamento.');return;}
    garantirEstruturaFaltas();

    document.querySelectorAll('#lancamento-inline-resultado .falta-diaria-input').forEach(input=>{
        const aluno=input.dataset.aluno,dia=input.dataset.dia;
        const v=Math.max(0,Math.min(5,Math.round(Number(String(input.value||'0').replace(',','.'))||0)));
        if(!db.faltasDiarias[b])db.faltasDiarias[b]={};
        if(!db.faltasDiarias[b][dia])db.faltasDiarias[b][dia]={};
        db.faltasDiarias[b][dia][aluno]=v;
    });

    DISCIPLINAS.forEach(d=>DIAS_SEMANA.forEach(([dia])=>{
        if(!db.faltasPorDisciplina[b][d])db.faltasPorDisciplina[b][d]={};
        db.faltasPorDisciplina[b][d][dia]={};
        ALUNOS.forEach(aluno=>{
            const v=calcularFaltasDisciplinaDia(b,d,dia,aluno);
            if(v)db.faltasPorDisciplina[b][d][dia][aluno]=v;
        });
    }));

    saveStorage();
    buscarLancamentoFaltasHome();
    alert('Lançamento de faltas salvo com sucesso.');
}

function buscarLancamentoNotasHome(){
    const b=Number(document.getElementById('home-bimestre-lancamento')?.value||0);
    const disciplina=document.getElementById('home-notas-disciplina')?.value||'';
    const area=obterAreaLancamentoHome();
    if(!area)return;
    if(!b||!disciplina){alert('Selecione o BIMESTRE e a DISCIPLINA antes de buscar.');return;}

    selectedBimestre=b;
    selectedMateria=disciplina;
    garantirEstruturaFaltas();

    const bData=db.disciplinas[disciplina][b];
    const atividades=bData.atividades||[];
    const fechado=!!db.configGlobal.bimestresFechados[b];

    if(!atividades.length){
        area.innerHTML=`<div class="empty-state-panel">Nenhuma atividade avaliativa foi criada para este bimestre. <button type="button" class="btn-secondary-action" onclick="abrirCriacaoAtividadeCentral()">CRIAR ATIVIDADE</button></div>`;
        return;
    }

    area.innerHTML=`
      <div class="notas-central-head"><div><strong>${escapeHtml(disciplina.toUpperCase())}</strong><span>${b}º BIMESTRE · ${atividades.length} ATIVIDADE(S)</span></div><div class="notas-central-head-actions"><button class="btn-secondary-action" ${fechado?'disabled':''} onclick="abrirCriacaoAtividadeCentral()"><i class="fas fa-plus"></i> CRIAR ATIVIDADE</button><button class="btn-submit-action" ${fechado?'disabled':''} onclick="salvarLancamentoNotasHome()"><i class="fas fa-save"></i> SALVAR LANÇAMENTO</button></div></div>
      <div class="table-responsive-container"><table class="table-custom-format notas-inline-table"><thead><tr><th>ALUNO</th>${atividades.map((a,i)=>`<th><div class="atividade-inline-header"><span>ATIVIDADE ${i+1}</span><strong>${escapeHtml(a.nome.toUpperCase())}</strong><small>VALOR: ${Number(a.valor).toFixed(1)}</small><div class="atividade-header-actions"><button type="button" class="btn-grade-edit" onclick="editAtividade('${a.id}')" ${fechado?'disabled':''} title="Editar atividade"><i class="fas fa-pen"></i></button><button type="button" class="btn-grade-delete" onclick="deleteAtividade('${a.id}')" ${fechado?'disabled':''} title="Excluir atividade"><i class="fas fa-trash"></i></button></div></div></th>`).join('')}<th>NOTA FINAL DO BIMESTRE</th></tr></thead><tbody>
      ${ALUNOS.map((aluno,idx)=>`<tr><td><strong>${idx+1}. ${escapeHtml(aluno)}</strong></td>${atividades.map(a=>{const nd=a.notas?.[aluno]||{notaOrig:'',notaRec:'',notaFinal:0},corte=Number(a.valor)*CONFIG.passingScorePct,recDisabled=(nd.notaOrig!==''&&Number(nd.notaOrig)>=corte)||fechado,final=Number(nd.notaFinal)||0;return `<td class="atividade-stacked-cell"><div class="nota-field-stack"><label>NOTA</label><input class="nota-inline-input" type="text" inputmode="decimal" value="${escapeAttr(nd.notaOrig??'')}" data-aluno="${escapeAttr(aluno)}" data-atv="${escapeAttr(a.id)}" data-campo="notaOrig" data-max="${a.valor}" ${fechado?'disabled':''} oninput="atualizarNotaHome(this)" onkeydown="avancarCampoComEnter(event)"></div><div class="nota-field-stack recuperacao-field"><label>RECUPERAÇÃO</label><input class="rec-inline-input" type="text" inputmode="decimal" value="${escapeAttr(nd.notaRec??'')}" data-aluno="${escapeAttr(aluno)}" data-atv="${escapeAttr(a.id)}" data-campo="notaRec" data-max="${a.valor}" ${recDisabled?'disabled':''} oninput="atualizarNotaHome(this)" onkeydown="avancarCampoComEnter(event)"></div><div class="nota-field-stack nota-final-field"><label>NOTA FINAL</label><div id="home-final-${safeId(a.id)}-${safeId(aluno)}" class="nota-final-value ${final>=corte?'nota-alta':'nota-baixa'}">${final.toFixed(1)}</div></div></td>`}).join('')}<td class="nota-final-bimestre-cell"><strong id="home-bim-${safeId(aluno)}">${atividades.reduce((s,a)=>s+(Number(a.notas?.[aluno]?.notaFinal)||0),0).toFixed(1)}</strong></td></tr>`).join('')}
      </tbody></table></div>`;
}

function atualizarNotaHome(input){
    const aluno=input.dataset.aluno,atvId=input.dataset.atv;
    const atv=db.disciplinas[selectedMateria]?.[selectedBimestre]?.atividades?.find(a=>a.id===atvId);
    if(!atv)return;
    if(!atv.notas)atv.notas={};
    if(!atv.notas[aluno])atv.notas[aluno]={notaOrig:'',notaRec:'',notaFinal:0};
    const campo=input.dataset.campo,max=Number(input.dataset.max);
    const raw=String(input.value||'').replace(',','.').trim();
    atv.notas[aluno][campo]=raw===''?'':notaUmaCasa(raw,max);
    recalcularNotasDaAtividade(atv);
    const nd=atv.notas[aluno],corte=max*CONFIG.passingScorePct;
    const rec=document.querySelector(`#lancamento-inline-resultado .rec-inline-input[data-aluno="${CSS.escape(aluno)}"][data-atv="${CSS.escape(atvId)}"]`);
    const fin=document.getElementById(`home-final-${safeId(atvId)}-${safeId(aluno)}`);
    if(rec){rec.value=nd.notaRec??'';rec.disabled=(nd.notaOrig!==''&&Number(nd.notaOrig)>=corte)||!!db.configGlobal.bimestresFechados[selectedBimestre];}
    if(fin){fin.textContent=(Number(nd.notaFinal)||0).toFixed(1);fin.className='nota-final-value '+((Number(nd.notaFinal)||0)>=corte?'nota-alta':'nota-baixa');}
    const btotal=(db.disciplinas[selectedMateria][selectedBimestre].atividades||[]).reduce((s,a)=>s+(Number(a.notas?.[aluno]?.notaFinal)||0),0);
    const bt=document.getElementById(`home-bim-${safeId(aluno)}`);if(bt)bt.textContent=btotal.toFixed(1);
    saveStorage();
}

function salvarLancamentoNotasHome(){
    const b=Number(document.getElementById('home-bimestre-lancamento')?.value||0);
    const disciplina=document.getElementById('home-notas-disciplina')?.value||'';
    if(!b||!disciplina){alert('Selecione o BIMESTRE e a DISCIPLINA antes de salvar.');return;}
    selectedBimestre=b;selectedMateria=disciplina;
    (db.disciplinas[disciplina][b].atividades||[]).forEach(recalcularNotasDaAtividade);
    saveStorage();
    buscarLancamentoNotasHome();
    alert('Lançamento de notas salvo com sucesso.');
}

function buscarRecuperacaoAnualHome(){
    if(!todosOsBimestresFechados()){
        alert('A Recuperação Anual fica disponível somente após o fechamento dos 4 bimestres.');
        return;
    }
    const disciplina=document.getElementById('home-rec-anual-disciplina')?.value||'';
    if(!disciplina){
        alert('Selecione a DISCIPLINA antes de buscar.');
        return;
    }
    selectedMateria=disciplina;
    renderRecuperacaoAnualHome(disciplina);
}

function calcularTotalAnualComRecuperacoes(disciplina,aluno){
    let total=0;
    for(let b=1;b<=4;b++){
        const bData=db.disciplinas[disciplina][b];
        let soma=(bData.atividades||[]).reduce((sum,a)=>sum+(parseFloat(a.notas?.[aluno]?.notaFinal)||0),0);
        if(soma<15 && bData.recuperacaoBimestral?.[aluno]!==undefined && bData.recuperacaoBimestral[aluno]!==''){
            const rec=Number(String(bData.recuperacaoBimestral[aluno]).replace(',','.'))||0;
            soma=rec>=15 ? 15 : Math.max(soma,rec);
        }
        total+=soma;
    }
    return Number(total.toFixed(1));
}

function resultadoRecuperacaoAnual(total,rec){
    if(rec==='' || rec===null || rec===undefined)return total;
    const r=Number(String(rec).replace(',','.'))||0;
    return r>=60 ? 60 : Math.max(total,r);
}

function renderRecuperacaoAnualHome(disciplina){
    const area=document.getElementById('lancamento-inline-resultado');
    if(!area)return;
    const recObj=db.disciplinas[disciplina].recuperacaoAnual||{};
    const linhas=[];
    ALUNOS.forEach(aluno=>{
        const total=calcularTotalAnualComRecuperacoes(disciplina,aluno);
        if(total<60){
            const rec=recObj[aluno]===undefined?'':recObj[aluno];
            const final=resultadoRecuperacaoAnual(total,rec);
            linhas.push({aluno,total,rec,final});
        }
    });
    area.innerHTML=`<div class="inline-result-panel">
        <div class="notas-central-head">
            <div><strong>RECUPERAÇÃO ANUAL · ${escapeHtml(disciplina.toUpperCase())}</strong><span>VALOR MÁXIMO: 100,0 PONTOS</span></div>
        </div>
        <div class="table-responsive-container">
            <table class="table-custom-format">
                <thead><tr><th>ALUNO</th><th>SOMA ANUAL</th><th>RECUPERAÇÃO ANUAL</th><th>RESULTADO FINAL</th></tr></thead>
                <tbody>${linhas.length?linhas.map(x=>`<tr>
                    <td><strong>${escapeHtml(x.aluno)}</strong></td>
                    <td class="${x.total<60?'nota-abaixo-corte':'nota-no-corte'}">${x.total.toFixed(1)}</td>
                    <td><input class="nota-central-input" type="text" inputmode="decimal" maxlength="6" value="${x.rec===''?'':Number(x.rec).toFixed(1)}" data-rec-anual="1" data-aluno="${escapeAttr(x.aluno)}" data-total="${x.total}" data-max="100" oninput="atualizarRecuperacaoAnualHome(this)"></td>
                    <td id="rec-anual-home-${safeId(x.aluno)}" class="${x.final<60?'nota-abaixo-corte':'nota-no-corte'}"><strong>${x.final.toFixed(1)}</strong></td>
                </tr>`).join(''):`<tr><td colspan="4" style="text-align:center;padding:20px;">NENHUM ALUNO ELEGÍVEL PARA RECUPERAÇÃO ANUAL.</td></tr>`}</tbody>
            </table>
        </div>
        <div class="launch-save-bar"><button class="btn-submit-action" type="button" onclick="salvarRecuperacaoAnualHome('${escapeAttr(disciplina)}')"><i class="fas fa-save"></i> SALVAR LANÇAMENTO</button></div>
    </div>`;
}

function atualizarRecuperacaoAnualHome(input){
    normalizarNumeroCampo(input);
    const total=Number(input.dataset.total)||0;
    const rec=input.value===''?'':Number(String(input.value).replace(',','.'))||0;
    const final=resultadoRecuperacaoAnual(total,rec);
    const cell=document.getElementById(`rec-anual-home-${safeId(input.dataset.aluno)}`);
    if(cell){cell.className=final<60?'nota-abaixo-corte':'nota-no-corte';cell.innerHTML=`<strong>${final.toFixed(1)}</strong>`;}
}

function salvarRecuperacaoAnualHome(disciplina){
    if(!db.disciplinas[disciplina].recuperacaoAnual)db.disciplinas[disciplina].recuperacaoAnual={};
    document.querySelectorAll('#lancamento-inline-resultado input[data-rec-anual="1"]').forEach(input=>{
        const aluno=input.dataset.aluno;
        const raw=String(input.value||'').replace(',','.').trim();
        if(raw==='')delete db.disciplinas[disciplina].recuperacaoAnual[aluno];
        else db.disciplinas[disciplina].recuperacaoAnual[aluno]=notaUmaCasa(raw,100);
    });
    saveStorage();
    renderRecuperacaoAnualHome(disciplina);
    alert('Recuperação Anual salva com sucesso.');
}

/* Atualiza a opção da tela inicial assim que o 4º bimestre for fechado/reaberto. */
function checkRecuperacaoAnualButtonVisibility(){
    const todosFechados=todosOsBimestresFechados();
    const btnRecAnual=document.getElementById('btn-hub-rec-anual');
    if(btnRecAnual)btnRecAnual.style.display=todosFechados?'flex':'none';
    garantirOpcaoRecuperacaoAnualHome();
}
