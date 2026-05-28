const API_URL = 'http://localhost:5000/api';

let wealthDistributionChartInstance = null;
let assetAllocationChartInstance = null;

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
    
    const chartData = {
        labels: ['Fixed Deposits', 'Mutual Funds', 'Stocks', 'RBI Bonds', 'PPF'],
        datasets: [{
            label: 'Asset Value (₹)',
            data: [
                data.fixed_deposits || 0,
                data.mutual_funds || 0,
                data.stocks || 0,
                data.rbi_bonds || 0,
                data.ppf || 0
            ],
            backgroundColor: [
                'rgba(54, 162, 235, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)',
                'rgba(255, 159, 64, 0.8)',
                'rgba(255, 99, 132, 0.8)'
            ],
            borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(255, 99, 132, 1)'
            ],
            borderWidth: 2
        }]
    };
    
    if (wealthDistributionChartInstance) {
        wealthDistributionChartInstance.data = chartData;
        wealthDistributionChartInstance.update();
    } else {
        wealthDistributionChartInstance = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
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
    
    const values = [
        data.fixed_deposits || 0,
        data.mutual_funds || 0,
        data.stocks || 0,
        data.rbi_bonds || 0,
        data.ppf || 0
    ];
    
    const chartData = {
        labels: ['Fixed Deposits', 'Mutual Funds', 'Stocks', 'RBI Bonds', 'PPF'],
        datasets: [{
            data: values,
            backgroundColor: [
                'rgba(54, 162, 235, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)',
                'rgba(255, 159, 64, 0.8)',
                'rgba(255, 99, 132, 0.8)'
            ],
            borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(255, 99, 132, 1)'
            ],
            borderWidth: 2
        }]
    };
    
    if (assetAllocationChartInstance) {
        assetAllocationChartInstance.data = chartData;
        assetAllocationChartInstance.update();
    } else {
        assetAllocationChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
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
        
        // Render charts
        renderWealthDistributionChart(data);
        renderAssetAllocationChart(data);
        
        console.log('Portfolio summary loaded successfully');
    } catch (error) {
        console.error('Error loading portfolio summary:', error);
    }
}

// Fixed Deposits Functions
async function editFixedDeposit(id, dep) {
    // Populate form with existing data
    document.getElementById('fdEditId').value = id;
    document.getElementById('fdBank').value = dep.bank_name;
    document.getElementById('fdCustId').value = dep.cust_id;
    document.getElementById('fdNumber').value = dep.fd_number;
    document.getElementById('fdPrincipal').value = dep.principal;
    document.getElementById('fdMaturityAmt').value = dep.maturity_amt;
    document.getElementById('fdInterestAmt').value = dep.interest_amt;
    document.getElementById('fdRate').value = dep.rate;
    document.getElementById('fdTenure').value = dep.tenure_months;
    document.getElementById('fdMaturity').value = dep.maturity_date;
    
    // Show update/cancel buttons, hide add button
    document.getElementById('fdAddBtn').style.display = 'none';
    document.getElementById('fdUpdateBtn').style.display = 'inline-block';
    document.getElementById('fdCancelBtn').style.display = 'inline-block';
    
    // Scroll to form
    document.querySelector('#fd-content form').scrollIntoView({ behavior: 'smooth' });
}

function resetFDForm() {
    document.getElementById('fdForm').reset();
    document.getElementById('fdEditId').value = '';
    
    // Show add button, hide update/cancel buttons
    document.getElementById('fdAddBtn').style.display = 'inline-block';
    document.getElementById('fdUpdateBtn').style.display = 'none';
    document.getElementById('fdCancelBtn').style.display = 'none';
}

async function deleteFixedDeposit(id) {
    if (!confirm('Are you sure you want to delete this fixed deposit?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/fixed-deposits/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Fixed deposit deleted successfully!');
            loadFixedDeposits();
            loadPortfolioSummary();
        } else {
            const errorData = await response.json();
            alert('Error: ' + (errorData.error || 'Error deleting fixed deposit'));
        }
    } catch (error) {
        console.error('Error deleting fixed deposit:', error);
        alert('Error deleting fixed deposit: ' + error.message);
    }
}

