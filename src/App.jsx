import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from "xlsx";
import './App.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Download, LayoutDashboard, Users, Activity, FileText, Calendar, AlertCircle,ExternalLink  } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const NUTRITIONAL_STATUS_COLORS = {
  "Gizi Normal": "#4CAF50",
  "Gizi Buruk": "#FF5252",
  "Gizi Kurang": "#FFC107",
  "Gizi Lebih": "#2196F3"
};

const DEFAULT_INPUT = {
  namaBalita: "",
  jenisKelamin: "",
  umur: "",
  berat: "",
  tinggi: "",
  tanggal: new Date().toISOString().split('T')[0]
};

const App = () => {
  const [data, setData] = useState(() => {
    const savedData = localStorage.getItem('balitaData');
    return savedData ? JSON.parse(savedData) : [];
  });
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [editIndex, setEditIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');


  useEffect(() => {
    localStorage.setItem('balitaData', JSON.stringify(data));
  }, [data]);


  const getNutritionalStatus = useCallback((berat, tinggi, umur, jenisKelamin) => {
    try {
      const tinggiMeter = tinggi / 100;
      const bmi = berat / (tinggiMeter * tinggiMeter);

      if (isNaN(bmi) || !isFinite(bmi)) {
        throw new Error("BMI calculation resulted in an invalid value");
      }

      if (umur <= 60) {
        if (jenisKelamin === 'Laki-laki') {
          if (bmi < 14) return "Gizi Buruk";
          if (bmi >= 14 && bmi < 16) return "Gizi Kurang";
          if (bmi >= 16 && bmi < 18) return "Gizi Normal";
          return "Gizi Lebih";
        } else {
          if (bmi < 13.5) return "Gizi Buruk";
          if (bmi >= 13.5 && bmi < 15.5) return "Gizi Kurang";
          if (bmi >= 15.5 && bmi < 17.5) return "Gizi Normal";
          return "Gizi Lebih";
        }
      } else {
        if (bmi < 15) return "Gizi Buruk";
        if (bmi >= 15 && bmi < 17) return "Gizi Kurang";
        if (bmi >= 17 && bmi < 19) return "Gizi Normal";
        return "Gizi Lebih";
      }
    } catch (error) {
      console.error("Error calculating nutritional status:", error);
      return "Error";
    }
  }, []);


  const dateStatistics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();

    const dailyCount = data.filter(item => item.tanggal === today).length;
    const monthlyCount = data.filter(item => {
      const itemMonth = new Date(item.tanggal).getMonth();
      return itemMonth === currentMonth;
    }).length;

    return { dailyCount, monthlyCount };
  }, [data]);

  const nutritionDistribution = useMemo(() => {
    const distribution = Object.keys(NUTRITIONAL_STATUS_COLORS).reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {});

    data.forEach(item => {
      if (distribution.hasOwnProperty(item.nutritionalStatus)) {
        distribution[item.nutritionalStatus]++;
      }
    });

    return Object.entries(distribution).map(([status, count]) => ({
      status,
      count,
      fill: NUTRITIONAL_STATUS_COLORS[status]
    }));
  }, [data]);


  const validateInput = useCallback((inputData) => {
    if (!inputData.namaBalita.trim()) throw new Error("Nama balita harus diisi");
    if (!inputData.jenisKelamin) throw new Error("Jenis kelamin harus dipilih");

    const umur = parseFloat(inputData.umur);
    const berat = parseFloat(inputData.berat);
    const tinggi = parseFloat(inputData.tinggi);

    if (isNaN(umur) || umur <= 0 || umur > 120)
      throw new Error("Umur harus antara 0-120 bulan");
    if (isNaN(berat) || berat <= 0 || berat > 50)
      throw new Error("Berat harus antara 0-50 kg");
    if (isNaN(tinggi) || tinggi <= 0 || tinggi > 200)
      throw new Error("Tinggi harus antara 0-200 cm");

    return true;
  }, []);


  const handleDelete = useCallback((index) => {
    try {
      setData(prevData => prevData.filter((_, i) => i !== index));
      setError(null);
    } catch (err) {
      setError("Gagal menghapus data");
      console.error(err);
    }
  }, []);

  const handleEdit = useCallback((index) => {
    try {
      setInput(data[index]);
      setEditIndex(index);
      setError(null);
    } catch (err) {
      setError("Gagal memuat data untuk diedit");
      console.error(err);
    }
  }, [data]);

  const handleUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const binaryStr = event.target.result;
          const workbook = XLSX.read(binaryStr, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const sheetData = XLSX.utils.sheet_to_json(sheet);

          const formattedData = sheetData.map((row) => {
            const berat = parseFloat(row["Berat (kg)"]) || 0;
            const tinggi = parseFloat(row["Tinggi (cm)"]) || 0;
            const umur = parseFloat(row["Umur (bulan)"]) || 0;
            const jenisKelamin = row["Jenis Kelamin"] || "";
            const bmi = (berat / Math.pow(tinggi / 100, 2)).toFixed(2);

            return {
              namaBalita: row["Nama Balita"] || "",
              jenisKelamin,
              umur: umur.toString(),
              berat: berat.toString(),
              tinggi: tinggi.toString(),
              tanggal: row["Tanggal"] || new Date().toISOString().split('T')[0],
              bmi,
              nutritionalStatus: getNutritionalStatus(berat, tinggi, umur, jenisKelamin)
            };
          });

          setData(prevData => [...prevData, ...formattedData]);
          setError(null);
        } catch (err) {
          setError("Format file tidak valid");
          console.error(err);
        }
        setLoading(false);
      };

      reader.onerror = () => {
        setError("Gagal membaca file");
        setLoading(false);
      };

      reader.readAsBinaryString(file);
    } catch (err) {
      setError("Gagal mengupload file");
      setLoading(false);
      console.error(err);
    }
  }, [getNutritionalStatus]);

  const handleDownload = useCallback(() => {
    try {
      const exportData = data.map(item => ({
        "Nama Balita": item.namaBalita,
        "Jenis Kelamin": item.jenisKelamin,
        "Umur (bulan)": item.umur,
        "Berat (kg)": item.berat,
        "Tinggi (cm)": item.tinggi,
        "BMI": item.bmi,
        "Status Gizi": item.nutritionalStatus,
        "Tanggal": item.tanggal
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Balita");
      XLSX.writeFile(wb, `data_monitoring_balita_${new Date().toISOString().split('T')[0]}.xlsx`);
      setError(null);
    } catch (err) {
      setError("Gagal mengunduh file");
      console.error(err);
    }
  }, [data]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setError(null);

    try {
      validateInput(input);

      const bmi = (parseFloat(input.berat) / Math.pow(parseFloat(input.tinggi) / 100, 2)).toFixed(2);
      const nutritionalStatus = getNutritionalStatus(
        parseFloat(input.berat),
        parseFloat(input.tinggi),
        parseFloat(input.umur),
        input.jenisKelamin
      );

      const newData = {
        ...input,
        bmi,
        nutritionalStatus
      };

      if (editIndex !== null) {
        setData(prevData => prevData.map((item, index) =>
          index === editIndex ? newData : item
        ));
        setEditIndex(null);
      } else {
        setData(prevData => [...prevData, newData]);
      }

      setInput(DEFAULT_INPUT);
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  }, [input, editIndex, validateInput, getNutritionalStatus]);


  const filteredData = useMemo(() => {
    return data.filter(item =>
      item.namaBalita.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nutritionalStatus.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);


  const ErrorAlert = ({ message }) => (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );


  const ActivitiesSection = () => (
    <div className="activities-section">
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-header">
            <h3>Balita Hari Ini</h3>
            <Calendar size={20} />
          </div>
          <div className="stat-value">{dateStatistics.dailyCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <h3>Balita Bulan Ini</h3>
            <Calendar size={20} />
          </div>
          <div className="stat-value">{dateStatistics.monthlyCount}</div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h3>Distribusi Status Gizi</h3>
          <PieChart width={400} height={300} className='PieChart'>
            <Pie
              data={nutritionDistribution}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {nutritionDistribution.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>

        <div className="chart-card">
          <h3>Status Gizi per Jenis Kelamin</h3>
          <BarChart width={500} height={300} data={nutritionDistribution} className='BarChart'>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill={(entry) => entry.fill} />
          </BarChart>
        </div>
      </div>
    </div>
  );


  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">Gizi</div>
        <nav>
          <a
            href="#"
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            Form Input
          </a>
          <a
            href="#"
            className={activeTab === 'customer' ? 'active' : ''}
            onClick={() => setActiveTab('customer')}
          >
            <Users size={20} />
            Data Balita
          </a>
          <a
            href="#"
            className={activeTab === 'activities' ? 'active' : ''}
            onClick={() => setActiveTab('activities')}
          >
            <Activity size={20} />
            Data Aktif
          </a>
          <a
            href="#"
            className={activeTab === 'report' ? 'active' : ''}
            onClick={() => setActiveTab('report')}
          >
            <FileText size={20} />
            Info Seputar
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">


        {error && <ErrorAlert message={error} />}

        {activeTab === 'dashboard' && (
          <>
            {/* Form Section */}
            <div className="form-section">
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  name="namaBalita"
                  placeholder="Nama Balita"
                  value={input.namaBalita}
                  onChange={e => setInput(prev => ({ ...prev, namaBalita: e.target.value }))}
                  required
                  className="input-field"
                  disabled={loading}
                />
                <select
                  name="jenisKelamin"
                  value={input.jenisKelamin}
                  onChange={e => setInput(prev => ({ ...prev, jenisKelamin: e.target.value }))}
                  required
                  className="input-field"
                  disabled={loading}
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
                <input
                  type="number"
                  name="umur"
                  placeholder="Umur (bulan)"
                  value={input.umur}
                  onChange={e => setInput(prev => ({ ...prev, umur: e.target.value }))}
                  required
                  min="0"
                  max="120"
                  className="input-field"
                  disabled={loading}
                />
                <input
                  type="number"
                  name="berat"
                  placeholder="Berat (kg)"
                  value={input.berat}
                  onChange={e => setInput(prev => ({ ...prev, berat: e.target.value }))}
                  required
                  min="0"
                  max="50"
                  step="0.1"
                  className="input-field"
                  disabled={loading}
                />
                <input
                  type="number"
                  name="tinggi"
                  placeholder="Tinggi (cm)"
                  value={input.tinggi}
                  onChange={e => setInput(prev => ({ ...prev, tinggi: e.target.value }))}
                  required
                  min="0"
                  max="200"
                  step="0.1"
                  className="input-field"
                  disabled={loading}
                />
                <input
                  type="date"
                  name="tanggal"
                  value={input.tanggal}
                  onChange={e => setInput(prev => ({ ...prev, tanggal: e.target.value }))}
                  required
                  className="input-field"
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : editIndex !== null ? "Update" : "Tambah"}
                </button>
              </form>
            </div>

            {/* Statistics Cards */}
            <div className="stats-container">
              <div className="stat-card">
                <div className="stat-header">
                  <h3>Total Balita</h3>
                  <span className="stat-icon">👶</span>
                </div>
                <div className="stat-value">{data.length}</div>
              </div>
              {Object.entries(NUTRITIONAL_STATUS_COLORS).map(([status, color]) => (
                <div className="stat-card" key={status}>
                  <div className="stat-header">
                    <h3>{status}</h3>
                    <span className="stat-icon" style={{ color }}>
                      {status === "Gizi Normal" ? "✅" :
                        status === "Gizi Buruk" ? "⚠️" :
                          status === "Gizi Kurang" ? "⚡" : "📈"}
                    </span>
                  </div>
                  <div className="stat-value" style={{ color }}>
                    {data.filter(item => item.nutritionalStatus === status).length}
                  </div>
                </div>
              ))}
            </div>


          </>
        )}

        {activeTab === 'activities' && <ActivitiesSection />}

        {/* Customer Section */}
        {activeTab === 'customer' && (
          <div className="customer-section">
            <div className="table-section">
              <div className="table-header">
                <h2>Data</h2>
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Cari balita..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="table-actions">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleUpload}
                    className="file-input"
                    id="file-upload"
                    disabled={loading}
                  />
                  <label htmlFor="file-upload" className="upload-btn">
                    {loading ? 'Uploading...' : 'Upload Excel'}
                  </label>
                  <button
                    className="download-btn"
                    onClick={handleDownload}
                    disabled={loading || data.length === 0}
                  >
                    <Download size={20} />
                    Download
                  </button>
                  <button
                    className="link-btn"
                    onClick={() => window.open('https://docs.google.com/spreadsheets/d/1j8SXiAS4sdgo0gOZzH3xYwQyHB0kdMba/edit?usp=drive_link&ouid=111197553757287127474&rtpof=true&sd=true', '_blank')}
                  >
                    <ExternalLink size={20} />
                   👉Dataset👈
                  </button>
                </div>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Nama Balita</th>
                      <th>Jenis Kelamin</th>
                      <th>Umur (bulan)</th>
                      <th>Berat (kg)</th>
                      <th>Tinggi (cm)</th>
                      <th>BMI</th>
                      <th>Status Gizi</th>
                      <th>Tanggal</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item, index) => (
                      <tr key={index}>
                        <td>{item.namaBalita}</td>
                        <td>{item.jenisKelamin}</td>
                        <td>{item.umur}</td>
                        <td>{item.berat}</td>
                        <td>{item.tinggi}</td>
                        <td>{item.bmi}</td>
                        <td style={{
                          color: NUTRITIONAL_STATUS_COLORS[item.nutritionalStatus]
                        }}>
                          {item.nutritionalStatus}
                        </td>
                        <td>{item.tanggal}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleEdit(index)}
                              className="edit-btn"
                              disabled={loading}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(index)}
                              className="delete-btn"
                              disabled={loading}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Report Section */}
        {activeTab === 'report' && (
          <div className="report-section">
            <div className="report-summary">
              <h3>Ringkasan mengenai status gizi</h3>
              <div className="summary-stats">
                <p>Status gizi adalah ukuran kesehatan tubuh yang dipengaruhi oleh asupan gizi yang diterima dan kemampuan tubuh untuk menyerapnya. Penilaian status gizi melibatkan beberapa indikator seperti berat badan, tinggi badan, indeks massa tubuh (IMT), serta asupan kalori dan mikronutrien. Mengidentifikasi status gizi seseorang dapat membantu dalam mencegah dan menangani masalah kesehatan yang terkait dengan kekurangan atau kelebihan gizi.</p>

                <p>Status gizi merujuk pada kondisi tubuh seseorang yang dipengaruhi oleh asupan gizi yang diterima dari makanan dan kemampuan tubuh dalam menyerap serta memanfaatkannya. Menurut para ahli, status gizi yang baik sangat penting untuk menjaga kesehatan tubuh dan mencegah berbagai penyakit. Status gizi dapat diukur dengan berbagai parameter, termasuk berat badan, tinggi badan, indeks massa tubuh (IMT), kadar lemak tubuh, serta asupan kalori dan mikronutrien.</p>

                <h4>Indikator Status Gizi</h4>
                <ul>
                  <strong>Berat Badan dan Tinggi Badan:</strong> Pengukuran ini merupakan indikator pertama dalam menilai status gizi seseorang. Pengukuran yang tepat dapat membantu dalam mendiagnosis masalah kekurangan atau kelebihan gizi.
                  <strong>Indeks Massa Tubuh (IMT):</strong> IMT dihitung dengan membagi berat badan (kg) dengan kuadrat tinggi badan (m²). IMT yang normal berkisar antara 18,5 hingga 24,9. Nilai di bawah ini menunjukkan kekurangan gizi, sedangkan nilai di atasnya menunjukkan kelebihan berat badan atau obesitas.
                  <strong>Asupan Kalori dan Mikronutrien:</strong> Kekurangan kalori dan mikronutrien (seperti vitamin dan mineral) dapat menyebabkan gangguan metabolisme, pertumbuhan yang terhambat, dan penurunan fungsi tubuh. Sebaliknya, kelebihan asupan kalori dapat menyebabkan obesitas dan penyakit terkait.
                </ul>

                <h4>Jenis-jenis Masalah Gizi</h4>
                <ul>
                  <strong>Kekurangan Gizi:</strong> Kekurangan gizi terjadi ketika tubuh tidak menerima cukup kalori atau mikronutrien untuk mempertahankan fungsi tubuh yang optimal. Kekurangan gizi dapat menyebabkan masalah kesehatan serius, termasuk gangguan pertumbuhan pada anak-anak, anemia, dan sistem kekebalan tubuh yang lemah.
                  <strong>Obesitas:</strong> Obesitas terjadi ketika tubuh memiliki kelebihan lemak yang berpotensi mempengaruhi kesehatan. Obesitas dapat menyebabkan berbagai masalah kesehatan seperti diabetes tipe 2, hipertensi, penyakit jantung, dan gangguan pernapasan.
                  <strong>Malnutrisi:</strong> Malnutrisi terjadi ketika tubuh kekurangan salah satu atau beberapa zat gizi penting, baik itu makronutrien (karbohidrat, protein, lemak) atau mikronutrien (vitamin dan mineral). Malnutrisi dapat berakibat buruk pada sistem saraf, pertumbuhan, dan daya tahan tubuh.
                </ul>

                <h4>Menjaga Status Gizi yang Seimbang</h4>
                <p>Untuk mencapai status gizi yang optimal, seseorang harus memperhatikan keseimbangan asupan gizi melalui pola makan sehat dan bergizi. Mengonsumsi makanan yang kaya akan serat, protein, vitamin, dan mineral sangat penting untuk kesehatan tubuh. Selain itu, aktivitas fisik yang teratur dapat membantu menjaga berat badan yang sehat dan meningkatkan kesehatan jantung serta otot.</p>

                <h4>Tren Status Gizi Global</h4>
                <p>Penyakit terkait gizi, seperti obesitas dan malnutrisi, semakin menjadi masalah global. WHO melaporkan bahwa lebih dari 1,9 miliar orang dewasa di dunia mengalami obesitas, sementara lebih dari 150 juta anak di bawah usia lima tahun mengalami stunting akibat kekurangan gizi. WHO juga menyoroti pentingnya peningkatan kesadaran akan pentingnya pola makan sehat dan keseimbangan gizi untuk mencegah masalah kesehatan jangka panjang.</p>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default App;