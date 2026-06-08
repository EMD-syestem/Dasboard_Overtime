let allData = [];

function parseTanggal(val) {
  if (val === null || val === undefined || val === "") return null;

  // kalau sudah Date object
  if (val instanceof Date) {
    return new Date(val.getFullYear(), val.getMonth(), val.getDate());
  }

  // kalau angka (serial Google Sheets)
  if (typeof val === "number") {
    const d = new Date(Date.UTC(1899, 11, 30));
    d.setDate(d.getDate() + val);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  // string (paksa aman)
  const d = new Date(val);
  if (isNaN(d)) return null;

  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function filterByDate(data) {
  const startDate = document.getElementById("startDate")?.value;
  const endDate = document.getElementById("endDate")?.value;

  if (!startDate || !endDate) return data;

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return data.filter((row) => {
    const tanggal = parseTanggal(row[1]); // kolom B
    if (!tanggal) return false;

    return tanggal >= start && tanggal <= end;
  });
}

function drawJamKerjaChart(map) {
  const categories = [];
  const values = [];

  Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .forEach(([nama, total]) => {
      categories.push(nama);
      values.push(total);
    });
  setTimeout(() => {
    const s = document.querySelector(
      "#jamKerjaChart .highcharts-scrolling-parent"
    );

    if (s) {
      console.log("scrollWidth =", s.scrollWidth);
      console.log("clientWidth =", s.clientWidth);

      s.style.overflowX = "scroll";
      s.style.overflowY = "hidden";
    }
  }, 1000);
  const container = document.getElementById("jamKerjaChart");

  const chartWidth = Math.max(
    categories.length * 90,
    container.parentElement.clientWidth
  );

  container.style.width = chartWidth + "px";

  Highcharts.chart("jamKerjaChart", {
    chart: {
      type: "column",
      backgroundColor: "transparent",

      marginTop: 15,
      marginBottom: 70,
      marginLeft: -550,
      marginRight: 20,

      options3d: {
        enabled: true,
        alpha: 12,
        beta: 15,
        depth: 70,
        viewDistance: 30
      }
    },
    title: {
      text: null
    },

    xAxis: {
      categories: categories,

      labels: {
        rotation: -50,
        style: {
          fontSize: "11px"
        }
      }
    },

    yAxis: {
      min: 0,

      title: {
        text: null
      }
    },

    legend: {
      enabled: true,
      align: "center",
      verticalAlign: "bottom"
    },

    plotOptions: {
      column: {
        depth: 45,

        pointWidth: 40,

        pointPadding: 0.05,

        groupPadding: 0.1,

        grouping: false,

        dataLabels: {
          enabled: true
        }
      }
    },

    tooltip: {
      pointFormat: "<b>{point.y:.2f} Jam</b>"
    },

    series: [
      {
        name: "Total Jam Kerja",

        data: values,

        color: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1
          },

          stops: [
            [0, "#8fb5f0"],
            [0.5, "#5c93de"],
            [1, "#2f6fca"]
          ]
        }
      }
    ],

    credits: {
      enabled: false
    }
  });
}

function loadTotalJamKerja() {
  fetch(
    "https://script.google.com/macros/s/AKfycbxo_XzunHS3-7f959z3zlpCXtyAt-koWb2KSm8OiMGtVIc9Nv08t_0xUOhSGAVs9eMF/exec?action=read"
  )
    .then((res) => res.json())
    .then((data) => {
      data = filterByDate(data);

      if (selectedDriver) {
        data = data.filter(
          (row) =>
            (row[0] || "").trim().toLowerCase() ===
            selectedDriver.trim().toLowerCase()
        );
      }

      const map = {};

      data.forEach((row) => {
        const nama = (row[0] || "").trim();

        const jamKerja = parseFloat(row[3]) || 0;

        if (!nama) return;

        if (!map[nama]) {
          map[nama] = 0;
        }

        map[nama] += jamKerja;
      });

      // ================= TABEL =================

      const tbody = document.getElementById("jamKerjaBody");

      tbody.innerHTML = "";

      Object.keys(map)
        .sort()
        .forEach((nama) => {
          const tr = document.createElement("tr");

          tr.innerHTML = `
            <td>${nama}</td>
            <td>${map[nama].toFixed(1)}</td>
          `;

          tbody.appendChild(tr);
        });

      // ================= CHART =================

      drawJamKerjaChart(map);
    })
    .catch((err) => {
      console.log("Gagal load total jam kerja:", err);
    });
}

