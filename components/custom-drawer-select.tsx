"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface DrawerOption {
  value: string;
  label: string;
  subtext?: string;
  badge?: string;
}

export interface CustomDrawerSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: (string | DrawerOption)[];
  placeholder?: string;
  className?: string;
  drawerTitle?: string;
}

export function CustomDrawerSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  className = "",
  drawerTitle
}: CustomDrawerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Normalize options
  const normalizedOptions: DrawerOption[] = options.map((opt) => {
    if (typeof opt === "string") {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Close on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`sos-custom-drawer-wrapper ${className}`}
      style={{ position: "relative", width: "100%" }}
    >
      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`sos-input-field sos-drawer-trigger ${isOpen ? "open" : ""}`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          textAlign: "left",
          width: "100%",
          userSelect: "none"
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            paddingRight: "8px",
            color: selectedOption ? "#0f181c" : "#64748b",
            fontWeight: 600
          }}
        >
          {selectedOption ? (
            <>
              {selectedOption.label}
              {selectedOption.badge ? (
                <span
                  style={{
                    marginLeft: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    opacity: 0.75,
                    fontFamily: "'DM Mono', monospace"
                  }}
                >
                  ({selectedOption.badge})
                </span>
              ) : null}
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          size={16}
          style={{
            flexShrink: 0,
            color: "#8a5828",
            transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)"
          }}
        />
      </button>

      {/* Custom Drawer Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="sos-drawer-popover animate-scale-up"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 100,
            background: "#fcf7ea",
            backgroundImage: "linear-gradient(180deg, #fdf9ee 0%, #f7edd6 100%)",
            border: "1.5px solid #a8793b",
            borderRadius: "5px",
            boxShadow: "0 14px 34px rgba(8, 20, 30, 0.38), 0 3px 8px rgba(0, 0, 0, 0.15)",
            overflow: "hidden",
            maxHeight: "220px",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {drawerTitle && (
            <div
              style={{
                padding: "6px 10px 4px",
                font: "800 9.5px 'DM Mono', monospace",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                color: "#8a5828",
                borderBottom: "1px solid rgba(168, 121, 59, 0.25)",
                background: "rgba(168, 121, 59, 0.08)"
              }}
            >
              {drawerTitle}
            </div>
          )}

          <div
            style={{
              overflowY: "auto",
              padding: "4px",
              display: "flex",
              flexDirection: "column",
              gap: "2px"
            }}
          >
            {normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  className={`sos-drawer-item ${isSelected ? "selected" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12.5px",
                    lineHeight: 1.3,
                    transition: "all 0.15s ease",
                    background: isSelected ? "rgba(185, 59, 50, 0.14)" : "transparent",
                    color: isSelected ? "#992820" : "#141f25",
                    fontWeight: isSelected ? 700 : 500
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "#b93b32";
                      e.currentTarget.style.color = "#ffffff";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#141f25";
                    }
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{opt.label}</span>
                      {opt.badge && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontFamily: "'DM Mono', monospace",
                            padding: "1px 5px",
                            borderRadius: "3px",
                            background: isSelected ? "#992820" : "rgba(135, 100, 50, 0.15)",
                            color: isSelected ? "#ffffff" : "#6a451b",
                            fontWeight: 700
                          }}
                        >
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    {opt.subtext && (
                      <span
                        style={{
                          fontSize: "11px",
                          opacity: 0.75,
                          fontFamily: "'Manrope', sans-serif"
                        }}
                      >
                        {opt.subtext}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <Check
                      size={15}
                      style={{
                        flexShrink: 0,
                        color: "#992820",
                        marginLeft: "8px"
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
