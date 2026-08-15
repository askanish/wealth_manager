const API_URL = '/api';

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

// Table filter function
function filterTable(searchInputId, tableId) {
    const searchInput = document.getElementById(searchInputId);
    const table = document.getElementById(tableId);
    
    if (!searchInput || !table) return;
    
    const tbody = table.getElementsByTagName('tbody')[0];
    if (!tbody) return;
    
    const filter = searchInput.value.toLowerCase();
    const rows = tbody.getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        let found = false;
        
        for (let j = 0; j < cells.length - 1; j++) { // Exclude the last column (Actions)
            const cellText = cells[j].textContent || cells[j].innerText;
            if (cellText.toLowerCase().indexOf(filter) > -1) {
                found = true;
                break;
            }
        }
        
        rows[i].style.display = found ? '' : 'none';
    }
}

// Clear search function
function clearSearch(searchInputId, tableId) {
    const searchInput = document.getElementById(searchInputId);
    const table = document.getElementById(tableId);
    
    if (!searchInput || !table) return;
    
    searchInput.value = '';
    
    const tbody = table.getElementsByTagName('tbody')[0];
    if (!tbody) return;
    
    const rows = tbody.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        rows[i].style.display = '';
    }
    
    searchInput.focus();
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

// Refresh live stock prices from backend and update DB
async function refreshStockPrices() {
    try {
        console.log('Refreshing stock prices...');
        const response = await fetch(`${API_URL}/stocks/current-values`);
        if (!response.ok) {
            throw new Error(`Stock refresh API returned status ${response.status}`);
        }
        const data = await response.json();
        console.log('Stock prices refreshed:', data);
        return data;
    } catch (error) {
        console.error('Error refreshing stock prices:', error);
        return null;
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
        
        const ppfInterestEl = document.getElementById('ppf-interest-summary');
        console.log('ppf-interest-summary element:', ppfInterestEl);
        if (ppfInterestEl) ppfInterestEl.textContent = formatCurrency(data.ppf || 0);
        
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
        numericColumns: [3, 4, 5, 6, 7],
        fields: {
            'fdBank': 'bank_name',
            'fdCustId': 'cust_id',
            'fdNumber': 'fd_number',
            'fdPrincipal': 'principal',
            'fdMaturityAmt': 'maturity_amt',
            'fdInterestAmt': 'interest_amt',
            'fdRate': 'rate',
            'fdTenure': 'tenure_years',
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
            tenure_years: parseInt(document.getElementById('fdTenure').value),
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
            document.getElementById('fdTenure').value = data.tenure_years;
            document.getElementById('fdMaturity').value = data.maturity_date;
        },
        formatRow: (item) => {
            return `<tr class="fd-row" data-fd='${JSON.stringify(item)}' data-id="${item.id}">
                <td class="fd-editable" style="cursor:pointer;">${item.bank_name}</td>
                <td class="fd-editable" style="cursor:pointer;">${item.cust_id}</td>
                <td class="fd-editable" style="cursor:pointer;">${item.fd_number}</td>
                <td class="fd-editable numeric text-right" style="cursor:pointer;">${formatCurrency(item.principal)}</td>
                <td class="fd-editable numeric text-right" style="cursor:pointer;">${formatCurrency(item.maturity_amt)}</td>
                <td class="fd-editable numeric text-right" style="cursor:pointer;">${formatCurrency(item.interest_amt)}</td>
                <td class="fd-editable numeric text-right" style="cursor:pointer;">${item.rate}%</td>
                <td class="fd-editable numeric text-right" style="cursor:pointer;">${item.tenure_years}</td>
                <td class="fd-editable" style="cursor:pointer;">${new Date(item.maturity_date).toLocaleDateString('en-IN')}</td>
                <td><button class="btn btn-sm btn-danger fd-delete-btn" data-id="${item.id}">✕</button></td>
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
        numericColumns: [1, 2, 3],
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
                <td class="mf-editable numeric text-right" style="cursor:pointer;">${item.units}</td>
                <td class="mf-editable numeric text-right" style="cursor:pointer;">${formatCurrency(item.nav)}</td>
                <td class="mf-editable numeric text-right" style="cursor:pointer;">${formatCurrency(item.total_value)}</td>
                <td class="mf-editable" style="cursor:pointer;">${new Date(item.purchase_date).toLocaleDateString('en-IN')}</td>
                <td><button class="btn btn-sm btn-danger mf-delete-btn" data-id="${item.id}">✕</button></td>
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
        tableHeaders: ['Stock', 'Symbol', 'Quantity', 'Stock Price(USD)', 'Current Price', 'Total Value', 'Actions'],
        numericColumns: [2, 3, 4, 5],
        fields: {
            'stockName': 'stock_name',
            'stockSymbol': 'symbol',
            'stockQty': 'quantity',
            'stockPurchase': 'purchase_date'
        },
        getFormData: () => ({
            stock_name: document.getElementById('stockName').value,
            symbol: document.getElementById('stockSymbol').value,
            quantity: parseInt(document.getElementById('stockQty').value),
            purchase_date: document.getElementById('stockPurchase').value
        }),
        populateForm: (data) => {
            document.getElementById('stockName').value = data.stock_name;
            document.getElementById('stockSymbol').value = data.symbol;
            document.getElementById('stockQty').value = data.quantity;
            document.getElementById('stockPurchase').value = data.purchase_date;
        },
        formatRow: (item) => {
            return `<tr class="stock-row" data-stock='${JSON.stringify(item)}' data-id="${item.id}">
                <td class="stock-editable" style="cursor:pointer;">${item.stock_name}</td>
                <td class="stock-editable" style="cursor:pointer;">${item.symbol}</td>
                <td class="stock-editable numeric text-right" style="cursor:pointer;">${item.quantity}</td>
                <td class="stock-editable numeric text-right" style="cursor:pointer;">$${item.price_usd}</td>
                <td class="stock-editable numeric text-right" style="cursor:pointer;">${formatCurrency(item.current_price)}</td>
                <td class="stock-editable numeric text-right" style="cursor:pointer;">${formatCurrency(item.total_value)}</td>
                <td><button class="btn btn-sm btn-danger stock-delete-btn" data-id="${item.id}">✕</button></td>
            </tr>`;
        }
    },
    RBIBonds: {
        apiEndpoint: 'rbi-bonds',
        formId: 'bondsForm',
        listId: 'bondsList',
        editIdFieldId: 'bondsEditId',
        addBtnId: 'bondsAddBtn',
        updateBtnId: 'bondsUpdateBtn',
        cancelBtnId: 'rbiCancelBtn',
        contentTabId: 'bonds-content',
        editableClass: 'bond-editable',
        deleteClass: 'bond-delete-btn',
        rowClass: 'bond-row',
        dataAttr: 'data-bond',
        tableHeaders: ['Bond Name', 'Bond Number', 'Amount', 'Rate', 'Tenure', 'Purchase Date', 'Maturity Date', 'Actions'],
        numericColumns: [2, 3, 4],
        fields: {
            'bondType': 'bond_type',
            'bondNumber': 'bond_number',
            'bondAmount': 'amount',
            'bondRate': 'rate',
            'bondTenure': 'tenure_years',
            'bondPurchase': 'purchase_date',
            'bondMaturity': 'maturity_date'
        },
        getFormData: () => ({
            bond_type: document.getElementById('bondType').value,
            bond_number: document.getElementById('bondNumber').value,
            amount: parseFloat(document.getElementById('bondAmount').value),
            rate: parseFloat(document.getElementById('bondRate').value),
            tenure_years: parseInt(document.getElementById('bondTenure').value),
            purchase_date: document.getElementById('bondPurchase').value,
            maturity_date: document.getElementById('bondMaturity').value
        }),
        populateForm: (data) => {
            document.getElementById('bondType').value = data.bond_type;
            document.getElementById('bondNumber').value = data.bond_number;
            document.getElementById('bondAmount').value = data.amount;
            document.getElementById('bondRate').value = data.rate;
            document.getElementById('bondTenure').value = data.tenure_years;
            document.getElementById('bondPurchase').value = data.purchase_date;
            document.getElementById('bondMaturity').value = data.maturity_date;
        },
        formatRow: (item) => {
            return `<tr class="bond-row" data-bond='${JSON.stringify(item)}' data-id="${item.id}">
                <td class="bond-editable" style="cursor:pointer;">${item.bond_type}</td>
                <td class="bond-editable" style="cursor:pointer;">${item.bond_number}</td>
                <td class="bond-editable numeric text-right" style="cursor:pointer;">${formatCurrency(item.amount)}</td>
                <td class="bond-editable numeric text-right" style="cursor:pointer;">${item.rate}%</td>
                <td class="bond-editable numeric text-right" style="cursor:pointer;">${item.tenure_years} yrs</td>
                <td class="bond-editable" style="cursor:pointer;">${new Date(item.purchase_date).toLocaleDateString('en-IN')}</td>
                <td class="bond-editable" style="cursor:pointer;">${new Date(item.maturity_date).toLocaleDateString('en-IN')}</td>
                <td><button class="btn btn-sm btn-danger bond-delete-btn" data-id="${item.id}">✕</button></td>
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
        tableHeaders: ['Account Number', 'Financial Year', 'Amount', 'Rate', 'Maturity Year', 'Date of Investment', 'Actions'],
        numericColumns: [2, 3, 4],
        fields: {
            'ppfAccount': 'account_number',
            'ppfYear': 'financial_year',
            'ppfAmount': 'amount',
            'ppfRate': 'rate',
            'ppfMaturityYear': 'maturity_year',
            'ppfDateOfInvestment': 'date_of_investment'
        },
        getFormData: () => ({
            account_number: document.getElementById('ppfAccount').value,
            financial_year: document.getElementById('ppfYear').value,
            amount: parseFloat(document.getElementById('ppfAmount').value),
            rate: parseFloat(document.getElementById('ppfRate').value),
            maturity_year: parseInt(document.getElementById('ppfMaturityYear').value),
            date_of_investment: document.getElementById('ppfDateOfInvestment').value
        }),
        populateForm: (data) => {
            document.getElementById('ppfAccount').value = data.account_number;
            document.getElementById('ppfYear').value = data.financial_year;
            document.getElementById('ppfAmount').value = data.amount;
            document.getElementById('ppfRate').value = data.rate;
            document.getElementById('ppfMaturityYear').value = data.maturity_year;
            document.getElementById('ppfDateOfInvestment').value = data.date_of_investment || '';
        },
        formatRow: (item) => {
            return `<tr class="ppf-row" data-ppf='${JSON.stringify(item)}' data-id="${item.id}">
                <td class="ppf-editable" style="cursor:pointer;">${item.account_number}</td>
                <td class="ppf-editable" style="cursor:pointer;">${item.financial_year}</td>
                <td class="ppf-editable numeric text-right" style="cursor:pointer;">${formatCurrency(item.amount)}</td>
                <td class="ppf-editable numeric text-right" style="cursor:pointer;">${item.rate}%</td>
                <td class="ppf-editable numeric text-right" style="cursor:pointer;">${item.maturity_year}</td>
                <td class="ppf-editable" style="cursor:pointer;">${item.date_of_investment ? new Date(item.date_of_investment).toLocaleDateString('en-IN') : ''}</td>
                <td><button class="btn btn-sm btn-danger ppf-delete-btn" data-id="${item.id}">✕</button></td>
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
    const editIdInput = document.getElementById(config.editIdFieldId);
    if (editIdInput) {
        editIdInput.value = id;
    }

    const addBtn = document.getElementById(config.addBtnId);
    if (addBtn) {
        addBtn.style.display = 'inline-block';
    }

    const updateBtn = document.getElementById(config.updateBtnId);
    if (updateBtn) {
        updateBtn.style.display = 'inline-block';
    }

    const cancelBtn = document.getElementById(config.cancelBtnId);
    if (cancelBtn) {
        cancelBtn.style.display = 'inline-block';
    }

    const formEl = document.querySelector(`#${config.contentTabId} form`);
    if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth' });
    }
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
            if (assetType === 'STOCK') {
                await loadStocks();
            } else {
                await loadAssets(assetType);
            }
            await loadPortfolioSummary();
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
            config.tableHeaders.forEach((h, index) => {
                const isNumeric = Array.isArray(config.numericColumns) && config.numericColumns.includes(index);
                html += `<th class="${isNumeric ? 'numeric' : ''}">${h}</th>`;
            });
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
    await refreshStockPrices();
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
            await loadStocks();
            await loadPortfolioSummary();
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


// ============================================
// RBIBonds WRAPPER FUNCTIONS
// ============================================

async function editRBIBonds(id, rbi) {
    await editAsset('RBIBonds', id, rbi);
}

function resetRBIBondsForm() {
    resetAssetForm('RBIBonds');
}

function resetRBIBondsEditValue() {
    resetAssetEditValue('RBIBonds');
}

async function deleteRBIBonds(id) {
    await deleteAsset('RBIBonds', id);
}

async function loadRBIBonds() {
    await loadAssets('RBIBonds');
}

document.getElementById('bondsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const editId = document.getElementById('bondsEditId').value;
    const config = ASSET_TYPES.RBIBonds;
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
            alert(editId ? 'RBI bonds updated successfully!' : 'RBI bonds added successfully!');
            resetRBIBondsForm();
            loadRBIBonds();
            loadPortfolioSummary();
        }
    } catch (error) {
        console.error('Error saving RBI bonds:', error);
        alert('Error saving RBI bonds');
    }
});

