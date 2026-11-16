
// ========================================
// LIFE AI - SISTEMA PRINCIPAL
// ========================================

const $ = id => document.getElementById(id);

let currentPage = "home";
let pageHistory = [];
let currentFinanceId = null;

let financeData = JSON.parse(localStorage.getItem("life_finance") || "[]");
let taskData = JSON.parse(localStorage.getItem("life_tasks") || "[]");
let projectData = JSON.parse(localStorage.getItem("life_projects") || "[]");
let studyData = JSON.parse(localStorage.getItem("life_study") || "[]");

function saveData() {
  localStorage.setItem("life_finance", JSON.stringify(financeData));
  localStorage.setItem("life_tasks", JSON.stringify(taskData));
  localStorage.setItem("life_projects", JSON.stringify(projectData));
  localStorage.setItem("life_study", JSON.stringify(studyData));
}

function safeText(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function money(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

// ========================================
// NAVEGAÇÃO
// ========================================

function openPage(page) {
  if (!$ (page)) return;

  if (currentPage !== page) {
    pageHistory.push(currentPage);
  }

  showPage(page);
}

function showPage(page) {
  currentPage = page;

  document.querySelectorAll(".page").forEach(section => {
    section.classList.remove("active");
  });

  $(page).classList.add("active");

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.remove("active");
  });

  const nav = document.querySelector(
    `.nav-item[onclick="openPage('${page}')"]`
  );

  if (nav) nav.classList.add("active");

  closeMenu();

  if (page === "finance") renderFinance();
  if (page === "financeDetail") renderFinanceDetail();
  if (page === "tasks") renderTasks();
  if (page === "projects") renderProjects();
  if (page === "study") renderStudy();
}

function goBack() {
  const previous = pageHistory.pop() || "home";
  showPage(previous);
}

function toggleMenu() {
  $("sideMenu").classList.toggle("open");
}

function closeMenu() {
  $("sideMenu").classList.remove("open");
}

// ========================================
// PERFIL E AVISOS
// ========================================

function openProfile() {
  $("profileModal").classList.add("show");
}

function closeProfile() {
  $("profileModal").classList.remove("show");
}

function showPremiumNotice(theme) {
  $("noticeTitle").textContent = theme + " Premium";
  $("noticeText").textContent =
    "Este tema será disponibilizado nos planos PRO e VIP. O sistema de assinatura ainda será integrado.";
  $("noticeModal").classList.add("show");
}

function closeNotice() {
  $("noticeModal").classList.remove("show");
}

// ========================================
// CHAT DA PÁGINA INICIAL
// ========================================

function sendHomeMessage(event) {
  event.preventDefault();

  const message = $("homeMessage").value.trim();
  if (!message) return;

  $("homeMessage").value = "";
  openPage("assistant");

  alert(
    "A integração com o Gemma ainda não está ativa. Sua mensagem não foi enviada para uma IA."
  );
}

// ========================================
// FINANCE & DATA - PROJETOS
// ========================================

function addFinance() {
  const name = $("financeName").value.trim();

  if (!name) {
    alert("Digite um nome para o projeto financeiro.");
    return;
  }

  const project = {
    id: Date.now(),
    name,
    entries: []
  };

  financeData.push(project);

  $("financeName").value = "";
  saveData();
  renderFinance();
}

function getFinanceTotals(project) {
  const entries = project.entries || [];

  const income = entries
    .filter(entry => entry.type === "income")
    .reduce((sum, entry) => sum + Number(entry.value), 0);

  const expenses = entries
    .filter(entry => entry.type === "expense")
    .reduce((sum, entry) => sum + Number(entry.value), 0);

  return {
    income,
    expenses,
    balance: income - expenses
  };
}

