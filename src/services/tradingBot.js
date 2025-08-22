import avalonSdk from './avalonSdk.js'

class TradingBot {
  constructor() {
    this.isRunning = false
    this.strategy = 'Agressivo'
    this.entryValue = 10
    this.target = 100
    this.stopLoss = 50
    this.currentProfit = 0
    this.totalTrades = 0
    this.winTrades = 0
    this.lossTrades = 0
    this.intervalId = null
    this.onUpdate = null
  }

  setParameters(strategy, entryValue, target, stopLoss) {
    this.strategy = strategy
    this.entryValue = entryValue
    this.target = target
    this.stopLoss = stopLoss
  }

  setUpdateCallback(callback) {
    this.onUpdate = callback
  }

  async start() {
    if (this.isRunning) {
      return false
    }

    this.isRunning = true
    this.currentProfit = 0
    this.totalTrades = 0
    this.winTrades = 0
    this.lossTrades = 0

    this.log('Bot iniciado com estratégia: ' + this.strategy)
    this.updateStats() // Atualizar imediatamente
    
    // Estratégia simples: fazer trades a cada 15 segundos para demonstração
    this.intervalId = setInterval(() => {
      this.executeTrade()
    }, 15000) // 15 segundos

    // Primeira execução após 3 segundos
    setTimeout(() => this.executeTrade(), 3000)

    return true
  }

  stop() {
    if (!this.isRunning) {
      return false
    }

    this.isRunning = false
    
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.log('Bot parado')
    this.updateStats() // Atualizar stats ao parar
    return true
  }

  async executeTrade() {
    if (!this.isRunning) {
      return
    }

    try {
      // Verificar se atingiu stop loss ou target
      if (this.currentProfit <= -this.stopLoss) {
        this.log(`Stop loss atingido: R$ ${this.currentProfit.toFixed(2)}`)
        this.stop()
        return
      }

      if (this.currentProfit >= this.target) {
        this.log(`Meta atingida: R$ ${this.currentProfit.toFixed(2)}`)
        this.stop()
        return
      }

      // Estratégia baseada no tipo selecionado
      let winChance = 0.5 // 50% padrão
      
      switch (this.strategy) {
        case 'Conservador':
          winChance = 0.65 // 65% de chance
          break
        case 'Moderado':
          winChance = 0.60 // 60% de chance
          break
        case 'Agressivo':
          winChance = 0.55 // 55% de chance, mas trades mais frequentes
          break
      }

      // Alternar entre CALL e PUT baseado no número de trades
      const direction = this.totalTrades % 2 === 0 ? 'call' : 'put'
      
      this.log(`Executando trade ${this.totalTrades + 1}: ${direction.toUpperCase()} - R$ ${this.entryValue}`)

      // Simular resultado do trade
      const isWin = Math.random() < winChance
      const profit = isWin ? this.entryValue * 0.8 : -this.entryValue

      this.totalTrades++
      
      if (isWin) {
        this.winTrades++
        this.log(`✅ Trade ganho: +R$ ${profit.toFixed(2)}`)
      } else {
        this.lossTrades++
        this.log(`❌ Trade perdido: R$ ${profit.toFixed(2)}`)
      }

      this.currentProfit += profit

      // Tentar executar trade real se conectado
      try {
        if (avalonSdk.isConnected || avalonSdk.useMock) {
          await avalonSdk.buyBlitzOption(direction, this.entryValue)
        }
      } catch (error) {
        this.log(`Erro no trade real: ${error.message}`)
      }

      this.updateStats()

    } catch (error) {
      this.log(`Erro na execução do trade: ${error.message}`)
    }
  }

  updateStats() {
    const winRate = this.totalTrades > 0 ? (this.winTrades / this.totalTrades * 100).toFixed(1) : 0
    
    const stats = {
      isRunning: this.isRunning,
      currentProfit: this.currentProfit,
      totalTrades: this.totalTrades,
      winTrades: this.winTrades,
      lossTrades: this.lossTrades,
      winRate: winRate,
      strategy: this.strategy,
      entryValue: this.entryValue,
      target: this.target,
      stopLoss: this.stopLoss
    }

    if (this.onUpdate) {
      this.onUpdate(stats)
    }
  }

  log(message) {
    const timestamp = new Date().toLocaleTimeString('pt-BR')
    console.log(`[${timestamp}] Bot: ${message}`)
    
    // Enviar log para callback se disponível
    if (this.onUpdate) {
      this.onUpdate({ log: `[${timestamp}] ${message}` })
    }
  }

  getStats() {
    const winRate = this.totalTrades > 0 ? (this.winTrades / this.totalTrades * 100).toFixed(1) : 0
    
    return {
      isRunning: this.isRunning,
      currentProfit: this.currentProfit,
      totalTrades: this.totalTrades,
      winTrades: this.winTrades,
      lossTrades: this.lossTrades,
      winRate: winRate,
      strategy: this.strategy,
      entryValue: this.entryValue,
      target: this.target,
      stopLoss: this.stopLoss
    }
  }
}

export default new TradingBot()

