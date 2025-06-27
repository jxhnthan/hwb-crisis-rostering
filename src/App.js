import React, { useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import html2canvas from 'html2canvas';

// Define therapist names
const therapists = [
  "Dominic Yeo", "Kirsty Png", "Soon Jiaying",
  "Andrew Lim", "Janice Leong", "Oliver Tan",
  "Claudia Ahl", "Seanna Neo", "Xiao Hui", "Tika Zainal"
];

// --- Blocked Days for Each Year ---
// Blocked days for 2025 (in YYYY-MM-DD format)
const blockedDays2025 = [
  "2025-1-1", "2025-1-29", "2025-1-30",
  "2025-3-31", "2025-4-18", "2025-5-1",
  "2025-5-12", "2025-6-7", "2025-8-9",
  "2025-3-28", "2025-10-25", "2025-10-20",
  "2025-10-21", "2025-12-25"
];

// Blocked days for 2026 (public holidays, with observed days for Sundays)
const blockedDays2026 = [
  "2026-1-1",   // New Year’s Day
  "2026-2-17",  // Chinese New Year
  "2026-2-18",  // Chinese New Year
  "2026-3-21",  // Hari Raya Puasa
  "2026-4-3",   // Good Friday
  "2026-5-1",   // Labour Day
  "2026-5-27",  // Hari Raya Haji
  "2026-5-31",  // Vesak Day
  "2026-6-1",   // Vesak Day (Observed - since May 31 is a Sunday)
  "2026-8-9",   // National Day
  "2026-8-10",  // National Day (Observed - since Aug 9 is a Sunday)
  "2026-11-8",  // Deepavali
  "2026-11-9",  // Deepavali (Observed - since Nov 8 is a Sunday)
  "2026-12-25"  // Christmas Day
];

// --- Helper Functions for Calendar Generation ---
// Helper function to get the number of days in a month for a given year
const getDaysInMonth = (year, monthIndex) => {
  // monthIndex is 0-indexed, so new Date(year, monthIndex + 1, 0) gets the last day of the month
  return new Date(year, monthIndex + 1, 0).getDate();
};

// Helper function to get the dates for a given year with unique keys
const getCalendarForYear = (year) => {
  const calendar = [];
  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const daysInMonth = getDaysInMonth(year, monthIndex);
    const monthDays = Array.from({ length: daysInMonth }, (_, dayIndex) => {
      const date = new Date(year, monthIndex, dayIndex + 1);
      // Ensure month and day are two digits for dayKey consistency
      const formattedMonth = String(monthIndex + 1).padStart(2, '0');
      const formattedDay = String(dayIndex + 1).padStart(2, '0');
      const dayKey = `${year}-${formattedMonth}-${formattedDay}`; // Unique day identifier (YYYY-MM-DD)
      return {
        date,
        dayKey,
        therapists: []
      };
    });
    calendar.push(monthDays);
  }
  return calendar;
};


// --- Therapist Component (No changes needed) ---
const Therapist = ({ name }) => {
  const [, drag] = useDrag(() => ({
    type: 'THERAPIST',
    item: { name },
  }));

  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <div
      ref={drag}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        margin: '6px 0',
        backgroundColor: '#E0F7FA',
        borderRadius: '999px',
        fontWeight: '500',
        color: '#00796B',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
        cursor: 'grab',
        transition: 'background 0.2s, transform 0.1s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#B2EBF2')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E0F7FA')}
    >
      <div
        style={{
          backgroundColor: '#00796B',
          color: 'white',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.8rem',
        }}
      >
        {initials}
      </div>
      <span>{name}</span>
    </div>
  );
};

