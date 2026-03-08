type AdminPropertyRadioGroupProps = {
  label: string;
  name: string;
  value: string | boolean;
  options: string[];
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  variant?: 'basic' | 'pill';
};

export default function AdminPropertyRadioGroup({
  label,
  name,
  value,
  options,
  onChange,
  required = false,
  variant = 'basic',
}: AdminPropertyRadioGroupProps) {
  const isPillVariant = variant === 'pill';

  return (
    <div>
      <label
        className={
          isPillVariant
            ? 'block text-sm font-medium text-gray-700 mb-3'
            : 'block text-sm text-gray-700 mb-3'
        }
      >
        {label}{' '}
        {required &&
          (isPillVariant ? <span className="text-red-500">*</span> : '*')}
      </label>

      <div className={isPillVariant ? 'flex flex-wrap gap-3' : 'flex gap-6'}>
        {options.map((option) => {
          const normalizedOption = option.toLowerCase();
          const optionValue =
            normalizedOption === 'yes'
              ? 'true'
              : normalizedOption === 'no'
                ? 'false'
                : option;

          const isChecked =
            typeof value === 'boolean'
              ? normalizedOption === 'yes'
                ? value === true
                : value === false
              : String(value) === option;

          return (
            <label
              key={option}
              className={
                isPillVariant
                  ? `flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-green-50 border-green-600 text-green-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-green-400'
                    }`
                  : 'flex items-center gap-2 cursor-pointer'
              }
            >
              <input
                type="radio"
                name={name}
                value={optionValue}
                checked={isChecked}
                onChange={onChange}
                required={required}
                className={
                  isPillVariant
                    ? 'text-green-600 focus:ring-green-500'
                    : 'w-4 h-4'
                }
              />
              <span className={isPillVariant ? 'font-medium' : 'text-gray-700'}>
                {option}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
