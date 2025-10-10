'use client'

import { useState, useRef, useEffect } from 'react'
import { Palette, Check } from 'lucide-react'

interface ColorPickerProps {
  value?: string
  onChange: (color: string) => void
  label?: string
  disabled?: boolean
  className?: string
}

const PRESET_COLORS = [
  '#000000', '#1f1f1f', '#333333', '#4f4f4f', '#666666', '#808080',
  '#999999', '#b3b3b3', '#cccccc', '#e6e6e6', '#f5f5f5', '#ffffff',
  
  '#ff0000', '#ff4d4d', '#ff8080', '#ffb3b3', '#ffe6e6',
  '#ff6600', '#ff8533', '#ffa366', '#ffc299', '#ffe0cc',
  '#ffff00', '#ffff4d', '#ffff80', '#ffffb3', '#ffffe6',
  '#00ff00', '#4dff4d', '#80ff80', '#b3ffb3', '#e6ffe6',
  '#0000ff', '#4d4dff', '#8080ff', '#b3b3ff', '#e6e6ff',
  '#ff00ff', '#ff4dff', '#ff80ff', '#ffb3ff', '#ffe6ff',
  
  '#8b0000', '#a52a2a', '#dc143c', '#b22222', '#cd5c5c',
  '#ff4500', '#ff6347', '#ffd700', '#ffa500', '#ff8c00',
  '#32cd32', '#00ff00', '#7fff00', '#90ee90', '#98fb98',
  '#00ced1', '#40e0d0', '#00ffff', '#87ceeb', '#87cefa',
  '#9370db', '#8a2be2', '#9400d3', '#4b0082', '#483d8b',
  '#ff1493', '#ff69b4', '#ffc0cb', '#ffb6c1', '#ffa0b4'
]

export default function ColorPicker({ value = '#000000', onChange, label, disabled, className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hexInput, setHexInput] = useState(value)
  const [selectedColor, setSelectedColor] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setHexInput(value)
    setSelectedColor(value)
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const isValidHex = (hex: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)
  }

  const normalizeHex = (hex: string) => {
    if (hex.length === 4) {
      // Convert #rgb to #rrggbb
      return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
    }
    return hex
  }

  const handleColorSelect = (color: string) => {
    const normalizedColor = normalizeHex(color)
    setSelectedColor(normalizedColor)
    setHexInput(normalizedColor)
    onChange(normalizedColor)
    setIsOpen(false)
  }

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value
    if (!inputValue.startsWith('#')) {
      inputValue = '#' + inputValue
    }
    setHexInput(inputValue)
  }

  const handleHexInputBlur = () => {
    if (isValidHex(hexInput)) {
      const normalizedColor = normalizeHex(hexInput)
      setSelectedColor(normalizedColor)
      setHexInput(normalizedColor)
      onChange(normalizedColor)
    } else {
      setHexInput(selectedColor)
    }
  }

  const handleHexInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleHexInputBlur()
      inputRef.current?.blur()
    }
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-sm font-semibold text-foreground mb-2 block">
          {label}
        </label>
      )}
      
      <div className="flex items-center space-x-3">
        {/* Color Preview & Picker Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="relative h-12 w-16 rounded-xl border-2 border-input shadow-sm transition-all duration-200 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          style={{ backgroundColor: selectedColor }}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black/20">
            <Palette className="h-4 w-4 text-white" />
          </div>
        </button>

        {/* Hex Input */}
        <div className="flex-1">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={hexInput}
              onChange={handleHexInputChange}
              onBlur={handleHexInputBlur}
              onKeyDown={handleHexInputKeyDown}
              disabled={disabled}
              placeholder="#000000"
              className="flex h-12 w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm font-mono transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/50 uppercase"
              maxLength={7}
            />
            {isValidHex(hexInput) && (
              <Check className="absolute right-3 top-3 h-5 w-5 text-green-500" />
            )}
          </div>
        </div>
      </div>

      {/* Color Picker Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-popover border border-border/50 rounded-2xl shadow-2xl z-50 backdrop-blur-xl">
          <div className="grid grid-cols-12 gap-2">
            {PRESET_COLORS.map((color, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleColorSelect(color)}
                className="relative h-8 w-8 rounded-lg border border-border shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                style={{ backgroundColor: color }}
                title={color}
              >
                {selectedColor === color && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white drop-shadow-md" style={{
                      color: color === '#ffffff' || color === '#f5f5f5' || color === '#e6e6e6' ? '#000000' : '#ffffff'
                    }} />
                  </div>
                )}
              </button>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Click a color or enter a hex code above. Colors support 3 or 6 digit hex format.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}