// --- Calendar Day (Drop Zone) Component ---
// This component now receives 'blockedDaysForYear' dynamically
const CalendarDay = ({ day, moveTherapist, removeTherapist, isToday, isBlocked }) => {
  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
  const finalBlockedStatus = isBlocked || isWeekend; // Combines explicitly blocked days and weekends

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'THERAPIST',
    drop: (item) => {
      if (!finalBlockedStatus) {
        moveTherapist(item.name, day.dayKey);
      }
    },
    canDrop: () => !finalBlockedStatus, // Prevent dropping on blocked days
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  const dayNumber = day.date.getDate();

  let backgroundColor = '#FFFFFF'; // Default background
  let dayNumberColor = '#4A5568'; // Slightly muted day number

  if (finalBlockedStatus) {
    backgroundColor = '#F7FAFC'; // Very light grey for blocked/weekend
    dayNumberColor = '#A0AEC0';
  }
  if (isToday) {
    backgroundColor = '#E6FFFA'; // Light teal for today
    dayNumberColor = '#2C7A7B';    // Stronger teal for today's number
  }

  // Style for when a therapist is being dragged over a droppable day
  if (isOver && canDrop) {
    backgroundColor = '#B2F5EA'; // Highlight when draggable is over
  }

  return (
    <div
      ref={drop}
      style={{
        padding: '12px',
        minHeight: '160px',
        position: 'relative',
        backgroundColor: backgroundColor,
        borderRadius: '6px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        border: `1px solid ${isToday ? '#4FD1C5' : '#E2E8F0'}`,
        transition: 'background-color 0.2s ease-in-out',
      }}
    >
      <strong
        style={{
          alignSelf: 'flex-end',
          fontSize: '0.9rem',
          color: dayNumberColor,
          backgroundColor: isToday ? '#B2F5EA' : 'transparent',
          borderRadius: isToday ? '50%' : '0',
          padding: isToday ? '3px 8px' : '0',
          lineHeight: '1',
        }}
      >
        {dayNumber}
      </strong>

      {day.therapists.length > 0 ? (
        day.therapists.map((therapist, idx) => {
          const initials = therapist
            .split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase();
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                backgroundColor: '#E6FFFA',
                color: '#234E52',
                borderRadius: '8px',
                justifyContent: 'space-between',
                fontWeight: '600',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}
            >
              <div
                style={{
                  backgroundColor: '#00796B',
                  color: 'white',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <span style={{ fontSize: '1.05rem', flexGrow: 1 }}>{therapist}</span>
              <button
                onClick={() => removeTherapist(therapist, day.dayKey)}
                style={{
                  marginLeft: '10px',
                  color: '#E53E3E',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 'none',
                  fontWeight: 'bold',
                  padding: '2px',
                  lineHeight: '1',
                  fontSize: '1.2rem',
                }}
                title={`Remove ${therapist}`}
              >
                ×
              </button>
            </div>
          );
        })
      ) : (
        !finalBlockedStatus && (
          <div style={{
            fontSize: '0.85rem',
            color: '#A0AEC0',
            textAlign: 'center',
            marginTop: 'auto',
            marginBottom: 'auto'
          }}>
            Empty
          </div>
        )
      )}
      {finalBlockedStatus && !isToday && (
        <div style={{
          fontSize: '0.8rem',
          color: '#718096',
          textAlign: 'center',
          marginTop: 'auto',
          marginBottom: 'auto'
        }}>
          {isWeekend && !isBlocked ? 'Weekend' : 'Blocked'}
        </div>
      )}
    </div>
  );
};

