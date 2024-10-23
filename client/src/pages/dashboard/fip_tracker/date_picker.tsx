import { Button, Flex, Separator, Text } from "@radix-ui/themes"
import {
  Calendar,
  CalendarDay,
  CalendarDayProps,
  CalendarDays,
  CalendarProps,
} from "calendar-blocks"
import React, { ReactNode, useState } from "react"
import { TbArrowLeft, TbArrowRight } from "react-icons/tb"

export type DateRange = {
  start: Date | null
  end: Date | null
}

const SimpleCalendar = ({
  children,
  ...calendarProps
}: {
  children: ReactNode
} & CalendarProps) => {
  return (
    <Calendar
      {...calendarProps}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 32px)",
        gridAutoRows: "32px",
        overflow: "hidden",
        gridGap: "3px",
      }}
    >
      {children}
    </Calendar>
  )
}

const SimpleDay = ({ ...calendarDayProps }: CalendarDayProps) => {
  return <CalendarDay {...calendarDayProps} className="calendar-day-button " />
}

const DayLabels = () => {
  return (
    <>
      {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
        <Flex key={index} justify="center" align="center">
          <Text weight="bold">{day}</Text>
        </Flex>
      ))}
    </>
  )
}

const now = new Date()

export const DatePicker = ({
  rangeValue,
  onRangeValueChange,
}: {
  rangeValue: DateRange
  onRangeValueChange: (newRange: DateRange) => void
}) => {
  const [viewInfo, setViewInfo] = useState<{
    month: number
    year: number
  }>({
    month: now.getMonth(),
    year: now.getFullYear(),
  })
  const { month, year } = viewInfo

  const [] = useState<DateRange>({
    start: null,
    end: null,
  })

  const monthLabel = new Date(year, month).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  })

  return (
    <Flex direction="column" gap="2">
      <Flex direction="row" align="center" gap="2">
        <Button variant="outline" onClick={() => setViewInfo({ month: month - 1, year })}>
          <TbArrowLeft />
        </Button>
        <div style={{ flexGrow: "1" }}></div>
        {monthLabel}
        <div style={{ flexGrow: "1" }}></div>
        <Button variant="outline" onClick={() => setViewInfo({ month: month + 1, year })}>
          <TbArrowRight />
        </Button>
      </Flex>
      <SimpleCalendar
        displayMonth={month}
        displayYear={year}
        onDisplayChange={setViewInfo}
        rangeValue={rangeValue}
        onRangeChange={onRangeValueChange}
      >
        <DayLabels />
        <CalendarDays>{(value) => <SimpleDay value={value} key={value.key} />}</CalendarDays>
      </SimpleCalendar>

      {rangeValue.start && rangeValue.end && (
        <>
          <Separator size="4" />

          <Text>
            {rangeValue.start ? rangeValue.start.toLocaleDateString() : ""} to{" "}
            {rangeValue.end ? rangeValue.end.toLocaleDateString() : ""}
          </Text>

          <Button
            color="red"
            variant="soft"
            onClick={(e) => {
              onRangeValueChange({ start: null, end: null })
              // @ts-expect-error - blur is a valid method
              e.target.blur()
            }}
          >
            Clear
          </Button>
        </>
      )}
    </Flex>
  )
}
