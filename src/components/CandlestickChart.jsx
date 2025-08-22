import { useState, useEffect } from 'react'
import { ComposedChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Bar } from 'recharts'

// Dados simulados de candles para demonstração
const generateMockCandleData = () => {
  const data = []
  let price = 1.2500
  
  for (let i = 0; i < 50; i++) {
    const open = price
    const change = (Math.random() - 0.5) * 0.01
    const close = open + change
    const high = Math.max(open, close) + Math.random() * 0.005
    const low = Math.min(open, close) - Math.random() * 0.005
    
    data.push({
      time: new Date(Date.now() - (49 - i) * 60000).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      open: parseFloat(open.toFixed(5)),
      high: parseFloat(high.toFixed(5)),
      low: parseFloat(low.toFixed(5)),
      close: parseFloat(close.toFixed(5)),
      volume: Math.floor(Math.random() * 1000) + 100
    })
    
    price = close
  }
  
  return data
}

const CandleBar = (props) => {
  const { payload, x, y, width, height } = props
  
  if (!payload) return null
  
  const { open, high, low, close } = payload
  const isGreen = close >= open
  const color = isGreen ? '#00ff88' : '#ef4444'
  
  const bodyHeight = Math.abs(close - open) * height / (payload.high - payload.low)
  const bodyY = y + (Math.max(high, Math.max(open, close)) - Math.max(open, close)) * height / (high - low)
  
  const wickTop = y + (high - Math.max(open, close)) * height / (high - low)
  const wickBottom = y + (high - Math.min(open, close)) * height / (high - low)
  
  return (
    <g>
      {/* Pavio superior */}
      <line
        x1={x + width / 2}
        y1={wickTop}
        x2={x + width / 2}
        y2={bodyY}
        stroke={color}
        strokeWidth={1}
      />
      
      {/* Corpo da vela */}
      <rect
        x={x + width * 0.2}
        y={bodyY}
        width={width * 0.6}
        height={Math.max(bodyHeight, 1)}
        fill={isGreen ? color : 'transparent'}
        stroke={color}
        strokeWidth={1}
      />
      
      {/* Pavio inferior */}
      <line
        x1={x + width / 2}
        y1={wickBottom}
        x2={x + width / 2}
        y2={bodyY + bodyHeight}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  )
}

const CandlestickChart = ({ isConnected }) => {
  const [candleData, setCandleData] = useState([])
  const [currentPrice, setCurrentPrice] = useState(null)

  useEffect(() => {
    // Gerar dados iniciais
    const initialData = generateMockCandleData()
    setCandleData(initialData)
    setCurrentPrice(initialData[initialData.length - 1]?.close)

    if (isConnected) {
      // Simular atualizações em tempo real
      const interval = setInterval(() => {
        setCandleData(prevData => {
          const newData = [...prevData]
          const lastCandle = newData[newData.length - 1]
          
          // Atualizar última vela
          const change = (Math.random() - 0.5) * 0.002
          const newClose = lastCandle.close + change
          const newHigh = Math.max(lastCandle.high, newClose)
          const newLow = Math.min(lastCandle.low, newClose)
          
          newData[newData.length - 1] = {
            ...lastCandle,
            close: parseFloat(newClose.toFixed(5)),
            high: parseFloat(newHigh.toFixed(5)),
            low: parseFloat(newLow.toFixed(5))
          }
          
          setCurrentPrice(newClose)
          return newData
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isConnected])

  if (!isConnected) {
    return (
      <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-4 text-muted-foreground">📈</div>
          <p className="text-muted-foreground">Conecte-se para visualizar o gráfico</p>
          <p className="text-sm text-muted-foreground mt-2">Dados em tempo real da Avalon</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">EUR/USD</h3>
          <p className="text-sm text-muted-foreground">Gráfico de 1 minuto</p>
        </div>
        {currentPrice && (
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {currentPrice.toFixed(5)}
            </div>
            <div className="text-sm text-muted-foreground">
              Preço atual
            </div>
          </div>
        )}
      </div>
      
      <ResponsiveContainer width="100%" height="85%">
        <ComposedChart
          data={candleData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
          <XAxis 
            dataKey="time" 
            stroke="#888888"
            fontSize={12}
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={['dataMin - 0.001', 'dataMax + 0.001']}
            stroke="#888888"
            fontSize={12}
            tickFormatter={(value) => value.toFixed(5)}
          />
          <Bar
            dataKey="high"
            shape={<CandleBar />}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CandlestickChart

