import React, { Component } from "react";
import { DateTime, Interval } from "luxon";
import api from "./api";

import Hour from "./Hour";

import "../css/Calendar.css";
import BEM from "./BEM";
const b = BEM("Calendar");

class Calendar extends Component {
  constructor(props) {
    super(props);

    // const from = DateTime.local(2017, 12, 28);
    const from = DateTime.local().set({
      hours: 0,
      minutes: 0,
      seconds: 0,
      millisecond: 0
    });
    const to = DateTime.local(2018, 1, 18);

    const interval = Interval.fromDateTimes(from, to).splitBy({ days: 1 });
    this.state = {
      from,
      to,
      interval,
      schedule: [],
      students: []
    };
    this.getData();
  }
  async getData() {
    const [students, schedule] = await Promise.all([
      api.getStudents(),
      api.getSchedule()
    ]);

    this.setState({ students, schedule });
  }

  render() {
    const { interval} = this.state;

    return (
      <div>
        {interval.map(this.renderDay.bind(this))}
      </div>
    );
  }

  changeSchedule(hour, user) {
    const { schedule } = this.state;
    let newSchedule;

    if (!user) {
      newSchedule = schedule.filter(({ time }) => !time.overlaps(hour));
    } else {
      let existedEvent = schedule.find(({ time }) => time.overlaps(hour));

      if (user && existedEvent) {
        newSchedule = schedule.filter(({ time }) => !time.overlaps(hour));
        newSchedule.push(
          Object.assign(existedEvent, { studentId: user.value })
        );
      } else {
        newSchedule = [
          ...schedule,
          {
            studentId: user.value,
            time: hour
          }
        ];
      }
    }
    this.props.onScheduleChange (newSchedule);
    this.setState({ schedule: newSchedule });
  }
  renderDay(day, i) {
    const { start } = day;
    const { schedule, students } = this.state;
    const {edit} = this.props;
    const workDay = Interval.after(start.set({ hour: 10 }), {
      hours: 8
    }).splitBy({ hour: 1 });

    const isWeekend =
      start.weekdayShort === "Sat" || start.weekdayShort === "Sun";

    const isHoliday = this.holidays.some(holiday => holiday.equals(day));

    return (
      <time key={i} className={b("day", { weekend: isWeekend || isHoliday })}>
        <span className={b("title")}>
          {start.toLocaleString(this.TIME_FORMATTER)}
        </span>
        {!isWeekend &&
          !isHoliday &&
          workDay.map(hour => (
            <Hour
              edit={edit}
              key={hour}
              onChange={this.changeSchedule.bind(this, hour)}
              {...{ hour, schedule, students }}
            />
          ))}
      </time>
    );
  }

  TIME_FORMATTER = {
    weekday: "short",
    day: "numeric",
    month: "short"
  };

  holidays = [
    Interval.after(DateTime.local(2018, 1, 6), { day: 1 }),
    Interval.after(DateTime.local(2018, 1, 7), { day: 1 }),
    Interval.after(DateTime.local(2018, 1, 14), { day: 1 })
  ];
}
export default Calendar;
