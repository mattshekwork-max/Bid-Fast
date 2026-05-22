"use client";

import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sevenAmRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipBlurRef = useRef(false);
  const touchStartY = useRef<number>(0);
  const isScrolling = useRef<boolean>(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generate time slots in 15-minute intervals
  const timeSlots: { value: string; display: string }[] = [];
  // Early morning (12am-6:45am) at TOP
  for (let hour = 0; hour < 7; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const hourStr = hour.toString().padStart(2, "0");
      const minuteStr = minute.toString().padStart(2, "0");
      const timeValue = `${hourStr}:${minuteStr}`;
      const displayHour = hour === 0 ? 12 : hour;
      const period = "AM";
      const displayTime = `${displayHour}:${minuteStr} ${period}`;
      timeSlots.push({ value: timeValue, display: displayTime });
    }
  }
  // Common times starting at 7am
  for (let hour = 7; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const hourStr = hour.toString().padStart(2, "0");
      const minuteStr = minute.toString().padStart(2, "0");
      const timeValue = `${hourStr}:${minuteStr}`;
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const period = hour < 12 ? "AM" : "PM";
      const displayTime = `${displayHour}:${minuteStr} ${period}`;
      timeSlots.push({ value: timeValue, display: displayTime });
    }
  }

  // Get display value
  const selectedTime = timeSlots.find((slot) => slot.value === value);
  // When editing, always show inputValue (even if empty). When not editing, show selected time.
  const displayValue = isEditing ? inputValue : (selectedTime ? selectedTime.display : "");

  // Filter time slots based on input with smart matching
  const filteredSlots = timeSlots.filter((slot) => {
    if (!inputValue) return true;

    const searchLower = inputValue.toLowerCase().trim().replace(/\s/g, "");
    const slotLower = slot.display.toLowerCase().replace(/\s/g, "");

    // Direct substring match
    if (slotLower.includes(searchLower)) return true;

    // Parse the input to extract meaningful parts
    const isPM = searchLower.includes("pm") || searchLower.includes("p");
    const isAM = searchLower.includes("am") || searchLower.includes("a");
    const numbers = searchLower.replace(/[ap]m?/g, "").replace(/:/g, "");

    // Extract slot hour and minute
    const slotMatch = slot.value.match(/(\d{2}):(\d{2})/);
    if (!slotMatch) return false;
    const slotHour = parseInt(slotMatch[1]);
    const slotMinute = parseInt(slotMatch[2]);

    // Parse input hour and minute
    let inputHour: number | null = null;
    let inputMinute: number | null = null;

    if (numbers.length === 0) return false;

    if (numbers.length <= 2) {
      // "7" or "19"
      inputHour = parseInt(numbers);
      inputMinute = null; // Match any minute
    } else if (numbers.length === 3) {
      // "730" = 7:30
      inputHour = parseInt(numbers[0]);
      inputMinute = parseInt(numbers.substring(1));
    } else if (numbers.length === 4) {
      // "1930" = 19:30
      inputHour = parseInt(numbers.substring(0, 2));
      inputMinute = parseInt(numbers.substring(2));
    }

    if (inputHour === null) return false;

    // Convert 12-hour to 24-hour if PM/AM specified
    if (isPM && inputHour < 12) inputHour += 12;
    if (isAM && inputHour === 12) inputHour = 0;

    // If no AM/PM specified and hour is 1-11, check both AM and PM
    const hourMatches = inputHour === slotHour ||
                        (!isAM && !isPM && inputHour < 12 &&
                         (inputHour === slotHour || (inputHour + 12) === slotHour));

    if (!hourMatches) return false;

    // If minute specified, must match; otherwise any minute is fine
    if (inputMinute !== null && inputMinute !== slotMinute) return false;

    return true;
  });

  // Parse and auto-select time
  const parseAndSelectTime = (input: string) => {
    if (!input.trim()) return;

    const cleaned = input.toLowerCase().trim().replace(/\s/g, "");

    // Try to find exact match first
    const exactMatch = timeSlots.find(
      (slot) => slot.display.toLowerCase().replace(/\s/g, "") === cleaned
    );
    if (exactMatch) {
      onChange(exactMatch.value);
      setInputValue("");
      setIsEditing(false);
      setIsOpen(false);
      skipBlurRef.current = true;
      return;
    }

    // Try partial match (e.g., "8", "815", "8:15")
    let hour = 0;
    let minute = 0;
    let isPM = cleaned.includes("pm") || cleaned.includes("p");
    let isAM = cleaned.includes("am") || cleaned.includes("a");

    // Remove am/pm indicators
    const numbers = cleaned.replace(/[ap]m?/g, "");

    if (numbers.includes(":")) {
      // Format: "8:15"
      const [h, m] = numbers.split(":");
      hour = parseInt(h);
      minute = parseInt(m) || 0;
    } else if (numbers.length <= 2) {
      // Format: "8" or "08"
      hour = parseInt(numbers);
      minute = 0;
    } else if (numbers.length === 3) {
      // Format: "815"
      hour = parseInt(numbers[0]);
      minute = parseInt(numbers.substring(1));
    } else if (numbers.length === 4) {
      // Format: "0815"
      hour = parseInt(numbers.substring(0, 2));
      minute = parseInt(numbers.substring(2));
    }

    // Handle 12-hour format
    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;
    // Default to PM for typical evening hours if not specified
    if (!isAM && !isPM && hour >= 1 && hour <= 11) {
      // Default all 1-11 to PM unless explicitly marked AM
      hour += 12;
    }

    // Round to nearest 15 minutes
    const roundedMinute = Math.round(minute / 15) * 15;
    const finalMinute = roundedMinute === 60 ? 0 : roundedMinute;
    const finalHour = roundedMinute === 60 ? (hour + 1) % 24 : hour;

    // Find matching time slot
    const hourStr = finalHour.toString().padStart(2, "0");
    const minuteStr = finalMinute.toString().padStart(2, "0");
    const timeValue = `${hourStr}:${minuteStr}`;
    const match = timeSlots.find((slot) => slot.value === timeValue);

    if (match) {
      onChange(match.value);
      setInputValue("");
      setIsEditing(false);
      setIsOpen(false);
      skipBlurRef.current = true;
    } else if (filteredSlots.length > 0) {
      // If no exact match, select first filtered result
      onChange(filteredSlots[0].value);
      setInputValue("");
      setIsEditing(false);
      setIsOpen(false);
      skipBlurRef.current = true;
    }
  };

  // Scroll to 7:00 AM when popover opens
  useEffect(() => {
    if (isOpen && !inputValue && sevenAmRef.current && scrollContainerRef.current) {
      setTimeout(() => {
        sevenAmRef.current?.scrollIntoView({
          block: 'start',
          behavior: 'auto'
        });
      }, 10);
    }
  }, [isOpen, inputValue]);

  // Focus input and handle editing state when popover opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure popover is rendered, then focus
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // If there's a selected time and we're not editing, populate inputValue and select
          if (!isEditing && selectedTime) {
            setInputValue(selectedTime.display);
            setIsEditing(true);
            inputRef.current.select();
          } else {
            inputRef.current.select();
          }
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Mobile-only simple input (no popover)
  if (isMobile) {
    return (
      <div className="relative">
        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
        <Input
          ref={inputRef}
          value={displayValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsEditing(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              parseAndSelectTime(inputValue);
            }
          }}
          onBlur={() => {
            if (inputValue) {
              parseAndSelectTime(inputValue);
            }
          }}
          placeholder="7pm, 8:30, 1930"
          className="pl-10"
          inputMode="text"
          autoComplete="off"
          autoFocus={false}
        />
      </div>
    );
  }

  // Desktop version with popover
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
          <Input
            ref={inputRef}
            value={displayValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsEditing(true);
              setIsOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                parseAndSelectTime(inputValue);
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                // Skip if we just selected a time via click or Enter
                if (skipBlurRef.current) {
                  skipBlurRef.current = false;
                  return;
                }
                if (inputValue) {
                  parseAndSelectTime(inputValue);
                }
              }, 200);
            }}
            onFocus={(e) => {
              e.stopPropagation();
              if (!isOpen) {
                setIsOpen(true);
              }
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!isOpen) {
                setIsOpen(true);
              }
            }}
            placeholder="7pm, 8:30, 1930"
            className="pl-10"
            inputMode="text"
            autoComplete="off"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[200px] p-0"
        align="start"
        onWheel={(e) => {
          e.stopPropagation();
        }}
        style={{ touchAction: 'auto' }}
      >
        <div
          ref={scrollContainerRef}
          className="max-h-[300px] overflow-y-auto p-1"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y'
          }}
          onTouchStart={(e) => {
            touchStartY.current = e.touches[0].clientY;
            isScrolling.current = false;
          }}
          onTouchMove={(e) => {
            const touchMoveY = e.touches[0].clientY;
            const diff = Math.abs(touchMoveY - touchStartY.current);
            // If moved more than 5px, consider it scrolling
            if (diff > 5) {
              isScrolling.current = true;
            }
          }}
        >
          {filteredSlots.length > 0 ? (
            filteredSlots.map((slot) => (
              <button
                key={slot.value}
                ref={slot.value === "07:00" && !inputValue ? sevenAmRef : null}
                onMouseDown={(e) => {
                  // Desktop click
                  e.preventDefault();
                }}
                onClick={(e) => {
                  // Only trigger on desktop or if not scrolling on mobile
                  if (!isScrolling.current) {
                    onChange(slot.value);
                    setInputValue("");
                    setIsEditing(false);
                    setIsOpen(false);
                    skipBlurRef.current = true;
                  }
                }}
                onTouchEnd={(e) => {
                  // Only select if user wasn't scrolling
                  if (!isScrolling.current) {
                    e.preventDefault();
                    onChange(slot.value);
                    setInputValue("");
                    setIsEditing(false);
                    setIsOpen(false);
                    skipBlurRef.current = true;
                  }
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                  value === slot.value
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700"
                }`}
              >
                {slot.display}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              No matching times
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
