import React, { useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import html2canvas from 'html2canvas';
import LZString from 'lz-string'; // Import lz-string

// Define therapist names
const therapists = [
  "Dominic Yeo", "Kirsty Png", "Soon Jiaying",
  "Andrew Lim", "Janice Leong", "Oliver Tan",
  "Claudia Ahl", "Seanna Neo", "Xiao Hui", "Tika Zainal"
];

// Blocked Days for Each Year
const blockedDays2025 = [
  "2025-01-01", "2025-01-29", "2025-01-30",
  "2025-03-31", "2025-04-18", "2025-05-01",
  "2025-05-12", "2025-06-07", "2025-08-09",
  "2025-03-28", "2025-10-25", "2025-10-20",
  "2025-10-21", "2025-12-25"
];

const blockedDays2026 = [
  "2026-01-01",    // New Year’s Day (Thursday)
  "2026-02-17",    // Chinese New Year (Tuesday)
  "2026-02-18",    // Chinese New Year (Wednesday)
  "2026-03-21",    // Hari Raya Puasa (Saturday)
  "2026-04-03",    // Good Friday (Friday)
  "2026-05-01",    // Labour Day (Friday)
  "2026-05-27",    // Hari Raya Haji (Wednesday)
  "2026-05-31",    // Vesak Day (Sunday)
  "2026-06-01",    // Vesak Day (Observed - Monday, since May 31 is a Sunday)
  "2026-08-09",    // National Day (Sunday)
  "2026-08-10",    // National Day (Observed - Monday, since Aug 9 is a Sunday)
  "2026-11-08",    // Deepavali (Sunday)
  "2026-11-09",    // Deepavali (Observed - Monday, since Nov 8 is a Sunday)
  "2026-12-25"     // Christmas Day (Friday)
];

// Helper function to get the number of days in a month for a given year
const getDaysInMonth = (year, monthIndex) => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

// Helper function to get the dates for a given year with unique keys
const getCalendarForYear = (year) => {
  const calendar = [];
  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const daysInMonth = getDaysInMonth(year, monthIndex);
    const monthDays = Array.from({ length: daysInMonth }, (_, dayIndex) => {
      const date = new Date(year, monthIndex, dayIndex + 1);
      const formattedMonth = String(monthIndex + 1).padStart(2, '0');
      const formattedDay = String(dayIndex + 1).padStart(2, '0');
      const dayKey = `${year}-${formattedMonth}-${formattedDay}`;
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

// Therapist Component
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

// Calendar Day (Drop Zone) Component
const CalendarDay = ({ day, moveTherapist, removeTherapist, isToday, isBlocked }) => {
  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
  const finalBlockedStatus = isBlocked || isWeekend;

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'THERAPIST',
    drop: (item) => {
      if (!finalBlockedStatus) {
        moveTherapist(item.name, day.dayKey);
      }
    },
    canDrop: () => !finalBlockedStatus,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  const dayNumber = day.date.getDate();

  let backgroundColor = '#FFFFFF';
  let dayNumberColor = '#4A5568';

  if (finalBlockedStatus) {
    backgroundColor = '#F7FAFC';
    dayNumberColor = '#A0AEC0';
  }
  if (isToday) {
    backgroundColor = '#E6FFFA';
    dayNumberColor = '#2C7A7B';
  }

  if (isOver && canDrop) {
    backgroundColor = '#B2F5EA';
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

// Calendar Grid Component
const Calendar = ({ monthDays, moveTherapist, removeTherapist, todayDate, blockedDaysForYear }) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstDayOfMonth = monthDays.length > 0 ? monthDays[0].date.getDay() : 0;

  return (
    <>
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
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} style={{
            backgroundColor: '#F7FAFC',
            borderRadius: '6px',
            minHeight: '160px',
          }} />
        ))}
        {monthDays.map((day) => {
          const isToday = todayDate && day.date.toDateString() === todayDate.toDateString();
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

// Main App Component
const App = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const [calendarData, setCalendarData] = useState(() => ({
    2025: getCalendarForYear(2025),
    2026: getCalendarForYear(2026),
  }));

  const [todayDate, setTodayDate] = useState(null);
  const [autoRosterTriggered, setAutoRosterTriggered] = useState(false);

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

  const currentBlockedDays = currentYear === 2025 ? blockedDays2025 : blockedDays2026;

  const assignmentCounts = therapists.reduce((acc, therapist) => {
    acc[therapist] = calendarData[currentYear]?.[currentMonth]?.filter((day) =>
      day.therapists.includes(therapist)
    ).length || 0;
    return acc;
  }, {});

  const actualCurrentDate = new Date();
  const actualCurrentDay = actualCurrentDate.getDate();
  const actualCurrentMonthIndex = actualCurrentDate.getMonth();
  const actualCurrentYear = actualCurrentDate.getFullYear();

  // Helper functions for shareable link using lz-string
  const compressData = (data) => {
    // We only need to store dayKey and therapists. Date objects are recreated.
    const serializedCalendar = {};
    for (const year in data.calendarData) {
      serializedCalendar[year] = data.calendarData[year].map(month =>
        month.map(day => ({
          dayKey: day.dayKey,
          therapists: day.therapists
        }))
      );
    }
    // Convert the entire payload to a JSON string first
    const payload = JSON.stringify({
      timestamp: Date.now(), // Added timestamp for uniqueness per generated link
      calendar: serializedCalendar,
      wfh: data.workingFromHome
    });
    // Then compress and encode for URL
    return LZString.compressToEncodedURIComponent(payload);
  };

  const decompressData = (compressedString) => {
    try {
      // Decompress and decode from URL safe string
      const decompressedPayload = LZString.decompressFromEncodedURIComponent(compressedString);
      if (!decompressedPayload) {
          console.error("Decompression resulted in null. Data might be corrupted or empty.");
          return null;
      }
      const parsed = JSON.parse(decompressedPayload);

      const deserializedCalendar = {};
      for (const year in parsed.calendar) {
        deserializedCalendar[year] = parsed.calendar[year].map(month =>
          month.map(day => {
            // Recreate the Date object from dayKey
            const [yearStr, monthStr, dayStr] = day.dayKey.split('-');
            const dateObj = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
            return {
              date: dateObj,
              dayKey: day.dayKey,
              therapists: day.therapists || []
            };
          })
        );
      }
      return {
        calendarData: deserializedCalendar,
        workingFromHome: parsed.wfh || {},
        timestamp: parsed.timestamp // The timestamp will be here if needed for display/logging
      };
    } catch (e) {
      console.error("Failed to decompress data:", e);
      return null;
    }
  };

  // Effect hook to manage 'today' highlight and month display when the year changes
  useEffect(() => {
    setTodayDate(null);
    if (currentYear === actualCurrentYear) {
      setCurrentMonth(actualCurrentMonthIndex);
      setTodayDate(new Date(actualCurrentYear, actualCurrentMonthIndex, actualCurrentDay));
    } else {
      setCurrentMonth(0);
    }
  }, [currentYear, actualCurrentYear, actualCurrentMonthIndex, actualCurrentDay]);

  // Effect hook to parse URL for shared data on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('data');

    if (sharedData) {
      const decompressed = decompressData(sharedData);

      if (decompressed) {
        setCalendarData(decompressed.calendarData);
        setWorkingFromHome(decompressed.workingFromHome);
        console.log(`Calendar and WFH data loaded from shared link (Timestamp: ${decompressed.timestamp || 'N/A'})!`);
        // Remove the 'data' parameter from the URL after loading
        // This makes the URL clean, but also means that a page refresh
        // will revert to the default state unless you add state persistence
        // to localStorage or similar.
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []); // Run only once on component mount

  const goToToday = () => {
    if (currentYear === actualCurrentYear) {
      setCurrentMonth(actualCurrentMonthIndex);
      setTodayDate(new Date(actualCurrentYear, actualCurrentMonthIndex, actualCurrentDay));
    } else {
      alert("Cannot go to 'Today' in a different year. Please switch to the current year first.");
    }
  };

  const moveTherapist = (name, dayKey) => {
    setCalendarData((prevCalendarData) => {
      const updatedCalendarData = { ...prevCalendarData };
      const yearCalendar = [...updatedCalendarData[currentYear]];
      const updatedMonth = yearCalendar[currentMonth].map((day) => {
        if (day.dayKey === dayKey && !currentBlockedDays.includes(dayKey) && !day.therapists.includes(name)) {
          const dateParts = day.dayKey.split('-');
          const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
          const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

          if (!isWeekend) {
            return { ...day, therapists: [...day.therapists, name] };
          }
        }
        return day;
      });

      yearCalendar[currentMonth] = updatedMonth;
      updatedCalendarData[currentYear] = yearCalendar;
      return updatedCalendarData;
    });
  };

  const removeTherapist = (name, dayKey) => {
    setCalendarData((prevCalendarData) => {
      const updatedCalendarData = { ...prevCalendarData };
      const yearCalendar = [...updatedCalendarData[currentYear]];
      const updatedMonth = yearCalendar[currentMonth].map((day) => {
        if (day.dayKey === dayKey) {
          return { ...day, therapists: day.therapists.filter((t) => t !== name) };
        }
        return day;
      });

      yearCalendar[currentMonth] = updatedMonth;
      updatedCalendarData[currentYear] = yearCalendar;
      return updatedCalendarData;
    });
  };

  const resetCalendar = () => {
    setCalendarData((prevCalendarData) => ({
      ...prevCalendarData,
      2025: getCalendarForYear(2025),
      2026: getCalendarForYear(2026),
    }));
    setWorkingFromHome({ // Reset WFH to initial state
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
      });
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
      const currentMonthName = calendarData[currentYear]?.[currentMonth]?.[0]?.date.toLocaleString("default", { month: "long" });
      link.href = imgData;
      link.download = `Therapist_Roster_${currentMonthName}_${currentYear}.png`;
      link.click();
    }).catch((error) => {
      console.error("Error generating PNG:", error);
    });
  };

  // Function to generate sharable link
  const generateShareLink = () => {
    const dataToShare = {
      calendarData: calendarData,
      workingFromHome: workingFromHome
    };
    const compressedEncodedData = compressData(dataToShare); // This uses lz-string
    const shareableUrl = `${window.location.origin}${window.location.pathname}?data=${compressedEncodedData}`;

    navigator.clipboard.writeText(shareableUrl)
      .then(() => {
        alert("Shareable link copied to clipboard! Share it to load this calendar state.");
      })
      .catch((err) => {
        console.error("Failed to copy link: ", err);
        alert("Failed to copy link to clipboard. You can try copying it manually from the browser's address bar after it updates.");
      });
  };

  const autoRoster = () => {
    setCalendarData((prevCalendarData) => {
      const updatedCalendarData = { ...prevCalendarData };
      const currentYearCalendar = [...updatedCalendarData[currentYear]];
      const currentMonthData = [...currentYearCalendar[currentMonth]];

      const monthlyAssignmentCounts = therapists.reduce((acc, t) => ({ ...acc, [t]: 0 }), {});

      let totalPossibleSlots = 0;
      currentMonthData.forEach(day => {
        const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
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
          !currentBlockedDays.includes(newDay.dayKey) &&
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
              therapistConsiderationOrder = [
                ...therapistConsiderationOrder.filter(t => t !== therapistToAssign),
                therapistToAssign
              ];
              assignedThisDay = true;
            }
          }
        }
        return newDay;
      });

      currentYearCalendar[currentMonth] = newMonthDays;
      updatedCalendarData[currentYear] = currentYearCalendar;
      return updatedCalendarData;
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
      setTodayDate(null);
      return newMonth;
    });
  };

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
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
        padding: '20px',
        backgroundColor: '#F9FAFB',
        minHeight: '100vh',
      }}>
        <div style={{
          display: 'flex',
          gap: '30px',
          maxWidth: '1800px',
          margin: '0 auto',
        }}>

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
                  {calendarData[currentYear]?.[currentMonth]?.[0]?.date.toLocaleString("default", { month: "long" })} {currentYear}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              <button
                type="button"
                style={{ ...buttonStyle, backgroundColor: '#3182CE', color: 'white', border: '1px solid #3182CE' }}
                onClick={generateShareLink}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2B6CB0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#3182CE'; }}
              >
                Share Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default App;

















































