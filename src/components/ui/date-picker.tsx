import React from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { cn } from "@/lib/utils"; // Adjust the path to your utility functions if necessary

export interface DatePickerProps {
    selected: Date | null;
    onChange: (date: Date | null) => void;
    placeholderText?: string;
    dateFormat?: string;
    className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
    selected,
    onChange,
    placeholderText = "Select a date",
    dateFormat = "yyyy-MM-dd",
    className,
}) => {
    return (
        <ReactDatePicker
            selected={selected}
            onChange={onChange}
            placeholderText={placeholderText}
            dateFormat={dateFormat}
            className={cn("border p-2 rounded-md", className)}
        />
    );
};