function renderFinance() {
  const container = $("financeProjects");

  if (!financeData.length) {
    container.innerHTML = `
      <div class="panel">
        <h3>Nenhum projeto financeiro</h3>
        <p class="muted">
          Crie seu primeiro projeto para começar a organizar suas finanças.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = financeData.map(project => {
    const totals = getFinanceTotals(project);

    return `
      <div class="finance-project-card"
           onclick="openFinanceProject(${project.id})">

        <p class="eyebrow">PROJETO FINANCEIRO</p>
        <h3>${safeText(project.name)}</h3>

        <div class="project-card-bottom">
          <span>${project.entries.length} lançamento(s)</span>
          <strong>${money(totals.balance)}</strong>
        </div>

        <p class="muted">Toque para abrir o projeto ›</p>
      </div>
    `;
  }).join("");
}

function openFinanceProject(id) {
  const project = financeData.find(item => item.id === id);
  if (!project) return;

  currentFinanceId = id;

  $("financeDetailTitle").textContent = project.name;

  $("entryDate").value = new Date().toISOString().slice(0, 10);

  openPage("financeDetail");
}

// ========================================
// FINANCE & DATA - LANÇAMENTOS
// ========================================

function submitFinanceEntry(event) {
  event.preventDefault();

  const project = financeData.find(
    item => item.id === currentFinanceId
  );

  if (!project) {
    alert("Projeto financeiro não encontrado.");
    return;
  }

  const description = $("entryDescription").value.trim();
  const value = Number($("entryValue").value);
  const date = $("entryDate").value;
  const category = $("entryCategory").value;

  const typeInput = document.querySelector(
    'input[name="entryType"]:checked'
  );

  if (!description || !Number.isFinite(value) || value <= 0 || !date) {
    alert("Confira os dados do lançamento.");
    return;
  }

  project.entries.push({
    id: Date.now(),
    description,
    value,
    date,
    category,
    type: typeInput ? typeInput.value : "income"
  });

  saveData();

  $("financeEntryForm").reset();
  $("entryDate").value = new Date().toISOString().slice(0, 10);

  renderFinanceDetail();
}

function renderFinanceDetail() {
  const project = financeData.find(
    item => item.id === currentFinanceId
  );

  if (!project) {
    showPage("finance");
    return;
  }

  const totals = getFinanceTotals(project);

  $("financeDetailTitle").textContent = project.name;
  $("detailBalance").textContent = money(totals.balance);
  $("detailIncome").textContent = money(totals.income);
  $("detailExpenses").textContent = money(totals.expenses);

  renderFinanceEntries(project);
  drawFinanceCharts(project);
}

function renderFinanceEntries(project) {
  const container = $("financeEntries");
  const filter = $("entryFilter").value;

  let entries = [...project.entries].reverse();

  if (filter !== "all") {
    entries = entries.filter(entry => entry.type === filter);
  }

  if (!entries.length) {
    container.innerHTML = `
      <p class="muted">
        Nenhum lançamento nesta categoria ainda.
      </p>
    `;
    return;
  }

  container.innerHTML = entries.map(entry => {
    const isIncome = entry.type === "income";

    return `
      <div class="entry-row">
        <div class="entry-info">
          <strong>${safeText(entry.description)}</strong>
          <small>
            ${formatDate(entry.date)} · ${safeText(entry.category)}
          </small>
        </div>

        <div class="entry-amount ${isIncome ? "income-text" : "expense-text"}">
          ${isIncome ? "+" : "-"} ${money(entry.value)}
          <button class="small-action"
                  onclick="deleteFinanceEntry(${entry.id})">
            ×
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function formatDate(date) {
  if (!date) return "";

  const parts = date.split("-");
  if (parts.length !== 3) return date;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function deleteFinanceEntry(entryId) {
  const project = financeData.find(
    item => item.id === currentFinanceId
  );

  if (!project) return;

  if (!confirm("Excluir este lançamento?")) return;

  project.entries = project.entries.filter(
    entry => entry.id !== entryId
  );

  saveData();
  renderFinanceDetail();
}

function deleteCurrentFinance() {
  if (!confirm("Excluir este projeto e todos os seus lançamentos?")) {
    return;
  }

  financeData = financeData.filter(
    item => item.id !== currentFinanceId
  );

  currentFinanceId = null;

  saveData();
  openPage("finance");
}

// ========================================
// GRÁFICOS FINANCEIROS
// ========================================

function prepareCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;

  canvas.width = Math.max(1, rect.width * ratio);
  canvas.height = Math.max(1, 220 * ratio);

  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);

  return {
    ctx,
    width: rect.width,
    height: 220
  };
}

function drawFinanceCharts(project) {
  drawBarChart(project);
  drawPieChart(project);
}

function drawBarChart(project) {
  const canvas = $("financeBarChart");
  const { ctx, width, height } = prepareCanvas(canvas);

  const totals = getFinanceTotals(project);
  const max = Math.max(totals.income, totals.expenses, 1);

  ctx.clearRect(0, 0, width, height);

  const chartTop = 15;
  const chartBottom = 165;
  const chartHeight = chartBottom - chartTop;

  ctx.strokeStyle = "rgba(160,170,210,.15)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const y = chartTop + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(width - 10, y);
    ctx.stroke();
  }

  const barWidth = Math.min(65, width * .22);
  const center = width / 2;

  const incomeHeight = (totals.income / max) * chartHeight;
  const expenseHeight = (totals.expenses / max) * chartHeight;

  ctx.fillStyle = "#39dca2";
  ctx.fillRect(
    center - barWidth - 8,
    chartBottom - incomeHeight,
    barWidth,
    incomeHeight
  );

  ctx.fillStyle = "#ff7188";
  ctx.fillRect(
    center + 8,
    chartBottom - expenseHeight,
    barWidth,
    expenseHeight
  );

  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--text");
  ctx.font = "11px Arial";
  ctx.textAlign = "center";

  ctx.fillText("Receitas", center - barWidth / 2 - 8, 188);
  ctx.fillText("Despesas", center + barWidth / 2 + 8, 188);

  ctx.font = "10px Arial";
  ctx.fillText(shortMoney(totals.income), center - barWidth / 2 - 8, 205);
  ctx.fillText(shortMoney(totals.expenses), center + barWidth / 2 + 8, 205);
}

function shortMoney(value) {
  if (value >= 1000000) return "R$ " + (value / 1000000).toFixed(1) + " mi";
  if (value >= 1000) return "R$ " + (value / 1000).toFixed(1) + " mil";
  return "R$ " + value.toFixed(0);
}

let pieMode = "overview";
function setPieMode(mode){
  pieMode=mode;
  document.querySelectorAll(".pie-mode-btn").forEach(btn=>btn.classList.toggle("active",(mode==="overview"&&btn.textContent.includes("Visão"))||(mode==="category"&&btn.textContent.includes("Categorias"))));
  const project=financeData.find(item=>item.id===currentFinanceId);
  if(project)drawPieChart(project);
}
function drawPieChart(project) {
  const canvas=$("financePieChart"); if(!canvas)return;
  const {ctx,width,height}=prepareCanvas(canvas);ctx.clearRect(0,0,width,height);
  const colors=["#00cfff","#9b55ff","#39dca2","#ff7188","#ffc45e","#648bff","#ff8bdc","#55d6c2","#b6c5ff","#ed9d54"];
  let values=[];
  if(pieMode==="overview"){
    const totals=getFinanceTotals(project);
    values=[["Receitas",totals.income],["Despesas",totals.expenses]].filter(x=>x[1]>0);
  }else{
    const categories={};
    project.entries.forEach(e=>{const key=e.category||"Outros";categories[key]=(categories[key]||0)+Number(e.value||0);});
    values=Object.entries(categories).sort((a,b)=>b[1]-a[1]);
  }
  const total=values.reduce((sum,item)=>sum+item[1],0);
  if(!total){ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--muted");ctx.font="14px Arial";ctx.textAlign="center";ctx.fillText(pieMode==="overview"?"Adicione receitas ou despesas":"Adicione lançamentos para ver categorias",width/2,height/2);$("chartLegend").innerHTML="";return;}
  const cx=width/2,cy=height/2-5,r=Math.min(92,width*.30,height*.36);
  let angle=-Math.PI/2;
  values.forEach((item,i)=>{const slice=item[1]/total*Math.PI*2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,angle,angle+slice);ctx.closePath();ctx.fillStyle=pieMode==="overview"?(item[0]==="Receitas"?"#20c997":"#ff687d"):colors[i%colors.length];ctx.fill();angle+=slice;});
  ctx.beginPath();ctx.arc(cx,cy,r*.52,0,Math.PI*2);ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--surface");ctx.fill();
  ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--text");ctx.textAlign="center";ctx.font="bold 13px Arial";ctx.fillText(pieMode==="overview"?"Movimentações":"Categorias",cx,cy-3);ctx.font="12px Arial";ctx.fillText(shortMoney(total),cx,cy+15);
  $("chartLegend").innerHTML=values.map((item,i)=>`<span class="legend-item"><i class="legend-dot" style="background:${pieMode==="overview"?(item[0]==="Receitas"?"#20c997":"#ff687d"):colors[i%colors.length]}"></i>${safeText(item[0])}: ${money(item[1])} · ${Math.round(item[1]/total*100)}%</span>`).join("");
}