async function loadFixedDeposits() {
    try {
        const response = await fetch(`${API_URL}/fixed-deposits`);
        const deposits = await response.json();
        
        let html = '<div class="card mt-3"><div class="card-body"><h5 class="card-title">Fixed Deposits List</h5>';
        
        if (deposits.length === 0) {
            html += '<p class="text-muted">No fixed deposits added yet</p>';
        } else {
            html += '<div class="table-responsive"><table class="table table-striped table-hover" id="fdListTable">';
            html += '<thead><tr><th>Bank</th><th>Cust ID</th><th>FD Number</th><th>Principal</th><th>Maturity Amt</th><th>Interest Amt</th><th>Rate</th><th>Tenure</th><th>Maturity Date</th><th>Actions</th></tr></thead><tbody>';
            
            deposits.forEach(dep => {
                html += `<tr class="fd-row" data-fd='${JSON.stringify(dep)}' data-id="${dep.id}">
                    <td class="fd-editable" style="cursor:pointer;">${dep.bank_name}</td>
                    <td class="fd-editable" style="cursor:pointer;">${dep.cust_id}</td>
                    <td class="fd-editable" style="cursor:pointer;">${dep.fd_number}</td>
                    <td class="fd-editable" style="cursor:pointer;">${formatCurrency(dep.principal)}</td>
                    <td class="fd-editable" style="cursor:pointer;">${formatCurrency(dep.maturity_amt)}</td>
                    <td class="fd-editable" style="cursor:pointer;">${formatCurrency(dep.interest_amt)}</td>
                    <td class="fd-editable" style="cursor:pointer;">${dep.rate}%</td>
                    <td class="fd-editable" style="cursor:pointer;">${dep.tenure_months} months</td>
                    <td class="fd-editable" style="cursor:pointer;">${new Date(dep.maturity_date).toLocaleDateString('en-IN')}</td>
                    <td>
                        <button class="btn btn-sm btn-warning fd-edit-btn" data-id="${dep.id}">✎ Edit</button>
                        <button class="btn btn-sm btn-danger fd-delete-btn" data-id="${dep.id}">✕ Delete</button>
                    </td>
                </tr>`;
            });
            
            html += '</tbody></table></div>';
        }
        
        html += '</div></div>';
        document.getElementById('fdList').innerHTML = html;
        
        // Add event listeners to editable cells
        document.querySelectorAll('.fd-editable').forEach(cell => {
            cell.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                const depData = JSON.parse(row.dataset.fd);
                editFixedDeposit(depData.id, depData);
            });
        });
        
        // Add event listeners to edit buttons
        document.querySelectorAll('.fd-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = e.target.closest('tr');
                const depData = JSON.parse(row.dataset.fd);
                editFixedDeposit(depData.id, depData);
            });
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.fd-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                deleteFixedDeposit(id);
            });
        });
    } catch (error) {
        console.error('Error loading fixed deposits:', error);
    }
}

document.getElementById('fdForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const editId = document.getElementById('fdEditId').value;
    const formData = {
        bank_name: document.getElementById('fdBank').value,
        cust_id: document.getElementById('fdCustId').value,
        fd_number: document.getElementById('fdNumber').value,
        principal: parseFloat(document.getElementById('fdPrincipal').value),
        maturity_amt: parseFloat(document.getElementById('fdMaturityAmt').value),
        interest_amt: parseFloat(document.getElementById('fdInterestAmt').value),
        rate: parseFloat(document.getElementById('fdRate').value),
        tenure_months: parseInt(document.getElementById('fdTenure').value),
        maturity_date: document.getElementById('fdMaturity').value
    };
    
    console.log('Submitting FD form - Edit ID:', editId, 'Data:', formData);
    
    try {
        const url = editId ? `${API_URL}/fixed-deposits/${editId}` : `${API_URL}/fixed-deposits`;
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
    } catch (error) 
    {        console.error('Error saving fixed deposit:', error);
             alert('Error saving fixed deposit: ' + error.message);
    }
});

