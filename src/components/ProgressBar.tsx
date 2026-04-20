import React, { JSX } from 'react'

export default function ProgressBar({
  value,
  max,
  bytes,
  totalBytes,
}: {
  value: number
  max: number
  bytes?: number
  totalBytes?: number
}): JSX.Element {
  const percentage = (value / max) * 100
  const isComplete = value === max
  const dataBytes = Number.isFinite(bytes)
    ? Math.max(0, Math.round(bytes as number))
    : undefined
  const dataTotalBytes = Number.isFinite(totalBytes)
    ? Math.max(0, Math.round(totalBytes as number))
    : undefined

  return (
    <div
      id="progress-bar"
      className="w-full h-12 bg-stone-200 dark:bg-stone-700 rounded-md overflow-hidden relative shadow-sm"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-black font-bold">{Math.round(percentage)}%</span>
      </div>
      <div
        id="progress-bar-fill"
        className={`h-full ${
          isComplete
            ? 'bg-linear-to-b from-green-500 to-green-600'
            : 'bg-linear-to-b from-blue-500 to-blue-600'
        } transition-all duration-300 ease-in-out`}
        style={{ width: `${percentage}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          id="progress-percentage"
          data-bytes={dataBytes}
          data-total-bytes={dataTotalBytes}
          className="text-white font-bold text-shadow"
        >
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  )
}
