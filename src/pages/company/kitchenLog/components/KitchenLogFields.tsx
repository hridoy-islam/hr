import { AlertTriangle, Clock, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  EQUIPMENT_TEMPERATURE_FIELDS,
  isTemperatureOutOfRange,
  KITCHEN_CLEANING_DISCLAIMER,
  KITCHEN_CLEANING_READINGS,
  KITCHEN_SHIFTS,
  KitchenModule,
  KitchenShift,
  PROBE_BOILING_WATER_RANGE,
  PROBE_CALIBRATION_NOTE,
  PROBE_ICED_WATER_RANGE
} from '../constants';
import {
  formatTime,
  KitchenFieldValues,
  nowTime,
  TIME_PATTERN,
  typeTime
} from '../shared';

interface KitchenLogFieldsProps {
  module: KitchenModule;
  shift?: KitchenShift;
  values: KitchenFieldValues;
  onChange: (values: KitchenFieldValues) => void;
  disabled?: boolean;
  // Marks the checks still unticked after a finish was tried
  highlightUnticked?: boolean;
}

const outside = (value: string, range: { min: number; max: number }) =>
  value !== '' && (Number(value) < range.min || Number(value) > range.max);

export const ProbeCalibrationNote = () => (
  <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-black sm:text-sm">
    <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
    <div>
      <p className="font-semibold">NOTE:</p>
      {PROBE_CALIBRATION_NOTE.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  </div>
);

// The inputs each module is filled in with, laid out like its paper sheet
export function KitchenLogFields({
  module,
  shift,
  values,
  onChange,
  disabled,
  highlightUnticked
}: KitchenLogFieldsProps) {
  const set = (patch: Partial<KitchenFieldValues>) =>
    onChange({ ...values, ...patch });

  const noteField = (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-black">Note</p>
      <Textarea
        value={values.note}
        disabled={disabled}
        onChange={(e) => set({ note: e.target.value })}
        placeholder="Anything management should know..."
        rows={3}
      />
    </div>
  );

  if (module === 'kitchen_cleaning') {
    const config = shift ? KITCHEN_SHIFTS[shift] : null;
    const checklist = config?.checklist || [];
    const done = checklist.filter((item) => values.checklist[item.key]).length;

    return (
      <div className="space-y-4">
        {config && (
          <div
            id="kitchen-checklist"
            className={cn(
              'space-y-2 rounded-xl border p-3 sm:p-4',
              highlightUnticked && done < checklist.length
                ? 'border-red-300'
                : 'border-gray-200'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-black">
                {config.checklistTitle}
              </p>
              <span
                className={cn(
                  'text-xs font-semibold',
                  highlightUnticked && done < checklist.length
                    ? 'text-red-600'
                    : 'text-black'
                )}
              >
                {done} of {checklist.length} checked
              </span>
            </div>
            {highlightUnticked && done < checklist.length && (
              <p className="text-xs font-medium text-red-600">
                Every check is required. Tick the ones marked in red to finish.
              </p>
            )}
            <div className="space-y-1">
              {checklist.map((item) => (
                <label
                  key={item.key}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-2 transition-colors hover:bg-gray-50',
                    values.checklist[item.key] && 'bg-emerald-50/60',
                    highlightUnticked &&
                      !values.checklist[item.key] &&
                      'border-red-300 bg-red-50 hover:bg-red-50'
                  )}
                >
                  <Checkbox
                    className="mt-0.5"
                    disabled={disabled}
                    checked={Boolean(values.checklist[item.key])}
                    onCheckedChange={(checked) =>
                      set({
                        checklist: {
                          ...values.checklist,
                          [item.key]: Boolean(checked)
                        }
                      })
                    }
                  />
                  <span className="text-sm text-black">
                    {item.label}
                    {highlightUnticked && !values.checklist[item.key] && (
                      <span className="ml-1.5 text-xs font-semibold text-red-600">
                        Required
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200">
          <div className="grid grid-cols-[minmax(120px,1fr)_2fr] bg-gray-100 text-sm font-bold text-black">
            <span className="border-r border-gray-200 px-3 py-2">
              Kitchen Probe
            </span>
            <span className="px-3 py-2">Note</span>
          </div>
          {KITCHEN_CLEANING_READINGS.map((reading) => (
            <div
              key={reading.key}
              className="grid grid-cols-[minmax(120px,1fr)_2fr] border-t border-gray-200"
            >
              <span className="border-r border-gray-200 px-3 py-2 text-sm font-medium text-black">
                {reading.label}
              </span>
              <div className="p-1.5">
                <Input
                  value={values.readings[reading.key] || ''}
                  disabled={disabled}
                  onChange={(e) =>
                    set({
                      readings: {
                        ...values.readings,
                        [reading.key]: e.target.value
                      }
                    })
                  }
                  placeholder="e.g. 4°C / checked"
                  className="h-9"
                />
              </div>
            </div>
          ))}
        </div>

        {noteField}

        <p className="text-xs italic text-black">
          {KITCHEN_CLEANING_DISCLAIMER}
        </p>
      </div>
    );
  }

  if (module === 'equipment_temperature') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {EQUIPMENT_TEMPERATURE_FIELDS.map((field) => {
            const value = values.temperatures[field.key];
            const temperature =
              value.temperature === '' ? undefined : Number(value.temperature);
            const flagged = isTemperatureOutOfRange(field, temperature);
            const timeInvalid =
              value.time.length === 5 && !TIME_PATTERN.test(value.time);
            const update = (patch: Partial<typeof value>) =>
              set({
                temperatures: {
                  ...values.temperatures,
                  [field.key]: { ...value, ...patch }
                }
              });

            return (
              <div
                key={field.key}
                className={cn(
                  'space-y-3 rounded-xl border-2 p-3',
                  flagged ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
                )}
              >
                <div>
                  <p className="text-base font-bold text-black">
                    {field.label}{' '}
                    <span className="text-sm font-semibold">
                      ({field.range})
                    </span>
                  </p>
                  <p className="text-xs text-black">{field.instruction}</p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-black">
                    Time (HH:MM)*
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={value.time}
                      placeholder="09:00"
                      maxLength={5}
                      inputMode="numeric"
                      disabled={disabled}
                      onChange={(e) =>
                        update({ time: typeTime(value.time, e.target.value) })
                      }
                      onBlur={() => update({ time: formatTime(value.time) })}
                      className={cn(
                        'h-10 font-mono',
                        timeInvalid && 'border-red-500'
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 shrink-0"
                      disabled={disabled}
                      onClick={() => update({ time: nowTime() })}
                    >
                      <Clock className="mr-1 h-4 w-4" /> Now
                    </Button>
                  </div>
                  {timeInvalid && (
                    <p className="text-xs font-medium text-red-500">
                      Time is invalid (HH:MM)
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-black">
                    Temperature (°C)*
                  </p>
                  <Input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    value={value.temperature}
                    disabled={disabled}
                    onChange={(e) => update({ temperature: e.target.value })}
                    placeholder="e.g. 4"
                    className="h-10"
                  />
                </div>
              </div>
            );
          })}
        </div>
        {noteField}
      </div>
    );
  }

  if (module === 'probe_calibration') {
    const icedOut = outside(values.icedWaterReading, PROBE_ICED_WATER_RANGE);
    const boilingOut = outside(
      values.boilingWaterReading,
      PROBE_BOILING_WATER_RANGE
    );

    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-black">
            Probe Thermometer Details
          </p>
          <Input
            value={values.probeDetails}
            disabled={disabled}
            onChange={(e) => set({ probeDetails: e.target.value })}
            placeholder="e.g. make, model or serial number"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              label: 'Thermometer Reading Iced Water (°C)*',
              value: values.icedWaterReading,
              out: icedOut,
              onChange: (value: string) => set({ icedWaterReading: value })
            },
            {
              label: 'Thermometer Reading Boiling Water (°C)*',
              value: values.boilingWaterReading,
              out: boilingOut,
              onChange: (value: string) => set({ boilingWaterReading: value })
            }
          ].map((field) => (
            <div key={field.label} className="space-y-1.5">
              <p className="text-sm font-semibold text-black">{field.label}</p>
              <Input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={field.value}
                disabled={disabled}
                onChange={(e) => field.onChange(e.target.value)}
                className={cn('h-10', field.out && 'border-red-400')}
              />
              {field.out && (
                <p className="flex items-center gap-1 text-xs font-semibold text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5" /> Outside the safe
                  range
                </p>
              )}
            </div>
          ))}
        </div>
        <ProbeCalibrationNote />
        {noteField}
      </div>
    );
  }

  // The deep cleans only take a note on top of the signature
  return noteField;
}
