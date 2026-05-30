const API_URL = 'http://localhost:5000/api';

let wealthDistributionChartInstance = null;
let assetAllocationChartInstance = null;
let lastPortfolioData = null;

const ASSET_LABELS = ['Fixed Deposits', 'Mutual Funds', 'Stocks', 'RBI Bonds', 'PPF'];

function getThemeColor(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function getChartPalette() {
    const colors = [
        getThemeColor('--fd-color'),
        getThemeColor('--mf-color'),
        getThemeColor('--stocks-color'),
        getThemeColor('--bonds-color'),
        getThemeColor('--ppf-color')
    ];
    return {
        background: colors.map(c => c + 'cc'),
        border: colors
    };
}

function getChartThemeOptions() {
    const textColor = getThemeColor('--chart-text');
    return {
        color: textColor,
        plugins: {
            legend: {
                labels: { color: textColor, font: { family: "'DM Sans', sans-serif", size: 12 } }
            }
        },
        scales: {
            x: {
                ticks: { color: textColor, font: { family: "'DM Sans', sans-serif" } },
                grid: { color: getThemeColor('--chart-grid') }
            },
            y: {
                ticks: { color: textColor, font: { family: "'DM Mono', monospace", size: 11 } },
                grid: { color: getThemeColor('--chart-grid') }
            }
        }
    };
}

function getEffectiveTheme() {
    const stored = document.documentElement.getAttribute('data-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wm-theme', theme);
    refreshChartsForTheme();
}

function initTheme() {
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            applyTheme(getEffectiveTheme() === 'dark' ? 'light' : 'dark');
        });
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (!localStorage.getItem('wm-theme')) {
            refreshChartsForTheme();
        }
    });
}

function refreshChartsForTheme() {
    if (!lastPortfolioData) return;
    if (wealthDistributionChartInstance) {
        wealthDistributionChartInstance.destroy();
        wealthDistributionChartInstance = null;
    }
    if (assetAllocationChartInstance) {
        assetAllocationChartInstance.destroy();
        assetAllocationChartInstance = null;
    }
    renderWealthDistributionChart(lastPortfolioData);
    renderAssetAllocationChart(lastPortfolioData);
}

// Currency formatter
function formatCurrency(value) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

// Render Wealth Distribution Bar Chart
function renderWealthDistributionChart(data) {
    const ctx = document.getElementById('wealthDistributionChart');
    if (!ctx) return;

    const palette = getChartPalette();
    const themeOpts = getChartThemeOptions();

    const chartData = {
        labels: ASSET_LABELS,
        datasets: [{
            label: 'Asset Value (₹)',
            data: [
                data.fixed_deposits || 0,
                data.mutual_funds || 0,
                data.stocks || 0,
                data.rbi_bonds || 0,
                data.ppf || 0
            ],
            backgroundColor: palette.background,
            borderColor: palette.border,
            borderWidth: 2,
            borderRadius: 6
        }]
    };

    if (wealthDistributionChartInstance) {
        wealthDistributionChartInstance.data = chartData;
        Object.assign(wealthDistributionChartInstance.options.plugins.legend.labels, themeOpts.plugins.legend.labels);
        wealthDistributionChartInstance.options.scales.x.ticks.color = themeOpts.scales.x.ticks.color;
        wealthDistributionChartInstance.options.scales.x.grid.color = themeOpts.scales.x.grid.color;
        wealthDistributionChartInstance.options.scales.y.ticks.color = themeOpts.scales.y.ticks.color;
        wealthDistributionChartInstance.options.scales.y.grid.color = themeOpts.scales.y.grid.color;
        wealthDistributionChartInstance.update();
    } else {
        wealthDistributionChartInstance = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: themeOpts.plugins.legend,
                    title: { display: false }
                },
                scales: {
                    x: themeOpts.scales.x,
                    y: {
                        ...themeOpts.scales.y,
                        beginAtZero: true,
                        ticks: {
                            ...themeOpts.scales.y.ticks,
                            callback: function(value) {
                                return '₹' + (value / 100000).toFixed(1) + 'L';
                            }
                        }
                    }
                }
            }
        });
    }
}

