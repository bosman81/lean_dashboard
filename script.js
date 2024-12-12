document
  .getElementById("fileInput")
  .addEventListener("change", handleFileSelect);
document
  .getElementById("loadDataBtn")
  .addEventListener("click", renderFromFile);
document.getElementById("timezone").addEventListener("change", () => {
  // Re-render the chart and tables when the time zone changes
  renderFromFile();
});
// Populate the timezone dropdown with all available time zones
function populateTimezones() {
  const timezoneSelect = document.getElementById("timezone");

  // Get all supported time zones
  const timeZones = Intl.supportedValuesOf("timeZone");

  timeZones.forEach((timezone) => {
    const option = document.createElement("option");
    option.value = timezone;
    option.textContent = timezone;
    timezoneSelect.appendChild(option);
  });

  // Set the default value to the browser's current time zone
  timezoneSelect.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
}

populateTimezones(); // Call this function to populate the timezones

let equityData = null;
let equityReturn = null;
let drawdownData = null;
let tradeStats = null;
let portfolioStats = null;
let trades = null;
let orders = null;
let equitykChart = null;
let drawdnChart = null;
let tradedChart = null;
let candlestickChart = null;

// Handle the file input change event
function handleFileSelect(event) {
  const file = event.target.files[0]; // Get the selected file
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result); // Parse the JSON file
        equityData = data.charts["Strategy Equity"].series.Equity.values; // Extract the equity data
        equityReturn = data.charts["Strategy Equity"].series.Return.values;
        drawdownData = data.charts["Drawdown"].series["Equity Drawdown"].values;
        tradeStats = data.totalPerformance.tradeStatistics;
        portfolioStats = data.totalPerformance.portfolioStatistics;
        trades = data.totalPerformance.closedTrades;
        orders = data.orders;
        document.getElementById("loadDataBtn").disabled = false; // Enable the button once the file is loaded
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    };
    reader.readAsText(file); // Read the file as text
  }
}

function renderFromFile() {
  if (!equityData | !drawdownData) {
    console.error("No data available to render the chart.");
    return;
  }

  // Render charts and statistics
  //renderEquityCurve();
  renderCandlestickChart();
  renderDrawdownChart();
  renderTradeDistribution();
  renderStatistics();

  // Render trades table
  renderTradesTable();
  renderOrdersTable();
}

// Render Equity Curve
function renderEquityCurve() {
  const ctx = document.getElementById("equityCurve").getContext("2d");
  const timezone = document.getElementById("timezone").value; // Get the selected timezone
  const labels = equityData.map((item) =>
    new Date(item[0] * 1000).toLocaleDateString("en-US", { timeZone: timezone })
  );
  const values = equityData.map((item) => item[1]);

  // Destroy the previous instance if it exists (to avoid creating multiple overlapping charts)
  if (equitykChart) {
    equitykChart.destroy();
  }

  equitykChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Equity Value",
          data: values,
          borderColor: "rgba(75, 192, 192, 1)",
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: "Date" },
        },
        y: {
          title: { display: true, text: "Equity ($)" },
        },
      },
      plugins: {
        zoom: {
          pan: {
            enabled: true,
            mode: "x", // Allow panning in both x and y directions
          },
          zoom: {
            wheel: {
              enabled: true, // Enable zooming with the mouse wheel
            },
            pinch: {
              enabled: true, // Enable zooming with pinch gestures on touch devices
            },
            mode: "x", // Allow zooming in both x and y directions
          },
        },
      },
    },
  });
  // Add reset zoom functionality
  document.getElementById("resetZoom").addEventListener("click", function () {
    equitykChart.resetZoom();
  });
}

// Convert the timestamps from seconds to milliseconds
function convertToMilliseconds(data) {
  return data.map((point) => {
    return [point[0] * 1000, point[1], point[2], point[3], point[4]];
  });
}

