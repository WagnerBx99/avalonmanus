import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { 
  Bot, 
  TrendingUp, 
  DollarSign, 
  Target, 
  StopCircle, 
  Settings, 
  User, 
  Wallet, 
  Play, 
  Square,
  LogOut
} from 'lucide-react'
import CandlestickChart from './CandlestickChart.jsx'
import BotStatus from './BotStatus.jsx'
import avalonSdk from '../services/avalonSdk.js'
import tradingBot from '../services/tradingBot.js'
import './TradingDashboard.css'

const TradingDashboard = ({ userData, onLogout }) => {
  const [balance, setBalance] = useState(userData.balance || 10950.00)
  const [strategy, setStrategy] = useState('Agressivo')
  const [entryValue, setEntryValue] = useState(10)
  const [target, setTarget] = useState(100)
  const [stopLoss, setStopLoss] = useState(50)
  const [botStats, setBotStats] = useState(null)
  const [botLogs, setBotLogs] = useState([])
  const [activeTab, setActiveTab] = useState('chart')

  useEffect(() => {
    // Configurar callback para atualizações do bot
    tradingBot.setUpdateCallback((update) => {
      if (update.log) {
        setBotLogs(prev => [...prev, update.log].slice(-20)) // Manter últimos 20 logs
      } else {
        setBotStats(update)
      }
    })

    // Atualizar saldo periodicamente
    const balanceInterval = setInterval(async () => {
      try {
        const balanceInfo = await avalonSdk.getBalance()
        if (balanceInfo) {
          setBalance(balanceInfo.demo || balanceInfo.real || balance)
        }
      } catch (error) {
        console.error('Erro ao atualizar saldo:', error)
      }
    }, 10000) // A cada 10 segundos

    return () => {
      clearInterval(balanceInterval)
    }
  }, [balance])

  const handleStartBot = async () => {
    // Configurar parâmetros do bot
    tradingBot.setParameters(strategy, entryValue, target, stopLoss)
    
    const started = await tradingBot.start()
    if (started) {
      setBotStats(tradingBot.getStats())
      // Mudar para aba de status quando iniciar
      setActiveTab('bot')
    }
  }

  const handleStopBot = () => {
    const stopped = tradingBot.stop()
    if (stopped) {
      setBotStats(tradingBot.getStats())
    }
  }

  const handleConfigureBot = () => {
    if (botStats?.isRunning) {
      return
    }
    
    // Atualizar configurações do bot
    tradingBot.setParameters(strategy, entryValue, target, stopLoss)
  }

  const handleLogout = () => {
    // Parar bot se estiver rodando
    if (botStats?.isRunning) {
      tradingBot.stop()
    }
    
    // Desconectar SDK
    avalonSdk.disconnect()
    
    // Chamar callback de logout
    onLogout()
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <img 
            src="/logoAlphaBot.png" 
            alt="" 
            className="h-8 w-auto"
          />
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>{userData.name || 'Samuel Martins'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary">R$ {balance.toFixed(2)}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Área Central */}
        <div className="flex-1 p-6">
          <div className="h-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chart">Gráfico</TabsTrigger>
                <TabsTrigger value="bot">Status do Bot</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chart" className="h-[calc(100%-40px)]">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Gráfico de Candles - Avalon Broker</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-80px)]">
                    <CandlestickChart isConnected={true} />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="bot" className="h-[calc(100%-40px)]">
                <BotStatus botStats={botStats} logs={botLogs} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar Direita - Bot Controls */}
        <div className="w-80 bg-card border-l border-border p-4 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-semibold">Inteligência Artificial</span>
            </div>
            <Badge variant="secondary" className="w-full justify-center">
              Claude 3.5 Sonnet
            </Badge>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              <span className="font-semibold">Estratégia</span>
            </div>
            <select 
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              disabled={botStats?.isRunning}
              className="strategy-select w-full p-2 text-center"
            >
              <option value="Conservador">Conservador</option>
              <option value="Moderado">Moderado</option>
              <option value="Agressivo">Agressivo</option>
            </select>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="font-semibold">Valor da entrada</span>
            </div>
            <Input
              type="number"
              value={entryValue}
              onChange={(e) => setEntryValue(Number(e.target.value))}
              className="text-center"
              disabled={botStats?.isRunning}
              min="1"
              max="1000"
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-chart-4" />
              <span className="font-semibold">Meta</span>
            </div>
            <Input
              type="number"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="text-center"
              disabled={botStats?.isRunning}
              min="10"
              max="10000"
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <StopCircle className="h-5 w-5 text-destructive" />
              <span className="font-semibold">Stop loss</span>
            </div>
            <Input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(Number(e.target.value))}
              className="text-center"
              disabled={botStats?.isRunning}
              min="5"
              max="1000"
            />
          </div>

          <Separator />

          <div className="space-y-3">
            {!botStats?.isRunning ? (
              <Button 
                onClick={handleStartBot}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground bot-control-button"
                size="lg"
              >
                <Play className="h-4 w-4 mr-2" />
                INICIAR
              </Button>
            ) : (
              <Button 
                onClick={handleStopBot}
                variant="destructive"
                className="w-full bot-control-button"
                size="lg"
              >
                <Square className="h-4 w-4 mr-2" />
                PARAR
              </Button>
            )}
            
            <Button 
              onClick={handleConfigureBot}
              variant="outline"
              className="w-full bot-control-button"
              disabled={botStats?.isRunning}
            >
              <Settings className="h-4 w-4 mr-2" />
              CONFIGURAR AUTOMÁTICO
            </Button>
          </div>

          <Separator />

          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              R$ {balance.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">Saldo Atual</p>
          </div>

          {botStats && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant={botStats.isRunning ? "default" : "secondary"} className="text-xs">
                    {botStats.isRunning ? 'Ativo' : 'Parado'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Trades:</span>
                  <span>{botStats.totalTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa:</span>
                  <span className="text-primary">{botStats.winRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Lucro:</span>
                  <span className={botStats.currentProfit >= 0 ? 'text-primary' : 'text-destructive'}>
                    R$ {botStats.currentProfit.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TradingDashboard

