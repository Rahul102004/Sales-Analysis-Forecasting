import React, { useState } from "react"

const GradientArea = ({ points, xlabels }) => {
  const [hover, setHover] = useState(null)
  const width = 1000, height = 300, pad = 40
  const maxV = Math.max(...points) + 5
  const stepX = (width - pad*2) / (points.length - 1)

  const path = points.map((v, i) => {
    const x = pad + i*stepX
    const y = height - pad - (v / maxV) * (height - pad*2)
    return [x, y]
  })

  const d = [
    `M ${pad} ${height-pad}`,
    ...path.map(([x,y])=>`L ${x} ${y}`),
    `L ${pad + (points.length-1)*stepX} ${height-pad}`,
    "Z"
  ].join(" ")

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - pad
    const idx = Math.round(x / stepX)
    setHover(Math.max(0, Math.min(points.length - 1, idx)))
  }

  return (
    <div className="relative">
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMove}
        onMouseLeave={()=>setHover(null)}
        className="rounded-xl border border-[#1f2a4a] bg-[#0b1737]"
      >
        {/* grid */}
        {[0,1,2,3,4,5,6,7].map(i=>(
          <line key={i} x1={pad} x2={width-pad} y1={pad+i*30} y2={pad+i*30} stroke="#152145" strokeWidth="1" />
        ))}
        {/* area gradient */}
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2EACC1" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#2EACC1" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={d} fill="url(#grad)" stroke="none" />
        {/* stroke */}
        <path d={`M ${path.map(([x,y])=>`${x} ${y}`).join(" L ")}`} fill="none" stroke="#36D0E4" strokeWidth="2" />
        {/* x labels */}
        {xlabels.map((lbl,i)=>{
          const x = pad+i*stepX
          return <text key={i} x={x} y={height-10} fontSize="12" textAnchor="middle" fill="#AAB6CA">{lbl}</text>
        })}
        {/* y ticks */}
        {[0,5,10,15,20,25,30,35,40].map(v=>{
          const y = height - pad - (v/maxV)*(height - pad*2)
          return <text key={v} x={10} y={y+4} fontSize="12" fill="#AAB6CA">{v}</text>
        })}
        {/* hover */}
        {hover !== null && (()=> {
          const x = pad + hover*stepX
          const y = height - pad - (points[hover]/maxV)*(height - pad*2)
          return (
            <g>
              <line x1={x} x2={x} y1={pad} y2={height-pad} stroke="#36D0E4" strokeWidth="2" />
              <circle cx={x} cy={y} r="5" fill="#36D0E4" />
            </g>
          )
        })()}
      </svg>
      {hover !== null && (
        <div className="tooltip left-1/2 top-0">
          <div className="text-xs text-textSecondary mb-1">{xlabels[hover]}</div>
          <div className="text-lg font-semibold">{points[hover]}</div>
        </div>
      )}
    </div>
  )
}

export default GradientArea
