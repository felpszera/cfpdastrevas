const canvas = document.getElementById('formacaoCanvas');
const ctx = canvas.getContext('2d');

// Agora o tamanho fixo que colocamos no CSS
canvas.width = 1200;
canvas.height = 900;


const colunas = 45;
const linhas = gerarEixoY();

const cellSize = Math.min(
  (canvas.width - 100) / (colunas - 1),
  (canvas.height - 100) / (linhas.length - 1)
);

const offsetX = (canvas.width - (colunas - 1) * cellSize) / 2;
const offsetY = (canvas.height - (linhas.length - 1) * cellSize) / 2;

const alunos = new Set();
const historico = [];

const pontosPermitidos = gerarPontosPermitidos();

canvas.addEventListener('click', handleCanvasClick);
canvas.addEventListener('mousemove', mostrarEnderecoAluno);

desenharTudo();

function gerarEixoY() {
  const letras = [];
  for (let i = 65; i <= 90; i++) letras.push(String.fromCharCode(i));
  letras.push('Ω1');
  return letras;
}

function gerarPontosPermitidos() {
    const pontos = [];
  
    for (let y = 0; y < linhas.length; y++) {
      for (let x = 1; x <= colunas; x++) {
        // Ponto exato (interseção)
        pontos.push({
          x: offsetX + (x - 1) * cellSize,
          y: offsetY + y * cellSize,
          tipo: "intersecao"
        });
  
        // Centro da célula
        if (x < colunas && y < linhas.length - 1) {
          pontos.push({
            x: offsetX + (x - 0.5) * cellSize,
            y: offsetY + (y + 0.5) * cellSize,
            tipo: "centro"
          });
        }
  
        // Meio horizontal (entre duas colunas)
        if (x < colunas) {
          pontos.push({
            x: offsetX + (x - 0.5) * cellSize,
            y: offsetY + y * cellSize,
            tipo: "meio_horizontal"
          });
        }
  
        // Meio vertical (entre duas linhas)
        if (y < linhas.length - 1) {
          pontos.push({
            x: offsetX + (x - 1) * cellSize,
            y: offsetY + (y + 0.5) * cellSize,
            tipo: "meio_vertical"
          });
        }
      }
    }
  
    return pontos;
  }
  

function desenharGrade() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#0059b3";
  ctx.lineWidth = 1;

  ctx.font = "bold 11px Segoe UI";
  ctx.fillStyle = "#FFD700";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let x = 1; x <= colunas; x++) {
    const px = offsetX + (x - 1) * cellSize;
    ctx.beginPath();
    ctx.moveTo(px, offsetY);
    ctx.lineTo(px, offsetY + (linhas.length - 1) * cellSize);
    ctx.stroke();
    ctx.fillText(x, px, offsetY - 15);
  }

  for (let y = 0; y < linhas.length; y++) {
    const py = offsetY + y * cellSize;
    ctx.beginPath();
    ctx.moveTo(offsetX, py);
    ctx.lineTo(offsetX + (colunas - 1) * cellSize, py);
    ctx.stroke();
    ctx.fillText(linhas[y], offsetX - 20, py);
  }
}

function desenharAlunos() {
  alunos.forEach((key) => {
    const [x, y] = key.split('-').map(Number);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "#003366";
    ctx.fill();
  });
}

function desenharTudo() {
  desenharFundo();
  desenharGrade();
  desenharAlunos();

  // Assinatura no canto inferior direito do canvas
  ctx.font = "bold 12px Segoe UI";
  ctx.fillStyle = "#FFD700"; // dourado PMDF
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText("Desenvolvido por Felipe - 2025", canvas.width - 10, canvas.height - 10);
}


