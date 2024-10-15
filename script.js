document.getElementById('fileInput').addEventListener('change', handleFileSelect);
document.getElementById('loadDataBtn').addEventListener('click', renderFromFile);
document.getElementById('timezone').addEventListener('change', () => {
    // Re-render the chart and tables when the time zone changes
    renderFromFile()
});
// Populate the timezone dropdown with all available time zones
function populateTimezones() {
    const timezoneSelect = document.getElementById('timezone');
    
    // Get all supported time zones
    const timeZones = Intl.supportedValuesOf('timeZone');
    
    timeZones.forEach(timezone => {
        const option = document.createElement('option');
        option.value = timezone;
        option.textContent = timezone;
        timezoneSelect.appendChild(option);
    });

    // Set the default value to the browser's current time zone
    timezoneSelect.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
}

populateTimezones();  // Call this function to populate the timezones

let equityData = null; 
let drawdownData = null;
let tradeStats = null;
let portfolioStats = null;
let trades = null;
let orders = null;
let equitykChart = null;
let drawdnChart = null;
let tradedChart = null;

// Handle the file input change event
function handleFileSelect(event) {
    const file = event.target.files[0];  // Get the selected file
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);  // Parse the JSON file
                equityData = data.charts['Strategy Equity'].series.Equity.values;  // Extract the equity data
                drawdownData = data.charts['Drawdown'].series['Equity Drawdown'].values;
                tradeStats = data.totalPerformance.tradeStatistics;
                portfolioStats = data.totalPerformance.portfolioStatistics;
                trades = data.totalPerformance.closedTrades;
                orders = data.orders;
                document.getElementById('loadDataBtn').disabled = false;  // Enable the button once the file is loaded
            } catch (error) {
                console.error('Error parsing JSON:', error);
            }
        };
        reader.readAsText(file);  // Read the file as text
    }
}

function renderFromFile() {
    if (!equityData | !drawdownData) {
        console.error('No data available to render the chart.');
        return;
    }

    // Render charts and statistics
    renderEquityCurve();
    //renderCandlestickChart(); 
    renderDrawdownChart();
    renderTradeDistribution();
    renderStatistics();

    // Render trades table
    renderTradesTable();
    renderOrdersTable();

}

// Render Equity Curve
function renderEquityCurve() {
    const ctx = document.getElementById('equityCurve').getContext('2d');
    const timezone = document.getElementById('timezone').value;  // Get the selected timezone
    const labels = equityData.map(item => new Date(item[0] * 1000).toLocaleDateString('en-US', { timeZone: timezone }));
    const values = equityData.map(item => item[1]);

    // Destroy the previous instance if it exists (to avoid creating multiple overlapping charts)
    if (equitykChart) {
        equitykChart.destroy();
    }
    
    equitykChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Equity Value',
                data: values,
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { 
                    title: { display: true, text: 'Date' },
                },
                y: { 
                    title: { display: true, text: 'Equity ($)' }
                }
            },
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x'  // Allow panning in both x and y directions
                    },
                    zoom: {
                        wheel: {
                            enabled: true  // Enable zooming with the mouse wheel
                        },
                        pinch: {
                            enabled: true  // Enable zooming with pinch gestures on touch devices
                        },
                        mode: 'x'  // Allow zooming in both x and y directions
                    }
                }
            }
        }
    });
    // Add reset zoom functionality
    document.getElementById('resetZoom').addEventListener('click', function() {
        equitykChart.resetZoom();
    });
}

function renderCandlestickChart() {
    const ctx = document.getElementById('equityCurve').getContext('2d');

    // Map data to the required format for a candlestick chart
    const candlestickData = equityData.map(item => ({
        x: new Date(item[0] * 1000),  // Convert timestamp to Date
        o: item[1],  // Open price
        h: item[2],  // High price
        l: item[3],  // Low price
        c: item[4]   // Close price
    }));

    //console.log('Candlestick Data:', candlestickData);  // Log the mapped data for debugging

    const candlestickChart = new Chart(ctx, {
        type: 'candlestick',  // Use 'candlestick' chart type
        data: {
            datasets: [{
                label: 'Equity Value',
                data: candlestickData,
                borderColor: 'rgba(75, 192, 192, 1)',
                color: {
                    up: 'rgba(0, 255, 0, 1)',  // Green for up candles
                    down: 'rgba(255, 0, 0, 1)',  // Red for down candles
                    unchanged: 'rgba(0, 0, 255, 1)'  // Blue for unchanged
                }
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { 
                    title: { display: true, text: 'Date' },
                    type: 'time',  // Time-based x-axis
                    time: {
                        unit: 'minute'  // Display by day
                    }
                },
                y: { 
                    title: { display: true, text: 'Price ($)' }
                }
            },
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x'  // Allow panning in both x and y directions
                    },
                    zoom: {
                        wheel: {
                            enabled: true  // Enable zooming with the mouse wheel
                        },
                        pinch: {
                            enabled: true  // Enable zooming with pinch gestures on touch devices
                        },
                        mode: 'x'  // Allow zooming in both x and y directions
                    }
                }
            }
        }
    });
    // Add reset zoom functionality
    document.getElementById('resetZoom').addEventListener('click', function() {
        candlestickChart.resetZoom();
    });
}