window.addEventListener("resize", () => {
  if (currentPage === "financeDetail") {
    renderFinanceDetail();
  }
});

// ========================================
// TAREFAS
// ========================================

function addTaskList() {
  const name = $("listName").value.trim();

  if (!name) {
    alert("Digite um nome para a lista.");
    return;
  }

  taskData.push({
    id: Date.now(),
    name,
    tasks: []
  });

  $("listName").value = "";
  saveData();
  renderTasks();
}

function renderTasks() {
  const container = $("taskLists");

  if (!taskData.length) {
    container.innerHTML =
      '<p class="muted">Crie sua primeira lista de tarefas.</p>';
    return;
  }

  container.innerHTML = taskData.map(list => `
    <div class="item-card">
      <h3>${safeText(list.name)}</h3>

      ${list.tasks.map((task, index) => `
        <div class="task-row">
          <input type="checkbox"
            ${task.done ? "checked" : ""}
            onchange="toggleTask(${list.id}, ${index})">

          <span style="${task.done ? "text-decoration:line-through;opacity:.5" : ""}">
            ${safeText(task.text)}
          </span>

          <button onclick="deleteTask(${list.id}, ${index})">Excluir</button>
        </div>
      `).join("")}

      <button onclick="addTask(${list.id})">Adicionar tarefa</button>
      <button onclick="deleteTaskList(${list.id})">Excluir lista</button>
    </div>
  `).join("");
}

function addTask(id) {
  const list = taskData.find(item => item.id === id);
  if (!list) return;

  const text = prompt("Qual tarefa deseja adicionar?");
  if (!text || !text.trim()) return;

  list.tasks.push({
    text: text.trim(),
    done: false
  });

  saveData();
  renderTasks();
}

function toggleTask(id, index) {
  const list = taskData.find(item => item.id === id);
  if (!list || !list.tasks[index]) return;

  list.tasks[index].done = !list.tasks[index].done;
  saveData();
  renderTasks();
}

function deleteTask(id, index) {
  const list = taskData.find(item => item.id === id);
  if (!list) return;

  list.tasks.splice(index, 1);
  saveData();
  renderTasks();
}

function deleteTaskList(id) {
  if (!confirm("Excluir esta lista?")) return;

  taskData = taskData.filter(item => item.id !== id);
  saveData();
  renderTasks();
}

// ========================================
// PROJETOS
// ========================================

function addProject() {
  const name = $("projectName").value.trim();
  const notes = $("projectNotes").value.trim();
  if (!name) return alert("Digite o nome do projeto.");
  projectData.push({id:Date.now(),name,notes,description:"",status:"Em andamento",tasks:[],updatedAt:new Date().toISOString()});
  $("projectName").value = ""; $("projectNotes").value = "";
  saveData(); renderProjects();
}

let openedProjectId = null;
function renderProjects() {
  const container = $("projectsList");
  const workspace = $("projectWorkspace");
  workspace.hidden = true;
  if (!projectData.length) {
    container.innerHTML = '<div class="empty-state">Você ainda não criou projetos. Crie um projeto para organizar objetivos, etapas e anotações.</div>';
    return;
  }
  container.innerHTML = projectData.map(project => {
    project.tasks = project.tasks || [];
    const done = project.tasks.filter(t=>t.done).length;
    const progress = project.tasks.length ? Math.round(done/project.tasks.length*100) : 0;
    return `<article class="project-card">
      <div class="project-card-head"><span class="project-symbol">◇</span><span class="project-status">${safeText(project.status||"Em andamento")}</span></div>
      <h3>${safeText(project.name)}</h3><p>${safeText(project.notes||"Sem descrição inicial.")}</p>
      <div class="project-progress"><div style="width:${progress}%"></div></div>
      <small>${done} de ${project.tasks.length} etapas concluídas · ${progress}%</small>
      <div class="project-actions"><button class="primary" onclick="openProjectWorkspace(${project.id})">Abrir projeto</button><button class="secondary-action" onclick="editProject(${project.id})">Editar</button><button class="danger-button" onclick="deleteProject(${project.id})">Excluir</button></div>
    </article>`;
  }).join("");
}
function openProjectWorkspace(id) {
  const project=projectData.find(p=>p.id===id); if(!project)return;
  openedProjectId=id; project.tasks=project.tasks||[];
  const workspace=$("projectWorkspace"); workspace.hidden=false;
  workspace.innerHTML=`<div class="page-heading"><div><p class="eyebrow">ÁREA DE TRABALHO</p><h2>${safeText(project.name)}</h2></div><button class="small-action" onclick="closeProjectWorkspace()">Fechar</button></div>
    <label>Descrição do projeto</label><textarea id="workspaceDescription" placeholder="Descreva o objetivo e os detalhes...">${safeText(project.description||"")}</textarea>
    <label>Estado</label><select id="workspaceStatus"><option ${project.status==="Em andamento"?"selected":""}>Em andamento</option><option ${project.status==="Em espera"?"selected":""}>Em espera</option><option ${project.status==="Concluído"?"selected":""}>Concluído</option></select>
    <div class="project-task-add"><input id="projectTaskInput" placeholder="Adicionar uma etapa ou tarefa"><button class="primary" onclick="addProjectTask()">Adicionar</button></div>
    <div id="projectTaskList">${renderProjectTaskMarkup(project)}</div>
    <button class="primary" onclick="saveProjectWorkspace()">Salvar alterações</button>`;
  workspace.scrollIntoView({behavior:"smooth",block:"start"});
}
function renderProjectTaskMarkup(project){
  return project.tasks.map((task,i)=>`<div class="task-row"><label><input type="checkbox" ${task.done?"checked":""} onchange="toggleProjectTask(${i},this.checked)"><span class="${task.done?"completed":""}">${safeText(task.text)}</span></label><button class="small-action" onclick="removeProjectTask(${i})">×</button></div>`).join("") || '<p class="muted">Adicione etapas para acompanhar o progresso.</p>';
}
function addProjectTask(){const p=projectData.find(x=>x.id===openedProjectId);const input=$("projectTaskInput");if(!p||!input.value.trim())return;p.tasks.push({text:input.value.trim(),done:false});input.value="";saveData();openProjectWorkspace(p.id);}
function toggleProjectTask(index,done){const p=projectData.find(x=>x.id===openedProjectId);if(!p)return;p.tasks[index].done=done;saveData();openProjectWorkspace(p.id);}
function removeProjectTask(index){const p=projectData.find(x=>x.id===openedProjectId);if(!p)return;p.tasks.splice(index,1);saveData();openProjectWorkspace(p.id);}
function saveProjectWorkspace(){const p=projectData.find(x=>x.id===openedProjectId);if(!p)return;p.description=$("workspaceDescription").value;p.status=$("workspaceStatus").value;p.updatedAt=new Date().toISOString();saveData();renderProjects();openProjectWorkspace(p.id);alert("Projeto atualizado.");}
function closeProjectWorkspace(){openedProjectId=null;$("projectWorkspace").hidden=true;}
function editProject(id) {
  const project=projectData.find(item=>item.id===id); if(!project)return;
  const name=prompt("Nome do projeto:",project.name); if(name===null)return;
  const notes=prompt("Descrição ou anotações:",project.notes||""); if(notes===null)return;
  if(!name.trim())return alert("O nome não pode ficar vazio.");
  project.name=name.trim();project.notes=notes.trim();saveData();renderProjects();
}
function deleteProject(id) {
  if(!confirm("Excluir este projeto e suas etapas?"))return;
  projectData=projectData.filter(item=>item.id!==id);
  if(openedProjectId===id)closeProjectWorkspace();
  saveData();renderProjects();
}