function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
  
    let pontoMaisProximo = null;
    let distanciaMinima = 12;
  
    pontosPermitidos.forEach(p => {
      const dist = Math.hypot(p.x - mouseX, p.y - mouseY);
      if (dist < distanciaMinima) {
        distanciaMinima = dist;
        pontoMaisProximo = p;
      }
    });
  
    if (pontoMaisProximo) {
      const key = `${Math.round(pontoMaisProximo.x)}-${Math.round(pontoMaisProximo.y)}`;
  
      if (alunos.has(key)) {
        alunos.delete(key);
        historico.push({ tipo: 'remover', key });
      } else {
        alunos.add(key);
        historico.push({ tipo: 'adicionar', key });
      }
  
      desenharTudo();
    }
  }  
  
function desfazerAcao() {
  if (historico.length === 0) return;

  const ultimaAcao = historico.pop();

  if (ultimaAcao.tipo === 'adicionar') {
    alunos.delete(ultimaAcao.key);
  } else if (ultimaAcao.tipo === 'remover') {
    alunos.add(ultimaAcao.key);
  }

  desenharTudo();
}

function salvarFormacao() {
  const formacao = Array.from(alunos);
  const blob = new Blob([JSON.stringify(formacao, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "formacao_manual.json";
  a.click();
  URL.revokeObjectURL(url);

  mostrarMensagem("💾 Formação salva com sucesso!");
}

function limparFormacao() {
  alunos.clear();
  historico.length = 0;
  desenharTudo();
  mostrarMensagem("🗑️ Formação limpa!");
}

function imprimirFormacao() {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head><title>Imprimir Formação</title></head>
      <body style="margin:0; display:flex; justify-content:center; align-items:center; background:white;">
        <img src="${canvas.toDataURL('image/png')}" style="max-width:100%; max-height:100%;">
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

function mostrarMensagem(texto) {
  const mensagem = document.getElementById('mensagem');
  mensagem.innerText = texto;
  mensagem.style.opacity = 1;
  setTimeout(() => {
    mensagem.style.opacity = 0;
  }, 2500);
}

function preencherIntersecoes() {
  alunos.clear();
  historico.length = 0;

  pontosPermitidos.forEach(ponto => {
    if (ponto.tipo === "intersecao") {
      const key = `${Math.round(ponto.x)}-${Math.round(ponto.y)}`;
      alunos.add(key);
    }
  });

  desenharTudo();
  mostrarMensagem("🧩 Interseções preenchidas com sucesso!");
}

function mostrarEnderecoAluno(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
  
    let encontrado = null;
    alunos.forEach(key => {
      const [x, y] = key.split('-').map(Number);
      const dist = Math.hypot(x - mouseX, y - mouseY);
      if (dist <= 8) { // tolerância para detecção
        encontrado = { x, y };
      }
    });
  
    const info = document.getElementById('infoAluno');
  
    if (encontrado) {
      const coluna = Math.round((encontrado.x - offsetX) / cellSize) + 1;
      const linhaIndex = Math.round((encontrado.y - offsetY) / cellSize);
      const linha = linhas[linhaIndex] || '?';
  
      info.innerText = `Linha ${linha} - Coluna ${coluna}`;
    } else {
      info.innerText = ''; // limpa se não estiver sobre aluno
    }
  }

  async function baixarPDF() {
    const { jsPDF } = window.jspdf;
  
    const a4Width = 842; // Agora é paisagem (largura de A4)
    const a4Height = 595; // Altura de A4
  
    // Gera a imagem do canvas
    const imgData = canvas.toDataURL("image/png");
  
    // Calcula proporção
    const canvasRatio = canvas.width / canvas.height;
    const a4Ratio = a4Width / a4Height;
  
    let imgWidth = a4Width;
    let imgHeight = a4Height;
  
    if (canvasRatio > a4Ratio) {
      imgHeight = imgWidth / canvasRatio;
    } else {
      imgWidth = imgHeight * canvasRatio;
    }
  
    const marginX = (a4Width - imgWidth) / 2;
    const marginY = (a4Height - imgHeight) / 2;
  
    const pdf = new jsPDF({
      orientation: "landscape", // Modo PAISAGEM aqui
      unit: "px",
      format: [a4Width, a4Height]
    });
  
    pdf.addImage(imgData, "PNG", marginX, marginY, imgWidth, imgHeight);
    pdf.save("formacao_pmdf.pdf");
  }
  