// Render Equity Curve with zoom and time-based scale

// Render Drawdown Chart
function renderDrawdownChart() {
    const ctx = document.getElementById('drawdownChart').getContext('2d');
    const timezone = document.getElementById('timezone').value;
    const labels = drawdownData.map(item => new Date(item[0] * 1000).toLocaleDateString('en-US', { timeZone: timezone }));
    const values = drawdownData.map(item => item[1]);

    // Destroy the previous instance if it exists (to avoid creating multiple overlapping charts)
    if (drawdnChart) {
        drawdnChart.destroy();
    }
    
    drawdnChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Drawdown (%)',
                data: values,
                borderColor: 'rgba(255, 99, 132, 1)',
                fill: false
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Date' }},
                y: { title: { display: true, text: 'Drawdown (%)' }}
            }
        }
    });
}

// Render Trade Distribution
function renderTradeDistribution() {
    const ctx = document.getElementById('tradeDistribution').getContext('2d');
    const winningTrades = tradeStats.numberOfWinningTrades;
    const losingTrades = tradeStats.numberOfLosingTrades;

    // Destroy the previous instance if it exists (to avoid creating multiple overlapping charts)
    if (tradedChart) {
        tradedChart.destroy();
    }
    
    tradedChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Winning Trades', 'Losing Trades'],
            datasets: [{
                label: 'Trade Distribution',
                data: [winningTrades, losingTrades],
                backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(255, 99, 132, 0.2)'],
                borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Trade Type' }},
                y: { title: { display: true, text: 'Number of Trades' }}
            }
        }
    });
}

// Render Key Statistics
function renderStatistics() {
    const statsDiv = document.getElementById('statistics');
    statsDiv.innerHTML = `
        <p><strong>Total Trades:</strong> ${tradeStats.totalNumberOfTrades}</p>
        <p><strong>Winning Trades:</strong> ${tradeStats.numberOfWinningTrades}</p>
        <p><strong>Losing Trades:</strong> ${tradeStats.numberOfLosingTrades}</p>
        <p><strong>Win Rate:</strong> ${(tradeStats.winRate * 100).toFixed(2)}%</p>
        <p><strong>Total Profit/Loss:</strong> ${tradeStats.totalProfitLoss}</p>
        <p><strong>Sharpe Ratio:</strong> ${portfolioStats.sharpeRatio}</p>
        <p><strong>Max Drawdown:</strong> ${(portfolioStats.drawdown * 100).toFixed(2)}%</p>
    `;
}

// Render Trades Table
function renderTradesTable() {
    const tbody = document.querySelector("#tradesTable tbody");
    const timezone = document.getElementById('timezone').value;  // Get the selected timezone

    tbody.innerHTML = '';

    trades.forEach(trade => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${trade.symbol.value}</td>
            <td>${new Date(trade.entryTime).toLocaleString("en-US", {timeZone: timezone})}</td>
            <td>${trade.entryPrice}</td>
            <td>${new Date(trade.exitTime).toLocaleString("en-US", {timeZone: timezone})}</td>
            <td>${trade.exitPrice}</td>
            <td>${trade.profitLoss}</td>
            <td>${trade.mae}</td>
            <td>${trade.mfe}</td>
            <td>${trade.duration}</td>
            <td>${trade.endTradeDrawdown}</td>
            <td>${trade.isWin ? 'Yes' : 'No'}</td>
        `;
        tbody.appendChild(row);
    });
}

// Render Orders Table
function renderOrdersTable() {
    const tbody = document.querySelector("#ordersTable tbody");
    const timezone = document.getElementById('timezone').value;  // Get the selected timezone

    tbody.innerHTML = '';
    
    // Loop through each order in the orders object
    Object.values(orders).forEach(order => {
        const row = document.createElement('tr');
        const orderType = getOrderType(order.type);
        const direction = getOrderDirection(order.direction);
        const status = getOrderStatus(order.status);
        
        row.innerHTML = `
            <td>${order.symbol.value}</td>
            <td>${new Date(order.time).toLocaleString("en-US", {timeZone: timezone})}</td>
            <td>${orderType}</td>
            <td>${order.quantity}</td>
            <td>${order.price.toFixed(2)}</td>
            <td>${direction}</td>
            <td>${status}</td>
            <td>${order.tag}</td>
        `;
        tbody.appendChild(row);
    });
}

// Helper function to get readable order type
function getOrderType(type) {
    const orderTypes = {
        0: 'Liquidate',
        1: 'Limit',
        2: 'Stop',
        // Add more types as needed
    };
    return orderTypes[type] || 'Unknown';
}

// Helper function to get readable direction
function getOrderDirection(direction) {
    return direction === 0 ? 'Buy' : 'Sell';
}

// Helper function to get readable status
function getOrderStatus(status) {
    const orderStatuses = {
        3: 'Filled',
        5: 'Cancelled',
        // Add more statuses as needed
    };
    return orderStatuses[status] || 'Unknown';
}