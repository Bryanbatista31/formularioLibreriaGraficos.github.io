Chart.register(ChartDataLabels);

const fuenteSelect = document.getElementById('fuenteSelect');
const archivoGroup = document.getElementById('archivoGroup');
const apiGroup = document.getElementById('apiGroup');
const archivoInput = document.getElementById('archivoInput');
const apiInput = document.getElementById('apiInput');
const cargarApiBtn = document.getElementById('cargarApiBtn');
const tipoGraficoSelect = document.getElementById('tipoGraficoSelect');
const exportImageBtn = document.getElementById('exportImageBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const ctx = document.getElementById('graficoCanvas').getContext('2d');
let chart;

fuenteSelect.addEventListener('change', () => {
  archivoGroup.classList.toggle('hidden', fuenteSelect.value !== 'archivo');
  apiGroup.classList.toggle('hidden', fuenteSelect.value !== 'api');
});

archivoInput.addEventListener('change', () => {
  const file = archivoInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => procesarDatos(file.name, e.target.result);
  reader.readAsText(file);
});

cargarApiBtn.addEventListener('click', async () => {
  const url = apiInput.value;
  if (!url) return alert('Ingresa una URL válida');
  try {
    const res = await fetch(url);
    const json = await res.json();
    procesarDatos('api', JSON.stringify(json));
  } catch {
    alert('Error al cargar la API');
  }
});

function procesarDatos(origin, content) {
  const labels = [];
  const data = [];
  if (origin.endsWith('.csv') || (origin === 'api' && content.trim().startsWith('['))) {
    if (origin.endsWith('.csv')) {
      content.trim().split('\n').slice(1).forEach(line => {
        const sep = line.includes(';') ? ';' : ',';
        const [nombre, valor] = line.split(sep);
        labels.push(nombre.trim());
        data.push(parseFloat(valor));
      });
    } else {
      JSON.parse(content).forEach(item => {
        labels.push(item.nombre);
        data.push(parseFloat(item.valor));
      });
    }
  } else {
    return alert('Formato no soportado');
  }
  renderChart(labels, data);
}

function renderChart(labels, data) {
  if (chart) chart.destroy();
  const type = tipoGraficoSelect.value;
  const total = data.reduce((sum, v) => sum + v, 0);
  chart = new Chart(ctx, {
    type,
    data: { labels, datasets: [{ data, backgroundColor: labels.map((_, i) => `hsl(${i* (360/labels.length)},70%,60%)`), borderWidth: 1 }] },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { enabled: true },
        datalabels: {
          color: '#fff',
          formatter: (value) => {
            const pct = (value / total * 100).toFixed(1);
            return `${pct}%`;
          }
        }
      },
      interaction: { mode: 'nearest', intersect: false }
    }
  });
}

exportImageBtn.addEventListener('click', () => {
  if (!chart) return;
  const link = document.createElement('a');
  link.href = document.getElementById('graficoCanvas').toDataURL('image/png');
  link.download = `grafico.${tipoGraficoSelect.value}.png`;
  link.click();
});

exportPdfBtn.addEventListener('click', () => {
  if (!chart) return;
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'landscape' });
  pdf.text('Gráfico Exportado', 10, 10);
  pdf.addImage(document.getElementById('graficoCanvas').toDataURL('image/png'), 'PNG', 15, 20, 180, 100);
  pdf.save(`grafico.${tipoGraficoSelect.value}.pdf`);
});