// ========================================
// ESTUDOS
// ========================================

function addStudy() {
  const subject = $("studySubject").value.trim();
  const minutes = Number($("studyMinutes").value);
  const days = Number($("studyDays").value);

  if (!subject || minutes <= 0 || days < 1 || days > 7) {
    alert("Preencha corretamente os campos.");
    return;
  }

  studyData.push({
    id: Date.now(),
    subject,
    minutes,
    days,
    completedMinutes: 0
  });

  $("studySubject").value = "";
  $("studyMinutes").value = "";
  $("studyDays").value = "";

  saveData();
  renderStudy();
}

function renderStudy() {
  const container = $("studyList");

  if (!studyData.length) {
    container.innerHTML = '<p class="muted">Nenhum plano criado.</p>';
    return;
  }

  container.innerHTML = studyData.map(plan => {
    const target = Number(plan.minutes || 0) * Number(plan.days || 0);
    const completed = Number(plan.completedMinutes || 0);
    const percent = target ? Math.min(100, Math.round(completed / target * 100)) : 0;
    return `
    <div class="item-card study-plan-card">
      <h3>${safeText(plan.subject)}</h3>
      <p>${plan.minutes} minutos por dia · ${plan.days} dias por semana</p>
      <div class="project-progress"><div style="width:${percent}%"></div></div>
      <small>${completed} de ${target} minutos semanais registrados · ${percent}%</small>
      <div class="project-actions">
        <button class="primary" onclick="logStudySession(${plan.id})">Registrar ${plan.minutes} min</button>
        <button class="danger-button" onclick="deleteStudy(${plan.id})">Excluir</button>
      </div>
    </div>`;
  }).join("");
}

function logStudySession(id) {
  const plan = studyData.find(item => item.id === id);
  if (!plan) return;
  plan.completedMinutes = Number(plan.completedMinutes || 0) + Number(plan.minutes || 0);
  plan.lastSession = new Date().toISOString();
  saveData();
  renderStudy();
}
function deleteStudy(id) {
  studyData = studyData.filter(item => item.id !== id);
  saveData();
  renderStudy();
}

// ========================================
// MATEMÁTICA BÁSICA
// ========================================

function calculate() {
  const expression = $("mathExpression").value.trim().replace(/,/g, ".");

  try {
    const result = evaluateMath(expression);

    if (!Number.isFinite(result)) {
      throw new Error("Resultado inválido");
    }

    $("mathResult").textContent =
      "Resultado: " + result.toLocaleString("pt-BR");

  } catch (error) {
    $("mathResult").textContent = "Expressão inválida.";
  }
}

function evaluateMath(expression) {
  const tokens = expression.match(
    /\d+(?:\.\d+)?|[()+\-*/^]/g
  );

  if (!tokens || tokens.join("") !== expression.replace(/\s+/g, "")) {
    throw new Error("Expressão inválida");
  }

  let position = 0;

  function parseExpression() {
    let value = parseTerm();

    while (tokens[position] === "+" || tokens[position] === "-") {
      const operator = tokens[position++];
      const right = parseTerm();

      value = operator === "+" ? value + right : value - right;
    }

    return value;
  }

  function parseTerm() {
    let value = parsePower();

    while (tokens[position] === "*" || tokens[position] === "/") {
      const operator = tokens[position++];
      const right = parsePower();

      if (operator === "/" && right === 0) {
        throw new Error("Divisão por zero");
      }

      value = operator === "*" ? value * right : value / right;
    }

    return value;
  }

  function parsePower() {
    let value = parseUnary();

    if (tokens[position] === "^") {
      position++;
      value = Math.pow(value, parsePower());
    }

    return value;
  }

  function parseUnary() {
    if (tokens[position] === "+") {
      position++;
      return parseUnary();
    }

    if (tokens[position] === "-") {
      position++;
      return -parseUnary();
    }

    return parsePrimary();
  }

  function parsePrimary() {
    const token = tokens[position++];

    if (token === "(") {
      const value = parseExpression();

      if (tokens[position++] !== ")") {
        throw new Error("Parênteses incorretos");
      }

      return value;
    }

    if (!token || !/^\d+(?:\.\d+)?$/.test(token)) {
      throw new Error("Número inválido");
    }

    return Number(token);
  }

  const result = parseExpression();

  if (position !== tokens.length) {
    throw new Error("Expressão incompleta");
  }

  return result;
}

// ========================================
// CURIOSIDADES
// ========================================

const curiosities = [
  "O coração humano bate aproximadamente 100 mil vezes por dia.",
  "A luz do Sol leva cerca de 8 minutos para chegar à Terra.",
  "Os polvos possuem três corações.",
  "A água cobre aproximadamente 71% da superfície terrestre.",
  "As abelhas conseguem aprender padrões.",
  "O cérebro humano possui bilhões de neurônios.",
  "Um dia em Vênus dura mais que um ano venusiano.",
  "As girafas têm a mesma quantidade de vértebras no pescoço que os humanos: sete.",
  "O mel, quando armazenado corretamente, pode durar milhares de anos.",
  "A Lua se afasta da Terra alguns centímetros por ano.",
  "O coração de uma baleia-azul pode pesar centenas de quilos.",
  "Algumas espécies de bambu podem crescer quase um metro em um dia.",
  "O cheiro de chuva em solo seco é chamado de petricor.",
  "Os tubarões existem há mais tempo que as árvores."
];


