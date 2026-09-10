const vulnerabilities = [
  {id:1,name:"Windows 远程桌面服务远程代码执行漏洞",cve:"CVE-2024-38077",level:"严重",vpt:"P0",assets:3,exposure:"互联网暴露",status:"待处理",org:"研发一部"},
  {id:2,name:"FortiOS SSL VPN 路径遍历漏洞",cve:"CVE-2018-13379",level:"严重",vpt:"P0",assets:1,exposure:"互联网暴露",status:"确认中",org:"基础架构"},
  {id:3,name:"Apache Tomcat AJP 文件读取漏洞",cve:"CVE-2020-1938",level:"高危",vpt:"P1",assets:5,exposure:"内网可达",status:"待处理",org:"业务中台"},
  {id:4,name:"Exim 远程命令执行漏洞",cve:"CVE-2019-10149",level:"严重",vpt:"P0",assets:2,exposure:"内网可达",status:"待处理",org:"研发一部"},
  {id:5,name:"OpenSSH 用户枚举漏洞",cve:"CVE-2018-15473",level:"高危",vpt:"P2",assets:8,exposure:"内网可达",status:"确认中",org:"数据平台"}
];

let selected = new Set([1]);
let audience = "运营";
const views = ["selectView","configView","generateView","reportView"];

function renderRows() {
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  const level = document.getElementById("levelFilter").value;
  const rows = vulnerabilities.filter(v => (level === "all" || v.level === level) && `${v.name}${v.cve}`.toLowerCase().includes(q));
  document.getElementById("vulnRows").innerHTML = rows.map(v => `<tr class="${selected.has(v.id)?"selected":""}"><td><input type="checkbox" data-id="${v.id}" ${selected.has(v.id)?"checked":""}></td><td><b>${v.name}</b><small>${v.cve} · ${v.org}</small></td><td><span class="level ${v.level}">${v.level}</span><span class="vpt">${v.vpt}</span></td><td>${v.assets} 台</td><td><span class="${v.exposure === "互联网暴露"?"exposed":""}">${v.exposure}</span></td><td><span class="status">${v.status}</span></td></tr>`).join("");
}

function renderSelection() {
  const items = vulnerabilities.filter(v => selected.has(v.id));
  document.getElementById("selectedCount").textContent = `已选择 ${items.length} 项`;
  document.getElementById("scopeVulns").textContent = items.length;
  document.getElementById("scopeAssets").textContent = items.reduce((n,v)=>n+v.assets,0);
  document.getElementById("scopeOrgs").textContent = new Set(items.map(v=>v.org)).size;
  document.getElementById("selectionSummary").innerHTML = items.length ? items.map(v=>`<div class="selected-item"><span class="risk-dot"></span><div><b>${v.cve}</b><small>${v.name}</small></div><button data-remove="${v.id}" title="移除">×</button></div>`).join("") : `<div class="empty">请至少选择一个漏洞</div>`;
  document.getElementById("toConfig").disabled = !items.length;
  renderRows();
}

function showView(id, step) {
  views.forEach(v=>document.getElementById(v).classList.toggle("active",v===id));
  document.querySelectorAll(".step").forEach((el,i)=>{el.classList.toggle("active",i+1===step);el.classList.toggle("done",i+1<step);});
  window.scrollTo({top:0,behavior:"smooth"});
}

document.getElementById("vulnRows").addEventListener("change", e => { if(!e.target.dataset.id)return; const id=+e.target.dataset.id; e.target.checked?selected.add(id):selected.delete(id); renderSelection(); });
document.getElementById("selectionSummary").onclick=e=>{const id=e.target.dataset.remove;if(id){selected.delete(+id);renderSelection();}};
document.getElementById("clearSelection").onclick=()=>{selected.clear();renderSelection();};
document.getElementById("searchInput").oninput=renderRows;
document.getElementById("levelFilter").onchange=renderRows;
document.getElementById("toConfig").onclick=()=>showView("configView",2);
document.getElementById("backSelect").onclick=()=>showView("selectView",1);
document.querySelectorAll("#audienceChoices .choice").forEach(btn=>btn.onclick=()=>{document.querySelectorAll("#audienceChoices .choice").forEach(x=>x.classList.remove("active"));btn.classList.add("active");audience=btn.dataset.value;});

function generate() {
  showView("generateView",3);
  const stages = [
    [12,"读取漏洞与资产上下文...","已读取 CVE、VPT、漏洞等级、状态与影响资产"],
    [36,"检索可信安全知识...","命中 1 条厂商公告、2 条内部审核知识与 CWE 记录"],
    [62,"生成结构化分析内容...",`正在按“${audience}”受众组织执行摘要、影响面与处置建议`],
    [84,"校验关键事实与引用...","14 项平台事实一致；发现 1 项资产版本信息不完整"],
    [100,"报告生成完成","所有高风险结论均有证据引用，待人工审核"]
  ];
  let i=0;
  const tick=()=>{
    const [pct,status,log]=stages[i];
    document.getElementById("progressBar").style.width=`${pct}%`;
    document.getElementById("progressValue").textContent=`${pct}%`;
    document.getElementById("generationStatus").textContent=status;
    document.getElementById("liveLog").textContent=log;
    document.querySelectorAll("#pipeline span").forEach((el,n)=>{el.className=n<Math.min(i,4)?"complete":n===Math.min(i,3)?"running":""});
    i++;
    if(i<stages.length) setTimeout(tick,620); else setTimeout(()=>{document.getElementById("reportTitle").textContent=document.getElementById("reportName").value;showView("reportView",4);},520);
  };
  tick();
}
document.getElementById("startGenerate").onclick=generate;
document.getElementById("regenerate").onclick=generate;
document.getElementById("backConfig").onclick=()=>showView("configView",2);
document.querySelectorAll(".report-nav button").forEach(btn=>btn.onclick=()=>{document.querySelectorAll(".report-nav button").forEach(x=>x.classList.remove("active"));btn.classList.add("active");document.getElementById(btn.dataset.target).scrollIntoView({behavior:"smooth",block:"start"});});
document.getElementById("printReport").onclick=()=>window.print();
document.getElementById("confirmReport").onclick=()=>{
  const checks=["checkFacts","checkAdvice","checkBoundary"].every(id=>document.getElementById(id).checked);
  toast(checks?"报告 v1.0 已由当前用户确认，可用于后续处置。":"请先完成右侧 3 项人工审核确认。",!checks);
};
function toast(message,warn=false){const t=document.getElementById("toast");t.textContent=message;t.className=`toast show ${warn?"warn":""}`;setTimeout(()=>t.classList.remove("show"),3000);}
renderSelection();