// Render Asset Allocation Pie Chart
function renderAssetAllocationChart(data) {
    const ctx = document.getElementById('assetAllocationChart');
    if (!ctx) return;

    const palette = getChartPalette();
    const themeOpts = getChartThemeOptions();

    const values = [
        data.fixed_deposits || 0,
        data.mutual_funds || 0,
        data.stocks || 0,
        data.rbi_bonds || 0,
        data.ppf || 0
    ];

    const chartData = {
        labels: ASSET_LABELS,
        datasets: [{
            data: values,
            backgroundColor: palette.background,
            borderColor: palette.border,
            borderWidth: 2,
            hoverOffset: 8
        }]
    };

    if (assetAllocationChartInstance) {
        assetAllocationChartInstance.data = chartData;
        Object.assign(assetAllocationChartInstance.options.plugins.legend.labels, themeOpts.plugins.legend.labels);
        assetAllocationChartInstance.update();
    } else {
        assetAllocationChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '58%',
                plugins: {
                    legend: {
                        ...themeOpts.plugins.legend,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = formatCurrency(context.parsed);
                                const total = values.reduce((a, b) => a + b, 0);
                                const percent = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                                return label + ': ' + value + ' (' + percent + '%)';
                            }
                        }
                    }
                }
            }
        });
    }
}

// Load portfolio summary
async function loadPortfolioSummary() {
    try {
        console.log('Loading portfolio summary...');
        const response = await fetch(`${API_URL}/portfolio-summary`);
        
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Portfolio data:', data);
        
        // Update dashboard values (with null checks and logging)
        const fdEl = document.getElementById('dashboard-fd');
        console.log('dashboard-fd element:', fdEl);
        if (fdEl) fdEl.textContent = formatCurrency(data.fixed_deposits || 0);
        
        const mfEl = document.getElementById('dashboard-mf');
        console.log('dashboard-mf element:', mfEl);
        if (mfEl) mfEl.textContent = formatCurrency(data.mutual_funds || 0);
        
        const stocksEl = document.getElementById('dashboard-stocks');
        console.log('dashboard-stocks element:', stocksEl);
        if (stocksEl) stocksEl.textContent = formatCurrency(data.stocks || 0);
        
        const bondsEl = document.getElementById('dashboard-bonds');
        console.log('dashboard-bonds element:', bondsEl);
        if (bondsEl) bondsEl.textContent = formatCurrency(data.rbi_bonds || 0);
        
        const ppfEl = document.getElementById('dashboard-ppf');
        console.log('dashboard-ppf element:', ppfEl);
        if (ppfEl) ppfEl.textContent = formatCurrency(data.ppf || 0);
        
        const totalEl = document.getElementById('dashboard-total');
        console.log('dashboard-total element:', totalEl);
        if (totalEl) totalEl.textContent = formatCurrency(data.total_portfolio_value || 0);

        lastPortfolioData = data;

        // Render charts
        renderWealthDistributionChart(data);
        renderAssetAllocationChart(data);
        
        console.log('Portfolio summary loaded successfully');
    } catch (error) {
        console.error('Error loading portfolio summary:', error);
    }
}

// ============================================
// COMMON ASSET MANAGEMENT CONFIGURATION
// ============================================