function randomFun() {
  const index = Math.floor(Math.random() * curiosities.length);
  $("funText").textContent = curiosities[index];
}
let memoryDeck=[], memoryFirst=null, memoryLock=false, memoryMatches=0;
function startMemoryGame(){
  const symbols=["◆","●","▲","★","♥","✦"];
  memoryDeck=[...symbols,...symbols].sort(()=>Math.random()-.5).map((v,i)=>({id:i,value:v,open:false,done:false}));
  memoryFirst=null;memoryLock=false;memoryMatches=0;renderMemoryGame();
  $("memoryStatus").textContent="Encontre os 6 pares!";
}
function renderMemoryGame(){
  const box=$("memoryGame");if(!box)return;
  box.innerHTML=memoryDeck.map(c=>`<button class="memory-card ${c.done?"matched":""}" onclick="flipMemoryCard(${c.id})" ${c.open||c.done?"disabled":""}>${c.open||c.done?c.value:"?"}</button>`).join("");
}
function flipMemoryCard(id){
  if(memoryLock)return;const card=memoryDeck.find(c=>c.id===id);if(!card||card.open||card.done)return;
  card.open=true;renderMemoryGame();
  if(memoryFirst===null){memoryFirst=id;return;}
  const first=memoryDeck.find(c=>c.id===memoryFirst);memoryLock=true;
  if(first.value===card.value){first.done=true;card.done=true;memoryMatches++;memoryFirst=null;memoryLock=false;renderMemoryGame();$("memoryStatus").textContent=memoryMatches===6?"Parabéns! Você encontrou todos os pares!":`${memoryMatches} de 6 pares encontrados.`;}
  else{const firstId=memoryFirst;memoryFirst=null;setTimeout(()=>{const a=memoryDeck.find(c=>c.id===firstId);const b=memoryDeck.find(c=>c.id===id);if(a&&!a.done)a.open=false;if(b&&!b.done)b.open=false;memoryLock=false;renderMemoryGame();},750);}
}


// ========================================
// TEMAS E CORES DO ROBÔ
// ========================================

const themes = {
  futuristic: {
    robot: "#00cfff",
    purple: "#a04dff"
  },
  midnight: {
    robot: "#728bff",
    purple: "#9b6dff"
  },
  light: {
    robot: "#4389ff",
    purple: "#9464ff"
  },
  forest: {
    robot: "#42f0a3",
    purple: "#19bd83"
  }
};

function changeTheme(theme) {
  const allowed = ["futuristic", "midnight", "light", "forest"];

  if (!allowed.includes(theme)) return;

  document.body.classList.remove(
    "light",
    "midnight",
    "forest"
  );

  if (theme !== "futuristic") {
    document.body.classList.add(theme);
  }

  const colors = themes[theme];

  document.documentElement.style.setProperty(
    "--robot-glow",
    colors.robot
  );

  document.documentElement.style.setProperty(
    "--robot-accent",
    colors.robot
  );

  document.documentElement.style.setProperty(
    "--robot-purple",
    colors.purple
  );

  localStorage.setItem("life_theme", theme);
}

function loadTheme() {
  const theme = localStorage.getItem("life_theme") || "futuristic";
  changeTheme(theme);
}

// ========================================
// INICIALIZAÇÃO
// ========================================

function initializeApp() {
  loadTheme();

  renderFinance();
  renderTasks();
  renderProjects();
  renderStudy();
  startMemoryGame();

  $("entryDate").value = new Date().toISOString().slice(0, 10);

  setTimeout(() => {
    $("splash").style.opacity = "0";

    setTimeout(() => {
      $("splash").style.display = "none";
    }, 500);
  }, 1300);
}

document.addEventListener("DOMContentLoaded", initializeApp);

// ========================================
// RECURSOS DA NOVA VERSÃO
// ========================================
let activeChart = 'bar';
const onboardingSlides = [
  ['✦','Bem-vindo ao LIFE AI','Seu espaço inteligente para organizar, aprender e criar.'],
  ['◈','Assistente e conteúdo','Converse com o assistente e prepare ideias, textos e roteiros. A conexão de IA será ativada em atualização própria.'],
  ['▦','Ferramentas e matemática','Use a calculadora, organize seus projetos e tenha recursos matemáticos sempre à mão.'],
  ['▤','Projetos, tarefas e estudos','Crie listas, acompanhe planos de estudo e mantenha seus projetos organizados.'],
  ['◎','Seu LIFE AI, do seu jeito','Personalize seu perfil, explore os temas e envie sugestões para melhorar o aplicativo.']
];
let onboardingIndex = 0;
function renderOnboarding(){
  const slide=onboardingSlides[onboardingIndex];
  $('onboardingIcon').textContent=slide[0]; $('onboardingTitle').textContent=slide[1]; $('onboardingText').textContent=slide[2];
  $('onboardingStep').textContent=`APRESENTAÇÃO ${onboardingIndex+1} DE ${onboardingSlides.length}`;
  $('onboardingDots').innerHTML=onboardingSlides.map((_,i)=>`<i class="${i===onboardingIndex?'active':''}"></i>`).join('');
  $('onboardingBack').disabled=onboardingIndex===0;
  $('onboardingNext').textContent=onboardingIndex===onboardingSlides.length-1?'Começar a usar':'Continuar';
}
function nextOnboarding(){ if(onboardingIndex<onboardingSlides.length-1){onboardingIndex++;renderOnboarding();}else finishOnboarding(); }
function previousOnboarding(){if(onboardingIndex>0){onboardingIndex--;renderOnboarding();}}
function finishOnboarding(){ $('onboarding').hidden=true; localStorage.setItem('life_onboarding_done','1'); }
function replayOnboarding(){onboardingIndex=0;renderOnboarding();$('onboarding').hidden=false;}