// document.getElementById('bondsForm').addEventListener('submit', async (e) => {
//     e.preventDefault();
    
//     const formData = {
//         bond_type: document.getElementById('bondType').value,
//         bond_number: document.getElementById('bondNumber').value,
//         amount: parseFloat(document.getElementById('bondAmount').value),
//         rate: parseFloat(document.getElementById('bondRate').value),
//         tenure_years: parseInt(document.getElementById('bondTenure').value),
//         purchase_date: document.getElementById('bondPurchase').value,
//         maturity_date: document.getElementById('bondMaturity').value
//     };
    
//     try {
//         const response = await fetch(`${API_URL}/rbi-bonds`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(formData)
//         });
        
//         if (response.ok) {
//             alert('RBI bond added successfully!');
//             document.getElementById('bondsForm').reset();
//             loadRBIBonds();
//             loadPortfolioSummary();
//         }
//     } catch (error) {
//         console.error('Error adding RBI bond:', error);
//         alert('Error adding RBI bond');
//     }
// });

// Setup RBIBonds cancel button
const rbiCancelBtn = document.getElementById('rbiCancelBtn');
if (rbiCancelBtn) {
    rbiCancelBtn.addEventListener('click', resetRBIBondsForm);
}

// Setup RBIBonds add button
const rbiAddBtn = document.getElementById('rbiAddBtn');
if (rbiAddBtn) {
    rbiAddBtn.addEventListener('click', resetRBIBondsEditValue);
}


// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    console.log('Page loaded - initializing data load');
    await refreshStockPrices();
    loadPortfolioSummary();
    loadFixedDeposits();
    loadMutualFunds();
    loadStocks();
    loadRBIBonds();
    loadPPF();
    updateInterestChange();
    // Attach bond maturity auto-calc listeners
    const bondPurchaseEl = document.getElementById('bondPurchase');
    const bondTenureEl = document.getElementById('bondTenure');
    if (bondPurchaseEl) bondPurchaseEl.addEventListener('change', updateBondMaturity);
    if (bondTenureEl) bondTenureEl.addEventListener('input', updateBondMaturity);
    // Initialize maturity if values present
    updateBondMaturity();
    

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

    // Upload Excel Handler
    const uploadInput = document.getElementById('uploadExcelInput');
    const uploadBtn = document.getElementById('uploadExcelBtn');
    if (uploadBtn && uploadInput) {
        uploadBtn.addEventListener('click', async () => {
            const file = uploadInput.files && uploadInput.files[0];
            if (!file) {
                alert('Please choose an .xlsx file to upload');
                return;
            }

            if (!confirm('This will replace current data with contents from the uploaded Excel file. Continue?')) return;

            try {
                uploadBtn.disabled = true;
                uploadBtn.textContent = 'Uploading...';

                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch(`${API_URL}/import-excel`, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Import failed');
                }

                alert('Import successful');

                // Refresh all data views
                loadFixedDeposits();
                loadMutualFunds();
                loadStocks();
                loadRBIBonds();
                loadPPF();
                loadHistoricalSnapshots();
                loadPortfolioSummary();
            } catch (error) {
                console.error('Error importing Excel:', error);
                alert('Error importing Excel: ' + error.message);
            } finally {
                uploadBtn.disabled = false;
                uploadBtn.textContent = '⬆️ Upload Excel';
            }
        });
    }

    // Snapshot Button Handler
    const snapshotBtn = document.getElementById('snapshotBtn');
    console.log('Snapshot button element:', snapshotBtn);
    if (snapshotBtn) {
        console.log('Attaching snapshot button listener');
        snapshotBtn.addEventListener('click', recordSnapshot);
    } else {
        console.error('Snapshot button not found!');
    }

    // Load historical snapshots on page load
    console.log('Loading historical snapshots on page init');
    loadHistoricalSnapshots();
});