// Function to aggregate 5-minute data into daily bars (local time zone)
function aggregateToDaily(data) {
  const dailyData = [];
  let currentDay = null;
  let open, high, low, close;

  data.forEach((point) => {
    const date = new Date(point[0]); // Local date
    const day = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ).getTime(); // Get start of the local day

    if (currentDay !== day) {
      if (currentDay !== null) {
        // Push the previous day's aggregated OHLC data
        dailyData.push([currentDay, open, high, low, close]);
      }

      // Start new day aggregation
      currentDay = day;
      open = point[1];
      high = point[2];
      low = point[3];
      close = point[4];
    } else {
      // Continue aggregating the current day's OHLC
      high = Math.max(high, point[2]);
      low = Math.min(low, point[3]);
      close = point[4];
    }
  });

  // Add the last day's data
  if (currentDay !== null) {
    dailyData.push([currentDay, open, high, low, close]);
  }

  return dailyData;
}

function renderCandlestickChart() {
  const dataInMilliseconds = convertToMilliseconds(equityData);
  const barDataInMilliseconds = equityReturn.map((point) => [
    point[0] * 1000,
    point[1],
  ]);

  // Initialize Highcharts candlestick chart with a secondary bar chart
  Highcharts.stockChart("equityCurve", {
    rangeSelector: {
      selected: 1,
    },
    yAxis: [
      {
        labels: {
          align: "right",
          x: -3,
        },
        title: {
          text: "Equity",
        },
        height: "60%",
        lineWidth: 2,
        resize: {
          enabled: true,
        },
      },
      {
        labels: {
          align: "right",
          x: -3,
        },
        title: {
          text: "Return",
        },
        top: "65%",
        height: "35%",
        offset: 0,
        lineWidth: 2,
      },
    ],
    tooltip: {
      split: true,
    },
    series: [
      {
        type: "candlestick",
        name: "5-minute data",
        data: dataInMilliseconds,
        id: "candlestick",
        upColor: "green", // Green color for positive candles
        color: "red", // Red color for negative candles
        tooltip: {
          valueDecimals: 2,
        },
      },
      {
        type: "column",
        name: "Return",
        data: barDataInMilliseconds,
        yAxis: 1,
        id: "Return",
        tooltip: {
          valueDecimals: 2,
        },
      },
    ],
    xAxis: {
      minRange: 3600 * 1000, // Allow minimum 1 hour range (in milliseconds)
      events: {
        afterSetExtremes: function (e) {
          const zoomRange = e.max - e.min;
          const oneDay = 96 * 3600 * 1000;
          const chart = this.chart;
          const candlestickSeries = chart.get("candlestick");

          // If the zoomed range is more than a day, show daily data
          if (zoomRange > oneDay) {
            const dailyData = aggregateToDaily(dataInMilliseconds);
            candlestickSeries.update(
              { data: dailyData, name: "Daily data" },
              false
            );
          } else {
            // If zoomed in, show 5-minute data
            candlestickSeries.update(
              { data: dataInMilliseconds, name: "5-minute data" },
              false
            );
          }

          chart.redraw();
        },
      },
    },
    navigator: {
      enabled: true, // Allows zooming with the navigator
    },
    scrollbar: {
      enabled: true, // Provides easier scrolling/zooming
    },
  });
}

// Render Drawdown Chart
function renderDrawdownChart() {
  const ctx = document.getElementById("drawdownChart").getContext("2d");
  const timezone = document.getElementById("timezone").value;
  const labels = drawdownData.map((item) =>
    new Date(item[0] * 1000).toLocaleDateString("en-US", { timeZone: timezone })
  );
  const values = drawdownData.map((item) => item[1]);

  // Destroy the previous instance if it exists (to avoid creating multiple overlapping charts)
  if (drawdnChart) {
    drawdnChart.destroy();
  }

  drawdnChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Drawdown (%)",
          data: values,
          borderColor: "rgba(255, 99, 132, 1)",
          fill: false,
        },
      ],
    },
    options: {
      scales: {
        x: { title: { display: true, text: "Date" } },
        y: { title: { display: true, text: "Drawdown (%)" } },
      },
    },
  });
}

// Render Trade Distribution
function renderTradeDistribution() {
  const ctx = document.getElementById("tradeDistribution").getContext("2d");
  const winningTrades = tradeStats.numberOfWinningTrades;
  const losingTrades = tradeStats.numberOfLosingTrades;

  // Destroy the previous instance if it exists (to avoid creating multiple overlapping charts)
  if (tradedChart) {
    tradedChart.destroy();
  }

  tradedChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Winning Trades", "Losing Trades"],
      datasets: [
        {
          label: "Trade Distribution",
          data: [winningTrades, losingTrades],
          backgroundColor: [
            "rgba(75, 192, 192, 0.2)",
            "rgba(255, 99, 132, 0.2)",
          ],
          borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 99, 132, 1)"],
          borderWidth: 1,
        },
      ],
    },
  });
}