function loadProfile(){
  const name=localStorage.getItem('life_profile_name')||'';
  const photo=localStorage.getItem('life_profile_photo')||'';
  $('profileName').value=name;
  $('profileAvatarPreview').src=photo||avatarPlaceholder();
  $('topAvatar').src=photo; $('topAvatar').hidden=!photo; $('topAvatarFallback').hidden=!!photo;
  $('homeGreeting').textContent=name?`Olá, ${name}!`:'Olá!';
}
function avatarPlaceholder(){return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="#20294b"/><circle cx="60" cy="43" r="22" fill="#8da3e8"/><path d="M20 112c3-27 18-40 40-40s37 13 40 40" fill="#8da3e8"/></svg>');}
function saveProfilePhoto(event){const file=event.target.files&&event.target.files[0];if(!file)return;if(!file.type.startsWith('image/')){alert('Escolha uma imagem.');return;}if(file.size>3*1024*1024){alert('Escolha uma imagem de até 3 MB.');return;}const reader=new FileReader();reader.onload=()=>{localStorage.setItem('life_profile_photo',reader.result);loadProfile();};reader.readAsDataURL(file);}
function saveProfile(){const name=$('profileName').value.trim();localStorage.setItem('life_profile_name',name);loadProfile();alert('Perfil salvo neste aparelho.');}

function appendMath(value){const input=$('mathExpression');input.value+=value;$('mathExpressionPreview').textContent=input.value||'0';}
function clearMath(){$('mathExpression').value='';$('mathExpressionPreview').textContent='0';$('mathResult').textContent='Resultado';}
function backspaceMath(){const input=$('mathExpression');input.value=input.value.slice(0,-1);$('mathExpressionPreview').textContent=input.value||'0';}
function previewMathPhoto(event){const file=event.target.files&&event.target.files[0];if(!file)return;if(!file.type.startsWith('image/'))return alert('Selecione uma imagem válida.');const url=URL.createObjectURL(file);const img=$('mathPhotoPreview');img.src=url;img.hidden=false;$('mathPhotoStatus').textContent='Foto carregada para pré-visualização. A interpretação automática por IA ainda depende da integração do modelo multimodal no aplicativo Android.';}
function selectChart(type){activeChart=type;document.querySelectorAll('.chart-tab').forEach(b=>b.classList.toggle('active',b.textContent.toLowerCase().includes(type==='bar'?'barras':type==='pie'?'pizza':'circular')));['bar','pie','ring'].forEach(t=>{const el=$(t+'ChartBox');if(el)el.classList.toggle('chart-selected',t===type);});const project=financeData.find(item=>item.id===currentFinanceId);if(project){if(type==='bar')drawBarChart(project);if(type==='pie')drawPieChart(project);if(type==='ring')drawRingChart(project);}}
function drawRingChart(project){const canvas=$('financeRingChart');if(!canvas)return;const {ctx,width,height}=prepareCanvas(canvas);ctx.clearRect(0,0,width,height);const t=getFinanceTotals(project);const total=t.income+t.expenses;const cx=width/2,cy=105,r=Math.min(75,width*.25);ctx.lineWidth=19;ctx.strokeStyle='rgba(140,150,190,.18)';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();if(total){let start=-Math.PI/2;[[t.income,'#39dca2'],[t.expenses,'#ff7188']].forEach(([v,color])=>{const end=start+(v/total)*Math.PI*2;ctx.strokeStyle=color;ctx.beginPath();ctx.arc(cx,cy,r,start,end);ctx.stroke();start=end;});}ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--text');ctx.textAlign='center';ctx.font='bold 13px Arial';ctx.fillText(total?shortMoney(t.balance):'Sem dados',cx,cy+4);ctx.font='11px Arial';ctx.fillText('Saldo',cx,cy+20);}
function sendFeedback(event){event.preventDefault();const type=$('feedbackType').value;const message=$('feedbackMessage').value.trim();const email=$('supportEmail').value.trim()||localStorage.getItem('life_support_email')||'';if(!message)return alert('Escreva sua mensagem.');if(!email){alert('O e-mail oficial de suporte ainda não foi configurado. Quando você definir o endereço, ele poderá ser salvo neste campo.');return;}localStorage.setItem('life_support_email',email);const subject=encodeURIComponent(`[LIFE AI] ${type}`);const body=encodeURIComponent(message+'\n\nEnviado pelo LIFE AI.');location.href=`mailto:${email}?subject=${subject}&body=${body}`;}
function rateApp(){alert('O LIFE AI ainda precisa ser publicado na Play Store. Depois adicionaremos o link oficial de avaliação.');}

// Ajustes nos recursos originais
const originalDrawFinanceCharts=drawFinanceCharts;
drawFinanceCharts=function(project){originalDrawFinanceCharts(project);drawRingChart(project);selectChart(activeChart);};
const originalCalculate=calculate;
calculate=function(){originalCalculate();const expression=$('mathExpression').value.trim();const result=$('mathResult').textContent;if(expression&&result.startsWith('Resultado:')){$('mathExpressionPreview').textContent=expression;$('mathHistory').textContent=`${expression} = ${result.replace('Resultado: ','')}`;localStorage.setItem('life_math_history',$('mathHistory').textContent);}};
const originalInitializeApp=initializeApp;
initializeApp=function(){originalInitializeApp();loadProfile();$('mathHistory').textContent=localStorage.getItem('life_math_history')||'Nenhum cálculo ainda';if(!localStorage.getItem('life_onboarding_done'))replayOnboarding();};

// ========================================
// MÓDULOS PESSOAIS LIFE AI (dados locais)
// ========================================
const readStore = (key, fallback=[]) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
const writeStore = (key, value) => localStorage.setItem(key, JSON.stringify(value));
let agendaData = readStore('life_agenda');
let habitData = readStore('life_habits');
let noteData = readStore('life_notes');
let focusData = readStore('life_focus');
let focusSeconds = 25*60, focusTotal = 25*60, focusBreak = 5*60, focusMode = 'Pomodoro', focusInterval = null, focusRunning = false, focusOnBreak = false;
const isoToday = () => new Date().toISOString().slice(0,10);
const dateLabel = value => value ? new Date(value+'T12:00:00').toLocaleDateString('pt-BR') : 'Sem data';
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);

function addAgendaEvent(){
 const title=$('agendaTitle').value.trim(), date=$('agendaDate').value, time=$('agendaTime').value;
 if(!title||!date||!time) return alert('Informe título, data e horário.');
 agendaData.push({id:uid(),title,date,time,category:$('agendaCategory').value,priority:$('agendaPriority').value,repeat:$('agendaRepeat').value,details:$('agendaDetails').value.trim(),done:false});
 writeStore('life_agenda',agendaData); ['agendaTitle','agendaDate','agendaTime','agendaDetails'].forEach(id=>$(id).value=''); renderAgenda();
}
function toggleAgenda(id){const e=agendaData.find(x=>x.id===id);if(e)e.done=!e.done;writeStore('life_agenda',agendaData);renderAgenda();}
function deleteAgenda(id){if(!confirm('Excluir este compromisso?'))return;agendaData=agendaData.filter(x=>x.id!==id);writeStore('life_agenda',agendaData);renderAgenda();}
function renderAgenda(){
 if(!$('agendaList'))return;
 const month=$('agendaFilterDate').value || isoToday().slice(0,7);$('agendaFilterDate').value=month;
 const events=agendaData.filter(e=>e.date.startsWith(month)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 const [y,m]=month.split('-').map(Number), first=new Date(y,m-1,1), days=new Date(y,m,0).getDate(), offset=(first.getDay()+6)%7;
 let cal='<div class="calendar-week">'+['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(x=>`<span>${x}</span>`).join('')+'</div><div class="calendar-days">';
 for(let i=0;i<offset;i++)cal+='<span class="empty-day"></span>';
 for(let d=1;d<=days;d++){const ds=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`, has=agendaData.some(e=>e.date===ds), today=ds===isoToday();cal+=`<button class="calendar-day ${has?'has-event':''} ${today?'today':''}" onclick="document.getElementById('agendaFilterDate').value='${month}';document.getElementById('agendaList').scrollIntoView({behavior:'smooth'});">${d}${has?'<i></i>':''}</button>`;}
 cal+='</div>';$('agendaCalendar').innerHTML=cal;
 $('agendaStats').innerHTML=`<div class="stat-card"><b>${agendaData.filter(e=>e.date>=isoToday()&&!e.done).length}</b><span>Próximos</span></div><div class="stat-card"><b>${agendaData.filter(e=>e.date===isoToday()).length}</b><span>Hoje</span></div><div class="stat-card"><b>${agendaData.filter(e=>e.done).length}</b><span>Concluídos</span></div>`;
 $('agendaList').innerHTML=events.length?events.map(e=>`<article class="module-item"><div class="item-main"><b>${safeText(e.title)}</b><small>${dateLabel(e.date)} · ${e.time} · ${safeText(e.category)} · Prioridade ${safeText(e.priority)}</small>${e.details?`<p>${safeText(e.details)}</p>`:''}${e.repeat!=='none'?`<small>Recorrência: ${e.repeat==='daily'?'diária':e.repeat==='weekly'?'semanal':'mensal'}</small>`:''}</div><div class="item-actions"><button onclick="toggleAgenda('${e.id}')">${e.done?'Reabrir':'Concluir'}</button><button class="delete-mini" onclick="deleteAgenda('${e.id}')">Excluir</button></div></article>`).join(''):'<p class="muted">Nenhum compromisso neste mês.</p>';
}
function addHabit(){const title=$('habitTitle').value.trim();if(!title)return alert('Dê um nome ao hábito ou meta.');habitData.push({id:uid(),title,type:$('habitType').value,frequency:$('habitFrequency').value,target:Math.max(1,Number($('habitTarget').value)||1),unit:$('habitUnit').value.trim(),checks:{},created:isoToday()});writeStore('life_habits',habitData);$('habitTitle').value='';renderHabits();}
function checkHabit(id){const h=habitData.find(x=>x.id===id);if(!h)return;h.checks=h.checks||{};if(h.checks[isoToday()])delete h.checks[isoToday()];else h.checks[isoToday()]=true;writeStore('life_habits',habitData);renderHabits();}
function deleteHabit(id){if(!confirm('Excluir este hábito ou meta?'))return;habitData=habitData.filter(x=>x.id!==id);writeStore('life_habits',habitData);renderHabits();}
function renderHabits(){if(!$('habitList'))return;const done=habitData.filter(h=>h.checks&&h.checks[isoToday()]).length;$('habitOverview').innerHTML=`<div class="stat-card"><b>${habitData.length}</b><span>Ativos</span></div><div class="stat-card"><b>${done}</b><span>Feitos hoje</span></div><div class="stat-card"><b>${habitData.length?Math.round(done/habitData.length*100):0}%</b><span>Conclusão diária</span></div>`;$('habitList').innerHTML=habitData.length?habitData.map(h=>{const count=Object.keys(h.checks||{}).length;return `<article class="module-item"><div class="item-main"><b>${safeText(h.title)}</b><small>${h.type==='habit'?'Hábito':'Meta'} · ${h.frequency==='daily'?'Diário':h.frequency==='weekly'?'Semanal':'Dias úteis'} · ${count} registros${h.unit?' · '+safeText(h.unit):''}</small><div class="progress-track"><i style="width:${Math.min(100,count/Math.max(h.target,1)*100)}%"></i></div></div><div class="item-actions"><button onclick="checkHabit('${h.id}')">${h.checks&&h.checks[isoToday()]?'Desmarcar':'Concluir hoje'}</button><button class="delete-mini" onclick="deleteHabit('${h.id}')">Excluir</button></div></article>`}).join(''):'<p class="muted">Adicione seu primeiro hábito ou meta.</p>';}
function saveNote(){const title=$('noteTitle').value.trim(),body=$('noteBody').value.trim();if(!title&&!body)return alert('Escreva um título ou conteúdo.');noteData.push({id:uid(),title:title||'Nota sem título',body,category:$('noteCategory').value,date:$('noteDate').value||isoToday(),pinned:$('notePinned').checked,updated:new Date().toISOString()});writeStore('life_notes',noteData);$('noteTitle').value='';$('noteBody').value='';$('notePinned').checked=false;renderNotes();}
function deleteNote(id){if(!confirm('Excluir esta nota?'))return;noteData=noteData.filter(n=>n.id!==id);writeStore('life_notes',noteData);renderNotes();}
function editNote(id){const n=noteData.find(x=>x.id===id);if(!n)return;$('noteTitle').value=n.title;$('noteBody').value=n.body;$('noteCategory').value=n.category;$('noteDate').value=n.date;$('notePinned').checked=n.pinned;noteData=noteData.filter(x=>x.id!==id);writeStore('life_notes',noteData);renderNotes();$('noteTitle').scrollIntoView({behavior:'smooth'});}
function renderNotes(){if(!$('notesList'))return;const q=$('noteSearch').value.toLowerCase(),cat=$('noteFilter').value,month=$('noteMonth').value;let list=noteData.filter(n=>(cat==='all'||n.category===cat)&&(!month||n.date.startsWith(month))&&(`${n.title} ${n.body}`.toLowerCase().includes(q))).sort((a,b)=>Number(b.pinned)-Number(a.pinned)||b.date.localeCompare(a.date));$('notesList').innerHTML=list.length?list.map(n=>`<article class="module-item note-item"><div class="item-main"><b>${n.pinned?'📌 ':''}${safeText(n.title)}</b><small>${dateLabel(n.date)} · ${safeText(n.category)}</small><p>${safeText(n.body).replace(/\n/g,'<br>')}</p></div><div class="item-actions"><button onclick="editNote('${n.id}')">Editar</button><button class="delete-mini" onclick="deleteNote('${n.id}')">Excluir</button></div></article>`).join(''):'<p class="muted">Nenhuma nota encontrada.</p>';}
function setFocusMode(work,rest,label){focusTotal=work*60;focusSeconds=focusTotal;focusBreak=rest*60;focusMode=label;focusOnBreak=false;updateFocusClock();$('focusStatus').textContent=`Modo ${label} selecionado.`;}
function updateFocusClock(){const mm=String(Math.floor(focusSeconds/60)).padStart(2,'0'),ss=String(focusSeconds%60).padStart(2,'0');$('focusClock').textContent=`${mm}:${ss}`;}
function toggleFocus(){if(focusRunning){clearInterval(focusInterval);focusRunning=false;$('focusStart').textContent='Continuar';$('focusStatus').textContent='Sessão pausada.';return;}if(!focusOnBreak&&!$('focusTask').value.trim())$('focusTask').value='Sessão de concentração';focusRunning=true;$('focusStart').textContent='Pausar';$('focusStatus').textContent=focusOnBreak?'Pausa em andamento':'Concentre-se na sua tarefa';focusInterval=setInterval(()=>{focusSeconds--;updateFocusClock();if(focusSeconds<=0){clearInterval(focusInterval);focusRunning=false;if(!focusOnBreak){focusData.unshift({id:uid(),date:isoToday(),minutes:Math.round(focusTotal/60),task:$('focusTask').value.trim(),mode:focusMode});writeStore('life_focus',focusData);focusOnBreak=true;focusSeconds=focusBreak;$('focusStatus').textContent='Parabéns! Hora de fazer uma pausa.';}else{focusOnBreak=false;focusSeconds=focusTotal;$('focusStatus').textContent='Pausa concluída. Pronto para outra sessão?';}$('focusStart').textContent='Iniciar foco';updateFocusClock();renderFocus();}},1000);}
function resetFocus(){clearInterval(focusInterval);focusRunning=false;focusOnBreak=false;focusSeconds=focusTotal;updateFocusClock();$('focusStart').textContent='Iniciar foco';$('focusStatus').textContent='Temporizador reiniciado.';}
function renderFocus(){if(!$('focusHistory'))return;const mins=focusData.filter(x=>x.date===isoToday()).reduce((a,b)=>a+b.minutes,0);$('focusStats').innerHTML=`<div class="stat-card"><b>${mins}</b><span>Minutos hoje</span></div><div class="stat-card"><b>${focusData.filter(x=>x.date===isoToday()).length}</b><span>Sessões hoje</span></div><div class="stat-card"><b>${focusData.length}</b><span>Sessões totais</span></div>`;$('focusHistory').innerHTML=focusData.length?focusData.slice(0,20).map(x=>`<div class="history-row"><b>${safeText(x.task||'Sessão')}</b><span>${x.minutes} min · ${dateLabel(x.date)}</span></div>`).join(''):'<p class="muted">Suas sessões concluídas aparecerão aqui.</p>';}
function renderDashboard(){if(!$('dashboardStats'))return;const period=Number($('dashboardPeriod').value||7),cut=new Date();cut.setDate(cut.getDate()-period+1);const since=cut.toISOString().slice(0,10),focus=focusData.filter(x=>x.date>=since),minutes=focus.reduce((a,b)=>a+b.minutes,0),notes=noteData.filter(n=>n.date>=since).length,events=agendaData.filter(e=>e.date>=since&&e.date<=isoToday()).length,checks=habitData.reduce((a,h)=>a+Object.keys(h.checks||{}).filter(d=>d>=since).length,0);$('dashboardStats').innerHTML=`<div class="stat-card"><b>${habitData.length}</b><span>Hábitos ativos</span></div><div class="stat-card"><b>${checks}</b><span>Hábitos concluídos</span></div><div class="stat-card"><b>${minutes}</b><span>Minutos de foco</span></div><div class="stat-card"><b>${events}</b><span>Compromissos passados</span></div><div class="stat-card"><b>${notes}</b><span>Notas criadas</span></div>`;
 const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d.toISOString().slice(0,10)});const maxH=Math.max(1,...days.map(d=>habitData.filter(h=>h.checks&&h.checks[d]).length));$('dashboardHabitChart').innerHTML=days.map(d=>{const v=habitData.filter(h=>h.checks&&h.checks[d]).length;return `<div class="bar-column"><b>${v}</b><i style="height:${Math.max(5,v/maxH*100)}%"></i><small>${new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','')}</small></div>`}).join('');const maxF=Math.max(1,...days.map(d=>focusData.filter(f=>f.date===d).reduce((a,b)=>a+b.minutes,0)));$('dashboardFocusChart').innerHTML=days.map(d=>{const v=focusData.filter(f=>f.date===d).reduce((a,b)=>a+b.minutes,0);return `<div class="bar-column"><b>${v}m</b><i style="height:${Math.max(5,v/maxF*100)}%"></i><small>${new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','')}</small></div>`}).join('');$('dashboardSummary').innerHTML=`<p>Você tem <b>${agendaData.filter(e=>e.date>=isoToday()&&!e.done).length}</b> compromissos futuros pendentes e <b>${noteData.length}</b> notas guardadas.</p><p>Seu tempo registrado em foco no período: <b>${minutes} minutos</b>.</p><p>Os indicadores são calculados com os dados salvos neste aparelho.</p>`;}
const originalShowPage = showPage;
showPage = function(page){originalShowPage(page);if(page==='agenda')renderAgenda();if(page==='habits')renderHabits();if(page==='notes')renderNotes();if(page==='focus')renderFocus();if(page==='dashboard')renderDashboard();};