// Record a portfolio snapshot
async function recordSnapshot() {
    try {
        console.log('Recording snapshot...');
        const response = await fetch(`${API_URL}/portfolio-snapshot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ snapshot_date: new Date().toISOString().split('T')[0] })
        });

        console.log('Snapshot response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to record snapshot: ${response.status} ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log('Snapshot recorded:', data);
        alert(`✓ Snapshot recorded for ${data.snapshot_date}\nTotal Portfolio Value: ${formatCurrency(data.total_portfolio_value)}`);
        
        // Reload snapshots and chart
        loadHistoricalSnapshots();
    } catch (error) {
        console.error('Error recording snapshot:', error);
        alert(`Error recording snapshot: ${error.message}`);
    }
}

// Load historical snapshots
async function loadHistoricalSnapshots() {
    try {
        console.log('Loading historical snapshots...');
        const response = await fetch(`${API_URL}/portfolio-snapshots`);
        
        console.log('Snapshots response status:', response.status);
        
        if (!response.ok) throw new Error('Failed to load snapshots');

        const snapshots = await response.json();
        console.log('Snapshots loaded successfully:', snapshots.length, 'snapshots');

        // Render chart
        renderHistoricalProgressChart(snapshots);

        // Render table
        renderSnapshotsTable(snapshots);
    } catch (error) {
        console.error('Error loading snapshots:', error);
    }
}

// Render historical progress chart
let historicalProgressChartInstance = null;

function renderHistoricalProgressChart(snapshots) {
    const ctx = document.getElementById('historicalProgressChart');
    if (!ctx || snapshots.length === 0) {
        console.log('Chart not rendered - ctx:', !!ctx, 'snapshots:', snapshots.length);
        return;
    }

    console.log('Rendering chart with snapshots:', snapshots);

    const dates = snapshots.map(s => {
        // Parse date string in YYYY-MM-DD format
        const [year, month, day] = s.snapshot_date.split('-');
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-IN', { year: '2-digit', month: 'short', day: 'numeric' });
    });

    const totals = snapshots.map(s => s.total_portfolio_value);

    const palette = getChartPalette();
    const themeOpts = getChartThemeOptions();

    // Helper function to add opacity to hex color
    function hexToRgbA(hex, alpha) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    const fdColor = getThemeColor('--fd-color').trim();
    console.log('FD Color:', fdColor);

    const chartData = {
        labels: dates,
        datasets: [
            {
                label: 'Total Portfolio Value (₹)',
                data: totals,
                borderColor: fdColor,
                backgroundColor: hexToRgbA(fdColor, 0.2),
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: fdColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            },
            {
                label: 'Fixed Deposits (₹)',
                data: snapshots.map(s => s.fixed_deposits_total),
                borderColor: getThemeColor('--fd-color'),
                borderWidth: 1,
                fill: false,
                borderDash: [5, 5],
                pointRadius: 3,
                tension: 0.4
            },
            {
                label: 'Mutual Funds (₹)',
                data: snapshots.map(s => s.mutual_funds_total),
                borderColor: getThemeColor('--mf-color'),
                borderWidth: 1,
                fill: false,
                borderDash: [5, 5],
                pointRadius: 3,
                tension: 0.4
            },
            {
                label: 'Stocks (₹)',
                data: snapshots.map(s => s.stocks_total),
                borderColor: getThemeColor('--stocks-color'),
                borderWidth: 1,
                fill: false,
                borderDash: [5, 5],
                pointRadius: 3,
                tension: 0.4
            },
            {
                label: 'RBI Bonds (₹)',
                data: snapshots.map(s => s.rbi_bonds_total),
                borderColor: getThemeColor('--bonds-color'),
                borderWidth: 1,
                fill: false,
                borderDash: [5, 5],
                pointRadius: 3,
                tension: 0.4
            },
            {
                label: 'PPF (₹)',
                data: snapshots.map(s => s.ppf_total),
                borderColor: getThemeColor('--ppf-color'),
                borderWidth: 1,
                fill: false,
                borderDash: [5, 5],
                pointRadius: 3,
                tension: 0.4
            }
        ]
    };

    console.log('Chart data created:', chartData.labels, chartData.datasets[0].data);

    if (historicalProgressChartInstance) {
        console.log('Updating existing chart instance');
        historicalProgressChartInstance.data = chartData;
        historicalProgressChartInstance.update();
    } else {
        console.log('Creating new chart instance');
        historicalProgressChartInstance = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        ...themeOpts.plugins.legend,
                        position: 'bottom'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    x: themeOpts.scales.x,
                    y: {
                        ...themeOpts.scales.y,
                        beginAtZero: true,
                        // stacked: true,
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

// Render snapshots table
function renderSnapshotsTable(snapshots) {
    const container = document.getElementById('snapshotsTableContainer');
    if (!container) return;

    if (snapshots.length === 0) {
        container.innerHTML = '<p class="text-muted">No snapshots recorded yet. Click "Take Snapshot" to start tracking your portfolio growth.</p>';
        return;
    }

    let html = `
        <table class="table table-striped table-hover">
            <thead>
                <tr class="table-header-row">
                    <th>Date</th>
                    <th>Fixed Deposits</th>
                    <th>Mutual Funds</th>
                    <th>Stocks</th>
                    <th>RBI Bonds</th>
                    <th>PPF</th>
                    <th>Total Portfolio</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    snapshots.forEach(snapshot => {
        const date = new Date(snapshot.snapshot_date).toLocaleDateString('en-IN');
        html += `
            <tr>
                <td>${date}</td>
                <td>${formatCurrency(snapshot.fixed_deposits_total)}</td>
                <td>${formatCurrency(snapshot.mutual_funds_total)}</td>
                <td>${formatCurrency(snapshot.stocks_total)}</td>
                <td>${formatCurrency(snapshot.rbi_bonds_total)}</td>
                <td>${formatCurrency(snapshot.ppf_total)}</td>
                <td><strong>${formatCurrency(snapshot.total_portfolio_value)}</strong></td>
                <td><button class="btn btn-sm btn-danger portfolio-delete-btn" data-id="${snapshot.id}">✕</button></td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;

    const deleteButtons = container.querySelectorAll('.portfolio-delete-btn');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', async (event) => {
            const snapshotId = event.currentTarget.getAttribute('data-id');
            if (!snapshotId) return;

            if (!confirm('Are you sure you want to delete this portfolio snapshot?')) {
                return;
            }

            try {
                const response = await fetch(`${API_URL}/portfolio-snapshots/${snapshotId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to delete snapshot');
                }

                alert('Snapshot deleted successfully');
                loadHistoricalSnapshots();
            } catch (error) {
                console.error('Error deleting portfolio snapshot:', error);
                alert(`Error deleting portfolio snapshot: ${error.message}`);
            }
        });
    });
}


