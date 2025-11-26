export class StatCard {
    constructor(data) {
        this.data = data;
    }

    render() {
        const change = this.data.change >= 0 ? 'positive' : 'negative';
        const changeIcon = this.data.change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';

        return `
            <div class="stat-card ${this.data.color}">
                <div class="card-header">
                    <h3>${this.data.title}</h3>
                    <div class="card-actions">
                        <button class="btn-icon" title="Más información">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                    </div>
                </div>

                <div class="card-body">
                    <div class="stat-value">${this.data.value}</div>
                    <div class="stat-unit">${this.data.unit}</div>
                </div>

                <div class="card-footer">
                    <span class="change-badge ${change}">
                        <i class="fas ${changeIcon}"></i>
                        ${Math.abs(this.data.change)}%
                    </span>
                    <span class="change-period">${this.data.period}</span>
                </div>
            </div>
        `;
    }
}

export class DataTable {
    constructor(data, columns) {
        this.data = data;
        this.columns = columns;
    }

    render() {
        const headerHTML = this.columns
            .map(col => `<th>${col.label}</th>`)
            .join('');

        const rowsHTML = this.data
            .map(item => {
                const cells = this.columns
                    .map(col => {
                        let value = item[col.key];
                        if (col.format) {
                            value = col.format(value);
                        }
                        return `<td>${value}</td>`;
                    })
                    .join('');
                return `<tr>${cells}</tr>`;
            })
            .join('');

        return `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>${headerHTML}</tr>
                    </thead>
                    <tbody>
                        ${rowsHTML}
                    </tbody>
                </table>
            </div>
        `;
    }
}

export class SimpleChart {
    constructor(data, options = {}) {
        this.data = data;
        this.options = options;
    }

    render() {
        const maxValue = Math.max(...this.data.map(d => d.value));
        const barsHTML = this.data
            .map(item => {
                const percentage = (item.value / maxValue) * 100;
                return `
                    <div class="chart-bar-container">
                        <div class="chart-bar">
                            <div class="bar" style="width: ${percentage}%"></div>
                        </div>
                        <span class="bar-label">${item.label}</span>
                        <span class="bar-value">${item.value}</span>
                    </div>
                `;
            })
            .join('');

        return `
            <div class="simple-chart">
                ${barsHTML}
            </div>
        `;
    }
}

export class ActivityList {
    constructor(activities) {
        this.activities = activities;
    }

    render() {
        const itemsHTML = this.activities
            .map(activity => `
                <div class="activity-item">
                    <div class="activity-icon ${activity.type}">
                        <i class="${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <p class="activity-title">${activity.title}</p>
                        <p class="activity-description">${activity.description}</p>
                    </div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            `)
            .join('');

        return `
            <div class="activity-list">
                ${itemsHTML}
            </div>
        `;
    }
}