// --- Calendar Grid Component ---
// This component now receives 'blockedDaysForYear' dynamically
const Calendar = ({ monthDays, moveTherapist, removeTherapist, todayDate, blockedDaysForYear }) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get the first day of the month to determine padding needed for the grid
  const firstDayOfMonth = monthDays.length > 0 ? monthDays[0].date.getDay() : 0;

  return (
    <>
      {/* Day of Week Headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px',
        marginTop: '20px',
        marginBottom: '8px',
        fontWeight: '600',
        color: '#4A5568',
        textAlign: 'center',
      }}>
        {daysOfWeek.map(dayName => <div key={dayName}>{dayName}</div>)}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px',
      }}>
        {/* Add empty divs for padding if the month doesn't start on Sunday */}
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} style={{
            backgroundColor: '#F7FAFC',
            borderRadius: '6px',
            minHeight: '160px',
          }} />
        ))}
        {monthDays.map((day) => {
          const isToday = todayDate && day.date.toDateString() === todayDate.toDateString();
          // Use the dynamic blockedDaysForYear passed as a prop
          const isBlocked = blockedDaysForYear.includes(day.dayKey);
          return (
            <CalendarDay
              key={day.dayKey}
              day={day}
              moveTherapist={moveTherapist}
              removeTherapist={removeTherapist}
              isToday={isToday}
              isBlocked={isBlocked}
            />
          );
        })}
      </div>
    </>
  );
};