document.getElementById('fdResetBtn').addEventListener('click', resetFDForm);

// Mutual Funds Functions
async function loadMutualFunds() {
    try {
        const response = await fetch(`${API_URL}/mutual-funds`);
        const funds = await response.json();
        
        let html = '<div class="card mt-3"><div class="card-body"><h5 class="card-title">Mutual Funds List</h5>';
        
        if (funds.length === 0) {
            html += '<p class="text-muted">No mutual funds added yet</p>';
        } else {
            html += '<div class="table-responsive"><table class="table table-striped">';
            html += '<thead><tr><th>Fund Name</th><th>Units</th><th>NAV</th><th>Total Value</th><th>Purchase Date</th></tr></thead><tbody>';
            
            funds.forEach(fund => {
                html += `<tr>
                    <td>${fund.fund_name}</td>
                    <td>${fund.units}</td>
                    <td>${formatCurrency(fund.nav)}</td>
                    <td>${formatCurrency(fund.total_value)}</td>
                    <td>${new Date(fund.purchase_date).toLocaleDateString('en-IN')}</td>
                </tr>`;
            });
            
            html += '</tbody></table></div>';
        }
        
        html += '</div></div>';
        document.getElementById('mfList').innerHTML = html;
    } catch (error) {
        console.error('Error loading mutual funds:', error);
    }
}

document.getElementById('mfForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        fund_name: document.getElementById('mfName').value,
        units: parseFloat(document.getElementById('mfUnits').value),
        nav: parseFloat(document.getElementById('mfNAV').value),
        purchase_date: document.getElementById('mfPurchase').value
    };
    
    try {
        const response = await fetch(`${API_URL}/mutual-funds`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            alert('Mutual fund added successfully!');
            document.getElementById('mfForm').reset();
            loadMutualFunds();
            loadPortfolioSummary();
        }
    } catch (error) {
        console.error('Error adding mutual fund:', error);
        alert('Error adding mutual fund');
    }
});

// Stocks Functions
async function loadStocks() {
    try {
        const response = await fetch(`${API_URL}/stocks`);
        const stocks = await response.json();
        
        let html = '<div class="card mt-3"><div class="card-body"><h5 class="card-title">Stocks List</h5>';
        
        if (stocks.length === 0) {
            html += '<p class="text-muted">No stocks added yet</p>';
        } else {
            html += '<div class="table-responsive"><table class="table table-striped">';
            html += '<thead><tr><th>Stock</th><th>Symbol</th><th>Quantity</th><th>Avg Buy Price</th><th>Current Price</th><th>Total Value</th><th>Gain/Loss</th></tr></thead><tbody>';
            
            stocks.forEach(stock => {
                const gain = (stock.current_price - stock.purchase_price) * stock.quantity;
                const gainPercent = ((stock.current_price - stock.purchase_price) / stock.purchase_price * 100).toFixed(2);
                const gainClass = gain >= 0 ? 'text-success' : 'text-danger';
                
                html += `<tr>
                    <td>${stock.stock_name}</td>
                    <td>${stock.symbol}</td>
                    <td>${stock.quantity}</td>
                    <td>${formatCurrency(stock.purchase_price)}</td>
                    <td>${formatCurrency(stock.current_price)}</td>
                    <td>${formatCurrency(stock.total_value)}</td>
                    <td class="${gainClass}">${formatCurrency(gain)} (${gainPercent}%)</td>
                </tr>`;
            });
            
            html += '</tbody></table></div>';
        }
        
        html += '</div></div>';
        document.getElementById('stocksList').innerHTML = html;
    } catch (error) {
        console.error('Error loading stocks:', error);
    }
}

