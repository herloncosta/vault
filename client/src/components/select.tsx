import ReactSelect, { type StylesConfig } from "react-select";
import { useTheme } from "../contexts/theme-context";

export interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  inputId?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  allowClear?: boolean;
}

export default function FormSelect({
  inputId,
  value,
  onChange,
  options,
  placeholder = "Selecione",
  isDisabled,
  isLoading,
  allowClear = true,
}: FormSelectProps) {
  const { dark } = useTheme();

  const blue = dark ? "#60a5fa" : "#3b82f6";
  const styles: StylesConfig<SelectOption, false> = {
    control: (base, state) => ({
      ...base,
      minHeight: 42,
      borderRadius: 8,
      borderColor: state.isFocused ? blue : dark ? "#374151" : "#e2e8f0",
      backgroundColor: dark ? "#1f2937" : "#ffffff",
      boxShadow: state.isFocused ? `0 0 0 1px ${blue}` : "none",
      "&:hover": { borderColor: state.isFocused ? blue : dark ? "#4b5563" : "#cbd5e1" },
      fontSize: 14,
    }),
    singleValue: (base) => ({ ...base, color: dark ? "#f3f4f6" : "#0f172a" }),
    placeholder: (base) => ({ ...base, color: dark ? "#4b5563" : "#cbd5e1" }),
    input: (base) => ({ ...base, color: dark ? "#f3f4f6" : "#0f172a" }),
    menu: (base) => ({
      ...base,
      backgroundColor: dark ? "#1f2937" : "#ffffff",
      borderRadius: 8,
      zIndex: 9999,
    }),
    menuList: (base) => ({ ...base, padding: 4, maxHeight: 224 }),
    option: (base, state) => ({
      ...base,
      borderRadius: 6,
      fontSize: 14,
      backgroundColor: state.isSelected
        ? dark
          ? "rgba(59,130,246,0.2)"
          : "#eff6ff"
        : state.isFocused
          ? dark
            ? "#374151"
            : "#f1f5f9"
          : "transparent",
      color: state.isSelected ? (dark ? "#93c5fd" : "#1d4ed8") : dark ? "#f3f4f6" : "#0f172a",
      "&:active": { backgroundColor: dark ? "#374151" : "#e2e8f0" },
    }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base) => ({
      ...base,
      color: dark ? "#6b7280" : "#94a3b8",
      padding: "0 8px",
    }),
    clearIndicator: (base) => ({ ...base, color: dark ? "#6b7280" : "#94a3b8", padding: "0 8px" }),
  };

  return (
    <ReactSelect
      inputId={inputId}
      value={options.find((o) => o.value === value) ?? null}
      onChange={(opt) => onChange(opt?.value ?? "")}
      options={options}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isLoading={isLoading}
      isClearable={allowClear}
      isSearchable
      menuPortalTarget={document.body}
      menuPosition="fixed"
      styles={styles}
      noOptionsMessage={() => "Nenhuma opção"}
      loadingMessage={() => "Carregando…"}
    />
  );
}
