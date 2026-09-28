import Select from "react-select";
import type { ClassNamesConfig } from "react-select";

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectFieldProps {
  id?: string;
  options: SelectOption[];
  value: SelectOption | null;
  onChange: (option: SelectOption | null) => void;
  isLoading?: boolean;
}

const classNames: ClassNamesConfig<SelectOption, false> = {
  control: (state) =>
    `rounded-lg border bg-white text-sm transition-all duration-300 dark:bg-gray-800 ${
      state.isFocused
        ? "border-blue-500 ring-1 ring-blue-500 dark:border-blue-400"
        : "border-slate-200 dark:border-gray-700"
    }`,
  valueContainer: () => "px-4 py-2.5",
  singleValue: () => "text-slate-900 dark:text-gray-100",
  input: () => "text-slate-900 dark:text-gray-100",
  placeholder: () => "text-slate-500 dark:text-gray-400",
  indicatorsContainer: () => "pr-3 text-slate-500 dark:text-gray-500",
  indicatorSeparator: () => "hidden",
  menu: () =>
    "z-[60] mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800",
  menuList: () => "max-h-56 overflow-y-auto py-1",
  option: (state) =>
    `cursor-pointer px-4 py-2 text-sm ${
      state.isSelected
        ? "bg-blue-600 text-white"
        : state.isFocused
          ? "bg-blue-50 text-slate-900 dark:bg-gray-700 dark:text-gray-100"
          : "text-slate-900 dark:text-gray-100"
    }`,
  noOptionsMessage: () => "px-4 py-2 text-sm text-slate-500 dark:text-gray-500",
  loadingMessage: () => "px-4 py-2 text-sm text-slate-500 dark:text-gray-500",
};

export default function SelectField({ id, options, value, onChange, isLoading }: SelectFieldProps) {
  return (
    <Select<SelectOption, false>
      inputId={id}
      unstyled
      classNames={classNames}
      options={options}
      value={value}
      onChange={onChange}
      isLoading={isLoading}
      loadingMessage={() => "Carregando…"}
      noOptionsMessage={() => "Nenhuma opção"}
      menuPortalTarget={document.body}
      styles={{ menuPortal: (base) => ({ ...base, zIndex: 60 }) }}
    />
  );
}
