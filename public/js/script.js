document.addEventListener("DOMContentLoaded", () => {
  M.AutoInit();
  carregarEquipamentos();
  initModalDataRetorno();
});

const form = document.getElementById("formEquipamento");
const tabela = document.getElementById("tabelaEquipamentos");
const btnLimpar = document.getElementById("btnLimpar");

let equipamentos = JSON.parse(localStorage.getItem("equipamentos")) || [];

let modalInstance;
let indexAtualStatus;

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const numeroSerie = document.getElementById("numeroSerie").value.trim();
  const numeroPatrimonio = document.getElementById("numeroPatrimonio").value.trim();
  const nomeEquipamento = document.getElementById("nomeEquipamento").value.trim();
  const fabricante = document.getElementById("fabricante").value.trim();
  const modelo = document.getElementById("modelo").value.trim();
  const dataEnvio = document.getElementById("dataEnvio").value;
  const descricao = document.getElementById("descricao").value.trim();
  const tecnico = document.getElementById("tecnico").value.trim();
  const observacoes = document.getElementById("observacoes").value.trim();

  if (!numeroSerie || !numeroPatrimonio || !nomeEquipamento || !fabricante || !modelo || !dataEnvio || !descricao) {
    alert("Preencha todos os campos obrigatórios (*)");
    return;
  }

  const hoje = new Date().toISOString().slice(0, 10);
  if (dataEnvio > hoje) {
    alert("A data de envio não pode ser futura.");
    return;
  }

  const equipamento = {
    id: gerarId(),
    numeroSerie,
    numeroPatrimonio,
    nomeEquipamento,
    fabricante,
    modelo,
    dataEnvio,
    descricao,
    tecnico,
    observacoes,
    status: "Pendente",
    dataRetorno: ""
  };

  equipamentos.push(equipamento);
  salvarLocalStorage();
  form.reset();
  M.updateTextFields();
  carregarEquipamentos();
});

btnLimpar.addEventListener("click", () => {
  form.reset();
  M.updateTextFields();
});

function carregarEquipamentos() {
  tabela.innerHTML = "";
  if (equipamentos.length === 0) {
    tabela.innerHTML = `<tr><td colspan="7" class="center-align">Nenhum equipamento cadastrado.</td></tr>`;
    return;
  }

  equipamentos.forEach((eq, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${eq.numeroSerie}</td>
      <td>${eq.numeroPatrimonio}</td>
      <td>${eq.nomeEquipamento}</td>
      <td>${formatarData(eq.dataEnvio)}</td>
      <td class="${eq.status === 'Pendente' ? 'status-pendente' : 'status-concluido'}">${eq.status}</td>
      <td>${eq.dataRetorno ? formatarData(eq.dataRetorno) : "-"}</td>
      <td>
        <button class="btn green" onclick="alterarStatus(${index})">${eq.status === 'Pendente' ? 'Concluir' : 'Reabrir'}</button>
        <button class="btn blue" onclick="editarEquipamento(${index})">Editar</button>
        <button class="btn red" onclick="excluirEquipamento(${index})">Excluir</button>
      </td>
    `;
    tabela.appendChild(row);
  });
}


function salvarLocalStorage() {
  localStorage.setItem("equipamentos", JSON.stringify(equipamentos));
}

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function initModalDataRetorno() {
  const modalElem = document.getElementById('modalDataRetorno');
  modalInstance = M.Modal.init(modalElem, {dismissible: false});

  const inputDataRetorno = document.getElementById('inputDataRetorno');
  const errorDataRetorno = document.getElementById('errorDataRetorno');
  const btnConfirmar = document.getElementById('confirmarDataRetorno');
  const btnCancelar = document.getElementById('cancelarDataRetorno');

  // Máscara simples para dd/mm/aaaa
  inputDataRetorno.addEventListener('input', () => {
    let v = inputDataRetorno.value.replace(/\D/g, '').slice(0,8);
    if (v.length >= 5) {
      v = v.replace(/^(\d{2})(\d{2})(\d{1,4}).*/, '$1/$2/$3');
    } else if (v.length >= 3) {
      v = v.replace(/^(\d{2})(\d{1,2})/, '$1/$2');
    }
    inputDataRetorno.value = v;
    errorDataRetorno.style.display = 'none';
  });

  btnConfirmar.addEventListener('click', () => {
    const data = inputDataRetorno.value;
    if (!validarData(data)) {
      errorDataRetorno.style.display = 'block';
      return;
    }
    aplicarStatus(indexAtualStatus, data);
    modalInstance.close();
  });

  btnCancelar.addEventListener('click', () => {
    modalInstance.close();
  });
}

function validarData(data) {
  // Valida formato dd/mm/aaaa
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data)) return false;
  const [d, m, a] = data.split('/').map(Number);
  const date = new Date(a, m - 1, d);
  return (
    date.getFullYear() === a &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

function alterarStatus(index) {
  indexAtualStatus = index;
  const eq = equipamentos[index];
  if (eq.status === "Pendente") {
    // Abrir modal e limpar input
    const inputDataRetorno = document.getElementById('inputDataRetorno');
    inputDataRetorno.value = '';
    document.getElementById('errorDataRetorno').style.display = 'none';
    modalInstance.open();
  } else {
    if (!confirm("Deseja reabrir este equipamento (mudar para Pendente)?")) return;
    eq.status = "Pendente";
    eq.dataRetorno = "";
    salvarLocalStorage();
    carregarEquipamentos();
  }
}

function aplicarStatus(index, dataRetornoStr) {
  const eq = equipamentos[index];
  // Converter dd/mm/aaaa para yyyy-mm-dd para salvar e formatar depois
  const [d, m, a] = dataRetornoStr.split('/');
  const isoDate = `${a}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;

  if (isoDate < eq.dataEnvio) {
    alert("A data de retorno não pode ser anterior à data de envio.");
    return;
  }

  eq.status = "Concluído";
  eq.dataRetorno = isoDate;
  salvarLocalStorage();
  carregarEquipamentos();
}

function editarEquipamento(index) {
  const eq = equipamentos[index];

  document.getElementById("numeroSerie").value = eq.numeroSerie;
  document.getElementById("numeroPatrimonio").value = eq.numeroPatrimonio;
  document.getElementById("nomeEquipamento").value = eq.nomeEquipamento;
  document.getElementById("fabricante").value = eq.fabricante;
  document.getElementById("modelo").value = eq.modelo;
  document.getElementById("dataEnvio").value = eq.dataEnvio;
  document.getElementById("descricao").value = eq.descricao;
  document.getElementById("tecnico").value = eq.tecnico;
  document.getElementById("observacoes").value = eq.observacoes;

  M.updateTextFields();

  equipamentos.splice(index, 1);
  salvarLocalStorage();
  carregarEquipamentos();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function excluirEquipamento(index) {
  if (!confirm("Deseja realmente excluir este equipamento?")) return;
  equipamentos.splice(index, 1);
  salvarLocalStorage();
  carregarEquipamentos();
}

function formatarData(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

window.alterarStatus = alterarStatus;
window.editarEquipamento = editarEquipamento;
window.excluirEquipamento = excluirEquipamento;
