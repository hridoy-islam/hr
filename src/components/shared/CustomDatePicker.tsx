import { format, getMonth, getYear } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface CustomDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
  placeholder?: string;
     futureDate?: boolean;
}

export function CustomDatePicker({
  selected,
  onChange,
  disabled ,
  placeholder = 'Select date',
  futureDate = true 

}: CustomDatePickerProps) {
  const years = Array.from(
    { length: 100 },
    (_, i) => new Date().getFullYear() - i
  );
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];

  return (
    <div className="relative z-[1000] w-full">
      <DatePicker
        selected={selected}
        onChange={onChange}
        dateFormat="MM/dd/yyyy"
        disabled={disabled}
        popperClassName="z-[1001]"
        maxDate={futureDate ? new Date(): undefined  }
        portalId="root-portal"
        className="w-full"
        wrapperClassName="w-full block"
        customInput={
          <input
            type="text"
            readOnly
            placeholder={placeholder}
            disabled={disabled}
            value={selected ? format(selected, 'yyyy-MM-dd') : 'Select date'}
            className="w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
        }
        renderCustomHeader={({
          date,
          changeYear,
          changeMonth,
          decreaseMonth,
          increaseMonth,
          prevMonthButtonDisabled,
          nextMonthButtonDisabled
        }) => (
          <div className="m-2 flex justify-center gap-2">
            <button
              type="button"
              onClick={decreaseMonth}
              disabled={prevMonthButtonDisabled}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 transition hover:bg-gray-300 disabled:opacity-50"
            >
              {'❮'}
            </button>

            <select
              value={getYear(date)}
              onChange={(e) => changeYear(Number(e.target.value))}
              className="rounded border px-2 py-1"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <select
              value={months[getMonth(date)]}
              onChange={(e) => changeMonth(months.indexOf(e.target.value))}
              className="rounded border px-2 py-1"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={increaseMonth}
              disabled={nextMonthButtonDisabled}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 transition hover:bg-gray-300 disabled:opacity-50"
            >
              {'❯'}
            </button>
          </div>
        )}
      />
    </div>
  );
}
