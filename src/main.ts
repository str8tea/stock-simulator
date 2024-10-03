const MAX_MONTH = 12 * 50

function myFunction() {
    const stock = new Stock('株式', 0.01, 0.02)
    Logger.log(stock)
}

// function calcInvestTrend(invest, startMonth = 1, endMonth = MAX_MONTH) {
//     const investTrend = new Array(startMonth - 1).fill(0);
//     for (let investMonth = 1; investMonth <= endMonth - startMonth + 1; investMonth++) {
//         investTrend.push(invest * investMonth)
//     }
//     return investTrend
// }

function calcInvestTrend(capitalRate, investMonth) {
    const investTrend = []
    for (let month = 1; month <= investMonth; month++) {
        investTrend.push(capitalRate * month)
    }
    return investTrend
}


class Stock {

    name: string
    capitalRate: number
    incomeRate: number

    constructor(name: string, capitalRate: number, incomeRate: number) {
        this.name = name
        this.capitalRate = capitalRate
        this.incomeRate = incomeRate
    }
}

class InvestPlan {

    capital: number
    startMonth: number
    endMonth: number

    constructor(capital, startMonth = 1, endMonth = MAX_MONTH) {
        this.capital = capital
        this.startMonth = startMonth
        this.endMonth = endMonth
    }
}

class StockPlan {

    stock: Stock
    investPlans: Array<InvestPlan>

    constructor(stock, investPlans) {
        this.stock = stock
        this.investPlans = investPlans

        this.investPlans.sort((a, b) => a.startMonth - b.endMonth)
    }

}

class StockGrowth {

    stockPlan: StockPlan

    constructor(stockPlan) {
        this.stockPlan = stockPlan
    }

    calcInvestTrendAll() {
        let investTrendAll = []
        const { stock, investPlans } = this.stockPlan
        const { name, capitalRate, incomeRate } = stock
        investPlans.forEach(investPlan => {
            const { startMonth, endMonth } = investPlan
            const investTrend = calcInvestTrend(capitalRate, endMonth - startMonth + 1)
            investTrendAll.push(investTrend)
        })

        return investTrendAll
    }

    calcCapitalGrowth() {
        let capitalGrowth = []
        // 

    }

}