document.getElementById('stocksForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        stock_name: document.getElementById('stockName').value,
        symbol: document.getElementById('stockSymbol').value,
        quantity: parseInt(document.getElementById('stockQty').value),
        purchase_price: parseFloat(document.getElementById('stockPurchasePrice').value),
        current_price: parseFloat(document.getElementById('stockCurrentPrice').value),
        purchase_date: document.getElementById('stockPurchase').value
    };
    
    try {
        const response = await fetch(`${API_URL}/stocks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            alert('Stock added successfully!');
            document.getElementById('stocksForm').reset();
            loadStocks();
            loadPortfolioSummary();
        }
    } catch (error) {
        console.error('Error adding stock:', error);
        alert('Error adding stock');
    }
});

// RBI Bonds Functions
async function loadRBIBonds() {
    try {
        const response = await fetch(`${API_URL}/rbi-bonds`);
        const bonds = await response.json();
        
        let html = '<div class="card mt-3"><div class="card-body"><h5 class="card-title">RBI Bonds List</h5>';
        
        if (bonds.length === 0) {
            html += '<p class="text-muted">No RBI bonds added yet</p>';
        } else {
            html += '<div class="table-responsive"><table class="table table-striped">';
            html += '<thead><tr><th>Bond Type</th><th>Amount</th><th>Rate</th><th>Tenure</th><th>Purchase Date</th><th>Maturity Date</th></tr></thead><tbody>';
            
            bonds.forEach(bond => {
                html += `<tr>
                    <td>${bond.bond_type}</td>
                    <td>${formatCurrency(bond.amount)}</td>
                    <td>${bond.rate}%</td>
                    <td>${bond.tenure_years} years</td>
                    <td>${new Date(bond.purchase_date).toLocaleDateString('en-IN')}</td>
                    <td>${new Date(bond.maturity_date).toLocaleDateString('en-IN')}</td>
                </tr>`;
            });
            
            html += '</tbody></table></div>';
        }
        
        html += '</div></div>';
        document.getElementById('bondsList').innerHTML = html;
    } catch (error) {
        console.error('Error loading RBI bonds:', error);
    }
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
async function loadPPF() {
    try {
        const response = await fetch(`${API_URL}/ppf`);
        const ppfRecords = await response.json();
        
        let html = '<div class="card mt-3"><div class="card-body"><h5 class="card-title">PPF Contributions List</h5>';
        
        if (ppfRecords.length === 0) {
            html += '<p class="text-muted">No PPF contributions added yet</p>';
        } else {
            html += '<div class="table-responsive"><table class="table table-striped">';
            html += '<thead><tr><th>Account Number</th><th>Financial Year</th><th>Amount</th><th>Rate</th><th>Maturity Year</th></tr></thead><tbody>';
            
            ppfRecords.forEach(ppf => {
                html += `<tr>
                    <td>${ppf.account_number}</td>
                    <td>${ppf.financial_year}</td>
                    <td>${formatCurrency(ppf.amount)}</td>
                    <td>${ppf.rate}%</td>
                    <td>${ppf.maturity_year}</td>
                </tr>`;
            });
            
            html += '</tbody></table></div>';
        }
        
        html += '</div></div>';
        document.getElementById('ppfList').innerHTML = html;
    } catch (error) {
        console.error('Error loading PPF:', error);
    }
}

document.getElementById('ppfForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        account_number: document.getElementById('ppfAccount').value,
        financial_year: document.getElementById('ppfYear').value,
        amount: parseFloat(document.getElementById('ppfAmount').value),
        rate: parseFloat(document.getElementById('ppfRate').value),
        maturity_year: parseInt(document.getElementById('ppfMaturityYear').value)
    };
    
    try {
        const response = await fetch(`${API_URL}/ppf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            alert('PPF contribution added successfully!');
            document.getElementById('ppfForm').reset();
            loadPPF();
            loadPortfolioSummary();
        }
    } catch (error) {
        console.error('Error adding PPF contribution:', error);
        alert('Error adding PPF contribution');
    }
});


// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadPortfolioSummary();
    loadFixedDeposits();
    loadMutualFunds();
    loadStocks();
    loadRBIBonds();
    loadPPF();
    

    // setInterval(() => {
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
