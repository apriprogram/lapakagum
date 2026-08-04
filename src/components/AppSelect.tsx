'use client';

import { Check, ChevronDown, CircleAlert, CircleCheck, CircleDashed, CircleX } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

const selectIconMap = {
  warning: CircleAlert,
  progress: CircleDashed,
  success: CircleCheck,
  failed: CircleX,
};

type AppSelectTone = 'warning' | 'progress' | 'success' | 'failed';
const statusPresentation: Record<string, { icon: keyof typeof selectIconMap; tone: AppSelectTone }> = {
  TUNDA: { icon: 'warning', tone: 'warning' },
  SELESAI: { icon: 'success', tone: 'success' },
  BATAL: { icon: 'failed', tone: 'failed' },
};

export interface AppSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: keyof typeof selectIconMap;
  tone?: AppSelectTone;
}

interface AppSelectProps {
  name?: string;
  options: AppSelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  placeholder?: string;
}

export default function AppSelect({
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  required = false,
  disabled = false,
  className = '',
  ariaLabel,
  placeholder = 'Pilih opsi',
}: AppSelectProps) {
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listId = useId();
  const selectedValue = controlled ? value : internalValue;
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === selectedValue));
  const selected = options.find((option) => option.value === selectedValue);
  const selectedPresentation = selected ? statusPresentation[selected.value] : undefined;
  const selectedTone = selected?.tone ?? selectedPresentation?.tone;
  const SelectedIcon = selected?.icon ? selectIconMap[selected.icon] : selectedPresentation ? selectIconMap[selectedPresentation.icon] : null;

  const positionMenu = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 190), Math.max(190, window.innerWidth - 16));
    const estimatedHeight = Math.min(options.length * 42 + 12, 280);
    const below = rect.bottom + 6;
    const top = below + estimatedHeight <= window.innerHeight - 8
      ? below
      : Math.max(8, rect.top - estimatedHeight - 6);
    const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - width - 8));
    setMenuStyle({ position: 'fixed', top, left, width, maxHeight: 280 });
  }, [options.length]);

  const focusOption = (index: number) => {
    const safeIndex = Math.min(Math.max(index, 0), Math.max(options.length - 1, 0));
    setActiveIndex(safeIndex);
    window.requestAnimationFrame(() => optionRefs.current[safeIndex]?.focus());
  };

  const openMenu = (index = selectedIndex) => {
    if (disabled || !options.length) return;
    positionMenu();
    setOpen(true);
    focusOption(index);
  };

  const choose = (nextValue: string) => {
    if (!controlled) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const handlePosition = () => positionMenu();
    document.addEventListener('mousedown', handlePointer);
    window.addEventListener('resize', handlePosition);
    window.addEventListener('scroll', handlePosition, true);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      window.removeEventListener('resize', handlePosition);
      window.removeEventListener('scroll', handlePosition, true);
    };
  }, [open, positionMenu]);

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openMenu(open ? Math.min(activeIndex + 1, options.length - 1) : selectedIndex);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu(open ? Math.max(activeIndex - 1, 0) : selectedIndex);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleOptionKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusOption(Math.min(index + 1, options.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusOption(Math.max(index - 1, 0));
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusOption(options.length - 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <span className="app-select">
      {name && (
        <input
          name={name}
          value={selectedValue}
          onChange={() => undefined}
          required={required}
          tabIndex={-1}
          aria-hidden="true"
          className="app-select-input"
          onInvalid={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
            openMenu();
          }}
        />
      )}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        className={`app-select-trigger ${selectedTone ? `app-select-tone-${selectedTone}` : ''} ${className}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => open ? setOpen(false) : openMenu()}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={`app-select-value ${selected ? '' : 'is-placeholder'}`}>
          {SelectedIcon && <SelectedIcon className="app-select-leading-icon" />}
          <span>{selected?.label ?? placeholder}</span>
        </span>
        <ChevronDown className={`app-select-chevron ${open ? 'is-open' : ''}`} />
      </button>
      {open && createPortal(
        <div ref={menuRef} id={listId} role="listbox" className="app-dropdown-menu" style={menuStyle}>
          {options.map((option, index) => {
            const isSelected = option.value === selectedValue;
            const optionPresentation = statusPresentation[option.value];
            const optionTone = option.tone ?? optionPresentation?.tone;
            const OptionIcon = option.icon ? selectIconMap[option.icon] : optionPresentation ? selectIconMap[optionPresentation.icon] : null;
            return (
              <button
                key={option.value}
                ref={(element) => { optionRefs.current[index] = element; }}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                className={`app-dropdown-option ${optionTone ? `app-select-tone-${optionTone}` : ''} ${isSelected ? 'is-selected' : ''}`}
                onClick={() => choose(option.value)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
              >
                <span className="app-dropdown-option-label">
                  {OptionIcon && <OptionIcon />}
                  <span>{option.label}</span>
                </span>
                {isSelected && <Check />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </span>
  );
}