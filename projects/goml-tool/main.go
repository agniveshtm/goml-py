package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	gomlfmt "github.com/Aswanidev-vs/goml/internal/fmt"
	"github.com/Aswanidev-vs/goml/internal/lint"
	"github.com/Aswanidev-vs/goml/internal/schema"
	"github.com/Aswanidev-vs/goml/pkg/goml"
)

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GOML Tool</title>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#0a0a0f;--bg2:#12121a;--bg3:#16161f;--border:#1e1e2a;--text:#e8e8ed;--text2:#6b6b80;--accent:#00d4aa;--red:#ff4466;--yellow:#ffcc44;--blue:#4488ff;--purple:#aa66ff;--mono:'JetBrains Mono',monospace;--sans:'DM Sans',system-ui,sans-serif}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--sans);background:var(--bg);color:var(--text);min-height:100vh}
.header{background:var(--bg2);border-bottom:1px solid var(--border);padding:16px 24px;display:flex;align-items:center;justify-content:space-between}
.logo{font-family:var(--mono);font-size:1.2rem;font-weight:700}
.logo span{color:var(--accent)}
.tabs{display:flex;gap:4px}
.tab{font-family:var(--mono);font-size:.8rem;padding:8px 16px;border:1px solid var(--border);border-radius:100px;background:transparent;color:var(--text2);cursor:pointer;transition:all .2s}
.tab:hover{border-color:var(--accent);color:var(--text)}
.tab.active{background:var(--accent);color:var(--bg);border-color:var(--accent)}
.container{max-width:1200px;margin:0 auto;padding:24px}
.editor-wrap{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
.pane{background:var(--bg2);border:1px solid var(--border);border-radius:12px;overflow:hidden}
.pane-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border)}
.pane-title{font-family:var(--mono);font-size:.8rem;color:var(--text2)}
.pane-body{position:relative}
textarea,.output{width:100%;height:500px;padding:16px;background:transparent;border:none;color:var(--text);font-family:var(--mono);font-size:.85rem;line-height:1.8;resize:none;outline:none}
.output{overflow:auto;white-space:pre-wrap;color:var(--text2)}
.output pre{margin:0;font-family:var(--mono);font-size:.85rem;line-height:1.8}
.btn-row{display:flex;gap:8px;flex-wrap:wrap}
.btn{font-family:var(--mono);font-size:.8rem;padding:10px 20px;border-radius:8px;border:1px solid var(--border);background:var(--bg2);color:var(--text);cursor:pointer;transition:all .2s}
.btn:hover{border-color:var(--accent);color:var(--accent)}
.btn.primary{background:var(--accent);color:var(--bg);border-color:var(--accent)}
.btn.primary:hover{background:#00eabb}
.status{font-family:var(--mono);font-size:.75rem;color:var(--text2);padding:8px 16px}
.status.ok{color:var(--accent)}
.status.err{color:var(--red)}
.status.warn{color:var(--yellow)}
.hidden{display:none}
.results{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:16px;max-height:300px;overflow:auto;margin-top:16px}
.results pre{font-family:var(--mono);font-size:.8rem;line-height:1.8;color:var(--text2)}
.feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:24px}
.feature{background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:20px;text-align:center}
.feature-icon{font-size:1.5rem;margin-bottom:8px}
.feature h3{font-family:var(--mono);font-size:.9rem;margin-bottom:4px}
.feature p{font-size:.8rem;color:var(--text2)}
@media(max-width:800px){.editor-wrap{grid-template-columns:1fr}.feature-grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="header">
  <div class="logo">{<span>GOML</span>}</div>
  <div class="tabs">
    <button class="tab active" onclick="showTab('parse')">Parse</button>
    <button class="tab" onclick="showTab('format')">Format</button>
    <button class="tab" onclick="showTab('lint')">Lint</button>
    <button class="tab" onclick="showTab('validate')">Validate</button>
  </div>
</div>
<div class="container">
  <div class="editor-wrap">
    <div class="pane">
      <div class="pane-header">
        <span class="pane-title" id="inputTitle">GOML Input</span>
        <div class="btn-row">
          <button class="btn" onclick="clearAll()">Clear</button>
          <button class="btn" onclick="loadExample()">Example</button>
        </div>
      </div>
      <div class="pane-body">
        <textarea id="input" spellcheck="false" placeholder="# Paste your GOML here...">app {
  name = MyApp
  port = 8080
  debug = false
}

server {
  host = localhost
  port = 8080
}

database {
  host = localhost
  port = 5432
  name = myapp
  pool {
    min = 5
    max = 20
  }
}

features = [auth, logging, cache]</textarea>
      </div>
    </div>
    <div class="pane">
      <div class="pane-header">
        <span class="pane-title" id="outputTitle">Output</span>
        <div class="btn-row">
          <button class="btn" onclick="copyOutput()">Copy</button>
        </div>
      </div>
      <div class="pane-body">
        <div class="output" id="output"><pre id="outputPre"></pre></div>
      </div>
    </div>
  </div>
  <div class="btn-row">
    <button class="btn primary" id="actionBtn" onclick="doAction()">Parse to JSON</button>
    <span class="status" id="status"></span>
  </div>
  <div class="feature-grid">
    <div class="feature">
      <div class="feature-icon">#</div>
      <h3>Parse</h3>
      <p>Convert GOML to JSON</p>
    </div>
    <div class="feature">
      <div class="feature-icon">{ }</div>
      <h3>Format</h3>
      <p>Pretty print GOML</p>
    </div>
    <div class="feature">
      <div class="feature-icon">!</div>
      <h3>Lint</h3>
      <p>Check for issues</p>
    </div>
  </div>
</div>
<script>
let currentTab='parse';
function showTab(t){
  currentTab=t;
  document.querySelectorAll('.tab').forEach(e=>e.classList.remove('active'));
  event.target.classList.add('active');
  const btn=document.getElementById('actionBtn');
  const titles={parse:'Parse to JSON',format:'Format GOML',lint:'Lint GOML',validate:'Validate GOML'};
  btn.textContent=titles[t];
  document.getElementById('inputTitle').textContent=t==='validate'?'Schema + GOML':'GOML Input';
  document.getElementById('outputTitle').textContent='Output';
  document.getElementById('status').textContent='';
  document.getElementById('status').className='status';
}
function doAction(){
  const input=document.getElementById('input').value;
  const output=document.getElementById('outputPre');
  const status=document.getElementById('status');
  status.textContent='Processing...';status.className='status';
  fetch('/'+currentTab,{method:'POST',headers:{'Content-Type':'text/plain'},body:input})
    .then(r=>r.json()).then(d=>{
      if(d.error){status.textContent=d.error;status.className='status err';output.textContent='';return}
      output.textContent=d.result;
      status.textContent='Success';status.className='status ok';
    }).catch(e=>{status.textContent=e.message;status.className='status err'});
}
function copyOutput(){
  navigator.clipboard.writeText(document.getElementById('outputPre').textContent);
  document.getElementById('status').textContent='Copied!';document.getElementById('status').className='status ok';
}
function clearAll(){document.getElementById('input').value='';document.getElementById('outputPre').textContent='';document.getElementById('status').textContent='';}
function loadExample(){
document.getElementById('input').value=` + "`" + `# Application Configuration
app {
  name = MyApp
  version = 2.1.0
  debug = false
}

server {
  host = 0.0.0.0
  port = 8080
  workers = 4

  ssl {
    enabled = true
    cert = /etc/ssl/certs/app.pem
  }
}

database {
  driver = postgres
  host = db.example.com
  port = 5432
  pool {
    min = 5
    max = 20
  }
}

features = [auth, logging, cache]` + "`" + `;
}
</script>
</body>
</html>`

const maxBodySize = 10 * 1024 * 1024 // 10MB

func main() {
	http.HandleFunc("/", handleIndex)
	http.HandleFunc("/parse", handleParse)
	http.HandleFunc("/format", handleFormat)
	http.HandleFunc("/lint", handleLint)
	http.HandleFunc("/validate", handleValidate)

	server := &http.Server{
		Addr:         ":8080",
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	fmt.Println("GOML Tool running at http://localhost:8080")
	server.ListenAndServe()
}

func readBody(r *http.Request) ([]byte, error) {
	body, err := io.ReadAll(io.LimitReader(r.Body, maxBodySize+1))
	if err != nil {
		return nil, err
	}
	if len(body) > maxBodySize {
		return nil, fmt.Errorf("request body too large (max %d bytes)", maxBodySize)
	}
	return body, nil
}

func handleIndex(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-Frame-Options", "DENY")
	w.Write([]byte(html))
}

func handleParse(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	body, err := readBody(r)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]string{"error": "request too large"})
		return
	}
	data, err := goml.ParseString(string(body))
	if err != nil {
		json.NewEncoder(w).Encode(map[string]string{"error": "parse error"})
		return
	}
	result, _ := json.MarshalIndent(data, "", "  ")
	json.NewEncoder(w).Encode(map[string]string{"result": string(result)})
}

func handleFormat(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	body, err := readBody(r)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]string{"error": "request too large"})
		return
	}
	formatter := gomlfmt.New()
	result, err := formatter.Format(string(body))
	if err != nil {
		json.NewEncoder(w).Encode(map[string]string{"error": "format error"})
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"result": result})
}

func handleLint(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	body, err := readBody(r)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]string{"error": "request too large"})
		return
	}
	l := lint.New()
	issues, err := l.Lint(string(body))
	if err != nil {
		json.NewEncoder(w).Encode(map[string]string{"error": "lint error"})
		return
	}
	if len(issues) == 0 {
		json.NewEncoder(w).Encode(map[string]string{"result": "No issues found."})
		return
	}
	var sb strings.Builder
	for _, issue := range issues {
		sb.WriteString(issue.String() + "\n")
	}
	json.NewEncoder(w).Encode(map[string]string{"result": sb.String()})
}

func handleValidate(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	body, err := readBody(r)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]string{"error": "request too large"})
		return
	}
	parts := strings.SplitN(string(body), "\n---\n", 2)
	if len(parts) != 2 {
		json.NewEncoder(w).Encode(map[string]string{"error": "Send schema and data separated by ---"})
		return
	}
	s, err := schema.ParseSchema(parts[0])
	if err != nil {
		json.NewEncoder(w).Encode(map[string]string{"error": "Schema error: " + err.Error()})
		return
	}
	s.Compile()
	data, err := goml.ParseString(parts[1])
	if err != nil {
		json.NewEncoder(w).Encode(map[string]string{"error": "Data error: " + err.Error()})
		return
	}
	errs := s.Validate(data)
	if len(errs) == 0 {
		json.NewEncoder(w).Encode(map[string]string{"result": "Validation passed."})
		return
	}
	var sb strings.Builder
	for _, e := range errs {
		sb.WriteString("- " + e.String() + "\n")
	}
	json.NewEncoder(w).Encode(map[string]string{"result": sb.String()})
}
