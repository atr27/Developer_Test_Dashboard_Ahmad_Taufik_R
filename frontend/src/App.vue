<template>
  <div class="container">
    <h1>Developer Test Dashboard</h1>

    <div class="card filter-section">
      <!-- Multi-Select -->
      <div class="form-group area-select-group">
        <label>Select Area</label>
        <div class="multi-select-container" :class="{ 'is-open': isDropdownOpen }">
          <!-- Tampilan Tag Terpilih -->
          <div class="tags-input-area" @click="toggleDropdown">
            <div class="selected-tags">
              <span 
                v-for="areaId in filters.area_ids" 
                :key="areaId" 
                class="tag"
              >
                {{ getAreaName(areaId) }}
                <button class="tag-remove" @click.stop="removeArea(areaId)">×</button>
              </span>
              <span v-if="filters.area_ids.length === 0" class="placeholder">
                Click to select areas...
              </span>
            </div>
            <div class="dropdown-arrow">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
            </div>
          </div>
          
          <!-- Panel Dropdown -->
          <div v-show="isDropdownOpen" class="dropdown-panel">
            <!-- Input Pencarian -->
            <div class="search-wrapper">
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Search areas..." 
                class="search-input"
                @click.stop
              />
            </div>
            
            <!-- Aksi Cepat -->
            <div class="quick-actions">
              <button class="action-btn" @click.stop="selectAll">
                ✓ Select All
              </button>
              <button class="action-btn action-clear" @click.stop="clearAll">
                ✕ Clear All
              </button>
            </div>
            
            <!-- Daftar Opsi -->
            <div class="options-list">
              <label 
                v-for="area in filteredAreas" 
                :key="area.area_id" 
                class="option-item"
                :class="{ 'is-selected': filters.area_ids.includes(area.area_id) }"
                @click.stop
              >
                <input 
                  type="checkbox" 
                  :value="area.area_id" 
                  v-model="filters.area_ids"
                  class="checkbox-input"
                />
                <span class="checkbox-custom"></span>
                <span class="option-label">{{ area.area_name }}</span>
              </label>
              <div v-if="filteredAreas.length === 0" class="no-results">
                No areas found
              </div>
            </div>
          </div>
        </div>
        <small>{{ filters.area_ids.length }} area(s) selected</small>
      </div>

      <div class="form-group">
        <label>Date From</label>
        <input type="date" v-model="filters.date_from" class="input-control" />
      </div>

      <div class="form-group">
        <label>Date To</label>
        <input type="date" v-model="filters.date_to" class="input-control" />
      </div>

      <button @click="fetchData" class="btn-view">View</button>
    </div>

    <template v-if="rawData.length > 0">
      <div class="card chart-section">
        <h2>Compliance by Region (%)</h2>
        <div class="chart-container">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <div class="card table-section">
        <h2>Compliance Table (Brand vs Area)</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>Brand</th>
              <th v-for="area in uniqueAreas" :key="area">{{ area }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in tableData" :key="row.brand">
              <td>{{ row.brand }}</td>
              <td v-for="area in uniqueAreas" :key="area + '-val'">
                {{ row[area] !== undefined ? row[area] + '%' : '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
    
    <div v-else class="no-data">
        <p>No data available. Please select filters and click View.</p>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import axios from 'axios';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

// Daftarkan komponen ChartJS
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

// State
const options = reactive({ areas: [] });
const filters = reactive({
  area_ids: [],
  date_from: '2021-01-01',
  date_to: '2021-12-31'
});
const rawData = ref([]);

// State dropdown multi-select
const isDropdownOpen = ref(false);
const searchQuery = ref('');

// Computed: Filter area berdasarkan query pencarian
const filteredAreas = computed(() => {
  if (!searchQuery.value) return options.areas;
  const query = searchQuery.value.toLowerCase();
  return options.areas.filter(area => 
    area.area_name.toLowerCase().includes(query)
  );
});

// Helper: Dapatkan nama area berdasarkan ID
const getAreaName = (areaId) => {
  const area = options.areas.find(a => a.area_id === areaId);
  return area ? area.area_name : '';
};

// Method untuk multi-select
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const removeArea = (areaId) => {
  filters.area_ids = filters.area_ids.filter(id => id !== areaId);
};

const selectAll = () => {
  filters.area_ids = filteredAreas.value.map(area => area.area_id);
};

const clearAll = () => {
  filters.area_ids = [];
};

// Tutup dropdown saat klik di luar
const handleClickOutside = (event) => {
  const container = document.querySelector('.multi-select-container');
  if (container && !container.contains(event.target)) {
    isDropdownOpen.value = false;
  }
};

// Pengaturan Konfigurasi Grafik
const chartData = computed(() => {
  // Logika: Kelompokkan rawData berdasarkan Nama Area dan Hitung Rata-rata Nilai untuk Grafik
  const areaMap = {};
  
  rawData.value.forEach(item => {
    if (!areaMap[item.area_name]) {
      areaMap[item.area_name] = { total_compliance: 0, total_rows: 0 };
    }
    areaMap[item.area_name].total_compliance += parseInt(item.total_compliance);
    areaMap[item.area_name].total_rows += parseInt(item.total_rows);
  });

  const labels = Object.keys(areaMap);
  const data = labels.map(area => {
    const { total_compliance, total_rows } = areaMap[area];
    // Rumus dari PPT: Jumlah(compliance) / Total Baris * 100
    return Math.round((total_compliance / total_rows) * 100);
  });

  return {
    labels,
    datasets: [{
      label: 'Nilai (%)',
      backgroundColor: '#3b82f6',
      data: data
    }]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false
};

// Logika Tabel Pivot (Brand x Area)
const uniqueAreas = computed(() => {
  return [...new Set(rawData.value.map(item => item.area_name))].sort();
});

const tableData = computed(() => {
  const brandMap = {};

  rawData.value.forEach(item => {
    if (!brandMap[item.brand_name]) {
      brandMap[item.brand_name] = { brand: item.brand_name };
    }
    // Assign nilai percentage ke kolom area yang sesuai
    brandMap[item.brand_name][item.area_name] = item.nilai;
  });

  return Object.values(brandMap);
});

// Panggilan API
const fetchOptions = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/options');
    options.areas = res.data.areas;
  } catch (err) {
    console.error("Error fetching options:", err);
  }
};

const fetchData = async () => {
  try {
    const params = new URLSearchParams();
    filters.area_ids.forEach(id => params.append('area_ids', id));
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);

    const res = await axios.get('http://localhost:3000/api/data', { params });
    rawData.value = res.data;
  } catch (err) {
    console.error("Error fetching report:", err);
  }
};

onMounted(() => {
  fetchOptions();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style>
/* CSS Tema Terang Modern */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}

h1 {
  color: #1e293b;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 24px;
  text-align: center;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

h2 {
  color: #334155;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.card {
  background: #ffffff;
  border: none;
  padding: 24px;
  margin-bottom: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.filter-section {
  display: flex;
  gap: 20px;
  align-items: flex-end;
  flex-wrap: wrap;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 180px;
  position: relative;
}

.area-select-group {
  flex: 2;
  min-width: 320px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
}

.form-group small {
  font-size: 0.75rem;
  color: #94a3b8;
  position: absolute;
  bottom: -20px;
  left: 0;
  white-space: nowrap;
}

/* Multi-Select Container */
.multi-select-container {
  position: relative;
}

.tags-input-area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 48px;
  box-sizing: border-box;
}

.tags-input-area:hover {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.multi-select-container.is-open .tags-input-area {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  animation: tagIn 0.2s ease;
}

@keyframes tagIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.tag-icon {
  font-size: 0.75rem;
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: rgba(255, 255, 255, 0.25);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  transition: background 0.2s;
}

.tag-remove:hover {
  background: rgba(255, 255, 255, 0.4);
}

.placeholder {
  color: #94a3b8;
  font-size: 0.9rem;
}

.dropdown-arrow {
  color: #64748b;
  transition: transform 0.2s ease;
}

.multi-select-container.is-open .dropdown-arrow {
  transform: rotate(180deg);
}

/* Dropdown Panel */
.dropdown-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  animation: dropdownIn 0.2s ease;
}

@keyframes dropdownIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}

.search-icon {
  font-size: 1rem;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  color: #334155;
  outline: none;
}

.search-input::placeholder {
  color: #a0aec0;
}

.quick-actions {
  display: flex;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}

.action-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.action-btn.action-clear:hover {
  background: #ef4444;
  border-color: #ef4444;
}

.options-list {
  max-height: 200px;
  overflow-y: auto;
  padding: 8px 0;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.option-item:hover {
  background: #f1f5f9;
}

.option-item.is-selected {
  background: #eff6ff;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  position: relative;
  transition: all 0.2s;
}

.option-item.is-selected .checkbox-custom {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: #3b82f6;
}

.option-item.is-selected .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
}

.option-label {
  color: #334155;
  font-size: 0.9rem;
}

.no-results {
  padding: 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.9rem;
}

.input-control {
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  min-width: 150px;
  background-color: #ffffff;
  color: #374151;
  font-size: 0.95rem;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  height: 48px;
  box-sizing: border-box;
}

.input-control:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.btn-view {
  padding: 12px 28px;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  height: 48px;
  font-weight: 600;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(37, 99, 235, 0.25);
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-view:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(37, 99, 235, 0.35);
}

.btn-view:active {
  transform: translateY(0);
}

.chart-section {
  height: 400px;
  padding: 24px;
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
  display: flex;
  flex-direction: column;
}

.chart-container {
  flex: 1;
  position: relative;
  min-height: 0;
  width: 100%;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 16px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.data-table th {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #475569;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 14px 16px;
  text-align: center;
  border-bottom: 2px solid #d1d5db;
}

.data-table td {
  padding: 14px 16px;
  text-align: center;
  color: #334155;
  background-color: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.95rem;
}

.data-table tr:hover td {
  background-color: #f8fafc;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.no-data {
  text-align: center;
  color: #64748b;
  margin-top: 40px;
  padding: 60px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  border: 2px dashed #d1d5db;
}

.no-data p {
  font-size: 1.1rem;
  font-weight: 500;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .container {
    padding: 16px;
  }
  
  .filter-section {
    flex-direction: column;
  }
  
  .form-group {
    width: 100%;
  }
  
  .btn-view {
    width: 100%;
  }
  
  h1 {
    font-size: 1.5rem;
  }
}
</style>