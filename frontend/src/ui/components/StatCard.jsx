import React from "react"

const StatCard = ({ title, value, badge, className="" }) => (
  <div className={`card p-5 ${className}`}>
    <div className="flex items-center gap-2 text-textSecondary text-sm">
      <span className="i-heroicons-chart-bar-20-solid" />
      <span>{title}</span>
    </div>
    <div className="mt-3 flex items-center gap-3">
      <div className="text-[26px] font-extrabold tracking-tight">{value}</div>
      {badge && (
        <span className={`badge ${badge.positive ? "badge-green" : "badge-red"}`}>
          {badge.text}
        </span>
      )}
    </div>
  </div>
)

export default StatCard