document.addEventListener("DOMContentLoaded", loadTotalJamKerja);

function loadTotalJamLembur() {
  fetch(
    "https://script.google.com/macros/s/AKfycbxo_XzunHS3-7f959z3zlpCXtyAt-koWb2KSm8OiMGtVIc9Nv08t_0xUOhSGAVs9eMF/exec?action=read"
  )
    .then((res) => res.json())
    .then((data) => {
      data = filterByDate(data);

      if (selectedDriver) {
        data = data.filter(
          (row) =>
            (row[0] || "").trim().toLowerCase() ===
            selectedDriver.trim().toLowerCase()
        );
      }

      const map = {};

      data.forEach((row) => {
        const nama = (row[0] || "").trim();

        const jamLembur = parseFloat(row[4]) || 0;

        if (!nama) return;

        if (!map[nama]) {
          map[nama] = 0;
        }

        map[nama] += jamLembur;
      });

      /* ======================
         TABEL TOTAL LEMBUR
      ====================== */

      const tbody = document.getElementById("jamLemburBody");

      if (tbody) {
        tbody.innerHTML = "";

        Object.keys(map)
          .sort()
          .forEach((nama) => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
              <td>${nama}</td>
              <td>${map[nama].toFixed(1)}</td>
            `;

            tbody.appendChild(tr);
          });
      }

      /* ======================
         CHART TOTAL LEMBUR
      ====================== */

      const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);

      const labels = sorted.map((item) => item[0]);

      const values = sorted.map((item) => Number(item[1].toFixed(1)));

      const canvas = document.getElementById("jamLemburChart");

      if (canvas) {
        if (window.jamLemburChartInstance) {
          window.jamLemburChartInstance.destroy();
        }

        const widthPerDriver = 80;

        canvas.width = Math.max(
          labels.length * widthPerDriver,
          canvas.parentElement.clientWidth
        );

        const ctx = canvas.getContext("2d");

        window.jamLemburChartInstance = new Chart(ctx, {
          type: "line",

          data: {
            labels: labels,

            datasets: [
              {
                label: "Total Jam Lembur",

                data: values,

                borderColor: "#ff9800",

                backgroundColor: "rgba(255,152,0,0.15)",

                borderWidth: 3,

                fill: true,

                tension: 0.35,

                pointRadius: 5,

                pointHoverRadius: 7
              }
            ]
          },

          options: {
            responsive: true,

            maintainAspectRatio: false,

            interaction: {
              mode: "index",
              intersect: false
            },

            plugins: {
              legend: {
                display: true
              },

              datalabels: {
                color: "#444",

                anchor: "end",

                align: "top",

                font: {
                  weight: "bold",
                  size: 10
                },

                formatter: (value) => value.toFixed(1)
              }
            },

            scales: {
              x: {
                ticks: {
                  maxRotation: 45,
                  minRotation: 45
                }
              },

              y: {
                beginAtZero: true,

                title: {
                  display: true,

                  text: "Jam Lembur"
                }
              }
            }
          },

          plugins: [ChartDataLabels]
        });
      }
    })
    .catch((err) => {
      console.error("Gagal load total jam lembur:", err);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  loadTotalJamKerja();
  loadTotalJamLembur();
});
function loadTotalKonversi() {
  fetch(
    "https://script.google.com/macros/s/AKfycbxo_XzunHS3-7f959z3zlpCXtyAt-koWb2KSm8OiMGtVIc9Nv08t_0xUOhSGAVs9eMF/exec?action=read"
  )
    .then((res) => res.json())
    .then((data) => {
      data = filterByDate(data);

      if (selectedDriver) {
        data = data.filter(
          (row) =>
            (row[0] || "").trim().toLowerCase() ===
            selectedDriver.trim().toLowerCase()
        );
      }

      const map = {};

      data.forEach((row) => {
        const nama = (row[0] || "").trim();

        const konversi = parseFloat(row[5]) || 0;

        if (!nama) return;

        if (!map[nama]) {
          map[nama] = 0;
        }

        map[nama] += konversi;
      });

      /* ======================
         TABEL
      ====================== */

      const tbody = document.getElementById("konversiBody");

      if (!tbody) {
        console.error("Element konversiBody tidak ditemukan");

        return;
      }

      tbody.innerHTML = "";

      Object.keys(map)
        .sort()
        .forEach((nama) => {
          const tr = document.createElement("tr");

          tr.innerHTML = `
            <td>${nama}</td>
            <td>${map[nama].toFixed(1)}</td>
          `;

          tbody.appendChild(tr);
        });
    })

    .catch((err) => {
      console.error("Gagal load total konversi:", err);
    });
}
document.getElementById("filterBtn").addEventListener("click", () => {
  loadTotalJamKerja();
  loadTotalJamLembur();
  loadTotalKonversi();
  loadTotalDinasLuar();
  loadTotalKonversiLembur();
});
document.addEventListener("DOMContentLoaded", loadTotalKonversi);

function loadTotalDinasLuar() {
  fetch(
    "https://script.google.com/macros/s/AKfycbxo_XzunHS3-7f959z3zlpCXtyAt-koWb2KSm8OiMGtVIc9Nv08t_0xUOhSGAVs9eMF/exec?action=readDinasLuar"
  )
    .then((res) => {
      if (!res.ok) {
        throw new Error("HTTP Error : " + res.status);
      }

      return res.json();
    })
    .then((data) => {
      data = filterByDate(data);

      console.log("DATA DINAS LUAR:", data);

      const tbody = document.getElementById("dinasBody");

      if (!tbody) {
        console.error("Element dinasBody tidak ditemukan!");
        return;
      }

      tbody.innerHTML = "";

      const map = {};

      data.forEach((row) => {
        const nama = (row[0] || "").trim();

        if (!nama) return;

        map[nama] = (map[nama] || 0) + 1;
      });

      if (selectedDriver) {
        data = data.filter(
          (row) =>
            (row[0] || "").trim().toLowerCase() ===
            selectedDriver.trim().toLowerCase()
        );
      }

      console.log("TOTAL DINAS:", map);

      Object.entries(map)
        .sort()
        .forEach(([nama, total]) => {
          const tr = document.createElement("tr");

          tr.innerHTML = `
            <td>${nama}</td>
            <td>${total}</td>
          `;

          tbody.appendChild(tr);
        });

      if (Object.keys(map).length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="2" style="text-align:center">
              Tidak ada data
            </td>
          </tr>
        `;
      }
    })
    .catch((err) => {
      console.error("Gagal load dinas luar:", err);

      const tbody = document.getElementById("dinasBody");

      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="2" style="text-align:center;color:red">
              Gagal memuat data
            </td>
          </tr>
        `;
      }
    });
}

function loadTotalKonversiLembur() {
  fetch(
    "https://script.google.com/macros/s/AKfycbxo_XzunHS3-7f959z3zlpCXtyAt-koWb2KSm8OiMGtVIc9Nv08t_0xUOhSGAVs9eMF/exec?action=read"
  )
    .then((res) => res.json())
    .then((data) => {
      data = filterByDate(data);

      if (selectedDriver) {
        data = data.filter(
          (row) =>
            (row[0] || "").trim().toLowerCase() ===
            selectedDriver.trim().toLowerCase()
        );
      }

      const map = {};

      data.forEach((row) => {
        const nama = (row[0] || "").trim();

        const konversi = parseFloat(row[5]) || 0;

        if (!nama) return;

        if (!map[nama]) {
          map[nama] = 0;
        }

        map[nama] += konversi;
      });

      if (selectedDriver) {
        data = data.filter(
          (row) =>
            (row[0] || "").trim().toLowerCase() ===
            selectedDriver.trim().toLowerCase()
        );
      }

      if (selectedDriver) {
        data = data.filter(
          (row) =>
            (row[0] || "").trim().toLowerCase() ===
            selectedDriver.trim().toLowerCase()
        );
      }

      /* ======================
         SORT DATA
      ====================== */

      const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);

      const labels = sorted.map((item) => item[0]);
      const values = sorted.map((item) => Number(item[1].toFixed(1)));

      /* ======================
         CHART (TIDAK DIUBAH)
      ====================== */

      const canvas = document.getElementById("konversiChart");

      if (canvas) {
        if (window.konversiChartInstance) {
          window.konversiChartInstance.destroy();
        }

        const ctx = canvas.getContext("2d");

        window.konversiChartInstance = new Chart(ctx, {
          type: "line",

          data: {
            labels: labels,

            datasets: [
              {
                label: "Total Konversi Lembur",

                data: values,

                borderColor: "rgba(46, 204, 113, 1)",
                backgroundColor: "rgba(46, 204, 113, 0.15)",

                borderWidth: 3,

                fill: true,

                tension: 0.35,

                pointRadius: 5,
                pointHoverRadius: 7
              }
            ]
          },

          options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
              mode: "index",
              intersect: false
            },

            plugins: {
              legend: {
                display: true
              },

              datalabels: {
                color: "#1e1e1e",

                anchor: "end",
                align: "top",

                font: {
                  weight: "bold",
                  size: 10
                },

                formatter: (value) => value.toFixed(1)
              }
            },

            scales: {
              x: {
                ticks: {
                  maxRotation: 45,
                  minRotation: 45
                }
              },

              y: {
                beginAtZero: true,

                title: {
                  display: true,
                  text: "Nilai Konversi"
                }
              }
            }
          },

          plugins: [ChartDataLabels]
        });
      }
    })

    .catch((err) => {
      console.error("Gagal load total konversi lembur:", err);
    });
}

document.addEventListener("DOMContentLoaded", loadTotalKonversiLembur);
document.addEventListener("DOMContentLoaded", loadTotalDinasLuar);

function parseTanggal(val) {
  if (!val) return null;

  if (val instanceof Date) return val;

  if (typeof val === "number") {
    const d = new Date(Date.UTC(1899, 11, 30));
    d.setDate(d.getDate() + val);
    return d;
  }

  const d = new Date(val);
  if (isNaN(d)) return null;

  return d;
}

function filterByDate(data) {
  const startDate = document.getElementById("startDate")?.value;
  const endDate = document.getElementById("endDate")?.value;

  if (!startDate || !endDate) return data;

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return data.filter((row) => {
    const tanggal = parseTanggal(row[1]); // kolom B
    if (!tanggal) return false;

    return tanggal >= start && tanggal <= end;
  });
}

function loadTableFromData(data) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  function formatTanggal(dateStr) {
    if (!dateStr) return "";
    const tgl = new Date(dateStr);
    if (isNaN(tgl)) return dateStr;
    return tgl.toLocaleDateString("id-ID");
  }

  function formatJam(jamData) {
    if (!jamData) return "";
    const date = new Date(jamData);
    if (isNaN(date)) return jamData;
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  data.forEach((row) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${row[0] || ""}</td>
      <td>${formatTanggal(row[1])}</td>
      <td>${row[2] || ""}</td>
      <td>${row[3] || ""}</td>
      <td>${row[4] || ""}</td>
      <td>${row[5] || ""}</td>
      <td>${formatJam(row[6])}</td>
      <td>${formatJam(row[7])}</td>
      <td>${formatJam(row[8])}</td>
      <td>${formatJam(row[9])}</td>
      <td>${formatJam(row[10])}</td>
      <td>${formatJam(row[11])}</td>
      <td>${formatJam(row[12])}</td>
      <td>${formatJam(row[13])}</td>
      <td>${row[14] || ""}</td>
      <td>${row[15] || ""}</td>
      <td>${row[16] || ""}</td>
      <td>${row[17] || ""}</td>
      <td>${row[18] || ""}</td>
    `;

    tbody.appendChild(tr);
  });
}

function loadAllData() {
  fetch(
    "https://script.google.com/macros/s/AKfycbxo_XzunHS3-7f959z3zlpCXtyAt-koWb2KSm8OiMGtVIc9Nv08t_0xUOhSGAVs9eMF/exec?action=read"
  )
    .then((res) => res.json())
    .then((data) => {
      allData = data;

      // tampilkan awal (semua data)
      loadTableFromData(allData);
    })
    .catch((err) => {
      console.log("Gagal mengambil data:", err);
    });
}

function applyFilter() {
  let filtered = [...allData];

  // Filter tanggal
  filtered = filterByDate(filtered);

  // Filter driver
  if (selectedDriver) {
    filtered = filtered.filter(
      (row) =>
        (row[0] || "").trim().toLowerCase() ===
        selectedDriver.trim().toLowerCase()
    );
  }

  loadTableFromData(filtered);

  loadTotalJamKerja();
  loadTotalJamLembur();
  loadTotalKonversi();
  loadTotalDinasLuar();
  loadTotalKonversiLembur();
}
/* ================= FILTER BUTTON ================= */
document.getElementById("filterBtn").addEventListener("click", () => {
  applyFilter();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  // reset filter tanggal
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";

  // reset driver terpilih
  selectedDriver = null;

  // reset biodata
  document.getElementById("driverName").textContent = "-";
  document.getElementById("driverBadge").textContent = "-";
  document.getElementById("fleetCode").textContent = "-";
  document.getElementById("driverLocation").textContent = "-";

  // reset foto
  document.getElementById("driverPhoto").src =
    "https://i.postimg.cc/NMRDPgT5/GS-dispacer.jpg/120x80";

  // reload seluruh dashboard
  loadTable();

  loadTotalJamKerja();
  loadTotalJamLembur();
  loadTotalKonversi();
  loadTotalKonversiLembur();
  loadTotalDinasLuar();
});

/* ================= LOAD TABLE ORIGINAL ================= */
function loadTable() {
  fetch(
    "https://script.google.com/macros/s/AKfycbxo_XzunHS3-7f959z3zlpCXtyAt-koWb2KSm8OiMGtVIc9Nv08t_0xUOhSGAVs9eMF/exec?action=read"
  )
    .then((res) => res.json())
    .then((data) => {
      allData = data;

      loadTableFromData(allData);
    })
    .catch((err) => {
      console.log("Gagal mengambil data:", err);
    });
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", loadTable);

const API_URL =
  "https://script.google.com/macros/s/AKfycbxo_XzunHS3-7f959z3zlpCXtyAt-koWb2KSm8OiMGtVIc9Nv08t_0xUOhSGAVs9eMF/exec";

let biodataCache = [];

async function loadAllBiodata() {
  try {
    const response = await fetch(`${API_URL}?action=readBiodata`);

    biodataCache = await response.json();
  } catch (err) {
    console.error(err);
  }
}

loadAllBiodata();

function loadDriverBiodata(driverName) {
  const driver = biodataCache.find(
    (d) => d.nama.trim().toLowerCase() === driverName.trim().toLowerCase()
  );

  if (!driver) {
    document.getElementById("driverName").textContent = "Tidak ditemukan";

    return;
  }

  document.getElementById("driverName").textContent = driver.nama;

  document.getElementById("driverBadge").textContent = driver.badge;

  document.getElementById("fleetCode").textContent = driver.fleet;

  document.getElementById("driverLocation").textContent = driver.lokasi;

  document.getElementById("driverPhoto").src = driver.photo;
}
let selectedDriver = null;

function loadDriverDashboard(driverName) {
  selectedDriver = driverName;

  loadDriverBiodata(driverName);

  const driverData = allData.filter(
    (row) =>
      (row[0] || "").trim().toLowerCase() === driverName.trim().toLowerCase()
  );

  loadTableFromData(driverData);

  loadTotalJamKerja();
  loadTotalJamLembur();
  loadTotalKonversi();
  loadTotalKonversiLembur();
}
const fullscreenBtn =
document.getElementById("fullscreenBtn");

fullscreenBtn.addEventListener("click", async () => {

  try {

    if (!document.fullscreenElement) {

      await document.documentElement.requestFullscreen();

    } else {

      await document.exitFullscreen();

    }

  } catch(err) {

    console.log(err);

  }

});

document.addEventListener("fullscreenchange", () => {

  if (document.fullscreenElement) {

    fullscreenBtn.innerHTML = "💻";

  } else {

    fullscreenBtn.innerHTML = "⛶";

  }

});
