document.getElementById('fileInput').addEventListener('change', handleFileSelect);
document.getElementById('loadDataBtn').addEventListener('click', renderFromFile);

let equityData = null; 
let drawdownData = null;
let tradeStats = null;
let portfolioStats = null;
let trades = null;
let orders = null;

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
    const labels = equityData.map(item => new Date(item[0] * 1000).toLocaleDateString());
    const values = equityData.map(item => item[1]);

    const equitykChart = new Chart(ctx, {
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
    const labels = drawdownData.map(item => new Date(item[0] * 1000).toLocaleDateString());
    const values = drawdownData.map(item => item[1]);

    new Chart(ctx, {
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

    new Chart(ctx, {
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

    trades.forEach(trade => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${trade.symbol.value}</td>
            <td>${new Date(trade.entryTime).toLocaleString()}</td>
            <td>${trade.entryPrice}</td>
            <td>${new Date(trade.exitTime).toLocaleString()}</td>
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
    
    // Loop through each order in the orders object
    Object.values(orders).forEach(order => {
        const row = document.createElement('tr');
        const orderType = getOrderType(order.type);
        const direction = getOrderDirection(order.direction);
        const status = getOrderStatus(order.status);
        
        row.innerHTML = `
            <td>${order.symbol.value}</td>
            <td>${new Date(order.time).toLocaleString()}</td>
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