const ASSET_TYPES = {
    FD: {
        apiEndpoint: 'fixed-deposits',
        formId: 'fdForm',
        listId: 'fdList',
        editIdFieldId: 'fdEditId',
        addBtnId: 'fdAddBtn',
        updateBtnId: 'fdUpdateBtn',
        cancelBtnId: 'fdCancelBtn',
        contentTabId: 'fd-content',
        editableClass: 'fd-editable',
        deleteClass: 'fd-delete-btn',
        rowClass: 'fd-row',
        dataAttr: 'data-fd',
        tableHeaders: ['Bank', 'Cust ID', 'FD Number', 'Principal', 'Maturity Amt', 'Interest Amt', 'Rate', 'Tenure', 'Maturity Date', 'Actions'],
        fields: {
            'fdBank': 'bank_name',
            'fdCustId': 'cust_id',
            'fdNumber': 'fd_number',
            'fdPrincipal': 'principal',
            'fdMaturityAmt': 'maturity_amt',
            'fdInterestAmt': 'interest_amt',
            'fdRate': 'rate',
            'fdTenure': 'tenure_months',
            'fdMaturity': 'maturity_date'
        },
        getFormData: () => ({
            bank_name: document.getElementById('fdBank').value,
            cust_id: document.getElementById('fdCustId').value,
            fd_number: document.getElementById('fdNumber').value,
            principal: parseFloat(document.getElementById('fdPrincipal').value),
            maturity_amt: parseFloat(document.getElementById('fdMaturityAmt').value),
            interest_amt: parseFloat(document.getElementById('fdInterestAmt').value),
            rate: parseFloat(document.getElementById('fdRate').value),
            tenure_months: parseInt(document.getElementById('fdTenure').value),
            maturity_date: document.getElementById('fdMaturity').value
        }),
        populateForm: (data) => {
            document.getElementById('fdBank').value = data.bank_name;
            document.getElementById('fdCustId').value = data.cust_id;
            document.getElementById('fdNumber').value = data.fd_number;
            document.getElementById('fdPrincipal').value = data.principal;
            document.getElementById('fdMaturityAmt').value = data.maturity_amt;
            document.getElementById('fdInterestAmt').value = data.interest_amt;
            document.getElementById('fdRate').value = data.rate;
            document.getElementById('fdTenure').value = data.tenure_months;
            document.getElementById('fdMaturity').value = data.maturity_date;
        },
        formatRow: (item) => {
            return `<tr class="fd-row" data-fd='${JSON.stringify(item)}' data-id="${item.id}">
                <td class="fd-editable" style="cursor:pointer;">${item.bank_name}</td>
                <td class="fd-editable" style="cursor:pointer;">${item.cust_id}</td>
                <td class="fd-editable" style="cursor:pointer;">${item.fd_number}</td>
                <td class="fd-editable" style="cursor:pointer;">${formatCurrency(item.principal)}</td>
                <td class="fd-editable" style="cursor:pointer;">${formatCurrency(item.maturity_amt)}</td>
                <td class="fd-editable" style="cursor:pointer;">${formatCurrency(item.interest_amt)}</td>
                <td class="fd-editable" style="cursor:pointer;">${item.rate}%</td>
                <td class="fd-editable" style="cursor:pointer;">${item.tenure_months} months</td>
                <td class="fd-editable" style="cursor:pointer;">${new Date(item.maturity_date).toLocaleDateString('en-IN')}</td>
                <td><button class="btn btn-sm btn-danger fd-delete-btn" data-id="${item.id}">✕ Delete</button></td>
            </tr>`;
        }
    },
    MF: {
        apiEndpoint: 'mutual-funds',
        formId: 'mfForm',
        listId: 'mfList',
        editIdFieldId: 'mfEditId',
        addBtnId: 'mfAddBtn',
        updateBtnId: 'mfUpdateBtn',
        cancelBtnId: 'mfCancelBtn',
        contentTabId: 'mf-content',
        editableClass: 'mf-editable',
        deleteClass: 'mf-delete-btn',
        rowClass: 'mf-row',
        dataAttr: 'data-mf',
        tableHeaders: ['Fund Name', 'Units', 'NAV', 'Total Value', 'Purchase Date', 'Actions'],
        fields: {
            'mfName': 'fund_name',
            'mfUnits': 'units',
            'mfNAV': 'nav',
            'mfPurchase': 'purchase_date'
        },
        getFormData: () => ({
            fund_name: document.getElementById('mfName').value,
            units: parseFloat(document.getElementById('mfUnits').value),
            nav: parseFloat(document.getElementById('mfNAV').value),
            purchase_date: document.getElementById('mfPurchase').value
        }),
        populateForm: (data) => {
            document.getElementById('mfName').value = data.fund_name;
            document.getElementById('mfUnits').value = data.units;
            document.getElementById('mfNAV').value = data.nav;
            document.getElementById('mfPurchase').value = data.purchase_date;
        },
        formatRow: (item) => {
            return `<tr class="mf-row" data-mf='${JSON.stringify(item)}' data-id="${item.id}">
                <td class="mf-editable" style="cursor:pointer;">${item.fund_name}</td>
                <td class="mf-editable" style="cursor:pointer;">${item.units}</td>
                <td class="mf-editable" style="cursor:pointer;">${formatCurrency(item.nav)}</td>
                <td class="mf-editable" style="cursor:pointer;">${formatCurrency(item.total_value)}</td>
                <td class="mf-editable" style="cursor:pointer;">${new Date(item.purchase_date).toLocaleDateString('en-IN')}</td>
                <td><button class="btn btn-sm btn-danger mf-delete-btn" data-id="${item.id}">✕ Delete</button></td>
            </tr>`;
        }
    },
    STOCK: {
        apiEndpoint: 'stocks',
        formId: 'stocksForm',
        listId: 'stocksList',
        editIdFieldId: 'stockEditId',
        addBtnId: 'stockAddBtn',
        updateBtnId: 'stockUpdateBtn',
        cancelBtnId: 'stockCancelBtn',
        contentTabId: 'stocks-content',
        editableClass: 'stock-editable',
        deleteClass: 'stock-delete-btn',
        rowClass: 'stock-row',
        dataAttr: 'data-stock',
        tableHeaders: ['Stock', 'Symbol', 'Quantity', 'Avg Buy Price', 'Current Price', 'Total Value', 'Gain/Loss', 'Actions'],
        fields: {
            'stockName': 'stock_name',
            'stockSymbol': 'symbol',
            'stockQty': 'quantity',
            'stockPurchasePrice': 'purchase_price',
            'stockCurrentPrice': 'current_price',
            'stockPurchase': 'purchase_date'
        },
        getFormData: () => ({
            stock_name: document.getElementById('stockName').value,
            symbol: document.getElementById('stockSymbol').value,
            quantity: parseInt(document.getElementById('stockQty').value),
            purchase_price: parseFloat(document.getElementById('stockPurchasePrice').value),
            current_price: parseFloat(document.getElementById('stockCurrentPrice').value),
            purchase_date: document.getElementById('stockPurchase').value
        }),
        populateForm: (data) => {
            document.getElementById('stockName').value = data.stock_name;
            document.getElementById('stockSymbol').value = data.symbol;
            document.getElementById('stockQty').value = data.quantity;
            document.getElementById('stockPurchasePrice').value = data.purchase_price;
            document.getElementById('stockCurrentPrice').value = data.current_price;
            document.getElementById('stockPurchase').value = data.purchase_date;
        },
        formatRow: (item) => {
            const gain = (item.current_price - item.purchase_price) * item.quantity;
            const gainPercent = ((item.current_price - item.purchase_price) / item.purchase_price * 100).toFixed(2);
            const gainClass = gain >= 0 ? 'text-success' : 'text-danger';
            return `<tr class="stock-row" data-stock='${JSON.stringify(item)}' data-id="${item.id}">
                <td class="stock-editable" style="cursor:pointer;">${item.stock_name}</td>
                <td class="stock-editable" style="cursor:pointer;">${item.symbol}</td>
                <td class="stock-editable" style="cursor:pointer;">${item.quantity}</td>
                <td class="stock-editable" style="cursor:pointer;">${formatCurrency(item.purchase_price)}</td>
                <td class="stock-editable" style="cursor:pointer;">${formatCurrency(item.current_price)}</td>
                <td class="stock-editable" style="cursor:pointer;">${formatCurrency(item.total_value)}</td>
                <td class="stock-editable ${gainClass}" style="cursor:pointer;">${formatCurrency(gain)} (${gainPercent}%)</td>
                <td><button class="btn btn-sm btn-danger stock-delete-btn" data-id="${item.id}">✕ Delete</button></td>
            </tr>`;
        }
    },
    PPF: {
        apiEndpoint: 'ppf',
        formId: 'ppfForm',
        listId: 'ppfList',
        editIdFieldId: 'ppfEditId',
        addBtnId: 'ppfAddBtn',
        updateBtnId: 'ppfUpdateBtn',
        cancelBtnId: 'ppfCancelBtn',
        contentTabId: 'ppf-content',
        editableClass: 'ppf-editable',
        deleteClass: 'ppf-delete-btn',
        rowClass: 'ppf-row',
        dataAttr: 'data-ppf',
        tableHeaders: ['Account Number', 'Financial Year', 'Amount', 'Rate', 'Maturity Year', 'Actions'],
        fields: {
            'ppfAccount': 'account_number',
            'ppfYear': 'financial_year',
            'ppfAmount': 'amount',
            'ppfRate': 'rate',
            'ppfMaturityYear': 'maturity_year'
        },
        getFormData: () => ({
            account_number: document.getElementById('ppfAccount').value,
            financial_year: document.getElementById('ppfYear').value,
            amount: parseFloat(document.getElementById('ppfAmount').value),
            rate: parseFloat(document.getElementById('ppfRate').value),
            maturity_year: parseInt(document.getElementById('ppfMaturityYear').value)
        }),
        populateForm: (data) => {
            document.getElementById('ppfAccount').value = data.account_number;
            document.getElementById('ppfYear').value = data.financial_year;
            document.getElementById('ppfAmount').value = data.amount;
            document.getElementById('ppfRate').value = data.rate;
            document.getElementById('ppfMaturityYear').value = data.maturity_year;
        },
        formatRow: (item) => {
            return `<tr class="ppf-row" data-ppf='${JSON.stringify(item)}' data-id="${item.id}">
                <td class="ppf-editable" style="cursor:pointer;">${item.account_number}</td>
                <td class="ppf-editable" style="cursor:pointer;">${item.financial_year}</td>
                <td class="ppf-editable" style="cursor:pointer;">${formatCurrency(item.amount)}</td>
                <td class="ppf-editable" style="cursor:pointer;">${item.rate}%</td>
                <td class="ppf-editable" style="cursor:pointer;">${item.maturity_year}</td>
                <td><button class="btn btn-sm btn-danger ppf-delete-btn" data-id="${item.id}">✕ Delete</button></td>
            </tr>`;
        }
    }
};

