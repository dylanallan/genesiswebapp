export function generateDashboardHTML(
  metrics: any,
  logs: any[],
  functions: any[],
  notifications: any[],
  channels: any[]
) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Edge Functions Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/moment"></script>
  <script src="https://cdn.jsdelivr.net/npm/alpinejs" defer></script>
  <style>
    [x-cloak] { display: none !important; }
    .chart-container { position: relative; height: 300px; }
    .notification-badge {
      @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
    }
    .notification-badge.error { @apply bg-red-100 text-red-800; }
    .notification-badge.warning { @apply bg-yellow-100 text-yellow-800; }
    .notification-badge.success { @apply bg-green-100 text-green-800; }
    .notification-badge.info { @apply bg-blue-100 text-blue-800; }
  </style>
</head>
<body class="bg-gray-100" x-data="dashboard()" x-cloak>
  <div class="min-h-screen">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-xl font-bold text-gray-900">Edge Functions Dashboard</h1>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a href="#overview" class="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Overview
              </a>
              <a href="#functions" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Functions
              </a>
              <a href="#logs" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Logs
              </a>
              <a href="#notifications" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Notifications
              </a>
            </div>
          </div>
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <button
                @click="refreshData()"
                class="relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- Overview Section -->
      <div id="overview" class="px-4 py-6 sm:px-0">
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Total Logs -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">Total Logs</dt>
                    <dd class="flex items-baseline">
                      <div class="text-2xl font-semibold text-gray-900">${metrics.total_logs}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <!-- Error Rate -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">Error Rate</dt>
                    <dd class="flex items-baseline">
                      <div class="text-2xl font-semibold text-gray-900">${metrics.error_rate}%</div>
                      <div class="ml-2 flex items-baseline text-sm font-semibold ${metrics.error_rate > 5 ? 'text-red-600' : 'text-green-600'}">
                        ${metrics.error_rate > 5 ? '↑' : '↓'}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <!-- Avg Response Time -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">Avg Response Time</dt>
                    <dd class="flex items-baseline">
                      <div class="text-2xl font-semibold text-gray-900">${metrics.avg_response_time}ms</div>
                      <div class="ml-2 flex items-baseline text-sm font-semibold ${metrics.avg_response_time > 1000 ? 'text-red-600' : 'text-green-600'}">
                        ${metrics.avg_response_time > 1000 ? '↑' : '↓'}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <!-- Active Alerts -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">Active Alerts</dt>
                    <dd class="flex items-baseline">
                      <div class="text-2xl font-semibold text-gray-900">${metrics.active_alerts}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <!-- Log Levels Chart -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <h3 class="text-lg leading-6 font-medium text-gray-900">Log Levels Distribution</h3>
              <div class="mt-2 chart-container">
                <canvas id="logLevelsChart"></canvas>
              </div>
            </div>
          </div>

          <!-- Response Times Chart -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <h3 class="text-lg leading-6 font-medium text-gray-900">Response Times</h3>
              <div class="mt-2 chart-container">
                <canvas id="responseTimesChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Functions Section -->
      <div id="functions" class="mt-8 px-4 sm:px-0">
        <div class="bg-white shadow overflow-hidden sm:rounded-md">
          <ul role="list" class="divide-y divide-gray-200">
            ${functions.map((func: any) => `
              <li>
                <div class="px-4 py-4 sm:px-6">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <p class="text-sm font-medium text-indigo-600 truncate">${func.name}</p>
                      <div class="ml-2 flex-shrink-0 flex">
                        <p class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${func.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                          ${func.status}
                        </p>
                      </div>
                    </div>
                    <div class="ml-2 flex-shrink-0 flex">
                      <p class="text-sm text-gray-500">${func.last_invocation ? moment(func.last_invocation).fromNow() : 'Never'}</p>
                    </div>
                  </div>
                  <div class="mt-2 sm:flex sm:justify-between">
                    <div class="sm:flex">
                      <p class="flex items-center text-sm text-gray-500">
                        <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        ${func.invocations_24h} invocations (24h)
                      </p>
                      <p class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ${func.avg_response_time}ms avg
                      </p>
                    </div>
                    <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      ${func.success_rate}% success
                    </div>
                  </div>
                </div>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>

      <!-- Logs Section -->
      <div id="logs" class="mt-8 px-4 sm:px-0">
        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Recent Logs</h3>
            <div class="mt-2 max-w-xl text-sm text-gray-500">
              <p>Filter and search through function logs</p>
            </div>
          </div>
          <div class="border-t border-gray-200">
            <div class="bg-white px-4 py-5 sm:p-6">
              <div class="flex space-x-4 mb-4">
                <select
                  x-model="filters.function"
                  class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">All Functions</option>
                  ${functions.map((func: any) => `
                    <option value="${func.name}">${func.name}</option>
                  `).join('')}
                </select>
                <select
                  x-model="filters.level"
                  class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">All Levels</option>
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
                <select
                  x-model="filters.timeRange"
                  class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="1h">Last Hour</option>
                  <option value="6h">Last 6 Hours</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                </select>
              </div>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Function</th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metadata</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    ${logs.map((log: any) => `
                      <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${moment(log.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${log.function_name}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${log.level === 'error' ? 'bg-red-100 text-red-800' :
                              log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                              log.level === 'info' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'}">
                            ${log.level}
                          </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-500">
                          ${log.message}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-500">
                          <pre class="whitespace-pre-wrap">${JSON.stringify(log.metadata, null, 2)}</pre>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notifications Section -->
      <div id="notifications" class="mt-8 px-4 sm:px-0">
        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Notification Channels</h3>
            <div class="mt-2 max-w-xl text-sm text-gray-500">
              <p>Manage notification channels and templates</p>
            </div>
          </div>
          <div class="border-t border-gray-200">
            <div class="bg-white px-4 py-5 sm:p-6">
              <!-- Channel Status -->
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                ${channels.map((channel: any) => `
                  <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                      <div class="flex items-center">
                        <div class="flex-shrink-0">
                          <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                          <dl>
                            <dt class="text-sm font-medium text-gray-500 truncate">${channel.name}</dt>
                            <dd class="flex items-baseline">
                              <div class="text-2xl font-semibold text-gray-900">${channel.type}</div>
                              <div class="ml-2 flex items-baseline text-sm font-semibold
                                ${channel.status === 'healthy' ? 'text-green-600' :
                                  channel.status === 'degraded' ? 'text-yellow-600' :
                                  'text-red-600'}">
                                ${channel.status}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div class="bg-gray-50 px-5 py-3">
                      <div class="text-sm">
                        <a href="#" class="font-medium text-indigo-600 hover:text-indigo-500">View Details</a>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>

              <!-- Recent Notifications -->
              <div class="mt-8">
                <h4 class="text-lg font-medium text-gray-900">Recent Notifications</h4>
                <div class="mt-4 overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      ${notifications.map((notification: any) => `
                        <tr>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${moment(notification.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ${notification.channel}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${notification.template}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${notification.result?.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                              ${notification.result?.success ? 'Success' : 'Failed'}
                            </span>
                          </td>
                          <td class="px-6 py-4 text-sm text-gray-500">
                            <pre class="whitespace-pre-wrap">${JSON.stringify(notification.result, null, 2)}</pre>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>

  <script>
    function dashboard() {
      return {
        filters: {
          function: '',
          level: '',
          timeRange: '1h'
        },
        charts: {},
        
        init() {
          this.initCharts()
          this.setupAutoRefresh()
        },
        
        initCharts() {
          // Log Levels Chart
          const logLevelsCtx = document.getElementById('logLevelsChart').getContext('2d')
          this.charts.logLevels = new Chart(logLevelsCtx, {
            type: 'pie',
            data: {
              labels: ['Error', 'Warning', 'Info', 'Debug'],
              datasets: [{
                data: [
                  ${metrics.log_levels.error},
                  ${metrics.log_levels.warn},
                  ${metrics.log_levels.info},
                  ${metrics.log_levels.debug}
                ],
                backgroundColor: [
                  '#EF4444',
                  '#F59E0B',
                  '#3B82F6',
                  '#6B7280'
                ]
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }
          })
          
          // Response Times Chart
          const responseTimesCtx = document.getElementById('responseTimesChart').getContext('2d')
          this.charts.responseTimes = new Chart(responseTimesCtx, {
            type: 'line',
            data: {
              labels: ${JSON.stringify(metrics.response_times.map((t: any) => moment(t.timestamp).format('HH:mm')))},
              datasets: [{
                label: 'Response Time (ms)',
                data: ${JSON.stringify(metrics.response_times.map((t: any) => t.value))},
                borderColor: '#3B82F6',
                tension: 0.4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          })
        },
        
        setupAutoRefresh() {
          setInterval(() => {
            this.refreshData()
          }, 30000) // Refresh every 30 seconds
        },
        
        async refreshData() {
          try {
            const response = await fetch('/api/metrics?' + new URLSearchParams(this.filters))
            const data = await response.json()
            
            // Update metrics
            this.updateMetrics(data.metrics)
            
            // Update charts
            this.updateCharts(data.metrics)
            
            // Update logs
            this.updateLogs(data.logs)
            
            // Update notifications
            this.updateNotifications(data.notifications)
          } catch (error) {
            console.error('Error refreshing data:', error)
          }
        },
        
        updateMetrics(metrics) {
          // Update metric cards
          document.querySelector('[data-metric="total_logs"]').textContent = metrics.total_logs
          document.querySelector('[data-metric="error_rate"]').textContent = metrics.error_rate + '%'
          document.querySelector('[data-metric="avg_response_time"]').textContent = metrics.avg_response_time + 'ms'
          document.querySelector('[data-metric="active_alerts"]').textContent = metrics.active_alerts
        },
        
        updateCharts(metrics) {
          // Update log levels chart
          this.charts.logLevels.data.datasets[0].data = [
            metrics.log_levels.error,
            metrics.log_levels.warn,
            metrics.log_levels.info,
            metrics.log_levels.debug
          ]
          this.charts.logLevels.update()
          
          // Update response times chart
          this.charts.responseTimes.data.labels = metrics.response_times.map((t: any) => moment(t.timestamp).format('HH:mm'))
          this.charts.responseTimes.data.datasets[0].data = metrics.response_times.map((t: any) => t.value)
          this.charts.responseTimes.update()
        },
        
        updateLogs(logs) {
          const tbody = document.querySelector('#logs table tbody')
          tbody.innerHTML = logs.map((log: any) => `
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${moment(log.timestamp).format('YYYY-MM-DD HH:mm:ss')}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${log.function_name}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                  ${log.level === 'error' ? 'bg-red-100 text-red-800' :
                    log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                    log.level === 'info' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'}">
                  ${log.level}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                ${log.message}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                <pre class="whitespace-pre-wrap">${JSON.stringify(log.metadata, null, 2)}</pre>
              </td>
            </tr>
          `).join('')
        },
        
        updateNotifications(notifications) {
          const tbody = document.querySelector('#notifications table tbody')
          tbody.innerHTML = notifications.map((notification: any) => `
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${moment(notification.timestamp).format('YYYY-MM-DD HH:mm:ss')}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${notification.channel}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${notification.template}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                  ${notification.result?.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                  ${notification.result?.success ? 'Success' : 'Failed'}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                <pre class="whitespace-pre-wrap">${JSON.stringify(notification.result, null, 2)}</pre>
              </td>
            </tr>
          `).join('')
        }
      }
    }
  </script>
</body>
</html>
  `
} 