// --- Main App Component ---
const App = () => {
  // State for the currently displayed year, defaults to current actual year
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  // State for the currently displayed month (0-indexed)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  // State to hold calendar data for all years you want to support
  // Initialized with data for 2025 and 2026
  const [calendarData, setCalendarData] = useState(() => ({
    2025: getCalendarForYear(2025),
    2026: getCalendarForYear(2026),
  }));

  const [todayDate, setTodayDate] = useState(null); // Used for "Today" highlight
  const [autoRosterTriggered, setAutoRosterTriggered] = useState(false); // No change needed here

  // Working From Home data, no change needed for 2026 functionality
  const [workingFromHome, setWorkingFromHome] = useState(
    {
      "Dominic Yeo": { Monday: false, Tuesday: true, Wednesday: true, Thursday: true, Friday: false },
      "Kirsty Png": { Monday: false, Tuesday: false, Wednesday: true, Thursday: false, Friday: false },
      "Soon Jiaying": { Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: true },
      "Andrew Lim": { Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: true },
      "Janice Leong": { Monday: false, Tuesday: false, Wednesday: true, Thursday: false, Friday: false },
      "Oliver Tan": { Monday: false, Tuesday: true, Wednesday: false, Thursday: false, Friday: false },
      "Claudia Ahl": { Monday: false, Tuesday: false, Wednesday: false, Thursday: true, Friday: false },
      "Seanna Neo": { Monday: false, Tuesday: true, Wednesday: false, Thursday: false, Friday: false },
      "Xiao Hui": { Monday: false, Tuesday: false, Wednesday: false, Thursday: true, Friday: false },
      "Tika Zainal": { Monday: false, Tuesday: true, Wednesday: true, Thursday: true, Friday: false },
    }
  );

  // Determine which blocked days array to use based on the currentYear state
  const currentBlockedDays = currentYear === 2025 ? blockedDays2025 : blockedDays2026;

  // Calculate assignment counts for the *currently displayed month and year*
  const assignmentCounts = therapists.reduce((acc, therapist) => {
    acc[therapist] = calendarData[currentYear][currentMonth].filter((day) =>
      day.therapists.includes(therapist)
    ).length;
    return acc;
  }, {});

  const actualCurrentDate = new Date();
  const actualCurrentDay = actualCurrentDate.getDate();
  const actualCurrentMonthIndex = actualCurrentDate.getMonth();
  const actualCurrentYear = actualCurrentDate.getFullYear();

  // Effect to manage 'today' highlight and month display when year changes
  useEffect(() => {
    // Clear "today" highlight when switching years
    setTodayDate(null);
    // If the selected year is the actual current year, jump to the current month and highlight today
    if (currentYear === actualCurrentYear) {
      setCurrentMonth(actualCurrentMonthIndex);
      setTodayDate(new Date(actualCurrentYear, actualCurrentMonthIndex, actualCurrentDay));
    } else {
      // If switching to a historical/future year, default to January (0)
      // You can adjust this to keep the same month index if preferred
      setCurrentMonth(0);
    }
  }, [currentYear, actualCurrentYear, actualCurrentMonthIndex, actualCurrentDay]); // Dependencies

  const goToToday = () => {
    // Only go to 'Today' if the selected year matches the actual current year
    if (currentYear === actualCurrentYear) {
      setCurrentMonth(actualCurrentMonthIndex);
      setTodayDate(new Date(actualCurrentYear, actualCurrentMonthIndex, actualCurrentDay));
    } else {
      alert("Cannot go to 'Today' in a different year. Please switch to the current year.");
    }
  };

  const moveTherapist = (name, dayKey) => {
    setCalendarData((prevCalendarData) => {
      // Get a mutable copy of the current year's calendar
      const yearCalendar = [...prevCalendarData[currentYear]];
      // Map over the current month's days for the current year
      const updatedMonth = yearCalendar[currentMonth].map((day) => {
        // Ensure we use 'currentBlockedDays' for the current year
        if (day.dayKey === dayKey && !currentBlockedDays.includes(dayKey) && !day.therapists.includes(name)) {
          const dateObj = new Date(day.dayKey.split('-')[0], day.dayKey.split('-')[1] - 1, day.dayKey.split('-')[2]);
          const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
          if (!isWeekend) {
            return { ...day, therapists: [...day.therapists, name] };
          }
        }
        return day;
      });

      // Update the specific month in the current year's calendar
      yearCalendar[currentMonth] = updatedMonth;

      // Return the updated calendarData object with the modified year
      return {
        ...prevCalendarData,
        [currentYear]: yearCalendar,
      };
    });
  };

  const removeTherapist = (name, dayKey) => {
    setCalendarData((prevCalendarData) => {
      const yearCalendar = [...prevCalendarData[currentYear]];
      const updatedMonth = yearCalendar[currentMonth].map((day) => {
        if (day.dayKey === dayKey) {
          return { ...day, therapists: day.therapists.filter((t) => t !== name) };
        }
        return day;
      });

      yearCalendar[currentMonth] = updatedMonth;
      return {
        ...prevCalendarData,
        [currentYear]: yearCalendar,
      };
    });
  };

  const resetCalendar = () => {
    // Reset only the currently selected year's calendar
    setCalendarData((prevCalendarData) => ({
      ...prevCalendarData,
      [currentYear]: getCalendarForYear(currentYear), // Re-generate calendar for current year
    }));
    setAutoRosterTriggered(false);
  };

  const saveAsPNG = () => {
    const calendarContainer = document.getElementById("calendar-container-content");
    if (!calendarContainer) {
      console.error("Calendar container content not found for PNG export.");
      return;
    }
    html2canvas(calendarContainer, {
      backgroundColor: "#FFFFFF",
      useCORS: true,
      scale: 2
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const currentMonthName = calendarData[currentYear][currentMonth][0].date.toLocaleString("default", { month: "long" });
      // Include the current year in the downloaded filename
      link.href = imgData;
      link.download = `Therapist_Roster_${currentMonthName}_${currentYear}.png`;
      link.click();
    }).catch((error) => {
      console.error("Error generating PNG:", error);
    });
  };

  const autoRoster = () => {
    setCalendarData((prevCalendarData) => {
      const updatedCalendarData = { ...prevCalendarData }; // Copy the entire calendarData object
      const currentYearCalendar = [...updatedCalendarData[currentYear]]; // Get a mutable copy of the current year's calendar
      const currentMonthData = [...currentYearCalendar[currentMonth]]; // Get a mutable copy of the current month's data

      const monthlyAssignmentCounts = therapists.reduce((acc, t) => ({ ...acc, [t]: 0 }), {});

      let totalPossibleSlots = 0;
      currentMonthData.forEach(day => {
        const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
        // Use currentBlockedDays to check for blocked status
        if (!currentBlockedDays.includes(day.dayKey) && !isWeekend) {
          totalPossibleSlots++;
        }
      });
      const targetAverageShifts = Math.max(1, totalPossibleSlots / therapists.length);
      const LAGGING_THRESHOLD = 2;

      let therapistConsiderationOrder = [...therapists].sort(() => Math.random() - 0.5);

      const newMonthDays = currentMonthData.map((day) => {
        const newDay = { ...day, therapists: [...day.therapists] };
        const isWeekend = newDay.date.getDay() === 0 || newDay.date.getDay() === 6;
        const dayOfWeek = newDay.date.toLocaleString('default', { weekday: 'long' });

        if (
          newDay.therapists.length === 0 &&
          !currentBlockedDays.includes(newDay.dayKey) && // Use currentBlockedDays
          !isWeekend
        ) {
          let assignedThisDay = false;

          const availableToday = therapistConsiderationOrder.filter(
            (t) => !workingFromHome[t]?.[dayOfWeek]
          );

          if (availableToday.length > 0) {
            availableToday.sort((a, b) => monthlyAssignmentCounts[a] - monthlyAssignmentCounts[b]);

            const currentAssignedValues = Object.values(monthlyAssignmentCounts).filter(c => c > 0);
            const currentAverage = currentAssignedValues.length > 0
              ? currentAssignedValues.reduce((sum, val) => sum + val, 0) / currentAssignedValues.length
              : 0;

            let therapistToAssign = null;

            const laggingAndAvailable = availableToday.filter(
              (t) => monthlyAssignmentCounts[t] < Math.max(1, currentAverage - LAGGING_THRESHOLD / 2) ||
                monthlyAssignmentCounts[t] < Math.max(1, targetAverageShifts - LAGGING_THRESHOLD)
            );

            laggingAndAvailable.sort((a, b) => monthlyAssignmentCounts[a] - monthlyAssignmentCounts[b]);

            if (laggingAndAvailable.length > 0) {
              therapistToAssign = laggingAndAvailable[0];
            } else {
              if (availableToday.length > 0) {
                therapistToAssign = availableToday[0];
              }
            }

            if (therapistToAssign) {
              newDay.therapists = [therapistToAssign];
              monthlyAssignmentCounts[therapistToAssign]++;
              assignedThisDay = true;

              therapistConsiderationOrder = [
                ...therapistConsiderationOrder.filter(t => t !== therapistToAssign),
                therapistToAssign
              ];
            }
          }
        }
        return newDay;
      });

      // Update the specific month within the current year's calendar
      currentYearCalendar[currentMonth] = newMonthDays;
      // Update the current year's calendar within the overall calendarData
      updatedCalendarData[currentYear] = currentYearCalendar;
      return updatedCalendarData; // Return the entire updated state object
    });
    setAutoRosterTriggered(true);
  };

  const buttonStyle = {
    padding: '10px 18px',
    background: '#FFFFFF',
    color: '#4A5568',
    border: '1px solid #CBD5E0',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.2s, box-shadow 0.2s',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  };

  const changeMonth = (direction) => {
    setCurrentMonth((prevMonth) => {
      let newMonth = prevMonth;
      if (direction === 'next') {
        newMonth = (prevMonth + 1) % 12;
      } else if (direction === 'prev') {
        newMonth = (prevMonth - 1 + 12) % 12;
      }
      setTodayDate(null); // Clear "today" highlight when changing months
      return newMonth;
    });
  };

  // Style for the WFH table and Assignment Tracker cards for consistency
  const cardStyle = {
    backgroundColor: '#FFFFFF',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    marginBottom: '20px',
  };
  const tableCellStyle = { border: '1px solid #E2E8F0', padding: '8px', textAlign: 'center' };
  const tableHeaderStyle = { ...tableCellStyle, backgroundColor: '#F7FAFC', fontWeight: '600', color: '#4A5568' };


  return (
    <DndProvider backend={HTML5Backend}>
      {/* 1. Overall Page Styling */}
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
        padding: '20px',
        backgroundColor: '#F9FAFB',
        minHeight: '100vh',
      }}>
        {/* 2. Main Content Wrapper (Flex Container) */}
        <div style={{
          display: 'flex',
          gap: '30px',
          maxWidth: '1800px',
          margin: '0 auto',
        }}>

          {/* 3. Sidebar Area */}
          <div style={{
            flex: '0 0 400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, marginBottom: '15px', color: '#1A202C', fontSize: '1.25rem' }}>Therapists</h2>
              {therapists.map((name, index) => (
                <Therapist key={index} name={name} />
              ))}
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#2D3748', fontSize: '1.1rem' }}>Set Working from Home Days</h3>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Therapist</th>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                      <th key={day} style={tableHeaderStyle}>{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {therapists.map((therapist) => (
                    <tr key={therapist}>
                      <td style={{ ...tableCellStyle, textAlign: 'left', fontWeight: '500' }}>{therapist}</td>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                        <td key={day} style={tableCellStyle}>
                          <input
                            type="checkbox"
                            style={{ cursor: 'pointer' }}
                            checked={workingFromHome[therapist]?.[day] || false}
                            onChange={() =>
                              setWorkingFromHome((prev) => ({
                                ...prev,
                                [therapist]: {
                                  ...prev[therapist],
                                  [day]: !prev[therapist]?.[day],
                                },
                              }))
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#2D3748', fontSize: '1.1rem' }}>Therapist Assignment Tracker</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
              }}>
                {Object.entries(assignmentCounts).map(([therapist, count]) => (
                  <div
                    key={therapist}
                    style={{
                      padding: '12px',
                      backgroundColor: '#E6FFFA',
                      color: '#234E52',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <strong style={{ display: 'block', marginBottom: '4px' }}>{therapist}</strong>
                    <span>Assigned: {count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Calendar Area (Main Content) */}
          <div style={{
            flex: '1',
            backgroundColor: '#FFFFFF',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: '0 6px 18px rgba(0,0,0,0.07)',
          }}>
            <div id="calendar-container-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{ color: '#1A202C', margin: 0, fontSize: '1.5rem' }}>
                  {calendarData[currentYear][currentMonth][0].date.toLocaleString("default", { month: "long" })} {currentYear}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Year Selection Dropdown */}
                  <select
                    value={currentYear}
                    onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                    style={{
                      padding: '10px 14px',
                      border: '1px solid #CBD5E0',
                      borderRadius: '6px',
                      backgroundColor: '#FFFFFF',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                  </select>

                  <button
                    type="button"
                    style={{ ...buttonStyle, marginRight: '10px' }}
                    onClick={() => changeMonth('prev')}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F4F8'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    style={buttonStyle}
                    onClick={() => changeMonth('next')}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F4F8'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                  >
                    Next →
                  </button>
                </div>
              </div>

              <Calendar
                monthDays={calendarData[currentYear][currentMonth]}
                moveTherapist={moveTherapist}
                removeTherapist={removeTherapist}
                todayDate={todayDate}
                // Pass the dynamically selected blocked days to the Calendar component
                blockedDaysForYear={currentBlockedDays}
              />
            </div>

            <div style={{ marginTop: '30px', display: 'flex', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
              <button type="button" style={buttonStyle} onClick={goToToday} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F4F8'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}>Today</button>
              <button
                type="button"
                style={{ ...buttonStyle, backgroundColor: '#38A169', color: 'white', border: '1px solid #38A169' }}
                onClick={autoRoster}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2F855A'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#38A169'; }}
              >
                Auto Roster
              </button>
              <button type="button" style={buttonStyle} onClick={resetCalendar} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F4F8'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}>Reset Calendar</button>
              <button type="button" style={buttonStyle} onClick={saveAsPNG} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F4F8'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}>Save as PNG</button>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default App;


















