// ============================================
// COMMON GENERIC FUNCTIONS FOR ALL ASSETS
// ============================================

async function editAsset(assetType, id, data) {
    const config = ASSET_TYPES[assetType];
    config.populateForm(data);
    document.getElementById(config.editIdFieldId).value = id;
    document.getElementById(config.addBtnId).style.display = 'inline-block';
    document.getElementById(config.updateBtnId).style.display = 'inline-block';
    document.getElementById(config.cancelBtnId).style.display = 'inline-block';
    document.querySelector(`#${config.contentTabId} form`).scrollIntoView({ behavior: 'smooth' });
}

function resetAssetForm(assetType) {
    const config = ASSET_TYPES[assetType];
    document.getElementById(config.formId).reset();
    document.getElementById(config.editIdFieldId).value = '';
    document.getElementById(config.addBtnId).style.display = 'inline-block';
    document.getElementById(config.updateBtnId).style.display = 'none';
    document.getElementById(config.cancelBtnId).style.display = 'none';
}

function resetAssetEditValue(assetType) {
    const config = ASSET_TYPES[assetType];
    document.getElementById(config.editIdFieldId).value = '';
}

async function deleteAsset(assetType, id) {
    if (!confirm(`Are you sure you want to delete this ${assetType.toLowerCase()}?`)) {
        return;
    }
    
    try {
        const config = ASSET_TYPES[assetType];
        const response = await fetch(`${API_URL}/${config.apiEndpoint}/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert(`${assetType} deleted successfully!`);
            loadAssets(assetType);
            loadPortfolioSummary();
        } else {
            const errorData = await response.json();
            alert('Error: ' + (errorData.error || `Error deleting ${assetType}`));
        }
    } catch (error) {
        console.error(`Error deleting ${assetType}:`, error);
        alert(`Error deleting ${assetType}: ` + error.message);
    }
}

async function loadAssets(assetType) {
    try {
        const config = ASSET_TYPES[assetType];
        console.log(`load${assetType}: Starting...`);
        const response = await fetch(`${API_URL}/${config.apiEndpoint}`);
        console.log(`load${assetType}: API response status:`, response.status);
        
        const items = await response.json();
        console.log(`load${assetType}: Received items:`, items);
        
        let html = '<div class="card mt-3"><div class="card-body"><h5 class="card-title">' + assetType + ' List</h5>';
        
        if (!items || items.length === 0) {
            console.log(`load${assetType}: No items found`);
            html += `<p class="text-muted">No ${assetType.toLowerCase()}s added yet</p>`;
        } else {
            console.log(`load${assetType}: Found ${items.length} items`);
            html += `<div class="table-responsive"><table class="table table-striped table-hover" id="${assetType}ListTable">`;
            html += '<thead><tr>';
            config.tableHeaders.forEach(h => html += `<th>${h}</th>`);
            html += '</tr></thead><tbody>';
            
            items.forEach(item => {
                html += config.formatRow(item);
            });
            
            html += '</tbody></table></div>';
        }
        
        html += '</div></div>';
        const listEl = document.getElementById(config.listId);
        console.log(`load${assetType}: listEl element:`, listEl);
        
        if (listEl) {
            listEl.innerHTML = html;
            console.log(`load${assetType}: HTML set successfully`);
        } else {
            console.error(`load${assetType}: listEl element not found!`);
            return;
        }
        
        // Add event listeners to editable cells
        document.querySelectorAll(`.${config.editableClass}`).forEach(cell => {
            cell.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                const itemData = JSON.parse(row.getAttribute(config.dataAttr));
                editAsset(assetType, itemData.id, itemData);
            });
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll(`.${config.deleteClass}`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                deleteAsset(assetType, id);
            });
        });
        
        console.log(`load${assetType}: Complete`);
    } catch (error) {
        console.error(`load${assetType}: Error -`, error);
    }
}

// ============================================
// FIXED DEPOSITS WRAPPER FUNCTIONS (backward compatibility)
// ============================================

async function editFixedDeposit(id, dep) {
    await editAsset('FD', id, dep);
}

function resetFDForm() {
    resetAssetForm('FD');
}

function resetFDEditValue() {
    resetAssetEditValue('FD');
}

async function deleteFixedDeposit(id) {
    await deleteAsset('FD', id);
}

async function loadFixedDeposits() {
    await loadAssets('FD');
}

// Add form submit listener only if form exists
const fdForm = document.getElementById('fdForm');
if (fdForm) {
    fdForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const editId = document.getElementById('fdEditId').value;
        const config = ASSET_TYPES.FD;
        const formData = config.getFormData();
        
        console.log('Submitting FD form - Edit ID:', editId, 'Data:', formData);
        
        try {
            const url = editId ? `${API_URL}/${config.apiEndpoint}/${editId}` : `${API_URL}/${config.apiEndpoint}`;
            const method = editId ? 'PUT' : 'POST';
            
            console.log(`Sending ${method} request to ${url}`);
            
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            console.log('Response status:', response.status);
            const responseData = await response.json();
            console.log('Response data:', responseData);
            
            if (response.ok) {
                alert(editId ? 'Fixed deposit updated successfully!' : 'Fixed deposit added successfully!');
                resetFDForm();
                loadFixedDeposits();
                loadPortfolioSummary();
            } else {
                alert('Error: ' + (responseData.error || 'Error saving fixed deposit'));
                console.error('Error response:', responseData);
            }
        } catch (error) {
            console.error('Error saving fixed deposit:', error);
            alert('Error saving fixed deposit: ' + error.message);
        }
    });
}

// Add event listener to cancel button only if it exists
const fdCancelBtn = document.getElementById('fdCancelBtn');
if (fdCancelBtn) {
    fdCancelBtn.addEventListener('click', resetFDForm);
}

// Add event listener to add button only if it exists
const fdAddBtn = document.getElementById('fdAddBtn');
if (fdAddBtn) {
    fdAddBtn.addEventListener('click', resetFDEditValue);
}

// ============================================
// MUTUAL FUNDS WRAPPER FUNCTIONS
// ============================================

async function editMutualFund(id, fund) {
    await editAsset('MF', id, fund);
}

function resetMFForm() {
    resetAssetForm('MF');
}

function resetMFEditValue() {
    resetAssetEditValue('MF');
}

async function deleteMutualFund(id) {
    await deleteAsset('MF', id);
}

async function loadMutualFunds() {
    await loadAssets('MF');
}

// Add form submit listener for MF
const mfForm = document.getElementById('mfForm');
if (mfForm) {
    mfForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const editId = document.getElementById('mfEditId').value;
        const config = ASSET_TYPES.MF;
        const formData = config.getFormData();
        
        console.log('Submitting MF form - Edit ID:', editId, 'Data:', formData);
        
        try {
            const url = editId ? `${API_URL}/${config.apiEndpoint}/${editId}` : `${API_URL}/${config.apiEndpoint}`;
            const method = editId ? 'PUT' : 'POST';
            
            console.log(`Sending ${method} request to ${url}`);
            
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            console.log('Response status:', response.status);
            const responseData = await response.json();
            console.log('Response data:', responseData);
            
            if (response.ok) {
                alert(editId ? 'Mutual fund updated successfully!' : 'Mutual fund added successfully!');
                resetMFForm();
                loadMutualFunds();
                loadPortfolioSummary();
            } else {
                alert('Error: ' + (responseData.error || 'Error saving mutual fund'));
                console.error('Error response:', responseData);
            }
        } catch (error) {
            console.error('Error saving mutual fund:', error);
            alert('Error saving mutual fund: ' + error.message);
        }
    });
}

// Add event listener to MF cancel button only if it exists
const mfCancelBtn = document.getElementById('mfCancelBtn');
if (mfCancelBtn) {
    mfCancelBtn.addEventListener('click', resetMFForm);
}

// Add event listener to MF add button only if it exists
const mfAddBtn = document.getElementById('mfAddBtn');
if (mfAddBtn) {
    mfAddBtn.addEventListener('click', resetMFEditValue);
}

// ============================================
// STOCKS WRAPPER FUNCTIONS
// ============================================

async function editStock(id, stock) {
    await editAsset('STOCK', id, stock);
}

function resetStockForm() {
    resetAssetForm('STOCK');
}

function resetStockEditValue() {
    resetAssetEditValue('STOCK');
}

async function deleteStock(id) {
    await deleteAsset('STOCK', id);
}

async function loadStocks() {
    await loadAssets('STOCK');
}

document.getElementById('stocksForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const editId = document.getElementById('stockEditId').value;
    const config = ASSET_TYPES.STOCK;
    const formData = config.getFormData();
    
    try {
        const url = editId ? `${API_URL}/${config.apiEndpoint}/${editId}` : `${API_URL}/${config.apiEndpoint}`;
        const method = editId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            alert(editId ? 'Stock updated successfully!' : 'Stock added successfully!');
            resetStockForm();
            loadStocks();
            loadPortfolioSummary();
        }
    } catch (error) {
        console.error('Error saving stock:', error);
        alert('Error saving stock');
    }
});

// Setup Stock cancel button
const stockCancelBtn = document.getElementById('stockCancelBtn');
if (stockCancelBtn) {
    stockCancelBtn.addEventListener('click', resetStockForm);
}

// Setup Stock add button
const stockAddBtn = document.getElementById('stockAddBtn');
if (stockAddBtn) {
    stockAddBtn.addEventListener('click', resetStockEditValue);
}

// ============================================
// PPF WRAPPER FUNCTIONS
// ============================================

async function editPPF(id, ppf) {
    await editAsset('PPF', id, ppf);
}

function resetPPFForm() {
    resetAssetForm('PPF');
}

function resetPPFEditValue() {
    resetAssetEditValue('PPF');
}

async function deletePPF(id) {
    await deleteAsset('PPF', id);
}

async function loadPPF() {
    await loadAssets('PPF');
}

document.getElementById('bondsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        bond_type: document.getElementById('bondType').value,
        amount: parseFloat(document.getElementById('bondAmount').value),
        rate: parseFloat(document.getElementById('bondRate').value),
        tenure_years: parseInt(document.getElementById('bondTenure').value),
        purchase_date: document.getElementById('bondPurchase').value,
        maturity_date: document.getElementById('bondMaturity').value
    };
    
    try {
        const response = await fetch(`${API_URL}/rbi-bonds`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            alert('RBI bond added successfully!');
            document.getElementById('bondsForm').reset();
            loadRBIBonds();
            loadPortfolioSummary();
        }
    } catch (error) {
        console.error('Error adding RBI bond:', error);
        alert('Error adding RBI bond');
    }
});

// PPF Functions
document.getElementById('ppfForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const editId = document.getElementById('ppfEditId').value;
    const config = ASSET_TYPES.PPF;
    const formData = config.getFormData();
    
    try {
        const url = editId ? `${API_URL}/${config.apiEndpoint}/${editId}` : `${API_URL}/${config.apiEndpoint}`;
        const method = editId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            alert(editId ? 'PPF contribution updated successfully!' : 'PPF contribution added successfully!');
            resetPPFForm();
            loadPPF();
            loadPortfolioSummary();
        }
    } catch (error) {
        console.error('Error saving PPF contribution:', error);
        alert('Error saving PPF contribution');
    }
});

// Setup PPF cancel button
const ppfCancelBtn = document.getElementById('ppfCancelBtn');
if (ppfCancelBtn) {
    ppfCancelBtn.addEventListener('click', resetPPFForm);
}

// Setup PPF add button
const ppfAddBtn = document.getElementById('ppfAddBtn');
if (ppfAddBtn) {
    ppfAddBtn.addEventListener('click', resetPPFEditValue);
}


// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    console.log('Page loaded - initializing data load');
    loadPortfolioSummary();
    loadFixedDeposits();
    loadMutualFunds();
    loadStocks();
    loadRBIBonds();
    loadPPF();
    

    // setInterval(() => {
    //     console.log('Auto-refresh triggered');
    //     loadPortfolioSummary();
    //     loadFixedDeposits();
    //     loadMutualFunds();
    //     loadStocks();
    //     loadRBIBonds();
    //     loadPPF();
    // }, 5000); // Refresh every 5 seconds



    const downloadBtn = document.getElementById('downloadExcelBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            try {
                const response = await fetch(`${API_URL}/export-excel`);
                if (!response.ok) throw new Error('Network response was not ok');
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Wealth_Manager_${new Date().toISOString().replace(/[:.]/g,'-')}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error downloading Excel file:', error);
                alert('Error downloading Excel file');
            }
        });
    }
});