// Function to update input value when another input changes
function updateInterestChange() {
    // Get the input elements
    const fdPrincipal = document.getElementById('fdPrincipal');
    const fdMaturityAmt = document.getElementById('fdMaturityAmt');
    const fdInterestAmt = document.getElementById('fdInterestAmt');
    
    fdPrincipal.addEventListener('input', function() {
        if(fdMaturityAmt.value !== '' && fdMaturityAmt.value !== '0') {
            fdInterestAmt.value = (parseFloat(fdMaturityAmt.value) - parseFloat(fdPrincipal.value)).toFixed(2);
        }

    });

    fdMaturityAmt.addEventListener('input', function() {
        if(fdPrincipal.value !== '' && fdPrincipal.value !== '0') {
            fdInterestAmt.value = (parseFloat(fdMaturityAmt.value) - parseFloat(fdPrincipal.value)).toFixed(2);
        }

    });


}

// Compute maturity date by adding tenure (years) to purchase date
function computeMaturityDate(purchaseDateStr, tenureYears) {
    if (!purchaseDateStr) return '';
    const tenure = parseInt(tenureYears, 10) || 0;
    const d = new Date(purchaseDateStr);
    if (isNaN(d.getTime())) return '';

    const originalMonth = d.getMonth();
    const originalDate = d.getDate();

    d.setFullYear(d.getFullYear() + tenure);

    // Handle month overflow (e.g., Feb 29 -> Mar 1). If month changed and original date was end-of-month, adjust to last day of target month
    if (d.getMonth() !== originalMonth) {
        // set to last day of previous month
        d.setDate(0);
    }

    return d.toISOString().split('T')[0];
}

function updateBondMaturity() {
    const purchaseEl = document.getElementById('bondPurchase');
    const tenureEl = document.getElementById('bondTenure');
    const maturityEl = document.getElementById('bondMaturity');
    if (!purchaseEl || !tenureEl || !maturityEl) return;

    const purchase = purchaseEl.value;
    const tenure = tenureEl.value;
    const mat = computeMaturityDate(purchase, tenure);
    if (mat) {
        maturityEl.value = mat;
    }
}