// Render Key Statistics
function renderStatistics() {
  const statsDiv = document.getElementById("statistics");
  statsDiv.innerHTML = `
        <p><strong>Total Trades:</strong> ${tradeStats.totalNumberOfTrades}</p>
        <p><strong>Winning Trades:</strong> ${
          tradeStats.numberOfWinningTrades
        }</p>
        <p><strong>Losing Trades:</strong> ${
          tradeStats.numberOfLosingTrades
        }</p>
        <p><strong>Win Rate:</strong> ${(tradeStats.winRate * 100).toFixed(
          2
        )}%</p>
        <p><strong>Total Profit/Loss:</strong> ${tradeStats.totalProfitLoss}</p>
        <p><strong>Sharpe Ratio:</strong> ${portfolioStats.sharpeRatio}</p>
        <p><strong>Max Drawdown:</strong> ${(
          portfolioStats.drawdown * 100
        ).toFixed(2)}%</p>
    `;
}

// Render Trades Table
function renderTradesTable() {
  const tbody = document.querySelector("#tradesTable tbody");
  const timezone = document.getElementById("timezone").value; // Get the selected timezone

  tbody.innerHTML = "";

  trades.forEach((trade) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${trade.symbol.value}</td>
            <td>${new Date(trade.entryTime).toLocaleString("en-US", {
              timeZone: timezone,
            })}</td>
            <td>${trade.entryPrice}</td>
            <td>${new Date(trade.exitTime).toLocaleString("en-US", {
              timeZone: timezone,
            })}</td>
            <td>${trade.exitPrice}</td>
            <td>${trade.profitLoss}</td>
            <td>${trade.mae}</td>
            <td>${trade.mfe}</td>
            <td>${trade.duration}</td>
            <td>${trade.endTradeDrawdown}</td>
            <td>${trade.isWin ? "Yes" : "No"}</td>
        `;
    tbody.appendChild(row);
  });
}

// Render Orders Table
function renderOrdersTable() {
  const tbody = document.querySelector("#ordersTable tbody");
  const timezone = document.getElementById("timezone").value; // Get the selected timezone

  tbody.innerHTML = "";

  // Loop through each order in the orders object
  Object.values(orders).forEach((order) => {
    const row = document.createElement("tr");
    const orderType = getOrderType(order.type);
    const direction = getOrderDirection(order.direction);
    const status = getOrderStatus(order.status);

    row.innerHTML = `
            <td>${order.symbol.value}</td>
            <td>${new Date(order.time).toLocaleString("en-US", {
              timeZone: timezone,
            })}</td>
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

// Source : https://github.com/QuantConnect/Lean/blob/master/Common/Orders/OrderTypes.cs
// Helper function to get readable order type
function getOrderType(type) {
  const orderTypes = {
    0: "Market",
    1: "Limit",
    2: "StopMarket",
    3: "StopLimit",
    4: "MarketOnOpen",
    5: "MarketOnClose",
    6: "OptionExercise",
    7: "LimitIfTouched",
    8: "ComboMarket",
    9: "ComboLimit",
    10: "ComboLegLimit",
    11: "TrailingStop",
  };
  return orderTypes[type] || "Unknown";
}

// Helper function to get readable direction
function getOrderDirection(direction) {
  const dirType = {
    0: "Buy",
    1: "Sell",
    2: "Hold",
  };
  return dirType[direction] || "Unknown";
}

// Helper function to get readable status
function getOrderStatus(status) {
  const orderStatuses = {
    0: "New",
    1: "Submitted",
    2: "PartiallyFilled",
    3: "Filled",
    5: "Cancelled",
    6: "None",
    7: "Invalid",
    8: "CancelPending",
    9: "UpdateSubmitted",
    // Add more statuses as needed
  };
  return orderStatuses[status] || "Unknown";
}
